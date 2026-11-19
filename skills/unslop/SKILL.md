---
name: unslop
description: Use when auditing or refactoring an existing UI that looks generic or template-driven, or when deconstructing an inspiration website or screenshots—including WebGL shaders, CSS scroll-driven animations, and complex interactive components—to build an original interface tailored to the user's product and taste.
license: MIT
compatibility: Requires Node.js >= 22.6 and Playwright (Chromium or local Google Chrome) for automated inspection and audit scripts. Optional REA bundle enrichment requires Node ^22.23.4, ^24.22.1, or >=26.12.1.
metadata:
  author: Aaryan1524
  version: "1.0.0"
  repository: "https://github.com/Aaryan1524/UnslopAI"
---

# Unslop — Forensic UI Deconstruction, Modular Craft & Kinetic Verification

Turn any UI refactoring or website-inspiration redesign into a deterministic **5-phase engineering pipeline** designed so **any model** can reproduce flagship visual craft, real motion/shaders, cohesive art direction, and verified accessibility without cutting corners.

> **Script Paths:** Commands below use `<skill-dir>/scripts/...` (resolve `<skill-dir>` to the folder containing this `SKILL.md`, e.g., `skills/unslop` in-repo or `~/.claude/skills/unslop` when installed standalone). `browser_helper.mjs` resolves `playwright` from `<skill-dir>/node_modules` or the current workspace automatically.

---

## Phase 1 — Intake, Mode Lock & Capability Disclosure

1. **Lock scope before touching code:**
   - **Mode:** `unslop-existing` (audit & upgrade existing UI), `inspiration-remix` (build original UI from inspiration URL/screenshots), or `hybrid` (refactor existing app using inspiration grammar).
   - **Product, Audience & Stack:** Clarify target framework (clean modular Vanilla ESM / Web Components, React, Next.js, Vue) and visual media strategy (generated bespoke photography, user assets, or procedural Canvas/WebGL visuals).
   - **Inspiration-First Taste Rule:** When an inspiration source exists, preserve its structural cadence, proportions, typography tension, and kinetic grammar while applying only the user's explicit taste modifiers (e.g., palette/mood shift). Only consult [`references/taste-spectrum.md`](references/taste-spectrum.md) when no inspiration and no aesthetic direction exist.
2. **Disclose scope upfront:** Review [`references/capabilities-and-limitations.md`](references/capabilities-and-limitations.md) and state clearly what will be faithfully adapted, procedurally synthesized (original WebGL2 shaders, CSS scroll-timelines, Canvas cinema loops, art-directed imagery), or excluded.

---

## Phase 2 — 4-Layer Forensic Deconstruction

Never guess an inspiration site's design or animations from memory or a single full-page thumbnail. Gather ground truth first:

- **Inspiration URL (Black-Box First — Works Even With Zero Source Maps):**
  ```bash
  node <skill-dir>/scripts/inspect_site.mjs <url> <inspectDir>
  ```
  Inspect ALL distilled outputs:
  1. `<inspectDir>/report.json`: `techStack`, `cssVariables`, `customElements`, `interactiveSurfaces`, `gpuShaders`, `colors` (area-weighted ratios), `typography`, `sections[]` (deduplicated bands + `dissolved` + `scrollMotion`), `motion.scrollTimelines`, and `hoverDeltas`.
  2. `<inspectDir>/shaders.json` & `<inspectDir>/css-motion.json`: compiled GLSL vertex/fragment shaders & uniform names intercepted at the GPU call, plus CORS-proof `@keyframes`, `view-timeline`/`animation-range` rules, `@property`, and `cubic-bezier(...)` curves.
  3. **Visually inspect EVERY `<inspectDir>/components/*.png` and tall-section scroll filmstrip (`*-t0.png` .. `*-t3.png`) up close** before designing.
- **Optional White-Box REA Enrichment (Node `^22.23.4 || ^24.22.1 || >=26.12.1`):**
  ```bash
  node <skill-dir>/scripts/rea_inspect.mjs <url> <inspectDir>
  ```
  Read `<inspectDir>/rea-report.json` (`mountedCustomTags`, `accessibility.outline`, `bundleArchitecture`, `exportedScriptSignals`, `recoveredSources.materialized`) and inspect **only** the compact page-scoped files materialized in `<inspectDir>/recovered-src/`. *(Never load multi-megabyte `rea-raw/*.json` dumps into context.)*
- **Blocked / Auth / Screenshots Only:** If `report.json` reports `blocked: true`, stop automation immediately (never bypass CAPTCHAs, Cloudflare, or login walls) and dissect component grammar visually from user screenshots or user-owned CDP ([`references/rea-evaluation.md`](references/rea-evaluation.md)).
- **Existing App Baseline:** Run `node <skill-dir>/scripts/audit_ui.mjs <localUrl> <auditDir>/baseline` to capture initial visual, contrast, layout, canvas, and kinetic defects.

---

## Phase 3 — Dual Contracts (`DESIGN.md` + `COMPONENTS.md`) & Visual Art Direction

Write **both** project blueprints **before** writing component code:

1. **`DESIGN.md`** (from [`references/design-md-template.md`](references/design-md-template.md), [`references/curated-typography.md`](references/curated-typography.md), [`references/anti-slop-checklist.md`](references/anti-slop-checklist.md), and [`references/visual-art-direction-and-media.md`](references/visual-art-direction-and-media.md)):
   - Semantic color tokens & area ratios remapped cleanly to the user's palette while preserving WCAG AA contrast (`>= 4.5:1` body, `>= 3:1` large text) and luminance hierarchy.
   - Expressive curated open-source web typography by default (unless offline-only is explicitly requested).
   - **Shared Visual Art-Direction Brief** (lighting angle, palette hex lock, surface textures, grain, `"zero text/logos/watermarks"`) governing every visual asset slot so zero empty placeholder boxes exist.
