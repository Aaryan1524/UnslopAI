# Curated Typography Pairings

Never default to raw unstyled `Inter` / `Arial` / generic bold system serif unless the user explicitly requires an offline/zero-CDN build. Always include `font-display=swap` (via Google Fonts) paired with sensible fallback metrics.

## 1. Editorial Craft & Developer Tooling (Warm Paper or Espresso Dark)
- **Display:** `Newsreader` (weights `400`, `500`, italic `400/500`, tight `-0.03em` tracking; ideal for single-word italic accent emphasis like `<em>Crafted</em>`)
- **UI & Body:** `Plus Jakarta Sans` (`400`, `500`, `600`, `700`)
- **Mono / Telemetry:** `JetBrains Mono` (`400`, `500`)
- **Google Fonts Import:**
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Newsreader:ital,opsz,wght@0,6..72,400..500;1,6..72,400..500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  ```

## 2. Swiss Architectural & Creative Studio
- **Display:** `Instrument Serif` (`400`, italic `400`, `-0.025em` tracking) or `Syne` (`600`, `700`)
- **UI & Body:** `DM Sans` or `Instrument Sans` (`400`, `500`, `600`)
- **Mono:** `IBM Plex Mono` (`400`, `500`)

## 3. High-Precision SaaS / Engineering Console
- **Display & UI:** `Space Grotesk` (`500`, `600`, `700`) paired with `Plus Jakarta Sans` or `IBM Plex Sans` (`400`, `500`, `600`)
- **Mono / Readouts:** `JetBrains Mono` or `IBM Plex Mono` with `font-variant-numeric: tabular-nums`

## 4. Minimalist / Warm Hardware Instrument
- **Display & Labels:** `IBM Plex Sans` (`500`, `600`, uppercase micro-labels at `0.72rem` + `0.08em` tracking)
- **Readouts:** `JetBrains Mono` (`font-variant-numeric: tabular-nums`)

## Proprietary Font Substitution Guide
When `inspect_site.mjs` flags commercial/self-hosted fonts:
- `APK Protocol` / `Söhne` / `GT America` -> `Plus Jakarta Sans` or `Instrument Sans` (or `Space Grotesk` for tight technical displays)
- `KH Teka Mono` / `Berkeley Mono` -> `JetBrains Mono` or `IBM Plex Mono`
- `Tiempos` / `Editorial New` -> `Newsreader` or `Instrument Serif`
