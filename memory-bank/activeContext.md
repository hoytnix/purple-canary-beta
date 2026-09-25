# Active Context: Purple Canary

## Current Operational State
- **Architecture Migration Completed**:
  - The repository has been ported to the Next.js App Router (React 19, TypeScript, Tailwind CSS v4).
  - Legacy Firebase/Firestore services have been superseded by TursoDB (libSQL) and Drizzle ORM (`services/turso.ts`, `services/schema.ts`, `services/dbService.ts`).
  - REST API routes created under `app/api/` (`users`, `scans`, `checkout`, `webhook/stripe`, `gemini-analyze`, `health`, `auth/sync-identity`).
  - Automated Stripe Checkout integration in `components/CheckoutWizard.tsx` replacing manual Cash App and Venmo flows.
- **Asymmetric Authentication Protocol Deployed**:
  - Client-side native Web Crypto API (`window.crypto.subtle`) ECDSA P-256 keypair generation and local storage persistence (`services/identity.ts`).
  - TursoDB `users` table modernized with `public_key TEXT PRIMARY KEY`, `nonce INTEGER DEFAULT 0`, and `last_login DATETIME`.
  - Signature-based authentication and upsert Route Handler deployed at `/api/auth/sync-identity` with IEEE P1363 / DER signature verification against `auth:${publicKey}:${timestamp}` to eliminate plaintext private key network transmission and prevent replay attacks.
   - Interactive `AuthStatusWidget.tsx` retained for account settings, while homepage hero consolidated keypair management into Page 1 of `CheckoutWizard.tsx` ("Unlock the Oracle.") with private key toggle directly beneath public key.
- **Active Focus**:
  - Maintain synchronization between client-side signature database (`sopData.ts`, `constants.ts`) and edge AI validation schemas.
  - Verify camera auto-capture tuning, anchor grid stabilization, and substrate validation.
  - Ensure zero cloud leaks and enforce strict parameterization on all Turso libSQL queries.

## Recent Decisions & Invariants
1. **Drizzle + Turso**: Using SQLite/libSQL parameterized models to enforce data immutability and isolate scan records by user identity.
2. **Asymmetric Keypair Authentication Law**: Never send or store plaintext private keys on the server. Clients sign challenge payloads (`auth:${publicKey}:${timestamp}`) verified via ECDSA SHA-256 (supporting IEEE P1363 and ASN.1 DER formats) at `/api/auth/sync-identity`.
3. **TursoDB User Schema**: Primary key is `public_key` with monotonic `nonce` and `last_login` timestamps.
4. **Stripe Webhook Idempotency**: Storing `stripe_session_id` in the `transactions` table to prevent double crediting upon webhook redelivery.
5. **Stripe Post-Checkout Redirect & Auth**: Success redirect configured to `/scan?payment=success&session_id={CHECKOUT_SESSION_ID}`. The `/api/checkout/verify-session` route authenticates the customer, activates the `unlimited` tier, and sets state in `localStorage` before smoothly entering the forensic test suite.
6. **Dedicated Test Suite Permalink (`/scan`)**: Provided direct route at `/scan` (via `app/scan/page.tsx`) to mount the forensic test suite directly.
7. **Responsive 375px Constraint**: Enforcing high-contrast dark mode and SVG icons across all diagnostic screens.
8. **Homepage Identity Consolidation**: Streamlined "Unlock the Oracle." (Page 1 of `CheckoutWizard.tsx`) by including both public and private key fields inline and removing redundant "Asymmetric Keypair Identity" widget section from homepage hero.
9. **License Page Pro License Bypass to `/scan`**: On Page 2 of `CheckoutWizard.tsx` ("Choose your License."), when the public key exists, the private key mathematically matches the public key via ECDSA P-256 validation (`validateKeyPair`), the user's tier directly in the database `users` row is Pro License (`unlimited` or `pro`), and the hardware kit is unchecked, the submit button dynamically shifts from "Proceed to Checkout" to "Proceed to Scan" and navigates directly to the `/scan` route without requiring re-payment or checkout wizard loops.
10. **Salted Private Key Hash Authentication (Anti-Impersonation)**: In the `users` table, added `private_key_hash TEXT` managed via Drizzle push (`drizzle-kit push`). Client identity authentication at `/api/auth/sync-identity` computes and verifies a salted PBKDF2 SHA-512 hash (`salt:hash`) against the database row with `crypto.timingSafeEqual`, preventing anyone from impersonating another user's public key.
11. **Mandatory Memory Bank Sync & Git Commits**: Committing all atomic changes directly via shell tool per operational directives.
12. **Database Hit Reduction & Deferred User Insertion Law**:
    - The live network activity carousel and scan subscribers fetch only once on page mount without continuous periodic polling (`setInterval` removed).
    - Client key generation and routine identity cryptographic verification (`/api/auth/sync-identity`) operate read-only without inserting rows into `users` table.
    - User rows in TursoDB `users` table are created ONLY at the final step ("Proceed to Scan" or a completed Stripe checkout session) AND ONLY IF the user does not already exist in the database.
    - Scan recording and mock scan seeding write strictly to the `scans` table and never insert dummy records into the `users` table.
13. **Checkout Private Key Hash Persistence Law**:
    - During Stripe Checkout session creation, the salted private key hash (`hashPrivateKey`) is generated and preserved in Stripe session metadata.
    - Both Stripe webhook (`app/api/webhook/stripe/route.ts`) and session verification handler (`app/api/checkout/verify-session/route.ts`) persist `privateKeyHash` when inserting or updating the user's row.
    - Upon post-checkout redirect return to `/scan`, `App.tsx` guarantees that client-side identity sync verifies and synchronizes the salted private key hash to the user's database record.


