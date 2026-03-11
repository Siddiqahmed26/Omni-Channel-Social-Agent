import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const flowId = url.searchParams.get("flow_id");
  const userId = url.searchParams.get("user_id") || url.searchParams.get("userId") || url.searchParams.get("sub");
  const redirectUrl = url.searchParams.get("redirect_url") || url.searchParams.get("redirect_uri");

  if (redirectUrl) {
    return NextResponse.redirect(redirectUrl);
  }

  if (flowId) {
    const arcadeKey = process.env.ARCADE_API_KEY;
    if (!arcadeKey) return NextResponse.json({ error: "Missing API Key" }, { status: 500 });

    const finalUserId = userId || process.env.LINKEDIN_USER_ID || "siddiqahmed.work@gmail.com";
    const attempts: any[] = [];

    const probe = async (label: string, endpoint: string, body: any, headers: any) => {
      try {
        const start = Date.now();
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify(body),
        });
        const text = await res.text();
        attempts.push({
          label,
          endpoint,
          status: res.status,
          response: text,
          latency: Date.now() - start
        });
        return res.ok;
      } catch (e: any) {
        attempts.push({ label, endpoint, error: e.message });
        return false;
      }
    };

    // Attempt 1: Standard API v1/auth
    await probe("API_V1_AUTH_STD", "https://api.arcade.dev/v1/auth/confirm_user", 
      { flow_id: flowId, user_id: finalUserId }, 
      { "Authorization": arcadeKey });

    // Attempt 2: Standard API v1/auth with Bearer
    await probe("API_V1_AUTH_BEARER", "https://api.arcade.dev/v1/auth/confirm_user", 
      { flow_id: flowId, user_id: finalUserId }, 
      { "Authorization": `Bearer ${arcadeKey}` });

    // Attempt 3: Cloud API v1/oauth
    await probe("CLOUD_V1_OAUTH_STD", "https://cloud.arcade.dev/api/v1/oauth/confirm_user", 
      { flow_id: flowId, user_id: finalUserId }, 
      { "Authorization": arcadeKey });

    // Attempt 4: Cloud API v1/oauth with Bearer
    await probe("CLOUD_V1_OAUTH_BEARER", "https://cloud.arcade.dev/api/v1/oauth/confirm_user", 
      { flow_id: flowId, user_id: finalUserId }, 
      { "Authorization": `Bearer ${arcadeKey}` });

    // Attempt 5: API v1/auth with CamelCase
    await probe("API_V1_AUTH_CAMEL", "https://api.arcade.dev/v1/auth/confirm_user", 
      { flowId: flowId, userId: finalUserId }, 
      { "Authorization": arcadeKey });

    // Attempt 6: Cloud API v1/auth (alternative)
    await probe("CLOUD_V1_AUTH_STD", "https://cloud.arcade.dev/api/v1/auth/confirm_user", 
      { flow_id: flowId, user_id: finalUserId }, 
      { "Authorization": arcadeKey });

    const success = attempts.find(a => a.status >= 200 && a.status < 300);

    if (success) {
      console.log(`[Verify] Success with: ${success.label}`);
      const callback = `https://cloud.arcade.dev/api/v1/oauth/callback?flow_id=${flowId}&status=approved`;
      return NextResponse.redirect(callback);
    }

    return NextResponse.json({
      error: "All handshake variations failed",
      tried_user: finalUserId,
      flow_id: flowId,
      diagnostics: attempts
    }, { status: 400 });
  }

  return NextResponse.json({ status: "active", message: "Prober Ready" });
}