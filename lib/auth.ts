import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export type UserRole = "ADMIN" | "MANAGER" | "OPERATOR" | "INVENTORY";

export interface AuthenticatedRequest extends NextApiRequest {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
}

export function requireAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<any>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const authenticatedReq = req as AuthenticatedRequest;
    authenticatedReq.user = {
      id: session.user.id,
      email: session.user.email!,
      name: session.user.name!,
      role: session.user.role as UserRole,
    };

    return handler(authenticatedReq, res);
  };
}

export function requireRole(
  roles: UserRole | UserRole[],
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<any>
) {
  return requireAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    // ADMIN always has access
    if (userRole === "ADMIN" || allowedRoles.includes(userRole)) {
      return handler(req, res);
    }

    return res.status(403).json({ error: "Insufficient permissions" });
  });
}

// Role-based permissions helper
export const permissions = {
  // Manufacturing Orders
  canCreateMO: (role: UserRole) => ["ADMIN", "MANAGER"].includes(role),
  canViewMO: (role: UserRole) => ["ADMIN", "MANAGER", "OPERATOR", "INVENTORY"].includes(role),
  canEditMO: (role: UserRole) => ["ADMIN", "MANAGER"].includes(role),
  canDeleteMO: (role: UserRole) => ["ADMIN"].includes(role),

  // Work Orders
  canCreateWO: (role: UserRole) => ["ADMIN", "MANAGER"].includes(role),
  canViewWO: (role: UserRole) => ["ADMIN", "MANAGER", "OPERATOR"].includes(role),
  canEditWO: (role: UserRole) => ["ADMIN", "MANAGER", "OPERATOR"].includes(role),
  canDeleteWO: (role: UserRole) => ["ADMIN", "MANAGER"].includes(role),

  // Products & BOM
  canCreateProduct: (role: UserRole) => ["ADMIN", "MANAGER"].includes(role),
  canViewProduct: (role: UserRole) => ["ADMIN", "MANAGER", "OPERATOR", "INVENTORY"].includes(role),
  canEditProduct: (role: UserRole) => ["ADMIN", "MANAGER"].includes(role),
  canDeleteProduct: (role: UserRole) => ["ADMIN"].includes(role),

  // Stock Management
  canViewStock: (role: UserRole) => ["ADMIN", "MANAGER", "INVENTORY"].includes(role),
  canManualStockAdjustment: (role: UserRole) => ["ADMIN", "INVENTORY"].includes(role),

  // User Management
  canManageUsers: (role: UserRole) => ["ADMIN"].includes(role),
  canViewUsers: (role: UserRole) => ["ADMIN", "MANAGER"].includes(role),

  // Reports
  canViewReports: (role: UserRole) => ["ADMIN", "MANAGER", "INVENTORY"].includes(role),
  canExportReports: (role: UserRole) => ["ADMIN", "MANAGER"].includes(role),
};