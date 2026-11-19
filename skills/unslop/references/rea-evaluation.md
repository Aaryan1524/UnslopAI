# Empirical Tool Evaluation: 4-Layer Playwright Forensic Dissolver + REA (`rea-agents`)

## Empirical Benchmarks (`https://vite.dev` & `https://microsoft.ai`, `rea@6.9.0`, Node `v26.13.1`)

We empirically tested both `scripts/inspect_site.mjs` and `scripts/rea_inspect.mjs` live against complex production websites (`https://vite.dev` and `https://microsoft.ai`, `11,730px` tall with WebGL shaders, CSS `view-timeline`, a `4000px` 3D scroll showcase, sticky stacking blur cards, and a 3D coin-flip ecosystem stage):

### 1. Why Black-Box Runtime Interception (`inspect_site.mjs`) Must Lead
- **85–90% of production sites strip `.js.map` source maps**, and REA intentionally omits CSS/styling under data minimization.
- By injecting a `page.addInitScript` GPU hook on `WebGLRenderingContext.prototype.shaderSource` / `WebGL2RenderingContext.prototype.shaderSource` and `getUniformLocation` **before** navigation, `inspect_site.mjs` intercepted `microsoft.ai`'s exact compiled **80-byte vertex shader + 5,483-byte fragment shader** directly from the WebGL driver call with **zero reliance on source maps**.
- Capturing raw `.css` files via `page.on('response')` bypassed CORS `document.styleSheets` security blocks, capturing both same-origin `tailwind-*.css` (`399 KB`) and cross-origin `uhf.microsoft.com` styles (`454 KB`) and extracting full `@keyframes`, CSS Scroll-Driven Animations (`view-timeline: --home-hero`, `animation-range: exit exit 50%`), and `cubic-bezier(...)` curves.
- Scrubbing tall/sticky sections (`> 1250px`) across `t0..t3` with fixed chrome temporarily hidden captured exact computed transform/blur/scale deltas (`matrix3d`, `blur(3px) → none`, `--stack-scale: 1.0 → 0.89`) even without reading JS source.

### 2. Why Deep Page-Scoped REA (`rea_inspect.mjs` v3.5) Is a High-Signal Multiplier
- **Critical Default-Cap Fix:** REA's default `analyze-web-bundle --fetch-source-maps` caps `--source-map-output-bytes` at `32 MiB` (`33,554,432` bytes), silently dropping `microsoft.ai`'s `index-*.js.map` (`fetch_failed`). Raising `--source-map-output-bytes` & `--source-map-fetch-bytes` to `536870887` (`512 MiB`) and decoded limits to `4000000` flipped `observations.source_maps.status` to `"included"` (`2.59 MB`) and recovered **113 unminified source files with full `sourcesContent`** (`BlockHome.js`, `BlockModels.js`, `BlockStackingCards.js`, `BlockEcosystem.js`, `CoreVideo.js`, `AppHeader.js`, `Lenis.js`).
- **Page-Scoped Materialization (Zero Context Bloat):** Rather than dumping 60 MB raw JSON or 113 site-wide files into agent context, `rea_inspect.mjs` reads which custom elements are actually mounted on the target page and writes **only matched mounted components + core motion/shader helpers** into `recovered-src/`.
- **Zero-Source-Map Script Export:** Passing `--include-script-sources` to `inspect-web-page` enables `export-web-scripts`, letting `rea_inspect.mjs` scan exported JS bundles for `customElements.define(...)`, embedded GLSL, dynamic imports (`rive-wasm`, `threejs`, `gsap`, `lenis`, lazy search modals), and scroll choreography variables even when `.js.map` is absent. *(Note: `rea recover-javascript-sources` requires an external Linux x64 `REA_WAKARU_COMMAND` binary and is not used on macOS/cross-platform hosts.)*

### 3. Node Engine Prerequisite
- `rea-agents@6.9.0` enforces Node `^22.23.4 || ^24.22.1 || >=26.12.1`. On older Node releases, skip `rea_inspect.mjs` gracefully and rely on `inspect_site.mjs`'s 4-layer black-box extractor (`shaders.json`, `css-motion.json`, `components/*-t0..t3.png`, `report.json`).

---

## Combined Pipeline Rule (v3.5 Architecture)
1. **Always run `scripts/inspect_site.mjs`** first for visual, CSS, GPU shader, scroll-filmstrip, and interactive-surface truth (`report.json`, `shaders.json`, `css-motion.json`, `components/*.png`).
2. **Pair with `scripts/rea_inspect.mjs`** when Node `>=22.23.4 / 24.22.1 / 26.12.1+` is available to recover AX landmarks/roles, hidden engines, exported script patterns, and page-scoped `recovered-src/` files when public source maps exist—never reading `rea-raw/*.json` directly into context.
