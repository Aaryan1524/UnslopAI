# Curated Typography Guide

> **Primary Typography Registry:** Load [`type-pairings.md`](type-pairings.md) for the complete curated pairings, ready-to-copy Google Fonts / Fontshare `<link>` snippets, optical CSS rules, and proprietary font substitution table.

---

## Core Rules (Synced with [`type-pairings.md`](type-pairings.md))

1. **Banned Default Sans Families:** Never default to `Inter`, `Plus Jakarta Sans`, `Space Grotesk`, `Poppins`, or `Roboto` unless `.unslop/inspect/reference-tokens.json` proves the inspiration URL renders them in computed styles (or the user explicitly requests them).
2. **Strict Optical CSS Rules:**
   - Enable `font-optical-sizing: auto` across body and optical display faces.
   - Set display headlines (`h1` / `h2`) at **`400`–`500`** medium weights (never bloated `700`/`800` defaults) with tight negative display tracking (`-0.025em` to `-0.04em`).
   - Enforce `font-variant-numeric: tabular-nums` on every price, metric, timer, counter, and telemetry readout.
   - Always include `display=swap` on webfont imports paired with calibrated system fallback stacks.

---

## Quick Selection Matrix

| Aesthetic Direction | Display & Emphasis | UI & Body | Mono / Telemetry | Full Import & Rules |
| :--- | :--- | :--- | :--- | :--- |
| **Sharp Editorial Serif** | `Instrument Serif` (`400`, `italic 400` on emphasis phrases) or `Newsreader` / `Source Serif 4` (`400..500`) | `Geist` or `Figtree` (`400`, `500`) | `JetBrains Mono` or `IBM Plex Mono` (`400`, `500`) | See Registry A in [`type-pairings.md`](type-pairings.md) |
| **Infrastructure Neo-Grotesk** | `Figtree` (`500`, `-0.03em` tracking) or `Switzer` / `General Sans` | `Figtree` (`400`, `500`) or `Switzer` | `JetBrains Mono` (`400`, `500`) | See Registry B in [`type-pairings.md`](type-pairings.md) |
| **Minimalist / Hardware Instrument & Swiss Studio** | `DM Sans` or `IBM Plex Sans` (`400`, `500`; optional `Instrument Serif` pull-quotes) | `DM Sans` or `IBM Plex Sans` (`400`, `500`) | `JetBrains Mono` (`400`, `500`, `tabular-nums`) | See Registry C in [`type-pairings.md`](type-pairings.md) |

For proprietary font mapping (`FT Kunst Grotesk`, `STK Bureau Sans`, `Apercu Mono Pro`, `Söhne`, `Tiempos`, etc.) and offline fallback stacks, follow [`type-pairings.md`](type-pairings.md#4-proprietary-font-substitution-table).
