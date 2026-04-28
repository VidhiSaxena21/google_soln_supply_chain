# ChainTrack

ChainTrack is a supply-chain transparency platform for informal and small-scale logistics. It is designed for the kinds of deliveries that still run on calls, chat messages, and verbal promises, where pricing is unclear, agreements are weak, and accountability often disappears once the shipment is in motion.

## The Problem

In local logistics and small-scale transport, users often face:

- Opaque pricing and hidden fees
- Verbal agreements with no durable proof
- Weak accountability across pickup, transit, and completion
- Limited recourse when a dispute or unsafe interaction happens

## The Solution

ChainTrack acts as a digital trust layer between customers and providers by giving both sides:

- Transparent starting prices
- Structured request posting
- Digital agreements with dual signing
- Delivery status tracking
- Notifications, ratings, and dispute support

## Core Product Flow

1. A customer creates a delivery or transport request.
2. ChainTrack estimates a fair starting price.
3. A provider accepts the job.
4. Both sides sign a digital agreement with route and agreed amount.
5. Delivery status updates create a shared timeline.
6. The job ends with rating feedback or dispute handling if needed.

## Monorepo Structure

- `artifacts/chaintrack`: React + Vite frontend
- `artifacts/api-server`: Express API server
- `lib/db`: Drizzle ORM schema and database access
- `lib/api-spec`: OpenAPI contract
- `lib/api-client-react`: Generated React Query client
- `lib/api-zod`: Generated Zod schemas

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, TanStack Query, Wouter
- Backend: Express 5, JWT auth, Pino logging
- Database: PostgreSQL, Drizzle ORM
- Contract tooling: OpenAPI, generated API client, Zod validation

## Demo Accounts

- Customer: `customer@demo.com` / `demo123`
- Provider: `provider@demo.com` / `demo123`

## Local Setup

### Prerequisites

- Node.js
- pnpm
- PostgreSQL

### Required environment variables

- `DATABASE_URL`
- `PORT`
- `SESSION_SECRET`

### Suggested workflow

1. Install workspace dependencies with `pnpm install`
2. Push the database schema with `pnpm --filter @workspace/db run push`
3. Seed demo data by running [seed.ts](G:\projects\google_soln_supply_chain\artifacts\api-server\src\seed.ts) with your preferred TypeScript runner
4. Start the frontend with `pnpm --filter @workspace/chaintrack run dev`
5. Build the API server with `pnpm --filter @workspace/api-server run build`, then start it with `PORT` set in your environment

## Why This Project Matters

ChainTrack is not trying to replace every enterprise supply-chain system. It targets the messy middle where informal logistics still power real commerce, but trust is fragile. The goal is to reduce exploitation, confusion, and avoidable disputes by making pricing, agreements, and delivery accountability visible from the start.
