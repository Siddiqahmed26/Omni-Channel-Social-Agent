import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);

  const flowId = url.searchParams.get("flow_id");
  const userId = url.searchParams.get("user_id");

  // ⭐ Arcade verifier TEST flow
  if (flowId) {
    // Arcade expects redirect back to their callback
    const callback = `https://cloud.arcade.dev/api/v1/oauth/callback?flow_id=${flowId}&status=approved`;
    return NextResponse.redirect(callback);
  }

  // ⭐ Real multi-user auth flow
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
