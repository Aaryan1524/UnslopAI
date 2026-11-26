# Execution Modes, Depth Presets & Starter Prompts

The single portable `unslop` skill adapts automatically to the user's goal and time budget instead of forcing every request through one heavyweight pipeline. Lock the exact **Goal Mode** and **Depth Preset** during Phase 0 (`Inspect-First → Adaptive Q&A → .unslop/brief.md`).

---

## 1. Execution Router Matrix (Mode × Depth)

| Preset | Best For | Phase 0 Recon & Q&A | Contracts & Media | Build Strategy | QA & Review Loop |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`fast`** | Hackathons, rapid prototypes, quick visual spikes | `doctor.mjs` + `detect_stack.mjs` (if repo) + `inspect_site.mjs` (if URL); 1–2 short Q&A rounds (or *"Use best defaults"*) | Compact `.unslop/brief.md` only (skip heavy separate `DESIGN.md`/`COMPONENTS.md` split); skip `rea_inspect.mjs` and bespoke shader/illustration generation (use crisp CSS, clean SVG, or existing assets) | Single-pass modular build in-thread | 1 `audit_ui.mjs` pass (fix critical errors: overflow, contrast, broken links/images) |
| **`standard`** | Day-to-day product pages, app redesigns, balanced quality & speed | Full Phase 0 recon + 2–3 request-specific Q&A rounds | `.unslop/brief.md` + `.unslop/DESIGN.md` + `.unslop/COMPONENTS.md`; targeted media synthesis where needed | Modular component-by-component build | 1–2 `audit_ui.mjs` passes + visual screenshot check |
| **`deep`** | Launch-ready business websites, flagship marketing & interactive web apps | Full Phase 0 recon + optional `rea_inspect.mjs` (when Node supports it) + 2–3 request-specific Q&A rounds | Full `.unslop/brief.md` + Inspiration Translation Matrix + `.unslop/DESIGN.md` + `.unslop/COMPONENTS.md` + cohesive art-directed media batches | **Two-Wave Disjoint Parallel Orchestration** ([`parallel-orchestration.md`](parallel-orchestration.md)) with sequential fallback on single-agent hosts | Mandatory 2-pass `audit_ui.mjs` (`--routes` for multi-route) + **Independent Fresh-Context Read-Only Reviewer** scoring all 5 craft axes `>= 4/5` |
| **`extract-component`** | Porting or dissecting **one specific animation, shader, or interactive widget** into an existing or standalone codebase | `detect_stack.mjs` (target repo) + `inspect_site.mjs` (`css-motion.json`, `shaders.json`, `interactiveStates`, tall-section filmstrips) + optional `rea_inspect.mjs`; 1–2 technical Q&A rounds scoped strictly to that component | Focused `.unslop/brief.md` (component scope, trigger/physics breakdown, mount point, reduced-motion contract) — skips site-wide palette/footer/multi-route overhead | Isolated drop-in component adapted to detected framework/styling stack | Targeted `audit_ui.mjs` check on the rendered component (reduced-motion toggle, contrast, keyboard focus, `Escape` dismissal, zero overflow) |

---

## 2. Goal Modes (What Changes in the Target Workspace)

- **`build-from-scratch`:** Greenfield site or app derived from user product truth + optional inspiration URL(s)/screenshots. Preserves zero legacy markup; scaffolds clean modular structure.
- **`redesign-vibe-transfer` (`hybrid` / `unslop-existing`):** Existing website or app where the user's **core product, real copy, routes, and working logic stay intact**, while typography, color system, layout rhythm, motion, and interactive polish are upgraded (optionally adopting the structural/visual grammar of an inspiration reference). Follow [`framework-adapters.md`](framework-adapters.md) strangler-fig safety rules.
- **`extract-component`:** Dissect a single hero canvas, scroll choreography track, mega-menu, command palette, or tactile control from an inspiration URL and deliver a clean, dependency-light, original implementation in the user's stack.

---

## 3. Ready-to-Use Starter Prompts (High-Signal Input Patterns)

Users get the sharpest first pass when they share four things upfront: **what they are building (or existing repo path)**, **optional inspiration URL(s) + what specifically they like about it**, **speed vs. launch-ready depth**, and **any hard brand/stack constraints**.

### Recipe 1 — Fast Hackathon / Rapid Prototype (`fast`)
> *"Use unslop in **fast** mode. Build a working landing page and interactive demo for `[Product Name — 1-line description]` inspired by `[https://reference.example]`. Keep the layout pacing and typography feel, use clean defaults where unspecified, and get a verified working version up quickly."*

### Recipe 2 — Launch-Ready Business Website (`deep` + Parallel Build)
> *"Use unslop in **deep / launch-ready** mode to build a complete website for `[Product Name]`. Inspiration: `[https://reference.example]` — I specifically like `[e.g., the product showcase cadence, frosted top nav with search flyout, and 2-column feature grid]`. Our product does `[core offering + real specs/pricing]`. Run the discovery interview first, lock `.unslop/brief.md`, then build with parallel orchestration and full multi-route QA."*

### Recipe 3 — Redesign Existing Site / Vibe Transfer (`redesign-vibe-transfer`)
> *"Use unslop to redesign my existing app in this repo (`[http://localhost:3000]`) using `[https://reference.example]` as visual inspiration. Keep all my existing product copy, routes, and API wiring intact — only transfer the layout spacing, typography hierarchy, palette feel, and smooth motion."*

### Recipe 4 — Multi-Source Remix (`deep` or `standard`)
> *"Use unslop to remix `[https://layout-ref.example]` for layout/navigation structure and `[https://motion-ref.example]` for atmospheric palette and scroll motion for `[Product Name]`. Lock one authoritative source per axis in `.unslop/brief.md` before building."*

### Recipe 5 — Dissect & Port One Specific Animation or Component (`extract-component`)
> *"Use unslop in **extract-component** mode. Inspect `[https://reference.example]`, reverse-engineer `[e.g., the sticky 3-stage scroll reveal / frosted Search overlay / WebGL hero shader]`, and implement an original, reduced-motion-safe version inside my existing `[Next.js / React / Vanilla]` project without changing unrelated pages."*
