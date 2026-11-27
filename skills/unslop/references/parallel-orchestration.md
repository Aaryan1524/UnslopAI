# Parallel Build Orchestration & Fresh-Context Review Playbook (v2.0 Studio Engine)

Use this playbook for **`deep` (launch-ready)** builds and multi-route or multi-band **`standard`** builds when the host environment supports subagents or parallel workers. When running on a single-agent host without subagent delegation, execute the exact same **Phase 0.5 → Wave 1 → Wave 2 → Wave 3** boundaries sequentially in-thread.

---

## 1. Core Rule: Zero Overlapping File Ownership

Parallel builds fail when two workers edit the same stylesheet, config, or entrypoint simultaneously — causing overwritten tokens, conflicting CSS selectors, and broken imports.

**Prevent collisions by architecture, never by hope:**
1. Every worker receives an explicit **exclusive file allow-list** (`You own ONLY ...`) and **explicit do-not-touch list**.
2. Shared tokens, base layout rules, architectural framing substrates (dot gutters, vertical rails, registration nodes), data schemas, and component prop contracts are authored **once** in Wave 1 — locked against the approved **Phase 0.5 Hero Style Tile Checkpoint** — before any parallel specialist spawns.
3. Every worker receives `.unslop/brief.md` + `.unslop/DESIGN.md` + `.unslop/COMPONENTS.md` (plus the approved Style Tile snapshot/seed) so all four specialists share identical palette variables, typography mood, 3-radius budget, Visual DNA motifs, Copy Economy word budgets, and real product truth.

---

## 2. Phase 0.5 Checkpoint + Two-Wave 4-Specialist Fan-Out

```text
Approved `.unslop/brief.md` + `.unslop/DESIGN.md` + `.unslop/COMPONENTS.md`
   │
   ▼
PHASE 0.5 · HERO STYLE TILE CHECKPOINT (`style-tile-checkpoint.md`)
   • Render a compact, verifiable Hero Style Tile before full-page build:
     display/body type pairing, polarity, surface/accent ratio, 1px hairline or 3-radius lock,
     hero composition + 5-second interactive product proof concept, and locked art-direction seed
   • Confirm direction once -> freeze tokens & art-direction seed for Wave 1 & Wave 2
   │
   ▼
WAVE 1 · COORDINATOR FOUNDATION (Sequential, Fast — ~1 turn)
   • tokens.css (curated fonts matching Typography Mood, locked polarity, 3-radius budget)
   • layout.css (@layer base, overflow-x: clip, dot gutters/blueprint rails, shared 1px hairline grid & button primitives)
   • motion.css (@supports view-timeline + reduced-motion overrides + MotionController contract)
   • Shared domain data (src/data/*) & component/route prop contracts
   │
   ▼
WAVE 2 · 4-SPECIALIST PARALLEL GUILD (Zero Shared Files)
   ├─► Worker A · Cohesive Media & Locked Art-Direction Seed
   │     Owns: public/assets/*, OG/social cards, favicons (100% locked to Art-Direction Seed)
   ├─► Worker B · Design System Chrome & Global Navigation
   │     Owns: Header/Nav (<= 5 links + 1 CTA), Mega-Menu, Footer Theme/Motion toggles, Cmd+K, Drawers
   ├─► Worker C · 5-Second Hero Interactive Product Proof & Kinetic Canvases
   │     Owns: Above-the-fold interactive product proof (`interactive-product-proofs.md`),
   │           Hero/Closing kinetic canvases/shaders, sticky scroll tracks, real-time micro-UIs
   └─► Worker D · Editorial Sections, Secondary Routes & Re-Authored Mobile Ergonomics
         Owns: Mid-page editorial/spec bands, secondary routes, configurators/forms,
               and re-authored 390px mobile ergonomics (sticky header <= 16%, >= 44x44px tap targets)
   │
   ▼
WAVE 3 · INTEGRATION, DUAL AUTOMATED QA (STATIC + VIDEO MOTION) & 8-AXIS CRITIQUE
   • Coordinator wires page entrypoints, optimizes asset payloads (< 500 KB), runs build/dev server
   • Pass-1 Static & Structural Audit:
       `node skills/unslop/scripts/audit_ui.mjs <localUrl> .unslop/audit/pass-1 [--routes ...]`
   • Pass-2 Remediation + Re-Audit: fix all critical errors, confirm `passed: true`
   • Motion & Mobile Video Walkthrough QA:
       `node skills/unslop/scripts/record_motion_qa.mjs <localUrl> .unslop/audit/motion-qa`
       -> captures `desktop-walkthrough.webm` (1280x720), `mobile-walkthrough.webm` (390x844),
          ordered `keyframe-desktop-01..04.png` & `keyframe-mobile-01..03.png`,
          in-page rAF frame pacing, hover/motion-toggle probes, and `motion-qa-report.json`
   • Pass-3 8-Axis Fresh-Context Design Director Critique:
       Fresh-Context Read-Only Critic inspects `critic-desktop-*.png`, `critic-mobile-*.png`,
       `desktop-walkthrough.webm`, `mobile-walkthrough.webm`, `keyframe-*.png`, and `motion-qa-report.json`
       SIDE-BY-SIDE with reference `desktop-top.png` & `desktop-full.png`, `.unslop/brief.md`,
       and `reference-tokens.json` -> writes `.unslop/audit/visual-critic-checklist.json` (8-Axis 10-Point Rubric)
   • Targeted Polish Loop: if ANY of the 8 axes scores < 8/10, apply exact CSS/layout/motion/copy
       patch directives and re-verify both `audit_ui.mjs` and `record_motion_qa.mjs` before delivery
```

