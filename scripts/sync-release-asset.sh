#!/usr/bin/env bash
# For coding-agent maintainers:
# - Read docs/release-mirror/CONTRACT.md and docs/release-mirror/ANATOMY.md before changing
#   this file, its receiving workflow (.github/workflows/mirror-release-assets.yml),
#   or the download route (src/pages/dl/[owner]/[repo]/[tag]/[asset].ts).
# - This script mirrors exactly ONE already-published GitHub release asset into
#   the Cloudflare R2 download-acceleration bucket. It never invents a version,
#   never lists a release's assets itself, and never uploads bytes it has not
#   independently re-verified against the caller-supplied digest.
#
# Inputs (environment variables, all required unless noted):
#   SOURCE_REPO        "owner/repo" — must be one of the hardcoded allowlist
#                      entries below. This is the single source-repo allowlist;
#                      it is not configurable, so a compromised or mistaken
#                      caller cannot redirect this script at an arbitrary repo.
#   TAG                exact "vX.Y.Z" release tag. Never "latest".
#   ASSET_NAME         exact release asset filename (basename only).
#   EXPECTED_SHA256    64 lowercase hex chars; the byte digest this asset must
#                      have. Sourced from the publisher's own release manifest,
#                      never re-derived here.
#   EXPECTED_SIZE      optional exact byte size. When set, a size mismatch is
#                      rejected before the sha256 check even runs.
#   RELEASE_MIRROR_BUCKET       target R2 bucket name.
#   CLOUDFLARE_API_TOKEN        wrangler auth (not read directly by this script;
#                                consumed by the wrangler subprocess).
#   CLOUDFLARE_ACCOUNT_ID       wrangler account scope (same as above).
#   WRANGLER_BIN                optional override for the wrangler invocation,
#                                e.g. a fixture stub used by
#                                scripts/test-sync-release-asset.sh. Defaults to
#                                "npx --no-install wrangler".
#
# Object key: releases/<SOURCE_REPO>/<TAG>/<ASSET_NAME> — tag-scoped, so two
# different releases (or repos) can never collide. This script always
# verifies THIS invocation's downloaded bytes against THIS invocation's
# EXPECTED_SHA256 before uploading, so it never uploads bytes that disagree
# with its own caller-supplied digest -- but it does NOT guarantee the key's
# content is stable across separate invocations: if a publisher re-dispatches
# the same tag/asset with a genuinely different digest (e.g. a regenerated
# manifest file with a fresh timestamp), this script will overwrite the
# existing object with those new, verified bytes. Callers/consumers must not
# treat a tag-scoped key as long-lived-immutable content.
set -euo pipefail

# Lingtai-AI/lingtai-kernel and Lingtai-AI/lingtai are the two actual upstream
# release sources this mirror serves. Adding a third source is a product
# decision, not a config toggle -- change this list deliberately, in a
# reviewed PR, never via an environment variable.
ALLOWED_REPOS="Lingtai-AI/lingtai-kernel Lingtai-AI/lingtai"

fail() {
  echo "::error::$*" >&2
  exit 1
}

: "${SOURCE_REPO:?SOURCE_REPO is required}"
: "${TAG:?TAG is required}"
: "${ASSET_NAME:?ASSET_NAME is required}"
: "${EXPECTED_SHA256:?EXPECTED_SHA256 is required}"
: "${RELEASE_MIRROR_BUCKET:?RELEASE_MIRROR_BUCKET is required}"

allowed=0
for repo in $ALLOWED_REPOS; do
  if [ "$repo" = "$SOURCE_REPO" ]; then
    allowed=1
    break
  fi
done
[ "$allowed" -eq 1 ] || fail "SOURCE_REPO '$SOURCE_REPO' is not in the allowlist ($ALLOWED_REPOS)"

# A glob (case ... v[0-9]*.[0-9]*.[0-9]*) would also accept "v1.0.8-rc1" --
# glob "*" matches any characters, not "more digits". Use bash's anchored
# regex operator instead, matching the route's own strict TAG_RE exactly
# (src/lib/release-mirror.mjs).
[[ "$TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]] || fail "TAG '$TAG' is not an exact vX.Y.Z release tag"

case "$ASSET_NAME" in
  */*|.*|*..*) fail "ASSET_NAME '$ASSET_NAME' is not a safe basename" ;;
esac
case "$ASSET_NAME" in
  *[!A-Za-z0-9._+-]*) fail "ASSET_NAME '$ASSET_NAME' contains unsupported characters" ;;
esac

case "$EXPECTED_SHA256" in
  [0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]) ;;
  *) fail "EXPECTED_SHA256 '$EXPECTED_SHA256' is not 64 lowercase hex characters" ;;
esac

if [ -n "${EXPECTED_SIZE:-}" ]; then
  case "$EXPECTED_SIZE" in
    ''|*[!0-9]*) fail "EXPECTED_SIZE '$EXPECTED_SIZE' is not a positive integer" ;;
  esac
fi

WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT
DEST="$WORKDIR/$ASSET_NAME"

# The public, unauthenticated download URL for a named asset on an existing
# GitHub release of a public repo. No token is used or needed to read it.
SOURCE_URL="https://github.com/$SOURCE_REPO/releases/download/$TAG/$ASSET_NAME"

echo "Downloading $SOURCE_URL"
# -f: turn a 4xx/5xx into a nonzero exit instead of saving an error body as
# though it were the asset. Retries handle transient network flakiness only;
# a genuinely missing/renamed asset still fails loud.
curl -fSL --retry 3 --retry-delay 2 --max-time 300 "$SOURCE_URL" -o "$DEST" \
  || fail "download of $ASSET_NAME from $SOURCE_REPO@$TAG failed"

if [ ! -s "$DEST" ]; then
  fail "$ASSET_NAME downloaded empty"
fi

ACTUAL_SIZE="$(wc -c < "$DEST" | tr -d ' ')"
if [ -n "${EXPECTED_SIZE:-}" ] && [ "$ACTUAL_SIZE" != "$EXPECTED_SIZE" ]; then
  fail "$ASSET_NAME size mismatch: expected $EXPECTED_SIZE bytes, got $ACTUAL_SIZE bytes -- refusing to upload a truncated/corrupt download"
fi

ACTUAL_SHA256="$(shasum -a 256 "$DEST" | cut -d' ' -f1)"
if [ "$ACTUAL_SHA256" != "$EXPECTED_SHA256" ]; then
  fail "$ASSET_NAME sha256 mismatch: expected $EXPECTED_SHA256, got $ACTUAL_SHA256 -- refusing to upload bytes that disagree with the publisher's manifest"
fi

echo "Verified $ASSET_NAME: $ACTUAL_SIZE bytes, sha256=$ACTUAL_SHA256"

KEY="releases/$SOURCE_REPO/$TAG/$ASSET_NAME"
WRANGLER_BIN="${WRANGLER_BIN:-npx --no-install wrangler}"

echo "Uploading to r2://$RELEASE_MIRROR_BUCKET/$KEY"
# shellcheck disable=SC2086
$WRANGLER_BIN r2 object put "$RELEASE_MIRROR_BUCKET/$KEY" \
  --file "$DEST" \
  --content-type application/octet-stream \
  --remote \
  || fail "upload of $KEY to R2 bucket $RELEASE_MIRROR_BUCKET failed"

echo "OK: $SOURCE_REPO@$TAG/$ASSET_NAME mirrored to r2://$RELEASE_MIRROR_BUCKET/$KEY"
