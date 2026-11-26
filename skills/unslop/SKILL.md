---
name: unslop
description: Use when building a website from scratch, redesigning an existing UI to match an inspiration site's measured palette, typography, and layout geometry, or porting a UI animation or component—with inspect-first adaptive discovery, reference-tokens.json extraction, .unslop/brief.md lock, parallel orchestration, and closed-loop Playwright + Pass-3 Visual Critic QA.
license: MIT
compatibility: Requires Node.js >= 22.6 and Playwright (Chromium or local Google Chrome) for automated inspection, reference token extraction, and audit scripts. Optional REA bundle enrichment requires Node ^22.23.4, ^24.22.1, or >=26.12.1.
metadata:
  author: Aaryan1524
  version: "1.3.0"
  repository: "https://github.com/Aaryan1524/UnslopAI"
---

# Unslop — Inspect-First Adaptive Discovery, Reference Craft & Closed-Loop QA

Turn any frontend build, inspiration-driven redesign, or single-animation extraction into an adaptive, studio-grade engineering pipeline. One minimal `/unslop` skill routes across **Fast**, **Standard**, **Deep (Launch-Ready + Parallel)**, and **Extract-Component** presets—measuring reference DOM/CSS tokens first, locking section rhythm & geometry contracts before coding, and auditing both DOM mechanics and visual craft before delivery.

> **Script Paths & Workspace Hygiene:** Commands below use `<skill-dir>/scripts/...` (resolve `<skill-dir>` to the folder containing this `SKILL.md`, e.g., `skills/unslop` in-repo or `~/.agents/skills/unslop` standalone). `browser_helper.mjs` resolves `playwright` automatically. Store all scratch telemetry, contracts, and audits inside **`.unslop/`** (`brief.md`, `stack-report.json`, `inspect/`, `DESIGN.md`, `COMPONENTS.md`, `audit/`) and **add `.unslop/` to the target repository's `.gitignore` before writing scratch files** (or clean temporary dumps on delivery) so generated projects stay clean.
>
> **Strict Lazy-Loading Rule:** Read ONLY the reference files triggered by the active phase, locked preset, and target stack—**never preload all 19 `references/*.md` files upfront**. Skip `parallel-orchestration.md` in `fast`/single-pass runs, skip `rea-evaluation.md` unless running `rea_inspect.mjs`, skip `inspiration-translation-matrix.md` when no inspiration exists, skip `taste-spectrum.md` when a visual direction exists, skip `motion-and-shader-grammar.md` in `minimal-crisp` motion runs, skip `tactile-hardware-grammar.md` unless tactile craft fits, and skip `visual-art-direction-and-media.md` in `fast` mode.

---

## Phase 0 — Silent Recon → Request-Specific Adaptive Q&A → `.unslop/brief.md` Lock

**Never write application code before completing Phase 0.** Measure the workspace and reference URL empirically so questions and design tokens are grounded in real telemetry—never guesswork:

1. **Silent Recon First:**
   - **Workspace `.gitignore` Guard:** Before creating `.unslop/` inside a target project, ensure `.unslop/` is listed in the project's `.gitignore` (create or append `.unslop/` if missing).
   - **Preflight:** Run `node <skill-dir>/scripts/doctor.mjs` (verify `healthy === true`; note `checks.reaOptional.ok`).
   - **Target Codebase (if an existing repo exists):** Run `node <skill-dir>/scripts/detect_stack.mjs <targetDir> .unslop/stack-report.json` and inventory real copy, routes, offerings, and assets already in the repo.
   - **Inspiration URL (if provided):** Run both:
     ```bash
     node <skill-dir>/scripts/inspect_site.mjs <url> .unslop/inspect
     node <skill-dir>/scripts/extract_reference.mjs <url> .unslop/inspect/reference-tokens.json
     ```
     Read `report.json`'s `reconDigest` and `reference-tokens.json` (`surfaceRatio`, `typography` exact weights/tracking/ratios, `geometryLock` modal card/button/input/media radii, `alignmentAudit`, and `cssTokensSnippet`) plus `desktop-top.png` / `mobile-top.png`.
   - **Blocked / Auth / Screenshots Only:** If `blocked: true`, stop automation immediately (never bypass CAPTCHAs, Cloudflare, or login walls—see [`references/capabilities-and-limitations.md`](references/capabilities-and-limitations.md)) and rely on user-supplied screenshots.
