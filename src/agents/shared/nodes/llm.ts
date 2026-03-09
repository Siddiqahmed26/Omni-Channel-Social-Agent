import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatAnthropic } from "@langchain/anthropic";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

/**
 * Centrally manages LLM instantiation based on environment variables.
 * Supports Google Gemini, Anthropic, and OpenAI.
 *
 * Default: gpt-4o-mini (rock-solid, low-cost, high-quality)
 * Google fallback: gemini-2.5-flash on v1beta
 */
export function getModel(options: { temperature?: number; modelName?: string; preferMini?: boolean } = {}): BaseChatModel {
    const { temperature = 0.5 } = options;
    const provider = process.env.MODEL_PROVIDER || "openai";

    if (provider === "google") {
        return new ChatGoogleGenerativeAI({
            model: "gemini-2.5-flash",
            temperature,
            apiVersion: "v1beta",
            maxRetries: 3,
        });
    }

    if (provider === "anthropic") {
        return new ChatAnthropic({
            model: "claude-3-5-sonnet-latest",
            temperature,
        });
    }

    // Default to OpenAI — gpt-4o-mini: fastest, cheapest, most reliable
    return new ChatOpenAI({
        model: "gpt-4o-mini",
        temperature,
    });
}
