# Parallel Build Orchestration & Fresh-Context Review Playbook

Use this playbook for **`deep` (launch-ready)** builds and multi-route or multi-band **`standard`** builds when the host environment supports subagents or parallel workers. When running on a single-agent host without subagent delegation, execute the exact same **Wave 1 → Wave 2 → Wave 3** boundaries sequentially in-thread.

---

## 1. Core Rule: Zero Overlapping File Ownership

Parallel builds fail when two workers edit the same stylesheet, config, or entrypoint simultaneously — causing overwritten tokens, conflicting CSS selectors, and broken imports.

**Prevent collisions by architecture, never by hope:**
1. Every worker receives an explicit **exclusive file allow-list** (`You own ONLY ...`) and **explicit do-not-touch list**.
2. Shared tokens, base layout rules, data schemas, and component prop contracts are authored **once** in Wave 1 before any parallel builder spawns.
3. Every worker receives `.unslop/brief.md` + `.unslop/DESIGN.md` + `.unslop/COMPONENTS.md` (or the exact relevant slice) so all workers share identical palette variables, typography scale, spacing rhythm, and product truth.

---

## 2. Two-Wave Disjoint Fan-Out (Build Phase)

```text
Approved `.unslop/brief.md` + `.unslop/DESIGN.md` + `.unslop/COMPONENTS.md`
   │
   ▼
WAVE 1 · COORDINATOR FOUNDATION (Sequential, Fast — ~1 turn)
   • tokens.css (or Tailwind v4 @theme inline / shadcn bridge)
   • layout.css (@layer base, overflow-x: clip, shared grid/button primitives)
   • motion.css (@supports view-timeline + reduced-motion overrides)
   • MotionController + shared domain data (src/data/*) & prop/route contracts
   │
   ▼
WAVE 2 · PARALLEL DISJOINT WORKERS (Zero Shared Files)
   ├─► Worker A (Media Batches):    public/assets/* (strictly following Shared Art-Direction Brief)
   ├─► Worker B (Global Chrome):    Header/Nav, Mega-Menu, Cmd+K Search, Bag/Action Drawer, Footer
   ├─► Worker C (Hero & Kinetic):   Hero bands, WebGL/Canvas ambient module, Sticky Scroll Track
   └─► Worker D (Interactive/Sub):  Configurator / Catalog / Calculator / Forms + Secondary Routes
   │
   ▼
WAVE 3 · INTEGRATION, QA & INDEPENDENT FRESH-CONTEXT REVIEW
   • Coordinator wires page entrypoints, optimizes asset payloads (< 500 KB), runs build/dev server
   • Coordinator runs `audit_ui.mjs <localUrl> .unslop/audit/pass-1 [--routes ...]`
   • Fresh-Context Read-Only Reviewer inspects ONLY `.unslop/brief.md`, `audit.json`, and screenshots
   • Targeted fixes applied (all critical errors + every craft axis < 4/5)
   • Pass-2 `audit_ui.mjs` verification confirms `passed: true` before delivery
```

---

## 3. Worker Brief Checklist (Copy Pattern)

Every Wave 2 subagent prompt MUST specify:
1. **Exclusive file paths** it may create or edit (and explicit prohibition against modifying `tokens.css`, `package.json`, or another worker's files).
2. **Exact contract paths to read first:** `.unslop/brief.md`, `.unslop/DESIGN.md`, `.unslop/COMPONENTS.md`, and Wave 1's `tokens.css` / `src/data/*`.
3. **Non-negotiable engineering invariants:** WCAG AA contrast (`>= 4.5:1` body, `>= 3:1` large text) in all supported themes, `>= 44×44px` mobile touch targets, keyboard navigation + `:focus-visible`, `Escape` dismissal for overlays, `MotionController` subscription for canvases/animations, and zero placeholder copy.
4. **Verification check before returning:** Syntax/type check on its owned files (`node --check` / `tsc --noEmit` scoped cleanly) and a concise summary of created exports/IDs for Wave 3 wiring.

---

## 4. Independent Fresh-Context Read-Only Reviewer (Wave 3)

A builder grading its own output misses subtle seams, contrast regressions, and visual monotony. In `deep` mode, dispatch a **read-only subagent with fresh context** after Pass-1 `audit_ui.mjs` completes:

### Reviewer Inputs (Keep Context Clean)
- `.unslop/brief.md` (locked product truth, fidelity, palette, motion density, and priority sections)
- `.unslop/audit/pass-1/audit.json` (or `multi-route-audit.json`)
- Rendered screenshots: `desktop.png`, `mobile.png`, `scroll-25/50/75.png`, `sections/*.png` (and `.unslop/inspect/components/*.png` for side-by-side rhythm comparison when remixing)

### Reviewer Rubric (Score 1–5 per Axis)
1. **Typography & Editorial Tension** — Clear scale hierarchy, intentional tracking/leading, zero generic fallback feel.
2. **Visual & Media Cohesion** — Seamless image-to-surface blending (no rectangular border seams), crisp art direction, balanced spacing.
3. **Kinetic Fidelity & Pacing** — Smooth scroll/entrance choreography, live non-blank canvases, genuine reduced-motion freeze.
4. **Micro-Architecture & Contrast** — WCAG AA contrast across light & dark themes, crisp borders/radii/elevation, zero mobile overflow down to `320px`.
5. **Interactive & Brief Fidelity** — Every requested interactive surface works end-to-end, zero fabricated copy, all priority sections from `.unslop/brief.md` delivered.

### Exit Condition
- Every critical error in `audit.json` MUST be `0`.
- Every craft axis scored `< 4/5` MUST be fixed in Pass-2 polish and re-audited with `audit_ui.mjs` before delivering to the user.

---

## 5. Graceful Fallback on Single-Agent Hosts

If the current environment does not expose subagent delegation tools:
- Follow the exact same **Wave 1 (Foundation) → Wave 2 (Module-by-Module Components & Media) → Wave 3 (Audit + Visual Critique + Pass-2 Polish)** order sequentially.
- Still inspect every Pass-1 screenshot objectively against `.unslop/brief.md` and the 5-axis rubric before claiming completion.
