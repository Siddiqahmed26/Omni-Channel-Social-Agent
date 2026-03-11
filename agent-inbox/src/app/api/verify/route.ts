import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const flowId = url.searchParams.get("flow_id");
  const userId = url.searchParams.get("user_id");
  const redirectUrl = url.searchParams.get("redirect_url");

  // Handle Dashboard Test Flow
  if (redirectUrl) {
    return NextResponse.redirect(redirectUrl);
  }

  // Handle Real Auth Flow
  if (flowId && userId) {
    const arcadeKey = process.env.ARCADE_API_KEY;
    if (!arcadeKey) {
      console.error("ARCADE_API_KEY not set in environment");
      return NextResponse.json({ error: "ARCADE_API_KEY not set" }, { status: 500 });
    }

    try {
      // Sign a simple JWT for Arcade (HS256)
      const token = await signToken(userId, flowId, arcadeKey);
      
      // Redirect back to Arcade to finish the verification handshake
      const callback = `https://cloud.arcade.dev/api/v1/verify/callback?flow_id=${flowId}&token=${token}`;
      return NextResponse.redirect(callback);
    } catch (error) {
      console.error("Error signing verification token:", error);
      return NextResponse.json({ error: "Failed to sign token" }, { status: 500 });
    }
  }

  return NextResponse.json({ 
    error: "Missing parameters", 
    received: Object.fromEntries(url.searchParams) 
  }, { status: 400 });
}

/**
 * Web Crypto based JWT signing (no external dependencies required)
 * Follows Arcade.dev's standard for custom user verification.
 */
async function signToken(userId: string, flowId: string, apiKey: string) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = { 
    sub: userId, 
    flow_id: flowId, 
    iat: Math.floor(Date.now() / 1000), 
    exp: Math.floor(Date.now() / 1000) + 600 // 10 minute expiration
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