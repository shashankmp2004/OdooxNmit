import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Admin reauth no longer required" }, { status: 404 });
}
