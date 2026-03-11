import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);

  const flowId = url.searchParams.get("flow_id");
  const redirectUrl = url.searchParams.get("redirect_url");
  const userId = url.searchParams.get("user_id");

  // Arcade verifier test flow
  if (flowId && redirectUrl) {
    return NextResponse.redirect(redirectUrl);
  }

  // Real multi-user auth flow
  if (userId) {
    return NextResponse.json({
      status: "verified",
      user_id: userId,
    });
  }

  return NextResponse.json(
    { error: "Invalid verifier request" },
    { status: 400 }
  );
}
