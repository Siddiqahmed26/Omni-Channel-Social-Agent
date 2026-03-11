import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);

  const flowId = url.searchParams.get("flow_id");
  const redirectUrl = url.searchParams.get("redirect_url") || url.searchParams.get("redirect_uri");
  const userId = url.searchParams.get("user_id") || url.searchParams.get("userId");

  // 1. Arcade verifier test flow (Dashboard "Run Test")
  if (flowId) {
    if (redirectUrl) {
      return NextResponse.redirect(redirectUrl);
    }
    // If no redirect_url is provided, return a success status that Arcade can potentially read
    return NextResponse.json({
      status: "approved",
      flow_id: flowId,
      message: "Custom verifier active. Redirect URL missing from request."
    });
  }

  // 2. Real multi-user auth flow
  if (userId) {
    return NextResponse.json({
      status: "verified",
      user_id: userId,
    });
  }

  // 3. User manually visiting the URL to check if it's up
  return NextResponse.json({
    message: "Omni-Channel Social Agent - Arcade Verification Endpoint",
    status: "active",
    usage: "This endpoint is used internally by Arcade.dev for user verification.",
    received_params: Object.fromEntries(url.searchParams)
  });
}
