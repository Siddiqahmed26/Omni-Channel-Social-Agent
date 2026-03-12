import { interrupt, LangGraphRunnableConfig } from "@langchain/langgraph";
import { GeneratePostAnnotation } from "../generate-post-state.js";
import { getLinkedInAuthOrInterrupt } from "../../shared/auth/linkedin.js";
import { getTwitterAuthOrInterrupt } from "../../shared/auth/twitter.js";
import { HumanInterrupt, HumanResponse } from "@langchain/langgraph/prebuilt";
import { shouldPostToLinkedInOrg } from "../../utils.js";

export async function authSocialsPassthrough(
  _state: typeof GeneratePostAnnotation.State,
  config: LangGraphRunnableConfig,
) {
  const useArcade = process.env.USE_ARCADE_AUTH === "true";
  const allowedEmails = (process.env.ALLOWED_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);
  
  // Helper to check if a user is allowed
  const isUserAllowed = (email?: string) => {
    if (allowedEmails.length === 0) return true; // No restriction if ALLOWED_EMAILS is empty
    if (!email) return false;
    return allowedEmails.includes(email.toLowerCase());
  };

  // When using Arcade, ONLY use the per-user ID from the run config.
  // Never fall back to the shared LINKEDIN_USER_ID env var — doing so causes all
  // users to share the same Arcade token cache, making LinkedIn appear connected for everyone.
  const linkedInUserId = useArcade
    ? config.configurable?.linkedInUserId
    : process.env.LINKEDIN_USER_ID;

  if (useArcade && !linkedInUserId) {
    throw new Error(
      "[AUTH] Arcade auth is enabled but no 'linkedInUserId' was provided in the run config. " +
      "Each run must supply the authenticated user's email as 'linkedInUserId' via configurable fields."
    );
  }

  const postToLinkedInOrg = shouldPostToLinkedInOrg(config);

  // Same isolation: when using Arcade, only accept per-user ID from the run config.
  const twitterUserId = useArcade
    ? config.configurable?.twitterUserId
    : process.env.TWITTER_USER_ID;

  if (useArcade && !twitterUserId) {
    throw new Error(
      "[AUTH] Arcade auth is enabled but no 'twitterUserId' was provided in the run config. " +
      "Each run must supply the authenticated user's email as 'twitterUserId' via configurable fields."
    );
  }

  let linkedInHumanInterrupt: HumanInterrupt | undefined = undefined;

  if (linkedInUserId) {
    if (isUserAllowed(linkedInUserId)) {
      linkedInHumanInterrupt = await getLinkedInAuthOrInterrupt({
        linkedInUserId,
        returnInterrupt: true,
        postToOrg: postToLinkedInOrg,
      });
    } else {
      // User not allowed to connect
      linkedInHumanInterrupt = {
        action_request: {
          action: "[RESTRICTED]: LinkedIn",
          args: { linkedInRestricted: true }
        }
      } as any;
    }
  }

  let twitterHumanInterrupt: HumanInterrupt | undefined = undefined;

  if (twitterUserId) {
    if (isUserAllowed(twitterUserId)) {
      twitterHumanInterrupt = await getTwitterAuthOrInterrupt({
        twitterUserId,
        returnInterrupt: true,
      });
    } else {
      // User not allowed to connect
      twitterHumanInterrupt = {
        action_request: {
          action: "[RESTRICTED]: Twitter",
          args: { twitterRestricted: true }
        }
      } as any;
    }
  }

  if (!twitterHumanInterrupt && !linkedInHumanInterrupt) {
    // User has already authorized. Return early
    return { action: "authorized" };
  }

  const combinedArgs: Record<string, any> = {
    ...twitterHumanInterrupt?.action_request.args,
    ...linkedInHumanInterrupt?.action_request.args,
    twitterConnected: !!twitterUserId && twitterHumanInterrupt === undefined,
    linkedInConnected: !!linkedInUserId && linkedInHumanInterrupt === undefined,
  };

  const description = `# Authorization Required

Please visit the following URL(s) to authorize your social media accounts:

${combinedArgs.authorizeTwitterURL ? `Twitter: ${combinedArgs.authorizeTwitterURL}` : ""}
${combinedArgs.authorizeLinkedInURL ? `LinkedIn: ${combinedArgs.authorizeLinkedInURL}` : ""}
${combinedArgs.authorizationDocs ? `LinkedIn Authorization Docs: ${combinedArgs.authorizationDocs}` : ""}

Once done, please 'accept' this interrupt event.`;

  const interruptEvent: HumanInterrupt = {
    description,
    action_request: {
      action: "Authorize Social Media Accounts",
      args: combinedArgs,
    },
    config: {
      allow_accept: true,
      allow_ignore: true,
      allow_respond: false,
      allow_edit: true, // We allow edit so we can send the disconnect event
    },
  };

  const interruptRes = interrupt<HumanInterrupt[], HumanResponse[]>([
    interruptEvent,
  ])[0];

  if (interruptRes.type === "ignore") {
    // Throw an error to end the graph.
    throw new Error("Authorization denied by user.");
  }

  if (
    interruptRes.type === "edit" &&
    typeof interruptRes.args === "object" &&
    interruptRes.args?.action === "disconnect"
  ) {
    return { action: "disconnect" };
  }

  if (interruptRes.type === "accept") {
    // The user clicked "Authorize & Proceed".
    // Returning 'resumed' helps the edge decide to loop back for a re-check.
    return { action: "resumed" };
  }

  return {};
}
