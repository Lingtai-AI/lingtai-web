#!/usr/bin/env node
// One serialized, per-repository latest-only mirror transaction. GitHub's
// releases/latest endpoint remains authoritative; R2 stores one validated state
// object plus generation-scoped candidate bytes and exact deletion intent.
import { execFile, spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  createEmptyMirrorState,
  generationObjectKey,
  isValidGeneration,
  isValidReleaseId,
  isValidSourceRepo,
  isValidTag,
  legacyObjectKey,
  MIRROR_STATE_SCHEMA,
  parseMirrorState,
  stateObjectKey,
  statesEqual,
  validateAssetPayload,
} from '../src/lib/release-mirror.mjs';

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));
const ASSET_SYNC_SCRIPT = path.join(REPO_ROOT, 'scripts', 'sync-release-asset.sh');
const GITHUB_API_ROOT = 'https://api.github.com';

function fail(message, options) {
  throw new Error(message, options);
}

function unsafeStateOutcome(message, options) {
  const error = new Error(message, options);
  error.skipCandidateCleanup = true;
  throw error;
}

export function validateSyncRequest({ sourceRepo, tag, generation, assets }) {
  if (!isValidSourceRepo(sourceRepo)) fail('SOURCE_REPO is not in the release-mirror allowlist');
  if (!isValidTag(tag)) fail('TAG is not an exact vX.Y.Z release tag');
  if (!isValidGeneration(generation)) {
    fail('GENERATION must be the workflow-owned GITHUB_RUN_ID-GITHUB_RUN_ATTEMPT');
  }
  return {
    sourceRepo,
    tag,
    generation,
    assets: validateAssetPayload(assets),
  };
}

export function validateOfficialLatest(release, expectedTag, expectedReleaseId = null) {
  if (release === null || typeof release !== 'object' || Array.isArray(release)) {
    fail('GitHub releases/latest returned a non-object response');
  }
  if (
    !isValidReleaseId(release.id) ||
    release.draft !== false ||
    release.prerelease !== false ||
    release.tag_name !== expectedTag
  ) {
    fail(`GitHub releases/latest is not the expected official non-draft, non-prerelease ${expectedTag}`);
  }
  if (expectedReleaseId !== null && release.id !== expectedReleaseId) {
    fail(`GitHub releases/latest release id changed for ${expectedTag}`);
  }
  return { releaseId: release.id, tag: release.tag_name };
}

export async function fetchOfficialLatest(
  sourceRepo,
  { fetchImpl = globalThis.fetch, token = process.env.GITHUB_TOKEN } = {}
) {
  if (!isValidSourceRepo(sourceRepo)) fail('refusing to query GitHub for a non-allowlisted repository');
  if (typeof fetchImpl !== 'function') fail('Node fetch is unavailable');
  const headers = {
    accept: 'application/vnd.github+json',
    'user-agent': 'lingtai-web-release-mirror',
    'x-github-api-version': '2022-11-28',
  };
  if (token) headers.authorization = `Bearer ${token}`;
  const response = await fetchImpl(`${GITHUB_API_ROOT}/repos/${sourceRepo}/releases/latest`, { headers });
  if (!response || response.ok !== true) {
    const status = response && Number.isInteger(response.status) ? ` (HTTP ${response.status})` : '';
    fail(`GitHub releases/latest request failed${status}`);
  }
  try {
    return await response.json();
  } catch (error) {
    fail('GitHub releases/latest returned invalid JSON', { cause: error });
  }
}

function makeCandidate(request, releaseId) {
  return {
    release_id: releaseId,
    tag: request.tag,
    generation: request.generation,
    assets: request.assets.map((asset) => ({
      ...asset,
      storage_key: generationObjectKey(request.sourceRepo, request.tag, request.generation, asset.name),
    })),
  };
}

async function readCurrentState(dependencies, sourceRepo) {
  const input = await dependencies.readState(sourceRepo);
  if (input === null) return { exists: false, state: createEmptyMirrorState(sourceRepo) };
  return { exists: true, state: parseMirrorState(input, sourceRepo) };
}

async function inspectFailedPut(dependencies, sourceRepo, desired, prior, phase, writeError) {
  let observed;
  try {
    observed = await readCurrentState(dependencies, sourceRepo);
  } catch (readError) {
    unsafeStateOutcome(`${phase} put outcome is unknown; state could not be read and validated, so no deletion is safe`, {
      cause: new AggregateError([writeError, readError]),
    });
  }
  if (statesEqual(observed.state, desired)) return 'desired';
  if (statesEqual(observed.state, prior)) return 'prior';
  unsafeStateOutcome(`${phase} put outcome is unsafe; observed state matches neither the prior nor desired state, so no deletion is safe`, {
    cause: writeError,
  });
}

