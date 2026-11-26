# Visual Craft Primitives & Architectural Surface Discipline

Flat SaaS templates break down through predictable visual habits: plastic multi-stop gradients, cold navy-slate dark mode reflex, nested rounded boxes inside rounded boxes, pitch-black widget spam dropped onto light canvases, generic stock icon grids, and wrapped monospace status bars. Replace those reflexes with the reusable architectural primitives and structural reference motifs below.

---

## 1. 2% Tactile SVG Noise Grain Overlay

Kill flat, plastic CSS background gradients on accent panels, hero callout blocks, and dark tactile surfaces by layering an inline SVG `<feTurbulence>` noise texture at **`0.02–0.03` opacity** over solid surfaces.

### Reusable CSS Primitive
```css
.surface-grain {
  position: relative;
  isolation: isolate;
}

.surface-grain > * {
  position: relative;
  z-index: 1;
}

.surface-grain::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: inherit;
  pointer-events: none;
  opacity: 0.025; /* Keep strictly within 0.02–0.03 */
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 180px 180px;
}
```

**Rules:**
- Apply over **solid** accent or structural canvas panels (never over busy photographs or illegible gradients).
- Always set `pointer-events: none` and keep foreground content above the grain layer (`z-index: 1`) so contrast stays unmodified (`>= 4.5:1` body, `>= 3:1` large display text).

---

## 2. Warm Neutral & Warm-Charcoal Surface Discipline

Reject default cold **`#0B0D14` navy-slate dark mode** (and cool `#0F172A` / `#090D16` reflex palettes) unless `.unslop/inspect/reference-tokens.json` proves the inspiration URL uses a cool slate polarity or the user explicitly specifies it.

### Light-First Neutral & Warm-Charcoal Token Parity
- **Light Polarity (Default High-Craft Editorial / Infrastructure):**
  - `80–93%` area budget on crisp light canvas (`#FFFFFF` or `#FAF9F6`)
  - Elevated surface (`#F4F1EC`), hairline `1px` borders (`#E5E0D8`), primary ink (`#151414`), WCAG AA muted ink (`#5C5854`, `>= 6:1` on `#FAF9F6`)
- **Warm-Charcoal Dark Polarity:**
  - Deep warm-charcoal canvas (`#151414`), elevated surface (`#1D1B1A`), hairline `1px` borders (`#302E2D`)
  - Warm bone headings & primary ink (`#F0E3DE`), accessible muted ink (`#A89F9A`, `>= 6.5:1` on `#1D1B1A`)

```css
:root {
  --bg-canvas: #FAF9F6;
  --bg-surface: #F4F1EC;
  --bg-recessed: #EDE8E0;
  --border-subtle: #E5E0D8;
  --text-primary: #151414;
  --text-muted: #5C5854;
}

[data-theme="dark"] {
  --bg-canvas: #151414;
  --bg-surface: #1D1B1A;
  --bg-recessed: #100F0F;
  --border-subtle: #302E2D;
  --text-primary: #F0E3DE;
  --text-muted: #A89F9A;
}
```

---

## 3. Edge-to-Edge Hairline Architectural Grids

Stop wrapping rounded cards inside rounded containers (`card-in-card` padding stacks with thick borders and heavy shadows). Use shared `1px` edge-to-edge architectural dividers paired with sharp **`0px`–`4px` inner rules**.

### Shared `1px` Hairline Grid Pattern
Using `background: var(--border-subtle)` with `gap: 1px` guarantees single-thickness dividers between every cell with zero doubled `2px` seams:

```css
.hairline-band {
  border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
}

.hairline-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  background: var(--border-subtle);
}

.hairline-cell {
  background: var(--bg-canvas);
  padding: clamp(1.25rem, 2.5vw, 2.25rem);
  min-width: 0;
  border-radius: 0; /* Inner controls inside cells stay within 0px–4px */
}

@media (max-width: 768px) {
  .hairline-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
```

