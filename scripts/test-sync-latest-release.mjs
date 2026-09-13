#!/usr/bin/env node
// LOCAL/hermetic transaction fixtures for sync-latest-release.mjs. Every GitHub,
// upload, and R2 operation is an in-memory fake; no network or real bucket is
// reachable from this test.
import assert from 'node:assert/strict';
import {
  fetchOfficialLatest,
  syncLatestRelease,
  validateOfficialLatest,
} from './sync-latest-release.mjs';
import {
  generationObjectKey,
  legacyObjectKey,
  MIRROR_STATE_SCHEMA,
} from '../src/lib/release-mirror.mjs';

const REPO = 'Lingtai-AI/lingtai';
const SHA_A = 'a'.repeat(64);
const SHA_B = 'b'.repeat(64);

function payload({ tag = 'v2.0.0', generation = '200-1', assets } = {}) {
  return {
    sourceRepo: REPO,
    tag,
    generation,
    assets: assets ?? [
      { name: 'a.zip', sha256: SHA_A, size: 11 },
      { name: 'b.zip', sha256: SHA_B, size: 12 },
    ],
  };
}

function latestRelease(tag = 'v2.0.0', id = 200) {
  return { id, tag_name: tag, draft: false, prerelease: false };
}

function activeState({ tag = 'v1.9.0', generation = '190-1', id = 190, name = 'old.zip' } = {}) {
  return {
    schema: MIRROR_STATE_SCHEMA,
    source_repo: REPO,
    latest: {
      release_id: id,
      tag,
      generation,
      assets: [
        {
          name,
          sha256: SHA_A,
          size: 9,
          storage_key: generationObjectKey(REPO, tag, generation, name),
        },
      ],
    },
    pending_delete: null,
  };
}

function clone(value) {
  return value === null ? null : JSON.parse(JSON.stringify(value));
}

function fixture({ initialState = activeState(), latest = [latestRelease(), latestRelease()], hooks = {} } = {}) {
  const f = {
    state: clone(initialState),
    latest: [...latest],
    operations: [],
    writes: 0,
    reads: 0,
    deletes: 0,
    uploads: 0,
  };
  f.dependencies = {
    async readState(sourceRepo) {
      assert.equal(sourceRepo, REPO);
      f.reads += 1;
      f.operations.push({ type: 'read', state: clone(f.state) });
      if (hooks.readState) return hooks.readState(f);
      return clone(f.state);
    },
    async writeState(sourceRepo, state) {
      assert.equal(sourceRepo, REPO);
      f.writes += 1;
      f.operations.push({ type: 'write', state: clone(state) });
      if (hooks.writeState) return hooks.writeState(f, clone(state));
      f.state = clone(state);
    },
    async deleteObject(key) {
      f.deletes += 1;
      f.operations.push({ type: 'delete', key });
      if (hooks.deleteObject) return hooks.deleteObject(f, key);
    },
    async uploadAsset(input) {
      f.uploads += 1;
      f.operations.push({
        type: 'upload',
        name: input.asset.name,
        key: generationObjectKey(input.sourceRepo, input.tag, input.generation, input.asset.name),
      });
      if (hooks.uploadAsset) return hooks.uploadAsset(f, input);
    },
    async fetchLatest(sourceRepo) {
      assert.equal(sourceRepo, REPO);
      f.operations.push({ type: 'fetch' });
      const next = f.latest.shift();
      if (next instanceof Error) throw next;
      if (typeof next === 'function') return next(f);
      return clone(next);
    },
  };
  return f;
}

function types(f) {
  return f.operations.map((operation) => operation.type);
}

function writes(f) {
  return f.operations.filter((operation) => operation.type === 'write').map((operation) => operation.state);
}

function deletedKeys(f) {
  return f.operations.filter((operation) => operation.type === 'delete').map((operation) => operation.key);
}

function candidateKeys(request = payload()) {
  return request.assets.map((asset) =>
    generationObjectKey(request.sourceRepo, request.tag, request.generation, asset.name)
  );
}

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

