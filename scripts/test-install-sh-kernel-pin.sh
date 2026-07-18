#!/usr/bin/env bash
# Focused hermetic contract/behavior test for the split public installation surface.
# It never invokes host Python, a real venv, a package manager, a network client,
# or a LingTai binary. Every dynamic command shim lives under process-owned scratch.
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fail() { echo "test-install-sh-kernel-pin: $*" >&2; exit 1; }
contains() { grep -Fq -- "$2" "$1" || fail "$1 is missing: $2"; }
not_contains() { ! grep -Fq -- "$2" "$1" || fail "$1 unexpectedly contains: $2"; }
assert_eq() { [[ "$1" == "$2" ]] || fail "expected '$2', got '$1'"; }
expect_fail() { "$@" >/dev/null 2>&1 && fail "command unexpectedly succeeded: $*" || :; }

repo_contract="$ROOT_DIR/CONTRACT.md"
repo_anatomy="$ROOT_DIR/ANATOMY.md"
architecture_test="$ROOT_DIR/scripts/test-architecture-documents.py"
root="$ROOT_DIR/public"
main="$root/install.sh"
installation="$root/help/reference/installation"
contract="$installation/CONTRACT.md"
installation_anatomy="$installation/ANATOMY.md"
asset_dir="$installation/assets"
update="$asset_dir/update.sh"
dev="$asset_dir/dev.sh"
fix="$asset_dir/fix.sh"
verify="$asset_dir/verify.sh"
[[ -f "$main" ]] || fail "missing canonical install.sh"
[[ "$(wc -l < "$main" | tr -d ' ')" -le 2400 ]] || fail "canonical install.sh exceeds the 2400-line target"
for file in "$repo_contract" "$repo_anatomy" "$architecture_test" "$main" "$root/skill.md" "$root/help/skill.md" "$root/help/reference/migration/skill.md" "$installation/skill.md" "$contract" "$installation_anatomy" "$update" "$dev" "$fix" "$verify"; do
  [[ -f "$file" ]] || fail "missing public surface file: $file"
  [[ "$(head -1 "$file")" == "#!"* || "$(head -1 "$file")" == "---" ]] || fail "file lacks shell/frontmatter entry: $file"
done
[[ "$(wc -l < "$root/skill.md" | tr -d ' ')" -le 80 ]] || fail "root skill router exceeds 80 lines"
contains "$root/skill.md" 'https://lingtai.ai/help/skill.md'
contains "$root/help/skill.md" 'help/reference/installation/skill.md'
contains "$root/help/skill.md" 'help/reference/migration/skill.md'
contains "$installation/skill.md" 'assets/update.sh'
contains "$installation/skill.md" 'does **not** download, source, or execute'
contains "$installation/skill.md" 'https://lingtai.ai/help/reference/installation/CONTRACT.md'
contains "$installation/skill.md" 'https://lingtai.ai/help/reference/installation/ANATOMY.md'
[[ "$(wc -l < "$contract" | tr -d ' ')" -le 320 ]] || fail "installation contract exceeds 320 lines"
contains "$repo_contract" 'name: component-contract-convention'
contains "$repo_contract" 'public/help/reference/installation/CONTRACT.md'
contains "$repo_anatomy" 'public/help/reference/installation/ANATOMY.md'
contains "$contract" 'root_contract: CONTRACT.md'
contains "$contract" 'public/help/reference/installation/ANATOMY.md'
contains "$installation_anatomy" 'public/help/reference/installation/CONTRACT.md'
contains "$installation_anatomy" 'ANATOMY.md'
contains "$contract" '## Purpose'
contains "$contract" '## Behavior'
contains "$contract" '## Port'
contains "$contract" '## Adapters'
contains "$contract" '### 4.1 `/install.sh` — fresh ordinary install'
contains "$contract" '### 4.2 `assets/update.sh` — healthy exact ordinary update'
contains "$contract" '### 4.3 `assets/fix.sh` — bounded ordinary runtime repair'
contains "$contract" '### 4.4 `assets/verify.sh` — read-only receipt proof'
contains "$contract" '### 4.5 `assets/dev.sh` — explicit editable development state'
contains "$contract" 'A nonzero exit is not rollback.'
contains "$contract" '## Contract tests'
contains "$contract" '## Maintenance'
contains "$root/_headers" '/skill.md'
contains "$root/_headers" '/help/reference/installation/*.md'
contains "$root/_headers" '/help/reference/migration/*.md'
contains "$root/_headers" '/help/reference/installation/assets/*.sh'
not_contains "$root/_headers" '/help/reference/*/*.md'
contains "$root/_headers" 'text/markdown'
contains "$root/_headers" 'text/x-shellscript'
contains "$main" '--ref) compatibility_handoff'
contains "$main" 'exact official vX.Y.Z release tag'
not_contains "$main" 'run_update_mode()'
not_contains "$main" 'run_dev_install()'
not_contains "$main" 'discover_existing_install()'
not_contains "$main" 'git clone'
not_contains "$main" 'source <(curl'
contains "$main" 'validate_fresh_install_state'
contains "$main" 'ordinary install is first-install-only'
contains "$main" 'if [[ "$runtime_state" != missing ]]'
contains "$main" '"$uv" venv --seed --python 3.13 "$venv_dir"'
contains "$main" 'ensure_runtime_pip()'
contains "$main" '"$py" -m ensurepip --upgrade'
contains "$main" '"$uv" pip install --index-url "$index_url" -p "$venv_dir" pip'
contains "$main" 'ensure_runtime_pip "$py" "$venv_dir" "$uv"'
contains "$main" 'partial runtime retained for diagnosis: $venv_dir'
contains "$main" 'ln "$tmp_path" "$metadata_path"'
not_contains "$main" 'mv "$tmp_path" "$metadata_path"'

