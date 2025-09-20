import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export type UserRole = "admin" | "manager" | "operator" | "inventory_manager"; // Updated enum values

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

    // admin always has access (updated to lowercase)
    if (userRole === "admin" || allowedRoles.includes(userRole)) {
      return handler(req, res);
    }

    return res.status(403).json({ error: "Insufficient permissions" });
  });
}

// Role-based permissions helper
export const permissions = {
  // Manufacturing Orders
  canCreateMO: (role: UserRole) => ["admin", "manager"].includes(role),
  canViewMO: (role: UserRole) => ["admin", "manager", "operator", "inventory_manager"].includes(role),
  canEditMO: (role: UserRole) => ["admin", "manager"].includes(role),
  canDeleteMO: (role: UserRole) => ["admin"].includes(role),

  // Work Orders
  canCreateWO: (role: UserRole) => ["admin", "manager"].includes(role),
  canViewWO: (role: UserRole) => ["admin", "manager", "operator"].includes(role),
  canEditWO: (role: UserRole) => ["admin", "manager", "operator"].includes(role),
  canDeleteWO: (role: UserRole) => ["admin", "manager"].includes(role),

  // Products & BOM
  canCreateProduct: (role: UserRole) => ["admin", "manager"].includes(role),
  canViewProduct: (role: UserRole) => ["admin", "manager", "operator", "inventory_manager"].includes(role),
  canEditProduct: (role: UserRole) => ["admin", "manager"].includes(role),
  canDeleteProduct: (role: UserRole) => ["admin"].includes(role),

  // Stock Management
  canViewStock: (role: UserRole) => ["admin", "manager", "inventory_manager"].includes(role),
  canManualStockAdjustment: (role: UserRole) => ["admin", "inventory_manager"].includes(role),

  // User Management
  canManageUsers: (role: UserRole) => ["admin"].includes(role),
  canViewUsers: (role: UserRole) => ["admin", "manager"].includes(role),

  // Reports
  canViewReports: (role: UserRole) => ["admin", "manager", "inventory_manager"].includes(role),
  canExportReports: (role: UserRole) => ["admin", "manager"].includes(role),
};