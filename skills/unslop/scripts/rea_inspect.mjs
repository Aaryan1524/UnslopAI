import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { ensureDir, launchBrowser, safeNavigate } from './browser_helper.mjs';

const execFileAsync = promisify(execFile);
const NPX_BIN = process.platform === 'win32' ? 'npx.cmd' : 'npx';

function isNodeSupportedForRea(versionStr = process.versions.node) {
  const [major, minor, patch] = String(versionStr || '0.0.0').split('.').map((n) => parseInt(n, 10) || 0);
  const gte = (a, b, c) => major > a || (major === a && (minor > b || (minor === b && patch >= c)));
  if (major === 22) return gte(22, 23, 4);
  if (major === 24) return gte(24, 22, 1);
  if (major >= 26) return gte(26, 12, 1);
  return false;
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}

async function runRea(args, { timeout = 150000, maxBuffer = 256 * 1024 * 1024 } = {}) {
  try {
    const { stdout } = await execFileAsync(
      NPX_BIN,
      ['-y', '--offline', 'rea-agents', ...args, '--format', 'json'],
      { maxBuffer, timeout },
    );
    return JSON.parse(stdout);
  } catch {
    const { stdout } = await execFileAsync(
      NPX_BIN,
      ['-y', 'rea-agents@^6.9.0', ...args, '--format', 'json'],
      { maxBuffer, timeout },
    );
    return JSON.parse(stdout);
  }
}

function distillAccessibilityTree(pageEvidence) {
  const nodes = pageEvidence?.normalized_result?.accessibility?.nodes || [];
  const interestingRoles = new Set([
    'banner',
    'navigation',
    'main',
    'contentinfo',
    'heading',
    'button',
    'link',
    'tablist',
    'tab',
    'dialog',
    'search',
    'searchbox',
    'textbox',
    'switch',
  ]);
  const outline = [];
  const roleCounts = {};
  for (const n of nodes) {
    if (n.ignored) continue;
    roleCounts[n.role] = (roleCounts[n.role] || 0) + 1;
    if (interestingRoles.has(n.role) && outline.length < 75) {
      const entry = { role: n.role, name: (n.name || '').trim().slice(0, 80) };
      if (Array.isArray(n.states) && n.states.length > 0) {
        const activeStates = n.states.filter((s) => s.value === true).map((s) => s.name);
        if (activeStates.length > 0) entry.states = activeStates;
      }
      if (entry.name || ['banner', 'navigation', 'main', 'contentinfo', 'tablist', 'dialog'].includes(n.role)) {
        outline.push(entry);
      }
    }
  }
  return { totalNodes: nodes.length, roleCounts, outline };
}

function distillBundleEvidence(bundleEvidence) {
  const nr = bundleEvidence?.normalized_result || {};
  const sources = (nr.route_inventory?.sources || []).map((s) => {
    const url = s.url || '';
    const file = url.split('/').pop() || url;
    return { url, file };
  });
  const dynamicChunks = (nr.observations?.chunks?.edges || [])
    .filter((e) => e.kind === 'dynamic_import')
    .map((e) => e.specifier);

  const inferences = (nr.inferences || [])
    .filter((inf) => inf.kind === 'vendor_fingerprint' || inf.kind === 'bundle_runtime')
    .map((inf) => ({ kind: inf.kind, value: inf.value, confidence: inf.confidence }));

  const detectedEngines = [];
  const joinedFiles = sources.map((s) => s.file.toLowerCase()).concat(dynamicChunks.map((c) => c.toLowerCase())).join(' ');
  if (joinedFiles.includes('rive')) detectedEngines.push('rive-wasm');
  if (joinedFiles.includes('three')) detectedEngines.push('threejs');
  if (joinedFiles.includes('gsap')) detectedEngines.push('gsap');
  if (joinedFiles.includes('lottie')) detectedEngines.push('lottie');
  if (joinedFiles.includes('lenis')) detectedEngines.push('lenis');
  if (joinedFiles.includes('framer')) detectedEngines.push('framer-motion');
  if (joinedFiles.includes('gl') || joinedFiles.includes('shader')) detectedEngines.push('webgl-or-shader-chunk');
  if (joinedFiles.includes('search')) detectedEngines.push('interactive-search-modal');

  const routes = (nr.route_inventory?.routes || []).map((r) => r.path).slice(0, 20);
  const sourceMaps = nr.observations?.source_maps || nr.observations?.chunks?.source_maps || null;
  const sourceMapItems = Array.isArray(sourceMaps?.items)
    ? sourceMaps.items.map((it) => ({
        declaredUrl: it.declared_url || null,
        status: it.status || (it.artifact?.text ? 'included' : 'unavailable'),
        bytes: it.artifact?.bytes || null,
        limitation: it.limitation || null,
      }))
    : [];

  return {
    inferences,
    detectedEngines,
    chunkFiles: sources.map((s) => s.file),
    dynamicImports: [...new Set(dynamicChunks)],
    routes,
    sourceMapsStatus: sourceMaps?.status || 'unavailable',
    sourceMapItems,
  };
}

