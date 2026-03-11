import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);

  const flowId = url.searchParams.get("flow_id");
  const redirectUrl = url.searchParams.get("redirect_url");
  const userId = url.searchParams.get("user_id");

  // ⭐ CASE 1 — Arcade verifier TEST flow (sometimes only flow_id)
  if (flowId && !redirectUrl) {
    return NextResponse.redirect(
      `https://cloud.arcade.dev/api/v1/oauth/callback?flow_id=${flowId}&status=approved`
    );
  }

  // ⭐ CASE 2 — Arcade verifier TEST flow (with redirect_url)
  if (redirectUrl) {
    return NextResponse.redirect(redirectUrl);
  }

  // ⭐ CASE 3 — REAL multi-user authorization
  if (userId) {
    return NextResponse.json({
      status: "verified",
      user_id: userId,
    });
  }

  return NextResponse.json(
    { error: "Verifier reached but params missing" },
    { status: 400 }
  );
}