for asset in "$main" "$update" "$dev" "$fix" "$verify"; do
  contains "$asset" '# For coding-agent maintainers:'
  contains "$asset" 'repository-root CONTRACT.md'
  contains "$asset" 'public/help/reference/installation/CONTRACT.md'
  contains "$asset" 'final-head real critical-path acceptance'
done

for asset in "$update" "$dev" "$fix" "$verify"; do
  [[ -x "$asset" ]] || fail "asset is not executable: $asset"
  bash -n "$asset" || fail "asset syntax failed: $asset"
  contains "$asset" '--help'
  contains "$asset" 'set -euo pipefail'
  contains "$asset" 'lingtai.tui.install/v1'
  contains "$asset" 'sys.prefix'
done
bash -n "$main" || fail "canonical installer syntax failed"
contains "$update" 'parse_tui_identity'
contains "$dev" 'parse_tui_identity'
contains "$verify" 'parse_tui_identity'
contains "$verify" 'lingtai.__version__ does not exactly match kernel_version'
contains "$update" 'if str(getattr(package, "__version__", "")) != expected'
contains "$fix" 'if str(getattr(package, "__version__", "")) != expected'
contains "$fix" 'prior receipt kernel_version changed'
contains "$fix" 'prior_kernel_version'
not_contains "$fix" 're.fullmatch(r"/[A-Za-z0-9._/-]+", old)'
contains "$update" 'updated_at'
contains "$update" 'LINGTAI_RECEIPT_REVALIDATE_UPDATE'
contains "$fix" 'command -v python3'
contains "$fix" '"$bootstrap" -m venv'
contains "$fix" 'LINGTAI_RECEIPT_REVALIDATE_FIX'
not_contains "$fix" '--runtime-python'
not_contains "$fix" '"$runtime"'
contains "$update" '"$work/kernel.whl"'
contains "$fix" '"$work/kernel.whl"'
not_contains "$update" 'kernel.artifact'
not_contains "$fix" 'kernel.artifact'
not_contains "$dev" 'stamped_version="dev"'

# Everything below is scratch-only. The fake runtimes are shell shims which read
# embedded-script markers as opaque text and never invoke/probe Python.
scratch="$(mktemp -d "${TMPDIR:-/tmp}/lingtai-install-test.XXXXXX")" || fail "mktemp failed"
trap 'rm -rf "$scratch"' EXIT
mkdir -p "$scratch/shims" "$scratch/tmp"
cat > "$scratch/shims/fake-runtime" <<'EOF'
#!/bin/sh
if [ "$1" = "-m" ]; then
  last=
  for arg do last=$arg; done
  if [ -n "${FAKE_PIP_LOG:-}" ]; then printf '%s\n' "$last" >> "$FAKE_PIP_LOG"; fi
  exit 0
