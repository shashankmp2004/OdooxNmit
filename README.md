# NMITxODOO Team80 Monorepo

This repository is organized as a monorepo with separate frontend and backend workspaces.

## Structure

- `frontend/OdooxNmit-main/` — Next.js 14+ app (your team's provided frontend)
- `backend/` — Node.js Express + Prisma backend API
- `prisma/` — Prisma schema and seed scripts (shared by backend)
- `.env` — Environment variables (used by backend and Prisma)

## Getting Started

### 1. Install dependencies (from repo root)

```bash
npm install
```

### 2. Set up the database

- Ensure PostgreSQL is running and the connection string in `.env` is correct.
- Run migrations and seed the database:

```bash
npm run db:migrate
npm run db:seed
```

### 3. Start development servers

- To start both backend and frontend (Windows):

```bash
npm run dev
```

- Or start individually:

```bash
npm run dev:backend
npm run dev:frontend
```

  - Backend: http://localhost:4000
  - Frontend: http://localhost:3000

### 4. API Integration

- The frontend proxies `/api/*` requests to the backend automatically in development.

## Useful Scripts

- `npm run db:migrate` — Run Prisma migrations
- `npm run db:seed` — Seed the database
- `npm run prisma:studio` — Open Prisma Studio (DB GUI)
- `npm run build` — Build both frontend and backend

## Notes

- Remove any empty or obsolete files in `src/app` and root-level Next.js config files if you wish.
- All backend environment variables should be placed in the root `.env` file.

---

For any issues, check the logs in the terminal for errors during install or startup.
