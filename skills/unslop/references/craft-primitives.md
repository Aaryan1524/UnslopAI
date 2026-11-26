# Visual Craft Primitives & Architectural Surface Discipline

Flat SaaS templates break down through five visual habits: plastic multi-stop gradients, cold navy-slate dark mode reflex, nested rounded boxes inside rounded boxes, generic stock icon grids, and wrapped monospace status bars. Replace those reflexes with the four architectural primitives below.

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
- Lock a single **3-radius budget** (`--r-card`, `--r-control`, `--r-media`) in `.unslop/brief.md` (`0px`–`4px` on hairline grids; clean deliberate steps elsewhere—never mix `0px`, `16px`, `24px`, and `9999px` arbitrarily on one surface).
- Never nest a bordered, elevated card inside another bordered, elevated card unless one is a recessed telemetry readout well (`--bg-recessed`) with `0px`–`4px` corners.

---

## 4. Product-Native Micro-UI Artifacts over Icon Grids

Never fill a feature band with generic 3-column stock icon badges (e.g., Lucide icon-in-a-square + heading + 2-line blurb). Replace abstract icon cards with **domain-authentic, compact micro-UI artifacts** grounded in real product behavior:

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
