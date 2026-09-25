# Active Context: Purple Canary

## Current Operational State
- **Architecture Migration Completed**:
  - The repository has been ported to the Next.js App Router (React 19, TypeScript, Tailwind CSS v4).
  - Legacy Firebase/Firestore services have been superseded by TursoDB (libSQL) and Drizzle ORM (`services/turso.ts`, `services/schema.ts`, `services/dbService.ts`).
  - REST API routes created under `app/api/` (`users`, `scans`, `checkout`, `webhook/stripe`, `gemini-analyze`, `health`).
  - Automated Stripe Checkout integration in `components/CheckoutWizard.tsx` replacing manual Cash App and Venmo flows.
- **Active Focus**:
  - Initialize and maintain the authoritative Memory Bank (`/memory-bank/`) per project mandate.
  - Verify camera auto-capture tuning, anchor grid stabilization, and substrate validation.
  - Maintain synchronization between client-side signature database (`sopData.ts`, `constants.ts`) and edge AI validation schemas.
  - Ensure zero cloud leaks and enforce strict parameterization on all Turso libSQL queries.

## Recent Decisions & Invariants
1. **Drizzle + Turso**: Using SQLite/libSQL parameterized models to enforce data immutability and isolate scan records by user identity.
2. **Stripe Webhook Idempotency**: Storing `stripe_session_id` in the `transactions` table to prevent double crediting upon webhook redelivery.
3. **Responsive 375px Constraint**: Enforcing high-contrast dark mode and SVG icons (`lucide-react`) across all diagnostic screens.
4. **Project Instructions Alignment**: Synchronized `GEMINI.md` operational mandate to accurately reflect Next.js App Router route handlers (`app/api/`) and Drizzle ORM instead of legacy Express/Vite.
5. **Mandatory Memory Bank Sync & Git Commits**: Committing all atomic changes directly via shell tool per operational directives.
