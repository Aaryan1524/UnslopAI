# Parallel Build Orchestration & Fresh-Context Review Playbook

Use this playbook for **`deep` (launch-ready)** builds and multi-route or multi-band **`standard`** builds when the host environment supports subagents or parallel workers. When running on a single-agent host without subagent delegation, execute the exact same **Wave 1 → Wave 2 → Wave 3** boundaries sequentially in-thread.

---

## 1. Core Rule: Zero Overlapping File Ownership

Parallel builds fail when two workers edit the same stylesheet, config, or entrypoint simultaneously — causing overwritten tokens, conflicting CSS selectors, and broken imports.

**Prevent collisions by architecture, never by hope:**
1. Every worker receives an explicit **exclusive file allow-list** (`You own ONLY ...`) and **explicit do-not-touch list**.
2. Shared tokens, base layout rules, architectural framing substrates (dot gutters, vertical rails, registration nodes), data schemas, and component prop contracts are authored **once** in Wave 1 before any parallel builder spawns.
3. Every worker receives `.unslop/brief.md` + `.unslop/DESIGN.md` + `.unslop/COMPONENTS.md` (or the exact relevant slice) so all workers share identical palette variables, typography mood, 3-radius budget, Visual DNA motifs, Copy Economy word budgets, and product truth.

---

## 2. Two-Wave Disjoint Fan-Out (Build Phase)

```text
Approved `.unslop/brief.md` + `.unslop/DESIGN.md` + `.unslop/COMPONENTS.md`
   │
   ▼
WAVE 1 · COORDINATOR FOUNDATION (Sequential, Fast — ~1 turn)
   • tokens.css (curated fonts matching Typography Mood, warm/reference polarity, 3-radius budget)
   • layout.css (@layer base, overflow-x: clip, dot gutters/blueprint rails, shared 1px hairline grid & button primitives)
   • motion.css (@supports view-timeline + reduced-motion overrides)
   • MotionController + shared domain data (src/data/*) & prop/route contracts
   │
   ▼
WAVE 2 · PARALLEL DISJOINT WORKERS (Zero Shared Files)
   ├─► Worker A (Media Batches):    public/assets/* (strictly following Shared Art-Direction Brief)
   ├─► Worker B (Global Chrome):    Header/Nav (<=5 links + 1 CTA), Mega-Menu, Cmd+K + Theme/Motion in Footer, Drawer
   ├─► Worker C (Hero & Kinetic):   Hero/Closing frames (halftone/shader + ticker), 50/50 Split Stage, Sticky Scroll Track
   └─► Worker D (Interactive/Sub):  Luminous micro-UI artifacts, corner-bracket callouts, Configurator/Forms + Secondary Routes
   │
   ▼
WAVE 3 · INTEGRATION, AUTOMATED QA & PASS-3 VISUAL CRITIQUE
   • Coordinator wires page entrypoints, optimizes asset payloads (< 500 KB), runs build/dev server
   • Pass-1 Automated Audit: `audit_ui.mjs <localUrl> .unslop/audit/pass-1 [--routes ...]`
   • Pass-2 Structural Remediation + Re-Audit: fix critical errors, confirm `passed: true`
   • Pass-3 Multimodal Visual Art-Director Critique:
     Fresh-Context Read-Only Critic inspects `critic-desktop-*.png`, `critic-mobile-*.png` SIDE-BY-SIDE with
     reference `desktop-top.png` & `desktop-full.png`, `.unslop/brief.md`, and `reference-tokens.json`
     -> writes `.unslop/audit/visual-critic-checklist.json` (7-Axis 10-Point Rubric)
   • Targeted Polish Loop: if ANY axis < 8/10, apply exact CSS/layout patch directives and re-verify before delivery
```

---

## 3. Worker Brief Checklist (Copy Pattern)

