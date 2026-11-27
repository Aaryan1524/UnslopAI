# Phase 0: Inspect-First Deep Discovery Protocol (v2.0.0)

Run this **Prompt Requirement Parsing + Silent Recon → 10–15 Question Deep Discovery Blueprint (4 Adaptive Intervals) → `.unslop/brief.md` Spec Lock → Phase 0.5 Hero Style Tile Checkpoint** protocol **before writing full-site application code**. Questions must always be grounded in concrete prompt and recon findings — never generic boilerplate checklists.

---

## 1. Step 0A — Initial Prompt Requirement Parsing & Silent Recon (Before Asking Questions)

Before asking the user a single question, extract everything already known from the prompt, codebase, and inspiration reference so the user never repeats themselves.

### A. Initial Prompt Requirement Parsing (5-Dimension Coverage Matrix)
Parse the user's opening prompt into a **5-Dimension End-to-End Requirement Coverage Matrix** and tag every dimension slot as `Known`, `Inferred` (confirm briefly), or `Missing` (ask in Step 0B):

| Dimension | Coverage Scope | What to Extract from Prompt / Repo / Recon |
| :--- | :--- | :--- |
| **1. Product Truth & Conversion** | Positioning, ICP, core job-to-be-done, verified offerings/tiers, primary & secondary CTAs | Brand name, factual claims, pricing/plans, conversion goal, post-CTA confirmation state |
| **2. End-to-End User Journeys, Routes & Functional Scope** | Full route/page map, interactive flows, forms, search, drawers, data/auth/integration boundaries | Multi-page map, preserved routes/APIs, stateful widgets, explicit out-of-scope boundaries |
| **3. Visual DNA, Art Direction & Surface Grammar** | Spatial framing motifs, surface polarity, palette hexes, typography mood, strict 3-radius lock, copy economy | Extracted `reference-tokens.json` tokens, screenshot structural motifs, word-density targets |
| **4. Hero "Aha" Product Proof, Motion & Media** | 5-second above-the-fold interactive proof, signature animations, motion density, 1-room studio lighting seed & assets | Interactive hero sandbox/proof mechanic, domain animations, existing assets vs. art-directed synthesis |
| **5. Stack, Mobile Ergonomics, SEO/OG & Redlines** | Detected stack, thumb-zone mobile layout, SEO/OpenGraph/favicon plan, accessibility & no-fabrication redlines | `stack-report.json`, mobile sticky/drawer constraints, metadata plan, prohibited claims/libraries |

### B. Silent Recon Checklist
Run automated recon in parallel with prompt parsing:

1. **Preflight:** Run `node <skill-dir>/scripts/doctor.mjs` (pass `--no-launch` only when browser scripts are not needed).
2. **Existing Repository Scan (whenever a target codebase exists):**
   - Run `node <skill-dir>/scripts/detect_stack.mjs <targetDir> .unslop/stack-report.json`.
   - Read existing product truth (`README.md`, routes, `src/data/*`, pricing/specs, `public/` assets) to build a factual **Content Inventory**.
3. **Inspiration Reference Scan (whenever an inspiration URL is provided):**
   - Run `node <skill-dir>/scripts/inspect_site.mjs <url> .unslop/inspect` and `node <skill-dir>/scripts/extract_reference.mjs <url> .unslop/inspect/reference-tokens.json`.
   - Read `report.json`'s `reconDigest` and `reference-tokens.json` (`surfaceRatio` light/dark %, measured `typography` heading weights/tracking, `geometryLock` modal card/button/input/media radii, `alignmentAudit`, `copyDensity`, `sectionArchetypes`, `detectedInteractiveTriggers`, `hasWebGL`).
   - **Visually inspect captures before asking a single question:** Open `.unslop/inspect/desktop-top.png`, `.unslop/inspect/desktop-mid.png`, `.unslop/inspect/mobile-top.png`, and key `components/*.png` to catalog exact structural motifs (outer dot/grid substrates, continuous `1px` vertical guide rails, registration nodes, corner brackets, inset halftone/shader frames, split comparison stages, luminous vs. dark surfaces).
   - *(If `blocked: true`, stop automation immediately per [`capabilities-and-limitations.md`](capabilities-and-limitations.md) and ask for screenshots instead.)*

---

