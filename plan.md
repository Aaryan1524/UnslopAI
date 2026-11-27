# UnslopAI — Architecture & Release Roadmap (`plan.md`)

> Living engineering roadmap for the **`unslop`** portable Agent Skill suite (`v2.0.0` Studio Engine current release).

---

## 1. Scope & Adaptive Execution Presets

Build a single portable, standards-compliant Agent Skill (`skills/unslop/SKILL.md`) that parses requirements and inspects workspace/inspiration telemetry first, runs deep end-to-end discovery, validates visual direction with a 10-second browser-rendered Hero Style Tile, builds with a 4-specialist parallel guild, and passes Playwright + scroll-video 8-axis QA across four presets:

1. **`fast` (Hackathon / Rapid MVP):** Light recon, 1–2 rapid confirmations (or *"Use best defaults"*), compact `.unslop/brief.md`, single modular build pass, and 1 `audit_ui.mjs` pass.
2. **`standard` (Balanced Production):** Full recon, 10–15 question discovery (3–4 intervals), Phase 0.5 Hero Style Tile Checkpoint, `.unslop/DESIGN.md` + `COMPONENTS.md`, modular build, and 1–2 `audit_ui.mjs` passes (+ optional `record_motion_qa.mjs`).
3. **`deep` (Flagship Studio Build):** Full 4-layer extraction (+ optional REA), 10–15 question discovery (4 intervals), Phase 0.5 Hero Style Tile Checkpoint, Locked Studio Seed, **4-Specialist Parallel Guild**, multi-route `audit_ui.mjs --routes`, mandatory `record_motion_qa.mjs` (desktop + mobile `.webm` walkthroughs + keyframes + rAF pacing), and **8-Axis Fresh-Context Design Director Critic (`>= 8/10`)**.
4. **`extract-component` (Single Animation / Component Dissect):** Targeted forensic motion/shader/state capture, 3–5 component-scoped technical questions, isolated drop-in implementation, and targeted `audit_ui.mjs` (+ optional `record_motion_qa.mjs`).

---

## 2. `v2.0.0` Studio Engine Pipeline Architecture

```text
User Prompt + Target Workspace + Optional Inspiration URL(s) / Screenshots
  └─▶ Phase 0: Requirement Parsing (5-Dimension Matrix) + Silent Recon
               (doctor.mjs + detect_stack.mjs + inspect_site.mjs + extract_reference.mjs)
               → 10–15 Question Deep Discovery (4 focused intervals of 3–4 questions)
               → Lock `.unslop/brief.md` (Visual DNA + End-to-End Journeys + Art-Direction Seed)
        │
        ▼
      Phase 0.5 (standard/deep): 10-Second Hero Style Tile Checkpoint (`generate_style_tile.mjs`)
               → Browser-rendered Hero + Swatch WCAG + Type/Radius + Motion Freeze preview -> User Sign-Off
        │
        ▼
      Execution Router (`fast` | `standard` | `deep` | `extract-component`)
        ├─ Phase 1: Deep Forensic Review (reference-tokens.json, visualMotifs, copyDensity, shaders, crops)
        ├─ Phase 2: Translation Matrix + `.unslop/DESIGN.md` (One-Room Seed + type-pairings) + `COMPONENTS.md`
        ├─ Phase 3: Wave 1 Foundation -> Wave 2 4-Specialist Parallel Guild
        │            (Media & Seed | Global Chrome | 5s Hero Product Proof & Canvases | Editorial & Mobile Ergonomics)
        └─ Phase 4: Closed-Loop QA (`audit_ui.mjs --routes` + `record_motion_qa.mjs` .webm videos & keyframes)
                 -> Pass-3 8-Axis Fresh-Context Design Director Critic (`>= 8/10`) -> Targeted Polish Loop
```

---

## 3. Core Invariants

- **Domain-Agnostic Skill Design:** All scripts, fixtures, and references generalize across developer platforms, dashboards, storefronts, editorial studios, and kinetic web apps without site-specific hardcoding.
- **No-Fabrication Discipline:** Real repository content and 10–15 question discovery drive `.unslop/brief.md`; invented metrics, fake logos, and dead UI shells are rejected.
- **Standalone Portability:** `skills/unslop/package.json`, `browser_helper.mjs`, and `doctor.mjs` (`25` core files) enable standalone installation via `npx skills add`, plugin marketplaces, or manual copies without relying on repo-root paths.
- **Access & IP Safety:** Stop immediately on HTTP 401/403/429/503, CAPTCHAs, Turnstile challenges, or login walls. Never copy proprietary logos, trademarks, third-party media, or verbatim source code.
- **Deterministic Verification:** Every script ships with automated Playwright regression assertions across 13 suites in `skills/unslop/scripts/verify_harness.mjs` and runs in GitHub Actions CI across Node 22 & 24.

---

## 4. Release Milestones

- **`v1.0.0` (Shipped):** Portable `skills/unslop/` engine, WebGL/CSS forensic dissolver, raw `<canvas>` QA, plugin/marketplace manifests, CI.
- **`v1.1.0` (Shipped):** `doctor.mjs`, `detect_stack.mjs`, framework adapters, interactive patterns, CLS/oversized-image/multi-route auditing.
- **`v1.2.0` (Shipped):** Inspect-first Phase 0 recon digest, `.unslop/brief.md` spec lock, 4 execution presets, Two-Wave parallel orchestration.
- **`v1.3.0` (Shipped):** `extract_reference.mjs` DOM/CSS token extractor, curated typography registry, visual craft primitives, deterministic `studioCraft` checks & Pass-3 tiled critic.
- **`v1.4.0` (Shipped):** Visual-motif & copy-economy extraction (`visualMotifs`, `copyDensity`), Two-Tier Rule Precedence, dynamic multi-interval discovery, 7-axis side-by-side visual lineage critic.
- **`v2.0.0` (Current — Studio Engine):**
  - 5-Dimension Requirement Coverage Matrix + 10–15 Question Deep Discovery Engine across 4 intervals (`product-discovery-interview.md`, `product-brief-template.md`).
  - Phase 0.5 10-Second Hero Style Tile Checkpoint (`generate_style_tile.mjs`, `style-tile-checkpoint.md`).
  - Locked One-Room Studio Art-Direction Seed + OG/favicon checklist (`visual-art-direction-and-media.md`) and 5-Second "Aha" Interactive Product Proofs & Re-Authored Mobile Ergonomics (`interactive-product-proofs.md`).
  - Real Desktop & Mobile Scroll/Interaction Video Motion QA (`record_motion_qa.mjs`) + 8-Axis Design Director Critic (`audit_ui.mjs`) + 4-Specialist Parallel Guild (`parallel-orchestration.md`).
  - `doctor.mjs` (`25` core files) and 13-suite Playwright `verify_harness.mjs`.

### Post-`v2.0.0` Roadmap
- **Cross-Document View Transitions:** `@view-transition` choreography patterns and multi-route transition verification.
- **Visual Regression Pixel-Diffing:** Optional baseline pixel-diff snapshots inside `audit_ui.mjs` for iterative design-system refactors.
- **Public Framework Starters:** Curated runnable showcase examples across Next.js App Router, Vite + React, Astro, and Vanilla ESM.
