import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { getReflectionsPrompt, putReflectionsPrompt } from "../../../utils/reflections.js";
import { getModel } from "./llm.js";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { BaseMessage } from "@langchain/core/messages";

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

export async function reflectionNode(
    state: { post: string; userResponse?: string;[key: string]: any },
    config: LangGraphRunnableConfig,
) {
    if (!state.userResponse || !state.userResponse.trim()) {
        return {};
    }

    if (!config.store) {
        console.warn("No store provided for reflection");
        return {};
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

Post Content:
<session>
{session}
</session>

User Feedback:
<feedback>
{feedback}
</feedback>`,
        ],
    ]);

    const chain = prompt.pipe(model);

    try {
        const response = (await chain.invoke({
            current_prompt: existingRules,
            session: state.post,
            feedback: state.userResponse,
        })) as BaseMessage;

        const updated = response.content as string;
        await putReflectionsPrompt(config, updated);
    } catch (e) {
        console.error("Reflection failed", e);
    }

    return {};
}
