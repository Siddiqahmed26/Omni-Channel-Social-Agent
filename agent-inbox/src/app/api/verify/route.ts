import { NextResponse } from "next/server";
import Arcade from "@arcadeai/arcadejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const flowId = url.searchParams.get("flow_id");
  const userId = url.searchParams.get("user_id") || url.searchParams.get("userId") || url.searchParams.get("sub");
  const redirectUrl = url.searchParams.get("redirect_url") || url.searchParams.get("redirect_uri");

  const allParams = Object.fromEntries(url.searchParams);
  console.log("[Verify] Request params:", allParams);

  // 1. Dashboard "Run Test" Flow (Initial Redirect)
  if (redirectUrl) {
    console.log("[Verify] Initial test redirect detected.");
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Auth Confirmation Handshake
  if (flowId) {
    const arcadeKey = process.env.ARCADE_API_KEY;
    if (!arcadeKey) {
      return NextResponse.json({ error: "ARCADE_API_KEY not set in Vercel" }, { status: 500 });
    }

    const arcade = new Arcade({ apiKey: arcadeKey });
    
    // Diagnostic Fallback Logic
    // 1. Use user_id from query (best)
    // 2. Use LINKEDIN_USER_ID from env (next best)
    // 3. Fallback to hardcoded (last resort for tests)
    const finalUserId = userId || process.env.LINKEDIN_USER_ID || "siddiqahmed.work@gmail.com";
    
    try {
      console.log(`[Verify] Attempting confirm_user: user=${finalUserId}, flow=${flowId}`);
      
      const confirmRes = await arcade.post("/v1/auth/confirm_user", {
        body: {
          flow_id: flowId,
          user_id: finalUserId,
        }
      });

      console.log("[Verify] Handshake Complete!");

      const callback = `https://cloud.arcade.dev/api/v1/oauth/callback?flow_id=${flowId}&status=approved`;
      return NextResponse.redirect(callback);

    } catch (error: any) {
      console.error("[Verify] Confirmation Failed:", error.message);
      
      // EXTREME DIAGNOSTICS: Return everything to the user
      return NextResponse.json({ 
        error: "User ID Mismatch (coordinator_error)",
        diagnosis: "Arcade is rejecting our confirmation because the User ID doesn't match the one that started the flow.",
        
        instructions: [
          "1. Go to Arcade Dashboard > User Verification",
          `2. Locate 'User ID for testing' and set it to: ${finalUserId}`,
          "3. OR, add LINKEDIN_USER_ID to Vercel env vars with your correct email.",
          "4. Run the test again."
        ],

        state: {
          tried_to_confirm_user: finalUserId,
          flow_id: flowId,
          incoming_params: allParams,
          env_linkedin_user_id: process.env.LINKEDIN_USER_ID ? "SET (hidden for privacy)" : "NOT SET",
          arcade_api_key_status: "SET"
        },
        raw_error: error.message
      }, { status: 400 });
    }
  }

  return NextResponse.json({
    status: "active",
    message: "Arcade Verifier is awaiting a flow_id.",
    env_check: {
      has_arcade_key: !!process.env.ARCADE_API_KEY,
      has_user_id_env: !!process.env.LINKEDIN_USER_ID
    }
  });
}