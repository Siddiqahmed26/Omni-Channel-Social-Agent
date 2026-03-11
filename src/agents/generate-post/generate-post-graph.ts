import {
  END,
  LangGraphRunnableConfig,
  START,
  StateGraph,
} from "@langchain/langgraph";
import {
  GeneratePostAnnotation,
  GeneratePostConfigurableAnnotation,
  GeneratePostState,
  GeneratePostUpdate,
} from "./generate-post-state.js";
import { generateContentReport } from "./nodes/generate-report/index.js";
import { generatePost } from "./nodes/generate-post/index.js";
import { condensePost } from "./nodes/condense-post.js";
import {
  isTextOnly,
  removeUrls,
  shouldPostToLinkedInOrg,
  skipUsedUrlsCheck,
} from "../utils.js";
import { verifyLinksGraph } from "../verify-links/verify-links-graph.js";
import { authSocialsPassthrough } from "./nodes/auth-socials.js";
import { findAndGenerateImagesGraph } from "../find-and-generate-images/find-and-generate-images-graph.js";
import { updateScheduledDate } from "../shared/nodes/update-scheduled-date.js";
import { getSavedUrls } from "../shared/stores/post-subject-urls.js";
import { humanNode } from "../shared/nodes/generate-post/human-node.js";
import { schedulePost } from "../shared/nodes/generate-post/schedule-post.js";
import { rewritePost } from "../shared/nodes/generate-post/rewrite-post.js";
import { reflectionNode } from "../shared/nodes/reflection-node.js";
import { getLangGraphClient } from "../shared/nodes/langgraph-client.js";
import { POST_TO_LINKEDIN_ORGANIZATION } from "./constants.js";
import { rewritePostWithSplitUrl } from "./nodes/rewrite-with-split-url.js";

function routeAfterGeneratingReport(
  state: GeneratePostState,
): "generatePost" | typeof END {
  if (state.report) {
    return "generatePost";
  }
  return END;
}

function routeAfterAuthSocials(
  state: GeneratePostState,
): "verifyLinksSubGraph" | "authSocialsPassthrough" {
  if (state.action === "disconnect") {
    return "authSocialsPassthrough";
  }
  return "verifyLinksSubGraph";
}

function rewriteOrEndConditionalEdge(
  state: GeneratePostState,
):
  | "rewritePost"
  | "reflection"
  | "schedulePost"
  | "updateScheduleDate"
  | "humanNode"
  | "rewriteWithSplitUrl"
  | "authSocialsPassthrough"
  | typeof END {
  if (state.action === "disconnect") {
    return "authSocialsPassthrough";
  }
  if (state.next) {
    if (state.next === "unknownResponse") {
      // Unknown response - run reflection to save the style feedback, then re-interrupt.
      return "reflection";
    }
    if (state.next === "schedulePost") {
      // If there was actual user text feedback (e.g. they typed something before accepting),
      // run reflection to save it. Otherwise go straight to schedulePost.
      if (state.userResponse && state.userResponse.trim()) {
        return "reflection";
      }
      return "schedulePost";
    }
    return state.next;
  }
  return END;
}

function reflectionRouting(state: GeneratePostState): "schedulePost" | "humanNode" {
  if (state.next === "schedulePost") {
    return "schedulePost";
  }
  return "humanNode";
}

async function condenseOrHumanConditionalEdge(
  state: GeneratePostState,
  config: LangGraphRunnableConfig,
): Promise<
  "condensePost" | "humanNode" | "findAndGenerateImagesSubGraph" | typeof END
> {
  const cleanedPost = removeUrls(state.post || "");
  if (cleanedPost.length > 280 && state.condenseCount <= 3) {
    return "condensePost";
  }

  const isTextOnlyMode = isTextOnly(config);
  if (isTextOnlyMode) {
    return routeToCuratedInterruptOrContinue(state, config);
  }
  return "findAndGenerateImagesSubGraph";
}

/**
 * Checks if any of the URLs in the array are already stored in the post subject URLs store.
 * If so, it returns `true` and the post should NOT be generated.
 * @param urls The array of URLs to check. These are all of the input & extracted relevant URLs.
 * @param config The LangGraph config to get the store from.
 * @returns {Promise<boolean>} `true` if any of the URLs in the array are already stored in the post subject URLs store. `false` otherwise.
 */
async function checkIfUrlsArePreviouslyUsed(
  urls: string[],
  config: LangGraphRunnableConfig,
) {
  if (await skipUsedUrlsCheck(config.configurable)) {
    return false;
  }
  const existingUrls = await getSavedUrls(config);
  return urls.some((url) =>
    existingUrls.some((existingUrl) => url === existingUrl),
  );
}

async function generateReportOrEndConditionalEdge(
  state: GeneratePostState,
  config: LangGraphRunnableConfig,
): Promise<"generateContentReport" | typeof END> {
  const urlsAlreadyUsed = await checkIfUrlsArePreviouslyUsed(
    [...(state.relevantLinks ?? []), ...state.links],
    config,
  );

  // End early if the URLs have already been used, or if there are no
  // page contents extracted from any of the URLs.
  if (urlsAlreadyUsed || !state.pageContents?.length) {
    console.log(
      "Skipping post generation. URLs have already been used or there are no page contents.",
      {
        urlsAlreadyUsed,
        pageContentsLength: state.pageContents?.length,
      },
    );
    return END;
  }

  return "generateContentReport";
}

