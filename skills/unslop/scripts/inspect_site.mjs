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

const GENERIC_TW_KEYFRAMES = new Set(['spin', 'ping', 'pulse', 'bounce']);

function stripCssComments(css) {
  return String(css || '').replace(/\/\*[\s\S]*?\*\//g, '');
}

function parseCssMotionFromText(rawCssText, sourceUrl) {
  const cssText = stripCssComments(rawCssText);
  const customKeyframes = [];
  const genericKeyframes = [];
  const scrollTimelines = [];
  const properties = [];
  const cssVars = {};
  const easings = new Set();

  // Extract @keyframes / @-webkit-keyframes blocks (including quoted names) via brace counting
  const kfRegex = /@(?:-(?:webkit|moz)-)?keyframes\s+(?:["']([^"']+)["']|([A-Za-z0-9_-]+))\s*\{/g;
  let match;
  while ((match = kfRegex.exec(cssText)) !== null && customKeyframes.length + genericKeyframes.length < 80) {
    const name = match[1] || match[2];
    let depth = 1;
    let i = kfRegex.lastIndex;
    while (i < cssText.length && depth > 0) {
      if (cssText[i] === '{') depth++;
      else if (cssText[i] === '}') depth--;
      i++;
    }
    const block = cssText.slice(match.index, i).replace(/\s+/g, ' ').trim();
    const entry = { name, source: sourceUrl, cssText: block.slice(0, 600) };
    if (GENERIC_TW_KEYFRAMES.has(name.toLowerCase())) genericKeyframes.push(entry);
    else customKeyframes.push(entry);
  }

  // Extract CSS Scroll-Driven Animation rules cleanly even inside @supports / @media nesting
  const tlPropRegex = /(?:animation-timeline|view-timeline|scroll-timeline|timeline-scope|animation-range)\s*:/g;
  const seenTlSnippets = new Set();
  while ((match = tlPropRegex.exec(cssText)) !== null && scrollTimelines.length < 28) {
    // Walk outward to enclosing rule '{ ... }'
    let openIdx = match.index;
    let depth = 0;
    while (openIdx > 0) {
      if (cssText[openIdx] === '}') depth++;
      else if (cssText[openIdx] === '{') {
        if (depth === 0) break;
        depth--;
      }
      openIdx--;
    }
    let closeIdx = match.index;
    depth = 1;
    while (closeIdx < cssText.length && depth > 0) {
      if (cssText[closeIdx] === '{') depth++;
      else if (cssText[closeIdx] === '}') depth--;
      closeIdx++;
    }
    // Capture selector immediately preceding openIdx
    let selStart = openIdx - 1;
    while (selStart > 0 && !['}', ';', '{'].includes(cssText[selStart])) selStart--;
    const ruleText = cssText.slice(selStart + 1, closeIdx).replace(/\s+/g, ' ').trim().slice(0, 520);
    if (ruleText && !seenTlSnippets.has(ruleText)) {
      seenTlSnippets.add(ruleText);
      scrollTimelines.push({ source: sourceUrl, rule: ruleText });
    }
  }

  const propRegex = /@property\s+(--[A-Za-z0-9_-]+)\s*\{[^}]*\}/g;
  while ((match = propRegex.exec(cssText)) !== null && properties.length < 20) {
    properties.push({
      name: match[1],
      source: sourceUrl,
      rule: match[0].replace(/\s+/g, ' ').trim().slice(0, 300),
    });
  }

  // Fallback :root / [data-theme] custom properties from network-captured CSS (bypasses CORS sheet.cssRules limits)
  const rootVarBlockRegex = /(?::root|html|:host|\[data-theme[^\]]*\])\s*\{([^}]*)\}/g;
  while ((match = rootVarBlockRegex.exec(cssText)) !== null && Object.keys(cssVars).length < 60) {
    const decls = match[1].split(';');
    for (const d of decls) {
      const idx = d.indexOf(':');
      if (idx === -1) continue;
      const prop = d.slice(0, idx).trim();
      const val = d.slice(idx + 1).trim();
      if (
        prop.startsWith('--') &&
        val &&
        val.length <= 80 &&
        /(bg|surface|color|c-|ink|text|accent|brand|font|radius|border|shadow|gap|ease|duration|motion)/i.test(prop)
      ) {
        cssVars[prop] = val;
      }
    }
  }

  const bezierRegex = /cubic-bezier\([^)]+\)/g;
  while ((match = bezierRegex.exec(cssText)) !== null && easings.size < 20) {
    easings.add(match[0].replace(/\s+/g, ''));
  }

  return {
    keyframes: [...customKeyframes, ...genericKeyframes].slice(0, 40),
    scrollTimelines,
    properties,
    cssVars,
    easings: [...easings],
  };
}

async function autoScrollHydrate(page) {
  const { scrollHeight, innerHeight } = await page.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    innerHeight: window.innerHeight || 900,
  }));
  if (scrollHeight > innerHeight * 1.1) {
    const step = Math.max(500, Math.round(innerHeight * 0.8));
    const maxSteps = 18;
    const totalSteps = Math.min(maxSteps, Math.ceil((scrollHeight - innerHeight) / step));
    for (let i = 1; i <= totalSteps; i++) {
      const y = Math.min(scrollHeight - innerHeight, Math.round((scrollHeight - innerHeight) * (i / totalSteps)));
      await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
      await page.waitForTimeout(160);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(260);
  }
}

async function probeHoverStates(page) {
  const candidates = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('main button, main [role="button"], main a[href], header nav a[href], button, a[href]'));
    const seenEls = new Set();
    const picked = [];
    let headerLinks = 0;

    for (const el of els) {
      if (seenEls.has(el)) continue;
      seenEls.add(el);
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      if (
        rect.width < 40 ||
        rect.height < 24 ||
        rect.top < 0 ||
        rect.top > 850 ||
        style.display === 'none' ||
        style.visibility === 'hidden'
      ) {
        continue;
      }
      const inHeader = Boolean(el.closest('header'));
      if (inHeader && el.tagName === 'A' && headerLinks >= 1) continue;

      const isPrimary =
        el.tagName === 'BUTTON' ||
        el.getAttribute('role') === 'button' ||
        parseFloat(style.paddingLeft) >= 12 ||
        style.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
        style.borderTopWidth !== '0px';
      if (!isPrimary) continue;

      if (inHeader && el.tagName === 'A') headerLinks++;
      el.setAttribute('data-unslop-probe', String(picked.length));
      picked.push({
        idx: picked.length,
        tag: el.tagName.toLowerCase(),
        label: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 40),
        before: {
          backgroundColor: style.backgroundColor,
          color: style.color,
          borderColor: style.borderColor,
          transform: style.transform,
          boxShadow: style.boxShadow,
        },
      });
      if (picked.length >= 4) break;
    }
    return picked;
  });

  const deltas = [];
  for (const item of candidates) {
    const loc = page.locator(`[data-unslop-probe="${item.idx}"]`).first();
    try {
      await loc.hover({ timeout: 1500 });
      await page.waitForTimeout(220);
      const after = await loc.evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          backgroundColor: s.backgroundColor,
          color: s.color,
          borderColor: s.borderColor,
          transform: s.transform,
          boxShadow: s.boxShadow,
        };
      });
      const changed = {};
      for (const key of Object.keys(item.before)) {
        if (after[key] !== item.before[key]) {
          changed[key] = { from: item.before[key], to: after[key] };
        }
      }
      if (Object.keys(changed).length > 0) {
        deltas.push({ tag: item.tag, label: item.label, changed });
      }
    } catch {
      // Obscured or animated element; skip gracefully
    }
  }
  await page.mouse.move(0, 0).catch(() => {});
  return deltas;
}

