---
name: unslop
description: Use when building a website from scratch, redesigning an existing UI to match an inspiration site's measured visual DNA, or porting a UI animation/component—with inspect-first 10-15 question deep discovery, 10-second Hero Style Tile checkpoint, 4-specialist parallel crafting, and Playwright + scroll-video 8-axis Design Director QA.
license: MIT
compatibility: Requires Node.js >= 22.6 and Playwright (Chromium or local Google Chrome) for inspection, reference token extraction, style tiles, audit, and motion video QA. Optional REA bundle enrichment requires Node ^22.23.4, ^24.22.1, or >=26.12.1.
metadata:
  author: Aaryan1524
  version: "2.0.0"
  repository: "https://github.com/Aaryan1524/UnslopAI"
---

# Unslop — Studio Engine (`v2.0.0`): Visual-DNA Extraction, Deep Discovery, Style Tile & Video QA

Turn any frontend build, inspiration-driven redesign, or single-animation extraction into a studio-grade engineering pipeline. One minimal `/unslop` skill routes across **Fast**, **Standard**, **Deep (4-Specialist Parallel Guild)**, and **Extract-Component** presets—parsing requirements and inspecting references first, conducting **10–15 grounded questions** across 4 focused intervals, validating direction with a **10-second browser-rendered Hero Style Tile**, building interactive product proofs with a locked art-direction seed, and passing automated Playwright + **60fps scroll/interaction video QA** and an **8-Axis Fresh-Context Design Director Critic (`>= 8/10`)**.

> **Script Paths & Workspace Hygiene:** Commands below use `<skill-dir>/scripts/...` (resolve `<skill-dir>` to the folder containing this `SKILL.md`, e.g., `skills/unslop` in-repo or `~/.agents/skills/unslop` standalone). `browser_helper.mjs` resolves `playwright` automatically. Store all scratch telemetry, contracts, style tiles, and audits inside **`.unslop/`** (`brief.md`, `stack-report.json`, `inspect/`, `style-tile/`, `DESIGN.md`, `COMPONENTS.md`, `audit/`, `motion-qa/`) and **add `.unslop/` to the target repository's `.gitignore` before writing scratch files** so generated projects stay spotless.
>
> **Strict Lazy-Loading Rule:** Read ONLY the reference files triggered by the active phase, locked preset, and target stack—**never preload all 21 `references/*.md` files upfront**. Skip `style-tile-checkpoint.md` in `fast`/`extract-component` runs, skip `parallel-orchestration.md` in `fast`/single-pass runs, skip `rea-evaluation.md` unless running `rea_inspect.mjs`, skip `inspiration-translation-matrix.md` when no inspiration exists, skip `taste-spectrum.md` when a visual direction exists, skip `motion-and-shader-grammar.md` in `minimal-crisp` motion runs, skip `tactile-hardware-grammar.md` unless tactile craft fits, skip `interactive-product-proofs.md` for pure static prose docs, and skip `visual-art-direction-and-media.md` in `fast` mode.

---

## Phase 0 — Silent Recon → 10–15 Question Deep Discovery → `.unslop/brief.md` Lock

**Never write application code before completing Phase 0.** Parse the prompt's requirements and measure the workspace and reference URL empirically so every question and token is grounded in real telemetry:

1. **Step 0A — Requirement Parsing & Silent Recon First:**
   - **Workspace `.gitignore` Guard:** Before creating `.unslop/` inside a target project, ensure `.unslop/` is listed in `.gitignore`.
   - **Preflight:** Run `node <skill-dir>/scripts/doctor.mjs` (verify `healthy === true`; note `checks.reaOptional.ok`).
   - **Requirement Coverage Matrix:** Parse the user's prompt across all 5 end-to-end dimensions (`Product Truth & Conversion`, `User Journeys & Functional Scope`, `Visual DNA & Art Direction`, `Hero "Aha" Product Proof, Motion & Media`, `Stack, Mobile Ergonomics, SEO/OG & Redlines`) marking each `Known` / `Inferred` / `Missing`.
   - **Target Codebase (if an existing repo exists):** Run `node <skill-dir>/scripts/detect_stack.mjs <targetDir> .unslop/stack-report.json` and inventory real copy, routes, offerings, and assets.
   - **Inspiration URL (if provided):** Run both:
     ```bash
     node <skill-dir>/scripts/inspect_site.mjs <url> .unslop/inspect
     node <skill-dir>/scripts/extract_reference.mjs <url> .unslop/inspect/reference-tokens.json
     ```
     Read `report.json`'s `reconDigest` and `reference-tokens.json` (`surfaceRatio`, `typography` exact weights/tracking/ratios, `geometryLock`, `alignmentAudit`, `visualMotifs`, `copyDensity`, `cssTokensSnippet`) AND visually inspect `desktop-top.png`, `desktop-mid.png`, `desktop-full.png`, `mobile-top.png`, and `components/*.png`.
   - **Blocked / Auth / Screenshots Only:** If `blocked: true`, stop automation immediately (never bypass CAPTCHAs, Cloudflare, or login walls—see [`references/capabilities-and-limitations.md`](references/capabilities-and-limitations.md)) and rely on user-supplied screenshots.
2. **Step 0B — 10–15 Question Deep Discovery Blueprint (Adaptive Multi-Interval Q&A):**
   - Follow [`references/product-discovery-interview.md`](references/product-discovery-interview.md): use `AskUserQuestion` where supported, numbered options otherwise.
   - For **`standard` and `deep`** builds, run **10 to 15 targeted, recon-grounded questions** delivered in **4 focused intervals of 3–4 questions per turn** covering the complete end-to-end website requirement (auto-skipping already-answered items and substituting sharper domain follow-ups). Always keep the escape hatch (*"Use best defaults & lock the brief"* anytime, or `fast` mode for 1–2 rapid confirmations, or `extract-component` for 3–5 component-scoped technical questions).
3. **Step 0C — Lock `.unslop/brief.md` (Visual DNA, End-to-End Journeys & Two-Tier Contract):**
   - Write `.unslop/brief.md` using [`references/product-brief-template.md`](references/product-brief-template.md) (including Section 7 Visual DNA, Section 8 Copy Economy, Section 11 End-to-End Journeys & Mobile Ergonomics, and Section 12 Unified Art-Direction Seed), enforcing:
     - **Tier 1 Universal Craft Laws (Always Enforced):** Zero stretched card voids, zero wrapped mono status bars, pure header (`<= 5` links + `1` CTA; Theme/Motion in `<footer>` or `Cmd+K`), WCAG AA contrast, `>= 44×44px` mobile tap targets, re-authored mobile ergonomics (`<= 12%` sticky header budget), zero overflow, restrained weights (`400`/`500`), and concise copy economy.
     - **Tier 2 Reference-Driven Visual Grammar (Reference Wins Over Generic Defaults):** Exact observed motifs (substrates, blueprint rails, registration nodes, inset halftone/shader frames, split comparisons), context-driven typography mood (matching reference grotesque vs. editorial serif), coherent button/card geometry, and animation-/proof-first storytelling.
   - Get quick user approval before generating the Style Tile or writing application code.

---

## Phase 0.5 — The 10-Second Hero Style Tile Checkpoint (`standard` & `deep`)

*(Skip in `fast` and `extract-component` runs.)* Before writing 10+ sections, validate visual direction in 10 seconds with a real browser-rendered specimen (load [`references/style-tile-checkpoint.md`](references/style-tile-checkpoint.md)):

```bash
node <skill-dir>/scripts/generate_style_tile.mjs .unslop/style-tile-spec.json .unslop/style-tile
```

1. Write `.unslop/style-tile-spec.json` from `.unslop/brief.md` + `reference-tokens.json` (or pass `reference-tokens.json` directly) and render `.unslop/style-tile/index.html`, `style-tile-desktop.png` (`1440×900`), `style-tile-mobile.png` (`390×844`), and `style-tile-report.json`.
2. Verify `style-tile-report.json` (`passed: true`, zero WCAG AA swatch failures, zero overflow, `motionFreezeVerified: true`) and inspect `style-tile-desktop.png` and `style-tile-mobile.png` visually.
3. Present the Style Tile to the user for a 1-turn gut check (*"Approve & build all sections"* or targeted adjustments like *"warmer / darker / sharper / denser"*), record sign-off in `.unslop/brief.md` Section 13, and lock the palette/type/radius/motion grammar before Wave 2.