2. **Request-Specific Adaptive Q&A (2–3 Quick Rounds):**
   - Follow [`references/product-discovery-interview.md`](references/product-discovery-interview.md): use `AskUserQuestion` (or structured choices) where supported, numbered options otherwise.
   - Cite concrete extracted facts (actual `surfaceRatio` lightness %, measured display weight/tracking, extracted bands/overlays, and detected stack), skip anything already answered, and offer *"Use best defaults"*.
3. **Lock `.unslop/brief.md` + Rhythm & Geometry Contract:**
   - Write `.unslop/brief.md` using [`references/product-brief-template.md`](references/product-brief-template.md), locking:
     - **Aligned Reference Tokens:** Exact measured polarity, light/dark surface %, heading weights (`400`/`500` where crisp—never default `700`/`800`), negative tracking, and curated font mapping.
     - **Alternating Section Rhythm:** Explicitly forbid `> 2` consecutive centered-pyramid sections (`Hero split` → `Sticky numbered flow` → `Full-bleed telemetry` → `Hairline bento`).
     - **Strict 3-Radius Budget (`--r-card`, `--r-control`, `--r-media`), Navbar Purity Rule (`<= 5` links + `1` primary CTA; Theme/Motion in `<footer>` or `Cmd+K`), Anti-Void Card Rule, and No-Fabrication Redlines.**
   - Get quick user approval before writing application code (unless the user asked to build immediately with defaults).

---

## Execution Router (Driven Strictly by `.unslop/brief.md`)

Read [`references/execution-modes-and-prompts.md`](references/execution-modes-and-prompts.md) only when routing ambiguity exists or when presenting starter prompt patterns:

- **`fast` (Hackathon / Rapid MVP):** Skip `rea_inspect.mjs`, skip heavy separate `DESIGN.md`/`COMPONENTS.md` splits, skip `parallel-orchestration.md` and bespoke shader/artgen synthesis, build cleanly in one modular pass from `.unslop/brief.md`, and run 1 `audit_ui.mjs` verification pass.
- **`standard` (Balanced Production):** Full inspection review + `.unslop/DESIGN.md` & `.unslop/COMPONENTS.md` + modular build + 1–2 `audit_ui.mjs` passes.
- **`deep` (Launch-Ready Flagship):** Full 4-layer extraction (+ optional `rea_inspect.mjs`) + `.unslop/DESIGN.md` & `.unslop/COMPONENTS.md` + **Two-Wave Disjoint Parallel Orchestration** (load [`references/parallel-orchestration.md`](references/parallel-orchestration.md) ONLY for `deep`/multi-worker builds) + automated `audit_ui.mjs` (`--routes`) + **Pass-3 Multimodal Visual Art-Director Critique**.
- **`extract-component` (Single Animation / Component):** Targeted `inspect_site.mjs` + `extract_reference.mjs` (+ optional `rea_inspect.mjs`) → focused isolated component adapted to detected stack → targeted `audit_ui.mjs` verification without modifying unrelated pages.

---

## Phase 1 — Deep Forensic Review (When Inspiration or Existing App Exists)

Before authoring contracts or code, inspect the extracted evidence in `.unslop/inspect/`:

1. **Measured Tokens & Black-Box Telemetry (`reference-tokens.json`, `report.json`, `shaders.json`, `css-motion.json`):** Review `surfaceRatio`, `typography` scale/weights, `geometryLock`, `alignmentAudit`, `gpuShaders`, `sections[]`, `interactiveStates`, `motion.entranceReveals`, `screenshots.mobileFull`, `mobile.collapseSummary`, and `mediaInventory`.
2. **Visual Crop Audit:** Inspect `.unslop/inspect/components/*.png`, tall-section scroll filmstrips (`*-t0.png` .. `*-t3.png`), `desktop-top.png`, `desktop-mid.png`, `desktop-full.png`, `mobile-top.png`, and `mobile-full.png` up close.
3. **Optional White-Box REA Enrichment (`deep` / `extract-component`, Node `^22.23.4 || ^24.22.1 || >=26.12.1`):**
   ```bash
   node <skill-dir>/scripts/rea_inspect.mjs <url> .unslop/inspect
   ```
   Read `.unslop/inspect/rea-report.json` and inspect **only** compact page-scoped files in `.unslop/inspect/recovered-src/` (see [`references/rea-evaluation.md`](references/rea-evaluation.md); never load multi-megabyte `rea-raw/*.json` dumps).
