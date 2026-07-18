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

# One-shot repair regression matrix: discovery must adopt one safe existing
# installation, reject ambiguous PATH state, and expose stale/broken runtime
# state to the same production health checks used by install.sh.
#
# discover_existing_install always probes the fixed fallback locations
# $HOME/.local/bin and /usr/local/bin regardless of PATH/HOME overrides below
# (that hardcoded fallback is pre-existing, unrelated production behavior —
# see install.sh's discover_existing_install). /usr/local/bin is outside the
# isolated $tmp tree and this test must not depend on, move, or delete
# whatever a real developer machine happens to have installed there.
# canonical_existing_dir is the shared path-safety primitive both the real
# fallback probe and this override go through, so shadowing it here to
# reject the one real absolute path keeps every other codepath (including
# the isolated repair_bin/safe_bin fixtures below) exercising unmodified
# production logic.
eval "production_canonical_existing_dir() $(declare -f canonical_existing_dir | tail -n +2)"
canonical_existing_dir() {
  [[ "$1" != "/usr/local/bin" ]] || return 1
  production_canonical_existing_dir "$@"
}
saved_home="$HOME"
saved_path="$PATH"
python3_path="$(command -v python3)"
repair_home="$tmp/repair-home"
repair_bin="$repair_home/.local/bin"
python_tool_dir="$repair_home/tools"
mkdir -p "$repair_bin" "$python_tool_dir" "$repair_home/.lingtai-tui/runtime"
ln -s "$python3_path" "$python_tool_dir/python3"
cat > "$repair_bin/lingtai-tui" <<'EOF'
#!/usr/bin/env bash
if [[ "${1:-}" == version ]]; then
  printf '%s\n' 'lingtai-tui v0.10.0'
else
  exit 1
fi
EOF
chmod +x "$repair_bin/lingtai-tui"
cat > "$repair_home/.lingtai-tui/install.json" <<EOF
{
  "schema": "lingtai.tui.install/v1",
  "schema_version": 1,
  "install_method": "source",
  "install_kind": "source-build",
  "prefix": "$repair_home",
  "bin_dir": "$repair_bin",
  "repo_url": "https://github.com/Lingtai-AI/lingtai.git",
  "requested_ref": "v0.9.0",
  "resolved_ref": "v0.9.0",
  "resolved_commit": "",
  "stamped_version": "v0.9.0",
  "installed_at": "2026-07-17T00:00:00Z",
  "managed_binaries": ["$repair_bin/lingtai-tui"]
}
EOF
export HOME="$repair_home"
export PATH="$repair_bin:$python_tool_dir:/usr/bin:/bin"
unset LINGTAI_INSTALL_METADATA || true
discover_existing_install || fail "stale metadata and older TUI should be discoverable"
repair_bin_canonical="$(cd "$repair_bin" && pwd -P)"
assert_eq "$repair_bin_canonical" "$DISCOVERED_BIN_DIR" "existing install bin discovery"
# discover_existing_install must never execute the discovered binary (blocker
# 2): DISCOVERED_CURRENT_TUI_TAG stays empty until discover_current_tui_tag
# is called explicitly post-consent.
assert_eq "" "$DISCOVERED_CURRENT_TUI_TAG" "discovery does not probe the binary version pre-consent"
assert_eq "v0.10.0" "$(discover_current_tui_tag "$DISCOVERED_BIN_DIR")" "post-consent TUI probe resolves the real version"
assert_eq "v0.9.0" "$DISCOVERED_METADATA_VERSION" "stale metadata version capture"
assert_eq "$repair_home/.lingtai-tui/runtime/venv" "$RUNTIME_VENV_DIR" "default runtime ownership"

# Existing installs must see the diagnosis and plan before mutation. Explicit
# non-interactive mode prints the same plan and is the only automation consent;
# a non-TTY default invocation fails closed instead of silently healing.
TARGET_TAG="v0.10.0"
NON_INTERACTIVE=1
print_install_plan || fail "non-interactive repair plan should be accepted"
assert_eq "1" "$INSTALL_PLAN_APPROVED" "non-interactive repair-plan consent"
NON_INTERACTIVE=0
if print_install_plan >"$tmp/interactive-plan.stdout" 2>"$tmp/interactive-plan.stderr"; then
  fail "non-TTY repair plan silently proceeded without consent"
fi
grep -q "requires interactive confirmation" "$tmp/interactive-plan.stderr" || fail "repair consent failure was not actionable"
NON_INTERACTIVE=1

# Metadata repair records the selected runtime path instead of claiming only a
# binary repair. This uses the production writer, not a test-only serializer.
RUNTIME_VENV_DIR="$repair_home/.lingtai-tui/runtime/venv-repair"
SKIP_VENV=0
write_install_metadata "$tmp/repaired-meta" "$repair_home" "$repair_bin" "$REPO" "v0.10.0" "v0.10.0" "" "v0.10.0" "$repair_bin/lingtai-tui" ""
python3 - "$tmp/repaired-meta/install.json" <<'PY'
import json, sys
p = json.load(open(sys.argv[1]))
assert p["stamped_version"] == "v0.10.0", p
assert p["runtime_venv"].endswith("/runtime/venv-repair"), p
PY

