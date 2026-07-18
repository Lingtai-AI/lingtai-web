#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export LINGTAI_INSTALL_SH_SOURCE_ONLY=1
# shellcheck source=../public/install.sh
source "$ROOT_DIR/public/install.sh"
unset LINGTAI_INSTALL_SH_SOURCE_ONLY

fail() {
  echo "test-install-sh-kernel-pin: $*" >&2
  exit 1
}

assert_eq() {
  local want="$1" got="$2" label="$3"
  [[ "$got" == "$want" ]] || fail "$label: got '$got', want '$want'"
}

tmp="$(mktemp -d "${TMPDIR:-/tmp}/lingtai-web-pin-test.XXXXXX")"
trap 'rm -rf "$tmp"' EXIT

tui_tag="${LINGTAI_TEST_TUI_TAG:-v9.8.7}"
valid_pin='{"schema":"lingtai.tui.kernel-pin/v1","kernel_tag":"v0.17.1","comment":"release-owned pin"}'
assert_eq "v0.17.1" "$(parse_kernel_pin_manifest "$valid_pin")" "strict pin parser"
if parse_kernel_pin_manifest '{"schema":"lingtai.tui.kernel-pin/v1","kernel_tag":"v0.17.1","comment":"x","extra":1}' >/dev/null 2>&1; then
  fail "strict pin parser accepted an extra key"
fi
if parse_kernel_pin_manifest '{"schema":"lingtai.tui.kernel-pin/v1","kernel_tag":"latest","comment":"x"}' >/dev/null 2>&1; then
  fail "strict pin parser accepted an unversioned kernel tag"
fi
if parse_kernel_pin_manifest '{"schema":"lingtai.tui.kernel-pin/v1","kernel_tag":"v0.17.1"}' >/dev/null 2>&1; then
  fail "strict pin parser accepted a missing required comment"
fi

url_log="$tmp/urls"
curl() {
  local url="${*: -1}"
  printf '%s\n' "$url" >> "$url_log"
  case "$url" in
    "https://gitee.com/${GITEE_OWNER}/${GITEE_REPO}/raw/${tui_tag}/kernel-release.json") return 22 ;;
    "https://raw.githubusercontent.com/${REPO_SLUG}/${tui_tag}/kernel-release.json")
      printf '%s' "$valid_pin"
      ;;
    *) fail "unexpected pin URL: $url" ;;
  esac
}

BUNDLE_PROVIDER="gitee"
KERNEL_PIN_JSON=""
KERNEL_PIN_TAG=""
KERNEL_PIN_PROVIDER=""
KERNEL_PIN_TUI_TAG=""
fetch_kernel_pin "$tui_tag" || fail "same-tag GitHub fallback should resolve the source pin"
assert_eq "v0.17.1" "$KERNEL_PIN_TAG" "resolved kernel tag"
assert_eq "github" "$KERNEL_PIN_PROVIDER" "resolved pin provider"
assert_eq "$tui_tag" "$KERNEL_PIN_TUI_TAG" "resolved TUI tag"
assert_eq "2" "$(wc -l < "$url_log" | tr -d ' ')" "pin URL attempt count"
if grep -q 'latest' "$url_log"; then
  fail "pin fallback re-resolved latest instead of reusing the exact TUI tag"
fi

# The verified bundle remains first priority whenever it exists.
BUNDLE_MANIFEST_JSON="present"
BUNDLE_MANIFEST_KERNEL_TAG="v0.16.0"
assert_eq "v0.16.0" "$(kernel_tag_for_install)" "bundle install tag priority"
assert_eq "bundle" "$(kernel_source_for_install)" "bundle install source priority"
BUNDLE_MANIFEST_JSON=""
assert_eq "v0.17.1" "$(kernel_tag_for_install)" "release-pin install tag"
assert_eq "release-pin" "$(kernel_source_for_install)" "release-pin install source"

# Prove the release-pin path reaches the existing verified artifact installer,
# selects a local artifact, and never passes package name `lingtai` to pip.
BUILD_DIR="$tmp/build"
fetch_kernel_manifest() {
  KERNEL_MANIFEST_PROVIDER="github"
  KERNEL_MANIFEST_JSON='{"kernel_version":"0.17.1"}'
}
select_kernel_wheel() {
  printf '%s %s\n' "lingtai-0.17.1-cp311-cp311-manylinux_2_17_x86_64.whl" "fixture-sha"
}
kernel_artifact_download_url() {
  printf '%s\n' "https://fixtures.invalid/kernel.whl"
}
verify_sha256() { return 0; }

fake_python="$tmp/python"
pip_log="$tmp/pip-args"
cat > "$fake_python" <<EOF
#!/usr/bin/env bash
printf '%s\n' "\$*" >> "$pip_log"
exit 0
EOF
chmod +x "$fake_python"
curl() {
  local url="${*: -1}" previous="" output="" arg
  for arg in "$@"; do
    if [[ "$previous" == "-o" ]]; then output="$arg"; break; fi
    previous="$arg"
  done
  [[ "$url" == "https://fixtures.invalid/kernel.whl" && -n "$output" ]] || fail "unexpected artifact download: $url"
  printf '%s' "fixture artifact" > "$output"
}

KERNEL_SOURCE=""
KERNEL_RELEASE_TAG=""
KERNEL_PROVIDER=""
BUNDLE_MANIFEST_JSON=""
install_kernel_from_bundle "$fake_python" "" || fail "release-pin artifact install should reuse bundle machinery"
assert_eq "release-pin" "$KERNEL_SOURCE" "installed kernel source"
assert_eq "v0.17.1" "$KERNEL_RELEASE_TAG" "installed kernel release tag"
assert_eq "github" "$KERNEL_PROVIDER" "installed kernel provider"
if grep -Eq '(^|[[:space:]])lingtai([[:space:]]|$)' "$pip_log"; then
  fail "artifact install passed package name lingtai to pip: $(cat "$pip_log")"
fi
if ! grep -Fq "$BUILD_DIR/kernel-artifact/lingtai-0.17.1-cp311-cp311-manylinux_2_17_x86_64.whl" "$pip_log"; then
  fail "artifact install did not pass the downloaded local path to pip"
fi

meta_dir="$tmp/meta"
KERNEL_SOURCE="release-pin"
KERNEL_RELEASE_TAG="v0.17.1"
KERNEL_VERSION_INSTALLED="0.17.1"
KERNEL_PROVIDER="github"
BUNDLE_TAG="$tui_tag"
KERNEL_PIN_TUI_TAG="$tui_tag"
write_install_metadata "$meta_dir" "$tmp/prefix" "$tmp/bin" "$REPO" "$tui_tag" "$tui_tag" "0123456789012345678901234567890123456789" "$tui_tag" "$tmp/bin/lingtai-tui" ""
python3 - "$meta_dir/install.json" "$tui_tag" <<'PY'
import json, sys
p = json.load(open(sys.argv[1]))
assert p["kernel_source"] == "release-pin", p
assert p["kernel_release_tag"] == "v0.17.1", p
assert p["kernel_version"] == "0.17.1", p
assert p["kernel_provider"] == "github", p
assert p["tui_release_tag"] == sys.argv[2], p
assert "kernel_bundle_id" not in p, p
PY

printf '%s\n' "test-install-sh-kernel-pin: PASS"
