import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspectSite } from './inspect_site.mjs';
import { auditUI, auditMultiRoute } from './audit_ui.mjs';
import { detectStack } from './detect_stack.mjs';
import { runDoctor } from './doctor.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');
const fixturesDir = path.join(repoRoot, 'fixtures');
const outRoot = path.join(os.tmpdir(), 'unslop-verify');

const BLANK_CANVAS_REGRESSION_HTML = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Blank Canvas Test</title>
<style>body{margin:0;background:#241811;color:#fbf7f1;font-family:Georgia,serif} .hero{position:relative;height:600px;display:grid;place-items:center} canvas{position:absolute;inset:0;width:100%;height:100%} h1{position:relative;z-index:2;font-size:48px}</style>
</head>
<body><main><section class="hero"><canvas id="dead-gl" width="600" height="400"></canvas><h1>Text Over Blank Canvas</h1></section></main></body>
</html>`;

const V11_DEFECTS_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>V1.1 Defects Regression Route</title>
  <style>
    :root { --bg:#ffffff; --surface:#f4f0e8; --ink:#171614; }
    :root.dark { --bg:#141312; --surface:#1b1a19; --ink:#242322; }
    body { margin:0; background:var(--bg); color:var(--ink); font-family:Georgia,serif; font-size:16px; }
    header { display:flex; flex-wrap:wrap; gap:12px; padding:16px; }
    a, button { display:inline-flex; align-items:center; min-height:44px; min-width:44px; padding:8px 12px; color:var(--ink); background:var(--bg); border:1px solid #666; }
    a:focus-visible, button:focus-visible { outline:2px solid #111; }
    main { padding:20px; }
    section { min-height:520px; background:var(--surface); padding:24px; }
    h1 { font-size:40px; margin:0 0 12px; }
    #cls-banner { height:0; background:#ece8df; }
    img { max-width:100%; height:auto; display:block; }
  </style>
</head>
<body>
  <header>
    <a href="#missing">Broken Section Link</a>
    <a href="#">Dead Placeholder Link</a>
    <button type="button" aria-label="Toggle dark mode" data-theme-toggle>Theme</button>
  </header>
  <main>
    <div id="cls-banner"></div>
    <section>
      <h1>Primary Heading</h1>
      <h3>Skipped H2 Heading</h3>
      <p>Verifies elevated CLS, oversized image response detection, semantic link/heading hygiene, and alternate-theme contrast checks.</p>
      <img src="/__oversized-520kb.bmp" alt="Oversized uncompressed bitmap fixture" width="240" height="180" />
    </section>
  </main>
  <footer><p>Defects Regression Footer</p></footer>
  <script>
    setTimeout(() => {
      document.getElementById('cls-banner').style.height = '450px';
    }, 120);
    document.querySelector('[data-theme-toggle]').addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
    });
  </script>
</body>
</html>`;

function createOversizedBmpBuffer(width = 450, height = 400) {
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;
  const buf = Buffer.alloc(fileSize);
  buf.write('BM', 0, 2, 'ascii');
  buf.writeUInt32LE(fileSize, 2);
  buf.writeUInt32LE(54, 10);
  buf.writeUInt32LE(40, 14);
  buf.writeInt32LE(width, 18);
  buf.writeInt32LE(height, 22);
  buf.writeUInt16LE(1, 26);
  buf.writeUInt16LE(24, 28);
  buf.writeUInt32LE(pixelArraySize, 34);
  buf.fill(0x7c, 54);
  return buf;
}

const OVERSIZED_BMP = createOversizedBmpBuffer();

function startStaticServer(rootDir) {
  return new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      const reqPath = (req.url || '/').split('?')[0].replace(/^\/+/, '');
      if (reqPath === '__blank-canvas-regression.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(BLANK_CANVAS_REGRESSION_HTML);
        return;
      }
      if (reqPath === '__v11-defects.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(V11_DEFECTS_HTML);
        return;
      }
      if (reqPath === '__oversized-520kb.bmp') {
        res.writeHead(200, {
          'Content-Type': 'image/bmp',
          'Content-Length': String(OVERSIZED_BMP.length),
        });
        res.end(OVERSIZED_BMP);
        return;
      }
      if (reqPath === '' || reqPath === 'secondary' || reqPath === '__secondary-mismatched') {
        try {
          let html = await fs.readFile(path.join(rootDir, 'sample-v11-interactive.html'), 'utf8');
          if (reqPath === 'secondary') {
            html = html
              .replace('<title>Meridian Field — Interactive Craft Verification Fixture</title>', '<title>Meridian Field — Specifications</title>')
              .replace('<h1>Measured craft across static and kinetic states.</h1>', '<h1>Detailed layout and motion specifications.</h1>');
          } else if (reqPath === '__secondary-mismatched') {
            html = html
              .replace('<a href="/secondary">Specifications</a>', '<a href="/archive">Archive</a>');
          }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(html);
          return;
        } catch {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
      }
      const filePath = path.join(rootDir, reqPath || 'sample-clean-reference.html');
      try {
        const data = await fs.readFile(filePath);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(data);
      } catch {
        res.writeHead(404);
        res.end('Not found');
      }
    });
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${addr.port}` });
    });
  });
}

await fs.rm(outRoot, { recursive: true, force: true });
const { server, baseUrl } = await startStaticServer(fixturesDir);

try {
  console.log('1) Inspecting clean reference fixture...');
  const inspectReport = await inspectSite(
    `${baseUrl}/sample-clean-reference.html`,
    path.join(outRoot, 'inspect-clean'),
  );
  assert.equal(inspectReport.meta.blocked, false, 'Reference fixture should not be blocked');
  assert.equal(inspectReport.meta.cdpSnapshot?.available, true, 'Expected CDP DOMSnapshot telemetry');
  assert.ok(inspectReport.sections.length >= 3, `Expected >= 3 sections, got ${inspectReport.sections.length}`);
  assert.ok(
    inspectReport.sections.some((s) => s.archetype === 'multi-card-grid' && s.layout.gridColumnsCount === 3),
    'Expected 3-column multi-card-grid section dissection',
  );
  const componentPngs = inspectReport.sections.filter((s) => s.screenshot);
  assert.ok(componentPngs.length >= 3, `Expected >= 3 cropped component PNGs, got ${componentPngs.length}`);
  for (const s of componentPngs) {
    await fs.access(path.join(outRoot, 'inspect-clean', s.screenshot));
  }
  assert.ok(inspectReport.sections.every((s) => s.dissolved && Array.isArray(s.dissolved.slots)), 'Expected dissolved slots per section');
  assert.ok(inspectReport.colors.backgrounds.length >= 1, 'Expected extracted background colors');
  assert.ok(inspectReport.typography.h1ToBodyRatio >= 2.0, `Expected h1/body >= 2.0, got ${inspectReport.typography.h1ToBodyRatio}`);
  assert.ok(inspectReport.motion.hoverDeltas.length >= 1, 'Expected at least 1 probed hover delta');

  console.log('2) Auditing slop fixture (expecting planted defect detection)...');
  const slopAudit = await auditUI(
    `${baseUrl}/sample-slop-page.html`,
    path.join(outRoot, 'audit-slop'),
  );
  assert.equal(slopAudit.summary.passed, false, 'Slop fixture must fail audit');
  assert.ok(slopAudit.mediaAndFonts.brokenImages.length >= 1, 'Must detect broken image');
  assert.ok(slopAudit.layout.overflow.mobile.docOverflowPx > 1, 'Must detect mobile overflow');
  assert.ok(slopAudit.accessibility.contrastFailures.length >= 1, 'Must detect WCAG contrast failures');
  assert.ok(slopAudit.accessibility.unnamedControls.length >= 1, 'Must detect unnamed control');
  assert.ok(slopAudit.antiSlop.placeholderCopyMatches.includes('lorem ipsum'), 'Must detect placeholder copy');
  assert.ok(slopAudit.antiSlop.purpleIndigoGradientCount >= 1, 'Must detect generic purple/indigo gradient');

  console.log('3) Auditing clean reference fixture (expecting zero critical errors)...');
  const cleanAudit = await auditUI(
    `${baseUrl}/sample-clean-reference.html`,
    path.join(outRoot, 'audit-clean'),
  );
  assert.equal(
    cleanAudit.summary.passed,
    true,
    `Clean fixture failed unexpectedly: ${JSON.stringify(cleanAudit.summary, null, 2)}`,
  );
  assert.ok(cleanAudit.screenshots.sections.length >= 3, 'Expected cropped audit section PNGs');

  console.log('4) Verifying v3.5 GPU shader hook, deduplication, inert filtering & kinetic audit...');
  const kineticInspect = await inspectSite(
    `${baseUrl}/sample-kinetic-reference.html`,
    path.join(outRoot, 'inspect-kinetic'),
  );
  assert.ok(kineticInspect.gpuShaders.shaderCount >= 2, `Expected >= 2 intercepted GLSL shaders, got ${kineticInspect.gpuShaders.shaderCount}`);
  assert.ok(kineticInspect.gpuShaders.uniformNames.includes('uTime'), 'Expected intercepted uniform uTime');
  assert.ok(kineticInspect.motion.scrollTimelinesCount >= 1, 'Expected CSS view-timeline extraction');
  // Deduplication check: header + kinetic-hero + kinetic-track + footer === 4 (NOT duplicated with inner <section>s!)
  assert.equal(kineticInspect.sections.length, 4, `Expected exactly 4 deduplicated sections, got ${kineticInspect.sections.length}`);
  const tallSec = kineticInspect.sections.find((s) => s.filmstrip && s.filmstrip.length === 4);
  assert.ok(tallSec, 'Expected 4-frame scroll filmstrip on tall sticky section');
  assert.equal(tallSec.scrollMotion?.kineticChangesDetected, true, 'Expected kinetic scroll transform detection');

  const kineticAudit = await auditUI(
    `${baseUrl}/sample-kinetic-reference.html`,
    path.join(outRoot, 'audit-kinetic'),
  );
  assert.equal(
    kineticAudit.summary.passed,
    true,
    `Kinetic fixture failed unexpectedly: ${JSON.stringify(kineticAudit.summary, null, 2)}`,
  );
  assert.equal(kineticAudit.accessibility.unnamedControls.length, 0, 'Hidden inert drawer button must not trigger unnamedControls');
  assert.equal(kineticAudit.accessibility.smallTapTargets.length, 0, 'Hidden inert drawer button must not trigger smallTapTargets');
  assert.equal(kineticAudit.kinetic.scrollMotionChecks.length, 1, 'Deduplicated audit must produce exactly 1 scrollMotionCheck');
  assert.ok(kineticAudit.kinetic.canvasChecks.length >= 1, 'Expected WebGL canvas check');
  assert.equal(kineticAudit.kinetic.canvasChecks[0].method, 'raw-canvas', 'Expected raw uncontaminated canvas sampling');
  assert.equal(kineticAudit.kinetic.canvasChecks[0].isBlank, false, 'WebGL canvas must render non-blank pixels');
  assert.equal(kineticAudit.kinetic.canvasChecks[0].animatesOverTime, true, 'WebGL canvas must animate over time');
  assert.equal(kineticAudit.kinetic.scrollMotionChecks[0].kineticChangesDetected, true, 'Expected audit_ui to verify kinetic scroll state mutation');

  console.log('5) Verifying uncontaminated blank-canvas regression beneath <h1> overlay...');
  const blankAudit = await auditUI(
    `${baseUrl}/__blank-canvas-regression.html`,
    path.join(outRoot, 'audit-blank-canvas'),
  );
  assert.equal(blankAudit.summary.passed, false, 'Blank canvas beneath <h1> overlay must fail audit');
  assert.equal(blankAudit.kinetic.canvasChecks[0]?.isBlank, true, 'Raw canvas check must flag isBlank: true despite overlaid <h1>');

  console.log('6) Verifying detectStack (repo root + synthetic Next.js/TW4/shadcn/App Router)...');
  const repoStack = await detectStack(repoRoot);
  assert.equal(repoStack.rootDir, repoRoot, 'detectStack should resolve repo rootDir');
  assert.ok(Array.isArray(repoStack.migrationAdvice) && repoStack.migrationAdvice.length >= 1, 'Expected migrationAdvice on repo root');

  const synthProjectDir = await fs.mkdtemp(path.join(os.tmpdir(), 'unslop-synth-next-'));
  let synthStack;
  try {
    await fs.mkdir(path.join(synthProjectDir, 'src', 'app'), { recursive: true });
    await fs.mkdir(path.join(synthProjectDir, 'public'), { recursive: true });
    await fs.writeFile(
      path.join(synthProjectDir, 'package.json'),
      JSON.stringify(
        {
          name: 'synth-next-app',
          dependencies: {
            next: '^15.2.0',
            react: '^19.0.0',
            clsx: '^2.1.1',
            'tailwind-merge': '^3.0.0',
            'class-variance-authority': '^0.7.1',
          },
          devDependencies: {
            tailwindcss: '^4.0.0',
            '@tailwindcss/postcss': '^4.0.0',
            typescript: '^5.8.0',
          },
        },
        null,
        2,
      ),
    );
    await fs.writeFile(path.join(synthProjectDir, 'tsconfig.json'), '{"compilerOptions":{"strict":true}}');
    await fs.writeFile(path.join(synthProjectDir, 'components.json'), '{"style":"new-york"}');
    await fs.writeFile(
      path.join(synthProjectDir, 'src', 'app', 'globals.css'),
      '@import "tailwindcss";\n@theme inline {\n  --color-canvas: #f6f3ed;\n  --color-ink: #181614;\n}\n',
    );
    await fs.writeFile(
      path.join(synthProjectDir, 'src', 'app', 'layout.tsx'),
      'import { Newsreader } from "next/font/google";\nexport default function RootLayout({ children }: { children: React.ReactNode }) { return <html><body>{children}</body></html>; }\n',
    );
    await fs.writeFile(
      path.join(synthProjectDir, 'src', 'app', 'page.tsx'),
      'export default function HomePage() { return <main><h1>Synthetic Home</h1></main>; }\n',
    );

    const synthReportPath = path.join(outRoot, 'synth-stack-report.json');
    synthStack = await detectStack(synthProjectDir, synthReportPath);
    assert.equal(synthStack.framework, 'next', 'Expected Next.js framework detection');
    assert.equal(synthStack.router, 'next-app-router', 'Expected Next.js App Router detection');
    assert.equal(synthStack.typescript, true, 'Expected TypeScript detection');
    assert.ok(synthStack.styling.includes('tailwindcss-v4'), 'Expected Tailwind CSS v4 detection');
    assert.ok(synthStack.uiLibraries.includes('shadcn-ui'), 'Expected shadcn/ui detection');
    assert.ok(synthStack.fontPackages.includes('next/font/google'), 'Expected next/font/google detection');
    assert.ok(synthStack.existingCssTokens.length >= 2, 'Expected extracted @theme CSS tokens');
    assert.ok(synthStack.routeFiles.includes('src/app/page.tsx'), 'Expected App Router page.tsx route');
    assert.ok(synthStack.assetDirs.includes('public'), 'Expected public/ asset dir');
    await fs.access(synthReportPath);
  } finally {
    await fs.rm(synthProjectDir, { recursive: true, force: true });
  }

  console.log('7) Verifying runDoctor({ launchCheck: false })...');
  const doctorReport = await runDoctor({ launchCheck: false });
  assert.equal(doctorReport.healthy, true, `Expected healthy doctor report: ${JSON.stringify(doctorReport, null, 2)}`);
  assert.equal(doctorReport.checks.node.ok, true, 'Node version check must pass');
  assert.equal(doctorReport.checks.playwright.ok, true, 'Playwright resolution must pass');
  assert.equal(doctorReport.checks.browserLaunch.skipped, true, 'Browser launch check should be skipped');
  assert.equal(doctorReport.checks.skillFiles.ok, true, `Missing skill files: ${JSON.stringify(doctorReport.checks.skillFiles.missing)}`);
  assert.equal(doctorReport.checks.skillFiles.checkedCount, 16, 'Expected 16 verified core skill files');

  console.log('8) Verifying inspectSite v1.1 telemetry on sample-v11-interactive.html...');
  const v11InspectOut = path.join(outRoot, 'inspect-v11');
  const v11Inspect = await inspectSite(
    `${baseUrl}/sample-v11-interactive.html`,
    v11InspectOut,
  );
  assert.equal(v11Inspect.meta.blocked, false, 'v1.1 fixture must not be blocked');
  assert.ok(
    Array.isArray(v11Inspect.interactiveStates) && v11Inspect.interactiveStates.length >= 1,
    'Expected probed interactiveStates entries',
  );
  assert.ok(
    v11Inspect.interactiveStates.some((s) => (s.ariaChanged || Boolean(s.openedOverlay) || s.themeOrRootChanged) && s.dismissedCleanly),
    `Expected at least one interactive state change with clean dismissal: ${JSON.stringify(v11Inspect.interactiveStates)}`,
  );
  assert.ok(
    Array.isArray(v11Inspect.motion.entranceReveals) &&
      v11Inspect.motion.entranceReveals.some((r) => r.revealedCount >= 1 && r.sampleTransitions.length >= 1),
    `Expected viewport-triggered entranceReveals: ${JSON.stringify(v11Inspect.motion.entranceReveals)}`,
  );
  assert.equal(v11Inspect.screenshots.mobileFull, 'mobile-full.png', 'Expected mobile-full.png screenshot');
  const mobileFullBuf = await fs.readFile(path.join(v11InspectOut, v11Inspect.screenshots.mobileFull));
  assert.equal(mobileFullBuf.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'mobile-full.png must be a valid PNG');
  assert.ok(
    v11Inspect.mobile?.collapseSummary?.desktopMultiColSectionsCount >= 1,
    `Expected desktopMultiColSectionsCount >= 1: ${JSON.stringify(v11Inspect.mobile?.collapseSummary)}`,
  );
  assert.ok(
    v11Inspect.mobile?.collapseSummary?.mobileSingleColCollapsedCount >= 1,
    `Expected mobileSingleColCollapsedCount >= 1: ${JSON.stringify(v11Inspect.mobile?.collapseSummary)}`,
  );
  assert.ok(v11Inspect.mediaInventory?.totalCount >= 3, `Expected >= 3 media items, got ${v11Inspect.mediaInventory?.totalCount}`);
  assert.ok(v11Inspect.mediaInventory?.byType?.img >= 2, 'Expected >= 2 img items in mediaInventory');
  assert.ok(v11Inspect.mediaInventory?.byType?.canvas >= 1, 'Expected >= 1 canvas item in mediaInventory');
  assert.ok(v11Inspect.mediaInventory?.countsByRatio?.['16:9'] >= 1, 'Expected 16:9 aspect ratio in mediaInventory');

  console.log('9) Verifying auditUI v1.1 upgrades (clean interactive + defects routes)...');
  const v11CleanAudit = await auditUI(
    `${baseUrl}/sample-v11-interactive.html`,
    path.join(outRoot, 'audit-v11-clean'),
  );
  assert.equal(
    v11CleanAudit.summary.passed,
    true,
    `v1.1 interactive fixture failed unexpectedly: ${JSON.stringify(v11CleanAudit.summary, null, 2)}`,
  );
  assert.ok(v11CleanAudit.performance.cls <= 0.1, `Expected low CLS <= 0.1 on clean fixture, got ${v11CleanAudit.performance.cls}`);
  assert.equal(v11CleanAudit.performance.oversizedImages.length, 0, 'Clean fixture should have 0 oversized images');
  assert.equal(v11CleanAudit.semantics.hasTitle, true, 'Expected document title');
  assert.equal(v11CleanAudit.semantics.hasMetaDescription, true, 'Expected meta description');
  assert.equal(v11CleanAudit.semantics.h1Count, 1, 'Expected exactly 1 h1');
  assert.equal(v11CleanAudit.semantics.skippedHeadingLevels.length, 0, 'Expected 0 skipped heading levels');
  assert.equal(v11CleanAudit.semantics.brokenAnchors.length, 0, 'Expected 0 broken anchors');
  assert.equal(v11CleanAudit.semantics.deadPlaceholderLinks.length, 0, 'a[href="#"][role="button"] must not flag deadPlaceholderLinks');
  assert.equal(v11CleanAudit.kinetic.reducedMotionToggleCheck.found, true, 'Expected motion toggle discovery');
  assert.equal(v11CleanAudit.kinetic.reducedMotionToggleCheck.tested, true, 'Expected motion toggle testing');
  assert.equal(v11CleanAudit.kinetic.reducedMotionToggleCheck.canvasStoppedAnimating, true, 'Motion toggle must freeze animated canvas');
  assert.equal(v11CleanAudit.kinetic.reducedMotionToggleCheck.rootStateChanged, true, 'Motion toggle must update :root class');
  assert.equal(v11CleanAudit.accessibility.alternateThemeContrast.found, true, 'Expected theme toggle discovery');
  assert.equal(v11CleanAudit.accessibility.alternateThemeContrast.toggled, true, 'Expected theme toggle activation');
  assert.equal(v11CleanAudit.accessibility.alternateThemeContrast.themeChanged, true, 'Expected alternate theme mutation');
  assert.equal(v11CleanAudit.accessibility.alternateThemeContrast.contrastFailuresCount, 0, 'Alternate theme should pass WCAG AA');
  assert.ok(
    v11CleanAudit.accessibility.interactiveOverlayChecks.some(
      (o) => o.ariaHaspopup === 'dialog' && o.opened === true && o.dismissedOnEscape === true,
    ),
    `Plain <button aria-haspopup="dialog"> must open and dismiss on Escape: ${JSON.stringify(v11CleanAudit.accessibility.interactiveOverlayChecks)}`,
  );
  assert.equal(v11CleanAudit.layout.chromeSignature?.header?.present, true, 'Expected header chromeSignature');
  assert.equal(v11CleanAudit.layout.chromeSignature?.footer?.present, true, 'Expected footer chromeSignature');

  const v11DefectsAudit = await auditUI(
    `${baseUrl}/__v11-defects.html`,
    path.join(outRoot, 'audit-v11-defects'),
  );
  assert.equal(v11DefectsAudit.summary.passed, false, 'Layout-shifting defects route must fail audit');
  assert.ok(v11DefectsAudit.performance.cls > 0.25, `Expected CLS > 0.25 on shifting route, got ${v11DefectsAudit.performance.cls}`);
  assert.ok(
    v11DefectsAudit.summary.criticalErrors.some((e) => e.includes('Cumulative Layout Shift')),
    'High CLS must produce a critical error',
  );
  assert.ok(v11DefectsAudit.performance.oversizedImages.length >= 1, 'Must detect >500KB oversized image');
  assert.ok(
    v11DefectsAudit.summary.warnings.some((w) => w.includes('oversized image')),
    'Oversized image must produce a warning',
  );
  assert.ok(v11DefectsAudit.semantics.brokenAnchors.some((a) => a.href === '#missing'), 'Must detect broken #missing anchor');
  assert.ok(v11DefectsAudit.semantics.deadPlaceholderLinks.length >= 1, 'Must detect dead href="#" link');
  assert.ok(
    v11DefectsAudit.semantics.skippedHeadingLevels.some((s) => s.from === 'h1' && s.to === 'h3'),
    'Must detect skipped heading level h1 -> h3',
  );
  assert.equal(v11DefectsAudit.accessibility.alternateThemeContrast.toggled, true, 'Expected alternate theme toggle on defects route');
  assert.ok(
    v11DefectsAudit.accessibility.alternateThemeContrast.contrastFailuresCount >= 1,
    'Must detect WCAG contrast failures in alternate dark theme',
  );

  console.log('10) Verifying auditMultiRoute across 2 routes (consistent + mismatched chrome)...');
  const multiOkOut = path.join(outRoot, 'audit-multi-ok');
  const multiOk = await auditMultiRoute(baseUrl, ['/', '/secondary'], multiOkOut);
  assert.equal(multiOk.passed, true, `Multi-route audit failed unexpectedly: ${JSON.stringify(multiOk, null, 2)}`);
  assert.equal(multiOk.routesAudited, 2, 'Expected 2 audited routes');
  assert.equal(multiOk.sharedChromeConsistency.checked, true, 'Expected sharedChromeConsistency checked');
  assert.equal(multiOk.sharedChromeConsistency.consistent, true, 'Expected consistent shared header/footer across / and /secondary');
  await fs.access(path.join(multiOkOut, 'multi-route-audit.json'));

  const multiMismatch = await auditMultiRoute(
    baseUrl,
    ['/', '/__secondary-mismatched'],
    path.join(outRoot, 'audit-multi-mismatch'),
  );
  assert.equal(multiMismatch.routesAudited, 2, 'Expected 2 audited routes on mismatch check');
  assert.equal(multiMismatch.sharedChromeConsistency.consistent, false, 'Expected mismatched header nav to flag consistent: false');
  assert.equal(multiMismatch.sharedChromeConsistency.headerConsistent, false, 'Expected headerConsistent: false');
  assert.ok(multiMismatch.sharedChromeConsistency.inconsistencies.length >= 1, 'Expected inconsistency details');

  console.log('ALL VERIFICATION CHECKS PASSED:', {
    cdpAvailable: inspectReport.meta.cdpSnapshot.available,
    inspectSections: inspectReport.sections.length,
    croppedComponentPngs: componentPngs.length,
    hoverDeltasDetected: inspectReport.motion.hoverDeltas.length,
    slopCriticalErrors: slopAudit.summary.criticalErrorCount,
    cleanPassed: cleanAudit.summary.passed,
    kineticDedupedSections: kineticInspect.sections.length,
    gpuShadersCaptured: kineticInspect.gpuShaders.shaderCount,
    scrollTimelinesCaptured: kineticInspect.motion.scrollTimelinesCount,
    rawCanvasMethod: kineticAudit.kinetic.canvasChecks[0].method,
    kineticCanvasAnimated: kineticAudit.kinetic.canvasChecks[0].animatesOverTime,
    kineticScrollVerified: kineticAudit.kinetic.scrollMotionChecks[0].kineticChangesDetected,
    blankCanvasCaughtBeneathText: blankAudit.kinetic.canvasChecks[0]?.isBlank,
    detectStackSynthNext: `${synthStack.framework}/${synthStack.router}/${synthStack.styling[0]}`,
    doctorHealthy: doctorReport.healthy,
    doctorSkillFilesChecked: doctorReport.checks.skillFiles.checkedCount,
    v11InteractiveStates: v11Inspect.interactiveStates.length,
    v11EntranceReveals: v11Inspect.motion.entranceReveals.length,
    v11MobileCollapse: v11Inspect.mobile.collapseSummary,
    v11MediaCount: v11Inspect.mediaInventory.totalCount,
    v11MotionFreezeVerified: v11CleanAudit.kinetic.reducedMotionToggleCheck.canvasStoppedAnimating,
    v11OverlayEscVerified: v11CleanAudit.accessibility.interactiveOverlayChecks[0]?.dismissedOnEscape,
    v11DefectsCls: v11DefectsAudit.performance.cls,
    v11DefectsOversizedKb: v11DefectsAudit.performance.oversizedImages[0]?.kb,
    v11DefectsAltThemeFailures: v11DefectsAudit.accessibility.alternateThemeContrast.contrastFailuresCount,
    multiRouteConsistent: multiOk.sharedChromeConsistency.consistent,
    multiRouteMismatchCaught: !multiMismatch.sharedChromeConsistency.consistent,
  });
} finally {
  server.close();
}
