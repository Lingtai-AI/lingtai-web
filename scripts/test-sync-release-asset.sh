#!/usr/bin/env bash
# LOCAL/fixture acceptance test for scripts/sync-release-asset.sh.
#
# Does not hit github.com or a real Cloudflare account. A fixture `curl` on
# PATH stands in for the GitHub asset transport (the script itself has no
# override hook for its source host -- it is a hardcoded allowlisted repo
# list, not attacker-configurable -- so faking the transport this way is the
# only way to test it without a real network dependency), and a fake
# `wrangler` records its argv instead of talking to Cloudflare. This proves
# the script's own validation, download-then-verify, and upload-invocation
# logic; it is not proof of real github.com reachability or a real R2 upload.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT="$REPO_ROOT/scripts/sync-release-asset.sh"

WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

fail() { echo "FAIL: $*" >&2; exit 1; }
pass() { echo "ok - $*"; }

ASSET_NAME="lingtai-v1.0.8-windows-amd64.zip"
printf 'fixture-release-bytes-%s' "$(date +%s)" > "$WORKDIR/fixture-asset"
GOOD_SHA256="$(shasum -a 256 "$WORKDIR/fixture-asset" | cut -d' ' -f1)"
GOOD_SIZE="$(wc -c < "$WORKDIR/fixture-asset" | tr -d ' ')"

# --- Fixture "good" curl: always returns the correct fixture bytes -------
mkdir -p "$WORKDIR/bin-good"
cat > "$WORKDIR/bin-good/curl" << CURL_STUB
#!/usr/bin/env bash
set -euo pipefail
dest=""
prev=""
for a in "\$@"; do
  if [ "\$prev" = "-o" ]; then dest="\$a"; fi
  prev="\$a"
done
[ -n "\$dest" ] || { echo "fixture curl: no -o destination" >&2; exit 2; }
cp "$WORKDIR/fixture-asset" "\$dest"
CURL_STUB
chmod +x "$WORKDIR/bin-good/curl"

# --- Fixture "corrupt" curl: always returns wrong bytes -------------------
mkdir -p "$WORKDIR/bin-corrupt"
cat > "$WORKDIR/bin-corrupt/curl" << CURL_STUB
#!/usr/bin/env bash
set -euo pipefail
dest=""
prev=""
for a in "\$@"; do
  if [ "\$prev" = "-o" ]; then dest="\$a"; fi
  prev="\$a"
done
printf 'corrupted-bytes-not-matching-digest' > "\$dest"
CURL_STUB
chmod +x "$WORKDIR/bin-corrupt/curl"

# --- Fake wrangler recording its invocation -------------------------------
mkdir -p "$WORKDIR/bin-wrangler"
cat > "$WORKDIR/bin-wrangler/fake-wrangler" << 'WRANGLER_STUB'
#!/usr/bin/env bash
set -euo pipefail
echo "$@" >> "$FAKE_WRANGLER_LOG"
WRANGLER_STUB
chmod +x "$WORKDIR/bin-wrangler/fake-wrangler"

WRANGLER_LOG="$WORKDIR/wrangler.log"

run() {
  local curl_bin_dir="$1"; shift
  env -i \
    PATH="$curl_bin_dir:$WORKDIR/bin-wrangler:/usr/bin:/bin" \
    WRANGLER_BIN="$WORKDIR/bin-wrangler/fake-wrangler" \
    FAKE_WRANGLER_LOG="$WRANGLER_LOG" \
    RELEASE_MIRROR_BUCKET="test-bucket" \
    "$@" \
    "$SCRIPT"
}

# --- Test 1: happy path ----------------------------------------------------
rm -f "$WRANGLER_LOG"
if OUT="$(run "$WORKDIR/bin-good" \
    SOURCE_REPO="Lingtai-AI/lingtai" TAG="v1.0.8" ASSET_NAME="$ASSET_NAME" \
    EXPECTED_SHA256="$GOOD_SHA256" EXPECTED_SIZE="$GOOD_SIZE" 2>&1)"; then
  pass "happy path exits 0"
