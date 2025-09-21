// Lightweight in-memory rate limiter for Next.js API routes
// Note: Suitable for single-instance deployments or dev. For distributed setups, replace with Redis or similar.

import type { NextApiRequest, NextApiResponse } from "next";

type Bucket = {
  count: number;
  resetAt: number; // epoch ms
};

type Store = Map<string, Bucket>;

declare global {
  // eslint-disable-next-line no-var
  var __rateLimitStore: Store | undefined;
}

const store: Store = global.__rateLimitStore || new Map();
if (!global.__rateLimitStore) {
  global.__rateLimitStore = store;
}

export function getClientIp(req: NextApiRequest): string {
  // Prefer X-Forwarded-For when behind proxies; fall back to socket address
  const fwd = (req.headers["x-forwarded-for"] || "") as string;
  const ip = fwd ? fwd.split(",")[0].trim() : (req.socket as any)?.remoteAddress || "unknown";
  return ip;
}

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    const bucket: Bucket = { count: 1, resetAt: now + windowMs };
    store.set(key, bucket);
    return { allowed: true, remaining: Math.max(0, limit - 1), resetAt: bucket.resetAt };
  }
  if (entry.count < limit) {
    entry.count += 1;
    return { allowed: true, remaining: Math.max(0, limit - entry.count), resetAt: entry.resetAt };
  }
  return { allowed: false, remaining: 0, resetAt: entry.resetAt };
}

export function rateLimitResponse(res: NextApiResponse, remaining: number, resetAt: number) {
  res.setHeader("X-RateLimit-Remaining", String(remaining));
  res.setHeader("X-RateLimit-Reset", String(Math.floor(resetAt / 1000)));
  if (remaining <= 0) {
    const retryAfter = Math.max(0, Math.ceil((resetAt - Date.now()) / 1000));
    res.setHeader("Retry-After", String(retryAfter));
  }
}
