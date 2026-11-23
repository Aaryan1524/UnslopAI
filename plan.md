# UnslopAI — Architecture & Release Roadmap (`plan.md`)

> Living engineering roadmap for the **`unslop`** portable Agent Skill suite (`v1.1.0` current release and upcoming milestones).

---

## 1. Scope & Core Workflows

Build a single portable, standards-compliant Agent Skill (`skills/unslop/SKILL.md`) supporting three frontend workflows:

1. **Unslop Existing UI (`unslop-existing`):** Detect the target stack and existing tokens, audit the running application across routes for performance (CLS, oversized images), semantic hygiene, contrast, broken media/canvases, and responsive overflow, then refactor safely into cohesive modular components.
2. **Inspiration Deconstruction & Remix (`inspiration-remix`):** Capture real product truth in `PRODUCT_BRIEF.md`, forensically inspect one or more inspiration URLs/screenshots—capturing DOM anatomy, interactive states, viewport reveals, mobile collapse, computed color budgets, typography scale, compiled WebGL/WebGL2 shaders, CORS-proof CSS scroll-timelines, and 4-frame sticky scroll filmstrips—translate bands via the Adapt/Merge/Drop matrix into `DESIGN.md` + `COMPONENTS.md`, and build an original interface.
3. **Hybrid Refactoring (`hybrid`):** Extract structural and kinetic grammar from an inspiration reference and apply a strangler-fig migration onto an existing codebase while preserving routes and business logic.

---

## 2. `v1.1.0` Pipeline Architecture

```text
User Request + Target Workspace + Optional Inspiration URL(s) / Screenshots
  └─▶ Phase 0: doctor.mjs Preflight (Node >= 22.6, Playwright, Chromium/Chrome, Skill Files)
        │
        ▼
      Phase 1: detect_stack.mjs + Bounded Discovery Interview -> PRODUCT_BRIEF.md + Framework Adapter
        ├─ Inspiration URL ──────────▶ Phase 2A: 4-Layer inspect_site.mjs (DOM/CSS + GPU shaderSource hook +
        │                              network CSS + interactiveStates + entranceReveals + mobile-full + mediaInventory)
        │                              + Optional Framework-Agnostic rea_inspect.mjs (Node ^22.23.4 / ^24.22.1 / >=26.12.1)
        ├─ Blocked / Auth / Screens ─▶ Phase 2B: Visual Analysis Fallback (Strict No-Bypass Boundary)
        └─ Existing App Only ────────▶ Phase 2C: Baseline audit_ui.mjs (--routes) + Code Inventory
              │
              ▼
        Phase 3: Inspiration Translation Matrix + DESIGN.md + COMPONENTS.md
              │
              ▼
        Phase 4: Modular Component-by-Component Build (Framework Adapters + Interactive State Machines + Cohesive Media)
              │
              ▼
        Phase 5: Closed-Loop QA (audit_ui.mjs: CLS, oversized images, semantic links/headings, raw preserveDrawingBuffer
                 canvas checks, Motion-Off freeze, alt-theme WCAG AA contrast, Escape overlays, multi-route consistency)
```

---

## 3. Core Invariants

- **Domain-Agnostic Skill Design:** All scripts, fixtures, and references generalize across dashboards, documentation sites, storefronts, studios, and kinetic landing pages without site-specific hardcoding.
- **No-Fabrication Discipline:** Real repository content and bounded discovery drive `PRODUCT_BRIEF.md`; invented metrics, fake logos, and dead UI shells are rejected.
- **Standalone Portability:** `skills/unslop/package.json`, `browser_helper.mjs`, and `doctor.mjs` enable standalone installation via `npx skills add`, plugin marketplaces, or manual folder copies without relying on repository-root paths.
- **Access & IP Safety:** Stop immediately on HTTP 401/403/429/503, CAPTCHAs, Turnstile challenges, or login walls. Never copy proprietary logos, trademarks, third-party media, or verbatim source code.
- **Deterministic Verification:** Every inspection, detection, and audit capability ships with automated regression assertions in `skills/unslop/scripts/verify_harness.mjs` and passes in GitHub Actions CI across Node 22 & 24.

---

## 4. Release Milestones

### `v1.0.0` — Baseline Release (Shipped)
- Portable `skills/unslop/` engine (`SKILL.md`, 5 Playwright/REA/harness scripts, 10 modular references, `micro-synth.ts`, standalone `package.json`).
- Zero-source-map WebGL/WebGL2 `shaderSource` & `getUniformLocation` runtime interception plus CORS-proof CSS `@keyframes` and `view-timeline` extraction.
- Containment-deduplicated component cropping, sticky/fixed chrome hiding, and 4-frame scroll filmstrip scrubbing (`t0`–`t3`).
- Uncontaminated raw `<canvas>` pixel variance/animation QA, `[inert]`/`opacity: 0`/`sr-only` visibility filtering, and top + mid-scroll mobile overlay collision detection.
- Cross-ecosystem distribution manifests (`.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`), automated skill validator (`scripts/validate-skill.mjs`), GitHub Actions Playwright CI, and OSS governance docs.

### `v1.1.0` — Launch-Readiness Upgrade (Current)
- **Preflight & Stack Intelligence:** Added `doctor.mjs` environment preflight and read-only `detect_stack.mjs` stack/token/route/asset detector with migration advice.
- **Product Discovery, Framework Adapters & Interactive Blueprints:** Added `product-discovery-interview.md`, `product-brief-template.md`, `framework-adapters.md` (Next.js App Router, Vite + React, Tailwind v3/v4 + shadcn/ui, Vue/Nuxt/Astro, strangler-fig refactoring), `inspiration-translation-matrix.md` (7 communicative archetypes + 4-axis multi-source remix), and `interactive-component-patterns.md` (6 accessible Vanilla ESM + React state machines).
- **Forensic Inspector Upgrades (`inspect_site.mjs`):** Added safe non-navigating interactive state click-probing (`interactiveStates`), viewport-triggered `motion.entranceReveals`, full-page `mobile-full.png` capture + `mobile.collapseSummary`, and `mediaInventory`.
- **QA Auditor Upgrades (`audit_ui.mjs`):** Added `PerformanceObserver` CLS tracking, oversized image byte warnings (`> 500 KB`), semantic link/anchor/heading hygiene, active Motion-Off canvas freeze testing, alternate-theme WCAG AA contrast verification, active interactive overlay `Escape` dismissal verification, and multi-route batch auditing (`--routes` + shared chrome consistency).
- **Playbook & Validator Hardening:** Integrated Phase 0 – Phase 5 completion gates into `SKILL.md`, synchronized `1.1.0` across all manifests and `package-lock.json`, and enforced complete reference-link coverage in `scripts/validate-skill.mjs`.

### Post-`v1.1.0` Roadmap
- **Multi-Page View Transitions:** Cross-document `@view-transition` choreography patterns and shared-element transition verification.
- **Visual Regression Diffing:** Optional pixel-diff baseline snapshots inside `audit_ui.mjs` for iterative design-system refactors.
- **Public Examples & Showcase:** Curated, runnable reference projects across frameworks (Next.js App Router, Vite + React, Astro, Vanilla ESM).