test('happy path orders prepare, all uploads, latest recheck, one switch, exact retirement, and final clear', async () => {
  const request = payload();
  const old = activeState();
  const f = fixture({ initialState: old });
  const result = await syncLatestRelease(request, f.dependencies);

  assert.deepEqual(types(f), [
    'read',
    'fetch',
    'write',
    'upload',
    'upload',
    'read',
    'fetch',
    'write',
    'delete',
    'delete',
    'delete',
    'write',
  ]);
  const stateWrites = writes(f);
  assert.deepEqual(stateWrites[0].latest, old.latest);
  assert.deepEqual(stateWrites[0].pending_delete.keys, candidateKeys(request));
  assert.equal(stateWrites[1].latest.tag, request.tag);
  assert.equal(stateWrites[1].latest.generation, request.generation);
  assert.deepEqual(stateWrites[1].pending_delete.keys, [
    old.latest.assets[0].storage_key,
    legacyObjectKey(REPO, request.tag, 'a.zip'),
    legacyObjectKey(REPO, request.tag, 'b.zip'),
  ]);
  assert.equal(stateWrites[2].pending_delete, null);
  assert.deepEqual(deletedKeys(f), stateWrites[1].pending_delete.keys);
  assert.deepEqual(result, f.state);
});

test('first initialization promotes once but leaves named legacy retirement pending for post-deploy recovery', async () => {
  const request = payload();
  const f = fixture({ initialState: null });
  const result = await syncLatestRelease(request, f.dependencies);

  assert.deepEqual(types(f), ['read', 'fetch', 'write', 'upload', 'upload', 'read', 'fetch', 'write']);
  const stateWrites = writes(f);
  assert.equal(stateWrites.length, 2);
  assert.equal(stateWrites[0].latest, null);
  assert.deepEqual(stateWrites[0].pending_delete.keys, candidateKeys(request));
  assert.equal(stateWrites[1].latest.tag, request.tag);
  assert.equal(stateWrites[1].latest.generation, request.generation);
  assert.deepEqual(stateWrites[1].pending_delete.keys, [
    legacyObjectKey(REPO, request.tag, 'a.zip'),
    legacyObjectKey(REPO, request.tag, 'b.zip'),
  ]);
  assert.deepEqual(deletedKeys(f), []);
  assert.deepEqual(result, stateWrites[1]);
  assert.deepEqual(f.state, stateWrites[1]);
});

test('post-deploy current re-dispatch recovers deferred legacy retirement before any new upload', async () => {
  const initialized = activeState({ tag: 'v2.0.0', generation: '200-1', id: 200, name: 'a.zip' });
  const legacy = legacyObjectKey(REPO, 'v2.0.0', 'a.zip');
  initialized.pending_delete = { keys: [legacy] };
  const f = fixture({ initialState: initialized });

  await syncLatestRelease(payload({ generation: '201-1' }), f.dependencies);

  assert.deepEqual(types(f).slice(0, 4), ['read', 'delete', 'write', 'fetch']);
  assert.equal(f.operations[1].key, legacy);
  assert.deepEqual(f.operations[2].state, { ...initialized, pending_delete: null });
  assert.ok(types(f).indexOf('upload') > 2);
});

test('upload failure keeps old latest active and persisted candidate intent survives failed best-effort cleanup', async () => {
  const old = activeState();
  const request = payload();
  const f = fixture({
    initialState: old,
    hooks: {
      uploadAsset(current) {
        if (current.uploads === 2) throw new Error('fixture upload failed');
      },
      deleteObject() {
        throw new Error('fixture cleanup unavailable');
      },
    },
  });
  await assert.rejects(syncLatestRelease(request, f.dependencies), /safe candidate recovery is incomplete/);
  assert.deepEqual(f.state.latest, old.latest);
  assert.deepEqual(f.state.pending_delete.keys, candidateKeys(request));
  assert.equal(types(f).includes('fetch') && f.operations.filter((op) => op.type === 'fetch').length, 1);
});

test('ordinary upload failure performs safe exact candidate cleanup without touching active old bytes', async () => {
  const old = activeState();
  const request = payload();
  const f = fixture({
    initialState: old,
    hooks: {
      uploadAsset(current) {
        if (current.uploads === 2) throw new Error('fixture upload failed');
      },
    },
  });
  await assert.rejects(syncLatestRelease(request, f.dependencies), /fixture upload failed/);
  assert.deepEqual(f.state, { ...old, pending_delete: null });
  assert.deepEqual(deletedKeys(f), candidateKeys(request));
  assert.equal(deletedKeys(f).includes(old.latest.assets[0].storage_key), false);
});

test('official-latest race before switch cleans only candidate keys and cannot delete old active', async () => {
  const old = activeState();
  const request = payload();
  const f = fixture({ latest: [latestRelease(), latestRelease('v2.0.1', 201)], initialState: old });
  await assert.rejects(syncLatestRelease(request, f.dependencies), /not the expected official/);
  assert.deepEqual(f.state.latest, old.latest);
  assert.equal(f.state.pending_delete, null);
  assert.deepEqual(deletedKeys(f), candidateKeys(request));
  assert.equal(deletedKeys(f).includes(old.latest.assets[0].storage_key), false);
});

