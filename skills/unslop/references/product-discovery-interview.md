# Product Discovery Interview & Content Inventory Protocol

Run this bounded intake **before** drafting `PRODUCT_BRIEF.md`, `DESIGN.md`, or `COMPONENTS.md`. Good visual craft cannot rescue vague product positioning or fabricated placeholder copy.

---

## 1. Existing-Repo Content Inventory Rule (Always Run First)

When working inside an existing codebase (`unslop-existing` or `hybrid` mode), **inspect the repository before asking the user questions**:

1. Run `node <skill-dir>/scripts/detect_stack.mjs <targetDir>` to capture framework, router, styling system, existing CSS tokens, route files, and asset directories.
2. Read existing copy and product truth from `README.md`, route pages, `src/data/*`, CMS schemas, pricing constants, localization files, and `public/` assets.
3. Extract a factual **Content Inventory** (real product name, existing offerings, verified specs, route URLs, brand marks, photography, and working API/form endpoints).
4. **Pre-fill answers** from repo truth and ask the user **only** the remaining unanswered questions. Never ask the user to repeat facts already documented in the repository.

---

## 2. Bounded 5-Question Intake Protocol

Ask **at most 5 focused questions in a single concise turn** (skip any question already answered by the prompt or repository). Do not drag discovery across multiple back-and-forth rounds.

| # | Discovery Axis | Core Question to Ask | What It Locks Down |
| :--- | :--- | :--- | :--- |
| **1** | **ICP & Core User Job** | Who is the primary visitor (role, context, technical fluency), and what single job are they trying to complete on this page/app? | Information hierarchy, reading density, vocabulary, and above-the-fold headline focus |
| **2** | **Real Product Proof & Differentiators** | What 2–4 concrete capabilities, specifications, or verified proof points distinguish this product from generic alternatives? | Band selection, feature architecture, and authentic technical or editorial proof |
| **3** | **Primary Conversion Flow** | What is the primary user action (e.g., interactive trial, booking/cart checkout, waitlist, demo request, documentation jump) and secondary fallback action? | CTA hierarchy, form/drawer mechanics, and header/footer conversion capture |
| **4** | **Required Interactive Components** | Beyond static reading, which interactive surfaces must actually work (e.g., `Cmd+K` search, filterable catalog, pricing calculator, multi-step form, slide-over drawer, theme/motion toggle)? | State machines in `COMPONENTS.md` and interactive QA checks in `audit_ui.mjs` |
| **5** | **Real Assets, Palette & Tone Constraints** | Do you have existing brand marks, product screenshots, photography, or non-negotiable palette/tone rules—or should visual assets be synthesized cleanly to match the target direction? | Media strategy, art-direction brief, and explicit brand constraints |

---

## 3. No-Fabrication & Assumption Hygiene

- **Never invent factual claims:** Do not fabricate customer counts, uptime SLAs, security certifications, customer logos, testimonials, pricing numbers, or founder quotes.
- **Handling missing data:** When real numbers or testimonials are not supplied, either omit the social-proof band entirely (see [`inspiration-translation-matrix.md`](inspiration-translation-matrix.md)) or replace it with verifiable product architecture, interactive demos, or clearly labeled structural slots documented in `PRODUCT_BRIEF.md`.
- **Single-pass confirmation:** Once answers are received (or derived from an existing repository), record them immediately in `PRODUCT_BRIEF.md` using [`product-brief-template.md`](product-brief-template.md) and proceed directly to forensic inspection and design contracts.
