# ChainTrack — Supply Chain Transparency Platform

## Overview

Full-stack supply chain transparency platform for informal/small-scale logistics (local delivery, e-rickshaw transport). Built as a hackathon-ready demo with dual-role auth, smart pricing, digital agreements, live tracking, ratings, and dispute resolution.

## Tech Stack

- **Monorepo**: pnpm workspaces
- **Frontend**: React + Vite + Tailwind CSS (dark indigo theme) — `artifacts/chaintrack`
- **Backend**: Express 5 + JWT auth — `artifacts/api-server`
- **Database**: PostgreSQL + Drizzle ORM — `lib/db`
- **API Contract**: OpenAPI spec → Orval codegen (React Query hooks + Zod schemas)
- **Auth**: JWT (bcrypt passwords, Bearer tokens in localStorage key `chaintrack_token`)

## Key Features

- **Dual-role**: Customer (creates requests) / Provider (accepts jobs)
- **Smart Pricing**: Base fare + distance rate + 10% service fee by service type
- **Digital Agreements**: Both-party signing flow (customer + provider must sign)
- **Live Tracking**: Status timeline with provider status updates
- **Ratings & Reviews**: Star ratings post-completion
- **Dispute Resolution**: Raise disputes with reason/description, admin review flow
- **Role-aware Dashboards**: Customer spending stats / Provider earnings stats

## Demo Accounts

- Customer: `customer@demo.com` / `demo123`
- Provider: `provider@demo.com` / `demo123`

## Key Files

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/` — Drizzle schema (7 tables)
- `artifacts/api-server/src/routes/` — Express routes
- `artifacts/api-server/src/lib/auth.ts` — JWT middleware
- `artifacts/chaintrack/src/App.tsx` — Frontend router + ProtectedRoute
- `artifacts/chaintrack/src/lib/auth-context.tsx` — Auth state
- `artifacts/chaintrack/src/index.css` — Dark theme CSS variables

## Dev Commands

- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks/Zod from OpenAPI
- `pnpm --filter @workspace/db run push` — push DB schema changes
- `pnpm --filter @workspace/chaintrack run typecheck` — typecheck frontend

## Workflow Notes

- Frontend uses `dev:serve` script (build + static serve on port 3000) for stable port detection
- Backend serves on port 8080, all routes prefixed with `/api`
- JWT secret from `SESSION_SECRET` env var (fallback: `chaintrack-secret-key`)

## API Pricing Formula

```
delivery:  base=₹15, rate=₹3/km, fee=10% of base
transport: base=₹30, rate=₹5/km, fee=10% of base
logistics: base=₹50, rate=₹8/km, fee=10% of base
total = baseFare + distanceKm * rate + serviceFee
```
