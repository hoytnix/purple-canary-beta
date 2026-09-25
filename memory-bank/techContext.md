# Tech Context: Purple Canary

## Core Technologies & Toolchain

### Frontend
- **Framework**: Next.js 16 (App Router) / React 19 (`react`, `react-dom` ^19.2.3)
- **Language**: TypeScript (`~5.8.2`)
- **Styling**: Tailwind CSS (`^4.3.3`) with `@tailwindcss/postcss` and PostCSS 8
- **Icons**: `lucide-react` and Material Symbols (SVGs)
- **Computer Vision & ML**: HTML5 Canvas 2D API, `@tensorflow/tfjs` (`4.17.0`), `@tensorflow/tfjs-backend-wasm` (`4.17.0`)
- **Export Engine**: `jspdf` (`2.5.1`) for client-side forensic PDF generation

### Backend & API
- **Runtime**: Node.js (Next.js server runtime)
- **API Endpoints**: Next.js Route Handlers (`app/api/`)
  - `app/api/checkout/create-session/route.ts`: Stripe Checkout session creation
  - `app/api/webhook/stripe/route.ts`: Signed Stripe webhook handler
  - `app/api/users/route.ts` & `app/api/users/[id]/route.ts`: User profile CRUD
  - `app/api/scans/route.ts` & `app/api/scans/seed/route.ts`: Scan storage & demo seeding
  - `app/api/gemini-analyze/route.ts`: Next.js Gemini endpoint
  - `app/api/health/route.ts`: Service health check

### Edge Computing
- **Cloudflare Worker**: `cloudflare-worker/src/index.ts`
- **Wrangler**: Cloudflare developer CLI (`wrangler.toml`)
- **AI Integration**: `@google/genai` (`^2.11.0`) / Gemini REST API (`gemini-2.5-flash`)

### Database & ORM
- **Database Engine**: TursoDB (libSQL) via `@libsql/client` (`^0.18.0`)
- **ORM / Query Builder**: Drizzle ORM (`^0.45.3`) with `drizzle-kit` (`^0.31.11`)
- **Config**: `drizzle.config.ts`, `services/schema.ts`, `services/turso.ts`, `services/dbService.ts`

### Payments & Billing
- **Payment Provider**: Stripe (`stripe` SDK `^22.6.2`)
- **Integration**: Stripe Checkout Sessions with raw body webhook verification (`process.env.STRIPE_WEBHOOK_SECRET`)

## Development & Verification Cheatsheet
- **Dev Server**: `npm run dev`
- **Typecheck**: `npx tsc --noEmit`
- **Production Build**: `npm run build`
- **Database Migrations**: `npm run db:push` / `npm run db:generate`

## Environment Variables
- `TURSO_DATABASE_URL`: Turso libSQL connection URL (e.g. `libsql://...` or `file:local.db`)
- `TURSO_AUTH_TOKEN`: Turso auth token for cloud instances
- `STRIPE_SECRET_KEY`: Stripe API secret key
- `STRIPE_WEBHOOK_SECRET`: Webhook signing secret (`whsec_...`)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Public Stripe key
- `GEMINI_API_KEY`: Google Gemini API key for chromatographic plate validation
