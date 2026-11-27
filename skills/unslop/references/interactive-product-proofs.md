# Interactive Product Proofs & Re-Authored Mobile Ergonomics

Generic landing pages hide behind three-column icon cards and prose walls promising speed, clarity, or intelligence. Studio-grade web products **prove** their core claim inside the viewport within 5 seconds using a stateful, domain-authentic interactive specimen — and re-author its ergonomics for mobile thumbs instead of shrinking desktop controls.

---

## 1. The 5-Second Above-the-Fold "Aha" Rule

Every flagship hero or core capability section should let a visitor **touch one real variable and see an authentic consequence** before scrolling:

- **One Primary Proof Above the Fold:** Pair concise headline + 1-line subcopy + primary CTA with one interactive proof widget directly inside the hero or immediate showcase band.
- **Zero Decorative Fake Metrics:** Every readout must derive deterministically from the user's selected preset, slider, or input — never idle `Math.random()` jitter.
- **Token Continuity:** Render every proof widget using the exact `--bg-*`, `--border-subtle`, `--r-media`, `--r-control`, and `tabular-nums` tokens locked in Phase 0.5 ([`style-tile-checkpoint.md`](style-tile-checkpoint.md)).

---

## 2. Five Domain-Authentic Interactive Proof Archetypes

Choose the archetype that matches the product's actual domain (do not force a code sandbox onto a physical hardware brand or a generic bar chart onto a creative tool):

### Pattern 1 — Live Telemetry / Routing Simulator
- **Best for:** Edge infrastructure, networking, observability, distributed databases, CI/build pipelines (e.g., *Vektor* edge telemetry).
- **Interaction:** Region/topology switcher (`US-East`, `EU-Central`, `AP-South`), traffic-load slider, or failover toggle that immediately updates an animated latency histogram/waveform (`<canvas>` or crisp SVG) and `tabular-nums` `p50 / p99 / rps` readouts.
- **Reduced-Motion Contract:** Must wire `[data-motion-toggle]` and `prefers-reduced-motion: reduce` to freeze continuous waveform motion while still redrawing instantaneously when the user drags the slider or changes presets.

### Pattern 2 — Interactive Before / After Noise-vs-Calm Comparator
- **Best for:** Audio cleanup, photo/video grading, document parsing, inbox triage, UI refactoring, data deduplication.
- **Interaction:** Tactile drag divider (`<input type="range">` overlaid or synced with a pointer-captured handle) plus 1-tap `Before / Split / After` segmented buttons so both touch and keyboard users can scrub effortlessly.
- **Key Detail:** Keep identical underlying geometry on both sides so scrubbing reveals transformation without layout jumping.

### Pattern 3 — Real-Time Config / Code-to-Preview Sandbox
- **Best for:** Developer APIs, SDKs, policy engines, design-token systems, workflow automation, schema validators.
- **Interaction:** 2–4 realistic scenario tabs or toggleable switches (`Strict Mode`, `Rate Limit`, `Webhook Retry`) alongside compact editable parameters that live-mutate an authentic preview surface or formatted JSON response payload with zero backend latency.
- **Key Detail:** Syntax highlight cleanly using high-contrast palette tokens (`>= 4.5:1`), never unreadable low-opacity pastels.

### Pattern 4 — Formula-Driven Calculator / Configurator
- **Best for:** Fintech, transparent usage pricing, logistics/freight, energy systems, cloud cost estimation, custom hardware builds (e.g., *Kestrel* build runner sizing).
- **Interaction:** Sliders and segmented selectors bound to an explicit, inspectable formula displaying live monthly/unit outputs (`tabular-nums`), break-even delta, and a copyable summary or pre-filled CTA state.
- **Key Detail:** Label assumptions transparently beneath the readout in muted mono (`12px`) so calculations feel trustworthy rather than gimmicky.

### Pattern 5 — Procedural Tactile / 3D Specimen
- **Best for:** Consumer hardware, acoustics, industrial design, materials, optics, spatial software.
- **Interaction:** Interactive 60fps Canvas 2D / WebGL2 tactile object (e.g., damped rotary dial, acoustic response chamber, anodized finish lighting sweep, orthographic cutaway) driven by pointer position or preset buttons.
- **Key Detail:** Always provide a static poster frame on `prefers-reduced-motion`, a visible `>= 44×44px` Pause/Play control, and a solid fallback `background-color` behind the canvas (see [`visual-art-direction-and-media.md`](visual-art-direction-and-media.md)).