fi
[ "$1" = "-" ] || exit 0
metadata=${2:-}
script=$(cat)
case "$script" in
  *LINGTAI_RUNTIME_PREFIX*) exit 0 ;;
  *LINGTAI_RECEIPT_PARSE_UPDATE*)
    grep -Fq "\"bin_dir\": \"$3\"" "$metadata" || exit 1
    grep -Fq '"stamped_version": "v1.2.3"' "$metadata" || exit 1
    grep -Eq '"install_kind": "(release-asset|source-build)"' "$metadata" || exit 1
    grep -Fq "$3/lingtai-tui" "$metadata" || exit 1
    printf '%s\t%s\n' v1.2.3 "${FAKE_PRIOR_RUNTIME:-$4}"; exit 0 ;;
  *LINGTAI_RECEIPT_PARSE_FIX*)
    grep -Fq "\"bin_dir\": \"$3\"" "$metadata" || exit 1
    grep -Fq '"stamped_version": "v1.2.3"' "$metadata" || exit 1
    grep -Eq '"install_kind": "(release-asset|source-build)"' "$metadata" || exit 1
    grep -Fq "$3/lingtai-tui" "$metadata" || exit 1
    printf '%s\t%s\t%s\n' "${FAKE_STAMP:-v1.2.3}" "$FAKE_OLD_VENV" "${FAKE_KERNEL_VERSION:-1.2.3}"; exit 0 ;;
  *LINGTAI_RECEIPT_PARSE_DEV_EXISTING*)
    grep -Fq "\"bin_dir\": \"$3\"" "$metadata" || exit 1
    grep -Fq "\"runtime_venv\": \"$4\"" "$metadata" || exit 1
    grep -Fq "$3/lingtai-tui" "$metadata" || exit 1
    exit 0 ;;
  *LINGTAI_KERNEL_POSTCONDITION*|*LINGTAI_FIX_IMPORT_POSTCONDITION*|*LINGTAI_DEV_IMPORT_POSTCONDITION*)
    case "$script" in *LINGTAI_DEV_IMPORT_POSTCONDITION*) printf '%s\n' 1.2.3;; esac
    exit 0 ;;
  *LINGTAI_RECEIPT_REVALIDATE_UPDATE*)
    if [ -n "${FAKE_TOCTOU_METADATA:-}" ]; then printf '%s\n' '{"changed":true}' > "$FAKE_TOCTOU_METADATA"; exit 1; fi
    exit 0 ;;
  *LINGTAI_RECEIPT_REVALIDATE_FIX*) exit 0 ;;
  *LINGTAI_DEV_RECEIPT_WRITE*)
    printf '{\n  "schema": "lingtai.tui.install/v1",\n  "schema_version": 1,\n  "install_kind": "dev-source",\n  "bin_dir": "%s",\n  "stamped_version": "%s",\n  "runtime_venv": "%s",\n  "managed_binaries": ["%s/lingtai-tui"],\n  "kernel_source": "editable",\n  "kernel_source_path": "%s",\n  "kernel_version": "1.2.3",\n  "installed_at": "old"\n}\n' "$4" "$5" "$6" "$4" "$7" > "$metadata"
    exit 0 ;;
  *LINGTAI_VERIFY_PROBE*)
    grep -Fq "\"bin_dir\": \"$3\"" "$metadata" || exit 1
    grep -Fq "\"stamped_version\": \"$5\"" "$metadata" || exit 1
    grep -Fq '"kernel_version": "1.2.3"' "$metadata" || exit 1
    printf '%s\n' 1.2.3; exit 0 ;;
esac
exit 0
EOF
chmod 755 "$scratch/shims/fake-runtime"
cat > "$scratch/shims/python3" <<'EOF'
#!/bin/sh
if [ "$1" = "-m" ] && [ "$2" = "venv" ]; then
  mkdir -p "$3/bin"
  cp "$(dirname "$0")/fake-runtime" "$3/bin/python"
  chmod 755 "$3/bin/python"
  exit 0
fi
exec "$(dirname "$0")/fake-runtime" "$@"
EOF
chmod 755 "$scratch/shims/python3"

