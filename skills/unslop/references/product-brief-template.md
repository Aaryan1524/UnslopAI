# `.unslop/brief.md` Template

Author this spec at **`.unslop/brief.md`** at the end of Phase 0 (after silent recon and the request-specific adaptive Q&A) and get quick user approval **before** writing any application code. Every downstream phase—including Wave 1–3 parallel workers and the independent fresh-context reviewer—reads `.unslop/brief.md` as the single source of truth.

> **Workspace Hygiene:** Keep all scratch telemetry and contracts under `.unslop/` (`brief.md`, `stack-report.json`, `inspect/`, `DESIGN.md`, `COMPONENTS.md`, `audit/`) and recommend adding `.unslop/` to the target repository's `.gitignore`.

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
- **Inspiration Reference(s) (`inspect_site.mjs` `reconDigest`):**
  - **URL(s):** `<https://... or user screenshots>`
  - **Extracted Palette:** `<topPaletteHexes>`
  - **Extracted Typography:** `<primaryFonts + commercialFontHints>`
  - **Extracted Structure & Motion:** `<sectionCount, sectionArchetypes, detectedInteractiveTriggers, hasWebGL / shaderCount, scrollTimelinesCount, mobileCollapsedCount>`

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
| `<e.g., 48px Frosted Nav + Search/Bag Flyouts>` | `Keep / Adapt` | `<Search filters real catalog; Esc dismisses>` |
| `<e.g., 2-Column Promo Grid>` | `Keep / Adapt` | `<Collapses 2→1 on mobile 390px>` |
| `<e.g., Third-party customer logo strip>` | `Drop` | `<No verified logos supplied>` |

## 6. Interactive Requirements
Check every stateful surface that must work end-to-end (implement using [`interactive-component-patterns.md`](interactive-component-patterns.md)):
- [ ] **Command Palette / Search (`Cmd+K`):** `<Indexed entities & shortcuts>`
- [ ] **Navigation / Mega-Menu & Mobile Drawer:** `<Top-level sections & collapse behavior>`
- [ ] **Filterable Catalog / Configurator / Detail Drawer:** `<Filter facets, variants, live state>`
- [ ] **Pricing Toggle / Trade-In / Usage Calculator:** `<Inputs & exact formula>`
- [ ] **Multi-Step Validated Form:** `<Steps, validation rules, confirmation state>`
- [ ] **Slide-Over Cart / Booking Drawer:** `<Line items, quantities, totals>`
- [ ] **Global Controls:** `<Light/Dark theme toggle + Motion On/Off toggle>`

## 7. Content, Media & No-Fabrication Redlines
- **Asset Strategy:** `<Existing repo assets | User-supplied | Synthesize cohesive studio batches | Lightweight CSS/SVG (fast mode)>`
- **Out of Scope:** `<Features, backend integrations, or routes explicitly excluded from this pass>`
- **No-Fabrication Redlines:**
  - Zero `lorem ipsum`, placeholder company names, or copied brand marks/slogans from inspiration URLs.
  - Zero invented customer metrics, logos, certifications, uptime claims, or testimonials not provided above.
  - Zero dead interactive controls—every visible button, tab, filter, and modal trigger must perform a real state transition or be omitted.
