# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-11-26

### Added
- **Inspect-First Adaptive Discovery & `.unslop/brief.md` Spec Lock:**
  - Restructured Phase 0 in [`skills/unslop/SKILL.md`](skills/unslop/SKILL.md) and [`skills/unslop/references/product-discovery-interview.md`](skills/unslop/references/product-discovery-interview.md) to run silent recon (`doctor.mjs`, `detect_stack.mjs`, `inspect_site.mjs`) **before** asking questions, so 2–3 adaptive Q&A rounds are grounded in actual extracted tokens, sections, animations, and repository structure (with `AskUserQuestion` support, numbered chat fallback, and a *"Use best defaults"* shortcut).
  - Standardized all scratch telemetry and contracts under `.unslop/` (`brief.md`, `stack-report.json`, `inspect/`, `DESIGN.md`, `COMPONENTS.md`, `audit/`) with an explicit user approval gate on `.unslop/brief.md` before writing code.
- **Execution Presets, Starter Prompts & Parallel Orchestration Playbooks:**
  - `skills/unslop/references/execution-modes-and-prompts.md`: defines 4 adaptive presets (`fast`, `standard`, `deep`, `extract-component`) plus 5 copy-paste starter prompt recipes.
  - `skills/unslop/references/parallel-orchestration.md`: defines the **Two-Wave Disjoint Fan-Out** parallel build strategy (Wave 1 shared foundation → Wave 2 disjoint parallel asset/component/route workers → Wave 3 integration + independent fresh-context read-only reviewer) with seamless sequential fallback on single-agent hosts.
- **Interview-Ready Recon Digest (`inspect_site.mjs`):**
  - Added compact `reconDigest` summary block in `report.json` (`topPaletteHexes`, `primaryFonts`, `sectionCount`, `sectionArchetypes`, `detectedInteractiveTriggers`, `hasWebGL`, `shaderCount`, `scrollTimelinesCount`, `entranceRevealCount`, `mobileCollapsedCount`, `headerHasMenuTrigger`, `mediaCount`, `motionProfile`) to ground Phase 0 questions without parsing raw dumps.

### Changed
- Updated `skills/unslop/scripts/doctor.mjs` and `skills/unslop/scripts/verify_harness.mjs` to validate all 18 core skill files and assert `reconDigest` schema fields.
- Synchronized version `1.2.0` across `package.json`, `package-lock.json`, `skills/unslop/package.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, and `skills/unslop/SKILL.md`, and updated `README.md` and `plan.md`.

## [1.1.0] - 2026-11-19

### Added
- **Environment Preflight & Codebase Stack Detection:**
  - `skills/unslop/scripts/doctor.mjs` (`npm run doctor`): verifies Node `>= 22.6.0`, optional REA Node compatibility (`^22.23.4 || ^24.22.1 || >=26.12.1`), Playwright resolution, Chromium/Chrome launchability (`--no-launch` supported), and core skill manifest files with actionable remediation steps.
  - `skills/unslop/scripts/detect_stack.mjs` (`npm run detect-stack`): read-only detector for framework, router, TypeScript, Tailwind CSS v3/v4, UI & motion libraries, font packages, `:root`/`@theme` CSS custom properties, route files, asset directories, and tailored migration advice.
- **Five Launch-Readiness Engineering References (`skills/unslop/references/`):**
  - `product-discovery-interview.md`: repo-first content inventory rule and bounded 5-question intake protocol.
  - `product-brief-template.md`: structured `PRODUCT_BRIEF.md` contract with explicit no-fabrication redlines.
  - `framework-adapters.md`: production integration rules for Next.js App Router (`'use client'` boundaries, `useEffect` cleanup, `next/font`), Vite + React, Tailwind CSS v3/v4 (`@theme inline` + shadcn/ui variable bridge), Vue/Nuxt/Astro, and strangler-fig hybrid refactoring.
  - `inspiration-translation-matrix.md`: 7-archetype Adapt/Merge/Drop translation table and 4-axis Multi-Source Remix Matrix (Layout / Palette / Typography / Motion).
  - `interactive-component-patterns.md`: accessible Vanilla ESM + React state-machine blueprints for Command Palette (`Cmd+K`), Mega-Menu, Filterable Catalog + Detail Drawer, Pricing Toggle & Calculator, Multi-Step Validated Form, and Slide-Over Cart/Booking Drawer.
- **Forensic Inspector Upgrades (`skills/unslop/scripts/inspect_site.mjs`):**
  - Safe non-navigating interactive state click-probing (`interactiveStates`) capturing ARIA changes, opened overlays, theme/root mutations, and `Escape` dismissal.
  - Viewport-triggered scroll entrance reveal detection (`motion.entranceReveals`).
  - Full-page mobile capture (`mobile-full.png` / `screenshots.mobileFull`) and desktop-to-mobile responsive collapse summary (`mobile.collapseSummary`).
  - Structured media inventory (`mediaInventory`) tracking visible `<img>`, `<video>`, and `<canvas>` counts, dimensions, and aspect ratios.
- **Closed-Loop Auditor Upgrades (`skills/unslop/scripts/audit_ui.mjs`):**
  - Core Web Vitals CLS tracking via `PerformanceObserver` (`performance.cls`) and oversized image payload warnings (`performance.oversizedImages` > 500 KB).
  - Semantic link & heading hygiene checks (`semantics`: broken `#anchor` links, dead `href="#"` placeholders, `<title>`, meta description, `h1Count`, skipped heading levels).
  - Active Motion-Off toggle verification (`kinetic.reducedMotionToggleCheck`) confirming animated `<canvas>` frames actually stop.
  - Active alternate-theme WCAG AA contrast verification (`accessibility.alternateThemeContrast`) and interactive overlay `Escape` dismissal testing (`accessibility.interactiveOverlayChecks`).
  - Multi-route batch auditing (`auditMultiRoute` / `--routes /,/pricing,/about`) writing per-route reports plus consolidated `multi-route-audit.json` with shared header/footer consistency checks.