---

## 3. Worker Brief Checklist (4-Specialist Guild Pattern)

Every Wave 2 specialist prompt MUST specify:
1. **Exclusive file paths** it may create or edit (and explicit prohibition against modifying `tokens.css`, `package.json`, or another specialist's files).
2. **Exact contract paths to read first:**
   - Core specs: `.unslop/brief.md` (Section 6 Rhythm/Geometry, Section 7 Visual DNA & Reference Overrides, Section 8 Copy Economy word budgets), `.unslop/DESIGN.md`, `.unslop/COMPONENTS.md`, and the approved **Phase 0.5 Hero Style Tile** ([`style-tile-checkpoint.md`](style-tile-checkpoint.md)).
   - Role-specific playbooks:
     - **Worker A (Media):** [`visual-art-direction-and-media.md`](visual-art-direction-and-media.md)
     - **Worker B (Chrome & Nav):** [`craft-primitives.md`](craft-primitives.md), [`anti-slop-checklist.md`](anti-slop-checklist.md)
     - **Worker C (Hero Proof & Kinetic):** [`interactive-product-proofs.md`](interactive-product-proofs.md), [`motion-and-shader-grammar.md`](motion-and-shader-grammar.md), [`craft-primitives.md`](craft-primitives.md)
     - **Worker D (Editorial, Routes & Mobile):** [`type-pairings.md`](type-pairings.md), [`craft-primitives.md`](craft-primitives.md), [`anti-slop-checklist.md`](anti-slop-checklist.md)
   - Wave 1 foundation files (`tokens.css`, `layout.css`, `motion.css`, `src/data/*`).
3. **Non-negotiable engineering invariants:**
   - WCAG AA contrast (`>= 4.5:1` body, `>= 3:1` large text) across all themes and hero scrims.
   - Mobile ergonomics re-authored for `390×844` (not squished desktop): `0px` horizontal overflow across scroll, sticky header `<= 16%` of viewport height, `>= 44×44px` tap targets, and zero floating-control collisions.
   - Keyboard navigation + `:focus-visible`, `Escape` dismissal for all overlays/drawers/modals, and `MotionController` subscription (`[data-motion-toggle]` + `prefers-reduced-motion`) that freezes live canvases cleanly.
   - Pure top navbar (`<= 5` links + `1` CTA; Theme & Motion controls belong in `<footer>` or `Cmd+K`), non-wrapping monospace bars (`white-space: nowrap`), anti-void cards (no ungrounded `space-between` `> 320px`), interactive 5-second product proof above the fold, tight copy economy, and zero placeholder copy.
4. **Verification check before returning:** Syntax/type check on its owned files (`node --check` / `tsc --noEmit` scoped cleanly) and a concise summary of created exports, routes, or asset paths for Wave 3 wiring.

---

## 4. Wave 3 Dual QA & Pass-3 8-Axis Fresh-Context Design Director Critique

A builder grading its own output misses subtle seams, dead-space voids, wrapped monospace chips, janky scroll transitions, sluggish mobile drawers, and lost reference lineage. After Pass-1 `audit_ui.mjs`, Pass-2 critical-error remediation (`passed: true`, `0` critical errors), **and** `record_motion_qa.mjs` (`passed: true`, desktop + mobile `.webm` walkthroughs and keyframes captured), dispatch a **fresh-context read-only Design Director critic** before final delivery.

### Critic Inputs (Keep Context Clean)
- `.unslop/brief.md` (locked product truth, Section 6 rhythm & 3-radius budget, Section 7 Visual DNA & Reference Overrides, Section 8 Copy Economy word budgets)
- `.unslop/inspect/reference-tokens.json` (when an inspiration URL was inspected)
- `.unslop/audit/pass-2/audit.json` (or `multi-route-audit.json`)
- `.unslop/audit/motion-qa/motion-qa-report.json` (frame pacing, hover/motion-toggle probe results, mobile ergonomics telemetry)
- **Side-by-Side Visual & Motion Captures:**
  - Generated static tiles: `critic-desktop-*.png`, `critic-mobile-*.png` (plus full-page/section crops)
  - Generated motion walkthroughs & keyframes: `desktop-walkthrough.webm`, `mobile-walkthrough.webm`, `keyframe-desktop-01..04.png`, `keyframe-mobile-01..03.png`
  - Reference site *(whenever an inspiration URL or screenshot was provided)*: `.unslop/inspect/desktop-top.png`, `.unslop/inspect/desktop-mid.png`, `.unslop/inspect/desktop-full.png`, and `.unslop/inspect/components/*.png` viewed **directly alongside** the generated `critic-desktop-*.png` tiles

### Output Artifact: `visual-critic-checklist.json` (8-Axis 10-Point Rubric)
The Pass-3 Design Director critic MUST inspect the rendered desktop/mobile captures and motion walkthrough artifacts visually—side-by-side with reference captures whenever a reference exists—and emit **`.unslop/audit/visual-critic-checklist.json`** scored strictly on the **8-Axis 10-Point Rubric** (honoring Tier 1 Universal Craft Laws and Tier 2 Reference Overrides documented in `.unslop/brief.md` Section 7):

| # | Axis | `10/10` Visual & Motion Bar (Pass >= `8/10`) | Automatic Penalty Triggers (`< 8/10`) |
| :--- | :--- | :--- | :--- |
| **1** | **Typography Craft** | Curated pairing from [`type-pairings.md`](type-pairings.md) matching locked Typography Mood (technical `500` grotesque + mono for infrastructure references; editorial serif for expressive/editorial brands); `-0.025em` to `-0.04em` tracking; `font-optical-sizing: auto`; `tabular-nums` on telemetry/prices; clean `h1 / body` hierarchy | Any banned default font (`Inter`, `Plus Jakarta Sans`, `Space Grotesk`, `Poppins`, `Roboto`) without `reference-tokens.json` proof; bloated `700`/`800` hero headlines; forced serif on a pure-grotesk technical reference; loose tracking or jagged non-tabular numbers |
| **2** | **Dead-Space Audit** | Deliberate negative space pacing; every card `> 320px` tall fills its middle body with a real product artifact or structured spec | `justify-content: space-between` stretching empty air inside tall cards; stranded bottom links; awkward half-empty grid rows |
| **3** | **Micro-UI Wrapping** | Crisp `white-space: nowrap` monospace terminal/status bars; authentic micro-UIs (luminous tinted rows, notification banners, interactive product proofs, SVG/Canvas curves, status matrices); zero clipped text down to `320px` | Wrapped terminal commands or status pills breaking mid-token; truncated headlines; generic 3-column icon-box + 2-line blurb filler |
| **4** | **Rhythm & Monotony** | Alternating mid-page section layouts matching `.unslop/brief.md` (honoring documented Tier 2 bookend overrides like inset hero + closing CTA); pure header (`<= 5` links + `1` CTA; Theme/Motion in `<footer>` or `Cmd+K`) | `> 2` consecutive generic centered-pyramid sections; repetitive card rows; Theme or Motion toggle pills sitting in the primary top navbar |
| **5** | **Reference Fidelity** | Exact match to `.unslop/brief.md`, the approved Phase 0.5 Style Tile, and `reference-tokens.json` (measured polarity, background/accent ratios, heading weights, tracking, locked modal radii, real product truth) | Unapproved polarity drift; copied brand marks/slogans or invented vanity metrics; missing priority sections from `.unslop/brief.md` |
| **6** | **Surface Cohesion** | Warm neutral (`#FFFFFF` / `#FAF9F6`) or warm-charcoal (`#151414` / `#F0E3DE` / `#302E2D`) surface discipline; unified `1px` hairline grids or locked 3-radius budget (`--r-card`, `--r-control`, `--r-media`); luminous tinted micro-UIs on light canvases; optional `2%` SVG grain preserving WCAG AA contrast | Unprompted `#0B0D14` cold navy-slate dark mode; pitch-black widget spam on light-first references; nested rounded boxes inside rounded boxes; ad-hoc radii drift; plastic purple gradients; failing contrast |
| **7** | **Side-by-Side Visual Lineage & Copy Economy** | Viewing `.unslop/inspect/desktop-top.png` & `desktop-full.png` alongside `critic-desktop-*.png`: **(a)** blurring the brand/copy still unmistakably reveals the inspiration's architectural motifs, substrate (dot gutters, vertical rails, registration squares, corner brackets, inset halftone/shader frame, split contrast), and polarity; **(b)** copy stays crisp, scannable, and animation-/product-proof-led within `.unslop/brief.md` Section 8's word budgets | Generated page looks like a generic template when placed beside `desktop-top.png` / `desktop-full.png` (missing signature substrate, framing rails, or contrast motifs); wordy multi-paragraph feature cards or prose walls where an interactive product proof or micro-UI should explain the product |
| **8** | **Motion Continuity, Video Walkthrough & Mobile Ergonomics** | Reviewing `desktop-walkthrough.webm`, `mobile-walkthrough.webm`, `keyframe-*.png`, and `motion-qa-report.json`: smooth rAF frame pacing (`smooth: true`, zero severe jank), responsive hover deltas on primary CTAs, verified `[data-motion-toggle]` / reduced-motion canvas freeze, cohesive scroll choreography, AND genuinely re-authored `390×844` mobile ergonomics (`overflowDuringScrollPx: 0`, `stickyHeaderRatio <= 0.16`, `smallTapTargetsCount: 0`) | Choppy/janky scroll playback (`avgFps < 15` or stuck opacity transitions), dead hover states, broken reduced-motion toggle leaving canvases spinning, horizontal scroll overflow on mobile (`> 1px`), bloated sticky mobile header eating `> 16%` of `844px` height, or cramped `< 44×44px` mobile tap targets |

### Required Schema & Targeted Polish Trigger
Every entry in `visual-critic-checklist.json` records `{ score, status, observations, patchDirectives }` per axis:
- **Pass Gate:** Every critical error in `audit.json` MUST be `0` (`passed: true`), `motion-qa-report.json` MUST have `passed: true`, AND **all 8 rubric axes MUST score `>= 8/10`**.
- **Patch & Re-Verify Loop:** If **any** of the 8 axes scores **`< 8/10`**, `visual-critic-checklist.json` MUST list exact **CSS/layout/motion/copy patch directives** (target file, selector/component, exact property or choreography change, and expected delta). Execute a targeted polish pass applying every patch directive, re-run `audit_ui.mjs` and `record_motion_qa.mjs`, and re-score `visual-critic-checklist.json` before delivering.

---

## 5. Graceful Fallback on Single-Agent Hosts

If the current environment does not expose subagent delegation tools:
- Follow the exact same **Phase 0.5 (Hero Style Tile Checkpoint) → Wave 1 (Foundation) → Wave 2 (4-Specialist Sequence: Media Seed → Chrome/Nav → 5s Hero Proof/Kinetic → Editorial/Routes/Mobile) → Wave 3 (`audit_ui.mjs` + `record_motion_qa.mjs` + 8-Axis Critic + Targeted Polish)** order sequentially.
- Still inspect `critic-desktop-*.png`, `critic-mobile-*.png`, `desktop-walkthrough.webm`, `mobile-walkthrough.webm`, `keyframe-*.png`, and `motion-qa-report.json` side-by-side against `.unslop/inspect/desktop-top.png` / `desktop-full.png`, `.unslop/brief.md`, `reference-tokens.json`, and all **8 axes** of `visual-critic-checklist.json`, applying targeted patches whenever any axis scores `< 8/10`.
