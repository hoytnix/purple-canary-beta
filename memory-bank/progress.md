# Progress: Purple Canary

## Completed Milestones

### 1. Architecture & Framework Migration
- [x] Ported application from legacy single-page bundle to Next.js App Router with React 19 and Tailwind CSS v4.
- [x] Established server route handlers under `app/api/` for users, scans, checkout sessions, and webhooks.
- [x] Synchronized `GEMINI.md` project mandates and tech constraints to match Next.js App Router and Drizzle ORM.

### 2. Database Modernization (Firebase -> TursoDB & Drizzle ORM)
- [x] Defined relational schema in `services/schema.ts` (`users`, `scans`, `transactions`, `subscriptions`).
- [x] Configured Turso client connection and automatic DDL initialization in `services/turso.ts`.
- [x] Implemented centralized query abstraction in `services/dbService.ts`.
- [x] Seed route added in `app/api/scans/seed/route.ts` for demo scan population.

### 3. Payment Gateway Modernization
- [x] Removed unvetted manual payment prompts (Cash App / Venmo tags) in `components/CheckoutWizard.tsx`.
- [x] Implemented Stripe Checkout Session generation in `app/api/checkout/create-session/route.ts`.
- [x] Configured post-checkout success redirect to `/scan?payment=success&session_id={CHECKOUT_SESSION_ID}`.
- [x] Added `/api/checkout/verify-session` to authenticate customer and activate `unlimited` tier on redirect.
- [x] Created `/scan` permalink for the forensic Test Suite (`app/scan/page.tsx`).
- [x] Implemented Stripe webhook listener in `app/api/webhook/stripe/route.ts` with raw-body signature verification and idempotent transaction logging.

### 4. Edge Validation & Forensic Pipeline
- [x] Configured Cloudflare Worker edge proxy in `cloudflare-worker/src/index.ts` with TLC plate validation and structured Gemini analysis.
- [x] Integrated client-side canvas color extraction and Rf spot analysis (`services/cvService.ts`, `services/matchingService.ts`, `services/colorimetry.ts`).
- [x] Provided client-side PDF forensic reporting via `services/exportService.ts`.

---

## Active & In-Progress Work
- [ ] End-to-end testing of camera auto-capture stream teardown and torch controls across mobile Safari and Chromium browsers.
- [ ] Fine-tuning anchor matrix detection sensitivity under variable field lighting.
- [ ] Completing unit/integration test coverage for TursoDB queries against the "Dirty Dozen" security spec vectors (`security_spec.md`).

---

## Known Issues & Backlog
- **Camera Feed Permissions**: Graceful fallback when user denies camera permissions or torch/flashlight is hardware-unsupported.
- **Edge Worker Deployment**: Ensure Cloudflare Wrangler secrets (`GEMINI_API_KEY`) are kept in sync with deployment environments.
- **Offline Sync**: Implement IndexedDB local caching for scans created in offline field conditions with deferred sync to TursoDB when connectivity resumes.
