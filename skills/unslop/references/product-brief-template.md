# `.unslop/brief.md` Template

Author this spec at **`.unslop/brief.md`** at the end of Phase 0 (after silent recon, visual inspection of reference captures, and the dynamic multi-interval discovery Q&A) and get quick user approval **before** writing any application code. Every downstream phase—including Wave 1–3 parallel workers and the independent fresh-context Pass-3 visual critic—reads `.unslop/brief.md` as the single source of truth.

> **Workspace Hygiene:** Keep all scratch telemetry and contracts under `.unslop/` (`brief.md`, `stack-report.json`, `inspect/`, `DESIGN.md`, `COMPONENTS.md`, `audit/`). Ensure `.unslop/` is listed in the target repository's `.gitignore` (or clean up temporary recon/audit artifacts before final delivery) so generated projects never commit scratch captures.

---

## 1. Execution Profile (Locked from Phase 0 Discovery)
- **Goal Mode:** `build-from-scratch` | `redesign-vibe-transfer` | `extract-component`
- **Depth Preset:** `fast` | `standard` | `deep`
- **Visual Fidelity:** `close-structural-match` | `loose-vibe-transfer` | `specific-mechanics-only`
- **Palette Strategy:** `keep-reference` | `flip-light-dark` | `custom-brand` *(list locked hexes)*
- **Typography Mood:** `technical-grotesque-500` | `expressive-editorial-serif` | `hardware-swiss` | `user-specified`
- **Copy Density:** `minimal-visual-first` | `balanced-scannable` | `editorial-deep`
- **Motion Density:** `minimal-crisp` | `balanced` | `motion-heavy-kinetic`
- **Orchestration Mode:** `single-pass` (`fast`) | `sequential-modular` (`standard` / single-agent host) | `two-wave-parallel` (`deep` with subagents)
- **User Approval Status:** `Approved` | `Approved with defaults` *(timestamp or turn note)*

## 2. Recon Snapshot (Grounded Ground Truth)
- **Target Workspace Stack (`detect_stack.mjs`):** `<e.g., Next.js App Router + Tailwind CSS v4 | Greenfield Vanilla ESM>`
- **Existing Routes / Logic to Preserve:** `<List routes, API handlers, or components that must remain unbroken, or "None (greenfield)">`
- **Inspiration Reference(s) (`inspect_site.mjs` `reconDigest` + `.unslop/inspect/reference-tokens.json`):**
  - **URL(s):** `<https://... or user screenshots>`
  - **Extracted Palette & Polarity:** `<topPaletteHexes, light/dark polarity, canvas/surface/accent %>`
  - **Extracted Typography:** `<primaryFonts, headingWeight (400/500 vs bold), displayTracking, commercialFontHints>`
  - **Extracted Copy Density:** `<copyDensity metrics: avg words per card, headline word count, section prose ratio>`
  - **Extracted Geometry & Motion:** `<modalRadii, sectionCount, sectionArchetypes, detectedInteractiveTriggers, hasWebGL / shaderCount, scrollTimelinesCount, mobileCollapsedCount>`

## 3. Product Identity & Audience
- **Product / Brand Name:** `<Official product name>`
- **Category & Positioning:** `<One-sentence factual description of what it does>`
- **Brand Voice & Tone:** `<e.g., precise technical editorial / calm architectural / direct pragmatic>`
- **Primary Visitor (ICP) & Core Job-to-Be-Done:** `<Who lands here and what they must accomplish within 60 seconds>`
- **Primary & Secondary Conversion Actions:** `<Exact CTA labels, destination routes/drawers, and completion states>`

