# Parallel Build Orchestration & Fresh-Context Review Playbook

Use this playbook for **`deep` (launch-ready)** builds and multi-route or multi-band **`standard`** builds when the host environment supports subagents or parallel workers. When running on a single-agent host without subagent delegation, execute the exact same **Wave 1 → Wave 2 → Wave 3** boundaries sequentially in-thread.

---

## 1. Core Rule: Zero Overlapping File Ownership

Parallel builds fail when two workers edit the same stylesheet, config, or entrypoint simultaneously — causing overwritten tokens, conflicting CSS selectors, and broken imports.

**Prevent collisions by architecture, never by hope:**
1. Every worker receives an explicit **exclusive file allow-list** (`You own ONLY ...`) and **explicit do-not-touch list**.
2. Shared tokens, base layout rules, data schemas, and component prop contracts are authored **once** in Wave 1 before any parallel builder spawns.
3. Every worker receives `.unslop/brief.md` + `.unslop/DESIGN.md` + `.unslop/COMPONENTS.md` (or the exact relevant slice) so all workers share identical palette variables, typography scale, 3-radius budget, alternating section rhythm, and product truth.

---

## 2. Two-Wave Disjoint Fan-Out (Build Phase)

```text
Approved `.unslop/brief.md` + `.unslop/DESIGN.md` + `.unslop/COMPONENTS.md`
   │
   ▼
WAVE 1 · COORDINATOR FOUNDATION (Sequential, Fast — ~1 turn)
   • tokens.css (curated fonts, warm/reference polarity, 3-radius budget --r-card/--r-control/--r-media)
   • layout.css (@layer base, overflow-x: clip, shared 1px hairline grid & button primitives)
   • motion.css (@supports view-timeline + reduced-motion overrides)
   • MotionController + shared domain data (src/data/*) & prop/route contracts
   │
   ▼
WAVE 2 · PARALLEL DISJOINT WORKERS (Zero Shared Files)
   ├─► Worker A (Media Batches):    public/assets/* (strictly following Shared Art-Direction Brief)
   ├─► Worker B (Global Chrome):    Header/Nav (<=5 links + 1 CTA), Mega-Menu, Cmd+K + Theme/Motion in Footer, Drawer
   ├─► Worker C (Hero & Kinetic):   Hero bands, WebGL/Canvas ambient module, Sticky Scroll Track
   └─► Worker D (Interactive/Sub):  Micro-UI artifacts, Configurator / Catalog / Calculator / Forms + Secondary Routes
   │
   ▼
WAVE 3 · INTEGRATION, AUTOMATED QA & PASS-3 VISUAL CRITIQUE
   • Coordinator wires page entrypoints, optimizes asset payloads (< 500 KB), runs build/dev server
   • Pass-1 Automated Audit: `audit_ui.mjs <localUrl> .unslop/audit/pass-1 [--routes ...]`
   • Pass-2 Structural Remediation + Re-Audit: fix critical errors, confirm `passed: true`
   • Pass-3 Multimodal Visual Art-Director Critique:
     Fresh-Context Read-Only Critic inspects `critic-desktop-*.png`, `critic-mobile-*.png`, `.unslop/brief.md`,
     and `reference-tokens.json` -> writes `.unslop/audit/visual-critic-checklist.json` (6-Axis 10-Point Rubric)
   • Targeted Polish Loop: if ANY axis < 8/10, apply exact CSS/layout patch directives and re-verify before delivery
```

---

## 3. Worker Brief Checklist (Copy Pattern)

