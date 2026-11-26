# Typography Pairings & Optical Craft Registry

Typography carries structural authority before a single card or shader renders. Lock one curated pairing in `.unslop/DESIGN.md` (or `.unslop/brief.md` in `fast` mode), paired with strict optical CSS rules and `display=swap`.

---

## 1. Two-Tier Precedence: Universal Laws vs. Context-Driven Selection

Separate non-negotiable optical craft from brand- and reference-driven voice so every build feels tailored rather than stamped from a single template:

### Tier 1 — Universal Typographic Craft Laws (Always Enforced)
1. **Hard-Ban Generic Font Defaults:** Never default to `Inter`, `Plus Jakarta Sans`, `Space Grotesk`, `Poppins`, or `Roboto` unless `.unslop/inspect/reference-tokens.json` proves the user's inspiration URL renders them in computed styles (or the user explicitly requests them in writing).
2. **Optical Sizing:** Always set `font-optical-sizing: auto;` on `html` / `body` and variable serif/sans display faces (`Newsreader`, `Source Serif 4`, `DM Sans`).
3. **Restrained Display Weights (`400`–`500`):** Set `h1` and `h2` at `font-weight: 400` or `500` (`400` for high-contrast editorial serifs; `500` for technical neo-grotesks). **Never** default to bloated `700`/`800` display headlines unless `reference-tokens.json` explicitly measures heavy display weights on the inspiration URL.
4. **Negative Display Tracking:** Tighten letter-spacing as scale grows:
   - Hero `h1` (`>= 2.75rem`): `letter-spacing: -0.035em; line-height: 1.04;`
   - Section `h2` (`1.75rem–2.5rem`): `letter-spacing: -0.025em; line-height: 1.12;`
   - Uppercase micro-labels (`0.72rem–0.75rem`): `letter-spacing: 0.08em; font-weight: 500;`
5. **Tabular Numerals & Non-Wrapping Mono:** Enforce `font-variant-numeric: tabular-nums;` on every price, metric counter, countdown/timer, telemetry table, and timestamp. Keep inline monospace status bars and badges `white-space: nowrap`.

### Tier 2 — Reference-Driven & Mood-Driven Selection (Overrides Generic Defaults)
Choose the registry by matching the **inspected reference site + brand mood** (recorded in `.unslop/brief.md` Section 1 & Section 7):

| Reference / Brand Context | Default Registry & Rule | Why |
| :--- | :--- | :--- |
| **Technical, Infrastructure, Developer Tools, Cloud/Systems** *(or any reference using pure neo-grotesk + mono)* | **Registry B (Infrastructure Neo-Grotesk, `500` display + `400` body + Mono)** — do **NOT** forcibly inject an editorial serif | Preserves crisp architectural precision and reference lineage without costume-serif friction |
| **Expressive, Editorial, Publishing, Lively, Colorful, or Consumer Storytelling Brands** *(or serif-led references)* | **Registry A (Sharp Editorial Serif + Calm Sans + Mono)** | Unlocks editorial warmth, italic contrast (`<em>`), and cultural personality |
| **Hardware Instruments, Minimalist Utilities, Swiss Architectural Studios** | **Registry C (Geometric/Grotesk Instrument + Tabular Mono)** | Balances neutral industrial proportions with clean uppercase micro-labels |
| **Explicit User Font Request** | **User-specified family** *(still governed by Tier 1 optical CSS, tracking, and tabular-nums)* | User intent always wins over registry presets |

```css
:root {
  --font-display: 'Figtree', ui-sans-serif, system-ui, sans-serif;
  --font-sans: 'Figtree', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
}

html {
  font-family: var(--font-sans);
  font-optical-sizing: auto;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

h1, h2, .display-heading {
  font-family: var(--font-display);
  font-weight: 500;
  letter-spacing: -0.03em;
  line-height: 1.06;
  text-wrap: balance;
}

.tabular, time, [data-metric], table td[data-numeric] {
  font-variant-numeric: tabular-nums;
}
```

---

## 2. Curated Registries & Ready-to-Copy Import URLs

### Registry A — Sharp Editorial Serif *(Expressive, Editorial, Publishing, Lively / Colorful Brands)*
Avoid raw unstyled system `Times New Roman`. Pair high-contrast editorial serifs with calm neutral sans UI and crisp technical monospace. Use when the brand mood is editorial, expressive, cultural, or lively — or when the reference site pairs serif display with clean sans UI.

- **Option A1 (Crisp Display Contrast):**
  - **Display:** `Instrument Serif` (`400` + `italic 400` for single-phrase emphasis, `font-weight: 400`, `-0.025em` to `-0.035em` tracking)
  - **UI & Body:** `Figtree` (`400`, `500`) or `Geist` (`400`, `500`)
  - **Mono / Telemetry:** `JetBrains Mono` (`400`, `500`)
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap"
    rel="stylesheet"
  />
  ```

- **Option A2 (Warm Long-Form Optical Serif):**
  - **Display:** `Newsreader` (`400..500`, `italic 400..500`, optical size `6..72`, `-0.03em` tracking) or `Source Serif 4` (`400..500`, `italic 400..500`, optical size `8..60`)
  - **UI & Body:** `Geist` (`400`, `500`) or `Figtree` (`400`, `500`)
  - **Mono / Telemetry:** `IBM Plex Mono` (`400`, `500`) or `JetBrains Mono` (`400`, `500`)
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500&family=IBM+Plex+Mono:wght@400;500&family=Newsreader:ital,opsz,wght@0,6..72,400..500;1,6..72,400..500&display=swap"
    rel="stylesheet"
  />
  ```
  *(Swap `Newsreader` with `Source+Serif+4:ital,opsz,wght@0,8..60,400..500;1,8..60,400..500` when a sturdier book-weight serif fits dense documentation or essays.)*

