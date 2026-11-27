#!/usr/bin/env node
/**
 * UnslopAI v2.0 — Phase 0.5 Hero Style Tile Generator & Verifier
 *
 * Generates a standalone, offline-safe HTML Style Tile containing 4 specimen panels:
 *   1. Live Hero Specimen (<= 4 nav links + 1 CTA, locked heading weight/tracking,
 *      1-line subcopy, primary/secondary controls, interactive telemetry proof canvas)
 *   2. Surface & WCAG AA Contrast Swatch Strip (live computed luminance ratios)
 *   3. Typography, Radius & Micro-UI Specimen (scale, tabular-nums, mono pill, radii)
 *   4. Motion Physics & Reduced-Motion Specimen (working [data-motion-toggle] freeze)
 *
 * Renders via Playwright (served from an ephemeral 127.0.0.1 HTTP server), captures
 * style-tile-desktop.png (1440x900) and style-tile-mobile.png (390x844), verifies
 * WCAG AA contrast, zero horizontal overflow, and canvas freeze on reduced-motion,
 * and writes style-tile-report.json.
 *
 * CLI:
 *   node skills/unslop/scripts/generate_style_tile.mjs [specJsonPath|--demo] [outputDir]
 */

import fs from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ensureDir, launchBrowser } from './browser_helper.mjs';

const DEFAULT_OUTPUT_DIR = './.unslop/style-tile';

const DEMO_SPEC = {
  productName: 'Vektor',
  category: 'Edge Telemetry Platform',
  eyebrow: 'EDGE TELEMETRY · P99 < 14MS',
  headline: 'Deterministic telemetry across every edge pop.',
  subcopy: 'Inspect tail latency, packet drift, and regional failover in one sub-millisecond surface.',
  navLinks: ['Platform', 'Telemetry', 'Docs', 'Pricing'],
  primaryCta: 'Start Free',
  secondaryCta: 'View Live Trace',
  statusPill: 'US-EAST-1 · 99.998% LIVE',
  polarity: 'light',
  palette: {
    canvas: '#FFFFFF',
    surface: '#FAF9F6',
    recessed: '#F2F0EC',
    border: '#E4E0D8',
    ink: '#151414',
    muted: '#57534E',
    accent: '#FF5E1F',
    accentAccessible: '#C83E00',
    onAccent: '#FFFFFF',
  },
  typography: {
    displayFont: 'Inter',
    bodyFont: 'Inter',
    monoFont: 'JetBrains Mono',
    headingWeight: 500,
    h1Size: '42px',
    h1Tracking: '-0.03em',
    h2Size: '22px',
    h2Tracking: '-0.02em',
    bodySize: '15px',
    loadGoogleFonts: true,
  },
  radii: {
    card: '4px',
    control: '9999px',
    media: '12px',
  },
  motifs: {
    dotMatrixGutter: true,
    dashedBlueprintRails: true,
    cornerRegistrationSquares: true,
    flatHairlineElevation: true,
  },
  proof: {
    title: 'Edge Latency Distribution',
    controlLabel: 'Traffic Load',
    initialLoad: 64,
    unit: 'ms',
  },
  motion: {
    easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    microDuration: '160ms',
    panelDuration: '280ms',
  },
};

/* -------------------------------------------------------------------------- */
/* Color & WCAG 2.1 Contrast Utilities                                        */
/* -------------------------------------------------------------------------- */

