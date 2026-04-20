# RumaCare

Home-services platform connecting customers with on-demand care, cleaning, nanny, tuition, and home-services workers across Malaysia.

A monorepo containing:

| App | Path | Stack | Audience |
|-----|------|-------|----------|
| Backend API | [`apps/backend`](apps/backend) | NestJS · Prisma · PostgreSQL | Internal |
| Admin Portal | [`apps/admin-web`](apps/admin-web) | Next.js · Tailwind | Admin operators |
| Customer App | [`apps/customer-app`](apps/customer-app) | Expo React Native | End customers |
| Worker App | [`apps/worker-app`](apps/worker-app) | Expo React Native | Workers / partners |
| Shared types | [`packages/shared`](packages/shared) | TypeScript | Internal |

## Features

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full feature matrix and data model.

Top-level capabilities:

- **6 service categories**: Home Personal & Nursing Care, Cleaning, Nanny, Tuition, Home Services (Yellow-Pages style), Be-our-Partner
- **Flexible rate structures** per category: hourly, half-day (AM/PM/Evening), full-day, per-subject, fixed worker-charged fee
- **One-off & recurring bookings** with 2-week renewal prompt and configurable discount
- **Nearest-N worker broadcast dispatch** with automatic recall when one worker accepts
- **Partner registration** with IC/selfie/bank/SSM/Nursing-Cert uploads
- **Ratings, cancellations, tutor-change requests**, weekend/PH multipliers, admin/worker revenue split — all configurable from the Admin Portal

## Prerequisites

- Node.js >= 20
- pnpm 9
- PostgreSQL 15 (or Docker)

## Quick start

```bash
# install deps
pnpm install

# start a Postgres (Docker)
docker run -d --name rumacare-pg -e POSTGRES_PASSWORD=rumacare -e POSTGRES_DB=rumacare -p 5432:5432 postgres:15

# backend
cp apps/backend/.env.example apps/backend/.env
pnpm db:migrate
pnpm db:seed
pnpm dev:backend   # http://localhost:3001

# admin portal
cp apps/admin-web/.env.example apps/admin-web/.env.local
pnpm dev:admin     # http://localhost:3000

# mobile apps (Expo)
pnpm dev:customer  # scan QR
pnpm dev:worker    # scan QR
```

## Seeded admin user

- Email: `admin@rumacare.local`
- Password: `admin123`

## Scripts

| Script | What it does |
|--------|--------------|
| `pnpm typecheck` | Run TypeScript across the whole workspace |
| `pnpm lint` | Run ESLint across the whole workspace |
| `pnpm build` | Build backend + admin |
| `pnpm db:migrate` | Run Prisma migrations |
| `pnpm db:seed` | Seed service types, subjects, home-services, settings, admin user |

## Project layout

```
RumaCare/
├─ apps/
│  ├─ backend/         NestJS + Prisma API
│  ├─ admin-web/       Next.js admin portal
│  ├─ customer-app/    Expo customer mobile app
│  └─ worker-app/      Expo worker mobile app
├─ packages/
│  └─ shared/          Shared TS types & constants
└─ docs/
   └─ ARCHITECTURE.md
```
