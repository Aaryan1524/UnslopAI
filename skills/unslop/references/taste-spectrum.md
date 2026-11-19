# Fallback Taste Spectrum (Use ONLY Without External Inspiration)

> **Rule:** If the user provided an inspiration URL or screenshots, **do not apply these presets**. Extract the inspiration's own grammar and apply only the user's taste tweaks.
> Use this 4-tier spectrum **only** when the user asks to unslop or build a UI with no external visual reference.

---

## Tier 1 — Minimalist (Reductive & Quiet)
- **Best for:** Portfolios, writing tools, focused utilities, calm SaaS landing pages.
- **Palette:** Off-white/warm paper (`#FAF9F6`) or deep charcoal (`#111214`), monochrome surface steps, 1 disciplined accent (`< 3%` area).
- **Typography:** Clean grotesque or editorial sans (`Instrument Sans` / `Plus Jakarta Sans` / `IBM Plex Sans`), generous line-height (`1.6`), wide tracking on small uppercase labels.
- **Surfaces & Layout:** Flat `1px` borders instead of shadows, `4–8px` subtle radii, generous section breathing room (`96–128px`), strict single-focus columns or 2-column splits.

## Tier 2 — Enterprise / High-Precision (Structured & Dense)
- **Best for:** Dashboards, analytics, developer consoles, B2B SaaS workflows, internal tools.
- **Palette:** Neutral cool/slate layers (`#F8FAFC` / `#FFFFFF` or `#0B0E14` / `#131822`), semantic status tokens (muted emerald/amber/crimson), accessible crisp focus rings.
- **Typography:** High-legibility neo-grotesque (`Geist` / `Plus Jakarta Sans`) + crisp monospace (`JetBrains Mono` / `IBM Plex Mono`), `tabular-nums` everywhere numbers appear.
- **Surfaces & Layout:** Compact control density, `6px` radii, sticky/compact navigation rail, subtle `1px` borders with `0 1px 2px` micro-elevation only on popovers/menus, explicit empty/loading/error states.

## Tier 3 — Creative / Editorial (Expressive & Paced)
- **Best for:** Product launches, brand storytelling, design studios, interactive essays, showcases.
- **Palette:** High-contrast ink-on-stone (`#141413` on `#F4F1EA`) or rich obsidian with warm terracotta/vermilion/cobalt accents—never generic indigo gradients.
- **Typography:** Expressive display serif or high-contrast grotesque (`Newsreader`, `Instrument Serif`, `Syne`, `Space Grotesk`) paired with disciplined neutral body text; large `h1 / body` scale (`>= 2.5`).
- **Surfaces & Layout:** Asymmetric editorial grids (e.g. `5/7` or `4/8` column splits), rule lines separating chapters, deliberate scroll reveal pacing (`cubic-bezier(0.22, 1, 0.36, 1)`).

## Tier 4 — Extreme / Tactile (Bespoke Hardware & Spatial Craft)
- **Best for:** Timers, calculators, audio/synth plugins, interactive hardware demos, focused single-purpose instruments.
- **Gate:** Run the **Context-Appropriateness Gate** first—do not force tactile hardware chrome onto text-heavy blogs or multi-page enterprise tables.
- **Recipe:** Load [`tactile-hardware-grammar.md`](./tactile-hardware-grammar.md) and optionally [`assets/micro-synth.ts`](../assets/micro-synth.ts) for physical surface materials, recessed LCD/LED readouts, pointer-capture rotary/detent controls, and procedural audio clicks.
