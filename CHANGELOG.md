# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-11-27

### Added
- **10–15 Question Deep Discovery Engine (`product-discovery-interview.md`, `product-brief-template.md`):**
  - Added Step 0A **5-Dimension End-to-End Requirement Coverage Matrix** (`Product Truth & Conversion`, `User Journeys & Functional Scope`, `Visual DNA & Art Direction`, `Hero "Aha" Product Proof, Motion & Media`, `Stack, Mobile Ergonomics, SEO/OG & Redlines`).
  - Upgraded Step 0B to a structured **15-Question Deep Discovery Bank** delivered in **4 focused intervals (3–4 questions/turn)** with adaptive substitution for already-answered items and per-interval escape hatches (`Use best defaults` / `fast` mode / `extract-component`).
  - Expanded `.unslop/brief.md` with **Section 11 (End-to-End User Journeys, Interactive Product Proof & Mobile Ergonomics)**, **Section 12 (Unified Art-Direction Seed & Asset Manifest)**, and **Section 13 (Phase 0.5 Hero Style Tile Sign-Off)**.
- **Phase 0.5 — The 10-Second Hero Style Tile Checkpoint (`scripts/generate_style_tile.mjs`, `references/style-tile-checkpoint.md`, `npm run style-tile`):**
  - Generates a standalone browser-rendered Hero + WCAG AA Swatch Strip + Type/Radius Specimen + Motion-Freeze preview (`index.html`, `style-tile-desktop.png`, `style-tile-mobile.png`, `style-tile-report.json`) from either a custom spec or `reference-tokens.json` so users validate direction in 10 seconds before full-site generation.
- **Unified Art-Direction Seed & Interactive Product-Proof Studio (`visual-art-direction-and-media.md`, `interactive-product-proofs.md`):**
  - Added the **Locked Studio Seed Contract** (one-room lighting, color temperature, focal length, surface finish, palette hex bindings, negative prompt redlines, `< 500 KB` budget) plus production SVG favicon, Apple touch icon, and `1200×630` Open Graph card checklist.
  - Added `interactive-product-proofs.md` defining 5 above-the-fold 5-second "Aha" stateful proof archetypes and **re-authored mobile ergonomics** (`<= 12%` sticky header budget, thumb-zone action bars, snap-scroll proof decks, bottom sheets, Pointer Events scrub rules).
- **Real Scroll & Interaction Video Motion QA (`scripts/record_motion_qa.mjs`, `npm run motion-qa`) & 8-Axis Design Director Critic (`audit_ui.mjs`, `parallel-orchestration.md`):**
  - Records playable desktop (`1280×720`) and mobile (`390×844`) Playwright `.webm` walkthrough videos alongside ordered PNG keyframe strips, in-page `requestAnimationFrame` frame-pacing telemetry, hover + Motion-Off freeze checks, and mobile scroll ergonomics into `motion-qa-report.json`.
  - Upgraded `visual-critic-checklist.json` to **`8-axis-10-point`** (`Axis 8: Motion Continuity, Video Walkthrough & Mobile Ergonomics`) and upgraded Wave 2 orchestration to the **4-Specialist Parallel Guild**.
- **Verification Harness & Doctor Coverage (`doctor.mjs`, `verify_harness.mjs`):**
  - Expanded `doctor.mjs` to verify all `25` core skill files and added Playwright regression **Suites 12 & 13** (`generateStyleTile` + `recordMotionQA` + 8-axis critic verification).

## [1.4.0] - 2026-11-26

### Added
- **Visual-Motif & Copy-Economy Extraction (`skills/unslop/scripts/extract_reference.mjs`):**
  - Added deterministic `visualMotifs` (`hasDotOrGridBackground`, `hasVerticalGuideRails`, `hasInsetHeroFrame`, `heroAlignment`, `pillPrimaryCtaDetected`, `usesTintedLightCards`, `hasDarkContentPanels`) and `copyDensity` (`h1WordCount`, `heroSubheadWordCount`, `medianHeadingWordCount`, `medianCardWordCount`, `copyDensityTier`) telemetry to `reference-tokens.json`.
- **Two-Tier Rule Precedence & Context-Driven Typography (`type-pairings.md`, `anti-slop-checklist.md`, `SKILL.md`):**
  - Separated **Tier 1 Universal Craft Laws** (always enforced: zero voids, zero wrapped mono bars, pure header, WCAG AA contrast, `44px` tap targets, copy economy) from **Tier 2 Reference-Driven Visual Grammar** so reference-measured grotesque typography, inset halftone heroes, pill primary CTAs with `4px` cards, and luminous tinted micro-UIs are faithfully preserved rather than overridden by generic defaults.
