import { NextResponse } from "next/server";
import Arcade from "@arcadeai/arcadejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const flowId = url.searchParams.get("flow_id");
  const userId = url.searchParams.get("user_id") || url.searchParams.get("userId") || url.searchParams.get("sub");
  const redirectUrl = url.searchParams.get("redirect_url") || url.searchParams.get("redirect_uri");

  const allParams = Object.fromEntries(url.searchParams);
  const allHeaders = Object.fromEntries(req.headers.entries());

  // 1. Initial Test Redirect
  if (redirectUrl) {
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Auth Confirmation
  if (flowId) {
    const arcadeKey = process.env.ARCADE_API_KEY;
    if (!arcadeKey) {
      return NextResponse.json({ error: "ARCADE_API_KEY not set" }, { status: 500 });
    }

    const arcade = new Arcade({ apiKey: arcadeKey });
    const finalUserId = userId || process.env.LINKEDIN_USER_ID || "siddiqahmed.work@gmail.com";
    
    try {
      // DEBUG: Check flow status first
      console.log(`[Verify] Checking status for flow: ${flowId}`);
      const flowStatus = await arcade.auth.status({ id: flowId });
      console.log("[Verify] Current flow status:", JSON.stringify(flowStatus, null, 2));

      // Attempt Confirmation
      console.log(`[Verify] Confirming user: ${finalUserId}`);
      const confirmRes = await arcade.post("/v1/auth/confirm_user", {
        body: {
          flow_id: flowId,
          user_id: finalUserId,
        }
      });

      console.log("[Verify] Success!");
      const callback = `https://cloud.arcade.dev/api/v1/oauth/callback?flow_id=${flowId}&status=approved`;
      return NextResponse.redirect(callback);

    } catch (error: any) {
      console.error("[Verify] Handshake Error:", error.message);
      
      // Get the freshest status for the error report
      let currentStatus = {};
      try {
        currentStatus = await arcade.auth.status({ id: flowId });
      } catch (sErr) {}

      return NextResponse.json({ 
        error: "Arcade Handshake Failed",
        message: error.message,
        hint: "The 400 'coordinator_error' usually means the user_id we sent doesn't match the one that started the flow.",
        
        diagnostics: {
          flow_status: currentStatus,
          tried_user: finalUserId,
          flow_id: flowId,
          tips: [
            "Check that ARCADE_API_KEY in Vercel is correct.",
            "Make sure Arcade Dashboard > User verification > 'User ID for testing' is exactly: " + finalUserId,
            "If using different emails, try adding LINKEDIN_USER_ID to Vercel env."
          ]
        }
      }, { status: 400 });
    }
  }

  return NextResponse.json({
    status: "ready",
    message: "Arcade Verifier is awaiting a flow.",
    params: allParams
  });
}