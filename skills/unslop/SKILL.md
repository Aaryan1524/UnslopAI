---
name: unslop
description: Use when building a website from scratch, redesigning an existing UI to match an inspiration site's vibe/layout, or dissecting and porting a specific UI animation, WebGL shader, or interactive component—with inspect-first adaptive discovery, locked .unslop/brief.md approval, fast/standard/deep/extract presets, parallel orchestration, and closed-loop Playwright QA.
license: MIT
compatibility: Requires Node.js >= 22.6 and Playwright (Chromium or local Google Chrome) for automated inspection and audit scripts. Optional REA bundle enrichment requires Node ^22.23.4, ^24.22.1, or >=26.12.1.
metadata:
  author: Aaryan1524
  version: "1.2.0"
  repository: "https://github.com/Aaryan1524/UnslopAI"
---

# Unslop — Inspect-First Adaptive Discovery, Kinetic Craft & Closed-Loop QA

Turn any frontend build, inspiration-driven redesign, or single-animation extraction into an adaptive, browser-verified engineering pipeline. One minimal `/unslop` skill routes cleanly across **Fast**, **Standard**, **Deep (Launch-Ready + Parallel)**, and **Extract-Component** presets—starting with real recon and a request-specific discovery interview before writing a single line of application code.

> **Script Paths & Workspace Hygiene:** Commands below use `<skill-dir>/scripts/...` (resolve `<skill-dir>` to the folder containing this `SKILL.md`, e.g., `skills/unslop` in-repo or `~/.agents/skills/unslop` standalone). `browser_helper.mjs` resolves `playwright` automatically. Store all scratch telemetry, contracts, and audits inside **`.unslop/`** (`brief.md`, `stack-report.json`, `inspect/`, `DESIGN.md`, `COMPONENTS.md`, `audit/`) and **add `.unslop/` to the target repository's `.gitignore` before writing scratch files** (or remove temporary recon/audit dumps on delivery) so generated projects stay clean.
>
> **Strict Lazy-Loading Rule:** Read ONLY the reference files triggered by the active phase, locked preset, and target stack—**never preload all 17 `references/*.md` files upfront**. Skip `parallel-orchestration.md` in `fast`/single-pass runs, skip `rea-evaluation.md` unless running `rea_inspect.mjs`, skip `inspiration-translation-matrix.md` when no inspiration exists, skip `taste-spectrum.md` when a visual direction exists, skip `motion-and-shader-grammar.md` in `minimal-crisp` motion runs, skip `tactile-hardware-grammar.md` unless tactile craft fits, and skip `visual-art-direction-and-media.md` in `fast` mode.

---

## Phase 0 — Silent Recon → Request-Specific Adaptive Q&A → `.unslop/brief.md` Lock

**Never write application code before completing Phase 0.** Inspect first so every question is grounded in actual workspace and reference telemetry—never generic Q&A:

1. **Silent Recon First:**
   - **Workspace `.gitignore` Guard:** Before creating `.unslop/` inside a target project, ensure `.unslop/` is listed in the project's `.gitignore` (create or append `.unslop/` if missing) so recon screenshots and audit JSONs never pollute git status.
   - **Preflight:** Run `node <skill-dir>/scripts/doctor.mjs` (verify `healthy === true`; note `checks.reaOptional.ok`).
   - **Target Codebase (if an existing repo exists):** Run `node <skill-dir>/scripts/detect_stack.mjs <targetDir> .unslop/stack-report.json` and inventory real copy, routes, offerings, and assets already in the repo.
   - **Inspiration URL (if provided):** Run `node <skill-dir>/scripts/inspect_site.mjs <url> .unslop/inspect` and read `report.json`'s `reconDigest` (`topPaletteHexes`, `primaryFonts`, `sectionArchetypes`, `detectedInteractiveTriggers`, `hasWebGL`, `scrollTimelinesCount`, `mobileCollapsedCount`, `mediaCount`, `motionProfile`) plus `desktop-top.png` / `mobile-top.png`.
   - **Blocked / Auth / Screenshots Only:** If `report.json` reports `blocked: true`, stop automation immediately (never bypass CAPTCHAs, Cloudflare, or login walls—see [`references/capabilities-and-limitations.md`](references/capabilities-and-limitations.md)) and rely on user-supplied screenshots.