**Discipline:**
- Lock a single **3-radius budget** (`--r-card`, `--r-control`, `--r-media`) in `.unslop/brief.md` (`0px`–`4px` on hairline grids; pill primary CTAs `9999px` with `4px` cards are valid when documented as a Reference Override in `.unslop/brief.md` Section 7).
- Never nest a bordered, elevated card inside another bordered, elevated card unless one is a recessed telemetry readout well (`--bg-recessed`) with `0px`–`4px` corners.

---

## 4. Product-Native Micro-UI Artifacts over Icon Grids

Never fill a feature band with generic 3-column stock icon badges (e.g., icon-in-a-square + heading + 2-line blurb). Replace abstract icon cards with **domain-authentic, compact micro-UI artifacts** grounded in real product behavior:

| Cliché Pattern (Ban) | High-Craft Micro-UI Replacement | Required Engineering Invariant |
| :--- | :--- | :--- |
| Icon box + "Fast Alerts" copy | **OS Notification Banner** | Crisp `1px` border, small indicator dot, `tabular-nums` timestamp, compact single-action pill, `min-width: 0` |
| Icon box + "Smart Analytics" copy | **Live SVG / Canvas Usage-Decay Curve** | Clean vector `viewBox` path or 2D Canvas curve, hairline baseline rule, active point dot, frozen final frame under `prefers-reduced-motion` |
| Icon box + "CLI / API Ready" copy | **Non-Wrapping Terminal Status Bar** | Monospace (`JetBrains Mono`), `white-space: nowrap`, overflow safety, status code + latency in `tabular-nums` |
| Icon box + "Multi-Region" copy | **Crisp Status Matrix** | Edge-to-edge `1px` grid cells, aligned `tabular-nums` values, single semantic state pip, zero decorative pill clutter |

### Non-Wrapping Terminal Status Bar & Telemetry Invariant
Terminal commands, commit hashes, endpoints, and live status bars **must never wrap awkwardly mid-token** inside narrow flex items or bento cards:

```css
.terminal-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-width: 0;
  padding: 0.625rem 0.875rem;
  background: var(--bg-recessed);
  border: 1px solid var(--border-subtle);
  border-radius: var(--r-control, 4px);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  font-variant-numeric: tabular-nums;
}

.terminal-bar__cmd,
.terminal-bar__status {
  white-space: nowrap;
}

.terminal-bar__cmd {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.terminal-bar__status {
  flex-shrink: 0;
}
```

### Compact Usage-Decay / Telemetry SVG Discipline
When drawing usage-decay curves, sparklines, or latency plots inline:
- Declare explicit `viewBox` + CSS `width: 100%; height: auto; aspect-ratio: 16 / 7;` for `CLS = 0`.
- Keep gridlines subtle (`1px` stroke at `var(--border-subtle)`), plot curves at `1.5px–2px` stroke with `vector-effect: non-scaling-stroke`, and label axis ticks in `tabular-nums` monospace (`>= 4.5:1` contrast).
- Provide `aria-label` or visually hidden summary text on informational charts (`role="img"`), and `aria-hidden="true"` when purely illustrative alongside text readouts.

---

## 5. Outer Dot-Matrix Gutter Substrate + Continuous Vertical Blueprint Guide Rails

When `.unslop/brief.md` Section 7 specifies an architectural drafting substrate, give the page outer margins a delicate dot-matrix texture while bounding the central content column with continuous `1px` vertical guide rails (solid or dashed) and `7×7px` open registration squares (`□`) at horizontal section intersections.

### Reusable CSS Primitive
```css
.blueprint-page {
  --rail-color: var(--border-subtle);
  --dot-color: color-mix(in srgb, var(--text-primary) 12%, transparent);
  --frame-max: 1200px;
  background-color: var(--bg-canvas);
  background-image: radial-gradient(var(--dot-color) 1px, transparent 1px);
  background-size: 16px 16px;
  overflow-x: clip;
}

.blueprint-frame {
  position: relative;
  max-width: var(--frame-max);
  margin-inline: auto;
  background: var(--bg-canvas);
  border-inline: 1px solid var(--rail-color);
}

/* Optional inner dashed structural rail on wide viewports */
.blueprint-frame--dashed::before {
  content: '';
  position: absolute;
  inset-block: 0;
  left: 50%;
  border-left: 1px dashed var(--rail-color);
  pointer-events: none;
  z-index: 0;
}

.blueprint-band {
  position: relative;
  border-top: 1px solid var(--rail-color);
}

/* 7x7px open corner registration squares (□) at rail × hairline intersections */
.blueprint-band::before,
.blueprint-band::after {
  content: '';
  position: absolute;
  top: -4px;
  width: 7px;
  height: 7px;
  background: var(--bg-canvas);
  border: 1px solid var(--rail-color);
  pointer-events: none;
  z-index: 2;
}

.blueprint-band::before { left: -4px; }
.blueprint-band::after { right: -4px; }

@media (max-width: 768px) {
  .blueprint-frame {
    border-inline: none;
  }
  .blueprint-band::before,
  .blueprint-band::after,
  .blueprint-frame--dashed::before {
    display: none;
  }
}
```

