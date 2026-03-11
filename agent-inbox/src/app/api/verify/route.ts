import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const flowId = url.searchParams.get("flow_id");
  const userId = url.searchParams.get("user_id") || url.searchParams.get("userId");
  const redirectUrl = url.searchParams.get("redirect_url") || url.searchParams.get("redirect_uri");

  console.log(`[Verify] Handshake Started: flow_id=${flowId}, user_id=${userId}`);

  // 1. Dashboard "Run Test" Redirect
  if (redirectUrl) {
    console.log("[Verify] Test redirect_url detected, following it...");
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Real/Test Confirmation Handshake
  if (flowId) {
    const arcadeKey = process.env.ARCADE_API_KEY;
    if (!arcadeKey) {
      console.error("[Verify] ARCADE_API_KEY is missing!");
      return NextResponse.json({ error: "ARCADE_API_KEY not set" }, { status: 500 });
    }

    // fallback logic: prioritize incoming userId, then env, then dashboard default
    const finalUserId = userId || process.env.LINKEDIN_USER_ID || "siddiqahmed.work@gmail.com";
    
    try {
      // THE DEFINITIVE ENDPOINT: Found in Arcade's internal SDKs
      const confirmEndpoint = "https://api.arcade.dev/v1/auth/confirm_user";
      console.log(`[Verify] POST to ${confirmEndpoint} for user ${finalUserId}`);

      const response = await fetch(confirmEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // The JS SDK sends the key directly without "Bearer"
          "Authorization": arcadeKey, 
        },
        body: JSON.stringify({
          flow_id: flowId,
          user_id: finalUserId,
        }),
      });

      if (!response.ok) {
        const errorDetail = await response.text();
        console.error(`[Verify] Arcade confirmation failed: ${response.status}`, errorDetail);
        
        // Try fallback with "Bearer " prefix just in case it's a newer requirement
        console.log("[Verify] Retrying with Bearer prefix...");
        const retryRes = await fetch(confirmEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${arcadeKey}`,
          },
          body: JSON.stringify({ flow_id: flowId, user_id: finalUserId }),
        });

        if (!retryRes.ok) {
          const retryErr = await retryRes.text();
          console.error(`[Verify] Bearer fallback also failed: ${retryRes.status}`, retryErr);
          return NextResponse.json({ 
            error: "Arcade confirmation failed", 
            detail: errorDetail,
            retry_detail: retryErr
          }, { status: 400 });
        }
        console.log("[Verify] Bearer fallback succeeded!");
      } else {
        console.log("[Verify] Handshake confirmed successfully.");
      }

      // 3. Final Redirect back to Arcade callback
      const callback = `https://cloud.arcade.dev/api/v1/oauth/callback?flow_id=${flowId}&status=approved`;
      console.log(`[Verify] Redirecting to success callback: ${callback}`);
      return NextResponse.redirect(callback);

    } catch (error) {
      console.error("[Verify] System error during handshake:", error);
      return NextResponse.json({ error: "Internal verification error" }, { status: 500 });
    }
  }

  return NextResponse.json({
    status: "ready",
    message: "Arcade Custom Verifier is online.",
    params: Object.fromEntries(url.searchParams)
  });
}