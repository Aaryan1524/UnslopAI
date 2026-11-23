import fs from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureDir } from './browser_helper.mjs';

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  '.nuxt',
  '.svelte-kit',
  '.astro',
  '.output',
  '.vercel',
  '.turbo',
  '.cache',
  'dist',
  'build',
  'out',
  'coverage',
]);

const MAX_SCAN_DEPTH = 6;
const MAX_FILES_SCANNED = 2500;
const MAX_CSS_TOKENS = 40;
const MAX_ROUTE_FILES = 40;
const MAX_CSS_FILE_BYTES = 262144; // 256 KB

function toPosix(relPath) {
  return relPath.split(path.sep).join('/');
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function isDirectory(targetPath) {
  try {
    const stat = await fs.stat(targetPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

async function readTextSafe(filePath, maxBytes = MAX_CSS_FILE_BYTES) {
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile() || stat.size > maxBytes) return null;
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}

async function readJsonSafe(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return { data: JSON.parse(raw), error: null };
  } catch (err) {
    if (err?.code === 'ENOENT') return { data: null, error: null };
    return { data: null, error: String(err?.message || err) };
  }
}

async function walkProjectFiles(rootDir) {
  const files = [];

  async function walk(currentDir, depth) {
    if (depth > MAX_SCAN_DEPTH || files.length >= MAX_FILES_SCANNED) return;
    let entries;
    try {
      entries = await fs.readdir(currentDir, { withFileTypes: true });
    } catch {
      return;
    }
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (files.length >= MAX_FILES_SCANNED) break;
      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) continue;
        await walk(path.join(currentDir, entry.name), depth + 1);
      } else if (entry.isFile()) {
        const fullPath = path.join(currentDir, entry.name);
        files.push({
          fullPath,
          relPath: toPosix(path.relative(rootDir, fullPath)),
          name: entry.name,
          depth,
        });
      }
    }
  }

  await walk(rootDir, 0);
  return files;
}

function stripCssComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function extractCssTokensFromSource(cssSource, relFile, seenKeys, outTokens) {
  const clean = stripCssComments(cssSource);
  const blockStarterRe =
    /(@theme(?:\s+inline)?|:root|\[data-theme[^\]]*\]|(?:html)?\.dark)\s*\{/g;

  let match;
  while ((match = blockStarterRe.exec(clean)) !== null && outTokens.length < MAX_CSS_TOKENS) {
    const scope = match[1].replace(/\s+/g, ' ').trim();
    const openBraceIdx = match.index + match[0].length - 1;
    let depth = 0;
    let closeBraceIdx = -1;
    for (let i = openBraceIdx; i < clean.length; i++) {
      if (clean[i] === '{') depth++;
      else if (clean[i] === '}') {
        depth--;
        if (depth === 0) {
          closeBraceIdx = i;
          break;
        }
      }
    }
    if (closeBraceIdx === -1) continue;

    const body = clean.slice(openBraceIdx + 1, closeBraceIdx);
    const propRe = /(--[a-zA-Z0-9_-]+)\s*:\s*([^;{}]+?)\s*(?:;|$)/g;
    let propMatch;
    while ((propMatch = propRe.exec(body)) !== null && outTokens.length < MAX_CSS_TOKENS) {
      const name = propMatch[1].trim();
      const value = propMatch[2].replace(/\s+/g, ' ').trim();
      if (!value) continue;
      const key = `${scope}::${name}`;
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);
      outTokens.push({ name, value, scope, file: relFile });
    }
  }
}

function hasMajorVersionAtLeast(spec, minMajor) {
  if (!spec || typeof spec !== 'string') return false;
  const match = spec.match(/(\d+)/);
  if (!match) return false;
  return parseInt(match[1], 10) >= minMajor;
}