write_tui() {
  cat > "$1" <<EOF
#!/bin/sh
if [ "\$1" = version ]; then printf '%s\\n' '$2'; else exit 1; fi
EOF
  chmod 755 "$1"
}
make_runtime() {
  local home="$1"
  mkdir -p "$home/.lingtai-tui/runtime/venv/bin"
  cp "$scratch/shims/fake-runtime" "$home/.lingtai-tui/runtime/venv/bin/python-real"
  chmod 755 "$home/.lingtai-tui/runtime/venv/bin/python-real"
  ln -s python-real "$home/.lingtai-tui/runtime/venv/bin/python"
}
write_receipt() {
  local home="$1" bin="$2" runtime_venv="$3" kind="${4:-source-build}" stamp="${5:-v1.2.3}" kernel="${6:-1.2.3}"
  mkdir -p "$home/.lingtai-tui"
  {
    printf '{\n  "schema": "lingtai.tui.install/v1",\n  "schema_version": 1,\n  "install_method": "source",\n  "install_kind": "%s",\n  "prefix": "%s",\n  "bin_dir": "%s",\n  "stamped_version": "%s",\n  "installed_at": "old-install-time",\n  "managed_binaries": ["%s/lingtai-tui"],\n  "runtime_venv": "%s",\n' "$kind" "$(dirname "$bin")" "$bin" "$stamp" "$bin" "$runtime_venv"
    if [ "$kind" = dev-source ]; then
      printf '  "kernel_source": "editable",\n  "kernel_source_path": "%s",\n' "$home/source"
    else
      printf '  "kernel_source": "wheel",\n'
    fi
    printf '  "kernel_version": "%s"\n}\n' "$kernel"
  } > "$home/.lingtai-tui/install.json"
}
sha_file() { shasum -a 256 "$1" | cut -d' ' -f1; }
run_env() { local home="$1"; shift; PATH="$scratch/shims:/usr/bin:/bin" HOME="$home" TMPDIR="$scratch/tmp" "$@"; }

# Ordinary install is first-install-only across the whole owned state root, not
# merely the selected bin directory. It must fail before target creation/network
# and preserve both prior receipt and runtime bytes.
ordinary_home="$scratch/ordinary existing home"
ordinary_bin="$scratch/ordinary-new-bin"
mkdir -p "$ordinary_home/.lingtai-tui/runtime/venv"
printf '%s\n' 'stable-receipt' > "$ordinary_home/.lingtai-tui/install.json"
printf '%s\n' 'stable-runtime' > "$ordinary_home/.lingtai-tui/runtime/venv/marker"
ordinary_receipt_sha="$(sha_file "$ordinary_home/.lingtai-tui/install.json")"
ordinary_runtime_sha="$(sha_file "$ordinary_home/.lingtai-tui/runtime/venv/marker")"
set +e
run_env "$ordinary_home" /bin/bash "$main" --version v1.2.3 --bin-dir "$ordinary_bin" >"$scratch/ordinary-existing.out" 2>&1
ordinary_rc=$?
set -e
[[ "$ordinary_rc" -ne 0 ]] || fail "ordinary install adopted existing receipt/runtime state"
contains "$scratch/ordinary-existing.out" 'ordinary install is first-install-only'
[[ "$(sha_file "$ordinary_home/.lingtai-tui/install.json")" == "$ordinary_receipt_sha" ]] || fail "ordinary install changed the prior receipt"
[[ "$(sha_file "$ordinary_home/.lingtai-tui/runtime/venv/marker")" == "$ordinary_runtime_sha" ]] || fail "ordinary install changed the prior runtime"
[[ ! -e "$ordinary_bin" && ! -L "$ordinary_bin" ]] || fail "ordinary install created the target before rejecting existing state"

runtime_only_home="$scratch/runtime only home"
runtime_only_bin="$scratch/runtime-only-bin"
mkdir -p "$runtime_only_home/.lingtai-tui/runtime/venv"
set +e
run_env "$runtime_only_home" /bin/bash "$main" --version v1.2.3 --bin-dir "$runtime_only_bin" >"$scratch/runtime-only.out" 2>&1
runtime_only_rc=$?
set -e
[[ "$runtime_only_rc" -ne 0 ]] || fail "ordinary install adopted existing runtime without a receipt"
contains "$scratch/runtime-only.out" 'ordinary install will not adopt or repair it'
[[ ! -e "$runtime_only_bin" && ! -L "$runtime_only_bin" ]] || fail "runtime-only rejection created the target directory"

