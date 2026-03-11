import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const flowId = url.searchParams.get("flow_id");
  const userId = url.searchParams.get("user_id") || url.searchParams.get("userId");
  const redirectUrl = url.searchParams.get("redirect_url") || url.searchParams.get("redirect_uri");

  console.log(`[Verify] Incoming request: flow_id=${flowId}, user_id=${userId}`);

  // 1. Handle Arcade Dashboard "Run Test" Flow
  if (redirectUrl) {
    console.log("[Verify] Redirecting for test flow");
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Handle Handshake confirming user_id to Arcade
  if (flowId) {
    const arcadeKey = process.env.ARCADE_API_KEY;
    if (!arcadeKey) {
      return NextResponse.json({ error: "ARCADE_API_KEY not set" }, { status: 500 });
    }

    // IMPORTANT: For the dashboard "Run Test" to work, the user_id must match the one 
    // entered in the Arcade UI (e.g., siddiqahmed.work@gmail.com).
    // In a real SaaS app, this would come from your authenticated session.
    const finalUserId = userId || process.env.LINKEDIN_USER_ID || "siddiqahmed.work@gmail.com";
    console.log(`[Verify] Confirming user: ${finalUserId} for flow: ${flowId}`);

    try {
      // Trying the GET endpoint as per official documentation leads
      // Base URL should be api.arcade.dev
      const confirmUrl = new URL("https://api.arcade.dev/v1/auth/confirm_user");
      confirmUrl.searchParams.append("flow_id", flowId);
      confirmUrl.searchParams.append("user_id", finalUserId);

      const confirmRes = await fetch(confirmUrl.toString(), {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${arcadeKey}`,
        },
      });

      if (!confirmRes.ok) {
        const errText = await confirmRes.text();
        console.error(`[Verify] Arcade confirmation failed (${confirmRes.status}):`, errText);
        
        // If GET fails, try POST as a fallback to the oauth path
        console.log("[Verify] Retrying with POST to oauth/confirm_user...");
        const postRes = await fetch("https://cloud.arcade.dev/api/v1/oauth/confirm_user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${arcadeKey}`,
          },
          body: JSON.stringify({ flow_id: flowId, user_id: finalUserId }),
        });

        if (!postRes.ok) {
          const postErr = await postRes.text();
          console.error(`[Verify] POST fallback also failed (${postRes.status}):`, postErr);
          return NextResponse.json({ 
            error: "Arcade confirmation failed", 
            get_error: errText,
            post_error: postErr 
          }, { status: 400 });
        }
      }

      // Success! Now redirect to complete the flow.
      const arcadeBase = "https://cloud.arcade.dev";
      const callbackUrl = `${arcadeBase}/api/v1/oauth/callback?flow_id=${flowId}&status=approved`;
      console.log("[Verify] Success! Redirecting to:", callbackUrl);
      return NextResponse.redirect(callbackUrl);

    } catch (error) {
      console.error("[Verify] Internal error during handshake:", error);
      return NextResponse.json({ error: "Internal verification error" }, { status: 500 });
    }
  }

  return NextResponse.json({
    status: "active",
    message: "Arcade Verification Endpoint is active.",
    received_params: Object.fromEntries(url.searchParams)
  });
}