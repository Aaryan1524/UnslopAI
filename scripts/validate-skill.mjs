import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

function exists(relPath) {
  return fs.existsSync(path.join(repoRoot, relPath));
}

function readJson(relPath) {
  const full = path.join(repoRoot, relPath);
  const raw = fs.readFileSync(full, 'utf8');
  return JSON.parse(raw);
}

function checkMarkdownRelativeLinks(relPath) {
  const full = path.join(repoRoot, relPath);
  const dir = path.dirname(full);
  const text = fs.readFileSync(full, 'utf8').replace(/```[\s\S]*?```/g, '');
  const broken = [];
  const linkRe = /!?\[[^\]]*\]\(([^)]+)\)/g;
  let match;
  while ((match = linkRe.exec(text)) !== null) {
    const rawTarget = match[1].trim().split(/\s+/)[0];
    if (
      !rawTarget ||
      rawTarget.startsWith('http://') ||
      rawTarget.startsWith('https://') ||
      rawTarget.startsWith('#') ||
      rawTarget.startsWith('mailto:')
    ) {
      continue;
    }
    const cleanTarget = rawTarget.split('#')[0].split('?')[0];
    if (!cleanTarget) continue;
    const resolved = path.resolve(dir, cleanTarget);
    if (!fs.existsSync(resolved)) {
      broken.push(`${relPath} -> ${rawTarget}`);
    }
  }
  return broken;
}

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(match, 'SKILL.md must begin with valid YAML frontmatter delimited by ---');
  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (kv) fields[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '');
  }
  return fields;
}

const versions = [];
const checked = [];

// 1. Validate plugin & marketplace manifests
for (const manifest of ['.claude-plugin/plugin.json', '.claude-plugin/marketplace.json']) {
  if (!exists(manifest)) continue;
  const data = readJson(manifest);
  assert.ok(data.name && typeof data.name === 'string', `${manifest}: missing name`);
  if (data.version) versions.push({ file: manifest, version: data.version });
  if (Array.isArray(data.plugins)) {
    assert.ok(data.plugins.length >= 1, `${manifest}: plugins array must be non-empty`);
    for (const p of data.plugins) {
      assert.ok(p.name && p.source, `${manifest}: each plugin entry needs name and source`);
      if (p.version) versions.push({ file: `${manifest}#${p.name}`, version: p.version });
    }
  }
  checked.push(manifest);
}

// 2. Validate package manifests when present
for (const pkgPath of ['package.json', 'skills/unslop/package.json']) {
  if (!exists(pkgPath)) continue;
  const pkg = readJson(pkgPath);
  assert.ok(pkg.name && pkg.version, `${pkgPath}: missing name or version`);
  versions.push({ file: pkgPath, version: pkg.version });
  checked.push(pkgPath);
}

// 3. Enforce version synchronization across all present manifests
if (versions.length > 1) {
  const expected = versions[0].version;
  for (const item of versions) {
    assert.equal(
      item.version,
      expected,
      `Version mismatch: ${item.file} has ${item.version}, expected ${expected} (from ${versions[0].file})`,
    );
  }
}

// 4. Validate SKILL.md frontmatter against Agent Skills spec when present
if (exists('skills/unslop/SKILL.md')) {
  const md = fs.readFileSync(path.join(repoRoot, 'skills/unslop/SKILL.md'), 'utf8');
  const fm = parseFrontmatter(md);
  assert.equal(fm.name, 'unslop', `SKILL.md name must match folder 'unslop', got '${fm.name}'`);
  assert.match(fm.name, /^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]?$/, 'SKILL.md name must be lowercase alphanumeric + hyphens');
  assert.ok(fm.description && fm.description.length <= 1024, 'SKILL.md description must be 1..1024 chars');
  if (fm.compatibility) {
    assert.ok(fm.compatibility.length <= 500, 'SKILL.md compatibility must be <= 500 chars');
  }
  const brokenSkillLinks = checkMarkdownRelativeLinks('skills/unslop/SKILL.md');
  assert.deepEqual(brokenSkillLinks, [], `Broken relative links in SKILL.md: ${brokenSkillLinks.join(', ')}`);
  checked.push('skills/unslop/SKILL.md');
}

// 5. Validate README.md relative links when present (skip links to files not yet merged in partial PRs only if core dir absent)
if (exists('README.md') && exists('skills/unslop/SKILL.md')) {
  const brokenReadmeLinks = checkMarkdownRelativeLinks('README.md');
  assert.deepEqual(brokenReadmeLinks, [], `Broken relative links in README.md: ${brokenReadmeLinks.join(', ')}`);
  checked.push('README.md');
}

// 6. Syntax-check all .mjs scripts
const scriptDirs = ['scripts', 'skills/unslop/scripts'];
const syntaxChecked = [];
for (const dir of scriptDirs) {
  if (!exists(dir)) continue;
  for (const entry of fs.readdirSync(path.join(repoRoot, dir))) {
    if (!entry.endsWith('.mjs')) continue;
    const rel = path.join(dir, entry);
    execFileSync(process.execPath, ['--check', path.join(repoRoot, rel)], { stdio: 'pipe' });
    syntaxChecked.push(rel);
  }
}

console.log(
  JSON.stringify(
    {
      valid: true,
      syncedVersion: versions[0]?.version || null,
      manifestsChecked: checked,
      scriptsSyntaxChecked: syntaxChecked,
    },
    null,
    2,
  ),
);
