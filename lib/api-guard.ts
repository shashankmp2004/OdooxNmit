import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { NextResponse, NextRequest } from "next/server";
import { withSecurityHeaders } from "./security-headers";

export async function requireApiAuth(_req?: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return withSecurityHeaders(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );
  }
  return session;
}

export async function requireApiRole(roles: string[], _req?: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: withSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 })) } as const;
  }
  const role = session.user?.role;
  if (role !== "ADMIN" && !roles.includes(role as string)) {
    return { error: withSecurityHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 })) } as const;
  }
  return { session } as const;
}
