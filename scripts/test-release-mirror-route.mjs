#!/usr/bin/env node
// LOCAL/hermetic fixture tests for the pure latest-only release-mirror state
// and route logic. No Astro runtime, GitHub request, Cloudflare request, or R2
// bucket is used here.
import assert from 'node:assert/strict';
import {
  LATEST_SCHEMA,
  MIRROR_STATE_SCHEMA,
  createEmptyMirrorState,
  generationObjectKey,
  isAllowedSourceRepo,
  isValidAssetName,
  isValidGeneration,
  isValidSha256,
  isValidSize,
  isValidTag,
  legacyObjectKey,
  parseMirrorState,
  projectPublicLatest,
  resolveActiveDownloadRequest,
  resolveLegacyDownloadRequest,
  stateObjectKey,
  validateAssetPayload,
} from '../src/lib/release-mirror.mjs';

const REPO = 'Lingtai-AI/lingtai';
const OTHER_REPO = 'Lingtai-AI/lingtai-kernel';
const SHA_A = 'a'.repeat(64);
const SHA_B = 'b'.repeat(64);

function asset(name, sha256 = SHA_A, size = 23, tag = 'v1.2.3', generation = '100-1') {
  return {
    name,
    sha256,
    size,
    storage_key: generationObjectKey(REPO, tag, generation, name),
  };
}

function state({
  tag = 'v1.2.3',
  generation = '100-1',
  assets = [asset('lingtai.zip')],
  pendingKeys = null,
} = {}) {
  return {
    schema: MIRROR_STATE_SCHEMA,
    source_repo: REPO,
    latest: {
      release_id: 123,
      tag,
      generation,
      assets,
    },
    pending_delete: pendingKeys === null ? null : { keys: pendingKeys },
  };
}

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

function assertInvalidState(value, message) {
  assert.throws(() => parseMirrorState(JSON.stringify(value), REPO), message);
}

test('allows exactly the two real upstream repositories', () => {
  assert.equal(isAllowedSourceRepo('Lingtai-AI', 'lingtai-kernel'), true);
  assert.equal(isAllowedSourceRepo('Lingtai-AI', 'lingtai'), true);
  assert.equal(isAllowedSourceRepo('Lingtai-AI', 'lingtai-web'), false);
  assert.equal(isAllowedSourceRepo('someone-else', 'lingtai'), false);
});

test('validates strict tags, safe names, lowercase sha256, positive size, and workflow generations', () => {
  assert.equal(isValidTag('v1.0.8'), true);
  assert.equal(isValidTag('latest'), false);
  assert.equal(isValidTag('v1.0.8-rc1'), false);
  assert.equal(isValidAssetName('lingtai-v1.0.8-windows-amd64.zip'), true);
  assert.equal(isValidAssetName('../../etc/passwd'), false);
  assert.equal(isValidAssetName('.hidden'), false);
  assert.equal(isValidAssetName('has space.zip'), false);
  assert.equal(isValidSha256(SHA_A), true);
  assert.equal(isValidSha256('A'.repeat(64)), false);
  assert.equal(isValidSha256('a'.repeat(63)), false);
  assert.equal(isValidSize(1), true);
  assert.equal(isValidSize(0), false);
  assert.equal(isValidSize(1.5), false);
  assert.equal(isValidGeneration('34723594907-1'), true);
  assert.equal(isValidGeneration('0-1'), false);
  assert.equal(isValidGeneration('34723594907-client'), false);
});

test('payload validation requires a nonempty, unique, exact asset list', () => {
  assert.deepEqual(validateAssetPayload([{ name: 'a.zip', sha256: SHA_A, size: 1 }]), [
    { name: 'a.zip', sha256: SHA_A, size: 1 },
  ]);
  for (const invalid of [
    null,
    [],
    [{ name: '../a.zip', sha256: SHA_A, size: 1 }],
    [{ name: 'a.zip', sha256: SHA_A, size: 0 }],
    [{ name: 'a.zip', sha256: SHA_A.toUpperCase(), size: 1 }],
    [
      { name: 'a.zip', sha256: SHA_A, size: 1 },
      { name: 'a.zip', sha256: SHA_B, size: 2 },
    ],
    [{ name: 'a.zip', sha256: SHA_A, size: 1, url: 'https://example.invalid' }],
  ]) {
    assert.throws(() => validateAssetPayload(invalid));
  }
});

test('state and object keys are deterministic and generation scoped', () => {
  assert.equal(stateObjectKey(REPO), 'releases/Lingtai-AI/lingtai/state.json');
  assert.equal(
    generationObjectKey(REPO, 'v1.2.3', '100-1', 'a.zip'),
    'releases/Lingtai-AI/lingtai/objects/v1.2.3/100-1/a.zip'
  );
  assert.equal(legacyObjectKey(REPO, 'v1.2.3', 'a.zip'), 'releases/Lingtai-AI/lingtai/v1.2.3/a.zip');
  assert.notEqual(
    generationObjectKey(REPO, 'v1.2.3', '100-1', 'a.zip'),
    generationObjectKey(REPO, 'v1.2.3', '100-2', 'a.zip')
  );
});

test('state parser accepts a valid initialized state and a no-latest initialization state', () => {
  assert.deepEqual(parseMirrorState(JSON.stringify(state()), REPO), state());
  assert.deepEqual(parseMirrorState(JSON.stringify(createEmptyMirrorState(REPO)), REPO), createEmptyMirrorState(REPO));
});

