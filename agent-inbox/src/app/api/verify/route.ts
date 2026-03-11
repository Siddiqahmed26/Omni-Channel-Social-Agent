import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);

  const flowId = url.searchParams.get("flow_id");
  const userId = url.searchParams.get("user_id") || url.searchParams.get("userId");
  const redirectUrl = url.searchParams.get("redirect_url") || url.searchParams.get("redirect_uri");

  // 1. Arcade Dashboard "Run Test" flow
  // Arcade often sends a 'redirect_url' parameter during its internal testing.
  if (redirectUrl) {
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Real Auth Flow or Manual Verification Test
  // If we have a flow_id, we MUST confirm it back to Arcade.
  if (flowId) {
    const arcadeKey = process.env.ARCADE_API_KEY;
    if (!arcadeKey) {
      console.error("ARCADE_API_KEY not set in environment");
      return NextResponse.json({ error: "ARCADE_API_KEY not set" }, { status: 500 });
    }

    // Use the provided user_id, or fallback to a generic verified ID for testing.
    // In a production app, you would ideally get this from a session/cookie.
    const finalUserId = userId || "anonymous_verified_user";

    try {
      // Sign a JWT for Arcade (HS256)
      const token = await signToken(finalUserId, flowId, arcadeKey);
      
      // Redirect back to Arcade callback to complete the verification.
      const callback = `https://cloud.arcade.dev/api/v1/verify/callback?flow_id=${flowId}&token=${token}`;
      return NextResponse.redirect(callback);
    } catch (error) {
      console.error("Error signing verification token:", error);
      return NextResponse.json({ error: "Failed to sign token" }, { status: 500 });
    }
  }

  // 3. Status check / Manual visit
  return NextResponse.json({
    status: "active",
    message: "Arcade Verification Endpoint is ready.",
    received_params: Object.fromEntries(url.searchParams)
  });
}

/**
 * Web Crypto based JWT signing (no external dependencies required)
 */
async function signToken(userId: string, flowId: string, apiKey: string) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = { 
    sub: userId, 
    flow_id: flowId, 
    iat: Math.floor(Date.now() / 1000), 
    exp: Math.floor(Date.now() / 1000) + 600 
  };
  
  const s2b = (s: string) => btoa(s).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const tokenData = `${s2b(JSON.stringify(header))}.${s2b(JSON.stringify(payload))}`;
  
  const key = await crypto.subtle.importKey(
    'raw', 
    new TextEncoder().encode(apiKey),
    { name: 'HMAC', hash: 'SHA-256' }, 
    false, 
    ['sign']
  );
  
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(tokenData));
  const b64Sig = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
    
  return `${tokenData}.${b64Sig}`;
}