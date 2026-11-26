# Phase 0: Inspect-First Dynamic Discovery Protocol

Run this **Inspect-First → Dynamic Multi-Interval Context Discovery → `.unslop/brief.md` Spec Lock** protocol **before writing any application code**. Questions must always be grounded in concrete recon findings — never generic boilerplate checklists.

---

## 1. Step 0A — Silent Recon First (Before Asking Questions)

Gather ground truth automatically so the user never has to repeat facts already in their repository or on the inspiration website:

1. **Preflight:** Run `node <skill-dir>/scripts/doctor.mjs` (pass `--no-launch` only when browser scripts are not needed).
2. **Existing Repository Scan (whenever a target codebase exists):**
   - Run `node <skill-dir>/scripts/detect_stack.mjs <targetDir> .unslop/stack-report.json`.
   - Read existing product truth (`README.md`, routes, `src/data/*`, pricing/specs, `public/` assets) to build a factual **Content Inventory**.
3. **Inspiration Reference Scan (whenever an inspiration URL is provided):**
   - Run `node <skill-dir>/scripts/inspect_site.mjs <url> .unslop/inspect` and `node <skill-dir>/scripts/extract_reference.mjs <url> .unslop/inspect/reference-tokens.json`.
   - Read `report.json`'s `reconDigest` and `reference-tokens.json` (`surfaceRatio` light/dark %, measured `typography` heading weights/tracking, `geometryLock` modal card/button/input/media radii, `alignmentAudit`, `copyDensity`, `sectionArchetypes`, `detectedInteractiveTriggers`, `hasWebGL`).
   - **Visually inspect captures before asking a single question:** Open `desktop-top.png`, `desktop-mid.png`, `mobile-top.png`, and key `components/*.png` to catalog exact structural motifs (dot/grid outer substrates, vertical guide rails, registration nodes, corner brackets, inset halftone/shader frames, split comparison stages, luminous vs. dark surfaces).
   - *(If `blocked: true`, stop automation immediately per [`capabilities-and-limitations.md`](capabilities-and-limitations.md) and ask for screenshots instead.)*

---

## 2. Step 0B — Dynamic Multi-Interval Context Discovery (1 to 10+ Questions)

Replace rigid fixed-round scripts with a **Dynamic Interval Protocol** that adapts smoothly to how much context the user already supplied and how deeply they want to steer the build.

### Scaling Range
- **1 Rapid Confirmation (1–2 questions):** When the user provides detailed specs, a complete PRD/repo, or explicitly selects *"Use best defaults — lock the brief now"*. Confirm only critical ambiguities and move straight to Step 0C.
- **Standard Discovery (3–6 questions across 2 intervals):** When the user shares a clear product idea + inspiration URL/mood but leaves visual motif fidelity, copy density, or priority animations open.
- **Deep Context Discovery (5–10+ targeted questions across 3–4 focused intervals):** When building a flagship launch site, complex multi-surface application, or nuanced brand remix where architectural motifs, typography mood, copy economy, and custom product-explaining animations need tight alignment.

### Interval Delivery Rules
- **Focused Batches of 2–4 Crisp Questions per Turn:** Never dump 10 questions in one wall of text, and never interrogate one trivial question per turn. Group related decisions into scannable 2–4 question intervals.
- **Explicit Stop-or-Dive-Deeper Escape Hatch on Every Interval:** End each interval with an explicit choice such as:
  > *"Reply to these, tell me to **'Use best defaults & lock the brief'** anytime, or let me know if you want to **dive deeper** into animations, copy, or sub-pages."*
- **Grounded, Never Generic:** Every question MUST cite specific facts from the user's prompt, `.unslop/stack-report.json`, `.unslop/inspect/report.json` (`reconDigest`), `reference-tokens.json`, or observed screenshot motifs.
  - *Bad (generic):* "What sections, fonts, and colors do you want?"
  - *Good (grounded):* "Inspecting the reference's `desktop-top.png` and `desktop-mid.png`, I see a light-first `#FAF9F6` canvas framed by outer dot-matrix gutters, continuous `1px` vertical blueprint rails with corner registration squares, an inset halftone hero with pill CTAs + `4px` cards, and tight `500`-weight grotesque headlines. For your telemetry platform, should we carry over those exact rails and inset halftone hero, or keep the light polarity with a split editorial layout?"
