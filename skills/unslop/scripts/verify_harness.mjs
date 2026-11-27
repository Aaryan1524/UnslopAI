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
import { extractReference } from './extract_reference.mjs';
import { generateStyleTile } from './generate_style_tile.mjs';
import { recordMotionQA } from './record_motion_qa.mjs';

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

const STUDIO_CRAFT_DEFECTS_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="Synthetic v1.3 studio craft defect regression fixture">
  <title>Studio Craft Defects Regression Route</title>
  <style>
    *{box-sizing:border-box}
    body{margin:0;background:#ffffff;color:#151414;font-family:'Inter',sans-serif;font-size:16px}
    header{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;padding:12px 16px;border-bottom:1px solid #ddd}
    header nav{display:flex;flex-wrap:wrap;gap:10px}
    h1,h2{font-family:'Space Grotesk',sans-serif;font-weight:700;margin:0 0 12px}
    h1{font-size:44px;line-height:1.1}
    h2{font-size:30px;line-height:1.15}
    .centered-sec{text-align:center;padding:32px 16px;max-width:1080px;margin:0 auto}
    .card-row{display:flex;flex-wrap:wrap;justify-content:center;gap:14px;margin-top:16px}
    .c-sharp{width:100%;max-width:240px;min-height:100px;padding:16px;border:1px solid #ccc;border-radius:0px;background:#faf9f6}
    .c-mid{width:100%;max-width:240px;min-height:100px;padding:16px;border:1px solid #ccc;border-radius:16px;background:#faf9f6}
    .c-big{width:100%;max-width:240px;min-height:100px;padding:16px;border:1px solid #ccc;border-radius:24px;background:#faf9f6}
    .void-card{width:100%;max-width:300px;height:420px;display:flex;flex-direction:column;justify-content:space-between;border:1px solid #ccc;border-radius:16px;padding:18px;text-align:left;background:#faf9f6}
    .btn-s{padding:8px 14px;border:1px solid #151414;background:#151414;color:#fff;border-radius:4px}
    .btn-m{padding:8px 14px;border:1px solid #151414;background:#fff;color:#151414;border-radius:10px}
    .btn-p{padding:8px 14px;border:1px solid #151414;background:#ff5e1f;color:#151414;border-radius:9999px}
    .status-bar{width:185px;margin:12px auto 0;font-family:monospace;font-size:14px;line-height:1.35;background:#151414;color:#f0e3de;padding:6px 10px;border-radius:4px}
  </style>
</head>
<body>
  <header>
    <a href="/">Brand</a>
    <nav aria-label="Primary">
      <a href="#s1">Overview</a><a href="#s2">Docs</a><a href="#s3">Pricing</a><a href="#s4">Guides</a><a href="#s1">Status</a><a href="#s2">Blog</a><a href="#s3">Support</a>
    </nav>
    <div>
      <button type="button" id="theme-toggle">Dark</button>
      <button type="button" id="motion-btn">Motion: Full</button>
    </div>
  </header>
  <main>
    <section id="s1" class="centered-sec">
      <h1>Centered Pyramid Hero</h1>
      <p>Generic typography and centered pyramid stack.</p>
      <div class="card-row">
        <button type="button" class="btn-s">Sharp CTA</button>
        <button type="button" class="btn-m">Medium CTA</button>
        <button type="button" class="btn-p">Pill CTA</button>
      </div>
      <div class="status-bar">z 5h ━━━━━━──── 58% | 7d ━━━─────── 31% reset 4d 3h</div>
    </section>
    <section id="s2" class="centered-sec">
      <h2>Centered Section Two</h2>
      <div class="card-row">
        <div class="c-sharp">0px card</div>
        <div class="c-mid">16px card</div>
        <div class="c-big">24px card</div>
      </div>
    </section>
    <section id="s3" class="centered-sec">
      <h2>Centered Section Three</h2>
      <div class="card-row">
        <div class="void-card"><div><h3>Top Title</h3></div><div><p>Bottom Note</p></div></div>
      </div>
    </section>
    <section id="s4" class="centered-sec">
      <h2>Centered Section Four</h2>
      <p>Consecutive centered band four.</p>
    </section>
  </main>
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
      if (reqPath === '__studio-craft-defects.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(STUDIO_CRAFT_DEFECTS_HTML);
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
  assert.equal(cleanAudit.studioCraft?.warnings?.length, 0, `Clean reference fixture must produce 0 studioCraft warnings: ${JSON.stringify(cleanAudit.studioCraft?.warnings)}`);
  assert.ok(cleanAudit.screenshots.desktopTiles?.length >= 1, 'Expected desktopTiles on clean audit');
  assert.ok(cleanAudit.screenshots.mobileTiles?.length >= 1, 'Expected mobileTiles on clean audit');
  const cleanChecklist = JSON.parse(await fs.readFile(path.join(outRoot, 'audit-clean', 'visual-critic-checklist.json'), 'utf8'));
  assert.equal(cleanChecklist.meta?.rubricScale, '8-axis-10-point', 'Expected 8-axis-10-point rubricScale');
  for (const rubricKey of ['typographyCraft', 'deadSpaceAudit', 'microUiWrapping', 'rhythmAndMonotony', 'referenceFidelity', 'surfaceCohesion', 'sideBySideVisualLineage', 'motionAndMobileErgonomics', 'copyEconomy']) {
    assert.ok(cleanChecklist[rubricKey], `Expected ${rubricKey} inside visual-critic-checklist.json`);
  }

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
  assert.equal(doctorReport.checks.skillFiles.checkedCount, 25, 'Expected 25 verified core skill files');

  console.log('8) Verifying inspectSite v1.1/v1.2/v1.3 telemetry & reconDigest on sample-v11-interactive.html...');
  const v11InspectOut = path.join(outRoot, 'inspect-v11');
  const v11Inspect = await inspectSite(
    `${baseUrl}/sample-v11-interactive.html`,
    v11InspectOut,
  );
  assert.equal(v11Inspect.meta.blocked, false, 'v1.1 fixture must not be blocked');
  assert.ok(v11Inspect.reconDigest && typeof v11Inspect.reconDigest === 'object', 'Expected interview-ready reconDigest object');
  assert.ok(
    Array.isArray(v11Inspect.reconDigest.topPaletteHexes) && v11Inspect.reconDigest.topPaletteHexes.length >= 1,
    `Expected non-empty reconDigest.topPaletteHexes: ${JSON.stringify(v11Inspect.reconDigest)}`,
  );
  assert.ok(
    Array.isArray(v11Inspect.reconDigest.primaryFonts) && v11Inspect.reconDigest.primaryFonts.length >= 1,
    `Expected non-empty reconDigest.primaryFonts: ${JSON.stringify(v11Inspect.reconDigest)}`,
  );
  assert.ok(v11Inspect.reconDigest.sectionCount >= 1, 'Expected reconDigest.sectionCount >= 1');
  assert.ok(Array.isArray(v11Inspect.reconDigest.sectionArchetypes) && v11Inspect.reconDigest.sectionArchetypes.length >= 1, 'Expected reconDigest.sectionArchetypes');
  assert.ok(['minimal', 'balanced', 'kinetic-heavy'].includes(v11Inspect.reconDigest.motionProfile), `Unexpected reconDigest.motionProfile: ${v11Inspect.reconDigest.motionProfile}`);
  assert.ok(v11Inspect.reconDigest.mediaCount >= 3, `Expected reconDigest.mediaCount >= 3, got ${v11Inspect.reconDigest.mediaCount}`);
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
  assert.equal(v11CleanAudit.studioCraft?.navClutter?.hasThemeOrMotionInHeader, true, 'v1.1 interactive fixture places toggles in header and triggers non-blocking navClutter check');
  assert.ok(v11CleanAudit.screenshots.desktopTiles?.length >= 1, 'Expected desktopTiles on v1.1 clean audit');
  assert.ok(v11CleanAudit.screenshots.mobileTiles?.length >= 1, 'Expected mobileTiles on v1.1 clean audit');

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

  console.log('11) Verifying v1.3/v1.4 extractReference (visualMotifs + copyDensity) + studioCraft defects & 7-axis Critic...');
  const refOutDir = path.join(outRoot, 'extract-ref-v11');
  const refTokens = await extractReference(`${baseUrl}/sample-v11-interactive.html`, refOutDir);
  assert.equal(refTokens.meta.blocked, false, 'Reference extraction on local fixture must not be blocked');
  assert.ok(['light', 'dark'].includes(refTokens.surfaceRatio?.dominantPolarity), 'Expected dominantPolarity telemetry');
  assert.ok(refTokens.typography?.h1?.fontSizePx >= 24, 'Expected measured H1 size');
  assert.ok(refTokens.geometryLock?.cardRadius, 'Expected measured cardRadius lock');
  assert.ok(refTokens.alignmentAudit?.sectionsAnalyzed >= 1, 'Expected alignmentAudit sections');
  assert.ok(refTokens.cssTokensSnippet?.includes('--ref-'), 'Expected generated --ref- CSS tokens snippet');
  assert.ok(refTokens.visualMotifs && typeof refTokens.visualMotifs.hasDotOrGridBackground === 'boolean', 'Expected v1.4 visualMotifs telemetry');
  assert.ok(['centered', 'left-aligned', 'split'].includes(refTokens.visualMotifs.heroAlignment), 'Expected visualMotifs.heroAlignment');
  assert.ok(refTokens.copyDensity && ['minimal', 'balanced', 'editorial'].includes(refTokens.copyDensity.copyDensityTier), 'Expected v1.4 copyDensity telemetry');
  await fs.access(path.join(refOutDir, 'reference-tokens.json'));

  const scDefectsOut = path.join(outRoot, 'audit-studio-defects');
  const scDefects = await auditUI(`${baseUrl}/__studio-craft-defects.html`, scDefectsOut);
  assert.equal(scDefects.summary.passed, true, `Studio-craft warnings must remain non-blocking: ${JSON.stringify(scDefects.summary)}`);
  assert.equal(scDefects.studioCraft.radiusContract.radiusDriftDetected, true, 'Must detect 3-radius drift across cards and controls');
  assert.equal(scDefects.studioCraft.sectionRhythm.monotonyDetected, true, 'Must detect >= 3 consecutive centered sections');
  assert.ok(scDefects.studioCraft.sectionRhythm.maxConsecutiveCentered >= 3, 'Expected maxConsecutiveCentered >= 3');
  assert.ok(scDefects.studioCraft.stretchedVoidCards.length >= 1, 'Must detect tall flex space-between card void');
  assert.equal(scDefects.studioCraft.navClutter.hasThemeOrMotionInHeader, true, 'Must detect header theme/motion toggle clutter');
  assert.ok(scDefects.studioCraft.navClutter.navLinkCount > 6, 'Must detect > 6 header nav links');
  assert.ok(scDefects.studioCraft.wrappedMonoBars.length >= 1, 'Must detect wrapped mono status bar');
  assert.ok(scDefects.studioCraft.defaultFontFlags.includes('Space Grotesk'), 'Must flag banned display font Space Grotesk');
  assert.ok(scDefects.studioCraft.defaultFontFlags.includes('Inter'), 'Must flag banned body font Inter');
  assert.ok(scDefects.screenshots.desktopTiles.length >= 1 && scDefects.screenshots.mobileTiles.length >= 1, 'Must capture desktopTiles and mobileTiles');
  await fs.access(path.join(scDefectsOut, 'visual-critic-checklist.json'));
  const firstTileBuf = await fs.readFile(path.join(scDefectsOut, scDefects.screenshots.desktopTiles[0]));
  assert.equal(firstTileBuf.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'critic-desktop-1.png must be a valid PNG');

  const scAllowFonts = await auditUI(
    `${baseUrl}/__studio-craft-defects.html`,
    path.join(outRoot, 'audit-studio-allow-fonts'),
    { allowGenericFonts: true },
  );
  assert.equal(
    scAllowFonts.studioCraft.warnings.some((w) => w.includes('generic AI font')),
    false,
    'allowGenericFonts: true must suppress the generic AI font warning',
  );
  assert.ok(scAllowFonts.studioCraft.defaultFontFlags.includes('Inter'), 'defaultFontFlags telemetry stays populated');

  console.log('12) Verifying v2.0 10-Second Hero Style Tile Checkpoint (generate_style_tile.mjs)...');
  const styleTileDemoOut = path.join(outRoot, 'style-tile-demo');
  const tileReport = await generateStyleTile(null, styleTileDemoOut);
  assert.equal(
    tileReport.passed,
    true,
    `Default Style Tile failed unexpectedly: ${JSON.stringify(tileReport, null, 2)}`,
  );
  assert.ok(
    tileReport.overflow.desktopPx <= 1,
    `Expected Style Tile desktop overflow <= 1px, got ${tileReport.overflow.desktopPx}`,
  );
  assert.ok(
    tileReport.overflow.mobilePx <= 1,
    `Expected Style Tile mobile overflow <= 1px, got ${tileReport.overflow.mobilePx}`,
  );
  assert.equal(
    tileReport.contrast.failures.length,
    0,
    `Expected 0 Style Tile contrast failures, got ${JSON.stringify(tileReport.contrast.failures)}`,
  );
  assert.ok(
    tileReport.contrast.minRatio >= 4.5,
    `Expected Style Tile min contrast ratio >= 4.5, got ${tileReport.contrast.minRatio}`,
  );
  assert.equal(tileReport.motionFreezeVerified, true, 'Expected Style Tile motion freeze verification to pass');
  await fs.access(path.join(styleTileDemoOut, 'index.html'));
  await fs.access(path.join(styleTileDemoOut, 'style-tile-report.json'));
  const tileDesktopBuf = await fs.readFile(path.join(styleTileDemoOut, 'style-tile-desktop.png'));
  assert.equal(
    tileDesktopBuf.subarray(0, 8).toString('hex'),
    '89504e470d0a1a0a',
    'style-tile-desktop.png must be a valid PNG',
  );
  const tileMobileBuf = await fs.readFile(path.join(styleTileDemoOut, 'style-tile-mobile.png'));
  assert.equal(
    tileMobileBuf.subarray(0, 8).toString('hex'),
    '89504e470d0a1a0a',
    'style-tile-mobile.png must be a valid PNG',
  );

  const styleTileRefOut = path.join(outRoot, 'style-tile-from-ref');
  const refTileReport = await generateStyleTile(path.join(refOutDir, 'reference-tokens.json'), styleTileRefOut);
  assert.equal(
    refTileReport.passed,
    true,
    `Reference-derived Style Tile failed unexpectedly: ${JSON.stringify(refTileReport, null, 2)}`,
  );
  await fs.access(path.join(styleTileRefOut, 'index.html'));
  await fs.access(path.join(styleTileRefOut, 'style-tile-report.json'));

  console.log('13) Verifying v2.0 Real Scroll & Interaction Video Motion QA (record_motion_qa.mjs) + 8-Axis Critic Checklist...');
  const motionQaOut = path.join(outRoot, 'motion-qa-v11');
  const motionReport = await recordMotionQA(`${baseUrl}/sample-v11-interactive.html`, motionQaOut);
  assert.equal(
    motionReport.passed,
    true,
    `Motion QA failed unexpectedly: ${JSON.stringify(motionReport, null, 2)}`,
  );
  assert.equal(motionReport.meta.blocked, false, 'Motion QA on local fixture must not be blocked');

  const resolveArtifactPath = (dir, fileOrPath) =>
    path.isAbsolute(fileOrPath) ? fileOrPath : path.join(dir, fileOrPath);

  let desktopVideoBytes = 0;
  let mobileVideoBytes = 0;
  if (motionReport.videos?.desktop && motionReport.videos?.mobile) {
    const desktopVideoPath = resolveArtifactPath(motionQaOut, motionReport.videos.desktop);
    const mobileVideoPath = resolveArtifactPath(motionQaOut, motionReport.videos.mobile);
    assert.ok(desktopVideoPath.endsWith('.webm'), `Expected desktop video to be .webm, got ${desktopVideoPath}`);
    assert.ok(mobileVideoPath.endsWith('.webm'), `Expected mobile video to be .webm, got ${mobileVideoPath}`);
    const desktopVideoStat = await fs.stat(desktopVideoPath);
    const mobileVideoStat = await fs.stat(mobileVideoPath);
    assert.ok(desktopVideoStat.size > 5000, `Expected desktop video > 5000 bytes, got ${desktopVideoStat.size}`);
    assert.ok(mobileVideoStat.size > 5000, `Expected mobile video > 5000 bytes, got ${mobileVideoStat.size}`);
    desktopVideoBytes = desktopVideoStat.size;
    mobileVideoBytes = mobileVideoStat.size;
  } else {
    assert.ok(
      motionReport.issues.some((i) => /ffmpeg|video/i.test(i)),
      `When Playwright ffmpeg is absent, expected video fallback advisory in issues, got ${JSON.stringify(motionReport.issues)}`,
    );
  }

  assert.ok(
    Array.isArray(motionReport.keyframes?.desktop) && motionReport.keyframes.desktop.length >= 3,
    `Expected >= 3 desktop keyframes, got ${motionReport.keyframes?.desktop?.length}`,
  );
  assert.ok(
    Array.isArray(motionReport.keyframes?.mobile) && motionReport.keyframes.mobile.length >= 2,
    `Expected >= 2 mobile keyframes, got ${motionReport.keyframes?.mobile?.length}`,
  );
  const firstDesktopKfEntry = motionReport.keyframes.desktop[0];
  const firstDesktopKfFile =
    typeof firstDesktopKfEntry === 'string'
      ? firstDesktopKfEntry
      : firstDesktopKfEntry?.file || firstDesktopKfEntry?.path || firstDesktopKfEntry?.screenshot;
  assert.ok(firstDesktopKfFile, 'Expected valid first desktop keyframe file reference');
  const firstDesktopKfBuf = await fs.readFile(resolveArtifactPath(motionQaOut, firstDesktopKfFile));
  assert.equal(
    firstDesktopKfBuf.subarray(0, 8).toString('hex'),
    '89504e470d0a1a0a',
    'First desktop motion QA keyframe must be a valid PNG',
  );

  assert.ok(
    motionReport.framePacing?.sampleCount >= 3,
    `Expected framePacing.sampleCount >= 3, got ${motionReport.framePacing?.sampleCount}`,
  );
  assert.ok(
    motionReport.framePacing?.avgFps > 0,
    `Expected framePacing.avgFps > 0, got ${motionReport.framePacing?.avgFps}`,
  );
  assert.equal(motionReport.interactions?.motionToggleTested, true, 'Expected motionToggleTested: true');
  assert.equal(motionReport.interactions?.motionFreezeVerified, true, 'Expected motionFreezeVerified: true');
  assert.ok(
    motionReport.mobileErgonomics?.overflowDuringScrollPx <= 1,
    `Expected mobileErgonomics.overflowDuringScrollPx <= 1, got ${motionReport.mobileErgonomics?.overflowDuringScrollPx}`,
  );
  await fs.access(path.join(motionQaOut, 'motion-qa-report.json'));

  const scChecklist = JSON.parse(
    await fs.readFile(path.join(scDefectsOut, 'visual-critic-checklist.json'), 'utf8'),
  );
  assert.equal(
    scChecklist.meta?.rubricScale,
    '8-axis-10-point',
    `Expected 8-axis-10-point rubricScale in visual-critic-checklist.json, got ${scChecklist.meta?.rubricScale}`,
  );
  for (const axisKey of [
    'typographyCraft',
    'deadSpaceAudit',
    'microUiWrapping',
    'rhythmAndMonotony',
    'referenceFidelity',
    'surfaceCohesion',
    'sideBySideVisualLineage',
    'motionAndMobileErgonomics',
  ]) {
    assert.ok(scChecklist[axisKey], `Expected 8-axis critic key "${axisKey}" in visual-critic-checklist.json`);
  }

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
    v13RefDominantPolarity: refTokens.surfaceRatio.dominantPolarity,
    v13StudioCraftWarningsCaught: scDefects.studioCraft.warnings.length,
    v13CriticDesktopTiles: scDefects.screenshots.desktopTiles.length,
    v20StyleTileDemoPassed: tileReport.passed,
    v20StyleTileMinContrast: tileReport.contrast.minRatio,
    v20StyleTileRefPassed: refTileReport.passed,
    v20MotionQaPassed: motionReport.passed,
    v20MotionQaDesktopVideoBytes: desktopVideoBytes,
    v20MotionQaMobileVideoBytes: mobileVideoBytes,
    v20MotionQaAvgFps: motionReport.framePacing.avgFps,
    v20CriticRubricScale: scChecklist.meta?.rubricScale,
  });
} finally {
  server.close();
}
