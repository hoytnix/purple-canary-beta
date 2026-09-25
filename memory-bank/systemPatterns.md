# System Patterns: Purple Canary

## Overall Architecture
Purple Canary uses a hybrid client-edge-cloud architecture designed for extreme resilience, field performance, and data security:

```
[ Mobile / PWA Client (Next.js / React 19) ]
   ├── Local Deterministic CV (HTML5 Canvas, Colorimetry, TF.js / WASM)
   ├── Local Storage / Pseudonymous Identity (Ed25519/Keypair generation)
   ├── Next.js App Router (app/api routes)
   │     ├── /api/users & /api/users/[id]
   │     ├── /api/scans & /api/scans/seed
   │     ├── /api/checkout/create-session
   │     ├── /api/webhook/stripe
   │     └── /api/gemini-analyze
   ├── Edge Proxy (Cloudflare Worker: cloudflare-worker/src/index.ts)
   └── Persistence: TursoDB (libSQL) via Drizzle ORM
```

## Key Architectural Patterns

### 1. Client-Side Deterministic Forensics
- **Color Extraction & Calibration**: In `services/colorimetry.ts` and `services/cvService.ts`, image pixel matrices are evaluated directly in HTML5 canvas buffers.
- **Euclidean / Delta-E Matching**: In `services/matchingService.ts`, observed spots are scored against standard reagent library vectors without passing raw image payloads across external networks.
- **Fail-Safe UI State Machine**: The 4-step workflow (`CALIBRATION` -> `ACQUISITION` -> `ANALYSIS` -> `VERDICT`) ensures clean state transitions and informative fallbacks if camera or anchor detection fails.

### 2. Relational Repository Pattern (TursoDB & Drizzle ORM)
- Replaced Firebase/Firestore with TursoDB (`@libsql/client`) and Drizzle ORM.
- **Centralized Service Abstraction**:
  - `services/turso.ts`: Client connection pooling (`turso`), Drizzle instance (`db`), and raw DDL table initialization (`initDatabase()`).
  - `services/schema.ts`: Drizzle SQLite schema definitions (`users`, `scans`, `transactions`, `subscriptions`).
  - `services/dbService.ts`: Centralized query repository with parameterized methods (`getUser`, `upsertUser`, `recordScan`, `getUserScans`, `recordTransaction`, `recordSubscription`).
- Direct SQL string interpolation of user inputs is strictly forbidden.

### 3. Stripe Checkout & Idempotent Webhook Processing
- Manual Cash App and Venmo handles in `CheckoutWizard.tsx` are deprecated in favor of official Stripe Checkout redirect sessions.
- **Creation Endpoint**: `app/api/checkout/create-session/route.ts` creates Checkout Sessions tied to the client identity via `client_reference_id`.
- **Webhook Endpoint**: `app/api/webhook/stripe/route.ts` consumes the raw text request body to verify `stripe-signature` against `process.env.STRIPE_WEBHOOK_SECRET`.
- **Idempotency Guarantee**: Successful `checkout.session.completed` events persist the `stripeSessionId` into the `transactions` table before incrementing user credits and activating Pro status.

### 4. Edge AI Corroboration (Cloudflare Worker & Gemini)
- `cloudflare-worker/src/index.ts` provides a secure, rate-limited edge proxy to the Gemini API (`gemini-2.5-flash`).
- Validates that the input image actually portrays a TLC/chromatography substrate (`isTLCPaper`) before conducting chemical band inference, returning structured JSON adhering to strict analytical schemas.

### 5. Mobile & Responsive Design Standards
- Viewports are strictly constrained to 375px minimum without horizontal clipping.
- Dark-mode, high-contrast forensic aesthetic with bundled SVG icons (`lucide-react`) rather than raw emoji characters.
