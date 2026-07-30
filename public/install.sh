#!/usr/bin/env bash
# For coding-agent maintainers:
# - Read the repository-root CONTRACT.md and
#   public/help/reference/installation/CONTRACT.md before changing this file.
# - Preserve this entrypoint's operation, ownership, consent, and mutation boundary;
#   do not turn one operation into an implicit install, update, repair, or deploy.
# - Keep executable behavior, both Contracts, both Anatomies, and public guidance
#   in lockstep; do not add static, shim, fake-command, or hermetic acceptance tests.
# - Every install.sh change must run this exact final candidate end-to-end in a
#   brand-new non-root isolated Linux environment with an empty HOME and real
#   network/artifact inputs. Accept only observed TUI/runtime/import/provenance/
#   receipt behavior or honest partial failure; source grep and fake CLI output
#   are not acceptance.
# - Never publish a success receipt before every declared postcondition passes;
#   report partial state honestly and do not treat failure as cleanup authority.
# - These maintenance rules grant no merge, release, deploy, auth, config, or
#   deletion authority.
# This file owns first-install ordinary state. Explicit --latest delegates to
# the pinned current-main TUI installer, which owns that latest-main operation.
# Other modes never adopt, update, or repair existing state; only --skip-python permits TUI-only.
# One-shot installer for lingtai-tui and lingtai-portal, plus the Python
# `lingtai` runtime venv at ~/.lingtai-tui/runtime/venv.
#
# Homebrew is NOT required. By default this installs the latest GitHub Release:
# it downloads a prebuilt per-platform binary tarball when one exists, and
# otherwise falls back to building the release source tarball with Go/npm. If
# the installed Go is missing or older than tui/go.mod requires (distro
# packages often are), the official Go toolchain tarball is downloaded for the
# build. It then creates or updates the Python runtime venv and installs the
# `lingtai` package into it.
#
# Public entry point (once served from the website):
#   curl -fsSL https://lingtai.ai/install.sh | bash
#
# Direct-from-repo equivalent:
#   curl -fsSL https://raw.githubusercontent.com/Lingtai-AI/lingtai/main/install.sh | bash
#
# Install a specific release:
#   ./install.sh --version v0.10.5
#
# Binary release assets follow this naming convention (also produced by
# .github/workflows/release.yml):
#   lingtai-<tag>-<os>-<arch>.tar.gz    e.g. lingtai-v0.10.5-linux-amd64.tar.gz
# where <os> is darwin|linux and <arch> is amd64|arm64. The tarball contains
# lingtai-tui and (when built) lingtai-portal at its top level.
#
# Source policy (--source auto|github|gitee, or LINGTAI_SOURCE env; default
# auto): auto runs a bounded, fail-open public-IP country lookup and prefers
# Gitee (huangzesen1997/lingtai + huangzesen1997/lingtai-kernel) for mainland
# China. Releases may publish a small "bundle manifest" binding one exact TUI
# tag to one exact pinned kernel release/version/artifacts/checksums — see
# RELEASING.md. Source-only TUI releases instead commit kernel-release.json at
# that exact tag. A provider fallback (Gitee unreachable, or missing an asset)
# always re-fetches the SAME resolved tag/pin from the other provider; it never
# independently re-resolves "latest" on the fallback. The Python `lingtai`
# runtime is installed from that pinned kernel release artifact by explicit
# local file path — never `pip install lingtai` from any package index — with
# SHA256 verified before install. Third-party dependencies still resolve via
# the configured package index (LINGTAI_PYPI_INDEX_URL, default pypi.org); only
# lingtai's own bytes are pinned. If no compatible platform wheel exists for
# the runtime's interpreter, the pinned sdist is used instead (may require a
# local build toolchain).
#
# LingTai is NEVER installed by requesting the package name "lingtai" from
# any index — there is no PyPI fallback. On the default one-command path an
# exact pinned bundle or release pin is mandatory: if neither can be resolved
# (either provider, same-tag fallback attempted), or the selected kernel
# artifact fails to verify/install, the installer FAILS LOUD with the exact
# provider/tag/error rather than degrading to a package-index install.
# The canonical release path always requires an exact kernel pin or bundle;
# --skip-python (alias --skip-venv) is the explicit opt-out for a TUI/portal-only
# install; you then provision the Python runtime yourself.
set -euo pipefail

REPO_SLUG="Lingtai-AI/lingtai"
REPO="https://github.com/${REPO_SLUG}.git"
API_BASE="https://api.github.com/repos/${REPO_SLUG}"
DOWNLOAD_BASE="https://github.com/${REPO_SLUG}/releases/download"
RAW_INSTALL_URL="https://raw.githubusercontent.com/${REPO_SLUG}/main/install.sh"
GO_DL_BASE="${LINGTAI_GO_DL_BASE:-https://go.dev/dl}"  # official Go toolchain downloads
NODE_DL_BASE="${LINGTAI_NODE_DL_BASE:-https://nodejs.org/dist}"
UV_INSTALLER_URL="${LINGTAI_UV_INSTALLER_URL:-https://astral.sh/uv/install.sh}"  # official uv bootstrap installer
NODE_TOOLCHAIN_VERSION="${LINGTAI_NODE_VERSION:-22.12.0}"

# Gitee mirror: a real repository, but release assets may not exist for every
# tag yet (see gitee_release_asset_url / gitee_bundle_manifest_url below,
# which never invent a URL — they only return one after confirming presence
# via the Gitee API). GITEE_OWNER/GITEE_REPO name the TUI mirror; the kernel
# mirror repo name is derived per-lookup (see kernel_gitee_api_base).
GITEE_OWNER="${LINGTAI_GITEE_OWNER:-huangzesen1997}"
GITEE_REPO="${LINGTAI_GITEE_REPO:-lingtai}"
GITEE_KERNEL_REPO="${LINGTAI_GITEE_KERNEL_REPO:-lingtai-kernel}"
GITEE_API_BASE="https://gitee.com/api/v5/repos/${GITEE_OWNER}/${GITEE_REPO}"
GITEE_KERNEL_API_BASE="https://gitee.com/api/v5/repos/${GITEE_OWNER}/${GITEE_KERNEL_REPO}"
KERNEL_GH_API_BASE="https://api.github.com/repos/Lingtai-AI/lingtai-kernel"
BUNDLE_TUI_ARCHIVE_SHA=""

# Country-detection endpoints for auto source selection. Two independent,
# unauthenticated, no-signup providers so one outage doesn't force a GitHub
# fallback for every mainland user; each probe is short-timeout and its
# result is discarded (fail-open) on any error. Only the two-letter country
# code of the requester's public IP is requested — no identity, no
# credentials, no persistent client. Overridable for tests/offline use.
COUNTRY_DETECT_URL_1="${LINGTAI_COUNTRY_DETECT_URL_1:-https://ipapi.co/country/}"
COUNTRY_DETECT_URL_2="${LINGTAI_COUNTRY_DETECT_URL_2:-https://ifconfig.co/country-iso}"
MIRROR_TIMEOUT="${LINGTAI_MIRROR_TIMEOUT:-3}"

# Package index used to resolve the verified local LingTai artifact's
# third-party dependencies -- never LingTai itself, which is always installed
# from an explicit local path. The Gitee default exists because the whole point
# of the Gitee route is serving mainland-China hosts, and pypi.org is not
# reliably reachable from them: resolving a Gitee-served bundle's dependencies
# against pypi.org left exactly the users that route exists for stalling on an
# unreachable index. Backported from Lingtai-AI/lingtai (#701).
PYPI_INDEX_URL_DEFAULT="https://pypi.org/simple"
PYPI_INDEX_URL_GITEE_DEFAULT="https://mirrors.tuna.tsinghua.edu.cn/pypi/web/simple"

TMPDIR="${TMPDIR:-/tmp}"
BUILD_DIR="$TMPDIR/lingtai-install-$$"

# --- flags / state -----------------------------------------------------------
VERSION=""           # explicit exact release tag to install (default: latest release)
INSTALL_PREFIX=""    # --prefix: install root (bin_dir = <prefix>/bin)
BIN_DIR_OVERRIDE=""  # --bin-dir: explicit bin directory
NON_INTERACTIVE=0    # --non-interactive: never prompt / never sudo-install packages
FROM_SOURCE=0        # --from-source: skip release-asset download, always build
SKIP_PORTAL=0        # --skip-portal: TUI only
SKIP_VENV=0          # --skip-python (alias: --skip-venv): don't touch the Python runtime venv
INSTALL_KIND=""      # "release-asset" | "source-build" (recorded in metadata)
SOURCE_ARG="${LINGTAI_SOURCE:-auto}"  # --source auto|github|gitee (env LINGTAI_SOURCE)
BUNDLE_PROVIDER=""    # resolved by resolve_source_provider(): "github" | "gitee"
BUNDLE_TAG=""         # resolved TUI release tag shared by the archive + bundle/pin path
BUNDLE_MANIFEST_JSON="" # raw bundle manifest body, once fetched
BUNDLE_REQUIRED=0     # 1 on the canonical release path: an exact pinned bundle or
                      # release pin is mandatory, so a missing/incoherent/failed pin or
                      # kernel install fails loud rather than falling back to an index install.
KERNEL_SOURCE=""      # "bundle" | "release-pin" (never a package-index install)
KERNEL_BUNDLE_ID=""
KERNEL_RELEASE_TAG=""
KERNEL_VERSION_INSTALLED=""
KERNEL_PROVIDER=""
KERNEL_PIN_JSON=""
KERNEL_PIN_TAG=""
KERNEL_PIN_PROVIDER=""
KERNEL_PIN_TUI_TAG=""
KERNEL_MANIFEST_PROVIDER=""  # set by fetch_kernel_manifest(); which provider actually served the kernel manifest
KERNEL_MANIFEST_JSON=""      # set by fetch_kernel_manifest() in the same shell as the provider
BUNDLE_MANIFEST_KERNEL_TAG=""
BUNDLE_MANIFEST_KERNEL_VERSION=""
BUNDLE_MANIFEST_KERNEL_FILENAME=""
BUNDLE_MANIFEST_BUNDLE_ID=""

RUNTIME_VENV_DIR=""

usage() {
  cat <<'EOF'
LingTai official installer: install the paired TUI/Portal release and pinned Python runtime.

  ./install.sh [options]

Maintenance and development are explicit child assets, not ordinary install modes:
  https://lingtai.ai/help/reference/installation/skill.md
EOF
}

install_usage() {
  cat <<'EOF'
Usage: install.sh [options]

Install one exact official TUI/Portal release and its pinned Python runtime.
  --version <tag>        Install this official release tag instead of latest.
  --latest               Explicitly install current TUI main + kernel main (delegated, no stable fallback).
  --ref <ref>            Hand off arbitrary development ref work to assets/dev.sh (exit 2).
  --bin-dir <dir>        Install binaries into <dir>.
  --prefix <dir>         Install binaries into <prefix>/bin.
  --from-source          Build the selected official release from source.
  --skip-portal          Install lingtai-tui without Portal.
  --skip-python          Do not provision the Python runtime (alias: --skip-venv).
  --source <auto|github|gitee>  Select the official release mirror.
  --non-interactive      Keep the ordinary install non-prompting.
  -h, --help             Show this help.

For update, development, repair, or verification, read:
  https://lingtai.ai/help/reference/installation/skill.md
EOF
}

compatibility_handoff() {
  local child="$1"
  echo "error: this maintenance surface moved out of install.sh; ordinary install does not auto-source helper assets." >&2
  echo "Read the exact child: https://lingtai.ai/help/reference/installation/${child}" >&2
  return 2
}

show_help_for_mode() { install_usage; }

# --- messaging helpers -------------------------------------------------------
say()  { echo "==> $*"; }
warn() { echo "warning: $*" >&2; }
note() { echo "    $*"; }

# print_path_hint tells the user how to put BIN_DIR on PATH, using the startup
# file their ACTUAL shell reads. This previously hardcoded ~/.bashrc for every
# shell, which is wrong on macOS: the default shell there is zsh, which never
# reads .bashrc, so the suggested command appeared to succeed and changed
# nothing. An unrecognized shell gets the bare export rather than a guess at a
# filename. Nothing is written -- the user runs it. Backported from
# Lingtai-AI/lingtai (#705).
print_path_hint() {
  local bin_dir="$1" shell_name="${SHELL:-}" rc_file
  case ":${PATH}:" in
    *":${bin_dir}:"*) return 0 ;;
  esac
  case "${shell_name##*/}" in
    zsh)  rc_file="$HOME/.zshrc" ;;
    bash) rc_file="$HOME/.bashrc" ;;
    *)
      say "Note: $bin_dir is not on your PATH. Add this export to your shell startup file:"
      note "export PATH=\"$bin_dir:\$PATH\""
      return 0
      ;;
  esac
  say "Note: $bin_dir is not on your PATH. Add it with:"
  note "echo 'export PATH=\"$bin_dir:\$PATH\"' >> \"$rc_file\" && source \"$rc_file\""
}

# is_wsl reports whether we're running under Windows Subsystem for Linux.
is_wsl() {
  if [[ -n "${WSL_DISTRO_NAME:-}" || -n "${WSL_INTEROP:-}" ]]; then
    return 0
  fi
  if [[ -r /proc/version ]] && grep -qiE 'microsoft|wsl' /proc/version 2>/dev/null; then
    return 0
  fi
  return 1
}