# With no metadata, exactly one absolute PATH candidate is adopted. Adding a
# second executable TUI makes the state ambiguous and must fail loud.
safe_home="$tmp/safe-home"
safe_bin="$safe_home/bin"
other_bin="$safe_home/other-bin"
mkdir -p "$safe_bin" "$other_bin"
cat > "$safe_bin/lingtai-tui" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' 'lingtai-tui v0.11.0'
EOF
cat > "$other_bin/lingtai-tui" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' 'lingtai-tui v0.12.0'
EOF
chmod +x "$safe_bin/lingtai-tui" "$other_bin/lingtai-tui"
export HOME="$safe_home"
export PATH="$safe_bin:$python_tool_dir:/usr/bin:/bin"
discover_existing_install || fail "one safe PATH installation should be adopted"
safe_bin_canonical="$(cd "$safe_bin" && pwd -P)"
assert_eq "$safe_bin_canonical" "$DISCOVERED_BIN_DIR" "single PATH install discovery"
export PATH="$safe_bin:$other_bin:$(dirname "$python3_path"):/usr/bin:/bin"
if discover_existing_install >"$tmp/ambiguous.stdout" 2>"$tmp/ambiguous.stderr"; then
  fail "ambiguous PATH installations were silently selected"
fi
grep -q "multiple installed lingtai-tui binaries" "$tmp/ambiguous.stderr" || fail "ambiguous discovery did not explain the hard stop"

# Runtime state and the exact kernel import/version postcondition are exercised
# in an isolated venv with no package-index or network access.
assert_eq "missing" "$(runtime_venv_state "$tmp/runtime-missing")" "missing runtime state"
mkdir "$tmp/runtime-broken"
assert_eq "broken" "$(runtime_venv_state "$tmp/runtime-broken")" "broken runtime state"
python3 -m venv "$tmp/runtime-healthy" || fail "test venv creation"
healthy_py="$tmp/runtime-healthy/bin/python"
site_packages="$("$healthy_py" -c 'import sysconfig; print(sysconfig.get_paths()["purelib"])')"
mkdir -p "$site_packages/lingtai"
# Keep the first and repaired source sizes different so Python cannot reuse a
# same-second timestamp-only pyc while this test intentionally rewrites it.
printf '%s\n' '__version__ = "0.16"' > "$site_packages/lingtai/__init__.py"
printf '%s\n' 'value = "kernel"' > "$site_packages/lingtai/kernel.py"
assert_eq "healthy" "$(runtime_venv_state "$tmp/runtime-healthy")" "healthy runtime state"
if runtime_health_check "$healthy_py" "0.17.1" >/dev/null 2>&1; then
  fail "wrong kernel runtime version passed the health check"
fi
printf '%s\n' '__version__ = "0.17.1"' > "$site_packages/lingtai/__init__.py"
runtime_health_check "$healthy_py" "0.17.1" >/dev/null || fail "exact kernel runtime health check failed"

export HOME="$saved_home"
export PATH="$saved_path"

# --- Blocker 1: an explicit --prefix/--bin-dir target that already holds
# installer-managed state must still be diagnosed and gated behind consent,
# not silently overwritten. Explicit destination remains authoritative for
# WHERE, but is not itself consent.
explicit_home="$tmp/explicit-home"
explicit_bin="$explicit_home/opt/bin"
mkdir -p "$explicit_bin" "$explicit_home/.lingtai-tui/runtime"
cat > "$explicit_bin/lingtai-tui" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' 'lingtai-tui v0.13.0'
EOF
chmod +x "$explicit_bin/lingtai-tui"
export HOME="$explicit_home"
export PATH="/usr/bin:/bin"
BIN_DIR_OVERRIDE="$explicit_bin"
INSTALL_PREFIX=""
discover_explicit_target_install || fail "explicit target discovery should succeed"
explicit_bin_canonical="$(cd "$explicit_bin" && pwd -P)"
assert_eq "$explicit_bin_canonical" "$DISCOVERED_BIN_DIR" "explicit target with existing binary is discovered"
TARGET_TAG="v0.13.1"
NON_INTERACTIVE=0
if print_install_plan >"$tmp/explicit-plan.stdout" 2>"$tmp/explicit-plan.stderr"; then
  fail "explicit --bin-dir target with existing state silently bypassed consent"
fi
grep -q "requires interactive confirmation" "$tmp/explicit-plan.stderr" || fail "explicit-target consent gate did not fail closed with an actionable error"
NON_INTERACTIVE=1
print_install_plan || fail "explicit-target repair plan should be accepted non-interactively"
assert_eq "1" "$INSTALL_PLAN_APPROVED" "explicit-target non-interactive consent"
BIN_DIR_OVERRIDE=""
NON_INTERACTIVE=0
INSTALL_PLAN_APPROVED=0

# An explicit target with NO existing state must keep the historical
# non-prompting fresh-install flow (print_install_plan is a no-op).
fresh_explicit_bin="$explicit_home/opt/fresh-bin"
mkdir -p "$fresh_explicit_bin"
BIN_DIR_OVERRIDE="$fresh_explicit_bin"
discover_explicit_target_install || fail "explicit fresh target discovery should succeed"
assert_eq "" "$DISCOVERED_BIN_DIR" "explicit fresh target has no existing binary"
print_install_plan >"$tmp/fresh-explicit-plan.stdout" 2>&1 || fail "fresh explicit target must not require consent"
BIN_DIR_OVERRIDE=""
export HOME="$saved_home"
export PATH="$saved_path"

