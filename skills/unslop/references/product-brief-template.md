# `PRODUCT_BRIEF.md` Template

Author this file at the project root (or feature directory) immediately after intake and stack detection, **before** writing `DESIGN.md` and `COMPONENTS.md`. Every band, headline, pricing tier, and interactive control in the build must trace back to this brief or verified repository content.

---

## 1. Product Identity
- **Product / Brand Name:** `<Official product name>`
- **Category & Positioning:** `<One-sentence factual description of what it does>`
- **Engagement Mode:** `unslop-existing` | `inspiration-remix` | `hybrid`
- **Target Stack (from `detect_stack.mjs`):** `<e.g., Next.js App Router + Tailwind CSS v4 + TypeScript>`
- **Brand Voice & Tone:** `<e.g., precise technical editorial / calm architectural / direct pragmatic>`

## 2. Target Audience (ICP)
- **Primary Visitor:** `<Role, team size, domain context>`
- **Core Job-to-Be-Done:** `<Specific outcome the visitor wants within 60 seconds>`
- **Key Objections to Resolve:** `<e.g., migration effort, pricing clarity, latency, compliance>`
- **Device & Environment Reality:** `<e.g., 70% desktop engineering workstation + 30% mobile review>`

## 3. Real Offerings, Capabilities & Tiers
List only verified capabilities, plans, or catalog items. Remove unused rows rather than filling them with guesses.

| Offering / Tier / Module | Core Scope & Verified Specs | Differentiator / Proof Point | Target Route or Anchor |
| :--- | :--- | :--- | :--- |
| `<Offering 1>` | `<Concrete capabilities>` | `<Measurable or architectural proof>` | `<e.g., /#platform or /pricing>` |
| `<Offering 2>` | `<Concrete capabilities>` | `<Measurable or architectural proof>` | `<e.g., /catalog>` |
| `<Offering 3>` | `<Concrete capabilities>` | `<Measurable or architectural proof>` | `<e.g., /enterprise>` |

## 4. Conversion Goals & User Flows
- **Primary Action:** `<Exact CTA label, destination route/drawer, and completion state>`
- **Secondary Action:** `<Lower-commitment path, e.g., interactive sandbox, docs, pricing breakdown>`
- **Success & Validation States:** `<What confirms completion—inline confirmation, drawer receipt, route redirect>`

## 5. Interactive Requirements
Check and specify every stateful surface that must function end-to-end (implement using [`interactive-component-patterns.md`](interactive-component-patterns.md)):
- [ ] **Command Palette / Search (`Cmd+K`):** `<Indexed entities & keyboard shortcuts>`
- [ ] **Navigation / Mega-Menu:** `<Top-level sections & mobile drawer structure>`
- [ ] **Filterable Catalog + Detail Drawer:** `<Filter facets, sort order, drawer fields>`
- [ ] **Pricing Toggle & Calculator:** `<Billing intervals, usage sliders, exact formula>`
- [ ] **Multi-Step Validated Form:** `<Steps, required fields, validation rules, submit behavior>`
- [ ] **Slide-Over Cart / Booking Drawer:** `<Line items, quantity controls, totals, empty state>`
- [ ] **Global Controls:** `<Theme toggle light/dark contrast requirement, Motion On/Off toggle>`

## 6. Content & Asset Inventory
Record what already exists vs. what must be produced cleanly:

| Asset / Content Slot | Source Status (`Existing` / `User-Supplied` / `Synthesize`) | Path or Notes |
| :--- | :--- | :--- |
| Brand mark & favicon | `<Existing / Synthesize>` | `<e.g., public/logo.svg>` |
| Hero visual / shader / media | `<Existing / Synthesize>` | `<e.g., procedural WebGL2 surface or user photo>` |
| Product screenshots / diagrams | `<Existing / User-Supplied / Synthesize>` | `<Exact paths or art-direction constraints>` |
| Domain copy & structured data | `<Existing / Brief-Derived>` | `<e.g., src/data/catalog.ts>` |
| Existing routes & API contracts | `<Preserve as-is>` | `<List routes/endpoints that must remain unbroken>` |

## 7. Explicit Non-Goals & No-Fabrication Redlines
- **Out of Scope:** `<Features, backend integrations, or routes explicitly excluded from this pass>`
- **No-Fabrication Redlines:**
  - Zero `lorem ipsum`, placeholder company names, or copied brand names/slogans from inspiration URLs.
  - Zero invented customer metrics, logos, certifications, uptime claims, or testimonials not provided in Sections 3 or 6.
  - Zero dead interactive controls—every visible button, tab, filter, and modal trigger must perform a real state transition or be omitted.
