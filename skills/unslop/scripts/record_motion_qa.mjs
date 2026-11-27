#!/usr/bin/env node
import fs from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureDir, launchBrowser, safeNavigate } from './browser_helper.mjs';

const DESKTOP_VIEWPORT = { width: 1280, height: 720 };
const MOBILE_VIEWPORT = { width: 390, height: 844 };

async function moveVideoFile(videoObj, tmpDir, destPath) {
  let srcPath = null;
  if (videoObj) {
    try {
      srcPath = await videoObj.path();
    } catch {
      srcPath = null;
    }
  }
  if (!srcPath && tmpDir) {
    try {
      const entries = await fs.readdir(tmpDir);
      const webm = entries.find((f) => f.endsWith('.webm'));
      if (webm) srcPath = path.join(tmpDir, webm);
    } catch {
      srcPath = null;
    }
  }
  if (!srcPath) return null;

  try {
    await fs.access(srcPath);
  } catch {
    return null;
  }

  try {
    await fs.rename(srcPath, destPath);
  } catch {
    await fs.copyFile(srcPath, destPath);
    await fs.unlink(srcPath).catch(() => {});
  }
  return path.basename(destPath);
}

async function smoothScrollTo(page, targetY, steps = 6, stepDelayMs = 45) {
  const startY = await page.evaluate(() => window.scrollY || 0);
  const delta = targetY - startY;
  if (Math.abs(delta) < 2) {
    await page.waitForTimeout(120);
    return;
  }
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    // Smoothstep easing for natural walkthrough playback
    const eased = t * t * (3 - 2 * t);
    const y = Math.round(startY + delta * eased);
    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
    await page.waitForTimeout(stepDelayMs);
  }
  await page.evaluate((scrollY) => window.scrollTo(0, scrollY), targetY);
  await page.waitForTimeout(160);
}

async function startRafMonitor(page) {
  await page.evaluate(() => {
    window.__unslopMotionQA = {
      running: true,
      paused: false,
      lastTs: null,
      deltas: [],
      longFramesCount: 0,
      rafId: 0,
    };
    const tick = (ts) => {
      const st = window.__unslopMotionQA;
      if (!st || !st.running) return;
      if (!st.paused) {
        if (st.lastTs !== null) {
          const dt = ts - st.lastTs;
          if (dt > 0 && dt < 2000) {
            st.deltas.push(dt);
            if (dt > 50) st.longFramesCount++;
          }
        }
        st.lastTs = ts;
      } else {
        st.lastTs = null;
      }
      st.rafId = requestAnimationFrame(tick);
    };
    window.__unslopMotionQA.rafId = requestAnimationFrame(tick);
  });
}

async function setRafMonitorPaused(page, paused) {
  await page
    .evaluate((isPaused) => {
      const st = window.__unslopMotionQA;
      if (!st) return;
      st.paused = isPaused;
      st.lastTs = null;
    }, paused)
    .catch(() => {});
}

async function stopRafMonitor(page) {
  return page.evaluate(() => {
    const st = window.__unslopMotionQA;
    if (!st) {
      return { sampleCount: 0, avgFps: 0, longFramesCount: 0, smooth: true };
    }
    st.running = false;
    if (st.rafId) cancelAnimationFrame(st.rafId);
    const sampleCount = st.deltas.length;
    if (sampleCount === 0) {
      return { sampleCount: 0, avgFps: 0, longFramesCount: 0, smooth: true };
    }
    const avgDelta = st.deltas.reduce((sum, d) => sum + d, 0) / sampleCount;
    const avgFps = Number(Math.min(120, 1000 / Math.max(1, avgDelta)).toFixed(1));
    const longFramesCount = st.longFramesCount;
    const smooth = avgFps >= 24 && longFramesCount <= Math.max(3, Math.floor(sampleCount * 0.25));
    return { sampleCount, avgFps, longFramesCount, smooth };
  });
}