function detectFrameworkAndRouter(deps, rootConfigNames, dirChecks) {
  const hasDep = (name) => Object.prototype.hasOwnProperty.call(deps, name);
  const hasConfig = (prefix) => rootConfigNames.some((n) => n.startsWith(prefix));

  let framework = 'static-html';
  let router = 'none';

  if (hasDep('next') || hasConfig('next.config.')) {
    framework = 'next';
    const hasApp = dirChecks.hasAppDir || dirChecks.hasSrcAppDir;
    const hasPages = dirChecks.hasPagesDir || dirChecks.hasSrcPagesDir;
    if (hasApp && hasPages) router = 'next-hybrid-router';
    else if (hasApp) router = 'next-app-router';
    else if (hasPages) router = 'next-pages-router';
    else router = 'next-app-router';
  } else if (hasDep('nuxt') || hasConfig('nuxt.config.')) {
    framework = 'nuxt';
    router = dirChecks.hasPagesDir || dirChecks.hasSrcPagesDir ? 'nuxt-pages' : 'nuxt-single-app';
  } else if (hasDep('astro') || hasConfig('astro.config.')) {
    framework = 'astro';
    router = dirChecks.hasSrcPagesDir || dirChecks.hasPagesDir ? 'astro-pages' : 'none';
  } else if (hasDep('@sveltejs/kit')) {
    framework = 'sveltekit';
    router = dirChecks.hasSrcRoutesDir ? 'sveltekit-routes' : 'none';
  } else if (hasDep('svelte') || hasConfig('svelte.config.')) {
    framework = 'svelte';
  } else if (hasDep('@remix-run/react') || hasConfig('remix.config.')) {
    framework = 'remix';
    router = 'remix-routes';
  } else if ((hasDep('vite') || hasConfig('vite.config.')) && hasDep('react')) {
    framework = 'vite-react';
  } else if ((hasDep('vite') || hasConfig('vite.config.')) && hasDep('vue')) {
    framework = 'vite-vue';
  } else if (hasDep('vite') || hasConfig('vite.config.')) {
    framework = 'vite-vanilla';
  } else if (hasDep('react')) {
    framework = 'react';
  } else if (hasDep('vue')) {
    framework = 'vue';
  } else if (hasDep('@angular/core') || rootConfigNames.includes('angular.json')) {
    framework = 'angular';
    router = hasDep('@angular/router') ? 'angular-router' : 'none';
  }

  if (router === 'none') {
    if (hasDep('@tanstack/react-router')) router = 'tanstack-router';
    else if (hasDep('react-router-dom') || hasDep('react-router')) router = 'react-router';
    else if (hasDep('wouter')) router = 'wouter';
    else if (hasDep('vue-router')) router = 'vue-router';
  }

  return { framework, router };
}

function collectRouteFiles(files, framework) {
  const routes = [];
  const add = (relPath) => {
    if (routes.length < MAX_ROUTE_FILES && !routes.includes(relPath)) {
      routes.push(relPath);
    }
  };

  const nextAppRe = /^(?:src\/)?app\/(?:.*\/)?(?:page|layout|template|error|not-found)\.(?:js|jsx|ts|tsx|mdx)$/;
  const pagesRe = /^(?:src\/)?pages\/.+\.(?:js|jsx|ts|tsx|vue|astro|mdx|md|html)$/;
  const svelteRouteRe = /^src\/routes\/(?:.*\/)?\+(?:page|layout)(?:\.[^/]+)?\.(?:svelte|ts|js)$/;
  const spaRouteRe = /^src\/(?:pages|routes|views)\/.+\.(?:js|jsx|ts|tsx|vue|svelte)$/;
  const htmlRe = /^(?:[^/]+\.html|public\/[^/]+\.html|src\/[^/]+\.html)$/;

  for (const f of files) {
    if (routes.length >= MAX_ROUTE_FILES) break;
    const p = f.relPath;
    if (framework === 'next') {
      if (nextAppRe.test(p) || pagesRe.test(p)) add(p);
    } else if (framework === 'sveltekit') {
      if (svelteRouteRe.test(p)) add(p);
    } else if (framework === 'astro' || framework === 'nuxt') {
      if (pagesRe.test(p)) add(p);
    } else {
      if (nextAppRe.test(p) || pagesRe.test(p) || spaRouteRe.test(p) || htmlRe.test(p)) {
        add(p);
      }
    }
  }

  return routes;
}

