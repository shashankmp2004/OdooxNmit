import { prisma } from "./prisma";
import type { Session } from "next-auth";

// Wraps common queries with role/ownership constraints
export const policy = {
  mo: {
    // Managers/Admins can see all; Operators see only assigned via WOs; Inventory read-only access via product relation
    async list(session: Session, params: Parameters<typeof prisma.manufacturingOrder.findMany>[0] = {}) {
      const role = session.user?.role;
      let where = params.where ?? {};

      if (role === "ADMIN" || role === "MANAGER") {
        // no extra restrictions
      } else if (role === "OPERATOR") {
        where = {
          ...where,
          workOrders: {
            some: { assignedToId: session.user?.id },
          },
        } as any;
      } else if (role === "INVENTORY") {
        // Inventory can view all MOs but read-only; list is unrestricted here
      }

      return prisma.manufacturingOrder.findMany({ ...params, where });
    },
  },
  wo: {
    async list(session: Session, params: Parameters<typeof prisma.workOrder.findMany>[0] = {}) {
      const role = session.user?.role;
      let where = params.where ?? {};
      if (role === "ADMIN" || role === "MANAGER") {
        // unrestricted
      } else if (role === "OPERATOR") {
        where = { ...where, assignedToId: session.user?.id } as any;
      } else if (role === "INVENTORY") {
        // Inventory has no direct work order access by default
        where = { ...where, id: "__none__" } as any;
      }
      return prisma.workOrder.findMany({ ...params, where });
    },
  },
};