test('post-switch cleanup failure leaves new latest active with exact recoverable retirement intent', async () => {
  const old = activeState();
  const request = payload();
  const f = fixture({
    initialState: old,
    hooks: {
      deleteObject() {
        throw new Error('fixture retirement unavailable');
      },
    },
  });
  await assert.rejects(syncLatestRelease(request, f.dependencies), /fixture retirement unavailable/);
  assert.equal(f.state.latest.tag, request.tag);
  assert.equal(f.state.latest.generation, request.generation);
  assert.deepEqual(f.state.pending_delete.keys, [
    old.latest.assets[0].storage_key,
    legacyObjectKey(REPO, request.tag, 'a.zip'),
    legacyObjectKey(REPO, request.tag, 'b.zip'),
  ]);
});

// Safe stale rejection is not an eventual-delivery mechanism: if GitHub drops
// the current dispatch from its one pending slot, the source release owner must
// visibly re-send current latest after this stale run exits.
test('pending cleanup is recovered and cleared before a stale dispatch is rejected', async () => {
  const promoted = activeState({ tag: 'v2.0.0', generation: '200-1', id: 200, name: 'a.zip' });
  const pending = [
    generationObjectKey(REPO, 'v1.9.0', '190-1', 'old.zip'),
    legacyObjectKey(REPO, 'v2.0.0', 'a.zip'),
  ];
  promoted.pending_delete = { keys: pending };
  const f = fixture({ initialState: promoted, latest: [latestRelease('v2.0.0', 200)] });
  await assert.rejects(
    syncLatestRelease(payload({ tag: 'v1.9.0', generation: '201-1' }), f.dependencies),
    /not the expected official/
  );
  assert.deepEqual(types(f).slice(0, 5), ['read', 'delete', 'delete', 'write', 'fetch']);
  assert.deepEqual(deletedKeys(f), pending);
  assert.equal(f.state.latest.tag, 'v2.0.0');
  assert.equal(f.state.pending_delete, null);
  assert.equal(f.uploads, 0);
});

test('same-tag changed-digest rerun writes a disjoint generation and never overwrites active bytes', async () => {
  const old = activeState({ tag: 'v2.0.0', generation: '199-1', id: 200, name: 'a.zip' });
  old.latest.assets[0].sha256 = SHA_A;
  const request = payload({
    generation: '200-2',
    assets: [{ name: 'a.zip', sha256: SHA_B, size: 13 }],
  });
  const f = fixture({ initialState: old });
  await syncLatestRelease(request, f.dependencies);
  const newKey = generationObjectKey(REPO, 'v2.0.0', '200-2', 'a.zip');
  assert.notEqual(newKey, old.latest.assets[0].storage_key);
  assert.equal(f.operations.find((operation) => operation.type === 'upload').key, newKey);
  assert.equal(f.state.latest.assets[0].storage_key, newKey);
  assert.equal(deletedKeys(f).includes(old.latest.assets[0].storage_key), true);
});

test('reusing the active workflow generation is rejected before candidate state can overwrite active bytes', async () => {
  const old = activeState({ tag: 'v2.0.0', generation: '200-1', id: 200, name: 'a.zip' });
  const request = payload({
    generation: '200-1',
    assets: [{ name: 'a.zip', sha256: SHA_B, size: 13 }],
  });
  const f = fixture({ initialState: old, latest: [latestRelease()] });
  await assert.rejects(syncLatestRelease(request, f.dependencies), /collides with active storage/);
  assert.equal(f.writes, 0);
  assert.equal(f.uploads, 0);
});

test('empty, duplicate, malformed payload and client-shaped generation are rejected before any R2 operation', async () => {
  const invalidRequests = [
    payload({ assets: [] }),
    payload({ assets: [
      { name: 'a.zip', sha256: SHA_A, size: 1 },
      { name: 'a.zip', sha256: SHA_B, size: 2 },
    ] }),
    payload({ assets: [{ name: '../a.zip', sha256: SHA_A, size: 1 }] }),
    payload({ assets: [{ name: 'a.zip', sha256: 'bad', size: 1 }] }),
    payload({ assets: [{ name: 'a.zip', sha256: SHA_A, size: 0 }] }),
    payload({ generation: 'from-client-payload' }),
    { ...payload(), sourceRepo: 'attacker/repo' },
    payload({ tag: 'latest' }),
  ];
  for (const request of invalidRequests) {
    const f = fixture();
    await assert.rejects(syncLatestRelease(request, f.dependencies));
    assert.deepEqual(f.operations, []);
  }
});

