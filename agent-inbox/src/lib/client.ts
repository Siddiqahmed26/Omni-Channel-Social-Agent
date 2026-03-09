import { Client } from "@langchain/langgraph-sdk";

export const createClient = ({
  deploymentUrl,
  langchainApiKey,
}: {
  deploymentUrl: string;
  langchainApiKey: string | undefined;
}) => {
  // Use the provided key, or the master key from environment variables
  const masterKey = process.env.NEXT_PUBLIC_LANGCHAIN_API_KEY;
  const finalKey = langchainApiKey || masterKey;

  return new Client({
    apiUrl: deploymentUrl,
    defaultHeaders: {
      ...(finalKey && { "x-api-key": finalKey }),
    },
  });
};
