# Manufacturing Flow Management System

**Team Name:** Fullmetal Hackmists

## Team Members
1. Shashank Padanad
2. Ishan Gupta
3. Maurya C R
4. Mohit Patil

## Problem Statement
**Problem Statement 1:** Manufacturing - From Order to Output, All in One Flow

## Project Overview
This project aims to create a comprehensive manufacturing management system that streamlines the entire production process from initial order placement to final output delivery.

## Features
- Order management and tracking
- Production planning and scheduling
- Inventory management
- Quality control monitoring
- Real-time progress tracking
- Automated reporting and analytics

## Technology Stack

## Security & Auth

The app uses session-based authentication powered by NextAuth with JWT-backed secure cookies. Hardening includes:

- Strict cookie settings (httpOnly, secure in prod, sameSite=lax) and short maxAge with rotation
- Global middleware `middleware.ts` enforcing authentication and admin-only routes (`/admin`, `/api/admin`)
- Basic CSRF protection for non-idempotent API routes by requiring same-origin
- Security headers on all routes (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- Server-side guards (`lib/server-auth.ts`) for App Router pages and API handlers
- Policy-aware access layer (`lib/policy-prisma.ts`) to avoid over-fetching and to enforce owner/role constraints

Content Security Policy (CSP):

- A global CSP is enforced via `middleware.ts` using the `Content-Security-Policy` header.
- Defaults:
	- `default-src 'self'`; `frame-ancestors 'none'`; `base-uri 'none'`; `object-src 'none'`
	- `script-src 'self' https://vitals.vercel-insights.com` plus `'unsafe-inline'` in prod and `'unsafe-inline' 'unsafe-eval'` in dev for Next.js.
	- `style-src 'self' 'unsafe-inline'` (Tailwind/CSS-in-JS needs inline styles).
	- `img-src 'self' https: data: blob:`; `font-src 'self' data:`; `media-src 'self' blob:`; `connect-src 'self' https://vitals.vercel-insights.com ws: wss:`.
- If you add third-party scripts or resources (maps, analytics, fonts), update the allowlists in `middleware.ts` accordingly.
- For maximum strictness, wire up script nonces/hashes and remove `'unsafe-inline'` in production. Next.js supports nonces via `headers()`/`next/script` with `nonce` attributes; adopt that if you can budget the change.

Environment variables required:

See `.env.example` and set `NEXTAUTH_SECRET` and `DATABASE_URL`.

### Session cookies

- Sessions are cookie-based using NextAuth JWT cookies.
- Cookie name: `next-auth.session-token` (dev) / `__Secure-next-auth.session-token` (prod).
- Flags: `httpOnly`, `sameSite=lax`, `secure` in production.
- Lifetime: 8h maxAge with 30m rolling update window.
- Rotation: Tokens are rotated on sign-in and periodically to reduce theft impact.
## Installation
```bash
# Installation instructions will be added as the project develops
```

## Usage
```bash
# Usage instructions will be added as the project develops
```

## Admin step-up authentication

For sensitive `/admin` pages, a recent password check is required even if you have a valid session cookie. When an admin navigates to any `/admin` route, they'll be redirected to `/auth/admin-verify` to re-enter their password. On success, a short-lived httpOnly cookie is set and access is granted for ~10 minutes. Closing the browser or waiting past that window will require re-verification.

Environment requirements:
- Ensure `NEXTAUTH_SECRET` is set. It is used to sign the reauth cookie.

## Project Structure
```
# Project structure will be updated as development progresses
```