async function sampleCanvasFrame(cLoc) {
  try {
    const raw = await cLoc.evaluate((el) => {
      try {
        return el.toDataURL('image/png');
      } catch {
        return null;
      }
    });
    if (raw && raw.length > 64) return raw;
  } catch {
    // Fall back to element screenshot
  }
  const buf = await cLoc.screenshot({ timeout: 3000 });
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function probePrimaryHover(page) {
  const candidates = await page.evaluate(() => {
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

    const prioritized = [
      ...document.querySelectorAll('main button, main a[href], main [role="button"]'),
      ...document.querySelectorAll('header button, header a[href], nav a[href]'),
      ...document.querySelectorAll('button, a[href], [role="button"]'),
    ];
    const seen = new Set();
    const picked = [];

    for (const el of prioritized) {
      if (picked.length >= 4) break;
      if (seen.has(el)) continue;
      seen.add(el);
      if (isHidden(el) || el.disabled || el.getAttribute('aria-disabled') === 'true') continue;
      const r = el.getBoundingClientRect();
      if (r.width < 24 || r.height < 20) continue;
      const idx = picked.length;
      el.setAttribute('data-unslop-hover-probe', String(idx));
      picked.push(idx);
    }
    return picked;
  });

  if (candidates.length === 0) return false;

  const readStyleSig = (idx) =>
    page.evaluate((probeIdx) => {
      const el = document.querySelector(`[data-unslop-hover-probe="${probeIdx}"]`);
      if (!el) return null;
      const s = getComputedStyle(el);
      return JSON.stringify({
        backgroundColor: s.backgroundColor,
        color: s.color,
        borderColor: s.borderColor,
        transform: s.transform,
        boxShadow: s.boxShadow,
        opacity: s.opacity,
        outlineColor: s.outlineColor,
        textDecorationColor: s.textDecorationColor,
        textDecorationLine: s.textDecorationLine,
        filter: s.filter,
      });
    }, idx);

  let hoverDeltaDetected = false;
  try {
    for (const idx of candidates) {
      const loc = page.locator(`[data-unslop-hover-probe="${idx}"]`).first();
      if ((await loc.count().catch(() => 0)) === 0) continue;
      try {
        await loc.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
        await page.mouse.move(2, 2);
        await page.waitForTimeout(80);
        const before = await readStyleSig(idx);
        await loc.hover({ timeout: 2000 });
        await page.waitForTimeout(220);
        const after = await readStyleSig(idx);
        if (before && after && before !== after) {
          hoverDeltaDetected = true;
          break;
        }
      } catch {
        // Ignore individual probe failures and check next candidate
      }
    }
  } finally {
    await page.mouse.move(2, 2).catch(() => {});
    await page
      .evaluate(() => {
        for (const el of document.querySelectorAll('[data-unslop-hover-probe]')) {
          el.removeAttribute('data-unslop-hover-probe');
        }
      })
      .catch(() => {});
  }

  return hoverDeltaDetected;
}

async function probeMotionToggle(page) {
  const target = await page.evaluate(() => {
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

    const MOTION_TEXT_RE = /^(?:motion\s*(?:on|off|:\s*full|:\s*reduced)|reduce[d]?\s*motion)/i;
    const candidates = [
      ...document.querySelectorAll('[data-motion-toggle]'),
      ...document.querySelectorAll('button, [role="button"]'),
    ];
    const seen = new Set();

    let foundToggle = false;
    for (const el of candidates) {
      if (seen.has(el)) continue;
      seen.add(el);
      if (isHidden(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const aria = (el.getAttribute('aria-label') || '').trim();
      const id = (el.id || '').trim();
      const text = (el.innerText || '').trim();
      const matches =
        el.hasAttribute('data-motion-toggle') ||
        /motion/i.test(aria) ||
        /motion/i.test(id) ||
        MOTION_TEXT_RE.test(text);
      if (matches) {
        el.setAttribute('data-unslop-mqa-toggle', '1');
        foundToggle = true;
        break;
      }
    }

    let canvasIndex = -1;
    const canvases = Array.from(document.querySelectorAll('canvas'));
    for (let i = 0; i < canvases.length; i++) {
      const c = canvases[i];
      if (isHidden(c)) continue;
      const r = c.getBoundingClientRect();
      if (r.width >= 40 && r.height >= 40) {
        canvasIndex = i;
        break;
      }
    }

    return { foundToggle, canvasIndex };
  });

  if (!target.foundToggle) {
    return { motionToggleTested: false, motionFreezeVerified: false };
  }

  const getRootSig = () =>
    page.evaluate(() => {
      const serialize = (el) =>
        Array.from(el.attributes)
          .filter((a) => a.name === 'class' || a.name.startsWith('data-'))
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((a) => `${a.name}=${a.value}`)
          .join(';');
      const btn = document.querySelector('[data-unslop-mqa-toggle="1"]');
      return {
        htmlSig: serialize(document.documentElement),
        bodySig: document.body ? serialize(document.body) : '',
        ariaPressed: btn ? btn.getAttribute('aria-pressed') : null,
      };
    });

  let clicked = false;
  try {
    const btnLoc = page.locator('[data-unslop-mqa-toggle="1"]').first();
    await btnLoc.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
    const before = await getRootSig();

    await btnLoc.click({ timeout: 2500 });
    clicked = true;
    await page.waitForTimeout(180);

    const after = await getRootSig();
    const rootMutated = before.htmlSig !== after.htmlSig || before.bodySig !== after.bodySig;
    const pressedChanged = before.ariaPressed !== after.ariaPressed;

    let canvasFrozen = true;
    if (target.canvasIndex >= 0) {
      const cLoc = page.locator('canvas').nth(target.canvasIndex);
      await cLoc.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(100);
      const frame0 = await sampleCanvasFrame(cLoc);
      await page.waitForTimeout(350);
      const frame1 = await sampleCanvasFrame(cLoc);
      canvasFrozen = frame0 === frame1;
    }

    return {
      motionToggleTested: true,
      motionFreezeVerified: Boolean((rootMutated || pressedChanged) && canvasFrozen),
    };
  } catch {
    return { motionToggleTested: false, motionFreezeVerified: false };
  } finally {
    if (clicked) {
      const btnLoc = page.locator('[data-unslop-mqa-toggle="1"]').first();
      if ((await btnLoc.count().catch(() => 0)) > 0) {
        await btnLoc.click({ timeout: 2000 }).catch(() => {});
      }
      await page.waitForTimeout(120);
    }
    await page
      .evaluate(() => {
        for (const el of document.querySelectorAll('[data-unslop-mqa-toggle]')) {
          el.removeAttribute('data-unslop-mqa-toggle');
        }
      })
      .catch(() => {});
  }
}

async function measureMobileMetrics(page) {
  return page.evaluate(({ viewportWidth, viewportHeight }) => {
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

    const effectiveWidth = Math.min(window.innerWidth || viewportWidth, viewportWidth);
    const overflowPx = Math.max(
      0,
      Math.round(document.documentElement.scrollWidth - effectiveWidth),
    );

    let maxStickyHeaderHeight = 0;
    for (const el of document.querySelectorAll('header, [role="banner"]')) {
      if (isHidden(el)) continue;
      const s = getComputedStyle(el);
      if (s.position === 'fixed' || s.position === 'sticky') {
        const r = el.getBoundingClientRect();
        if (r.height > 0 && r.top <= 48 && r.width >= effectiveWidth * 0.5) {
          maxStickyHeaderHeight = Math.max(maxStickyHeaderHeight, r.height);
        }
      }
    }
    const stickyHeaderRatio = Number((maxStickyHeaderHeight / viewportHeight).toFixed(3));

    let smallTapTargetsCount = 0;
    const seen = new Set();
    const selector = 'button, [role="button"], input:not([type="hidden"]), select, textarea, header a[href], nav a[href], main a[href]';
    for (const el of document.querySelectorAll(selector)) {
      if (seen.has(el)) continue;
      seen.add(el);
      if (isHidden(el)) continue;
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if ((r.width <= 2 && r.height <= 2) || (s.clip && s.clip.includes('0px, 0px, 0px, 0px'))) continue;
      // Skip inline prose text links inside paragraphs or list copy
      if (el.tagName === 'A' && s.display === 'inline' && Boolean(el.closest('p, li'))) continue;
      if (r.width < 44 || r.height < 44) {
        smallTapTargetsCount++;
      }
    }

    return { overflowPx, stickyHeaderRatio, smallTapTargetsCount };
  }, { viewportWidth: MOBILE_VIEWPORT.width, viewportHeight: MOBILE_VIEWPORT.height });
}

async function openContextWithOptionalVideo(browser, baseContextOpts, videoDir, size, recordVideo) {
  if (!recordVideo) {
    const context = await browser.newContext(baseContextOpts);
    const page = await context.newPage();
    return { context, page, videoObj: null, videoFallbackReason: null };
  }

  const contextWithVideo = await browser.newContext({
    ...baseContextOpts,
    recordVideo: { dir: videoDir, size },
  });
  try {
    const page = await contextWithVideo.newPage();
    return { context: contextWithVideo, page, videoObj: page.video(), videoFallbackReason: null };
  } catch (err) {
    await contextWithVideo.close().catch(() => {});
    const msg = String(err?.message || err);
    if (/ffmpeg|video rendering requires/i.test(msg)) {
      const context = await browser.newContext(baseContextOpts);
      const page = await context.newPage();
      return {
        context,
        page,
        videoObj: null,
        videoFallbackReason:
          'Playwright ffmpeg binary not installed; video recording skipped (run: npx playwright install ffmpeg)',
      };
    }
    throw err;
  }
}

/**
 * Record desktop (1280x720) and mobile (390x844) motion QA walkthrough videos,
 * ordered scroll keyframes, rAF frame pacing, interactive probes, and mobile ergonomics.
 */
export async function recordMotionQA(targetUrl, outputDir = './.unslop/audit/motion-qa', options = {}) {
  const { recordVideo = true } = options || {};
  const outDir = await ensureDir(outputDir);
  const recordedAt = new Date().toISOString();

  const browser = await launchBrowser();
  const tmpDesktopVideoDir = recordVideo ? await ensureDir(path.join(outDir, '.tmp-video-desktop')) : null;
  const tmpMobileVideoDir = recordVideo ? await ensureDir(path.join(outDir, '.tmp-video-mobile')) : null;

  try {
    // --- 1. Desktop Walkthrough (1280x720) ---
    const {
      context: desktopContext,
      page: desktopPage,
      videoObj: desktopVideoObj,
      videoFallbackReason: desktopVideoFallback,
    } = await openContextWithOptionalVideo(
      browser,
      { viewport: DESKTOP_VIEWPORT },
      tmpDesktopVideoDir,
      DESKTOP_VIEWPORT,
      recordVideo,
    );
    await desktopPage.addInitScript(() => {
      const origGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, attrs) {
        if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
          return origGetContext.call(this, type, { ...(attrs || {}), preserveDrawingBuffer: true });
        }
        return origGetContext.call(this, type, attrs);
      };
    });

    const nav = await safeNavigate(desktopPage, targetUrl);
    if (nav.blocked) {
      await desktopPage.close().catch(() => {});
      await desktopContext.close().catch(() => {});
      const blockReason = nav.reason || (nav.status ? `HTTP ${nav.status}` : 'Access restricted');
      const blockedReport = {
        passed: false,
        meta: {
          url: targetUrl,
          recordedAt,
          blocked: true,
          blockReason,
        },
        videos: { desktop: null, mobile: null },
        keyframes: { desktop: [], mobile: [] },
        framePacing: { sampleCount: 0, avgFps: 0, longFramesCount: 0, smooth: false },
        interactions: { hoverDeltaDetected: false, motionToggleTested: false, motionFreezeVerified: false },
        mobileErgonomics: { overflowDuringScrollPx: 0, stickyHeaderRatio: 0, smallTapTargetsCount: 0 },
        issues: [`Target URL blocked motion QA: ${blockReason}`],
      };
      await fs.writeFile(path.join(outDir, 'motion-qa-report.json'), JSON.stringify(blockedReport, null, 2));
      return blockedReport;
    }

    const desktopMetrics = await desktopPage.evaluate(() => ({
      scrollHeight: document.documentElement.scrollHeight,
      innerHeight: window.innerHeight || 720,
    }));
    const desktopMaxScroll = Math.max(0, desktopMetrics.scrollHeight - desktopMetrics.innerHeight);

    const desktopKeyframes = [];
    const desktopStops = [0, 0.33, 0.66, 1];
    await startRafMonitor(desktopPage);

    for (let i = 0; i < desktopStops.length; i++) {
      const targetY = Math.round(desktopMaxScroll * desktopStops[i]);
      if (i === 0) {
        await desktopPage.evaluate(() => window.scrollTo(0, 0));
        await desktopPage.waitForTimeout(260);
      } else {
        await smoothScrollTo(desktopPage, targetY, 6, 45);
      }
      await setRafMonitorPaused(desktopPage, true);
      const file = `keyframe-desktop-${String(i + 1).padStart(2, '0')}.png`;
      await desktopPage.screenshot({ path: path.join(outDir, file) });
      desktopKeyframes.push(file);
      await setRafMonitorPaused(desktopPage, false);
    }

    // Collect a short trailing rAF window even on single-screen pages
    await desktopPage.waitForTimeout(240);
    const framePacing = await stopRafMonitor(desktopPage);

    // Return to top for interactive probes
    await desktopPage.evaluate(() => window.scrollTo(0, 0));
    await desktopPage.waitForTimeout(160);

    const hoverDeltaDetected = await probePrimaryHover(desktopPage);
    const { motionToggleTested, motionFreezeVerified } = await probeMotionToggle(desktopPage);

    await desktopPage.close();
    await desktopContext.close();

    const desktopVideoFile = desktopVideoObj
      ? await moveVideoFile(desktopVideoObj, tmpDesktopVideoDir, path.join(outDir, 'desktop-walkthrough.webm'))
      : null;

    // --- 2. Mobile Ergonomics Walkthrough (390x844) ---
    const {
      context: mobileContext,
      page: mobilePage,
      videoObj: mobileVideoObj,
      videoFallbackReason: mobileVideoFallback,
    } = await openContextWithOptionalVideo(
      browser,
      { viewport: MOBILE_VIEWPORT, hasTouch: true },
      tmpMobileVideoDir,
      MOBILE_VIEWPORT,
      recordVideo && !desktopVideoFallback,
    );

    const mobileNav = await safeNavigate(mobilePage, targetUrl);
    if (mobileNav.blocked) {
      await mobilePage.close().catch(() => {});
      await mobileContext.close().catch(() => {});
      const blockReason = mobileNav.reason || (mobileNav.status ? `HTTP ${mobileNav.status}` : 'Access restricted');
      const blockedReport = {
        passed: false,
        meta: {
          url: targetUrl,
          recordedAt,
          blocked: true,
          blockReason,
        },
        videos: { desktop: desktopVideoFile, mobile: null },
        keyframes: { desktop: desktopKeyframes, mobile: [] },
        framePacing,
        interactions: { hoverDeltaDetected, motionToggleTested, motionFreezeVerified },
        mobileErgonomics: { overflowDuringScrollPx: 0, stickyHeaderRatio: 0, smallTapTargetsCount: 0 },
        issues: [`Target URL blocked mobile motion QA: ${blockReason}`],
      };
      await fs.writeFile(path.join(outDir, 'motion-qa-report.json'), JSON.stringify(blockedReport, null, 2));
      return blockedReport;
    }

    const mobileHeightInfo = await mobilePage.evaluate(() => ({
      scrollHeight: document.documentElement.scrollHeight,
      innerHeight: window.innerHeight || 844,
    }));
    const mobileMaxScroll = Math.max(0, mobileHeightInfo.scrollHeight - mobileHeightInfo.innerHeight);

    const mobileKeyframes = [];
    const mobileStops = [0, 0.5, 1];
    let overflowDuringScrollPx = 0;
    let stickyHeaderRatio = 0;
    let smallTapTargetsCount = 0;

    for (let i = 0; i < mobileStops.length; i++) {
      const targetY = Math.round(mobileMaxScroll * mobileStops[i]);
      if (i === 0) {
        await mobilePage.evaluate(() => window.scrollTo(0, 0));
        await mobilePage.waitForTimeout(200);
      } else {
        await smoothScrollTo(mobilePage, targetY, 5, 45);
      }
      const metrics = await measureMobileMetrics(mobilePage);
      overflowDuringScrollPx = Math.max(overflowDuringScrollPx, metrics.overflowPx);
      stickyHeaderRatio = Math.max(stickyHeaderRatio, metrics.stickyHeaderRatio);
      if (i === 0) {
        smallTapTargetsCount = metrics.smallTapTargetsCount;
      } else {
        smallTapTargetsCount = Math.max(smallTapTargetsCount, metrics.smallTapTargetsCount);
      }

      const file = `keyframe-mobile-${String(i + 1).padStart(2, '0')}.png`;
      await mobilePage.screenshot({ path: path.join(outDir, file) });
      mobileKeyframes.push(file);
    }

    await mobilePage.close();
    await mobileContext.close();

    const mobileVideoFile = mobileVideoObj
      ? await moveVideoFile(mobileVideoObj, tmpMobileVideoDir, path.join(outDir, 'mobile-walkthrough.webm'))
      : null;

    // --- 3. Issues & Pass Determination ---
    const issues = [];
    let criticalIssues = 0;

    const videoFallbackMsg = desktopVideoFallback || mobileVideoFallback;
    if (videoFallbackMsg) {
      issues.push(videoFallbackMsg);
    }

    if (overflowDuringScrollPx > 1) {
      criticalIssues++;
      issues.push(`Mobile horizontal overflow during scroll (${overflowDuringScrollPx}px at 390x844)`);
    }
    if (stickyHeaderRatio > 0.18) {
      criticalIssues++;
      issues.push(
        `Excessive mobile sticky header ratio (${(stickyHeaderRatio * 100).toFixed(1)}% of 844px viewport; must be <= 18%)`,
      );
    } else if (stickyHeaderRatio > 0.16) {
      issues.push(
        `Elevated mobile sticky header ratio (${(stickyHeaderRatio * 100).toFixed(1)}% of 844px viewport; target <= 16%)`,
      );
    }
    if (framePacing.sampleCount >= 8 && framePacing.avgFps < 15) {
      criticalIssues++;
      issues.push(`Severe animation/scroll jank detected (${framePacing.avgFps} avg FPS across ${framePacing.sampleCount} frames)`);
    }
    if (smallTapTargetsCount > 0) {
      issues.push(`${smallTapTargetsCount} mobile interactive control(s) smaller than 44x44px`);
    }
    if (motionToggleTested && !motionFreezeVerified) {
      issues.push('Motion toggle clicked, but reduced-motion state mutation or canvas freeze could not be verified');
    }

    const passed = overflowDuringScrollPx <= 1 && criticalIssues === 0;

    const report = {
      passed,
      meta: {
        url: targetUrl,
        recordedAt,
        blocked: false,
      },
      videos: {
        desktop: desktopVideoFile,
        mobile: mobileVideoFile,
      },
      keyframes: {
        desktop: desktopKeyframes,
        mobile: mobileKeyframes,
      },
      framePacing,
      interactions: {
        hoverDeltaDetected,
        motionToggleTested,
        motionFreezeVerified,
      },
      mobileErgonomics: {
        overflowDuringScrollPx,
        stickyHeaderRatio,
        smallTapTargetsCount,
      },
      issues,
    };

    await fs.writeFile(path.join(outDir, 'motion-qa-report.json'), JSON.stringify(report, null, 2));
    return report;
  } finally {
    await browser.close().catch(() => {});
    if (tmpDesktopVideoDir) {
      await fs.rm(tmpDesktopVideoDir, { recursive: true, force: true }).catch(() => {});
    }
    if (tmpMobileVideoDir) {
      await fs.rm(tmpMobileVideoDir, { recursive: true, force: true }).catch(() => {});
    }
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
  const rawArgs = process.argv.slice(2);
  const positional = [];
  let recordVideo = true;

  for (const arg of rawArgs) {
    if (arg === '--no-video' || arg === '--record-video=false') {
      recordVideo = false;
    } else if (!arg.startsWith('--')) {
      positional.push(arg);
    }
  }

  const [targetUrl, outDir = './.unslop/audit/motion-qa'] = positional;
  if (!targetUrl) {
    console.error('Usage: node skills/unslop/scripts/record_motion_qa.mjs <url> [outputDir] [--no-video]');
    process.exit(1);
  }

  const report = await recordMotionQA(targetUrl, outDir, { recordVideo });
  console.log(JSON.stringify(report, null, 2));
  if (!report.passed) {
    process.exitCode = 1;
  }
}
