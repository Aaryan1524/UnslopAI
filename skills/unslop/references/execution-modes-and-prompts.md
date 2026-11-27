# Execution Modes, Depth Presets & Starter Prompts (v2.0.0)

The single portable `unslop` Studio Engine adapts automatically to the user's goal and time budget instead of forcing every request through one heavyweight pipeline. Lock the exact **Goal Mode** and **Depth Preset** during Phase 0 (`Prompt Parsing + Silent Recon → Adaptive Discovery → .unslop/brief.md`).

---

## 1. Execution Router Matrix (v2.0.0 — Mode × Depth)

| Preset | Best For | Phase 0 Recon & Discovery | Phase 0.5 Style Tile & Contracts | Build Strategy | QA, Motion Video & Critic Loop |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`fast`** | Hackathons, rapid prototypes, quick visual spikes | `doctor.mjs` + `detect_stack.mjs` (if repo) + `inspect_site.mjs` (if URL); **1–2 rapid questions** (or *"Use best defaults"*) | Compact `.unslop/brief.md` only; **skips Phase 0.5 Hero Style Tile**, separate `DESIGN.md`/`COMPONENTS.md` split, and bespoke media batches (uses crisp CSS/SVG or existing assets) | Single-pass modular build in-thread | **1 `audit_ui.mjs` pass** (fix critical overflow, contrast, broken links/images); **skips Motion Video QA** & Design Director Critic |
| **`standard`** | Day-to-day product sites, marketing launches, app redesigns | Full Phase 0 recon (`inspect_site.mjs` + `extract_reference.mjs` + visual screenshot inspection) + **10–15 questions across 3–4 adaptive intervals** | **Mandatory Phase 0.5 Hero Style Tile Checkpoint** ([`style-tile-checkpoint.md`](style-tile-checkpoint.md)) + `.unslop/brief.md` + `.unslop/DESIGN.md` + `.unslop/COMPONENTS.md` + targeted media under `< 500 KB` budget | Modular component-by-component build | 1–2 `audit_ui.mjs` passes + visual screenshot check + **optional `record_motion_qa.mjs`** |
| **`deep`** | Flagship business websites, launch-ready marketing & interactive web apps | Full Phase 0 recon + optional `rea_inspect.mjs` (when Node supports it) + **10–15 questions across 4 full intervals** (5-Dimension Coverage Matrix) | **Mandatory Phase 0.5 Hero Style Tile Checkpoint** ([`style-tile-checkpoint.md`](style-tile-checkpoint.md)) + **Locked 1-Room Art-Direction Seed** ([`visual-art-direction-and-media.md`](visual-art-direction-and-media.md)) + Full `.unslop/brief.md` + Inspiration Translation Matrix + `.unslop/DESIGN.md` + `.unslop/COMPONENTS.md` | **4-Specialist Parallel Guild** ([`parallel-orchestration.md`](parallel-orchestration.md)) with sequential fallback on single-agent hosts | Multi-route `audit_ui.mjs` (`--routes`) + **mandatory `record_motion_qa.mjs`** (desktop + mobile `.webm` walkthrough + keyframes) + **8-Axis Fresh-Context Design Director Critic (`>= 8/10`)** |
| **`extract-component`** | Porting or dissecting **one specific animation, shader, or interactive widget** into an existing or standalone codebase | `detect_stack.mjs` (target repo) + `inspect_site.mjs` (`css-motion.json`, `shaders.json`, `interactiveStates`, tall-section filmstrips) + optional `rea_inspect.mjs`; **3–5 targeted technical questions** scoped strictly to component mechanics | Focused `.unslop/brief.md` (props, trigger/physics breakdown, mount point, reduced-motion contract); **skips Phase 0.5 Style Tile** and site-wide palette/footer/multi-route overhead | Isolated drop-in component adapted to detected framework/styling stack | Targeted `audit_ui.mjs` check on rendered component (reduced-motion toggle, contrast, keyboard focus, `Escape` dismissal, zero overflow) + **optional `record_motion_qa.mjs`** |

---

## 2. Goal Modes (What Changes in the Target Workspace)

