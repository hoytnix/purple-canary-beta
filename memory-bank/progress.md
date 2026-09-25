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

### 5. Secure Asymmetric Keypair Authentication & License Workflow
- [x] Implemented ECDSA P-256 keypair generation via native `window.crypto.subtle` in `services/identity.ts` without plaintext network exposure.
- [x] Modernized TursoDB schema and Drizzle ORM models with `public_key TEXT PRIMARY KEY`, `nonce INTEGER DEFAULT 0`, and `last_login DATETIME`.
- [x] Created Route Handler `app/api/auth/sync-identity/route.ts` for challenge-response signature verification with replay attack mitigation and dual IEEE P1363 / ASN.1 DER verification.
- [x] Created `AuthStatusWidget.tsx` for My Account modal, and consolidated inline public and private key fields onto Page 1 of `CheckoutWizard.tsx` ("Unlock the Oracle."), removing duplicate widget section from homepage hero.
- [x] Added cryptographic keypair validation (`validateKeyPair`) and database-driven `tier` verification in `CheckoutWizard.tsx`: users with verified matching keypair, Pro License tier in the TursoDB `users` row, and unchecked hardware kit bypass payment checkout and route directly to `/scan`.
- [x] Added `private_key_hash` column to Drizzle ORM `users` schema and pushed to TursoDB via `drizzle-kit push`.
- [x] Implemented salted PBKDF2 SHA-512 private key hashing (`services/authSecurity.ts`) and verified private key authenticity during `/api/auth/sync-identity` requests to prevent public key impersonation attacks.

### 6. Database Hit Minimization & User Ingestion Control
- [x] Removed continuous interval polling (`setInterval`) from `subscribeAllLatestScanRecords` and `subscribeScanRecords`; stats carousel and scans fetch strictly once per page load.
- [x] Separated scan ingestion from user creation: `recordScan` and `seedScansIfEmpty` no longer inject dummy rows into the `users` table; legacy seed users purged from database.
- [x] Defer user insertion in `sync-identity` until explicitly requested via `registerIfMissing: true` at the final "Proceed to Scan" step or upon verified Stripe checkout completion.
- [x] Ensured user rows are inserted only if they do not already exist (`AND ONLY IF IT DOESN'T EXIST`), updating tier and shipping metadata when returning users complete transactions.
- [x] Streamlined `CheckoutWizard.tsx` and `App.tsx` by eliminating redundant mount synchronization and step-triggered DB queries.
- [x] Preserved salted private key hash during Stripe Checkout: attached hash to Stripe metadata in `create-session`, persisted in `webhook/stripe` and `verify-session`, and guaranteed post-checkout sync in `App.tsx`.
- [x] Completely removed legacy `firestoreService.ts` and transitioned all scan subscriptions and profile reading to `services/scanService.ts`.
- [x] Eliminated premature profile inserts on account modal load in `MyAccount.tsx`.
- [x] Deprecated unauthenticated `POST /api/users` endpoint to protect user table integrity.
- [x] Enforced strict `SALT:HASH` format for all `users.private_key_hash` database columns in live TursoDB.
- [x] Pre-inserted user record into TursoDB at `/api/checkout/create-session` before Stripe redirect, updating tier to `unlimited` on payment completion.
- [x] Added singleton promise lock and self-healing mathematical keypair validation in `services/identity.ts` (`getOrCreateIdentity`) to prevent race conditions and keypair mismatch lockouts across multiple `CheckoutWizard` components.
- [x] Added storage event listener in `CheckoutWizard.tsx` to keep all wizard instances synchronized.

### 7. Root Admin Dashboard & Tier Gate
- [x] Created cybernetic Admin Dashboard at `/admin` (`app/admin/page.tsx`, `components/admin/AdminDashboard.tsx`) with dark forensic aesthetic, glowing badges, and responsive layouts down to 375px.
- [x] Enforced strict access control: accessible strictly when the user's `tier` column in TursoDB is `'admin'`.
- [x] Designed high-security 403 Restricted Terminal lockscreen with public key display and promotion instructions for unauthorized nodes.
- [x] Deployed cryptographically signed administrative route handlers under `app/api/admin/` (`auth-check`, `stats`, `users`, `scans`, `transactions`) guarded by `authenticateAdminRequest` in `services/adminAuth.ts`.
- [x] Added `dbService` admin methods: `getAllUsers`, `updateUserTier`, `updateUser`, `getAllScansDetailed`, `getAllTransactions`, `getAdminStats`.
- [x] Integrated client-side `adminService.ts` with ECDSA challenge signing.
- [x] Linked Admin Console in `MenuModal.tsx`, `Header.tsx`, and `MyAccount.tsx` when user possesses `admin` tier.
- [x] Built developer CLI tool `scripts/setAdminTier.ts` for listing, inspecting, and promoting node tiers in TursoDB.
- [x] Standardized package manager on `pnpm` across builds and scripts.

### 8. Donation-Driven Unlimited Pro License
- [x] Converted the static $1.00 Unlimited Pro tier into a flexible "Donate Any Amount" harm-reduction funding model.
- [x] Implemented quick donation presets ($1, $5, $10, $25) alongside arbitrary USD amount entry in `CheckoutWizard.tsx`.
- [x] Enforced $0.50 minimum transaction guard for Stripe card processing compatibility.
- [x] Passed custom donation amount into Stripe Checkout Session and recorded donation metadata.
- [x] Updated UI copy in `MyAccount.tsx` and `CheckoutWizard.tsx`.

### 9. Hero Layout & Checkout Streamlining
- [x] Moved the forensic hardware kit product image out of `CheckoutWizard.tsx` (Step 2) into the hero left column in `LandingPage.tsx` directly beneath "Verified Accuracy & Instant Results".

### 10. 5-Step Checkout Wizard with Dedicated Kit Selection & Skip Donation
- [x] Refactored `CheckoutWizard.tsx` from 4 to 5 total steps with `(step / 5) * 100%` progress bar.
- [x] Inserted standalone hardware kit upsell as Step 2 with interactive counter (`kitQuantity`), unit price, and Back/Continue navigation.
- [x] Moved License and Donation controls to Step 3, retaining presets and custom input.
- [x] Added conditional "Skip Donation ($0.00)" button for unlimited/pro tier users (`isUnlimitedUser`), setting donation amount to 0 and advancing immediately.
- [x] Shifted Order Summary & Shipping Address to Step 4 with kit quantity multiplier badge.
- [x] Shifted Stripe 256-bit Secure Checkout to Step 5.


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
