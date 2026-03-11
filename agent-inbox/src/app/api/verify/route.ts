import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const flowId = url.searchParams.get("flow_id");
  const userId = url.searchParams.get("user_id") || url.searchParams.get("userId") || url.searchParams.get("sub");
  const redirectUrl = url.searchParams.get("redirect_url") || url.searchParams.get("redirect_uri");

  // 1. Handle Dashboard Test Flow (Initial Step)
  if (redirectUrl) {
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Handle JWT Handshake (Public Verifier Mode)
  if (flowId) {
    const arcadeKey = process.env.ARCADE_API_KEY;
    if (!arcadeKey) {
      return NextResponse.json({ error: "ARCADE_API_KEY missing" }, { status: 500 });
    }

    // Prioritize query param, then fallback to env/test user
    const finalUserId = userId || process.env.LINKEDIN_USER_ID || "siddiqahmed.work@gmail.com";
    
    // Sign JWT using Web Crypto (Standard for Custom Verifier Public Mode)
    const token = await signToken(finalUserId, flowId, arcadeKey);
    
    // The definitive redirect URL for the Public Verifier callback
    const callback = `https://cloud.arcade.dev/api/v1/verify/callback?flow_id=${flowId}&token=${token}`;
    
    console.log(`[Verify] Handshaking via JWT Redirect: user=${finalUserId}, callback=${callback}`);
    return NextResponse.redirect(callback);
  }

  return NextResponse.json({
    status: "active",
    message: "Arcade JWT Verifier is ready.",
    mode: "Custom User Verifier (Public)"
  });
}

/**
 * Signs a simple JWT for Arcade (HS256) using Web Crypto API.
 */
async function signToken(userId: string, flowId: string, apiKey: string) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = { 
    sub: userId, 
    flow_id: flowId, 
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (5 * 60) // 5 min expiry
  };
  
  const s2b = (s: string) => btoa(JSON.stringify(s)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodeB64 = (obj: any) => {
    const str = JSON.stringify(obj);
    return btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  };

  const tokenData = `${encodeB64(header)}.${encodeB64(payload)}`;
  
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(apiKey),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(tokenData));
  const b64Sig = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    
  return `${tokenData}.${b64Sig}`;
}