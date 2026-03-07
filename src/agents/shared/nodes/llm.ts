import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

/**
 * Centrally manages LLM instantiation based on environment variables.
 * Defaults to Google Gemini (free tier) if not specified.
 */
export function getModel(options: { temperature?: number; modelName?: string } = {}): BaseChatModel {
    const provider = process.env.MODEL_PROVIDER || "google";
    const { temperature = 0.5, modelName } = options;

    switch (provider.toLowerCase()) {
        case "anthropic":
            return new ChatAnthropic({
                model: modelName || "claude-3-5-sonnet-20240620",
                temperature,
            });
        case "google":
            return new ChatGoogleGenerativeAI({
                model: modelName || "gemini-2.0-flash", // Using Flash for better speed in demos
                temperature,
                apiKey: process.env.GOOGLE_API_KEY,
            });
        case "openai":
            return new ChatOpenAI({
                model: modelName || "gpt-4o",
                temperature,
            });
        default:
            // Fallback to Google if unknown
            return new ChatGoogleGenerativeAI({
                model: modelName || "gemini-2.0-flash",
                temperature,
                apiKey: process.env.GOOGLE_API_KEY,
            });
    }
}