# Print a platform-appropriate install hint for a missing tool. Maps tool
# names to the package each manager actually ships (go is golang-go on
# Debian/Ubuntu, golang on Fedora, etc.). Homebrew is only suggested on macOS,
# never as the primary Linux path.
suggest_install() {
  local tool="$1" pkg="$1"
  if command -v apt-get &>/dev/null; then
    [[ "$tool" == "go" ]] && pkg="golang-go"
    [[ "$tool" == "npm" ]] && pkg="nodejs npm"
    [[ "$tool" == "python3" ]] && pkg="python3 python3-venv python3-pip"
    echo "      sudo apt-get update && sudo apt-get install -y $pkg" >&2
  elif command -v dnf &>/dev/null; then
    [[ "$tool" == "go" ]] && pkg="golang"
    [[ "$tool" == "npm" ]] && pkg="nodejs npm"
    [[ "$tool" == "python3" ]] && pkg="python3 python3-pip"
    echo "      sudo dnf install -y $pkg" >&2
  elif command -v pacman &>/dev/null; then
    [[ "$tool" == "npm" ]] && pkg="nodejs npm"
    [[ "$tool" == "python3" ]] && pkg="python python-pip"
    echo "      sudo pacman -S --needed $pkg" >&2
  elif command -v apk &>/dev/null; then
    [[ "$tool" == "npm" ]] && pkg="nodejs npm"
    [[ "$tool" == "python3" ]] && pkg="python3 py3-pip"
    echo "      sudo apk add $pkg" >&2
  elif command -v zypper &>/dev/null; then
    [[ "$tool" == "npm" ]] && pkg="nodejs npm"
    [[ "$tool" == "python3" ]] && pkg="python3 python3-pip"
    echo "      sudo zypper install $pkg" >&2
  elif [[ "$(uname -s)" == "Darwin" ]] || command -v brew &>/dev/null; then
    echo "      brew install $tool" >&2
  else
    echo "      install '$tool' with your system package manager" >&2
  fi
}

# --- platform detection ------------------------------------------------------

# detect_os prints darwin|linux, or "unsupported".
detect_os() {
  case "$(uname -s)" in
    Darwin) echo "darwin" ;;
    Linux)  echo "linux" ;;
    *)      echo "unsupported" ;;
  esac
}

# detect_arch prints amd64|arm64, or "unsupported".
detect_arch() {
  case "$(uname -m)" in
    x86_64 | amd64)          echo "amd64" ;;
    arm64 | aarch64)         echo "arm64" ;;
    *)                       echo "unsupported" ;;
  esac
}

# asset_name builds the release asset filename for a tag/os/arch triple. Keep
# this identical to the workflow's packaging step.
asset_name() {
  local tag="$1" os="$2" arch="$3"
  printf 'lingtai-%s-%s-%s.tar.gz' "$tag" "$os" "$arch"
}

# --- release metadata --------------------------------------------------------

# release_tag_name echoes its argument only when it is a strict vX.Y.Z tag,
# tolerating a refs/tags/ prefix. Empty output means "not an exact release tag".
release_tag_name() {
  local ref="${1#refs/tags/}"
  if [[ "$ref" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    printf '%s' "$ref"
  fi
}

# latest_release_tag queries the GitHub API for the latest published release
# tag. Falls back to the newest v* git tag if the API is unreachable.
latest_release_tag() {
  local body tag
  if command -v curl &>/dev/null; then
    body="$(curl -fsSL --max-time 15 "$API_BASE/releases/latest" 2>/dev/null || true)"
    tag="$(printf '%s' "$body" | grep -o '"tag_name"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')"
    if [[ -n "$tag" ]]; then
      printf '%s' "$tag"
      return 0
    fi
  fi
  # Fallback: newest semver-looking tag from the git remote.
  if command -v git &>/dev/null; then
    tag="$(git ls-remote --tags "$REPO" 'v*' 2>/dev/null \
      | sed 's#.*refs/tags/##; s/\^{}//' \
      | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' \
      | sort -t. -k1,1V | tail -1)"
    if [[ -n "$tag" ]]; then
      printf '%s' "$tag"
      return 0
    fi
  fi
  return 1
}

# release_asset_url echoes the download URL for an asset if the release exposes
# it, otherwise nothing. Uses the release API listing so a 404 tarball is not
# mistaken for a present asset.
release_asset_url() {
  local tag="$1" name="$2" body
  command -v curl &>/dev/null || return 1
  body="$(curl -fsSL --max-time 15 "$API_BASE/releases/tags/$tag" 2>/dev/null || true)"
  [[ -n "$body" ]] || return 1
  if printf '%s' "$body" | grep -q "\"name\"[[:space:]]*:[[:space:]]*\"$name\""; then
    printf '%s/%s/%s' "$DOWNLOAD_BASE" "$tag" "$name"
    return 0
  fi
  return 1
}

# --- source policy: country detection + GitHub/Gitee provider selection -----

# json_string_field extracts the first string value of a top-level JSON key
# from stdin using the same grep/sed idiom as release_asset_url/latest_release_tag
# above (no jq dependency). Not a general JSON parser — sufficient for the
# flat manifest/API shapes this script reads.
json_string_field() {
  local key="$1"
  grep -o "\"$key\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" | head -1 \
    | sed "s/.*\"$key\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\".*/\1/"
}

# detect_country_cn returns 0 if a bounded, best-effort public-IP lookup says
# the requester is in mainland China, 1 otherwise (including "could not tell"
# — this function is fail-open by contract: a lookup failure or ambiguous
# result must never be treated as CN). Two independent unauthenticated
# providers are tried in order; each is capped at MIRROR_TIMEOUT seconds.
# Only the two-letter country code is requested — no identity, no
# credentials, no persistent client, no request body beyond a plain GET.
detect_country_cn() {
  command -v curl &>/dev/null || return 1
  local cc
  cc="$(curl -fsSL --max-time "$MIRROR_TIMEOUT" "$COUNTRY_DETECT_URL_1" 2>/dev/null | tr -d '[:space:]' || true)"
  if [[ -z "$cc" ]]; then
    cc="$(curl -fsSL --max-time "$MIRROR_TIMEOUT" "$COUNTRY_DETECT_URL_2" 2>/dev/null | tr -d '[:space:]' || true)"
  fi
  [[ "$cc" == "CN" ]]
}

# gitee_reachable is a cheap liveness probe for the Gitee API, bounded the
# same way as the GitHub API calls above.
gitee_reachable() {
  command -v curl &>/dev/null || return 1
  curl -fsSL --max-time "$MIRROR_TIMEOUT" -o /dev/null "https://gitee.com/api/v5/repos/${GITEE_OWNER}/${GITEE_REPO}" 2>/dev/null
}

github_reachable() {
  command -v curl &>/dev/null || return 1
  curl -fsSL --max-time "$MIRROR_TIMEOUT" -o /dev/null "$API_BASE" 2>/dev/null
}

# resolve_source_provider sets BUNDLE_PROVIDER to "github" or "gitee" per the
# --source policy:
#   explicit override (github|gitee) -> that provider, no detection, no
#     reachability fallback (an explicit choice is honored even if degraded;
#     the caller still gets a clear error later if that provider truly has no
#     usable release).
#   auto -> bounded country lookup; CN -> prefer gitee, else github; a failed
#     or ambiguous lookup fails open to github. The preferred provider is then
#     probed for reachability; if unreachable, falls back to the other
#     provider for the SAME resolved tag/bundle (never re-resolves "latest").
resolve_source_provider() {
  case "$SOURCE_ARG" in
    github) BUNDLE_PROVIDER="github"; return 0 ;;
    gitee)  BUNDLE_PROVIDER="gitee"; return 0 ;;
  esac

  local preferred="github"
  if detect_country_cn; then
    preferred="gitee"
  fi

  if [[ "$preferred" == "gitee" ]]; then
    if gitee_reachable; then
      BUNDLE_PROVIDER="gitee"
    else
      note "Gitee unreachable; using GitHub for this install."
      BUNDLE_PROVIDER="github"
    fi
  else
    BUNDLE_PROVIDER="github"
  fi
}

# python_dependency_index_url echoes the ONE package index used to resolve the
# verified local LingTai artifact's third-party dependencies. Precedence:
#
#   1. a non-empty LINGTAI_PYPI_INDEX_URL always wins (an explicit choice is
#      honored even when it disagrees with the provider);
#   2. otherwise the default of the provider that actually served the bundle --
#      Gitee implies a mainland-China host, so Tsinghua rather than pypi.org;
#   3. otherwise pypi.org.
#
# Exactly one --index-url pair is ever passed, never --extra-index-url: adding
# pypi.org as a fallback would reintroduce the stall this avoids, because an
# unreachable index is slow rather than absent. LingTai's own bytes are still
# installed only from an explicit local path, so this affects dependency
# resolution alone. Backported from Lingtai-AI/lingtai (#701).
python_dependency_index_url() {
  if [[ -n "${LINGTAI_PYPI_INDEX_URL:-}" ]]; then
    printf '%s' "$LINGTAI_PYPI_INDEX_URL"
  elif [[ "${BUNDLE_PROVIDER:-github}" == "gitee" ]]; then
    printf '%s' "$PYPI_INDEX_URL_GITEE_DEFAULT"
  else
    printf '%s' "$PYPI_INDEX_URL_DEFAULT"
  fi
}

# --- Gitee release API (mirrors the GitHub helpers above) -------------------

# gitee_latest_release_tag queries Gitee's public "latest release" endpoint.
# Returns nonzero (prints nothing) if Gitee has no releases yet — callers
# must NOT construct a URL from this failure; see the module header note
# about never inventing a Gitee release URL.
gitee_latest_release_tag() {
  local body tag
  command -v curl &>/dev/null || return 1
  body="$(curl -fsSL --max-time 15 "${GITEE_API_BASE}/releases/latest" 2>/dev/null || true)"
  [[ -n "$body" ]] || return 1
  tag="$(printf '%s' "$body" | json_string_field tag_name)"
  [[ -n "$tag" ]] || return 1
  printf '%s' "$tag"
}

# gitee_release_asset_url echoes the browserDownloadUrl for a named attachment
# on a Gitee release tag, or nothing if the release or the named attachment
# does not exist. Uses the release-by-tag + attachment listing so a missing
# asset is detected before any download attempt, exactly like
# release_asset_url's GitHub equivalent.
gitee_release_asset_url() {
  local tag="$1" name="$2" body url
  command -v curl &>/dev/null || return 1
  body="$(curl -fsSL --max-time 15 "${GITEE_API_BASE}/releases/tags/$tag" 2>/dev/null || true)"
  [[ -n "$body" ]] || return 1
  # attach_files is an array of {name, browserDownloadUrl/browser_download_url,
  # ...}; scope the
  # match to the object containing our target name, then pull the URL out of
  # that same fragment so we don't grab an unrelated asset's URL.
  local fragment
  fragment="$(printf '%s' "$body" | grep -o "{[^{}]*\"name\"[[:space:]]*:[[:space:]]*\"$name\"[^{}]*}" | head -1)"
  [[ -n "$fragment" ]] || return 1
  url="$(printf '%s' "$fragment" | sed -n -E 's/.*"browserDownloadUrl"[[:space:]]*:[[:space:]]*"([^"]*)".*/\1/p; s/.*"browser_download_url"[[:space:]]*:[[:space:]]*"([^"]*)".*/\1/p' | head -1)"
  [[ -n "$url" && "$url" != "$fragment" ]] || return 1
  printf '%s' "$url"
}

# --- bundle manifest resolution (schema lingtai.tui.bundle/v1) --------------

# bundle_manifest_url_for_provider echoes the bundle manifest asset URL for a
# tag on the given provider, or nothing if unavailable.
bundle_manifest_url_for_provider() {
  local provider="$1" tag="$2"
  case "$provider" in
    github) release_asset_url "$tag" "lingtai-bundle-manifest.json" ;;
    gitee)  gitee_release_asset_url "$tag" "lingtai-bundle-manifest.json" ;;
    *) return 1 ;;
  esac
}

# Manifest validation happens before the owned runtime venv exists. Use any
# available system python3 for that read-only boundary; on a clean machine with
# no Python, bootstrap uv and let it provide a managed Python 3.13. Stdout stays
# reserved for parser output because callers capture it as manifest state.
run_manifest_python() {
  local body="$1" uv
  shift
  if command -v python3 >/dev/null 2>&1; then
    BODY="$body" python3 "$@"
    return
  fi
  ensure_uv >/dev/null || return 1
  uv="$(find_uv 2>/dev/null || true)"
  [[ -n "$uv" && -x "$uv" ]] || return 1
  BODY="$body" "$uv" run --no-project --managed-python --python 3.13 -- python "$@"
}

# parse_kernel_pin_manifest validates the small source-owned pin committed at an
# exact TUI release tag. The released file has exactly these three keys: keeping
# the parser strict prevents an accidental "latest" or provider-specific shape
# from selecting a kernel outside the TUI release's explicit contract.
parse_kernel_pin_manifest() {
  local body="$1"
  run_manifest_python "$body" - <<'PY'
import json
import os
import re


def pairs(items):
    result = {}
    for key, value in items:
        if key in result:
            raise ValueError(f"duplicate JSON key: {key}")
        result[key] = value
    return result

try:
    data = json.loads(os.environ["BODY"], object_pairs_hook=pairs)
    if not isinstance(data, dict) or set(data) != {"schema", "kernel_tag", "comment"}:
        raise ValueError("unexpected top-level keys")
    if data["schema"] != "lingtai.tui.kernel-pin/v1":
        raise ValueError("unexpected schema")
    if not isinstance(data["kernel_tag"], str) or not re.fullmatch(r"v[0-9]+\.[0-9]+\.[0-9]+", data["kernel_tag"]):
        raise ValueError("kernel_tag must be a versioned vX.Y.Z tag")
    if not isinstance(data["comment"], str) or not data["comment"].strip():
        raise ValueError("comment must be a non-empty string")
except (ValueError, TypeError, json.JSONDecodeError) as exc:
    raise SystemExit(f"invalid kernel pin manifest: {exc}")

print(data["kernel_tag"])
PY
}

# kernel_pin_url_for_provider returns kernel-release.json from the exact TUI tag;
# unlike latest-release helpers, it never resolves another tag.
kernel_pin_url_for_provider() {
  local provider="$1" tag="$2"
  case "$provider" in
    github) printf 'https://raw.githubusercontent.com/%s/%s/kernel-release.json' "$REPO_SLUG" "$tag" ;;
    gitee) printf 'https://gitee.com/%s/%s/raw/%s/kernel-release.json' "$GITEE_OWNER" "$GITEE_REPO" "$tag" ;;
    *) return 1 ;;
  esac
}