async function writeStateRecoveringAcknowledgement(
  dependencies,
  sourceRepo,
  desired,
  prior,
  phase
) {
  const validatedDesired = parseMirrorState(desired, sourceRepo);
  try {
    await dependencies.writeState(sourceRepo, validatedDesired);
    return;
  } catch (writeError) {
    const outcome = await inspectFailedPut(
      dependencies,
      sourceRepo,
      validatedDesired,
      prior,
      phase,
      writeError
    );
    if (outcome === 'desired') return;
    fail(`${phase} state put failed without changing the prior state`, { cause: writeError });
  }
}

async function recoverPendingDelete(dependencies, sourceRepo, state) {
  if (state.pending_delete === null) return state;
  for (const key of state.pending_delete.keys) await dependencies.deleteObject(key);
  const cleared = { ...state, pending_delete: null };
  await writeStateRecoveringAcknowledgement(
    dependencies,
    sourceRepo,
    cleared,
    state,
    'pending-delete recovery'
  );
  return cleared;
}

async function cleanUnpromotedCandidate(dependencies, sourceRepo, prepared, candidateKeys) {
  const observed = await readCurrentState(dependencies, sourceRepo);
  if (!statesEqual(observed.state, prepared)) {
    fail('unpromoted-candidate recovery refused deletion because state no longer equals the prepared state');
  }
  for (const key of candidateKeys) await dependencies.deleteObject(key);
  const cleared = { ...prepared, pending_delete: null };
  await writeStateRecoveringAcknowledgement(
    dependencies,
    sourceRepo,
    cleared,
    prepared,
    'unpromoted-candidate cleanup'
  );
}

export async function syncLatestRelease(input, dependencies) {
  const request = validateSyncRequest(input);
  for (const required of ['readState', 'writeState', 'deleteObject', 'uploadAsset', 'fetchLatest']) {
    if (typeof dependencies?.[required] !== 'function') fail(`missing sync dependency: ${required}`);
  }

  let { state } = await readCurrentState(dependencies, request.sourceRepo);
  state = await recoverPendingDelete(dependencies, request.sourceRepo, state);
  const firstInitialization = state.latest === null;

  const firstRelease = validateOfficialLatest(
    await dependencies.fetchLatest(request.sourceRepo),
    request.tag
  );
  const candidate = makeCandidate(request, firstRelease.releaseId);
  const candidateKeys = candidate.assets.map((asset) => asset.storage_key);
  const activeKeys = new Set(state.latest?.assets.map((asset) => asset.storage_key) ?? []);
  if (candidateKeys.some((key) => activeKeys.has(key))) {
    fail('workflow generation collides with active storage; refusing to overwrite served bytes');
  }

  const prepared = parseMirrorState(
    {
      schema: MIRROR_STATE_SCHEMA,
      source_repo: request.sourceRepo,
      latest: state.latest,
      pending_delete: { keys: candidateKeys },
    },
    request.sourceRepo
  );
  await writeStateRecoveringAcknowledgement(
    dependencies,
    request.sourceRepo,
    prepared,
    state,
    'candidate prepare'
  );

  let switched = false;
  try {
    for (const asset of request.assets) {
      await dependencies.uploadAsset({
        sourceRepo: request.sourceRepo,
        tag: request.tag,
        generation: request.generation,
        asset,
      });
    }

    let beforePromotion;
    try {
      beforePromotion = await readCurrentState(dependencies, request.sourceRepo);
    } catch (readError) {
      unsafeStateOutcome('state is unreadable after candidate upload; refusing promotion without deletion', {
        cause: readError,
      });
    }
    if (!beforePromotion.exists || !statesEqual(beforePromotion.state, prepared)) {
      unsafeStateOutcome('state changed after candidate upload; refusing promotion without deletion');
    }
    validateOfficialLatest(
      await dependencies.fetchLatest(request.sourceRepo),
      request.tag,
      firstRelease.releaseId
    );

    const retirementKeys = [
      ...(state.latest?.assets.map((asset) => asset.storage_key) ?? []),
      ...candidate.assets.map((asset) => legacyObjectKey(request.sourceRepo, request.tag, asset.name)),
    ];
    const promoted = parseMirrorState(
      {
        schema: MIRROR_STATE_SCHEMA,
        source_repo: request.sourceRepo,
        latest: candidate,
        pending_delete: { keys: retirementKeys },
      },
      request.sourceRepo
    );

    try {
      await dependencies.writeState(request.sourceRepo, promoted);
      switched = true;
    } catch (writeError) {
      const outcome = await inspectFailedPut(
        dependencies,
        request.sourceRepo,
        promoted,
        prepared,
        'candidate promotion',
        writeError
      );
      if (outcome === 'desired') {
        switched = true;
      } else {
        fail('candidate promotion put failed; the prepared candidate remains inactive', { cause: writeError });
      }
    }

    if (firstInitialization) {
      console.log(
        'First latest promoted; named legacy retirement remains pending until the state-aware route is public and current latest is re-dispatched.'
      );
      return promoted;
    }

    for (const key of retirementKeys) await dependencies.deleteObject(key);
    const finished = { ...promoted, pending_delete: null };
    await writeStateRecoveringAcknowledgement(
      dependencies,
      request.sourceRepo,
      finished,
      promoted,
      'retirement completion'
    );
    return finished;
  } catch (error) {
    if (!switched && error.skipCandidateCleanup !== true) {
      try {
        await cleanUnpromotedCandidate(dependencies, request.sourceRepo, prepared, candidateKeys);
      } catch (recoveryError) {
        throw new AggregateError(
          [error, recoveryError],
          `${error.message}; safe candidate recovery is incomplete: ${recoveryError.message}`
        );
      }
    }
    throw error;
  }
}

