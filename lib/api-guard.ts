import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { NextResponse } from "next/server";
import { withSecurityHeaders } from "./security-headers";

type ApiGuardError = NextResponse;

export async function requireApiAuth() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return withSecurityHeaders(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    ) as ApiGuardError;
  }
  return session;
}

export async function requireApiRole(roles: string[]) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: withSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 })) as ApiGuardError } as const;
  }
  const role = session.user?.role as string | undefined;
  if (role !== "ADMIN" && (!role || !roles.includes(role))) {
    return { error: withSecurityHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 })) as ApiGuardError } as const;
  }
  return { session } as const;
}