## 2. Step 0B — 10–15 Question Deep Discovery Blueprint (Adaptive Multi-Interval Protocol)

Capture the complete end-to-end website requirement cleanly across **focused intervals of 3–4 questions per turn** rather than dumping a giant questionnaire at once or guessing critical product, journey, visual, or mobile decisions.

### Depth & Mode Scaling
- **`standard` & `deep` Full Builds (Default):** Ask **10 to 15 targeted, recon-grounded questions** organized across **4 focused intervals of 3–4 questions per turn** (`standard` may finish in 3–4 intervals when the opening prompt is rich; `deep` covers all 4 intervals end-to-end).
- **`fast` Mode / Escape Hatch:** Ask **1–2 rapid confirmation questions** on the highest-leverage ambiguities only (or skip straight to Step 0C when the user selects *"Use best defaults & lock the brief"*).
- **`extract-component` Mode:** Stay strictly scoped to the target component — ask **3–5 technical questions** covering target file/route in the detected stack, scroll/pointer trigger physics, state & `prefers-reduced-motion` freeze contract, and dependency/styling budget. Skip site-wide routes, palette, SEO/OG, and footer questions.
- **`redesign-vibe-transfer` Mode:** Scope the 4 intervals around preserving existing routes, copy, and API wiring while locking visual motif transfer, Hero "Aha" upgrade, mobile ergonomics, and zero-regression redlines.

### 15-Question Structured Question Bank (5 Dimensions × 3 Questions)

Map every interval directly to the 5-Dimension Coverage Matrix:

| Dimension | Q# | High-Signal Question Axis | Grounded Recon / Design Hook |
| :--- | :--- | :--- | :--- |
| **1. Product Truth & Conversion** | **Q1** | **Core Positioning & Primary ICP:** Who lands here first, what problem hurts right now, and what must they understand in 10 seconds? | Ties directly to Hero headline & subcopy budget |
| | **Q2** | **Verified Offerings, Specs & Tiers:** Which exact products, plans, capabilities, or metrics are real today (and which existing repo routes/logic must stay untouched)? | Prevents fabricated tiers, metrics, or broken flows |
| | **Q3** | **Conversion Funnel & Confirmation State:** What are the exact primary and secondary CTA actions, where do they lead (route/drawer/modal/external), and what confirmation state proves completion? | Locks end-to-end conversion loop before build |
| **2. End-to-End User Journeys, Routes & Functional Scope** | **Q4** | **Full Route & Navigation Map:** Beyond the landing page, which sub-pages, detail views, or anchors are needed, and which max-5 links + 1 CTA belong in the primary navbar? | Enforces Navbar Purity + multi-route audit scope |
| | **Q5** | **Interactive Surfaces & State Workflows:** Which stateful tools must work live (`Cmd+K` search, filterable catalog, pricing/usage calculator, multi-step validated form, slide-over drawer)? | Maps to [`interactive-component-patterns.md`](interactive-component-patterns.md) |
| | **Q6** | **Data, Auth & Integration Boundaries:** Should interactive states persist locally (`localStorage`/URL params), wire to existing backend/API handlers, or run as self-contained client flows with explicit out-of-scope bounds? | Prevents dead buttons & backend scope creep |
| **3. Visual DNA, Art Direction & Surface Grammar** | **Q7** | **Structural Motifs, Polarity & Palette:** Citing `desktop-top.png` / `desktop-mid.png`, which exact motifs carry over (outer dot/grid gutters, `1px` vertical rails, registration nodes, corner brackets, inset frames) and should polarity stay reference-matched, flip, or use custom hexes? | Locks Section 7 Visual DNA & `reference-tokens.json` |
| | **Q8** | **Typography Mood & 3-Radius Voice:** Based on extracted weights/tracking and [`type-pairings.md`](type-pairings.md), should headings use tight `500`-weight neo-grotesk + mono, expressive editorial serif + sans, hardware Swiss, or a specified typeface — paired with which 3-radius lock (`--r-card`, `--r-control`, `--r-media`)? | Prevents generic font & ad-hoc radius drift |
| | **Q9** | **Copy Economy & Visual-to-Prose Ratio:** Citing `copyDensity`, do you want visual-first minimal copy (interactive proof carries the pitch), balanced scannable narrative, or deeper technical prose? | Locks Section 8 word caps & `>= 60%` visual ratio |
| **4. Hero "Aha" Product Proof, Motion & Media** | **Q10** | **5-Second Hero "Aha" Interactive Product Proof:** What single interactive artifact above the fold lets a visitor *try* or *feel* the product within 5 seconds (e.g., live input→output simulator, before/after noise-to-calm switch, interactive telemetry/configurator viewport)? | Maps to [`interactive-product-proofs.md`](interactive-product-proofs.md) |
| | **Q11** | **Signature Product-Explaining Animations & Motion Density:** Which 1–3 domain-native kinetic moments best explain how the system works, and should motion feel `minimal-crisp`, `balanced`, or `motion-heavy-kinetic` (with strict reduced-motion freeze)? | Drives motion grammar & `record_motion_qa.mjs` |
| | **Q12** | **Bespoke Media & Unified 1-Room Studio Lighting Seed:** Are we using existing repo/user assets or synthesizing a cohesive art-directed media set under one locked studio lighting direction, color temperature, camera framing, and `< 500 KB` budget? | Maps to [`visual-art-direction-and-media.md`](visual-art-direction-and-media.md) |
| **5. Stack, Mobile Ergonomics, SEO/OG & Redlines** | **Q13** | **Mobile Ergonomics & Touch Architecture:** On `390px` viewports, how should key actions adapt — thumb-zone sticky CTA bar, compact header budget, horizontal snap rails, or bottom/slide drawers instead of naive vertical desktop stacking? | Locks Section 11 mobile craft & mobile video QA |
| | **Q14** | **SEO, OpenGraph, Favicon & Analytics Hooks:** What page title/meta pattern, social share card (`og:image`), favicon/app-icon mark, or lightweight analytics hook should ship with the build? | Locks Section 12 metadata & launch readiness |
| | **Q15** | **No-Fabrication Redlines & Hard Constraints:** Are there banned claims/logos/metrics, strict accessibility/performance targets, required/forbidden libraries, or a preferred depth preset (`fast` / `standard` / `deep`)? | Locks Section 10 redlines & router preset |

