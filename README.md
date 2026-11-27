<div align="center">

<img src="./docs/assets/banner.png" alt="Unslop v2.0 Studio Engine — Ship verified, unslopped UIs" width="100%" />

<br />

[![CI](https://github.com/Aaryan1524/UnslopAI/actions/workflows/ci.yml/badge.svg)](https://github.com/Aaryan1524/UnslopAI/actions/workflows/ci.yml)
[![Release](https://img.shields.io/badge/Version-2.0.0-ff5e1f.svg)](./CHANGELOG.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-151414.svg)](./LICENSE)
[![Agent Skills](https://img.shields.io/badge/Agent%20Skills-Standard-1f6feb.svg)](https://agentskills.io)
[![Node.js](https://img.shields.io/badge/Node-%3E%3D22.6-339933.svg)](https://nodejs.org)
[![Playwright](https://img.shields.io/badge/Playwright-Video%20%2B%208--Axis%20QA-45ba4b.svg)](https://playwright.dev)

**One portable `/unslop` Studio Engine that turns a single prompt + inspiration URL into a verified, studio-grade multi-route website — with 10–15Q discovery, a 10-second Hero Style Tile, a 4-specialist parallel guild, and closed-loop Playwright + 8-axis visual QA.**

[3-Step Quick Start](#quick-start-3-steps) · [Range Showcase](#one-skill-any-visual-world) · [Before & After](#before-vs-after) · [Architecture & Timing](#architecture--how-long-it-takes) · [Demo Prompts](#demo-prompts)

</div>

---

## Quick Start (3 Steps)

1. **Install once** in any Agent Skills-compatible coding agent:
   ```bash
   npx skills add Aaryan1524/UnslopAI
   ```
   *(Or via marketplace: `/plugin marketplace add Aaryan1524/UnslopAI` → `/plugin install unslop`)*

2. **Prompt with your product + optional inspiration URL:**
   ```text
   /unslop Build a launch-ready website for [MyProduct] inspired by [https://reference.example]
   ```

3. **Answer quick discovery intervals → approve the 10-second Hero Style Tile → ship.**
   Unslop inspects the reference site first, locks `.unslop/brief.md`, renders a verified desktop/mobile Style Tile for your sign-off, builds in parallel, and auto-polishes until Playwright and the 8-axis Design Director pass.

---

## One Skill. Any Visual World.

<img src="./docs/assets/showcase.png" alt="Real range showcase: SURY Botanical Atelier (luxury parchment + 35mm grain) vs Kestrel Telemetry (technical blueprint + halftone)" width="100%" />

Because `/unslop` measures real DOM/CSS tokens, visual motifs, and typography ratios from your inspiration URL instead of recycling one generic template, the same skill ships both a grainy 35mm luxury atelier and a surgical technical blueprint.

---

## Before vs. After

<img src="./docs/assets/before-after.png" alt="Before vs After comparison: Generic Single-Shot Prompt vs /unslop v2.0 Studio Engine" width="100%" />

---

## Architecture & How Long It Takes

<img src="./docs/assets/architecture.png" alt="Unslop v2.0 Architecture and End-to-End Timing Breakdown" width="100%" />

| Preset | Typical Time | Best For | What Runs |
| :--- | :--- | :--- | :--- |
| **`fast`** | **~2 min** | Hackathons & rapid prototypes | Quick recon → 1–2 confirmations → single modular build → 1 Playwright audit |
| **`standard`** | **~5 min** | Production pages & redesigns | Full recon → 10–15Q discovery → **10s Hero Style Tile** → modular build → `audit_ui` + optional `motion-qa` |
| **`deep`** | **~8–10 min** | Flagship multi-route launches | Full 4-layer extraction → 10–15Q discovery → **10s Hero Style Tile** → **4-Specialist Parallel Guild** → multi-route `audit_ui` + **Motion QA** + **8-Axis Critic (`>= 8/10`)** |
| **`extract-component`** | **~3 min** | Porting 1 animation or widget | Targeted shader/motion recon → 3–5 technical Qs → reduced-motion drop-in → focused QA |

---

## Demo Prompts

- **Launch-ready flagship (`deep`):**
  > `/unslop Build a complete launch-ready website for [Product] inspired by [https://reference.example]. Run the 10–15 question discovery interview, show me the 10-second Hero Style Tile first, then build with the 4-specialist parallel guild and full Playwright + Motion QA.`
- **Fast working MVP (`fast`):**
  > `/unslop in fast mode: build a landing page and interactive demo for [Product] inspired by [https://reference.example]. Use best defaults and verify zero layout breaks.`
- **Redesign an existing app:**
  > `/unslop Redesign my app at [http://localhost:3000] using [https://reference.example] for layout, typography, and motion. Keep all existing copy, routes, and logic intact.`
- **Port one animation or component (`extract-component`):**
  > `/unslop in extract-component mode: inspect [https://reference.example] and build an original reduced-motion-safe version of [the hero shader / sticky story / command bar] in my repo.`

---

## Try Locally

```bash
git clone https://github.com/Aaryan1524/UnslopAI.git && cd UnslopAI && npm install
npm run doctor                                                      # Check Node, Playwright, Chrome & 25 skill files
npm run style-tile -- --demo ./.unslop/style-tile                   # Render a 10-second Hero Style Tile + WCAG check
npm run extract-ref -- https://example.com ./.unslop/ref.json       # Extract measured DOM/CSS & visual motifs
npm run audit -- http://127.0.0.1:3000 ./.unslop/audit/pass-1       # Audit layout, contrast, motion & craft
npm run motion-qa -- http://127.0.0.1:3000 ./.unslop/audit/motion   # Record desktop/mobile video + 60fps rAF + keyframes
npm run check                                                       # Run validator, typecheck & 13-suite harness
```

---

<details>
<summary><strong>Standalone Install & Full CLI Reference</strong></summary>

Copy or symlink [`skills/unslop`](./skills/unslop) into `~/.agents/skills/unslop`, `~/.claude/skills/unslop`, `.agents/skills/unslop`, or `.cursor/skills/unslop`, then run `npm install && node scripts/doctor.mjs` inside the skill folder. [`browser_helper.mjs`](./skills/unslop/scripts/browser_helper.mjs) automatically falls back to local Google Chrome if bundled Chromium is not installed.

```bash
npm run doctor                                                          # Environment + 25-file skill preflight
npm run detect-stack -- ./my-app ./.unslop/stack-report.json            # Read-only repo & CSS token scan
npm run inspect -- https://example.com ./.unslop/inspect                # 4-layer DOM, shader & scroll recon
npm run extract-ref -- https://example.com ./.unslop/ref-tokens.json    # Surface polarity, radii, motifs & copy density
npm run style-tile -- .unslop/style-tile-spec.json ./.unslop/style-tile # Phase 0.5 10-second Hero Style Tile checkpoint
npm run rea-inspect -- https://example.com ./.unslop/inspect            # Optional bundle/source-map enrichment
npm run audit -- http://127.0.0.1:3000 ./.unslop/audit --routes /,/docs # Multi-route Playwright + 8-axis critic tiles
npm run motion-qa -- http://127.0.0.1:3000 ./.unslop/audit/motion-qa    # Scroll/interaction .webm videos + rAF + keyframes
npm run validate:skill && npm run verify:types && npm run verify        # Manifest, TS & 13-suite regression tests
```

</details>

<details>
<summary><strong>Repository Structure</strong></summary>

```text
UnslopAI/
├── .claude-plugin/          # Plugin & marketplace manifests
├── .github/                 # CI (Node 22 + 24 Playwright) & templates
├── docs/assets/             # Banner, showcase, before/after, architecture & pipeline graphics
├── fixtures/                # Offline test fixtures (clean, slop, kinetic, interactive)
├── scripts/                 # validate-skill.mjs (manifest, link & syntax checks)
└── skills/unslop/
    ├── SKILL.md             # Unified adaptive /unslop v2.0 Studio Engine playbook
    ├── scripts/             # 9 executable Playwright & preflight scripts
    ├── references/          # 21 strict lazy-loaded discovery, style-tile, art-direction, product-proof & QA guides
    └── assets/              # micro-synth.ts (optional zero-dependency Web Audio feedback)
```

</details>

<details>
<summary><strong>Guardrails, Roadmap & Docs</strong></summary>

- **Adapt, never clone:** Transfers layout geometry, visual motifs, and kinetic physics onto 100% original copy, shaders, SVGs, and open-source typography. Never copies trademarks, copyrighted media, or proprietary code.
- **No fabrication:** Inventories real repo content first and forbids invented metrics, logos, or testimonials.
- **Stop-on-block:** Halts immediately on `401`/`403`/`429`/`503`, CAPTCHAs, Cloudflare Turnstile, or login walls and falls back to user screenshots.
- **Clean target repos:** All scratch recon, style tiles, videos, and QA outputs stay git-ignored inside `.unslop/`.
- **Upcoming (`v2.1`):** Default Curated Design Archetype Library for no-URL greenfield prompts — tracked in [GitHub Issues](https://github.com/Aaryan1524/UnslopAI/issues).
- **Docs:** [`SKILL.md`](./skills/unslop/SKILL.md) · [`Discovery Interview`](./skills/unslop/references/product-discovery-interview.md) · [`Style Tile Checkpoint`](./skills/unslop/references/style-tile-checkpoint.md) · [`Interactive Product Proofs`](./skills/unslop/references/interactive-product-proofs.md) · [`Execution Modes`](./skills/unslop/references/execution-modes-and-prompts.md) · [`Capabilities & Limitations`](./skills/unslop/references/capabilities-and-limitations.md) · [`CHANGELOG.md`](./CHANGELOG.md) · [`plan.md`](./plan.md) · [`CONTRIBUTING.md`](./CONTRIBUTING.md) · [`SECURITY.md`](./SECURITY.md) · [`MIT License`](./LICENSE)

</details>