---

## Execution Router (Driven Strictly by `.unslop/brief.md`)

Read [`references/execution-modes-and-prompts.md`](references/execution-modes-and-prompts.md) only when routing ambiguity exists or when presenting starter prompt patterns:

- **`fast` (Hackathon / Rapid MVP):** 1–2 rapid confirmations (or best defaults), skip Style Tile, `rea_inspect.mjs`, `parallel-orchestration.md`, and `record_motion_qa.mjs`; build in one modular pass from `.unslop/brief.md` and run 1 `audit_ui.mjs` pass.
- **`standard` (Balanced Production):** 10–15 question discovery (3–4 intervals) + Phase 0.5 Hero Style Tile Checkpoint + `.unslop/DESIGN.md` & `.unslop/COMPONENTS.md` + modular build + 1–2 `audit_ui.mjs` passes (+ optional `record_motion_qa.mjs`).
- **`deep` (Flagship Studio Build):** Full 4-layer extraction (+ optional `rea_inspect.mjs`) + 10–15 question discovery (4 intervals) + Phase 0.5 Hero Style Tile Checkpoint + Locked Studio Seed + **4-Specialist Parallel Guild** (load [`references/parallel-orchestration.md`](references/parallel-orchestration.md) ONLY for `deep`/multi-worker builds) + multi-route `audit_ui.mjs --routes` + mandatory **`record_motion_qa.mjs`** (desktop + mobile `.webm` video walkthroughs + keyframes) + **Pass-3 8-Axis Fresh-Context Design Director Critic (`>= 8/10`)**.
- **`extract-component` (Single Animation / Component):** Targeted `inspect_site.mjs` + `extract_reference.mjs` (+ optional `rea_inspect.mjs`) + 3–5 component-scoped questions → isolated drop-in component adapted to detected stack → targeted `audit_ui.mjs` (+ optional `record_motion_qa.mjs`).

---

## Phase 1 — Deep Forensic Review (When Inspiration or Existing App Exists)

1. **Measured Tokens & Black-Box Telemetry (`reference-tokens.json`, `report.json`, `shaders.json`, `css-motion.json`):** Review `surfaceRatio`, `typography`, `geometryLock`, `alignmentAudit`, `visualMotifs`, `copyDensity`, `gpuShaders`, `sections[]`, `interactiveStates`, `motion.entranceReveals`, `screenshots.mobileFull`, `mobile.collapseSummary`, and `mediaInventory`.
2. **Visual Crop Audit:** Inspect `.unslop/inspect/components/*.png`, tall-section scroll filmstrips (`*-t0.png` .. `*-t3.png`), `desktop-top.png`, `desktop-mid.png`, `desktop-full.png`, `mobile-top.png`, and `mobile-full.png`.
3. **Optional White-Box REA Enrichment (`deep` / `extract-component`, Node `^22.23.4 || ^24.22.1 || >=26.12.1`):**
   ```bash
   node <skill-dir>/scripts/rea_inspect.mjs <url> .unslop/inspect
   ```
   Read `.unslop/inspect/rea-report.json` and inspect **only** compact page-scoped files in `.unslop/inspect/recovered-src/` (see [`references/rea-evaluation.md`](references/rea-evaluation.md)).
4. **Existing App Baseline (`redesign-vibe-transfer`):** Run `node <skill-dir>/scripts/audit_ui.mjs <localUrl> .unslop/audit/baseline` (`--routes /,/pricing,/about` for multi-route apps).

---

## Phase 2 — Contracts (`.unslop/DESIGN.md` & `.unslop/COMPONENTS.md`)

*(Skip standalone `DESIGN.md`/`COMPONENTS.md` only in `fast` mode where `.unslop/brief.md` carries the compact spec directly.)*