# --- Blocker 2: pre-consent diagnosis must never execute the discovered TUI
# binary or import the runtime. A canary binary records every invocation;
# discover_existing_install + print_install_plan (non-interactive, i.e. no
# TTY prompt loop) must leave the canary log empty.
canary_home="$tmp/canary-home"
canary_bin="$canary_home/.local/bin"
mkdir -p "$canary_bin" "$canary_home/.lingtai-tui/runtime"
canary_log="$tmp/canary-executions"
: > "$canary_log"
cat > "$canary_bin/lingtai-tui" <<EOF
#!/usr/bin/env bash
printf 'executed: %s\n' "\$*" >> "$canary_log"
printf '%s\n' 'lingtai-tui v0.14.0'
EOF
chmod +x "$canary_bin/lingtai-tui"
cat > "$canary_home/.lingtai-tui/install.json" <<EOF
{
  "schema": "lingtai.tui.install/v1",
  "schema_version": 1,
  "install_method": "source",
  "install_kind": "source-build",
  "prefix": "$canary_home",
  "bin_dir": "$canary_bin",
  "repo_url": "https://github.com/Lingtai-AI/lingtai.git",
  "requested_ref": "v0.13.0",
  "resolved_ref": "v0.13.0",
  "resolved_commit": "",
  "stamped_version": "v0.13.0",
  "installed_at": "2026-07-17T00:00:00Z",
  "managed_binaries": ["$canary_bin/lingtai-tui"]
}
EOF
export HOME="$canary_home"
export PATH="$canary_bin:/usr/bin:/bin"
unset LINGTAI_INSTALL_METADATA || true
discover_existing_install || fail "canary install should be discoverable"
[[ ! -s "$canary_log" ]] || fail "discover_existing_install executed the discovered TUI binary pre-consent: $(cat "$canary_log")"
TARGET_TAG="v0.14.0"
NON_INTERACTIVE=1
print_install_plan >"$tmp/canary-plan.stdout" 2>&1 || fail "canary non-interactive plan should be accepted"
[[ ! -s "$canary_log" ]] || fail "print_install_plan executed the discovered TUI binary pre-consent: $(cat "$canary_log")"
grep -q "not found (unverified" "$tmp/canary-plan.stdout" || fail "plan did not label the unprobed current TUI as unverified"
# Only the explicit post-consent probe may execute the binary.
[[ "$(discover_current_tui_tag "$DISCOVERED_BIN_DIR")" == "v0.14.0" ]] || fail "post-consent probe should resolve the real version"
[[ -s "$canary_log" ]] || fail "post-consent discover_current_tui_tag should have executed the binary exactly once"
assert_eq "1" "$(wc -l < "$canary_log" | tr -d ' ')" "post-consent probe executed the binary exactly once"
NON_INTERACTIVE=0
INSTALL_PLAN_APPROVED=0
export HOME="$saved_home"
export PATH="$saved_path"

# Pre-consent diagnosis must also never import the runtime's Python package
# (blocker 2's second failure mode: bytecode-cache/import side effects). Use
# a real venv with a lingtai/lingtai.kernel package and confirm no __pycache__
# is created by runtime_static_summary, unlike the executing counterpart.
pycache_venv="$tmp/pycache-venv"
python3 -m venv "$pycache_venv" || fail "pycache test venv creation"
pycache_py="$pycache_venv/bin/python"
pycache_site="$("$pycache_py" -c 'import sysconfig; print(sysconfig.get_paths()["purelib"])')"
mkdir -p "$pycache_site/lingtai"
printf '%s\n' '__version__ = "0.20.0"' > "$pycache_site/lingtai/__init__.py"
printf '%s\n' 'value = "kernel"' > "$pycache_site/lingtai/kernel.py"
runtime_static_summary "$pycache_venv" >/dev/null
if [[ -d "$pycache_site/lingtai/__pycache__" ]]; then
  fail "runtime_static_summary created __pycache__ (imported the runtime pre-consent)"
fi
runtime_current_summary "$pycache_venv" >/dev/null
[[ -d "$pycache_site/lingtai/__pycache__" ]] || fail "sanity check: runtime_current_summary should import and create pycache post-consent"

# --- Blocker 3: the plan must distinguish a declared/pinned kernel target
# from a verified artifact, and must precompute+print the exact eventual
# runtime repair/retained path before consent (already exercised structurally
# above via the "Runtime target" / "Runtime if broken" plan lines; assert the
# declared-vs-verified kernel wording explicitly here).
plan_home="$tmp/plan-home"
plan_bin="$plan_home/.local/bin"
# Keep the owned runtime root absent: discovery and the complete pre-consent
# plan must resolve the exact repair child without creating this directory.
mkdir -p "$plan_bin" "$plan_home/.lingtai-tui"
cat > "$plan_bin/lingtai-tui" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' 'lingtai-tui v0.15.0'
EOF
chmod +x "$plan_bin/lingtai-tui"
cat > "$plan_home/.lingtai-tui/install.json" <<EOF
{
  "schema": "lingtai.tui.install/v1",
  "schema_version": 1,
  "install_method": "source",
  "install_kind": "source-build",
  "prefix": "$plan_home",
  "bin_dir": "$plan_bin",
  "repo_url": "https://github.com/Lingtai-AI/lingtai.git",
  "requested_ref": "v0.15.0",
  "resolved_ref": "v0.15.0",
  "resolved_commit": "",
  "stamped_version": "v0.15.0",
  "installed_at": "2026-07-17T00:00:00Z",
  "managed_binaries": ["$plan_bin/lingtai-tui"]
}
EOF
export HOME="$plan_home"
export PATH="$plan_bin:/usr/bin:/bin"
unset LINGTAI_INSTALL_METADATA || true
discover_existing_install || fail "plan-truth install should be discoverable"
TARGET_TAG="v0.16.0"
KERNEL_VERSION_INSTALLED=""
BUNDLE_MANIFEST_JSON=""
KERNEL_PIN_TAG="v0.20.0"
NON_INTERACTIVE=1
print_install_plan >"$tmp/truth-plan.stdout" || fail "plan-truth non-interactive plan should be accepted"
grep -q "declared pin v0.20.0 (release manifest/artifact not yet fetched or verified)" "$tmp/truth-plan.stdout" \
  || fail "plan did not distinguish a declared kernel pin from a verified artifact: $(cat "$tmp/truth-plan.stdout")"