- **`build-from-scratch`:** Greenfield site or interactive web app derived from verified product truth, a 5-second Hero "Aha" interactive proof ([`interactive-product-proofs.md`](interactive-product-proofs.md)), and optional inspiration URL(s)/screenshots. Preserves zero legacy markup and scaffolds clean modular architecture.
- **`redesign-vibe-transfer` (`hybrid` / `unslop-existing`):** Existing website or app where the user's **core product, real copy, routes, and working API/business logic stay intact**, while typography, color system, layout rhythm, Hero "Aha" proof, mobile ergonomics, and motion polish are upgraded (optionally adopting the structural grammar of an inspiration reference). Follow [`framework-adapters.md`](framework-adapters.md) strangler-fig safety rules.
- **`extract-component`:** Dissect a single hero canvas, scroll choreography track, mega-menu, command palette, or tactile control from an inspiration URL and deliver a clean, dependency-light, original implementation in the user's detected stack.

---

## 3. Ready-to-Use Starter Prompts (v2.0 High-Signal Recipes)

Users get the sharpest build when they share four things upfront: **what they are building (or existing repo path)**, **optional inspiration URL(s) + what specifically they like**, **depth preset (`fast` / `standard` / `deep`)**, and **any hard brand, stack, or no-fabrication constraints**.

### Recipe 1 — Fast Hackathon / Rapid Prototype (`fast`)
> *"Use unslop in **fast** mode. Build a working landing page with a 5-second interactive hero demo for `[Product Name — 1-line description]` inspired by `[https://reference.example]`. Confirm 1–2 quick defaults, skip the style tile and motion video QA, and ship a verified working prototype."*

### Recipe 2 — Production Product Site (`standard` — Discovery + 10-Second Style Tile)
> *"Use unslop in **standard** mode to build `[Product Name]` (`[1-sentence positioning]`). Inspiration: `[https://reference.example]` — I like `[specific layout/typography/motif]`. Walk me through the 10–15 question discovery intervals first, lock `.unslop/brief.md`, show me the **10-second Hero Style Tile checkpoint** for sign-off, then build the complete site and run UI audit verification."*

### Recipe 3 — Flagship Studio Launch (`deep` — Full v2.0 Studio Engine)
> *"Use unslop in **deep** mode to build a flagship launch site for `[Product Name]`. Inspiration: `[https://reference.example]` — carry over `[specific framing motifs, surface polarity, and pacing]`. Core offerings & real specs: `[verified capabilities/tiers]`. Run the full 4-interval discovery (10–15 questions), lock `.unslop/brief.md` + the unified studio art-direction seed, verify the **10-second Hero Style Tile checkpoint**, then execute with the **4-Specialist Parallel Guild**, multi-route audit, desktop+mobile Motion Video QA, and the **8-Axis Design Director Critic (`>= 8/10`)**."*

### Recipe 4 — Redesign Existing App / Vibe Transfer (`redesign-vibe-transfer`)
> *"Use unslop in **standard** mode (`redesign-vibe-transfer`) to upgrade my existing app in this repo (`[http://localhost:3000]`) using `[https://reference.example]` as visual direction. Preserve all existing routes, real copy, and API handlers — run discovery to lock visual motifs, Hero 'Aha' proof, and mobile ergonomics, verify via the **10-second Hero Style Tile**, then refactor safely."*

### Recipe 5 — Multi-Source Remix (`deep` or `standard`)
> *"Use unslop in **deep** mode to remix `[https://layout-ref.example]` for structural grid/navigation grammar and `[https://motion-ref.example]` for atmospheric palette and kinetic pacing for `[Product Name]`. Lock one authoritative source per axis during discovery, validate the blend in the **Phase 0.5 Hero Style Tile checkpoint**, and run full Studio Engine QA."*

### Recipe 6 — Dissect & Port One Specific Animation or Component (`extract-component`)
> *"Use unslop in **extract-component** mode. Inspect `[https://reference.example]`, reverse-engineer `[e.g., the sticky 3-stage scroll reveal / frosted Search overlay / WebGL hero shader]`, ask 3–5 targeted technical questions about my `[Next.js / React / Vanilla]` repo, and implement an original, reduced-motion-safe drop-in component with targeted QA without altering unrelated pages."*
