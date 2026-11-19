import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspectSite } from './inspect_site.mjs';
import { auditUI } from './audit_ui.mjs';

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

function startStaticServer(rootDir) {
  return new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      const reqPath = (req.url || '/').split('?')[0].replace(/^\/+/, '');
      if (reqPath === '__blank-canvas-regression.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(BLANK_CANVAS_REGRESSION_HTML);
        return;
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
  });
} finally {
  server.close();
}