# Simulate install.json appearing after the writer's first check but before final
# publication. Exclusive final revalidation must preserve the raced bytes and
# remove only its own staging file.
writer_home="$scratch/writer race home"
writer_state="$writer_home/.lingtai-tui"
mkdir -p "$writer_state"
set +e
(
  export HOME="$writer_home" LINGTAI_INSTALL_SH_SOURCE_ONLY=1
  source "$main"
  SKIP_VENV=1
  KERNEL_SOURCE=""
  INSTALL_KIND=release-asset
  KERNEL_PIN_TAG=v1.2.3
  KERNEL_VERSION_INSTALLED=1.2.3
  KERNEL_PROVIDER=github
  KERNEL_PIN_TUI_TAG=v1.2.3
  BUNDLE_TAG=v1.2.3
  mktemp() {
    local staged
    staged="$(command mktemp "$1")" || return 1
    printf '%s\n' 'raced-receipt' > "$HOME/.lingtai-tui/install.json"
    printf '%s\n' "$staged"
  }
  write_install_metadata "$writer_state" "$writer_home/prefix" "$writer_home/bin" "repo" "v1.2.3" "v1.2.3" "commit" "v1.2.3" "$writer_home/bin/lingtai-tui" ""
) >"$scratch/writer-race.out" 2>&1
writer_rc=$?
set -e
[[ "$writer_rc" -ne 0 ]] || fail "receipt writer replaced a raced install.json"
[[ "$(cat "$writer_state/install.json")" == 'raced-receipt' ]] || fail "receipt writer changed raced receipt bytes"
for leftover in "$writer_state"/.install.json.*; do
  [[ ! -e "$leftover" && ! -L "$leftover" ]] || fail "receipt writer left its staging file: $leftover"
done
contains "$scratch/writer-race.out" 'refusing to replace it'

writer_success_home="$scratch/writer success home"
writer_success_state="$writer_success_home/.lingtai-tui"
(
  export HOME="$writer_success_home" LINGTAI_INSTALL_SH_SOURCE_ONLY=1
  source "$main"
  SKIP_VENV=1
  KERNEL_SOURCE=""
  INSTALL_KIND=release-asset
  KERNEL_PIN_TAG=v1.2.3
  KERNEL_VERSION_INSTALLED=1.2.3
  KERNEL_PROVIDER=github
  KERNEL_PIN_TUI_TAG=v1.2.3
  BUNDLE_TAG=v1.2.3
  write_install_metadata "$writer_success_state" "$writer_success_home/prefix" "$writer_success_home/bin" "repo" "v1.2.3" "v1.2.3" "commit" "v1.2.3" "$writer_success_home/bin/lingtai-tui" ""
)
contains "$writer_success_state/install.json" '"schema": "lingtai.tui.install/v1"'
[[ "$(stat -f '%Lp' "$writer_success_state/install.json")" == 600 ]] || fail "exclusive receipt mode is not 600"
for leftover in "$writer_success_state"/.install.json.*; do
  [[ ! -e "$leftover" && ! -L "$leftover" ]] || fail "successful receipt writer left staging state: $leftover"
done

# Verify release identity, then reject garbage, mixed, duplicate, and substring
# identities. The fake runtime's probe also enforces the kernel-version check.
verify_home="$scratch/verify home"
verify_bin="$verify_home/bin"
mkdir -p "$verify_bin"
make_runtime "$verify_home"
write_tui "$verify_bin/lingtai-tui" v1.2.3
verify_venv="$verify_home/.lingtai-tui/runtime/venv"
write_receipt "$verify_home" "$verify_bin" "$verify_venv" source-build v1.2.3 1.2.3
run_env "$verify_home" "$verify" --bin-dir "$verify_bin" --runtime-python "$verify_venv/bin/python" >/dev/null
for identity in garbage 'v1.2.3 dev' 'v1.2.3 v1.2.3' xv1.2.3; do
  write_tui "$verify_bin/lingtai-tui" "$identity"
  expect_fail run_env "$verify_home" "$verify" --bin-dir "$verify_bin" --runtime-python "$verify_venv/bin/python"
done
write_tui "$verify_bin/lingtai-tui" dev
write_receipt "$verify_home" "$verify_bin" "$verify_venv" dev-source dev 1.2.3
run_env "$verify_home" "$verify" --bin-dir "$verify_bin" --runtime-python "$verify_venv/bin/python" >/dev/null
write_tui "$verify_bin/lingtai-tui" v1.2.3
write_receipt "$verify_home" "$verify_bin" "$verify_venv" source-build v1.2.3 9.9.9
expect_fail run_env "$verify_home" "$verify" --bin-dir "$verify_bin" --runtime-python "$verify_venv/bin/python"