- **Skip Everything Already Answered:** Never re-ask facts already present in the prompt, codebase, or prior intervals.
- **Tool Adaptation:** Use `AskUserQuestion` (or the host's structured multiple-choice UI tool) when available; otherwise present clean, numbered options (`1)`, `2)`, `3)`) in chat.
- **Adapt Scope to Goal Mode:**
  - **`extract-component`** *(e.g., "Port the sticky scroll reveal from X")*: Skip site-wide palette, footer, and multi-route questions. Ask ONLY component-specific questions (target file/route in detected stack, scroll/pointer trigger mechanics, reduced-motion behavior, dependency budget).
  - **`redesign-vibe-transfer`** *(existing repo + inspiration)*: Confirm which existing routes/copy/logic stay untouched, which visual/structural motifs transfer from the reference, and depth (`fast` / `standard` / `deep`).
  - **`build-from-scratch`**: Walk through the five core discovery pillars below until product truth, visual DNA, typography mood, copy budget, and signature animations are unambiguous.

### Five Core Discovery Pillars (Covered Dynamically Across Intervals)

Select only unanswered pillars and bundle 2–4 questions per interval:

| Pillar | What to Clarify | Concrete Decision Axes (Grounded in Recon) |
| :--- | :--- | :--- |
| **A. Product Core, Scope & Audience** | Real positioning, primary visitor, conversion action, and build depth | • Goal mode (`build-from-scratch` / `redesign-vibe-transfer` / `extract-component`) & depth (`fast` / `standard` / `deep`)<br>• Primary ICP, core job-to-be-done, real offerings/tiers (zero fabricated claims), and primary CTA destination<br>• Existing routes or business logic to preserve (when modifying a repo) |
| **B. Visual Motif Fidelity** *(citing `desktop-top.png`, `desktop-mid.png`, `components/*.png`)* | Exact spatial and decorative signatures from the reference that must carry over vs. adapt | • Page substrate & framing: outer dot-matrix/grid gutters, continuous `1px` vertical guide rails, `7×7px` registration squares (`□`), corner-bracketed technical callouts (`┌ ┐ └ ┘`)<br>• Hero & closing frame architecture: inset rounded halftone/shader canvas with bottom ticker vs. asymmetric editorial split vs. full-bleed stage<br>• Surface polarity & contrast: luminous light-first (`#FFFFFF` / `#FAF9F6`) with tinted micro-UIs vs. warm-charcoal dark (`#151414`), plus palette (`keep extracted hexes` / `flip polarity` / `custom brand palette`)<br>• Reference overrides to preserve (e.g., pill primary CTAs paired with `4px` cards, 50/50 noise-vs-calm split comparison stage) |
| **C. Typography Mood** *(citing `reference-tokens.json` + [`type-pairings.md`](type-pairings.md))* | Font voice aligned to both reference structure and brand personality | • **Technical / Infrastructure / Developer Systems:** Reference-matched tight neo-grotesk at `500` display weight (`Figtree` / `Switzer` / `General Sans`) + crisp monospace (`JetBrains Mono`) — no forced editorial serif<br>• **Expressive / Editorial / Lively / Colorful Brands:** High-contrast editorial serif (`Instrument Serif` / `Newsreader` / `Source Serif 4`) paired with calm neutral sans + mono<br>• **Explicit User Choice:** Honor any typeface the user explicitly specifies |
| **D. Copy Minimalism vs. Depth** *(citing `copyDensity`)* | Word economy vs. narrative detail | • **Visual-First / Minimal Copy (Default for technical & product showcases):** Crisp headline + 1-line subcopy + interactive micro-UIs and live animations carrying the explanation (show, don't tell)<br>• **Balanced Product Narrative:** Concise value framing paired with scannable spec matrices and interactive proof<br>• **Editorial / Deep Technical Prose:** Long-form structured documentation or essay cadence where reading depth is the primary goal |
| **E. Product-Explaining Signature Animations & Interactive Surfaces** | Custom kinetic storytelling tied to how the product actually works | • 1–3 signature animations that visually explain the product mechanism (e.g., noise-to-signal filtering matrix, live routing/latency curve, shader/halftone atmospheric pulse, sticky step-by-step state morph, interactive before/after toggle)<br>• Motion density (`minimal & crisp` / `balanced` / `motion-heavy kinetic`) & reduced-motion freeze behavior<br>• Required working interactive surfaces (from [`interactive-component-patterns.md`](interactive-component-patterns.md)): `Cmd+K` palette, live configurator/calculator, filterable catalog, multi-step form, slide-over drawers |

---

## 3. Step 0C — Lock `.unslop/brief.md` & Quick User Approval Gate

1. Synthesize recon findings, visually observed reference motifs, and all interval answers into **`.unslop/brief.md`** using [`product-brief-template.md`](product-brief-template.md) — explicitly completing **Section 7 (Visual DNA & Structural Motifs Manifest)** and **Section 8 (Copy Economy & Visual Storytelling Budget)**.
2. Present a crisp, scannable summary of `.unslop/brief.md` (execution profile, locked visual motifs & reference overrides, typography mood, copy word budget, signature animations, and orchestration mode) and ask for a quick **"Looks good — proceed"** (or targeted adjustments).
3. **Never write application code before `.unslop/brief.md` is approved** (unless the user explicitly says *"use best defaults and build immediately"*).

---

## 4. No-Fabrication & Assumption Hygiene

- **Never invent factual claims:** Do not fabricate customer counts, uptime SLAs, security certifications, customer logos, testimonials, pricing numbers, or founder quotes.
- **Handling missing data:** When real numbers or testimonials are not supplied, either omit the social-proof band entirely (see [`inspiration-translation-matrix.md`](inspiration-translation-matrix.md)) or replace it with verifiable product architecture, interactive demos, or clearly labeled structural slots documented in `.unslop/brief.md`.
- **Keep `.unslop/` tidy & git-ignored:** Store recon captures (`.unslop/inspect/`), stack reports (`.unslop/stack-report.json`), contracts (`.unslop/brief.md`, `.unslop/DESIGN.md`, `.unslop/COMPONENTS.md`), and audit runs (`.unslop/audit/`) inside `.unslop/` rather than scattering files across the user's project root. **Automatically ensure `.unslop/` is listed in the target project's `.gitignore`** (create or append `.unslop/` before writing scratch artifacts) — or remove temporary `.unslop/inspect/` and `.unslop/audit/` dumps before delivery if the user wants zero scratch files left on disk.
