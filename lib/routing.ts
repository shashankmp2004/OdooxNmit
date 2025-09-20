import { prisma } from "./prisma";

// Simple routing definition by product. In a real system, store this in DB.
// Default route works for most finished goods: Cutting -> Assembly -> Painting
const DEFAULT_ROUTE = ["Cutting", "Assembly", "Painting"] as const;

export type RouteStep = string;

export async function getRoutingForProduct(productId: string): Promise<RouteStep[]> {
  // TODO: If you later add product-specific routing in DB, fetch it here.
  // For now, return default route for any finished product.
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { isFinished: true } });
  if (product?.isFinished) return [...DEFAULT_ROUTE];
  // For raw/semi-finished, no routing
  return [];
}

export async function resolveWorkCenterIdByName(name: string): Promise<string | null> {
  const wc = await prisma.workCenter.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    select: { id: true }
  });
  return wc?.id ?? null;
}

export function findStepIndex(route: string[], currentName?: string | null): number {
  if (!currentName) return -1;
  const idx = route.findIndex(s => s.toLowerCase() === currentName.toLowerCase());
  return idx;
}
