import { NextResponse } from "next/server";
import Arcade from "@arcadeai/arcadejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const flowId = url.searchParams.get("flow_id");
  
  // Headers Check: Arcade might send user ID in X-User-Id header
  const xUserId = req.headers.get("x-user-id");
  
  // Param Check
  const userId = url.searchParams.get("user_id") || 
                 url.searchParams.get("userId") || 
                 url.searchParams.get("sub") ||
                 xUserId; // Prioritize header if present
                 
  const redirectUrl = url.searchParams.get("redirect_url") || url.searchParams.get("redirect_uri");

  const allParams = Object.fromEntries(url.searchParams);
  const allHeaders = Object.fromEntries(req.headers.entries());
  
  // Strip sensitive headers for logging
  delete allHeaders["authorization"];
  delete allHeaders["cookie"];

  console.log("[Verify] Request Details:", { params: allParams, headers: allHeaders });

  // 1. Dashboard "Run Test" Flow (Initial Redirect)
  if (redirectUrl) {
    console.log("[Verify] Initial test redirect.");
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Auth Confirmation Handshake
  if (flowId) {
    const arcadeKey = process.env.ARCADE_API_KEY;
    if (!arcadeKey) {
      return NextResponse.json({ error: "ARCADE_API_KEY missing" }, { status: 500 });
    }

    const arcade = new Arcade({ apiKey: arcadeKey });
    
    // PRIORITY: Header ID -> Query ID -> Env ID -> Fallback
    const finalUserId = userId || process.env.LINKEDIN_USER_ID || "siddiqahmed.work@gmail.com";
    
    try {
      console.log(`[Verify] Confirming user=${finalUserId} for flow=${flowId}`);
      
      const confirmRes = await arcade.post("/v1/auth/confirm_user", {
        body: {
          flow_id: flowId,
          user_id: finalUserId,
        }
      });

      console.log("[Verify] Handshake SUCCESSFUL.");

      const callback = `https://cloud.arcade.dev/api/v1/oauth/callback?flow_id=${flowId}&status=approved`;
      return NextResponse.redirect(callback);

    } catch (error: any) {
      console.error("[Verify] Handshake FAILED:", error.message);
      
      return NextResponse.json({ 
        error: "User ID Mismatch (coordinator_error)",
        why: "Arcade is rejecting the confirmation. This happens when the ID we send doesn't match the one that started the flow.",
        
        diagnostics: {
          recommendation: xUserId 
            ? `We detected X-User-Id header: ${xUserId}. We used it, but Arcade still rejected it. Check if your API Key is correct for this project.`
            : `No X-User-Id header found. We used fallback: ${finalUserId}. Double-check your Arcade Dashboard > User Verification > 'User ID for testing'.`,
          
          tried_to_confirm_user: finalUserId,
          flow_id: flowId,
          inbound_headers: allHeaders, // This will help us find if X-User-Id is present
          inbound_params: allParams,
          raw_error: error.message
        }
      }, { status: 400 });
    }
  }

  return NextResponse.json({
    status: "active",
    message: "Arcade Verifier is ready.",
    debug: {
      has_key: !!process.env.ARCADE_API_KEY,
      detected_x_user_id: xUserId || "none"
    }
  });
}