grep -q "Runtime target:   $plan_home/.lingtai-tui/runtime/venv " "$tmp/truth-plan.stdout" \
  || fail "plan did not print the exact retained runtime path"
grep -q "Runtime if broken: $plan_home/.lingtai-tui/runtime/venv-repair " "$tmp/truth-plan.stdout" \
  || fail "plan did not print the exact eventual repair runtime path"
assert_eq "$plan_home/.lingtai-tui/runtime/venv-repair" "$PLANNED_RUNTIME_REPAIR_PATH" "plan persists the exact approved repair path"
[[ ! -e "$plan_home/.lingtai-tui/runtime" && ! -L "$plan_home/.lingtai-tui/runtime" ]] \
  || fail "pre-consent discovery/plan created the runtime root"

# A pre-existing healthy repair venv is still occupied during read-only
# planning: the plan binds the first free slot, and post-consent selection must
# use that exact path rather than silently reusing a different healthy venv.
healthy_existing_repair="$plan_home/.lingtai-tui/runtime/venv-repair"
mkdir -p "$plan_home/.lingtai-tui/runtime"
"$python3_path" -m venv "$healthy_existing_repair" || fail "healthy existing repair venv creation"
assert_eq "healthy" "$(runtime_venv_state "$healthy_existing_repair")" "healthy prior repair sanity check"
print_install_plan >"$tmp/truth-plan-healthy-existing.stdout" || fail "plan with healthy occupied repair slot should succeed"
grep -q "Runtime if broken: $plan_home/.lingtai-tui/runtime/venv-repair-1 " "$tmp/truth-plan-healthy-existing.stdout" \
  || fail "plan did not skip an occupied healthy repair slot"
assert_eq "$plan_home/.lingtai-tui/runtime/venv-repair-1" "$PLANNED_RUNTIME_REPAIR_PATH" "plan binds the first free path even when an older repair venv is healthy"
assert_eq "$PLANNED_RUNTIME_REPAIR_PATH" "$(runtime_repair_path)" "post-consent selection uses the printed path, not a healthy occupied slot"

# If another process occupies that exact slot after consent, the installer must
# fail loud rather than silently choose an unapproved venv-repair-N path.
occupied_after_consent="$PLANNED_RUNTIME_REPAIR_PATH"
mkdir -p "$occupied_after_consent"
if runtime_repair_path >"$tmp/occupied-plan.stdout" 2>"$tmp/occupied-plan.stderr"; then
  fail "post-consent occupation silently changed the planned repair path"
fi
grep -q "planned runtime repair path became occupied after consent: $occupied_after_consent" "$tmp/occupied-plan.stderr" \
  || fail "post-consent occupation failure was not exact/actionable"

# With every stable slot occupied, planning itself must fail before consent;
# it cannot print a vague candidate or defer path selection until mutation.
for occupied_index in 2 3 4 5 6 7 8 9; do
  mkdir -p "$plan_home/.lingtai-tui/runtime/venv-repair-$occupied_index"
done
INSTALL_PLAN_APPROVED=0
if print_install_plan >"$tmp/no-free-plan.stdout" 2>"$tmp/no-free-plan.stderr"; then
  fail "plan succeeded without any safe free stable repair path"
fi
grep -q "no safe, free stable runtime repair path" "$tmp/no-free-plan.stderr" \
  || fail "no-free-slot planning failure was not actionable"
assert_eq "" "$PLANNED_RUNTIME_REPAIR_PATH" "failed plan does not retain a repair path"
assert_eq "0" "$INSTALL_PLAN_APPROVED" "failed plan never records consent"

# Dangling symlinks are occupied untrusted slots, not free paths. Both preview
# and unplanned fresh selection skip them; the ownership validator rejects the
# dangling slot itself without following it.
dangling_home="$tmp/dangling-repair-home"
mkdir -p "$dangling_home/.lingtai-tui/runtime"
ln -s "$tmp/nonexistent-runtime-target" "$dangling_home/.lingtai-tui/runtime/venv-repair"
export HOME="$dangling_home"
PLANNED_RUNTIME_REPAIR_PATH=""
assert_eq "$dangling_home/.lingtai-tui/runtime/venv-repair-1" "$(runtime_repair_path_preview)" "preview skips a dangling repair-slot symlink"
assert_eq "$dangling_home/.lingtai-tui/runtime/venv-repair-1" "$(runtime_repair_path)" "fresh selection skips a dangling repair-slot symlink"
if validated_runtime_repair_path "$dangling_home/.lingtai-tui/runtime/venv-repair" >"$tmp/dangling-validate.stdout" 2>"$tmp/dangling-validate.stderr"; then
  fail "repair-path validator accepted a dangling symlink slot"
