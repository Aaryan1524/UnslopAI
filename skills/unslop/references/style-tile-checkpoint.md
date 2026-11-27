# Phase 0.5 — The 10-Second Hero Style Tile Checkpoint

> **When it runs:** Mandatory in **`standard`** and **`deep`** builds immediately after `.unslop/brief.md` approval and **before** Wave 2 full-site implementation. Skipped in `fast` and `extract-component` modes unless the user explicitly asks for a visual direction preview.

Writing 8–12 full sections before confirming visual direction is the most expensive way to discover that a palette feels too cold, headings feel too heavy, or radii feel too soft. The **Style Tile Checkpoint** renders a real, live, WCAG-AA-verified specimen in ~10 seconds so both agent and user lock the visual system on one screen before scaling out.

---

## 1. What the Style Tile Proves

[`generate_style_tile.mjs`](../scripts/generate_style_tile.mjs) builds a self-contained HTML specimen (`index.html`), renders it via Playwright on desktop (`1440×900`) and mobile (`390×844`), and verifies four systems in one pass:

1. **Live Hero Specimen:** Navbar (`<= 4` links + 1 CTA), locked display weight & negative tracking, 1-line subcopy, primary/secondary controls, and a working interactive telemetry proof canvas with live slider control.
2. **Surface & WCAG AA Contrast Swatch Strip:** Canvas, surface, recessed, ink, muted, signal accent, and accessible CTA accent with real luminance contrast ratios computed against live rendered CSS variables.
3. **Typography, Radii & Micro-UI Specimen:** Scale hierarchy (`H1`, `H2`, `Body`, `Mono`), `tabular-nums`, non-wrapping mono status pill, and locked `--r-card`, `--r-control`, and `--r-media` cards.
4. **Motion Physics & Reduced-Motion Specimen:** Working `[data-motion-toggle]` button that toggles `:root.reduced-motion` and deterministically freezes canvas `requestAnimationFrame` loops (verified via pixel diff).

---

## 2. Author `.unslop/style-tile-spec.json`

Write `.unslop/style-tile-spec.json` using the locked product truth from `.unslop/brief.md` and token guidance from [`design-md-template.md`](design-md-template.md):

```json
{
  "productName": "Kestrel",
  "category": "Deterministic Build Orchestrator",
  "eyebrow": "DISTRIBUTED BUILDS · ZERO CACHE DRIFT",
  "headline": "Reproducible builds at sub-second edge speed.",
  "subcopy": "Trace every artifact hash, worker queue, and cache hit from one calm telemetry console.",
  "navLinks": ["Platform", "Benchmarks", "Docs", "Pricing"],
  "primaryCta": "Start Free",
  "secondaryCta": "Inspect Trace",
  "statusPill": "US-WEST-2 · 99.99% CACHE HIT",
  "polarity": "light",
  "palette": {
    "canvas": "#FFFFFF",
    "surface": "#FAF9F6",
    "recessed": "#F2F0EC",
    "border": "#E4E0D8",
    "ink": "#151414",
    "muted": "#57534E",
    "accent": "#FF5E1F",
    "accentAccessible": "#C83E00",
    "onAccent": "#FFFFFF"
  },
  "typography": {
    "displayFont": "Inter",
    "bodyFont": "Inter",
    "monoFont": "JetBrains Mono",
    "headingWeight": 500,
    "h1Size": "42px",
    "h1Tracking": "-0.03em",
    "h2Size": "22px",
    "h2Tracking": "-0.02em",
    "bodySize": "15px",
    "loadGoogleFonts": true
  },
  "radii": {
    "card": "4px",
    "control": "9999px",
    "media": "12px"
  },
  "motifs": {
    "dotMatrixGutter": true,
    "dashedBlueprintRails": true,
    "cornerRegistrationSquares": true,
    "flatHairlineElevation": true
  },
  "proof": {
    "title": "Worker Queue Latency",
    "controlLabel": "Concurrency",
    "initialLoad": 60,
    "unit": "ms"
  },
  "motion": {
    "easing": "cubic-bezier(0.2, 0.8, 0.2, 1)",
    "microDuration": "160ms",
    "panelDuration": "280ms"
  }
}
```

