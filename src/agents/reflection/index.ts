import {
  Annotation,
  END,
  LangGraphRunnableConfig,
  START,
  StateGraph,
} from "@langchain/langgraph";
import {
  getReflectionsPrompt,
  putReflectionsPrompt,
} from "../../utils/reflections.js";
import { getModel } from "../shared/nodes/llm.js";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { BaseMessage } from "@langchain/core/messages";

const ReflectionAnnotation = Annotation.Root({
  /**
   * The original post before edits were made.
   */
  originalPost: Annotation<string>,
  /**
   * The post after edits have been made.
   */
  newPost: Annotation<string>,
  /**
   * The user's response to the interrupt event
   * which triggered the reflection.
   */
  userResponse: Annotation<string>,
});

const UPDATE_INSTRUCTIONS = `Analyze the following to determine if rules prompt updates are needed:
1. Current rules prompt (current_prompt)
2. Generated social media post (session)
3. User feedback on the post (feedback)

If the user's feedback explicitly requests changes:
1. Create or update rules that directly address the feedback
2. Keep each rule clear, specific, and concise
3. If a new rule conflicts with an existing one, use the new rule
4. Only add rules that are explicitly mentioned in the user's feedback

Guidelines for updates:
- Do not infer or assume rules beyond what's explicitly stated
- Do not add rules based on implicit feedback
- Do not overgeneralize the feedback
- Combine existing rules if it improves clarity without losing specificity

Output only the updated rules prompt, with no additional context or instructions.`;

const WHEN_TO_UPDATE_INSTRUCTIONS = `You should update the prompt if the user's feedback is explicit, and can be generalized to apply to all future social media posts.
You should not update the prompt if the user's feedback does not explicitly request changes, or if the changes are not clear and specific enough to be applied consistently.`;

async function reflection(
  state: typeof ReflectionAnnotation.State,
  config: LangGraphRunnableConfig,
): Promise<Partial<typeof ReflectionAnnotation.State>> {
  if (!config.store) {
    throw new Error("No store provided");
  }

  const existingRules = await getReflectionsPrompt(config);

  const model = getModel({
    modelName: "gpt-4o",
    temperature: 0,
  });

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", UPDATE_INSTRUCTIONS],
    [
      "user",
      `Current rules:
<current_prompt>
{current_prompt}
</current_prompt>

Session:
<session>
{session}
</session>

Feedback:
<feedback>
{feedback}
</feedback>`,
    ],
  ]);

  const chain = prompt.pipe(model);

  const response = (await chain.invoke({
    current_prompt: existingRules,
    session: state.originalPost,
    feedback: state.userResponse,
  })) as BaseMessage;

  const updated = response.content as string;

  await putReflectionsPrompt(config, updated);

  return {};
}

const reflectionWorkflow = new StateGraph(ReflectionAnnotation)
  .addNode("reflection", reflection)
  .addEdge(START, "reflection")
  .addEdge("reflection", END);

export const reflectionGraph = reflectionWorkflow.compile();
reflectionGraph.name = "Reflection Graph";
