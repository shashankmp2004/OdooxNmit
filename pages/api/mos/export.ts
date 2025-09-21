import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { NextApiRequest, NextApiResponse } from "next";
import XLSX from "xlsx";

function mapStatus(status?: string) {
  if (!status || status === "all") return undefined;
  switch (status.toLowerCase()) {
    case "planned":
      return "PLANNED";
    case "in-progress":
      return "IN_PROGRESS";
    case "completed":
      return "DONE";
    case "cancelled":
      return "CANCELED";
    default:
      return undefined;
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end();
  }

  const status = (req.query.status as string) || "all"; // planned | in-progress | completed | delayed | cancelled | all
  const search = (req.query.search as string) || undefined;
  const startDate = (req.query.startDate as string) || undefined;
  const endDate = (req.query.endDate as string) || undefined;

  const where: any = {};

  // Status mapping including special case for "delayed"
  if (status && status !== "all") {
    if (status === "delayed") {
      // Consider delayed as past-deadline and not done
      where.AND = [
        { OR: [{ deadline: { lt: new Date() } }, { deadline: null }] },
        { NOT: { state: "DONE" } },
      ];
    } else {
      const mapped = mapStatus(status);
      if (mapped) where.state = mapped;
    }
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { orderNo: { contains: search, mode: "insensitive" } },
      { product: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (startDate || endDate) {
    where.createdAt = {} as any;
    if (startDate) (where.createdAt as any).gte = new Date(startDate);
    if (endDate) (where.createdAt as any).lte = new Date(endDate);
  }

  const mos = await prisma.manufacturingOrder.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { name: true } },
      createdBy: { select: { name: true, email: true } },
      _count: { select: { workOrders: true } },
    },
  });

  // Compute completed work orders per MO
  const rows: Array<Record<string, any>> = [];
  for (const mo of mos) {
    const completedWorkOrders = await prisma.workOrder.count({
      where: { moId: mo.id, status: "COMPLETED" as any },
    });
    const totalWorkOrders = mo._count.workOrders || 0;
    const completionPct = totalWorkOrders > 0 ? Math.round((completedWorkOrders / totalWorkOrders) * 100) : 0;

    rows.push({
      "Order No": mo.orderNo,
      "Name": mo.name,
      "Product": mo.product?.name ?? "",
      "Quantity": mo.quantity,
      "Status": mo.state,
      "Deadline": mo.deadline ? new Date(mo.deadline).toISOString() : "",
      "Created At": mo.createdAt ? new Date(mo.createdAt).toISOString() : "",
      "Updated At": mo.updatedAt ? new Date(mo.updatedAt).toISOString() : "",
      "Created By": mo.createdBy?.name || mo.createdBy?.email || "",
      "Work Orders": totalWorkOrders,
      "Completed WOs": completedWorkOrders,
      "Completion %": completionPct,
    });
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Manufacturing Orders");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="manufacturing-orders-${Date.now()}.xlsx"`
  );
  return res.status(200).send(buf);
}

export default requireRole(["ADMIN", "MANAGER"], handler);