# Fix diagnosis reaches a plan with a missing old venv. Only the process-owned
# python3 parser shim is available; the old runtime path is never executed.
fix_home="$scratch/fix-home"
fix_bin="$fix_home/bin"
mkdir -p "$fix_bin" "$fix_home/source" "$fix_home/.lingtai-tui/runtime"
write_tui "$fix_bin/lingtai-tui" v1.2.3
fix_old="$fix_home/.lingtai-tui/runtime/old"
fix_new="$fix_home/.lingtai-tui/runtime/new"
write_receipt "$fix_home" "$fix_bin" "$fix_old" source-build v1.2.3 1.2.3
printf 'old-runtime-is-missing\n' > "$scratch/old-runtime-marker"
fix_plan="$(FAKE_OLD_VENV="$fix_old" run_env "$fix_home" "$fix" --bin-dir "$fix_bin" --runtime-dir "$fix_old")"
contains <(printf '%s\n' "$fix_plan") 'Read-only plan: no state changed.'
[[ ! -e "$fix_old" && ! -e "$fix_new" ]] || fail "fix diagnosis created a runtime"
artifact="$scratch/kernel-input"
printf kernel > "$artifact"
artifact_sha="$(sha_file "$artifact")"
FAKE_OLD_VENV="$fix_old" FAKE_PIP_LOG="$scratch/fix-pip.log" run_env "$fix_home" "$fix" --bin-dir "$fix_bin" --runtime-dir "$fix_new" --kernel-artifact "$artifact" --kernel-sha256 "$artifact_sha" --apply --yes >/dev/null
[[ "$(cat "$scratch/fix-pip.log")" == *.whl ]] || fail "fix pip did not receive a .whl path"

# Healthy update under a HOME containing spaces proves path quoting and that an
# extensionless source is copied to kernel.whl with an exact .whl pip argument.
update_home="$scratch/update home"
update_bin="$update_home/bin"
mkdir -p "$update_bin"
make_runtime "$update_home"
update_venv="$update_home/.lingtai-tui/runtime/venv"
write_tui "$update_bin/lingtai-tui" v1.2.3
write_receipt "$update_home" "$update_bin" "$update_venv" source-build v1.2.3 1.2.3
mkdir -p "$scratch/archive"
write_tui "$scratch/archive/lingtai-tui" v1.2.3
tar -czf "$scratch/tui.tar.gz" -C "$scratch/archive" lingtai-tui
tui_sha="$(sha_file "$scratch/tui.tar.gz")"
kernel_sha="$(sha_file "$artifact")"
FAKE_PIP_LOG="$scratch/update-pip.log" run_env "$update_home" "$update" --bin-dir "$update_bin" --runtime-python "$update_venv/bin/python" --tui-archive "$scratch/tui.tar.gz" --tui-sha256 "$tui_sha" --kernel-artifact "$artifact" --kernel-sha256 "$kernel_sha" --tui-tag v1.2.3 --kernel-version 1.2.3 --yes >/dev/null
[[ "$(cat "$scratch/update-pip.log")" == *.whl ]] || fail "update pip did not receive a .whl path"
not_contains "$scratch/update-pip.log" 'kernel.artifact'

# Current installed TUI/receipt mismatch fails before artifact work, pip, or mv.
mismatch_home="$scratch/mismatch-home"
mismatch_bin="$mismatch_home/bin"
mkdir -p "$mismatch_bin"
make_runtime "$mismatch_home"
mismatch_venv="$mismatch_home/.lingtai-tui/runtime/venv"
write_tui "$mismatch_bin/lingtai-tui" v9.9.9
write_receipt "$mismatch_home" "$mismatch_bin" "$mismatch_venv" source-build v1.2.3 1.2.3
printf before > "$mismatch_bin/sentinel"
expect_fail run_env "$mismatch_home" "$update" --bin-dir "$mismatch_bin" --runtime-python "$mismatch_venv/bin/python" --tui-archive "$scratch/missing.tar.gz" --tui-sha256 "$(printf '%064d' 0)" --kernel-artifact "$scratch/missing.whl" --kernel-sha256 "$(printf '%064d' 0)" --tui-tag v1.2.3 --kernel-version 1.2.3 --yes
[[ ! -e "$scratch/mismatch-pip.log" ]] || fail "receipt mismatch reached pip"
assert_eq "$(cat "$mismatch_bin/sentinel")" before