2. **`COMPONENTS.md`** (from [`references/components-spec-template.md`](references/components-spec-template.md) and [`references/motion-and-shader-grammar.md`](references/motion-and-shader-grammar.md)):
   - Map **every observed band, chrome surface, shader, scroll track, and dialog** 1-to-1 to its own modular file, exact motion/state mechanics, visual assets, mobile collapse behavior, and verification bar.
3. **Adapt & Synthesize, Never Clone:** Transfer layout cadence, proportions, shader atmosphere, and interaction physics onto **100% original copy, brand marks, shaders, and cohesive domain imagery**.

---

## Phase 4 — Modular Component-by-Component Build (& Safe Parallelism)

**Never compress a multi-band or kinetic UI into one monolithic HTML file.** Follow this build sequence:

1. **Foundation First:** Author semantic `tokens.css`, `@layer` `layout.css`, `motion.css` (`@supports (animation-timeline: view())` + `prefers-reduced-motion` overrides), domain `data/`, and a single global `MotionController` wired to OS reduced-motion + an interactive Motion toggle.
2. **Cohesive Media Synthesis (Safe Parallel Track):** If generating or curating imagery for editorial/product slots, run media generation in **disjoint asset batches** (`public/assets/*`) completely separate from code edits—zero overlapping file writes! Inspect generated samples visually for palette/lighting harmony.
3. **Build One Component at a Time in Strict Order:**
   - **App Shell & Interactive Chrome** (header, dropdowns/flyouts, search/command modal, mobile drawer, focus traps).
   - **Each Domain Band listed in `COMPONENTS.md`** sequentially (implementing every extracted kinetic mechanism—procedural WebGL2 shaders with context-loss & Canvas2D fallback, CSS scroll-timelines, sticky scroll stages, stacking cards, 3D transforms, or procedural Canvas media loops—using [`references/motion-and-shader-grammar.md`](references/motion-and-shader-grammar.md)).
   - **Footer & Accessible Dialogs/Drawers** (`Esc`/backdrop close, validation feedback, focus restoration).
4. **Engineering & Accessibility Invariants:**
   - Use `overflow-x: clip` (never `overflow: hidden` on ancestors of `position: sticky`!).
   - Always place a solid matching fallback `background-color` on the container behind `<canvas>`/`<img>` hero overlays.
   - Enforce `min-width: 0` on grid/flex items, `100%`/`100dvh` (not `100vw`), visible `:focus-visible` rings, `>= 44×44px` mobile touch targets, zero floating fixed mobile collisions, and settled `opacity: 1` resting states.
   - **Context-Appropriateness Gate:** Apply [`references/tactile-hardware-grammar.md`](references/tactile-hardware-grammar.md) and [`assets/micro-synth.ts`](assets/micro-synth.ts) only when tactile hardware craft fits the product.

---

## Phase 5 — Kinetic QA, Fresh-Context Critique & Recursive Polish Loop

Do **not** stop after Pass-1 even if `audit_ui.mjs` passes. Execute at least **2 visual & kinetic polish loops** (`pass-1` → `pass-2`):

1. **Run Automated Kinetic & Accessibility QA:**
   ```bash
   node <skill-dir>/scripts/audit_ui.mjs <localUrl> <auditDir>/pass-<n>
   ```
   Verify `audit.json`:
   - `summary.passed === true` (`0` critical errors, `0` warnings online).
   - `kinetic.canvasChecks`: every visible large `<canvas>` has `isBlank === false` (raw uncontaminated pixels) and `animatesOverTime === true` when animated.
   - `kinetic.scrollMotionChecks`: every tall sticky scroll track confirms `kineticChangesDetected === true` across `t0 → t3`.
   - `layout.mobileOverlayCollisions`: `0` collisions at both top and scrolled mobile viewports.
2. **Verify Real Interactions:** Exercise dropdowns, search overlays, tabs, drawers/modals (`Esc` close + focus restore), media Play/Pause toggles, and the global **Motion Off** switch in Playwright.
3. **Side-by-Side Visual Critique & Optional Fresh-Context Advisor:**
   - Visually inspect `desktop.png`, `mobile.png`, `focus-check.png`, `scroll-25/50/75.png`, and every cropped `sections/*.png` & `*-t0..t3.png` filmstrip **side-by-side** with the inspiration's `<inspectDir>/components/*`.
   - When subagents are available on high-stakes builds, run one **read-only fresh-context advisor pass** over the screenshots and `audit.json` to catch spacing, pacing, contrast, or responsiveness blind spots without author bias.
4. **Score 5 Craft Axes Honestly (`1`–`5`) and Refine Every Axis `< 4`:**
   - **Typography & Editorial Tension** (scale contrast, tracking, italic/mono accents, crisp loaded fonts)
   - **Atmospheric & Visual Media Cohesion** (shader warmth/grain, photography unity, zero placeholder boxes)
   - **Kinetic Fidelity & Pacing** (smooth progression across `t0 → t3`, clean settled states, reduced-motion poise)
   - **Micro-Architecture & Contrast** (hairlines, radii hierarchy, WCAG AA across all surfaces and scrims)
   - **Interactive & Responsive Polish** (working chrome/modals/search, clean `320px`/`390px`/`768px`/`1440px` layout)
5. Re-run `audit_ui.mjs` after Pass-2 edits and confirm all visual and behavioral checks pass cleanly before delivering.
