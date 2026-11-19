# UnslopAI — Architecture & Release Roadmap (`plan.md`)

> Living engineering roadmap for the **`unslop`** portable Agent Skill suite (`v1.0.0` baseline and upcoming milestones).

---

## 1. Scope & Core Workflows

Build a single portable, standards-compliant Agent Skill (`skills/unslop/SKILL.md`) supporting three frontend workflows:

1. **Unslop Existing UI (`unslop-existing`):** Audit a running local application for generic styling defaults, contrast failures, unloaded fonts, broken media/canvases, and responsive overflow, then refactor into cohesive modular components.
2. **Inspiration Deconstruction & Remix (`inspiration-remix`):** Forensically inspect an inspiration URL or screenshots—capturing DOM anatomy, computed area-weighted color budgets, typography scale, compiled WebGL/WebGL2 shaders, CORS-proof CSS scroll-timelines, and 4-frame sticky scroll filmstrips—into `DESIGN.md` + `COMPONENTS.md`, then build an original interface tailored to the target product and taste.
3. **Hybrid Refactoring (`hybrid`):** Extract structural and kinetic grammar from an inspiration reference and apply it to upgrade an existing codebase.

---

## 2. `v1.0.0` Baseline Architecture

```text
User Request + Target Workspace + Optional Inspiration URL / Screenshots
  └─▶ Phase 1: Mode Lock, Media Strategy & Capabilities Disclosure
        ├─ Inspiration URL ──────────▶ Phase 2A: 4-Layer inspect_site.mjs (DOM/CSS + GPU shaderSource hook + network CSS + deduped scroll filmstrips)
        │                              + Optional Framework-Agnostic rea_inspect.mjs (Node >=22.23.4 / 24.22.1 / 26.12.1)
        ├─ Blocked / Auth / Screens ─▶ Phase 2B: Visual Analysis Fallback (Strict No-Bypass Boundary)
        └─ Existing App Only ────────▶ Phase 2C: Baseline audit_ui.mjs + Code Audit
              │
              ▼
        Phase 3: Dual Blueprints — DESIGN.md (Tokens + Unified Art-Direction Brief) + COMPONENTS.md (Domain-Agnostic Spec)
              │
              ▼
        Phase 4: Modular Component-by-Component Implementation (Tokens + MotionController + Cohesive Media + Scoped Modules)
              │
              ▼
        Phase 5: Kinetic & A11y QA Loop (audit_ui.mjs: raw preserveDrawingBuffer canvas audit, scroll filmstrips,
                 WCAG AA contrast, keyboard focus, inert filtering, 320px-1440px overflow, mobile overlay collisions)
```

---

## 3. Core Invariants

- **Domain-Agnostic Skill Design:** All scripts, fixtures, and references generalize across dashboards, documentation sites, storefronts, studios, and kinetic landing pages without site-specific hardcoding.
- **Standalone Portability:** `skills/unslop/package.json` and `browser_helper.mjs` enable standalone installation via `npx skills add`, plugin marketplaces, or manual folder copies without relying on repository-root paths.
- **Access & IP Safety:** Stop immediately on HTTP 401/403/429/503, CAPTCHAs, Turnstile challenges, or login walls. Never copy proprietary logos, trademarks, third-party media, or verbatim source code.
- **Deterministic Verification:** Every new inspection or audit rule ships with an automated regression assertion in `skills/unslop/scripts/verify_harness.mjs` and passes in GitHub Actions CI across Node 22 & 24.

---

## 4. Release Milestones

### `v1.0.0` — Baseline Release (Current)
- Portable `skills/unslop/` engine (`SKILL.md`, 5 Playwright/REA/harness scripts, 10 modular references, `micro-synth.ts`, standalone `package.json`).
- Zero-source-map WebGL/WebGL2 `shaderSource` & `getUniformLocation` runtime interception plus CORS-proof CSS `@keyframes` and `view-timeline` extraction.
- Containment-deduplicated component cropping, sticky/fixed chrome hiding, and 4-frame scroll filmstrip scrubbing (`t0`–`t3`).
- Uncontaminated raw `<canvas>` pixel variance/animation QA, `[inert]`/`opacity: 0`/`sr-only` visibility filtering, and top + mid-scroll mobile overlay collision detection.
- Cross-ecosystem distribution manifests (`.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`), automated skill validator (`scripts/validate-skill.mjs`), GitHub Actions Playwright CI, and full OSS governance documentation.

### Post-`v1.0.0` Roadmap
- **Complex Interactive App Archetypes:** Reusable reference blueprints for multi-step commerce/checkout state machines, filterable data tables, command palettes, and realistic interactive persistence.
- **Multi-Page View Transitions:** Cross-document `@view-transition` choreography patterns and shared-element transition verification.
- **Visual Regression Diffing:** Optional pixel-diff baseline snapshots inside `audit_ui.mjs` for iterative design-system refactors.
- **Public Examples & Showcase:** Curated, runnable reference projects once interactive production features are ready.
