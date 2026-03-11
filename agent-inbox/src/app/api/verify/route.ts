import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const flowId = url.searchParams.get("flow_id");
  const userId = url.searchParams.get("user_id") || url.searchParams.get("userId") || url.searchParams.get("sub");
  const redirectUrl = url.searchParams.get("redirect_url") || url.searchParams.get("redirect_uri");

  console.log(`[Verify] Cloud Handshake: flow_id=${flowId}, user_id=${userId}`);

  // 1. Initial Test Redirect
  if (redirectUrl) {
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Auth Confirmation
  if (flowId) {
    const arcadeKey = process.env.ARCADE_API_KEY;
    if (!arcadeKey) {
      return NextResponse.json({ error: "ARCADE_API_KEY missing" }, { status: 500 });
    }

    // PRIORITY: Prioritize query param, then env, then fallback test user
    const finalUserId = userId || process.env.LINKEDIN_USER_ID || "siddiqahmed.work@gmail.com";
    
    try {
      // THE CLOUD ENDPOINT: This is specific to the platform/dashboard flows
      const confirmEndpoint = "https://cloud.arcade.dev/api/v1/oauth/confirm_user";
      console.log(`[Verify] POSTING TO ${confirmEndpoint}`);
      
      const response = await fetch(confirmEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Cloud endpoints typically require the Bearer prefix
          "Authorization": `Bearer ${arcadeKey}`,
        },
        body: JSON.stringify({
          flow_id: flowId,
          user_id: finalUserId,
        }),
      });

      const resData = await response.text();
      
      if (!response.ok) {
        console.error(`[Verify] Cloud Handshake Failed (${response.status}):`, resData);
        
        // Try fallback without Bearer just in case
        console.log("[Verify] Retrying without Bearer prefix...");
        const retryRes = await fetch(confirmEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": arcadeKey,
          },
          body: JSON.stringify({ flow_id: flowId, user_id: finalUserId }),
        });
        
        if (!retryRes.ok) {
          const retryData = await retryRes.text();
          throw new Error(`Cloud rejection: ${resData} | Retry rejection: ${retryData}`);
        }
      }

      console.log("[Verify] Cloud Handshake SUCCESS.");

      // Final redirect to complete the Arcade flow
      const callback = `https://cloud.arcade.dev/api/v1/oauth/callback?flow_id=${flowId}&status=approved`;
      return NextResponse.redirect(callback);

    } catch (error: any) {
      console.error("[Verify] System Error:", error.message);
      
      return NextResponse.json({ 
        error: "Arcade Cloud Handshake Failed",
        detail: error.message,
        tried_user: finalUserId,
        flow_id: flowId,
        endpoint_tried: "https://cloud.arcade.dev/api/v1/oauth/confirm_user",
        recommendation: "Ensure Arcade Dashboard > User verification > 'User ID for testing' is exactly: " + finalUserId
      }, { status: 400 });
    }
  }

  return NextResponse.json({
    status: "active",
    message: "Arcade Cloud Verifier is online.",
    detected_params: Object.fromEntries(url.searchParams)
  });
}