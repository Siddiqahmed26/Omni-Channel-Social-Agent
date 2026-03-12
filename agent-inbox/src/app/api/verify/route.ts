import { NextResponse } from "next/server";
import Arcade from "@arcadeai/arcadejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const flowId = url.searchParams.get("flow_id");
  const userId = url.searchParams.get("user_id") || url.searchParams.get("userId") || url.searchParams.get("sub");
  
  if (!flowId) {
    return NextResponse.json({ error: "Missing flow_id" }, { status: 400 });
  }

  const arcadeKey = process.env.ARCADE_API_KEY?.trim();
  if (!arcadeKey) {
    return NextResponse.json({ error: "ARCADE_API_KEY missing in Vercel" }, { status: 500 });
  }

  const finalUserId = userId || process.env.LINKEDIN_USER_ID || "siddiqahmed.work@gmail.com";

  try {
    const arcade = new Arcade({ apiKey: arcadeKey });
    
    // 1. Confirm the user ID with the flow ID
    console.log(`[Verify] Calling confirmUser for user: ${finalUserId}, flow: ${flowId}`);
    const verify_response = await arcade.auth.confirmUser({
      user_id: finalUserId,
      flow_id: flowId
    });

    // 2. Wait for completion
    // The dashboard test or tool authorization will finish once this is confirmed
    console.log(`[Verify] Waiting for auth completion: ${verify_response.auth_id}`);
    const auth_response = await arcade.auth.waitForCompletion(verify_response.auth_id);

    // 3. Render a success page to close the popup automatically
    if (auth_response.status === "completed") {
      return new Response(`
        <html>
          <body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #0f172a; color: white;">
            <div style="text-align: center;">
              <div style="background: #1e293b; padding: 2rem; border-radius: 12px; border: 1px solid #334155;">
                  <h2 style="color: #4ade80; margin-top: 0;">Authorization Successful! 🎉</h2>
                  <p style="color: #94a3b8;">User verified: <b>${finalUserId}</b></p>
                  <p>You can close this window now.</p>
                  <button onclick="window.close()" style="margin-top: 1rem; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">Close Window</button>
              </div>
            </div>
            <script>
              // Try to automatically close the popup
              setTimeout(() => { window.close(); }, 2000);
            </script>
          </body>
        </html>
      `, { headers: { "Content-Type": "text/html" } });
    } else {
      return NextResponse.json({ error: "Authorization failed", details: auth_response }, { status: 400 });
    }

  } catch (error: any) {
    console.error("[Verify Error]", error);
    return NextResponse.json({ error: "Arcade Handshake Failed", detail: error.message }, { status: 500 });
  }
}