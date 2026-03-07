import { END, START, StateGraph } from "@langchain/langgraph";
import {
  CuratedPostInterruptAnnotation,
  CuratedPostInterruptConfigurableAnnotation,
  CuratedPostInterruptState,
  CuratedPostInterruptUpdate,
} from "./types.js";
import { updateScheduledDate } from "../shared/nodes/update-scheduled-date.js";
import { humanNode } from "../shared/nodes/generate-post/human-node.js";
import { schedulePost } from "../shared/nodes/generate-post/schedule-post.js";
import { rewritePost } from "../shared/nodes/generate-post/rewrite-post.js";

import { reflectionNode } from "../shared/nodes/reflection-node.js";

function routingEdge(
  state: CuratedPostInterruptState,
):
  | "rewritePost"
  | "reflection"
  | "humanNode"
  | "updateScheduleDate"
  | typeof END {
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
  state: CuratedPostInterruptState,
): "schedulePost" | "humanNode" {
  if (state.next === "schedulePost") {
    return "schedulePost";
  }
  return "humanNode";
}

const workflow = new StateGraph(
  CuratedPostInterruptAnnotation,
  CuratedPostInterruptConfigurableAnnotation,
)
  // Interrupts the node for human in the loop.
  .addNode(
    "humanNode",
    humanNode<CuratedPostInterruptState, CuratedPostInterruptUpdate>,
  )
  // Schedules the post for Twitter/LinkedIn.
  .addNode(
    "schedulePost",
    schedulePost<CuratedPostInterruptState, CuratedPostInterruptUpdate>,
  )
  // Rewrite a post based on the user's response.
  .addNode(
    "rewritePost",
    rewritePost<CuratedPostInterruptState, CuratedPostInterruptUpdate>,
  )
  // Updated the scheduled date from the natural language response from the user.
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

export const curatedPostInterruptGraph = workflow.compile();
curatedPostInterruptGraph.name = "Curated Post Interrupt Graph";
