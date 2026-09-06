// Pure logic for the release-mirror download route (docs/release-mirror/CONTRACT.md).
// Kept free of Astro/Cloudflare types so it can be exercised directly by
// scripts/test-release-mirror-route.mjs with a plain `node` invocation --
// the route file itself is a thin Astro/Cloudflare-binding adapter around
// these functions.

// The same two upstreams scripts/sync-release-asset.sh allows. One explicit
// list, not a config toggle: a third source is a product decision.
export const ALLOWED_SOURCE_REPOS = new Set([
  'Lingtai-AI/lingtai-kernel',
  'Lingtai-AI/lingtai',
]);

const TAG_RE = /^v[0-9]+\.[0-9]+\.[0-9]+$/;
const ASSET_RE = /^[A-Za-z0-9._+-]+$/;

export function isAllowedSourceRepo(owner, repo) {
  return ALLOWED_SOURCE_REPOS.has(`${owner}/${repo}`);
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

// Must match the object key scripts/sync-release-asset.sh writes:
// releases/<owner>/<repo>/<tag>/<asset>.
export function mirrorObjectKey(owner, repo, tag, asset) {
  return `releases/${owner}/${repo}/${tag}/${asset}`;
}

/**
 * Resolve one request's route params into either a rejection or the exact R2
 * key to serve. Never falls back to a different version or repo, and never
 * lists a bucket -- one exact key in, one exact object out.
 * @param {{owner?: string, repo?: string, tag?: string, asset?: string}} params
 * @returns {{ok: true, key: string} | {ok: false, status: number, body: string}}
 */
export function resolveDownloadRequest(params) {
  const { owner, repo, tag, asset } = params;
  if (!owner || !repo || !isAllowedSourceRepo(owner, repo)) {
    return { ok: false, status: 404, body: 'Not found' };
  }
  if (!isValidTag(tag)) {
    return { ok: false, status: 404, body: 'Not found' };
  }
  if (!isValidAssetName(asset)) {
    return { ok: false, status: 404, body: 'Not found' };
  }
  return { ok: true, key: mirrorObjectKey(owner, repo, tag, asset) };
}