fi
grep -q "not a safe physical child" "$tmp/dangling-validate.stderr" || fail "dangling repair-slot rejection was not actionable"

PLANNED_RUNTIME_REPAIR_PATH=""
NON_INTERACTIVE=0
INSTALL_PLAN_APPROVED=0
KERNEL_PIN_TAG=""
export HOME="$saved_home"
export PATH="$saved_path"

# --- Blocker 4: runtime_venv containment must be physical, not lexical.
# A metadata-declared path syntactically under the owned runtime root that is
# actually a symlink to an external directory must be rejected before any
# adoption/mutation, both by discovery and by ensure_runtime_venv's own gate.
symlink_home="$tmp/symlink-home"
symlink_external="$tmp/symlink-external-runtime"
mkdir -p "$symlink_home/.lingtai-tui/runtime" "$symlink_external" "$symlink_home/.local/bin"
ln -s "$symlink_external" "$symlink_home/.lingtai-tui/runtime/venv"
cat > "$symlink_home/.lingtai-tui/install.json" <<EOF
{
  "schema": "lingtai.tui.install/v1",
  "schema_version": 1,
  "install_method": "source",
  "install_kind": "source-build",
  "prefix": "$symlink_home",
  "bin_dir": "$symlink_home/.local/bin",
  "repo_url": "https://github.com/Lingtai-AI/lingtai.git",
  "requested_ref": "v0.10.0",
  "resolved_ref": "v0.10.0",
  "resolved_commit": "",
  "stamped_version": "v0.10.0",
  "installed_at": "2026-07-17T00:00:00Z",
  "managed_binaries": [],
  "runtime_venv": "$symlink_home/.lingtai-tui/runtime/venv"
}
EOF
export HOME="$symlink_home"
export PATH="/usr/bin:/bin"
unset LINGTAI_INSTALL_METADATA || true
if discover_existing_install >"$tmp/symlink-discover.stdout" 2>"$tmp/symlink-discover.stderr"; then
  fail "discovery accepted a runtime_venv that symlinks outside the owned runtime root"
fi
grep -q "outside the owned runtime root" "$tmp/symlink-discover.stderr" || fail "symlink-escape rejection was not actionable"

# Direct unit coverage of the containment primitive plus ensure_runtime_venv's
# own pre-mutation gate (defense in depth if a caller sets RUNTIME_VENV_DIR
# without going through discovery).
if canonical_runtime_venv "$symlink_home/.lingtai-tui/runtime/venv" "$symlink_home/.lingtai-tui/runtime" >/dev/null 2>&1; then
  fail "canonical_runtime_venv accepted a symlink escaping the owned root"
fi
inside_venv="$symlink_home/.lingtai-tui/runtime/venv-ok"
mkdir -p "$inside_venv"
inside_venv_canonical="$(cd "$inside_venv" && pwd -P)"
assert_eq "$inside_venv_canonical" "$(canonical_runtime_venv "$inside_venv" "$symlink_home/.lingtai-tui/runtime")" "canonical_runtime_venv accepts a real path inside the owned root"
if canonical_runtime_venv "$symlink_home/.lingtai-tui/runtime" "$symlink_home/.lingtai-tui/runtime" >/dev/null 2>&1; then
  fail "canonical_runtime_venv accepted the runtime root itself instead of a strict child"
fi
inside_alias="$tmp/outside-runtime-alias"
ln -s "$inside_venv" "$inside_alias"
if canonical_runtime_venv "$inside_alias" "$symlink_home/.lingtai-tui/runtime" >/dev/null 2>&1; then
  fail "canonical_runtime_venv accepted a lexical path outside the owned root merely because it resolves inside"
fi
fresh_runtime_home="$tmp/fully-fresh-runtime-home"
mkdir -p "$fresh_runtime_home"
export HOME="$fresh_runtime_home"
fresh_runtime_path="$fresh_runtime_home/.lingtai-tui/runtime/venv"
fresh_runtime_expected="$(cd "$fresh_runtime_home" && pwd -P)/.lingtai-tui/runtime/venv"
assert_eq "$fresh_runtime_expected" "$(canonical_runtime_venv "$fresh_runtime_path" "$fresh_runtime_home/.lingtai-tui/runtime")" "canonical runtime resolves a fully fresh missing owned root without mkdir"
[[ ! -e "$fresh_runtime_home/.lingtai-tui" && ! -L "$fresh_runtime_home/.lingtai-tui" ]] \
  || fail "canonical runtime resolution created fresh .lingtai-tui state"
export HOME="$symlink_home"
RUNTIME_VENV_DIR="$symlink_home/.lingtai-tui/runtime/venv"
SKIP_VENV=0
KERNEL_SOURCE=""
KERNEL_RELEASE_TAG=""
KERNEL_PIN_TAG=""
BUNDLE_MANIFEST_JSON=""
BUNDLE_REQUIRED=0
REF="dummy-ref-with-no-pin"
if ensure_runtime_venv "$symlink_home/.local/bin" >"$tmp/ensure-symlink.stdout" 2>"$tmp/ensure-symlink.stderr"; then
  fail "ensure_runtime_venv mutated/adopted a runtime venv outside the owned root"
fi
grep -q "outside the owned runtime root" "$tmp/ensure-symlink.stderr" || fail "ensure_runtime_venv symlink-escape rejection was not actionable"
REF=""
SKIP_VENV=0
export HOME="$saved_home"
export PATH="$saved_path"

