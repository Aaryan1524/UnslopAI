import fs from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureDir, launchBrowser, safeNavigate } from './browser_helper.mjs';

async function setPinnedChromeHidden(page, excludeIdx, hidden) {
  await page.evaluate(
    ({ exIdx, hide }) => {
      if (hide) {
        for (const el of document.querySelectorAll('body *')) {
          if (el.getAttribute('data-unslop-audit-sec') === String(exIdx)) continue;
          if (el.closest(`[data-unslop-audit-sec="${exIdx}"]`)) continue;
          const s = getComputedStyle(el);
          const isTopStickyChrome =
            s.position === 'sticky' &&
            (el.tagName === 'HEADER' || el.tagName === 'NAV' || el.getAttribute('role') === 'banner') &&
            (parseFloat(s.top) <= 24 || s.top === '0px');
          if (s.position === 'fixed' || isTopStickyChrome) {
            el.setAttribute('data-unslop-audit-prev-vis', el.style.visibility || '');
            el.style.visibility = 'hidden';
            el.setAttribute('data-unslop-audit-hidden', '1');
          }
        }
      } else {
        for (const el of document.querySelectorAll('[data-unslop-audit-hidden="1"]')) {
          el.style.visibility = el.getAttribute('data-unslop-audit-prev-vis') || '';
          el.removeAttribute('data-unslop-audit-prev-vis');
          el.removeAttribute('data-unslop-audit-hidden');
        }
      }
    },
    { exIdx: excludeIdx, hide: hidden },
  );
}

async function measureDataUrlVariance(page, dataUrl) {
  return page.evaluate(async (src) => {
    const img = new Image();
    img.src = src;
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
    });
    const c = document.createElement('canvas');
    c.width = 24;
    c.height = 24;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, 24, 24);
    const { data } = ctx.getImageData(0, 0, 24, 24);
    let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;
    let nonZeroAlpha = 0;
    const buckets = new Set();
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a > 8) nonZeroAlpha++;
      if (r < minR) minR = r; if (r > maxR) maxR = r;
      if (g < minG) minG = g; if (g > maxG) maxG = g;
      if (b < minB) minB = b; if (b > maxB) maxB = b;
      buckets.add(`${r >> 4},${g >> 4},${b >> 4}`);
    }
    const maxSpread = Math.max(maxR - minR, maxG - minG, maxB - minB);
    return { maxSpread, colorBuckets: buckets.size, nonZeroAlpha };
  }, dataUrl);
}

async function sampleRawCanvasFrame(page, cLoc) {
  // Prefer raw uncontaminated canvas.toDataURL() (with preserveDrawingBuffer:true injected at init);
  // fall back to element screenshot only on tainted cross-origin canvases
  try {
    const raw = await cLoc.evaluate((el) => {
      try {
        return { dataUrl: el.toDataURL('image/png'), method: 'raw-canvas' };
      } catch {
        return null;
      }
    });
    if (raw?.dataUrl && raw.dataUrl.length > 64) return raw;
  } catch {
    // Fall through
  }
  const buf = await cLoc.screenshot({ timeout: 3000 });
  return { dataUrl: `data:image/png;base64,${buf.toString('base64')}`, method: 'composited-fallback' };
}

async function checkViewportOverflow(page, width, height) {
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(180);
  return page.evaluate(() => {
    const docOverflowPx = Math.max(0, Math.round(document.documentElement.scrollWidth - document.documentElement.clientWidth));
    const offenders = [];
    if (docOverflowPx > 1) {
      const vw = window.innerWidth;
      for (const el of document.querySelectorAll('body *')) {
        const s = getComputedStyle(el);
        if (s.display === 'none' || s.visibility === 'hidden') continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (r.right > vw + 1) {
          offenders.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            className: typeof el.className === 'string' ? el.className.slice(0, 60) : null,
            rightPx: Math.round(r.right),
            overflowPx: Math.round(r.right - vw),
          });
          if (offenders.length >= 5) break;
        }
      }
    }
    return { width: window.innerWidth, docOverflowPx, offenders };
  });
}

async function probeKeyboardFocus(page, screenshotPath) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(120);

  const tabResults = [];
  let savedScreenshotFocus = false;
  const seen = new Set();

  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(75);

    const active = await page.evaluate(() => {
      for (const stale of document.querySelectorAll('[data-unslop-focus-probe]')) {
        stale.removeAttribute('data-unslop-focus-probe');
      }
      const el = document.activeElement;
      if (!el || el === document.body || el === document.documentElement) return null;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return null;
      const focused = getComputedStyle(el);
      return {
        tag: el.tagName.toLowerCase(),
        label: (el.innerText || el.getAttribute('aria-label') || el.getAttribute('placeholder') || '').trim().slice(0, 40),
        focusSnapshot: {
          outlineStyle: focused.outlineStyle,
          outlineWidth: focused.outlineWidth,
          outlineColor: focused.outlineColor,
          boxShadow: focused.boxShadow,
          borderColor: focused.borderColor,
          backgroundColor: focused.backgroundColor,
          color: focused.color,
        },
      };
    });

    if (!active) continue;
    const key = `${active.tag}:${active.label}`;
    if (seen.has(key)) continue;
    seen.add(key);

    if (!savedScreenshotFocus) {
      await page.screenshot({ path: screenshotPath });
      savedScreenshotFocus = true;
    }

    const blurSnapshot = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      el.blur();
      const s = getComputedStyle(el);
      const snap = {
        outlineStyle: s.outlineStyle,
        outlineWidth: s.outlineWidth,
        outlineColor: s.outlineColor,
        boxShadow: s.boxShadow,
        borderColor: s.borderColor,
        backgroundColor: s.backgroundColor,
        color: s.color,
      };
      el.focus({ preventScroll: true });
      return snap;
    });

    const outlineTransparent =
      !active.focusSnapshot.outlineColor ||
      active.focusSnapshot.outlineColor === 'transparent' ||
      /rgba?\([^)]*,\s*0(?:\.0+)?\s*\)/.test(active.focusSnapshot.outlineColor) ||
      /\/\s*0(?:\.0+)?\s*\)/.test(active.focusSnapshot.outlineColor);

    const hasOutline =
      active.focusSnapshot.outlineStyle !== 'none' &&
      parseFloat(active.focusSnapshot.outlineWidth) >= 1 &&
      !outlineTransparent;

    const styleChanged =
      blurSnapshot &&
      Object.keys(active.focusSnapshot).some((k) => active.focusSnapshot[k] !== blurSnapshot[k]);

    tabResults.push({
      tag: active.tag,
      label: active.label,
      visibleIndicator: Boolean(hasOutline || styleChanged),
    });
  }

  if (!savedScreenshotFocus) {
    await page.screenshot({ path: screenshotPath });
  }
  return tabResults;
}

