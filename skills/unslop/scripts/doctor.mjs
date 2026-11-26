import fs from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchBrowser } from './browser_helper.mjs';

const REQUIRED_NODE_MIN = [22, 6, 0];
const REQUIRED_NODE_LABEL = '>=22.6.0';
const REA_NODE_LABEL = '^22.23.4 || ^24.22.1 || >=26.12.1';

const REQUIRED_SKILL_FILES = [
  'SKILL.md',
  'package.json',
  'scripts/browser_helper.mjs',
  'scripts/inspect_site.mjs',
  'scripts/audit_ui.mjs',
  'scripts/rea_inspect.mjs',
  'scripts/detect_stack.mjs',
  'scripts/doctor.mjs',
  'references/design-md-template.md',
  'references/components-spec-template.md',
  'references/anti-slop-checklist.md',
  'references/product-discovery-interview.md',
  'references/product-brief-template.md',
  'references/framework-adapters.md',
  'references/inspiration-translation-matrix.md',
  'references/interactive-component-patterns.md',
];

function parseSemver(versionStr = process.versions.node) {
  const [major, minor, patch] = String(versionStr || '0.0.0')
    .replace(/^v/, '')
    .split('.')
    .map((n) => parseInt(n, 10) || 0);
  return { major, minor, patch };
}

function isVersionGte(parsed, [minMajor, minMinor, minPatch]) {
  if (parsed.major !== minMajor) return parsed.major > minMajor;
  if (parsed.minor !== minMinor) return parsed.minor > minMinor;
  return parsed.patch >= minPatch;
}

function isNodeSupportedForRea(versionStr = process.versions.node) {
  const parsed = parseSemver(versionStr);
  if (parsed.major === 22) return isVersionGte(parsed, [22, 23, 4]);
  if (parsed.major === 24) return isVersionGte(parsed, [24, 22, 1]);
  if (parsed.major >= 26) return isVersionGte(parsed, [26, 12, 1]);
  return false;
}

async function resolvePlaywright(skillDir) {
  const probeAnchors = [
    path.join(skillDir, 'package.json'),
    path.join(process.cwd(), 'package.json'),
    path.resolve(skillDir, '../..', 'package.json'),
    fileURLToPath(import.meta.url),
  ];

  for (const anchor of probeAnchors) {
    try {
      const req = createRequire(anchor);
      const resolvedEntry = req.resolve('playwright');
      let version = null;
      try {
        const pkgPath = req.resolve('playwright/package.json');
        const pkgRaw = await fs.readFile(pkgPath, 'utf8');
        version = JSON.parse(pkgRaw).version || null;
      } catch {
        // Version metadata is optional if entry resolved
      }
      return {
        ok: true,
        version,
        resolvedFrom: path.dirname(resolvedEntry),
      };
    } catch {
      // Try next probe anchor
    }
  }

  try {
    const pw = await import('playwright');
    if (pw?.chromium) {
      return {
        ok: true,
        version: null,
        resolvedFrom: 'esm-import',
      };
    }
  } catch {
    // Resolution failed across all probes
  }

  return {
    ok: false,
    version: null,
    resolvedFrom: null,
    error: 'Could not resolve playwright package from skill directory or current workspace.',
  };
}

async function checkSkillFiles(skillDir) {
  const missing = [];
  for (const rel of REQUIRED_SKILL_FILES) {
    try {
      await fs.access(path.join(skillDir, rel));
    } catch {
      missing.push(rel);
    }
  }
  return {
    ok: missing.length === 0,
    skillDir,
    checkedCount: REQUIRED_SKILL_FILES.length,
    missing,
  };
}

/**
 * Verify Node runtime, Playwright resolution, Chromium/Chrome launchability,
 * optional REA Node compatibility, and core skill manifest files.
 */
export async function runDoctor({ launchCheck = true } = {}) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const skillDir = path.resolve(__dirname, '..');
  const remediation = [];

  // 1. Required Node version (>= 22.6.0)
  const currentNode = process.versions.node;
  const nodeOk = isVersionGte(parseSemver(currentNode), REQUIRED_NODE_MIN);
  const nodeCheck = {
    ok: nodeOk,
    current: currentNode,
    required: REQUIRED_NODE_LABEL,
  };
  if (!nodeOk) {
    remediation.push(
      `Upgrade Node.js to ${REQUIRED_NODE_LABEL} (current: v${currentNode}) so verify:types and ESM scripts run cleanly.`,
    );
  }

  // 2. Optional REA compatibility (^22.23.4 || ^24.22.1 || >=26.12.1)
  const reaOk = isNodeSupportedForRea(currentNode);
  const reaOptional = {
    ok: reaOk,
    optional: true,
    current: currentNode,
    required: REA_NODE_LABEL,
    note: reaOk
      ? 'Compatible with optional rea_inspect.mjs white-box bundle enrichment.'
      : 'Optional rea_inspect.mjs enrichment requires a newer Node patch; black-box inspect_site.mjs works normally.',
  };

  // 3. Playwright package resolution
  const playwrightCheck = await resolvePlaywright(skillDir);
  if (!playwrightCheck.ok) {
    remediation.push(
      `Install Playwright inside the skill directory ("cd ${skillDir} && npm install") or current workspace ("npm install --no-save playwright").`,
    );
  }

  // 4. Browser launchability check
  let browserLaunch;
  if (!launchCheck) {
    browserLaunch = {
      ok: true,
      skipped: true,
      reason: 'Skipped (--no-launch)',
    };
  } else if (!playwrightCheck.ok) {
    browserLaunch = {
      ok: false,
      skipped: true,
      reason: 'Skipped because Playwright could not be resolved',
    };
  } else {
    let browser = null;
    try {
      browser = await launchBrowser();
      const browserVersion = typeof browser.version === 'function' ? browser.version() : null;
      browserLaunch = {
        ok: true,
        skipped: false,
        browserVersion,
      };
    } catch (err) {
      browserLaunch = {
        ok: false,
        skipped: false,
        error: String(err?.message || err),
      };
      remediation.push(
        'Install Playwright Chromium ("npx playwright install chromium") or ensure local Google Chrome is available.',
      );
    } finally {
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  }

  // 5. Skill manifest & runtime files presence
  const skillFiles = await checkSkillFiles(skillDir);
  if (!skillFiles.ok) {
    remediation.push(
      `Restore missing skill files under ${skillDir}: ${skillFiles.missing.join(', ')}`,
    );
  }

  const healthy = Boolean(
    nodeCheck.ok &&
      playwrightCheck.ok &&
      (launchCheck ? browserLaunch.ok : true) &&
      skillFiles.ok,
  );

  return {
    healthy,
    checks: {
      node: nodeCheck,
      playwright: playwrightCheck,
      browserLaunch,
      reaOptional,
      skillFiles,
    },
    remediation,
  };
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
  const args = process.argv.slice(2);
  const launchCheck = !args.includes('--no-launch');
  try {
    const report = await runDoctor({ launchCheck });
    console.log(JSON.stringify(report, null, 2));
    if (!report.healthy) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error(String(err?.message || err));
    process.exitCode = 1;
  }
}