### Recommended 4-Interval Delivery Cadence (3–4 Questions per Turn)
1. **Interval 1 — Product Truth & End-to-End Map (Q1–Q4):** Lock ICP, real offerings, conversion funnel, and route/nav map.
2. **Interval 2 — Functional Scope & Visual DNA (Q5–Q8):** Lock interactive workflows, data/API boundaries, observed visual motifs/polarity, and typography + 3-radius voice.
3. **Interval 3 — Copy Economy, Hero "Aha" Proof, Motion & Media (Q9–Q12):** Lock word budgets, 5-second interactive Hero proof, signature animations, and unified studio art-direction seed.
4. **Interval 4 — Mobile Ergonomics, SEO/OG & Redlines (Q13–Q15 + Substituted Deep Follow-Ups):** Lock thumb-zone mobile UX, metadata/OG/favicon plan, redlines, and depth preset.

### Adaptive Substitution Rule
- **Auto-Skip Already Answered Slots:** Never re-ask anything already established in the opening prompt, `stack-report.json`, repo files, or prior intervals. Briefly state what was parsed as `Known` so the user can correct it if needed.
- **Replace Skipped Slots with Domain-Specific Follow-Ups:** Whenever 1+ baseline questions are already answered, substitute sharper domain-specific follow-ups (e.g., exact pricing tier formulas, stateful sandbox inputs/outputs, multi-step form field validation, filterable catalog facets, API payload shapes, or domain comparison metrics) so full `standard`/`deep` builds stay crisp at **10–15 total high-signal questions** with zero fluff.

### Interval Delivery & Interaction Rules
- **3–4 Crisp Questions per Turn:** Never dump all 15 questions in one wall of text, and never drag out one trivial question per turn.
- **Explicit Escape Hatch on Every Interval:** End every interval verbatim or closely matching:
  > *"Reply to these, say **'Use best defaults & lock the brief'** anytime, or tell me to **dive deeper** on any area."*