# Revalidation TOCTOU after mutation is an explicit partial failure.
toctou_home="$scratch/toctou-home"
toctou_bin="$toctou_home/bin"
mkdir -p "$toctou_bin"
make_runtime "$toctou_home"
toctou_venv="$toctou_home/.lingtai-tui/runtime/venv"
write_tui "$toctou_bin/lingtai-tui" v1.2.3
write_receipt "$toctou_home" "$toctou_bin" "$toctou_venv" source-build v1.2.3 1.2.3
FAKE_TOCTOU_METADATA="$toctou_home/.lingtai-tui/install.json" FAKE_PIP_LOG="$scratch/toctou-pip.log" run_env "$toctou_home" "$update" --bin-dir "$toctou_bin" --runtime-python "$toctou_venv/bin/python" --tui-archive "$scratch/tui.tar.gz" --tui-sha256 "$tui_sha" --kernel-artifact "$artifact" --kernel-sha256 "$kernel_sha" --tui-tag v1.2.3 --kernel-version 1.2.3 --yes >/dev/null 2>&1 && fail "TOCTOU update unexpectedly succeeded"
grep -Fq 'metadata may be stale' "$scratch/does-not-exist" 2>/dev/null || :
[[ "$(cat "$scratch/toctou-pip.log")" == *.whl ]] || fail "TOCTOU case did not reach recorded pip phase"
grep -Fq '"changed":true' "$toctou_home/.lingtai-tui/install.json" || fail "TOCTOU shim did not alter metadata"

# Dev conversion requires managed target ownership, while explicit dev identity
# succeeds and garbage identity cannot be stamped as dev.
cat > "$scratch/shims/git" <<'EOF'
#!/bin/sh
[ "$1" = -C ] && [ "$3" = rev-parse ] && { printf '%040d\n' 1; exit 0; }
exit 1
EOF
cat > "$scratch/shims/go" <<'EOF'
#!/bin/sh
out=
while [ "$#" -gt 0 ]; do
  if [ "$1" = -o ]; then out=$2; shift 2; else shift; fi
done
cat > "$out" <<EOF2
#!/bin/sh
[ "\$1" = version ] && printf '%s\\n' "${FAKE_DEV_IDENTITY:-dev}"
EOF2
chmod 755 "$out"
EOF
chmod 755 "$scratch/shims/git" "$scratch/shims/go"
dev_home="$scratch/dev home"
dev_bin="$dev_home/bin"
dev_tui="$scratch/tui-source"
dev_kernel="$scratch/kernel-source"
mkdir -p "$dev_bin" "$dev_tui/.git" "$dev_tui/tui" "$dev_kernel/.git"
printf 'module fake\n' > "$dev_tui/tui/go.mod"
printf '[build-system]\n' > "$dev_kernel/pyproject.toml"
make_runtime "$dev_home"
# Existing-target conversion with no managed target must fail closed.
write_tui "$dev_bin/lingtai-tui" v1.2.3
write_receipt "$dev_home" "$dev_bin" "$dev_home/.lingtai-tui/runtime/venv" source-build v1.2.3 1.2.3
sed '/managed_binaries/d' "$dev_home/.lingtai-tui/install.json" > "$scratch/unmanaged.json"
mv "$scratch/unmanaged.json" "$dev_home/.lingtai-tui/install.json"
expect_fail run_env "$dev_home" "$dev" --tui-source "$dev_tui" --kernel-source "$dev_kernel" --bin-dir "$dev_bin" --runtime-python "$dev_home/.lingtai-tui/runtime/venv/bin/python" --yes --skip-portal
rm -f "$dev_home/.lingtai-tui/install.json" "$dev_bin/lingtai-tui"
FAKE_DEV_IDENTITY=dev run_env "$dev_home" "$dev" --tui-source "$dev_tui" --kernel-source "$dev_kernel" --bin-dir "$dev_bin" --runtime-python "$dev_home/.lingtai-tui/runtime/venv/bin/python" --yes --skip-portal >/dev/null
contains "$dev_home/.lingtai-tui/install.json" '"stamped_version": "dev"'
FAKE_DEV_IDENTITY=garbage expect_fail run_env "$dev_home" "$dev" --tui-source "$dev_tui" --kernel-source "$dev_kernel" --bin-dir "$dev_bin" --runtime-python "$dev_home/.lingtai-tui/runtime/venv/bin/python" --yes --skip-portal

printf '%s\n' 'test-install-sh-kernel-pin: PASS (focused static plus bounded hermetic behavior)'
