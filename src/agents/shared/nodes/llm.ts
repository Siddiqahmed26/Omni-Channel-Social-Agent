import { ChatOpenAI } from "@langchain/openai";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

/**
 * Centrally manages LLM instantiation based on environment variables.
 * Hardcoded to OpenAI for the demo to avoid Gemini rate limits.
 */
export function getModel(options: { temperature?: number; modelName?: string } = {}): BaseChatModel {
    const { temperature = 0.5, modelName } = options;
    return new ChatOpenAI({
        model: modelName || "gpt-4o",
        temperature,
    });
}
