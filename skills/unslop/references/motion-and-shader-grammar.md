# Motion, Shader & Scroll Choreography Grammar

Use this cookbook whenever `inspect_site.mjs` (`gpuShaders`, `motion.scrollTimelines`, `sections[].scrollMotion`) or `rea_inspect.mjs` (`recoveredSources`, `exportedScriptSignals`) reveals atmospheric WebGL shaders, CSS Scroll-Driven Animations, sticky 3D scroll tracks, stacking decks, or animated ambient canvases.

---

## 1. Universal Motion Safety Contract (Mandatory on Every Kinetic Build)

1. **Global Motion Toggle + OS Preference:** Wire every WebGL shader, RAF loop, and scroll-scrub handler to **both** `@media (prefers-reduced-motion: reduce)` **and** an interactive user toggle (`document.documentElement.classList.toggle('reduced-motion')` dispatching a custom motion-change event).
2. **Off-Screen GPU Pause:** Attach an `IntersectionObserver` to every `<canvas>` / shader block so `requestAnimationFrame` halts whenever the element leaves the viewport.
3. **DPR Clamp & Fallback Surface:** Clamp backing canvas DPR to `Math.min(window.devicePixelRatio || 1, 1.5)` for crisp 60fps rendering. Always set a solid matching fallback `background-color` on the **section wrapper** behind the `<canvas>` so overlay typography passes WCAG AA before WebGL paints or if GPU context fails.
4. **Sticky Ancestor Discipline:** Never put `overflow: hidden` on an ancestor of a `position: sticky` stage (it disables sticky pinning!). Use `overflow-x: clip` on `html, body` instead.

---

## 2. Procedural Atmospheric WebGL2 / GLSL Shaders

When the inspiration site features a WebGL atmospheric canvas (dappled light, fluid caustics, grain, cursor light trails):
- **Author an original GLSL fragment shader** tuned to the target brand palette (`uShadow`, `uMid`, `uLight` uniforms—never copy brand assets verbatim).
- **Cursor Reactivity (`uTrail` / `uPointer`):** Smooth cursor coordinates with exponential lerp (`pos += (target - pos) * (1 - Math.exp(-follow * dt))`) and decay trail strength gracefully on `pointerleave`.
- **WebGL Context Loss Recovery & Canvas 2D Fallback:**
  ```js
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    stopLoop();
  });
  canvas.addEventListener('webglcontextrestored', () => {
    initWebGL();
    if (isVisible && !motionController.reduced) startLoop();
  });
  ```
  If `canvas.getContext('webgl2') || canvas.getContext('webgl')` returns `null`, draw a matching multi-stop gradient/noise surface on Canvas 2D so `audit_ui.mjs` never sees a blank canvas.
- **Reduced Motion Fallback:** Render one crisp static frame (`uTime = seedTime`, `uHover = 0`) and halt the RAF loop—never leave an unrendered canvas!

---

## 3. Native CSS Scroll-Driven Animations (`view-timeline` / `scroll-timeline`)

For scroll-linked hero recede/round effects or progress reveals:
```css
@supports (animation-timeline: view()) and (animation-duration: auto) {
  @media (prefers-reduced-motion: no-preference) {
    :root:not(.reduced-motion) .hero-shell {
      view-timeline: --hero-exit block;
    }
    :root:not(.reduced-motion) .hero-backdrop {
      animation: hero-recede auto cubic-bezier(0.33, 0, 0.67, 1) both,
                 hero-round auto cubic-bezier(0.33, 0, 0.67, 1) both;
      animation-timeline: --hero-exit;
      animation-range: exit 0% exit 55%;
    }
  }
}
@keyframes hero-recede { to { scale: 0.93; } }
@keyframes hero-round  { to { border-radius: 22px; } }
```
- **Non-Ancestor Timelines:** If the animated element is a sibling rather than a descendant of the timeline owner, add `timeline-scope: --hero-exit;` on their shared wrapper.
- **Browser Progressive Enhancement:** Treat `@supports (animation-timeline: view())` as progressive enhancement, or mirror the same progress curve in a passive scroll listener when critical to core layout comprehension.

