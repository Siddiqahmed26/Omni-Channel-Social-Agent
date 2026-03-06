import "dotenv/config";
import { Client } from "@langchain/langgraph-sdk";
import {
  SKIP_CONTENT_RELEVANCY_CHECK,
  SKIP_USED_URLS_CHECK,
  TEXT_ONLY_MODE,
} from "../src/agents/generate-post/constants.js";

/**
 * Generate a post based on a LangChain blog post.
 * This may be modified to generate posts for other content.
 */
async function invokeGraph() {
  const link = "https://github.com/rguthaa/genai-usecases/tree/main";

  const client = new Client({
    apiUrl: process.env.LANGGRAPH_API_URL || "http://localhost:54367",
  });

  const { thread_id } = await client.threads.create();
  console.log(`Created thread ${thread_id}. Generating post...`);

  await client.runs.create(thread_id, "generate_post", {
    input: {
      links: [link],
    },
    config: {
      configurable: {
        [TEXT_ONLY_MODE]: false,
        [SKIP_CONTENT_RELEVANCY_CHECK]: true,
        [SKIP_USED_URLS_CHECK]: true,
      },
    },
  });

  // Poll until it asks for an interrupt (HITL) or completes
  let isDone = false;
  while (!isDone) {
    const state = await client.threads.getState(thread_id);
    const nextNodes = state.next;

    if (nextNodes.length === 0) {
      isDone = true;
      console.log("\n--- Generation Complete ---");
      console.log(JSON.stringify(state.values, null, 2));
    } else if (nextNodes.includes("__interrupt__") || nextNodes.includes("human_node")) {
      isDone = true;
      console.log("\n--- Agent is waiting for Human in the Loop approval! ---");
      console.log(JSON.stringify(state.values, null, 2));
    } else {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

invokeGraph().catch(console.error);
