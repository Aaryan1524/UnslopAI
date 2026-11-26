import fs from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureDir, launchBrowser, safeNavigate } from './browser_helper.mjs';

const OPEN_FONT_HOSTS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'api.fontshare.com',
  'cdn.fontshare.com',
  'fonts.bunny.net',
];

const SYSTEM_FONTS = new Set([
  'system-ui', '-apple-system', 'blinkmacsystemfont', 'segoe ui', 'roboto',
  'helvetica', 'helvetica neue', 'arial', 'sans-serif', 'serif', 'monospace',
  'ui-sans-serif', 'ui-serif', 'ui-monospace', 'sf pro text', 'sf pro display',
  'sf mono', 'menlo', 'consolas', 'georgia', 'times new roman',
]);

const KNOWN_OPEN_SOURCE_FONTS = new Set([
  'inter', 'roboto', 'geist', 'geist mono', 'plus jakarta sans', 'dm sans',
  'space grotesk', 'instrument sans', 'instrument serif', 'ibm plex sans',
  'ibm plex mono', 'jetbrains mono', 'fira code', 'newsreader', 'source sans 3',
  'manrope', 'outfit', 'syne', 'cormorant garamond', 'fraunces', 'playfair display',
  'lato', 'open sans', 'montserrat', 'poppins', 'work sans', 'sora', 'figtree',
]);

/**
 * Resolve output target path: if `outputPathOrDir` ends with `.json`, write directly there;
 * otherwise treat as directory and write `<outputDir>/reference-tokens.json`.
 */
async function resolveOutputFilePath(outputPathOrDir = './reference-out') {
  const target = String(outputPathOrDir || './reference-out');
  if (target.toLowerCase().endsWith('.json')) {
    const resolvedFile = path.resolve(target);
    await ensureDir(path.dirname(resolvedFile));
    return resolvedFile;
  }
  const outDir = await ensureDir(target);
  return path.join(outDir, 'reference-tokens.json');
}

/**
 * Smoothly scroll the document in 4 steps to hydrate lazy sections, then return to (0, 0).
 */
async function scrollFourStepsAndReturn(page) {
  const { scrollHeight, innerHeight } = await page.evaluate(() => ({
    scrollHeight: Math.max(
      document.documentElement?.scrollHeight || 0,
      document.body?.scrollHeight || 0,
    ),
    innerHeight: window.innerHeight || 900,
  }));

  if (scrollHeight > innerHeight * 1.05) {
    const maxScroll = Math.max(0, scrollHeight - innerHeight);
    for (let step = 1; step <= 4; step++) {
      const targetY = Math.round(maxScroll * (step / 4));
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'smooth' }), targetY);
      await page.waitForTimeout(220);
    }
    await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }));
    await page.waitForTimeout(260);
  }
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
}

/**
 * Detect potentially proprietary/commercial self-hosted font families from loaded fonts and stylesheet sources.
 */
function detectCommercialFontHints(loadedFamilies, fontFaceSources, fontAssetUrls) {
  const openFontUrlsJoined = fontAssetUrls
    .filter((u) => OPEN_FONT_HOSTS.some((h) => u.includes(h)))
    .join(' ')
    .toLowerCase();
  const commercialFontHints = [];

  for (const fam of loadedFamilies) {
    const low = fam.toLowerCase();
    if (SYSTEM_FONTS.has(low)) continue;
    const faceSrc = (fontFaceSources?.[low] || '').toLowerCase();
    const loadedFromOpenHost =
      OPEN_FONT_HOSTS.some((h) => faceSrc.includes(h)) ||
      openFontUrlsJoined.includes(low.replace(/\s+/g, ''));
    if (!loadedFromOpenHost && !KNOWN_OPEN_SOURCE_FONTS.has(low)) {
      commercialFontHints.push(fam);
    }
  }
  return commercialFontHints;
}

/**
 * Generate a ready-to-use `:root` CSS custom properties scaffold from measured reference tokens.
 */
function buildCssTokensSnippet({ surfaceRatio, typography, geometryLock, topInks }) {
  const fallbackBg = surfaceRatio.dominantPolarity === 'dark' ? '#141312' : '#ffffff';
  const fallbackInk = surfaceRatio.dominantPolarity === 'dark' ? '#f5f2eb' : '#171614';
  const bgCanvas = surfaceRatio.topBackgrounds?.[0]?.hex || fallbackBg;
  const inkPrimary = topInks?.[0]?.hex || fallbackInk;
  const accent = surfaceRatio.topAccents?.[0]?.hex || topInks?.[0]?.hex || inkPrimary;
  const cardRadius = geometryLock.cardRadius || '0px';
  const controlRadius = geometryLock.buttonRadius || geometryLock.inputRadius || '0px';
  const mediaRadius = geometryLock.mediaRadius || '0px';
  const h1Weight = typography.h1?.fontWeight ?? typography.dominantHeadingWeight ?? 400;
  const h1Tracking =
    typography.h1 && Number.isFinite(typography.h1.letterSpacingEm)
      ? `${typography.h1.letterSpacingEm}em`
      : '0em';

  return [
    ':root {',
    `  --ref-bg-canvas: ${bgCanvas};`,
    `  --ref-ink-primary: ${inkPrimary};`,
    `  --ref-accent: ${accent};`,
    `  --ref-r-card: ${cardRadius};`,
    `  --ref-r-control: ${controlRadius};`,
    `  --ref-r-media: ${mediaRadius};`,
    `  --ref-h1-weight: ${h1Weight};`,
    `  --ref-h1-tracking: ${h1Tracking};`,
    '}',
  ].join('\n');
}