**Rules:**
- Keep outer dot opacity subtle (`<= 12%` foreground mix) so the gutter frames the column cleanly without competing with foreground typography.
- Collapse outer rails and registration nodes cleanly at `<= 768px` so mobile viewports retain full readable width with `0px` horizontal overflow.

---

## 6. Notched Corner-Bracket Technical Callouts

For architectural callouts, key system invariants, or specification highlights over light dotted fields, replace heavy 4-sided card boxes with open-corner notched accent brackets (`┌ ┐ └ ┘`).

### Reusable CSS Primitive
```css
.corner-callout {
  --bracket-size: 12px;
  --bracket-stroke: 1.5px;
  --bracket-color: var(--accent-primary);
  position: relative;
  padding: clamp(1rem, 2vw, 1.5rem);
  background-color: var(--bg-canvas);
  background-image: radial-gradient(
    color-mix(in srgb, var(--text-primary) 10%, transparent) 1px,
    transparent 1px
  );
  background-size: 12px 12px;
  background-position: 6px 6px;
}

.corner-callout::before,
.corner-callout::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* Top-left (┌) and top-right (┐) brackets */
.corner-callout::before {
  background:
    linear-gradient(var(--bracket-color), var(--bracket-color)) top left / var(--bracket-size) var(--bracket-stroke) no-repeat,
    linear-gradient(var(--bracket-color), var(--bracket-color)) top left / var(--bracket-stroke) var(--bracket-size) no-repeat,
    linear-gradient(var(--bracket-color), var(--bracket-color)) top right / var(--bracket-size) var(--bracket-stroke) no-repeat,
    linear-gradient(var(--bracket-color), var(--bracket-color)) top right / var(--bracket-stroke) var(--bracket-size) no-repeat;
}

/* Bottom-left (└) and bottom-right (┘) brackets */
.corner-callout::after {
  background:
    linear-gradient(var(--bracket-color), var(--bracket-color)) bottom left / var(--bracket-size) var(--bracket-stroke) no-repeat,
    linear-gradient(var(--bracket-color), var(--bracket-color)) bottom left / var(--bracket-stroke) var(--bracket-size) no-repeat,
    linear-gradient(var(--bracket-color), var(--bracket-color)) bottom right / var(--bracket-size) var(--bracket-stroke) no-repeat,
    linear-gradient(var(--bracket-color), var(--bracket-color)) bottom right / var(--bracket-stroke) var(--bracket-size) no-repeat;
}
```

**Rules:**
- Reserve notched corner brackets for 1–3 high-signal technical callouts per page so the motif feels calibrated rather than decorative noise.
- Keep bracket stroke crisp (`1px–1.5px`) and pair with monospace micro-labels (`0.72rem`, `0.08em` tracking).

---

## 7. Inset Rounded Halftone / Solar-Glow Hero & Closing Frame + Bottom Ticker Marquee

When a reference site bookends the page with an inset luminous or halftone-shaded hero and closing CTA canvas, preserve both the architectural inset framing and strict upper-band WCAG AA contrast safety.

