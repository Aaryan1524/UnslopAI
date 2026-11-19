# Tactile Hardware Grammar (Dieter Rams / Braun / Teenage Engineering Mode)

## Context-Appropriateness Gate (Mandatory)
Enable this visual grammar **only** when the UI represents a tactile tool, instrument, calculator, timer, audio/media controller, hardware-inspired dashboard, or interactive showcase. Do **not** apply heavy bezels, recessed screens, or mechanical sound effects to text-heavy documentation, blogs, or long enterprise CRUD tables.

---

## 1. Material & Surface Depth Recipes

### Matte Anodized Chassis (Light or Dark)
- Use warm industrial neutrals rather than sterile pure `#FFFFFF` / `#000000`:
  - Light aluminum/ABS: canvas `#E6E4DF`, panel `#EFEDE8`, inset border `#CFCBC2`, primary ink `#1A1A19`.
  - Dark anodized: canvas `#161719`, panel `#1F2124`, inset border `#2E3136`, primary ink `#F2F0EB`.
  - Classic Braun/TE accents: Signal Orange (`#FF4F17`), Olive/Sage (`#5D6B58`), Amber LED (`#F59E0B`), Cobalt indicator (`#2563EB`).
- **Directional Top-Edge Highlight + Subtle Grounding:**
  ```css
  .hw-panel {
    background: var(--hw-surface);
    border: 1px solid var(--hw-border);
    border-radius: 10px;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.45), /* light mode; 0.08 in dark mode */
      0 2px 6px rgba(0, 0, 0, 0.08);
  }
  ```
- **Optional Micro-Grain Texture (SVG `feTurbulence` data URI at `< 3%` opacity):**
  Keep noise strictly subtle via CSS `::after` with `pointer-events: none` so text contrast stays clean.

### Recessed Display Readout (LCD / OLED Well)
```css
.hw-readout {
  background: #111315;
  color: #EAE7DF;
  border: 1px solid rgba(0, 0, 0, 0.65);
  border-radius: 6px;
  box-shadow:
    inset 0 2px 5px rgba(0, 0, 0, 0.55),
    0 1px 0 rgba(255, 255, 255, 0.35);
  font-variant-numeric: tabular-nums;
}
```

### Tactile Keycap / Pushbutton Physics
- Give pressed states real physical travel (`1px–2px` downward shift) and collapse bottom lip shadow:
```css
.hw-key {
  border-radius: 6px;
  border: 1px solid var(--hw-key-border);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.35),
    0 2px 0 var(--hw-key-lip),
    0 3px 6px rgba(0, 0, 0, 0.14);
  transition: transform 80ms ease-out, box-shadow 80ms ease-out;
}
.hw-key:active,
.hw-key[aria-pressed="true"] {
  transform: translateY(1.5px);
  box-shadow:
    inset 0 1px 2px rgba(0, 0, 0, 0.25),
    0 0.5px 0 var(--hw-key-lip);
}
```

## 2. Accessible Pointer-Capture Rotary / Detent Controls
When building knobs, faders, or stepped selectors:
- Use semantic `<input type="range">` or `role="slider"` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, and `tabIndex={0}`.
- Support **both** vertical/rotary pointer dragging via `el.setPointerCapture(e.pointerId)` **and** keyboard `ArrowUp` / `ArrowRight` / `ArrowDown` / `ArrowLeft` / `Home` / `End` / `PageUp` / `PageDown`.
- Snap values to discrete detents (`step`) before updating readout or triggering `microSynth.playDetent()`.
- Under `@media (prefers-reduced-motion: reduce)`, skip spring overshoot and render instant value transitions.

## 3. Optional Micro-Audio (`assets/micro-synth.ts`)
- Audio is **off-until-gesture**: never create or resume `AudioContext` on page load.
- Always expose a visible, persisted **Mute / Sound toggle** (`aria-pressed`) in the control surface.
- Keep procedural sounds ultra-short (`10–35ms`), crisp, and low-gain (`<= 0.12`).
