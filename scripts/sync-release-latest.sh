#!/usr/bin/env bash
# Publish the strict latest-release metadata consumed by LingTai installers.
# Inputs come from the same verified release-asset-published dispatch as the
# asset mirror; GitHub remains the release authority and supplies release_id.
set -euo pipefail

fail() { echo "error: $*" >&2; exit 1; }

: "${SOURCE_REPO:?SOURCE_REPO is required}"
: "${TAG:?TAG is required}"
: "${ASSETS_JSON:?ASSETS_JSON is required}"
: "${RELEASE_MIRROR_BUCKET:?RELEASE_MIRROR_BUCKET is required}"
: "${GITHUB_TOKEN:?GITHUB_TOKEN is required}"

case "$SOURCE_REPO" in
  Lingtai-AI/lingtai|Lingtai-AI/lingtai-kernel) ;;
  *) fail "unsupported source repository: $SOURCE_REPO" ;;
esac
[[ "$TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]] || fail "invalid release tag: $TAG"

WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT
printf '%s' "$ASSETS_JSON" > "$WORKDIR/assets.json"

curl -fsSL --retry 3 --retry-delay 2 --max-time 60 \
  -H 'Accept: application/vnd.github+json' \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H 'X-GitHub-Api-Version: 2022-11-28' \
  "https://api.github.com/repos/$SOURCE_REPO/releases/tags/$TAG" \
  -o "$WORKDIR/release.json" \
  || fail "could not read authoritative GitHub release $SOURCE_REPO@$TAG"

SOURCE_REPO="$SOURCE_REPO" TAG="$TAG" node - \
  "$WORKDIR/release.json" "$WORKDIR/assets.json" "$WORKDIR/latest.json" <<'NODE'
import fs from 'node:fs';

const [releasePath, assetsPath, outputPath] = process.argv.slice(2);
const sourceRepo = process.env.SOURCE_REPO;
const tag = process.env.TAG;
const release = JSON.parse(fs.readFileSync(releasePath, 'utf8'));
const inputAssets = JSON.parse(fs.readFileSync(assetsPath, 'utf8'));
const namePattern = /^[A-Za-z0-9._+-]+$/;
const shaPattern = /^[0-9a-f]{64}$/;

if (!Number.isSafeInteger(release.id) || release.id <= 0 || release.tag_name !== tag) {
  throw new Error('GitHub release id/tag does not match the dispatch');
}
if (!Array.isArray(inputAssets) || inputAssets.length === 0) {
  throw new Error('dispatch assets must be a non-empty array');
}

const seen = new Set();
const assets = inputAssets.map((asset) => {
  const keys = Object.keys(asset).sort().join(',');
  if (keys !== 'name,sha256,size') throw new Error('asset fields must be exactly name,sha256,size');
  if (
    typeof asset.name !== 'string' ||
    !namePattern.test(asset.name) ||
    asset.name.startsWith('.') ||
    asset.name.includes('..') ||
    seen.has(asset.name)
  ) throw new Error('invalid or duplicate asset name');
  if (typeof asset.sha256 !== 'string' || !shaPattern.test(asset.sha256)) {
    throw new Error(`invalid sha256 for ${asset.name}`);
  }
  if (!Number.isSafeInteger(asset.size) || asset.size <= 0) {
    throw new Error(`invalid size for ${asset.name}`);
  }
  seen.add(asset.name);
  return { name: asset.name, sha256: asset.sha256, size: asset.size };
}).sort((left, right) => left.name.localeCompare(right.name));

fs.writeFileSync(outputPath, JSON.stringify({
  schema: 'lingtai.release_mirror.latest/v1',
  source_repo: sourceRepo,
  tag,
  release_id: release.id,
  assets,
}) + '\n');
NODE

KEY="releases/$SOURCE_REPO/latest.json"
WRANGLER_BIN="${WRANGLER_BIN:-npx --no-install wrangler}"
echo "Publishing r2://$RELEASE_MIRROR_BUCKET/$KEY"
# shellcheck disable=SC2086
$WRANGLER_BIN r2 object put "$RELEASE_MIRROR_BUCKET/$KEY" \
  --file "$WORKDIR/latest.json" \
  --content-type application/json \
  --remote \
  || fail "upload of $KEY to R2 bucket $RELEASE_MIRROR_BUCKET failed"

echo "OK: $SOURCE_REPO@$TAG published as r2://$RELEASE_MIRROR_BUCKET/$KEY"
