#!/usr/bin/env node
// LOCAL/fixture unit test for src/lib/release-mirror.mjs -- the pure
// validation/key-derivation logic behind src/pages/dl/[owner]/[repo]/[tag]/[asset].ts.
// This does not exercise the Cloudflare Worker runtime or Astro routing; that
// is proven separately and manually with `wrangler dev` + a local `wrangler
// r2 object put --local` fixture (see docs/release-mirror/CONTRACT.md "Contract
// tests" for the exact commands and their real observed output).
import assert from 'node:assert/strict';
import {
  isAllowedSourceRepo,
  isValidTag,
  isValidAssetName,
  mirrorObjectKey,
  resolveDownloadRequest,
} from '../src/lib/release-mirror.mjs';

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`ok - ${name}`);
}

test('allows exactly the two real upstreams', () => {
  assert.equal(isAllowedSourceRepo('Lingtai-AI', 'lingtai-kernel'), true);
  assert.equal(isAllowedSourceRepo('Lingtai-AI', 'lingtai'), true);
  assert.equal(isAllowedSourceRepo('Lingtai-AI', 'lingtai-web'), false);
  assert.equal(isAllowedSourceRepo('someone-else', 'lingtai'), false);
});

test('tag must be an exact vX.Y.Z', () => {
  assert.equal(isValidTag('v1.0.8'), true);
  assert.equal(isValidTag('v1.0.4'), true);
  assert.equal(isValidTag('latest'), false);
  assert.equal(isValidTag('v1.0'), false);
  assert.equal(isValidTag('v1.0.8-rc1'), false);
  assert.equal(isValidTag(undefined), false);
});

test('asset name rejects traversal and unsafe characters', () => {
  assert.equal(isValidAssetName('lingtai-v1.0.8-windows-amd64.zip'), true);
  assert.equal(isValidAssetName('lingtai_kernel-1.0.4-cp312-cp312-win_amd64.whl'), true);
  assert.equal(isValidAssetName('../../etc/passwd'), false);
  assert.equal(isValidAssetName('..'), false);
  assert.equal(isValidAssetName('.hidden'), false);
  assert.equal(isValidAssetName('has space.zip'), false);
  assert.equal(isValidAssetName('a/b.zip'), false);
});

test('object key is tag-scoped and matches the sync script convention', () => {
  assert.equal(
    mirrorObjectKey('Lingtai-AI', 'lingtai-kernel', 'v1.0.4', 'lingtai_kernel-1.0.4.tar.gz'),
    'releases/Lingtai-AI/lingtai-kernel/v1.0.4/lingtai_kernel-1.0.4.tar.gz'
  );
});

test('resolveDownloadRequest: happy path returns the exact key, nothing else', () => {
  const result = resolveDownloadRequest({
    owner: 'Lingtai-AI',
    repo: 'lingtai',
    tag: 'v1.0.8',
    asset: 'lingtai-v1.0.8-windows-amd64.zip',
  });
  assert.deepEqual(result, {
    ok: true,
    key: 'releases/Lingtai-AI/lingtai/v1.0.8/lingtai-v1.0.8-windows-amd64.zip',
  });
});

test('resolveDownloadRequest: disallowed repo is 404, not a redirect to GitHub', () => {
  const result = resolveDownloadRequest({
    owner: 'someone-else',
    repo: 'lingtai',
    tag: 'v1.0.8',
    asset: 'x.zip',
  });
  assert.equal(result.ok, false);
  assert.equal(result.status, 404);
});

test('resolveDownloadRequest: rejects every field independently', () => {
  const base = { owner: 'Lingtai-AI', repo: 'lingtai', tag: 'v1.0.8', asset: 'x.zip' };
  assert.equal(resolveDownloadRequest({ ...base, tag: 'latest' }).ok, false);
  assert.equal(resolveDownloadRequest({ ...base, asset: '../x.zip' }).ok, false);
  assert.equal(resolveDownloadRequest({ ...base, repo: undefined }).ok, false);
  assert.equal(resolveDownloadRequest({}).ok, false);
});

console.log(`\n${passed} passed`);
