import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { BaseGeneratePostState, BaseGeneratePostUpdate } from "./types.js";
import { getModel } from "../llm.js";
import {
  getReflectionsPrompt,
  REFLECTIONS_PROMPT,
} from "../../../../utils/reflections.js";

const REWRITE_POST_PROMPT = `You're a highly regarded marketing employee, working on crafting thoughtful and engaging content for the LinkedIn and Twitter pages.
You wrote a post for the LinkedIn and Twitter pages, however your boss has asked for some changes to be made before it can be published.

The original post you wrote is as follows:
<original-post>
{originalPost}
</original-post>

{reflectionsPrompt}

Listen to your boss closely, and make the necessary changes to the post. You should respond ONLY with the updated post, with no additional information, or text before or after the post.`;

/**
 * Cleans LLM post output:
 * 1. Strips <thinking>...</thinking> chain-of-thought blocks
 * 2. Extracts content from <post>...</post> tags if present
 */
export function cleanPostOutput(raw: string): string {
  let cleaned = raw.replace(/<thinking>[\s\S]*?<\/thinking>/gi, "").trim();
  const postMatch = cleaned.match(/<post>([\s\S]*?)<\/post>/i);
  if (postMatch) {
    cleaned = postMatch[1].trim();
  }
  return cleaned;
}

export async function rewritePost<
  State extends BaseGeneratePostState = BaseGeneratePostState,
  Update extends BaseGeneratePostUpdate = BaseGeneratePostUpdate,
>(state: State, config: LangGraphRunnableConfig): Promise<Update> {
  if (!state.post) {
    throw new Error("No post found");
  }
  if (!state.userResponse) {
    throw new Error("No user response found");
  }

  const rewritePostModel = getModel({
    temperature: 0.5,
  });

  const reflections = await getReflectionsPrompt(config);
  const reflectionsPrompt = REFLECTIONS_PROMPT.replace(
    "{reflections}",
    reflections,
  );

  const systemPrompt = REWRITE_POST_PROMPT.replace(
    "{originalPost}",
    state.post,
  ).replace("{reflectionsPrompt}", reflectionsPrompt);

  const revisePostResponse = await rewritePostModel.invoke([
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content: state.userResponse,
    },
  ]);

  return {
    post: cleanPostOutput(revisePostResponse.content as string),
    next: undefined,
  } as Update;
}