> **Shortcut from Inspiration Extraction:** If you already ran `extract_reference.mjs`, you can pass `.unslop/reference-tokens.json` directly to `generate_style_tile.mjs`. It auto-maps `surfaceRatio`, `typography`, `geometryLock`, and `visualMotifs` into a WCAG-AA-verified Style Tile automatically.

---

## 3. Run the Generator

```bash
# From your authored style-tile spec (default output: ./.unslop/style-tile)
node skills/unslop/scripts/generate_style_tile.mjs .unslop/style-tile-spec.json .unslop/style-tile

# Or auto-map directly from extracted reference tokens
node skills/unslop/scripts/generate_style_tile.mjs .unslop/reference-tokens.json .unslop/style-tile

# Or verify the studio baseline with built-in demo defaults
node skills/unslop/scripts/generate_style_tile.mjs --demo .unslop/style-tile
```

### Output Contract (`.unslop/style-tile/`)
- `index.html` — live interactive specimen (safe offline with graceful system font fallbacks)
- `style-tile-desktop.png` — `1440×900` capture
- `style-tile-mobile.png` — `390×844` capture
- `style-tile-report.json` — automated pass/fail telemetry:
  - `passed: true` requires `contrast.failures.length === 0`, `overflow.desktopPx === 0`, `overflow.mobilePx === 0`, and `motionFreezeVerified === true`.

---

## 4. Agent Visual Inspection (Before Showing the User)

Open and visually inspect **both** `.unslop/style-tile/style-tile-desktop.png` and `.unslop/style-tile/style-tile-mobile.png`:

- [ ] **Polarity & Area Budget:** Canvas dominates cleanly (`~65–80%`), elevated surfaces read with crisp separation, and signal accent stays disciplined (`< 5%`).
- [ ] **Typography Optical Feel:** Heading weight (`400–600`) and negative tracking look deliberate rather than bloated (`700–800`) or washed out.
- [ ] **Contrast Margin:** `style-tile-report.json` reports `contrast.failures: []` and legible text on every swatch, pill, and CTA.
- [ ] **Geometry & Motifs:** `--r-card`, `--r-control`, and `--r-media` form a cohesive hierarchy with zero accidental rounded-blob drift.
- [ ] **Mobile Ergonomics:** At `390px`, nav links, pills, buttons, and proof controls stack cleanly with `0px` horizontal overflow and comfortable tap height.

If any automated check fails or any visual defect appears, tune `.unslop/style-tile-spec.json` and re-run **before** interrupting the user.

---

## 5. Rapid 1-Turn User Gut-Check Prompt

Present the rendered `style-tile-desktop.png` (and `style-tile-mobile.png` if mobile-first) alongside the key locked numbers (`minRatio`, radii, heading weight) and ask one tight question:

> **Phase 0.5 Style Tile Ready** — Previewed at `1440×900` and `390×844` (`passed: true`, min text contrast `<X>:1`, `0px` overflow, reduced-motion freeze verified).
>
> **How does this visual direction feel?**
> 1. **Approve & build all sections** (locks these exact tokens into `.unslop/DESIGN.md` and starts implementation)
> 2. **Quick steer** — reply with any adjustment such as *"warmer"*, *"sharper radii"*, *"darker canvas"*, *"higher contrast"*, *"lighter heading weight"*, or *"swap hero proof to `<pattern>`"* (see [`interactive-product-proofs.md`](interactive-product-proofs.md))

### Handling Steers
- **1-turn delta loop:** Apply the requested adjustment to `.unslop/style-tile-spec.json`, re-run `generate_style_tile.mjs`, confirm `passed: true`, copy the finalized CSS custom properties and visual motifs verbatim into `.unslop/DESIGN.md`, and proceed directly to Wave 2 (`visual-art-direction-and-media.md` + component build).
- Never let a Style Tile diverge from the production stylesheet: the exact `--bg-*`, `--text-*`, `--accent-*`, `--r-*`, and `--fw-heading` tokens verified here become the single source of truth for the full build.
