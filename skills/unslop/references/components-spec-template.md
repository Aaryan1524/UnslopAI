# `COMPONENTS.md` — Modular Architecture & Motion Blueprint

Author this file alongside `DESIGN.md` **before** building UI components. Every band/view observed in the inspiration inspection (`report.json`, `components/*.png`, `shaders.json`, `css-motion.json`, `rea-report.json`)—or every screen being refactored in `unslop-existing` mode—must map 1-to-1 to a dedicated modular file, exact behavior contract, cohesive media assets, and verification criteria.

**Never compress a complex multi-band or kinetic UI into one monolithic HTML file.** Separate tokens, layout, shaders/motion, domain data, and each major component into clean modules so any model can build, debug, and refine one component at a time without losing craft.

---

## 1. Modular Directory Layout (Adapt to Target Framework: Vanilla ESM / React / Vue / Next.js)

```text
src/
├── main.js (or App.tsx)          # App bootstrap, global MotionController, component wiring
├── styles/
│   ├── tokens.css                # Semantic colors, typography scale, spacing, radii, motion tokens
│   ├── layout.css                # Grid cadence, accessibility rings, responsive collapse rules
│   └── motion.css                # Keyframes, @supports(animation-timeline) rules, reduced-motion overrides
├── motion/
│   └── MotionController.js       # Single source of truth for OS reduced-motion + interactive Motion toggle
├── shaders/ (only if needed)     # Bespoke WebGL2/GLSL shaders or Canvas 2D visual engines
├── data/                         # Original domain copy, catalog items, specs, search index
└── components/                   # One focused module per chrome surface, content band, and dialog
```

---

## 2. Domain-Agnostic Component Blueprint Template

Fill one row for **each actual component/band** required by the user's product and inspiration structure (whether 3 bands for a SaaS tool, a sidebar + data workbench for a dashboard, or 6 kinetic bands for an editorial landing page):

| # | Band / Surface | Inspiration Signal or Audit Finding | Target Module File | Mechanics, States & Motion Contract | Visual Assets Needed | Verification Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **0** | App Shell / Header | `<header>`, nav menus, search, theme/motion toggle | `src/components/SiteHeader.*` | Default / scrolled / mobile drawer / keyboard `Esc` & focus rings | Brand mark SVG | Dropdowns, search, `>=44px` mobile targets, zero overflow |
| **1** | `<Primary Band>` | `<Observed layout, shader, or layout defect>` | `src/components/<Band1>.*` | `<Exact grid/motion/interaction spec + mobile collapse>` | `<Cohesive photos / shader / SVG>` | `<Specific audit & visual bar>` |
| **2** | `<Band 2>` | `<...>` | `src/components/<Band2>.*` | `<...>` | `<...>` | `<...>` |
| **N** | Dialogs / Footer | `<Modals, forms, footer landmarks>` | `src/components/FooterModals.*` | Open/validate/close via `Esc`/backdrop + focus restoration | Brand mark SVG | Form feedback, contrast `>=4.5:1`, clean responsive stack |

---

## 3. Illustrative Example (Kinetic Editorial Landing Page)

> *Illustrative only—do NOT force these bands onto dashboards, docs, or minimalist apps whose inspiration uses a different architecture.*

| Band | Observed Inspiration Pattern | Modular Component | Key Motion & QA Bar |
| :--- | :--- | :--- | :--- |
| Hero | WebGL atmospheric canvas + CSS `view-timeline` recede | `HeroStage` + `shaders/` | Non-blank WebGL2 frame, cursor response, fallback BG color behind text, reduced-motion static frame |
| Editorial Feed | Asymmetric sticky lead + scrolling secondary stack | `EditorialGrid` | Cohesive color-graded imagery, `aspect-ratio` lock, clean mobile single-column stack |
| Sticky 3D Showcase | Tall sticky track (`~3600px`) flying cards from 3D blur → grid | `ScrollFlightGrid` | 4 distinct scroll states (`t0 → t3`), settled `opacity: 1`, clickable detail drawer |
| Stacking Deck | Sticky sequential cards compressing `--stack-scale` & `--stack-blur` | `StackingCardDeck` | Progressive scale compression, sharp active foreground card |
| Converge / Flip Stage | Sticky row converging to center + `180° rotateY` emblem reveal | `ConvergeFlipStage` | `perspective` + `preserve-3d` + `backface-visibility: hidden`, paced evenly across `t0 → t3` |
| Ambient Media Split | Editorial manifesto + looping media player | `AmbientFilmCard` | 60fps Canvas cinema loop with accessible Play/Pause + reduced-motion freeze |