test('an acknowledged-as-failed promotion with prepared state cleans the inactive candidate exactly', async () => {
  const old = activeState();
  const request = payload();
  const f = fixture({
    initialState: old,
    hooks: {
      writeState(current, next) {
        if (current.writes === 2) throw new Error('fixture unacknowledged promotion');
        current.state = clone(next);
      },
    },
  });
  await assert.rejects(syncLatestRelease(request, f.dependencies), /prepared candidate remains inactive/);
  assert.deepEqual(f.state.latest, old.latest);
  assert.equal(f.state.pending_delete, null);
  assert.deepEqual(deletedKeys(f), candidateKeys(request));
});

test('an unacknowledged promotion observed active finishes retirement instead of deleting the candidate', async () => {
  const old = activeState();
  const request = payload();
  const f = fixture({
    initialState: old,
    hooks: {
      writeState(current, next) {
        current.state = clone(next);
        if (current.writes === 2) throw new Error('fixture lost acknowledgement');
      },
    },
  });
  await syncLatestRelease(request, f.dependencies);
  assert.equal(f.state.latest.tag, request.tag);
  assert.equal(f.state.pending_delete, null);
  assert.deepEqual(deletedKeys(f), [
    old.latest.assets[0].storage_key,
    legacyObjectKey(REPO, request.tag, 'a.zip'),
    legacyObjectKey(REPO, request.tag, 'b.zip'),
  ]);
});

test('unreadable mandatory pre-promotion reread stops without deleting any candidate key', async () => {
  const request = payload();
  const f = fixture({
    hooks: {
      readState(current) {
        if (current.reads === 2) throw new Error('fixture state read failed');
        return clone(current.state);
      },
    },
  });
  await assert.rejects(syncLatestRelease(request, f.dependencies), /refusing promotion without deletion/);
  assert.deepEqual(deletedKeys(f), []);
  assert.deepEqual(f.state.pending_delete.keys, candidateKeys(request));
});

test('unreadable state after an unacknowledged promotion stops without deletion', async () => {
  const request = payload();
  const f = fixture({
    hooks: {
      writeState(current, next) {
        if (current.writes === 2) throw new Error('fixture lost acknowledgement');
        current.state = clone(next);
      },
      readState(current) {
        if (current.reads === 3) throw new Error('fixture state read failed');
        return clone(current.state);
      },
    },
  });
  await assert.rejects(syncLatestRelease(request, f.dependencies), /no deletion is safe/);
  assert.deepEqual(deletedKeys(f), []);
});

test('GitHub latest validation rejects draft, prerelease, tag mismatch, bad id, and same-tag recreated id', () => {
  assert.deepEqual(validateOfficialLatest(latestRelease(), 'v2.0.0'), {
    releaseId: 200,
    tag: 'v2.0.0',
  });
  assert.throws(() => validateOfficialLatest({ ...latestRelease(), draft: true }, 'v2.0.0'));
  assert.throws(() => validateOfficialLatest({ ...latestRelease(), prerelease: true }, 'v2.0.0'));
  assert.throws(() => validateOfficialLatest(latestRelease('v2.0.1', 201), 'v2.0.0'));
  assert.throws(() => validateOfficialLatest(latestRelease('v2.0.0', 0), 'v2.0.0'));
  assert.throws(() => validateOfficialLatest(latestRelease('v2.0.0', 201), 'v2.0.0', 200));
});

test('GitHub adapter uses only the hardcoded allowlisted latest URL and never outputs its optional token', async () => {
  const token = 'fixture-secret-token-never-output';
  const calls = [];
  const output = [];
  const oldLog = console.log;
  const oldError = console.error;
  console.log = (...args) => output.push(args.join(' '));
  console.error = (...args) => output.push(args.join(' '));
  try {
    const release = await fetchOfficialLatest(REPO, {
      token,
      fetchImpl: async (url, options) => {
        calls.push({ url, options });
        return { ok: true, status: 200, async json() { return latestRelease(); } };
      },
    });
    assert.deepEqual(release, latestRelease());
  } finally {
    console.log = oldLog;
    console.error = oldError;
  }
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.github.com/repos/Lingtai-AI/lingtai/releases/latest');
  assert.equal(calls[0].options.headers.authorization, `Bearer ${token}`);
  assert.equal(output.join('\n').includes(token), false);
  let called = false;
  await assert.rejects(
    fetchOfficialLatest('attacker/repo', {
      token,
      fetchImpl: async () => { called = true; },
    }),
    /non-allowlisted/
  );
  assert.equal(called, false);
});

let passed = 0;
for (const { name, fn } of tests) {
  await fn();
  passed += 1;
  console.log(`ok - ${name}`);
}
console.log(`\n${passed} passed`);
