# Contributing to UnslopAI

Thank you for contributing to `UnslopAI`! We welcome bug fixes, new extraction/audit capabilities, framework-agnostic reference guides, and regression fixtures.

## Local Development Setup

```bash
git clone https://github.com/Aaryan1524/UnslopAI.git
cd UnslopAI
npm install
# Optional if local Google Chrome is not installed:
npx playwright install chromium
```

## Verification Gate

Before opening a Pull Request, run the full check suite and confirm zero errors:

```bash
npm run check
```

This runs:
1. `npm run validate:skill` — validates `SKILL.md` frontmatter, `.claude-plugin/*.json` and `package.json` version alignment, relative Markdown links, and `.mjs` script syntax.
2. `npm run verify:types` — checks TypeScript asset compatibility (`skills/unslop/assets/micro-synth.ts`).
3. `npm run verify` — executes all 5 automated Playwright extraction, slop-detection, kinetic shader/scroll, and blank-canvas regression suites against local fixtures.

## Authoring Standards

1. **Stay Domain-Agnostic:** Never hardcode site-specific DOM selectors, brand names, or single-website assumptions into `SKILL.md`, scripts, or reference guides. Every capability must generalize cleanly across dashboards, stores, docs, studios, and landing pages.
2. **Keep `SKILL.md` Lean:** Put deep engineering recipes, checklists, and templates in `skills/unslop/references/` so `SKILL.md` stays concise for progressive disclosure.
3. **Add Regression Fixtures for Bug Fixes:** When fixing a false positive or false negative in `inspect_site.mjs` or `audit_ui.mjs`, add a deterministic assertion in `skills/unslop/scripts/verify_harness.mjs`.
4. **Respect Access & IP Boundaries:** Pull requests that introduce anti-bot/CAPTCHA bypasses, login credential scraping, or verbatim third-party asset cloning will not be accepted.
5. **Commit Hygiene:** Use clear [Conventional Commits](https://www.conventionalcommits.org/) (`feat(...)`, `fix(...)`, `docs(...)`, `chore(...)`).