# fetch_kernel_pin fetches and strictly validates kernel-release.json from the
# exact resolved TUI tag. A missing/malformed pin on the selected provider is
# retried on the other provider for that SAME tag only.
fetch_kernel_pin() {
  local tui_tag="$1" provider="${BUNDLE_PROVIDER:-github}" other url body kernel_tag candidate
  KERNEL_PIN_JSON=""
  KERNEL_PIN_TAG=""
  KERNEL_PIN_PROVIDER=""
  KERNEL_PIN_TUI_TAG=""

  other="github"
  [[ "$provider" == "github" ]] && other="gitee"
  for candidate in "$provider" "$other"; do
    url="$(kernel_pin_url_for_provider "$candidate" "$tui_tag" || true)"
    [[ -n "$url" ]] || continue
    body="$(curl -fsSL --max-time 30 "$url" 2>/dev/null || true)"
    [[ -n "$body" ]] || continue
    if ! kernel_tag="$(parse_kernel_pin_manifest "$body" 2>/dev/null)"; then
      echo "error: kernel pin at $url failed strict validation" >&2
      continue
    fi
    KERNEL_PIN_JSON="$body"
    KERNEL_PIN_TAG="$kernel_tag"
    KERNEL_PIN_PROVIDER="$candidate"
    KERNEL_PIN_TUI_TAG="$tui_tag"
    return 0
  done
  return 1
}

# kernel_tag_for_install preserves the existing bundle as the first-priority
# source and otherwise returns the exact release pin selected above.
kernel_tag_for_install() {
  if [[ -n "$BUNDLE_MANIFEST_JSON" ]]; then
    bundle_manifest_field kernel_tag
  else
    printf '%s\n' "$KERNEL_PIN_TAG"
  fi
}

kernel_source_for_install() {
  if [[ -n "$BUNDLE_MANIFEST_JSON" ]]; then
    printf '%s\n' "bundle"
  elif [[ -n "$KERNEL_PIN_TAG" ]]; then
    printf '%s\n' "release-pin"
  fi
}

# fetch_bundle_manifest resolves BUNDLE_TAG (explicit VERSION, else latest on
# the CHOSEN provider) and BUNDLE_MANIFEST_JSON for BUNDLE_PROVIDER. If the
# preferred provider has no manifest for the resolved tag, falls back to the
# OTHER provider for the SAME tag (never re-resolves "latest" on the second
# provider — see the module header contract). Returns nonzero if neither
# provider has a usable manifest for the resolved tag.
fetch_bundle_manifest() {
  local tag="$VERSION" body url provider other candidate

  if [[ -z "$tag" ]]; then
    if [[ "$BUNDLE_PROVIDER" == "gitee" ]]; then
      tag="$(gitee_latest_release_tag || true)"
      if [[ -z "$tag" ]]; then
        note "Gitee has no releases yet; using GitHub to resolve the latest release."
        BUNDLE_PROVIDER="github"
        tag="$(latest_release_tag || true)"
      fi
    else
      tag="$(latest_release_tag || true)"
    fi
  fi
  [[ -n "$tag" ]] || return 1

  # Keep the exact resolved TUI tag even when its bundle is absent or malformed;
  # the source-only fallback consumes this tag without resolving latest again.
  BUNDLE_TAG="$tag"
  BUNDLE_MANIFEST_JSON=""
  provider="$BUNDLE_PROVIDER"
  other="github"
  [[ "$provider" == "github" ]] && other="gitee"
  for candidate in "$provider" "$other"; do
    url="$(bundle_manifest_url_for_provider "$candidate" "$tag" || true)"
    if [[ -z "$url" ]]; then
      [[ "$candidate" == "$provider" ]] || continue
      note "$provider has no bundle manifest for $tag; trying $other for the SAME tag."
      continue
    fi
    body="$(curl -fsSL --max-time 30 "$url" 2>/dev/null || true)"
    if [[ -z "$body" ]]; then
      continue
    fi
    if ! load_bundle_manifest "$body" "$tag"; then
      echo "error: bundle manifest at $url failed strict validation" >&2
      continue
    fi
    BUNDLE_PROVIDER="$candidate"
    BUNDLE_MANIFEST_JSON="$body"
    return 0
  done
  return 1
}

# Validate the complete bundle contract at the trust boundary and print the
# canonical digest for this host's one exact archive.
parse_bundle_manifest() {
  local body="$1" expected_tag="$2"
  run_manifest_python "$body" - "$expected_tag" "$(detect_os)" "$(detect_arch)" <<'PY'
import datetime, json, os, re, sys
expected_tag, os_name, arch = sys.argv[1:]
def pairs(items):
    result = {}
    for key, value in items:
        if key in result:
            raise ValueError(f"duplicate JSON key: {key}")
        result[key] = value
    return result
def exact(value, keys, label):
    if not isinstance(value, dict) or set(value) != set(keys):
        raise ValueError(f"{label} has the wrong object shape")
def string(value, label):
    if not isinstance(value, str) or not value:
        raise ValueError(f"{label} must be a nonempty string")
    return value
try:
    data = json.loads(os.environ["BODY"], object_pairs_hook=pairs)
    exact(data, ("schema", "bundle_id", "tui_tag", "tui_commit", "generated_at", "kernel_tag", "kernel_version", "kernel_manifest_filename", "archives", "providers"), "manifest")
    if data["schema"] != "lingtai.tui.bundle/v1": raise ValueError("unexpected schema")
    for key in ("bundle_id", "tui_tag", "tui_commit", "kernel_tag", "kernel_version", "kernel_manifest_filename"): string(data[key], key)
    if data["bundle_id"] != data["tui_tag"] or data["tui_tag"] != expected_tag: raise ValueError("bundle_id/tui_tag does not equal resolved tag")
    if not re.fullmatch(r"[0-9a-f]{40}", data["tui_commit"]): raise ValueError("tui_commit must be a 40-character lowercase commit SHA")
    generated_at = data["generated_at"]
    if not isinstance(generated_at, str) or not re.fullmatch(r"[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z", generated_at): raise ValueError("generated_at must be YYYY-MM-DDTHH:MM:SSZ")
    datetime.datetime.strptime(generated_at, "%Y-%m-%dT%H:%M:%SZ")
    if not isinstance(data["archives"], list) or not data["archives"]: raise ValueError("archives must be a nonempty array")
    names = set()
    for archive in data["archives"]:
        exact(archive, ("filename", "sha256"), "archive entry")
        name = string(archive["filename"], "archive filename")
        if name in names: raise ValueError("archives contains duplicate filenames")
        names.add(name)
        if not re.fullmatch(r"lingtai-[^/]+-(?:darwin|linux)-(?:amd64|arm64)\.tar\.gz", name): raise ValueError("archive filename is invalid")
        if not isinstance(archive["sha256"], str) or not re.fullmatch(r"[0-9a-f]{64}", archive["sha256"]): raise ValueError("archive sha256 must be lowercase 64-hex")
    target = f"lingtai-{expected_tag}-{os_name}-{arch}.tar.gz"
    hits = [archive for archive in data["archives"] if archive["filename"] == target]
    if len(hits) != 1: raise ValueError(f"expected exactly one archive for {target}, found {len(hits)}")
    exact(data["providers"], ("github", "gitee"), "providers")
    exact(data["providers"]["github"], ("repo",), "github provider")
    exact(data["providers"]["gitee"], ("owner", "repo"), "gitee provider")
    string(data["providers"]["github"]["repo"], "github repo")
    string(data["providers"]["gitee"]["owner"], "gitee owner")
    string(data["providers"]["gitee"]["repo"], "gitee repo")
    if not re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", data["providers"]["github"]["repo"]): raise ValueError("github repo is invalid")
    if not re.fullmatch(r"[A-Za-z0-9_.-]+", data["providers"]["gitee"]["owner"]): raise ValueError("gitee owner is invalid")
    if not re.fullmatch(r"[A-Za-z0-9_.-]+", data["providers"]["gitee"]["repo"]): raise ValueError("gitee repo is invalid")
except (ValueError, TypeError, json.JSONDecodeError) as exc:
    raise SystemExit(f"invalid strict bundle manifest: {exc}")
print(hits[0]["sha256"])
print(data["kernel_tag"])
print(data["kernel_version"])
print(data["kernel_manifest_filename"])
print(data["bundle_id"])
PY
}

validate_bundle_manifest() { parse_bundle_manifest "$1" "$2" | sed -n '1p'; }

load_bundle_manifest() {
  local body="$1" expected_tag="$2" fields=() field
  while IFS= read -r field; do fields+=("$field"); done < <(parse_bundle_manifest "$body" "$expected_tag")
  [[ "${#fields[@]}" == 5 ]] || return 1
  BUNDLE_TUI_ARCHIVE_SHA="${fields[0]}"
  BUNDLE_MANIFEST_KERNEL_TAG="${fields[1]}"
  BUNDLE_MANIFEST_KERNEL_VERSION="${fields[2]}"
  BUNDLE_MANIFEST_KERNEL_FILENAME="${fields[3]}"
  BUNDLE_MANIFEST_BUNDLE_ID="${fields[4]}"
}

# bundle_manifest_field returns values populated by the strict parser; it
# never reparses raw manifest text.
bundle_manifest_field() {
  case "$1" in
    bundle_id) printf '%s\n' "$BUNDLE_MANIFEST_BUNDLE_ID" ;;
    kernel_tag) printf '%s\n' "$BUNDLE_MANIFEST_KERNEL_TAG" ;;
    kernel_version) printf '%s\n' "$BUNDLE_MANIFEST_KERNEL_VERSION" ;;
    kernel_manifest_filename) printf '%s\n' "$BUNDLE_MANIFEST_KERNEL_FILENAME" ;;
    *) return 1 ;;
  esac
}

# verify_sha256 checks a file against an expected lowercase hex digest using
# whichever checksum tool is available. Returns nonzero on mismatch or if no
# checksum tool exists (callers must treat "no tool" as a hard failure, not a
# skip — this installer never installs unverified release bytes).
verify_sha256() {
  local file="$1" expected="$2" actual
  if command -v sha256sum &>/dev/null; then
    actual="$(sha256sum "$file" | cut -d' ' -f1)"
  elif command -v shasum &>/dev/null; then
    actual="$(shasum -a 256 "$file" | cut -d' ' -f1)"
  else
    echo "error: no sha256sum/shasum tool available to verify $file" >&2
    return 1
  fi
  [[ "$actual" == "$expected" ]]
}

# --- bin dir / prefix helpers ------------------------------------------------

prefix_for_bin_dir() {
  local bin_dir="$1"
  if [[ "$(basename "$bin_dir")" == "bin" ]]; then
    dirname "$bin_dir"
  else
    printf '%s\n' "$bin_dir"
  fi
}

bin_dir_for_prefix() {
  local prefix="$1"
  printf '%s/bin\n' "${prefix%/}"
}

install_binary_atomically() {
  local src="$1" dst="$2" dir base tmp
  dir="$(dirname "$dst")"
  base="$(basename "$dst")"
  tmp="$dir/.$base.tmp.$$"
  install -m 755 "$src" "$tmp"
  mv -f "$tmp" "$dst"
}

verify_tui_binary_version() {
  local binary="$1" want="$2" output
  output="$("$binary" version 2>&1)"
  case "$output" in
    *"$want"*) ;;
    *)
      echo "error: built lingtai-tui reports '$output', expected '$want'" >&2
      return 1
      ;;
  esac
}

# tui_binary_tag performs the real installed-binary probe used by existing
# install discovery. A metadata version is only a hint: the executable's own
# version is the source of truth for the current TUI.
tui_binary_tag() {
  local binary="$1" output tag
  [[ -x "$binary" ]] || return 1
  output="$("$binary" version 2>/dev/null || true)"
  tag="$(printf '%s' "$output" | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' | head -1)"
  [[ -n "$tag" ]] || return 1
  printf '%s\n' "$tag"
}