function buildMigrationAdvice({
  framework,
  router,
  typescript,
  styling,
  uiLibraries,
  motionLibraries,
  fontPackages,
  existingCssTokens,
  routeFiles,
  pkgError,
}) {
  const advice = [];

  if (pkgError) {
    advice.push(
      `package.json could not be parsed (${pkgError}); verify JSON syntax before installing or updating UI dependencies.`,
    );
  }

  if (framework === 'next' && (router === 'next-app-router' || router === 'next-hybrid-router')) {
    advice.push(
      "Next.js App Router detected: keep page/layout shells as Server Components and isolate WebGL, requestAnimationFrame, IntersectionObserver, and scroll hooks inside leaf 'use client' components with full useEffect cleanup.",
    );
    advice.push(
      'Load display, body, and mono typography via next/font/google or next/font/local and attach their CSS variables to <html> so zero unstyled font flash occurs.',
    );
  } else if (framework === 'next' && router === 'next-pages-router') {
    advice.push(
      'Next.js Pages Router detected: guard window/document access inside useEffect and configure global font variables in pages/_app.',
    );
  } else if (framework === 'vite-react' || framework === 'react') {
    advice.push(
      'React stack detected: centralize reduced-motion and theme state in a lightweight provider/hook and isolate canvas/shader loops in dedicated useEffect hooks that dispose GPU resources on unmount.',
    );
  } else if (framework === 'astro') {
    advice.push(
      'Astro stack detected: keep static editorial bands zero-JS by default and attach client:visible (or client:idle) islands only to interactive drawers, filters, or WebGL canvases.',
    );
  } else if (framework === 'nuxt' || framework === 'vite-vue' || framework === 'vue') {
    advice.push(
      'Vue stack detected: mount canvas, observer, and scroll listeners inside onMounted and tear them down inside onBeforeUnmount; guard browser APIs with import.meta.client in Nuxt.',
    );
  } else if (framework === 'sveltekit' || framework === 'svelte') {
    advice.push(
      'Svelte stack detected: attach WebGL/scroll controllers via actions or onMount with cleanup return functions so SSR and route transitions stay leak-free.',
    );
  } else if (framework === 'static-html' || framework === 'vite-vanilla') {
    advice.push(
      'Vanilla/static stack detected: structure upgrades into modular ES files (src/styles/tokens.css, src/styles/layout.css, src/motion/MotionController.js, src/components/*) instead of a single monolithic HTML document.',
    );
  }

  if (styling.includes('tailwindcss-v4')) {
    advice.push(
      'Tailwind CSS v4 detected: declare semantic color, typography, and spacing tokens inside @theme inline { ... } and wrap base resets in @layer base so utilities are never overridden.',
    );
  } else if (styling.includes('tailwindcss-v3')) {
    advice.push(
      'Tailwind CSS v3 detected: bind semantic CSS custom properties in @layer base and map them under theme.extend in tailwind.config.* rather than hardcoding raw hex values in class strings.',
    );
  } else {
    advice.push(
      'Wrap base CSS resets inside @layer base and use overflow-x: clip (never overflow: hidden) on ancestors of position: sticky sections.',
    );
  }

  if (uiLibraries.includes('shadcn-ui') || uiLibraries.includes('radix-ui')) {
    advice.push(
      'shadcn/ui or Radix primitives detected: preserve semantic token aliases (--background, --foreground, --card, --primary, --muted, --border, --ring) so dialogs, popovers, and forms inherit the new design system automatically.',
    );
  }

  if (existingCssTokens.length > 0) {
    advice.push(
      `Found ${existingCssTokens.length} existing CSS custom properties: alias or refactor these tokens in place rather than introducing a duplicate parallel token system.`,
    );
  }

  if (motionLibraries.length > 0) {
    advice.push(
      `Existing motion/WebGL libraries detected (${motionLibraries.join(', ')}): wire them into a single reduced-motion gate instead of adding a competing animation runtime.`,
    );
  }

  if (routeFiles.length > 1) {
    advice.push(
      `Multiple route files detected (${routeFiles.length}): apply a strangler-fig migration—upgrade shared tokens and header/footer chrome first, then refactor one route or band at a time while preserving existing route URLs and business logic.`,
    );
  }

  if (typescript && framework !== 'static-html') {
    advice.push(
      'TypeScript enabled: type component prop contracts and interactive state machines explicitly so refactors remain compiler-checked.',
    );
  }

  if (fontPackages.length === 0 && framework !== 'next') {
    advice.push(
      'No local font packages detected: install @fontsource/* packages or load curated open-source Google Fonts with display=swap and fallback metrics.',
    );
  }

  return advice;
}