function normalizeHex(input, fallback = '#151414') {
  if (typeof input !== 'string') return fallback;
  const raw = input.trim();
  const shortMatch = raw.match(/^#([0-9a-f]{3})$/i);
  if (shortMatch) {
    const [r, g, b] = shortMatch[1].split('');
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  const fullMatch = raw.match(/^#([0-9a-f]{6})$/i);
  if (fullMatch) {
    return `#${fullMatch[1].toUpperCase()}`;
  }
  const rgbMatch = raw.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbMatch) {
    const toHex = (n) => Math.max(0, Math.min(255, Number(n))).toString(16).padStart(2, '0');
    return `#${toHex(rgbMatch[1])}${toHex(rgbMatch[2])}${toHex(rgbMatch[3])}`.toUpperCase();
  }
  return fallback;
}

function hexToRgb(hex) {
  const clean = normalizeHex(hex).slice(1);
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }) {
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${clamp(r)}${clamp(g)}${clamp(b)}`.toUpperCase();
}

function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const channel = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(hexA, hexB) {
  const l1 = relativeLuminance(hexA);
  const l2 = relativeLuminance(hexB);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

function mixHex(hexA, hexB, weightB) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const t = Math.max(0, Math.min(1, weightB));
  return rgbToHex({
    r: a.r * (1 - t) + b.r * t,
    g: a.g * (1 - t) + b.g * t,
    b: a.b * (1 - t) + b.b * t,
  });
}

function ensureAccessibleAgainst(fgHex, bgHex, targetRatio = 4.6) {
  let candidate = normalizeHex(fgHex);
  if (contrastRatio(candidate, bgHex) >= targetRatio) return candidate;
  const bgLum = relativeLuminance(bgHex);
  const targetTone = bgLum > 0.4 ? '#0E0D0C' : '#FFFFFF';
  for (let step = 1; step <= 20; step++) {
    const mixed = mixHex(candidate, targetTone, step * 0.05);
    if (contrastRatio(mixed, bgHex) >= targetRatio) return mixed;
  }
  return targetTone;
}

function pickBestOnColor(bgHex) {
  const light = '#FFFFFF';
  const dark = '#151414';
  return contrastRatio(light, bgHex) >= contrastRatio(dark, bgHex) ? light : dark;
}

/* -------------------------------------------------------------------------- */
/* Spec Normalization & reference-tokens.json Auto-Mapper                     */
/* -------------------------------------------------------------------------- */

function isReferenceTokensObject(obj) {
  if (!obj || typeof obj !== 'object') return false;
  const hasRefShape = Boolean(obj.surfaceRatio && (obj.typography || obj.geometryLock || obj.visualMotifs));
  const hasExplicitTileShape = Boolean(obj.palette && (obj.headline || obj.productName));
  return hasRefShape && !hasExplicitTileShape;
}

function cleanPrimaryFont(fontFamilyStr, fallback) {
  if (!fontFamilyStr || typeof fontFamilyStr !== 'string') return fallback;
  const first = fontFamilyStr
    .split(',')[0]
    .trim()
    .replace(/^["']|["']$/g, '');
  if (!first || /^(system-ui|-apple-system|sans-serif|serif|monospace|ui-sans-serif|ui-monospace)$/i.test(first)) {
    return fallback;
  }
  return first;
}

function mapReferenceTokensToStyleTile(tokens) {
  const polarity = tokens?.surfaceRatio?.dominantPolarity === 'dark' ? 'dark' : 'light';
  const topBgs = tokens?.surfaceRatio?.topBackgrounds || [];
  const topAccents = tokens?.surfaceRatio?.topAccents || [];
  const topBorders = tokens?.surfaceRatio?.topBorders || [];

  const defaultCanvas = polarity === 'dark' ? '#121211' : '#FFFFFF';
  const rawCanvas = normalizeHex(topBgs[0]?.hex || defaultCanvas, defaultCanvas);
  const canvasLum = relativeLuminance(rawCanvas);
  const actualDark = canvasLum < 0.25;

  const surface = topBgs[1]?.hex
    ? normalizeHex(topBgs[1].hex, actualDark ? '#1A1918' : '#FAF9F6')
    : mixHex(rawCanvas, actualDark ? '#FFFFFF' : '#151414', actualDark ? 0.05 : 0.025);

  const recessed = mixHex(surface, actualDark ? '#FFFFFF' : '#151414', actualDark ? 0.06 : 0.04);
  const border = topBorders[0]?.hex
    ? normalizeHex(topBorders[0].hex, actualDark ? '#2E2C29' : '#E4E0D8')
    : mixHex(rawCanvas, actualDark ? '#FFFFFF' : '#151414', actualDark ? 0.14 : 0.12);

  const ink = actualDark ? '#F5F3EE' : '#151414';
  const mutedBase = actualDark ? '#A8A29E' : '#57534E';
  const muted = ensureAccessibleAgainst(mutedBase, surface, 4.7);

  const rawAccent = normalizeHex(topAccents[0]?.hex || (actualDark ? '#FF6B2C' : '#FF5E1F'));
  const accent = ensureAccessibleAgainst(rawAccent, rawCanvas, 3.05);
  const accentAccessible = ensureAccessibleAgainst(rawAccent, surface, 4.7);
  const onAccent = pickBestOnColor(accentAccessible);

  const typo = tokens.typography || {};
  const geom = tokens.geometryLock || {};
  const motifs = tokens.visualMotifs || {};

  const displayFont = cleanPrimaryFont(typo.h1?.fontFamily || typo.loadedFontFamilies?.[0], DEMO_SPEC.typography.displayFont);
  const bodyFont = cleanPrimaryFont(typo.body?.fontFamily || displayFont, DEMO_SPEC.typography.bodyFont);
  const monoFont = cleanPrimaryFont(typo.code?.fontFamily, DEMO_SPEC.typography.monoFont);
  const headingWeight = Number(typo.h1?.fontWeight || typo.dominantHeadingWeight || 500);
  const h1Tracking =
    Number.isFinite(typo.h1?.letterSpacingEm) && typo.h1.letterSpacingEm !== 0
      ? `${typo.h1.letterSpacingEm}em`
      : '-0.03em';

  const cardRadius = geom.cardRadius || '4px';
  const controlRadius =
    motifs.pillPrimaryCtaDetected ? '9999px' : geom.buttonRadius || geom.inputRadius || '6px';
  const mediaRadius = geom.mediaRadius || cardRadius || '12px';

  const hostName = (() => {
    try {
      return tokens.url ? new URL(tokens.url).hostname.replace(/^www\./, '') : null;
    } catch {
      return null;
    }
  })();

  return {
    productName: hostName ? `${DEMO_SPEC.productName} (${hostName} tokens)` : DEMO_SPEC.productName,
    polarity: actualDark ? 'dark' : 'light',
    palette: {
      canvas: rawCanvas,
      surface,
      recessed,
      border,
      ink,
      muted,
      accent,
      accentAccessible,
      onAccent,
    },
    typography: {
      displayFont,
      bodyFont,
      monoFont,
      headingWeight: Math.max(300, Math.min(800, headingWeight)),
      h1Tracking,
    },
    radii: {
      card: cardRadius,
      control: controlRadius,
      media: mediaRadius,
    },
    motifs: {
      dotMatrixGutter: motifs.hasDotOrGridBackground ?? true,
      dashedBlueprintRails: motifs.hasVerticalGuideRails ?? true,
      cornerRegistrationSquares: true,
      flatHairlineElevation: geom.flatHairlineSystem ?? true,
    },
  };
}

function mergeSpec(rawSpec) {
  const base = structuredClone(DEMO_SPEC);
  if (!rawSpec || typeof rawSpec !== 'object') return base;

  const source = isReferenceTokensObject(rawSpec) ? mapReferenceTokensToStyleTile(rawSpec) : rawSpec;

  const merged = {
    ...base,
    ...source,
    navLinks: Array.isArray(source.navLinks) && source.navLinks.length > 0
      ? source.navLinks.slice(0, 4)
      : base.navLinks,
    palette: {
      ...base.palette,
      ...(source.palette || {}),
    },
    typography: {
      ...base.typography,
      ...(source.typography || {}),
    },
    radii: {
      ...base.radii,
      ...(source.radii || {}),
    },
    motifs: {
      ...base.motifs,
      ...(source.motifs || {}),
    },
    proof: {
      ...base.proof,
      ...(source.proof || {}),
    },
    motion: {
      ...base.motion,
      ...(source.motion || {}),
    },
  };

  // Normalize all palette hexes
  for (const key of Object.keys(merged.palette)) {
    merged.palette[key] = normalizeHex(merged.palette[key], base.palette[key]);
  }
  // If user specified custom accent without accentAccessible, derive a safe AA variant
  if (source.palette?.accent && !source.palette?.accentAccessible) {
    merged.palette.accentAccessible = ensureAccessibleAgainst(
      merged.palette.accent,
      merged.palette.surface,
      4.6,
    );
  }
  if (!source.palette?.onAccent) {
    merged.palette.onAccent = pickBestOnColor(merged.palette.accentAccessible);
  }

  return merged;
}

/* -------------------------------------------------------------------------- */
/* HTML Specimen Generator                                                    */
/* -------------------------------------------------------------------------- */

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildGoogleFontsTag(typography) {
  if (typography.loadGoogleFonts === false) return '';
  const safeGoogle = new Set([
    'Inter', 'Plus Jakarta Sans', 'Space Grotesk', 'DM Sans', 'Instrument Sans',
    'IBM Plex Sans', 'IBM Plex Mono', 'JetBrains Mono', 'Geist', 'Manrope',
    'Outfit', 'Sora', 'Syne', 'Fraunces', 'Newsreader', 'Instrument Serif',
    'Bricolage Grotesque', 'Source Serif 4', 'Fira Code', 'Work Sans',
  ]);
  const families = Array.from(
    new Set([typography.displayFont, typography.bodyFont, typography.monoFont]),
  ).filter((f) => safeGoogle.has(f));
  if (families.length === 0) return '';

  const query = families
    .map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700`)
    .join('&');
  // Non-blocking stylesheet load so offline renders never stall
  return `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${query}&display=swap" media="print" onload="this.media='all'">`;
}