/**
 * If the 'origin' is set to 'curate-data' we need to route to a new graph 'curated_data_interrupt'
 * for the interrupt, so that users can separate curated posts from posts ingested from Slack in the
 * Agent Inbox.
 */
async function routeToCuratedInterruptOrContinue(
  state: GeneratePostState,
  config: LangGraphRunnableConfig,
): Promise<"humanNode" | typeof END> {
  if (config.configurable?.origin === "curate-data") {
    const postToLinkedInOrg = shouldPostToLinkedInOrg(config);
    const client = getLangGraphClient();

    const { thread_id } = await client.threads.create();
    await client.runs.create(thread_id, "curated_post_interrupt", {
      input: state,
      config: {
        configurable: {
          [POST_TO_LINKEDIN_ORGANIZATION]: postToLinkedInOrg,
        },
      },
    });

    return END;
  }

  return "humanNode";
}

const generatePostBuilder = new StateGraph(
  GeneratePostAnnotation,
  GeneratePostConfigurableAnnotation,
)
  .addNode("authSocialsPassthrough", authSocialsPassthrough)

  .addNode("verifyLinksSubGraph", verifyLinksGraph)

  // Generates a Tweet/LinkedIn post based on the report content.
  .addNode("generatePost", generatePost)
  // Attempt to condense the post if it's too long.
  .addNode("condensePost", condensePost)
  // Interrupts the node for human in the loop.
  .addNode("humanNode", humanNode<GeneratePostState, GeneratePostUpdate>)
  // Schedules the post for Twitter/LinkedIn.
  .addNode("schedulePost", schedulePost<GeneratePostState, GeneratePostUpdate>)
  // Rewrite a post based on the user's response.
  .addNode("rewritePost", rewritePost<GeneratePostState, GeneratePostUpdate>)
  // Generates a report on the content.
  .addNode("generateContentReport", generateContentReport)
  // Finds images in the content.
  .addNode("findAndGenerateImagesSubGraph", findAndGenerateImagesGraph)
  // Updated the scheduled date from the natural language response from the user.
  .addNode("updateScheduleDate", updateScheduledDate)
  // Rewrite the post splitting the URL from the main body of the tweet
  .addNode("rewriteWithSplitUrl", rewritePostWithSplitUrl)

  // Start node
  .addEdge(START, "authSocialsPassthrough")
  .addConditionalEdges("authSocialsPassthrough", routeAfterAuthSocials, [
    "verifyLinksSubGraph",
    "authSocialsPassthrough"
  ])

  // After verifying the different content types, we should generate a report on them.
  .addConditionalEdges(
    "verifyLinksSubGraph",
    generateReportOrEndConditionalEdge,
    ["generateContentReport", END],
  )

  // Once generating a report, we should confirm the report exists (meaning the content is relevant).
  .addConditionalEdges("generateContentReport", routeAfterGeneratingReport, [
    "generatePost",
    END,
  ])

  // After generating the post for the first time, check if it's too long,
  // and if so, condense it. Otherwise, route to the human node.
  .addConditionalEdges("generatePost", condenseOrHumanConditionalEdge, [
    "condensePost",
    "findAndGenerateImagesSubGraph",
    "humanNode",
    END,
  ])
  // After condensing the post, we should verify again that the content is below the character limit.
  // Once the post is below the character limit, we can find & filter images. This needs to happen after the post
  // has been generated because the image validator requires the post content.
  .addConditionalEdges("condensePost", condenseOrHumanConditionalEdge, [
    "condensePost",
    "findAndGenerateImagesSubGraph",
    "humanNode",
    END,
  ])

  // After finding images, we are done and can interrupt for the human to respond.
  .addConditionalEdges(
    "findAndGenerateImagesSubGraph",
    routeToCuratedInterruptOrContinue,
    ["humanNode", END],
  )

  // Reflection node to save user feedback to long-term memory
  .addNode("reflection", reflectionNode)

  // Always route to reflection after rewriting the post so the model learns the new style.
  .addEdge("rewritePost", "reflection")
  .addEdge("rewriteWithSplitUrl", "reflection")

  // Date changes don't need reflection
  .addEdge("updateScheduleDate", "humanNode")

  // The humanNode routes to either rewrites, schedule, reflection, or end.
  .addConditionalEdges("humanNode", rewriteOrEndConditionalEdge, [
    "rewritePost",
    "reflection",
    "schedulePost",
    "updateScheduleDate",
    "humanNode",
    "rewriteWithSplitUrl",
    "authSocialsPassthrough",
    END,
  ])

  // Reflection routes back to humanNode (if feedback was just given) or finishes scheduling.
  .addConditionalEdges("reflection", reflectionRouting, [
    "schedulePost",
    "humanNode",
  ])

  // Always end after scheduling the post.
  .addEdge("schedulePost", END);

export const generatePostGraph = generatePostBuilder.compile();

generatePostGraph.name = "Generate Post Subgraph";
