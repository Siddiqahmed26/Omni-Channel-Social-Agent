import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatAnthropic } from "@langchain/anthropic";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

/**
 * Centrally manages LLM instantiation based on environment variables.
 * Supports Google Gemini, Anthropic, and OpenAI.
 */
export function getModel(options: { temperature?: number; modelName?: string; preferMini?: boolean } = {}): BaseChatModel {
    const { temperature = 0.5, modelName, preferMini } = options;
    const provider = process.env.MODEL_PROVIDER || "openai";

    if (provider === "google") {
        let model = modelName || (preferMini ? "gemini-2.0-flash" : "gemini-2.0-flash");
        // Map o1 to high-reasoning Gemini if requested
        if (modelName === "o1") {
            model = "gemini-2.0-flash-thinking-exp";
        }
        return new ChatGoogleGenerativeAI({
            model,
            temperature,
        });
    }

    if (provider === "anthropic") {
        let model = modelName || (preferMini ? "claude-3-haiku-20240307" : "claude-3-5-sonnet-latest");
        // Map o1 to high-reasoning Claude
        if (modelName === "o1") {
            model = "claude-3-5-sonnet-latest";
        }
        return new ChatAnthropic({
            model,
            temperature,
        });
    }

    // Default to OpenAI
    return new ChatOpenAI({
        model: modelName || (preferMini ? "gpt-4o-mini" : "gpt-4o"),
        temperature,
    });
}
