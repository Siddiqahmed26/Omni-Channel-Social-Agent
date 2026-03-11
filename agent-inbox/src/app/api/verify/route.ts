import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const flowId = url.searchParams.get("flow_id");
  const userId = url.searchParams.get("user_id") || url.searchParams.get("userId") || url.searchParams.get("sub");
  const redirectUrl = url.searchParams.get("redirect_url") || url.searchParams.get("redirect_uri");

  // 1. Dashboard "Run Test" Redirect
  if (redirectUrl) {
    return NextResponse.redirect(redirectUrl);
  }

  // 2. JWT Handshake
  if (flowId) {
    const arcadeKey = process.env.ARCADE_API_KEY?.trim();
    if (!arcadeKey) {
      return NextResponse.json({ error: "ARCADE_API_KEY missing in Vercel" }, { status: 500 });
    }

    const finalUserId = userId || process.env.LINKEDIN_USER_ID || "siddiqahmed.work@gmail.com";
    
    try {
      // Robust JWT signing for Custom Verifier (Public Mode)
      const token = await signToken(finalUserId, flowId, arcadeKey);
      const callback = `https://cloud.arcade.dev/api/v1/verify/callback?flow_id=${flowId}&token=${token}`;

      // DEBUG VIEW: If the user is testing, show them the token first
      // This prevents the generic 400 error from being hard to debug
      if (url.searchParams.has("debug")) {
        return new Response(`
          <html>
            <body style="font-family: sans-serif; padding: 2rem; background: #0f172a; color: white;">
              <h2>Arcade Handshake Debug</h2>
              <p><b>User:</b> ${finalUserId}</p>
              <p><b>Flow:</b> ${flowId}</p>
              <div style="background: #1e293b; padding: 1rem; border-radius: 8px; word-break: break-all;">
                <code>${token}</code>
              </div>
              <br/>
              <a href="${callback}" style="padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">
                Complete Verification &rarr;
              </a>
              <p><small>Check this token on <a href="https://jwt.io" style="color: #60a5fa" target="_blank">jwt.io</a> using your ARCADE_API_KEY as the secret.</small></p>
            </body>
          </html>
        `, { headers: { "Content-Type": "text/html" } });
      }

      console.log(`[Verify] Handshaking: user=${finalUserId}, flow=${flowId}`);
      return NextResponse.redirect(callback);

    } catch (error: any) {
      return NextResponse.json({ error: "JWT Signing Failed", detail: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    status: "active",
    message: "JWT Verifier ready. Ensure Arcade is in 'Custom user verifier (Public)' mode.",
    env: { has_key: !!process.env.ARCADE_API_KEY }
  });
}

/**
 * Robust Base64Url encoding
 */
function toBase64Url(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return toBase64Url(binary);
}

/**
 * HS256 Token Signing
 */
async function signToken(userId: string, flowId: string, apiKey: string) {
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    sub: userId,
    flow_id: flowId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 300 // 5 minutes
  };

  const headerB64 = toBase64Url(JSON.stringify(header));
  const payloadB64 = toBase64Url(JSON.stringify(payload));
  const data = `${headerB64}.${payloadB64}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(apiKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  const signatureB64 = arrayBufferToBase64Url(signature);

  return `${data}.${signatureB64}`;
}