---

## 3. Interactive Proof Quality Contract

Every interactive proof shipped in `standard` or `deep` builds must pass all six checks:

1. **Deterministic State:** Reproducible outputs for any given input combination; clear default state on first paint with zero empty/blank skeleton wait.
2. **Keyboard Parity:** Every interactive control works with `Tab`, `Enter`/`Space`, and `Arrow` keys, with visible `:focus-visible` rings (`>= 3:1`).
3. **Polite Live Announcements:** Key summary readouts use `aria-live="polite"` (without spamming per-frame animation ticks).
4. **Reduced-Motion Freeze:** Continuous loops pause immediately under `prefers-reduced-motion: reduce` or `[data-motion-toggle]`, while user-driven slider/tab changes still update the static frame.
5. **Tabular Alignment:** Numeric counters, latency figures, currencies, and percentages enforce `font-variant-numeric: tabular-nums` so columns never wobble horizontally.
6. **Zero Console Errors:** No uncaught ResizeObserver loops, WebGL context failures without Canvas 2D fallback, or missing ARIA labels.

---

## 4. Re-Authored Mobile Ergonomics (`390px` & `320px`)

Desktop split-screens and hover tooltips fail on phones. Never merely shrink a 1440px widget into a tiny scrollable box — **re-author the interaction model** for one-handed thumb use:

### A. Sticky Header Height Budget (`<= 12%` Viewport)
- Keep sticky mobile headers compact: **`56px–68px`** tall (`<= 12%` of an `844px` viewport — hard ceiling `<= 96px`).
- Show only Brand Mark + 1 concise Primary CTA + Drawer Menu button. Move secondary nav links into a clean drawer/sheet rather than wrapping two rows of tiny links.

### B. Thumb-Zone Action Bars
- On mobile, move primary proof controls (scenario tabs, load slider, `Before/After` toggle, or primary conversion CTA) directly **below** the visual viewport or into a docked bottom control bar (`padding-bottom: max(12px, env(safe-area-inset-bottom))`).
- Visitors should manipulate controls without covering the live canvas or chart with their thumb.

### C. Horizontal Snap-Scroll Proof Decks
- Replace stacked 3–4 card desktop comparison grids or preset strips with a contained horizontal snap-scroll rail:
  ```css
  .proof-deck {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scroll-padding-inline: 16px;
    -webkit-overflow-scrolling: touch;
  }
  .proof-deck > * {
    flex: 0 0 84%;
    scroll-snap-align: start;
  }
  ```
- Show a `12–16%` peek of the next card plus accessible Previous/Next or dot controls. Always ensure overflow stays strictly inside `.proof-deck` so `document.documentElement.scrollWidth <= window.innerWidth` (`0px` page-level horizontal overflow).

### D. Bottom-Sheet Drawers (Replacing Desktop Sidebars & Wide Popovers)
- Convert desktop filter panels, configuration sidebars, and multi-column nav flyouts into bottom sheets anchored to the lower viewport (`max-height: 82dvh`, rounded top edge matching `--r-media`, `overscroll-behavior: contain`).
- Support `Escape`, backdrop tap, explicit `>= 44×44px` Close button, and focus restoration to the triggering control on dismiss.

### E. Tap Targets & Zero-Jank Touch Drag / Scrub Rules
- **Minimum Tap Target:** Every button, tab, segmented control, close icon, and slider handle MUST have a hit area **`>= 44×44px`** with at least **`8px` spacing** between adjacent controls.
- **Never Hijack Vertical Page Scroll:** Apply `touch-action: pan-y` on horizontal scrub rails and comparators; apply `touch-action: none` **strictly** to the compact draggable handle itself, never to a full-bleed hero canvas.
- **Pointer Capture & RAF Throttling:** Drive custom scrub handles with Pointer Events (`pointerdown`, `pointermove`, `pointerup`, `el.setPointerCapture(e.pointerId)`) and coalesce redraws inside `requestAnimationFrame` to maintain silky 60fps with zero main-thread scroll jank.