function normalizeComponentKey(str) {
  return String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function materializePageScopedSources(bundleEvidence, mountedCustomTags, outDir) {
  const nr = bundleEvidence?.normalized_result || {};
  const sourceMaps = nr.observations?.source_maps || nr.observations?.chunks?.source_maps || null;
  const items = Array.isArray(sourceMaps?.items) ? sourceMaps.items : [];
  if (items.length === 0) return { totalSourceMapFiles: 0, materialized: [] };

  const mountedKeys = new Set(mountedCustomTags.map(normalizeComponentKey).filter((k) => k.length >= 4));
  const genericUiMotionNeedles = [
    'lenis', 'gsap', 'motion', 'scroll', 'shader', 'webgl', 'three', 'canvas',
    'bezier', 'tween', 'theme', 'parallax', 'splittext', 'hero', 'header', 'nav', 'modal', 'search',
  ];
  const appComponentPathRe = /\/(components|sections|blocks|pages|app|views|features|shaders)\//i;

  const recoveredDir = await ensureDir(path.join(outDir, 'recovered-src'));
  const materialized = [];
  let totalSourceMapFiles = 0;
  const writtenNames = new Set();

  for (const item of items) {
    if (!item?.artifact?.text) continue;
    let parsed;
    try {
      parsed = JSON.parse(item.artifact.text);
    } catch {
      continue;
    }
    const sources = Array.isArray(parsed.sources) ? parsed.sources : [];
    const contents = Array.isArray(parsed.sourcesContent) ? parsed.sourcesContent : [];
    totalSourceMapFiles += sources.length;

    for (let i = 0; i < sources.length; i++) {
      const srcPath = String(sources[i] || '');
      const content = contents[i];
      if (!content || srcPath.includes('node_modules')) continue;

      const baseName = path.basename(srcPath);
      const stemNorm = normalizeComponentKey(baseName.replace(/\.[a-z0-9]+$/i, ''));
      const lowerBase = baseName.toLowerCase();

      let matchedBy = null;
      if (mountedKeys.size > 0 && mountedKeys.has(stemNorm)) {
        matchedBy = 'mounted-component';
      } else if (mountedKeys.size > 0 && [...mountedKeys].some((k) => k.length >= 6 && (stemNorm.includes(k) || k.includes(stemNorm)))) {
        matchedBy = 'mounted-component-fuzzy';
      } else if (genericUiMotionNeedles.some((needle) => lowerBase.includes(needle))) {
        matchedBy = 'motion-shader-or-chrome-helper';
      } else if (/gl_FragColor|precision\s+(highp|mediump)\s+float|view-timeline|animation-timeline/i.test(content)) {
        matchedBy = 'shader-or-timeline-content';
      } else if (mountedKeys.size === 0 && appComponentPathRe.test(srcPath)) {
        // Framework-agnostic fallback for React/Next.js/Vue/Svelte apps with zero custom elements
        matchedBy = 'app-component-module';
      }

      if (!matchedBy || materialized.length >= 24) continue;
      let safeFile = baseName.replace(/[^A-Za-z0-9._-]/g, '_');
      if (writtenNames.has(safeFile)) {
        safeFile = `${materialized.length + 1}-${safeFile}`;
      }
      writtenNames.add(safeFile);

      await fs.writeFile(path.join(recoveredDir, safeFile), content, 'utf8');
      materialized.push({
        relativeFile: `recovered-src/${safeFile}`,
        originalSource: srcPath,
        chars: content.length,
        matchedBy,
      });
    }
  }

  return { totalSourceMapFiles, materialized };
}

async function scanExportedScriptSignals(exportResult, exportDir) {
  const scripts = Array.isArray(exportResult?.normalized_result?.scripts)
    ? exportResult.normalized_result.scripts
    : [];
  const customElementsDefined = new Set();
  const dynamicImports = new Set();
  const detectedMotionPatterns = new Set();
  let exportedCount = 0;
  let totalExportedBytes = 0;

  for (const s of scripts) {
    if (s?.content?.state !== 'exported' || !s.content?.relative_path) continue;
    const fullPath = path.join(exportDir, 'files', s.content.relative_path);
    try {
      const code = await fs.readFile(fullPath, 'utf8');
      exportedCount++;
      totalExportedBytes += code.length;
      for (const m of code.matchAll(/customElements\.define\([`'"]([^`'"]+)[`'"]/g)) {
        customElementsDefined.add(m[1]);
      }
      for (const m of code.matchAll(/import\([`'"]([^`'"]+)[`'"]\)/g)) {
        dynamicImports.add(m[1]);
      }
      if (/gl_FragColor|precision\s+(?:highp|mediump)\s+float/.test(code)) detectedMotionPatterns.add('embedded-glsl-shader');
      if (/requestAnimationFrame/.test(code)) detectedMotionPatterns.add('raf-loop');
      if (/IntersectionObserver/.test(code)) detectedMotionPatterns.add('intersection-observer');
      if (/ResizeObserver/.test(code)) detectedMotionPatterns.add('resize-observer');
      if (/prefers-reduced-motion/.test(code)) detectedMotionPatterns.add('reduced-motion-listener');
      if (/rotateY\(|translate3d\(|matrix3d\(/.test(code)) detectedMotionPatterns.add('3d-css-transforms');
      if (/ScrollTrigger|gsap\.to|framer-motion|useScroll/.test(code)) detectedMotionPatterns.add('scroll-animation-library');
      if (/Lenis|lenis/.test(code)) detectedMotionPatterns.add('lenis-smooth-scroll');
    } catch {
      // Skip unreadable exported chunk
    }
  }

  return {
    exportedCount,
    totalExportedBytes,
    customElementsDefined: [...customElementsDefined].slice(0, 60),
    dynamicImports: [...dynamicImports].slice(0, 40),
    detectedMotionPatterns: [...detectedMotionPatterns],
  };
}

/**
 * Run REA (rea-agents) deep CDP inspection + source-map / script extraction against a target URL,
 * distilling noisy multi-megabyte outputs into compact UI & motion intelligence (`rea-report.json`
 * plus page-scoped `recovered-src/` files when public source maps are available).
 */
export async function reaInspectSite(targetUrl, outputDir) {
  const outDir = await ensureDir(outputDir);

  if (!isNodeSupportedForRea()) {
    const skipped = {
      meta: {
        url: targetUrl,
        skipped: true,
        reason: `rea-agents requires Node ^22.23.4 || ^24.22.1 || >=26.12.1 (current: ${process.versions.node}). Rely on scripts/inspect_site.mjs black-box extractor instead.`,
        capturedAt: new Date().toISOString(),
      },
    };
    await fs.writeFile(path.join(outDir, 'rea-report.json'), JSON.stringify(skipped, null, 2));
    return skipped;
  }

  const rawDir = await ensureDir(path.join(outDir, 'rea-raw'));
  const port = await getFreePort();
  const cdpEndpoint = `http://127.0.0.1:${port}`;

  const browser = await launchBrowser({
    args: [`--remote-debugging-port=${port}`],
  });

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const nav = await safeNavigate(page, targetUrl);

    if (nav.blocked) {
      const blocked = {
        meta: { url: targetUrl, blocked: true, blockReason: nav.reason, status: nav.status },
      };
      await fs.writeFile(path.join(outDir, 'rea-report.json'), JSON.stringify(blocked, null, 2));
      return blocked;
    }

    const docHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    if (docHeight > 1000) {
      for (const ratio of [0.2, 0.45, 0.7, 0.95]) {
        await page.evaluate((y) => window.scrollTo(0, y), Math.round(docHeight * ratio));
        await page.waitForTimeout(260);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(320);
    }

    const mountedCustomTags = await page.evaluate(() => [
      ...new Set(
        Array.from(document.querySelectorAll('*'))
          .filter((el) => el.tagName.includes('-'))
          .map((el) => el.tagName.toLowerCase()),
      ),
    ]);

    const targets = await runRea(['list-browser-targets', cdpEndpoint]);
    const targetList = targets?.targets || targets?.normalized_result?.targets || targets?.data?.targets || [];
    const origin = new URL(page.url()).origin;
    const pickedTarget =
      targetList.find((t) => (t.url || '').startsWith(origin) && (t.type === 'page' || !t.type)) ||
      targetList[0];

    if (!pickedTarget) {
      throw new Error(`No browser target found from REA list-browser-targets: ${JSON.stringify(targets)}`);
    }

    const targetId = pickedTarget.targetId || pickedTarget.id || pickedTarget.target_id;
    const pageEvidence = await runRea([
      'inspect-web-page',
      cdpEndpoint,
      targetId,
      '--include-accessibility-text',
      '--include-script-sources',
      '--observation-ms',
      '1000',
      '--command-timeout-ms',
      '45000',
    ]);
    const inspectPath = path.join(rawDir, 'inspect-web-page.json');
    await fs.writeFile(inspectPath, JSON.stringify(pageEvidence));

    let exportedScriptSignals = null;
    try {
      const exportDir = path.join(rawDir, 'exported-scripts');
      await fs.rm(exportDir, { recursive: true, force: true });
      const resolvedInspectPath = realpathSync(inspectPath);
      const resolvedExportDir = path.join(realpathSync(rawDir), 'exported-scripts');
      const exportResult = await runRea(['export-web-scripts', resolvedInspectPath, resolvedExportDir]);
      await fs.writeFile(path.join(rawDir, 'export-web-scripts.json'), JSON.stringify(exportResult));
      exportedScriptSignals = await scanExportedScriptSignals(exportResult, resolvedExportDir);
    } catch {
      // Optional script export
    }

    let bundleEvidence;
    try {
      bundleEvidence = await runRea(
        [
          'analyze-web-bundle',
          cdpEndpoint,
          targetId,
          '--fetch-source-maps',
          '--source-map-output-bytes', '536870887',
          '--source-map-fetch-bytes', '536870887',
          '--source-map-decoded-rows', '4000000',
          '--source-map-decoded-segments', '4000000',
          '--source-map-decoded-records', '4000000',
          '--max-heap-mb', '4096',
          '--observation-ms', '1000',
          '--command-timeout-ms', '60000',
          '--analysis-timeout-ms', '90000',
        ],
        { timeout: 180000, maxBuffer: 512 * 1024 * 1024 },
      );
    } catch {
      bundleEvidence = await runRea([
        'analyze-web-bundle',
        cdpEndpoint,
        targetId,
        '--observation-ms',
        '800',
      ]);
    }
    await fs.writeFile(path.join(rawDir, 'analyze-web-bundle.json'), JSON.stringify(bundleEvidence));

    const recoveredSources = await materializePageScopedSources(bundleEvidence, mountedCustomTags, outDir);

    let listenerCheck = null;
    try {
      const primarySelector = await page.evaluate(() => {
        if (document.querySelector('main button, header button')) return 'button';
        if (document.querySelector('[role="button"]')) return '[role="button"]';
        return 'a';
      });
      const listeners = await runRea(['inspect-web-event-listeners', cdpEndpoint, targetId, primarySelector]);
      await fs.writeFile(path.join(rawDir, 'interactive-listeners.json'), JSON.stringify(listeners));
      listenerCheck = {
        selector: primarySelector,
        matched: listeners?.normalized_result?.selected_node?.match === 'found',
        listenerTypes: (listeners?.normalized_result?.listeners || []).map((l) => l.type),
        scriptUrls: [...new Set((listeners?.normalized_result?.listeners || []).map((l) => l.location?.url).filter(Boolean))],
      };
    } catch {
      // Optional
    }

    const distilled = {
      meta: {
        url: targetUrl,
        finalUrl: page.url(),
        targetId,
        cdpEndpoint,
        reaProviderVersion: bundleEvidence?.provider?.version || pageEvidence?.provider?.version || 'unknown',
        nodeVersion: process.versions.node,
        capturedAt: new Date().toISOString(),
      },
      mountedCustomTags,
      accessibility: distillAccessibilityTree(pageEvidence),
      bundleArchitecture: distillBundleEvidence(bundleEvidence),
      exportedScriptSignals,
      recoveredSources,
      interactiveListeners: listenerCheck,
      notes: [
        'REA strips CSS/style strings under data-minimization; always pair with scripts/inspect_site.mjs for colors, typography, CSS scroll-timelines, GPU shaders, and component filmstrips.',
        'When public source maps are recovered, read only the page-scoped files listed under recoveredSources.materialized — never load rea-raw/analyze-web-bundle.json into context.',
      ],
    };

    await fs.writeFile(path.join(outDir, 'rea-report.json'), JSON.stringify(distilled, null, 2));
    return distilled;
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
  const defaultOut = path.join(os.tmpdir(), 'unslop-rea-out');
  const [, , targetUrl, outDir = defaultOut] = process.argv;
  if (!targetUrl) {
    console.error('Usage: node skills/unslop/scripts/rea_inspect.mjs <url> [outputDir]');
    process.exit(1);
  }
  const result = await reaInspectSite(targetUrl, outDir);
  console.log(
    JSON.stringify(
      {
        blocked: Boolean(result.meta?.blocked),
        skipped: Boolean(result.meta?.skipped),
        skipReason: result.meta?.reason || null,
        mountedCustomTags: result.mountedCustomTags || [],
        a11yNodes: result.accessibility?.totalNodes || 0,
        detectedEngines: result.bundleArchitecture?.detectedEngines || [],
        sourceMapsStatus: result.bundleArchitecture?.sourceMapsStatus || 'unavailable',
        recoveredSourceCount: result.recoveredSources?.materialized?.length || 0,
        exportedScriptPatterns: result.exportedScriptSignals?.detectedMotionPatterns || [],
        outputFile: path.join(path.resolve(outDir), 'rea-report.json'),
      },
      null,
      2,
    ),
  );
}