# --- Blocker 5: the final runtime health check must reject a same-version
# package imported from outside the selected venv (e.g. injected via a
# `.pth` file), not just check that import succeeds.
pth_venv="$tmp/pth-venv"
python3 -m venv "$pth_venv" || fail "pth test venv creation"
pth_py="$pth_venv/bin/python"
pth_site="$("$pth_py" -c 'import sysconfig; print(sysconfig.get_paths()["purelib"])')"
pth_external="$tmp/pth-external"
mkdir -p "$pth_external/lingtai"
printf '%s\n' '__version__ = "0.17.1"' > "$pth_external/lingtai/__init__.py"
printf '%s\n' 'value = "kernel"' > "$pth_external/lingtai/kernel.py"
printf '%s\n' "$pth_external" > "$pth_site/zzz-external.pth"
if runtime_health_check "$pth_py" "0.17.1" >"$tmp/pth-health.stdout" 2>&1; then
  fail "runtime_health_check accepted a same-version package imported from outside the selected venv: $(cat "$tmp/pth-health.stdout")"
fi
# The legitimate in-venv package must still pass once actually installed
# there (proves the fix rejects provenance, not the version itself).
rm -f "$pth_site/zzz-external.pth"
mkdir -p "$pth_site/lingtai"
printf '%s\n' '__version__ = "0.17.1"' > "$pth_site/lingtai/__init__.py"
printf '%s\n' 'value = "kernel"' > "$pth_site/lingtai/kernel.py"
runtime_health_check "$pth_py" "0.17.1" >/dev/null || fail "runtime_health_check rejected a legitimate in-venv package"
# A launcher under a different selected directory must not borrow another
# venv's interpreter/prefix and pass merely because that other venv is healthy.
foreign_selected_venv="$tmp/foreign-selected-venv"
mkdir -p "$foreign_selected_venv/bin"
ln -s "$pth_py" "$foreign_selected_venv/bin/python"
if runtime_health_check "$foreign_selected_venv/bin/python" "0.17.1" >"$tmp/foreign-prefix-health.stdout" 2>&1; then
  fail "runtime_health_check accepted an interpreter whose sys.prefix was not the selected venv"
fi

# --- Blocker 6: --skip-python must preserve a valid existing runtime
# pointer instead of dropping it, and install --dev must record the actual
# selected runtime path rather than a stale metadata pointer.
skip_meta_dir="$tmp/skip-meta"
skip_home="$tmp/skip-home"
skip_runtime="$skip_home/.lingtai-tui/runtime/venv"
mkdir -p "$skip_home/.lingtai-tui/runtime"
"$python3_path" -m venv "$skip_runtime" || fail "skip-python test venv creation"
export HOME="$skip_home"
RUNTIME_VENV_DIR="$skip_runtime"
DISCOVERED_RUNTIME_VENV="$skip_runtime"
SKIP_VENV=1
KERNEL_SOURCE=""
write_install_metadata "$skip_meta_dir" "$tmp/skip-prefix" "$tmp/skip-bin" "$REPO" "v0.10.0" "v0.10.0" "" "v0.10.0" "$tmp/skip-bin/lingtai-tui" ""
"$python3_path" - "$skip_meta_dir/install.json" "$skip_runtime" <<PY
import json, sys
p = json.load(open(sys.argv[1]))
assert p.get("runtime_venv") == sys.argv[2], p
PY
# Pointer preservation is filesystem-only: --skip-python must not execute a
# discovered/runtime launcher just to decide whether to keep its location.
skip_canary_runtime="$skip_home/.lingtai-tui/runtime/venv-canary"
skip_canary_log="$tmp/skip-canary-executions"
mkdir -p "$skip_canary_runtime/bin"
: > "$skip_canary_log"
cat > "$skip_canary_runtime/bin/python" <<EOF
#!/usr/bin/env bash
printf '%s\n' executed >> "$skip_canary_log"
exit 0
EOF
chmod +x "$skip_canary_runtime/bin/python"
RUNTIME_VENV_DIR="$skip_canary_runtime"
DISCOVERED_RUNTIME_VENV="$skip_canary_runtime"
write_install_metadata "$tmp/skip-canary-meta" "$tmp/skip-prefix" "$tmp/skip-bin" "$REPO" "v0.10.0" "v0.10.0" "" "v0.10.0" "$tmp/skip-bin/lingtai-tui" ""
[[ ! -s "$skip_canary_log" ]] || fail "--skip-python metadata rewrite executed the opted-out runtime"

# --skip-python must NOT invent a pointer to a runtime that was never
# discovered and ownership-validated, even if a default-looking directory exists.
skip_meta_dir_missing="$tmp/skip-meta-missing"
RUNTIME_VENV_DIR="$skip_home/.lingtai-tui/runtime/legacy-default"
DISCOVERED_RUNTIME_VENV=""
mkdir -p "$RUNTIME_VENV_DIR"
write_install_metadata "$skip_meta_dir_missing" "$tmp/skip-prefix" "$tmp/skip-bin" "$REPO" "v0.10.0" "v0.10.0" "" "v0.10.0" "$tmp/skip-bin/lingtai-tui" ""
"$python3_path" - "$skip_meta_dir_missing/install.json" <<'PY'
import json, sys
p = json.load(open(sys.argv[1]))
assert "runtime_venv" not in p, p
PY
SKIP_VENV=0
DISCOVERED_RUNTIME_VENV=""
export HOME="$saved_home"