## 4. Real Offerings, Capabilities & Tiers
List only verified capabilities, specs, plans, or catalog items. Remove unused rows rather than filling them with guesses. *(For `extract-component` mode, replace with the single target component's exact props, trigger mechanics, and mount location.)*

| Offering / Module | Verified Specs & Scope | Differentiator / Proof Point | Target Route / Anchor |
| :--- | :--- | :--- | :--- |
| `<Offering 1>` | `<Concrete capabilities>` | `<Measurable or architectural proof>` | `<e.g., /#hero or /pricing>` |
| `<Offering 2>` | `<Concrete capabilities>` | `<Measurable or architectural proof>` | `<e.g., /compare>` |

## 5. Priority Sections & Product-Explaining Animations (Keep / Adapt / Drop)
Tie every extracted band, visual motif, or kinetic mechanic explicitly to the user's product truth:

| Extracted Reference Band / Mechanic | Decision (`Keep / Adapt` / `Merge` / `Drop`) | Target Implementation & Animation Notes |
| :--- | :--- | :--- |
| `<e.g., Pure 5-link Nav + Pill CTA>` | `Keep / Adapt` | `<Max 5 links + 1 CTA; Theme/Motion toggles in footer & Cmd+K>` |
| `<e.g., Inset Halftone Hero + Ticker>` | `Keep / Adapt` | `<Shader/canvas glow with upper-band AA contrast + live metric ticker>` |
| `<e.g., 50/50 Noise-vs-Calm Split>` | `Keep / Adapt` | `<Animated alert-noise grid left vs. serene filtered state right>` |
| `<e.g., Third-party customer logo strip>` | `Drop` | `<No verified logos supplied>` |

## 6. Section Rhythm & Geometry Contract
Lock structural cadence, token discipline, and anti-slop geometry rules before authoring `DESIGN.md` or components (reference [`type-pairings.md`](type-pairings.md), [`craft-primitives.md`](craft-primitives.md), and [`anti-slop-checklist.md`](anti-slop-checklist.md)):

### A. Aligned Reference Tokens Lock (`reference-tokens.json`)
- **Measured Polarity & Canvas Discipline:** `<Light-first (#FFFFFF / #FAF9F6, 80–93% area) | Warm-charcoal dark (#151414 canvas / #F0E3DE headings / #302E2D borders) | Reference-matched>`
- **Primary / Elevated Backgrounds:** `<--bg-canvas: #..., --bg-surface: #..., --bg-recessed: #...>`
- **Accent Area Budget:** `<--accent-primary: #..., target < 5% (or reference-measured %)>`
- **Typography Lock:** `<Curated pairing from type-pairings.md matching locked Typography Mood — e.g., Figtree 500/400 + JetBrains Mono | Instrument Serif + Geist + JetBrains Mono>`
- **Heading Weight & Tracking:** `<h1/h2 weight: 400 or 500 (never 700/800 unless measured in reference-tokens.json); display tracking: -0.025em to -0.04em; tabular-nums enabled>`
- **Extracted Modal Radii:** `<Measured reference radii from reference-tokens.json, or "Greenfield — locked below">`

### B. Alternating Section Rhythm Rule
Map every kept band to an explicit layout archetype so adjacent bands alternate visual weight, alignment, and density (never `> 2` consecutive generic centered-pyramid sections unless explicitly justified in Section 7 Reference Overrides):

| Band # | Section Role | Layout Pattern & Alignment | Surface / Framing Treatment | Target Module / Anchor |
| :--- | :--- | :--- | :--- | :--- |
| **1** | `<Hero / Primary Focus>` | `<e.g., Inset Rounded Halftone Frame + Ticker | Left Editorial + Right Interactive>` | `<Outer dot gutters + 1px blueprint rails + inset frame>` | `<#hero>` |
| **2** | `<Contrast / Problem→Solution>` | `<e.g., 50/50 Noise-vs-Calm Split Stage>` | `<Animated light dot-noise left vs. solid accent calm right>` | `<#contrast>` |
| **3** | `<Architecture / Capabilities>` | `<e.g., Edge-to-Edge Hairline Bento + Luminous Micro-UIs>` | `<Shared 1px border dividers + corner-bracket callouts>` | `<#architecture>` |
| **4** | `<Closing Conversion Frame>` | `<e.g., Inset Rounded Accent / Halftone Closing Card>` | `<Matches hero frame grammar + 2% SVG noise grain>` | `<#cta>` |

### C. Strict 3-Radius Budget
Lock exactly three semantic radius tokens across the entire codebase (zero ad-hoc `rounded-2xl` / `rounded-3xl` drift):
- **`--r-card`:** `<e.g., 0px | 4px | 8px>` *(outer panels, cards, bento cells, inset frames if shared)*
- **`--r-control`:** `<e.g., 4px | 6px | 9999px (when reference-backed pill CTA)>` *(buttons, inputs, terminal status bars, tabs)*
- **`--r-media`:** `<e.g., 4px | 8px | 12px>` *(editorial images, inset hero/CTA canvas frames, interactive preview wells)*

### D. Navbar Purity Rule (Tier 1 Universal Craft Law)
- **Primary Header Budget:** Maximum **5 primary nav links** + **1 primary CTA** (plus optional compact search trigger).
- **Utility Toggle Placement:** Move **Theme (Light/Dark)** and **Motion (On/Reduced)** toggles into `<footer>` or the `Cmd+K` command palette — **never** render utility switches or pill clusters inside the primary top navbar header.

### E. Anti-Void Card Rule (Tier 1 Universal Craft Law)
- **Banned Empty Stretch:** Never apply `justify-content: space-between` on any card or grid cell `> 320px` tall unless a real middle visual artifact (e.g., live SVG curve, notification banner, luminous micro-UI, terminal status bar, or structured spec matrix) fills the card body cleanly.

## 7. Visual DNA & Structural Motifs Manifest
Populate this manifest by **visually inspecting** `.unslop/inspect/desktop-top.png`, `.unslop/inspect/desktop-mid.png`, `.unslop/inspect/desktop-full.png`, and `.unslop/inspect/components/*.png` (or user-provided visual references). Every downstream builder and the Pass-3 Visual Critic audit against these exact motifs:

- **Page Substrate & Framing:**
  - *Outer Margin Substrate:* `<e.g., Subtle 16px dot-matrix gutter outside the max-width container | Clean edge-to-edge neutral canvas>`
  - *Guide Rails & Registration Nodes:* `<e.g., Continuous 1px vertical blueprint rails flanking the content column + 7×7px open registration squares (□) at horizontal band intersections | None>`
  - *Section Dividers:* `<e.g., Full-bleed 1px horizontal hairlines with dashed inner sub-dividers | Solid tonal surface bands>`
- **Hero & Closing CTA Frame Architecture:**
  - *Frame Geometry:* `<e.g., Inset rounded frame (12px–16px radius) inside blueprint rails | Asymmetric 50/50 split | Full-bleed architectural band>`
  - *Atmospheric / Light Treatment:* `<e.g., Procedural halftone / solar-glow Canvas shader with high-contrast upper sky band + 2% SVG grain | Matte warm-charcoal slab>`
  - *Kinetic Footer Bar / Ticker:* `<e.g., Single-line monospace bottom ticker marquee anchored to hero floor (pauses on hover & reduced-motion) | None>`
- **Signature Compositional Contrast Patterns:**
  - *Primary Contrast Device:* `<e.g., 50/50 Noise-vs-Calm split (animated dotted alert matrix on light ground vs. serene solid accent panel) | Sticky numbered process track>`
  - *Technical Callout Framing:* `<e.g., Notched open-corner brackets (┌ ┐ └ ┘) over light dotted field | Hairline left accent rule>`
  - *Micro-UI Surface Polarity:* `<e.g., Luminous crisp #FFFFFF cards with subtle accent-tinted rows & status pills (zero dark-box spam on light canvas) | Warm-charcoal recessed telemetry wells>`
- **Reference Overrides (Tier 2 — Documented Deviations from Generic Defaults):**
  List every intentional choice proven by the reference captures / `reference-tokens.json` that overrides generic layout habits so builders preserve visual lineage and the Pass-3 critic grades accurately:
  - `<e.g., Centered inset halftone hero + matching inset closing CTA frame — intentional bookend symmetry paired with asymmetric mid-page bands>`
  - `<e.g., Pill primary CTAs (--r-control: 9999px) paired with crisp 4px cards (--r-card: 4px) — matches reference geometryLock>`
  - `<e.g., Pure 500-weight technical neo-grotesk + mono without editorial serif — matches technical infrastructure reference mood>`

## 8. Copy Economy & Visual Storytelling Budget
Derive strict word caps from `.unslop/inspect/reference-tokens.json` (`copyDensity`) and the locked `Copy Density` profile. **Show, don't tell:** whenever a live animation, compact telemetry plot, or interactive micro-UI explains a capability faster than prose, cut the paragraph and let the visual carry the explanation.

- **Hero Word Budget:** Headline `<= 8–10` words; subheadline `<= 18–22` words (max 2 lines on desktop); CTA `2–3` words.
- **Section Intro Budget:** Eyebrow `1–3` words (mono uppercase); `h2` `<= 8` words; optional intro `<= 20` words (omit intro paragraph entirely when the headline + visual artifact are self-explanatory).
- **Card / Bento Cell Budget:** Title `2–4` words + body `<= 16–22` words (max 2–3 short lines) + **1 product-native visual/micro-UI artifact**. Zero multi-paragraph essays inside cards.
- **Visual-to-Prose Ratio Target:** `>= 60%` of mid-page capability bands explained via live interactive micro-UIs, SVG/Canvas animations, or structured tabular specs rather than prose paragraphs.
- **Product-Explaining Signature Animations (Locked List):**
  1. `<Animation 1: e.g., Hero atmospheric halftone/signal field responding subtly to pointer/time, freezing cleanly under reduced-motion>`
  2. `<Animation 2: e.g., 50/50 Noise-to-Calm live triage comparison showing raw event clutter resolving into one prioritized action>`
  3. `<Animation 3: e.g., Interactive micro-UI telemetry curve / live rule simulator inside capability bento>`

## 9. Interactive Requirements
Check every stateful surface that must work end-to-end (implement using [`interactive-component-patterns.md`](interactive-component-patterns.md)):
- [ ] **Command Palette / Search (`Cmd+K`):** `<Indexed entities, shortcuts & Theme/Motion actions>`
- [ ] **Navigation / Mega-Menu & Mobile Drawer:** `<Max 5 links + 1 CTA, collapse behavior>`
- [ ] **Filterable Catalog / Configurator / Detail Drawer:** `<Filter facets, variants, live state>`
- [ ] **Pricing Toggle / Trade-In / Usage Calculator:** `<Inputs & exact formula>`
- [ ] **Multi-Step Validated Form:** `<Steps, validation rules, confirmation state>`
- [ ] **Slide-Over Cart / Action Drawer:** `<Line items, quantities, totals>`
- [ ] **Global Controls (`<footer>` / `Cmd+K` only):** `<Light/Dark theme toggle + Motion On/Off toggle>`

## 10. Content, Media & No-Fabrication Redlines
- **Asset Strategy:** `<Existing repo assets | User-supplied | Synthesize cohesive studio batches | Lightweight CSS/SVG (fast mode)>`
- **Out of Scope:** `<Features, backend integrations, or routes explicitly excluded from this pass>`
- **No-Fabrication Redlines:**
  - Zero `lorem ipsum`, placeholder company names, or copied brand marks/slogans from inspiration URLs.
  - Zero invented customer metrics, logos, certifications, uptime claims, or testimonials not provided above.
  - Zero dead interactive controls—every visible button, tab, filter, and modal trigger must perform a real state transition or be omitted.