---

### Registry B — Infrastructure Neo-Grotesk *(Default for Technical, Infrastructure & Pure-Sans References)*
Captures the tight architectural precision of modern neo-grotesks paired with clean monospace telemetry. Default here for developer infrastructure, API platforms, operational consoles, observability suites, and technical product sites — keep headlines crisp at **`500`** without injecting an unrequested serif.

- **Option B1 (Google Fonts Direct):**
  - **Display & UI:** `Figtree` (`400`, `500` — set display `h1`/`h2` strictly at **`500`** with `-0.03em` tracking; **never** `700`/`800`)
  - **Mono / Telemetry:** `JetBrains Mono` (`400`, `500`)
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap"
    rel="stylesheet"
  />
  ```

- **Option B2 (Fontshare Neo-Grotesk + Google Fonts Mono):**
  - **Display & UI:** `Switzer` (`400`, `500`) or `General Sans` (`400`, `500`) via Fontshare (`h1`/`h2` at `500`, `-0.03em` to `-0.035em` tracking)
  - **Mono / Telemetry:** `JetBrains Mono` (`400`, `500`)
  ```html
  <link rel="preconnect" href="https://api.fontshare.com" />
  <link
    href="https://api.fontshare.com/v2/css?f[]=switzer@400,500&f[]=general-sans@400,500&display=swap"
    rel="stylesheet"
  />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap"
    rel="stylesheet"
  />
  ```
  *(Load only `switzer@400,500` OR `general-sans@400,500` in production so unused families never inflate font payload.)*

---

### Registry C — Minimalist / Hardware Instrument & Swiss Architectural Studio
Neutral, crisp geometric/grotesque geometry with industrial micro-labels (`0.72rem`, uppercase, `0.08em` tracking) and tabular readouts. Ideal for hardware instruments, minimalist utilities, architectural portfolios, and design-system studios.

- **Display & UI:** `DM Sans` (`400`, `500`) or `IBM Plex Sans` (`400`, `500`)
- **Mono / Readouts:** `JetBrains Mono` (`400`, `500`, `font-variant-numeric: tabular-nums`)
- **Optional Editorial Accent (Swiss Studio):** Pair `Instrument Serif` (`400`, italic `400`) on pull-quotes alongside `DM Sans` (`400`, `500`) UI chrome when the brand mood leans editorial.
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;1,9..40,400&family=IBM+Plex+Sans:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap"
    rel="stylesheet"
  />
  ```
  *(Import only the single chosen UI sans — `DM Sans` or `IBM Plex Sans` — alongside `JetBrains Mono`.)*

---

## 3. Proprietary Font Substitution Table

When `.unslop/inspect/report.json` or `.unslop/inspect/reference-tokens.json` flags self-hosted or commercial typefaces, map to these open-source equivalents while matching measured weights and negative tracking:

| Commercial / Self-Hosted Font | Open-Source Replacement | CSS Calibration Notes |
| :--- | :--- | :--- |
| `FT Kunst Grotesk` | `Figtree` (`500` display, `400` body) or `Switzer` | Set `h1`/`h2` at `500` with `-0.03em` tracking; never jump to `700` |
| `STK Bureau Sans` | `Figtree` (`500`) or `Switzer` (`500`) | Keep technical neo-grotesk parity at `500`; add `Instrument Serif` only when brand mood is editorial |
| `Apercu Mono Pro` | `JetBrains Mono` (`400`, `500`) | Pair with `font-variant-numeric: tabular-nums` and `0.02em`–`0.06em` label tracking |
| `APK Protocol` / `Söhne` / `GT America` | `Figtree` (`400`, `500`), `Geist`, or `Switzer` | Preserve `-0.025em` to `-0.035em` display tracking and `1.55` body leading |
| `Founders Grotesk` / `Favorit` | `General Sans` or `DM Sans` (`400`, `500`) | Keep headings crisp at `500` with `font-optical-sizing: auto` |
| `KH Teka Mono` / `Berkeley Mono` | `JetBrains Mono` or `IBM Plex Mono` (`400`, `500`) | Enforce `white-space: nowrap` on inline status pills and terminal bars |
| `Tiempos` / `Editorial New` | `Instrument Serif` (`400`, italic `400`) or `Newsreader` (`400..500`) | Use italic cut sparingly for single-phrase contrast inside upright headlines |

---

## 4. Offline / Zero-CDN Fallback Policy

Only omit Google Fonts / Fontshare `<link>` tags when the target environment forbids external CDNs or requires air-gapped self-hosting:
- **Self-Hosted Preference:** Bundle `.woff2` subsets (`@fontsource/figtree`, `@fontsource/instrument-serif`, `@fontsource/jetbrains-mono`, etc.) locally rather than reverting to unstyled `Arial` / `Times New Roman`.
- **Last-Resort System Stack:** If zero font assets may be bundled, use `ui-sans-serif, system-ui, 'Segoe UI', sans-serif` with strict `-0.03em` display tracking and `font-weight: 500` so typographic hierarchy still holds.
