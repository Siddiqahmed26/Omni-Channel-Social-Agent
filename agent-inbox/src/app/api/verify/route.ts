import { NextResponse } from "next/server";
import Arcade from "@arcadeai/arcadejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const flowId = url.searchParams.get("flow_id");
  const userId = url.searchParams.get("user_id") || url.searchParams.get("userId");
  const redirectUrl = url.searchParams.get("redirect_url") || url.searchParams.get("redirect_uri");

  console.log(`[Verify] Request: flow_id=${flowId}, user_id=${userId}`);

  // 1. Dashboard "Run Test" Flow
  if (redirectUrl) {
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Auth Handshake
  if (flowId) {
    const arcadeKey = process.env.ARCADE_API_KEY;
    if (!arcadeKey) {
      return NextResponse.json({ error: "ARCADE_API_KEY not set" }, { status: 500 });
    }

    const arcade = new Arcade({ apiKey: arcadeKey });
    
    // Use incoming ID, or fallback to the email used in the app/dashboard configs
    const finalUserId = userId || process.env.LINKEDIN_USER_ID || "siddiqahmed.work@gmail.com";
    
    try {
      console.log(`[Verify] Confirming ${finalUserId} via SDK for flow ${flowId}`);
      
      // Use the SDK's internal POST method to ensure headers/baseURL are correct
      // Based on Python SDK, the endpoint is /v1/auth/confirm_user
      const confirmRes = await arcade.post("/v1/auth/confirm_user", {
        body: {
          flow_id: flowId,
          user_id: finalUserId,
        }
      });

      console.log("[Verify] SDK Confirmation Success:", confirmRes);

      // Final Redirect to complete the flow
      const callback = `https://cloud.arcade.dev/api/v1/oauth/callback?flow_id=${flowId}&status=approved`;
      return NextResponse.redirect(callback);

    } catch (error: any) {
      console.error("[Verify] SDK Confirmation Error:", error);
      
      // Return specific error details to help debug 400 Bad Request
      return NextResponse.json({ 
        error: "Arcade confirmation failed", 
        message: error.message,
        name: error.name,
        status: error.status,
        tried_user: finalUserId,
        tried_flow: flowId
      }, { status: 400 });
    }
  }

  return NextResponse.json({
    status: "active",
    message: "Arcade Verifier is ready.",
    received_params: Object.fromEntries(url.searchParams)
  });
}