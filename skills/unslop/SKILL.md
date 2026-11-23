---
name: unslop
description: Use when auditing or refactoring an existing UI that looks generic or template-driven, or when deconstructing an inspiration website or screenshots—including WebGL shaders, CSS scroll-driven animations, and complex interactive components—to build an original interface tailored to the user's product and taste.
license: MIT
compatibility: Requires Node.js >= 22.6 and Playwright (Chromium or local Google Chrome) for automated inspection and audit scripts. Optional REA bundle enrichment requires Node ^22.23.4, ^24.22.1, or >=26.12.1.
metadata:
  author: Aaryan1524
  version: "1.1.0"
  repository: "https://github.com/Aaryan1524/UnslopAI"
---

# Unslop — Forensic UI Deconstruction, Modular Craft & Kinetic Verification

Turn any UI refactoring or website-inspiration redesign into a deterministic **6-stage engineering pipeline (Phase 0 – Phase 5)** built for consistent visual craft, real motion/shaders, cohesive art direction, interactive engineering, and verified accessibility without cutting corners.

> **Script Paths:** Commands below use `<skill-dir>/scripts/...` (resolve `<skill-dir>` to the folder containing this `SKILL.md`, e.g., `skills/unslop` in-repo or `~/.agents/skills/unslop` when installed standalone). `browser_helper.mjs` resolves `playwright` from `<skill-dir>/node_modules` or the current workspace automatically.

---

## Phase 0 — Environment Preflight

Verify runtime prerequisites before inspecting or auditing any target:

```bash
node <skill-dir>/scripts/doctor.mjs
```

Confirm `healthy === true` (`node >= 22.6.0`, Playwright resolution, Chromium/Chrome launch, and skill manifest integrity; pass `--no-launch` only when validating non-browser steps). Note `checks.reaOptional.ok` to decide whether optional white-box REA enrichment is available.

---

## Phase 1 — Deep Product Discovery, Codebase Awareness & Scope Lock

1. **Detect Existing Codebase Stack (Read-Only):**
   On any existing repository (`unslop-existing` or `hybrid` mode), inspect the workspace before asking questions:
   ```bash
   node <skill-dir>/scripts/detect_stack.mjs <targetDir> <workDir>/stack-report.json
   ```
   Review detected `framework`, `router`, `typescript`, `styling`, `uiLibraries`, `motionLibraries`, `fontPackages`, `existingCssTokens`, `routeFiles`, `assetDirs`, and `migrationAdvice`.
2. **Product Discovery Interview & `PRODUCT_BRIEF.md`:**
   - Follow [`references/product-discovery-interview.md`](references/product-discovery-interview.md): inventory real repo copy, offerings, routes, and assets first, then ask at most 5 focused questions for missing product truth (ICP & core job, real proof/differentiators, primary conversion flow, required interactive components, real assets/tone constraints).
   - Emit `PRODUCT_BRIEF.md` using [`references/product-brief-template.md`](references/product-brief-template.md). Never fabricate customer metrics, logos, testimonials, or unverified features.
3. **Lock Mode, Framework Adapter & Taste Rules:**
   - **Mode:** `unslop-existing` (audit & upgrade existing UI), `inspiration-remix` (build original UI from inspiration URL/screenshots), or `hybrid` (refactor existing app using inspiration grammar).
   - **Framework Adapter:** Consult [`references/framework-adapters.md`](references/framework-adapters.md) for Next.js App Router `'use client'` boundaries, Vite + React, Tailwind CSS v3/v4 (`@theme inline` + shadcn/ui variable mapping), Vue/Nuxt/Astro, and strangler-fig migration safety.
   - **Inspiration-First Taste Rule:** Preserve an inspiration source's structural cadence, proportions, typography tension, and kinetic grammar while applying only explicit user taste modifiers. Consult [`references/taste-spectrum.md`](references/taste-spectrum.md) only when no inspiration and no aesthetic direction exist.
