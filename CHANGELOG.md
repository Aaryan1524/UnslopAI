# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