function evaluatePaletteContrast(palette) {
  const checks = [
    { pair: 'ink / canvas', fg: palette.ink, bg: palette.canvas, threshold: 4.5, role: 'text' },
    { pair: 'ink / surface', fg: palette.ink, bg: palette.surface, threshold: 4.5, role: 'text' },
    { pair: 'ink / recessed', fg: palette.ink, bg: palette.recessed, threshold: 4.5, role: 'text' },
    { pair: 'muted / canvas', fg: palette.muted, bg: palette.canvas, threshold: 4.5, role: 'text' },
    { pair: 'muted / surface', fg: palette.muted, bg: palette.surface, threshold: 4.5, role: 'text' },
    { pair: 'accentAccessible / canvas', fg: palette.accentAccessible, bg: palette.canvas, threshold: 4.5, role: 'text' },
    { pair: 'accentAccessible / surface', fg: palette.accentAccessible, bg: palette.surface, threshold: 4.5, role: 'text' },
    { pair: 'onAccent / accentAccessible', fg: palette.onAccent, bg: palette.accentAccessible, threshold: 4.5, role: 'cta-text' },
    { pair: 'accent / canvas', fg: palette.accent, bg: palette.canvas, threshold: 3.0, role: 'ui-graphic' },
  ];

  return checks.map((c) => {
    const ratio = contrastRatio(c.fg, c.bg);
    return {
      ...c,
      ratio,
      grade: ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3.0 ? 'UI AA' : 'FAIL',
      passed: ratio >= c.threshold,
    };
  });
}