- **Architectural Motif Primitives (`craft-primitives.md`):**
  - Added reusable CSS/Canvas primitives for outer dot-matrix gutter substrates, continuous vertical blueprint guide rails + `7×7px` square registration nodes, notched corner-bracket callouts, inset halftone/solar-glow hero/CTA frames + bottom ticker marquees, 50/50 split comparison stages, and luminous tinted-surface micro-UIs.
- **Dynamic Multi-Interval Discovery (`product-discovery-interview.md`, `product-brief-template.md`):**
  - Replaced rigid round caps with dynamic `1` to `10+` question intervals adapting to prompt completeness, capturing visual motif fidelity, typography mood, copy minimalism, and product-explaining signature animations.
- **7-Axis Side-by-Side Visual Lineage & Copy Economy Critic (`audit_ui.mjs`, `parallel-orchestration.md`):**
  - Upgraded `visual-critic-checklist.json` to `7-axis-10-point` adding `copyEconomy` metrics and `sideBySideVisualLineage` comparing reference captures directly beside generated `critic-desktop-*.png` tiles.

## [1.3.0] - 2026-11-26

### Added
- **Deterministic Reference Token Extractor (`skills/unslop/scripts/extract_reference.mjs` / `npm run extract-ref`):**
  - Extracts `reference-tokens.json` from any reference URL: pixel-area `surfaceRatio` (light/dark polarity, exact accents, hairlines), measured `typography` (`fontWeight`, `lineHeightRatio`, `letterSpacingEm` across `h1`–`code`), modal `geometryLock` (`cardRadius`, `buttonRadius`, `inputRadius`, `mediaRadius`, `flatHairlineSystem`), `alignmentAudit` (`centeredPct`, `leftAlignedPct`, `maxConsecutiveCentered`), and a ready-to-lock `:root` `cssTokensSnippet`.
- **Curated Typography & Visual Craft References (`skills/unslop/references/`):**
  - `type-pairings.md`: hard-bans generic AI sans defaults (`Inter`, `Plus Jakarta Sans`, `Space Grotesk`, `Poppins`, `Roboto`) unless reference-proven; locks optical CSS rules (`font-optical-sizing: auto`, negative display tracking, medium `400`/`500` heading weights, `tabular-nums`), editorial serif (`Instrument Serif`, `Newsreader`) and neo-grotesk (`Figtree`, `Switzer`) pairings, and proprietary font mappings.
  - `craft-primitives.md`: reusable `2%` inline SVG `<feTurbulence>` noise grain overlay, light-first neutral + `#151414` warm-charcoal dark surface tokens (banning cold `#0B0D14` navy-slate defaults), `1px` edge-to-edge hairline architectural grids, and product-native micro-UI artifacts (`white-space: nowrap` terminal bars, OS notifications, SVG/Canvas usage-decay charts).
- **Automated Studio-Craft Regression Checks & Pass-3 Visual Critic Captures (`skills/unslop/scripts/audit_ui.mjs`):**
  - Added deterministic `studioCraft` checks catching border-radius drift (`radiusContract`), `>= 3` consecutive centered sections (`sectionRhythm`), tall `space-between` empty-void cards (`stretchedVoidCards`), utility toggles/excess items in primary header navs (`navClutter`), unintended wrapped monospace status lines (`wrappedMonoBars`), and banned default fonts (`defaultFontFlags`).
  - Automatically captures viewport-height tiled `critic-desktop-*.png` (`1440×900`) and `critic-mobile-*.png` (`390×844`) plus `visual-critic-checklist.json` mapped to the 6-Axis 10-Point Pass-3 Visual Art-Director Rubric.

### Changed
- Fixed `reconDigest.topPaletteHexes` and `reconDigest.primaryFonts` extraction in `skills/unslop/scripts/inspect_site.mjs`.
- Updated `skills/unslop/SKILL.md`, `product-brief-template.md`, `anti-slop-checklist.md`, `curated-typography.md`, and `parallel-orchestration.md` to enforce Section Rhythm & Geometry Contracts, 3-radius budgets, Navbar Purity, Anti-Void cards, and Pass-3 Visual Critic polish loops (`>= 8/10` per axis).
- Updated `skills/unslop/scripts/doctor.mjs` (`21` core skill files), `scripts/validate-skill.mjs`, `README.md`, `plan.md`, and synchronized version `1.3.0` across all manifests.

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
