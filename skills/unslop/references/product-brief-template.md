# `.unslop/brief.md` Template

Author this spec at **`.unslop/brief.md`** at the end of Phase 0 (after silent recon and the request-specific adaptive Q&A) and get quick user approval **before** writing any application code. Every downstream phase—including Wave 1–3 parallel workers and the independent fresh-context reviewer—reads `.unslop/brief.md` as the single source of truth.

> **Workspace Hygiene:** Keep all scratch telemetry and contracts under `.unslop/` (`brief.md`, `stack-report.json`, `inspect/`, `DESIGN.md`, `COMPONENTS.md`, `audit/`). Ensure `.unslop/` is listed in the target repository's `.gitignore` (or clean up temporary recon/audit artifacts before final delivery) so generated projects never commit scratch captures.

---

## 1. Execution Profile (Locked from Phase 0 Q&A)
- **Goal Mode:** `build-from-scratch` | `redesign-vibe-transfer` | `extract-component`
- **Depth Preset:** `fast` | `standard` | `deep`
- **Visual Fidelity:** `close-structural-match` | `loose-vibe-transfer` | `specific-mechanics-only`
- **Palette Strategy:** `keep-reference` | `flip-light-dark` | `custom-brand` *(list locked hexes)*
- **Motion Density:** `minimal-crisp` | `balanced` | `motion-heavy-kinetic`
- **Orchestration Mode:** `single-pass` (`fast`) | `sequential-modular` (`standard` / single-agent host) | `two-wave-parallel` (`deep` with subagents)
- **User Approval Status:** `Approved` | `Approved with defaults` *(timestamp or turn note)*

## 2. Recon Snapshot (Grounded Ground Truth)
- **Target Workspace Stack (`detect_stack.mjs`):** `<e.g., Next.js 15 App Router + Tailwind CSS v4 + shadcn/ui | Greenfield Vanilla ESM>`
- **Existing Routes / Logic to Preserve:** `<List routes, API handlers, or components that must remain unbroken, or "None (greenfield)">`
- **Inspiration Reference(s) (`inspect_site.mjs` `reconDigest` + `.unslop/inspect/reference-tokens.json`):**
  - **URL(s):** `<https://... or user screenshots>`
  - **Extracted Palette & Polarity:** `<topPaletteHexes, light/dark polarity, canvas/surface/accent %>`
  - **Extracted Typography:** `<primaryFonts, headingWeight (400/500 vs bold), displayTracking, commercialFontHints>`
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

## 5. Priority Sections & Animations (Keep / Adapt / Drop)
Tie every extracted band or kinetic mechanic explicitly to the user's product truth:

| Extracted Reference Band / Mechanic | Decision (`Keep / Adapt` / `Merge` / `Drop`) | Target Implementation Notes |
| :--- | :--- | :--- |
| `<e.g., 48px Frosted Nav + Search Flyouts>` | `Keep / Adapt` | `<Search filters real catalog; Esc dismisses>` |
| `<e.g., 2-Column Promo Grid>` | `Keep / Adapt` | `<Collapses 2→1 on mobile 390px>` |
| `<e.g., Third-party customer logo strip>` | `Drop` | `<No verified logos supplied>` |

## 6. Section Rhythm & Geometry Contract
Lock structural cadence, token discipline, and anti-slop geometry rules before authoring `DESIGN.md` or components (reference [`type-pairings.md`](type-pairings.md) and [`craft-primitives.md`](craft-primitives.md)):

### A. Aligned Reference Tokens Lock (`reference-tokens.json`)
- **Measured Polarity & Canvas Discipline:** `<Light-first (#FFFFFF / #FAF9F6, 80–93% area) | Warm-charcoal dark (#151414 canvas / #F0E3DE headings / #302E2D borders) | Reference-matched>`
- **Primary / Elevated Backgrounds:** `<--bg-canvas: #..., --bg-surface: #..., --bg-recessed: #...>`
- **Accent Area Budget:** `<--accent-primary: #..., target < 5% (or reference-measured %)>`
- **Typography Lock:** `<Curated pairing from type-pairings.md — e.g., Figtree 400/500 + JetBrains Mono | Instrument Serif + Geist + JetBrains Mono>`
- **Heading Weight & Tracking:** `<h1/h2 weight: 400 or 500 (never 700/800 unless measured in reference-tokens.json); display tracking: -0.025em to -0.04em; tabular-nums enabled>`
- **Extracted Modal Radii:** `<Measured reference radii from reference-tokens.json, or "Greenfield — locked below">`

