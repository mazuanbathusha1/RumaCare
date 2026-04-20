# RumaCare Architecture

## Overview

RumaCare is a Malaysia-focused, on-demand home-services platform. It has three surfaces:

1. **Admin Portal** — web app for operators to manage service types, rates, discounts, multipliers, revenue split, partners, bookings.
2. **Customer Mobile App** — Expo React Native app where customers browse categories and book services.
3. **Worker Mobile App** — Expo React Native app where workers receive, accept, and complete jobs.

All three surfaces are backed by a single NestJS API with a PostgreSQL database.

## Service Categories

| # | Name | Rate model | Bookable | Worker fee |
|---|------|------------|----------|------------|
| 1 | Home Personal & Nursing Care | Hourly (services 1.1–1.8), Half-day/Full-day (1.9–2.0) | One-off + Recurring | Revenue split |
| 2 | Cleaning | Half-day (AM/PM/Evening) or Full-day | One-off | Revenue split |
| 3 | Nanny | Half-day (AM/PM/Evening) or Full-day | One-off | Revenue split |
| 4 | Tuition | Per-subject, Package (4 subjects) | Recurring (monthly) | Revenue split |
| 5 | Home Services | Fixed fee charged to worker on contact-view | Non-bookable — contact listing | Pay-per-view |
| 6 | Be our Partner | — | Registration flow | n/a |

- **Half-day time slots**: AM 08:00–12:00, PM 13:00–17:00, Evening 18:00–22:00.
- **Weekend/PH multiplier**: Applied to Sat, Sun, Public Holidays. Configurable in Admin Settings. Defaults: Sat 1.5×, Sun 1.5×, PH 2×.
- **Revenue split**: Admin vs Worker. Configurable. Default 20 / 80.
- **Discount**: Each category can have a toggleable discount (%) applied when a recurring subscription renews (after 2 weeks of subscription).

## Data Model (Prisma summary)

See [`apps/backend/prisma/schema.prisma`](../apps/backend/prisma/schema.prisma) for the source of truth.

Core entities:

- `User` — base user with a `role` discriminator (`ADMIN`, `CUSTOMER`, `WORKER`).
- `WorkerProfile` — registration details (IC number, address, bank, SSM, Nursing Cert, selfie/IC-copy URLs), linked to one or more categories via `WorkerCategory`.
- `ServiceCategory` — top-level category (1–6 above).
- `ServiceType` — leaf service under a category (e.g. "Wound Care & Dressing Changes"). Holds the rate model and rates per duration:
  - `ratingModel`: `HOURLY` / `HALF_OR_FULL_DAY` / `PER_SUBJECT` / `PACKAGE` / `FIXED_WORKER_FEE`
  - `hourlyRate`, `rateAmSlot`, `ratePmSlot`, `rateEveningSlot`, `rateFullDay`, `workerFeePerView` — only the fields relevant to the rate model are used
  - `discountEnabled`, `discountPercent`
  - `enabled`
- `Subject` — tuition subject list (add/edit/remove).
- `HomeServiceCategory` — yellow-pages sub-category (Gardening, IT, Plumber, etc.).
- `Booking` — a scheduled job. Has category, service type, customer, worker (once accepted), time slot (date + slot enum or start/end), location (lat/lng + address), recurring pattern, renewal state, status.
- `BookingOffer` — dispatch fan-out row. One per (booking, worker) while broadcasting. When a worker accepts, all other offers for the booking are `RECALLED`.
- `RecurringSubscription` — active monthly subscription (cat 1 & 4). Tracks `startDate`, `renewalPromptAt` (start + 14d), `status`.
- `Rating` — customer rating of a completed booking (1–5) with optional comment.
- `HomeServiceContactView` — log of customer viewing a worker's contact details under category 5; each row triggers the `workerFeePerView` charge.
- `Payment` — ledger entry (customer charge, worker payout, worker fee).
- `Settings` — singleton row with `revenueSplitWorkerPercent`, `multiplierSat`, `multiplierSun`, `multiplierPublicHoliday`, `defaultCurrency`.
- `PublicHoliday` — list of MY public holidays (date + name).
- `TutorChangeRequest` — customer's request to change tutor after 1 month.
- `PartnerApplication` — onboarding state, links to uploaded documents.

## API Surface

Grouped by module (see `apps/backend/src/modules/*`):

- `auth` — login (email + password + role), JWT.
- `settings` — get/update revenue split, multipliers, discount defaults.
- `categories` — list 6 categories.
- `service-types` — CRUD; rate updates; enable/disable; discount fields.
- `subjects` — CRUD (tuition subjects).
- `home-services` — CRUD (yellow-pages categories).
- `partners` — partner application submit, list, approve/reject.
- `bookings` — create (one-off/recurring), cancel, accept (worker), complete, rate.
- `offers` — worker receives broadcast, accept endpoint triggers recall of others.
- `subscriptions` — recurring subscription lifecycle, renewal prompt, accept renewal (applies discount).
- `workers` — job history, yesterday's jobs, report download (CSV), revenue split breakdown, auto-accept toggle.
- `home-services-contact` — customer views worker contact → logs + charges worker.

## Dispatch / Matching

1. Customer creates a booking → status `PENDING_DISPATCH`.
2. Backend finds the N (default 5) nearest eligible workers by great-circle distance (Haversine) filtered by category + availability.
3. `BookingOffer` rows inserted with status `PENDING`.
4. Workers see the offer in their app. Workers with `autoAccept = true` accept immediately.
5. First acceptance: booking → `ACCEPTED`, all other offers → `RECALLED` (worker app pulls the offer back / greys it out). Customer notified.
6. If no worker accepts within the timeout, booking → `UNASSIGNED`; admin can requeue.

## Currency

Price amounts are stored as integers in the smallest currency unit (sen). `Settings.defaultCurrency` is `MYR`; the API exposes the currency so future regions can override per-customer based on locale/browse region.

## Security / Uploads

Partner-registration documents (IC copy, selfie, bank statement, SSM doc, Nursing Cert) are uploaded via multipart to the backend and stored under `apps/backend/uploads/` in dev. In production, swap to S3 / R2 via the `StorageService` abstraction.