1. **Inspiration Translation Matrix (`inspiration-remix` / `redesign-vibe-transfer`):** Use [`references/inspiration-translation-matrix.md`](references/inspiration-translation-matrix.md) to map every extracted band to `Keep/Adapt`, `Merge`, or `Drop` against `.unslop/brief.md`.
2. **`.unslop/DESIGN.md`** (load [`references/design-md-template.md`](references/design-md-template.md), [`references/type-pairings.md`](references/type-pairings.md) — syncing [`references/curated-typography.md`](references/curated-typography.md) — [`references/craft-primitives.md`](references/craft-primitives.md), and [`references/anti-slop-checklist.md`](references/anti-slop-checklist.md); load [`references/visual-art-direction-and-media.md`](references/visual-art-direction-and-media.md) when generating/curating bespoke media or OG/favicon brand surfaces, and [`references/taste-spectrum.md`](references/taste-spectrum.md) only when no inspiration exists):
   - Lock the approved Phase 0.5 Style Tile tokens, One-Room Locked Studio Seed, banned default-font rules, optical `400`/`500` heading weights, and strict 3-radius budget (`--r-card`, `--r-control`, `--r-media`).
3. **`.unslop/COMPONENTS.md`** (load [`references/components-spec-template.md`](references/components-spec-template.md); load [`references/interactive-product-proofs.md`](references/interactive-product-proofs.md) for above-the-fold 5-second "Aha" proofs & re-authored mobile ergonomics; load [`references/motion-and-shader-grammar.md`](references/motion-and-shader-grammar.md) only for shaders, scroll choreography, or `balanced`/`motion-heavy-kinetic` motion):
   - Map every band, product proof sandbox, chrome surface, state machine, shader, and mobile thumb-zone layout 1-to-1 to modular files.
4. **Adapt & Synthesize, Never Clone:** Transfer measured ratios, motifs, typography tension, and interaction physics onto **100% original copy, brand marks, shaders, and domain media**.

---

## Phase 3 — Modular Build & 4-Specialist Parallel Guild

**Never compress a multi-band or kinetic UI into one monolithic HTML file.** Adapt cleanly to the detected stack using [`references/framework-adapters.md`](references/framework-adapters.md) and [`references/craft-primitives.md`](references/craft-primitives.md):

1. **Wave 1 — Shared Foundation First (Coordinator):**
   Author semantic `tokens.css` (from approved Style Tile + `reference-tokens.json` + [`references/type-pairings.md`](references/type-pairings.md)), `@layer base` `layout.css` (outer substrates, vertical blueprint rails, hairline grids, optional `2%` SVG grain), `motion.css`, domain `data/`, and `MotionController`.
2. **Wave 2 — 4-Specialist Parallel Guild (`deep` mode) or Sequential Modules (`fast`/`standard`/single-agent hosts):**
   For `deep`/multi-worker builds only, follow [`references/parallel-orchestration.md`](references/parallel-orchestration.md) with **zero overlapping file ownership**:
   - **Worker A (Media & Locked Art-Direction Seed):** Cohesive `public/assets/*` (`< 500 KB`), SVG favicon, Apple touch icon, `1200×630` OG card.
   - **Worker B (Global Chrome & Navigation):** Pure Header (`<= 5` links + `1` CTA), Mega-Menu, `Cmd+K`, Footer (Theme + Motion toggles), Drawers.
   - **Worker C (Hero Product-Proof & Kinetic Canvases):** 5-second "Aha" interactive product proof ([`references/interactive-product-proofs.md`](references/interactive-product-proofs.md)) + procedural WebGL/Canvas studies ([`references/motion-and-shader-grammar.md`](references/motion-and-shader-grammar.md)).
   - **Worker D (Editorial Sections, Stateful UI & Mobile Ergonomics):** Asymmetric mid-page bands, stateful patterns ([`references/interactive-component-patterns.md`](references/interactive-component-patterns.md)), secondary routes, and re-authored `390×844` thumb-zone mobile layouts.
3. **Engineering & Visual-Craft Invariants:**
   - Use `overflow-x: clip`, `font-optical-sizing: auto`, `tabular-nums`, `white-space: nowrap` for inline terminal/status bars, `min-width: 0` on flex/grid children, zero `justify-content: space-between` voids on tall cards (`> 320px`), `>= 44×44px` touch targets, `<= 12%` mobile sticky header height, and zero overflow down to `320px`.
   - **Context-Appropriateness Gate:** Apply [`references/tactile-hardware-grammar.md`](references/tactile-hardware-grammar.md) and [`assets/micro-synth.ts`](assets/micro-synth.ts) only when tactile hardware craft fits the product.

