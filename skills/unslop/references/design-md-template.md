# `DESIGN.md` Template

Write this file at the root of the user's project (or target feature directory) **before** creating or editing UI components. Every decision must trace back to either extracted inspection evidence (`report.json` / `audit.json`), user taste modifiers, or the fallback spectrum.

---

## 1. Intent & Scope
- **Mode:** `unslop-existing` | `inspiration-remix` | `hybrid`
- **Product & Audience:** `<who this is for and primary user job>`
- **Inspiration Source(s):** `<URL(s) / screenshots, or "None — fallback spectrum tier: <tier>">`
- **User Taste Modifiers:** `<explicit adjustments requested by user>`

## 2. Capabilities & Disclosed Limitations
- **Faithfully Adapted:** `<layout grammar, color roles, type scale, component archetypes>`
- **Approximated:** `<e.g., commercial font X -> open-source font Y; scroll choreography -> WAAPI/CSS>`
- **Excluded / Out of Scope:** `<e.g., WebGL canvas hero replaced with crisp editorial surface>`

## 3. Color Tokens & Area Budget
Define semantic roles rather than raw hex soup. Maintain `>= 4.5:1` contrast for normal text and `>= 3:1` for large text / UI icons.
When inverting polarity from an inspiration site (e.g., dark-violet reference -> warm-light editorial), preserve the inspiration's **area budget** (`~65–80%` canvas, `~10–20%` surface, `< 5%` accent) and **luminance contrast hierarchy** rather than copying raw hex values.

| Role | Token Name | Value (Light / Dark) | Approx. Area % | Notes |
| :--- | :--- | :--- | :--- | :--- |
| Primary Canvas | `--bg-canvas` | `#...` | `~65–80%` | Dominant breathing room |
| Elevated Surface | `--bg-surface` | `#...` | `~10–20%` | Cards, panels, drawers |
| Recessed / Well | `--bg-recessed` | `#...` | `~2–5%` | Inputs, code blocks, readouts |
| Border / Hairline | `--border-subtle` | `#...` | — | 1px structural dividers |
| Primary Ink | `--text-primary` | `#...` | — | Body & headings |
| Muted Ink | `--text-muted` | `#...` | — | Captions, metadata (`>= 4.5:1`) |
| Accent Primary | `--accent-primary` | `#...` | `< 5%` | Primary CTAs, active indicators |
| Accent Hover / Focus | `--accent-ring` | `#...` | — | Distinct `:hover` & `:focus-visible` |

## 4. Typography & Scale
- **Display / Headings:** `<Font Family>` (open-source fallback verified)
- **Body UI:** `<Font Family>` (`font-variant-numeric: tabular-nums` where metrics appear)
- **Monospace / Telemetry:** `<Font Family>`
- **Type Scale:**
  - `h1`: `<size / line-height / tracking / weight>` (`h1 / body >= 1.75`)
  - `h2`: `<size / line-height / tracking / weight>`
  - `h3`: `<size / line-height / tracking / weight>`
  - `body`: `<15–17px / 1.5–1.65 / 400>`
  - `caption`: `<12–13px / 1.4 / 500>`

## 5. Layout Grammar & Section Rhythm
- **Container Max-Width:** `<e.g. 1200px or 1360px>`
- **Grid System & Gutter:** `<e.g. 12-col desktop, asymmetric 7/5 split, 24px gap>`
- **Vertical Section Cadence:** `<e.g. 96px desktop / 56px mobile>`
- **Breakpoints Verified:** `1440px` (desktop), `768px` (tablet), `390px` (mobile), `320px` (narrow mobile)

## 6. Surface & Motion Grammar
- **Corner Radii Hierarchy:** `<e.g. outer 12px, inner/controls 6px, badges 999px>`
- **Elevation Model:** `<flat hairline borders / subtle 1px top highlight / soft shadow>`
- **Transition Timing:** `<e.g. 160ms cubic-bezier(0.2, 0.8, 0.2, 1)>`
- **Reduced Motion:** `@media (prefers-reduced-motion: reduce)` disables transforms/loops.

## 7. Component Archetypes (Adapted, Not Cloned)
List each key component to build/refactor with its **job, structure, states (`default / hover / focus / empty / error`), and responsive behavior**:
- `Header / Navigation`: `<...>`
- `Hero / Primary Focus`: `<...>`
- `Core Content / Data Modules`: `<...>`
- `Interactive Controls`: `<...>`
- `Footer`: `<...>`

## 8. Anti-Slop Redlines for This Project
- `<Explicit patterns banned from anti-slop-checklist.md>`
