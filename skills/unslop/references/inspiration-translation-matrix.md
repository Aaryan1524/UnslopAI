# Inspiration Translation Matrix & Multi-Source Remix Contract

Never clone an inspiration site's section list mechanically. First classify every extracted band from `inspect_site.mjs` (`report.json` + `components/*.png`) by its **communicative job**, then map it against the user's `PRODUCT_BRIEF.md` using explicit **Adapt / Merge / Drop** rules.

---

## 1. Semantic Archetype Translation Table

| # | Communicative Archetype | Structural & Kinetic Signature | Ideal Domain Mapping | Adapt Rule (Keep & Translate) | Merge Rule (Combine) | Drop Rule (Omit Cleanly) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Atmospheric Anchor** | Full-bleed or asymmetric hero, high display-to-body ratio (`>= 2.0`), optional WebGL/Canvas backdrop or editorial art-directed frame, single clear CTA cluster | Brand positioning, flagship launch, core product promise | Preserve proportion, luminance contrast, and scroll-recede rhythm; replace media with original procedural shader or domain photography + solid fallback background | Merge with a compact inline product preview or metric bar when the user's ICP expects immediate functional proof above the fold | Drop full-screen atmospheric heroes on dense internal dashboards or docs entrypoints—replace with a tight utilitarian workbench header |
| **2** | **Editorial Proof** | Asymmetric split (`7/5` or sticky lead + scrolling secondary stack), hairline dividers, curated photography or crisp technical diagrams | Case studies, architecture breakdowns, product updates, customer outcomes | Transfer column ratio, sticky lead behavior, and typographic cadence onto verified product proof points from `PRODUCT_BRIEF.md` | Merge into a compact 2-column comparison or tabbed proof block when only 1–2 verified proof items exist | Drop completely if the brief has zero verified stories/articles—never pad empty slots with fake blog posts |
| **3** | **Kinetic Catalog** | Multi-column filterable grid or sticky 3D scroll-flight showcase (`t0 → t3`), sharp hover/focus deltas, detail drawer on selection | Products, API modules, templates, integrations, hardware lineup | Keep grid density, hover/scroll kinematics, and detail-drawer inspection; bind to real domain entities and working category filters | Merge filter tabs + detail preview into a single split workbench when catalog has `<= 4` items | Drop sticky 3D flight tracks if the catalog is a single-SKU product; use a focused spec breakdown instead |
| **4** | **Sequential Narrative** | Sticky stacking card deck (`--stack-scale` / `--stack-blur` progression) or vertical timeline steps | How-it-works workflows, lifecycle stages, onboarding steps, architecture pipeline | Preserve progressive depth/scale pacing (`t0 → t3`) and sharp active foreground card with clean `prefers-reduced-motion` stacked fallback | Merge into a 3-step horizontal/accordion sequence if the workflow has fewer than 3 real stages | Drop if the product requires no multi-step narrative; never stretch a 1-sentence feature into 5 artificial cards |
| **5** | **Ecosystem Convergence** | Converging sticky grid, radial/hub diagram, or 3D `rotateY` emblem reveal stage | Platform integrations, SDK ecosystem, partner protocols, multi-service architecture | Translate spatial convergence physics onto genuine supported integrations/SDKs with crisp accessible labels | Merge with Kinetic Catalog as an "Integrations" filter tab when integrations are secondary to core offerings | Drop if the product is standalone without real third-party ecosystem hooks—never invent fake partner logos |
| **6** | **Manifesto Split** | High-contrast typographic statement paired with ambient looping canvas/video frame or tactile hardware detail | Design philosophy, engineering principles, craft narrative, founder thesis | Preserve typographic tension, whitespace ratio, and Play/Pause + reduced-motion freeze on ambient media | Merge a concise 2-sentence thesis directly into Editorial Proof or Footer preface for pragmatic utility apps | Drop long manifesto bands on transactional tools or self-serve pricing pages where visitors want immediate action |
| **7** | **Conversion Capture** | High-clarity pricing matrix/calculator, interactive form band, or focused final CTA surface above a structured landmark footer | Plan selection, booking/checkout initiation, trial signup, enterprise inquiry | Preserve visual calm, high-contrast primary action, and clear validation/feedback states wired to real conversion flows | Merge final CTA into the pricing/calculator band when pricing is the sole conversion decision | Never drop conversion capture entirely on marketing/product pages; on authenticated apps, replace with contextual primary actions |

---

## 2. Multi-Source Remix Matrix

When the user combines **2–4 inspiration sources** (e.g., layout from Site A, palette from Site B, typography from Site C, motion from Site D), lock **exactly one authoritative source per design axis** in `DESIGN.md` before writing code:

| Design Axis | Authoritative Source Slot | What You Extract | Conflict-Resolution Invariant |
| :--- | :--- | :--- | :--- |
| **Layout Source** | `<URL / Screenshot A>` | Container max-width, grid column ratios, asymmetric splits, vertical section rhythm, breakpoint collapse rules | Layout Source wins all spacing, column count, and section cadence decisions; never mix two competing grid widths on one page |
| **Palette Source** | `<URL / Screenshot B or User Mood>` | Semantic canvas/surface/recessed/ink/accent roles and **area budget** (`~65–80%` canvas, `~10–20%` surface, `< 5%` accent) | Re-verify every foreground/background pair against WCAG AA (`>= 4.5:1` body, `>= 3:1` large text/UI) after remapping onto Layout Source surfaces |
| **Typography Source** | `<URL / Screenshot C or Curated Pair>` | Display/body/mono pairing, `h1 / body` scale ratio, weight contrast, tracking, line-height, `tabular-nums` policy | Keep **one** type scale across the entire app; never blend serif/grotesque display systems from two different sources |
| **Motion Source** | `<URL / Screenshot D or Motion Grammar>` | Easing curve family (`cubic-bezier`), transition duration tiers, scroll-timeline choreography, shader/ambient physics | Enforce **one** coherent easing curve and corner-radius hierarchy (`container > control > pill`), all governed by a single `MotionController` + `prefers-reduced-motion` gate |

---

## 3. Anti-Frankenstein Cohesion Check

Before finalizing `DESIGN.md` and `COMPONENTS.md`, verify all four checks:
1. **Single Surface Grammar:** Choose one elevation strategy (hairline borders OR crisp luminance steps OR subtle soft shadows)—never mix glassmorphism from Source A with brutalist borders from Source B.
2. **Single Corner-Radius Scale:** Lock 3–4 radius tokens (`--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-pill`) across every component regardless of how many inspirations were inspected.
3. **Every Band Justified by `PRODUCT_BRIEF.md`:** Cross-check each planned band in `COMPONENTS.md` against the table above; mark every omitted inspiration band explicitly as `Dropped (reason)` so scope stays transparent.
4. **Polarity & Media Alignment:** When combining a dark Layout Source with a warm-light Palette Source, re-grade photography, shader uniforms, and border opacities for light polarity instead of pasting dark-mode translucent fills onto light canvases.