### B. Alternating Section Rhythm Rule (Zero `> 2` Consecutive Centered Sections)
Map every kept band to an explicit layout archetype so adjacent bands alternate visual weight, alignment, and density:

| Band # | Section Role | Layout Pattern & Alignment | Surface / Divider Treatment | Target Module / Anchor |
| :--- | :--- | :--- | :--- | :--- |
| **1** | `<Hero / Primary Focus>` | `<e.g., Left Editorial + Right Interactive>` | `<Canvas + optional 2% SVG noise grain on accent panel>` | `<#hero>` |
| **2** | `<Workflow / Architecture>` | `<e.g., Sticky Numbered Flow / Asymmetric 5-7 Split>` | `<Edge-to-edge 1px hairline border>` | `<#workflow>` |
| **3** | `<Proof / Live Telemetry>` | `<e.g., Full-Bleed Accent Telemetry + SVG/Canvas Curve>` | `<Solid accent or recessed surface + 2% SVG grain>` | `<#telemetry>` |
| **4** | `<Capabilities / Matrix>` | `<e.g., Edge-to-Edge Hairline Bento / 1px Grid>` | `<Shared 1px border dividers, 0px–4px inner rules>` | `<#capabilities>` |

### C. Strict 3-Radius Budget
Lock exactly three semantic radius tokens across the entire codebase (zero ad-hoc `rounded-2xl` / `rounded-3xl` drift):
- **`--r-card`:** `<e.g., 0px | 4px | 8px>` *(outer panels/cards/bento cells)*
- **`--r-control`:** `<e.g., 4px | 6px>` *(buttons, inputs, terminal status bars, tabs)*
- **`--r-media`:** `<e.g., 4px | 8px>` *(editorial images, canvas frames, interactive preview wells)*

### D. Navbar Purity Rule
- **Primary Header Budget:** Maximum **5 primary nav links** + **1 primary CTA** (plus optional compact search trigger).
- **Utility Toggle Placement:** Move **Theme (Light/Dark)** and **Motion (On/Reduced)** toggles into `<footer>` or the `Cmd+K` command palette — **never** render utility switches or pill clusters inside the primary top navbar header.

### E. Anti-Void Card Rule
- **Banned Empty Stretch:** Never apply `justify-content: space-between` on any card or grid cell `> 320px` tall unless a real middle visual artifact (e.g., live SVG curve, notification banner, terminal status bar, or structured spec matrix) fills the card body cleanly.

## 7. Interactive Requirements
Check every stateful surface that must work end-to-end (implement using [`interactive-component-patterns.md`](interactive-component-patterns.md)):
- [ ] **Command Palette / Search (`Cmd+K`):** `<Indexed entities, shortcuts & Theme/Motion actions>`
- [ ] **Navigation / Mega-Menu & Mobile Drawer:** `<Max 5 links + 1 CTA, collapse behavior>`
- [ ] **Filterable Catalog / Configurator / Detail Drawer:** `<Filter facets, variants, live state>`
- [ ] **Pricing Toggle / Trade-In / Usage Calculator:** `<Inputs & exact formula>`
- [ ] **Multi-Step Validated Form:** `<Steps, validation rules, confirmation state>`
- [ ] **Slide-Over Cart / Action Drawer:** `<Line items, quantities, totals>`
- [ ] **Global Controls (`<footer>` / `Cmd+K` only):** `<Light/Dark theme toggle + Motion On/Off toggle>`

## 8. Content, Media & No-Fabrication Redlines
- **Asset Strategy:** `<Existing repo assets | User-supplied | Synthesize cohesive studio batches | Lightweight CSS/SVG (fast mode)>`
- **Out of Scope:** `<Features, backend integrations, or routes explicitly excluded from this pass>`
- **No-Fabrication Redlines:**
  - Zero `lorem ipsum`, placeholder company names, or copied brand marks/slogans from inspiration URLs.
  - Zero invented customer metrics, logos, certifications, uptime claims, or testimonials not provided above.
  - Zero dead interactive controls—every visible button, tab, filter, and modal trigger must perform a real state transition or be omitted.
