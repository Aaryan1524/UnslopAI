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

function extractMarkdownRelativeLinks(relPath) {
  const full = path.join(repoRoot, relPath);
  const text = fs
    .readFileSync(full, 'utf8')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`\n]*`/g, '');
  const targets = [];
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
    if (cleanTarget) targets.push(cleanTarget);
  }
  return targets;
}

function checkMarkdownRelativeLinks(relPath) {
  const dir = path.dirname(path.join(repoRoot, relPath));
  const broken = [];
  for (const target of extractMarkdownRelativeLinks(relPath)) {
    const resolved = path.resolve(dir, target);
    if (!fs.existsSync(resolved)) {
      broken.push(`${relPath} -> ${target}`);
    }
  }
  return broken;
}

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(match, 'SKILL.md must begin with valid YAML frontmatter delimited by ---');
  const fields = {};
  let inMetadata = false;
  for (const line of match[1].split(/\r?\n/)) {
    const topKv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (topKv) {
      inMetadata = topKv[1] === 'metadata';
      fields[topKv[1]] = topKv[2].trim().replace(/^["']|["']$/g, '');
      continue;
    }
    if (inMetadata) {
      const nestedKv = line.match(/^\s+([A-Za-z0-9_-]+):\s*(.*)$/);
      if (nestedKv) {
        fields[`metadata.${nestedKv[1]}`] = nestedKv[2].trim().replace(/^["']|["']$/g, '');
      }
    }
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

// 2. Validate package manifests & package-lock.json when present
for (const pkgPath of ['package.json', 'skills/unslop/package.json']) {
  if (!exists(pkgPath)) continue;
  const pkg = readJson(pkgPath);
  assert.ok(pkg.name && pkg.version, `${pkgPath}: missing name or version`);
  versions.push({ file: pkgPath, version: pkg.version });
  checked.push(pkgPath);
}

if (exists('package-lock.json')) {
  const lock = readJson('package-lock.json');
  assert.ok(lock.version, 'package-lock.json: missing top-level version');
  assert.ok(lock.packages?.['']?.version, 'package-lock.json: missing packages[""].version');
  versions.push({ file: 'package-lock.json#version', version: lock.version });
  versions.push({ file: 'package-lock.json#packages[""]', version: lock.packages[''].version });
  checked.push('package-lock.json');
}

// 3. Validate SKILL.md frontmatter & reference coverage when present
const referencesChecked = [];
if (exists('skills/unslop/SKILL.md')) {
  const md = fs.readFileSync(path.join(repoRoot, 'skills/unslop/SKILL.md'), 'utf8');
  const fm = parseFrontmatter(md);
  assert.equal(fm.name, 'unslop', `SKILL.md name must match folder 'unslop', got '${fm.name}'`);
  assert.match(fm.name, /^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]?$/, 'SKILL.md name must be lowercase alphanumeric + hyphens');
  assert.ok(fm.description && fm.description.length <= 1024, 'SKILL.md description must be 1..1024 chars');
  if (fm.compatibility) {
    assert.ok(fm.compatibility.length <= 500, 'SKILL.md compatibility must be <= 500 chars');
  }
  if (fm['metadata.version']) {
    versions.push({ file: 'skills/unslop/SKILL.md#metadata.version', version: fm['metadata.version'] });
  }
  const brokenSkillLinks = checkMarkdownRelativeLinks('skills/unslop/SKILL.md');
  assert.deepEqual(brokenSkillLinks, [], `Broken relative links in SKILL.md: ${brokenSkillLinks.join(', ')}`);
  checked.push('skills/unslop/SKILL.md');

  // Verify every skills/unslop/references/*.md file is linked from SKILL.md and has valid links
  if (exists('skills/unslop/references')) {
    const skillDir = path.join(repoRoot, 'skills/unslop');
    const linkedFromSkill = new Set(
      extractMarkdownRelativeLinks('skills/unslop/SKILL.md').map((t) =>
        path.relative(skillDir, path.resolve(skillDir, t)).split(path.sep).join('/'),
      ),
    );
    const refDir = path.join(repoRoot, 'skills/unslop/references');
    const unreferenced = [];
    const brokenRefLinks = [];
    for (const entry of fs.readdirSync(refDir).sort()) {
      if (!entry.endsWith('.md')) continue;
      const relFromSkill = `references/${entry}`;
      const relFromRepo = `skills/unslop/references/${entry}`;
      if (!linkedFromSkill.has(relFromSkill)) {
        unreferenced.push(relFromRepo);
      }
      brokenRefLinks.push(...checkMarkdownRelativeLinks(relFromRepo));
      referencesChecked.push(relFromRepo);
    }
    assert.deepEqual(
      unreferenced,
      [],
      `Reference docs not linked from skills/unslop/SKILL.md: ${unreferenced.join(', ')}`,
    );
    assert.deepEqual(
      brokenRefLinks,
      [],
      `Broken relative links in skills/unslop/references/: ${brokenRefLinks.join(', ')}`,
    );
  }
}

// 4. Enforce version synchronization across all present manifests (including package-lock.json & SKILL.md)
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

// 5. Validate README.md relative links when present
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
  for (const entry of fs.readdirSync(path.join(repoRoot, dir)).sort()) {
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
      referencesCheckedCount: referencesChecked.length,
      scriptsSyntaxChecked: syntaxChecked,
    },
    null,
    2,
  ),
);
