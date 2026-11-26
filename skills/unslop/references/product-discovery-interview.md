# Phase 0: Inspect-First Adaptive Discovery Protocol

Run this **Inspect-First → Request-Specific Adaptive Q&A → `.unslop/brief.md` Spec Lock** protocol **before writing any application code**. Questions must always be grounded in concrete recon findings — never generic boilerplate checklists.

---

## 1. Step 0A — Silent Recon First (Before Asking Questions)

Gather ground truth automatically so the user never has to repeat facts already in their repository or on the inspiration website:

1. **Preflight:** Run `node <skill-dir>/scripts/doctor.mjs` (pass `--no-launch` only when browser scripts are not needed).
2. **Existing Repository Scan (whenever a target codebase exists):**
   - Run `node <skill-dir>/scripts/detect_stack.mjs <targetDir> .unslop/stack-report.json`.
   - Read existing product truth (`README.md`, routes, `src/data/*`, pricing/specs, `public/` assets) to build a factual **Content Inventory**.
3. **Inspiration Reference Scan (whenever an inspiration URL is provided):**
   - Run `node <skill-dir>/scripts/inspect_site.mjs <url> .unslop/inspect`.
   - Read `report.json`'s `reconDigest` (`topPaletteHexes`, `primaryFonts`, `sectionArchetypes`, `detectedInteractiveTriggers`, `hasWebGL`, `scrollTimelinesCount`, `mobileCollapsedCount`, `mediaCount`, `motionProfile`) and visually skim `desktop-top.png` / `mobile-top.png` / key `components/*.png`.
   - *(If `blocked: true`, stop automation immediately per [`capabilities-and-limitations.md`](capabilities-and-limitations.md) and ask for screenshots instead.)*

---

## 2. Step 0B — Request-Specific Adaptive Q&A (2–3 Quick Rounds)

### Golden Rules
- **Grounded, Never Generic:** Every question MUST cite specific facts from the user's prompt, `.unslop/stack-report.json`, or `.unslop/inspect/report.json` (`reconDigest`).
  - *Bad (generic):* "What sections and colors do you want?"
  - *Good (grounded):* "I inspected `example.com` and found 5 bands on a `#F5F5F7` light palette — including a 2-column promo grid, a 4-tab interactive gallery, and Search/Bag flyout overlays. For your hardware catalog, should we keep `#F5F5F7` or shift to a dark studio palette, and which of those sections should we adapt vs. drop?"
- **Skip Everything Already Answered:** Never re-ask anything stated in the user's prompt or discovered in the repo.
- **Tool Adaptation:** Use `AskUserQuestion` (or the host's structured multiple-choice UI tool) when available; otherwise present clean, numbered options (`1)`, `2)`, `3)`) in chat.
- **"Use Best Defaults" Shortcut:** Always allow the user to pick *"Use best defaults"* on any round so fast/impatient runs never bog down.
- **Adapt Question Scope to Intent:**
  - For **`extract-component`** (e.g., *"Port the sticky scroll reveal from X"*): Skip site-wide palette, footer, and multi-route questions. Ask ONLY animation/component-specific questions (exact target file/route in their detected stack, scroll/pointer trigger behavior, reduced-motion fallback, and dependency budget).
  - For **`redesign-vibe-transfer`** (existing repo + inspiration): Confirm what existing routes/copy/logic must stay untouched, what specific visual/kinetic traits to import from the reference, and depth (`fast` vs. `standard` vs. `deep`).
  - For **`build-from-scratch`**: Cover goal/depth, visual fidelity/palette/motion density grounded in the extracted reference, and real product details/priority sections.

### Adaptive Round Structure (Max 2–3 Rounds)

| Round | Focus | Concrete Axes (Ask Only What Is Unanswered) |
| :--- | :--- | :--- |
| **Round 1** | **Goal, Scope & Depth** | • Goal (`build-from-scratch` / `redesign-vibe-transfer` / `extract-component`)<br>• Depth (`fast` hackathon prototype / `standard` / `deep` launch-ready with parallel build)<br>• Visual fidelity (`close structural match` / `loose vibe transfer` / `specific mechanics only`) |
| **Round 2** | **Visual System & Motion Density** *(citing `reconDigest`)* | • Palette (`keep extracted hexes [list actual hexes]` / `flip light↔dark` / `custom brand palette`)<br>• Motion density (`minimal & crisp` / `balanced` / `motion-heavy kinetic`, noting any extracted WebGL shaders or scroll timelines)<br>• Theme/controls (light-only, dark-only, or dual Light/Dark + Motion toggle) |
| **Round 3** | **Product Truth & Priority Sections / Animations** *(citing extracted bands & repo inventory)* | • Real product offerings, differentiators, and primary CTA (only what wasn't in prompt/repo)<br>• Which specific extracted bands/overlays/animations to **Keep/Adapt** vs. **Drop**<br>• Required working interactive surfaces (from [`interactive-component-patterns.md`](interactive-component-patterns.md)) & real vs. synthesized assets |

---

## 3. Step 0C — Lock `.unslop/brief.md` & Quick User Approval Gate

1. Summarize the recon findings + user answers into **`.unslop/brief.md`** using [`product-brief-template.md`](product-brief-template.md).
2. Present a crisp, scannable summary of `.unslop/brief.md` (locked preset, palette, motion density, priority sections/animations, and whether Two-Wave Parallel Orchestration will run) and ask for a quick **"Looks good — proceed"** (or corrections).
3. **Never write application code before `.unslop/brief.md` is approved** (unless the user explicitly says *"use best defaults and build immediately"*).

---

## 4. No-Fabrication & Assumption Hygiene

- **Never invent factual claims:** Do not fabricate customer counts, uptime SLAs, security certifications, customer logos, testimonials, pricing numbers, or founder quotes.
- **Handling missing data:** When real numbers or testimonials are not supplied, either omit the social-proof band entirely (see [`inspiration-translation-matrix.md`](inspiration-translation-matrix.md)) or replace it with verifiable product architecture, interactive demos, or clearly labeled structural slots documented in `.unslop/brief.md`.
- **Keep `.unslop/` tidy:** Store recon captures (`.unslop/inspect/`), stack reports (`.unslop/stack-report.json`), contracts (`.unslop/brief.md`, `.unslop/DESIGN.md`, `.unslop/COMPONENTS.md`), and audit runs (`.unslop/audit/`) inside `.unslop/` rather than scattering files across the user's project root. Remind the user to keep `.unslop/` in `.gitignore` if they don't want scratch captures committed.
