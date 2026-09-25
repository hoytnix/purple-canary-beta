# Project Brief: Purple Canary (Forensic Substance Analysis Suite)

## Core Mission & Vision
**Purple Canary** is a field-ready, decentralized colorimetric substance screening and harm-reduction forensic Progressive Web App (PWA). Its purpose is to empower individuals, harm reduction organizations, and field testing personnel with decentralized, client-side chemical analysis, rapid contaminant identification (such as fentanyl, dangerous synthetic adulterants, and heavy metals), and auditable forensic reporting.

## Key Objectives
- **Decentralized & Client-Side Forensics**:
  Execute image processing, colorimetric extraction, anchor calibration, and Euclidean / Delta-E color-distance matching deterministically on the client device (via HTML5 Canvas API, Web Workers, and lightweight machine learning) to enable private, low-latency, and offline-capable analysis in high-stress field conditions.
- **Privacy-First Zero Cloud Leaks Law**:
  Sample computations, color extraction, and preliminary matching run locally. Unencrypted raw sample images are never uploaded without explicit user authorization. Telemetry and scan records stored in cloud or edge databases are strictly scoped and pseudonymized.
- **Robust Multi-Phase Guided Workflow**:
  Provide an intuitive multi-phase forensic pipeline:
  1. Setup & Substrate Calibration (TLC plates, reagent drop test paper, solvent & matrix context)
  2. Image Acquisition & Crop (Dual UV 365nm / 395nm or brightfield acquisition, camera auto-capture, guide-rails)
  3. Analysis & Colorimetric Extraction (Substrate validation, spot detection, Rf distance calculation, signature matching)
  4. Forensic Verdict & Export (Executive summary, risk classifications: CLEAN / WARNING / CRITICAL, SOP recommendations, PDF/JSON export)
- **Modern Infrastructure Modernization**:
  - Full migration from legacy Firebase/Firestore infrastructure to an edge-ready, serverless **TursoDB (libSQL)** relational repository managed with **Drizzle ORM**.
  - Replacement of manual, unvetted peer-to-peer payment methods (Cash App / Venmo) with an official, automated, and secure **Stripe Checkout** gateway and signed webhook processing.
  - Hybrid AI edge validation using Cloudflare Workers and Google Gemini for secondary corroboration and chromatographic verification.