async function probeInteractiveStates(page) {
  const results = [];
  try {
    const candidates = await page.evaluate(() => {
      const DESTRUCTIVE_RE =
        /\b(delete|remove|logout|log\s*out|sign\s*out|checkout|check\s*out|buy|purchase|pay|submit|unsubscribe|deactivate|destroy|erase|reset)\b/i;
      const TRIGGER_LABEL_RE = /\b(menu|search|filter|theme|modal|accordion)\b/i;

      const els = Array.from(
        document.querySelectorAll(
          '[aria-haspopup], [aria-expanded], [role="tab"], button[aria-controls], [role="button"][aria-controls], button, [role="button"]',
        ),
      );
      const seen = new Set();
      const picked = [];

      for (const el of els) {
        if (seen.has(el)) continue;
        seen.add(el);

        // Never click normal navigation links, form submit buttons, disabled/inert, or destructive triggers.
        // Allow progressive-enhancement <a role="tab" href="#..."> and <a role="button"> with ARIA overlay controls.
        const role = (el.getAttribute('role') || '').toLowerCase();
        const rawHref = (el.getAttribute('href') || '').trim();
        const isSafeProgressiveAnchor =
          el.tagName === 'A' &&
          ((role === 'tab' && rawHref.startsWith('#')) ||
            (role === 'button' &&
              (el.hasAttribute('aria-controls') ||
                el.hasAttribute('aria-haspopup') ||
                el.hasAttribute('aria-expanded'))));
        if (el.tagName === 'A' && el.hasAttribute('href') && !isSafeProgressiveAnchor) continue;
        if (el.parentElement?.closest('a[href]')) continue;
        if (el.disabled || el.getAttribute('aria-disabled') === 'true') continue;
        if (el.hasAttribute('inert') || el.getAttribute('aria-hidden') === 'true') continue;
        if (el.closest('[inert], [aria-hidden="true"]')) continue;

        const btnType = (el.getAttribute('type') || '').toLowerCase();
        if (el.tagName === 'INPUT' && (btnType === 'submit' || btnType === 'reset')) continue;
        if (el.tagName === 'BUTTON' && (btnType === 'submit' || (!btnType && el.closest('form')))) continue;

        const style = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        if (
          rect.width < 16 ||
          rect.height < 16 ||
          style.display === 'none' ||
          style.visibility === 'hidden' ||
          parseFloat(style.opacity) < 0.05 ||
          style.pointerEvents === 'none'
        ) {
          continue;
        }

        const label = (
          el.innerText ||
          el.getAttribute('aria-label') ||
          el.getAttribute('title') ||
          ''
        )
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 60);
        const metaText = `${label} ${el.getAttribute('aria-label') || ''} ${el.getAttribute('title') || ''} ${el.id || ''} ${el.getAttribute('name') || ''}`;
        if (DESTRUCTIVE_RE.test(metaText)) continue;

        let triggerType = null;
        if (el.hasAttribute('aria-haspopup')) triggerType = 'haspopup';
        else if (el.hasAttribute('aria-expanded')) triggerType = 'expanded';
        else if (el.getAttribute('role') === 'tab') triggerType = 'tab';
        else if ((el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') && el.hasAttribute('aria-controls')) {
          triggerType = 'aria-controls';
        } else if (
          (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') &&
          TRIGGER_LABEL_RE.test(`${label} ${el.getAttribute('aria-label') || ''} ${el.getAttribute('title') || ''}`)
        ) {
          triggerType = 'label-match';
        }
        if (!triggerType) continue;

        el.setAttribute('data-unslop-click-probe', String(picked.length));
        picked.push({
          idx: picked.length,
          tag: el.tagName.toLowerCase(),
          role: el.getAttribute('role') || null,
          label,
          triggerType,
          ariaControls: el.getAttribute('aria-controls') || null,
        });
        if (picked.length >= 6) break;
      }
      return picked;
    });

    const baseHref = page.url().split('#')[0];

    for (const item of candidates) {
      const loc = page.locator(`[data-unslop-click-probe="${item.idx}"]`).first();
      try {
        const before = await page.evaluate(
          ({ idx, ariaControls }) => {
            const trigger = document.querySelector(`[data-unslop-click-probe="${idx}"]`);
            if (!trigger) return null;

            const isVis = (el) => {
              if (!el || el.hasAttribute('inert') || el.getAttribute('aria-hidden') === 'true') return false;
              if (el.closest('[inert], [aria-hidden="true"]')) return false;
              const s = getComputedStyle(el);
              if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) < 0.05) return false;
              const r = el.getBoundingClientRect();
              return r.width >= 20 && r.height >= 20;
            };

            const collectOverlays = () => {
              const found = new Set();
              const baseSel =
                'dialog[open], [role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], [data-state="open"], [data-radix-popper-content-wrapper], [aria-modal="true"]';
              for (const el of document.querySelectorAll(baseSel)) {
                if (isVis(el)) found.add(el);
              }
              try {
                for (const el of document.querySelectorAll('[popover]:popover-open')) {
                  if (isVis(el)) found.add(el);
                }
              } catch {}
              if (ariaControls) {
                for (const id of ariaControls.split(/\s+/).filter(Boolean)) {
                  const target = document.getElementById(id);
                  if (target && isVis(target)) found.add(target);
                }
              }
              return Array.from(found);
            };

            for (const old of document.querySelectorAll('[data-unslop-pre-overlay="1"], [data-unslop-prev-tab="1"]')) {
              old.removeAttribute('data-unslop-pre-overlay');
              old.removeAttribute('data-unslop-prev-tab');
            }
            const preOverlays = collectOverlays();
            for (const ov of preOverlays) ov.setAttribute('data-unslop-pre-overlay', '1');
            if (trigger.getAttribute('role') === 'tab' && trigger.getAttribute('aria-selected') !== 'true') {
              const tablist = trigger.closest('[role="tablist"]');
              const activeTab = tablist?.querySelector('[role="tab"][aria-selected="true"]');
              if (activeTab && activeTab !== trigger) activeTab.setAttribute('data-unslop-prev-tab', '1');
            }

            const rootEl = document.documentElement;
            const bodyEl = document.body;
            return {
              ariaExpanded: trigger.getAttribute('aria-expanded'),
              ariaSelected: trigger.getAttribute('aria-selected'),
              ariaPressed: trigger.getAttribute('aria-pressed'),
              visibleOverlayCount: preOverlays.length,
              rootClass: rootEl.className || '',
              rootDataTheme: rootEl.getAttribute('data-theme'),
              bodyClass: bodyEl?.className || '',
              bodyDataTheme: bodyEl?.getAttribute('data-theme') || null,
              colorScheme: getComputedStyle(rootEl).colorScheme || '',
            };
          },
          { idx: item.idx, ariaControls: item.ariaControls },
        );

        if (!before) continue;

        await loc.scrollIntoViewIfNeeded({ timeout: 1000 }).catch(() => {});
        await loc.click({ timeout: 1500 });
        await page.waitForTimeout(220);

        // Guard against unexpected JS-driven page navigation
        if (page.url().split('#')[0] !== baseHref) {
          await page.goBack({ waitUntil: 'domcontentloaded', timeout: 3000 }).catch(() => {});
          break;
        }

        const after = await page.evaluate(
          ({ idx, ariaControls }) => {
            const trigger = document.querySelector(`[data-unslop-click-probe="${idx}"]`);
            const isVis = (el) => {
              if (!el || el.hasAttribute('inert') || el.getAttribute('aria-hidden') === 'true') return false;
              if (el.closest('[inert], [aria-hidden="true"]')) return false;
              const s = getComputedStyle(el);
              if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) < 0.05) return false;
              const r = el.getBoundingClientRect();
              return r.width >= 20 && r.height >= 20;
            };

            const collectOverlays = () => {
              const found = new Set();
              if (ariaControls) {
                for (const id of ariaControls.split(/\s+/).filter(Boolean)) {
                  const target = document.getElementById(id);
                  if (target && isVis(target)) found.add(target);
                }
              }
              const baseSel =
                'dialog[open], [role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], [data-state="open"], [data-radix-popper-content-wrapper], [aria-modal="true"]';
              for (const el of document.querySelectorAll(baseSel)) {
                if (isVis(el)) found.add(el);
              }
              try {
                for (const el of document.querySelectorAll('[popover]:popover-open')) {
                  if (isVis(el)) found.add(el);
                }
              } catch {}
              return Array.from(found);
            };

            const postOverlays = collectOverlays();
            const newOverlayEl = postOverlays.find((ov) => ov.getAttribute('data-unslop-pre-overlay') !== '1') || null;
            let openedOverlay = null;
            if (newOverlayEl) {
              const r = newOverlayEl.getBoundingClientRect();
              newOverlayEl.setAttribute('data-unslop-opened-overlay', '1');
              openedOverlay = {
                tag: newOverlayEl.tagName.toLowerCase(),
                role: newOverlayEl.getAttribute('role') || (newOverlayEl.tagName === 'DIALOG' ? 'dialog' : null),
                box: {
                  x: Math.round(r.x),
                  y: Math.round(r.y),
                  width: Math.round(r.width),
                  height: Math.round(r.height),
                },
              };
            }

            const rootEl = document.documentElement;
            const bodyEl = document.body;
            return {
              ariaExpanded: trigger ? trigger.getAttribute('aria-expanded') : null,
              ariaSelected: trigger ? trigger.getAttribute('aria-selected') : null,
              ariaPressed: trigger ? trigger.getAttribute('aria-pressed') : null,
              visibleOverlayCount: postOverlays.length,
              openedOverlay,
              rootClass: rootEl.className || '',
              rootDataTheme: rootEl.getAttribute('data-theme'),
              bodyClass: bodyEl?.className || '',
              bodyDataTheme: bodyEl?.getAttribute('data-theme') || null,
              colorScheme: getComputedStyle(rootEl).colorScheme || '',
            };
          },
          { idx: item.idx, ariaControls: item.ariaControls },
        );

        const ariaChanged =
          after.ariaExpanded !== before.ariaExpanded ||
          after.ariaSelected !== before.ariaSelected ||
          after.ariaPressed !== before.ariaPressed;

        const themeOrRootChanged =
          after.rootClass !== before.rootClass ||
          after.rootDataTheme !== before.rootDataTheme ||
          after.bodyClass !== before.bodyClass ||
          after.bodyDataTheme !== before.bodyDataTheme ||
          after.colorScheme !== before.colorScheme;

        // Clean dismissal / restoration
        let dismissedCleanly = true;
        const needsOverlayDismiss = Boolean(after.openedOverlay) || after.ariaExpanded === 'true';
        if (needsOverlayDismiss) {
          await page.keyboard.press('Escape').catch(() => {});
          await page.waitForTimeout(140);
        }

        const stillOpenOrMutated = await page.evaluate(
          ({ idx, ariaControls, beforeExpanded, beforePressed, beforeRootClass, beforeRootTheme, beforeBodyClass, beforeBodyTheme }) => {
            const trigger = document.querySelector(`[data-unslop-click-probe="${idx}"]`);
            const isVis = (el) => {
              if (!el || el.hasAttribute('inert') || el.getAttribute('aria-hidden') === 'true') return false;
              const s = getComputedStyle(el);
              if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) < 0.05) return false;
              const r = el.getBoundingClientRect();
              return r.width >= 20 && r.height >= 20;
            };
            const openedEl = document.querySelector('[data-unslop-opened-overlay="1"]');
            let overlayStillOpen = Boolean(openedEl && isVis(openedEl));
            if (!overlayStillOpen && ariaControls) {
              for (const id of ariaControls.split(/\s+/).filter(Boolean)) {
                const t = document.getElementById(id);
                if (t && t.getAttribute('data-unslop-pre-overlay') !== '1' && isVis(t)) {
                  overlayStillOpen = true;
                }
              }
            }
            const expandedStillOpen = Boolean(
              trigger && trigger.getAttribute('aria-expanded') === 'true' && beforeExpanded !== 'true',
            );
            const pressedChanged = Boolean(trigger && trigger.getAttribute('aria-pressed') !== beforePressed);
            const rootStillChanged =
              (document.documentElement.className || '') !== beforeRootClass ||
              document.documentElement.getAttribute('data-theme') !== beforeRootTheme ||
              (document.body?.className || '') !== beforeBodyClass ||
              (document.body?.getAttribute('data-theme') || null) !== beforeBodyTheme;
            return { overlayStillOpen, expandedStillOpen, pressedChanged, rootStillChanged };
          },
          {
            idx: item.idx,
            ariaControls: item.ariaControls,
            beforeExpanded: before.ariaExpanded,
            beforePressed: before.ariaPressed,
            beforeRootClass: before.rootClass,
            beforeRootTheme: before.rootDataTheme,
            beforeBodyClass: before.bodyClass,
            beforeBodyTheme: before.bodyDataTheme,
          },
        );

        if (item.role === 'tab') {
          const prevTab = page.locator('[data-unslop-prev-tab="1"]').first();
          try {
            if ((await prevTab.count()) > 0) {
              await prevTab.click({ timeout: 1000 });
              await page.waitForTimeout(120);
            }
          } catch {}
        } else if (
          stillOpenOrMutated.overlayStillOpen ||
          stillOpenOrMutated.expandedStillOpen ||
          stillOpenOrMutated.pressedChanged ||
          stillOpenOrMutated.rootStillChanged
        ) {
          // Try clicking a close button inside the opened overlay first if overlay is still open, else re-click trigger
          let reclicked = false;
          if (stillOpenOrMutated.overlayStillOpen) {
            const closeBtn = page
              .locator(
                '[data-unslop-opened-overlay="1"] button[aria-label*="close" i], [data-unslop-opened-overlay="1"] button[aria-label*="dismiss" i], [data-unslop-opened-overlay="1"] [data-dismiss]',
              )
              .first();
            try {
              if ((await closeBtn.count()) > 0) {
                await closeBtn.click({ timeout: 1000 });
                await page.waitForTimeout(140);
                reclicked = true;
              }
            } catch {}
          }
          if (!reclicked) {
            await loc.click({ timeout: 1200 }).catch(() => {});
            await page.waitForTimeout(140);
          }
        }

        // Verify final dismissal status and clean up temporary overlay markers
        dismissedCleanly = await page.evaluate(
          ({ idx, beforeExpanded }) => {
            const trigger = document.querySelector(`[data-unslop-click-probe="${idx}"]`);
            const openedEl = document.querySelector('[data-unslop-opened-overlay="1"]');
            let stillOpen = false;
            if (openedEl) {
              const s = getComputedStyle(openedEl);
              const r = openedEl.getBoundingClientRect();
              if (
                !openedEl.hasAttribute('inert') &&
                openedEl.getAttribute('aria-hidden') !== 'true' &&
                s.display !== 'none' &&
                s.visibility !== 'hidden' &&
                parseFloat(s.opacity) >= 0.05 &&
                r.width >= 20 &&
                r.height >= 20
              ) {
                stillOpen = true;
              }
            }
            if (trigger && trigger.getAttribute('aria-expanded') === 'true' && beforeExpanded !== 'true') {
              stillOpen = true;
            }
            for (const el of document.querySelectorAll(
              '[data-unslop-pre-overlay="1"], [data-unslop-opened-overlay="1"], [data-unslop-prev-tab="1"]',
            )) {
              el.removeAttribute('data-unslop-pre-overlay');
              el.removeAttribute('data-unslop-opened-overlay');
              el.removeAttribute('data-unslop-prev-tab');
            }
            return !stillOpen;
          },
          { idx: item.idx, beforeExpanded: before.ariaExpanded },
        );

        results.push({
          tag: item.tag,
          role: item.role,
          label: item.label,
          triggerType: item.triggerType,
          before: {
            ariaExpanded: before.ariaExpanded,
            ariaSelected: before.ariaSelected,
            visibleOverlayCount: before.visibleOverlayCount,
            rootClass: before.rootClass,
            rootDataTheme: before.rootDataTheme,
          },
          after: {
            ariaExpanded: after.ariaExpanded,
            ariaSelected: after.ariaSelected,
            visibleOverlayCount: after.visibleOverlayCount,
            rootClass: after.rootClass,
            rootDataTheme: after.rootDataTheme,
          },
          ariaChanged,
          openedOverlay: after.openedOverlay,
          themeOrRootChanged,
          dismissedCleanly,
        });
      } catch {
        // Obscured, detached, or timed-out trigger; clean up markers and continue
        await page
          .evaluate(() => {
            for (const el of document.querySelectorAll(
              '[data-unslop-pre-overlay="1"], [data-unslop-opened-overlay="1"], [data-unslop-prev-tab="1"]',
            )) {
              el.removeAttribute('data-unslop-pre-overlay');
              el.removeAttribute('data-unslop-opened-overlay');
              el.removeAttribute('data-unslop-prev-tab');
            }
          })
          .catch(() => {});
      }
    }

    await page
      .evaluate(() => {
        for (const el of document.querySelectorAll('[data-unslop-click-probe]')) {
          el.removeAttribute('data-unslop-click-probe');
        }
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      })
      .catch(() => {});
  } catch {
    // Non-fatal interactive probing failure
  }
  return results;
}

