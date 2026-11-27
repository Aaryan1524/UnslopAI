# Visual Art Direction, Studio Seed Cohesion & Brand Surfaces (v2.0)

Empty colored boxes, mismatched stock photos, conflicting lighting angles, and missing browser brand surfaces are the #1 reason an otherwise well-engineered interface looks synthetic or unfinished. Follow this contract whenever a build uses photography, editorial art, procedural canvases, or brand metadata.

---

## 1. The Locked Studio Seed Contract (One-Room Cohesion)

Before generating or selecting a single visual asset, write a **Locked Studio Seed Contract** inside `.unslop/DESIGN.md` and **prepend it verbatim** to every image generation prompt so every frame feels shot inside the same physical studio on the same afternoon.

```markdown
### Locked Studio Seed Contract
- **Lighting Direction:** Soft 45° upper-left diffused studio key light with quiet ambient fill on the shadow side; subtle grounded contact shadows only; zero conflicting rim lights.
- **Color Temperature:** 5200K–5500K neutral-warm daylight (or locked 3800K warm architectural tungsten for dark editorial modes); never mix icy cyan shadows with warm orange highlights across sibling assets.
- **Camera Focal Length & Angle:** 50mm or 85mm prime lens, eye-level or gentle 15° studio elevation, crisp shallow-to-medium depth of field (f/4–f/5.6); zero wide-angle distortion.
- **Surface Finish & Tactility:** Matte bead-blasted aluminum, honed limestone, coated archival paper, or fine woven linen — zero glossy CGI plastic reflections or synthetic wet-floor gradients.
- **Exact Palette Hex Bindings:** Primary backdrop anchored to `--bg-canvas` (`#FFFFFF`) or `--bg-surface` (`#FAF9F6`), deep structural tones near `--text-primary` (`#151414`), and restrained physical accent props near `--accent-signal` (`#FF5E1F`).
- **Negative Prompt Redlines:** `zero text, zero typography, zero UI labels, zero logos, zero watermarks, zero floating holographic dashboards, zero stock-photo posed smiles, zero purple-cyan neon glow`.
- **Aspect Ratios & Weight Budget:** Lock each slot to its exact CSS `aspect-ratio` (`16:9` hero/editorial, `4:3` feature cards, `1:1` avatars/specimens, `1200×630` Open Graph). Compress every shipped raster asset to **`< 500 KB`** (prefer WebP/AVIF or optimized JPEG/PNG).
```

---

## 2. Three-Tier Media Strategy (Choose Based on Environment & Tools)

| Scenario | Recommended Strategy | Rules |
| :--- | :--- | :--- |
| **A. Image Generation Available** (`image-generator` or equivalent) | Generate bespoke, seed-locked assets for hero, editorial, and feature slots using **disjoint filename batches** (safe to parallelize alongside Wave 2 code scaffolding with zero file overlap). | Save into `public/assets/`, enforce exact aspect ratios and `< 500 KB` per file, and run the **Cohesive Multi-Asset Tonal Audit** (Section 3) before final assembly. |
| **B. User-Supplied Brand Media** | Use the user's real product photography, hardware shots, or MP4 clips directly. | Normalize cropping with explicit CSS `aspect-ratio` + `object-fit: cover`, optimize oversize originals (`< 500 KB` for static rasters), and verify `naturalWidth > 0` via `audit_ui.mjs`. |
| **C. Zero Image Tool / Quota Limited / Ambient Motion Slots** | Never fall back to flat gray placeholders! Build **bespoke 60fps procedural WebGL2 / Canvas 2D studies** or **interactive product proofs** (see [`interactive-product-proofs.md`](interactive-product-proofs.md)) or precision geometric SVGs matching stroke weight and palette tokens. | Always pair procedural motion with an accessible **Pause / Freeze** control (`>= 44×44px`) and a clean deterministic static poster frame under `prefers-reduced-motion`. |

---

## 3. Cohesive Multi-Asset Tonal Audit

Whenever a page ships **2 or more** generated or curated visual assets, inspect them side-by-side before shipping:

1. **White-Balance Drift Check:** Confirm backdrops and midtones share one Kelvin temperature (no cool blue card next to a yellow-tinted hero).
2. **Shadow-Angle Consistency:** Verify primary shadows fall in the same direction across adjacent cards.
3. **Backdrop Luminance Seam:** Ensure asset backgrounds harmonize with `--bg-canvas` / `--bg-surface` (no harsh white sticker rectangles sitting on warm stone or dark slate surfaces).
4. **Zero Hallucinated Text / Artifacts:** Inspect every generated image at 100% scale for garbled text, bent geometry, or extra limbs/keys — regenerate any flawed frame immediately.
5. **Payload Budget Check (`< 500 KB`):** Confirm every image in `public/assets/` is `< 500 KB` (`ls -lh public/assets/`). Convert oversized PNGs to WebP (`quality 82–86`) or JPEG while keeping crisp SVG/PNG strictly for logos, favicons, and `og-image.png`.

---

## 4. Production Brand Surface Checklist

A studio-grade build never ships with a blank globe favicon, missing theme color, or broken social share card. Include all four surfaces before final QA:

- [ ] **SVG Favicon (`/favicon.svg`):** Minimal, razor-sharp geometric brand mark (`viewBox="0 0 32 32"`) using the locked corner radius and accent token from `.unslop/DESIGN.md`, wired with `<link rel="icon" type="image/svg+xml" href="/favicon.svg">`.
- [ ] **Apple Touch Icon (`/apple-touch-icon.png`):** Crisp `180×180` raster icon on a solid brand canvas (`--bg-canvas` or `--text-primary` with generous `18%` safe padding), wired with `<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">`.
- [ ] **Open Graph Social Card (`1200×630`):** High-contrast share preview (`/og-image.png`, `< 500 KB`) echoing the approved Phase 0.5 Style Tile ([`style-tile-checkpoint.md`](style-tile-checkpoint.md)) — brand mark, concise value headline, and visual specimen motif — wired with:
  ```html
  <meta property="og:title" content="Vektor — Deterministic Edge Telemetry">
  <meta property="og:description" content="Inspect tail latency, packet drift, and regional failover in one calm surface.">
  <meta property="og:image" content="/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  ```
