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
      
      // We try the most likely callback first. 
      // Parameter name is usually 'token', but some systems use 'jwt'
      const tokenParam = url.searchParams.get("param") || "token";
      const callback = `https://cloud.arcade.dev/api/v1/verify/callback?flow_id=${flowId}&${tokenParam}=${token}`;

      // DEBUG VIEW
      if (url.searchParams.has("debug")) {
        return new Response(`
          <html>
            <body style="font-family: sans-serif; padding: 2rem; background: #0f172a; color: white; line-height: 1.5;">
              <h2 style="color: #60a5fa;">Arcade Handshake Debug</h2>
              <p><b>User Identity:</b> <code style="background: #1e293b; padding: 2px 6px; border-radius: 4px;">${finalUserId}</code></p>
              <p><b>Flow ID:</b> <code style="background: #1e293b; padding: 2px 6px; border-radius: 4px;">${flowId}</code></p>
              <div style="margin: 1.5rem 0;">
                <p><b>Generated JWT:</b></p>
                <div style="background: #1e293b; padding: 1rem; border-radius: 8px; word-break: break-all; font-family: monospace; border: 1px solid #334155;">
                  ${token}
                </div>
              </div>
              <div style="margin-top: 2rem; display: flex; gap: 1rem; align-items: center;">
                <a href="${callback}" style="padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Complete Verification (token) &rarr;
                </a>
                <a href="https://cloud.arcade.dev/api/v1/verify/callback?flow_id=${flowId}&jwt=${token}" style="padding: 12px 24px; background: #475569; color: white; text-decoration: none; border-radius: 6px;">
                  Try with ?jwt=
                </a>
              </div>
              <p style="margin-top: 2rem; color: #94a3b8; font-size: 0.9rem;">
                Verify this token at <a href="https://jwt.io" style="color: #60a5fa" target="_blank">jwt.io</a>. 
                Use your ARCADE_API_KEY as the secret (HS256).
              </p>
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
 * Robust Base64Url encoding for JWT
 */
function toBase64Url(str: string): string {
  if (typeof btoa === 'function') {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }
  // Node.js fallback
  return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
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
 * HS256 Token Signing with "Kitchen Sink" claims
 */
async function signToken(userId: string, flowId: string, apiKey: string) {
  const header = { alg: "HS256", typ: "JWT" };
  
  // Kitchen Sink: We include both snake_case and camelCase to satisfy Arcade's validator
  const payload = {
    sub: userId,
    user_id: userId,
    userId: userId,
    flow_id: flowId,
    flowId: flowId,
    aud: "arcade", // Standard audience
    iss: "omni-channel-social-agent", // Descriptive issuer
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 600 // 10 minutes (generous)
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