function buildStyleTileHtml(spec, specSource) {
  const p = spec.palette;
  const t = spec.typography;
  const r = spec.radii;
  const m = spec.motifs;

  const isDark = relativeLuminance(p.canvas) < 0.25;
  const dotColor = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(21,20,20,0.09)';
  const railColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(21,20,20,0.12)';
  const regMarkColor = isDark ? 'rgba(255,255,255,0.34)' : 'rgba(21,20,20,0.34)';

  const swatches = [
    { token: '--bg-canvas', label: 'Canvas', hex: p.canvas, against: p.ink, textHex: p.ink, ratioLabel: 'vs Ink' },
    { token: '--bg-surface', label: 'Surface', hex: p.surface, against: p.ink, textHex: p.ink, ratioLabel: 'vs Ink' },
    { token: '--bg-recessed', label: 'Recessed', hex: p.recessed, against: p.ink, textHex: p.ink, ratioLabel: 'vs Ink' },
    { token: '--text-primary', label: 'Primary Ink', hex: p.ink, against: p.canvas, textHex: pickBestOnColor(p.ink), ratioLabel: 'on Canvas' },
    { token: '--text-muted', label: 'Muted Ink', hex: p.muted, against: p.surface, textHex: pickBestOnColor(p.muted), ratioLabel: 'on Surface' },
    { token: '--accent-signal', label: 'Signal Accent', hex: p.accent, against: p.canvas, textHex: pickBestOnColor(p.accent), ratioLabel: 'UI on Canvas' },
    { token: '--accent-accessible', label: 'CTA Accent', hex: p.accentAccessible, against: p.canvas, textHex: p.onAccent, ratioLabel: 'AA on Canvas' },
  ].map((s) => {
    const ratio = contrastRatio(s.hex, s.against);
    const badge = ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3.0 ? 'UI' : 'LOW';
    return { ...s, ratio, badge };
  });

  const navLinksHtml = spec.navLinks
    .slice(0, 4)
    .map((label) => `<a class="hero-nav-link" href="#panel-hero">${escapeHtml(label)}</a>`)
    .join('\n              ');

  const swatchesHtml = swatches
    .map(
      (s) => `
          <div class="swatch-card" data-swatch-token="${escapeHtml(s.token)}" data-fg="${escapeHtml(s.hex)}" data-bg="${escapeHtml(s.against)}">
            <div class="swatch-chip" style="background:${escapeHtml(s.hex)};color:${escapeHtml(s.textHex)};">
              <span class="swatch-badge">${escapeHtml(s.badge)}</span>
            </div>
            <div class="swatch-meta">
              <div class="swatch-name">${escapeHtml(s.label)}</div>
              <div class="swatch-hex mono">${escapeHtml(s.hex)}</div>
              <div class="swatch-ratio mono" data-contrast-readout>${s.ratio.toFixed(2)}:1 · ${escapeHtml(s.ratioLabel)}</div>
            </div>
          </div>`,
    )
    .join('');

  const googleFontsTag = buildGoogleFontsTag(t);
  const specPayload = JSON.stringify({
    palette: p,
    proof: spec.proof,
    isDark,
  }).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="${escapeHtml(p.canvas)}">
  <title>${escapeHtml(spec.productName)} — UnslopAI Style Tile</title>
  ${googleFontsTag}
  <style>
    :root {
      --bg-canvas: ${p.canvas};
      --bg-surface: ${p.surface};
      --bg-recessed: ${p.recessed};
      --border-subtle: ${p.border};
      --text-primary: ${p.ink};
      --text-muted: ${p.muted};
      --accent-signal: ${p.accent};
      --accent-accessible: ${p.accentAccessible};
      --on-accent: ${p.onAccent};

      --font-display: "${escapeHtml(t.displayFont)}", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      --font-body: "${escapeHtml(t.bodyFont)}", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      --font-mono: "${escapeHtml(t.monoFont)}", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;

      --fw-heading: ${Number(t.headingWeight) || 500};
      --h1-size: ${escapeHtml(t.h1Size)};
      --h1-tracking: ${escapeHtml(t.h1Tracking)};
      --h2-size: ${escapeHtml(t.h2Size)};
      --h2-tracking: ${escapeHtml(t.h2Tracking)};
      --body-size: ${escapeHtml(t.bodySize)};

      --r-card: ${escapeHtml(r.card)};
      --r-control: ${escapeHtml(r.control)};
      --r-media: ${escapeHtml(r.media)};

      --ease-studio: ${escapeHtml(spec.motion.easing)};
      --dur-micro: ${escapeHtml(spec.motion.microDuration)};
      --dur-panel: ${escapeHtml(spec.motion.panelDuration)};

      --dot-color: ${dotColor};
      --rail-color: ${railColor};
      --reg-mark: ${regMarkColor};
    }

    *, *::before, *::after {
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      padding: 0;
      background-color: var(--bg-canvas);
      color: var(--text-primary);
      font-family: var(--font-body);
      font-size: var(--body-size);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      overflow-x: clip;
    }

    .mono {
      font-family: var(--font-mono);
      font-variant-numeric: tabular-nums;
    }

    .tabular {
      font-variant-numeric: tabular-nums;
    }

    /* Blueprint Outer Stage */
    .stage {
      min-height: 100vh;
      padding: 16px 24px 20px;
      background-color: var(--bg-canvas);
      ${
        m.dotMatrixGutter
          ? 'background-image: radial-gradient(var(--dot-color) 1px, transparent 1px); background-size: 16px 16px;'
          : ''
      }
    }

    .sheet {
      position: relative;
      max-width: 1380px;
      margin: 0 auto;
      background: var(--bg-canvas);
      border: 1px solid var(--border-subtle);
      ${m.dashedBlueprintRails ? 'border-left: 1px dashed var(--rail-color); border-right: 1px dashed var(--rail-color);' : ''}
    }

    /* Corner Registration Squares */
    .reg-sq {
      position: absolute;
      width: 6px;
      height: 6px;
      border: 1px solid var(--reg-mark);
      background: var(--bg-canvas);
      pointer-events: none;
      display: ${m.cornerRegistrationSquares ? 'block' : 'none'};
    }
    .reg-sq.tl { top: -3.5px; left: -3.5px; }
    .reg-sq.tr { top: -3.5px; right: -3.5px; }
    .reg-sq.bl { bottom: -3.5px; left: -3.5px; }
    .reg-sq.br { bottom: -3.5px; right: -3.5px; }

    /* Top Specimen Meta Bar */
    .meta-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 8px 16px;
      padding: 10px 18px;
      border-bottom: 1px solid var(--border-subtle);
      background: var(--bg-surface);
      font-size: 12px;
      color: var(--text-muted);
    }

    .meta-title {
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--text-primary);
      font-weight: 500;
    }

    .meta-dot {
      width: 8px;
      height: 8px;
      border-radius: 2px;
      background: var(--accent-signal);
      display: inline-block;
      flex-shrink: 0;
    }

    .meta-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      font-size: 11px;
    }

    /* Section Panels */
    .panel {
      position: relative;
      padding: 18px 20px;
      border-bottom: 1px solid var(--border-subtle);
    }

    .panel:last-child {
      border-bottom: none;
    }

    .panel-label {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-muted);
    }

    /* Panel A: Live Hero Specimen */
    .hero-frame {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--r-card);
      overflow: hidden;
    }

    .hero-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 16px;
      border-bottom: 1px solid var(--border-subtle);
      background: var(--bg-canvas);
    }

    .hero-brand {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-family: var(--font-display);
      font-weight: 600;
      font-size: 14px;
      letter-spacing: -0.02em;
      color: var(--text-primary);
      white-space: nowrap;
    }

    .hero-brand-mark {
      width: 16px;
      height: 16px;
      border-radius: 3px;
      border: 1.5px solid var(--text-primary);
      position: relative;
      display: inline-block;
    }
    .hero-brand-mark::after {
      content: "";
      position: absolute;
      inset: 3px;
      background: var(--accent-signal);
      border-radius: 1px;
    }

    .hero-nav-links {
      display: flex;
      align-items: center;
      gap: 18px;
    }

    .hero-nav-link {
      font-size: 13px;
      color: var(--text-muted);
      text-decoration: none;
      white-space: nowrap;
      transition: color var(--dur-micro) var(--ease-studio);
    }

    .hero-nav-link:hover,
    .hero-nav-link:focus-visible {
      color: var(--text-primary);
      outline: none;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-height: 38px;
      padding: 0 16px;
      border-radius: var(--r-control);
      font-family: var(--font-body);
      font-size: 13px;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
      white-space: nowrap;
      border: 1px solid transparent;
      transition:
        background-color var(--dur-micro) var(--ease-studio),
        border-color var(--dur-micro) var(--ease-studio),
        transform var(--dur-micro) var(--ease-studio);
    }

    .btn:focus-visible {
      outline: 2px solid var(--accent-accessible);
      outline-offset: 2px;
    }

    .btn-primary {
      background: var(--accent-accessible);
      color: var(--on-accent);
      border-color: var(--accent-accessible);
    }

    .btn-primary:hover {
      filter: brightness(1.06);
      transform: translateY(-1px);
    }

    .btn-secondary {
      background: var(--bg-canvas);
      color: var(--text-primary);
      border-color: var(--border-subtle);
    }

    .btn-secondary:hover {
      background: var(--bg-recessed);
    }

    .btn-nav {
      min-height: 34px;
      padding: 0 14px;
      font-size: 12px;
    }

    .hero-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
      gap: 24px;
      padding: 22px 20px;
      align-items: center;
    }

    .eyebrow-pill {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 4px 10px;
      border-radius: var(--r-control);
      background: var(--bg-recessed);
      border: 1px solid var(--border-subtle);
      color: var(--accent-accessible);
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.04em;
      white-space: nowrap;
      margin-bottom: 12px;
    }

    .eyebrow-dot {
      width: 6px;
      height: 6px;
      border-radius: 9999px;
      background: var(--accent-signal);
      flex-shrink: 0;
    }

    .hero-h1 {
      margin: 0 0 10px;
      font-family: var(--font-display);
      font-size: clamp(28px, 3vw, var(--h1-size));
      font-weight: var(--fw-heading);
      line-height: 1.08;
      letter-spacing: var(--h1-tracking);
      color: var(--text-primary);
    }

    .hero-subcopy {
      margin: 0 0 18px;
      max-width: 54ch;
      font-size: 15px;
      line-height: 1.5;
      color: var(--text-muted);
    }

    .hero-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
    }

    /* Interactive Mini Product-Proof Widget */
    .proof-card {
      background: var(--bg-canvas);
      border: 1px solid var(--border-subtle);
      border-radius: var(--r-media);
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .proof-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-size: 12px;
    }

    .proof-title {
      font-weight: 500;
      color: var(--text-primary);
    }

    .proof-metrics {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 12px;
      color: var(--text-muted);
    }

    .proof-metrics strong {
      color: var(--text-primary);
      font-weight: 600;
    }

    .proof-canvas-wrap {
      width: 100%;
      height: 132px;
      background: var(--bg-recessed);
      border: 1px solid var(--border-subtle);
      border-radius: var(--r-card);
      overflow: hidden;
    }

    #hero-proof-canvas {
      width: 100%;
      height: 100%;
      display: block;
    }

    .proof-controls {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 12px;
      color: var(--text-muted);
    }

    .proof-controls label {
      white-space: nowrap;
    }

    .proof-slider {
      flex: 1;
      accent-color: var(--accent-accessible);
      cursor: pointer;
      min-height: 28px;
    }

    /* Panel B: Swatch Strip */
    .swatch-grid {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      gap: 10px;
    }

    .swatch-card {
      border: 1px solid var(--border-subtle);
      border-radius: var(--r-card);
      overflow: hidden;
      background: var(--bg-surface);
    }

    .swatch-chip {
      height: 44px;
      padding: 6px 8px;
      display: flex;
      align-items: flex-start;
      justify-content: flex-end;
      border-bottom: 1px solid var(--border-subtle);
    }

    .swatch-badge {
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.04em;
      padding: 1px 5px;
      border-radius: 3px;
      border: 1px solid currentColor;
      opacity: 0.9;
    }

    .swatch-meta {
      padding: 8px 9px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .swatch-name {
      font-size: 12px;
      font-weight: 500;
      color: var(--text-primary);
    }

    .swatch-hex {
      font-size: 11px;
      color: var(--text-muted);
    }

    .swatch-ratio {
      font-size: 10px;
      color: var(--text-muted);
    }

    /* Lower Split: Panel C (Type & Radii) + Panel D (Motion) */
    .lower-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
    }

    .lower-grid > .panel {
      border-bottom: none;
    }

    .lower-grid > .panel:first-child {
      border-right: 1px dashed var(--rail-color);
    }

    .type-rows {
      display: grid;
      gap: 8px;
      margin-bottom: 14px;
    }

    .type-row {
      display: grid;
      grid-template-columns: 74px minmax(0, 1fr) auto;
      align-items: baseline;
      gap: 12px;
      padding: 6px 10px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--r-card);
    }

    .type-tag {
      font-size: 11px;
      color: var(--text-muted);
      white-space: nowrap;
    }

    .type-sample-h1 {
      font-family: var(--font-display);
      font-size: 20px;
      font-weight: var(--fw-heading);
      letter-spacing: var(--h1-tracking);
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .type-sample-h2 {
      font-family: var(--font-display);
      font-size: 16px;
      font-weight: var(--fw-heading);
      letter-spacing: var(--h2-tracking);
      color: var(--text-primary);
    }

    .type-sample-body {
      font-size: 14px;
      color: var(--text-muted);
    }

    .type-sample-mono {
      font-size: 13px;
      color: var(--text-primary);
    }

    .type-spec {
      font-size: 11px;
      color: var(--text-muted);
      white-space: nowrap;
    }

    .micro-ui-row {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
    }

    .radius-card {
      padding: 10px 12px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .radius-card.r-card { border-radius: var(--r-card); }
    .radius-card.r-control { border-radius: var(--r-control); text-align: center; }
    .radius-card.r-media { border-radius: var(--r-media); }

    .radius-label {
      font-size: 11px;
      color: var(--text-muted);
    }

    .radius-val {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary);
    }

    .status-pill-wrap {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 12px;
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 5px 11px;
      border-radius: var(--r-control);
      background: var(--bg-recessed);
      border: 1px solid var(--border-subtle);
      color: var(--text-primary);
      font-size: 11px;
      white-space: nowrap;
    }

    .status-pulse {
      width: 7px;
      height: 7px;
      border-radius: 9999px;
      background: var(--accent-signal);
      animation: studioPulse 1.8s var(--ease-studio) infinite;
    }

    @keyframes studioPulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.45; transform: scale(0.85); }
    }

    /* Panel D: Motion Physics & Reduced-Motion Footer */
    .motion-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--r-card);
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .motion-specs {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }

    .motion-kv {
      padding: 8px 10px;
      background: var(--bg-canvas);
      border: 1px solid var(--border-subtle);
      border-radius: var(--r-card);
      font-size: 11px;
    }

    .motion-kv span {
      display: block;
      color: var(--text-muted);
      margin-bottom: 2px;
    }

    .motion-kv strong {
      color: var(--text-primary);
      font-weight: 500;
      word-break: break-word;
    }

    .motion-track {
      position: relative;
      height: 10px;
      border-radius: var(--r-control);
      background: var(--bg-recessed);
      border: 1px solid var(--border-subtle);
      overflow: hidden;
    }

    .motion-runner {
      position: absolute;
      top: 1px;
      bottom: 1px;
      width: 28%;
      border-radius: var(--r-control);
      background: var(--accent-signal);
      animation: studioGlide 2.2s var(--ease-studio) infinite alternate;
    }

    @keyframes studioGlide {
      from { transform: translateX(4%); }
      to { transform: translateX(250%); }
    }

    .motion-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding-top: 4px;
    }

    .motion-state-label {
      font-size: 12px;
      color: var(--text-muted);
    }

    .motion-toggle-btn {
      min-height: 44px;
      min-width: 148px;
      padding: 0 16px;
      border-radius: var(--r-control);
      border: 1px solid var(--border-subtle);
      background: var(--bg-canvas);
      color: var(--text-primary);
      font-family: var(--font-mono);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
      transition: background-color var(--dur-micro) var(--ease-studio);
    }

    .motion-toggle-btn:hover {
      background: var(--bg-recessed);
    }

    .motion-toggle-btn[aria-pressed="true"] {
      background: var(--accent-accessible);
      color: var(--on-accent);
      border-color: var(--accent-accessible);
    }

    /* Reduced-Motion Contract */
    :root.reduced-motion *,
    :root.reduced-motion *::before,
    :root.reduced-motion *::after {
      animation: none !important;
      transition: none !important;
      scroll-behavior: auto !important;
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
      }
    }

    /* Responsive Mobile Layout (390px & 320px zero-overflow guarantee) */
    @media (max-width: 1024px) {
      .swatch-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
      .lower-grid {
        grid-template-columns: minmax(0, 1fr);
      }
      .lower-grid > .panel:first-child {
        border-right: none;
        border-bottom: 1px solid var(--border-subtle);
      }
    }

    @media (max-width: 760px) {
      .stage {
        padding: 10px 10px 16px;
      }
      .panel {
        padding: 14px 12px;
      }
      .hero-nav {
        flex-wrap: wrap;
        padding: 10px 12px;
      }
      .hero-nav-links {
        order: 3;
        width: 100%;
        justify-content: space-between;
        gap: 8px;
        padding-top: 8px;
        border-top: 1px solid var(--border-subtle);
      }
      .hero-nav-link {
        font-size: 12px;
      }
      .hero-grid {
        grid-template-columns: minmax(0, 1fr);
        padding: 16px 12px;
        gap: 16px;
      }
      .hero-h1 {
        font-size: 28px;
      }
      .hero-actions .btn {
        min-height: 44px;
        flex: 1 1 auto;
      }
      .swatch-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .type-row {
        grid-template-columns: minmax(0, 1fr);
        gap: 4px;
      }
      .micro-ui-row {
        grid-template-columns: minmax(0, 1fr);
      }
      .motion-specs {
        grid-template-columns: minmax(0, 1fr);
      }
      .motion-footer {
        flex-direction: column;
        align-items: stretch;
      }
      .motion-toggle-btn {
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="stage">
    <main class="sheet">
      <span class="reg-sq tl" aria-hidden="true"></span>
      <span class="reg-sq tr" aria-hidden="true"></span>
      <span class="reg-sq bl" aria-hidden="true"></span>
      <span class="reg-sq br" aria-hidden="true"></span>

      <header class="meta-bar">
        <div class="meta-title">
          <span class="meta-dot" aria-hidden="true"></span>
          <span>${escapeHtml(spec.productName)} — Phase 0.5 Style Tile</span>
        </div>
        <div class="meta-tags mono">
          <span>SOURCE: ${escapeHtml(specSource)}</span>
          <span>POLARITY: ${escapeHtml(isDark ? 'DARK' : 'LIGHT')}</span>
          <span>RADII: ${escapeHtml(r.card)} / ${escapeHtml(r.control)} / ${escapeHtml(r.media)}</span>
        </div>
      </header>

      <!-- Panel A: Live Hero Specimen -->
      <section class="panel" id="panel-hero" aria-label="Live Hero Specimen">
        <div class="panel-label mono">
          <span>01 · Live Hero Specimen</span>
          <span>Nav &le; 4 links + 1 CTA · Optical W${escapeHtml(t.headingWeight)}</span>
        </div>
        <div class="hero-frame">
          <nav class="hero-nav" aria-label="Hero specimen navigation">
            <span class="hero-brand">
              <span class="hero-brand-mark" aria-hidden="true"></span>
              <span>${escapeHtml(spec.productName)}</span>
            </span>
            <div class="hero-nav-links">
              ${navLinksHtml}
            </div>
            <a class="btn btn-primary btn-nav" href="#panel-hero">${escapeHtml(spec.primaryCta)}</a>
          </nav>

          <div class="hero-grid">
            <div>
              <div class="eyebrow-pill mono">
                <span class="eyebrow-dot" aria-hidden="true"></span>
                <span>${escapeHtml(spec.eyebrow)}</span>
              </div>
              <h1 class="hero-h1">${escapeHtml(spec.headline)}</h1>
              <p class="hero-subcopy">${escapeHtml(spec.subcopy)}</p>
              <div class="hero-actions">
                <button type="button" class="btn btn-primary">${escapeHtml(spec.primaryCta)}</button>
                <button type="button" class="btn btn-secondary">${escapeHtml(spec.secondaryCta)}</button>
              </div>
            </div>

            <div class="proof-card" aria-label="Interactive product proof widget">
              <div class="proof-head">
                <span class="proof-title">${escapeHtml(spec.proof.title)}</span>
                <div class="proof-metrics mono">
                  <span>p99 <strong id="metric-p99">11.4ms</strong></span>
                  <span>rps <strong id="metric-rps">14,280</strong></span>
                </div>
              </div>
              <div class="proof-canvas-wrap">
                <canvas id="hero-proof-canvas" width="480" height="132" aria-label="Live telemetry latency curve and histogram"></canvas>
              </div>
              <div class="proof-controls">
                <label for="proof-load-slider" class="mono">${escapeHtml(spec.proof.controlLabel)}</label>
                <input
                  id="proof-load-slider"
                  class="proof-slider"
                  type="range"
                  min="20"
                  max="100"
                  value="${Number(spec.proof.initialLoad) || 64}"
                  aria-label="${escapeHtml(spec.proof.controlLabel)}"
                >
                <span id="proof-load-value" class="mono">${Number(spec.proof.initialLoad) || 64}%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Panel B: Surface & WCAG AA Contrast Swatch Strip -->
      <section class="panel" id="panel-swatches" aria-label="Surface and WCAG AA Contrast Swatch Strip">
        <div class="panel-label mono">
          <span>02 · Surface &amp; WCAG AA Contrast Strip</span>
          <span>Live luminance audit</span>
        </div>
        <div class="swatch-grid">
          ${swatchesHtml}
        </div>
      </section>

      <!-- Panels C & D -->
      <div class="lower-grid">
        <!-- Panel C: Typography, Radius & Micro-UI Specimen -->
        <section class="panel" id="panel-typography" aria-label="Typography, Radius and Micro-UI Specimen">
          <div class="panel-label mono">
            <span>03 · Typography, Radii &amp; Micro-UI</span>
            <span>tabular-nums · non-wrapping pill</span>
          </div>

          <div class="status-pill-wrap">
            <span class="status-pill mono">
              <span class="status-pulse" aria-hidden="true"></span>
              <span>${escapeHtml(spec.statusPill)}</span>
            </span>
            <span class="mono" style="font-size:12px;color:var(--text-muted);">
              01.42ms · 99.98% · 14,280 rps
            </span>
          </div>

          <div class="type-rows">
            <div class="type-row">
              <span class="type-tag mono">H1 Display</span>
              <span class="type-sample-h1">${escapeHtml(spec.productName)} Edge Telemetry</span>
              <span class="type-spec mono">${escapeHtml(t.displayFont)} · ${escapeHtml(t.headingWeight)} · ${escapeHtml(t.h1Tracking)}</span>
            </div>
            <div class="type-row">
              <span class="type-tag mono">H2 Section</span>
              <span class="type-sample-h2">Sub-millisecond route diagnostics</span>
              <span class="type-spec mono">${escapeHtml(t.h2Size)} · ${escapeHtml(t.h2Tracking)}</span>
            </div>
            <div class="type-row">
              <span class="type-tag mono">Body UI</span>
              <span class="type-sample-body">Crisp editorial copy with restrained contrast hierarchy.</span>
              <span class="type-spec mono">${escapeHtml(t.bodyFont)} · ${escapeHtml(t.bodySize)}</span>
            </div>
            <div class="type-row">
              <span class="type-tag mono">Mono Data</span>
              <span class="type-sample-mono mono">REQ_ID=849201 · P50=03.12ms · P99=11.40ms</span>
              <span class="type-spec mono">${escapeHtml(t.monoFont)}</span>
            </div>
          </div>

          <div class="micro-ui-row">
            <div class="radius-card r-card">
              <span class="radius-label mono">--r-card</span>
              <span class="radius-val mono">${escapeHtml(r.card)}</span>
            </div>
            <div class="radius-card r-control">
              <span class="radius-label mono">--r-control</span>
              <span class="radius-val mono">${escapeHtml(r.control)}</span>
            </div>
            <div class="radius-card r-media">
              <span class="radius-label mono">--r-media</span>
              <span class="radius-val mono">${escapeHtml(r.media)}</span>
            </div>
          </div>
        </section>

        <!-- Panel D: Motion Physics & Reduced-Motion Specimen -->
        <section class="panel" id="panel-motion" aria-label="Motion Physics and Reduced-Motion Specimen">
          <div class="panel-label mono">
            <span>04 · Motion Physics &amp; Reduced-Motion</span>
            <span>Deterministic freeze contract</span>
          </div>

          <div class="motion-card">
            <div class="motion-specs">
              <div class="motion-kv">
                <span class="mono">EASING CURVE</span>
                <strong class="mono">${escapeHtml(spec.motion.easing)}</strong>
              </div>
              <div class="motion-kv">
                <span class="mono">MICRO / PANEL</span>
                <strong class="mono">${escapeHtml(spec.motion.microDuration)} / ${escapeHtml(spec.motion.panelDuration)}</strong>
              </div>
            </div>

            <div class="motion-track" aria-hidden="true">
              <div class="motion-runner"></div>
            </div>

            <footer class="motion-footer">
              <div class="motion-state-label mono" id="motion-status-text">
                MOTION: ACTIVE (60fps RAF)
              </div>
              <button
                type="button"
                class="motion-toggle-btn"
                data-motion-toggle
                aria-pressed="false"
              >
                Freeze Motion
              </button>
            </footer>
          </div>
        </section>
      </div>
    </main>
  </div>

  <script>
    (function () {
      const SPEC = ${specPayload};
      const canvas = document.getElementById('hero-proof-canvas');
      const ctx = canvas.getContext('2d');
      const slider = document.getElementById('proof-load-slider');
      const loadValueEl = document.getElementById('proof-load-value');
      const p99El = document.getElementById('metric-p99');
      const rpsEl = document.getElementById('metric-rps');
      const toggleBtn = document.querySelector('[data-motion-toggle]');
      const statusText = document.getElementById('motion-status-text');

      let loadPct = Number(slider.value) || 64;
      let phase = 0;
      let rafId = null;
      let frozen = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      function updateMetrics() {
        const p99 = (4.2 + (loadPct / 100) * 11.4).toFixed(1);
        const rps = Math.round(2400 + loadPct * 185);
        loadValueEl.textContent = loadPct + '%';
        p99El.textContent = p99 + 'ms';
        rpsEl.textContent = rps.toLocaleString('en-US');
      }

      function drawFrame(tPhase) {
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        // Background
        ctx.fillStyle = SPEC.palette.recessed;
        ctx.fillRect(0, 0, w, h);

        // Subtle horizontal blueprint gridlines
        ctx.strokeStyle = SPEC.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(21,20,20,0.08)';
        ctx.lineWidth = 1;
        for (let y = 26; y < h; y += 26) {
          ctx.beginPath();
          ctx.moveTo(0, y + 0.5);
          ctx.lineTo(w, y + 0.5);
          ctx.stroke();
        }

        // Animated latency bars
        const barCount = 24;
        const gap = 4;
        const padX = 14;
        const usableW = w - padX * 2;
        const barW = (usableW - gap * (barCount - 1)) / barCount;
        const loadScale = 0.35 + (loadPct / 100) * 0.62;

        for (let i = 0; i < barCount; i++) {
          const wave = 0.5 + 0.35 * Math.sin(i * 0.48 + tPhase) + 0.15 * Math.cos(i * 0.9 - tPhase * 1.3);
          const barH = Math.max(10, Math.round(wave * (h - 30) * loadScale));
          const x = padX + i * (barW + gap);
          const y = h - 10 - barH;
          ctx.fillStyle = i % 6 === 0 ? SPEC.palette.accent : (SPEC.isDark ? 'rgba(245,243,238,0.22)' : 'rgba(21,20,20,0.16)');
          ctx.fillRect(x, y, barW, barH);
        }

        // Smooth p99 telemetry curve overlay
        ctx.strokeStyle = SPEC.palette.accentAccessible;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i <= 48; i++) {
          const ratio = i / 48;
          const x = padX + ratio * usableW;
          const yNorm = 0.5 + 0.24 * Math.sin(ratio * Math.PI * 3.5 + tPhase * 1.15) + 0.08 * Math.cos(ratio * 11 - tPhase);
          const y = h - 18 - yNorm * (h - 38) * loadScale;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      function tick() {
        if (frozen) {
          rafId = null;
          return;
        }
        phase += 0.055;
        drawFrame(phase);
        rafId = window.requestAnimationFrame(tick);
      }

      function applyMotionState() {
        document.documentElement.classList.toggle('reduced-motion', frozen);
        toggleBtn.setAttribute('aria-pressed', String(frozen));
        toggleBtn.textContent = frozen ? 'Resume Motion' : 'Freeze Motion';
        statusText.textContent = frozen ? 'MOTION: FROZEN (REDUCED-MOTION)' : 'MOTION: ACTIVE (60fps RAF)';
        if (frozen) {
          if (rafId !== null) {
            window.cancelAnimationFrame(rafId);
            rafId = null;
          }
          drawFrame(phase);
        } else if (rafId === null) {
          rafId = window.requestAnimationFrame(tick);
        }
      }

      slider.addEventListener('input', function () {
        loadPct = Number(slider.value) || 64;
        updateMetrics();
        if (frozen) drawFrame(phase);
      });

      toggleBtn.addEventListener('click', function () {
        frozen = !frozen;
        applyMotionState();
      });

      updateMetrics();
      drawFrame(phase);
      applyMotionState();
    })();
  </script>
</body>
</html>
`;
}

/* -------------------------------------------------------------------------- */
/* Ephemeral Local Static Server (127.0.0.1)                                  */
/* -------------------------------------------------------------------------- */

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

function startStaticServer(rootDir) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const reqPath = decodeURIComponent((req.url || '/').split('?')[0]);
        const safeRel = reqPath === '/' ? 'index.html' : reqPath.replace(/^\/+/, '');
        const fullPath = path.resolve(rootDir, safeRel);
        if (!fullPath.startsWith(path.resolve(rootDir))) {
          res.writeHead(403);
          res.end('Forbidden');
          return;
        }
        const data = await fs.readFile(fullPath);
        const ext = path.extname(fullPath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        res.end(data);
      } catch {
        res.writeHead(404);
        res.end('Not found');
      }
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve({ server, url: `http://127.0.0.1:${addr.port}` });
    });
  });
}