### Changed
- Upgraded [`skills/unslop/SKILL.md`](skills/unslop/SKILL.md) to a 6-stage pipeline (Phase 0 – Phase 5) with mandatory Phase Completion Gates linking all 15 reference guides.
- Expanded `scripts/validate-skill.mjs` to enforce version synchronization with `package-lock.json` and `SKILL.md` metadata, verify every `skills/unslop/references/*.md` file is linked from `SKILL.md`, and check relative markdown links across all reference documents.
- Expanded `skills/unslop/scripts/verify_harness.mjs` and `fixtures/` to deterministically test all v1.1 detection, preflight, inspection, and single/multi-route audit capabilities.

## [1.0.0] - 2026-11-19

### Added
- **Portable `unslop` Agent Skill (`skills/unslop/`):**
  - 5-phase engineering playbook ([`SKILL.md`](skills/unslop/SKILL.md)) supporting three workflows: `unslop-existing`, `inspiration-remix`, and `hybrid`.
  - Standalone skill manifest (`skills/unslop/package.json`) and dynamic Playwright resolution (`browser_helper.mjs`) supporting local Chrome fallback and zero-friction installs across standard skill directories.
  - Plugin & marketplace distribution manifests (`.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`).
- **4-Layer Forensic Site Extractor (`skills/unslop/scripts/inspect_site.mjs`):**
  - Runtime GPU WebGL/WebGL2 `shaderSource` and `getUniformLocation` interception (`shaders.json`) working with or without source maps.
  - Network CSS stylesheet capture (`css-motion.json`) extracting `@keyframes`, CSS Scroll-Driven Animations (`view-timeline`, `scroll-timeline`, `animation-range`), `@property`, `cubic-bezier(...)` curves, and `:root` custom properties even across CORS boundaries.
  - Containment-deduplicated section & custom-element anatomy, fixed/sticky chrome hiding, and 4-frame sticky-section scroll filmstrips (`t0`–`t3`).
  - Area-weighted color budgets, dominant body typography scale, per-family commercial font detection, interactive surface discovery, and hover state deltas.
- **Optional Framework-Agnostic REA Source Enrichment (`skills/unslop/scripts/rea_inspect.mjs`):**
  - Upfront Node version guard (`^22.23.4 || ^24.22.1 || >=26.12.1`) with clean skip fallback on older runtimes.
  - Script export (`--include-script-sources`) and 512 MiB source-map materialization filtered strictly to page-relevant component modules and motion/shader helpers.
- **Uncontaminated Kinetic & Accessibility QA Engine (`skills/unslop/scripts/audit_ui.mjs`):**
  - Raw `<canvas>` pixel variance and animation delta checks (`preserveDrawingBuffer: true` + `toDataURL`) that catch blank shaders even beneath overlaid display typography.
  - Deduplicated tall-section scroll-progression filmstrips (`t0`–`t3`) and computed-style mutation verification.
  - WCAG AA contrast compositing (including CSS Color 4 and media-backed overlay awareness), keyboard Tab focus verification, `[inert]`/`opacity: 0`/`sr-only` filtering, multi-viewport overflow (`320px`, `390px`, `768px`, `1440px`), mobile tap-target checks, and top/mid-scroll mobile fixed-overlay collision detection.
- **Modular Engineering References & Optional Assets:**
  - `capabilities-and-limitations.md`, `design-md-template.md`, `components-spec-template.md`, `motion-and-shader-grammar.md`, `visual-art-direction-and-media.md`, `curated-typography.md`, `anti-slop-checklist.md`, `taste-spectrum.md`, `tactile-hardware-grammar.md`, `rea-evaluation.md`, and dependency-free `assets/micro-synth.ts`.
- **Verification & CI Infrastructure:**
  - 5-suite Playwright regression harness (`verify_harness.mjs`) with clean, slop, kinetic shader/scroll, containment-deduplication, inert-drawer, and blank-canvas-under-text fixtures.
  - Skill integrity validator (`scripts/validate-skill.mjs`) and GitHub Actions CI matrix across Node 22 & 24.

### Security & Ethics
- Enforces strict stop-on-block boundaries for HTTP 401/403/429/503, CAPTCHAs, Turnstile challenges, and login walls—never attempts bypass.
- Enforces original synthesis over proprietary asset cloning (no copying brand marks, third-party photography, or proprietary source/binaries).