---

## 4. Scroll-Pinned 3D Perspective Expansion Track (`~3000px–4200px`)

For multi-card showcase stages where a centered headline pins while surrounding cards glide inward from deep 3D space (`translate3d` + `rotateX/Y/Z` + soft `filter: blur()` → crisp clickable grid):
- **Outer Track:** Tall desktop container (`~3400–4000px`); collapses cleanly to a normal vertical grid on mobile (`<= 820px`) or under reduced motion.
- **Inner Sticky Stage:** `position: sticky; top: var(--header-h); height: calc(100dvh - var(--header-h)); perspective: 1250px;` with `transform-style: preserve-3d;` on the grid container.
- **Progress Math:** Compute `p = clamp((stickyTop - trackRect.top) / (trackRect.height - stageHeight), 0, 1)`.
  - Stagger each card by radial distance, ease via cubic-bezier/cubic-out, interpolate `translate3d`, `rotateX/Y/Z`, `scale(0.87 → 1)`, `filter: blur(4px → 0)`, and unlock `pointer-events: auto` once settled (`p >= 0.62`).
- **Settled Resting Guarantee:** At `p >= 0.85`, every card MUST resolve to `transform: none; opacity: 1; filter: none; pointer-events: auto;` with comfortable bottom clearance for any trailing CTA button.

---

## 5. Sticky Stacking Blur/Scale Card Deck

For sequential feature decks where each card slides over the previous card:
- Give each card wrapper `position: sticky; top: calc(var(--header-h) + 28px + var(--card-idx) * 22px); z-index: calc(10 + var(--card-idx));`.
- On scroll (`requestAnimationFrame`), compute cumulative overlap from cards below and update CSS custom properties on the inner card surface:
  - `--stack-scale: Math.max(0.84, 1 - buriedWeight * 0.055)`
  - `--stack-blur: Math.min(3.5, buriedWeight * 1.4)px` (keep subtle so foreground cards stay 100% razor-sharp!)

---

## 6. Sticky 3D Converge & Coin-Flip Stage

For multi-tile ecosystem / method rows that converge to dead center and flip `180°` into a central emblem:
- **Required 3D CSS Properties (Do Not Omit!):**
  - `perspective: 1100px;` on the stage container (without `perspective`, `rotateY` looks like a flat 2D horizontal squash!).
  - `transform-style: preserve-3d;` on the tile grid wrapper.
  - `backface-visibility: hidden;` on both front tiles and the back-face brand emblem tile.
- **Cached Measurement + Two-Phase Smoothstep:** Measure each tile's offset `{ dx, dy }` from stage center on resize/font-load (never inside scroll). Drive `merge = smoothstep(0.10, 0.56, p)` and `flip = smoothstep(0.54, 0.90, p)` so `t0 → t1 → t2 → t3` visibly spreads across the scroll track:
  - Front tiles apply `translate3d(dx * merge, dy * merge, 0) rotateY(angle)` and set `opacity: 0` at `angle >= 90`.
  - Back-face emblem sets `visibility: visible` at `angle >= 90` and rotates `rotateY(angle - 180deg)` to settle flat at `0deg`.

---

## 7. Procedural Ambient Film Canvas (For `<video>` Manifesto Slots)

When an inspiration site includes an ambient looping `<video>` panel and the user has not supplied footage:
- Render a bespoke **60fps Canvas 2D / WebGL atmospheric motion scene** grounded in the user's domain and palette.
- Provide an accessible **Play / Pause** button (`aria-pressed`, `>= 44×44px` tap target) plus live progress bar, pause offscreen via `IntersectionObserver`, and freeze cleanly on a curated frame under reduced motion.
