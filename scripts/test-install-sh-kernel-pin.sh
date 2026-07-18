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

# The kernel manifest fallback must retry after a primary provider advertises a
# URL whose download fails, then retain the exact requested kernel tag.
valid_kernel_manifest='{"schema":"lingtai.kernel.release/v1","kernel_version":"0.17.1","kernel_tag":"v0.17.1","commit":"0123456789012345678901234567890123456789","generated_at":"2026-07-17T00:00:00Z","artifacts":[{"filename":"lingtai-0.17.1.tar.gz","sha256":"0000000000000000000000000000000000000000000000000000000000000000","kind":"sdist","python_tag":null,"abi_tag":null,"platform_tag":null}],"sdist_fallback":"lingtai-0.17.1.tar.gz"}'
invalid_kernel_manifest='{"schema":"not-a-kernel-release"}'
manifest_provider_log="$tmp/manifest-providers"
manifest_url_log="$tmp/manifest-urls"
manifest_case="download-failure"
kernel_manifest_url_for_provider() {
  local provider="$1" tag="$2"
  printf '%s %s\n' "$provider" "$tag" >> "$manifest_provider_log"
  case "${manifest_case}:${provider}" in
    download-failure:gitee) printf '%s\n' "https://fixtures.invalid/gitee-kernel-manifest-download-failure" ;;
    validation-failure:gitee) printf '%s\n' "https://fixtures.invalid/gitee-kernel-manifest-invalid" ;;
    download-failure:github|validation-failure:github) printf '%s\n' "https://fixtures.invalid/github-kernel-manifest-valid" ;;
    *) return 1 ;;
  esac
}
curl() {
  local url="${*: -1}"
  printf '%s\n' "$url" >> "$manifest_url_log"
  case "$url" in
    https://fixtures.invalid/gitee-kernel-manifest-download-failure) return 22 ;;
    https://fixtures.invalid/gitee-kernel-manifest-invalid) printf '%s' "$invalid_kernel_manifest" ;;
    https://fixtures.invalid/github-kernel-manifest-valid) printf '%s' "$valid_kernel_manifest" ;;
    *) fail "unexpected kernel manifest URL: $url" ;;
  esac
}
BUNDLE_PROVIDER="gitee"
fetch_kernel_manifest "$KERNEL_PIN_TAG" || fail "manifest download failure should retry the other provider"
assert_eq "github" "$KERNEL_MANIFEST_PROVIDER" "download-failure manifest provider"
assert_eq "$valid_kernel_manifest" "$KERNEL_MANIFEST_JSON" "download-failure manifest body"
expected_manifest_attempts="$(printf 'gitee %s\ngithub %s\n' "$KERNEL_PIN_TAG" "$KERNEL_PIN_TAG")"
assert_eq "$expected_manifest_attempts" "$(cat "$manifest_provider_log")" "download-failure provider attempts"
expected_manifest_urls="$(printf '%s\n%s\n' "https://fixtures.invalid/gitee-kernel-manifest-download-failure" "https://fixtures.invalid/github-kernel-manifest-valid")"
assert_eq "$expected_manifest_urls" "$(cat "$manifest_url_log")" "download-failure URL attempts"

# The same loop must also retry when the primary provider returns a body that
# fails strict validation; the winning provider still serves the same tag.
manifest_case="validation-failure"
: > "$manifest_provider_log"
: > "$manifest_url_log"
fetch_kernel_manifest "$KERNEL_PIN_TAG" || fail "strict validation failure should retry the other provider"
assert_eq "github" "$KERNEL_MANIFEST_PROVIDER" "validation-failure manifest provider"
assert_eq "$valid_kernel_manifest" "$KERNEL_MANIFEST_JSON" "validation-failure manifest body"
assert_eq "$expected_manifest_attempts" "$(cat "$manifest_provider_log")" "validation-failure provider attempts"
expected_manifest_urls="$(printf '%s\n%s\n' "https://fixtures.invalid/gitee-kernel-manifest-invalid" "https://fixtures.invalid/github-kernel-manifest-valid")"
assert_eq "$expected_manifest_urls" "$(cat "$manifest_url_log")" "validation-failure URL attempts"

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
