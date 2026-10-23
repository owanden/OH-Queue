import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { publishPreview } from './publish-preview.mjs';

const prefix = 'demos/office-hours-queue';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function git(root, ...args) {
  return execFileSync('git', ['-c', `safe.directory=${root.replaceAll('\\', '/')}`, '-C', root, ...args], { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
}
async function put(root, name, value) { const path = join(root, name); await mkdir(dirname(path), { recursive: true }); await writeFile(path, value); }
async function fixture(t) {
  const temp = await mkdtemp(join(tmpdir(), 'queue-publisher-'));
  t.after(async () => {
    assert.equal(dirname(resolve(temp)), resolve(tmpdir()));
    assert.ok(temp.startsWith(join(tmpdir(), 'queue-publisher-')));
    await rm(temp, { recursive: true, force: true });
  });
  const source = join(temp, 'source'), destination = join(temp, 'pages');
  for (const [root, repo] of [[source, 'OH-Queue'], [destination, 'owanden.github.io']]) {
    await mkdir(root); git(root, 'init', '-b', 'main');
    git(root, 'config', 'user.name', 'Publisher fixture'); git(root, 'config', 'user.email', 'fixture@example.invalid');
    git(root, 'config', 'core.autocrlf', 'true'); git(root, 'remote', 'add', 'origin', `https://github.com/owanden/${repo}.git`);
    await put(root, 'README.md', 'fixture\n');
  }
  await put(source, '.gitignore', 'frontend/dist-preview/\n');
  const previous = {
    'index.html': '<html>old</html>\n', 'assets/old.js': 'old\n', 'assets/old.css': 'old\n',
  };
  for (const [name, value] of Object.entries(previous)) await put(destination, prefix + '/' + name, value.replaceAll('\n', '\r\n'));
  await put(destination, prefix + '/source.json', JSON.stringify({ sha256: Object.fromEntries(Object.entries(previous).map(([p, v]) => [p, hash(v)])) }));
  await put(destination, prefix + '/keep.txt', 'unowned sentinel');
  await put(destination, 'Resume.pdf', 'pdf sentinel');
  await put(destination, 'demos/incident-triage/app.js', 'incident sentinel');
  for (const root of [source, destination]) { git(root, 'add', '.'); git(root, 'commit', '-m', 'Fixture state'); }
  const build = async () => {
    await put(source, 'frontend/dist-preview/index.html', `<html><meta content="connect-src 'none'; form-action 'none'"><link href="./assets/new.css"><script src="./assets/new.js"></script>\r\n</html>\r`);
    await put(source, 'frontend/dist-preview/assets/new.js', 'const value="preview";\r\n');
    await put(source, 'frontend/dist-preview/assets/new.css', 'body{}\r');
  };
  return { temp, source, destination, build };
}

test('publisher rejects unsafe state and stages only verified normalized preview bytes', async t => {
  const f = await fixture(t);
  const { source, destination, build } = f;
  let built = false;
  await put(destination, 'dirty.txt', 'unrelated');
  await assert.rejects(publishPreview(source, destination, () => { built = true; }), /clean/);
  assert.equal(built, false); await rm(join(destination, 'dirty.txt'));
  git(destination, 'remote', 'set-url', 'origin', 'https://github.com/someone/else.git');
  await assert.rejects(publishPreview(source, destination, build), /remote/);
  git(destination, 'remote', 'set-url', 'origin', 'https://github.com/owanden/owanden.github.io.git');
  await assert.rejects(publishPreview(source, destination, async () => { await put(source, 'README.md', 'changed'); }), /clean/);
  git(source, 'restore', '--', 'README.md');
  await assert.rejects(publishPreview(source, destination, async () => { await build(); await put(source, 'frontend/dist-preview/secret.env', 'blocked'); }), /Unexpected preview output/);
  await rm(join(source, 'frontend/dist-preview/secret.env'));
  const manifest = join(destination, prefix, 'source.json');
  const before = await readFile(manifest);
  await put(destination, prefix + '/source.json', JSON.stringify({ sha256: { '../Resume.pdf': '0'.repeat(64) } }));
  git(destination, 'add', '.'); git(destination, 'commit', '-m', 'Fixture invalid manifest');
  await assert.rejects(publishPreview(source, destination, build), /Invalid previous asset/);
  await writeFile(manifest, before); git(destination, 'add', '.'); git(destination, 'commit', '-m', 'Fixture restore manifest');
  await put(destination, prefix + '/assets/old.js', 'tampered');
  git(destination, 'add', '.'); git(destination, 'commit', '-m', 'Fixture changed asset');
  await assert.rejects(publishPreview(source, destination, build), /hash mismatch/);
  await put(destination, prefix + '/assets/old.js', 'old\r\n');
  git(destination, 'add', '.'); git(destination, 'commit', '-m', 'Fixture restore asset');
  await put(destination, prefix + '/assets/new.js', 'unowned');
  git(destination, 'add', '.'); git(destination, 'commit', '-m', 'Fixture unowned collision');
  await assert.rejects(publishPreview(source, destination, build), /unowned file/);
  await rm(join(destination, prefix, 'assets/new.js'));
  git(destination, 'add', '.'); git(destination, 'commit', '-m', 'Fixture remove collision');
  const result = await publishPreview(source, destination, build);
  for (const [name, digest] of Object.entries(result.sha256)) {
    const bytes = execFileSync('git', ['-c', `safe.directory=${destination.replaceAll('\\', '/')}`, '-C', destination, 'show', ':' + prefix + '/' + name]);
    assert.equal(hash(bytes), digest); assert.equal(bytes.includes(13), false);
  }
  const changed = git(destination, 'diff', '--cached', '--name-only').split('\n');
  assert.ok(changed.every(p => p.startsWith(prefix + '/')));
  assert.equal(await readFile(join(destination, 'Resume.pdf'), 'utf8'), 'pdf sentinel');
  assert.equal(await readFile(join(destination, 'demos/incident-triage/app.js'), 'utf8'), 'incident sentinel');
  assert.equal(await readFile(join(destination, prefix, 'keep.txt'), 'utf8'), 'unowned sentinel');
  await assert.rejects(readFile(join(destination, prefix, 'assets/old.js')), /ENOENT/);
  assert.equal(result.commit, git(source, 'rev-parse', 'HEAD'));
  assert.equal(git(destination, 'log', '-1', '--format=%s'), 'Fixture remove collision');
});

test('a Git clean filter changing an asset stops publication and unstages owned changes', async t => {
  const { temp, source, destination, build } = await fixture(t);
  const filter = join(temp, 'filter.cjs');
  await writeFile(filter, `let s='';process.stdin.setEncoding('utf8');process.stdin.on('data',x=>s+=x);process.stdin.on('end',()=>process.stdout.write(s.replaceAll('preview','filtered')));`);
  git(destination, 'config', 'filter.mutate.clean', `"${process.execPath.replaceAll('\\', '/')}" "${filter.replaceAll('\\', '/')}"`);
  await put(destination, '.gitattributes', prefix + '/assets/*.js filter=mutate\n');
  git(destination, 'add', '.gitattributes'); git(destination, 'commit', '-m', 'Fixture filter');
  await assert.rejects(publishPreview(source, destination, build), /Staged asset hash mismatch/);
  assert.equal(git(destination, 'diff', '--cached', '--name-only'), '');
  assert.equal(git(destination, 'log', '-1', '--format=%s'), 'Fixture filter');
  assert.equal(await readFile(join(destination, 'Resume.pdf'), 'utf8'), 'pdf sentinel');
});
