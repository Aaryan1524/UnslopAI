# Visual Art Direction & Cohesive Media Synthesis

Empty colored boxes, mismatched stock photos, and crude placeholder SVGs are the #1 reason an otherwise well-engineered redesign looks synthetic or flat. Follow this discipline whenever an inspiration website uses photography, editorial art, or ambient video slots.

---

## 1. Lock One Shared Art-Direction Brief Before Generating Any Asset

Before creating or selecting a single visual asset, write a **3-line Shared Art-Direction Brief** inside `DESIGN.md` and prepend it verbatim to every image prompt:

- **Lighting & Mood:** Specify one consistent light source and atmosphere (e.g., *"soft diffused morning sunlight with gentle botanical shadows"*, *"crisp studio overcast light on brushed anodized aluminum"*, *"warm golden-hour architectural light"*).
- **Palette Lock:** Bind surfaces, props, and color grading directly to `DESIGN.md`'s canvas, surface, and accent hex values so every photograph belongs to the same physical world.
- **Hard Cleanliness Rules:** Always mandate **`zero text, zero labels, zero logos, zero watermarks`**, consistent analog/editorial texture (e.g., subtle 35mm grain or crisp matte studio finish), and generous negative space matching the card aspect ratio (`16:9`, `4:3`, `1:1`).

---

## 2. Three-Tier Media Strategy (Choose Based on Environment & Tools)

| Scenario | Recommended Strategy | Rules |
| :--- | :--- | :--- |
| **A. Image Generation Available** (`image-generator` or equivalent) | Generate bespoke, palette-locked assets for editorial, product, and feature slots using **disjoint filename batches** (safe to parallelize alongside code scaffolding with zero file overlap). | Copy assets into the project's `public/assets/` folder, match exact aspect ratios, and inspect at least 2 generated images visually to confirm tonal cohesion before assembling the page. |
| **B. User-Supplied Brand Media** | Use the user's real product screenshots, photography, or MP4 clips directly. | Normalize cropping with explicit CSS `aspect-ratio` + `object-fit: cover` and verify `naturalWidth > 0` via `audit_ui.mjs`. |
| **C. Zero Image Tool / Quota Limited / Ambient Video Slots** | Never fall back to flat gray rectangles! Build **bespoke 60fps procedural WebGL2/Canvas 2D studies** (atmospheric shaders, flowing material ribbons, architectural diagrams, telemetry charts) or crisp minimalist geometric SVGs matching stroke weight and tone. | Always pair procedural video replacements with accessible **Play / Pause** controls (`>= 44×44px`) and a clean static poster frame under `prefers-reduced-motion`. |

---

## 3. Integration, Contrast & Layout Stability Rules

1. **Zero Layout Shift (`CLS = 0`):** Every image and canvas container MUST declare an explicit `aspect-ratio` (or fixed viewport height) and a matching warm/neutral placeholder background (`var(--bg-recessed)`).
2. **Guaranteed Text Readability Over Media & Shaders:**
   - Always set a solid dark/contrasting **fallback `background-color`** on the section container behind any `<canvas>` or `<img>` that carries light foreground text (passes WCAG AA even before WebGL or images paint).
   - Add a quiet radial or directional scrim (`rgba(...)`) behind overlay display typography so headlines remain legible across bright moving highlights.
3. **Never Stretch or Distort:** Always use `object-fit: cover` for editorial photography and `width: 100%; height: 100%; display: block;` for full-bleed canvases.
4. **Never Clone or Hotlink:** Never reuse image URLs, logos, or artwork from the inspiration site.
