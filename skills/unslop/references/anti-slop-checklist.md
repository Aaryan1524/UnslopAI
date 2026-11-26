# Anti-Slop Checklist

Reject any design or generated component that triggers these failure modes. Run `scripts/audit_ui.mjs` to catch measurable defects automatically and inspect rendered captures side-by-side against `.unslop/brief.md` and every rule below.

---

## Two-Tier Precedence Model

Always distinguish **Tier 1: Universal Craft Laws** (non-negotiable on every build) from **Tier 2: Reference-Driven Visual Grammar** (where an inspected inspiration URL + brand mood legitimately override generic layout defaults when documented in `.unslop/brief.md` Section 7):

| Tier | Governing Rule | Examples |
| :--- | :--- | :--- |
| **Tier 1: Universal Craft Laws** | **Always enforced — zero exceptions** | Zero dead-space card voids (`space-between` `> 320px`), zero wrapped mono bars, pure header (`<= 5` links + `1` CTA; Theme/Motion in `<footer>` or `Cmd+K`), WCAG AA contrast (`>= 4.5:1` body, `>= 3:1` large), `>= 44×44px` mobile tap targets, zero horizontal overflow, concise copy economy, restrained weights (`400`–`500` unless reference-measured), zero placeholder/fabricated data |
| **Tier 2: Reference-Driven Visual Grammar** | **Reference site + brand mood ALWAYS override generic defaults** *(must be locked in `.unslop/brief.md` Section 7 + `reference-tokens.json`)* | Pure technical grotesque `500` + mono for infrastructure references (no forced serif); expressive editorial serif for lively/editorial/colorful brands; centered inset halftone/shader hero + closing CTA bookends; pill primary CTAs (`9999px`) paired with crisp `4px` cards; outer dot-matrix gutters, vertical guide rails, corner brackets, and 50/50 split comparison stages |

---

## 1. Typography & Weight Slop
- **Banned Default Sans Families (Tier 1):** Reject `Inter`, `Plus Jakarta Sans`, `Space Grotesk`, `Poppins`, and `Roboto` unless `.unslop/inspect/reference-tokens.json` proves the inspiration URL uses them (or the user explicitly requested them). Use [`type-pairings.md`](type-pairings.md).
- **Context-Blind Font Mismatch (Tier 2):** Do not force an editorial serif onto a tight technical/infrastructure reference that runs pure `500`-weight neo-grotesk + mono, and do not flatten a lively/editorial/colorful brand into sterile generic sans when an editorial serif pairing fits its voice.
- **Bloated `700`/`800` Heading Weights (Tier 1):** Reject heavy `700`/`800` display headlines where refined `400`–`500` weights with `font-optical-sizing: auto` and tight negative tracking (`-0.025em` to `-0.04em`) belong (unless explicitly measured in `reference-tokens.json`).
- **Flat Scale (Tier 1):** Ensure decisive contrast between display headings and body text (`h1 / body >= 1.75` for marketing/editorial, `>= 1.5` for dense operational tools).
- **Unaligned Telemetry & Unintended Mono Wrapping (Tier 1):** All prices, metrics, counters, and timers must set `font-variant-numeric: tabular-nums`. Terminal bars, endpoint badges, and monospace status lines must enforce `white-space: nowrap` (with clean ellipsis/container handling) so tokens never wrap awkwardly across lines.

## 2. Palette & Surface Slop
- **Cold `#0B0D14` Navy-Slate Dark Mode Reflex (Tier 1):** Reject default cold `#0B0D14` (and `#0F172A` / `#090D16`) blue-black slate dark mode unless `reference-tokens.json` proves the inspiration site uses a cool slate polarity. Prefer light-first warm/neutral canvases (`#FFFFFF` / `#FAF9F6`, `80–93%` area, `#151414` ink, `#E5E0D8` borders) or warm-charcoal dark mode (`#151414` canvas, `#F0E3DE` headings, `#302E2D` borders) per [`craft-primitives.md`](craft-primitives.md).
- **Pitch-Black Box Spam on Light-First Canvases (Tier 2):** When building on a luminous light-first reference, do not drop heavy `#09090B` dark widgets into every feature card; use luminous `#FFFFFF` micro-UIs with subtle accent-tinted rows and pills (see [`craft-primitives.md`](craft-primitives.md) Section 9).
- **Unprompted Purple/Indigo Gradients & Plastic Surfaces (Tier 1):** Never default to `#6366f1` → `#8b5cf6` hero gradients, glowing dark-mode purple blobs, cyan-pink gradient text, or flat plastic multi-stop gradients. Use solid discipline + optional `2%` (`0.02–0.03`) SVG `<feTurbulence>` noise grain overlays or reference-matched procedural halftone/solar-glow stages.
- **Gratuitous Glassmorphism & Shadow Stacking (Tier 1):** Do not wrap every panel in `backdrop-filter: blur(...)` or heavy blurred drop shadows. Establish hierarchy through background luminance steps, `1px` edge-to-edge hairline dividers, blueprint rails, and intentional negative space.

