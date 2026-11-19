# Capabilities & Limitations Contract

Before designing or writing UI code, inspect telemetry from `scripts/inspect_site.mjs` (and optionally `scripts/rea_inspect.mjs`) and disclose this honest scope upfront so the user knows what will be faithfully adapted vs. synthesized vs. excluded.

## 1. What This Skill Can Do Faithfully

- **Color Architecture & Area Ratios:** Extract computed background, elevated surface, hairline border, primary/muted ink, and accent colors weighted by visible pixel area, then remap them cleanly to the user's taste and WCAG AA contrast rules.
- **Typographic System:** Inspect loaded `document.fonts`, heading-to-body size scale (`h1`–`h4`, dominant body copy, `caption`, `code`), weight contrast, line-height, and letter-spacing.
- **Full Section, Custom-Element & Component Grammar:** Dissect header/nav anatomy, hero structure, asymmetric grids, card density, tables, forms, sticky stages, spacing rhythm, corner radii, and border/shadow recipes—rebuilt as clean modular components in the target codebase.
- **GPU Shaders, CSS Scroll-Driven Timelines & Kinetic Choreography:**
  - Intercept compiled WebGL/WebGL2 GLSL shaders & uniform names at runtime (even when production source maps are stripped).
  - Capture raw network stylesheets (bypassing cross-origin `cssRules` restrictions) to extract full `@keyframes`, `view-timeline` / `scroll-timeline` / `animation-range`, `@property`, and `cubic-bezier(...)` curves.
  - Scrub tall sticky sections (`> 1250px`) across progress filmstrips (`t0`–`t3`) to measure exact transform/blur/scale/flip trajectories and translate them into **bespoke WebGL2 shaders, CSS Scroll-Driven Animations, sticky 3D flight grids, stacking blur/scale decks, and 3D converge/coin-flip stages** (see [`references/motion-and-shader-grammar.md`](motion-and-shader-grammar.md)).
- **Closed-Loop Kinetic & Accessibility QA:** Audit existing or newly built UIs in headless Chromium for runtime console/network errors, unloaded fonts, broken images, blank/frozen `<canvas>` shaders, scroll-track kinetic state mutations, horizontal overflow (`320px`/`390px`/`768px`/`1440px`), floating mobile overlay collisions, clipped text, WCAG AA contrast, keyboard focus visibility, and mobile tap targets.

## 2. What Requires Bespoke Synthesis or Approximation (Confirm With User)

| Signal Detected | Constraint | Approved Synthesis / Approximation |
| :--- | :--- | :--- |
| **Commercial / Paid Fonts** | Proprietary web fonts (e.g., Segoe Sans, Söhne, GT America, Berkeley Mono) cannot be redistributed without a license. | Match proportions, weight range, and x-height using curated open-source Google Fonts / Fontshare pairings (document the swap in `DESIGN.md`). |
| **Atmospheric WebGL / 3D Canvas Backdrops** | Proprietary shaders, textures, or `.riv` / `.glb` binaries must never be copied verbatim. | Author an **original procedural WebGL2/GLSL shader or Canvas 2D interactive field** matching the mood, pointer response, and remapped palette, wired to `prefers-reduced-motion` and a CSS fallback. |
| **Ambient `<video>` Showcases** | External copyrighted video footage must not be hotlinked or cloned. | Ask for user-supplied footage OR build a **bespoke 60fps procedural Canvas/WebGL ambient cinema loop** with accessible Play/Pause controls and reduced-motion poster fallback. |
| **Editorial Photography & Bespoke Artwork** | Brand logos, proprietary illustrations, and copyrighted photos must never be copied. | Generate cohesive, color-graded original imagery aligned to the target palette & lighting brief (or use user-supplied brand photography / bespoke SVGs). |

## 3. What Cannot Be Done (Report Immediately, Never Fake)

- **No Anti-Bot / CAPTCHA / Paywall Bypass:** If an inspiration URL returns HTTP 401/403/429, Cloudflare Turnstile, CAPTCHA, or a login gate, stop automated scraping immediately. Ask the user for screenshots or inspect an already-open user-authenticated browser tab via optional CDP/REA if configured.
- **No Verbatim Proprietary Asset Cloning:** Never copy brand names, slogans, trademarks, proprietary logos, copyrighted photos, Rive `.riv` binaries, or verbatim third-party source code. Always translate **architecture, mechanics, and visual craft** onto original brand expression.
- **No Decompilation When Source Maps Are Stripped:** On production sites without `.js.map` files, REA cannot restore original variable names (and `recover-javascript-sources` requires an external Linux x64 Wakaru binary); rely on **Layer 2–3 black-box GPU shader interception, CSS stylesheet parsing, scroll-scrub telemetry, and exported JS pattern scanning** instead.
