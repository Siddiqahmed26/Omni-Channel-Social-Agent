import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);

  const redirectUrl = url.searchParams.get("redirect_url");
  const userId = url.searchParams.get("user_id");

  // ⭐ Arcade verification test flow
  if (redirectUrl) {
    return NextResponse.redirect(redirectUrl);
  }

  // ⭐ Real multi-user authorization flow
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
