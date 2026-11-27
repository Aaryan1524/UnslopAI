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

async function runContrastAudit(page) {
  return page.evaluate(() => {
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

    const contrastFailures = [];
    let contrastSkippedOverMediaCount = 0;
    const textEls = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,a,button,label,li,td,th,small'));
    for (const el of textEls.slice(0, 1200)) {
      if (isHiddenOrInert(el)) continue;
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2 || isSrOnly(el, r, s)) continue;

      const hasDirectText = Array.from(el.childNodes).some(
        (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0,
      );
      if (!hasDirectText) continue;

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
    }

    return { contrastFailures, contrastSkippedOverMediaCount };
  });
}

async function probeReducedMotionToggle(page, canvasChecks) {
  const toggleInfo = await page.evaluate(() => {
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

    const MOTION_TEXT_RE = /^motion\s*(on|off|:\s*full|:\s*reduced)/i;
    for (const el of document.querySelectorAll('button, [role="button"]')) {
      if (isHiddenOrInert(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const aria = (el.getAttribute('aria-label') || '').trim();
      const id = (el.id || '').trim();
      const text = (el.innerText || '').trim();
      const matches =
        /motion/i.test(aria) ||
        /motion/i.test(id) ||
        MOTION_TEXT_RE.test(text);
      if (matches) {
        el.setAttribute('data-unslop-motion-toggle', '1');
        return {
          found: true,
          label: (text || aria || id || 'motion-toggle').slice(0, 50),
        };
      }
    }
    return { found: false };
  });

  if (!toggleInfo.found) {
    return { found: false, tested: false };
  }

  const animatedCanvas = canvasChecks.find((c) => !c.isBlank && c.animatesOverTime);
  if (!animatedCanvas) {
    await page
      .evaluate(() => {
        for (const el of document.querySelectorAll('[data-unslop-motion-toggle]')) {
          el.removeAttribute('data-unslop-motion-toggle');
        }
      })
      .catch(() => {});
    return {
      found: true,
      tested: false,
      label: toggleInfo.label,
      reason: 'No visible animated canvas detected',
    };
  }

  const getRootSnapshot = () =>
    page.evaluate(() => {
      const pickAttrs = (el) =>
        Array.from(el.attributes)
          .filter((a) => a.name === 'class' || a.name.startsWith('data-'))
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((a) => `${a.name}=${a.value}`)
          .join(';');
      const btn = document.querySelector('[data-unslop-motion-toggle="1"]');
      return {
        htmlSig: pickAttrs(document.documentElement),
        bodySig: document.body ? pickAttrs(document.body) : '',
        ariaPressed: btn ? btn.getAttribute('aria-pressed') : null,
      };
    });

  let clicked = false;
  try {
    const btnLoc = page.locator('[data-unslop-motion-toggle="1"]').first();
    const cLoc = page.locator('canvas').nth(animatedCanvas.index);
    const before = await getRootSnapshot();

    await btnLoc.click({ timeout: 2500 });
    clicked = true;
    await page.waitForTimeout(140);

    const after = await getRootSnapshot();
    const rootStateChanged = before.htmlSig !== after.htmlSig || before.bodySig !== after.bodySig;
    const ariaPressedChanged = before.ariaPressed !== after.ariaPressed;

    await cLoc.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(100);

    const frame0 = await sampleRawCanvasFrame(page, cLoc);
    await page.waitForTimeout(350);
    const frame1 = await sampleRawCanvasFrame(page, cLoc);
    const canvasStoppedAnimating = frame0.dataUrl === frame1.dataUrl;

    return {
      found: true,
      tested: true,
      label: toggleInfo.label,
      canvasIndex: animatedCanvas.index,
      canvasStoppedAnimating,
      rootStateChanged,
      ariaPressedChanged,
    };
  } catch (err) {
    return {
      found: true,
      tested: false,
      label: toggleInfo.label,
      error: String(err?.message || err).slice(0, 120),
    };
  } finally {
    if (clicked) {
      const tagged = page.locator('[data-unslop-motion-toggle="1"]').first();
      if ((await tagged.count().catch(() => 0)) > 0) {
        await tagged.click({ timeout: 2500 }).catch(() => {});
      } else {
        const fallback = page.locator('button[aria-label*="motion" i], button[id*="motion" i]').first();
        if ((await fallback.count().catch(() => 0)) > 0) {
          await fallback.click({ timeout: 2000 }).catch(() => {});
        }
      }
      await page.waitForTimeout(140);
    }
    await page
      .evaluate(() => {
        for (const el of document.querySelectorAll('[data-unslop-motion-toggle]')) {
          el.removeAttribute('data-unslop-motion-toggle');
        }
        if (document.activeElement && document.activeElement !== document.body) {
          document.activeElement.blur?.();
        }
        window.scrollTo(0, 0);
      })
      .catch(() => {});
    await page.waitForTimeout(100);
  }
}

async function probeAlternateThemeContrast(page) {
  const toggleInfo = await page.evaluate(() => {
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

    const selector = [
      'button[aria-label*="theme" i]',
      'button[aria-label*="dark mode" i]',
      'button[aria-label*="light mode" i]',
      '[role="button"][aria-label*="theme" i]',
      '[role="button"][aria-label*="dark mode" i]',
      '[data-theme-toggle]',
    ].join(', ');

    for (const el of document.querySelectorAll(selector)) {
      if (isHiddenOrInert(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      el.setAttribute('data-unslop-theme-toggle', '1');
      return {
        found: true,
        label: ((el.innerText || el.getAttribute('aria-label') || el.id || 'theme-toggle').trim()).slice(0, 50),
      };
    }
    return { found: false };
  });

  if (!toggleInfo.found) {
    return { found: false, toggled: false, contrastFailuresCount: 0, sampleFailures: [] };
  }

  const getThemeSig = () =>
    page.evaluate(() => {
      const pickAttrs = (el) =>
        Array.from(el.attributes)
          .filter((a) => a.name === 'class' || a.name.startsWith('data-'))
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((a) => `${a.name}=${a.value}`)
          .join(';');
      const bs = document.body ? getComputedStyle(document.body) : null;
      return `${pickAttrs(document.documentElement)}|${document.body ? pickAttrs(document.body) : ''}|${bs?.backgroundColor || ''}|${bs?.color || ''}`;
    });

  let clicked = false;
  try {
    const btnLoc = page.locator('[data-unslop-theme-toggle="1"]').first();
    const beforeSig = await getThemeSig();

    await btnLoc.click({ timeout: 2500 });
    clicked = true;
    await page.waitForTimeout(260);

    const afterSig = await getThemeSig();
    const { contrastFailures } = await runContrastAudit(page);

    return {
      found: true,
      toggled: true,
      label: toggleInfo.label,
      themeChanged: beforeSig !== afterSig,
      contrastFailuresCount: contrastFailures.length,
      sampleFailures: contrastFailures.slice(0, 8),
    };
  } catch (err) {
    return {
      found: true,
      toggled: false,
      label: toggleInfo.label,
      contrastFailuresCount: 0,
      sampleFailures: [],
      error: String(err?.message || err).slice(0, 120),
    };
  } finally {
    if (clicked) {
      const tagged = page.locator('[data-unslop-theme-toggle="1"]').first();
      if ((await tagged.count().catch(() => 0)) > 0) {
        await tagged.click({ timeout: 2500 }).catch(() => {});
      } else {
        const fallback = page
          .locator(
            'button[aria-label*="theme" i], button[aria-label*="dark mode" i], button[aria-label*="light mode" i], [role="button"][aria-label*="theme" i], [role="button"][aria-label*="dark mode" i], [role="button"][aria-label*="light mode" i], [data-theme-toggle]',
          )
          .first();
        if ((await fallback.count().catch(() => 0)) > 0) {
          await fallback.click({ timeout: 2000 }).catch(() => {});
        }
      }
      await page.waitForTimeout(240);
    }
    await page
      .evaluate(() => {
        for (const el of document.querySelectorAll('[data-unslop-theme-toggle]')) {
          el.removeAttribute('data-unslop-theme-toggle');
        }
        if (document.activeElement && document.activeElement !== document.body) {
          document.activeElement.blur?.();
        }
        window.scrollTo(0, 0);
      })
      .catch(() => {});
    await page.waitForTimeout(100);
  }
}

async function probeInteractiveOverlays(page) {
  const candidates = await page.evaluate(() => {
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

    const selector = '[aria-haspopup="true"], [aria-haspopup="dialog"], [aria-haspopup="menu"], [aria-controls]';
    const picked = [];
    for (const el of document.querySelectorAll(selector)) {
      if (picked.length >= 3) break;
      if (isHiddenOrInert(el)) continue;
      if (el.disabled || el.getAttribute('aria-disabled') === 'true') continue;

      const tag = el.tagName.toLowerCase();
      const role = (el.getAttribute('role') || '').toLowerCase();
      if (role === 'tab') continue;
      if (tag === 'input' && (el.type === 'submit' || el.type === 'reset')) continue;
      if (tag === 'button') {
        const btnType = (el.getAttribute('type') || '').toLowerCase();
        if (btnType === 'submit' || btnType === 'reset' || (!btnType && Boolean(el.closest('form')))) continue;
      }
      if (tag === 'a') {
        const href = (el.getAttribute('href') || '').trim();
        const isOverlayAnchorButton =
          role === 'button' && (el.hasAttribute('aria-controls') || el.hasAttribute('aria-haspopup'));
        if (!isOverlayAnchorButton && (el.closest('nav') || (href && href !== '#' && role !== 'button'))) {
          continue;
        }
      }

      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;

      const idx = picked.length;
      el.setAttribute('data-unslop-overlay-trigger', String(idx));
      picked.push({
        index: idx,
        tag,
        label: ((el.innerText || el.getAttribute('aria-label') || el.getAttribute('title') || el.id || tag).trim()).slice(0, 50),
        ariaHaspopup: el.getAttribute('aria-haspopup') || null,
        ariaControls: el.getAttribute('aria-controls') || null,
      });
    }
    return picked;
  });

  if (candidates.length === 0) return [];

  const snapshotOverlayState = (idx, controlsId) =>
    page.evaluate(
      ({ triggerIdx, ctrlId }) => {
        const isVis = (el) => {
          if (!el) return false;
          let cur = el;
          while (cur && cur.nodeType === Node.ELEMENT_NODE) {
            if (cur.hasAttribute('inert') || cur.getAttribute('aria-hidden') === 'true') return false;
            const s = getComputedStyle(cur);
            if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) < 0.05) return false;
            cur = cur.parentElement;
          }
          const r = el.getBoundingClientRect();
          return r.width > 2 && r.height > 2;
        };

        const trigger = document.querySelector(`[data-unslop-overlay-trigger="${triggerIdx}"]`);
        const expanded = trigger ? trigger.getAttribute('aria-expanded') : null;
        const controlledEl = ctrlId ? document.getElementById(ctrlId) : null;
        const controlledVisible = controlledEl ? isVis(controlledEl) : false;

        const panelNodes = new Set();
        for (const p of document.querySelectorAll('[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], dialog[open], [data-state="open"]')) {
          if (p !== trigger && isVis(p)) panelNodes.add(p);
        }
        try {
          for (const p of document.querySelectorAll(':popover-open')) {
            if (p !== trigger && isVis(p)) panelNodes.add(p);
          }
        } catch {
          // :popover-open unsupported
        }
        return {
          expanded,
          controlledVisible,
          openPanelCount: panelNodes.size,
        };
      },
      { triggerIdx: idx, ctrlId: controlsId },
    );

  const results = [];
  const startUrl = page.url();
  try {
    for (const cand of candidates) {
      const loc = page.locator(`[data-unslop-overlay-trigger="${cand.index}"]`).first();
      if ((await loc.count().catch(() => 0)) === 0) continue;
      try {
        const before = await snapshotOverlayState(cand.index, cand.ariaControls);
        await loc.click({ timeout: 2000 });
        await page.waitForTimeout(220);

        if (page.url() !== startUrl) {
          await page.goto(startUrl, { waitUntil: 'domcontentloaded', timeout: 8000 }).catch(() => {});
          await page.waitForTimeout(200);
          continue;
        }

        const afterOpen = await snapshotOverlayState(cand.index, cand.ariaControls);
        const expandedFlippedToTrue = before.expanded !== 'true' && afterOpen.expanded === 'true';
        const controlledBecameVisible = !before.controlledVisible && afterOpen.controlledVisible;
        const panelAppeared = afterOpen.openPanelCount > before.openPanelCount;
        const opened = expandedFlippedToTrue || controlledBecameVisible || panelAppeared;

        let dismissedOnEscape = null;
        if (opened) {
          await page.keyboard.press('Escape');
          await page.waitForTimeout(220);
          const afterEsc = await snapshotOverlayState(cand.index, cand.ariaControls);

          const expandedClosed = !expandedFlippedToTrue || afterEsc.expanded !== 'true';
          const controlledClosed = !controlledBecameVisible || !afterEsc.controlledVisible;
          const panelsClosed = !panelAppeared || afterEsc.openPanelCount <= before.openPanelCount;
          dismissedOnEscape = expandedClosed && controlledClosed && panelsClosed;

          if (!dismissedOnEscape) {
            // Attempt graceful cleanup so subsequent checks run on a clean viewport
            const closeBtn = page
              .locator('[role="dialog"] button[aria-label*="close" i], dialog[open] button[aria-label*="close" i], [data-state="open"] button[aria-label*="close" i]')
              .first();
            if ((await closeBtn.count().catch(() => 0)) > 0) {
              await closeBtn.click({ timeout: 1200 }).catch(() => {});
            } else {
              await loc.click({ timeout: 1200 }).catch(() => {});
            }
            await page.waitForTimeout(160);
          }
        }

        results.push({
          index: cand.index,
          tag: cand.tag,
          label: cand.label,
          ariaHaspopup: cand.ariaHaspopup,
          ariaControls: cand.ariaControls,
          opened,
          expandedFlippedToTrue,
          panelAppeared: controlledBecameVisible || panelAppeared,
          dismissedOnEscape,
        });
      } catch {
        // Ignore transient click/visibility issues on individual overlay triggers
      }
    }
  } finally {
    await page
      .evaluate(() => {
        for (const el of document.querySelectorAll('[data-unslop-overlay-trigger]')) {
          el.removeAttribute('data-unslop-overlay-trigger');
        }
        if (document.activeElement && document.activeElement !== document.body) {
          document.activeElement.blur?.();
        }
        window.scrollTo(0, 0);
      })
      .catch(() => {});
    await page.waitForTimeout(100);
  }
  return results;
}

async function runStudioCraftAudit(page, sectionMeta, { allowGenericFonts = false } = {}) {
  const telemetry = await page.evaluate((sections) => {
    const vw = window.innerWidth || 1440;

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

    const isLayoutVisible = (el) => {
      let cur = el;
      while (cur && cur.nodeType === Node.ELEMENT_NODE) {
        if (cur.hasAttribute('inert') || cur.getAttribute('aria-hidden') === 'true') return false;
        const s = getComputedStyle(cur);
        if (s.display === 'none' || s.visibility === 'hidden') return false;
        cur = cur.parentElement;
      }
      return true;
    };

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

    const rgbToHex = (rgb) => {
      const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
      return `#${[clamp(rgb[0]), clamp(rgb[1]), clamp(rgb[2])].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
    };

    const htmlBgRaw = document.documentElement ? parseRgba(getComputedStyle(document.documentElement).backgroundColor) : null;
    const bodyBgRaw = document.body ? parseRgba(getComputedStyle(document.body).backgroundColor) : null;
    let bodyBgRgb = [255, 255, 255, 1];
    if (htmlBgRaw && htmlBgRaw[3] > 0.01) bodyBgRgb = compositeOver(htmlBgRaw, bodyBgRgb);
    if (bodyBgRaw && bodyBgRaw[3] > 0.01) bodyBgRgb = compositeOver(bodyBgRaw, bodyBgRgb);

    const bodyTextRaw = document.body ? parseRgba(getComputedStyle(document.body).color) : null;
    const bodyTextRgb = bodyTextRaw ? compositeOver(bodyTextRaw, bodyBgRgb) : [0, 0, 0, 1];

    const rgbDist = (c1, c2) => Math.abs(c1[0] - c2[0]) + Math.abs(c1[1] - c2[1]) + Math.abs(c1[2] - c2[2]);

    // 1. Radius Contract (3-Radius Drift Check)
    const parseCornerPx = (val) => {
      const n = parseFloat(val);
      return Number.isFinite(n) ? n : 0;
    };
    const getMaxRadiusPx = (s) =>
      Math.max(
        parseCornerPx(s.borderTopLeftRadius),
        parseCornerPx(s.borderTopRightRadius),
        parseCornerPx(s.borderBottomRightRadius),
        parseCornerPx(s.borderBottomLeftRadius),
      );
    const classifyRadiusTier = (px, height) => {
      if (px >= 999 || (height > 0 && px >= height * 0.45 && px > 4)) return 'pill';
      if (px <= 4) return 'sharp';
      if (px <= 12) return 'medium';
      return 'large';
    };
    const isCircleGeometry = (r, radiusPx) =>
      Math.abs(r.width - r.height) <= 4 && radiusPx >= Math.min(r.width, r.height) * 0.48;

    const CARD_SKIP_TAGS = new Set([
      'HTML', 'BODY', 'MAIN', 'HEADER', 'FOOTER', 'NAV',
      'IMG', 'SVG', 'VIDEO', 'CANVAS', 'PICTURE', 'IFRAME',
      'TABLE', 'THEAD', 'TBODY', 'TR', 'TD', 'TH',
      'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA',
    ]);

    const cardSamples = [];
    const cardCandidateEls = [];
    const cardValueSet = new Set();
    const cardTierSet = new Set();
    const controlSamples = [];
    const controlValueSet = new Set();
    const controlTierSet = new Set();

    const surfaceFreq = new Map();

    const isStructuralBorderlessWrapper = (el, s, r, borderWidths, hasBoxBorder, hasShadow, radiusPx) => {
      if (hasBoxBorder || hasShadow || radiusPx > 0) return false;
      if (el.tagName === 'SECTION') return true;
      // Centered vertical guide-rail wrapper with left+right borders only (no top/bottom box border)
      const hasVerticalRailsOnly =
        r.width >= vw * 0.65 &&
        borderWidths[1] >= 0.5 &&
        borderWidths[3] >= 0.5 &&
        borderWidths[0] < 0.5 &&
        borderWidths[2] < 0.5;
      if (hasVerticalRailsOnly) return true;

      const isGridOrFlex =
        s.display === 'grid' ||
        s.display === 'inline-grid' ||
        s.display === 'flex' ||
        s.display === 'inline-flex';
      if (!isGridOrFlex && !el.querySelector(':scope > section, :scope > article')) return false;

      const visBlockKids = Array.from(el.children).filter((child) => {
        if (isHiddenOrInert(child)) return false;
        const cs = getComputedStyle(child);
        if (cs.position === 'absolute' || cs.position === 'fixed') return false;
        const cr = child.getBoundingClientRect();
        return cr.width >= 120 && cr.height >= 60;
      });
      if (visBlockKids.length < 2) return false;

      let styledKidCount = 0;
      let kidAreaSum = 0;
      for (const kid of visBlockKids) {
        const ks = getComputedStyle(kid);
        const kr = kid.getBoundingClientRect();
        kidAreaSum += kr.width * kr.height;
        const kBg = parseRgba(ks.backgroundColor);
        const kHasBg = Boolean(kBg && kBg[3] > 0.05);
        const kHasShadow = Boolean(ks.boxShadow && ks.boxShadow !== 'none');
        const kRadius = getMaxRadiusPx(ks);
        const kBorder =
          (parseFloat(ks.borderTopWidth) || 0) >= 0.5 ||
          (parseFloat(ks.borderBottomWidth) || 0) >= 0.5 ||
          (parseFloat(ks.borderLeftWidth) || 0) >= 0.5 ||
          (parseFloat(ks.borderRightWidth) || 0) >= 0.5;
        if (kHasBg || kHasShadow || kRadius > 0 || kBorder || kid.tagName === 'ARTICLE' || kid.tagName === 'SECTION') {
          styledKidCount++;
        }
      }
      const parentArea = Math.max(1, r.width * r.height);
      return styledKidCount >= 2 || (isGridOrFlex && kidAreaSum / parentArea >= 0.65);
    };

    for (const el of document.querySelectorAll('body *')) {
      if (isHiddenOrInert(el)) continue;
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) continue;

      const bgRgba = parseRgba(s.backgroundColor);
      if (bgRgba && bgRgba[3] > 0.08 && r.width >= 120 && r.height >= 40) {
        const comp = compositeOver(bgRgba, bodyBgRgb);
        const hex = rgbToHex(comp);
        surfaceFreq.set(hex, (surfaceFreq.get(hex) || 0) + Math.min(r.width * r.height, 400000));
      }

      if (CARD_SKIP_TAGS.has(el.tagName)) continue;
      const role = (el.getAttribute('role') || '').toLowerCase();
      if (role === 'button') continue;
      if (el.tagName === 'A' && /\b(btn|button)\b/i.test(String(el.className || ''))) continue;
      // Never sample tiny decorative corner registration squares or micro-elements as cards
      if (r.width <= 16 && r.height <= 16) continue;
      if (r.width < 160 || r.height < 80) continue;

      const radiusPx = getMaxRadiusPx(s);
      if (isCircleGeometry(r, radiusPx)) continue;
      if (el.matches('[class*="avatar" i], [class*="dot" i], [class*="swatch" i], [class*="reg-mark" i], [class*="registration" i], [class*="crosshair" i], [class*="corner-mark" i]')) continue;

      const borderColors = [s.borderTopColor, s.borderRightColor, s.borderBottomColor, s.borderLeftColor]
        .map(parseRgba);
      const borderWidths = [
        parseFloat(s.borderTopWidth) || 0,
        parseFloat(s.borderRightWidth) || 0,
        parseFloat(s.borderBottomWidth) || 0,
        parseFloat(s.borderLeftWidth) || 0,
      ];
      const hasBoxBorder = borderWidths.every((w, idx) => w >= 0.5 && borderColors[idx] && borderColors[idx][3] > 0.05);
      const hasShadow = Boolean(s.boxShadow && s.boxShadow !== 'none');
      const compBg = bgRgba && bgRgba[3] > 0.05 ? compositeOver(bgRgba, bodyBgRgb) : null;
      const hasDistinctBg = Boolean(compBg && rgbDist(compBg, bodyBgRgb) > 10);

      // Ignore full-bleed horizontal page sections and structural borderless grid wrappers
      const isFullBleedBand = (r.width >= vw * 0.94 || (el.tagName === 'SECTION' && r.width >= vw - 4)) && !hasBoxBorder && !hasShadow;
      if (isFullBleedBand) continue;
      if (!hasBoxBorder && !hasShadow && !hasDistinctBg) continue;
      if (isStructuralBorderlessWrapper(el, s, r, borderWidths, hasBoxBorder, hasShadow, radiusPx)) continue;

      cardCandidateEls.push(el);

      const tier = classifyRadiusTier(radiusPx, r.height);
      const normVal = tier === 'pill' ? 'pill' : `${Math.round(radiusPx)}px`;
      cardValueSet.add(normVal);
      cardTierSet.add(tier);
      if (cardSamples.length < 16) {
        cardSamples.push({
          tag: el.tagName.toLowerCase(),
          className: typeof el.className === 'string' ? el.className.trim().slice(0, 48) || null : null,
          radiusPx: Math.round(radiusPx),
          normalized: normVal,
          tier,
        });
      }
    }

    for (const el of document.querySelectorAll('button, [role="button"], input, select, a[class*="btn" i], a[class*="button" i]')) {
      if (isHiddenOrInert(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.width <= 16 && r.height <= 16) continue;
      if (r.width < 4 || r.height < 4) continue;
      if (el.tagName === 'INPUT') {
        const t = (el.getAttribute('type') || 'text').toLowerCase();
        if (t === 'checkbox' || t === 'radio' || t === 'hidden' || t === 'range' || t === 'color') continue;
      }
      if (el.matches('[class*="swatch" i], [data-swatch]')) continue;

      const s = getComputedStyle(el);
      const radiusPx = getMaxRadiusPx(s);
      const textLen = (el.innerText || '').trim().length;
      if (r.width <= 48 && isCircleGeometry(r, radiusPx) && textLen <= 2) continue;

      if (el.tagName !== 'INPUT' && el.tagName !== 'SELECT') {
        const bgRgba = parseRgba(s.backgroundColor);
        const hasBg = Boolean(bgRgba && bgRgba[3] > 0.05);
        const borderWidths = [
          parseFloat(s.borderTopWidth) || 0,
          parseFloat(s.borderRightWidth) || 0,
          parseFloat(s.borderBottomWidth) || 0,
          parseFloat(s.borderLeftWidth) || 0,
        ];
        const borderColors = [s.borderTopColor, s.borderRightColor, s.borderBottomColor, s.borderLeftColor].map(parseRgba);
        const visibleBorderSides = borderWidths.filter((w, idx) => w >= 0.5 && borderColors[idx] && borderColors[idx][3] > 0.05).length;
        const hasShadow = Boolean(s.boxShadow && s.boxShadow !== 'none');
        if (!hasBg && visibleBorderSides < 2 && !hasShadow) continue;
      }

      const tier = classifyRadiusTier(radiusPx, r.height);
      const normVal = tier === 'pill' ? 'pill' : `${Math.round(radiusPx)}px`;
      controlValueSet.add(normVal);
      controlTierSet.add(tier);
      if (controlSamples.length < 16) {
        controlSamples.push({
          tag: el.tagName.toLowerCase(),
          label: (el.innerText || el.getAttribute('aria-label') || el.getAttribute('placeholder') || '').trim().slice(0, 32) || null,
          radiusPx: Math.round(radiusPx),
          normalized: normVal,
          tier,
        });
      }
    }

    const cardUniqueValues = Array.from(cardValueSet);
    const cardTiers = Array.from(cardTierSet);
    const controlUniqueValues = Array.from(controlValueSet);
    const controlTiers = Array.from(controlTierSet);
    const radiusContract = {
      cards: {
        count: cardSamples.length,
        uniqueValues: cardUniqueValues,
        tiers: cardTiers,
        samples: cardSamples.slice(0, 8),
      },
      controls: {
        count: controlSamples.length,
        uniqueValues: controlUniqueValues,
        tiers: controlTiers,
        samples: controlSamples.slice(0, 8),
      },
      cardDistinctCount: cardUniqueValues.length,
      controlTierCount: controlTiers.length,
      radiusDriftDetected: cardUniqueValues.length >= 3 || cardTiers.length >= 3 || controlTiers.length >= 3,
    };

    // 2. Section Rhythm (Consecutive Centered-Pyramid Monotony Check)
    const hasSideBySideColumns = (container) => {
      if (!isLayoutVisible(container)) return false;
      const cs = getComputedStyle(container);
      const isGrid = cs.display === 'grid' || cs.display === 'inline-grid';
      const isRowFlex = (cs.display === 'flex' || cs.display === 'inline-flex') && cs.flexDirection.startsWith('row');
      if (!isGrid && !isRowFlex) return false;
      if (isGrid && cs.gridTemplateColumns.trim().split(/\s+/).length < 2) return false;

      const visChildren = Array.from(container.children).filter((c) => {
        if (!isLayoutVisible(c)) return false;
        const ccs = getComputedStyle(c);
        if (ccs.position === 'absolute' || ccs.position === 'fixed') return false;
        const cr = c.getBoundingClientRect();
        return cr.width >= 80 && cr.height >= 24;
      });
      if (visChildren.length < 2) return false;
      const rects = visChildren.map((c) => c.getBoundingClientRect());
      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const a = rects[i];
          const b = rects[j];
          const horizSeparated = a.right <= b.left + 20 || b.right <= a.left + 20;
          const vertOverlap = Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top) + 4;
          if (horizSeparated && vertOverlap) return true;
        }
      }
      return false;
    };

    const detectSectionMultiCol = (secEl) => {
      if (hasSideBySideColumns(secEl)) return true;
      const queue = [{ el: secEl, depth: 0 }];
      let visited = 0;
      while (queue.length > 0 && visited < 40) {
        const { el, depth } = queue.shift();
        visited++;
        if (depth > 0 && hasSideBySideColumns(el)) return true;
        if (depth >= 4) continue;
        for (const child of el.children) {
          if (child.matches('header, nav, footer, button, a, svg, canvas')) continue;
          if (!isLayoutVisible(child)) continue;
          queue.push({ el: child, depth: depth + 1 });
        }
      }
      return false;
    };

    const rhythmSequence = [];
    let currentCenteredRun = 0;
    let maxConsecutiveCentered = 0;

    for (const sec of sections) {
      if (sec.tag === 'header' || sec.tag === 'footer') continue;
      const secEl = document.querySelector(`[data-unslop-audit-sec="${sec.idx}"]`);
      if (!secEl || isHiddenOrInert(secEl)) continue;

      const secRect = secEl.getBoundingClientRect();
      const secCenter = secRect.left + secRect.width / 2;
      const heading = Array.from(secEl.querySelectorAll('h1, h2, h3')).find((h) => {
        if (isHiddenOrInert(h)) return false;
        const hr = h.getBoundingClientRect();
        return hr.width > 0 && hr.height > 0;
      }) || null;

      let isHeadingCentered = false;
      let isHeadingLeftAligned = true;
      if (heading) {
        const hs = getComputedStyle(heading);
        const hRect = heading.getBoundingClientRect();
        const hCenter = hRect.left + hRect.width / 2;
        const range = document.createRange();
        range.selectNodeContents(heading);
        const tr = range.getBoundingClientRect();
        const textCenter = tr.width > 0 ? tr.left + tr.width / 2 : hCenter;

        const isBoxBalancedCentered =
          hs.textAlign !== 'right' &&
          hs.textAlign !== 'end' &&
          hRect.width < secRect.width * 0.65 &&
          Math.abs(hCenter - secCenter) <= 48 &&
          Math.abs(textCenter - secCenter) <= 48;

        isHeadingCentered = hs.textAlign === 'center' || isBoxBalancedCentered;
        isHeadingLeftAligned = !isHeadingCentered && hs.textAlign !== 'right' && hs.textAlign !== 'end';
      } else {
        isHeadingCentered = getComputedStyle(secEl).textAlign === 'center';
        isHeadingLeftAligned = !isHeadingCentered;
      }

      const isMultiCol = detectSectionMultiCol(secEl);
      let layout = 'left-aligned';
      if (isMultiCol && isHeadingLeftAligned) {
        layout = 'asymmetric-or-split';
      } else if (isHeadingCentered) {
        layout = 'centered';
      }

      if (layout === 'centered') {
        currentCenteredRun++;
        if (currentCenteredRun > maxConsecutiveCentered) maxConsecutiveCentered = currentCenteredRun;
      } else {
        currentCenteredRun = 0;
      }

      rhythmSequence.push({
        index: sec.idx,
        tag: sec.tag,
        id: secEl.id || null,
        layout,
        heading: heading ? (heading.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 60) : null,
      });
    }

    const sectionRhythm = {
      sectionCount: rhythmSequence.length,
      sequence: rhythmSequence,
      maxConsecutiveCentered,
      monotonyDetected: maxConsecutiveCentered >= 3,
    };

    // 3. Stretched Void Cards (Anti-Void Flex-Stretch Check)
    const stretchedVoidCards = [];
    for (const el of document.querySelectorAll('body *')) {
      if (isHiddenOrInert(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.height <= 320 || r.width < 180 || r.width > 760) continue;
      const s = getComputedStyle(el);
      if (s.display !== 'flex' && s.display !== 'inline-flex') continue;
      if (s.flexDirection !== 'column' && s.flexDirection !== 'column-reverse') continue;
      if (s.justifyContent !== 'space-between') continue;

      const visibleChildren = Array.from(el.children)
        .filter((c) => {
          if (isHiddenOrInert(c)) return false;
          const cs = getComputedStyle(c);
          if (cs.position === 'absolute' || cs.position === 'fixed') return false;
          const cr = c.getBoundingClientRect();
          return cr.width > 0 && cr.height > 0;
        })
        .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);

      if (visibleChildren.length < 2) continue;

      let maxGap = 0;
      for (let i = 1; i < visibleChildren.length; i++) {
        const prevR = visibleChildren[i - 1].getBoundingClientRect();
        const curR = visibleChildren[i].getBoundingClientRect();
        const gap = curR.top - prevR.bottom;
        if (gap > maxGap) maxGap = gap;
      }
      const maxGapPx = Math.round(maxGap);
      const gapRatio = Number((maxGap / r.height).toFixed(2));
      if (maxGapPx >= 110 || maxGap / r.height >= 0.28) {
        const headingNode = el.querySelector('h1, h2, h3, h4');
        const heading = ((headingNode?.innerText || el.innerText || '').trim().replace(/\s+/g, ' ')).slice(0, 60) || null;
        stretchedVoidCards.push({
          tag: el.tagName.toLowerCase(),
          heading,
          heightPx: Math.round(r.height),
          maxGapPx,
          gapRatio,
        });
        if (stretchedVoidCards.length >= 16) break;
      }
    }

    // 4. Navbar Purity Check
    const headerEl =
      Array.from(document.querySelectorAll('body > header, header, [role="banner"]')).find((el) => !isHiddenOrInert(el)) ||
      Array.from(document.querySelectorAll('nav, [role="navigation"]')).find((el) => {
        if (isHiddenOrInert(el) || el.closest('footer')) return false;
        const r = el.getBoundingClientRect();
        return r.top < 120 && r.height >= 24 && r.height <= 220;
      }) ||
      null;

    const isThemeToggleEl = (el) => {
      const aria = (el.getAttribute('aria-label') || '').trim();
      const title = (el.getAttribute('title') || '').trim();
      const id = (el.getAttribute('id') || '').trim();
      return (
        el.hasAttribute('data-theme-toggle') ||
        /(dark\s*mode|light\s*mode|theme)/i.test(aria) ||
        /theme/i.test(title) ||
        /theme[-_]?toggle/i.test(id)
      );
    };
    const isMotionToggleEl = (el) => {
      const aria = (el.getAttribute('aria-label') || '').trim();
      const id = (el.getAttribute('id') || '').trim();
      const text = (el.innerText || '').trim();
      return /motion/i.test(aria) || /motion/i.test(id) || /^motion\s*(on|off|:\s*full|:\s*reduced)/i.test(text);
    };
    const isHamburgerToggleEl = (el) => {
      const aria = (el.getAttribute('aria-label') || '').trim();
      const title = (el.getAttribute('title') || '').trim();
      const id = (el.getAttribute('id') || '').trim();
      const cls = typeof el.className === 'string' ? el.className : '';
      return (
        /(hamburger|menu[-_]?toggle|mobile[-_]?nav|toggle[-_]?nav)/i.test(`${cls} ${id}`) ||
        /(open|toggle|close)?\s*(main\s+)?(navigation|menu)/i.test(`${aria} ${title}`)
      );
    };

    let navLinkCount = 0;
    let themeToggleInHeader = false;
    let motionToggleInHeader = false;
    const navItems = [];

    if (headerEl) {
      const visibleAnchors = Array.from(headerEl.querySelectorAll('a[href]')).filter((a) => {
        if (isHiddenOrInert(a)) return false;
        const r = a.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      let brandAnchor =
        visibleAnchors.find(
          (a) =>
            a.matches('[class*="brand" i], [class*="logo" i], [rel="home"], [aria-label*="home" i]') ||
            Boolean(a.querySelector('[class*="brand" i], [class*="logo" i]')),
        ) || null;
      if (!brandAnchor && visibleAnchors.length > 0) {
        const firstA = visibleAnchors[0];
        const firstHref = (firstA.getAttribute('href') || '').trim();
        if (firstHref === '/' || firstHref === '#top' || firstHref === '#' || (!firstA.closest('ul') && visibleAnchors.length >= 2 && Boolean(firstA.querySelector('svg, img')))) {
          brandAnchor = firstA;
        }
      }

      for (const el of headerEl.querySelectorAll('[data-theme-toggle], button, [role="button"], a[href]')) {
        if (isHiddenOrInert(el)) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (isThemeToggleEl(el)) themeToggleInHeader = true;
        if (isMotionToggleEl(el)) motionToggleInHeader = true;
      }

      const seenTriggers = new Set();
      for (const el of headerEl.querySelectorAll('a[href], button, [role="button"]')) {
        if (isHiddenOrInert(el)) continue;
        if (seenTriggers.has(el)) continue;
        if (el === brandAnchor) continue;
        if (el.closest('[role="menu"], [role="listbox"], ul ul, [class*="dropdown-menu" i]')) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (isThemeToggleEl(el) || isMotionToggleEl(el) || isHamburgerToggleEl(el)) continue;
        seenTriggers.add(el);
        navLinkCount++;
        if (navItems.length < 12) {
          navItems.push((el.innerText || el.getAttribute('aria-label') || el.getAttribute('href') || '').trim().replace(/\s+/g, ' ').slice(0, 40));
        }
      }
    }

    const hasThemeOrMotionInHeader = themeToggleInHeader || motionToggleInHeader;
    const navClutter = {
      headerPresent: Boolean(headerEl),
      navLinkCount,
      hasThemeOrMotionInHeader,
      themeToggleInHeader,
      motionToggleInHeader,
      cluttered: navLinkCount > 6 || hasThemeOrMotionInHeader,
      navItems,
    };

    // 5. Micro-UI / Terminal Wrapping Check
    const wrappedMonoBars = [];
    const seenWrapEls = new Set();
    for (const el of document.querySelectorAll('[class*="statusline"], [class*="status-bar"], .cmd-box code, header nav a, header button')) {
      if (seenWrapEls.has(el) || isHiddenOrInert(el)) continue;
      seenWrapEls.add(el);
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const text = (el.innerText || '').trim().replace(/\s+/g, ' ');
      if (!text || text.length > 85) continue;
      if (el.closest('pre') && (el.textContent || '').includes('\n')) continue;
      if (el.querySelector('br, p, div, h1, h2, h3, h4, ul, ol')) continue;

      const s = getComputedStyle(el);
      const fsPx = parseFloat(s.fontSize) || 0;
      const rawLh = parseFloat(s.lineHeight);
      const lineHeight = Number.isFinite(rawLh) && rawLh > 0 ? rawLh : fsPx * 1.25;
      if (!(lineHeight > 0) || r.height <= lineHeight * 1.85) continue;

      // Measure actual inline text line wrapping to avoid false positives on 44px min-height single-line tap targets
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const lineBands = new Set();
      let minTop = Infinity;
      let maxBottom = -Infinity;
      let node;
      while ((node = walker.nextNode())) {
        if (!node.textContent || !node.textContent.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const cr of range.getClientRects()) {
          if (cr.width < 1 || cr.height < 1) continue;
          lineBands.add(Math.round(cr.top / Math.max(4, lineHeight * 0.45)));
          if (cr.top < minTop) minTop = cr.top;
          if (cr.bottom > maxBottom) maxBottom = cr.bottom;
        }
      }

      const wrappedTextSpan = maxBottom > minTop ? maxBottom - minTop : 0;
      const wrappedOntoMultipleLines = lineBands.size >= 2 || wrappedTextSpan > lineHeight * 1.45;
      if (!wrappedOntoMultipleLines) continue;

      wrappedMonoBars.push({
        tag: el.tagName.toLowerCase(),
        text,
        heightPx: Math.round(r.height),
        lineHeightPx: Number(lineHeight.toFixed(1)),
        lineCount: lineBands.size,
        className: typeof el.className === 'string' ? el.className.trim().slice(0, 48) || null : null,
      });
      if (wrappedMonoBars.length >= 16) break;
    }

    // 6. Generic AI Font Warning + Typography Metadata
    const GENERIC_FONTS = [
      { label: 'Inter', re: /^(?:inter(?:\s+var|\s+variable)?|__inter_[a-z0-9]+)$/i },
      { label: 'Roboto', re: /^(?:roboto|__roboto_[a-z0-9]+)$/i },
      { label: 'Poppins', re: /^(?:poppins|__poppins_[a-z0-9]+)$/i },
      { label: 'Plus Jakarta Sans', re: /^(?:plus\s+jakarta\s+sans|__plus_jakarta_sans_[a-z0-9]+)$/i },
      { label: 'Space Grotesk', re: /^(?:space\s+grotesk|__space_grotesk_[a-z0-9]+)$/i },
    ];
    const cleanPrimaryFamily = (fontFamilyStr) =>
      String(fontFamilyStr || '').split(',')[0].replace(/["']/g, '').trim() || null;

    const h1El = Array.from(document.querySelectorAll('h1')).find((el) => !isHiddenOrInert(el)) || document.querySelector('h1');
    const bodyRefEl = document.body;
    const h1Style = h1El ? getComputedStyle(h1El) : null;
    const bodyStyle = bodyRefEl ? getComputedStyle(bodyRefEl) : null;

    const primaryBodyP = Array.from(document.querySelectorAll('main p, article p, section p, p')).find((p) => {
      if (isHiddenOrInert(p)) return false;
      const pr = p.getBoundingClientRect();
      return pr.width >= 120 && (p.innerText || '').trim().length >= 30;
    });
    const bodyPStyle = primaryBodyP ? getComputedStyle(primaryBodyP) : null;

    const defaultFontsSet = new Set();
    for (const st of [h1Style, bodyStyle, bodyPStyle]) {
      if (!st) continue;
      const primary = cleanPrimaryFamily(st.fontFamily);
      if (!primary) continue;
      for (const spec of GENERIC_FONTS) {
        if (spec.re.test(primary)) defaultFontsSet.add(spec.label);
      }
    }
    const defaultFontFlags = Array.from(defaultFontsSet);

    const typographyMeta = {
      h1: h1Style
        ? {
            primaryFamily: cleanPrimaryFamily(h1Style.fontFamily),
            fontFamily: h1Style.fontFamily,
            weight: h1Style.fontWeight,
            letterSpacing: h1Style.letterSpacing,
            fontSizePx: Number(parseFloat(h1Style.fontSize).toFixed(1)),
            lineHeightPx: Number((parseFloat(h1Style.lineHeight) || parseFloat(h1Style.fontSize) * 1.2).toFixed(1)),
          }
        : null,
      body: bodyStyle
        ? {
            primaryFamily: cleanPrimaryFamily((bodyPStyle || bodyStyle).fontFamily),
            fontFamily: (bodyPStyle || bodyStyle).fontFamily,
            weight: (bodyPStyle || bodyStyle).fontWeight,
            fontSizePx: Number(parseFloat((bodyPStyle || bodyStyle).fontSize).toFixed(1)),
            lineHeightPx: Number((parseFloat((bodyPStyle || bodyStyle).lineHeight) || parseFloat((bodyPStyle || bodyStyle).fontSize) * 1.4).toFixed(1)),
          }
        : null,
    };

    // 7. Copy Economy Telemetry
    const countWords = (text) =>
      String(text || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;

    const computeMedian = (nums) => {
      if (!nums || nums.length === 0) return 0;
      const sorted = [...nums].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      if (sorted.length % 2 === 1) return sorted[mid];
      return Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(1));
    };

    const FAQ_OR_LEGAL_RE = /\b(faq|faqs|frequently\s+asked|accordion|legal|terms|privacy|disclaimer|policy|license|copyright|imprint|tos)\b/i;
    const isFaqOrLegalCard = (el) => {
      if (el.closest('details, footer, [role="region"][aria-labelledby*="faq" i]')) return true;
      let cur = el;
      while (cur && cur !== document.body) {
        const meta = [
          cur.id || '',
          typeof cur.className === 'string' ? cur.className : '',
          cur.getAttribute('aria-label') || '',
          cur.getAttribute('data-section') || '',
        ].join(' ');
        if (FAQ_OR_LEGAL_RE.test(meta)) return true;
        if (cur.tagName === 'SECTION') {
          const secHeading = cur.querySelector('h1, h2, h3');
          if (secHeading && FAQ_OR_LEGAL_RE.test(secHeading.innerText || secHeading.textContent || '')) {
            return true;
          }
          break;
        }
        cur = cur.parentElement;
      }
      return false;
    };

    const h1WordCount = h1El ? countWords(h1El.innerText || h1El.textContent) : 0;

    const leafCardEls = cardCandidateEls.filter((el) => {
      if (el.closest('header, nav, footer')) return false;
      const nested = cardCandidateEls.filter((other) => other !== el && el.contains(other));
      if (nested.length >= 2) return false;
      if (nested.length === 1) {
        const ownWords = countWords(el.innerText || el.textContent);
        const childWords = countWords(nested[0].innerText || nested[0].textContent);
        if (ownWords > 0 && childWords / ownWords >= 0.6) return false;
      }
      return true;
    });

    const cardWordCounts = [];
    const wordyCards = [];
    for (const el of leafCardEls) {
      const words = countWords(el.innerText || el.textContent);
      if (words <= 0) continue;
      cardWordCounts.push(words);
      if (words > 75 && !isFaqOrLegalCard(el) && wordyCards.length < 16) {
        const headingNode = el.querySelector('h1, h2, h3, h4');
        const heading = ((headingNode?.innerText || '').trim().replace(/\s+/g, ' ')).slice(0, 60) || null;
        wordyCards.push({
          tag: el.tagName.toLowerCase(),
          heading,
          wordCount: words,
          className: typeof el.className === 'string' ? el.className.trim().slice(0, 48) || null : null,
        });
      }
    }

    const medianCardWordCount = computeMedian(cardWordCounts);
    const copyDensityTier =
      medianCardWordCount > 45 || wordyCards.length > 0
        ? 'wordy'
        : medianCardWordCount <= 22 && h1WordCount <= 12
          ? 'minimal'
          : 'balanced';

    const copyEconomy = {
      h1WordCount,
      medianCardWordCount,
      wordyCards,
      copyDensityTier,
    };

    const primaryCanvasColors = {
      bodyBackground: rgbToHex(bodyBgRgb),
      bodyText: rgbToHex(bodyTextRgb),
      topSurfaces: Array.from(surfaceFreq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([hex]) => hex),
    };

    return {
      studioCraftCore: {
        radiusContract,
        sectionRhythm,
        stretchedVoidCards,
        navClutter,
        wrappedMonoBars,
        defaultFontFlags,
        copyEconomy,
      },
      typographyMeta,
      primaryCanvasColors,
    };
  }, sectionMeta);

  const sc = telemetry.studioCraftCore;
  const scWarnings = [];
  if (sc.radiusContract.radiusDriftDetected) {
    scWarnings.push(
      `Studio craft: 3-radius drift detected (cards: [${sc.radiusContract.cards.uniqueValues.join(', ')}]; controls tiers: [${sc.radiusContract.controls.tiers.join(', ')}])`,
    );
  }
  if (sc.sectionRhythm.monotonyDetected) {
    scWarnings.push(
      `Studio craft: section rhythm monotony (${sc.sectionRhythm.maxConsecutiveCentered} consecutive centered sections; vary layout rhythm)`,
    );
  }
  if (sc.stretchedVoidCards.length > 0) {
    scWarnings.push(
      `Studio craft: ${sc.stretchedVoidCards.length} flex-column space-between card(s) leave a vertical void (>= 110px or >= 28% height)`,
    );
  }
  if (sc.navClutter.hasThemeOrMotionInHeader || sc.navClutter.navLinkCount > 6) {
    const reasons = [];
    if (sc.navClutter.navLinkCount > 6) reasons.push(`${sc.navClutter.navLinkCount} top-level nav triggers (> 6)`);
    if (sc.navClutter.hasThemeOrMotionInHeader) reasons.push('theme/motion toggle placed directly in primary header');
    scWarnings.push(`Studio craft: navbar clutter (${reasons.join('; ')})`);
  }
  if (sc.wrappedMonoBars.length > 0) {
    scWarnings.push(
      `Studio craft: ${sc.wrappedMonoBars.length} single-line status/nav/micro-UI bar(s) wrapped unintentionally onto multiple lines`,
    );
  }
  if (sc.defaultFontFlags.length > 0 && !allowGenericFonts) {
    scWarnings.push(
      `Studio craft: generic AI font(s) detected (${sc.defaultFontFlags.join(', ')}); pass --allow-generic-fonts to suppress when intentional`,
    );
  }
  if (sc.copyEconomy.wordyCards.length > 0) {
    scWarnings.push(
      `Studio craft: ${sc.copyEconomy.wordyCards.length} card(s) exceed 75 words of prose (tighten copy economy)`,
    );
  }

  return {
    studioCraft: {
      ...sc,
      allowGenericFonts: Boolean(allowGenericFonts),
      warnings: scWarnings,
    },
    typographyMeta: telemetry.typographyMeta,
    primaryCanvasColors: telemetry.primaryCanvasColors,
  };
}

async function captureViewportTiles(page, outDir, prefix, viewportHeight, maxTiles) {
  const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const tileCount = Math.min(maxTiles, Math.max(1, Math.ceil(scrollHeight / viewportHeight)));
  const files = [];
  const metadata = [];
  let prevY = -1;

  for (let i = 0; i < tileCount; i++) {
    const y = Math.min(Math.max(0, scrollHeight - viewportHeight), i * viewportHeight);
    if (i > 0 && y === prevY) break;
    prevY = y;

    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
    await page.waitForTimeout(160);
    const file = `${prefix}-${i + 1}.png`;
    await page.screenshot({ path: path.join(outDir, file) });
    files.push(file);
    metadata.push({ file, path: path.resolve(outDir, file), scrollY: y });
  }

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(120);
  return { files, metadata };
}

function buildVisualCriticChecklist({
  url,
  auditedAt,
  outDir,
  desktopTileResult,
  mobileTileResult,
  studioCraft,
  domAudit,
  typographyMeta,
  primaryCanvasColors,
  mobileOverflow = null,
  mobileNarrowOverflow = null,
  smallTapTargets = [],
  mobileOverlayCollisions = [],
  reducedMotionToggleCheck = null,
  canvasChecks = [],
  scrollMotionChecks = [],
}) {
  return {
    meta: {
      url,
      auditedAt,
      outputDir: path.resolve(outDir),
      rubricScale: '8-axis-10-point',
    },
    desktopTiles: desktopTileResult.files,
    mobileTiles: mobileTileResult.files,
    desktopTilePaths: desktopTileResult.metadata.map((m) => m.path),
    mobileTilePaths: mobileTileResult.metadata.map((m) => m.path),
    tileMetadata: {
      desktop: desktopTileResult.metadata,
      mobile: mobileTileResult.metadata,
    },
    studioCraftWarnings: studioCraft.warnings,
    copyEconomy: studioCraft.copyEconomy,
    typographyCraft: {
      h1Family: typographyMeta.h1?.primaryFamily ?? null,
      h1FontStack: typographyMeta.h1?.fontFamily ?? null,
      h1Weight: typographyMeta.h1?.weight ?? null,
      h1Tracking: typographyMeta.h1?.letterSpacing ?? null,
      h1SizePx: typographyMeta.h1?.fontSizePx ?? null,
      bodyFamily: typographyMeta.body?.primaryFamily ?? null,
      bodyWeight: typographyMeta.body?.weight ?? null,
      bodySizePx: typographyMeta.body?.fontSizePx ?? null,
      h1ToBodyRatio: domAudit.antiSlop.h1ToBodyRatio,
      defaultFontFlags: studioCraft.defaultFontFlags,
      allowGenericFonts: studioCraft.allowGenericFonts,
    },
    deadSpaceAudit: {
      stretchedVoidCardCount: studioCraft.stretchedVoidCards.length,
      stretchedVoidCards: studioCraft.stretchedVoidCards,
    },
    microUiWrapping: {
      wrappedCount: studioCraft.wrappedMonoBars.length,
      wrappedMonoBars: studioCraft.wrappedMonoBars,
      clippedTextCount: domAudit.clippedText.length,
      clippedText: domAudit.clippedText,
    },
    rhythmAndMonotony: {
      sectionCount: studioCraft.sectionRhythm.sectionCount,
      maxConsecutiveCentered: studioCraft.sectionRhythm.maxConsecutiveCentered,
      monotonyDetected: studioCraft.sectionRhythm.monotonyDetected,
      sequence: studioCraft.sectionRhythm.sequence,
    },
    referenceFidelity: {
      primaryCanvasColors,
      loadedFonts: domAudit.loadedFonts,
      fontFallbackWarnings: domAudit.fontFallbackWarnings,
      navClutter: studioCraft.navClutter,
    },
    surfaceCohesion: {
      radiusContract: studioCraft.radiusContract,
      heavyShadowCardRatio: domAudit.antiSlop.heavyShadowCardRatio,
      purpleIndigoGradientCount: domAudit.antiSlop.purpleIndigoGradientCount,
    },
    sideBySideVisualLineage: {
      requiredReferenceAssets: ['desktop-top.png', 'desktop-full.png'],
      generatedTiles: desktopTileResult.files,
      prompt:
        'Compare generated tiles side-by-side against reference captures: are background substrates, framing lines, hero geometry, surface polarity, and copy economy unmistakably aligned?',
    },
    motionAndMobileErgonomics: {
      axisNumber: 8,
      title: 'Motion Continuity, Video Walkthrough & Mobile Ergonomics',
      requiredMotionQaAssets: [
        'desktop-walkthrough.webm',
        'mobile-walkthrough.webm',
        'keyframe-desktop-01.png',
        'keyframe-mobile-01.png',
        'motion-qa-report.json',
      ],
      script: 'skills/unslop/scripts/record_motion_qa.mjs',
      mobileOverflowPx: mobileOverflow?.docOverflowPx ?? 0,
      mobileNarrowOverflowPx: mobileNarrowOverflow?.docOverflowPx ?? 0,
      smallTapTargetsCount: Array.isArray(smallTapTargets) ? smallTapTargets.length : 0,
      mobileOverlayCollisionsCount: Array.isArray(mobileOverlayCollisions) ? mobileOverlayCollisions.length : 0,
      reducedMotionToggleTested: Boolean(reducedMotionToggleCheck?.tested),
      reducedMotionFreezeVerified: Boolean(reducedMotionToggleCheck?.canvasStoppedAnimating),
      animatedCanvasCount: Array.isArray(canvasChecks)
        ? canvasChecks.filter((c) => !c.isBlank && c.animatesOverTime).length
        : 0,
      kineticScrollSectionsVerified: Array.isArray(scrollMotionChecks)
        ? scrollMotionChecks.filter((m) => m.kineticChangesDetected).length
        : 0,
      prompt:
        'Inspect desktop-walkthrough.webm, mobile-walkthrough.webm, keyframe-*.png, and motion-qa-report.json: are scroll choreography, hover feedback, and reduced-motion freezing smooth and intentional, and is mobile (390px) re-authored with zero horizontal overflow, compact sticky header (<= 16% viewport), and >= 44x44px tap targets?',
    },
  };
}

export async function auditUI(url, outputDir, options = {}) {
  const { allowGenericFonts = false, studioCraftWarnings = true } = options || {};
  const outDir = await ensureDir(outputDir);
  const sectionsDir = await ensureDir(path.join(outDir, 'sections'));
  const browser = await launchBrowser();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Force preserveDrawingBuffer:true on WebGL contexts + observe real CLS layout-shift entries before navigation
  await page.addInitScript(() => {
    const origGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, attrs) {
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
        return origGetContext.call(this, type, { ...(attrs || {}), preserveDrawingBuffer: true });
      }
      return origGetContext.call(this, type, attrs);
    };

    window.__unslopPerf = { cls: 0, layoutShiftCount: 0, entries: [] };
    try {
      if (typeof PerformanceObserver !== 'undefined') {
        const po = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput && typeof entry.value === 'number') {
              window.__unslopPerf.cls += entry.value;
              window.__unslopPerf.layoutShiftCount++;
              if (window.__unslopPerf.entries.length < 10) {
                window.__unslopPerf.entries.push({
                  value: Number(entry.value.toFixed(4)),
                  startTime: Math.round(entry.startTime),
                });
              }
            }
          }
        });
        po.observe({ type: 'layout-shift', buffered: true });
      }
    } catch {
      // layout-shift observer unsupported
    }
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
  const oversizedImagesMap = new Map();
  const pendingImageSizeChecks = [];
  const OVERSIZED_IMAGE_BYTES = 500_000;

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
    const status = res.status();
    const resUrl = res.url();
    if (status >= 400 && !resUrl.includes('favicon.ico')) {
      failedRequests.push({ url: resUrl, status });
      return;
    }
    if (status >= 200 && status < 300 && !resUrl.startsWith('data:')) {
      const reqType = res.request()?.resourceType?.() || '';
      const headers = res.headers();
      const contentType = headers['content-type'] || '';
      if (reqType === 'image' || contentType.toLowerCase().startsWith('image/')) {
        const recordIfOversized = (bytes) => {
          if (bytes > OVERSIZED_IMAGE_BYTES) {
            const prev = oversizedImagesMap.get(resUrl);
            if (!prev || bytes > prev.bytes) {
              oversizedImagesMap.set(resUrl, {
                url: resUrl.slice(0, 200),
                bytes,
                kb: Math.round(bytes / 1024),
                contentType: contentType.split(';')[0].trim() || null,
              });
            }
          }
        };
        const clHeader = parseInt(headers['content-length'] || '', 10);
        if (Number.isFinite(clHeader) && clHeader > 0) {
          recordIfOversized(clHeader);
        } else {
          pendingImageSizeChecks.push(
            res
              .body()
              .then((buf) => {
                if (buf) recordIfOversized(buf.byteLength);
              })
              .catch(() => {}),
          );
        }
      }
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

    // Snapshot real CLS after initial load + hydration scroll, before test instrumentation/resizes
    const perfMetrics = await page.evaluate(() => {
      const p = window.__unslopPerf || { cls: 0, layoutShiftCount: 0, entries: [] };
      return {
        cls: Number((p.cls || 0).toFixed(4)),
        layoutShiftCount: p.layoutShiftCount || 0,
        layoutShiftEntries: Array.isArray(p.entries) ? p.entries : [],
      };
    });

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

    const { studioCraft, typographyMeta, primaryCanvasColors } = await runStudioCraftAudit(page, sectionMeta, {
      allowGenericFonts,
    });

    const reducedMotionToggleCheck = await probeReducedMotionToggle(page, canvasChecks);

    const primaryContrast = await runContrastAudit(page);

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

        if (
          hasDirectText &&
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

      // Semantic link, metadata, and heading hierarchy hygiene
      const brokenAnchors = [];
      const deadPlaceholderLinks = [];
      for (const a of document.querySelectorAll('a[href^="#"]')) {
        if (isHiddenOrInert(a)) continue;
        const href = (a.getAttribute('href') || '').trim();
        const label = (a.innerText || a.getAttribute('aria-label') || a.getAttribute('title') || '').trim().slice(0, 50);
        if (href === '#') {
          const isInteractiveButtonHint =
            a.getAttribute('role') === 'button' ||
            a.hasAttribute('onclick') ||
            typeof a.onclick === 'function' ||
            a.hasAttribute('aria-controls') ||
            a.hasAttribute('aria-haspopup') ||
            a.hasAttribute('aria-expanded') ||
            a.hasAttribute('data-action') ||
            a.hasAttribute('data-toggle') ||
            a.hasAttribute('data-target') ||
            a.hasAttribute('data-modal') ||
            a.hasAttribute('data-drawer');
          if (!isInteractiveButtonHint && deadPlaceholderLinks.length < 20) {
            deadPlaceholderLinks.push({ href, text: label });
          }
          continue;
        }
        if (href.toLowerCase() === '#top') continue;
        const rawId = href.slice(1);
        let targetId = rawId;
        try {
          targetId = decodeURIComponent(rawId);
        } catch {
          // Keep rawId
        }
        if (!targetId) continue;
        const target =
          document.getElementById(targetId) ||
          document.querySelector(`[name="${CSS.escape(targetId)}"]`);
        if (!target && brokenAnchors.length < 20) {
          brokenAnchors.push({ href, text: label });
        }
      }

      const docTitle = (document.title || '').trim();
      const metaDesc = (document.querySelector('meta[name="description" i]')?.getAttribute('content') || '').trim();
      let h1Count = 0;
      let headingCount = 0;
      let prevHeadingLevel = 0;
      const skippedHeadingLevels = [];
      for (const h of document.querySelectorAll('h1, h2, h3, h4, h5, h6')) {
        if (isHiddenOrInert(h)) continue;
        const level = parseInt(h.tagName.slice(1), 10);
        headingCount++;
        if (level === 1) h1Count++;
        if (prevHeadingLevel > 0 && level > prevHeadingLevel + 1 && skippedHeadingLevels.length < 12) {
          skippedHeadingLevels.push({
            from: `h${prevHeadingLevel}`,
            to: `h${level}`,
            text: (h.textContent || '').trim().slice(0, 50),
          });
        }
        prevHeadingLevel = level;
      }

      // Header/footer fingerprint for multi-route shared chrome consistency checks
      const extractLinks = (root, max) => {
        if (!root) return [];
        const links = [];
        for (const a of root.querySelectorAll('a[href]')) {
          if (isHiddenOrInert(a)) continue;
          const text = (a.innerText || a.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 40);
          const href = (a.getAttribute('href') || '').trim();
          links.push(`${text}|${href}`);
          if (links.length >= max) break;
        }
        return links;
      };
      const headerEl =
        Array.from(document.querySelectorAll('body > header, header, [role="banner"]')).find((el) => !isHiddenOrInert(el)) ||
        Array.from(document.querySelectorAll('nav, [role="navigation"]')).find((el) => {
          if (isHiddenOrInert(el) || el.closest('footer')) return false;
          const r = el.getBoundingClientRect();
          return r.top < 120 && r.height >= 24 && r.height <= 220;
        }) ||
        null;
      const footerEl = Array.from(document.querySelectorAll('body > footer, footer')).find((el) => !isHiddenOrInert(el)) || null;
      const chromeSignature = {
        header: {
          present: Boolean(headerEl),
          navLinks: extractLinks(headerEl, 20),
          height: headerEl ? Math.round(headerEl.getBoundingClientRect().height) : 0,
        },
        footer: {
          present: Boolean(footerEl),
          links: extractLinks(footerEl, 30),
          textSample: footerEl ? (footerEl.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 120) : '',
        },
      };

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
        clippedText,
        unnamedControls,
        semantics: {
          hasTitle: docTitle.length > 0,
          title: docTitle.slice(0, 120),
          hasMetaDescription: metaDesc.length > 0,
          h1Count,
          headingCount,
          skippedHeadingLevels,
          brokenAnchors,
          deadPlaceholderLinks,
        },
        chromeSignature,
        antiSlop: {
          h1ToBodyRatio,
          purpleIndigoGradientCount: gradientElements.length,
          placeholderCopyMatches: slopStrings,
          heavyShadowCardRatio: cardCount >= 3 ? Number((heavyShadowCount / cardCount).toFixed(2)) : 0,
        },
      };
    });

    domAudit.contrastFailures = primaryContrast.contrastFailures;
    domAudit.contrastSkippedOverMediaCount = primaryContrast.contrastSkippedOverMediaCount;

    const alternateThemeContrast = await probeAlternateThemeContrast(page);
    const interactiveOverlayChecks = await probeInteractiveOverlays(page);

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
    await page.evaluate(() => {
      if (document.activeElement && document.activeElement !== document.body) {
        document.activeElement.blur?.();
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(120);
    const desktopTileResult = await captureViewportTiles(page, outDir, 'critic-desktop', 900, 6);

    const tabletOverflow = await checkViewportOverflow(page, 768, 1024);
    const mobileNarrowOverflow = await checkViewportOverflow(page, 320, 720);
    const mobileOverflow = await checkViewportOverflow(page, 390, 844);
    await page.screenshot({ path: path.join(outDir, 'mobile.png') });
    const mobileTileResult = await captureViewportTiles(page, outDir, 'critic-mobile', 844, 5);

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

    if (pendingImageSizeChecks.length > 0) {
      await Promise.race([
        Promise.allSettled(pendingImageSizeChecks),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);
    }
    const oversizedImages = Array.from(oversizedImagesMap.values())
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, 20);

    const missingFocusCount = focusChecks.filter((f) => !f.visibleIndicator).length;
    const blankCanvases = canvasChecks.filter((c) => c.isBlank);
    const frozenCanvases = canvasChecks.filter((c) => !c.isBlank && !c.animatesOverTime);
    const staticStickyTracks = scrollMotionChecks.filter(
      (m) => m.hasStickyDescendants && !m.kineticChangesDetected && (m.height >= 2200 || m.hasKineticHints),
    );
    const stuckOverlays = interactiveOverlayChecks.filter((o) => o.opened && !o.dismissedOnEscape);
    const criticalErrors = [];

    if (consoleErrors.length > 0) criticalErrors.push(`${consoleErrors.length} console error(s)`);
    if (pageErrors.length > 0) criticalErrors.push(`${pageErrors.length} uncaught page error(s)`);
    if (failedRequests.length > 0) criticalErrors.push(`${failedRequests.length} failed network request(s)`);
    if (domAudit.brokenImages.length > 0) criticalErrors.push(`${domAudit.brokenImages.length} broken image(s)`);
    if (blankCanvases.length > 0) criticalErrors.push(`${blankCanvases.length} blank/unrendered <canvas> element(s)`);
    if (domAudit.failedFonts.length > 0) criticalErrors.push(`${domAudit.failedFonts.length} failed font(s)`);
    if (perfMetrics.cls > 0.25) {
      criticalErrors.push(`High Cumulative Layout Shift (CLS = ${perfMetrics.cls}, threshold <= 0.25)`);
    }
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
    if (perfMetrics.cls > 0.1 && perfMetrics.cls <= 0.25) {
      warnings.push(`Elevated Cumulative Layout Shift (CLS = ${perfMetrics.cls}, target <= 0.1)`);
    }
    if (oversizedImages.length > 0) {
      warnings.push(`${oversizedImages.length} oversized image(s) exceeding 500KB (largest: ${oversizedImages[0].kb}KB)`);
    }
    if (!domAudit.semantics.hasTitle) {
      warnings.push('Document is missing a non-empty <title>');
    }
    if (domAudit.semantics.headingCount > 0 && domAudit.semantics.h1Count !== 1) {
      warnings.push(`Expected exactly 1 visible <h1> heading, found ${domAudit.semantics.h1Count}`);
    }
    if (domAudit.semantics.skippedHeadingLevels.length > 0) {
      const first = domAudit.semantics.skippedHeadingLevels[0];
      warnings.push(`${domAudit.semantics.skippedHeadingLevels.length} skipped heading level(s) (e.g., ${first.from} -> ${first.to})`);
    }
    if (domAudit.semantics.brokenAnchors.length > 0) {
      warnings.push(`${domAudit.semantics.brokenAnchors.length} broken internal anchor link(s) pointing to missing target IDs`);
    }
    if (domAudit.semantics.deadPlaceholderLinks.length > 0) {
      warnings.push(`${domAudit.semantics.deadPlaceholderLinks.length} dead placeholder link(s) with href="#"`);
    }
    if (offlineBlockedFontUrls.length > 0) {
      warnings.push(`External webfont CDN unreachable offline (${offlineBlockedFontUrls.length} request(s)); verify fonts online too`);
    }
    if (domAudit.fontFallbackWarnings.length > 0 && offlineBlockedFontUrls.length === 0) {
      warnings.push(...domAudit.fontFallbackWarnings);
    }
    if (frozenCanvases.length > 0) {
      warnings.push(`${frozenCanvases.length} large <canvas> element(s) showed zero pixel change over 420ms (verify animation or intentional static fallback)`);
    }
    if (reducedMotionToggleCheck.found && reducedMotionToggleCheck.tested && !reducedMotionToggleCheck.canvasStoppedAnimating) {
      warnings.push('Motion toggle button found, but animated <canvas> continued changing pixels after toggling');
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
    if (alternateThemeContrast.toggled && alternateThemeContrast.contrastFailuresCount > 0) {
      warnings.push(`Alternate theme has ${alternateThemeContrast.contrastFailuresCount} WCAG AA contrast failure(s)`);
    }
    if (stuckOverlays.length > 0) {
      warnings.push(`${stuckOverlays.length} interactive overlay(s) failed to dismiss cleanly on Escape`);
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
    if (studioCraftWarnings !== false && studioCraft.warnings.length > 0) {
      warnings.push(...studioCraft.warnings);
    }

    const auditedAt = new Date().toISOString();
    const auditReport = {
      meta: { url, auditedAt },
      summary: {
        passed: criticalErrors.length === 0,
        criticalErrorCount: criticalErrors.length,
        warningCount: warnings.length,
        criticalErrors,
        warnings,
      },
      performance: {
        cls: perfMetrics.cls,
        layoutShiftCount: perfMetrics.layoutShiftCount,
        layoutShiftEntries: perfMetrics.layoutShiftEntries,
        oversizedImages,
      },
      semantics: domAudit.semantics,
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
        reducedMotionToggleCheck,
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
        chromeSignature: domAudit.chromeSignature,
      },
      accessibility: {
        contrastFailures: domAudit.contrastFailures,
        contrastSkippedOverMediaCount: domAudit.contrastSkippedOverMediaCount,
        alternateThemeContrast,
        interactiveOverlayChecks,
        unnamedControls: domAudit.unnamedControls,
        focusChecks,
        tabChecks,
        smallTapTargets,
      },
      antiSlop: domAudit.antiSlop,
      studioCraft,
      screenshots: {
        desktop: 'desktop.png',
        desktopFull: 'desktop-full.png',
        mobile: 'mobile.png',
        focusCheck: 'focus-check.png',
        scrollSnapshots,
        sections: sectionScreenshots,
        desktopTiles: desktopTileResult.files,
        mobileTiles: mobileTileResult.files,
      },
    };

    const visualCriticChecklist = buildVisualCriticChecklist({
      url,
      auditedAt,
      outDir,
      desktopTileResult,
      mobileTileResult,
      studioCraft,
      domAudit,
      typographyMeta,
      primaryCanvasColors,
      mobileOverflow,
      mobileNarrowOverflow,
      smallTapTargets,
      mobileOverlayCollisions,
      reducedMotionToggleCheck,
      canvasChecks,
      scrollMotionChecks,
    });

    await fs.writeFile(path.join(outDir, 'audit.json'), JSON.stringify(auditReport, null, 2));
    await fs.writeFile(path.join(outDir, 'visual-critic-checklist.json'), JSON.stringify(visualCriticChecklist, null, 2));
    return auditReport;
  } finally {
    await browser.close();
  }
}

function slugifyRoute(route, usedSlugs) {
  const cleaned = String(route || '/')
    .replace(/^https?:\/\/[^/]+/i, '')
    .split(/[?#]/)[0]
    .replace(/^\/+|\/+$/g, '');
  let base = cleaned ? cleaned.replace(/[^a-zA-Z0-9_-]+/g, '__').slice(0, 64) : 'index';
  if (!base || base === '.' || base === '..') base = 'index';
  let slug = base;
  let suffix = 2;
  while (usedSlugs.has(slug)) {
    slug = `${base}-${suffix++}`;
  }
  usedSlugs.add(slug);
  return slug;
}

function resolveRouteUrl(baseUrl, route) {
  const trimmed = String(route || '/').trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) {
    return new URL(trimmed, baseUrl).href;
  }
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return new URL(trimmed, normalizedBase).href;
}

export async function auditMultiRoute(baseUrl, routes, outputDir, options = {}) {
  const outDir = await ensureDir(outputDir);
  const rawList = Array.isArray(routes) ? routes : String(routes || '/').split(',');
  const routeList = rawList.map((r) => String(r).trim()).filter(Boolean);
  const normalizedRoutes = routeList.length > 0 ? routeList : ['/'];

  const usedSlugs = new Set();
  const routeRecords = [];

  for (const route of normalizedRoutes) {
    const subDir = slugifyRoute(route, usedSlugs);
    const routeUrl = resolveRouteUrl(baseUrl, route);
    const routeOutDir = path.join(outDir, subDir);
    try {
      const report = await auditUI(routeUrl, routeOutDir, options);
      routeRecords.push({
        route,
        url: routeUrl,
        subDir,
        blocked: Boolean(report.meta?.blocked),
        passed: Boolean(report.summary?.passed),
        criticalErrorCount: report.summary?.criticalErrorCount ?? 0,
        warningCount: report.summary?.warningCount ?? 0,
        criticalErrors: report.summary?.criticalErrors ?? [],
        warnings: report.summary?.warnings ?? [],
        cls: report.performance?.cls ?? null,
        chromeSignature: report.layout?.chromeSignature ?? null,
      });
    } catch (err) {
      const msg = String(err?.message || err).slice(0, 200);
      routeRecords.push({
        route,
        url: routeUrl,
        subDir,
        blocked: false,
        passed: false,
        criticalErrorCount: 1,
        warningCount: 0,
        criticalErrors: [`Route audit failed: ${msg}`],
        warnings: [],
        cls: null,
        chromeSignature: null,
      });
    }
  }

  // Shared header/footer consistency check across non-blocked routes with DOM telemetry
  const comparable = routeRecords.filter((r) => !r.blocked && r.chromeSignature);
  let headerConsistent = true;
  let footerConsistent = true;
  const inconsistencies = [];

  if (comparable.length >= 2) {
    const baseline = comparable[0];
    const baseHeaderPresent = baseline.chromeSignature.header.present;
    const baseHeaderLinks = JSON.stringify(baseline.chromeSignature.header.navLinks);
    const baseFooterPresent = baseline.chromeSignature.footer.present;
    const baseFooterLinks = JSON.stringify(baseline.chromeSignature.footer.links);
    const baseFooterText = baseline.chromeSignature.footer.textSample;

    for (const rec of comparable.slice(1)) {
      const curHeader = rec.chromeSignature.header;
      const curFooter = rec.chromeSignature.footer;
      if (curHeader.present !== baseHeaderPresent) {
        headerConsistent = false;
        inconsistencies.push(
          `Header presence mismatch on "${rec.route}" (present=${curHeader.present}) vs baseline "${baseline.route}" (present=${baseHeaderPresent})`,
        );
      } else if (baseHeaderPresent && JSON.stringify(curHeader.navLinks) !== baseHeaderLinks) {
        headerConsistent = false;
        inconsistencies.push(`Header navigation links on "${rec.route}" differ from baseline "${baseline.route}"`);
      }

      if (curFooter.present !== baseFooterPresent) {
        footerConsistent = false;
        inconsistencies.push(
          `Footer presence mismatch on "${rec.route}" (present=${curFooter.present}) vs baseline "${baseline.route}" (present=${baseFooterPresent})`,
        );
      } else if (baseFooterPresent) {
        const footerLinksDiffer = JSON.stringify(curFooter.links) !== baseFooterLinks;
        const footerTextDiffers = baseline.chromeSignature.footer.links.length === 0 && curFooter.textSample !== baseFooterText;
        if (footerLinksDiffer || footerTextDiffers) {
          footerConsistent = false;
          inconsistencies.push(`Footer content/links on "${rec.route}" differ from baseline "${baseline.route}"`);
        }
      }
    }
  }

  const totalCriticalErrors = routeRecords.reduce((sum, r) => sum + r.criticalErrorCount, 0);
  const totalWarnings = routeRecords.reduce((sum, r) => sum + r.warningCount, 0);

  const consolidated = {
    meta: {
      baseUrl,
      auditedAt: new Date().toISOString(),
      routesRequested: normalizedRoutes,
    },
    passed: routeRecords.every((r) => r.passed),
    routesAudited: routeRecords.length,
    totalCriticalErrors,
    totalWarnings,
    sharedChromeConsistency: {
      checked: comparable.length >= 2,
      baselineRoute: comparable[0]?.route ?? null,
      headerConsistent,
      footerConsistent,
      consistent: headerConsistent && footerConsistent,
      inconsistencies,
    },
    routes: routeRecords.map(({ chromeSignature, ...summary }) => summary),
  };

  await fs.writeFile(path.join(outDir, 'multi-route-audit.json'), JSON.stringify(consolidated, null, 2));
  return consolidated;
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
  const rawArgs = process.argv.slice(2);
  const positional = [];
  let routesArg = null;
  let allowGenericFonts = false;
  let studioCraftWarnings = true;
  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i];
    if (arg === '--routes' && i + 1 < rawArgs.length) {
      routesArg = rawArgs[++i];
    } else if (arg.startsWith('--routes=')) {
      routesArg = arg.slice('--routes='.length);
    } else if (arg === '--allow-generic-fonts') {
      allowGenericFonts = true;
    } else if (arg.startsWith('--allow-generic-fonts=')) {
      allowGenericFonts = arg.slice('--allow-generic-fonts='.length).toLowerCase() !== 'false';
    } else if (arg === '--studio-craft') {
      studioCraftWarnings = true;
    } else if (arg === '--no-studio-craft' || arg === '--studio-craft=false') {
      studioCraftWarnings = false;
    } else if (!arg.startsWith('--')) {
      positional.push(arg);
    }
  }
  const [targetUrl, outDir = './audit-out'] = positional;
  if (!targetUrl) {
    console.error(
      'Usage: node skills/unslop/scripts/audit_ui.mjs <url> [outputDir] [--routes /,/pricing,/about] [--allow-generic-fonts]',
    );
    process.exit(1);
  }
  const auditOptions = { allowGenericFonts, studioCraftWarnings };
  if (routesArg !== null) {
    const routesList = routesArg.split(',').map((r) => r.trim()).filter(Boolean);
    const multiReport = await auditMultiRoute(targetUrl, routesList, outDir, auditOptions);
    console.log(
      JSON.stringify(
        {
          passed: multiReport.passed,
          routesAudited: multiReport.routesAudited,
          totalCriticalErrors: multiReport.totalCriticalErrors,
          totalWarnings: multiReport.totalWarnings,
          sharedChromeConsistency: multiReport.sharedChromeConsistency,
          routes: multiReport.routes,
        },
        null,
        2,
      ),
    );
    if (!multiReport.passed) {
      process.exitCode = 1;
    }
  } else {
    const report = await auditUI(targetUrl, outDir, auditOptions);
    console.log(JSON.stringify(report.summary, null, 2));
    if (!report.summary.passed) {
      process.exitCode = 1;
    }
  }
}