async function captureEntranceReveals(page) {
  const reveals = [];
  try {
    // Must run at scrollY === 0 BEFORE autoScrollHydrate triggers one-shot IntersectionObservers!
    const plan = await page.evaluate(() => {
      const pool = new Set();
      for (const sel of ['main > *', 'section']) {
        for (const el of document.querySelectorAll(sel)) {
          if (el.tagName === 'HEADER' || el.tagName === 'FOOTER') continue;
          if (el.closest('header, footer')) continue;
          if (el.hasAttribute('inert') || el.getAttribute('aria-hidden') === 'true') continue;
          if (el.closest('[inert], [aria-hidden="true"]')) continue;
          const s = getComputedStyle(el);
          if (s.display === 'none' || s.visibility === 'hidden' || s.position === 'fixed') continue;
          const r = el.getBoundingClientRect();
          const docY = r.top + window.scrollY;
          if (docY <= 750 || r.height < 40 || r.height > 1250 || r.width < 300) continue;
          pool.add(el);
        }
      }

      const arr = Array.from(pool);
      const deduped = arr.filter((el) => {
        const elH = Math.max(1, el.getBoundingClientRect().height);
        const childCands = arr.filter((other) => other !== el && el.contains(other));
        if (childCands.length >= 2 && (el.tagName === 'DIV' || el.tagName === 'MAIN')) return false;
        const parentSingleWrap = arr.some((other) => {
          if (other === el || !other.contains(el)) return false;
          const otherH = Math.max(1, other.getBoundingClientRect().height);
          const otherChildren = arr.filter((c) => c !== other && other.contains(c));
          return otherChildren.length === 1 && elH / otherH >= 0.85;
        });
        return !parentSingleWrap;
      });

      deduped.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
      const picked = deduped.slice(0, 5);

      return picked.map((sec, sIdx) => {
        sec.setAttribute('data-unslop-reveal-sec', String(sIdx));
        const sr = sec.getBoundingClientRect();
        const ss = getComputedStyle(sec);

        const targets = [];
        const seenTargets = new Set();
        const addTarget = (el) => {
          if (!el || seenTargets.has(el) || targets.length >= 16) return;
          if (el.hasAttribute('inert') || el.getAttribute('aria-hidden') === 'true') return;
          if (el.closest('[inert], [aria-hidden="true"]')) return;
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden') return;
          const cr = el.getBoundingClientRect();
          if (cr.width < 10 || cr.height < 10) return;
          seenTargets.add(el);
          const targetId = `${sIdx}-${targets.length}`;
          el.setAttribute('data-unslop-reveal-target', targetId);
          targets.push({
            targetId,
            tag: el.tagName.toLowerCase(),
            textSample: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 48),
            before: {
              opacity: cs.opacity,
              transform: cs.transform,
              filter: cs.filter,
            },
          });
        };

        // Include the section itself if it starts visually recessed for entrance animation
        if (parseFloat(ss.opacity) < 0.99 || ss.transform !== 'none' || ss.filter !== 'none') {
          addTarget(sec);
        }
        for (const el of sec.querySelectorAll(
          'h1, h2, h3, article, figure, li, [class*="card" i], [data-reveal], [data-aos], [data-animate], [style*="opacity"], [style*="transform"]',
        )) {
          addTarget(el);
        }
        if (targets.length < 10) {
          for (const el of sec.querySelectorAll(':scope > div, :scope > div > div, :scope > p')) {
            addTarget(el);
          }
        }

        return {
          revealId: sIdx,
          tag: sec.tagName.toLowerCase(),
          y: Math.round(sr.top + window.scrollY),
          height: Math.round(sr.height),
          targets,
        };
      });
    });

    if (!plan.length) return [];

    // Ordered top-to-bottom scroll pass so each section's entrance reveal is captured freshly
    for (const secPlan of plan) {
      if (!secPlan.targets.length) continue;
      await page.evaluate(
        ({ revealId }) => {
          const el = document.querySelector(`[data-unslop-reveal-sec="${revealId}"]`);
          if (!el) return;
          const r = el.getBoundingClientRect();
          const targetY = Math.max(0, Math.round(r.top + window.scrollY - Math.round((window.innerHeight || 900) * 0.25)));
          window.scrollTo({ top: targetY, left: 0, behavior: 'instant' });
        },
        { revealId: secPlan.revealId },
      );

      await page.waitForTimeout(550);

      const afterMap = await page.evaluate(
        ({ targetIds }) => {
          const out = {};
          for (const id of targetIds) {
            const el = document.querySelector(`[data-unslop-reveal-target="${id}"]`);
            if (!el) continue;
            const cs = getComputedStyle(el);
            out[id] = {
              opacity: cs.opacity,
              transform: cs.transform,
              filter: cs.filter,
            };
          }
          return out;
        },
        { targetIds: secPlan.targets.map((t) => t.targetId) },
      );

      let revealedCount = 0;
      const sampleTransitions = [];
      for (const t of secPlan.targets) {
        const after = afterMap[t.targetId];
        if (!after) continue;
        const opBefore = parseFloat(t.before.opacity);
        const opAfter = parseFloat(after.opacity);
        const opacityChanged =
          Number.isFinite(opBefore) && Number.isFinite(opAfter) && Math.abs(opAfter - opBefore) >= 0.05;
        const transformChanged = t.before.transform !== after.transform;
        const filterChanged = t.before.filter !== after.filter;

        if (opacityChanged || transformChanged || filterChanged) {
          revealedCount++;
          if (sampleTransitions.length < 6) {
            sampleTransitions.push({
              tag: t.tag,
              textSample: t.textSample,
              changedProps: [
                ...(opacityChanged ? ['opacity'] : []),
                ...(transformChanged ? ['transform'] : []),
                ...(filterChanged ? ['filter'] : []),
              ],
              before: {
                opacity: t.before.opacity,
                transform: t.before.transform !== 'none' ? t.before.transform.slice(0, 72) : 'none',
                filter: t.before.filter !== 'none' ? t.before.filter.slice(0, 72) : 'none',
              },
              after: {
                opacity: after.opacity,
                transform: after.transform !== 'none' ? after.transform.slice(0, 72) : 'none',
                filter: after.filter !== 'none' ? after.filter.slice(0, 72) : 'none',
              },
            });
          }
        }
      }

      reveals.push({
        revealId: secPlan.revealId,
        tag: secPlan.tag,
        revealedCount,
        sampleTransitions,
      });
    }

    await page
      .evaluate(() => {
        for (const el of document.querySelectorAll('[data-unslop-reveal-target]')) {
          el.removeAttribute('data-unslop-reveal-target');
        }
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      })
      .catch(() => {});
  } catch {
    // Non-fatal reveal diffing failure
  }
  return reveals;
}