function execFileCaptured(file, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(file, args, { ...options, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

function runInherited(file, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(file, args, { ...options, stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${path.basename(file)} failed (${signal ? `signal ${signal}` : `exit ${code}`})`));
    });
  });
}

export async function createCliDependencies(environment = process.env) {
  const bucket = environment.RELEASE_MIRROR_BUCKET;
  if (!bucket) fail('RELEASE_MIRROR_BUCKET is required');
  const workdir = await mkdtemp(path.join(tmpdir(), 'lingtai-release-mirror-'));
  const wranglerFile = environment.WRANGLER_BIN || 'npx';
  const wranglerPrefix = environment.WRANGLER_BIN ? [] : ['--no-install', 'wrangler'];
  let fileCounter = 0;

  async function wrangler(args, { allowMissing = false } = {}) {
    try {
      return await execFileCaptured(wranglerFile, [...wranglerPrefix, ...args], {
        cwd: REPO_ROOT,
        env: environment,
      });
    } catch (error) {
      const output = `${error.stdout ?? ''}\n${error.stderr ?? ''}`;
      if (allowMissing && output.includes('The specified key does not exist.')) return null;
      fail(`wrangler R2 operation failed (exit ${error.code ?? 'unknown'})`, { cause: error });
    }
  }

  return {
    async readState(sourceRepo) {
      const destination = path.join(workdir, `state-read-${fileCounter++}.json`);
      const result = await wrangler(
        ['r2', 'object', 'get', `${bucket}/${stateObjectKey(sourceRepo)}`, '--file', destination, '--remote'],
        { allowMissing: true }
      );
      if (result === null) return null;
      return readFile(destination, 'utf8');
    },
    async writeState(sourceRepo, state) {
      const source = path.join(workdir, `state-write-${fileCounter++}.json`);
      await writeFile(source, `${JSON.stringify(state)}\n`, { encoding: 'utf8', mode: 0o600 });
      await wrangler([
        'r2',
        'object',
        'put',
        `${bucket}/${stateObjectKey(sourceRepo)}`,
        '--file',
        source,
        '--content-type',
        'application/json',
        '--remote',
      ]);
    },
    async deleteObject(key) {
      await wrangler(['r2', 'object', 'delete', `${bucket}/${key}`, '--remote']);
    },
    async uploadAsset({ sourceRepo, tag, generation, asset }) {
      await runInherited(ASSET_SYNC_SCRIPT, [], {
        cwd: REPO_ROOT,
        env: {
          ...environment,
          SOURCE_REPO: sourceRepo,
          TAG: tag,
          GENERATION: generation,
          ASSET_NAME: asset.name,
          EXPECTED_SHA256: asset.sha256,
          EXPECTED_SIZE: String(asset.size),
        },
      });
    },
    fetchLatest(sourceRepo) {
      return fetchOfficialLatest(sourceRepo, { token: environment.GITHUB_TOKEN });
    },
    async close() {
      await rm(workdir, { recursive: true });
    },
  };
}

async function main() {
  let assets;
  try {
    assets = JSON.parse(process.env.ASSETS_JSON ?? '');
  } catch {
    fail('ASSETS_JSON must be valid JSON');
  }
  const dependencies = await createCliDependencies();
  try {
    const state = await syncLatestRelease(
      {
        sourceRepo: process.env.SOURCE_REPO,
        tag: process.env.TAG,
        generation: process.env.GENERATION,
        assets,
      },
      dependencies
    );
    console.log(`OK: ${state.source_repo}@${state.latest.tag} is the active mirrored release`);
  } finally {
    await dependencies.close();
  }
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch((error) => {
    console.error(`::error::${error.message}`);
    process.exitCode = 1;
  });
}