---

## Phase 4 — Closed-Loop Playwright + Video Motion QA & 8-Axis Design Director Critic

1. **Pass-1 / Pass-2 Automated Browser Audit:**
   ```bash
   node <skill-dir>/scripts/audit_ui.mjs <localUrl> .unslop/audit/pass-<n> [--routes /,/pricing,/about]
   ```
   Verify `summary.passed === true` (`0` critical errors), zero unresolved `studioCraft` regressions, CLS `<= 0.10`, live `<canvas>` animation + Motion-Off freeze, dual-theme WCAG AA contrast, `Escape` dismissal, and `sharedChromeConsistency.consistent === true`.
2. **Real Scroll & Interaction Video Motion QA (`deep` mandatory, `standard` / `extract-component` recommended):**
   ```bash
   node <skill-dir>/scripts/record_motion_qa.mjs <localUrl> .unslop/audit/motion-qa
   ```
   Verify `motion-qa-report.json` (`passed: true`, smooth rAF frame pacing, hover & Motion-Off freeze verified, `0px` mobile scroll overflow, compact sticky header ratio, `desktop-walkthrough.webm` + `mobile-walkthrough.webm` + ordered `keyframe-*.png` strips captured).
3. **Pass-3 8-Axis Multimodal Design Director Critic (`deep` mandatory, `standard` recommended):**
   - Inspect `critic-desktop-*.png`, `critic-mobile-*.png`, `motion-qa/keyframe-*.png`, and `motion-qa-report.json` **side-by-side** with `.unslop/inspect/desktop-top.png`, `desktop-full.png`, and `reference-tokens.json`.
   - In `deep` mode, dispatch a fresh-context read-only Design Director ([`references/parallel-orchestration.md`](references/parallel-orchestration.md)) scoring all **8 Axes (`>= 8/10`)**: `Typography Craft`, `Dead-Space Audit`, `Micro-UI Wrapping`, `Rhythm & Monotony`, `Reference Fidelity`, `Surface Cohesion`, `Side-by-Side Visual Lineage & Copy Economy`, and `Motion Continuity, Video Walkthrough & Mobile Ergonomics`.
   - If any axis scores **`< 8/10`**, apply exact CSS/layout/motion patch directives and re-verify until all 8 axes reach `>= 8/10`.

---

## Phase Completion Gates (Mandatory Checkpoints)

| Transition | Required Gate Artifacts & Pass Condition |
| :--- | :--- |
| **Phase 0 → Phase 0.5** | Silent recon complete (`doctor.mjs` healthy + `detect_stack.mjs` + `inspect_site.mjs` + `extract_reference.mjs`), 10–15 question deep discovery complete (or fast/default override), and **`.unslop/brief.md`** approved. |
| **Phase 0.5 → Phase 1/2** | *(Standard/Deep)* `generate_style_tile.mjs` passes (`passed: true`, 0 contrast/overflow failures, `motionFreezeVerified: true`) and user signs off on `style-tile-desktop.png` / `style-tile-mobile.png`. |
| **Phase 1 → Phase 2** | Extracted telemetry (`reference-tokens.json`, `report.json`, `shaders.json`, `css-motion.json`, crops, `mobile-full.png`) inspected. |
| **Phase 2 → Phase 3** | `.unslop/DESIGN.md` (locked Style Tile tokens + One-Room Studio Seed + 3 radii) and `.unslop/COMPONENTS.md` (5-second Hero proof + mobile ergonomics) aligned to `.unslop/brief.md`. |
| **Phase 3 → Phase 4** | Wave 1 foundation + Wave 2 4-Specialist Guild modules/media built cleanly with zero placeholder copy and clean navbar purity. |
| **Phase 4 → Delivery** | Verified `audit.json` (`passed: true`), verified `motion-qa-report.json` (`passed: true` + `.webm` walkthroughs + keyframes), all **8 Design Director Critic axes `>= 8/10`**, and `.unslop/` ignored in `.gitignore`. |