4. **Disclose Scope Upfront:** Review [`references/capabilities-and-limitations.md`](references/capabilities-and-limitations.md) and state clearly what will be faithfully adapted, procedurally synthesized, or excluded.

---

## Phase 2 — 4-Layer Forensic Deconstruction

Never guess an inspiration site's design or animations from memory or a single thumbnail. Gather ground truth first:

- **Inspiration URL (Black-Box First — Works With Zero Source Maps):**
  ```bash
  node <skill-dir>/scripts/inspect_site.mjs <url> <inspectDir>
  ```
  Inspect ALL distilled outputs:
  1. `<inspectDir>/report.json`: `techStack`, `cssVariables`, `customElements`, `interactiveSurfaces`, `interactiveStates` (safe click-probed ARIA/overlay/theme transitions), `gpuShaders`, `colors` (area-weighted ratios), `typography`, `sections[]` (deduplicated bands + `dissolved` + `scrollMotion`), `motion.scrollTimelines`, `motion.entranceReveals` (viewport-triggered reveal transitions), `hoverDeltas`, `screenshots.mobileFull`, `mobile.collapseSummary` (desktop-to-mobile responsive grid collapse), and `mediaInventory` (visible `<img>`, `<video>`, and `<canvas>` counts, dimensions, and aspect ratios).
  2. `<inspectDir>/shaders.json` & `<inspectDir>/css-motion.json`: compiled GLSL vertex/fragment shaders & uniform names intercepted at the GPU call, plus CORS-proof `@keyframes`, `view-timeline`/`animation-range` rules, `@property`, and `cubic-bezier(...)` curves.
  3. **Visually inspect EVERY `<inspectDir>/components/*.png`, tall-section scroll filmstrip (`*-t0.png` .. `*-t3.png`), `desktop-top.png`, `desktop-mid.png`, `desktop-full.png`, `mobile-top.png`, and `mobile-full.png` up close** before designing.
- **Optional White-Box REA Enrichment (Node `^22.23.4 || ^24.22.1 || >=26.12.1`):**
  ```bash
  node <skill-dir>/scripts/rea_inspect.mjs <url> <inspectDir>
  ```
  Read `<inspectDir>/rea-report.json` and inspect **only** compact page-scoped files materialized in `<inspectDir>/recovered-src/` (see [`references/rea-evaluation.md`](references/rea-evaluation.md)). *(Never load multi-megabyte `rea-raw/*.json` dumps into context.)*
- **Blocked / Auth / Screenshots Only:** If `report.json` reports `blocked: true`, stop automation immediately (never bypass CAPTCHAs, Cloudflare, or login walls) and dissect component grammar visually from user screenshots.
- **Existing App Baseline:** Run `node <skill-dir>/scripts/audit_ui.mjs <localUrl> <auditDir>/baseline` (or add `--routes /,/pricing,/about` for multi-route apps) to capture initial performance, contrast, semantic, canvas, and kinetic defects.

---

## Phase 3 — Contracts (`DESIGN.md`, Translation Matrix & `COMPONENTS.md`)

Write **all design and component contracts** before writing component code:

1. **Inspiration Translation Matrix (for `inspiration-remix` / `hybrid`):**
   Use [`references/inspiration-translation-matrix.md`](references/inspiration-translation-matrix.md) to classify every extracted band by communicative job (Atmospheric Anchor, Editorial Proof, Kinetic Catalog, Sequential Narrative, Ecosystem Convergence, Manifesto Split, Conversion Capture) with explicit **Adapt / Merge / Drop** decisions tied to `PRODUCT_BRIEF.md`. When combining multiple inspirations, lock one authoritative source per axis (Layout / Palette / Typography / Motion).
