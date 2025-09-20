import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { redirect } from "next/navigation";

export async function requireServerSession() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth");
  return session;
}

export async function requireRole(roles: Array<"ADMIN" | "MANAGER" | "OPERATOR" | "INVENTORY">) {
  const session = await requireServerSession();
  if (session.user?.role === "ADMIN") return session; // superuser
  if (!roles.includes(session.user?.role as any)) redirect("/dashboard");
  return session;
}