else
  echo "$OUT" >&2
  fail "happy path should have succeeded"
fi
grep -q "r2 object put test-bucket/releases/Lingtai-AI/lingtai/v1.0.8/$ASSET_NAME" "$WRANGLER_LOG" \
  || fail "wrangler was not invoked with the expected tag-scoped key"
pass "wrangler received the correct tag-scoped object key"

# --- Test 2: disallowed source repo is rejected before any download ------
rm -f "$WRANGLER_LOG"
if run "$WORKDIR/bin-good" \
    SOURCE_REPO="some-attacker/arbitrary-repo" TAG="v1.0.8" ASSET_NAME="$ASSET_NAME" \
    EXPECTED_SHA256="$GOOD_SHA256" > /dev/null 2>&1; then
  fail "disallowed source repo must be rejected"
fi
[ ! -f "$WRANGLER_LOG" ] || fail "wrangler must never run for a disallowed repo"
pass "disallowed source repo is rejected before any network/upload action"

# --- Test 3: checksum mismatch is rejected before upload ------------------
rm -f "$WRANGLER_LOG"
if OUT="$(run "$WORKDIR/bin-corrupt" \
    SOURCE_REPO="Lingtai-AI/lingtai" TAG="v1.0.8" ASSET_NAME="$ASSET_NAME" \
    EXPECTED_SHA256="$GOOD_SHA256" 2>&1)"; then
  echo "$OUT" >&2
  fail "corrupted download must be rejected, not uploaded"
fi
[ ! -f "$WRANGLER_LOG" ] || fail "wrangler must never run when the sha256 check fails"
echo "$OUT" | grep -qi "sha256 mismatch" || { echo "$OUT" >&2; fail "expected a clear sha256 mismatch error"; }
pass "sha256 mismatch is rejected before upload, with a clear error"

# --- Test 4: bad tag format is rejected ------------------------------------
if run "$WORKDIR/bin-good" \
    SOURCE_REPO="Lingtai-AI/lingtai" TAG="latest" ASSET_NAME="$ASSET_NAME" \
    EXPECTED_SHA256="$GOOD_SHA256" > /dev/null 2>&1; then
  fail "'latest' must never be accepted as a tag"
fi
pass "'latest' (or any non-vX.Y.Z tag) is rejected"

# A pre-release-suffixed tag would pass a loose glob like
# `v[0-9]*.[0-9]*.[0-9]*` (glob "*" matches any characters, not "more
# digits"), but must still be rejected by the real anchored regex check.
if run "$WORKDIR/bin-good" \
    SOURCE_REPO="Lingtai-AI/lingtai" TAG="v1.0.8-rc1" ASSET_NAME="$ASSET_NAME" \
    EXPECTED_SHA256="$GOOD_SHA256" > /dev/null 2>&1; then
  fail "'v1.0.8-rc1' must be rejected (not an exact vX.Y.Z tag)"
fi
pass "a pre-release-suffixed tag that a loose glob would accept is rejected"

# --- Test 5: path traversal in asset name is rejected ----------------------
if run "$WORKDIR/bin-good" \
    SOURCE_REPO="Lingtai-AI/lingtai" TAG="v1.0.8" ASSET_NAME="../../etc/passwd" \
    EXPECTED_SHA256="$GOOD_SHA256" > /dev/null 2>&1; then
  fail "path-traversal asset name must be rejected"
fi
pass "path-traversal asset name is rejected"

# --- Test 6: size mismatch is rejected before upload -----------------------
rm -f "$WRANGLER_LOG"
if run "$WORKDIR/bin-good" \
    SOURCE_REPO="Lingtai-AI/lingtai" TAG="v1.0.8" ASSET_NAME="$ASSET_NAME" \
    EXPECTED_SHA256="$GOOD_SHA256" EXPECTED_SIZE="99999999" > /dev/null 2>&1; then
  fail "size mismatch must be rejected"
fi
[ ! -f "$WRANGLER_LOG" ] || fail "wrangler must never run when the size check fails"
pass "size mismatch is rejected before upload"

echo
echo "PASS: sync-release-asset.sh fixture suite"