/* -------------------------------------------------------------------------- */
/* Main Exported Function                                                     */
/* -------------------------------------------------------------------------- */

export async function generateStyleTile(specOrPath, outputDir = DEFAULT_OUTPUT_DIR) {
  const outDir = await ensureDir(outputDir || DEFAULT_OUTPUT_DIR);

  let rawSpec = null;
  let specSource = 'demo-default';

  if (specOrPath && specOrPath !== '--demo') {
    if (typeof specOrPath === 'string') {
      const resolvedPath = path.resolve(specOrPath);
      const rawText = await fs.readFile(resolvedPath, 'utf8');
      rawSpec = JSON.parse(rawText);
      const baseName = path.basename(resolvedPath);
      specSource = isReferenceTokensObject(rawSpec)
        ? `reference-tokens (${baseName})`
        : `spec-file (${baseName})`;
    } else if (typeof specOrPath === 'object') {
      rawSpec = specOrPath;
      specSource = isReferenceTokensObject(rawSpec) ? 'reference-tokens (inline)' : 'inline-spec';
    }
  }

  const spec = mergeSpec(rawSpec);
  const html = buildStyleTileHtml(spec, specSource);
  const htmlPath = path.join(outDir, 'index.html');
  await fs.writeFile(htmlPath, html, 'utf8');

  let server = null;
  let httpBaseUrl = null;
  try {
    const started = await startStaticServer(outDir);
    server = started.server;
    httpBaseUrl = started.url;
  } catch {
    // Restricted sandboxes may disallow loopback port binding; fall back cleanly to file://
  }

  const fileUrl = pathToFileURL(htmlPath).href;
  let browser = null;

  try {
    browser = await launchBrowser();
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    });
    const attachRouteGuard = async (targetPage) => {
      // Abort external network requests so offline environments never stall on webfont CDN fetches
      await targetPage.route('**/*', (route) => {
        const reqUrl = route.request().url();
        if (
          (httpBaseUrl && reqUrl.startsWith(httpBaseUrl)) ||
          reqUrl.startsWith('file://') ||
          reqUrl.startsWith('data:') ||
          reqUrl.startsWith('blob:')
        ) {
          return route.continue();
        }
        return route.abort();
      });
    };

    let page = await context.newPage();
    await attachRouteGuard(page);

    const loadFallbackOnFreshPage = async () => {
      await page.close().catch(() => {});
      page = await context.newPage();
      await attachRouteGuard(page);
      try {
        await page.goto(fileUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      } catch {
        await page.close().catch(() => {});
        page = await context.newPage();
        await attachRouteGuard(page);
        await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15000 });
      }
    };

    if (httpBaseUrl) {
      try {
        await page.goto(`${httpBaseUrl}/index.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      } catch (navErr) {
        const msg = String(navErr?.message || navErr);
        if (/ERR_ACCESS_DENIED|ERR_CONNECTION_REFUSED|EPERM|EACCES/i.test(msg)) {
          await loadFallbackOnFreshPage();
        } else {
          throw navErr;
        }
      }
    } else {
      await loadFallbackOnFreshPage();
    }
    await page.evaluate(() => document.fonts?.ready).catch(() => {});
    await page.waitForTimeout(260);

    // 1. Desktop screenshot & overflow check
    const desktopOverflow = await page.evaluate(() =>
      Math.max(0, Math.ceil(document.documentElement.scrollWidth - window.innerWidth)),
    );
    const desktopPngPath = path.join(outDir, 'style-tile-desktop.png');
    await page.screenshot({ path: desktopPngPath, fullPage: true });

    // 2. Real WCAG contrast verification from live rendered CSS variables in the page
    const renderedPalette = await page.evaluate(() => {
      const cs = getComputedStyle(document.documentElement);
      const getVar = (name) => cs.getPropertyValue(name).trim();
      return {
        canvas: getVar('--bg-canvas'),
        surface: getVar('--bg-surface'),
        recessed: getVar('--bg-recessed'),
        ink: getVar('--text-primary'),
        muted: getVar('--text-muted'),
        accent: getVar('--accent-signal'),
        accentAccessible: getVar('--accent-accessible'),
        onAccent: getVar('--on-accent'),
      };
    });

    const pairsChecked = evaluatePaletteContrast({
      canvas: normalizeHex(renderedPalette.canvas, spec.palette.canvas),
      surface: normalizeHex(renderedPalette.surface, spec.palette.surface),
      recessed: normalizeHex(renderedPalette.recessed, spec.palette.recessed),
      ink: normalizeHex(renderedPalette.ink, spec.palette.ink),
      muted: normalizeHex(renderedPalette.muted, spec.palette.muted),
      accent: normalizeHex(renderedPalette.accent, spec.palette.accent),
      accentAccessible: normalizeHex(renderedPalette.accentAccessible, spec.palette.accentAccessible),
      onAccent: normalizeHex(renderedPalette.onAccent, spec.palette.onAccent),
    });

    const failures = pairsChecked.filter((item) => !item.passed);
    const textPairs = pairsChecked.filter((item) => item.role !== 'ui-graphic');
    const minRatio = Number(
      Math.min(...(textPairs.length > 0 ? textPairs : pairsChecked).map((item) => item.ratio)).toFixed(2),
    );

    // 3. Motion-Off Canvas Freeze verification
    const sampleCanvas = () =>
      page.evaluate(() => {
        const c = document.getElementById('hero-proof-canvas');
        return c ? c.toDataURL('image/png') : null;
      });

    const activeSampleA = await sampleCanvas();
    await page.waitForTimeout(220);
    const activeSampleB = await sampleCanvas();
    const wasAnimating = Boolean(activeSampleA && activeSampleB && activeSampleA !== activeSampleB);

    await page.click('[data-motion-toggle]');
    await page.waitForTimeout(120);
    const hasReducedClass = await page.evaluate(() =>
      document.documentElement.classList.contains('reduced-motion'),
    );
    const frozenSampleA = await sampleCanvas();
    await page.waitForTimeout(280);
    const frozenSampleB = await sampleCanvas();
    const stayedFrozen = Boolean(frozenSampleA && frozenSampleB && frozenSampleA === frozenSampleB);
    const motionFreezeVerified = Boolean(wasAnimating && hasReducedClass && stayedFrozen);

    // Re-enable motion before mobile capture so mobile screenshot matches live active appearance
    await page.click('[data-motion-toggle]');
    await page.waitForTimeout(140);

    // 4. Mobile screenshot & overflow check (390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(220);
    const mobileOverflow = await page.evaluate(() =>
      Math.max(0, Math.ceil(document.documentElement.scrollWidth - window.innerWidth)),
    );
    const mobilePngPath = path.join(outDir, 'style-tile-mobile.png');
    await page.screenshot({ path: mobilePngPath, fullPage: true });

    const report = {
      passed: failures.length === 0 && desktopOverflow === 0 && mobileOverflow === 0 && motionFreezeVerified,
      meta: {
        productName: spec.productName,
        generatedAt: new Date().toISOString(),
        specSource,
      },
      files: {
        html: 'index.html',
        desktopPng: 'style-tile-desktop.png',
        mobilePng: 'style-tile-mobile.png',
      },
      contrast: {
        minRatio,
        pairsChecked,
        failures,
      },
      overflow: {
        desktopPx: desktopOverflow,
        mobilePx: mobileOverflow,
      },
      radii: {
        card: spec.radii.card,
        control: spec.radii.control,
        media: spec.radii.media,
      },
      motionFreezeVerified,
    };

    const reportPath = path.join(outDir, 'style-tile-report.json');
    await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

    return report;
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (server) await new Promise((resolve) => server.close(() => resolve()));
  }
}

/* -------------------------------------------------------------------------- */
/* CLI Entrypoint                                                             */
/* -------------------------------------------------------------------------- */

function isMainModule() {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1]);
  } catch {
    return false;
  }
}

if (isMainModule()) {
  const arg1 = process.argv[2];
  const arg2 = process.argv[3];

  const specArg = arg1 || '--demo';
  const outArg = arg2 || DEFAULT_OUTPUT_DIR;

  generateStyleTile(specArg, outArg)
    .then((report) => {
      const status = report.passed ? 'PASS' : 'FAIL';
      console.log(
        `[style-tile] ${status} | product="${report.meta.productName}" | minContrast=${report.contrast.minRatio}:1 | overflow=${report.overflow.desktopPx}px/${report.overflow.mobilePx}px | motionFreeze=${report.motionFreezeVerified}`,
      );
      console.log(`[style-tile] report: ${path.resolve(outArg, 'style-tile-report.json')}`);
      if (!report.passed) {
        process.exitCode = 1;
      }
    })
    .catch((err) => {
      console.error(`[style-tile] ERROR: ${err?.message || err}`);
      process.exitCode = 1;
    });
}