4. **Existing App Baseline (`redesign-vibe-transfer`):** Run `node <skill-dir>/scripts/audit_ui.mjs <localUrl> .unslop/audit/baseline` (`--routes /,/pricing,/about` for multi-route apps).

---

## Phase 2 — Contracts (`.unslop/DESIGN.md` & `.unslop/COMPONENTS.md`)

*(Skip standalone `DESIGN.md`/`COMPONENTS.md` only in `fast` mode where `.unslop/brief.md` carries the compact spec directly.)*

1. **Inspiration Translation Matrix (`inspiration-remix` / `redesign-vibe-transfer`):**
   Use [`references/inspiration-translation-matrix.md`](references/inspiration-translation-matrix.md) to map every extracted band to `Keep/Adapt`, `Merge`, or `Drop` against `.unslop/brief.md`. For multi-source remixes, lock one authoritative source per axis.
2. **`.unslop/DESIGN.md`** (load [`references/design-md-template.md`](references/design-md-template.md), [`references/type-pairings.md`](references/type-pairings.md) — syncing [`references/curated-typography.md`](references/curated-typography.md) — [`references/craft-primitives.md`](references/craft-primitives.md), and [`references/anti-slop-checklist.md`](references/anti-slop-checklist.md); load [`references/visual-art-direction-and-media.md`](references/visual-art-direction-and-media.md) only when generating/curating bespoke media, and [`references/taste-spectrum.md`](references/taste-spectrum.md) only when no inspiration or direction exists):
   - Enforce warm neutral / warm-charcoal palette discipline (`#151414` dark surfaces, `#FFFFFF`/`#FAF9F6` light canvas, banning default `#0B0D14` navy-slate unless reference-measured), banned default-font rules (`Inter`, `Plus Jakarta Sans`, `Space Grotesk`, `Poppins`, `Roboto` banned unless reference-proven), optical weights (`400`/`500` headings), and the locked 3-radius budget (`--r-card`, `--r-control`, `--r-media`).
3. **`.unslop/COMPONENTS.md`** (load [`references/components-spec-template.md`](references/components-spec-template.md); load [`references/motion-and-shader-grammar.md`](references/motion-and-shader-grammar.md) only when shaders, scroll choreography, or `balanced`/`motion-heavy-kinetic` motion is locked):
   - Map every band, chrome surface, micro-UI artifact, interactive state machine, shader, scroll track, and dialog 1-to-1 to modular files and mobile collapse rules.
4. **Adapt & Synthesize, Never Clone:** Transfer measured ratios, typography tension, shader atmosphere, and interaction physics onto **100% original copy, brand marks, shaders, and domain media**.

---

## Phase 3 — Modular Build & Two-Wave Parallel Orchestration

**Never compress a multi-band or kinetic UI into one monolithic HTML file.** Adapt cleanly to the detected stack using [`references/framework-adapters.md`](references/framework-adapters.md) and [`references/craft-primitives.md`](references/craft-primitives.md):

1. **Wave 1 — Shared Foundation First (Coordinator):**
   Author semantic `tokens.css` (from `reference-tokens.json` + curated pairing in [`references/type-pairings.md`](references/type-pairings.md) + locked `--r-card`/`--r-control`/`--r-media`), `@layer base` `layout.css` (shared `1px` hairline grid primitives, optional `2%` SVG grain), `motion.css`, domain `data/`, and `MotionController`.
2. **Wave 2 — Parallel Disjoint Workers (`deep` mode) or Sequential Modules (`fast`/`standard`/single-agent hosts):**
   For `deep`/multi-worker builds only, follow [`references/parallel-orchestration.md`](references/parallel-orchestration.md) with **zero overlapping file ownership**:
   - **Cohesive Media Batches (`public/assets/*`):** Optimize payloads `< 500 KB`.
   - **Disjoint Component & Route Workers:** Pure Header (`<= 5` links + `1` primary CTA) + Mega-Menu + Footer (with Theme & Motion toggles + `Cmd+K`), Hero & Kinetic Canvases ([`references/motion-and-shader-grammar.md`](references/motion-and-shader-grammar.md)), Product-Native Micro-UI Artifacts + State Machines ([`references/interactive-component-patterns.md`](references/interactive-component-patterns.md)), and Secondary Routes.