export async function auditUI(url, outputDir) {
  const outDir = await ensureDir(outputDir);
  const sectionsDir = await ensureDir(path.join(outDir, 'sections'));
  const browser = await launchBrowser();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Force preserveDrawingBuffer:true on WebGL contexts so audit_ui can sample raw uncontaminated canvas frames
  await page.addInitScript(() => {
    const origGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, attrs) {
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
        return origGetContext.call(this, type, { ...(attrs || {}), preserveDrawingBuffer: true });
      }
      return origGetContext.call(this, type, attrs);
    };
  });

  const FONT_CDN_HOSTS = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'api.fontshare.com',
    'cdn.fontshare.com',
    'fonts.bunny.net',
  ];
  const isExternalFontUrl = (u) => FONT_CDN_HOSTS.some((h) => (u || '').includes(h));

  const consoleErrors = [];
  const rawOfflineConsoleCandidates = [];
  const pageErrors = [];
  const failedRequests = [];
  const offlineBlockedFontUrls = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const locUrl = msg.location()?.url || '';
      const text = msg.text().slice(0, 300);
      if (locUrl.endsWith('/favicon.ico')) return;
      if (isExternalFontUrl(locUrl) && /ERR_NAME_NOT_RESOLVED|ERR_INTERNET_DISCONNECTED|ERR_CONNECTION_REFUSED|Failed to load resource/i.test(text)) {
        return;
      }
      if (/Failed to load resource.*(?:ERR_NAME_NOT_RESOLVED|ERR_INTERNET_DISCONNECTED|ERR_CONNECTION_REFUSED)/i.test(text)) {
        rawOfflineConsoleCandidates.push(text);
        return;
      }
      consoleErrors.push(text);
    }
  });
  page.on('pageerror', (err) => {
    pageErrors.push(String(err?.message || err).slice(0, 300));
  });
  page.on('response', (res) => {
    if (res.status() >= 400 && !res.url().includes('favicon.ico')) {
      failedRequests.push({ url: res.url(), status: res.status() });
    }
  });
  page.on('requestfailed', (req) => {
    const errText = req.failure()?.errorText || 'failed';
    if (isExternalFontUrl(req.url()) && /ERR_NAME_NOT_RESOLVED|ERR_INTERNET_DISCONNECTED|ERR_CONNECTION_REFUSED/i.test(errText)) {
      offlineBlockedFontUrls.push(req.url());
      return;
    }
    failedRequests.push({ url: req.url(), error: errText });
  });

  try {
    const nav = await safeNavigate(page, url);
    if (nav.blocked) {
      const blockedReport = {
        meta: { url, auditedAt: new Date().toISOString(), blocked: true, blockReason: nav.reason, status: nav.status },
        summary: {
          passed: false,
          criticalErrorCount: 1,
          warningCount: 0,
          criticalErrors: [`Target URL blocked automated audit: ${nav.reason || `HTTP ${nav.status}`}`],
          warnings: [],
        },
      };
      await fs.writeFile(path.join(outDir, 'audit.json'), JSON.stringify(blockedReport, null, 2));
      return blockedReport;
    }

    // Fine-grained hydration step-scroll (0.75 * vh increments, capped at 20 steps)
    const { scrollHeight, innerHeight } = await page.evaluate(() => ({
      scrollHeight: document.documentElement.scrollHeight,
      innerHeight: window.innerHeight || 900,
    }));
    if (scrollHeight > innerHeight * 1.1) {
      const step = Math.max(500, Math.round(innerHeight * 0.75));
      const totalSteps = Math.min(20, Math.ceil((scrollHeight - innerHeight) / step));
      for (let i = 1; i <= totalSteps; i++) {
        const y = Math.min(scrollHeight - innerHeight, Math.round((scrollHeight - innerHeight) * (i / totalSteps)));
        await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
        await page.waitForTimeout(140);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(220);
    }

    await page.screenshot({ path: path.join(outDir, 'desktop.png') });
    await page.screenshot({ path: path.join(outDir, 'desktop-full.png'), fullPage: true });

    const scrollSnapshots = [];
    if (scrollHeight > 1600) {
      for (const [label, frac] of [['scroll-25.png', 0.25], ['scroll-50.png', 0.5], ['scroll-75.png', 0.75]]) {
        await page.evaluate((y) => window.scrollTo(0, y), Math.round((scrollHeight - 900) * frac));
        await page.waitForTimeout(240);
        await page.screenshot({ path: path.join(outDir, label) });
        scrollSnapshots.push(label);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(180);
    }

    // Deduplicated section discovery (eliminates duplicate custom-element + inner <section> captures!)
    const lowOpacitySections = [];
    const scrollMotionChecks = [];
    const sectionMeta = await page.evaluate(() => {
      const pool = new Set();
      for (const el of document.querySelectorAll('body > header, header, main > *, section, footer')) {
        if (el.closest('header') && el.tagName !== 'HEADER') continue;
        if (el.closest('footer') && el.tagName !== 'FOOTER') continue;
        if (el.hasAttribute('inert') || el.getAttribute('aria-hidden') === 'true') continue;
        const s = getComputedStyle(el);
        if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) < 0.05) continue;
        if (s.position === 'fixed' && el.tagName !== 'HEADER') continue;
        const r = el.getBoundingClientRect();
        if (r.height < 40 || r.width < 300) continue;
        const hasContent =
          el.querySelector('h1, h2, h3, p, button, a, img, canvas, video, svg') ||
          (el.innerText || '').trim().length >= 8;
        if (!hasContent) continue;
        pool.add(el);
      }

      const arr = Array.from(pool);
      const deduped = arr.filter((el) => {
        const elH = Math.max(1, el.getBoundingClientRect().height);
        const childCands = arr.filter((other) => other !== el && el.contains(other));
        if (childCands.length >= 2 && (el.tagName === 'DIV' || el.tagName === 'MAIN')) return false;
        const wrappedBySingleParent = arr.some((other) => {
          if (other === el || !other.contains(el)) return false;
          const otherH = Math.max(1, other.getBoundingClientRect().height);
          const otherChildren = arr.filter((c) => c !== other && other.contains(c));
          return otherChildren.length === 1 && elH / otherH >= 0.85;
        });
        return !wrappedBySingleParent;
      });

      const picked = [];
      for (const el of deduped) {
        const r = el.getBoundingClientRect();
        let hasStickyDescendants = false;
        let hasKineticHints = false;
        for (const d of Array.from(el.querySelectorAll('*')).slice(0, 180)) {
          const ds = getComputedStyle(d);
          if (ds.position === 'sticky') hasStickyDescendants = true;
          if (ds.willChange !== 'auto' || /transform|filter|--/.test(d.getAttribute('style') || '')) {
            hasKineticHints = true;
          }
        }
        const idx = picked.length;
        el.setAttribute('data-unslop-audit-sec', String(idx));
        picked.push({
          idx,
          tag: el.tagName.toLowerCase(),
          y: Math.round(r.top + window.scrollY),
          height: Math.round(r.height),
          hasStickyDescendants,
          hasKineticHints,
        });
        if (picked.length >= 16) break;
      }
      return picked;
    });

    const sectionScreenshots = [];
    for (const sec of sectionMeta) {
      const loc = page.locator(`[data-unslop-audit-sec="${sec.idx}"]`).first();
      const prefix = `${String(sec.idx + 1).padStart(2, '0')}-${sec.tag}`;
      const isHeader = sec.tag === 'header';
      const isChoreographedTrack = (sec.height > 1250 && sec.hasStickyDescendants) || sec.height > 2600;
      try {
        if (!isHeader) await setPinnedChromeHidden(page, sec.idx, true);

        if (!isChoreographedTrack) {
          await loc.scrollIntoViewIfNeeded({ timeout: 2500 });
          await page.waitForTimeout(180);
          const op = await loc.evaluate((el) => {
            const selfOp = parseFloat(getComputedStyle(el).opacity);
            const headings = Array.from(el.querySelectorAll('h1, h2, h3')).filter((h) => {
              const r = h.getBoundingClientRect();
              return r.width > 0 && r.height > 0;
            });
            const headingOp = headings.length > 0 ? Math.max(...headings.map((h) => parseFloat(getComputedStyle(h).opacity))) : 1;
            return Math.min(selfOp, headingOp);
          });
          if (op < 0.85) {
            lowOpacitySections.push({ index: sec.idx, tag: sec.tag, opacity: Number(op.toFixed(2)) });
          }
          const fileName = `${prefix}.png`;
          await loc.screenshot({ path: path.join(sectionsDir, fileName), timeout: 4000 });
          sectionScreenshots.push(`sections/${fileName}`);
        } else {
          const freshBox = await loc.evaluate((el) => {
            const r = el.getBoundingClientRect();
            return { y: Math.round(r.top + window.scrollY), height: Math.round(r.height) };
          });
          const ratios = [0.08, 0.36, 0.66, 0.92];
          const states = [];
          const frames = [];
          for (let f = 0; f < ratios.length; f++) {
            const y = Math.max(0, Math.round(freshBox.y + Math.max(0, freshBox.height - 900) * ratios[f]));
            await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
            await page.waitForTimeout(240);
            const frameName = `${prefix}-t${f}.png`;
            await page.screenshot({ path: path.join(sectionsDir, frameName) });
            frames.push(`sections/${frameName}`);
            sectionScreenshots.push(`sections/${frameName}`);

            const st = await loc.evaluate((el) => {
              const picked = [];
              const seen = new Set();
              const add = (node) => {
                if (!node || seen.has(node) || picked.length >= 16) return;
                if (getComputedStyle(node).display === 'none') return;
                seen.add(node);
                picked.push(node);
              };
              for (const d of el.querySelectorAll('*')) {
                if (picked.length >= 10) break;
                const cs = getComputedStyle(d);
                if (d.getAttribute('style') || cs.willChange !== 'auto' || cs.position === 'sticky') add(d);
              }
              for (const d of el.querySelectorAll('article, figure, li, a, button, img, canvas')) add(d);
              return picked.map((k) => {
                const cs = getComputedStyle(k);
                const vars = [];
                for (let i = 0; i < k.style.length; i++) {
                  const p = k.style[i];
                  if (p.startsWith('--')) vars.push(`${p}:${k.style.getPropertyValue(p).trim()}`);
                }
                return `${cs.transform}|${cs.scale}|${cs.translate}|${cs.rotate}|${cs.opacity}|${cs.filter}|${cs.clipPath}|${cs.borderRadius}|${vars.join(',')}`;
              });
            });
            states.push(JSON.stringify(st));
          }

          // Check settled visibility of the section's in-viewport primary elements at t3
          const settledOp = await loc.evaluate((el) => {
            const selfOp = parseFloat(getComputedStyle(el).opacity);
            const vh = window.innerHeight;
            const visibleNodes = Array.from(el.querySelectorAll('h1, h2, h3, article, a, button')).filter((n) => {
              const r = n.getBoundingClientRect();
              return r.width > 20 && r.height > 20 && r.bottom > 0 && r.top < vh;
            });
            const maxVisibleOp =
              visibleNodes.length > 0 ? Math.max(...visibleNodes.map((n) => parseFloat(getComputedStyle(n).opacity))) : 1;
            return Math.min(selfOp, maxVisibleOp);
          });
          if (settledOp < 0.85) {
            lowOpacitySections.push({ index: sec.idx, tag: sec.tag, opacity: Number(settledOp.toFixed(2)) });
          }
          scrollMotionChecks.push({
            index: sec.idx,
            tag: sec.tag,
            height: freshBox.height,
            hasStickyDescendants: sec.hasStickyDescendants,
            hasKineticHints: sec.hasKineticHints,
            uniqueStates: new Set(states).size,
            kineticChangesDetected: new Set(states).size > 1,
            frames,
          });
        }
      } catch {
        // Ignore transient scroll/screenshot issues on dynamic sections
      } finally {
        if (!isHeader) await setPinnedChromeHidden(page, sec.idx, false);
      }
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(180);

    // Uncontaminated raw <canvas> render & animation delta audit (iterates all canvases until 4 large visible ones are checked)
    const canvasChecks = [];
    const canvasCount = await page.locator('canvas').count();
    for (let ci = 0; ci < canvasCount && canvasChecks.length < 4; ci++) {
      const cLoc = page.locator('canvas').nth(ci);
      try {
        const box = await cLoc.boundingBox();
        if (!box || box.width * box.height < 16000) continue;
        await cLoc.scrollIntoViewIfNeeded({ timeout: 2000 });
        await page.waitForTimeout(220);
        const freshBox = await cLoc.boundingBox();
        if (!freshBox || freshBox.width * freshBox.height < 16000) continue;
        const frame0 = await sampleRawCanvasFrame(page, cLoc);
        await page.mouse.move(freshBox.x + freshBox.width * 0.35, freshBox.y + freshBox.height * 0.45);
        await page.waitForTimeout(160);
        await page.mouse.move(freshBox.x + freshBox.width * 0.65, freshBox.y + freshBox.height * 0.55);
        await page.waitForTimeout(260);
        const frame1 = await sampleRawCanvasFrame(page, cLoc);
        const variance = await measureDataUrlVariance(page, frame0.dataUrl);
        canvasChecks.push({
          index: ci,
          width: Math.round(freshBox.width),
          height: Math.round(freshBox.height),
          method: frame0.method,
          maxColorSpread: variance.maxSpread,
          colorBuckets: variance.colorBuckets,
          isBlank: variance.nonZeroAlpha === 0 || (variance.maxSpread < 4 && variance.colorBuckets <= 1),
          animatesOverTime: frame0.dataUrl !== frame1.dataUrl,
        });
      } catch {
        // Skip inaccessible canvas
      }
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(150);

    const domAudit = await page.evaluate(() => {
      const SYSTEM_FONTS = new Set([
        'system-ui', '-apple-system', 'blinkmacsystemfont', 'segoe ui', 'roboto',
        'helvetica', 'helvetica neue', 'arial', 'sans-serif', 'serif', 'monospace',
        'ui-sans-serif', 'ui-serif', 'ui-monospace', 'georgia', 'times new roman',
        'new york', 'iowan old style', 'charter', 'palatino', 'baskerville',
        'garamond', 'avenir next', 'avenir', 'sf pro text', 'sf pro display',
        'sf mono', 'menlo', 'monaco', 'consolas', 'courier new',
      ]);

      const isHiddenOrInert = (el) => {
        let cur = el;
        while (cur && cur.nodeType === Node.ELEMENT_NODE) {
          if (cur.hasAttribute('inert') || cur.getAttribute('aria-hidden') === 'true') return true;
          const s = getComputedStyle(cur);
          if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) < 0.05) return true;
          cur = cur.parentElement;
        }
        return false;
      };

      const isSrOnly = (el, r, s) =>
        (r.width <= 2 && r.height <= 2) ||
        (s.clip && s.clip.includes('0px, 0px, 0px, 0px')) ||
        (s.clipPath && s.clipPath.includes('inset(50%)'));

      const colorCanvas = document.createElement('canvas');
      colorCanvas.width = 1;
      colorCanvas.height = 1;
      const colorCtx = colorCanvas.getContext('2d', { willReadFrequently: true });

      const parseRgba = (str) => {
        if (!str || str === 'transparent') return [0, 0, 0, 0];
        if (/\s*\/\s*0(?:\.0+)?\s*\)/.test(str)) return [0, 0, 0, 0];
        const m = str.match(/rgba?\(([^)]+)\)/);
        if (m && !m[1].includes('%')) {
          const p = m[1].split(/[\s,/]+/).filter(Boolean).map((v) => parseFloat(v));
          return [p[0], p[1], p[2], p.length >= 4 ? p[3] : 1];
        }
        if (colorCtx) {
          colorCtx.clearRect(0, 0, 1, 1);
          colorCtx.fillStyle = '#000000';
          colorCtx.fillStyle = str;
          colorCtx.fillRect(0, 0, 1, 1);
          const d = colorCtx.getImageData(0, 0, 1, 1).data;
          return [d[0], d[1], d[2], Number((d[3] / 255).toFixed(3))];
        }
        return null;
      };

      const compositeOver = (fg, bg) => {
        const a = fg[3];
        return [
          fg[0] * a + bg[0] * (1 - a),
          fg[1] * a + bg[1] * (1 - a),
          fg[2] * a + bg[2] * (1 - a),
          1,
        ];
      };

      const luminance = ([r, g, b]) => {
        const toLin = (c) => {
          const s = c / 255;
          return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
      };

      const contrastRatio = (c1, c2) => {
        const l1 = luminance(c1);
        const l2 = luminance(c2);
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      };

      const resolveBg = (el) => {
        const chain = [];
        let cur = el;
        let hasGradientOrImg = false;
        while (cur && cur.nodeType === Node.ELEMENT_NODE) {
          const s = getComputedStyle(cur);
          if (s.backgroundImage && s.backgroundImage !== 'none') {
            hasGradientOrImg = true;
          }
          const bg = parseRgba(s.backgroundColor);
          if (bg && bg[3] > 0.01) chain.unshift(bg);
          if (bg && bg[3] >= 0.99) break;
          cur = cur.parentElement;
        }
        // Check if an opaque media/canvas layer sits directly behind transparent hero text via elementsFromPoint
        if (!hasGradientOrImg && chain.length <= 1) {
          const r = el.getBoundingClientRect();
          if (r.top >= 0 && r.left >= 0 && r.top < window.innerHeight && r.left < window.innerWidth) {
            const stack = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2);
            const idxSelf = stack.indexOf(el);
            const behind = idxSelf >= 0 ? stack.slice(idxSelf + 1) : stack;
            if (behind.some((b) => b.tagName === 'CANVAS' || b.tagName === 'IMG' || b.tagName === 'VIDEO')) {
              hasGradientOrImg = true;
            }
          }
        }
        let acc = [255, 255, 255, 1];
        for (const layer of chain) acc = compositeOver(layer, acc);
        return { rgb: acc, hasGradientOrImg };
      };

      const brokenImages = [];
      for (const img of document.querySelectorAll('img')) {
        if (isHiddenOrInert(img)) continue;
        if (img.complete && img.naturalWidth === 0) {
          brokenImages.push({ src: img.getAttribute('src') || '(no src)', alt: img.alt || '' });
        }
      }

      const emptySvgs = [];
      for (const svg of document.querySelectorAll('svg')) {
        if (isHiddenOrInert(svg)) continue;
        const r = svg.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) {
          emptySvgs.push({ className: svg.getAttribute('class') || null });
        }
      }

      const loadedSet = new Set();
      const failedFonts = [];
      for (const f of document.fonts || []) {
        const clean = f.family.replace(/["']/g, '').toLowerCase();
        if (f.status === 'loaded') loadedSet.add(clean);
        else if (f.status === 'error') failedFonts.push(f.family);
      }

      const fontFallbackWarnings = [];
      for (const [label, sel] of [['body', 'body'], ['h1', 'h1']]) {
        const el = document.querySelector(sel);
        if (!el) continue;
        const firstFamily = getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '').trim();
        if (firstFamily && !SYSTEM_FONTS.has(firstFamily.toLowerCase()) && !loadedSet.has(firstFamily.toLowerCase())) {
          fontFallbackWarnings.push(`${label} declares "${firstFamily}" which is not loaded in document.fonts`);
        }
      }

      const contrastFailures = [];
      let contrastSkippedOverMediaCount = 0;
      const clippedText = [];
      const unnamedControls = [];
      const gradientElements = [];

      const textEls = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,a,button,label,li,td,th,small'));
      for (const el of textEls.slice(0, 1200)) {
        if (isHiddenOrInert(el)) continue;
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2 || isSrOnly(el, r, s)) continue;

        const hasDirectText = Array.from(el.childNodes).some(
          (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0,
        );

        if (hasDirectText) {
          const fg = parseRgba(s.color);
          const { rgb: bg, hasGradientOrImg } = resolveBg(el);
          if (fg && hasGradientOrImg) {
            contrastSkippedOverMediaCount++;
          } else if (fg) {
            const compositedFg = compositeOver(fg, bg);
            const ratio = contrastRatio(compositedFg, bg);
            const fsPx = parseFloat(s.fontSize);
            const fw = parseInt(s.fontWeight, 10) || 400;
            const isLarge = fsPx >= 24 || (fsPx >= 18.66 && fw >= 700);
            const minRequired = isLarge ? 3.0 : 4.5;
            if (ratio < minRequired && contrastFailures.length < 12) {
              contrastFailures.push({
                tag: el.tagName.toLowerCase(),
                text: el.textContent.trim().slice(0, 40),
                ratio: Number(ratio.toFixed(2)),
                required: minRequired,
                fg: s.color,
                resolvedBg: `rgb(${Math.round(bg[0])}, ${Math.round(bg[1])}, ${Math.round(bg[2])})`,
              });
            }
          }

          if (
            s.overflow === 'hidden' &&
            s.textOverflow !== 'ellipsis' &&
            (el.scrollHeight > el.clientHeight + 3 || el.scrollWidth > el.clientWidth + 3) &&
            clippedText.length < 8
          ) {
            clippedText.push({
              tag: el.tagName.toLowerCase(),
              text: el.textContent.trim().slice(0, 40),
              scrollWidth: el.scrollWidth,
              clientWidth: el.clientWidth,
              scrollHeight: el.scrollHeight,
              clientHeight: el.clientHeight,
            });
          }
        }
      }

      for (const ctrl of document.querySelectorAll('button, a[href], input, select, textarea')) {
        if (isHiddenOrInert(ctrl)) continue;
        const s = getComputedStyle(ctrl);
        const r = ctrl.getBoundingClientRect();
        if (r.width === 0 || r.height === 0 || isSrOnly(ctrl, r, s)) continue;
        const text = (ctrl.innerText || '').trim();
        const aria = (ctrl.getAttribute('aria-label') || ctrl.getAttribute('title') || '').trim();
        const labelledBy = ctrl.getAttribute('aria-labelledby');
        const id = ctrl.getAttribute('id');
        const hasLabel = Boolean(id && document.querySelector(`label[for="${CSS.escape(id)}"]`));
        const hasAlt = Boolean(ctrl.querySelector('img[alt]:not([alt=""])'));
        const placeholder = ctrl.getAttribute('placeholder');
        if (!text && !aria && !labelledBy && !hasLabel && !hasAlt && !placeholder) {
          unnamedControls.push({ tag: ctrl.tagName.toLowerCase(), className: String(ctrl.className || '').slice(0, 40) });
        }
      }

      const bodyEl = (() => {
        let best = null;
        let bestScore = -1;
        for (const p of document.querySelectorAll('main p, article p, section p, p')) {
          if (isHiddenOrInert(p)) continue;
          const s = getComputedStyle(p);
          const r = p.getBoundingClientRect();
          const fsPx = parseFloat(s.fontSize);
          const len = (p.innerText || '').trim().length;
          if (r.width < 120 || fsPx < 13 || len < 30) continue;
          const score = Math.min(len, 240) * Math.min(r.width, 900);
          if (score > bestScore) {
            bestScore = score;
            best = p;
          }
        }
        return best || document.querySelector('main p, article p, p, body');
      })();
      const h1El = document.querySelector('h1');
      const h1Size = h1El ? parseFloat(getComputedStyle(h1El).fontSize) : null;
      const bodySize = bodyEl ? parseFloat(getComputedStyle(bodyEl).fontSize) : null;
      const h1ToBodyRatio = h1Size && bodySize ? Number((h1Size / bodySize).toFixed(2)) : null;

      let cardCount = 0;
      let heavyShadowCount = 0;
      for (const el of document.querySelectorAll('body *')) {
        const s = getComputedStyle(el);
        if (s.display === 'none') continue;
        if (s.backgroundImage && /gradient/i.test(s.backgroundImage)) {
          if (/(#6366f1|#8b5cf6|#a855f7|99,\s*102,\s*241|139,\s*92,\s*246|168,\s*85,\s*247)/i.test(s.backgroundImage)) {
            gradientElements.push(el.tagName.toLowerCase());
          }
        }
        const r = el.getBoundingClientRect();
        if (r.width >= 160 && r.width <= 520 && r.height >= 90 && (s.borderRadius !== '0px' || s.boxShadow !== 'none')) {
          cardCount++;
          const m = s.boxShadow.match(/(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px\s+(\d+(?:\.\d+)?)px/);
          if (m && parseFloat(m[3]) >= 14) heavyShadowCount++;
        }
      }

      const fullText = (document.body?.innerText || '').toLowerCase();
      const slopStrings = ['lorem ipsum', 'dolor sit amet', 'consectetur adipiscing', 'acme corp', '99.99% uptime']
        .filter((needle) => fullText.includes(needle));

      return {
        brokenImages,
        emptySvgs,
        loadedFonts: Array.from(loadedSet),
        failedFonts,
        fontFallbackWarnings,
        contrastFailures,
        contrastSkippedOverMediaCount,
        clippedText,
        unnamedControls,
        antiSlop: {
          h1ToBodyRatio,
          purpleIndigoGradientCount: gradientElements.length,
          placeholderCopyMatches: slopStrings,
          heavyShadowCardRatio: cardCount >= 3 ? Number((heavyShadowCount / cardCount).toFixed(2)) : 0,
        },
      };
    });

    // Reconcile offline document-level console font errors only when no non-font requests failed
    if (offlineBlockedFontUrls.length === 0 || failedRequests.length > 0) {
      consoleErrors.push(...rawOfflineConsoleCandidates);
    }

    const focusChecks = await probeKeyboardFocus(page, path.join(outDir, 'focus-check.png'));

    const tabChecks = [];
    const tablists = await page.locator('[role="tablist"]').count();
    for (let t = 0; t < Math.min(tablists, 2); t++) {
      const tabs = page.locator('[role="tablist"]').nth(t).locator('[role="tab"]');
      const count = await tabs.count();
      if (count >= 2) {
        try {
          await tabs.nth(1).click({ timeout: 1500 });
          await page.waitForTimeout(100);
          const selected = await tabs.nth(1).getAttribute('aria-selected');
          await tabs.nth(0).click({ timeout: 1500 }).catch(() => {});
          tabChecks.push({ tablistIndex: t, secondTabSelectedOnClick: selected === 'true' });
        } catch {
          tabChecks.push({ tablistIndex: t, secondTabSelectedOnClick: false });
        }
      }
    }

    const desktopOverflow = await checkViewportOverflow(page, 1440, 900);
    const tabletOverflow = await checkViewportOverflow(page, 768, 1024);
    const mobileNarrowOverflow = await checkViewportOverflow(page, 320, 720);
    const mobileOverflow = await checkViewportOverflow(page, 390, 844);
    await page.screenshot({ path: path.join(outDir, 'mobile.png') });

    // Mobile tap target checks + floating fixed-overlay collision check at BOTH y=0 and scrolled 45%
    const checkMobileCollisions = async () =>
      page.evaluate(() => {
        const collisions = [];
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const floatingFixed = Array.from(document.querySelectorAll('body *')).filter((el) => {
          if (el.closest('header, nav')) return false;
          let cur = el;
          while (cur && cur.nodeType === Node.ELEMENT_NODE) {
            const cs = getComputedStyle(cur);
            if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.1) return false;
            cur = cur.parentElement;
          }
          const s = getComputedStyle(el);
          if (s.position !== 'fixed') return false;
          const r = el.getBoundingClientRect();
          return r.width > 20 && r.width < vw * 0.7 && r.height > 20 && r.height < 100 && r.top >= 0 && r.bottom <= vh;
        });
        if (floatingFixed.length > 0) {
          const contentTargets = Array.from(document.querySelectorAll('main article, main section p, main section a, main section button'));
          for (const floater of floatingFixed.slice(0, 4)) {
            const fr = floater.getBoundingClientRect();
            for (const ct of contentTargets) {
              if (floater.contains(ct) || ct.contains(floater)) continue;
              const cr = ct.getBoundingClientRect();
              if (cr.width === 0 || cr.height === 0) continue;
              const overlaps = !(fr.right <= cr.left || fr.left >= cr.right || fr.bottom <= cr.top || fr.top >= cr.bottom);
              if (overlaps) {
                collisions.push({
                  scrollY: Math.round(window.scrollY),
                  floater: (floater.innerText || floater.getAttribute('aria-label') || floater.tagName).trim().slice(0, 36),
                  overlapsTag: ct.tagName.toLowerCase(),
                });
                break;
              }
            }
          }
        }
        return collisions;
      });

    const smallTapTargets = await page.evaluate(() => {
      const bad = [];
      const isHidden = (el) => {
        let cur = el;
        while (cur && cur.nodeType === Node.ELEMENT_NODE) {
          if (cur.hasAttribute('inert') || cur.getAttribute('aria-hidden') === 'true') return true;
          const s = getComputedStyle(cur);
          if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) < 0.05) return true;
          cur = cur.parentElement;
        }
        return false;
      };
      for (const el of document.querySelectorAll('button, [role="button"], input, select, textarea, nav a')) {
        if (isHidden(el)) continue;
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if ((r.width <= 2 && r.height <= 2) || (s.clip && s.clip.includes('0px, 0px, 0px, 0px'))) continue;
        if (r.width < 44 || r.height < 44) {
          bad.push({
            tag: el.tagName.toLowerCase(),
            label: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 30),
            width: Math.round(r.width),
            height: Math.round(r.height),
          });
          if (bad.length >= 10) break;
        }
      }
      return bad;
    });

    const collisionsTop = await checkMobileCollisions();
    const mobScrollH = await page.evaluate(() => document.documentElement.scrollHeight);
    let collisionsMid = [];
    if (mobScrollH > 1200) {
      await page.evaluate((y) => window.scrollTo(0, y), Math.round((mobScrollH - 844) * 0.45));
      await page.waitForTimeout(160);
      collisionsMid = await checkMobileCollisions();
      await page.evaluate(() => window.scrollTo(0, 0));
    }
    const mobileOverlayCollisions = [...collisionsTop, ...collisionsMid];

    const missingFocusCount = focusChecks.filter((f) => !f.visibleIndicator).length;
    const blankCanvases = canvasChecks.filter((c) => c.isBlank);
    const frozenCanvases = canvasChecks.filter((c) => !c.isBlank && !c.animatesOverTime);
    const staticStickyTracks = scrollMotionChecks.filter(
      (m) => m.hasStickyDescendants && !m.kineticChangesDetected && (m.height >= 2200 || m.hasKineticHints),
    );
    const criticalErrors = [];

    if (consoleErrors.length > 0) criticalErrors.push(`${consoleErrors.length} console error(s)`);
    if (pageErrors.length > 0) criticalErrors.push(`${pageErrors.length} uncaught page error(s)`);
    if (failedRequests.length > 0) criticalErrors.push(`${failedRequests.length} failed network request(s)`);
    if (domAudit.brokenImages.length > 0) criticalErrors.push(`${domAudit.brokenImages.length} broken image(s)`);
    if (blankCanvases.length > 0) criticalErrors.push(`${blankCanvases.length} blank/unrendered <canvas> element(s)`);
    if (domAudit.failedFonts.length > 0) criticalErrors.push(`${domAudit.failedFonts.length} failed font(s)`);
    if (desktopOverflow.docOverflowPx > 1) criticalErrors.push(`Desktop horizontal overflow (${desktopOverflow.docOverflowPx}px)`);
    if (tabletOverflow.docOverflowPx > 1) criticalErrors.push(`Tablet horizontal overflow (${tabletOverflow.docOverflowPx}px)`);
    if (mobileOverflow.docOverflowPx > 1) criticalErrors.push(`Mobile (390px) horizontal overflow (${mobileOverflow.docOverflowPx}px)`);
    if (mobileNarrowOverflow.docOverflowPx > 1) criticalErrors.push(`Mobile narrow (320px) horizontal overflow (${mobileNarrowOverflow.docOverflowPx}px)`);
    if (domAudit.contrastFailures.length > 0) criticalErrors.push(`${domAudit.contrastFailures.length} WCAG AA contrast failure(s)`);
    if (domAudit.unnamedControls.length > 0) criticalErrors.push(`${domAudit.unnamedControls.length} unnamed interactive control(s)`);
    if (missingFocusCount > 0) criticalErrors.push(`${missingFocusCount} tabbed control(s) missing visible focus indicator`);
    if (domAudit.antiSlop.placeholderCopyMatches.length > 0) {
      criticalErrors.push(`Placeholder/slop copy detected: ${domAudit.antiSlop.placeholderCopyMatches.join(', ')}`);
    }

    const warnings = [];
    if (offlineBlockedFontUrls.length > 0) {
      warnings.push(`External webfont CDN unreachable offline (${offlineBlockedFontUrls.length} request(s)); verify fonts online too`);
    }
    if (domAudit.fontFallbackWarnings.length > 0 && offlineBlockedFontUrls.length === 0) {
      warnings.push(...domAudit.fontFallbackWarnings);
    }
    if (frozenCanvases.length > 0) {
      warnings.push(`${frozenCanvases.length} large <canvas> element(s) showed zero pixel change over 420ms (verify animation or intentional static fallback)`);
    }
    if (staticStickyTracks.length > 0) {
      warnings.push(`${staticStickyTracks.length} tall sticky section(s) showed no computed-style scroll changes across t0..t3`);
    }
    if (lowOpacitySections.length > 0) {
      warnings.push(`${lowOpacitySections.length} section(s) trapped at low opacity (<0.85) when scrolled`);
    }
    if (mobileOverlayCollisions.length > 0) {
      warnings.push(`${mobileOverlayCollisions.length} floating fixed control(s) collide with mobile content`);
    }
    if (tabChecks.some((t) => !t.secondTabSelectedOnClick)) {
      warnings.push('One or more [role="tablist"] controls did not update aria-selected on click');
    }
    if (domAudit.emptySvgs.length > 0) warnings.push(`${domAudit.emptySvgs.length} zero-size <svg> element(s)`);
    if (domAudit.clippedText.length > 0) warnings.push(`${domAudit.clippedText.length} clipped text element(s)`);
    if (smallTapTargets.length > 0) warnings.push(`${smallTapTargets.length} mobile tap target(s) below 44x44px`);
    if (domAudit.antiSlop.h1ToBodyRatio !== null && domAudit.antiSlop.h1ToBodyRatio < 1.5) {
      warnings.push(`Weak type hierarchy (h1/body = ${domAudit.antiSlop.h1ToBodyRatio}, target >= 1.5)`);
    }
    if (domAudit.antiSlop.purpleIndigoGradientCount > 0) {
      warnings.push(`Detected ${domAudit.antiSlop.purpleIndigoGradientCount} generic purple/indigo gradient element(s)`);
    }
    if (domAudit.antiSlop.heavyShadowCardRatio > 0.6) {
      warnings.push(`Heavy shadow saturation (${Math.round(domAudit.antiSlop.heavyShadowCardRatio * 100)}% of cards)`);
    }

    const auditReport = {
      meta: { url, auditedAt: new Date().toISOString() },
      summary: {
        passed: criticalErrors.length === 0,
        criticalErrorCount: criticalErrors.length,
        warningCount: warnings.length,
        criticalErrors,
        warnings,
      },
      runtime: { consoleErrors, pageErrors, failedRequests, offlineBlockedFontUrls },
      mediaAndFonts: {
        brokenImages: domAudit.brokenImages,
        emptySvgs: domAudit.emptySvgs,
        loadedFonts: domAudit.loadedFonts,
        failedFonts: domAudit.failedFonts,
        fontFallbackWarnings: domAudit.fontFallbackWarnings,
      },
      kinetic: {
        canvasChecks,
        scrollMotionChecks,
      },
      layout: {
        overflow: {
          desktop: desktopOverflow,
          tablet: tabletOverflow,
          mobile: mobileOverflow,
          mobileNarrow: mobileNarrowOverflow,
        },
        clippedText: domAudit.clippedText,
        lowOpacitySections,
        mobileOverlayCollisions,
      },
      accessibility: {
        contrastFailures: domAudit.contrastFailures,
        contrastSkippedOverMediaCount: domAudit.contrastSkippedOverMediaCount,
        unnamedControls: domAudit.unnamedControls,
        focusChecks,
        tabChecks,
        smallTapTargets,
      },
      antiSlop: domAudit.antiSlop,
      screenshots: {
        desktop: 'desktop.png',
        desktopFull: 'desktop-full.png',
        mobile: 'mobile.png',
        focusCheck: 'focus-check.png',
        scrollSnapshots,
        sections: sectionScreenshots,
      },
    };

    await fs.writeFile(path.join(outDir, 'audit.json'), JSON.stringify(auditReport, null, 2));
    return auditReport;
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
  const [, , targetUrl, outDir = './audit-out'] = process.argv;
  if (!targetUrl) {
    console.error('Usage: node skills/unslop/scripts/audit_ui.mjs <url> [outputDir]');
    process.exit(1);
  }
  const report = await auditUI(targetUrl, outDir);
  console.log(JSON.stringify(report.summary, null, 2));
  if (!report.summary.passed) {
    process.exitCode = 1;
  }
}