### Reusable CSS + Canvas Architecture
```css
.inset-stage-wrap {
  padding: clamp(0.75rem, 2vw, 1.5rem);
}

.inset-stage {
  position: relative;
  overflow: hidden;
  border-radius: var(--r-media, 12px);
  border: 1px solid var(--border-subtle);
  background: var(--stage-base, #1C1917);
  color: var(--stage-ink, #FAF9F6);
  isolation: isolate;
}

.inset-stage__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

/* Upper-band contrast scrim guarantees WCAG AA (>= 4.5:1) behind headline & subcopy */
.inset-stage__scrim {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: linear-gradient(
    to bottom,
    color-mix(in srgb, var(--stage-base, #1C1917) 84%, transparent) 0%,
    color-mix(in srgb, var(--stage-base, #1C1917) 42%, transparent) 52%,
    transparent 100%
  );
}

.inset-stage__content {
  position: relative;
  z-index: 2;
  padding: clamp(3rem, 7vw, 5.5rem) clamp(1.5rem, 4vw, 3.5rem) clamp(2.5rem, 5vw, 4rem);
}

/* Single-line monospace bottom ticker anchored to hero floor */
.inset-stage__ticker {
  position: relative;
  z-index: 2;
  border-top: 1px solid color-mix(in srgb, currentColor 16%, transparent);
  background: color-mix(in srgb, var(--stage-base, #1C1917) 72%, transparent);
  overflow: hidden;
  padding-block: 0.65rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
}

.inset-stage__track {
  display: flex;
  width: max-content;
  gap: 2.5rem;
  white-space: nowrap;
  animation: stage-marquee 28s linear infinite;
}

.inset-stage__ticker:hover .inset-stage__track,
.inset-stage__ticker:focus-within .inset-stage__track {
  animation-play-state: paused;
}

@keyframes stage-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@media (prefers-reduced-motion: reduce) {
  .inset-stage__track {
    animation: none;
    flex-wrap: wrap;
    width: auto;
    justify-content: center;
    padding-inline: 1rem;
  }
}
```

### Lightweight 2D Canvas Halftone / Solar-Glow Renderer Pattern
```js
export function mountHalftoneStage(canvas, { accent = '#E85D2A', glow = '#F6B882', reducedMotion = false } = {}) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  let rafId = 0;

  const drawFrame = (t) => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Lower-horizon solar glow (keeps upper headline band calm & readable)
    const cx = w * 0.5 + Math.sin(t * 0.0004) * (w * 0.04);
    const cy = h * 0.92;
    const grad = ctx.createRadialGradient(cx, cy, h * 0.06, cx, cy, Math.max(w, h) * 0.78);
    grad.addColorStop(0, glow);
    grad.addColorStop(0.42, accent);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Ordered halftone dot field modulated by radial proximity
    const step = 10;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    for (let y = step / 2; y < h; y += step) {
      for (let x = step / 2; x < w; x += step) {
        const dist = Math.hypot((x - cx) / (w * 0.7), (y - cy) / (h * 0.75));
        const pulse = 0.08 * Math.sin(dist * 7 - t * 0.0014);
        const r = Math.max(0, (1 - dist + pulse) * 2.4);
        if (r > 0.35) {
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  };

  const loop = (now) => {
    drawFrame(now);
    rafId = requestAnimationFrame(loop);
  };

  const onResize = () => drawFrame(0);
  window.addEventListener('resize', onResize, { passive: true });

  if (reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    drawFrame(0); // Crisp frozen static frame
  } else {
    rafId = requestAnimationFrame(loop);
  }

  return () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener('resize', onResize);
  };
}
```

**Rules:**
- Anchor the brightest glow in the **lower half** and apply `.inset-stage__scrim` over the upper text band so foreground headlines and CTAs pass WCAG AA (`>= 4.5:1` body, `>= 3:1` display) across every frame.
- Always subscribe to the global `MotionController` and freeze on `drawFrame(0)` when `prefers-reduced-motion: reduce` or the global Motion toggle is off.
- Duplicate ticker items (`aria-hidden="true"` on the second half) for seamless looping and cap ticker text to real verified specs or telemetry tokens.

---

## 8. 50/50 Split Comparison Stage (Noise vs. Calm)

When explaining how a product filters chaos, latency, or fragmented workflows into a single serene outcome, contrast an **animated light dotted noise/alert matrix** on one half against a **serene solid accent panel** (with `2%` SVG noise grain) on the other half.