/**
 * Read-only stack, token, route, and asset inspector for any target directory.
 */
export async function detectStack(targetDir = '.', outputPath = null) {
  const rootDir = path.resolve(targetDir || '.');
  const detectedAt = new Date().toISOString();

  const rootIsDir = await isDirectory(rootDir);
  if (!rootIsDir) {
    throw new Error(`Target directory does not exist or is not a directory: ${rootDir}`);
  }

  let rootEntries = [];
  try {
    rootEntries = await fs.readdir(rootDir);
  } catch {
    rootEntries = [];
  }

  const rootConfigNames = rootEntries.filter((name) =>
    /^(?:next|vite|astro|nuxt|svelte|tailwind|postcss|remix|gatsby)\.config\.[^/]+$|^(?:tsconfig\.json|components\.json|angular\.json)$/.test(
      name,
    ),
  );

  const { data: pkg, error: pkgError } = await readJsonSafe(path.join(rootDir, 'package.json'));
  const deps = {
    ...(pkg?.peerDependencies || {}),
    ...(pkg?.devDependencies || {}),
    ...(pkg?.dependencies || {}),
  };
  const depNames = Object.keys(deps);
  const hasDep = (name) => Object.prototype.hasOwnProperty.call(deps, name);

  const [
    hasAppDir,
    hasSrcAppDir,
    hasPagesDir,
    hasSrcPagesDir,
    hasSrcRoutesDir,
    hasTsConfig,
    hasComponentsJson,
  ] = await Promise.all([
    isDirectory(path.join(rootDir, 'app')),
    isDirectory(path.join(rootDir, 'src', 'app')),
    isDirectory(path.join(rootDir, 'pages')),
    isDirectory(path.join(rootDir, 'src', 'pages')),
    isDirectory(path.join(rootDir, 'src', 'routes')),
    pathExists(path.join(rootDir, 'tsconfig.json')),
    pathExists(path.join(rootDir, 'components.json')),
  ]);

  const { framework, router } = detectFrameworkAndRouter(deps, rootConfigNames, {
    hasAppDir,
    hasSrcAppDir,
    hasPagesDir,
    hasSrcPagesDir,
    hasSrcRoutesDir,
  });

  const files = await walkProjectFiles(rootDir);

  // Detect TypeScript
  const typescript = Boolean(
    hasTsConfig ||
      hasDep('typescript') ||
      files.some((f) => /\.(?:ts|tsx|mts|cts)$/.test(f.name) && f.depth <= 3),
  );

  // Inspect CSS files for tokens, Tailwind v4 syntax, and scroll timelines
  const cssFiles = files.filter((f) => /\.(?:css|scss|sass)$/.test(f.name));
  const existingCssTokens = [];
  const seenTokenKeys = new Set();
  let cssHasTailwindV4Import = false;
  let cssHasViewTransitionsOrTimeline = false;
  let cssHasGoogleFonts = false;

  for (const cssFile of cssFiles.slice(0, 60)) {
    const content = await readTextSafe(cssFile.fullPath);
    if (!content) continue;
    if (/@import\s+['"]tailwindcss['"]|@theme(?:\s+inline)?\s*\{/.test(content)) {
      cssHasTailwindV4Import = true;
    }
    if (/@view-transition|animation-timeline\s*:|view-timeline\s*:/.test(content)) {
      cssHasViewTransitionsOrTimeline = true;
    }
    if (/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(content)) {
      cssHasGoogleFonts = true;
    }
    if (existingCssTokens.length < MAX_CSS_TOKENS) {
      extractCssTokensFromSource(content, cssFile.relPath, seenTokenKeys, existingCssTokens);
    }
  }

  // Styling detection
  const styling = [];
  const hasTailwindConfig = rootConfigNames.some((n) => n.startsWith('tailwind.config.'));
  const hasTailwindDep = hasDep('tailwindcss');
  const isTailwindV4 =
    cssHasTailwindV4Import ||
    hasDep('@tailwindcss/vite') ||
    hasDep('@tailwindcss/postcss') ||
    (hasTailwindDep && hasMajorVersionAtLeast(deps.tailwindcss, 4));

  if (isTailwindV4) styling.push('tailwindcss-v4');
  else if (hasTailwindDep || hasTailwindConfig) styling.push('tailwindcss-v3');

  if (files.some((f) => /\.module\.(?:css|scss|sass)$/.test(f.name))) styling.push('css-modules');
  if (hasDep('sass') || hasDep('node-sass') || files.some((f) => /\.(?:scss|sass)$/.test(f.name))) {
    styling.push('sass');
  }
  if (hasDep('styled-components')) styling.push('styled-components');
  if (hasDep('@emotion/react') || hasDep('@emotion/styled')) styling.push('emotion');
  if (hasDep('@vanilla-extract/css')) styling.push('vanilla-extract');
  if (hasDep('@pandacss/dev')) styling.push('panda-css');
  if (hasDep('unocss')) styling.push('unocss');
  if (hasDep('postcss') || rootConfigNames.some((n) => n.startsWith('postcss.config.'))) {
    styling.push('postcss');
  }
  if (styling.length === 0 && cssFiles.length > 0) styling.push('plain-css');

  // UI library detection
  const uiLibraries = [];
  const hasRadix = depNames.some((d) => d.startsWith('@radix-ui/'));
  const hasShadcnSignals =
    hasComponentsJson ||
    (hasDep('class-variance-authority') && hasDep('clsx') && hasDep('tailwind-merge'));
  if (hasShadcnSignals) uiLibraries.push('shadcn-ui');
  if (hasRadix) uiLibraries.push('radix-ui');
  if (hasDep('@headlessui/react') || hasDep('@headlessui/vue')) uiLibraries.push('headless-ui');
  if (hasDep('react-aria-components') || depNames.some((d) => d.startsWith('@react-aria/'))) {
    uiLibraries.push('react-aria');
  }
  if (hasDep('@base-ui-components/react') || hasDep('@base-ui/react')) uiLibraries.push('base-ui');
  if (hasDep('@mui/material')) uiLibraries.push('mui');
  if (hasDep('@chakra-ui/react')) uiLibraries.push('chakra-ui');
  if (hasDep('@mantine/core')) uiLibraries.push('mantine');
  if (hasDep('antd')) uiLibraries.push('antd');
  if (hasDep('daisyui')) uiLibraries.push('daisyui');
  if (hasDep('lucide-react') || hasDep('lucide-vue-next') || hasDep('lucide')) {
    uiLibraries.push('lucide-icons');
  }
  if (hasDep('phosphor-react') || depNames.some((d) => d.startsWith('@phosphor-icons/'))) {
    uiLibraries.push('phosphor-icons');
  }
  if (depNames.some((d) => d.startsWith('@heroicons/'))) uiLibraries.push('heroicons');

  // Motion & WebGL library detection
  const motionLibraries = [];
  if (hasDep('framer-motion') || hasDep('motion')) motionLibraries.push('framer-motion');
  if (hasDep('gsap')) motionLibraries.push('gsap');
  if (hasDep('lenis') || hasDep('@studio-freight/lenis')) motionLibraries.push('lenis');
  if (hasDep('three') || hasDep('@react-three/fiber')) motionLibraries.push('three');
  if (hasDep('ogl')) motionLibraries.push('ogl');
  if (depNames.some((d) => d.startsWith('@rive-app/'))) motionLibraries.push('rive');
  if (hasDep('lottie-web') || hasDep('lottie-react') || depNames.some((d) => d.startsWith('@lottiefiles/'))) {
    motionLibraries.push('lottie');
  }
  if (depNames.some((d) => d.startsWith('@react-spring/'))) motionLibraries.push('react-spring');
  if (hasDep('@formkit/auto-animate')) motionLibraries.push('auto-animate');
  if (cssHasViewTransitionsOrTimeline) motionLibraries.push('css-scroll-or-view-transitions');

  // Font package detection
  const fontPackages = [];
  for (const dep of depNames) {
    if (dep.startsWith('@fontsource/') || dep.startsWith('@fontsource-variable/') || dep === 'geist') {
      fontPackages.push(dep);
    }
  }
  if (framework === 'next') {
    const layoutCandidates = files.filter((f) =>
      /^(?:src\/)?(?:app\/layout|pages\/_app)\.(?:js|jsx|ts|tsx)$/.test(f.relPath),
    );
    for (const lf of layoutCandidates.slice(0, 4)) {
      const text = await readTextSafe(lf.fullPath);
      if (!text) continue;
      if (text.includes('next/font/google') && !fontPackages.includes('next/font/google')) {
        fontPackages.push('next/font/google');
      }
      if (text.includes('next/font/local') && !fontPackages.includes('next/font/local')) {
        fontPackages.push('next/font/local');
      }
    }
  }
  if (cssHasGoogleFonts && !fontPackages.includes('google-fonts-css')) {
    fontPackages.push('google-fonts-css');
  } else {
    const htmlFiles = files.filter((f) => f.name.endsWith('.html') && f.depth <= 2).slice(0, 5);
    for (const hf of htmlFiles) {
      const html = await readTextSafe(hf.fullPath);
      if (html && /fonts\.googleapis\.com/.test(html)) {
        fontPackages.push('google-fonts-link');
        break;
      }
    }
  }

  // Route files & asset dirs
  const routeFiles = collectRouteFiles(files, framework);

  const candidateAssetDirs = ['public', 'static', 'assets', 'src/assets', 'app/assets', 'images'];
  const assetDirs = [];
  for (const rel of candidateAssetDirs) {
    if (await isDirectory(path.join(rootDir, rel))) {
      assetDirs.push(rel);
    }
  }

  const migrationAdvice = buildMigrationAdvice({
    framework,
    router,
    typescript,
    styling,
    uiLibraries,
    motionLibraries,
    fontPackages,
    existingCssTokens,
    routeFiles,
    pkgError,
  });

  const report = {
    rootDir,
    detectedAt,
    framework,
    router,
    typescript,
    styling,
    uiLibraries,
    motionLibraries,
    fontPackages,
    existingCssTokens,
    routeFiles,
    assetDirs,
    migrationAdvice,
  };

  if (outputPath) {
    const resolvedOut = path.resolve(outputPath);
    await ensureDir(path.dirname(resolvedOut));
    await fs.writeFile(resolvedOut, JSON.stringify(report, null, 2) + '\n', 'utf8');
  }

  return report;
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
  const [, , targetDir = '.', outputJsonPath = null] = process.argv;
  try {
    const report = await detectStack(targetDir, outputJsonPath);
    console.log(JSON.stringify(report, null, 2));
  } catch (err) {
    console.error(String(err?.message || err));
    process.exitCode = 1;
  }
}
