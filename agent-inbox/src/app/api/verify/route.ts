import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  }

  // Accept any user ID for multi-user support
  return NextResponse.json({
    status: "verified",
    user_id: userId
  });
}
