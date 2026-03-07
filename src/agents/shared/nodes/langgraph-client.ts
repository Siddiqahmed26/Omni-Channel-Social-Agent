import { Client } from "@langchain/langgraph-sdk";

/**
 * Returns a LangGraph client with robust internal connectivity settings.
 * Prioritizes:
 * 1. LANGGRAPH_API_URL (Explicit override)
 * 2. PORT (Hugging Face / Dynamic environment)
 * 3. 54367 (Standard local fallback)
 */
export function getLangGraphClient(): Client {
    const port = process.env.PORT || "54367";
    const apiUrl = process.env.LANGGRAPH_API_URL || `http://localhost:${port}`;

    return new Client({
        apiUrl,
        apiKey: process.env.LANGCHAIN_API_KEY,
    });
}
