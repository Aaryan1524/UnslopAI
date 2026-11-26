# Anti-Slop Checklist

Reject any design or generated component that triggers these failure modes. Run `scripts/audit_ui.mjs` to catch measurable defects automatically and inspect screenshots against every tell below.

---

## 1. Typography & Weight Slop
- **Banned Default Sans Families:** Reject `Inter`, `Plus Jakarta Sans`, `Space Grotesk`, `Poppins`, and `Roboto` unless `.unslop/inspect/reference-tokens.json` proves the inspiration URL uses them (or the user explicitly requested them). Use [`type-pairings.md`](type-pairings.md).
- **Bloated `700`/`800` Heading Weights:** Reject heavy `700`/`800` display headlines where refined `400`–`500` weights with `font-optical-sizing: auto` and tight negative tracking (`-0.025em` to `-0.04em`) belong.
- **Flat Scale:** Ensure decisive contrast between display headings and body text (`h1 / body >= 1.75` for marketing/editorial, `>= 1.5` for dense operational tools).
- **Unaligned Telemetry & Unintended Mono Wrapping:** All prices, metrics, counters, and timers must set `font-variant-numeric: tabular-nums`. Terminal bars, endpoint badges, and monospace status lines must enforce `white-space: nowrap` (with clean ellipsis/container handling) so tokens never wrap awkwardly across lines.

## 2. Palette & Surface Slop
- **Cold `#0B0D14` Navy-Slate Dark Mode Reflex:** Reject default cold `#0B0D14` (and `#0F172A` / `#090D16`) blue-black slate dark mode unless `reference-tokens.json` proves the inspiration site uses a cool slate polarity. Prefer light-first warm/neutral canvases (`#FFFFFF` / `#FAF9F6`, `80–93%` area, `#151414` ink, `#E5E0D8` borders) or warm-charcoal dark mode (`#151414` canvas, `#F0E3DE` headings, `#302E2D` borders) per [`craft-primitives.md`](craft-primitives.md).
- **Unprompted Purple/Indigo Gradients & Plastic Surfaces:** Never default to `#6366f1` → `#8b5cf6` hero gradients, glowing dark-mode purple blobs, cyan-pink gradient text, or flat plastic multi-stop gradients. Use solid discipline + optional `2%` (`0.02–0.03`) SVG `<feTurbulence>` noise grain overlays.
- **Gratuitous Glassmorphism & Shadow Stacking:** Do not wrap every panel in `backdrop-filter: blur(...)` or heavy blurred drop shadows. Establish hierarchy through background luminance steps, `1px` edge-to-edge hairline dividers, and intentional negative space.

## 3. Section Rhythm, Geometry & Card Void Slop
- **Consecutive Centered-Pyramid Section Monotony:** Reject pages with `> 2` consecutive centered sections (`[Centered Hero] -> [Centered 3-Card Grid] -> [Centered CTA]`). Alternate layouts deliberately (e.g., `Left Editorial + Right Interactive` → `Sticky Numbered Flow` → `Full-Bleed Telemetry` → `Edge-to-Edge Hairline Bento`).
- **Cookie-Cutter Icon-Box Feature Grids:** Replace generic 3-column stock icon + 2-line blurb cards with domain-native micro-UI artifacts (OS notification banners, SVG/Canvas usage-decay curves, non-wrapping terminal bars, crisp status matrices) per [`craft-primitives.md`](craft-primitives.md).
- **Border-Radius Drift / Schizophrenia:** Reject mixing unrelated radii (`0px` + `16px` + `24px` + `9999px`) or nesting rounded boxes inside rounded boxes. Enforce the locked 3-radius budget (`--r-card`, `--r-control`, `--r-media`) or shared `1px` hairline architectural grids with `0px`–`4px` inner rules.
- **`space-between` Empty-Void Card Stretch:** Ban `justify-content: space-between` on cards `> 320px` tall unless a real middle visual artifact occupies the card body—never strand a heading at the top and a lonely CTA at the bottom across empty air.
- **Navbar Utility Chrome Clutter:** Keep primary header navigation to `<= 5` links + `1` primary CTA. Move `Theme` (Light/Dark) and `Motion` toggles into `<footer>` or the `Cmd+K` palette—never clutter the primary navbar header with toggle pills.
- **Uniform Padding Bloat & Mobile Overflow:** Vary padding deliberately by component density; verify zero horizontal overflow (`320px`, `390px`, `768px`, `1440px`) and zero truncated text inside fixed-height `overflow: hidden` wrappers.

## 4. Reference Fidelity & Extraction Slop
- **Inspiration Cosplaying Without `reference-tokens.json`:** Never claim visual fidelity to an inspiration URL from memory or guesswork. Ground every palette polarity, background ratio, heading weight, tracking value, and modal corner radius in `.unslop/inspect/reference-tokens.json` and `.unslop/inspect/report.json` before locking `.unslop/brief.md`.

## 5. Copy & Asset Slop
- **Placeholder Garbage:** Zero `lorem ipsum`, zero `"Acme Corp"` or generic dummy names, zero fabricated vanity metrics (`"99.99% uptime · 10,000+ happy teams"`), and zero copied brand names/slogans/logos from inspiration sites.
- **Broken or Empty Media:** Zero `naturalWidth === 0` images, zero oversized payloads (`> 500 KB`), and zero `0x0` `<svg>` icons.

## 6. Interaction & Accessibility Slop
- **Low-Contrast Muted Ink:** Secondary labels, axis ticks, and captions must pass WCAG AA (`>= 4.5:1` normal text, `>= 3:1` large text) across every enabled theme.
- **Missing Keyboard Focus & Broken Overlays:** Never set `outline: none` without a visible `:focus-visible` ring; all drawers, modals, and `Cmd+K` palettes must trap focus and dismiss cleanly via `Escape`.
- **Tiny Mobile Targets & Missing Labels:** Interactive controls on mobile (`<= 768px`) must meet `>= 44×44px` hit areas, and icon-only buttons require `aria-label`.
- **Gratuitous Infinite Motion:** Ban unrequested floating, pulsing, or bouncing animations; honor `prefers-reduced-motion: reduce` and the global Motion toggle.
