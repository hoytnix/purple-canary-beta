# Product Context: Purple Canary

## Problem Space & Target Audience
In harm reduction, field substance testing, and forensic screening, field workers and harm reductionists rely on chemical reagents (Marquis, Mecke, Mandelin, Ehrlich, etc.) and Thin-Layer Chromatography (TLC) strips to screen substances for purity and detect dangerous adulterants (e.g., fentanyl, synthetic cannabinoids, xylazine, toxic byproducts).

Physical color charts are difficult to interpret accurately under variable ambient lighting, torch angles, and subjective human eyesight. Purple Canary eliminates subjectivity by providing calibrated computer vision, Delta-E color distance calculations, and Rf (retardation factor) position calculations directly on mobile devices.

## Core User Journeys & Multi-Phase Pipeline

### Phase 1: Setup & Calibration (`CALIBRATION`)
- User selects the matrix type (`SOLID_CRYSTAL`, `LIQUID_VAPE`, `OIL_DAB`, `BOTANICAL_FLOWER`).
- User selects the solvent system (`WATER`, `ETHANOL`, `LIMONENE`) and filter substrate / grade.
- Lighting controls: toggle and configure 365nm UV, 395nm UV, or ambient brightfield illumination.

### Phase 2: Image Acquisition & Cropping (`ACQUISITION`)
- Camera feed with on-screen alignment guides, torch control, and optional auto-capture.
- Manual upload option as a fallback.
- Perspective cropping and anchor normalization (`ImageCropper.tsx`) to square the chromatographic plate or paper strip against standard calibration anchors.

### Phase 3: Extraction & Analysis (`ANALYSIS`)
- Deterministic client-side CV pipeline:
  - Substrate boundary validation (verifying valid TLC plate or paper media).
  - Spot segmentation, color coordinate extraction (HEX, RGB, Lab space).
  - Retention factor ($R_f$) calculation relative to solvent front and baseline.
  - Signature matrix matching against chemical libraries (`sopData.ts`, `constants.ts`).
- Optional secondary corroboration via Edge Worker (`cloudflare-worker/src/index.ts`) or Gemini multimodal analysis (`/api/gemini-analyze`).

### Phase 4: Forensic Verdict & Reporting (`VERDICT`)
- Multi-tier hazard classification: `CLEAN`, `WARNING`, `CRITICAL`, `LETHAL`.
- Detailed detection cards indicating identified chemical markers, metallic load estimates, and spectral shifts.
- Forensic report generation with laboratory SOP recommendations and downloadable PDF / JSON exports via `jspdf` and `exportService.ts`.

## Account, Credit & Monetization Model
- **Free Ad-Supported Tier**: Access to core forensic scanning, supported by sponsor banners, with a small scan credit quota.
- **Unlimited Pro Tier (Donate any amount / pay-what-you-want one-time donation)**: 100% ad-free interface, priority cloud-matrix queue, unlimited scans, and advanced report export options.
- Managed via automated **Stripe Checkout Sessions** and idempotent webhook processing, deprecating all manual payment handles.