# canonical_runtime_venv resolves a candidate runtime venv path to its
# physical location and requires that physical location to be canonically
# contained under $HOME/.lingtai-tui/runtime — not merely lexically prefixed.
# A symlinked venv directory (or a symlinked ancestor) whose real target
# escapes the owned runtime root is rejected outright: this installer must
# never adopt or mutate a venv outside the root it claims to own. Prints the
# physical path and returns 0 only when containment holds.
canonical_runtime_venv() {
  local dir="$1" runtime_root="$2" physical_root physical_dir physical_home expected_root
  local parent base physical_parent root_parent root_base root_grandparent root_parent_base

  physical_home="$(cd "$HOME" 2>/dev/null && pwd -P)" || return 1
  expected_root="$physical_home/.lingtai-tui/runtime"

  # Ownership is both lexical and physical: a path outside the declared root
  # is not adopted merely because a symlink happens to point back inside it.
  [[ "$dir" == "$runtime_root"/* ]] || return 1
  [[ ! -L "$runtime_root" ]] || return 1

  if [[ -d "$runtime_root" ]]; then
    physical_root="$(cd "$runtime_root" 2>/dev/null && pwd -P)" || return 1
  elif [[ -e "$runtime_root" ]]; then
    return 1
  else
    # Resolve the not-yet-created owned root without mkdir. A completely fresh
    # install may also lack its .lingtai-tui parent, so append at most those two
    # fixed missing components to an existing physical HOME ancestor.
    root_parent="$(dirname "$runtime_root")"
    root_base="$(basename "$runtime_root")"
    if [[ -d "$root_parent" ]]; then
      physical_root="$(cd "$root_parent" 2>/dev/null && pwd -P)/$root_base" || return 1
    else
      [[ ! -e "$root_parent" && ! -L "$root_parent" ]] || return 1
      root_grandparent="$(dirname "$root_parent")"
      root_parent_base="$(basename "$root_parent")"
      [[ -d "$root_grandparent" ]] || return 1
      physical_root="$(cd "$root_grandparent" 2>/dev/null && pwd -P)/$root_parent_base/$root_base" || return 1
    fi
  fi
  # `$HOME` itself may be a symlink, but `.lingtai-tui` and `runtime` may not
  # redirect ownership elsewhere. The resolved root must be exactly beneath the
  # canonical physical HOME, not merely whatever `pwd -P` found through an
  # ancestor symlink.
  [[ "$physical_root" == "$expected_root" ]] || return 1

  if [[ -d "$dir" ]]; then
    physical_dir="$(cd "$dir" 2>/dev/null && pwd -P)" || return 1
  else
    # A file or symlink (including dangling) is occupied untrusted state, not a
    # free final child that venv creation may replace or follow.
    [[ ! -e "$dir" && ! -L "$dir" ]] || return 1
    parent="$(dirname "$dir")"
    base="$(basename "$dir")"
    [[ "$base" != "." && "$base" != ".." ]] || return 1
    if [[ "$parent" == "$runtime_root" && ! -e "$runtime_root" ]]; then
      physical_parent="$physical_root"
    else
      physical_parent="$(cd "$parent" 2>/dev/null && pwd -P)" || return 1
    fi
    physical_dir="$physical_parent/$base"
  fi
  [[ "$physical_dir" == "$physical_root"/* ]] || return 1
  printf '%s\n' "$physical_dir"
}

ensure_lingtai_alias() {
  local bin_dir="$1"
  if [[ ! -e "$bin_dir/lingtai" ]] || [[ -L "$bin_dir/lingtai" && "$(readlink "$bin_dir/lingtai")" == "$bin_dir/lingtai-tui" ]]; then
    ln -sfn "$bin_dir/lingtai-tui" "$bin_dir/lingtai"
  else
    echo "  (skipping 'lingtai' alias — $bin_dir/lingtai already exists)"
  fi
}

# --- arg parsing -------------------------------------------------------------

parse_args() {
  POSITIONAL_MODE=0
  if [[ $# -gt 0 && "$1" != -* ]]; then
    POSITIONAL_MODE=1
    case "$1" in
      install) shift ;;
      update) compatibility_handoff 'assets/update.sh'; return 2 ;;
      *) echo "error: unknown mode: $1" >&2; usage >&2; return 2 ;;
    esac
  fi
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --dev) compatibility_handoff 'assets/dev.sh'; return 2 ;;
      --kernel-source|--dev-kernel-source|--tui-source|--dev-tui-source)
        compatibility_handoff 'assets/dev.sh'; return 2 ;;
      --update) compatibility_handoff 'assets/update.sh'; return 2 ;;
      --ref) compatibility_handoff 'assets/dev.sh'; return 2 ;;
      --version)
        VERSION="${2:?error: --version requires a value}"
        [[ "$VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]] || {
          echo "error: --version requires an exact official vX.Y.Z release tag" >&2
          return 2
        }
        shift 2
        ;;
      --prefix) INSTALL_PREFIX="${2:?error: --prefix requires a value}"; shift 2 ;;
      --bin-dir) BIN_DIR_OVERRIDE="${2:?error: --bin-dir requires a value}"; shift 2 ;;
      --from-source) FROM_SOURCE=1; shift ;;
      --skip-portal) SKIP_PORTAL=1; shift ;;
      --skip-python|--skip-venv) SKIP_VENV=1; shift ;;
      --source) SOURCE_ARG="${2:?error: --source requires a value}"; shift 2 ;;
      --non-interactive) NON_INTERACTIVE=1; shift ;;
      -h|--help) install_usage; exit 0 ;;
      *) echo "error: unknown flag: $1" >&2; install_usage >&2; return 2 ;;
    esac
  done
  case "$SOURCE_ARG" in
    auto|github|gitee) ;;
    *) echo "error: --source must be one of auto|github|gitee, got: $SOURCE_ARG" >&2; return 2 ;;
  esac
}

# --- install metadata
# --- install metadata --------------------------------------------------------

json_escape() {
  local s="$1" ch ord
  local LC_ALL=C
  # LC_ALL=C makes Bash indexing byte-wise: UTF-8 metadata bytes pass through; JSON controls are escaped.
  local i

  for (( i = 0; i < ${#s}; i++ )); do
    ch="${s:i:1}"
    case "$ch" in
      \\) printf '\\\\' ;;
      '"') printf '\\"' ;;
      $'\b') printf '\\b' ;;
      $'\f') printf '\\f' ;;
      $'\n') printf '\\n' ;;
      $'\r') printf '\\r' ;;
      $'\t') printf '\\t' ;;
      *)
        printf -v ord '%d' "'$ch"
        (( ord < 0 )) && ord=$(( ord + 256 ))
        if (( ord < 32 )); then
          printf '\\u%04x' "$ord"
        else
          printf '%s' "$ch"
        fi
        ;;
    esac
  done
}

# write_install_metadata records the ordinary install and its provenance. Future
# maintenance uses the explicit installation assets; this canonical script is not
# a hidden update/repair dispatcher. install_method stays "source" for existing
# metadata compatibility; install_kind records the selected ordinary path.
write_install_metadata() {
  local global_dir="$1" prefix="$2" bin_dir="$3" repo_url="$4" requested_ref="$5"
  local resolved_ref="$6" resolved_commit="$7" stamped_version="$8" tui_path="$9"
  local portal_path="${10:-}" metadata_path tmp_path installed_at portal_json=""
  local install_kind="${INSTALL_KIND:-source-build}"
  # Kernel provenance is read from globals (set by the verified install path)
  # rather than added as more positional params — this function already has 10.
  # The block is omitted entirely when KERNEL_SOURCE is empty (for example
  # --skip-python), preserving the old metadata shape for that explicit opt-out.
  local bundle_json="" runtime_json=""
  if [[ -n "${RUNTIME_VENV_DIR:-}" && "$SKIP_VENV" != "1" ]]; then
    if ! canonical_runtime_venv "$RUNTIME_VENV_DIR" "$HOME/.lingtai-tui/runtime" >/dev/null; then
      echo "error: refusing to persist a runtime pointer outside the canonical owned runtime root: $RUNTIME_VENV_DIR" >&2
      return 1
    fi
    runtime_json="$(printf ',\n  "runtime_venv": "%s"' "$(json_escape "${RUNTIME_VENV_DIR%/}")")"
  fi
  if [[ "$KERNEL_SOURCE" == "bundle" ]]; then
    bundle_json="$(printf ',\n  "kernel_source": "bundle",\n  "kernel_bundle_id": "%s",\n  "kernel_version": "%s",\n  "kernel_provider": "%s"' \
      "$(json_escape "$KERNEL_BUNDLE_ID")" "$(json_escape "$KERNEL_VERSION_INSTALLED")" "$(json_escape "$KERNEL_PROVIDER")")"
    bundle_json="$(printf '%s,\n  "bundle_provider": "%s"' "$bundle_json" "$(json_escape "$BUNDLE_PROVIDER")")"
  elif [[ "$KERNEL_SOURCE" == "release-pin" ]]; then
    local release_tag="${KERNEL_RELEASE_TAG:-$KERNEL_PIN_TAG}"
    local tui_release_tag="${KERNEL_PIN_TUI_TAG:-$BUNDLE_TAG}"
    bundle_json="$(printf ',\n  "kernel_source": "release-pin",\n  "kernel_release_tag": "%s",\n  "kernel_version": "%s",\n  "kernel_provider": "%s",\n  "tui_release_tag": "%s"' \
      "$(json_escape "$release_tag")" "$(json_escape "$KERNEL_VERSION_INSTALLED")" \
      "$(json_escape "$KERNEL_PROVIDER")" "$(json_escape "$tui_release_tag")")"
  fi

  metadata_path="$global_dir/install.json"
  tmp_path=""
  installed_at="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

  if [[ -L "$global_dir" ]]; then
    echo "error: install metadata directory is a symlink; refusing to write redirected state: $global_dir" >&2
    return 1
  fi
  mkdir -p "$global_dir"
  if [[ -e "$metadata_path" || -L "$metadata_path" ]]; then
    echo "error: install receipt appeared before metadata creation; refusing to replace it: $metadata_path" >&2
    return 1
  fi
  tmp_path="$(mktemp "$global_dir/.install.json.XXXXXX")" || {
    echo "error: could not create an owned metadata staging file under $global_dir" >&2
    return 1
  }
  chmod 600 "$tmp_path" || { rm -f "$tmp_path"; return 1; }
  if [[ -n "$portal_path" ]]; then
    portal_json="$(printf ',\n    "%s"' "$(json_escape "$portal_path")")"
  fi

  cat > "$tmp_path" <<EOF
{
  "schema": "lingtai.tui.install/v1",
  "schema_version": 1,
  "install_method": "source",
  "install_kind": "$(json_escape "$install_kind")",
  "prefix": "$(json_escape "$prefix")",
  "bin_dir": "$(json_escape "$bin_dir")",
  "repo_url": "$(json_escape "$repo_url")",
  "requested_ref": "$(json_escape "$requested_ref")",
  "resolved_ref": "$(json_escape "$resolved_ref")",
  "resolved_commit": "$(json_escape "$resolved_commit")",
  "stamped_version": "$(json_escape "$stamped_version")",
  "installed_at": "$(json_escape "$installed_at")",
  "managed_binaries": [
    "$(json_escape "$tui_path")"$portal_json
  ]$bundle_json$runtime_json
}
EOF
  if [[ -L "$global_dir" || -e "$metadata_path" || -L "$metadata_path" ]]; then
    rm -f "$tmp_path"
    echo "error: install receipt appeared during metadata creation; refusing to replace it: $metadata_path" >&2
    return 1
  fi
  # Same-directory hard-link publication is atomic and no-clobber: if another
  # writer creates install.json first, ln fails without replacing its bytes.
  if ! ln "$tmp_path" "$metadata_path"; then
    rm -f "$tmp_path"
    echo "error: install receipt could not be published exclusively; existing state was preserved: $metadata_path" >&2
    return 1
  fi
  rm -f "$tmp_path"
}

# --- OS package installation (Linux/WSL) -------------------------------------

# have_sudo reports whether we can run sudo non-interactively-ish. Root needs no
# sudo; otherwise sudo must exist.
have_root_or_sudo() {
  [[ "$(id -u)" == "0" ]] && return 0
  command -v sudo &>/dev/null
}

as_root() {
  if [[ "$(id -u)" == "0" ]]; then
    "$@"
  else
    sudo "$@"
  fi
}

# apt_install installs packages when interactive and root/sudo is available;
# otherwise prints the exact command and returns non-zero.
apt_install() {
  local why="$1"; shift
  if [[ "$NON_INTERACTIVE" == "1" ]] || ! have_root_or_sudo; then
    warn "$why — install the packages first:"
    echo "      sudo apt-get update && sudo apt-get install -y $*" >&2
    return 1
  fi
  say "Installing $why via apt: $*"
  as_root apt-get update
  as_root apt-get install -y "$@"
}

# --- Python runtime venv -----------------------------------------------------

find_uv() {
  if command -v uv &>/dev/null; then command -v uv; return 0; fi
  [[ -n "${UV_INSTALL_DIR:-}" && -x "$UV_INSTALL_DIR/uv" ]] && { echo "$UV_INSTALL_DIR/uv"; return 0; }
  [[ -x "$HOME/.local/bin/uv" ]] && { echo "$HOME/.local/bin/uv"; return 0; }
  return 1
}

# ensure_uv resolves an executable uv, bootstrapping it if necessary. uv can
# download its own Python toolchain (uv venv --python 3.13), which is the only
# reliable way to get Python 3.11+ on distros whose system packages are older
# (e.g. Ubuntu jammy ships Python 3.10). If uv is already present it is reused;
# otherwise the official installer is downloaded to a temp file and run with an
# explicit UV_INSTALL_DIR so the result lands in a known location. On success it
# echoes the uv path and returns 0; on failure it warns loudly and returns 1
# without aborting the overall install.
ensure_uv() {
  local uv installer rc
  uv="$(find_uv 2>/dev/null || true)"
  if [[ -n "$uv" ]]; then
    echo "$uv"
    return 0
  fi

  if ! command -v curl &>/dev/null; then
    warn "curl is required to bootstrap uv but was not found."
    return 1
  fi

  local install_dir="${UV_INSTALL_DIR:-$HOME/.local/bin}"
  say "Bootstrapping uv (for a self-contained Python runtime) ..."
  mkdir -p "$install_dir"

  installer="$BUILD_DIR/uv-install.sh"
  mkdir -p "$BUILD_DIR"
  # Download to a temp file first so the script is fetched (and can be inspected)
  # before it is executed, rather than piping an unseen body straight into sh.
  if ! curl -fsSL --retry 3 --max-time 120 -o "$installer" "$UV_INSTALLER_URL"; then
    warn "failed to download the uv installer from $UV_INSTALLER_URL"
    return 1
  fi

  # UV_INSTALL_DIR pins where the uv binary lands; UV_NO_MODIFY_PATH keeps the
  # installer from editing shell rc files during a one-shot install.
  UV_INSTALL_DIR="$install_dir" UV_NO_MODIFY_PATH=1 sh "$installer" >/dev/null 2>&1
  rc=$?
  if [[ "$rc" -ne 0 ]]; then
    warn "the uv installer exited with status $rc"
    return 1
  fi

  # The freshly-installed uv may not be on PATH yet; find_uv also probes
  # ~/.local/bin, and we fold in an explicit install_dir check for custom dirs.
  uv="$(find_uv 2>/dev/null || true)"
  if [[ -z "$uv" && -x "$install_dir/uv" ]]; then
    uv="$install_dir/uv"
  fi
  if [[ -z "$uv" || ! -x "$uv" ]]; then
    warn "uv installer ran but no executable uv was found under $install_dir."
    return 1
  fi
  say "Bootstrapped uv at $uv."
  echo "$uv"
  return 0
}

# python_ok reports whether a python3 with venv/ensurepip support and >=3.11 is present.
python_ok() {
  command -v python3 &>/dev/null || return 1
  python3 -c 'import sys; sys.exit(0 if sys.version_info >= (3, 11) else 1)' 2>/dev/null || return 1
  python3 -c 'import venv, ensurepip' 2>/dev/null || return 1
  return 0
}

# ensure_python makes a usable Python interpreter available for the runtime venv.
# uv is preferred because it can download its own Python 3.13 toolchain, which is
# the only reliable path on distros whose packages are too old (Ubuntu jammy ships
# Python 3.10, so `apt install python3` does NOT yield a usable interpreter here).
# Order of preference:
#   1. an existing uv                       -> done (uv downloads Python itself)
#   2. an already-adequate system python3   -> done
#   3. bootstrap uv via the official installer (needs curl) -> done
#   4. apt-install python3/venv/pip and re-check python_ok (for distros where it
#      actually yields Python 3.11+, or where curl is unavailable for step 3)
ensure_python() {
  if find_uv >/dev/null 2>&1; then
    return 0  # uv can download Python itself
  fi
  if python_ok; then
    return 0
  fi
  # Try to bootstrap uv before falling back to system packages: on jammy the apt
  # python3 is 3.10, so uv is the only way to reach Python 3.11+.
  if ensure_uv >/dev/null; then
    return 0
  fi
  if command -v apt-get &>/dev/null; then
    apt_install "Python 3.11+ with venv/pip" python3 python3-venv python3-pip || return 1
    python_ok && return 0
    warn "apt-installed python3 is still older than 3.11 (or lacks venv); uv bootstrap is required."
  fi
  warn "Python 3.11+ (via uv or system packages) is required for the runtime venv. Install uv or Python 3.11+ with:"
  suggest_install python3
  return 1
}

# ensure_runtime_venv creates or updates ~/.lingtai-tui/runtime/venv and
# installs the `lingtai` package into it from a verified local kernel artifact
# selected by the canonical release bundle or exact TUI release pin.
# LingTai itself is NEVER requested from a package index by name (only
# third-party dependencies resolve via the configured index; see
# install_kernel_from_bundle). This is mirrored by the TUI's own EnsureVenv
# logic (uv venv --python 3.13 if uv exists, else python3 -m venv; verify
# import; stamp env marker; symlink lingtai-agent).
#
# On the default release-asset one-command path (BUNDLE_REQUIRED=1), a
# resolved bundle or exact release pin plus a successful kernel-artifact
# install are MANDATORY. A broken existing venv is never
# deleted: when it cannot be repaired in place without destructive cleanup, a
# new stable repair path is selected and recorded in install metadata.

runtime_python_for_venv() {
  local venv_dir="$1"
  if [[ -x "$venv_dir/bin/python" ]]; then
    printf '%s\n' "$venv_dir/bin/python"
  elif [[ -x "$venv_dir/bin/python3" ]]; then
    printf '%s\n' "$venv_dir/bin/python3"
  fi
}

# A launcher located under the selected venv is not enough ownership proof: it
# may be a symlink to another environment. Check sys.prefix before any pip/uv
# operation so an external interpreter is never mutated and rejected only later.
runtime_prefix_matches_venv() {
  local py="$1" venv_dir="$2" selected_prefix
  selected_prefix="$(cd "$venv_dir" 2>/dev/null && pwd -P)" || return 1
  PYTHONPATH= "$py" - "$selected_prefix" <<'PY' >/dev/null 2>&1
import os
import sys

selected_prefix = os.path.realpath(sys.argv[1])
raise SystemExit(0 if os.path.realpath(sys.prefix) == selected_prefix else 1)
PY
}

# ensure_runtime_pip repairs pip only inside the brand-new owned venv created by
# this invocation. It first asks that exact interpreter to seed itself, then (if
# available) uses the already selected uv scoped to the same venv. Prefix checks
# before and after the attempt prevent either fallback from reaching another
# interpreter. Existing runtimes are rejected before this helper is called.
ensure_runtime_pip() {
  local py="$1" venv_dir="$2" uv="${3:-}" index_url
  runtime_prefix_matches_venv "$py" "$venv_dir" || return 1
  "$py" -m pip --version >/dev/null 2>&1 && return 0

  warn "pip is missing from the new owned runtime; trying that interpreter's ensurepip."
  "$py" -m ensurepip --upgrade || warn "ensurepip could not seed pip in the new owned runtime."
  "$py" -m pip --version >/dev/null 2>&1 && return 0

  if [[ -n "$uv" ]]; then
    index_url="$(python_dependency_index_url)"
    warn "pip is still missing; using selected uv only inside the new owned runtime."
    "$uv" pip install --index-url "$index_url" -p "$venv_dir" pip || warn "uv could not seed pip in the new owned runtime."
  fi

  runtime_prefix_matches_venv "$py" "$venv_dir" || return 1
  "$py" -m pip --version >/dev/null 2>&1
}

runtime_venv_state() {
  local venv_dir="$1" py
  [[ -d "$venv_dir" ]] || { printf '%s\n' missing; return 0; }
  py="$(runtime_python_for_venv "$venv_dir")"
  [[ -n "$py" ]] || { printf '%s\n' broken; return 0; }
  "$py" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 11) else 1)' 2>/dev/null || { printf '%s\n' broken; return 0; }
  runtime_prefix_matches_venv "$py" "$venv_dir" || { printf '%s\n' broken; return 0; }
  "$py" -m pip --version >/dev/null 2>&1 || { printf '%s\n' broken; return 0; }
  printf '%s\n' healthy
}

# runtime_health_check is the install postcondition: both the public package
# and its kernel module must import from the selected interpreter, the
# package version must equal the exact manifest/pin version, AND both
# module __file__ paths must resolve physically underneath the selected
# venv's own canonical prefix — not merely be importable. This rejects a
# same-version package injected through an external `.pth` entry, system
# site-packages, or any other interpreter path configuration that would let
# runtime_health_check pass while the kernel actually loads from outside the
# venv this installer claims is healthy. PYTHONPATH= alone does not cover
# that case, so the check is done in Python against sys.prefix/realpath.
runtime_health_check() {
  local py="$1" expected="${2:-}" output selected_prefix
  selected_prefix="$(cd "$(dirname "$py")/.." 2>/dev/null && pwd -P)" || return 1
  output="$(PYTHONPATH= "$py" - "$expected" "$selected_prefix" <<'PY'
import importlib
import os
import sys

expected = sys.argv[1]
selected_prefix = os.path.realpath(sys.argv[2])
prefix = os.path.realpath(sys.prefix)
if prefix != selected_prefix:
    raise SystemExit(1)
module = importlib.import_module("lingtai")
kernel = importlib.import_module("lingtai.kernel")
version = str(getattr(module, "__version__", ""))
if not version or (expected and version.lstrip("v") != expected.lstrip("v")):
    raise SystemExit(1)
for mod in (module, kernel):
    mod_path = os.path.realpath(getattr(mod, "__file__", "") or "")
    if not mod_path or not (mod_path == selected_prefix or mod_path.startswith(selected_prefix + os.sep)):
        raise SystemExit(1)
print(f"{version}\t{module.__file__}")
PY
  )" || return 1
  [[ "$output" == *$'\t'* ]] || return 1
  printf '%s\n' "$output"
}

# Editable development installs intentionally import from the declared kernel
# checkout rather than from site-packages. Their postcondition therefore binds
# sys.prefix to the selected venv and both LingTai modules to that exact physical
# checkout, instead of weakening the normal provenance check to mere importability.
dev_runtime_health_check() {
  local py="$1" venv_dir="$2" kernel_root="$3" selected_prefix selected_kernel output
  selected_prefix="$(cd "$venv_dir" 2>/dev/null && pwd -P)" || return 1
  selected_kernel="$(cd "$kernel_root" 2>/dev/null && pwd -P)" || return 1
  output="$(PYTHONPATH= "$py" - "$selected_prefix" "$selected_kernel" <<'PY'
import importlib
import os
import sys

selected_prefix = os.path.realpath(sys.argv[1])
selected_kernel = os.path.realpath(sys.argv[2])
if os.path.realpath(sys.prefix) != selected_prefix:
    raise SystemExit(1)
module = importlib.import_module("lingtai")
kernel = importlib.import_module("lingtai.kernel")
version = str(getattr(module, "__version__", ""))
if not version:
    raise SystemExit(1)
for mod in (module, kernel):
    mod_path = os.path.realpath(getattr(mod, "__file__", "") or "")
    if not mod_path or not (mod_path == selected_kernel or mod_path.startswith(selected_kernel + os.sep)):
        raise SystemExit(1)
print(f"{version}\t{module.__file__}")
PY
  )" || return 1
  [[ "$output" == *$'\t'* ]] || return 1
  printf '%s\n' "$output"
}

ensure_runtime_venv() {
  local bin_dir="$1" venv_dir="${RUNTIME_VENV_DIR:-$HOME/.lingtai-tui/runtime/venv}"
  local runtime_root="$HOME/.lingtai-tui/runtime" uv py install_kernel_tag runtime_state
  [[ "$SKIP_VENV" == "1" ]] && { note "Skipping Python runtime venv (--skip-python)."; return 0; }
  canonical_runtime_venv "$venv_dir" "$runtime_root" >/dev/null || {
    echo "error: selected runtime venv is not a canonical child of the owned runtime root: $venv_dir" >&2
    echo "       Use the explicit repair asset for an existing or redirected runtime." >&2
    return 1
  }
  [[ ! -L "$runtime_root" ]] || { echo "error: runtime root is a symlink: $runtime_root" >&2; return 1; }
  mkdir -p "$runtime_root" || { echo "error: could not create the owned runtime root: $runtime_root" >&2; return 1; }
  install_kernel_tag="$(kernel_tag_for_install || true)"
  if [[ -z "$install_kernel_tag" ]]; then
    echo "error: no exact pinned kernel release could be resolved; refusing an unpinned runtime." >&2
    return 1
  fi
  ensure_python || { echo "error: Python 3.11+ with venv support is required for the runtime." >&2; return 1; }
  runtime_state="$(runtime_venv_state "$venv_dir")"
  if [[ "$runtime_state" != missing ]]; then
    echo "error: existing runtime at $venv_dir is $runtime_state; ordinary install will not adopt or repair it." >&2
    echo "       Review https://lingtai.ai/help/reference/installation/assets/fix.sh" >&2
    return 1
  fi
  uv="$(find_uv 2>/dev/null || true)"
  if [[ -n "$uv" ]]; then
    # uv venvs are unseeded by default, but every supported successor and the
    # runtime health contract require pip inside the selected owned venv.
    "$uv" venv --seed --python 3.13 "$venv_dir" || return 1
  elif python_ok; then
    python3 -m venv "$venv_dir" || return 1
  else
    echo "error: cannot create runtime venv without uv or Python 3.11+ venv support." >&2
    return 1
  fi
  py="$(runtime_python_for_venv "$venv_dir")"
  [[ -n "$py" ]] || { echo "error: runtime interpreter not found at $venv_dir." >&2; return 1; }
  runtime_prefix_matches_venv "$py" "$venv_dir" || { echo "error: runtime interpreter prefix does not match selected venv." >&2; return 1; }
  ensure_runtime_pip "$py" "$venv_dir" "$uv" || {
    echo "error: selected new runtime has no usable pip after bounded self-healing." >&2
    echo "       partial runtime retained for diagnosis: $venv_dir" >&2
    return 1
  }
  install_kernel_from_bundle "$py" "$uv" || {
    echo "error: pinned kernel artifact could not be installed; no package-name fallback is allowed." >&2
    return 1
  }
  runtime_health_check "$py" "$KERNEL_VERSION_INSTALLED" >/dev/null || {
    echo "error: final runtime import/version/provenance postcondition failed." >&2
    return 1
  }
  RUNTIME_VENV_DIR="$venv_dir"
  "$py" -m lingtai.venv_resolve env-marker stamp --venv "$venv_dir" >/dev/null 2>&1 || true
  if [[ -x "$venv_dir/bin/lingtai-agent" ]]; then
    ln -sfn "$venv_dir/bin/lingtai-agent" "$bin_dir/lingtai-agent" 2>/dev/null || warn "could not symlink lingtai-agent into $bin_dir"
  fi
}


update_validate_manifest() {
  local py="$1" manifest_file="$2" expected_tag="$3"
  "$py" - "$manifest_file" "$expected_tag" <<'PY'
import json
import re
import sys

path, expected_tag = sys.argv[1:]
expected_version = expected_tag[1:] if expected_tag.startswith("v") else expected_tag

def pairs(items):
    result = {}
    for key, value in items:
        if key in result:
            raise ValueError(f"duplicate JSON key: {key}")
        result[key] = value
    return result

def fail(message):
    raise SystemExit(f"invalid kernel release manifest: {message}")

try:
    with open(path, encoding="utf-8") as stream:
        data = json.load(stream, object_pairs_hook=pairs)
except (OSError, ValueError, json.JSONDecodeError) as exc:
    fail(str(exc))

required = {"schema", "kernel_version", "kernel_tag", "commit", "generated_at", "artifacts", "sdist_fallback"}
if not isinstance(data, dict) or set(data) != required:
    fail("unexpected top-level keys")
if data["schema"] != "lingtai.kernel.release/v1":
    fail("unexpected schema")
for key in ("kernel_version", "kernel_tag", "commit", "generated_at", "sdist_fallback"):
    if not isinstance(data[key], str) or not data[key]:
        fail(f"{key} must be a non-empty string")
if data["kernel_tag"] != expected_tag or data["kernel_version"] != expected_version:
    fail(f"manifest is for {data['kernel_tag']}/{data['kernel_version']}, expected {expected_tag}/{expected_version}")
if not isinstance(data["artifacts"], list) or not data["artifacts"]:
    fail("artifacts must be a non-empty list")

seen = set()
has_sdist = False
for index, artifact in enumerate(data["artifacts"]):
    if not isinstance(artifact, dict) or set(artifact) != {"filename", "sha256", "kind", "python_tag", "abi_tag", "platform_tag"}:
        fail(f"artifacts[{index}] has the wrong shape")
    filename = artifact["filename"]
    digest = artifact["sha256"]
    kind = artifact["kind"]
    if not isinstance(filename, str) or not filename or filename in seen:
        fail(f"artifacts[{index}] has an invalid or duplicate filename")
    seen.add(filename)
    if not isinstance(digest, str) or not re.fullmatch(r"[0-9a-f]{64}", digest):
        fail(f"artifacts[{index}].sha256 is not lowercase 64-hex")
    if kind == "wheel":
        if any(not isinstance(artifact[key], str) or not artifact[key] for key in ("python_tag", "abi_tag", "platform_tag")):
            fail(f"artifacts[{index}] wheel tags must be non-empty strings")
        parts = filename[:-4].split("-") if filename.endswith(".whl") else []
        if len(parts) != 5 or parts[0] != "lingtai" or parts[1] != expected_version:
            fail(f"artifacts[{index}] filename is not the selected lingtai version")
        if tuple(parts[2:]) != (artifact["python_tag"], artifact["abi_tag"], artifact["platform_tag"]):
            fail(f"artifacts[{index}] filename tags disagree with metadata")
    elif kind == "sdist":
        has_sdist = True
        if filename != f"lingtai-{expected_version}.tar.gz":
            fail(f"artifacts[{index}] sdist filename is not the selected version")
        if any(artifact[key] is not None for key in ("python_tag", "abi_tag", "platform_tag")):
            fail(f"artifacts[{index}] sdist has wheel tags")
    else:
        fail(f"artifacts[{index}] has unsupported kind {kind!r}")
if not has_sdist or data["sdist_fallback"] not in seen:
    fail("sdist fallback is not a listed sdist")

print(json.dumps(data, sort_keys=True, separators=(",", ":")))
PY
}

# --- kernel release artifact install (schema lingtai.kernel.release/v1) ------
#
# Installs the Python `lingtai` runtime from the existing verified kernel
# release-manifest/artifact machinery. The tag comes from the bundle manifest
# first, or from the exact TUI release pin when that bundle is source-only. The
# artifact is always installed by explicit local file path — never `pip install
# lingtai` against any package index. The configured package index
# (LINGTAI_PYPI_INDEX_URL, default pypi.org) is used ONLY to resolve lingtai's
# own third-party dependencies during that local-path install.

# kernel_manifest_url_for_provider echoes the kernel release manifest asset
# URL on the given provider/tag, or nothing if unavailable.
kernel_manifest_url_for_provider() {
  local provider="$1" tag="$2" body
  case "$provider" in
    github)
      command -v curl &>/dev/null || return 1
      body="$(curl -fsSL --max-time 15 "${KERNEL_GH_API_BASE}/releases/tags/$tag" 2>/dev/null || true)"
      [[ -n "$body" ]] || return 1
      if printf '%s' "$body" | grep -q '"name"[[:space:]]*:[[:space:]]*"lingtai-kernel-release-manifest.json"'; then
        printf 'https://github.com/Lingtai-AI/lingtai-kernel/releases/download/%s/lingtai-kernel-release-manifest.json' "$tag"
      else
        return 1
      fi
      ;;
    gitee)
      local saved_api="$GITEE_API_BASE"
      GITEE_API_BASE="$GITEE_KERNEL_API_BASE"
      local url
      url="$(gitee_release_asset_url "$tag" "lingtai-kernel-release-manifest.json" || true)"
      GITEE_API_BASE="$saved_api"
      [[ -n "$url" ]] || return 1
      printf '%s' "$url"
      ;;
    *) return 1 ;;
  esac
}

# fetch_kernel_manifest resolves the selected kernel tag/manifest for the
# CURRENT BUNDLE_PROVIDER + the bundle's or release pin's kernel_tag. Falls back
# to the other provider for the SAME kernel tag only (same-release fallback).
# Populates KERNEL_MANIFEST_JSON and KERNEL_MANIFEST_PROVIDER in this shell;
# returns nonzero if unavailable on either provider.
fetch_kernel_manifest() {
  local kernel_tag="$1" provider="$BUNDLE_PROVIDER" url body other candidate
  local validator="${2:-$(command -v python3 || true)}" manifest_file
  KERNEL_MANIFEST_PROVIDER=""
  KERNEL_MANIFEST_JSON=""

  other="github"
  [[ "$provider" == "github" ]] && other="gitee"
  for candidate in "$provider" "$other"; do
    url="$(kernel_manifest_url_for_provider "$candidate" "$kernel_tag" || true)"
    if [[ -z "$url" ]]; then
      if [[ "$candidate" == "$provider" ]]; then
        # Keep fallback diagnostics on stderr; stdout remains reserved for normal
        # installer output while the manifest is returned through explicit state.
        echo "    $provider has no kernel manifest for $kernel_tag; trying $other for the SAME kernel tag." >&2
      fi
      continue
    fi

    body="$(curl -fsSL --max-time 30 "$url" 2>/dev/null || true)"
    [[ -n "$body" ]] || continue
    if [[ -z "$validator" ]]; then
      echo "error: Python is required to validate the kernel release manifest at $url" >&2
      continue
    fi
    manifest_file="$(mktemp "${TMPDIR:-/tmp}/lingtai-kernel-manifest-validate.XXXXXX")"
    printf '%s' "$body" > "$manifest_file"
    if ! update_validate_manifest "$validator" "$manifest_file" "$kernel_tag" >/dev/null 2>&1; then
      rm -f "$manifest_file"
      echo "error: kernel manifest at $url failed strict validation" >&2
      continue
    fi
    rm -f "$manifest_file"

    KERNEL_MANIFEST_PROVIDER="$candidate"
    KERNEL_MANIFEST_JSON="$body"
    return 0
  done
  return 1
}

# python_platform_tags asks the venv's own Python for compatible wheel tags,
# one per line, most-specific first. Fresh `uv venv` environments intentionally
# contain neither packaging nor pip, so use their implementations when present
# and otherwise emit a conservative dependency-free CPython/OS/arch set for the
# platform wheels this release pipeline publishes. The installer still lets uv
# enforce final wheel compatibility during installation.
python_platform_tags() {
  local py="$1"
  "$py" - <<'PY' 2>/dev/null
import platform
import sys

sys_tags = None
try:
    from packaging.tags import sys_tags
except ModuleNotFoundError:
    try:
        from pip._vendor.packaging.tags import sys_tags  # type: ignore
    except ModuleNotFoundError:
        pass

if sys_tags is not None:
    for tag in sys_tags():
        print(f"{tag.interpreter}-{tag.abi}-{tag.platform}")
    raise SystemExit(0)

interpreter = f"cp{sys.version_info.major}{sys.version_info.minor}"
abi = interpreter
machine = platform.machine().lower()

def emit(platform_tag):
    print(f"{interpreter}-{abi}-{platform_tag}")

if sys.platform == "darwin":
    arch = "arm64" if machine in {"arm64", "aarch64"} else "x86_64"
    version = platform.mac_ver()[0]
    try:
        major, minor = (int(part) for part in version.split(".")[:2])
    except (TypeError, ValueError):
        major, minor = (11, 0) if arch == "arm64" else (10, 13)
    if major >= 11:
        for compatible_major in range(major, 10, -1):
            emit(f"macosx_{compatible_major}_0_{arch}")
        minor = 16
    if arch == "x86_64" and major >= 10:
        for compatible_minor in range(min(minor, 16), 8, -1):
            emit(f"macosx_10_{compatible_minor}_x86_64")
elif sys.platform.startswith("linux"):
    arch = "aarch64" if machine in {"arm64", "aarch64"} else "x86_64"
    libc_name, libc_version = platform.libc_ver()
    try:
        libc_major, libc_minor = (int(part) for part in libc_version.split(".")[:2])
    except (TypeError, ValueError):
        libc_major, libc_minor = 0, 0
    if libc_name == "glibc" and libc_major == 2 and libc_minor >= 17:
        for compatible_minor in range(libc_minor, 16, -1):
            tag = f"manylinux_2_{compatible_minor}_{arch}"
            if compatible_minor == 17:
                tag += f".manylinux2014_{arch}"
            emit(tag)
elif sys.platform == "win32":
    emit("win_amd64" if machine in {"amd64", "x86_64"} else "win_arm64")
PY
}

# select_kernel_wheel picks the first artifact from a kernel manifest JSON
# body whose "<python_tag>-<abi_tag>-<platform_tag>" combination appears in
# the venv's compatible-tag list (most-specific tags are tried first, so an
# exact match wins over a compatible-but-looser one). Echoes
# "<filename> <sha256>" on a match; returns nonzero (and prints nothing) if no
# wheel matches — the caller falls back to the sdist.
select_kernel_wheel() {
  local manifest_json="$1" py="$2" tags combo manifest_file
  tags="$(python_platform_tags "$py")"
  [[ -n "$tags" ]] || return 1

  manifest_file="$(mktemp "${TMPDIR:-/tmp}/lingtai-kernel-manifest.XXXXXX")"
  printf '%s' "$manifest_json" > "$manifest_file"

  while IFS= read -r combo; do
    [[ -n "$combo" ]] || continue
    # Each artifact object is small and single-line-safe to grep for its tag
    # triple; scope the match to one object at a time via a python one-liner
    # for correctness instead of hand-rolled brace matching across wheels.
    # Manifest is passed by FILE PATH (not stdin) so this command can't
    # collide with a heredoc's stdin takeover.
    local hit
    hit="$("$py" - "$manifest_file" "$combo" <<'PY'
import json, sys
data = json.loads(open(sys.argv[1]).read())
combo = sys.argv[2]
for art in data.get("artifacts", []):
    if art.get("kind") != "wheel":
        continue
    if f"{art['python_tag']}-{art['abi_tag']}-{art['platform_tag']}" == combo:
        print(f"{art['filename']} {art['sha256']}")
        break
PY
)"
    if [[ -n "$hit" ]]; then
      printf '%s' "$hit"
      return 0
    fi
  done <<<"$tags"
  return 1
}

# kernel_sdist_fallback echoes "<filename> <sha256>" for the manifest's
# declared sdist_fallback artifact.
kernel_sdist_fallback() {
  local manifest_json="$1" py="$2" manifest_file
  manifest_file="$(mktemp "${TMPDIR:-/tmp}/lingtai-kernel-manifest.XXXXXX")"
  printf '%s' "$manifest_json" > "$manifest_file"
  "$py" - "$manifest_file" <<'PY'
import json, sys
data = json.loads(open(sys.argv[1]).read())
name = data.get("sdist_fallback", "")
for art in data.get("artifacts", []):
    if art.get("filename") == name:
        print(f"{art['filename']} {art['sha256']}")
        break
PY
}

# kernel_artifact_download_url echoes the download URL for a named kernel
# artifact on the given provider/tag.
kernel_artifact_download_url() {
  local provider="$1" tag="$2" name="$3"
  case "$provider" in
    github) printf 'https://github.com/Lingtai-AI/lingtai-kernel/releases/download/%s/%s' "$tag" "$name" ;;
    gitee)
      local saved_api="$GITEE_API_BASE" url
      GITEE_API_BASE="$GITEE_KERNEL_API_BASE"
      url="$(gitee_release_asset_url "$tag" "$name" || true)"
      GITEE_API_BASE="$saved_api"
      [[ -n "$url" ]] || return 1
      printf '%s' "$url"
      ;;
    *) return 1 ;;
  esac
}

# install_kernel_from_bundle installs the Python `lingtai` runtime from the
# bundle's or exact release pin's kernel release, by explicit local file path —
# this is the ONLY way this script installs LingTai; it is never requested from
# a package index by name. Sets KERNEL_SOURCE,
# KERNEL_BUNDLE_ID/KERNEL_RELEASE_TAG/KERNEL_VERSION_INSTALLED/KERNEL_PROVIDER
# on success. Returns nonzero (installs nothing, KERNEL_SOURCE left untouched)
# on any failure (missing/incoherent kernel manifest, no compatible
# wheel/sdist, checksum mismatch, install command failure) — the caller
# (ensure_runtime_venv) treats that as a fail-loud install error, not a
# signal to try any other source.
install_kernel_from_bundle() {
  local py="$1" uv="$2"

  local kernel_tag kernel_manifest artifact_line fname sha download_url dest index_url kernel_source
  kernel_tag="$(kernel_tag_for_install || true)"
  [[ -n "$kernel_tag" ]] || return 1
  kernel_source="$(kernel_source_for_install || true)"
  [[ -n "$kernel_source" ]] || return 1

  if ! fetch_kernel_manifest "$kernel_tag" "$py"; then
    note "Could not fetch the pinned kernel release manifest ($kernel_tag) from GitHub or Gitee."
    return 1
  fi
  kernel_manifest="$KERNEL_MANIFEST_JSON"
  [[ -n "$kernel_manifest" && -n "$KERNEL_MANIFEST_PROVIDER" ]] || {
    note "Kernel manifest resolution returned incomplete provider state."
    return 1
  }

  artifact_line="$(select_kernel_wheel "$kernel_manifest" "$py" || true)"
  if [[ -z "$artifact_line" ]]; then
    note "No platform wheel in kernel release $kernel_tag matches this Python; using the sdist fallback (extra build toolchain may be required)."
    artifact_line="$(kernel_sdist_fallback "$kernel_manifest" "$py" || true)"
  fi
  [[ -n "$artifact_line" ]] || return 1
  fname="${artifact_line%% *}"
  sha="${artifact_line##* }"

  download_url="$(kernel_artifact_download_url "$KERNEL_MANIFEST_PROVIDER" "$kernel_tag" "$fname" || true)"
  [[ -n "$download_url" ]] || return 1

  mkdir -p "$BUILD_DIR/kernel-artifact"
  dest="$BUILD_DIR/kernel-artifact/$fname"
  say "Downloading kernel artifact: $fname (from $KERNEL_MANIFEST_PROVIDER, release $kernel_tag) ..."
  if ! curl -fsSL --max-time 300 -o "$dest" "$download_url"; then
    warn "download failed for $download_url"
    return 1
  fi
  if ! verify_sha256 "$dest" "$sha"; then
    echo "error: checksum mismatch for $fname — refusing to install an unverified kernel artifact." >&2
    echo "       retained mismatched artifact for diagnosis: $dest" >&2
    return 1
  fi
  note "Verified SHA256 for $fname."

  index_url="$(python_dependency_index_url)"
  say "Installing lingtai from local artifact (dependencies resolved via $index_url) ..."
  # Explicit local path: pip/uv never requests the package name "lingtai"
  # from any index here — only third-party dependency resolution uses
  # --index-url. This is the "no pip install lingtai from index" guarantee.
  if [[ -n "$uv" ]]; then
    "$uv" pip install --index-url "$index_url" -p "$(dirname "$(dirname "$py")")" "$dest" || return 1
  else
    "$py" -m pip install --index-url "$index_url" "$dest" || return 1
  fi

  if ! "$py" -c 'import lingtai; print("lingtai", getattr(lingtai, "__version__", "?"))'; then
    warn "lingtai import failed after bundle install."
    return 1
  fi

  KERNEL_SOURCE="$kernel_source"
  KERNEL_BUNDLE_ID=""
  if [[ "$kernel_source" == "bundle" ]]; then
    KERNEL_BUNDLE_ID="$(bundle_manifest_field bundle_id)"
  fi
  KERNEL_RELEASE_TAG="$kernel_tag"
  KERNEL_VERSION_INSTALLED="$(printf '%s' "$kernel_manifest" | json_string_field kernel_version)"
  KERNEL_PROVIDER="$KERNEL_MANIFEST_PROVIDER"
  return 0
}

# --- install flows# --- install flows -----------------------------------------------------------

# resolve_bin_dir picks the first-install binary directory honoring --bin-dir/--prefix.
# Prefers user-writable locations; never prefers Homebrew.
resolve_bin_dir() {
  if [[ -n "$BIN_DIR_OVERRIDE" ]]; then
    BIN_DIR="$BIN_DIR_OVERRIDE"
  elif [[ -n "$INSTALL_PREFIX" ]]; then
    BIN_DIR="$(bin_dir_for_prefix "$INSTALL_PREFIX")"
  elif [[ -n "${DISCOVERED_BIN_DIR:-}" ]]; then
    BIN_DIR="$DISCOVERED_BIN_DIR"
  elif [[ -w /usr/local/bin ]]; then
    BIN_DIR="/usr/local/bin"
  else
    BIN_DIR="$HOME/.local/bin"
  fi
  mkdir -p "$BIN_DIR"
}

# try_release_asset attempts to install prebuilt binaries for the tag. Returns 0
# on success (binaries installed to BIN_DIR), 1 if no asset was usable so the
# caller should fall back to a source build.
try_release_asset() {
  local tag="$1" os arch name url tarball extract_dir provider
  os="$(detect_os)"
  arch="$(detect_arch)"
  if [[ "$os" == "unsupported" || "$arch" == "unsupported" ]]; then
    note "No prebuilt asset for $(uname -s)/$(uname -m); will build from source."
    return 1
  fi
  command -v curl &>/dev/null || { note "curl unavailable; will build from source."; return 1; }

  name="$(asset_name "$tag" "$os" "$arch")"
  if [[ -z "$BUNDLE_MANIFEST_JSON" ]] || [[ "$BUNDLE_TAG" != "$tag" ]]; then
    warn "no validated bundle manifest is bound to TUI tag $tag; refusing the release asset."
    return 1
  fi
  if ! load_bundle_manifest "$BUNDLE_MANIFEST_JSON" "$tag"; then
    warn "validated bundle manifest could not be loaded for $name; refusing the release asset."
    return 1
  fi
  if [[ ! "$BUNDLE_TUI_ARCHIVE_SHA" =~ ^[0-9a-f]{64}$ ]]; then
    warn "validated bundle manifest has no usable digest for $name; refusing the release asset."
    return 1
  fi
  provider="${BUNDLE_PROVIDER:-github}"
  if [[ "$provider" == "gitee" ]]; then
    url="$(gitee_release_asset_url "$tag" "$name" || true)"
    if [[ -z "$url" ]]; then
      note "Gitee has no prebuilt asset ($name) for $tag; trying GitHub for the SAME tag."
      url="$(release_asset_url "$tag" "$name" || true)"
      provider="github"
    fi
  else
    url="$(release_asset_url "$tag" "$name" || true)"
  fi
  if [[ -z "$url" ]]; then
    note "Release $tag has no prebuilt asset ($name) on GitHub or Gitee; will build from source."
    return 1
  fi

  say "Downloading prebuilt binaries: $name (from $provider)"
  mkdir -p "$BUILD_DIR"
  tarball="$BUILD_DIR/$name"
  extract_dir="$BUILD_DIR/asset"
  mkdir -p "$extract_dir"
  if ! curl -fsSL --max-time 120 -o "$tarball" "$url"; then
    warn "download failed for $url; will build from source."
    return 1
  fi

  # Checksum verification: the sidecar .sha256 is fetched from the SAME
  # provider/URL as the tarball itself so a fallback never mixes providers
  # mid-artifact. A missing/unfetchable sidecar is a hard stop for this
  # asset (not silently trusted) — the caller falls back to a source build.
  local sha_url sha_expected
  sha_url="${url}.sha256"
  sha_expected="$(curl -fsSL --max-time 30 "$sha_url" 2>/dev/null | cut -d' ' -f1 || true)"
  if [[ ! "$sha_expected" =~ ^[0-9a-f]{64}$ ]]; then
    warn "could not fetch checksum sidecar for $name; will build from source rather than install unverified bytes."
    return 1
  fi
  if [[ "$sha_expected" != "$BUNDLE_TUI_ARCHIVE_SHA" ]]; then
    warn "provider checksum sidecar disagrees with bundle manifest for $name; refusing mixed provenance."
    return 2
  fi
  if ! verify_sha256 "$tarball" "$BUNDLE_TUI_ARCHIVE_SHA"; then
    echo "error: downloaded bytes for $name disagree with the bundle manifest; refusing this tag." >&2
    return 2
  fi
  note "Verified SHA256 for $name."

  if ! tar -xzf "$tarball" -C "$extract_dir"; then
    warn "could not extract $tarball; will build from source."
    return 1
  fi

  local tui portal
  tui="$(find "$extract_dir" -type f -name lingtai-tui | head -1)"
  if [[ -z "$tui" ]]; then
    warn "asset $name did not contain lingtai-tui; will build from source."
    return 1
  fi

  install -m 755 "$tui" "$BIN_DIR/lingtai-tui"
  PORTAL_PATH=""
  if [[ "$SKIP_PORTAL" != "1" ]]; then
    portal="$(find "$extract_dir" -type f -name lingtai-portal | head -1)"
    if [[ -n "$portal" ]]; then
      install -m 755 "$portal" "$BIN_DIR/lingtai-portal"
      PORTAL_PATH="$BIN_DIR/lingtai-portal"
    fi
  fi

  ensure_lingtai_alias "$BIN_DIR"
  VERSION="$tag"
  RESOLVED_REF="$tag"
  RESOLVED_COMMIT=""
  INSTALL_KIND="release-asset"
  # Verify the downloaded binary reports the expected version.
  verify_tui_binary_version "$BIN_DIR/lingtai-tui" "$tag" || {
    warn "prebuilt lingtai-tui version mismatch; will rebuild from source."
    return 1
  }
  return 0
}

# build_from_source downloads the exact official release source tarball and
# builds both binaries. Installs to BIN_DIR. Sets VERSION/RESOLVED_*/PORTAL_PATH.
build_from_source() {
  local ref="$1" requested_tag source_tarball
  requested_tag="$(release_tag_name "$ref")"
  [[ -n "$requested_tag" ]] || {
    echo "error: source fallback requires an exact official vX.Y.Z release tag" >&2
    return 1
  }
  mkdir -p "$(dirname "$BUILD_DIR")"
  rm -rf "$BUILD_DIR"

  # --from-source is still an official-release fallback, never an arbitrary
  # checkout workflow. Development refs are handed to assets/dev.sh.
  ensure_build_deps 1
  command -v curl &>/dev/null || { echo "error: curl is required to download the release source tarball" >&2; return 1; }
  command -v tar &>/dev/null || { echo "error: tar is required to extract the release source tarball" >&2; return 1; }
  say "Downloading lingtai release source ($requested_tag) ..."
  source_tarball="$TMPDIR/lingtai-$requested_tag-src-$$.tar.gz"
  curl -fsSL --max-time 120 -o "$source_tarball" \
    "https://github.com/${REPO_SLUG}/archive/refs/tags/${requested_tag}.tar.gz"
  mkdir -p "$BUILD_DIR"
  tar -xzf "$source_tarball" -C "$BUILD_DIR" --strip-components 1
  rm -f "$source_tarball"
  VERSION="$requested_tag"
  RESOLVED_REF="$requested_tag"
  RESOLVED_COMMIT="$(git ls-remote --tags "$REPO" "refs/tags/$requested_tag" 2>/dev/null | awk '{print $1}' | head -1 || true)"
  INSTALL_KIND="source-build"

  ensure_go_for_source "$BUILD_DIR"
  say "Building lingtai-tui ($VERSION) ..."
  (cd "$BUILD_DIR/tui" && CGO_ENABLED=0 go build -ldflags "-X main.version=$VERSION" -o "$BUILD_DIR/lingtai-tui" .)

  PORTAL_BUILT=0
  if [[ "$SKIP_PORTAL" == "1" ]]; then
    note "Skipping portal (--skip-portal)."
  elif ensure_node_for_portal; then
    say "Building lingtai-portal ($VERSION) ..."
    if (cd "$BUILD_DIR/portal/web" && npm ci --silent && npm run build --silent) && \
       (cd "$BUILD_DIR/portal" && CGO_ENABLED=0 go build -ldflags "-X main.version=$VERSION" -o "$BUILD_DIR/lingtai-portal" .); then
      PORTAL_BUILT=1
    else
      warn "Skipping portal — portal build failed; continuing with lingtai-tui only."
      note "$(portal_node_requirement_note)"
    fi
  else
    warn "Skipping portal — could not prepare a supported Node.js/npm toolchain."
    note "$(portal_node_requirement_note)"
  fi

  PORTAL_PATH=""
  say "Installing to $BIN_DIR ..."
  install -m 755 "$BUILD_DIR/lingtai-tui" "$BIN_DIR/lingtai-tui"
  if [[ "$PORTAL_BUILT" == "1" ]]; then
    install -m 755 "$BUILD_DIR/lingtai-portal" "$BIN_DIR/lingtai-portal"
    PORTAL_PATH="$BIN_DIR/lingtai-portal"
  fi
  ensure_lingtai_alias "$BIN_DIR"
}

# normalize_go_version prints MAJOR.MINOR.PATCH for Go language/toolchain
# versions (for example: 1.26 -> 1.26.0, go1.26.1 -> 1.26.1).
normalize_go_version() {
  local version="${1#go}"
  if [[ "$version" =~ ^([0-9]+)\.([0-9]+)$ ]]; then
    printf '%s.%s.0\n' "${BASH_REMATCH[1]}" "${BASH_REMATCH[2]}"
    return 0
  fi
  if [[ "$version" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
    printf '%s.%s.%s\n' "${BASH_REMATCH[1]}" "${BASH_REMATCH[2]}" "${BASH_REMATCH[3]}"
    return 0
  fi
  return 1
}

# go_version_ge returns success when $1 >= $2 using numeric major/minor/patch
# comparison. Both inputs may optionally include the leading "go" prefix.
go_version_ge() {
  local have required hmaj hmin hpatch rmaj rmin rpatch
  have="$(normalize_go_version "$1")" || return 1
  required="$(normalize_go_version "$2")" || return 1
  IFS=. read -r hmaj hmin hpatch <<<"$have"
  IFS=. read -r rmaj rmin rpatch <<<"$required"
  (( hmaj > rmaj )) && return 0
  (( hmaj < rmaj )) && return 1
  (( hmin > rmin )) && return 0
  (( hmin < rmin )) && return 1
  (( hpatch >= rpatch ))
}

installed_go_version() {
  command -v go &>/dev/null || return 1
  go version 2>/dev/null | sed -n 's/^go version go\([0-9][0-9.]*\).*/\1/p' | head -1
}

required_go_version_for_source() {
  local source_dir="$1" version
  version="$(awk '$1 == "go" { print $2; exit }' "$source_dir/tui/go.mod" 2>/dev/null || true)"
  [[ -n "$version" ]] || return 1
  normalize_go_version "$version"
}

go_toolchain_archive_name() {
  local version="$1" os="$2" arch="$3"
  printf 'go%s.%s-%s.tar.gz\n' "$version" "$os" "$arch"
}

go_toolchain_download_url() {
  local version="$1" os="$2" arch="$3"
  printf '%s/%s\n' "${GO_DL_BASE%/}" "$(go_toolchain_archive_name "$version" "$os" "$arch")"
}

install_go_toolchain() {
  local version="$1" os arch root archive url fallback_url installed
  os="$(detect_os)"
  arch="$(detect_arch)"
  if [[ "$os" == "unsupported" || "$arch" == "unsupported" ]]; then
    echo "error: Go $version is required, but automatic Go toolchain download is unsupported on $(uname -s)/$(uname -m)." >&2
    echo "Install Go $version or newer manually, then re-run this installer." >&2
    exit 1
  fi
  command -v curl &>/dev/null || { echo "error: curl is required to download Go $version" >&2; exit 1; }
  command -v tar &>/dev/null || { echo "error: tar is required to extract Go $version" >&2; exit 1; }

  root="$BUILD_DIR/go-toolchain"
  archive="$root/$(go_toolchain_archive_name "$version" "$os" "$arch")"
  rm -rf "$root"
  mkdir -p "$root"
  url="$(go_toolchain_download_url "$version" "$os" "$arch")"
  fallback_url="https://dl.google.com/go/$(go_toolchain_archive_name "$version" "$os" "$arch")"

  say "Downloading Go $version toolchain for source build ($os/$arch) ..."
  if ! curl -fsSL --retry 3 --max-time 300 -o "$archive" "$url"; then
    if [[ "$url" != "$fallback_url" ]]; then
      warn "Go download failed from $url; retrying $fallback_url"
      curl -fsSL --retry 3 --max-time 300 -o "$archive" "$fallback_url"
    else
      return 1
    fi
  fi
  tar -xzf "$archive" -C "$root"
  export PATH="$root/go/bin:$PATH"
  installed="$(installed_go_version || true)"
  if ! go_version_ge "$installed" "$version"; then
    echo "error: downloaded Go toolchain is $installed, expected $version or newer" >&2
    exit 1
  fi
}

ensure_go_for_source() {
  local source_dir="$1" required installed
  required="$(required_go_version_for_source "$source_dir")" || {
    echo "error: could not read required Go version from $source_dir/tui/go.mod" >&2
    exit 1
  }
  installed="$(installed_go_version || true)"
  if [[ -n "$installed" ]] && go_version_ge "$installed" "$required"; then
    note "Using Go $installed for source build (requires >= $required)."
    return 0
  fi
  if [[ -n "$installed" ]]; then
    note "Installed Go $installed is older than required $required; using official Go toolchain for this build."
  else
    note "Go is not installed; using official Go $required toolchain for this build."
  fi
  install_go_toolchain "$required"
}

normalize_node_version() {
  local version="${1#v}"
  if [[ "$version" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
    printf '%s.%s.%s\n' "${BASH_REMATCH[1]}" "${BASH_REMATCH[2]}" "${BASH_REMATCH[3]}"
    return 0
  fi
  return 1
}

installed_node_version() {
  command -v node &>/dev/null || return 1
  node --version 2>/dev/null | sed -n 's/^v\([0-9][0-9.]*\)$/\1/p' | head -1
}

portal_node_supported() {
  local version major minor patch
  version="$(normalize_node_version "$1")" || return 1
  IFS=. read -r major minor patch <<<"$version"
  if (( major == 20 )); then
    (( minor >= 19 ))
    return
  fi
  if (( major == 22 )); then
    (( minor >= 12 ))
    return
  fi
  (( major > 22 ))
}

portal_node_requirement_note() {
  echo "Node.js 20.19+ or 22.12+ is required to build lingtai-portal. The installer can use an official temporary Node toolchain; if that download fails, upgrade Node and re-run the installer to add the portal binary."
}

node_toolchain_arch() {
  case "$(detect_arch)" in
    amd64) echo "x64" ;;
    arm64) echo "arm64" ;;
    *) echo "unsupported" ;;
  esac
}

node_toolchain_archive_name() {
  local version="$1" os="$2" arch="$3"
  printf 'node-v%s-%s-%s.tar.gz\n' "$version" "$os" "$arch"
}

node_toolchain_download_url() {
  local version="$1" os="$2" arch="$3"
  printf '%s/v%s/%s\n' "${NODE_DL_BASE%/}" "$version" "$(node_toolchain_archive_name "$version" "$os" "$arch")"
}

install_node_toolchain() {
  local version="${1:-$NODE_TOOLCHAIN_VERSION}" os arch root archive url dirname installed
  os="$(detect_os)"
  arch="$(node_toolchain_arch)"
  if [[ "$os" == "unsupported" || "$arch" == "unsupported" ]]; then
    warn "Automatic Node.js toolchain download is unsupported on $(uname -s)/$(uname -m)."
    return 1
  fi
  command -v curl &>/dev/null || { warn "curl is required to download Node.js $version"; return 1; }
  command -v tar &>/dev/null || { warn "tar is required to extract Node.js $version"; return 1; }

  root="$BUILD_DIR/node-toolchain"
  archive="$root/$(node_toolchain_archive_name "$version" "$os" "$arch")"
  dirname="node-v${version}-${os}-${arch}"
  rm -rf "$root"
  mkdir -p "$root"
  url="$(node_toolchain_download_url "$version" "$os" "$arch")"

  say "Downloading Node.js $version toolchain for portal build ($os/$arch) ..."
  if ! curl -fsSL --retry 3 --max-time 300 -o "$archive" "$url"; then
    warn "Node.js download failed from $url"
    return 1
  fi
  if ! tar -xzf "$archive" -C "$root"; then
    warn "Node.js archive extraction failed"
    return 1
  fi
  export PATH="$root/$dirname/bin:$PATH"
  installed="$(installed_node_version || true)"
  if [[ -z "$installed" ]] || ! portal_node_supported "$installed"; then
    warn "Downloaded Node.js toolchain is ${installed:-unavailable}, expected $version or another supported version"
    return 1
  fi
}

ensure_node_for_portal() {
  local installed
  installed="$(installed_node_version || true)"
  if [[ -n "$installed" ]] && portal_node_supported "$installed" && command -v npm &>/dev/null; then
    note "Using Node.js $installed for portal build."
    return 0
  fi
  if [[ -n "$installed" ]]; then
    warn "Node.js $installed is not supported for portal build; using official Node.js $NODE_TOOLCHAIN_VERSION for this build."
  else
    warn "Node.js is not available; using official Node.js $NODE_TOOLCHAIN_VERSION for the portal build."
  fi
  install_node_toolchain "$NODE_TOOLCHAIN_VERSION"
}


# ensure_build_deps checks/installs non-Go source-build dependencies. Go is
# validated after the source tree is available, because tui/go.mod declares the
# required version and distro packages (for example Ubuntu jammy Go 1.18) may be
# too old.
ensure_build_deps() {
  local need_git="${1:-1}"
  if [[ "$need_git" == "1" ]] && ! command -v git &>/dev/null; then
    if command -v apt-get &>/dev/null && apt_install "git (build dependency)" git; then
      :
    else
      echo "error: git is required for the official source fallback but not found. Install it with:" >&2
      suggest_install git
      exit 1
    fi
  fi
}

# Ordinary install is first-install-only. It never adopts, overwrites, or repairs
# an existing TUI target; those operations require an explicit child asset.
validate_install_target() {
  [[ "$BIN_DIR" == /* && "$BIN_DIR" != *$'\n'* && "$BIN_DIR" != *$'\t'* && "$BIN_DIR" != */../* && "$BIN_DIR" != */./* ]] || {
    echo "error: install target is not an exact absolute directory: $BIN_DIR" >&2; return 1;
  }
  [[ ! -L "$BIN_DIR" ]] || { echo "error: install target is a symlink: $BIN_DIR" >&2; return 1; }
  for managed in lingtai-tui lingtai-portal lingtai lingtai-agent; do
    if [[ -e "$BIN_DIR/$managed" || -L "$BIN_DIR/$managed" ]]; then
      echo "error: existing managed target $BIN_DIR/$managed was found; ordinary install will not adopt or overwrite it." >&2
      echo "       Read https://lingtai.ai/help/reference/installation/assets/fix.sh or update.sh." >&2
      return 1
    fi
  done
  mkdir -p "$BIN_DIR"
}

# A different empty --bin-dir must not turn ordinary install into adoption of a
# pre-existing receipt or runtime. Check this before target creation, release
# resolution, downloads, or any binary/runtime mutation.
validate_fresh_install_state() {
  local state_root="$HOME/.lingtai-tui"
  local metadata="$state_root/install.json"
  local runtime_root="$state_root/runtime"
  if [[ -e "$metadata" || -L "$metadata" ]]; then
    echo "error: existing install receipt $metadata was found; ordinary install is first-install-only." >&2
    echo "       Read https://lingtai.ai/help/reference/installation/skill.md for explicit update, repair, or verification." >&2
    return 1
  fi
  if [[ -e "$runtime_root" || -L "$runtime_root" ]]; then
    echo "error: existing runtime state $runtime_root was found; ordinary install will not adopt or repair it." >&2
    echo "       Read https://lingtai.ai/help/reference/installation/skill.md for explicit repair or verification." >&2
    return 1
  fi
}

# --- main --------------------------------------------------------------------

latest_main_requested() {
  local arg expect_value=0
  for arg in "$@"; do
    if [[ "$expect_value" == "1" ]]; then
      expect_value=0
      continue
    fi
    case "$arg" in
      --version|--ref|--prefix|--bin-dir|--source) expect_value=1 ;;
      --latest) return 0 ;;
    esac
  done
  return 1
}

latest_main_handoff() {
  if [[ "${1:-}" == "install" ]]; then
    shift
  fi

  command -v git &>/dev/null || {
    echo "error: git is required for the explicit --latest main install." >&2
    return 1
  }
  command -v curl &>/dev/null || {
    echo "error: curl is required for the explicit --latest main install." >&2
    return 1
  }

  local ref_line resolved_sha handoff_dir handoff_script handoff_url rc
  if ! ref_line="$(git ls-remote "$REPO" refs/heads/main)"; then
    echo "error: could not resolve ${REPO_SLUG} refs/heads/main for --latest." >&2
    return 1
  fi
  resolved_sha="${ref_line%%$'\t'*}"
  [[ "$resolved_sha" =~ ^[0-9a-f]{40}$ ]] || {
    echo "error: invalid ${REPO_SLUG} main SHA for --latest: ${resolved_sha:-<empty>}" >&2
    return 1
  }

  handoff_dir="$(mktemp -d "${TMPDIR:-/tmp}/lingtai-latest.XXXXXX")" || return 1
  handoff_script="$handoff_dir/install.sh"
  handoff_url="https://raw.githubusercontent.com/${REPO_SLUG}/${resolved_sha}/install.sh"
  if curl -fsSL --retry 3 --max-time 120 -o "$handoff_script" "$handoff_url"; then
    say "Delegating explicit --latest to ${REPO_SLUG} main at $resolved_sha"
  else
    rc=$?
    rm -rf -- "$handoff_dir"
    echo "error: failed to fetch the pinned --latest installer at $resolved_sha." >&2
    return "$rc"
  fi

  if bash "$handoff_script" "$@"; then rc=0; else rc=$?; fi
  rm -rf -- "$handoff_dir"
  return "$rc"
}

main() {
  if latest_main_requested "$@"; then
    latest_main_handoff "$@"
    return $?
  fi
  parse_args "$@" || return $?
  cleanup() { cd / 2>/dev/null || true; rm -rf "$BUILD_DIR"; }
  trap cleanup EXIT

  [[ ! -L "$HOME/.lingtai-tui" ]] || {
    echo "error: $HOME/.lingtai-tui is a symlink; refusing redirected install state." >&2
    return 1
  }
  validate_fresh_install_state || return 1
  resolve_bin_dir
  validate_install_target || return 1

  if is_wsl; then
    say "Detected Windows Subsystem for Linux (WSL)."
    note "Binaries and the Python runtime install into your Linux home ($HOME)."
  fi

  # Source selection and every release/pin resolution remain in the canonical
  # ordinary installer. No skill or asset is fetched on this path.
  if command -v curl &>/dev/null && [ -z "${GOPROXY:-}" ] && \
     ! curl -sSfL --max-time 3 -o /dev/null \
       "https://proxy.golang.org/github.com/golang/go/@latest" 2>/dev/null; then
    say "proxy.golang.org unreachable; using China-friendly build mirrors."
    export GOPROXY="https://goproxy.cn,direct" GOSUMDB="sum.golang.google.cn" NPM_CONFIG_REGISTRY="https://registry.npmmirror.com"
  fi
  resolve_source_provider
  [[ "$BUNDLE_PROVIDER" != "gitee" ]] || say "Source: Gitee (${GITEE_OWNER}/${GITEE_REPO}) — override with --source github."

  BUNDLE_REQUIRED=1
  if fetch_bundle_manifest; then
    note "Resolved bundle $BUNDLE_TAG via $BUNDLE_PROVIDER (kernel $(bundle_manifest_field kernel_tag))."
  else
    warn "No usable bundle manifest for $BUNDLE_TAG; trying the exact TUI release pin."
    if [[ -n "$(release_tag_name "$BUNDLE_TAG")" ]] && fetch_kernel_pin "$BUNDLE_TAG"; then
      note "Resolved kernel release pin $KERNEL_PIN_TAG from TUI $KERNEL_PIN_TUI_TAG via $KERNEL_PIN_PROVIDER."
    else
      warn "No valid kernel release pin for exact TUI tag $BUNDLE_TAG."
    fi
  fi

  TARGET_TAG="${VERSION:-$BUNDLE_TAG}"
  [[ -n "$TARGET_TAG" ]] || { echo "error: could not determine an exact TUI release tag; pass --version vX.Y.Z." >&2; return 1; }
  [[ -n "$(release_tag_name "$TARGET_TAG")" ]] || {
    echo "error: selected target '$TARGET_TAG' is not an exact official vX.Y.Z release tag." >&2
    return 1
  }
  [[ -n "$VERSION" ]] || say "Latest release is $TARGET_TAG"

  if [[ "$FROM_SOURCE" != "1" ]]; then
    if try_release_asset "$TARGET_TAG"; then :
    else
      asset_rc=$?; [[ "$asset_rc" != "2" ]] || return 1
      build_from_source "$TARGET_TAG"
    fi
  else
    build_from_source "$TARGET_TAG"
  fi

  verify_tui_binary_version "$BIN_DIR/lingtai-tui" "$VERSION" || {
    echo "error: installed lingtai-tui failed its exact version postcondition." >&2; return 1
  }
  ensure_runtime_venv "$BIN_DIR" || {
    echo "error: ordinary install incomplete; runtime was not proven from a pinned local artifact." >&2
    return 1
  }
  final_runtime_summary="runtime intentionally skipped"
  if [[ "$SKIP_VENV" != "1" ]]; then
    final_runtime_python="$(runtime_python_for_venv "$RUNTIME_VENV_DIR")"
    final_runtime_summary="$(runtime_health_check "$final_runtime_python" "$KERNEL_VERSION_INSTALLED" 2>/dev/null || true)"
    [[ -n "$final_runtime_python" && -n "$final_runtime_summary" ]] || { echo "error: final runtime health check failed." >&2; return 1; }
  fi

  GLOBAL_DIR="$HOME/.lingtai-tui"
  PREFIX="$(prefix_for_bin_dir "$BIN_DIR")"
  REQUESTED_REF="${VERSION:-$TARGET_TAG}"
  write_install_metadata "$GLOBAL_DIR" "$PREFIX" "$BIN_DIR" "$REPO" "$REQUESTED_REF" \
    "${RESOLVED_REF:-$VERSION}" "${RESOLVED_COMMIT:-}" "$VERSION" \
    "$BIN_DIR/lingtai-tui" "$PORTAL_PATH" || return 1
  say "Wrote install metadata to $GLOBAL_DIR/install.json"
  say "Done. $("$BIN_DIR/lingtai-tui" version 2>&1 || echo "$VERSION")"
  print_path_hint "$BIN_DIR"
}

if [[ "${LINGTAI_INSTALL_SH_SOURCE_ONLY:-0}" != "1" ]]; then
  main "$@"
fi