2. **`DESIGN.md`** (from [`references/design-md-template.md`](references/design-md-template.md), [`references/curated-typography.md`](references/curated-typography.md), [`references/anti-slop-checklist.md`](references/anti-slop-checklist.md), and [`references/visual-art-direction-and-media.md`](references/visual-art-direction-and-media.md)):
   - Semantic color tokens & area ratios remapped to the user's palette while preserving WCAG AA contrast (`>= 4.5:1` body, `>= 3:1` large text) across both light and dark modes where toggled.
   - Curated open-source web typography (unless offline-only is requested) and a **Shared Visual Art-Direction Brief** governing every asset slot so zero empty placeholder boxes exist.
3. **`COMPONENTS.md`** (from [`references/components-spec-template.md`](references/components-spec-template.md) and [`references/motion-and-shader-grammar.md`](references/motion-and-shader-grammar.md)):
   - Map **every kept band, chrome surface, interactive state machine, shader, scroll track, and dialog** 1-to-1 to its own modular file, exact mechanics, visual assets, mobile collapse behavior, and verification criteria.
4. **Adapt & Synthesize, Never Clone:** Transfer layout cadence, proportions, shader atmosphere, and interaction physics onto **100% original copy, brand marks, shaders, and cohesive domain imagery**.

---

## Phase 4 — Modular Build, Framework Integration & Interactive Engineering

**Never compress a multi-band or kinetic UI into one monolithic HTML file.** Follow [`references/framework-adapters.md`](references/framework-adapters.md) and this build order:

1. **Foundation First:** Author semantic `tokens.css` (or Tailwind v4 `@theme inline` / shadcn/ui variable bridge), `@layer base` `layout.css`, `motion.css` (`@supports (animation-timeline: view())` + `prefers-reduced-motion` overrides), domain `data/`, and a single global `MotionController` wired to OS reduced-motion + an interactive Motion toggle.
2. **Cohesive Media Synthesis (Safe Parallel Track):** Run media generation or curation in **disjoint asset batches** (`public/assets/*`) separate from code edits, and inspect samples visually for palette and lighting unity.
3. **Build One Component at a Time in Strict Order:**
   - **App Shell & Interactive Chrome** (header, mega-menus/flyouts, `Cmd+K` command palette, mobile drawer, focus traps).
   - **Each Domain Band & Interactive Surface in `COMPONENTS.md`** sequentially:
     - Implement kinetic choreography and shaders per [`references/motion-and-shader-grammar.md`](references/motion-and-shader-grammar.md).
     - Implement real accessible interactive state machines (Command Palette, Mega-Menu, Filterable Catalog + Detail Drawer, Pricing Toggle & Calculator, Multi-Step Validated Form, Slide-Over Cart/Booking Drawer) per [`references/interactive-component-patterns.md`](references/interactive-component-patterns.md).
   - **Footer & Accessible Dialogs/Drawers** (`Esc`/backdrop close, validation feedback, focus restoration).
4. **Engineering & Accessibility Invariants:**
   - Use `overflow-x: clip` (never `overflow: hidden` on ancestors of `position: sticky`).
   - Place a solid matching fallback `background-color` behind `<canvas>`/`<img>` hero overlays.
   - Enforce `min-width: 0` on grid/flex items, `100%`/`100dvh` (not `100vw`), visible `:focus-visible` rings, `>= 44×44px` mobile touch targets, zero floating fixed mobile collisions, and settled `opacity: 1` resting states.
   - **Context-Appropriateness Gate:** Apply [`references/tactile-hardware-grammar.md`](references/tactile-hardware-grammar.md) and [`assets/micro-synth.ts`](assets/micro-synth.ts) only when tactile hardware craft fits the product.

---

## Phase 5 — Closed-Loop Kinetic, Performance & Accessibility QA

Do **not** stop after Pass-1 even if `audit_ui.mjs` passes. Execute at least **2 visual & kinetic polish loops** (`pass-1` → `pass-2`):

