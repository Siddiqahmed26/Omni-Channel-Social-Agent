import { END, START, StateGraph } from "@langchain/langgraph";
import {
  RepurposerPostInterruptAnnotation,
  RepurposerPostInterruptConfigurableAnnotation,
  RepurposerPostInterruptState,
} from "./types.js";
import { updateScheduledDate } from "../shared/nodes/update-scheduled-date.js";
import { schedulePost } from "../shared/nodes/generate-post/schedule-post.js";
import { rewritePost } from "./nodes/rewrite-posts.js";
import { humanNode } from "./nodes/human-node/index.js";
import { reflectionNode } from "../shared/nodes/reflection-node.js";

function routingEdge(
  state: RepurposerPostInterruptState,
): "rewritePost" | "reflection" | "updateScheduleDate" | "humanNode" | typeof END {
  if (!state.next) {
    return END;
  }

  if (state.next === "unknownResponse") {
    return "humanNode";
  }

  if (state.next === "schedulePost") {
    return "reflection";
  }

  return state.next;
}

function reflectionRouting(
  state: RepurposerPostInterruptState,
): "schedulePost" | "humanNode" {
  if (state.next === "schedulePost") {
    return "schedulePost";
  }
  return "humanNode";
}

const workflow = new StateGraph(
  RepurposerPostInterruptAnnotation,
  RepurposerPostInterruptConfigurableAnnotation,
)
  .addNode("humanNode", humanNode)
  .addNode("schedulePost", schedulePost)
  .addNode("rewritePost", rewritePost)
  .addNode("updateScheduleDate", updateScheduledDate)
  .addNode("reflection", reflectionNode)
  .addEdge(START, "humanNode")
  .addConditionalEdges("humanNode", routingEdge, [
    "rewritePost",
    "reflection",
    "updateScheduleDate",
    "humanNode",
    END,
  ])
  .addEdge("rewritePost", "reflection")
  .addConditionalEdges("reflection", reflectionRouting, [
    "schedulePost",
    "humanNode",
  ])
  .addEdge("updateScheduleDate", "humanNode")
  .addEdge("schedulePost", END);

export const repurposerPostInterruptGraph = workflow.compile();
repurposerPostInterruptGraph.name = "Repurposer Post Interrupt Graph";