# Full-main regression: legacy metadata with no runtime pointer plus an existing
# default-looking runtime must not execute or adopt that runtime under
# --skip-python. Stub only the TUI source build/version checks so the complete
# main plan -> consent -> before/after -> metadata path runs without network.
full_skip_home="$tmp/full-main-skip-home"
full_skip_bin="$full_skip_home/.local/bin"
full_skip_runtime="$full_skip_home/.lingtai-tui/runtime/venv"
full_skip_canary="$tmp/full-main-skip-runtime-executions"
mkdir -p "$full_skip_bin" "$full_skip_runtime/bin"
: > "$full_skip_canary"
cat > "$full_skip_bin/lingtai-tui" <<'EOF'
#!/usr/bin/env bash
exit 0
EOF
cat > "$full_skip_runtime/bin/python" <<EOF
#!/usr/bin/env bash
printf '%s\n' executed >> "$full_skip_canary"
exit 0
EOF
chmod +x "$full_skip_bin/lingtai-tui" "$full_skip_runtime/bin/python"
export HOME="$full_skip_home"
SKIP_VENV=1
RUNTIME_VENV_DIR=""
DISCOVERED_RUNTIME_VENV=""
KERNEL_SOURCE=""
write_install_metadata "$full_skip_home/.lingtai-tui" "$full_skip_home/.local" "$full_skip_bin" "$REPO" "legacy" "legacy" "" "v0.1.0" "$full_skip_bin/lingtai-tui" ""
SKIP_VENV=0
(
  export HOME="$full_skip_home"
  export PATH="$saved_path"
  BUILD_DIR="$tmp/full-main-skip-build"
  MODE="install"; UPDATE_MODE=0; DEV_MODE=0; REF=""; VERSION=""; FROM_SOURCE=0
  SKIP_VENV=0; SKIP_PORTAL=1; NON_INTERACTIVE=0; BIN_DIR=""; BIN_DIR_OVERRIDE=""; INSTALL_PREFIX=""
  # Keep this full-main regression hermetic: main's generic connectivity probe
  # is unrelated to the explicit local source stub below.
  curl() { return 0; }
  build_from_source() {
    VERSION="v0.2.0"; RESOLVED_REF="local-ref"; RESOLVED_COMMIT="test-commit"; INSTALL_KIND="source-build"; PORTAL_PATH=""
    mkdir -p "$BIN_DIR"
    cat > "$BIN_DIR/lingtai-tui" <<'SH'
#!/usr/bin/env bash
exit 0
SH
    chmod +x "$BIN_DIR/lingtai-tui"
  }
  discover_current_tui_tag() { printf '%s\n' 'v0.1.0'; }
  verify_tui_binary_version() { return 0; }
  tui_binary_tag() { printf '%s\n' 'v0.2.0'; }
  main --ref local-ref --skip-python --skip-portal --non-interactive --bin-dir "$full_skip_bin"
) >"$tmp/full-main-skip.stdout" 2>"$tmp/full-main-skip.stderr" || fail "full main --skip-python canary flow failed: $(cat "$tmp/full-main-skip.stderr")"
[[ ! -s "$full_skip_canary" ]] || fail "full main --skip-python executed the opted-out legacy/default runtime"
grep -q 'not probed (--skip-python)' "$tmp/full-main-skip.stdout" || fail "full main skip report did not state runtime was unprobed"
"$python3_path" - "$full_skip_home/.lingtai-tui/install.json" <<'PY'
import json, sys
p = json.load(open(sys.argv[1]))
assert "runtime_venv" not in p, p
PY

# A symlink at .lingtai-tui redirects both metadata and runtime ownership. The
# shared main gate, canonical path check, and repair preview must all reject it
# before any runtime execution or mutation, in skip and normal modes alike.
ancestor_home="$tmp/ancestor-symlink-home"
ancestor_external="$tmp/ancestor-symlink-external"
ancestor_bin="$ancestor_home/.local/bin"
ancestor_canary="$tmp/ancestor-runtime-executions"
mkdir -p "$ancestor_home" "$ancestor_external/runtime/venv/bin" "$ancestor_bin"
ln -s "$ancestor_external" "$ancestor_home/.lingtai-tui"
: > "$ancestor_canary"
cat > "$ancestor_external/runtime/venv/bin/python" <<EOF
#!/usr/bin/env bash
printf '%s\n' executed >> "$ancestor_canary"
exit 0
EOF
cat > "$ancestor_bin/lingtai-tui" <<'EOF'
#!/usr/bin/env bash
exit 0
EOF
chmod +x "$ancestor_external/runtime/venv/bin/python" "$ancestor_bin/lingtai-tui"
export HOME="$ancestor_home"
if canonical_runtime_venv "$ancestor_home/.lingtai-tui/runtime/venv" "$ancestor_home/.lingtai-tui/runtime" >/dev/null 2>&1; then
  fail "canonical runtime ownership accepted a .lingtai-tui ancestor symlink"
fi
if runtime_repair_path_preview >/dev/null 2>&1; then
  fail "repair planning accepted a .lingtai-tui ancestor symlink"