async function analyzeMobileCollapse(page, desktopSectionLayoutMeta) {
  return page.evaluate((desktopMeta) => {
    const mobileDocHeight = Math.round(document.documentElement.scrollHeight);
    const docOverflowPx = Math.max(0, Math.round(document.documentElement.scrollWidth - window.innerWidth));

    // Detect visible mobile header menu/drawer trigger
    const MENU_RE = /(menu|nav|hamburger|drawer|sidebar|bars)/i;
    let headerHasMenuTrigger = false;
    const headerRoots = Array.from(document.querySelectorAll('header, [role="banner"]'));
    const topNavFallback = Array.from(document.querySelectorAll('nav, [role="navigation"]')).filter((nav) => {
      if (nav.closest('header, [role="banner"], footer')) return false;
      const nr = nav.getBoundingClientRect();
      return nr.top < 120 && nr.height >= 24 && nr.height <= 220;
    });
    for (const hdr of [...headerRoots, ...topNavFallback]) {
      for (const el of hdr.querySelectorAll(
        'button, [role="button"], summary, label[for], [aria-controls], [aria-haspopup], [aria-expanded]',
      )) {
        if (el.hasAttribute('inert') || el.getAttribute('aria-hidden') === 'true') continue;
        if (el.closest('[inert], [aria-hidden="true"]')) continue;
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        if (
          s.display === 'none' ||
          s.visibility === 'hidden' ||
          parseFloat(s.opacity) < 0.05 ||
          r.width < 20 ||
          r.height < 20
        ) {
          continue;
        }
        const meta = `${el.innerText || ''} ${el.getAttribute('aria-label') || ''} ${el.getAttribute('title') || ''} ${el.id || ''} ${typeof el.className === 'string' ? el.className : ''}`;
        const hasAriaMenuSignal =
          el.hasAttribute('aria-controls') ||
          el.hasAttribute('aria-expanded') ||
          el.getAttribute('aria-haspopup') === 'menu' ||
          el.getAttribute('aria-haspopup') === 'true';
        const isCompactIconBtn =
          (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') &&
          r.width <= 64 &&
          r.height <= 64 &&
          (el.innerText || '').trim().length === 0 &&
          Boolean(el.querySelector('svg, span, i'));
        if (MENU_RE.test(meta) || hasAriaMenuSignal || isCompactIconBtn) {
          headerHasMenuTrigger = true;
          break;
        }
      }
      if (headerHasMenuTrigger) break;
    }

    let desktopMultiColSectionsCount = 0;
    let mobileSingleColCollapsedCount = 0;
    let stickyTrackCollapsedCount = 0;

    for (const meta of desktopMeta || []) {
      const el = document.querySelector(`[data-unslop-comp="${meta.idx}"]`);
      if (meta.isMultiCol) desktopMultiColSectionsCount++;
      if (!el) continue;

      if (meta.isMultiCol) {
        const directChildren = Array.from(el.children).filter((c) => {
          const cs = getComputedStyle(c);
          return cs.display !== 'none' && c.getBoundingClientRect().height > 16;
        });
        const taggedTarget = el.matches(`[data-unslop-layout-target="${meta.idx}"]`)
          ? el
          : el.querySelector(`[data-unslop-layout-target="${meta.idx}"]`);
        const layoutTarget =
          taggedTarget ||
          (directChildren.length === 1 && (directChildren[0].tagName === 'DIV' || directChildren[0].tagName === 'SECTION')
            ? Array.from(directChildren[0].children).find((c) => {
                const cs = getComputedStyle(c);
                return cs.display === 'grid' || cs.display === 'flex';
              }) || directChildren[0]
            : el);
        const ls = getComputedStyle(layoutTarget);
        const visChildren = Array.from(layoutTarget.children).filter((c) => {
          const cs = getComputedStyle(c);
          const cr = c.getBoundingClientRect();
          return cs.display !== 'none' && cs.visibility !== 'hidden' && cr.height >= 16 && cr.width >= 16;
        });

        let collapsedToSingleCol = false;
        if (ls.display === 'grid' || ls.display === 'inline-grid') {
          const cols =
            ls.gridTemplateColumns && ls.gridTemplateColumns !== 'none'
              ? ls.gridTemplateColumns.split(' ').filter(Boolean).length
              : 1;
          collapsedToSingleCol = cols <= 1;
        } else if (ls.display === 'flex' || ls.display === 'inline-flex') {
          if (ls.flexDirection.startsWith('column')) {
            collapsedToSingleCol = true;
          } else if (visChildren.length >= 2) {
            const rects = visChildren.map((c) => c.getBoundingClientRect()).sort((a, b) => a.top - b.top);
            let allStacked = true;
            for (let i = 1; i < rects.length; i++) {
              if (rects[i].top < rects[i - 1].bottom - 4) {
                allStacked = false;
                break;
              }
            }
            collapsedToSingleCol = allStacked;
          }
        } else {
          collapsedToSingleCol = true;
        }

        if (collapsedToSingleCol) mobileSingleColCollapsedCount++;
      }

      if (meta.isStickyTrack) {
        let mobileHasSticky = false;
        for (const desc of el.querySelectorAll('*')) {
          const ds = getComputedStyle(desc);
          if (ds.display !== 'none' && ds.position === 'sticky') {
            mobileHasSticky = true;
            break;
          }
        }
        const mobileH = Math.round(el.getBoundingClientRect().height);
        if ((meta.hasStickyDescendants && !mobileHasSticky) || (meta.isTallTrack && mobileH < meta.desktopHeight * 0.7)) {
          stickyTrackCollapsedCount++;
        }
      }
    }

    return {
      docOverflowPx,
      collapseSummary: {
        headerHasMenuTrigger,
        desktopMultiColSectionsCount,
        mobileSingleColCollapsedCount,
        stickyTrackCollapsedCount,
        mobileDocHeight,
      },
    };
  }, desktopSectionLayoutMeta);
}

async function captureCdpSnapshotStats(context, page) {
  try {
    const cdp = await context.newCDPSession(page);
    const snap = await cdp.send('DOMSnapshot.captureSnapshot', {
      computedStyles: ['display', 'position', 'z-index', 'background-image', 'backdrop-filter'],
      includePaintOrder: true,
    });
    const doc = snap?.documents?.[0];
    const layoutCount = doc?.layout?.nodeIndex?.length || 0;
    const nodeCount = doc?.nodes?.nodeName?.length || 0;
    await cdp.detach().catch(() => {});
    return { available: true, nodeCount, layoutNodeCount: layoutCount };
  } catch {
    return { available: false, nodeCount: 0, layoutNodeCount: 0 };
  }
}

async function setPinnedChromeHidden(page, excludeAttrValue, hidden) {
  await page.evaluate(
    ({ excludeAttrValue: exVal, hide }) => {
      if (hide) {
        for (const el of document.querySelectorAll('body *')) {
          if (el.getAttribute('data-unslop-comp') === exVal) continue;
          if (el.closest(`[data-unslop-comp="${exVal}"]`)) continue;
          const s = getComputedStyle(el);
          const isTopStickyChrome =
            s.position === 'sticky' &&
            (el.tagName === 'HEADER' || el.tagName === 'NAV' || el.getAttribute('role') === 'banner') &&
            (parseFloat(s.top) <= 24 || s.top === '0px');
          if (s.position === 'fixed' || isTopStickyChrome) {
            el.setAttribute('data-unslop-prev-vis', el.style.visibility || '');
            el.style.visibility = 'hidden';
            el.setAttribute('data-unslop-temp-hidden', '1');
          }
        }
      } else {
        for (const el of document.querySelectorAll('[data-unslop-temp-hidden="1"]')) {
          el.style.visibility = el.getAttribute('data-unslop-prev-vis') || '';
          el.removeAttribute('data-unslop-prev-vis');
          el.removeAttribute('data-unslop-temp-hidden');
        }
      }
    },
    { excludeAttrValue, hide: hidden },
  );
}

export async function inspectSite(url, outputDir) {
  const outDir = await ensureDir(outputDir);
  const componentsDir = await ensureDir(path.join(outDir, 'components'));
  const browser = await launchBrowser();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Layer 2A: Zero-source-map GPU Shader & Uniform Interception (injected before site scripts run)
  await page.addInitScript(() => {
    window.__unslopCapturedShaders = [];
    window.__unslopCapturedUniforms = [];
    const seenUniforms = new Set();
    const patch = (Proto, ctxName) => {
      if (!Proto) return;
      if (Proto.shaderSource) {
        const origShaderSource = Proto.shaderSource;
        Proto.shaderSource = function (shader, source) {
          try {
            const typeVal = this.getShaderParameter ? this.getShaderParameter(shader, this.SHADER_TYPE) : null;
            const shaderType =
              typeVal === this.VERTEX_SHADER ? 'vertex' : typeVal === this.FRAGMENT_SHADER ? 'fragment' : 'unknown';
            window.__unslopCapturedShaders.push({
              context: ctxName,
              type: shaderType,
              length: String(source || '').length,
              source: String(source || ''),
            });
          } catch {}
          return origShaderSource.call(this, shader, source);
        };
      }
      if (Proto.getUniformLocation) {
        const origUniform = Proto.getUniformLocation;
        Proto.getUniformLocation = function (program, name) {
          try {
            const key = `${ctxName}:${name}`;
            if (name && !seenUniforms.has(key) && seenUniforms.size < 80) {
              seenUniforms.add(key);
              window.__unslopCapturedUniforms.push({ context: ctxName, name: String(name) });
            }
          } catch {}
          return origUniform.call(this, program, name);
        };
      }
    };
    patch(window.WebGLRenderingContext?.prototype, 'webgl');
    patch(window.WebGL2RenderingContext?.prototype, 'webgl2');
  });

  // Layer 2B: Network CSS & Font Asset Capture (tracked with Promise.allSettled so no race occurs!)
  const capturedStylesheets = [];
  const pendingCssReads = [];
  const fontAssetUrls = [];
  page.on('response', (res) => {
    const ct = (res.headers()['content-type'] || '').toLowerCase();
    const resUrl = res.url();
    if (res.status() < 400 && (ct.includes('font/') || /\.(woff2?|ttf|otf)(\?|$)/i.test(resUrl))) {
      fontAssetUrls.push(resUrl);
    }
    if (res.status() < 400 && (ct.includes('text/css') || /\.css(\?|$)/i.test(resUrl))) {
      const p = res
        .text()
        .then((text) => {
          if (text && text.length <= 2_500_000) {
            capturedStylesheets.push({ url: resUrl, bytes: text.length, text });
          }
        })
        .catch(() => {});
      pendingCssReads.push(p);
    }
  });

  try {
    const nav = await safeNavigate(page, url);

    if (nav.blocked) {
      await page.screenshot({ path: path.join(outDir, 'blocked-preview.png') }).catch(() => {});
      const blockedReport = {
        meta: {
          url,
          finalUrl: page.url(),
          title: await page.title().catch(() => ''),
          status: nav.status,
          blocked: true,
          blockReason: nav.reason,
          capturedAt: new Date().toISOString(),
        },
        fallbackGuidance:
          'Target blocked automated inspection. Never attempt to bypass anti-bot or login walls. Ask the user for screenshots or inspect an already-authenticated tab via CDP/REA.',
      };
      await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify(blockedReport, null, 2));
      return blockedReport;
    }

    await page.waitForTimeout(550);
    // Capture below-fold viewport-entry entrance reveals BEFORE autoScrollHydrate locks one-shot observers
    const rawEntranceReveals = await captureEntranceReveals(page);
    await autoScrollHydrate(page);
    await Promise.allSettled(pendingCssReads);

    await page.screenshot({ path: path.join(outDir, 'desktop-top.png') });
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    if (scrollHeight > 1200) {
      await page.evaluate((y) => window.scrollTo(0, y), Math.floor(scrollHeight * 0.42));
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(outDir, 'desktop-mid.png') });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(200);
    }
    await page.screenshot({ path: path.join(outDir, 'desktop-full.png'), fullPage: true });

    const cdpSnapshot = await captureCdpSnapshotStats(context, page);

    const domAnalysis = await page.evaluate(() => {
      const isTransparent = (c) => {
        if (!c || c === 'transparent') return true;
        if (/\s*\/\s*0(?:\.0+)?\s*\)/.test(c)) return true;
        const m = c.match(/rgba?\(([^)]+)\)/);
        if (!m) return false;
        const parts = m[1].split(/[\s,/]+/).filter(Boolean).map((x) => parseFloat(x));
        return parts.length === 4 && parts[3] < 0.05;
      };

      // Capped open-Shadow-DOM-aware query helper
      const queryAllDeep = (root, selector, limit = 240) => {
        const out = [];
        const walk = (node) => {
          if (out.length >= limit || !node) return;
          if (node.querySelectorAll) {
            for (const el of node.querySelectorAll(selector)) {
              out.push(el);
              if (out.length >= limit) return;
            }
            for (const host of node.querySelectorAll('*')) {
              if (host.shadowRoot) {
                walk(host.shadowRoot);
                if (out.length >= limit) return;
              }
            }
          }
        };
        walk(root);
        return out;
      };

      const addBucket = (map, key, weight) => {
        if (!key || isTransparent(key) || weight <= 0) return;
        map.set(key, (map.get(key) || 0) + weight);
      };

      const topBuckets = (map, limit = 8, totalArea = 0) =>
        Array.from(map.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, limit)
          .map(([value, area]) => ({
            value,
            areaPx: Math.round(area),
            ...(totalArea > 0 ? { sharePct: Number(((area / totalArea) * 100).toFixed(1)) } : {}),
          }));

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const docHeight = Math.max(document.documentElement.scrollHeight, vh);

      const bgMap = new Map();
      const surfaceMap = new Map();
      const inkMap = new Map();
      const borderMap = new Map();
      const accentMap = new Map();
      const radiusMap = new Map();
      const shadowMap = new Map();
      const maxWidthMap = new Map();
      const transitionMap = new Map();

      const bodyBg = getComputedStyle(document.body).backgroundColor;
      addBucket(bgMap, bodyBg, vw * docHeight * 0.25);

      const allElements = queryAllDeep(document.body, '*', 2200);
      for (const el of allElements) {
        const s = getComputedStyle(el);
        if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) === 0) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        const area = Math.min(r.width * r.height, vw * docHeight);

        const isInteractive =
          el.tagName === 'BUTTON' ||
          el.getAttribute('role') === 'button' ||
          (el.tagName === 'A' && !isTransparent(s.backgroundColor));

        if (!isTransparent(s.backgroundColor)) {
          if (r.width >= vw * 0.55) {
            addBucket(bgMap, s.backgroundColor, area);
          } else if (
            !isInteractive &&
            r.width >= 100 &&
            r.height >= 40 &&
            (s.backgroundColor !== bodyBg || s.boxShadow !== 'none' || parseFloat(s.borderTopWidth) > 0)
          ) {
            addBucket(surfaceMap, s.backgroundColor, area);
          }
        }

        const hasDirectText = Array.from(el.childNodes).some(
          (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0,
        );
        if (hasDirectText) addBucket(inkMap, s.color, area);

        if (parseFloat(s.borderTopWidth) > 0 && s.borderTopStyle !== 'none') {
          addBucket(borderMap, `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}`, 1);
        }

        if (isInteractive) {
          addBucket(accentMap, !isTransparent(s.backgroundColor) ? s.backgroundColor : s.color, Math.max(area, 1200));
        }

        if (s.borderRadius && s.borderRadius !== '0px' && r.width >= 24) addBucket(radiusMap, s.borderRadius, 1);
        if (s.boxShadow && s.boxShadow !== 'none') addBucket(shadowMap, s.boxShadow, 1);
        if (s.maxWidth && s.maxWidth !== 'none' && s.maxWidth.endsWith('px')) {
          const mw = parseFloat(s.maxWidth);
          if (mw >= 640 && mw <= 1600) addBucket(maxWidthMap, s.maxWidth, 1);
        }
        if (s.transitionDuration && s.transitionDuration !== '0s') {
          addBucket(transitionMap, `${s.transitionProperty} | ${s.transitionDuration} | ${s.transitionTimingFunction}`, 1);
        }
      }

      const formatType = (el) => {
        if (!el) return null;
        const s = getComputedStyle(el);
        const fsPx = parseFloat(s.fontSize);
        const lhPx = parseFloat(s.lineHeight);
        return {
          fontFamily: s.fontFamily,
          fontSize: s.fontSize,
          lineHeight: s.lineHeight,
          lineHeightRatio: Number.isFinite(lhPx) && fsPx > 0 ? Number((lhPx / fsPx).toFixed(2)) : null,
          letterSpacing: s.letterSpacing,
          fontWeight: s.fontWeight,
        };
      };

      const readType = (selector) => formatType(document.querySelector(selector));

      const readDominantBodyType = () => {
        let best = null;
        let bestScore = -1;
        for (const el of document.querySelectorAll('main p, article p, section p, p')) {
          const s = getComputedStyle(el);
          if (s.display === 'none' || s.visibility === 'hidden') continue;
          const r = el.getBoundingClientRect();
          const fsPx = parseFloat(s.fontSize);
          const len = (el.innerText || '').trim().length;
          if (r.width < 120 || r.height < 14 || fsPx < 13 || len < 30) continue;
          const score = Math.min(len, 240) * Math.min(r.width, 900);
          if (score > bestScore) {
            bestScore = score;
            best = el;
          }
        }
        return formatType(best || document.querySelector('main p, article p, p, body'));
      };

      const loadedFonts = [];
      const failedFonts = [];
      for (const f of document.fonts || []) {
        const entry = { family: f.family.replace(/["']/g, ''), weight: f.weight, style: f.style, status: f.status };
        if (f.status === 'loaded') loadedFonts.push(entry);
        else if (f.status === 'error') failedFonts.push(entry);
      }

      const fontStylesheetHosts = [];
      for (const link of document.querySelectorAll('link[rel="stylesheet"], link[rel*="font"]')) {
        try {
          const u = new URL(link.href);
          if (!fontStylesheetHosts.includes(u.hostname)) fontStylesheetHosts.push(u.hostname);
        } catch {}
      }

      const inlineCssTexts = [];
      for (const st of document.querySelectorAll('style')) {
        if (st.textContent) inlineCssTexts.push(st.textContent);
      }
      // Include open shadow DOM adoptedStyleSheets when available
      for (const el of allElements) {
        if (el.shadowRoot?.adoptedStyleSheets) {
          for (const sheet of el.shadowRoot.adoptedStyleSheets) {
            try {
              const txt = Array.from(sheet.cssRules || []).map((r) => r.cssText).join('\n');
              if (txt) inlineCssTexts.push(txt);
            } catch {}
          }
        }
      }

      const keyframes = new Set();
      const cssVariables = {};
      const fontFaceSources = {};
      let prefersReducedMotionRules = 0;
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules || []) {
            if (rule.type === CSSRule.KEYFRAMES_RULE) keyframes.add(rule.name);
            if (rule.type === CSSRule.FONT_FACE_RULE && rule.style) {
              const fam = (rule.style.getPropertyValue('font-family') || '').replace(/["']/g, '').trim().toLowerCase();
              const src = rule.style.getPropertyValue('src') || '';
              if (fam) fontFaceSources[fam] = `${fontFaceSources[fam] || ''} ${src}`;
            }
            if (rule.type === CSSRule.MEDIA_RULE && rule.conditionText?.includes('prefers-reduced-motion')) {
              prefersReducedMotionRules++;
            }
            if (rule.type === CSSRule.STYLE_RULE && /:root|html|:host|\[data-theme/.test(rule.selectorText || '') && rule.style) {
              for (let i = 0; i < rule.style.length; i++) {
                const prop = rule.style[i];
                if (prop.startsWith('--') && Object.keys(cssVariables).length < 60) {
                  const val = rule.style.getPropertyValue(prop).trim();
                  if (val && val.length <= 80 && /(bg|surface|color|c-|ink|text|accent|brand|font|radius|border|shadow|gap|ease|duration|motion)/i.test(prop)) {
                    cssVariables[prop] = val;
                  }
                }
              }
            }
          }
        } catch {
          // Cross-origin stylesheet inspected via network response capture instead
        }
      }

      const activeAnimations = (document.getAnimations?.() || []).slice(0, 20).map((a) => ({
        type: a.constructor?.name || 'Animation',
        playState: a.playState,
        animationName: a.animationName || null,
        target: a.effect?.target ? `${a.effect.target.tagName.toLowerCase()}` : null,
        duration: a.effect?.getTiming?.()?.duration ?? null,
        easing: a.effect?.getTiming?.()?.easing ?? null,
      }));

      const scriptSrcs = Array.from(document.querySelectorAll('script[src]')).map((s) => s.src.toLowerCase());
      const varKeys = Object.keys(cssVariables).join(' ');
      const techStack = [];
      if (document.getElementById('__NEXT_DATA__') || scriptSrcs.some((s) => s.includes('/_next/'))) techStack.push('nextjs');
      if (varKeys.includes('--vp-')) techStack.push('vitepress');
      if (varKeys.includes('--tw-') || document.querySelector('[class*="sm:"], [class*="lg:"]')) techStack.push('tailwind');
      if (document.querySelector('[data-framer-appear-id], [data-framer-name]') || scriptSrcs.some((s) => s.includes('framer'))) techStack.push('framer');
      if (document.documentElement.classList.contains('w-mod-js') || scriptSrcs.some((s) => s.includes('webflow'))) techStack.push('webflow');
      if (window.gsap || window.ScrollTrigger || scriptSrcs.some((s) => s.includes('gsap'))) techStack.push('gsap');
      if (document.documentElement.classList.contains('lenis') || window.Lenis) techStack.push('lenis');
      if (document.querySelector('[data-radix-popper-content-wrapper], [data-state]')) techStack.push('radix-or-shadcn');
      if ((window.__unslopCapturedShaders || []).length > 0) techStack.push('webgl-shader');

      const customElements = Array.from(document.querySelectorAll('*'))
        .filter((el) => el.tagName.includes('-'))
        .slice(0, 60)
        .map((el) => {
          const r = el.getBoundingClientRect();
          const dataAttrs = {};
          for (const a of el.attributes) {
            if (a.name.startsWith('data-') || a.name.startsWith('scroll-')) {
              dataAttrs[a.name] = a.value.slice(0, 80);
            }
          }
          return {
            tag: el.tagName.toLowerCase(),
            y: Math.round(r.top + window.scrollY),
            height: Math.round(r.height),
            width: Math.round(r.width),
            dataAttrs,
          };
        });

      const interactiveSurfaces = [];
      for (const el of document.querySelectorAll('[aria-haspopup], [aria-expanded], [aria-controls], [role="tablist"], dialog, [role="dialog"], input[type="search"], button[aria-label*="motion" i], button[aria-label*="search" i]')) {
        if (interactiveSurfaces.length >= 24) break;
        const r = el.getBoundingClientRect();
        interactiveSurfaces.push({
          tag: el.tagName.toLowerCase(),
          role: el.getAttribute('role') || null,
          label: (el.innerText || el.getAttribute('aria-label') || el.getAttribute('placeholder') || '').trim().slice(0, 60),
          ariaHaspopup: el.getAttribute('aria-haspopup'),
          ariaExpanded: el.getAttribute('aria-expanded'),
          ariaControls: el.getAttribute('aria-controls'),
          visible: r.width > 0 && r.height > 0,
        });
      }

      // Layer 1: Component Dissolver with Containment Deduplication
      const candidatePool = new Set();
      for (const sel of ['body > header', 'header', 'main > *', 'section', 'footer']) {
        for (const el of document.querySelectorAll(sel)) {
          if (el.closest('header') && el.tagName !== 'HEADER') continue;
          if (el.closest('footer') && el.tagName !== 'FOOTER') continue;
          if (el.hasAttribute('inert') || el.getAttribute('aria-hidden') === 'true') continue;
          const s = getComputedStyle(el);
          if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) < 0.05) continue;
          if (s.position === 'fixed' && el.tagName !== 'HEADER') continue;
          const r = el.getBoundingClientRect();
          if (r.height < 40 || r.width < 300) continue;
          candidatePool.add(el);
        }
      }
      const h1 = document.querySelector('h1');
      if (h1) {
        let cur = h1.parentElement;
        let heroCandidate = null;
        while (cur && cur !== document.body && cur !== document.documentElement) {
          const r = cur.getBoundingClientRect();
          if (r.width >= 500 && r.height >= 240 && r.height <= 1400) heroCandidate = cur;
          if (cur.tagName === 'SECTION' || cur.tagName === 'MAIN' || cur.tagName.includes('-')) break;
          cur = cur.parentElement;
        }
        if (heroCandidate) candidatePool.add(heroCandidate);
      }

      // Deduplicate wrapper + single nested <section> pairs (keep outer custom element / wrapper; drop multi-section generic containers)
      const candidatesArr = Array.from(candidatePool);
      const dedupedCandidates = candidatesArr.filter((el) => {
        const elH = Math.max(1, el.getBoundingClientRect().height);
        const childCands = candidatesArr.filter((other) => other !== el && el.contains(other));
        if (childCands.length >= 2 && (el.tagName === 'DIV' || el.tagName === 'MAIN')) return false;
        const parentSingleWrap = candidatesArr.some((other) => {
          if (other === el || !other.contains(el)) return false;
          const otherH = Math.max(1, other.getBoundingClientRect().height);
          const otherChildren = candidatesArr.filter((c) => c !== other && other.contains(c));
          return otherChildren.length === 1 && elH / otherH >= 0.85;
        });
        return !parentSingleWrap;
      });

      const describePseudo = (el, pseudo) => {
        const ps = getComputedStyle(el, pseudo);
        if (!ps || ps.content === 'none') return null;
        const bgImg = ps.backgroundImage !== 'none' ? ps.backgroundImage.slice(0, 120) : null;
        const bgColor = !isTransparent(ps.backgroundColor) ? ps.backgroundColor : null;
        const border = parseFloat(ps.borderTopWidth) > 0 ? `${ps.borderTopWidth} ${ps.borderTopColor}` : null;
        if (!bgImg && !bgColor && !border) return null;
        return {
          pseudo,
          position: ps.position,
          backgroundColor: bgColor,
          backgroundImage: bgImg,
          backgroundSize: ps.backgroundSize !== 'auto' ? ps.backgroundSize : null,
          border,
          opacity: ps.opacity !== '1' ? ps.opacity : null,
        };
      };

      const dissolveSubtree = (root) => {
        const backgroundPatterns = [];
        const pseudoEffects = [];
        const interactivePrimitives = [];
        const slots = [];
        const nestedCustomTags = new Set();
        let hasStickyDescendants = false;

        const nodes = [root, ...queryAllDeep(root, '*', 180)];
        for (const node of nodes) {
          if (node.tagName?.includes('-')) nestedCustomTags.add(node.tagName.toLowerCase());
          const ns = getComputedStyle(node);
          if (ns.display === 'none') continue;
          if (ns.position === 'sticky') hasStickyDescendants = true;
          if (ns.backgroundImage && ns.backgroundImage !== 'none' && backgroundPatterns.length < 4) {
            backgroundPatterns.push({
              tag: node.tagName.toLowerCase(),
              backgroundImage: ns.backgroundImage.slice(0, 140),
              backgroundSize: ns.backgroundSize,
            });
          }
          if (ns.backdropFilter && ns.backdropFilter !== 'none' && backgroundPatterns.length < 4) {
            backgroundPatterns.push({ tag: node.tagName.toLowerCase(), backdropFilter: ns.backdropFilter });
          }
          for (const p of ['::before', '::after']) {
            const info = describePseudo(node, p);
            if (info && pseudoEffects.length < 4) {
              pseudoEffects.push({ tag: node.tagName.toLowerCase(), ...info });
            }
          }
          if (
            (node.tagName === 'BUTTON' || node.getAttribute('role') === 'tab' || node.getAttribute('role') === 'button') &&
            interactivePrimitives.length < 6
          ) {
            interactivePrimitives.push({
              tag: node.tagName.toLowerCase(),
              role: node.getAttribute('role') || null,
              borderRadius: ns.borderRadius,
              padding: `${ns.paddingTop} ${ns.paddingLeft}`,
              backgroundColor: ns.backgroundColor,
              border: parseFloat(ns.borderTopWidth) > 0 ? `${ns.borderTopWidth} ${ns.borderTopColor}` : 'none',
              fontSize: ns.fontSize,
            });
          }
        }

        const direct = Array.from(root.children).filter((c) => c.getBoundingClientRect().height > 20);
        const slotContainer =
          direct.length === 1 && (direct[0].tagName === 'DIV' || direct[0].tagName === 'SECTION')
            ? (Array.from(direct[0].children).find((c) => {
                const cs = getComputedStyle(c);
                return cs.display === 'grid' || cs.display === 'flex';
              }) || direct[0])
            : root;

        for (const child of Array.from(slotContainer.children).slice(0, 8)) {
          const cr = child.getBoundingClientRect();
          const cs = getComputedStyle(child);
          if (cr.height < 16 || cs.display === 'none') continue;
          slots.push({
            tag: child.tagName.toLowerCase(),
            widthPx: Math.round(cr.width),
            heightPx: Math.round(cr.height),
            display: cs.display,
            position: cs.position !== 'static' ? cs.position : null,
            backgroundColor: !isTransparent(cs.backgroundColor) ? cs.backgroundColor : null,
            borderRadius: cs.borderRadius !== '0px' ? cs.borderRadius : null,
            border: parseFloat(cs.borderTopWidth) > 0 ? `${cs.borderTopWidth} ${cs.borderTopColor}` : null,
            hasCodeOrTerminal: Boolean(child.querySelector('pre, code')),
            hasGraphic: Boolean(child.querySelector('svg, canvas, img, video')),
          });
        }

        const typographyMix = {
          hasItalicAccentInHeading: Boolean(root.querySelector('h1 em, h1 i, h2 em, h2 i, h1 span[style*="italic"]')),
          hasGradientText: Array.from(root.querySelectorAll('h1, h2, span')).some((el) => {
            const es = getComputedStyle(el);
            return es.webkitBackgroundClip === 'text' || es.backgroundClip === 'text';
          }),
          usesMonospaceLabels: Array.from(root.querySelectorAll('span, code, pre, kbd')).some((el) =>
            getComputedStyle(el).fontFamily.toLowerCase().includes('mono'),
          ),
        };

        return {
          nestedCustomTags: [...nestedCustomTags],
          hasStickyDescendants,
          backgroundPatterns,
          pseudoEffects,
          interactivePrimitives,
          slots,
          typographyMix,
        };
      };

      const rawComponents = [];
      for (const el of dedupedCandidates) {
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        const headings = el.querySelectorAll('h1, h2, h3').length;
        const hasH1 = Boolean(el.querySelector('h1'));
        const buttons = el.querySelectorAll('button, [role="button"], a[class*="btn"], a[class*="cta"]').length;
        const links = el.querySelectorAll('a').length;
        const imgs = el.querySelectorAll('img, picture').length;
        const videos = el.querySelectorAll('video').length;
        const canvases = el.querySelectorAll('canvas').length;
        const mediaCount = imgs + videos + canvases;
        const forms = el.querySelectorAll('form, input, textarea, select').length;
        const tables = el.querySelectorAll('table').length;
        const textLen = (el.innerText || '').trim().length;
        if (headings === 0 && buttons === 0 && links === 0 && mediaCount === 0 && textLen < 8) continue;

        const isMultiColFlexOrGrid = (node) => {
          if (!node) return false;
          const cs = getComputedStyle(node);
          if (cs.display === 'grid' || cs.display === 'inline-grid') {
            const cols =
              cs.gridTemplateColumns && cs.gridTemplateColumns !== 'none'
                ? cs.gridTemplateColumns.split(' ').filter(Boolean).length
                : 0;
            return cols >= 2;
          }
          if ((cs.display === 'flex' || cs.display === 'inline-flex') && cs.flexDirection === 'row') {
            const visKids = Array.from(node.children).filter((c) => {
              const kcs = getComputedStyle(c);
              const kr = c.getBoundingClientRect();
              return kcs.display !== 'none' && kcs.visibility !== 'hidden' && kr.height >= 20 && kr.width >= 20;
            });
            if (visKids.length >= 2) {
              const rects = visKids.map((c) => c.getBoundingClientRect());
              for (let a = 0; a < rects.length; a++) {
                for (let b = a + 1; b < rects.length; b++) {
                  const vertOverlap = Math.min(rects[a].bottom, rects[b].bottom) - Math.max(rects[a].top, rects[b].top);
                  const sideBySide = rects[a].right <= rects[b].left + 12 || rects[b].right <= rects[a].left + 12;
                  if (vertOverlap > 12 && sideBySide) return true;
                }
              }
            }
          }
          return false;
        };

        const directChildren = Array.from(el.children).filter((c) => c.getBoundingClientRect().height > 20);
        const elIsGridOrFlexRow =
          s.display === 'grid' ||
          s.display === 'inline-grid' ||
          ((s.display === 'flex' || s.display === 'inline-flex') && s.flexDirection === 'row');

        let layoutTarget = el;
        if (directChildren.length === 1 && (directChildren[0].tagName === 'DIV' || directChildren[0].tagName === 'SECTION')) {
          const innerKids = Array.from(directChildren[0].children);
          layoutTarget =
            innerKids.find((c) => isMultiColFlexOrGrid(c)) ||
            innerKids.find((c) => {
              const cs = getComputedStyle(c);
              return cs.display === 'grid' || (cs.display === 'flex' && cs.flexDirection === 'row');
            }) ||
            directChildren[0];
        } else if (!elIsGridOrFlexRow) {
          const multiColDirectChild = directChildren.find((c) => isMultiColFlexOrGrid(c));
          if (multiColDirectChild) {
            layoutTarget = multiColDirectChild;
          }
        }
        const ls = getComputedStyle(layoutTarget);
        const layoutChildren = Array.from(layoutTarget.children).filter((c) => c.getBoundingClientRect().height > 20);
        const gridCols = ls.gridTemplateColumns && ls.gridTemplateColumns !== 'none'
          ? ls.gridTemplateColumns.split(' ').filter(Boolean).length
          : 0;
        const isDesktopMultiColTarget = isMultiColFlexOrGrid(layoutTarget);

        const dissolved = dissolveSubtree(el);
        let archetype = 'section';
        const tag = el.tagName.toLowerCase();
        if (tag === 'header') archetype = 'header-nav';
        else if (tag === 'footer') archetype = 'footer';
        else if (hasH1 && (r.top + window.scrollY) < 950) archetype = 'hero';
        else if ((r.height > 1250 && dissolved.hasStickyDescendants) || r.height > 2600) {
          archetype = 'scroll-choreographed-stage';
        }
        else if (tables > 0) archetype = 'data-table';
        else if (forms > 0) archetype = 'form-section';
        else if (gridCols >= 3 || layoutChildren.length >= 3) archetype = 'multi-card-grid';
        else if (gridCols === 2 || (ls.display === 'flex' && ls.flexDirection === 'row' && layoutChildren.length === 2)) archetype = 'split-showcase';

        const headingSample = Array.from(el.querySelectorAll('h1, h2, h3')).slice(0, 3).map((h) => h.textContent.trim().slice(0, 80));

        rawComponents.push({
          el,
          layoutTarget,
          isDesktopMultiColTarget,
          data: {
            tag,
            archetype,
            headingSample,
            box: { x: Math.round(r.x), y: Math.round(r.y + window.scrollY), width: Math.round(r.width), height: Math.round(r.height) },
            layout: {
              display: ls.display,
              flexDirection: ls.flexDirection,
              gridTemplateColumns: ls.gridTemplateColumns,
              gridColumnsCount: gridCols,
              gap: ls.gap,
              paddingTop: s.paddingTop,
              paddingBottom: s.paddingBottom,
              backgroundColor: s.backgroundColor,
              borderBottom: parseFloat(s.borderBottomWidth) > 0 ? `${s.borderBottomWidth} ${s.borderBottomColor}` : 'none',
            },
            anatomy: {
              headings,
              hasH1,
              paragraphs: el.querySelectorAll('p').length,
              buttons,
              links,
              images: imgs,
              videos,
              canvases,
              mediaCount,
              childBlockCount: directChildren.length,
            },
            dissolved,
          },
        });
      }

      rawComponents.sort((a, b) => a.data.box.y - b.data.box.y);
      const pickedComponents = rawComponents.slice(0, 24);
      const revealSectionIndexMap = {};
      const desktopSectionLayoutMeta = [];

      pickedComponents.forEach((item, idx) => {
        item.el.setAttribute('data-unslop-comp', String(idx));
        if (item.layoutTarget) {
          item.layoutTarget.setAttribute('data-unslop-layout-target', String(idx));
        }

        // Map any pre-hydration reveal probe marker to the final section index
        const directRevealId = item.el.getAttribute('data-unslop-reveal-sec');
        if (directRevealId !== null) {
          revealSectionIndexMap[directRevealId] = idx;
        } else {
          const nestedReveal = item.el.querySelector('[data-unslop-reveal-sec]');
          if (nestedReveal) {
            revealSectionIndexMap[nestedReveal.getAttribute('data-unslop-reveal-sec')] = idx;
          } else {
            const ancestorReveal = item.el.closest('[data-unslop-reveal-sec]');
            if (ancestorReveal) {
              revealSectionIndexMap[ancestorReveal.getAttribute('data-unslop-reveal-sec')] = idx;
            }
          }
        }

        const isHeader = item.data.archetype === 'header-nav';
        const isMultiCol = !isHeader && Boolean(item.isDesktopMultiColTarget);

        const isTallTrack = item.data.box.height > 2600;
        const hasStickyDescendants = Boolean(item.data.dissolved?.hasStickyDescendants);
        const isStickyTrack = !isHeader && (item.data.archetype === 'scroll-choreographed-stage' || hasStickyDescendants);

        desktopSectionLayoutMeta.push({
          idx,
          isMultiCol,
          isStickyTrack,
          hasStickyDescendants,
          isTallTrack,
          desktopHeight: item.data.box.height,
        });
      });

      for (const el of document.querySelectorAll('[data-unslop-reveal-sec]')) {
        el.removeAttribute('data-unslop-reveal-sec');
      }

      // Media Aspect-Ratio Inventory (visible <img>, <video>, <canvas> across the page and per section)
      const normalizeAspectRatio = (width, height) => {
        if (!width || !height || width <= 0 || height <= 0) return 'unknown';
        const r = width / height;
        const standard = [
          { label: '16:9', value: 16 / 9 },
          { label: '16:10', value: 16 / 10 },
          { label: '4:3', value: 4 / 3 },
          { label: '1:1', value: 1 },
          { label: '3:4', value: 3 / 4 },
          { label: '9:16', value: 9 / 16 },
        ];
        let bestStd = null;
        let bestDiff = Infinity;
        for (const cand of standard) {
          const diff = Math.abs(r - cand.value) / cand.value;
          if (diff <= 0.055 && diff < bestDiff) {
            bestDiff = diff;
            bestStd = cand.label;
          }
        }
        if (bestStd) return bestStd;
        if (r >= 6) return `${Math.round(r)}:1`;
        if (r <= 1 / 6) return `1:${Math.round(1 / r)}`;
        let bestW = Math.max(1, Math.round(r));
        let bestH = 1;
        let bestErr = Math.abs(r - bestW) / r;
        for (let h = 1; h <= 9; h++) {
          const w = Math.max(1, Math.round(r * h));
          const err = Math.abs(r - w / h) / r;
          if (err < bestErr) {
            bestErr = err;
            bestW = w;
            bestH = h;
          }
          if (bestErr <= 0.035) break;
        }
        const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
        const g = gcd(bestW, bestH);
        return `${bestW / g}:${bestH / g}`;
      };

      const mediaEls = queryAllDeep(document.body, 'img, video, canvas', 160);
      const mediaItems = [];
      const byType = { img: 0, video: 0, canvas: 0 };
      const ratioCountsMap = new Map();
      const sectionMediaMap = new Map();

      for (const el of mediaEls) {
        if (el.closest('[inert]')) continue;
        const ms = getComputedStyle(el);
        if (ms.display === 'none' || ms.visibility === 'hidden' || parseFloat(ms.opacity) < 0.05) continue;
        const mr = el.getBoundingClientRect();
        if (mr.width < 24 || mr.height < 24) continue;

        const tag = el.tagName.toLowerCase();
        const widthPx = Math.round(mr.width);
        const heightPx = Math.round(mr.height);
        const aspectRatio = normalizeAspectRatio(mr.width, mr.height);
        const compHost = el.closest('[data-unslop-comp]');
        const sectionIndex = compHost ? Number(compHost.getAttribute('data-unslop-comp')) : null;
        const sectionArchetype =
          sectionIndex !== null && pickedComponents[sectionIndex] ? pickedComponents[sectionIndex].data.archetype : null;

        if (byType[tag] !== undefined) byType[tag]++;
        ratioCountsMap.set(aspectRatio, (ratioCountsMap.get(aspectRatio) || 0) + 1);

        if (sectionIndex !== null) {
          if (!sectionMediaMap.has(sectionIndex)) {
            sectionMediaMap.set(sectionIndex, {
              sectionIndex,
              archetype: sectionArchetype,
              mediaCount: 0,
              ratios: {},
              slots: [],
            });
          }
          const secEntry = sectionMediaMap.get(sectionIndex);
          secEntry.mediaCount++;
          secEntry.ratios[aspectRatio] = (secEntry.ratios[aspectRatio] || 0) + 1;
          if (secEntry.slots.length < 12) {
            secEntry.slots.push({ tag, aspectRatio, widthPx, heightPx });
          }
        }

        if (mediaItems.length < 40) {
          const entry = {
            tag,
            widthPx,
            heightPx,
            aspectRatio,
            rawRatio: Number((mr.width / mr.height).toFixed(2)),
            objectFit: ms.objectFit && ms.objectFit !== 'fill' ? ms.objectFit : null,
            sectionIndex,
            sectionArchetype,
          };
          if (tag === 'img') {
            entry.naturalWidth = el.naturalWidth || 0;
            entry.naturalHeight = el.naturalHeight || 0;
            const alt = (el.getAttribute('alt') || '').trim().slice(0, 60);
            if (alt) entry.alt = alt;
          }
          mediaItems.push(entry);
        }
      }

      const countsByRatio = Object.fromEntries(Array.from(ratioCountsMap.entries()).sort((a, b) => b[1] - a[1]));
      const mediaInventory = {
        totalCount: byType.img + byType.video + byType.canvas,
        byType,
        countsByRatio,
        bySection: Array.from(sectionMediaMap.values()).sort((a, b) => a.sectionIndex - b.sectionIndex),
        items: mediaItems,
      };

      const canvases = queryAllDeep(document.body, 'canvas', 40);
      const largeCanvases = canvases.filter((c) => {
        const r = c.getBoundingClientRect();
        return r.width * r.height > 20000;
      });
      const videos = document.querySelectorAll('video').length;
      const iframes = document.querySelectorAll('iframe').length;
      const complexSvgs = Array.from(document.querySelectorAll('svg')).filter((svg) => {
        const r = svg.getBoundingClientRect();
        return svg.querySelectorAll('path, circle, rect, polygon, line').length > 25 && r.width > 160;
      }).length;

      const scale = {
        h1: readType('h1'),
        h2: readType('h2'),
        h3: readType('h3'),
        h4: readType('h4'),
        body: readDominantBodyType(),
        small: readType('small, footer'),
        button: readType('button, [role="button"]'),
        code: readType('code, pre'),
      };
      const h1Size = scale.h1 ? parseFloat(scale.h1.fontSize) : null;
      const bodySize = scale.body ? parseFloat(scale.body.fontSize) : null;
      const totalBgSampleArea = Array.from(bgMap.values()).reduce((acc, v) => acc + v, 0);

      return {
        techStack,
        cssVariables,
        fontFaceSources,
        customElements,
        interactiveSurfaces,
        inlineCssTexts,
        activeAnimations,
        capturedShaders: window.__unslopCapturedShaders || [],
        capturedUniforms: window.__unslopCapturedUniforms || [],
        limitations: {
          canvasCount: canvases.length,
          largeCanvasCount: largeCanvases.length,
          videoCount: videos,
          iframeCount: iframes,
          complexSvgCount: complexSvgs,
        },
        colors: {
          backgrounds: topBuckets(bgMap, 6, totalBgSampleArea),
          surfaces: topBuckets(surfaceMap, 6),
          inks: topBuckets(inkMap, 6),
          borders: topBuckets(borderMap, 6),
          accents: topBuckets(accentMap, 6),
        },
        typography: {
          loadedFonts: Array.from(new Map(loadedFonts.map((f) => [`${f.family}:${f.weight}`, f])).values()),
          failedFonts,
          fontStylesheetHosts,
          h1ToBodyRatio: h1Size && bodySize ? Number((h1Size / bodySize).toFixed(2)) : null,
          scale,
        },
        geometry: {
          containerMaxWidths: topBuckets(maxWidthMap, 6).map((x) => x.value),
          borderRadii: topBuckets(radiusMap, 8),
          boxShadows: topBuckets(shadowMap, 6),
        },
        sections: pickedComponents.map((c) => c.data),
        revealSectionIndexMap,
        desktopSectionLayoutMeta,
        mediaInventory,
        motion: {
          keyframes: Array.from(keyframes).slice(0, 30),
          transitions: topBuckets(transitionMap, 10).map((t) => ({ rule: t.value, count: t.areaPx })),
          prefersReducedMotionRules,
        },
      };
    });

    // Layer 3: Component Crops + Generalized Scroll-Filmstrip Scrubbing (only on sticky/tall choreographed tracks!)
    for (let idx = 0; idx < domAnalysis.sections.length; idx++) {
      const sec = domAnalysis.sections[idx];
      const prefix = `${String(idx + 1).padStart(2, '0')}-${sec.archetype}`;
      const attrVal = String(idx);
      const isPinnedHeader = sec.archetype === 'header-nav';
      const isChoreographedTrack = (sec.box.height > 1250 && sec.dissolved?.hasStickyDescendants) || sec.box.height > 2600;

      try {
        if (!isPinnedHeader) await setPinnedChromeHidden(page, attrVal, true);

        if (!isChoreographedTrack) {
          const fileName = `${prefix}.png`;
          await page.locator(`[data-unslop-comp="${idx}"]`).first().screenshot({
            path: path.join(componentsDir, fileName),
            timeout: 4500,
          });
          sec.screenshot = `components/${fileName}`;
          sec.filmstrip = [];
        } else {
          // Re-measure box top/height right before scrubbing to avoid lazy-load drift
          const freshBox = await page.locator(`[data-unslop-comp="${idx}"]`).first().evaluate((el) => {
            const r = el.getBoundingClientRect();
            return { y: Math.round(r.top + window.scrollY), height: Math.round(r.height) };
          });
          const filmstrip = [];
          const scrollSamples = [];
          const ratios = [0.08, 0.36, 0.66, 0.92];
          for (let fIdx = 0; fIdx < ratios.length; fIdx++) {
            const ratio = ratios[fIdx];
            const targetY = Math.max(0, Math.round(freshBox.y + Math.max(0, freshBox.height - 900) * ratio));
            await page.evaluate((y) => window.scrollTo(0, y), targetY);
            await page.waitForTimeout(260);
            const frameName = `${prefix}-t${fIdx}.png`;
            await page.screenshot({ path: path.join(componentsDir, frameName) });
            filmstrip.push(`components/${frameName}`);

            const sample = await page.evaluate(
              ({ compIdx, r }) => {
                const root = document.querySelector(`[data-unslop-comp="${compIdx}"]`);
                if (!root) return null;
                // Generic kinetic descendant picker (works on ANY site — zero site-specific selectors!)
                const picked = [];
                const seen = new Set();
                const pushUnique = (el) => {
                  if (!el || seen.has(el) || picked.length >= 16) return;
                  const cs = getComputedStyle(el);
                  if (cs.display === 'none') return;
                  seen.add(el);
                  picked.push(el);
                };
                for (const el of root.querySelectorAll('*')) {
                  if (picked.length >= 10) break;
                  const cs = getComputedStyle(el);
                  if (el.getAttribute('style') || cs.willChange !== 'auto' || cs.position === 'sticky') {
                    pushUnique(el);
                  }
                }
                for (const el of root.querySelectorAll('article, figure, li, a, button, img, canvas')) {
                  pushUnique(el);
                }
                return {
                  ratio: r,
                  scrollY: Math.round(window.scrollY),
                  states: picked.map((el) => {
                    const cs = getComputedStyle(el);
                    const inlineCustomVars = [];
                    for (let i = 0; i < el.style.length; i++) {
                      const k = el.style[i];
                      if (k.startsWith('--')) inlineCustomVars.push(`${k}:${el.style.getPropertyValue(k).trim()}`);
                    }
                    return {
                      tag: el.tagName.toLowerCase(),
                      transform: cs.transform !== 'none' ? cs.transform.slice(0, 72) : 'none',
                      scale: cs.scale && cs.scale !== 'none' ? cs.scale : null,
                      translate: cs.translate && cs.translate !== 'none' ? cs.translate : null,
                      rotate: cs.rotate && cs.rotate !== 'none' ? cs.rotate : null,
                      opacity: cs.opacity,
                      filter: cs.filter !== 'none' ? cs.filter : 'none',
                      clipPath: cs.clipPath && cs.clipPath !== 'none' ? cs.clipPath : null,
                      borderRadius: cs.borderRadius !== '0px' ? cs.borderRadius : null,
                      customVars: inlineCustomVars.slice(0, 4),
                    };
                  }),
                };
              },
              { compIdx: idx, r: ratio },
            );
            if (sample) scrollSamples.push(sample);
          }

          const serialized = scrollSamples.map((s) => JSON.stringify(s.states));
          const uniqueStates = new Set(serialized).size;
          sec.screenshot = filmstrip[1] || filmstrip[0] || null;
          sec.filmstrip = filmstrip;
          sec.scrollMotion = {
            kineticChangesDetected: uniqueStates > 1,
            uniqueSampleStates: uniqueStates,
            samples: [scrollSamples[0], scrollSamples[scrollSamples.length - 1]].filter(Boolean),
          };
        }
      } catch {
        sec.screenshot = sec.screenshot || null;
        sec.filmstrip = sec.filmstrip || [];
      } finally {
        if (!isPinnedHeader) await setPinnedChromeHidden(page, attrVal, false);
      }
    }

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(150);
    const hoverDeltas = await probeHoverStates(page);
    const interactiveStates = await probeInteractiveStates(page);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }));
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(outDir, 'mobile-top.png') });

    const mobileTelemetry = await analyzeMobileCollapse(page, domAnalysis.desktopSectionLayoutMeta);
    await page
      .evaluate(() => {
        for (const el of document.querySelectorAll('[data-unslop-layout-target]')) {
          el.removeAttribute('data-unslop-layout-target');
        }
      })
      .catch(() => {});
    const mobileDocHeight = mobileTelemetry.collapseSummary.mobileDocHeight;
    const MOBILE_FULL_HEIGHT_CAP = 12000;
    const MOBILE_FALLBACK_CAP = 8000;
    let mobileFullCaptured = false;
    let mobileFullCapped = false;
    try {
      if (mobileDocHeight <= MOBILE_FULL_HEIGHT_CAP) {
        try {
          await page.screenshot({
            path: path.join(outDir, 'mobile-full.png'),
            fullPage: true,
            timeout: 10000,
          });
        } catch {
          mobileFullCapped = true;
          await page.screenshot({
            path: path.join(outDir, 'mobile-full.png'),
            fullPage: true,
            clip: { x: 0, y: 0, width: 390, height: Math.min(mobileDocHeight, MOBILE_FALLBACK_CAP) },
            timeout: 10000,
          });
        }
      } else {
        mobileFullCapped = true;
        try {
          await page.screenshot({
            path: path.join(outDir, 'mobile-full.png'),
            fullPage: true,
            clip: { x: 0, y: 0, width: 390, height: MOBILE_FULL_HEIGHT_CAP },
            timeout: 10000,
          });
        } catch {
          await page.screenshot({
            path: path.join(outDir, 'mobile-full.png'),
            fullPage: true,
            clip: { x: 0, y: 0, width: 390, height: MOBILE_FALLBACK_CAP },
            timeout: 10000,
          });
        }
      }
      mobileFullCaptured = true;
    } catch {
      mobileFullCaptured = false;
    }

    const entranceReveals = rawEntranceReveals.map((r) => {
      const mappedIdx = domAnalysis.revealSectionIndexMap?.[String(r.revealId)];
      return {
        sectionIndex: typeof mappedIdx === 'number' ? mappedIdx : r.revealId,
        tag: r.tag,
        revealedCount: r.revealedCount,
        sampleTransitions: r.sampleTransitions,
      };
    });

    // Merge CSS motion + fallback :root vars parsed from network responses + inline/shadow styles
    const mergedKeyframes = [];
    const mergedTimelines = [];
    const mergedProps = [];
    const mergedEasings = new Set();
    const mergedCssVars = { ...domAnalysis.cssVariables };
    const seenKfNames = new Set();
    const cssSources = [
      ...capturedStylesheets.map((s) => ({ url: s.url, text: s.text })),
      ...domAnalysis.inlineCssTexts.map((text, i) => ({ url: `inline-${i}`, text })),
    ];
    for (const src of cssSources) {
      const parsed = parseCssMotionFromText(src.text, src.url);
      for (const kf of parsed.keyframes) {
        if (!seenKfNames.has(kf.name) && mergedKeyframes.length < 40) {
          seenKfNames.add(kf.name);
          mergedKeyframes.push(kf);
        }
      }
      for (const tl of parsed.scrollTimelines) {
        if (mergedTimelines.length < 28) mergedTimelines.push(tl);
      }
      for (const prop of parsed.properties) {
        if (mergedProps.length < 20) mergedProps.push(prop);
      }
      for (const [k, v] of Object.entries(parsed.cssVars)) {
        if (!mergedCssVars[k] && Object.keys(mergedCssVars).length < 60) mergedCssVars[k] = v;
      }
      for (const e of parsed.easings) mergedEasings.add(e);
    }

    await fs.writeFile(
      path.join(outDir, 'css-motion.json'),
      JSON.stringify(
        {
          stylesheetsCaptured: capturedStylesheets.map((s) => ({ url: s.url, bytes: s.bytes })),
          keyframes: mergedKeyframes,
          scrollTimelines: mergedTimelines,
          properties: mergedProps,
          easings: [...mergedEasings],
          activeAnimations: domAnalysis.activeAnimations,
        },
        null,
        2,
      ),
    );

    await fs.writeFile(
      path.join(outDir, 'shaders.json'),
      JSON.stringify(
        {
          shaders: domAnalysis.capturedShaders,
          uniforms: domAnalysis.capturedUniforms,
        },
        null,
        2,
      ),
    );

    // Per-family commercial font check (prevents one Google Font from masking a self-hosted proprietary font)
    const loadedFamilies = [...new Set(domAnalysis.typography.loadedFonts.map((f) => f.family))];
    const selfHostedCustomFonts = [];
    const commercialFontHints = [];
    const openFontUrlsJoined = fontAssetUrls.filter((u) => OPEN_FONT_HOSTS.some((h) => u.includes(h))).join(' ').toLowerCase();
    for (const fam of loadedFamilies) {
      const low = fam.toLowerCase();
      if (SYSTEM_FONTS.has(low)) continue;
      const faceSrc = (domAnalysis.fontFaceSources?.[low] || '').toLowerCase();
      const loadedFromOpenHost =
        OPEN_FONT_HOSTS.some((h) => faceSrc.includes(h)) ||
        openFontUrlsJoined.includes(low.replace(/\s+/g, ''));
      if (!loadedFromOpenHost) {
        selfHostedCustomFonts.push(fam);
        if (!KNOWN_OPEN_SOURCE_FONTS.has(low)) commercialFontHints.push(fam);
      }
    }

    const limitationNotes = [];
    if (domAnalysis.limitations.largeCanvasCount > 0) {
      limitationNotes.push(
        `Detected ${domAnalysis.limitations.largeCanvasCount} large <canvas> element(s) and intercepted ${domAnalysis.capturedShaders.length} compiled GLSL shader(s) — synthesize an original procedural WebGL2/Canvas2D visual matching the mood & palette (never clone proprietary assets) and wire it to prefers-reduced-motion.`,
      );
    }
    if (domAnalysis.limitations.videoCount > 0) {
      limitationNotes.push(
        `Detected ${domAnalysis.limitations.videoCount} <video> element(s) — replace proprietary footage with user-supplied media or a bespoke procedural Canvas/WebGL ambient motion loop with Play/Pause + reduced-motion poster fallback.`,
      );
    }
    if (domAnalysis.limitations.complexSvgCount > 0) {
      limitationNotes.push(
        `Detected ${domAnalysis.limitations.complexSvgCount} complex multi-path SVG illustration(s) — author original bespoke SVGs or cohesive art-directed visuals instead of copying brand artwork.`,
      );
    }
    if (commercialFontHints.length > 0) {
      limitationNotes.push(
        `Potentially proprietary/custom fonts detected (${commercialFontHints.join(', ')}). Map to curated open-source Google Fonts / Fontshare equivalents in DESIGN.md.`,
      );
    }

    const report = {
      meta: {
        url,
        finalUrl: page.url(),
        title: await page.title().catch(() => ''),
        status: nav.status,
        blocked: false,
        capturedAt: new Date().toISOString(),
        cdpSnapshot,
      },
      techStack: domAnalysis.techStack,
      cssVariables: mergedCssVars,
      customElements: domAnalysis.customElements,
      interactiveSurfaces: domAnalysis.interactiveSurfaces,
      interactiveStates,
      mediaInventory: domAnalysis.mediaInventory,
      mobile: {
        viewport: { width: 390, height: 844 },
        docOverflowPx: mobileTelemetry.docOverflowPx,
        fullScreenshotCapped: mobileFullCapped,
        collapseSummary: mobileTelemetry.collapseSummary,
      },
      gpuShaders: {
        file: domAnalysis.capturedShaders.length > 0 ? 'shaders.json' : null,
        shaderCount: domAnalysis.capturedShaders.length,
        shaders: domAnalysis.capturedShaders.map((s) => ({
          context: s.context,
          type: s.type,
          length: s.length,
        })),
        uniformNames: domAnalysis.capturedUniforms.map((u) => u.name),
      },
      limitations: {
        ...domAnalysis.limitations,
        selfHostedCustomFonts,
        commercialFontHints,
        notes: limitationNotes,
      },
      colors: domAnalysis.colors,
      typography: domAnalysis.typography,
      geometry: domAnalysis.geometry,
      sections: domAnalysis.sections,
      motion: {
        ...domAnalysis.motion,
        cssMotionFile: 'css-motion.json',
        keyframesDetailedCount: mergedKeyframes.length,
        scrollTimelinesCount: mergedTimelines.length,
        scrollTimelines: mergedTimelines.slice(0, 8),
        easings: [...mergedEasings],
        activeAnimationsCount: domAnalysis.activeAnimations.length,
        hoverDeltas,
        entranceReveals,
      },
      screenshots: {
        desktopTop: 'desktop-top.png',
        desktopMid: scrollHeight > 1200 ? 'desktop-mid.png' : null,
        desktopFull: 'desktop-full.png',
        mobileTop: 'mobile-top.png',
        mobileFull: mobileFullCaptured ? 'mobile-full.png' : null,
      },
    };

    await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
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
  const [, , targetUrl, outDir = './inspect-out'] = process.argv;
  if (!targetUrl) {
    console.error('Usage: node skills/unslop/scripts/inspect_site.mjs <url> [outputDir]');
    process.exit(1);
  }
  const report = await inspectSite(targetUrl, outDir);
  console.log(
    JSON.stringify(
      {
        status: report.meta.status,
        blocked: report.meta.blocked,
        cdpSnapshot: report.meta.cdpSnapshot,
        sectionsExtracted: report.sections?.length || 0,
        gpuShadersCaptured: report.gpuShaders?.shaderCount || 0,
        scrollTimelinesCaptured: report.motion?.scrollTimelinesCount || 0,
        interactiveStatesProbed: report.interactiveStates?.length || 0,
        entranceRevealsProbed: report.motion?.entranceReveals?.length || 0,
        mediaItemsCataloged: report.mediaInventory?.totalCount || 0,
        mobileCollapseSummary: report.mobile?.collapseSummary || null,
        componentPngs: report.sections?.filter((s) => s.screenshot).map((s) => s.screenshot) || [],
        filmstripFrames: report.sections?.flatMap((s) => s.filmstrip || []) || [],
        limitations: report.limitations?.notes || [report.meta.blockReason],
        outputDir: path.resolve(outDir),
      },
      null,
      2,
    ),
  );
}
