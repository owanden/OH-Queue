import { execFileSync, execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, readdir, realpath, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const prefix = 'demos/office-hours-queue';
const repository = 'https://github.com/owanden/OH-Queue';
const assetPath = name => name === 'index.html' || /^assets\/[A-Za-z0-9_-]+\.(css|js)$/.test(name);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const normalize = bytes => Buffer.from(new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/\r\n?/g, '\n'));
function git(root, ...args) {
  return execFileSync('git', ['-c', `safe.directory=${root.replaceAll('\\', '/')}`, '-C', root, ...args]);
}
function clean(root) {
  if (git(root, 'status', '--porcelain', '--untracked-files=all').length) throw new Error('Checkout must be clean: ' + root);
}
async function plainPath(root, name) {
  let current = root;
  for (const part of name.split('/')) {
    current = join(current, part);
    try { if ((await lstat(current)).isSymbolicLink()) throw new Error('Symbolic link rejected: ' + current); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return current;
}
async function files(root, dir = '') {
  const result = [];
  for (const item of await readdir(join(root, dir), { withFileTypes: true })) {
    const name = dir ? dir + '/' + item.name : item.name;
    if (item.isSymbolicLink()) throw new Error('Build contains a symbolic link');
    if (item.isDirectory()) result.push(...await files(root, name));
    else if (item.isFile()) result.push(name);
    else throw new Error('Unexpected build entry');
  }
  return result;
}

export async function publishPreview(source, destination, build = root => execSync('pnpm --filter oh-kiosk-frontend build:browser-preview', { cwd: root, stdio: 'inherit' })) {
  source = await realpath(source);
  destination = await realpath(destination);
  if (source === destination || source.startsWith(destination + sep) || destination.startsWith(source + sep)) throw new Error('Checkouts must be separate');
  for (const [root, expected] of [[source, repository + '.git'], [destination, 'https://github.com/owanden/owanden.github.io.git']]) {
    const top = await realpath(git(root, 'rev-parse', '--show-toplevel').toString().trim());
    if (top !== root || git(root, 'remote', 'get-url', 'origin').toString().trim() !== expected) throw new Error('Unexpected checkout or remote: ' + root);
    clean(root);
  }
  const commit = git(source, 'rev-parse', 'HEAD').toString().trim();
  await build(source);
  clean(source);
  if (git(source, 'rev-parse', 'HEAD').toString().trim() !== commit) throw new Error('Source changed during build');
  clean(destination);
  const output = await plainPath(source, 'frontend/dist-preview');
  const names = (await files(output)).sort();
  if (names.length !== 3 || !names.includes('index.html') || names.some(name => !assetPath(name)) || names.filter(n => n.endsWith('.js')).length !== 1 || names.filter(n => n.endsWith('.css')).length !== 1) throw new Error('Unexpected preview output');
  const content = new Map();
  for (const name of names) content.set(name, normalize(await readFile(join(output, name))));
  const html = content.get('index.html').toString();
  if (!html.includes("connect-src 'none'") || !html.includes("form-action 'none'")) throw new Error('Missing preview network policy');
  for (const name of names.filter(n => n !== 'index.html')) {
    if (!html.includes('"./' + name + '"')) throw new Error('Missing local asset reference: ' + name);
  }
  const target = await plainPath(destination, prefix);
  const manifestPath = await plainPath(destination, prefix + '/source.json');
  let previous = { sha256: {} };
  try { previous = JSON.parse(await readFile(manifestPath, 'utf8')); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    try { if ((await readdir(target)).length) throw new Error('Existing preview needs provenance'); }
    catch (missing) { if (missing.code !== 'ENOENT') throw missing; }
  }
  if (!previous.sha256 || typeof previous.sha256 !== 'object' || Array.isArray(previous.sha256)) throw new Error('Invalid previous manifest');
  for (const [name, hash] of Object.entries(previous.sha256)) {
    if (!assetPath(name) || !/^[a-f0-9]{64}$/.test(hash)) throw new Error('Invalid previous asset: ' + name);
    const path = await plainPath(destination, prefix + '/' + name);
    if (digest(normalize(await readFile(path))) !== hash) throw new Error('Previous preview hash mismatch: ' + name);
  }
  for (const name of names) {
    const path = await plainPath(destination, prefix + '/' + name);
    if (!(name in previous.sha256)) {
      try { await lstat(path); throw new Error('Refusing to replace unowned file: ' + name); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
  }
  const manifest = {
    repository, commit, build_command: 'pnpm --filter oh-kiosk-frontend build:browser-preview',
    mode: 'synthetic browser-only preview; no backend or provider',
    sha256: Object.fromEntries([...content].map(([name, bytes]) => [name, digest(bytes)])),
    text_line_endings: 'LF; CRLF and lone CR normalized before staging',
  };
  const changed = [...new Set([...names, ...Object.keys(previous.sha256), 'source.json'])].map(name => prefix + '/' + name);
  for (const [name, bytes] of content) {
    const path = join(target, name);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, bytes);
  }
  for (const name of Object.keys(previous.sha256)) if (!content.has(name)) await unlink(join(target, name));
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  try {
    git(destination, 'add', '-A', '--', ...changed);
    for (const [name, hash] of Object.entries(manifest.sha256)) {
      if (digest(git(destination, 'show', ':' + prefix + '/' + name)) !== hash) throw new Error('Staged asset hash mismatch: ' + name);
    }
    const staged = JSON.parse(git(destination, 'show', ':' + prefix + '/source.json').toString());
    if (JSON.stringify(staged) !== JSON.stringify(manifest)) throw new Error('Staged provenance mismatch');
  } catch (error) {
    git(destination, 'reset', '--quiet', 'HEAD', '--', ...changed);
    throw error;
  }
  console.log('Staged verified preview from ' + commit + '. Inspect the diff before committing; nothing was committed or pushed.');
  return manifest;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 3) throw new Error('Usage: node scripts/publish-preview.mjs <Pages checkout>');
  await publishPreview(resolve(dirname(fileURLToPath(import.meta.url)), '..'), resolve(process.argv[2]));
}
