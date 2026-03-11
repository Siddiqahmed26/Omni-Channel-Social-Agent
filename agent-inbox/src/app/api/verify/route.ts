import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const flowId = url.searchParams.get("flow_id");
  const userId = url.searchParams.get("user_id") || url.searchParams.get("userId");
  const redirectUrl = url.searchParams.get("redirect_url") || url.searchParams.get("redirect_uri");

  // 1. Handle Arcade Dashboard "Run Test" Flow
  if (redirectUrl) {
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Handle Real Auth Flow (Handshake confirming user_id to Arcade)
  if (flowId) {
    const arcadeKey = process.env.ARCADE_API_KEY;
    if (!arcadeKey) {
      console.error("ARCADE_API_KEY not set in environment");
      return NextResponse.json({ error: "ARCADE_API_KEY not set" }, { status: 500 });
    }

    // In a production app, you would ideally get this from a session/cookie.
    // For now, we prioritize the query param sent by Arcade.
    const finalUserId = userId || "anonymous_verified_user";

    try {
      // Server-side confirmation call to Arcade
      const arcadeBase = "https://cloud.arcade.dev";
      const confirmRes = await fetch(`${arcadeBase}/api/v1/oauth/confirm_user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${arcadeKey}`,
        },
        body: JSON.stringify({
          flow_id: flowId,
          user_id: finalUserId,
        }),
      });

      if (!confirmRes.ok) {
        const errText = await confirmRes.text();
        console.error("Arcade confirm_user failed:", confirmRes.status, errText);
        return NextResponse.json({ error: "Arcade confirmation failed", detail: errText }, { status: confirmRes.status });
      }

      // Successful confirmation! 
      // Now redirect the browser back to Arcade's callback to complete the OAuth flow.
      const callbackUrl = `${arcadeBase}/api/v1/oauth/callback?flow_id=${flowId}&status=approved`;
      return NextResponse.redirect(callbackUrl);

    } catch (error) {
      console.error("Error during Arcade verification handshake:", error);
      return NextResponse.json({ error: "Internal verification error" }, { status: 500 });
    }
  }

  // 3. Status check / Manual visit
  return NextResponse.json({
    status: "active",
    message: "Arcade Verification Endpoint is ready.",
    received_params: Object.fromEntries(url.searchParams)
  });
}