/**
 * Extract quantitative design tokens (surface polarity, typography scale, geometry lock,
 * section alignment audit, and CSS custom property scaffold) from a reference URL.
 */
export async function extractReference(url, outputPathOrDir = './reference-out') {
  const outFile = await resolveOutputFilePath(outputPathOrDir);
  const browser = await launchBrowser();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const fontAssetUrls = [];
  page.on('response', (res) => {
    const ct = (res.headers()['content-type'] || '').toLowerCase();
    const resUrl = res.url();
    if (res.status() < 400 && (ct.includes('font/') || /\.(woff2?|ttf|otf)(\?|$)/i.test(resUrl))) {
      fontAssetUrls.push(resUrl);
    }
  });

  try {
    const nav = await safeNavigate(page, url);

    if (nav.blocked) {
      const blockedReport = {
        meta: {
          url,
          finalUrl: page.url(),
          title: await page.title().catch(() => ''),
          status: nav.status,
          blocked: true,
          blockReason: nav.reason,
          capturedAt: new Date().toISOString(),
          outputPath: outFile,
        },
        fallbackGuidance:
          'Target blocked automated extraction. Never attempt to bypass anti-bot or login walls. Ask the user for screenshots or inspect an already-authenticated tab.',
      };
      await fs.writeFile(outFile, `${JSON.stringify(blockedReport, null, 2)}\n`);
      return blockedReport;
    }

    await scrollFourStepsAndReturn(page);

    const extracted = await page.evaluate(() => {
      const vw = window.innerWidth || 1440;
      const vh = window.innerHeight || 900;
      const docHeight = Math.max(
        document.documentElement?.scrollHeight || 0,
        document.body?.scrollHeight || 0,
        vh,
      );

      // 1x1 offscreen canvas color resolver supporting rgb(), oklab(), oklch(), light-dark(), #hex, etc.
      const colorCanvas = document.createElement('canvas');
      colorCanvas.width = 1;
      colorCanvas.height = 1;
      const colorCtx = colorCanvas.getContext('2d', { willReadFrequently: true });
      const colorCache = new Map();
      let probeSpan = null;

      const rgbToHex = (r, g, b) =>
        `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;

      const relativeLuminance = ([r, g, b]) => {
        const toLinear = (c) => {
          const s = c / 255;
          return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
      };

      const rgbChroma = ([r, g, b]) => {
        const rn = r / 255;
        const gn = g / 255;
        const bn = b / 255;
        const max = Math.max(rn, gn, bn);
        const min = Math.min(rn, gn, bn);
        return Number((max - min).toFixed(3));
      };

      const rgbSaturation = ([r, g, b]) => {
        const rn = r / 255;
        const gn = g / 255;
        const bn = b / 255;
        const max = Math.max(rn, gn, bn);
        const min = Math.min(rn, gn, bn);
        if (max === 0) return 0;
        return Number(((max - min) / max).toFixed(3));
      };

      const colorDistance = (a, b) =>
        Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

      const resolveCssColor = (rawColor, contextEl = null) => {
        if (!rawColor || typeof rawColor !== 'string') return null;
        const trimmed = rawColor.trim();
        if (!trimmed || trimmed === 'transparent' || trimmed === 'none') return null;

        const schemeKey =
          /light-dark\(/i.test(trimmed) && contextEl
            ? `${trimmed}::${getComputedStyle(contextEl).colorScheme || ''}`
            : trimmed;
        if (colorCache.has(schemeKey)) return colorCache.get(schemeKey);

        let strToRaster = trimmed;
        if (/light-dark\(/i.test(trimmed)) {
          if (!probeSpan) {
            probeSpan = document.createElement('span');
            probeSpan.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:0;height:0;visibility:hidden;pointer-events:none;';
            (document.body || document.documentElement).appendChild(probeSpan);
          }
          if (contextEl) {
            probeSpan.style.colorScheme = getComputedStyle(contextEl).colorScheme || '';
          } else {
            probeSpan.style.colorScheme = '';
          }
          probeSpan.style.color = '';
          probeSpan.style.color = trimmed;
          const computedProbe = getComputedStyle(probeSpan).color;
          if (computedProbe) strToRaster = computedProbe;
        }

        if (!colorCtx) {
          colorCache.set(schemeKey, null);
          return null;
        }

        const SENTINEL = 'rgba(1, 2, 3, 0.02)';
        colorCtx.clearRect(0, 0, 1, 1);
        colorCtx.fillStyle = SENTINEL;
        const sentinelApplied = colorCtx.fillStyle;
        colorCtx.fillStyle = strToRaster;
        if (colorCtx.fillStyle === sentinelApplied && !/rgba?\(\s*1[\s,]+2[\s,]+3/i.test(strToRaster)) {
          colorCache.set(schemeKey, null);
          return null;
        }

        colorCtx.fillRect(0, 0, 1, 1);
        const data = colorCtx.getImageData(0, 0, 1, 1).data;
        const alpha = data[3] / 255;
        if (alpha < 0.05) {
          colorCache.set(schemeKey, null);
          return null;
        }

        const rgb = [data[0], data[1], data[2]];
        const resolved = {
          rgb,
          alpha: Number(alpha.toFixed(3)),
          hex: rgbToHex(rgb[0], rgb[1], rgb[2]),
          luminance: Number(relativeLuminance(rgb).toFixed(4)),
          chroma: rgbChroma(rgb),
          saturation: rgbSaturation(rgb),
        };
        colorCache.set(schemeKey, resolved);
        return resolved;
      };

      const compositeRgb = (fgRgb, fgAlpha, bgRgb) => [
        Math.round(fgRgb[0] * fgAlpha + bgRgb[0] * (1 - fgAlpha)),
        Math.round(fgRgb[1] * fgAlpha + bgRgb[1] * (1 - fgAlpha)),
        Math.round(fgRgb[2] * fgAlpha + bgRgb[2] * (1 - fgAlpha)),
      ];

      const makeColorRecord = (rgb) => ({
        rgb,
        alpha: 1,
        hex: rgbToHex(rgb[0], rgb[1], rgb[2]),
        luminance: Number(relativeLuminance(rgb).toFixed(4)),
        chroma: rgbChroma(rgb),
        saturation: rgbSaturation(rgb),
      });

      const isVisibleElement = (el) => {
        if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
        if (el.hasAttribute('inert') || el.getAttribute('aria-hidden') === 'true') return false;
        if (el.closest('[inert], [aria-hidden="true"]')) return false;
        const s = getComputedStyle(el);
        if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) < 0.05) return false;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return false;
        return true;
      };

      const resolveElementEffectiveBg = (el) => {
        const chain = [];
        let cur = el;
        while (cur && cur.nodeType === Node.ELEMENT_NODE) {
          const parsed = resolveCssColor(getComputedStyle(cur).backgroundColor, cur);
          if (parsed) {
            chain.push(parsed);
            if (parsed.alpha >= 0.99) break;
          }
          cur = cur.parentElement;
        }
        let acc = [255, 255, 255];
        for (let i = chain.length - 1; i >= 0; i--) {
          acc = compositeRgb(chain[i].rgb, chain[i].alpha, acc);
        }
        return makeColorRecord(acc);
      };

      // Root canvas color (html + body composited)
      const htmlColor = resolveCssColor(getComputedStyle(document.documentElement).backgroundColor, document.documentElement);
      const bodyEl = document.body;
      const bodyColor = bodyEl ? resolveCssColor(getComputedStyle(bodyEl).backgroundColor, bodyEl) : null;
      let rootRgb = [255, 255, 255];
      if (htmlColor) rootRgb = compositeRgb(htmlColor.rgb, htmlColor.alpha, rootRgb);
      if (bodyColor) rootRgb = compositeRgb(bodyColor.rgb, bodyColor.alpha, rootRgb);
      const rootCanvas = makeColorRecord(rootRgb);

      // 2D surface coverage grid to measure rendered area without parent/child double counting
      const cols = 72;
      const rows = Math.min(240, Math.max(60, Math.ceil(docHeight / 20)));
      const cellW = vw / cols;
      const cellH = docHeight / rows;
      const cellArea = cellW * cellH;
      const totalCells = cols * rows;
      const gridR = new Uint8Array(totalCells);
      const gridG = new Uint8Array(totalCells);
      const gridB = new Uint8Array(totalCells);
      gridR.fill(rootCanvas.rgb[0]);
      gridG.fill(rootCanvas.rgb[1]);
      gridB.fill(rootCanvas.rgb[2]);

      const allBodyEls = bodyEl ? Array.from(bodyEl.querySelectorAll('*')).slice(0, 2200) : [];
      const inkAreaMap = new Map();
      const accentCandidateMap = new Map();
      const borderMap = new Map();

      const addWeighted = (map, key, weight, meta = null) => {
        if (!key || weight <= 0) return;
        const prev = map.get(key);
        if (prev) {
          prev.weight += weight;
          prev.count += 1;
        } else {
          map.set(key, { key, weight, count: 1, meta });
        }
      };

      for (const el of allBodyEls) {
        if (el === probeSpan) continue;
        const tag = el.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'TEMPLATE') continue;
        const s = getComputedStyle(el);
        if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) < 0.05) continue;
        if (el.hasAttribute('inert') || el.getAttribute('aria-hidden') === 'true') continue;

        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        if (r.right <= 0 || r.left >= vw) continue;

        const absTop = r.top + window.scrollY;
        const absBottom = r.bottom + window.scrollY;
        const clipLeft = Math.max(0, r.left);
        const clipRight = Math.min(vw, r.right);
        const clipTop = Math.max(0, absTop);
        const clipBottom = Math.min(docHeight, absBottom);
        const clippedArea = Math.max(0, clipRight - clipLeft) * Math.max(0, clipBottom - clipTop);

        // Background rasterization onto coverage grid
        const bgColor = resolveCssColor(s.backgroundColor, el);
        if (bgColor && clipRight > clipLeft && clipBottom > clipTop) {
          const c0 = Math.max(0, Math.floor(clipLeft / cellW));
          const c1 = Math.min(cols - 1, Math.floor((clipRight - 0.01) / cellW));
          const r0 = Math.max(0, Math.floor(clipTop / cellH));
          const r1 = Math.min(rows - 1, Math.floor((clipBottom - 0.01) / cellH));
          const isOpaque = bgColor.alpha >= 0.99;
          const [cr, cg, cb] = bgColor.rgb;
          const a = bgColor.alpha;
          const invA = 1 - a;

          for (let row = r0; row <= r1; row++) {
            const rowOffset = row * cols;
            for (let col = c0; col <= c1; col++) {
              const idx = rowOffset + col;
              if (isOpaque) {
                gridR[idx] = cr;
                gridG[idx] = cg;
                gridB[idx] = cb;
              } else {
                gridR[idx] = Math.round(cr * a + gridR[idx] * invA);
                gridG[idx] = Math.round(cg * a + gridG[idx] * invA);
                gridB[idx] = Math.round(cb * a + gridB[idx] * invA);
              }
            }
          }
        }

        // Ink color accumulation on direct text nodes
        const hasDirectText = Array.from(el.childNodes).some(
          (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0,
        );
        if (hasDirectText) {
          const ink = resolveCssColor(s.color, el);
          if (ink) {
            const resolvedInk =
              ink.alpha < 0.99
                ? makeColorRecord(compositeRgb(ink.rgb, ink.alpha, resolveElementEffectiveBg(el).rgb))
                : ink;
            addWeighted(inkAreaMap, resolvedInk.hex, Math.max(clippedArea, 100), resolvedInk);
          }
        }

        // Accent extraction from interactive elements and chromatic pills/buttons
        const btnType = (el.getAttribute('type') || '').toLowerCase();
        const isInteractive =
          tag === 'BUTTON' ||
          el.getAttribute('role') === 'button' ||
          (tag === 'INPUT' && (btnType === 'submit' || btnType === 'button')) ||
          (tag === 'A' && (Boolean(bgColor) || parseFloat(s.borderTopWidth) > 0));

        if (isInteractive) {
          const rawAccent = bgColor || resolveCssColor(s.color, el);
          if (rawAccent) {
            const finalAccent =
              rawAccent.alpha < 0.99
                ? makeColorRecord(compositeRgb(rawAccent.rgb, rawAccent.alpha, resolveElementEffectiveBg(el).rgb))
                : rawAccent;
            addWeighted(accentCandidateMap, finalAccent.hex, Math.max(r.width * r.height, 1200), {
              ...finalAccent,
              fromInteractive: true,
            });
          }
        } else if (tag === 'A') {
          const linkInk = resolveCssColor(s.color, el);
          if (linkInk && linkInk.chroma >= 0.15 && linkInk.saturation >= 0.25) {
            addWeighted(accentCandidateMap, linkInk.hex, Math.max(r.width * r.height, 400), {
              ...linkInk,
              fromInteractive: false,
            });
          }
        } else if (bgColor && bgColor.chroma >= 0.18 && bgColor.saturation >= 0.25 && r.height <= 96 && r.width * r.height <= vw * 40) {
          const finalChip =
            bgColor.alpha < 0.99
              ? makeColorRecord(compositeRgb(bgColor.rgb, bgColor.alpha, resolveElementEffectiveBg(el).rgb))
              : bgColor;
          addWeighted(accentCandidateMap, finalChip.hex, Math.max(r.width * r.height, 400), {
            ...finalChip,
            fromInteractive: false,
          });
        }

        // Borders extraction (check top, right, bottom, left so bottom-only hairlines are captured)
        const sideDefs = [
          [s.borderTopWidth, s.borderTopStyle, s.borderTopColor],
          [s.borderBottomWidth, s.borderBottomStyle, s.borderBottomColor],
          [s.borderLeftWidth, s.borderLeftStyle, s.borderLeftColor],
          [s.borderRightWidth, s.borderRightStyle, s.borderRightColor],
        ];
        for (const [wRaw, st, colRaw] of sideDefs) {
          const wPx = parseFloat(wRaw);
          if (wPx > 0 && st && st !== 'none') {
            const bCol = resolveCssColor(colRaw, el);
            if (bCol) {
              const finalBorder =
                bCol.alpha < 0.99
                  ? makeColorRecord(compositeRgb(bCol.rgb, bCol.alpha, resolveElementEffectiveBg(el).rgb))
                  : bCol;
              const widthPx = Number(wPx.toFixed(2));
              const bKey = `${finalBorder.hex}|${widthPx}|${st}`;
              addWeighted(borderMap, bKey, 1, { hex: finalBorder.hex, widthPx, style: st });
              break; // count at most once per element so 4-sided borders don't 4x inflate
            }
          }
        }
      }

      // Tally surfaceRatio from coverage grid
      const bgPixelMap = new Map();
      let lightCells = 0;
      let darkCells = 0;
      let midAccentCells = 0;

      for (let i = 0; i < totalCells; i++) {
        const rgb = [gridR[i], gridG[i], gridB[i]];
        const hex = rgbToHex(rgb[0], rgb[1], rgb[2]);
        bgPixelMap.set(hex, (bgPixelMap.get(hex) || 0) + 1);
        const lum = relativeLuminance(rgb);
        if (lum >= 0.6) lightCells++;
        else if (lum <= 0.2) darkCells++;
        else midAccentCells++;
      }

      const lightPct = Number(((lightCells / totalCells) * 100).toFixed(1));
      const darkPct = Number(((darkCells / totalCells) * 100).toFixed(1));
      const accentPct = Number(Math.max(0, 100 - lightPct - darkPct).toFixed(1));
      const dominantPolarity = lightPct >= darkPct ? 'light' : 'dark';

      const topBackgrounds = Array.from(bgPixelMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([hex, count]) => ({
          hex,
          sharePct: Number(((count / totalCells) * 100).toFixed(1)),
          areaPx: Math.round(count * cellArea),
        }));

      const majorBgRgbs = topBackgrounds
        .filter((b) => b.sharePct >= 5)
        .map((b) => resolveCssColor(b.hex)?.rgb)
        .filter(Boolean);
      const primaryBgRgb = majorBgRgbs[0] || rootCanvas.rgb;

      const allAccentCandidates = Array.from(accentCandidateMap.values());
      const nonMajorBgAccents = allAccentCandidates.filter(
        (item) => !majorBgRgbs.some((bgRgb) => colorDistance(item.meta.rgb, bgRgb) <= 12),
      );
      const accentPool =
        nonMajorBgAccents.length > 0
          ? nonMajorBgAccents
          : allAccentCandidates.filter((item) => colorDistance(item.meta.rgb, primaryBgRgb) > 10);

      const topAccents = accentPool
        .sort((a, b) => {
          const aScore = a.weight * (a.meta.fromInteractive ? 2 : 1) * (1 + (a.meta.chroma || 0) * 4);
          const bScore = b.weight * (b.meta.fromInteractive ? 2 : 1) * (1 + (b.meta.chroma || 0) * 4);
          return bScore - aScore;
        })
        .slice(0, 6)
        .map((item) => ({
          hex: item.key,
          areaPx: Math.round(item.weight),
        }));

      const topBorders = Array.from(borderMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)
        .map((item) => ({
          hex: item.meta.hex,
          widthPx: item.meta.widthPx,
          style: item.meta.style,
          count: item.count,
        }));

      const topInks = Array.from(inkAreaMap.values())
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 6)
        .map((item) => ({
          hex: item.key,
          areaPx: Math.round(item.weight),
        }));

      const surfaceRatio = {
        dominantPolarity,
        lightPct,
        darkPct,
        accentPct,
        midOrAccentPct: accentPct,
        topBackgrounds,
        topAccents,
        topBorders,
      };

      // Typography extraction
      const parseWeight = (raw) => {
        const n = Number(raw);
        if (Number.isFinite(n) && n > 0) return n;
        const low = String(raw || '').toLowerCase();
        if (low === 'bold') return 700;
        if (low === 'normal') return 400;
        return 400;
      };

      const extractTypeMetrics = (el) => {
        if (!el) return null;
        const s = getComputedStyle(el);
        const fontSizePx = Number((parseFloat(s.fontSize) || 0).toFixed(2));
        const lhPx = parseFloat(s.lineHeight);
        const lineHeightRatio =
          Number.isFinite(lhPx) && fontSizePx > 0 ? Number((lhPx / fontSizePx).toFixed(2)) : null;
        const letterSpacingPx =
          s.letterSpacing === 'normal'
            ? 0
            : Number.isFinite(parseFloat(s.letterSpacing))
              ? Number(parseFloat(s.letterSpacing).toFixed(2))
              : 0;
        const letterSpacingEm =
          fontSizePx > 0 ? Number((letterSpacingPx / fontSizePx).toFixed(4)) : 0;
        const primaryFamily = String(s.fontFamily || '')
          .split(',')[0]
          .trim()
          .replace(/^["']+|["']+$/g, '')
          .trim();

        return {
          fontFamily: s.fontFamily,
          primaryFamily,
          fontWeight: parseWeight(s.fontWeight),
          fontSizePx,
          lineHeightRatio,
          letterSpacingPx,
          letterSpacingEm,
        };
      };

      const pickFirstVisible = (selector) => {
        for (const el of document.querySelectorAll(selector)) {
          if (isVisibleElement(el) && (el.innerText || el.value || el.textContent || '').trim().length > 0) {
            return el;
          }
        }
        return document.querySelector(selector);
      };

      const pickDominantBodyEl = () => {
        let best = null;
        let bestScore = -1;
        for (const el of document.querySelectorAll('main p, article p, section p, p')) {
          if (!isVisibleElement(el)) continue;
          const s = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          const fsPx = parseFloat(s.fontSize) || 0;
          const len = (el.innerText || '').trim().length;
          if (r.width < 120 || r.height < 12 || fsPx < 12 || len < 25) continue;
          const score = Math.min(len, 240) * Math.min(r.width, 900);
          if (score > bestScore) {
            bestScore = score;
            best = el;
          }
        }
        return best || pickFirstVisible('main p, article p, p, body');
      };

      const h1Slot = extractTypeMetrics(pickFirstVisible('h1'));
      const h2Slot = extractTypeMetrics(pickFirstVisible('main h2, h2'));
      const h3Slot = extractTypeMetrics(pickFirstVisible('main h3, h3'));
      const bodySlot = extractTypeMetrics(pickDominantBodyEl());
      const smallSlot = extractTypeMetrics(pickFirstVisible('small, footer p, footer'));
      const buttonSlot = extractTypeMetrics(pickFirstVisible('button, [role="button"], a[class*="btn"], a[class*="button"]'));
      const codeSlot = extractTypeMetrics(pickFirstVisible('pre code, code, pre'));

      // Compute dominantHeadingWeight weighted by visual prominence across h1 (or h2/h3 if no h1)
      const computeDominantHeadingWeight = () => {
        const headingEls = Array.from(document.querySelectorAll('h1')).filter(isVisibleElement);
        const pool = headingEls.length > 0 ? headingEls : Array.from(document.querySelectorAll('h2, h3')).filter(isVisibleElement);
        if (pool.length === 0) return h1Slot?.fontWeight ?? h2Slot?.fontWeight ?? h3Slot?.fontWeight ?? null;
        const weightScores = new Map();
        for (const h of pool) {
          const s = getComputedStyle(h);
          const w = parseWeight(s.fontWeight);
          const fs = parseFloat(s.fontSize) || 16;
          const r = h.getBoundingClientRect();
          const score = fs * fs * Math.max(r.width, 100);
          weightScores.set(w, (weightScores.get(w) || 0) + score);
        }
        return Array.from(weightScores.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      };

      const loadedFontFamiliesSet = new Set();
      for (const f of document.fonts || []) {
        if (f.status === 'loaded') {
          const clean = String(f.family || '').replace(/["']/g, '').trim();
          if (clean) loadedFontFamiliesSet.add(clean);
        }
      }

      const fontFaceSources = {};
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules || []) {
            if (rule.type === CSSRule.FONT_FACE_RULE && rule.style) {
              const fam = (rule.style.getPropertyValue('font-family') || '')
                .replace(/["']/g, '')
                .trim()
                .toLowerCase();
              const src = rule.style.getPropertyValue('src') || '';
              if (fam) fontFaceSources[fam] = `${fontFaceSources[fam] || ''} ${src}`;
            }
          }
        } catch {
          // Cross-origin stylesheet cannot be inspected synchronously
        }
      }

      const h1ToBodyRatio =
        h1Slot && bodySlot && bodySlot.fontSizePx > 0
          ? Number((h1Slot.fontSizePx / bodySlot.fontSizePx).toFixed(2))
          : null;

      const typography = {
        h1: h1Slot,
        h2: h2Slot,
        h3: h3Slot,
        body: bodySlot,
        small: smallSlot,
        button: buttonSlot,
        code: codeSlot,
        h1ToBodyRatio,
        dominantHeadingWeight: computeDominantHeadingWeight(),
        loadedFontFamilies: Array.from(loadedFontFamiliesSet),
      };

      // Geometry Lock sampling
      const normalizeRadius = (raw) => {
        const clean = String(raw || '').trim();
        return clean || '0px';
      };

      const createRadiusTracker = () => {
        const map = new Map();
        let samples = 0;
        return {
          add(radiusStr, area) {
            const key = normalizeRadius(radiusStr);
            samples++;
            const prev = map.get(key);
            if (prev) {
              prev.count += 1;
              prev.area += area;
            } else {
              map.set(key, { key, count: 1, area });
            }
          },
          get modal() {
            if (map.size === 0) return null;
            return Array.from(map.values()).sort((a, b) => b.count - a.count || b.area - a.area)[0].key;
          },
          get count() {
            return samples;
          },
        };
      };

      const cardRadii = createRadiusTracker();
      const buttonRadii = createRadiusTracker();
      const inputRadii = createRadiusTracker();
      const mediaRadii = createRadiusTracker();
      const shadowMap = new Map();
      let shadowedElements = 0;
      let hairlineBorders = 0;

      const hasVisibleSideBorder = (s) => {
        const sides = [
          [s.borderTopWidth, s.borderTopStyle, s.borderTopColor],
          [s.borderRightWidth, s.borderRightStyle, s.borderRightColor],
          [s.borderBottomWidth, s.borderBottomStyle, s.borderBottomColor],
          [s.borderLeftWidth, s.borderLeftStyle, s.borderLeftColor],
        ];
        let maxW = 0;
        let hasAny = false;
        let allFour = true;
        for (const [wRaw, st, colRaw] of sides) {
          const w = parseFloat(wRaw) || 0;
          if (w > 0 && st !== 'none' && resolveCssColor(colRaw)) {
            hasAny = true;
            if (w > maxW) maxW = w;
          } else {
            allFour = false;
          }
        }
        return { hasAny, allFour, maxW };
      };

      for (const el of allBodyEls) {
        if (el === probeSpan) continue;
        if (!isVisibleElement(el)) continue;
        const tag = el.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'SVG' || tag === 'PATH') continue;

        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        const area = r.width * r.height;
        const borderInfo = hasVisibleSideBorder(s);
        if (borderInfo.hasAny && borderInfo.maxW <= 1.5 && r.width >= 24) {
          hairlineBorders++;
        }

        const hasShadow = Boolean(s.boxShadow && s.boxShadow !== 'none');
        if (hasShadow && r.width >= 24 && r.height >= 24) {
          shadowedElements++;
          shadowMap.set(s.boxShadow, (shadowMap.get(s.boxShadow) || 0) + 1);
        }

        // Media frames: img, video, canvas, figure
        if ((tag === 'IMG' || tag === 'VIDEO' || tag === 'CANVAS' || tag === 'FIGURE') && r.width >= 24 && r.height >= 24) {
          let rad = normalizeRadius(s.borderRadius);
          if (rad === '0px' && tag !== 'FIGURE' && el.parentElement) {
            const ps = getComputedStyle(el.parentElement);
            const pr = el.parentElement.getBoundingClientRect();
            if (
              (ps.overflow === 'hidden' || ps.overflow === 'clip') &&
              normalizeRadius(ps.borderRadius) !== '0px' &&
              pr.width * pr.height <= area * 1.4
            ) {
              rad = normalizeRadius(ps.borderRadius);
            }
          }
          mediaRadii.add(rad, area);
          continue;
        }

        // Inputs: input (text-like), select, textarea
        const inputType = (el.getAttribute('type') || '').toLowerCase();
        if (
          ((tag === 'INPUT' && !['hidden', 'checkbox', 'radio', 'submit', 'button', 'reset'].includes(inputType)) ||
            tag === 'SELECT' ||
            tag === 'TEXTAREA') &&
          r.width >= 24 &&
          r.height >= 16
        ) {
          inputRadii.add(s.borderRadius, area);
          continue;
        }

        // Buttons: button, [role="button"], submit/button inputs, styled <a> CTAs
        const bgResolved = resolveCssColor(s.backgroundColor, el);
        const isButtonLike =
          tag === 'BUTTON' ||
          el.getAttribute('role') === 'button' ||
          (tag === 'INPUT' && (inputType === 'submit' || inputType === 'button')) ||
          (tag === 'A' && (Boolean(bgResolved) || borderInfo.allFour));
        if (isButtonLike && r.width >= 20 && r.height >= 16) {
          buttonRadii.add(s.borderRadius, area);
          continue;
        }

        // Cards / containers: >= 160x80 with border / distinct bg / radius / shadow
        if (
          r.width >= 160 &&
          r.height >= 80 &&
          !['HTML', 'BODY', 'MAIN', 'HEADER', 'FOOTER', 'NAV'].includes(tag) &&
          !(r.width >= vw * 0.95 && r.height >= docHeight * 0.8)
        ) {
          const hasRadius = normalizeRadius(s.borderRadius) !== '0px';
          const hasDistinctBg = Boolean(bgResolved) && colorDistance(bgResolved.rgb, rootCanvas.rgb) > 4;
          const isFullWidthSectionDivider =
            tag === 'SECTION' && r.width >= vw * 0.9 && !hasRadius && !hasShadow && !borderInfo.allFour;

          if (!isFullWidthSectionDivider && (borderInfo.allFour || hasDistinctBg || hasRadius || hasShadow)) {
            cardRadii.add(s.borderRadius, area);
          }
        }
      }

      const boxShadows = Array.from(shadowMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([value, count]) => ({ value, count }));

      const geometryLock = {
        cardRadius: cardRadii.modal,
        buttonRadius: buttonRadii.modal,
        inputRadius: inputRadii.modal,
        mediaRadius: mediaRadii.modal,
        hasDropShadows: shadowedElements > 0,
        flatHairlineSystem: boxShadows.length === 0 || (shadowedElements <= 2 && boxShadows.length <= 1),
        boxShadows,
        sampleCounts: {
          cards: cardRadii.count,
          buttons: buttonRadii.count,
          inputs: inputRadii.count,
          media: mediaRadii.count,
          shadowedElements,
          hairlineBorders,
        },
      };

      // Section Alignment Audit at 1440px
      const bandCandidates = [];
      const seenBands = new Set();
      const addBandCandidate = (el) => {
        if (!el || seenBands.has(el)) return;
        const tag = el.tagName;
        if (['SCRIPT', 'STYLE', 'NAV', 'FOOTER', 'DIALOG', 'TEMPLATE', 'NOSCRIPT'].includes(tag)) return;
        if (!isVisibleElement(el)) return;
        const r = el.getBoundingClientRect();
        if (r.width < 320 || r.height < 80) return;
        if (tag === 'HEADER') {
          const hasHeroHeading = Boolean(el.querySelector('h1, h2'));
          if (!hasHeroHeading && r.height < 200) return;
        }
        const textLen = (el.innerText || '').trim().length;
        const hasHeading = Boolean(el.querySelector('h1, h2, h3'));
        if (!hasHeading && textLen < 8) return;
        seenBands.add(el);
        bandCandidates.push(el);
      };

      for (const el of document.querySelectorAll('main > *, section, header, [class*="hero"]')) {
        addBandCandidate(el);
      }
      if (bandCandidates.length === 0 && bodyEl) {
        for (const el of bodyEl.children) addBandCandidate(el);
      }

      // Deduplicate wrapper containers vs nested sections cleanly
      const dedupedBands = bandCandidates.filter((el) => {
        const tag = el.tagName;
        // If this non-section wrapper contains multiple candidate bands inside it, unwrap it
        const childCandidates = bandCandidates.filter((other) => other !== el && el.contains(other));
        if (tag !== 'SECTION' && tag !== 'HEADER' && childCandidates.length >= 1) {
          return false;
        }
        // If an ancestor <section>/<header> already owns this band, keep the outer band
        const parentBand = bandCandidates.find(
          (other) => other !== el && other.contains(el) && (other.tagName === 'SECTION' || other.tagName === 'HEADER'),
        );
        if (parentBand) return false;
        return true;
      });

      dedupedBands.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);

      const isMultiColumnNode = (node) => {
        if (!node) return false;
        const cs = getComputedStyle(node);
        if (cs.display === 'grid' || cs.display === 'inline-grid') {
          const colsCount =
            cs.gridTemplateColumns && cs.gridTemplateColumns !== 'none'
              ? cs.gridTemplateColumns.split(' ').filter(Boolean).length
              : 0;
          if (colsCount >= 2) return true;
        }
        if ((cs.display === 'flex' || cs.display === 'inline-flex') && cs.flexDirection === 'row') {
          const kids = Array.from(node.children).filter(isVisibleElement);
          if (kids.length >= 2) {
            const r0 = kids[0].getBoundingClientRect();
            const r1 = kids[1].getBoundingClientRect();
            const vertOverlap = Math.min(r0.bottom, r1.bottom) - Math.max(r0.top, r1.top);
            if (vertOverlap > 12 && (r0.right <= r1.left + 12 || r1.right <= r0.left + 12)) {
              return true;
            }
          }
        }
        return false;
      };

      const findContentContainer = (band) => {
        const kids = Array.from(band.children).filter(isVisibleElement);
        if (kids.length === 1 && (kids[0].tagName === 'DIV' || kids[0].tagName === 'SECTION')) {
          return kids[0];
        }
        return band;
      };

      const sequence = [];
      let centeredCount = 0;
      let leftOrSplitCount = 0;
      let currentCenteredStreak = 0;
      let maxConsecutiveCentered = 0;

      for (let i = 0; i < Math.min(dedupedBands.length, 24); i++) {
        const band = dedupedBands[i];
        const container = findContentContainer(band);
        const containerRect = container.getBoundingClientRect();
        const containerCenter = (containerRect.left + containerRect.right) / 2;

        const headingEl =
          Array.from(band.querySelectorAll('h1, h2, h3')).find(isVisibleElement) ||
          Array.from(band.querySelectorAll('p')).find(isVisibleElement) ||
          container;
        const hStyle = getComputedStyle(headingEl);
        const hRect = headingEl.getBoundingClientRect();

        // Check if the heading sits inside a multi-column card/split rather than a full-width header block
        let hasMultiColContext = isMultiColumnNode(container) || isMultiColumnNode(band);
        if (!hasMultiColContext) {
          for (const child of container.children) {
            if (isVisibleElement(child) && isMultiColumnNode(child)) {
              hasMultiColContext = true;
              break;
            }
          }
        }

        // Measure the heading's block wrapper or the heading itself relative to container
        const hBlock = headingEl === container ? headingEl : headingEl;
        const hCenter = (hRect.left + hRect.right) / 2;
        const centerOffsetPx = Math.round(Math.abs(hCenter - containerCenter));
        const leftGap = hRect.left - containerRect.left;
        const rightGap = containerRect.right - hRect.right;
        const isConstrainedCentered =
          hRect.width < containerRect.width - 64 &&
          leftGap >= 24 &&
          rightGap >= 24 &&
          Math.abs(leftGap - rightGap) <= 48;
        const textAlign = hStyle.textAlign || 'start';
        const isTextCentered = textAlign === 'center' || textAlign === '-webkit-center';

        const isCentered =
          centerOffsetPx <= 48 &&
          (isTextCentered || isConstrainedCentered);

        const alignment = isCentered ? 'centered' : 'left-or-split';
        if (alignment === 'centered') {
          centeredCount++;
          currentCenteredStreak++;
          if (currentCenteredStreak > maxConsecutiveCentered) {
            maxConsecutiveCentered = currentCenteredStreak;
          }
        } else {
          leftOrSplitCount++;
          currentCenteredStreak = 0;
        }

        sequence.push({
          index: i,
          tag: band.tagName.toLowerCase(),
          heading: headingEl !== container ? (headingEl.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 80) : null,
          alignment,
          textAlign,
          isMultiColumn: hasMultiColContext,
          centerOffsetPx,
        });
      }

      const sectionsAnalyzed = sequence.length;
      const centeredPct =
        sectionsAnalyzed > 0 ? Number(((centeredCount / sectionsAnalyzed) * 100).toFixed(1)) : 0;
      const leftAlignedPct =
        sectionsAnalyzed > 0 ? Number((100 - centeredPct).toFixed(1)) : 0;

      const alignmentAudit = {
        sectionsAnalyzed,
        centeredCount,
        leftOrSplitCount,
        leftAlignedPct,
        centeredPct,
        maxConsecutiveCentered,
        sequence,
      };

      if (probeSpan && probeSpan.parentNode) {
        probeSpan.parentNode.removeChild(probeSpan);
      }

      return {
        title: document.title || '',
        surfaceRatio,
        typography,
        geometryLock,
        alignmentAudit,
        topInks,
        fontFaceSources,
      };
    });

    const commercialFontHints = detectCommercialFontHints(
      extracted.typography.loadedFontFamilies,
      extracted.fontFaceSources,
      fontAssetUrls,
    );

    const typography = {
      ...extracted.typography,
      commercialFontHints,
    };

    const cssTokensSnippet = buildCssTokensSnippet({
      surfaceRatio: extracted.surfaceRatio,
      typography,
      geometryLock: extracted.geometryLock,
      topInks: extracted.topInks,
    });

    const report = {
      meta: {
        url,
        finalUrl: page.url(),
        title: extracted.title,
        status: nav.status,
        blocked: false,
        capturedAt: new Date().toISOString(),
        outputPath: outFile,
      },
      surfaceRatio: extracted.surfaceRatio,
      typography,
      geometryLock: extracted.geometryLock,
      alignmentAudit: extracted.alignmentAudit,
      cssTokensSnippet,
    };

    await fs.writeFile(outFile, `${JSON.stringify(report, null, 2)}\n`);
    return report;
  } finally {
    await browser.close();
  }
}

const isMain = (() => {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1]);
  } catch {
    return false;
  }
})();

if (isMain) {
  const [, , targetUrl, outPathOrDir = './reference-out'] = process.argv;
  if (!targetUrl) {
    console.error('Usage: node skills/unslop/scripts/extract_reference.mjs <url> [outputDirOrJsonPath]');
    process.exit(1);
  }
  const report = await extractReference(targetUrl, outPathOrDir);
  console.log(JSON.stringify(report, null, 2));
}
