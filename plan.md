# UnslopAI — Architecture & Release Roadmap (`plan.md`)

> Living engineering roadmap for the **`unslop`** portable Agent Skill suite (`v1.2.0` current release and upcoming milestones).

---

## 1. Scope & Adaptive Execution Presets

Build a single portable, standards-compliant Agent Skill (`skills/unslop/SKILL.md`) that inspects workspace and inspiration telemetry first, conducts request-specific adaptive discovery, locks `.unslop/brief.md` for approval, and routes cleanly across four presets:

1. **`fast` (Hackathon / Rapid MVP):** Light recon, 1–2 short Q&A rounds (or *"Use best defaults"*), compact `.unslop/brief.md`, single modular build pass, and 1 `audit_ui.mjs` verification pass.
2. **`standard` (Balanced Production):** Full recon, grounded Q&A, `.unslop/brief.md` + `DESIGN.md` + `COMPONENTS.md`, modular build, and 1–2 `audit_ui.mjs` passes.
3. **`deep` (Launch-Ready Flagship):** Full 4-layer extraction (+ optional REA), full contracts, **Two-Wave Disjoint Parallel Orchestration** (Wave 1 shared foundation → Wave 2 disjoint parallel asset/component/route workers → Wave 3 integration + **Independent Fresh-Context Reviewer**), and mandatory 2-pass multi-route QA.
4. **`extract-component` (Single Animation / Component Dissect):** Targeted forensic motion/shader/state capture, component-scoped technical Q&A, and an isolated drop-in implementation adapted to the detected stack.

---

## 2. `v1.2.0` Adaptive Pipeline Architecture

```text
User Request + Target Workspace + Optional Inspiration URL(s) / Screenshots
  └─▶ Phase 0: Silent Recon (doctor.mjs + detect_stack.mjs + inspect_site.mjs reconDigest)
               → Request-Specific Adaptive Q&A (2–3 rounds; AskUserQuestion or numbered chat)
               → Lock `.unslop/brief.md` + User Approval Gate
        │
        ▼
      Execution Router (`fast` | `standard` | `deep` | `extract-component`)
        ├─ Phase 1: Deep Forensic Review (report.json, shaders.json, css-motion.json, crops, optional REA / baseline audit)
        ├─ Phase 2: Inspiration Translation Matrix + `.unslop/DESIGN.md` + `.unslop/COMPONENTS.md`
        ├─ Phase 3: Wave 1 Foundation → Wave 2 Parallel Disjoint Workers (or sequential fallback)
        └─ Phase 4: Closed-Loop QA (`audit_ui.mjs --routes`) + Fresh-Context Reviewer + Pass-2 Polish
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

### `v1.1.0` — Launch-Readiness Upgrade (Shipped)
- **Preflight & Stack Intelligence:** Added `doctor.mjs` environment preflight and read-only `detect_stack.mjs` stack/token/route/asset detector with migration advice.
- **Product Discovery, Framework Adapters & Interactive Blueprints:** Added `product-discovery-interview.md`, `product-brief-template.md`, `framework-adapters.md` (Next.js App Router, Vite + React, Tailwind v3/v4 + shadcn/ui, Vue/Nuxt/Astro, strangler-fig refactoring), `inspiration-translation-matrix.md` (7 communicative archetypes + 4-axis multi-source remix), and `interactive-component-patterns.md` (6 accessible Vanilla ESM + React state machines).
- **Forensic Inspector Upgrades (`inspect_site.mjs`):** Added safe non-navigating interactive state click-probing (`interactiveStates`), viewport-triggered `motion.entranceReveals`, full-page `mobile-full.png` capture + `mobile.collapseSummary`, and `mediaInventory`.
- **QA Auditor Upgrades (`audit_ui.mjs`):** Added `PerformanceObserver` CLS tracking, oversized image byte warnings (`> 500 KB`), semantic link/anchor/heading hygiene, active Motion-Off canvas freeze testing, alternate-theme WCAG AA contrast verification, active interactive overlay `Escape` dismissal verification, and multi-route batch auditing (`--routes` + shared chrome consistency).
- **Playbook & Validator Hardening:** Integrated Phase 0 – Phase 5 completion gates into `SKILL.md`, synchronized `1.1.0` across all manifests and `package-lock.json`, and enforced complete reference-link coverage in `scripts/validate-skill.mjs`.

### `v1.2.0` — Inspect-First Adaptive Discovery & Parallel Orchestration (Current)
- **Inspect-First Phase 0 & `.unslop/brief.md` Spec Lock:** Runs silent recon (`doctor.mjs`, `detect_stack.mjs`, `inspect_site.mjs` `reconDigest`) before asking 2–3 request-specific, reference-grounded Q&A rounds (`AskUserQuestion` or numbered choices + *"Use best defaults"*), locking `.unslop/brief.md` with user approval prior to writing code.
- **Execution Presets & Starter Prompts (`execution-modes-and-prompts.md`):** Unified Option A routing across `fast`, `standard`, `deep`, and `extract-component` presets with copy-paste prompt recipes.
- **Two-Wave Parallel Orchestration & Independent Reviewer (`parallel-orchestration.md`):** Disjoint file-ownership parallelization (Wave 1 foundation → Wave 2 parallel asset/component/route workers → Wave 3 integration + fresh-context read-only reviewer) with clean sequential fallback on single-agent hosts.

### Post-`v1.2.0` Roadmap
- **Multi-Page View Transitions:** Cross-document `@view-transition` choreography patterns and shared-element transition verification.
- **Visual Regression Diffing:** Optional pixel-diff baseline snapshots inside `audit_ui.mjs` for iterative design-system refactors.
- **Public Examples & Showcase:** Curated, runnable reference projects across frameworks (Next.js App Router, Vite + React, Astro, Vanilla ESM).
