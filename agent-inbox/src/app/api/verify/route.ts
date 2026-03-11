import { NextResponse } from "next/server";
import Arcade from "@arcadeai/arcadejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const flowId = url.searchParams.get("flow_id");
  
  // Try to find the user ID in various param names Arcade might use
  const userId = url.searchParams.get("user_id") || 
                 url.searchParams.get("userId") || 
                 url.searchParams.get("sub") ||
                 url.searchParams.get("id");
                 
  const redirectUrl = url.searchParams.get("redirect_url") || url.searchParams.get("redirect_uri");

  const allParams = Object.fromEntries(url.searchParams);
  console.log("[Verify] Incoming Handshake:", allParams);

  // 1. Dashboard "Run Test" Flow (Initial Redirect)
  if (redirectUrl) {
    console.log("[Verify] Test redirect triggered.");
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Auth Confirmation Handshake
  if (flowId) {
    const arcadeKey = process.env.ARCADE_API_KEY;
    if (!arcadeKey) {
      return NextResponse.json({ error: "ARCADE_API_KEY missing in Vercel Environment" }, { status: 500 });
    }

    const arcade = new Arcade({ apiKey: arcadeKey });
    
    // RESOLUTION: The 'coordinator_error' 400 is strictly a mismatch between
    // the ID that started the flow and the one we confirm here.
    // We prioritize query params first (dynamic), then environment, then hardcoded (test).
    const finalUserId = userId || process.env.LINKEDIN_USER_ID || "siddiqahmed.work@gmail.com";
    
    try {
      console.log(`[Verify] Confirming... user=${finalUserId}, flow=${flowId}`);
      
      const confirmRes = await arcade.post("/v1/auth/confirm_user", {
        body: {
          flow_id: flowId,
          user_id: finalUserId,
        }
      });

      console.log("[Verify] Success! Redirecting to Arcade callback.");

      const callback = `https://cloud.arcade.dev/api/v1/oauth/callback?flow_id=${flowId}&status=approved`;
      return NextResponse.redirect(callback);

    } catch (error: any) {
      console.error("[Verify] Handshake Failed:", error.message);
      
      // Detailed user guidance
      return NextResponse.json({ 
        error: "User ID Mismatch (coordinator_error)",
        diagnosis: "The User ID we sent to Arcade doesn't match the one that started the flow in the Arcade Dashboard.",
        
        instructions: [
          `1. Go to Arcade Dashboard > User Verification`,
          `2. Set 'User ID for testing' to EXACTLY: ${finalUserId}`,
          `3. (Optional) In Vercel, set LINKEDIN_USER_ID to your preferred email and use that in the dashboard instead.`,
          "4. Click 'Run Test' again in the Arcade dashboard."
        ],

        debug_info: {
          tried_to_confirm_user: finalUserId,
          flow_id: flowId,
          incoming_query_params: allParams,
          env_linkedin_user_id: process.env.LINKEDIN_USER_ID || "NOT SET",
          arcade_api_key: process.env.ARCADE_API_KEY ? "CONFIGURED" : "MISSING"
        },
        raw_arcade_error: error.message
      }, { status: 400 });
    }
  }

  return NextResponse.json({
    status: "active",
    message: "Arcade Custom Verifier is waiting for a flow_id.",
    env: {
      has_arcade_key: !!process.env.ARCADE_API_KEY,
      has_user_id: !!process.env.LINKEDIN_USER_ID
    }
  });
}