fi
for ancestor_mode in skip normal; do
  if (
    export HOME="$ancestor_home"
    BUILD_DIR="$tmp/ancestor-main-build-$ancestor_mode"
    MODE="install"; UPDATE_MODE=0; DEV_MODE=0; REF=""; VERSION=""; FROM_SOURCE=0
    SKIP_VENV=0; SKIP_PORTAL=1; NON_INTERACTIVE=0; BIN_DIR=""; BIN_DIR_OVERRIDE=""; INSTALL_PREFIX=""
    if [[ "$ancestor_mode" == skip ]]; then
      main --ref local-ref --skip-python --skip-portal --non-interactive --bin-dir "$ancestor_bin"
    else
      main --ref local-ref --skip-portal --non-interactive --bin-dir "$ancestor_bin"
    fi
  ) >"$tmp/ancestor-main-$ancestor_mode.stdout" 2>"$tmp/ancestor-main-$ancestor_mode.stderr"; then
    fail "main accepted a .lingtai-tui ancestor symlink in $ancestor_mode mode"
  fi
  grep -q '.lingtai-tui is a symlink' "$tmp/ancestor-main-$ancestor_mode.stderr" \
    || fail "ancestor symlink failure was not actionable in $ancestor_mode mode"
done
[[ ! -s "$ancestor_canary" ]] || fail ".lingtai-tui ancestor symlink flow executed the redirected runtime"
export HOME="$saved_home"

# ensure_dev_runtime must set RUNTIME_VENV_DIR to the venv it actually
# installed into, so a subsequent write_install_metadata records the truth
# instead of a stale discovered/default pointer. Build only the minimal
# process-owned directory shape this bookkeeping test needs and place a regular
# shim at bin/python. Do NOT create a real venv and overwrite bin/python: venv
# launchers can be symlinks to the host interpreter, so redirecting into one
# can corrupt the machine-wide Python binary.
dev_kernel_source="$tmp/dev-kernel-source"
mkdir -p "$dev_kernel_source"
dev_runtime_venv="$tmp/dev-runtime-venv"
mkdir -p "$dev_runtime_venv/bin"
cat > "$dev_runtime_venv/bin/python" <<'EOF'
#!/usr/bin/env bash
exit 0
EOF
chmod +x "$dev_runtime_venv/bin/python"
[[ -f "$dev_runtime_venv/bin/python" && ! -L "$dev_runtime_venv/bin/python" ]] \
  || fail "dev-runtime test launcher must remain a process-owned regular file, never a venv symlink"
RUNTIME_VENV_DIR="$tmp/stale-pointer-should-be-overwritten"
runtime_probe() { printf '0.99.0\t%s/lingtai/__init__.py\t%s\n' "$1" "$1"; }
find_uv() { return 1; }
LINGTAI_DEV_RUNTIME_PYTHON="$dev_runtime_venv" ensure_dev_runtime "$dev_kernel_source" >"$tmp/dev-runtime.stdout" 2>&1
dev_runtime_rc=$?
unset -f runtime_probe find_uv
[[ "$dev_runtime_rc" == "0" ]] || fail "ensure_dev_runtime (rc=$dev_runtime_rc) failed with the stubbed venv: $(cat "$tmp/dev-runtime.stdout")"
assert_eq "$dev_runtime_venv" "$RUNTIME_VENV_DIR" "ensure_dev_runtime records the actual selected runtime path"
[[ "$RUNTIME_VENV_DIR" != "$tmp/stale-pointer-should-be-overwritten" ]] || fail "ensure_dev_runtime left the stale RUNTIME_VENV_DIR pointer in place"

# An initially broken retained runtime consumes the one repair attempt when it
# moves to the planned path. If installation then fails, ensure_runtime_venv
# must stop instead of selecting an undisclosed second repair path.
single_attempt_home="$tmp/single-repair-attempt-home"
single_attempt_root="$single_attempt_home/.lingtai-tui/runtime"
single_attempt_broken="$single_attempt_root/venv"
single_attempt_planned="$single_attempt_root/venv-repair"
single_attempt_calls="$tmp/single-repair-attempt.calls"
mkdir -p "$single_attempt_broken" "$single_attempt_home/.local/bin"
: > "$single_attempt_calls"
export HOME="$single_attempt_home"
export PATH="$(dirname "$python3_path"):/usr/bin:/bin"
RUNTIME_VENV_DIR="$single_attempt_broken"
PLANNED_RUNTIME_REPAIR_PATH="$single_attempt_planned"
SKIP_VENV=0
KERNEL_PIN_TAG="v0.17.1"
KERNEL_RELEASE_TAG=""
BUNDLE_MANIFEST_JSON=""
BUNDLE_REQUIRED=0
REF=""
eval "production_runtime_repair_path_for_single_attempt() $(declare -f runtime_repair_path | tail -n +2)"
runtime_repair_path() {
  printf '%s\n' called >> "$single_attempt_calls"
  production_runtime_repair_path_for_single_attempt "$@"
}
ensure_python() { return 0; }
find_uv() { return 1; }
install_kernel_from_bundle() { return 1; }
if ensure_runtime_venv "$single_attempt_home/.local/bin" >"$tmp/single-attempt.stdout" 2>"$tmp/single-attempt.stderr"; then
  fail "initially broken runtime plus failed planned repair unexpectedly succeeded"
fi
assert_eq "1" "$(wc -l < "$single_attempt_calls" | tr -d ' ')" "initially broken runtime selects only one repair path"
grep -q "failed to install the pinned kernel artifact into the runtime venv after recreate" "$tmp/single-attempt.stderr" \
  || fail "single repair-attempt failure was not actionable"

export HOME="$saved_home"
export PATH="$saved_path"
PLANNED_RUNTIME_REPAIR_PATH=""
KERNEL_PIN_TAG=""

printf '%s\n' "test-install-sh-kernel-pin: PASS"