3. **Engineering & Visual-Craft Invariants:**
   - Use `overflow-x: clip` (never `overflow: hidden` on ancestors of `position: sticky`), `font-optical-sizing: auto`, `tabular-nums` for telemetry/timers, `white-space: nowrap` for inline terminal bars/status pills, `min-width: 0` on flex/grid children, zero `justify-content: space-between` voids on tall cards (`> 320px`), `>= 44×44px` mobile touch targets, and zero horizontal overflow down to `320px`.
   - **Context-Appropriateness Gate:** Apply [`references/tactile-hardware-grammar.md`](references/tactile-hardware-grammar.md) and [`assets/micro-synth.ts`](assets/micro-synth.ts) only when tactile hardware craft fits the product.

---

## Phase 4 — Closed-Loop QA & Pass-3 Multimodal Visual Critic

1. **Run Automated Browser Verification & Studio-Craft Checks:**
   ```bash
   node <skill-dir>/scripts/audit_ui.mjs <localUrl> .unslop/audit/pass-<n> [--routes /,/pricing,/about]
   ```
   Verify `summary.passed === true` (`0` critical errors) AND zero unresolved `studioCraft` warnings (`radiusContract.radiusDriftDetected === false`, `sectionRhythm.monotonyDetected === false`, `stretchedVoidCards: []`, `navClutter.cluttered === false`, `wrappedMonoBars: []`, `defaultFontFlags: []`), alongside CLS `<= 0.10`, `semantics` hygiene, live `<canvas>` animation + Motion-Off freeze, dual-theme WCAG AA contrast, `Escape` overlay dismissal, and `sharedChromeConsistency.consistent === true`.
2. **Pass-3 Multimodal Visual Art-Director Critique (`deep` mode mandatory, `standard` recommended):**
   - Inspect tiled `critic-desktop-*.png` (`1440×900`) and `critic-mobile-*.png` (`390×844`) captures + `visual-critic-checklist.json` alongside `.unslop/inspect/reference-tokens.json`.
   - In `deep` mode, dispatch a fresh-context read-only Visual Critic ([`references/parallel-orchestration.md`](references/parallel-orchestration.md)) scoring the **6-Axis 10-Point Anti-Slop Rubric** (`Typography Craft`, `Dead-Space Audit`, `Micro-UI Wrapping`, `Rhythm & Monotony`, `Reference Fidelity`, `Surface Cohesion`).
   - If any axis scores **`< 8/10`**, output concrete CSS/layout patch directives, execute a targeted polish pass, and re-run `audit_ui.mjs` until all 6 axes reach `>= 8/10`.

---

## Phase Completion Gates (Mandatory Checkpoints)

| Transition | Required Gate Artifacts & Pass Condition |
| :--- | :--- |
| **Phase 0 → Execution** | Silent recon complete (`doctor.mjs` healthy + `detect_stack.mjs` + `inspect_site.mjs` + `extract_reference.mjs` `reference-tokens.json` when applicable), request-specific Q&A complete, and **`.unslop/brief.md`** (with Section Rhythm & Geometry Contract) approved by user. |
| **Phase 1 → Phase 2** | Extracted telemetry (`reference-tokens.json`, `report.json`, `shaders.json`, `css-motion.json`, crops, `mobile-full.png`) inspected. |
| **Phase 2 → Phase 3** | `.unslop/DESIGN.md` (curated typography + warm/reference palette + 3 radii) and `.unslop/COMPONENTS.md` aligned to `.unslop/brief.md`. |
| **Phase 3 → Phase 4** | Wave 1 foundation + Wave 2 modular components/media built cleanly with zero placeholder copy and clean navbar purity. |
| **Phase 4 → Delivery** | Verified `audit.json` (`passed: true`, zero studio-craft regressions), inspected `critic-desktop-*.png` / `critic-mobile-*.png`, all 6 Pass-3 Visual Critic axes `>= 8/10`, and `.unslop/` ignored in `.gitignore`. |
