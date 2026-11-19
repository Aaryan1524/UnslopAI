import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

let cachedChromium = null;

/**
 * Dynamically resolve Playwright across standalone skill installs (~/.claude/skills/unslop,
 * .cursor/skills/unslop, ~/.agents/skills/unslop) and project workspaces (process.cwd()).
 */
async function loadChromium() {
  if (cachedChromium) return cachedChromium;

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const skillDir = path.resolve(__dirname, '..');

  // 1. Standard ESM resolution (works from repo root or when skillDir has node_modules)
  try {
    const pw = await import('playwright');
    if (pw?.chromium) {
      cachedChromium = pw.chromium;
      return cachedChromium;
    }
  } catch {
    // Fall through to workspace/skill createRequire probes
  }

  // 2. Fallback probes: skillDir/package.json, process.cwd()/package.json, and parent workspace
  const probeAnchors = [
    path.join(skillDir, 'package.json'),
    path.join(process.cwd(), 'package.json'),
    path.resolve(skillDir, '../..', 'package.json'),
  ];
  for (const anchor of probeAnchors) {
    try {
      const req = createRequire(anchor);
      const resolved = req.resolve('playwright');
      const pw = await import(pathToFileURL(resolved).href);
      const chromium = pw?.chromium || pw?.default?.chromium;
      if (chromium) {
        cachedChromium = chromium;
        return cachedChromium;
      }
    } catch {
      // Try next anchor
    }
  }

  throw new Error(
    `Could not resolve 'playwright'. Install it either inside the skill folder:\n` +
      `  cd "${skillDir}" && npm install\n` +
      `or inside your current workspace:\n` +
      `  npm install --no-save playwright`,
  );
}

/**
 * Ensure an output directory exists and return its resolved path.
 */
export async function ensureDir(dirPath) {
  const resolved = path.resolve(dirPath);
  await fs.mkdir(resolved, { recursive: true });
  return resolved;
}

/**
 * Launch headless Chromium, falling back to locally installed Google Chrome
 * if Playwright's bundled browser executable is not downloaded yet.
 */
export async function launchBrowser(options = {}) {
  const chromium = await loadChromium();
  const launchOpts = { headless: true, ...options };
  try {
    return await chromium.launch(launchOpts);
  } catch (err) {
    const msg = String(err?.message || err);
    if (
      msg.includes("Executable doesn't exist") ||
      msg.includes('Failed to launch') ||
      msg.includes('browserType.launch')
    ) {
      try {
        return await chromium.launch({ ...launchOpts, channel: 'chrome' });
      } catch (chromeErr) {
        throw new Error(
          `Could not launch Playwright Chromium or system Chrome.\n` +
            `Run: npx playwright install chromium\n` +
            `Original error: ${chromeErr?.message || chromeErr}`,
        );
      }
    }
    throw err;
  }
}

/**
 * Navigate to target URL, wait for fonts/layout settle, and detect access blocks
 * (HTTP 401/403/429/503 or anti-bot/login interstitials) without attempting bypass.
 */
export async function safeNavigate(page, url, timeoutMs = 25000) {
  const response = await page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout: timeoutMs,
  });

  // Give network/JS hydration a bounded window to settle without hanging on long-polling sockets
  try {
    await page.waitForLoadState('networkidle', { timeout: 6000 });
  } catch {
    // Expected on streaming/analytics-heavy sites; continue after short settle
  }
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  await page.waitForTimeout(350);

  const status = response ? response.status() : null;
  const blockInfo = await page.evaluate((httpStatus) => {
    const title = (document.title || '').toLowerCase();
    const bodyText = (document.body?.innerText || '').slice(0, 2500).toLowerCase();
    const headingText = Array.from(document.querySelectorAll('h1, h2')).slice(0, 4).map((h) => h.textContent.toLowerCase()).join(' ');

    const hasTurnstile = Boolean(
      document.querySelector('iframe[src*="challenges.cloudflare.com"], .cf-turnstile, #cf-challenge-running'),
    );
    const hasRecaptcha = Boolean(
      document.querySelector('iframe[src*="recaptcha"], .g-recaptcha, iframe[src*="hcaptcha"]'),
    );
    const looksLikeChallenge =
      title.includes('just a moment') ||
      title.includes('attention required') ||
      title.includes('access denied') ||
      bodyText.includes('verify you are human') ||
      bodyText.includes('checking your browser before accessing') ||
      bodyText.includes('enable javascript and cookies to continue');

    const hasPassword = document.querySelectorAll('input[type="password"]').length > 0;
    const hasAuthCue = /\b(sign in|log in|login|authenticate|sso|enter password)\b/.test(`${title} ${headingText}`);
    const contentSections = document.querySelectorAll('main section, article').length;
    const looksLikeAuthWall =
      (httpStatus === 401 || httpStatus === 403) ||
      (hasPassword && bodyText.length < 700 && (hasAuthCue || contentSections <= 1));

    if (hasTurnstile || hasRecaptcha || looksLikeChallenge) {
      return { blocked: true, reason: 'Anti-bot or CAPTCHA challenge detected' };
    }
    if (httpStatus && [401, 403, 429, 503].includes(httpStatus)) {
      return { blocked: true, reason: `HTTP ${httpStatus} access restriction` };
    }
    if (looksLikeAuthWall) {
      return { blocked: true, reason: 'Login wall detected' };
    }
    return { blocked: false, reason: null };
  }, status);

  return { status, ...blockInfo };
}
