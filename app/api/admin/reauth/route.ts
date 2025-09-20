import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Create a short-lived, signed cookie that proves the user recently
// re-entered their password. Middleware will verify this cookie.
const COOKIE_NAME = "admin_reauth";
const TTL_SECONDS = 10 * 60; // 10 minutes

function base64url(input: Buffer | Uint8Array) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { password } = await req.json().catch(() => ({ password: undefined }));
  if (!password) {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !user.password) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  // Sign the payload using HMAC-SHA256 with NEXTAUTH_SECRET
  const secret = process.env.NEXTAUTH_SECRET || "";
  if (!secret) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const ts = Math.floor(Date.now() / 1000).toString();
  const payload = `${user.id}.${ts}`;

  // Node runtime here - use built-in crypto for HMAC
  const { createHmac } = await import("crypto");
  const sig = createHmac("sha256", secret).update(payload).digest();
  const value = `${payload}.${base64url(sig)}`;

  const res = NextResponse.json({ success: true });
  res.cookies.set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_SECONDS,
  });
  return res;
}