test('state parser refuses arbitrary, wrong-repo, active-key, prefix, duplicate, and malformed deletion intent', () => {
  const active = state();
  assertInvalidState({ ...active, source_repo: OTHER_REPO });
  assertInvalidState({ ...active, extra: true });
  assertInvalidState({ ...active, pending_delete: { keys: [active.latest.assets[0].storage_key] } });
  assertInvalidState({ ...active, pending_delete: { keys: ['releases/Lingtai-AI/lingtai/objects/'] } });
  assertInvalidState({ ...active, pending_delete: { keys: ['releases/Lingtai-AI/lingtai-kernel/v1.2.3/a.zip'] } });
  assertInvalidState({ ...active, pending_delete: { keys: ['arbitrary/key'] } });
  const legacy = legacyObjectKey(REPO, 'v1.2.3', 'a.zip');
  assertInvalidState({ ...active, pending_delete: { keys: [legacy, legacy] } });
  assertInvalidState({ ...active, latest: { ...active.latest, assets: [] } });
  assertInvalidState({
    ...active,
    latest: {
      ...active.latest,
      assets: [{ ...active.latest.assets[0], storage_key: legacy }],
    },
  });
});

test('state parser accepts only exact, inactive generation and legacy deletion keys under the matching repo', () => {
  const pending = [
    generationObjectKey(REPO, 'v1.2.2', '99-1', 'old.zip'),
    legacyObjectKey(REPO, 'v1.2.3', 'lingtai.zip'),
  ];
  assert.deepEqual(parseMirrorState(JSON.stringify(state({ pendingKeys: pending })), REPO).pending_delete, {
    keys: pending,
  });
});

test('public latest projection strips generation, storage keys, and pending deletion state', () => {
  const internal = state({
    assets: [asset('a.zip', SHA_A, 11), asset('b.zip', SHA_B, 12)],
    pendingKeys: [legacyObjectKey(REPO, 'v1.2.3', 'a.zip')],
  });
  assert.deepEqual(projectPublicLatest(parseMirrorState(JSON.stringify(internal), REPO)), {
    schema: LATEST_SCHEMA,
    source_repo: REPO,
    release_id: 123,
    tag: 'v1.2.3',
    assets: [
      { name: 'a.zip', sha256: SHA_A, size: 11 },
      { name: 'b.zip', sha256: SHA_B, size: 12 },
    ],
  });
  const encoded = JSON.stringify(projectPublicLatest(internal));
  for (const internalName of ['generation', 'storage_key', 'pending_delete']) {
    assert.equal(encoded.includes(internalName), false);
  }
});

test('active route selects only the state-pinned current tag, asset, key, and expected size', () => {
  const internal = state({ assets: [asset('a.zip', SHA_A, 11), asset('b.zip', SHA_B, 12)] });
  assert.deepEqual(
    resolveActiveDownloadRequest(
      { owner: 'Lingtai-AI', repo: 'lingtai', tag: 'v1.2.3', asset: 'b.zip' },
      internal
    ),
    {
      ok: true,
      key: generationObjectKey(REPO, 'v1.2.3', '100-1', 'b.zip'),
      size: 12,
    }
  );
});

test('active route rejects stale tags, pending candidates, retiring old generations, absent assets, and invalid paths', () => {
  const retiring = generationObjectKey(REPO, 'v1.2.2', '99-1', 'old.zip');
  const pendingCandidate = generationObjectKey(REPO, 'v1.2.4', '101-1', 'future.zip');
  const internal = state({ pendingKeys: [retiring, pendingCandidate] });
  const base = { owner: 'Lingtai-AI', repo: 'lingtai', tag: 'v1.2.3', asset: 'lingtai.zip' };
  for (const params of [
    { ...base, tag: 'v1.2.2', asset: 'old.zip' },
    { ...base, tag: 'v1.2.4', asset: 'future.zip' },
    { ...base, asset: 'missing.zip' },
    { ...base, repo: 'lingtai-web' },
    { ...base, asset: '../lingtai.zip' },
  ]) {
    assert.deepEqual(resolveActiveDownloadRequest(params, internal), {
      ok: false,
      status: 404,
      body: 'Not found',
    });
  }
  assert.deepEqual(resolveActiveDownloadRequest(base, createEmptyMirrorState(REPO)), {
    ok: false,
    status: 404,
    body: 'Not found',
  });
});

test('legacy resolver is a narrow exact-tag bootstrap key, never a repo fallback or listing', () => {
  assert.deepEqual(
    resolveLegacyDownloadRequest({
      owner: 'Lingtai-AI',
      repo: 'lingtai',
      tag: 'v1.2.3',
      asset: 'a.zip',
    }),
    { ok: true, key: legacyObjectKey(REPO, 'v1.2.3', 'a.zip') }
  );
  assert.equal(
    resolveLegacyDownloadRequest({
      owner: 'other',
      repo: 'lingtai',
      tag: 'v1.2.3',
      asset: 'a.zip',
    }).ok,
    false
  );
});

let passed = 0;
for (const { name, fn } of tests) {
  await fn();
  passed += 1;
  console.log(`ok - ${name}`);
}
console.log(`\n${passed} passed`);