## 3. Section Rhythm, Geometry & Card Void Slop
- **Consecutive Centered-Pyramid Section Monotony (Tier 1 with Tier 2 Bookend Allowance):** Reject pages with `> 2` consecutive generic centered-pyramid sections (`[Centered Hero] -> [Centered 3-Card Grid] -> [Centered CTA]`). Alternate mid-page layouts deliberately (`50/50 Noise-vs-Calm Split`, `Sticky Numbered Flow`, `Full-Bleed Telemetry`, `Edge-to-Edge Hairline Bento`). *Tier 2 Allowance:* A centered inset halftone/shader hero paired with a matching centered inset closing CTA is valid when reference-backed and documented in `.unslop/brief.md` Section 7, provided mid-page bands deliver real structural contrast.
- **Cookie-Cutter Icon-Box Feature Grids (Tier 1):** Replace generic 3-column stock icon + 2-line blurb cards with domain-native micro-UI artifacts (luminous tinted rows, OS notification banners, SVG/Canvas usage-decay curves, non-wrapping terminal bars, crisp status matrices) per [`craft-primitives.md`](craft-primitives.md).
- **Border-Radius Drift / Schizophrenia (Tier 1 with Tier 2 Reference Lock):** Reject ad-hoc mixing of unrelated radii (`0px` + `16px` + `24px` + `9999px`) or nesting rounded boxes inside rounded boxes. Enforce the locked 3-radius budget (`--r-card`, `--r-control`, `--r-media`). *Tier 2 Allowance:* Pill primary CTAs (`--r-control: 9999px`) paired with crisp `4px` cards (`--r-card: 4px`) and an inset rounded hero frame (`--r-media: 12px`) are valid when reference-backed and locked consistently across the entire page.
- **`space-between` Empty-Void Card Stretch (Tier 1):** Ban `justify-content: space-between` on cards `> 320px` tall unless a real middle visual artifact occupies the card body—never strand a heading at the top and a lonely CTA at the bottom across empty air.
- **Navbar Utility Chrome Clutter (Tier 1):** Keep primary header navigation to `<= 5` links + `1` primary CTA. Move `Theme` (Light/Dark) and `Motion` toggles into `<footer>` or the `Cmd+K` palette—never clutter the primary navbar header with toggle pills.
- **Uniform Padding Bloat & Mobile Overflow (Tier 1):** Vary padding deliberately by component density; verify zero horizontal overflow (`320px`, `390px`, `768px`, `1440px`) and zero truncated text inside fixed-height `overflow: hidden` wrappers.

## 4. Reference Fidelity & Extraction Slop
- **Inspiration Cosplaying Without Visual + Token Verification (Tier 1):** Never claim visual fidelity to an inspiration URL from memory or guesswork. Ground palette polarity, background ratio, heading weight, tracking, modal radii, and `copyDensity` in `.unslop/inspect/reference-tokens.json` and visually verify structural motifs (dot gutters, vertical rails, corner brackets, inset frames, split stages) against `desktop-top.png`, `desktop-mid.png`, and `components/*.png` before locking `.unslop/brief.md`.

## 5. Copy Economy, Show-Don't-Tell & Asset Slop
- **Bloated Multi-Paragraph Prose Walls (Tier 1):** Reject wordy multi-paragraph feature cards, essay-length hero subcopy, or repetitive marketing filler where a compact live animation, telemetry curve, or interactive micro-UI explains the product faster. Enforce the exact word budgets locked in `.unslop/brief.md` Section 8 (derived from `copyDensity`) — headlines `<= 8–10` words, card copy `<= 16–22` words alongside a domain-authentic visual artifact.
- **Placeholder Garbage (Tier 1):** Zero `lorem ipsum`, zero dummy company names, zero fabricated vanity metrics (`"99.99% uptime · 10,000+ happy teams"`), and zero copied brand names/slogans/logos from inspiration sites.
- **Broken or Empty Media (Tier 1):** Zero `naturalWidth === 0` images, zero oversized payloads (`> 500 KB`), and zero `0x0` `<svg>` icons.

## 6. Interaction & Accessibility Slop
- **Low-Contrast Muted Ink & Scrim Failures (Tier 1):** Secondary labels, tinted pills, axis ticks, captions, and text over halftone/shader frames must pass WCAG AA (`>= 4.5:1` normal text, `>= 3:1` large text) across every enabled theme.
- **Missing Keyboard Focus & Broken Overlays (Tier 1):** Never set `outline: none` without a visible `:focus-visible` ring; all drawers, modals, and `Cmd+K` palettes must trap focus and dismiss cleanly via `Escape`.
- **Tiny Mobile Targets & Missing Labels (Tier 1):** Interactive controls on mobile (`<= 768px`) must meet `>= 44×44px` hit areas, and icon-only buttons require `aria-label`.
- **Gratuitous Infinite Motion (Tier 1):** Ban unrequested floating, pulsing, or bouncing animations; honor `prefers-reduced-motion: reduce` and the global Motion toggle (freezing halftone canvases, noise matrices, and tickers cleanly).