- [ ] **Browser Theme Color Meta:** Match the active canvas surface so mobile browser chrome blends cleanly:
  ```html
  <meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#141312" media="(prefers-color-scheme: dark)">
  ```
  (For single-polarity sites, omit the `media` attribute and emit the single locked `--bg-canvas` hex.)

---

## 5. Integration, Contrast & Layout Stability Rules

1. **Zero Layout Shift (`CLS = 0`):** Every `<img>`, `<picture>`, `<video>`, and `<canvas>` container MUST declare an explicit `aspect-ratio` (or fixed height) plus a matching neutral placeholder background (`var(--bg-recessed)`).
2. **LCP & Lazy Loading Discipline:** Mark the single above-the-fold hero image `fetchpriority="high"` and `decoding="async"` (never `loading="lazy"` on LCP media). Apply `loading="lazy"` to below-the-fold imagery.
3. **Guaranteed Text Readability Over Media & Shaders:**
   - Always set a solid contrasting **fallback `background-color`** on any section carrying light foreground text over a `<canvas>` or `<img>` (passes WCAG AA even before media paints).
   - Layer a restrained directional or radial scrim (`rgba(...)`) behind overlay display typography so headlines stay `>= 4.5:1` across moving highlights.
4. **Never Stretch or Distort:** Always use `object-fit: cover` for editorial photography and `width: 100%; height: 100%; display: block;` for full-bleed canvases.
5. **Never Clone or Hotlink:** Never reuse image URLs, logos, or artwork from any inspiration reference.
