// Shared pure validation and selection for the latest-only release mirror.
// Framework and transport adapters live in the Astro routes and sync script;
// this module owns the one validated state shape they both trust.

export const ALLOWED_SOURCE_REPOS = new Set([
  'Lingtai-AI/lingtai-kernel',
  'Lingtai-AI/lingtai',
]);

export const MIRROR_STATE_SCHEMA = 'lingtai.release_mirror.state/v1';
export const LATEST_SCHEMA = 'lingtai.release_mirror.latest/v1';

const TAG_RE = /^v[0-9]+\.[0-9]+\.[0-9]+$/;
const ASSET_RE = /^[A-Za-z0-9._+-]+$/;
const SHA256_RE = /^[0-9a-f]{64}$/;
const GENERATION_RE = /^[1-9][0-9]*-[1-9][0-9]*$/;

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasExactKeys(value, keys) {
  if (!isPlainObject(value)) return false;
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function sourceParts(sourceRepo) {
  if (typeof sourceRepo !== 'string') return null;
  const parts = sourceRepo.split('/');
  if (parts.length !== 2 || !ALLOWED_SOURCE_REPOS.has(sourceRepo)) return null;
  return parts;
}

function invalid(message) {
  throw new Error(`invalid release mirror data: ${message}`);
}

export function isAllowedSourceRepo(owner, repo) {
  return typeof owner === 'string' && typeof repo === 'string' && ALLOWED_SOURCE_REPOS.has(`${owner}/${repo}`);
}

export function isValidSourceRepo(sourceRepo) {
  return sourceParts(sourceRepo) !== null;
}

export function isValidTag(tag) {
  return typeof tag === 'string' && TAG_RE.test(tag);
}

export function isValidAssetName(asset) {
  return (
    typeof asset === 'string' &&
    ASSET_RE.test(asset) &&
    !asset.includes('..') &&
    !asset.startsWith('.')
  );
}

export function isValidSha256(sha256) {
  return typeof sha256 === 'string' && SHA256_RE.test(sha256);
}

export function isValidSize(size) {
  return Number.isSafeInteger(size) && size > 0;
}

export function isValidReleaseId(releaseId) {
  return Number.isSafeInteger(releaseId) && releaseId > 0;
}

export function isValidGeneration(generation) {
  return typeof generation === 'string' && GENERATION_RE.test(generation);
}

export function stateObjectKey(sourceRepo) {
  if (!isValidSourceRepo(sourceRepo)) invalid('source_repo is not allowlisted');
  return `releases/${sourceRepo}/state.json`;
}

export function generationObjectKey(sourceRepo, tag, generation, asset) {
  if (!isValidSourceRepo(sourceRepo)) invalid('source_repo is not allowlisted');
  if (!isValidTag(tag)) invalid('tag is not an exact vX.Y.Z');
  if (!isValidGeneration(generation)) invalid('generation is not GITHUB_RUN_ID-GITHUB_RUN_ATTEMPT');
  if (!isValidAssetName(asset)) invalid('asset name is not a safe basename');
  return `releases/${sourceRepo}/objects/${tag}/${generation}/${asset}`;
}

export function legacyObjectKey(sourceRepo, tag, asset) {
  if (!isValidSourceRepo(sourceRepo)) invalid('source_repo is not allowlisted');
  if (!isValidTag(tag)) invalid('tag is not an exact vX.Y.Z');
  if (!isValidAssetName(asset)) invalid('asset name is not a safe basename');
  return `releases/${sourceRepo}/${tag}/${asset}`;
}

export function isValidatedDeletionKey(key, sourceRepo) {
  if (typeof key !== 'string' || !isValidSourceRepo(sourceRepo)) return false;
  const prefix = `releases/${sourceRepo}/`;
  if (!key.startsWith(prefix)) return false;
  const parts = key.slice(prefix.length).split('/');
  if (parts.length === 2) {
    return isValidTag(parts[0]) && isValidAssetName(parts[1]);
  }
  if (parts.length === 4 && parts[0] === 'objects') {
    return isValidTag(parts[1]) && isValidGeneration(parts[2]) && isValidAssetName(parts[3]);
  }
  return false;
}

export function validateAssetPayload(assets) {
  if (!Array.isArray(assets) || assets.length === 0) {
    invalid('assets must be a nonempty array');
  }
  const names = new Set();
  return assets.map((asset, index) => {
    if (!hasExactKeys(asset, ['name', 'sha256', 'size'])) {
      invalid(`assets[${index}] must contain exactly name, sha256, and size`);
    }
    if (!isValidAssetName(asset.name)) invalid(`assets[${index}].name is not a safe basename`);
    if (!isValidSha256(asset.sha256)) invalid(`assets[${index}].sha256 is not lowercase SHA-256`);
    if (!isValidSize(asset.size)) invalid(`assets[${index}].size is not a positive integer`);
    if (names.has(asset.name)) invalid(`asset name ${asset.name} is duplicated`);
    names.add(asset.name);
    return { name: asset.name, sha256: asset.sha256, size: asset.size };
  });
}

export function createEmptyMirrorState(sourceRepo) {
  if (!isValidSourceRepo(sourceRepo)) invalid('source_repo is not allowlisted');
  return {
    schema: MIRROR_STATE_SCHEMA,
    source_repo: sourceRepo,
    latest: null,
    pending_delete: null,
  };
}

function validateLatest(value, sourceRepo) {
  if (!hasExactKeys(value, ['release_id', 'tag', 'generation', 'assets'])) {
    invalid('latest has unexpected or missing fields');
  }
  if (!isValidReleaseId(value.release_id)) invalid('latest.release_id is not a positive integer');
  if (!isValidTag(value.tag)) invalid('latest.tag is not an exact vX.Y.Z');
  if (!isValidGeneration(value.generation)) invalid('latest.generation is invalid');
  if (!Array.isArray(value.assets) || value.assets.length === 0) invalid('latest.assets must be nonempty');

  const names = new Set();
  const keys = new Set();
  const assets = value.assets.map((asset, index) => {
    if (!hasExactKeys(asset, ['name', 'sha256', 'size', 'storage_key'])) {
      invalid(`latest.assets[${index}] has unexpected or missing fields`);
    }
    if (!isValidAssetName(asset.name)) invalid(`latest.assets[${index}].name is invalid`);
    if (!isValidSha256(asset.sha256)) invalid(`latest.assets[${index}].sha256 is invalid`);
    if (!isValidSize(asset.size)) invalid(`latest.assets[${index}].size is invalid`);
    const expectedKey = generationObjectKey(sourceRepo, value.tag, value.generation, asset.name);
    if (asset.storage_key !== expectedKey) invalid(`latest.assets[${index}].storage_key is not exact`);
    if (names.has(asset.name)) invalid(`latest asset name ${asset.name} is duplicated`);
    if (keys.has(asset.storage_key)) invalid(`latest storage key ${asset.storage_key} is duplicated`);
    names.add(asset.name);
    keys.add(asset.storage_key);
    return {
      name: asset.name,
      sha256: asset.sha256,
      size: asset.size,
      storage_key: asset.storage_key,
    };
  });

  return {
    release_id: value.release_id,
    tag: value.tag,
    generation: value.generation,
    assets,
  };
}

function validatePendingDelete(value, sourceRepo, activeKeys) {
  if (!hasExactKeys(value, ['keys'])) invalid('pending_delete has unexpected or missing fields');
  if (!Array.isArray(value.keys) || value.keys.length === 0) invalid('pending_delete.keys must be nonempty');
  const seen = new Set();
  const keys = value.keys.map((key, index) => {
    if (!isValidatedDeletionKey(key, sourceRepo)) {
      invalid(`pending_delete.keys[${index}] is not an exact key for source_repo`);
    }
    if (activeKeys.has(key)) invalid(`pending_delete.keys[${index}] is active and cannot be deleted`);
    if (seen.has(key)) invalid(`pending_delete key ${key} is duplicated`);
    seen.add(key);
    return key;
  });
  return { keys };
}

export function parseMirrorState(input, expectedSourceRepo) {
  if (!isValidSourceRepo(expectedSourceRepo)) invalid('expected source_repo is not allowlisted');
  let value = input;
  if (typeof input === 'string') {
    try {
      value = JSON.parse(input);
    } catch {
      invalid('state is not valid JSON');
    }
  }
  if (!hasExactKeys(value, ['schema', 'source_repo', 'latest', 'pending_delete'])) {
    invalid('state has unexpected or missing fields');
  }
  if (value.schema !== MIRROR_STATE_SCHEMA) invalid('state schema is unsupported');
  if (value.source_repo !== expectedSourceRepo) invalid('state source_repo does not match its key');

  const latest = value.latest === null ? null : validateLatest(value.latest, expectedSourceRepo);
  const activeKeys = new Set(latest?.assets.map((asset) => asset.storage_key) ?? []);
  const pendingDelete =
    value.pending_delete === null
      ? null
      : validatePendingDelete(value.pending_delete, expectedSourceRepo, activeKeys);

  return {
    schema: MIRROR_STATE_SCHEMA,
    source_repo: expectedSourceRepo,
    latest,
    pending_delete: pendingDelete,
  };
}

export function statesEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function projectPublicLatest(state) {
  const validated = parseMirrorState(state, state?.source_repo);
  if (validated.latest === null) invalid('state has no latest release');
  return {
    schema: LATEST_SCHEMA,
    source_repo: validated.source_repo,
    release_id: validated.latest.release_id,
    tag: validated.latest.tag,
    assets: validated.latest.assets.map(({ name, sha256, size }) => ({ name, sha256, size })),
  };
}

function rejectNotFound() {
  return { ok: false, status: 404, body: 'Not found' };
}

function validatedRequest(params) {
  const { owner, repo, tag, asset } = params;
  if (!isAllowedSourceRepo(owner, repo) || !isValidTag(tag) || !isValidAssetName(asset)) return null;
  return { sourceRepo: `${owner}/${repo}`, tag, asset };
}

export function resolveLegacyDownloadRequest(params) {
  const request = validatedRequest(params);
  if (request === null) return rejectNotFound();
  return { ok: true, key: legacyObjectKey(request.sourceRepo, request.tag, request.asset) };
}

export function resolveActiveDownloadRequest(params, state) {
  const request = validatedRequest(params);
  if (request === null) return rejectNotFound();
  const validated = parseMirrorState(state, request.sourceRepo);
  if (validated.latest === null || request.tag !== validated.latest.tag) return rejectNotFound();
  const activeAsset = validated.latest.assets.find((asset) => asset.name === request.asset);
  if (!activeAsset) return rejectNotFound();
  return { ok: true, key: activeAsset.storage_key, size: activeAsset.size };
}
