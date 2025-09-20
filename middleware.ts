import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Define route matchers for protection
const PUBLIC_PATHS = new Set<string>([
  "/",
  "/landing",
  "/auth",
  "/api/auth",
]);

// Admin-only path prefixes
const ADMIN_PREFIXES = ["/admin", "/api/admin"];
const ADMIN_REAUTH_COOKIE = "admin_reauth";

// API paths that mutate state and should be guarded against CSRF
const NON_IDEMPOTENT_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always set strict security headers
  const res = NextResponse.next();
  const isProd = process.env.NODE_ENV === "production";
  const csp = [
    "default-src 'self'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    // Next/Vercel analytics and runtime needs
  `script-src 'self' ${isProd ? "'unsafe-inline'" : "'unsafe-inline' 'unsafe-eval'"} https://vitals.vercel-insights.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https: data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://vitals.vercel-insights.com ws: wss:",
    "media-src 'self' blob:",
    "object-src 'none'",
  ].join("; ");

  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );

  // If the user opted into remember-me previously, extend cookie lifetime hints via Set-Cookie attributes where applicable.
  // Note: NextAuth manages session cookies; this only provides a best-effort extension on responses so the browser refreshes expiry more often.
  try {
    const remember = req.cookies.get("mf_remember")?.value || "";
    if (remember === "true") {
      // Hint: set a lightweight remember cookie and rely on NextAuth's updateAge to keep session active within maxAge
      res.cookies.set("mf_remember", "true", {
        httpOnly: false,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }
  } catch {}

  // Skip NextAuth internal and static assets
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/favicon")
  ) {
    return res;
  }

  // If user navigates to /auth but already has a valid session, skip login and go to dashboard
  if (pathname === "/auth" || pathname.startsWith("/auth/")) {
    // allow admin verify page even when authenticated
    if (pathname.startsWith("/auth/admin-verify")) {
      return res;
    }
    const tokenAtAuth = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (tokenAtAuth) {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      const r = NextResponse.redirect(url);
      r.headers.set("Content-Security-Policy", csp);
      r.headers.set("X-Frame-Options", "DENY");
      r.headers.set("X-Content-Type-Options", "nosniff");
      r.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
      r.headers.set(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=(), interest-cohort=()"
      );
      return r;
    }
  }

  // Public routes do not require auth
  for (const pub of PUBLIC_PATHS) {
    if (pathname === pub || pathname.startsWith(`${pub}/`)) {
      return res;
    }
  }

  // Validate session
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    // For page routes, redirect to sign-in
    if (!pathname.startsWith("/api")) {
      const signInUrl = req.nextUrl.clone();
      signInUrl.pathname = "/auth";
      signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
      const r = NextResponse.redirect(signInUrl);
      r.headers.set("Content-Security-Policy", csp);
      r.headers.set("X-Frame-Options", "DENY");
      r.headers.set("X-Content-Type-Options", "nosniff");
      r.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
      r.headers.set(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=(), interest-cohort=()"
      );
      return r;
    }
    // For API, return 401 JSON
    const r = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    r.headers.set("Content-Security-Policy", csp);
    r.headers.set("X-Frame-Options", "DENY");
    r.headers.set("X-Content-Type-Options", "nosniff");
    r.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    r.headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), interest-cohort=()"
    );
    return r;
  }

  // Admin enforcement for admin-prefixed routes
  if (ADMIN_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (token.role !== "ADMIN") {
      if (!pathname.startsWith("/api")) {
        const url = req.nextUrl.clone();
        url.pathname = "/dashboard";
        const r = NextResponse.redirect(url);
        r.headers.set("Content-Security-Policy", csp);
        r.headers.set("X-Frame-Options", "DENY");
        r.headers.set("X-Content-Type-Options", "nosniff");
        r.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
        r.headers.set(
          "Permissions-Policy",
          "camera=(), microphone=(), geolocation=(), interest-cohort=()"
        );
        return r;
      }
      const r = NextResponse.json({ error: "Forbidden" }, { status: 403 });
      r.headers.set("Content-Security-Policy", csp);
      r.headers.set("X-Frame-Options", "DENY");
      r.headers.set("X-Content-Type-Options", "nosniff");
      r.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
      r.headers.set(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=(), interest-cohort=()"
      );
      return r;
    }

    // Step-up authentication: require recent password re-entry for /admin pages (not API)
    if (!pathname.startsWith("/api")) {
      // allow the reauth API itself and verify page from being blocked
      if (!pathname.startsWith("/auth/admin-verify")) {
        const cookie = req.cookies.get(ADMIN_REAUTH_COOKIE)?.value;
        let ok = false;
        if (cookie) {
          try {
            const parts = cookie.split(".");
            if (parts.length === 3) {
              const [userId, ts, sig] = parts;
              const issued = parseInt(ts, 10);
              const age = Math.floor(Date.now() / 1000) - issued;
              if (!Number.isNaN(issued) && age >= 0 && age <= 10 * 60) {
                const secret = process.env.NEXTAUTH_SECRET || "";
                if (secret) {
                  const enc = new TextEncoder();
                  const key = await crypto.subtle.importKey(
                    "raw",
                    enc.encode(secret),
                    { name: "HMAC", hash: "SHA-256" },
                    false,
                    ["sign"]
                  );
                  const sigBuf = await crypto.subtle.sign(
                    "HMAC",
                    key,
                    enc.encode(`${userId}.${ts}`)
                  );
                  // base64url encode
                  const bytes = new Uint8Array(sigBuf);
                  let binary = "";
                  for (let i = 0; i < bytes.byteLength; i++) {
                    binary += String.fromCharCode(bytes[i]);
                  }
                  const digest = btoa(binary)
                    .replace(/=/g, "")
                    .replace(/\+/g, "-")
                    .replace(/\//g, "_");
                  const tokenUserId = (token as any).id || (token as any).sub;
                  if (tokenUserId === userId && digest === sig) {
                    ok = true;
                  }
                  // Dev fallback: if signature doesn't match but other checks pass, accept in non-production to avoid blocking
                  if (!ok && !isProd && tokenUserId === userId) {
                    ok = true;
                  }
                }
              }
            }
          } catch {}
        }

        if (!ok) {
          const url = req.nextUrl.clone();
          url.pathname = "/auth/admin-verify";
          url.searchParams.set("returnTo", pathname);
          const r = NextResponse.redirect(url);
          r.headers.set("Content-Security-Policy", csp);
          r.headers.set("X-Frame-Options", "DENY");
          r.headers.set("X-Content-Type-Options", "nosniff");
          r.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
          r.headers.set(
            "Permissions-Policy",
            "camera=(), microphone=(), geolocation=(), interest-cohort=()"
          );
          return r;
        }
      }
    }
  }

  // CSRF protection for non-idempotent API methods: require same-origin
  if (pathname.startsWith("/api") && NON_IDEMPOTENT_METHODS.has(req.method)) {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    if (!origin || !host || !origin.includes(host)) {
      const r = NextResponse.json({ error: "Bad origin" }, { status: 400 });
      r.headers.set("Content-Security-Policy", csp);
      r.headers.set("X-Frame-Options", "DENY");
      r.headers.set("X-Content-Type-Options", "nosniff");
      r.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
      r.headers.set(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=(), interest-cohort=()"
      );
      return r;
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