Every Wave 2 subagent prompt MUST specify:
1. **Exclusive file paths** it may create or edit (and explicit prohibition against modifying `tokens.css`, `package.json`, or another worker's files).
2. **Exact contract paths to read first:** `.unslop/brief.md`, `.unslop/DESIGN.md`, `.unslop/COMPONENTS.md`, [`type-pairings.md`](type-pairings.md), [`craft-primitives.md`](craft-primitives.md), and Wave 1's `tokens.css` / `src/data/*`.
3. **Non-negotiable engineering invariants:** WCAG AA contrast (`>= 4.5:1` body, `>= 3:1` large text) in all supported themes, `>= 44×44px` mobile touch targets, keyboard navigation + `:focus-visible`, `Escape` dismissal for overlays, `MotionController` subscription for canvases/animations, navbar purity (`<= 5` links + `1` CTA; Theme/Motion toggles in `<footer>` / `Cmd+K`), non-wrapping monospace bars (`white-space: nowrap`), anti-void cards (no ungrounded `space-between` `> 320px`), and zero placeholder copy.
4. **Verification check before returning:** Syntax/type check on its owned files (`node --check` / `tsc --noEmit` scoped cleanly) and a concise summary of created exports/IDs for Wave 3 wiring.

---

## 4. Pass-3 Multimodal Visual Art-Director Critique (Wave 3)

A builder grading its own output misses subtle seams, dead-space voids, wrapped monospace chips, and section monotony. After Pass-1 `audit_ui.mjs` and Pass-2 critical-error remediation confirm `passed: true` (`0` critical errors), dispatch a **fresh-context read-only visual critic** (or execute the Pass-3 critique pass strictly from rendered captures) before final delivery:

### Critic Inputs (Keep Context Clean)
- `.unslop/brief.md` (locked product truth, alternating section rhythm table, 3-radius budget, navbar purity, and anti-void contracts)
- `.unslop/inspect/reference-tokens.json` (when an inspiration URL was inspected)
- `.unslop/audit/pass-2/audit.json` (or `multi-route-audit.json`)
- Rendered multimodal captures: `critic-desktop-*.png`, `critic-mobile-*.png` (plus full-page/section crops and `.unslop/inspect/components/*.png` for side-by-side comparison when remixing)

### Output Artifact: `visual-critic-checklist.json`
The Pass-3 critic MUST inspect the rendered desktop and mobile captures visually and emit **`.unslop/audit/visual-critic-checklist.json`** scored strictly on the **6-Axis 10-Point Rubric**:

| # | Axis | `10/10` Visual Bar (Pass >= `8/10`) | Automatic Penalty Triggers (`< 8/10`) |
| :--- | :--- | :--- | :--- |
| **1** | **Typography Craft** | Curated pairing from [`type-pairings.md`](type-pairings.md); `400`–`500` display weight; `-0.025em` to `-0.04em` tracking; `font-optical-sizing: auto`; `tabular-nums` on telemetry/prices; clean `h1 / body` hierarchy | Any banned default font (`Inter`, `Plus Jakarta Sans`, `Space Grotesk`, `Poppins`, `Roboto`) without `reference-tokens.json` proof; bloated `700`/`800` hero headlines; loose tracking or jagged non-tabular numbers |
| **2** | **Dead-Space Audit** | Deliberate negative space pacing; every card `> 320px` tall fills its middle body with a real product artifact or structured spec | `justify-content: space-between` stretching empty air inside tall cards; stranded bottom links; awkward half-empty grid rows |
| **3** | **Micro-UI Wrapping** | Crisp `white-space: nowrap` monospace terminal/status bars; authentic micro-UIs (notification banners, SVG/Canvas curves, status matrices); zero clipped text down to `320px` | Wrapped terminal commands or status pills breaking mid-token; truncated headlines; generic 3-column icon-box + 2-line blurb filler |
| **4** | **Rhythm & Monotony** | Alternating section layouts matching `.unslop/brief.md` (`<= 2` consecutive centered sections); pure header (`<= 5` links + `1` CTA; Theme/Motion in `<footer>` or `Cmd+K`) | `> 2` consecutive centered-pyramid sections; repetitive card rows; Theme or Motion toggle pills sitting in the primary top navbar |
| **5** | **Reference Fidelity** | Exact match to `.unslop/brief.md` and `reference-tokens.json` (measured polarity, background/accent ratios, heading weights, tracking, modal radii, real product truth) | Unapproved polarity drift; copied brand marks/slogans or invented vanity metrics; missing priority sections from `.unslop/brief.md` |
| **6** | **Surface Cohesion** | Warm neutral (`#FFFFFF` / `#FAF9F6`) or warm-charcoal (`#151414` / `#F0E3DE` / `#302E2D`) surface discipline; unified `1px` hairline grids or locked 3-radius budget (`--r-card`, `--r-control`, `--r-media`); optional `2%` SVG grain preserving WCAG AA contrast | Unprompted `#0B0D14` cold navy-slate dark mode; nested rounded boxes inside rounded boxes; mixed `0px`/`16px`/`24px`/`9999px` radii drift; plastic purple gradients; failing contrast |

### Required Schema & Targeted Polish Trigger
Every entry in `visual-critic-checklist.json` records `{ score, status, observations, patchDirectives }` per axis:
- **Pass Gate:** Every critical error in `audit.json` MUST be `0` (`passed: true`), AND **all 6 rubric axes MUST score `>= 8/10`**.
- **Patch & Re-Verify Loop:** If **any** axis scores **`< 8/10`**, `visual-critic-checklist.json` MUST list exact **CSS/layout patch directives** (target file, selector/component, exact property change, and expected visual delta). Execute a targeted polish pass applying every patch directive, regenerate `critic-desktop-*.png` / `critic-mobile-*.png` via `audit_ui.mjs`, and re-score `visual-critic-checklist.json` before delivering.

---

## 5. Graceful Fallback on Single-Agent Hosts

If the current environment does not expose subagent delegation tools:
- Follow the exact same **Wave 1 (Foundation) → Wave 2 (Module-by-Module Components & Media) → Wave 3 (Automated Audit + Pass-3 Visual Critique + Targeted Polish)** order sequentially.
- Still inspect `critic-desktop-*.png` and `critic-mobile-*.png` objectively against `.unslop/brief.md`, `reference-tokens.json`, and all 6 axes of `visual-critic-checklist.json`, applying targeted CSS/layout patches whenever any axis scores `< 8/10`.
