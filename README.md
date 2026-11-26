<div align="center">

<img src="./docs/assets/banner.png" alt="Unslop — Ship verified, unslopped UIs" width="100%" />

<br />

[![CI](https://github.com/Aaryan1524/UnslopAI/actions/workflows/ci.yml/badge.svg)](https://github.com/Aaryan1524/UnslopAI/actions/workflows/ci.yml)
[![Release](https://img.shields.io/badge/Version-1.4.0-ff5e1f.svg)](./CHANGELOG.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-151414.svg)](./LICENSE)
[![Agent Skills](https://img.shields.io/badge/Agent%20Skills-Standard-1f6feb.svg)](https://agentskills.io)
[![Node.js](https://img.shields.io/badge/Node-%3E%3D22.6-339933.svg)](https://nodejs.org)
[![Playwright](https://img.shields.io/badge/Playwright-Chromium%20QA-45ba4b.svg)](https://playwright.dev)

**One portable `/unslop` skill that extracts real visual DNA from inspiration URLs, interviews for context, builds in parallel, and verifies every pixel in Chromium.**

[Quick Start](#quick-start) · [Before & After](#before-vs-after) · [How It Works](#how-it-works) · [Demo Prompts](#demo-prompts) · [Try Locally](#try-locally)

</div>

---

## Quick Start

Install in any Agent Skills-compatible coding agent:

```bash
npx skills add Aaryan1524/UnslopAI
```

Or via plugin marketplace:

```text
/plugin marketplace add Aaryan1524/UnslopAI
/plugin install unslop
```

Then invoke `/unslop` with your product + optional inspiration URL:

```text
/unslop Build a launch-ready site for [MyProduct] inspired by [https://reference.example]
```

---

## Before vs. After

<img src="./docs/assets/before-after.png" alt="Before vs After comparison: Generic Single-Shot Prompt vs /unslop v1.4 Visual-DNA Engine" width="100%" />

Instead of guessing from training weights, `/unslop` measures real DOM/CSS tokens, structural motifs, and copy budgets first — then blocks shipping until Playwright and the 7-axis visual critic pass.

---

## How It Works

<img src="./docs/assets/pipeline.png" alt="Unslop 4-stage closed-loop pipeline" width="100%" />

| Preset | Best For | Pipeline |
| :--- | :--- | :--- |
| **`fast`** | Hackathons & rapid prototypes | Quick recon → 1 confirmation pass → single modular build → 1 Playwright audit |
| **`standard`** | Production sites & app redesigns | Full recon + token extraction → dynamic Q&A → contracts → build → 1–2 audit passes |
| **`deep`** | Flagship launches & kinetic web apps | Full 4-layer extraction → multi-interval Q&A → Two-Wave parallel build → multi-route QA + 7-axis critic (`>= 8/10`) |
| **`extract-component`** | Porting 1 shader, motion, or widget | Targeted `css-motion` / `shaders` recon → reduced-motion-safe drop-in component → focused QA |

---

## Demo Prompts

Copy, replace the brackets, and run:

- **Launch-ready startup site (`deep`):**
  > `/unslop Build a complete launch-ready website for [Product]. Use [https://reference.example] for visual DNA — keep its framing lines, minimal copy density, and product-explaining animations. Ask as many questions as needed before building.`
- **Fast working MVP (`fast`):**
  > `/unslop in fast mode: build a landing page and interactive demo for [Product] inspired by [https://reference.example]. Use best defaults and verify zero layout breaks.`
- **Redesign an existing app:**
  > `/unslop Redesign my app at [http://localhost:3000] using [https://reference.example] for layout, typography, and motion. Keep all existing copy, routes, and logic intact.`
- **Port one animation or component (`extract-component`):**
  > `/unslop in extract-component mode: inspect [https://reference.example] and build an original reduced-motion-safe version of [the hero shader / sticky walkthrough / command bar] in my repo.`

---

## Try Locally

Clone the repo and run the extractor, auditor, or full 11-suite Playwright verification harness directly:

```bash
git clone https://github.com/Aaryan1524/UnslopAI.git && cd UnslopAI && npm install
npm run doctor                                                 # Check Node, Playwright & Chrome/Chromium
npm run extract-ref -- https://example.com ./.unslop/ref.json  # Extract measured DOM/CSS & visual motifs
npm run audit -- http://127.0.0.1:3000 ./.unslop/audit/pass-1  # Audit layout, contrast, motion & craft
npm run check                                                  # Run validator, typecheck & 11-suite harness
```

---

<details>
<summary><strong>Standalone Install & Full CLI Reference</strong></summary>

Copy or symlink [`skills/unslop`](./skills/unslop) into `~/.agents/skills/unslop`, `~/.claude/skills/unslop`, `.agents/skills/unslop`, or `.cursor/skills/unslop`, then run `npm install && node scripts/doctor.mjs` inside the skill folder. [`browser_helper.mjs`](./skills/unslop/scripts/browser_helper.mjs) automatically falls back to local Google Chrome if bundled Chromium is not installed.

```bash
npm run doctor                                                          # Environment + 21-file skill preflight
npm run detect-stack -- ./my-app ./.unslop/stack-report.json            # Read-only repo & CSS token scan
npm run inspect -- https://example.com ./.unslop/inspect                # 4-layer DOM, shader & scroll recon
npm run extract-ref -- https://example.com ./.unslop/ref-tokens.json    # Surface polarity, radii, motifs & copy density
npm run rea-inspect -- https://example.com ./.unslop/inspect            # Optional bundle/source-map enrichment
npm run audit -- http://127.0.0.1:3000 ./.unslop/audit --routes /,/docs # Multi-route Playwright + 7-axis tiles
npm run validate:skill && npm run verify:types && npm run verify        # Manifest, TS & 11-suite regression tests
```

</details>

<details>
<summary><strong>Repository Structure</strong></summary>

```text
UnslopAI/
├── .claude-plugin/          # Plugin & marketplace manifests
├── .github/                 # CI (Node 22 + 24 Playwright) & templates
├── docs/assets/             # Visual overview, before/after & pipeline graphics
├── fixtures/                # Offline test fixtures (clean, slop, kinetic, interactive)
├── scripts/                 # validate-skill.mjs (manifest, link & syntax checks)
└── skills/unslop/
    ├── SKILL.md             # Unified adaptive /unslop playbook
    ├── scripts/             # doctor, detect_stack, inspect_site, extract_reference, rea_inspect, audit_ui, verify_harness
    ├── references/          # 19 lazy-loaded discovery, typography, craft-primitives, orchestration & QA guides
    └── assets/              # micro-synth.ts (optional zero-dependency Web Audio feedback)
```

</details>

<details>
<summary><strong>Guardrails, Ethics & Docs</strong></summary>

- **Adapt, never clone:** Transfers layout geometry, visual motifs, and kinetic physics onto 100% original copy, shaders, SVGs, and open-source typography. Never copies trademarks, copyrighted media, or proprietary code.
- **No fabrication:** Inventories real repo content first and forbids invented metrics, logos, or testimonials.
- **Stop-on-block:** Halts immediately on `401`/`403`/`429`/`503`, CAPTCHAs, Cloudflare Turnstile, or login walls and falls back to user screenshots.
- **Clean target repos:** All scratch recon and QA outputs stay git-ignored inside `.unslop/`.
- **Docs:** [`SKILL.md`](./skills/unslop/SKILL.md) · [`Execution Modes`](./skills/unslop/references/execution-modes-and-prompts.md) · [`Capabilities & Limitations`](./skills/unslop/references/capabilities-and-limitations.md) · [`CHANGELOG.md`](./CHANGELOG.md) · [`plan.md`](./plan.md) · [`CONTRIBUTING.md`](./CONTRIBUTING.md) · [`SECURITY.md`](./SECURITY.md) · [`MIT License`](./LICENSE)

</details>