2. **Request-Specific Adaptive Q&A (2–3 Quick Rounds):**
   - Follow [`references/product-discovery-interview.md`](references/product-discovery-interview.md): use `AskUserQuestion` (or the host's structured multiple-choice UI) where supported, and clean numbered choices in chat elsewhere.
   - Cite concrete recon facts (actual extracted hexes, sections, overlays, animations, and detected stack), skip anything already answered in the prompt or repo, and always offer a **"Use best defaults"** shortcut.
   - Lock: **Goal Mode** (`build-from-scratch` / `redesign-vibe-transfer` / `extract-component`), **Depth Preset** (`fast` / `standard` / `deep`), **Visual Fidelity**, **Palette Strategy**, **Motion Density**, **Product Truth**, and **Priority Sections / Animations**.
3. **Lock `.unslop/brief.md` & User Approval Gate:**
   - Write `.unslop/brief.md` using [`references/product-brief-template.md`](references/product-brief-template.md) (enforce no-fabrication redlines—never invent metrics, logos, or testimonials).
   - Summarize the locked brief concisely and get quick user approval before proceeding (unless the user explicitly requested *"use best defaults and build immediately"*).

---

## Execution Router (Driven Strictly by `.unslop/brief.md`)

Read [`references/execution-modes-and-prompts.md`](references/execution-modes-and-prompts.md) only when routing ambiguity exists or when presenting starter prompt patterns:

- **`fast` (Hackathon / Rapid MVP):** Skip `rea_inspect.mjs`, skip heavy separate `DESIGN.md`/`COMPONENTS.md` splits, skip `parallel-orchestration.md` and bespoke shader/artgen synthesis, build cleanly in one modular pass from `.unslop/brief.md`, and run 1 `audit_ui.mjs` verification pass.
- **`standard` (Balanced Production):** Full inspection review + `.unslop/DESIGN.md` & `.unslop/COMPONENTS.md` + modular build + 1–2 `audit_ui.mjs` passes.
- **`deep` (Launch-Ready Flagship):** Full 4-layer extraction (+ optional `rea_inspect.mjs`) + `.unslop/DESIGN.md` & `.unslop/COMPONENTS.md` + **Two-Wave Disjoint Parallel Orchestration** (load [`references/parallel-orchestration.md`](references/parallel-orchestration.md) ONLY for `deep`/multi-worker builds) + mandatory 2-pass `audit_ui.mjs` (`--routes`) + **Independent Fresh-Context Reviewer**.
- **`extract-component` (Single Animation / Component):** Targeted `inspect_site.mjs` (`css-motion.json`, `shaders.json`, `interactiveStates`, tall-section filmstrips) + optional `rea_inspect.mjs` → focused isolated component adapted to detected stack → targeted `audit_ui.mjs` verification without modifying unrelated pages.

---

## Phase 1 — Deep Forensic Review (When Inspiration or Existing App Exists)

Before authoring contracts or code, inspect the full extracted evidence in `.unslop/inspect/`:

1. **Black-Box Telemetry (`report.json`, `shaders.json`, `css-motion.json`):** Review `techStack`, `cssVariables`, `customElements`, `interactiveSurfaces`, `interactiveStates`, `gpuShaders`, `colors`, `typography`, deduplicated `sections[]` + `scrollMotion`, `motion.scrollTimelines`, `motion.entranceReveals`, `hoverDeltas`, `screenshots.mobileFull`, `mobile.collapseSummary`, and `mediaInventory`.
2. **Visual Crop Audit:** Inspect every `.unslop/inspect/components/*.png`, tall-section scroll filmstrip (`*-t0.png` .. `*-t3.png`), `desktop-top.png`, `desktop-mid.png`, `desktop-full.png`, `mobile-top.png`, and `mobile-full.png` up close.
3. **Optional White-Box REA Enrichment (`deep` / `extract-component`, Node `^22.23.4 || ^24.22.1 || >=26.12.1`):**
   ```bash
   node <skill-dir>/scripts/rea_inspect.mjs <url> .unslop/inspect
   ```
   Read `.unslop/inspect/rea-report.json` and inspect **only** compact page-scoped files in `.unslop/inspect/recovered-src/` (see [`references/rea-evaluation.md`](references/rea-evaluation.md); never load multi-megabyte `rea-raw/*.json` dumps).
4. **Existing App Baseline (`redesign-vibe-transfer`):** Run `node <skill-dir>/scripts/audit_ui.mjs <localUrl> .unslop/audit/baseline` (add `--routes /,/pricing,/about` for multi-route apps) to record initial performance, contrast, semantic, canvas, and kinetic defects.

---

## Phase 2 — Contracts (`.unslop/DESIGN.md` & `.unslop/COMPONENTS.md`)

*(Skip standalone `DESIGN.md`/`COMPONENTS.md` only in `fast` mode where `.unslop/brief.md` carries the compact spec directly.)*

1. **Inspiration Translation Matrix (`inspiration-remix` / `redesign-vibe-transfer`):**
   Use [`references/inspiration-translation-matrix.md`](references/inspiration-translation-matrix.md) to map every extracted band to `Keep/Adapt`, `Merge`, or `Drop` against `.unslop/brief.md`. For multi-source remixes, lock one authoritative source per axis (Layout / Palette / Typography / Motion).
2. **`.unslop/DESIGN.md`** (load only what applies: [`references/design-md-template.md`](references/design-md-template.md), [`references/curated-typography.md`](references/curated-typography.md), [`references/anti-slop-checklist.md`](references/anti-slop-checklist.md); load [`references/visual-art-direction-and-media.md`](references/visual-art-direction-and-media.md) only when generating/curating bespoke media, and [`references/taste-spectrum.md`](references/taste-spectrum.md) only when no inspiration or direction exists):
   - Semantic color tokens & area ratios honoring WCAG AA contrast (`>= 4.5:1` body, `>= 3:1` large text) across all enabled themes.
   - Curated open-source typography and a **Shared Visual Art-Direction Brief** governing every media slot so images blend cleanly into card surfaces.
3. **`.unslop/COMPONENTS.md`** (load [`references/components-spec-template.md`](references/components-spec-template.md); load [`references/motion-and-shader-grammar.md`](references/motion-and-shader-grammar.md) only when shaders, scroll choreography, or `balanced`/`motion-heavy-kinetic` motion is locked):
   - Map every kept band, chrome surface, interactive state machine, shader, scroll track, and dialog 1-to-1 to its own modular file, exact mechanics, mobile collapse behavior, and verification criteria.
4. **Adapt & Synthesize, Never Clone:** Transfer layout rhythm, proportions, shader atmosphere, and interaction physics onto **100% original copy, brand marks, shaders, and domain media**.

---

## Phase 3 — Modular Build & Two-Wave Parallel Orchestration

**Never compress a multi-band or kinetic UI into one monolithic HTML file.** Adapt cleanly to the detected stack using [`references/framework-adapters.md`](references/framework-adapters.md):

1. **Wave 1 — Shared Foundation First (Coordinator):**
   Author semantic `tokens.css` (or Tailwind v4 `@theme inline` / shadcn/ui variable bridge), `@layer base` `layout.css`, `motion.css` (`@supports (animation-timeline: view())` + `prefers-reduced-motion` overrides), shared domain `data/`, and a single global `MotionController` wired to OS reduced-motion + an interactive Motion toggle.
2. **Wave 2 — Parallel Disjoint Workers (`deep` mode) or Sequential Modules (`fast`/`standard`/single-agent hosts):**
   For `deep`/multi-worker builds only, follow [`references/parallel-orchestration.md`](references/parallel-orchestration.md) with **zero overlapping file ownership**:
   - **Cohesive Media Batches (`public/assets/*`):** Generate/curate assets matching the Shared Art-Direction Brief and optimize payloads `< 500 KB`.
   - **Disjoint Component & Route Workers:** Global Chrome (nav, mega-menu, `Cmd+K` search, drawers, footer), Hero & Kinetic Shaders/Scroll Tracks (load [`references/motion-and-shader-grammar.md`](references/motion-and-shader-grammar.md) only when kinetic/shader work applies), Interactive State Machines (load [`references/interactive-component-patterns.md`](references/interactive-component-patterns.md) only for checked interactive surfaces in `.unslop/brief.md`), and Secondary Routes.
3. **Engineering & Accessibility Invariants:**
   - Use `overflow-x: clip` (never `overflow: hidden` on ancestors of `position: sticky`), solid matching fallback `background-color` behind `<canvas>`/`<img>` overlays, `min-width: 0` on grid/flex items, `100%`/`100dvh` (not `100vw`), visible `:focus-visible` rings, `>= 44×44px` mobile touch targets, zero mobile overflow down to `320px`, and settled `opacity: 1` resting states.
   - **Context-Appropriateness Gate:** Apply [`references/tactile-hardware-grammar.md`](references/tactile-hardware-grammar.md) and [`assets/micro-synth.ts`](assets/micro-synth.ts) only when tactile hardware craft fits the product.

---

## Phase 4 — Closed-Loop QA & Independent Fresh-Context Review

1. **Run Automated Browser Verification:**
   ```bash
   # Single route
   node <skill-dir>/scripts/audit_ui.mjs <localUrl> .unslop/audit/pass-<n>

   # Multi-route batch (writes per-route audit.json + consolidated multi-route-audit.json)
   node <skill-dir>/scripts/audit_ui.mjs <localUrl> .unslop/audit/pass-<n> --routes /,/pricing,/about
   ```
   Verify `summary.passed === true` (`0` critical errors, `0` warnings online): `performance.cls <= 0.10`, `0` `oversizedImages > 500 KB`, clean `semantics` (0 broken `#anchors`, 0 dead `href="#"`, valid `<title>`/`<meta name="description">`, single `<h1>`, 0 skipped heading levels), live non-blank `kinetic.canvasChecks`, `reducedMotionToggleCheck.canvasStoppedAnimating === true`, `alternateThemeContrast` WCAG AA pass, `interactiveOverlayChecks` open + `Escape` dismissal, `0` mobile collisions/overflow (`320px`–`1440px`), and `sharedChromeConsistency.consistent === true`.
2. **Visual Critique & Independent Fresh-Context Reviewer (`deep` mode mandatory, `standard` recommended):**
   - Inspect `desktop.png`, `mobile.png`, `focus-check.png`, `scroll-25/50/75.png`, and `sections/*.png` alongside `.unslop/inspect/components/*` and `mobile-full.png`.
   - In `deep` mode, dispatch a fresh-context read-only reviewer ([`references/parallel-orchestration.md`](references/parallel-orchestration.md)) with only `.unslop/brief.md`, `audit.json`, and screenshots to score the 5 craft axes (`1`–`5`) and list concrete fixes.
3. **Pass-2 Polish Loop (`deep` mandatory, `standard` when any axis `< 4/5`):** Fix every critical error and every craft axis `< 4/5`, re-run `audit_ui.mjs`, and verify Pass-2 screenshots before delivering.

---

## Phase Completion Gates (Mandatory Checkpoints)

| Transition | Required Gate Artifacts & Pass Condition |
| :--- | :--- |
| **Phase 0 → Execution** | Silent recon complete (`doctor.mjs` healthy + `detect_stack.mjs` / `inspect_site.mjs` when applicable), request-specific adaptive Q&A complete, and **`.unslop/brief.md` approved by the user** (or explicit defaults shortcut). |
| **Phase 1 → Phase 2** | Extracted telemetry (`report.json`, `reconDigest`, `shaders.json`, `css-motion.json`, crops, `mobile-full.png`) or existing-app baseline `audit.json` inspected. |
| **Phase 2 → Phase 3** | `.unslop/DESIGN.md` and `.unslop/COMPONENTS.md` aligned to `.unslop/brief.md` *(compact `.unslop/brief.md` suffices in `fast` / `extract-component` modes)*. |
| **Phase 3 → Phase 4** | Wave 1 foundation + Wave 2 modular components/media built with zero overlapping edits and zero placeholder copy. |
| **Phase 4 → Delivery** | Verified `audit.json` (plus `multi-route-audit.json` for multi-route builds) with `passed: true`, clean visual inspection, all 5 craft axes `>= 4/5` (`deep` requires Pass-2 + independent reviewer sign-off), and `.unslop/` ignored in `.gitignore` (or temporary recon/audit dumps cleaned up) so the target repo stays clean. |
