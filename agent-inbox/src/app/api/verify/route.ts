import { NextResponse } from "next/server";
import Arcade from "@arcadeai/arcadejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const flowId = url.searchParams.get("flow_id");
  const userId = url.searchParams.get("user_id") || url.searchParams.get("userId");
  const redirectUrl = url.searchParams.get("redirect_url") || url.searchParams.get("redirect_uri");

  console.log(`[Verify] Handshake: flow_id=${flowId}, user_id=${userId}`);

  // 1. Dashboard "Run Test" Flow (Initial Redirect)
  if (redirectUrl) {
    console.log("[Verify] Initial test redirect detected.");
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Auth Confirmation Handshake
  if (flowId) {
    const arcadeKey = process.env.ARCADE_API_KEY;
    if (!arcadeKey) {
      return NextResponse.json({ error: "ARCADE_API_KEY not set" }, { status: 500 });
    }

    const arcade = new Arcade({ apiKey: arcadeKey });
    
    // IMPORTANT: The 'coordinator_error' 400 happens when this finalUserId 
    // does NOT match the ID Arcade used to start the flow.
    // For Dashboard "Run Test", you must set the "Test User ID" field in Arcade
    // to match this string exactly.
    const finalUserId = userId || process.env.LINKEDIN_USER_ID || "siddiqahmed.work@gmail.com";
    
    try {
      console.log(`[Verify] Handshaking flow ${flowId} for user ${finalUserId}`);
      
      // Use the SDK's internal POST to confirm the user identity
      const confirmRes = await arcade.post("/v1/auth/confirm_user", {
        body: {
          flow_id: flowId,
          user_id: finalUserId,
        }
      });

      console.log("[Verify] Confirmation Success:", confirmRes);

      // Final Redirect to Arcade success callback
      const callback = `https://cloud.arcade.dev/api/v1/oauth/callback?flow_id=${flowId}&status=approved`;
      return NextResponse.redirect(callback);

    } catch (error: any) {
      console.error("[Verify] Confirmation Error:", error);
      
      // We return a detailed error page to the user's browser
      return NextResponse.json({ 
        arcade_error: "coordinator_error",
        why: "User ID Mismatch. The ID we sent to Arcade does not match the one that started the flow.",
        action_required: `In your Arcade Dashboard, set 'User ID for testing' to: ${finalUserId}`,
        tried_user: finalUserId,
        tried_flow: flowId,
        raw_error: error.message
      }, { status: 400 });
    }
  }

  return NextResponse.json({
    status: "active",
    message: "Arcade Verifier is ready.",
    received_params: Object.fromEntries(url.searchParams)
  });
}