### Reusable CSS Primitive
```css
.split-contrast {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
}

.split-contrast__noise {
  position: relative;
  padding: clamp(1.75rem, 3.5vw, 3rem);
  background-color: var(--bg-canvas);
  background-image: radial-gradient(
    color-mix(in srgb, var(--text-primary) 12%, transparent) 1px,
    transparent 1px
  );
  background-size: 14px 14px;
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.split-contrast__calm {
  position: relative;
  padding: clamp(1.75rem, 3.5vw, 3rem);
  background: var(--accent-primary);
  color: var(--accent-ink, #FFFFFF); /* Verify >= 4.5:1 contrast */
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1.25rem;
}

.noise-matrix {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
}

.noise-chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  min-width: 0;
  padding: 0.5rem 0.65rem;
  background: #FFFFFF;
  border: 1px solid var(--border-subtle);
  border-radius: var(--r-card, 4px);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;
  transition: opacity 260ms ease, border-color 260ms ease;
}

.noise-chip[data-state="active"] {
  border-color: var(--accent-primary);
  background: color-mix(in srgb, var(--accent-primary) 7%, #FFFFFF);
}

@media (max-width: 768px) {
  .split-contrast {
    grid-template-columns: minmax(0, 1fr);
  }
  .split-contrast__noise {
    border-right: none;
    border-bottom: 1px solid var(--border-subtle);
  }
}
```

**Rules:**
- Apply `.surface-grain` to `.split-contrast__calm` so the solid accent plane has tactile paper/ink depth rather than flat vector fill.
- Animate the `.noise-chip` active state at a calm, legible cadence (`1200ms–1800ms` step interval) via `MotionController` — never frantic flashing — and freeze on a representative state under `prefers-reduced-motion: reduce`.

---

## 9. Luminous Tinted-Surface Micro-UIs (Zero Dark-Box Spam on Light Canvases)

On light-first sites (`#FFFFFF` / `#FAF9F6`), avoid reflexively dropping pitch-black (`#09090B` / `#111`) terminal or dashboard slabs into every feature card—it shatters visual cohesion and creates heavy visual potholes. Instead, craft **luminous micro-UIs** built from crisp `#FFFFFF` cards, `1px` warm borders, subtle accent-tinted active rows (`6%–10%` accent mix), and compact tinted status pills.

### Reusable CSS Primitive
```css
.luminous-ui {
  background: #FFFFFF;
  border: 1px solid var(--border-subtle);
  border-radius: var(--r-card, 4px);
  overflow: hidden;
  font-variant-numeric: tabular-nums;
}

.luminous-ui__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.6rem 0.85rem;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--text-muted);
}

.luminous-ui__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-width: 0;
  padding: 0.65rem 0.85rem;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 0.84rem;
}

.luminous-ui__row:last-child {
  border-bottom: none;
}

.luminous-ui__row--tinted {
  background: color-mix(in srgb, var(--accent-primary) 7%, #FFFFFF);
}

.luminous-pill {
  flex-shrink: 0;
  white-space: nowrap;
  padding: 0.18rem 0.5rem;
  border-radius: var(--r-control, 4px);
  background: color-mix(in srgb, var(--accent-primary) 12%, #FFFFFF);
  color: var(--accent-text-aa, var(--text-primary)); /* Always >= 4.5:1 on tinted bg */
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 500;
}

[data-theme="dark"] .luminous-ui {
  background: var(--bg-surface);
}

[data-theme="dark"] .luminous-ui__row--tinted {
  background: color-mix(in srgb, var(--accent-primary) 14%, var(--bg-surface));
}

[data-theme="dark"] .luminous-pill {
  background: color-mix(in srgb, var(--accent-primary) 22%, var(--bg-surface));
  color: var(--text-primary);
}
```

**Rules:**
- Reserve dark recessed slabs on light pages strictly for an intentional bookend frame (Section 7) or genuine terminal output—never as default wallpaper inside every light-mode bento cell.
- Always verify `.luminous-pill` text contrast against its tinted background (`>= 4.5:1`) using a darkened accent ink token (`--accent-text-aa`) rather than raw bright brand accent hexes on pale tints.
