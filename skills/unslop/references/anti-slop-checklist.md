# Anti-Slop Checklist

Reject any design or generated component that triggers these failure modes. Use `scripts/audit_ui.mjs` to catch measurable defects automatically and inspect screenshots for visual clichés.

## 1. Palette & Surface Slop
- **Unprompted Purple/Indigo Gradients:** Never default to `#6366f1` -> `#8b5cf6` hero gradients, glowing dark-mode purple blobs, or cyan-pink gradient text unless explicitly requested by the user or extracted from the inspiration site.
- **Gratuitous Glassmorphism:** Do not wrap every panel in `backdrop-filter: blur(...)` over busy backgrounds where text contrast degrades.
- **Shadow Stacking:** Avoid placing heavy blurred drop shadows on every card. Establish hierarchy through background luminance shifts, `1px` hairline borders, or deliberate negative space first.

## 2. Typography Slop
- **Flat Scale:** Ensure meaningful contrast between display headings and body text (`h1 / body >= 1.75` for marketing/editorial, `>= 1.5` for dense apps).
- **Generic Unpaired Defaults:** Do not fall back blindly to unstyled `Inter` / `Arial` / system defaults when the inspiration or domain warrants deliberate grotesque, serif, or monospace pairing.
- **Unaligned Metrics:** Financial figures, timers, counters, and data tables must use `font-variant-numeric: tabular-nums`.

## 3. Layout & Component Slop
- **Cookie-Cutter 3-Card Hero Grid:** Never default to `[Centered Hero + 2 Pill Buttons] -> [3 Identical Icon-Box Feature Cards]` unless that structure fits the actual content and inspiration grammar.
- **Rounded-Everything Sameness:** Match corner radii hierarchically (`container > control > pill`) instead of slapping `rounded-2xl` on every element.
- **Uniform Bloat:** Vary padding deliberately by component density; identical `p-8` everywhere flattens scannability.
- **Mobile Overflow & Clipped Labels:** Zero horizontal scrolling at `320px`, `390px`, and `768px`, and zero truncated text inside fixed-height `overflow: hidden` wrappers.

## 4. Copy & Asset Slop
- **Placeholder Garbage:** Zero `lorem ipsum`, zero `"Acme Corp"`, zero fabricated vanity metrics (`"99.99% uptime · 10,000+ happy teams"`), and zero copied brand names/slogans/logos from the inspiration site.
- **Broken or Empty Media:** Zero `naturalWidth === 0` images and zero `0x0` `<svg>` icons.

## 5. Interaction & Accessibility Slop
- **Low-Contrast Muted Ink:** Secondary labels and captions must still pass WCAG AA (`>= 4.5:1` for normal text, `>= 3:1` for large text).
- **Missing Keyboard Focus:** Never set `outline: none` without providing a visible `:focus-visible` ring or border change.
- **Tiny Mobile Targets & Missing Labels:** Interactive controls on mobile should meet `>= 44x44px` hit areas (or clean spacing), and icon-only buttons require `aria-label`.
- **Gratuitous Infinite Motion:** Ban unrequested floating, pulsing, or bouncing animations; honor `prefers-reduced-motion: reduce`.