1. **Run Automated QA (Single-Route or Multi-Route):**
   ```bash
   # Single route
   node <skill-dir>/scripts/audit_ui.mjs <localUrl> <auditDir>/pass-<n>

   # Multi-route batch (writes per-route audit.json + consolidated multi-route-audit.json)
   node <skill-dir>/scripts/audit_ui.mjs <localUrl> <auditDir>/pass-<n> --routes /,/pricing,/about
   ```
   Verify `audit.json` (and `multi-route-audit.json` for multi-route apps):
   - `summary.passed === true` (`0` critical errors, `0` warnings online).
   - `performance.cls` (`<= 0.10` ideal; `> 0.25` fails) and `performance.oversizedImages` (`0` images `> 500 KB`).
   - `semantics`: `0` broken `#anchor` links, `0` dead `href="#"` placeholders, valid `<title>` / `<meta name="description">`, single `<h1>`, and `0` skipped heading levels.
   - `kinetic.canvasChecks`: every visible large `<canvas>` has `isBlank === false` and `animatesOverTime === true` when animated.
   - `kinetic.scrollMotionChecks`: every tall sticky scroll track confirms `kineticChangesDetected === true` across `t0 → t3`.
   - `kinetic.reducedMotionToggleCheck`: clicking an interactive Motion toggle actually freezes animated canvases (`canvasStoppedAnimating === true`).
   - `accessibility.alternateThemeContrast`: alternate light/dark theme passes WCAG AA contrast when a theme toggle exists.
   - `accessibility.interactiveOverlayChecks`: interactive dialog/menu triggers open cleanly and dismiss on `Escape`.
   - `layout.mobileOverlayCollisions`: `0` collisions at top and scrolled mobile viewports; `sharedChromeConsistency.consistent === true` across multi-route builds.
2. **Side-by-Side Visual Critique & Fresh-Context Review:**
   - Visually inspect `desktop.png`, `mobile.png`, `focus-check.png`, `scroll-25/50/75.png`, and every cropped `sections/*.png` & `*-t0..t3.png` filmstrip side-by-side with `<inspectDir>/components/*` and `mobile-full.png`.
   - Score 5 craft axes honestly (`1`–`5`) and refine every axis `< 4`: **Typography & Editorial Tension**, **Atmospheric & Visual Media Cohesion**, **Kinetic Fidelity & Pacing**, **Micro-Architecture & Contrast**, and **Interactive & Responsive Polish**.
3. Re-run `audit_ui.mjs` after Pass-2 edits and confirm all visual, performance, semantic, and behavioral checks pass cleanly before delivering.

---

## Phase Completion Gates (Mandatory Checkpoints)

Do **not** advance past a phase until its gate artifacts exist and pass:

| Transition | Required Gate Artifacts & Pass Condition |
| :--- | :--- |
| **Phase 0 → Phase 1** | `doctor.mjs` reports `healthy: true` (Node `>= 22.6.0`, Playwright & browser verified, skill files intact). |
| **Phase 1 → Phase 2** | `PRODUCT_BRIEF.md` authored from real discovery/repo truth (+ `stack-report.json` when refactoring an existing repo) and scope disclosed. |
| **Phase 2 → Phase 3** | Inspiration telemetry (`report.json`, `shaders.json`, `css-motion.json`, `components/*.png`, `mobile-full.png`) or existing-app baseline `audit.json` captured and inspected. |
| **Phase 3 → Phase 4** | `DESIGN.md` (with Inspiration Translation Matrix when remixing) and `COMPONENTS.md` written and aligned to `PRODUCT_BRIEF.md`. |
| **Phase 4 → Phase 5** | All planned modular components, interactive state machines, and responsive rules built cleanly with zero placeholder copy. |
| **Phase 5 → Delivery** | Verified Pass-2 `audit.json` / `audit-report.json` (plus `multi-route-audit.json` for multi-route builds) with `passed: true`, clean visual inspection, and all 5 craft axes `>= 4/5`. |
