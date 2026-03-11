import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);

  const flowId = url.searchParams.get("flow_id");
  const userId = url.searchParams.get("user_id");

  // Arcade sends flow_id during verification test
  if (flowId) {
    return NextResponse.redirect(
      `https://cloud.arcade.dev/api/v1/oauth/verify?flow_id=${flowId}&status=approved`
    );
  }

  // During real auth it sends user_id
  if (userId) {
    return NextResponse.json({
      status: "verified",
      user_id: userId,
    });
  }

  return NextResponse.json({ error: "Invalid verification request" }, { status: 400 });
}