Every Wave 2 subagent prompt MUST specify:
1. **Exclusive file paths** it may create or edit (and explicit prohibition against modifying `tokens.css`, `package.json`, or another worker's files).
2. **Exact contract paths to read first:** `.unslop/brief.md` (especially Section 6 Rhythm/Geometry, Section 7 Visual DNA & Reference Overrides, and Section 8 Copy Economy word budgets), `.unslop/DESIGN.md`, `.unslop/COMPONENTS.md`, [`type-pairings.md`](type-pairings.md), [`craft-primitives.md`](craft-primitives.md), [`anti-slop-checklist.md`](anti-slop-checklist.md), and Wave 1's `tokens.css` / `src/data/*`.
3. **Non-negotiable engineering invariants:** WCAG AA contrast (`>= 4.5:1` body, `>= 3:1` large text) in all supported themes and over hero scrims, `>= 44×44px` mobile touch targets, keyboard navigation + `:focus-visible`, `Escape` dismissal for overlays, `MotionController` subscription for canvases/animations, navbar purity (`<= 5` links + `1` CTA; Theme/Motion toggles in `<footer>` / `Cmd+K`), non-wrapping monospace bars (`white-space: nowrap`), anti-void cards (no ungrounded `space-between` `> 320px`), tight animation-led copy economy, and zero placeholder copy.
4. **Verification check before returning:** Syntax/type check on its owned files (`node --check` / `tsc --noEmit` scoped cleanly) and a concise summary of created exports/IDs for Wave 3 wiring.

---

## 4. Pass-3 Multimodal Visual Art-Director Critique (Wave 3)

A builder grading its own output misses subtle seams, dead-space voids, wrapped monospace chips, bloated copy walls, and lost reference lineage. After Pass-1 `audit_ui.mjs` and Pass-2 critical-error remediation confirm `passed: true` (`0` critical errors), dispatch a **fresh-context read-only visual critic** (or execute the Pass-3 critique pass strictly from rendered captures) before final delivery:

### Critic Inputs (Keep Context Clean)
- `.unslop/brief.md` (locked product truth, Section 6 rhythm & 3-radius budget, Section 7 Visual DNA & Reference Overrides, Section 8 Copy Economy word budgets)
- `.unslop/inspect/reference-tokens.json` (when an inspiration URL was inspected)
- `.unslop/audit/pass-2/audit.json` (or `multi-route-audit.json`)
- **Side-by-Side Visual Captures:**
  - Generated site: `critic-desktop-*.png`, `critic-mobile-*.png` (plus full-page/section crops)
  - Reference site *(whenever an inspiration URL or screenshot was provided)*: `.unslop/inspect/desktop-top.png`, `.unslop/inspect/desktop-mid.png`, `.unslop/inspect/desktop-full.png`, and `.unslop/inspect/components/*.png` viewed **directly alongside** the generated `critic-desktop-*.png` tiles

### Output Artifact: `visual-critic-checklist.json`
The Pass-3 critic MUST inspect the rendered desktop and mobile captures visually—side-by-side with the reference captures whenever a reference exists—and emit **`.unslop/audit/visual-critic-checklist.json`** scored strictly on the **7-Axis 10-Point Rubric** (honoring Tier 1 Universal Craft Laws and Tier 2 Reference Overrides documented in `.unslop/brief.md` Section 7):

| # | Axis | `10/10` Visual Bar (Pass >= `8/10`) | Automatic Penalty Triggers (`< 8/10`) |
| :--- | :--- | :--- | :--- |
| **1** | **Typography Craft** | Curated pairing from [`type-pairings.md`](type-pairings.md) matching locked Typography Mood (technical `500` grotesque + mono for infrastructure references; editorial serif for expressive/editorial/colorful brands); `-0.025em` to `-0.04em` tracking; `font-optical-sizing: auto`; `tabular-nums` on telemetry/prices; clean `h1 / body` hierarchy | Any banned default font (`Inter`, `Plus Jakarta Sans`, `Space Grotesk`, `Poppins`, `Roboto`) without `reference-tokens.json` proof; bloated `700`/`800` hero headlines; forced serif on a pure-grotesk technical reference; loose tracking or jagged non-tabular numbers |
| **2** | **Dead-Space Audit** | Deliberate negative space pacing; every card `> 320px` tall fills its middle body with a real product artifact or structured spec | `justify-content: space-between` stretching empty air inside tall cards; stranded bottom links; awkward half-empty grid rows |
| **3** | **Micro-UI Wrapping** | Crisp `white-space: nowrap` monospace terminal/status bars; authentic micro-UIs (luminous tinted rows, notification banners, SVG/Canvas curves, status matrices); zero clipped text down to `320px` | Wrapped terminal commands or status pills breaking mid-token; truncated headlines; generic 3-column icon-box + 2-line blurb filler |
| **4** | **Rhythm & Monotony** | Alternating mid-page section layouts matching `.unslop/brief.md` (honoring documented Tier 2 bookend overrides like inset hero + closing CTA); pure header (`<= 5` links + `1` CTA; Theme/Motion in `<footer>` or `Cmd+K`) | `> 2` consecutive generic centered-pyramid sections; repetitive card rows; Theme or Motion toggle pills sitting in the primary top navbar |
| **5** | **Reference Fidelity** | Exact match to `.unslop/brief.md` and `reference-tokens.json` (measured polarity, background/accent ratios, heading weights, tracking, locked modal radii, real product truth) | Unapproved polarity drift; copied brand marks/slogans or invented vanity metrics; missing priority sections from `.unslop/brief.md` |
| **6** | **Surface Cohesion** | Warm neutral (`#FFFFFF` / `#FAF9F6`) or warm-charcoal (`#151414` / `#F0E3DE` / `#302E2D`) surface discipline; unified `1px` hairline grids or locked 3-radius budget (`--r-card`, `--r-control`, `--r-media`); luminous tinted micro-UIs on light canvases; optional `2%` SVG grain preserving WCAG AA contrast | Unprompted `#0B0D14` cold navy-slate dark mode; pitch-black widget spam on light-first references; nested rounded boxes inside rounded boxes; ad-hoc radii drift; plastic purple gradients; failing contrast |
| **7** | **Side-by-Side Visual Lineage & Copy Economy** | Viewing `.unslop/inspect/desktop-top.png` & `desktop-full.png` alongside `critic-desktop-*.png`: **(a)** blurring the brand/copy still unmistakably reveals the inspiration's architectural motifs, substrate (dot gutters, vertical rails, registration squares, corner brackets, inset halftone/shader frame, split contrast), and polarity; **(b)** copy stays crisp, scannable, and animation-/micro-UI-led within `.unslop/brief.md` Section 8's word budgets | Generated page looks like a generic template when placed beside `desktop-top.png` / `desktop-full.png` (missing signature substrate, framing rails, or contrast motifs); wordy multi-paragraph feature cards or prose walls where an animation or micro-UI should explain the product |

### Required Schema & Targeted Polish Trigger
Every entry in `visual-critic-checklist.json` records `{ score, status, observations, patchDirectives }` per axis:
- **Pass Gate:** Every critical error in `audit.json` MUST be `0` (`passed: true`), AND **all 7 rubric axes MUST score `>= 8/10`**.
- **Patch & Re-Verify Loop:** If **any** axis scores **`< 8/10`**, `visual-critic-checklist.json` MUST list exact **CSS/layout/copy patch directives** (target file, selector/component, exact property or copy-trim change, and expected visual delta). Execute a targeted polish pass applying every patch directive, regenerate `critic-desktop-*.png` / `critic-mobile-*.png` via `audit_ui.mjs`, and re-score `visual-critic-checklist.json` before delivering.

---

## 5. Graceful Fallback on Single-Agent Hosts

If the current environment does not expose subagent delegation tools:
- Follow the exact same **Wave 1 (Foundation) → Wave 2 (Module-by-Module Components & Media) → Wave 3 (Automated Audit + Pass-3 Visual Critique + Targeted Polish)** order sequentially.
- Still inspect `critic-desktop-*.png` and `critic-mobile-*.png` side-by-side against `.unslop/inspect/desktop-top.png` / `desktop-full.png`, `.unslop/brief.md`, `reference-tokens.json`, and all **7 axes** of `visual-critic-checklist.json`, applying targeted CSS/layout/copy patches whenever any axis scores `< 8/10`.