- **Grounded, Never Generic:** Every question MUST cite specific facts from the user's prompt, `.unslop/stack-report.json`, `.unslop/inspect/report.json` (`reconDigest`), `reference-tokens.json`, or observed screenshot motifs (`desktop-top.png`, `desktop-mid.png`, `mobile-top.png`).
  - *Bad (generic):* "What sections, fonts, and colors do you want?"
  - *Good (grounded):* "Inspecting `desktop-top.png` and `desktop-mid.png`, the reference uses a light-first `#FAF9F6` canvas framed by outer dot-matrix gutters, continuous `1px` vertical blueprint rails with corner registration squares, an inset halftone hero with pill CTAs + `4px` cards, and tight `500`-weight grotesque headlines. For your telemetry platform, should we carry over those exact rails and inset frame — and make the hero's 5-second 'Aha' proof a live noisy-alert-to-filtered-signal toggle?"
- **Tool Adaptation:** Use `AskUserQuestion` (or the host's structured multiple-choice UI tool) when available; otherwise present clean, numbered options (`1)`, `2)`, `3)`) in chat with a recommended default marked clearly.

---

## 3. Step 0C — Lock `.unslop/brief.md` & Hand Off to Phase 0.5 Hero Style Tile Checkpoint

1. **Synthesize Complete Spec:** Write **`.unslop/brief.md`** using [`product-brief-template.md`](product-brief-template.md), completing **all 13 sections** — including **Section 7 (Visual DNA & Structural Motifs Manifest)**, **Section 8 (Copy Economy & Visual Storytelling Budget)**, **Section 11 (End-to-End User Journeys, Interactive Product Proof & Mobile Ergonomics)**, and **Section 12 (Unified Art-Direction Seed & Asset Manifest)** (leaving Section 13 ready to log Phase 0.5 sign-off).
2. **Brief Approval Gate:** Present a crisp, scannable summary of `.unslop/brief.md` (execution preset, route map, locked visual motifs & typography, 5-second Hero "Aha" proof, unified lighting seed, mobile ergonomics, and orchestration mode) and ask for a quick **"Looks good — proceed to the 10-Second Hero Style Tile"** (or targeted adjustments).
3. **Wire Directly into Phase 0.5 — The 10-Second Hero Style Tile Checkpoint ([`style-tile-checkpoint.md`](style-tile-checkpoint.md)):**
   - For **`standard`** and **`deep`** builds, **do not jump straight into Wave 2 full-site generation**. First build and render the isolated **Hero Style Tile** (above-the-fold typography, locked palette & 3-radius tokens, primary navbar, Hero "Aha" interactive proof, and 1 art-directed media/shader frame), capture `.unslop/style-tile/style-tile-desktop.png` and `.unslop/style-tile/style-tile-mobile.png`, verify `.unslop/style-tile/style-tile-report.json`, and collect user sign-off in **Section 13 of `.unslop/brief.md`**.
   - Once Phase 0.5 is signed off, proceed into Wave 1/Wave 2 full-site generation with zero aesthetic guesswork.
   - *(Only **`fast`** mode, **`extract-component`** mode, or an explicit user instruction to *"skip the style tile and build immediately"* bypasses Phase 0.5 — see [`execution-modes-and-prompts.md`](execution-modes-and-prompts.md).)*

---

## 4. No-Fabrication & Assumption Hygiene

- **Never invent factual claims:** Do not fabricate customer counts, uptime SLAs, security certifications, customer logos, testimonials, pricing numbers, or founder quotes.
- **Handling missing data:** When real numbers or testimonials are not supplied, either omit the social-proof band entirely (see [`inspiration-translation-matrix.md`](inspiration-translation-matrix.md)) or replace it with verifiable product architecture, interactive proofs, or clearly labeled structural slots documented in `.unslop/brief.md`.
- **Keep `.unslop/` tidy & git-ignored:** Store recon captures (`.unslop/inspect/`), stack reports (`.unslop/stack-report.json`), contracts (`.unslop/brief.md`, `.unslop/DESIGN.md`, `.unslop/COMPONENTS.md`), Hero Style Tile outputs (`.unslop/style-tile/`), Motion QA captures (`.unslop/motion-qa/`), and audit runs (`.unslop/audit/`) inside `.unslop/` rather than scattering files across the user's project root. **Automatically ensure `.unslop/` is listed in the target project's `.gitignore`** (create or append `.unslop/` before writing scratch artifacts) — or remove temporary `.unslop/inspect/`, `.unslop/style-tile/`, `.unslop/motion-qa/`, and `.unslop/audit/` dumps before delivery if the user wants zero scratch files left on disk.
