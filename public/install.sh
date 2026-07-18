#!/usr/bin/env bash
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
# --ref/source-ref builds have no exact release pin and fail loud the same way.
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
# Explicit update-mode endpoints are overrideable for deterministic tests, but
# default to the official release/registry locations. Update mode discovers the
# latest TUI release from official release metadata and takes the kernel version
# only from that paired bundle manifest.
UPDATE_GITHUB_DOWNLOAD_BASE="${LINGTAI_UPDATE_GITHUB_DOWNLOAD_BASE:-https://github.com/Lingtai-AI/lingtai-kernel/releases/download}"
UPDATE_GITEE_API_BASE="${LINGTAI_UPDATE_GITEE_API_BASE:-$GITEE_KERNEL_API_BASE}"
UPDATE_PYPI_JSON_BASE="${LINGTAI_UPDATE_PYPI_JSON_BASE:-https://pypi.org/pypi}"
UPDATE_GITHUB_TUI_API_BASE="${LINGTAI_UPDATE_GITHUB_TUI_API_BASE:-https://api.github.com/repos/Lingtai-AI/lingtai}"
UPDATE_GITEE_TUI_API_BASE="${LINGTAI_UPDATE_GITEE_TUI_API_BASE:-https://gitee.com/api/v5/repos/${GITEE_OWNER}/${GITEE_REPO}}"
UPDATE_GITHUB_KERNEL_API_BASE="${LINGTAI_UPDATE_GITHUB_KERNEL_API_BASE:-$KERNEL_GH_API_BASE}"
UPDATE_GITEE_KERNEL_API_BASE="${LINGTAI_UPDATE_GITEE_KERNEL_API_BASE:-$GITEE_KERNEL_API_BASE}"
UPDATE_GITHUB_MIGRATION_BASE="${LINGTAI_UPDATE_GITHUB_MIGRATION_BASE:-https://raw.githubusercontent.com/Lingtai-AI/lingtai}"
UPDATE_GITEE_MIGRATION_BASE="${LINGTAI_UPDATE_GITEE_MIGRATION_BASE:-https://gitee.com/${GITEE_OWNER}/${GITEE_REPO}/raw}"
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

TMPDIR="${TMPDIR:-/tmp}"
BUILD_DIR="$TMPDIR/lingtai-install-$$"

# --- flags / state -----------------------------------------------------------
REF=""               # explicit source ref (branch/tag/commit) => forces source build
VERSION=""           # explicit release tag to install (default: latest release)
MODE="install"       # install | update; no positional mode is the legacy install alias
UPDATE_MODE=0        # compatibility alias for the old --update spelling
DEV_MODE=0            # install --dev: editable kernel + source-built TUI/Portal
DEV_KERNEL_SOURCE="${LINGTAI_DEV_KERNEL_SOURCE:-}"
DEV_TUI_SOURCE="${LINGTAI_DEV_TUI_SOURCE:-}"
UPDATE_RUNTIME_ARG="${LINGTAI_RUNTIME_PYTHON:-}"
UPDATE_TUI_TAG="${LINGTAI_UPDATE_TUI_TAG:-}"
UPDATE_MIGRATION_ROOT="${LINGTAI_UPDATE_MIGRATION_ROOT:-}"
UPDATE_AUTHORIZED="${LINGTAI_UPDATE_AUTHORIZED:-0}"
UPDATE_REFRESH="${LINGTAI_UPDATE_REFRESH:-0}"
UPDATE_HASH_POLICY="sha256"
INSTALL_PREFIX=""    # --prefix: install root (bin_dir = <prefix>/bin)
BIN_DIR_OVERRIDE=""  # --bin-dir: explicit bin directory
NON_INTERACTIVE=0    # --non-interactive: never prompt / never sudo-install packages
FROM_SOURCE=0        # --from-source: skip release-asset download, always build
SKIP_PORTAL=0        # --skip-portal: TUI only
SKIP_VENV=0          # --skip-python (alias: --skip-venv): don't touch the Python runtime venv
INSTALL_KIND=""      # "release-asset" | "source-build" | "dev-source" (recorded in metadata)
SOURCE_ARG="${LINGTAI_SOURCE:-auto}"  # --source auto|github|gitee (env LINGTAI_SOURCE)
BUNDLE_PROVIDER=""    # resolved by resolve_source_provider(): "github" | "gitee"
BUNDLE_TAG=""         # resolved TUI release tag shared by the archive + bundle/pin path
BUNDLE_MANIFEST_JSON="" # raw bundle manifest body, once fetched
BUNDLE_REQUIRED=0     # 1 on the default release-asset one-command path (no --ref, no --update):
                      # an exact pinned bundle or release pin is mandatory there, so a
                      # missing/incoherent/failed pin or kernel install must fail loud rather
                      # than silently falling back to `pip install lingtai`. 0 for --ref/source-ref
                      # builds, where no exact release pin is expected and those paths require
                      # --skip-python instead (see ensure_runtime_venv).
KERNEL_SOURCE=""      # "bundle" | "release-pin" | "editable" (never a package-index install)
KERNEL_BUNDLE_ID=""
KERNEL_RELEASE_TAG=""
KERNEL_VERSION_INSTALLED=""
KERNEL_PROVIDER=""
KERNEL_PIN_JSON=""
KERNEL_PIN_TAG=""
KERNEL_PIN_PROVIDER=""
KERNEL_PIN_TUI_TAG=""
DEV_KERNEL_SOURCE_PATH=""
DEV_TUI_SOURCE_PATH=""
KERNEL_MANIFEST_PROVIDER=""  # set by fetch_kernel_manifest(); which provider actually served the kernel manifest
KERNEL_MANIFEST_JSON=""      # set by fetch_kernel_manifest() in the same shell as the provider
BUNDLE_MANIFEST_KERNEL_TAG=""
BUNDLE_MANIFEST_KERNEL_VERSION=""
BUNDLE_MANIFEST_KERNEL_FILENAME=""
BUNDLE_MANIFEST_BUNDLE_ID=""

# Existing-install discovery state. These values are populated before the
# install path chooses a destination. Discovery is deliberately conservative:
# explicit --prefix/--bin-dir wins, one unambiguous PATH/metadata installation is
# adopted, and conflicting installations fail instead of being guessed.
DISCOVERED_BIN_DIR=""
DISCOVERED_CURRENT_TUI_TAG=""
DISCOVERED_METADATA_VERSION=""
DISCOVERED_METADATA_INSTALL_KIND=""
DISCOVERED_METADATA_PRESENT=0
DISCOVERED_RUNTIME_VENV=""
RUNTIME_VENV_DIR=""
PLANNED_RUNTIME_REPAIR_PATH=""
INSTALL_PLAN_APPROVED=0
PLAN_BEFORE_TUI=""
PLAN_BEFORE_RUNTIME=""

usage() {
  cat <<'EOF'
LingTai single-file installer: install the official paired TUI/Portal release and Python runtime.

Functions:
  install.sh install              Install the latest official release (legacy no-mode invocation is an alias).
  install.sh install --dev        Install editable kernel source plus source-built TUI and Portal.
  install.sh update               Authorized, migration-aware update of the paired official installation.

Use a child command's --help for only that command's options.
EOF
}

install_usage() {
  cat <<'EOF'
Usage: install.sh install [options]

Install the official TUI/Portal release and its pinned Python runtime.
  --dev                  Editable kernel source plus source-built TUI/Portal (not a release alias).
  --version <tag>        Install this official release tag instead of latest.
  --ref <ref>            Build this source ref (legacy source-install option).
  --bin-dir <dir>        Install binaries into <dir>.
  --prefix <dir>         Install binaries into <prefix>/bin.
  --from-source          Build the selected official release from source.
  --skip-portal          Install lingtai-tui without Portal.
  --skip-python          Do not provision the Python runtime (alias: --skip-venv).
  --source <auto|github|gitee>  Select the official release mirror.
  --non-interactive      Do not prompt or install OS packages.
  -h, --help             Show this help.
EOF
}

update_usage() {
  cat <<'EOF'
Usage: install.sh update [options]

Update the official paired TUI/Portal release and its manifest-pinned kernel wheel.
  --runtime-python <path>  Explicit runtime interpreter (also LINGTAI_RUNTIME_PYTHON).
  --tui-tag <tag>          Authorized exact TUI release override; normal path discovers latest.
  --prefix <dir>           Update binaries in <prefix>/bin (for TUI-managed custom installs).
  --bin-dir <dir>          Update binaries in this exact directory.
  --migration-root <url>   Override exact-tag migration document roots for fixtures.
  --hash-policy <sha256>   Require manifest and transport SHA-256 agreement (only supported policy).
  --non-interactive        Require already-authorized execution; never prompt.
  --yes                    Explicit human/config-owner authorization acknowledgement.
  --refresh                Print the required Agent system.refresh handoff (never performs it).
  -h, --help               Show this help.

Update always reads official release manifests first, falls back GitHub -> Gitee ->
PyPI only for the exact manifest-selected wheel, refuses sdist, and stops on mirror
or migration disagreement. Migration guidance is printed before installation.
EOF
}

show_help_for_mode() {
  case "$1" in
    install) install_usage ;;
    update) update_usage ;;
    *) usage ;;
  esac
}

# --- messaging helpers -------------------------------------------------------
say()  { echo "==> $*"; }
warn() { echo "warning: $*" >&2; }
note() { echo "    $*"; }

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

# parse_kernel_pin_manifest validates the small source-owned pin committed at an
# exact TUI release tag. The released file has exactly these three keys: keeping
# the parser strict prevents an accidental "latest" or provider-specific shape
# from selecting a kernel outside the TUI release's explicit contract.
parse_kernel_pin_manifest() {
  local body="$1"
  BODY="$body" python3 - <<'PY'
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
  BODY="$body" python3 - "$expected_tag" "$(detect_os)" "$(detect_arch)" <<'PY'
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

# --- git checkout version helpers (used by source build + tests) -------------

is_exact_checkout_tag() {
  local repo_dir="$1" tag="$2" tag_commit head_commit
  tag_commit="$(git -C "$repo_dir" rev-parse --verify --quiet "refs/tags/$tag^{commit}" 2>/dev/null || true)"
  if [[ -z "$tag_commit" ]]; then
    return 1
  fi
  head_commit="$(git -C "$repo_dir" rev-parse --verify HEAD 2>/dev/null || true)"
  if [[ -z "$head_commit" ]]; then
    return 1
  fi
  [[ "$head_commit" == "$tag_commit" ]]
}

version_for_checkout() {
  local repo_dir="$1" requested_ref="$2" requested_tag
  requested_tag="$(release_tag_name "$requested_ref")"
  if [[ -n "$requested_tag" ]] && is_exact_checkout_tag "$repo_dir" "$requested_tag"; then
    printf '%s\n' "$requested_tag"
    return
  fi
  git -C "$repo_dir" describe --tags --always 2>/dev/null || echo "dev"
}

resolved_ref_for_checkout() {
  local repo_dir="$1" exact_tag branch
  exact_tag="$(git -C "$repo_dir" describe --tags --exact-match 2>/dev/null || true)"
  if [[ -n "$exact_tag" ]]; then
    printf '%s\n' "$exact_tag"
    return
  fi
  branch="$(git -C "$repo_dir" symbolic-ref --quiet --short HEAD 2>/dev/null || true)"
  if [[ -n "$branch" ]]; then
    printf '%s\n' "$branch"
    return
  fi
  git -C "$repo_dir" rev-parse --short HEAD
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

# discover_current_tui_tag executes the discovered lingtai-tui binary at
# bin_dir to learn its real version. This is the one place discovery
# executes user-controlled code, so callers must only invoke it AFTER the
# repair plan has been printed and consent has been obtained — never during
# discover_existing_install/print_install_plan, which stay filesystem- and
# metadata-only so a refusal or EOF at the consent prompt leaves no
# execution/import side effect behind.
discover_current_tui_tag() {
  local bin_dir="$1"
  [[ -n "$bin_dir" && -x "$bin_dir/lingtai-tui" ]] || return 1
  tui_binary_tag "$bin_dir/lingtai-tui"
}

# metadata_field reads one installer-owned string field without trusting a
# malformed JSON document. validate_install_metadata_file is called first by
# discovery, so this helper intentionally returns empty for missing/non-string
# fields and never guesses a value.
metadata_field() {
  local metadata_path="$1" field="$2"
  python3 - "$metadata_path" "$field" <<'PY'
import json
import sys

path, field = sys.argv[1:]
try:
    with open(path, encoding="utf-8") as stream:
        data = json.load(stream)
except Exception:
    raise SystemExit(1)
value = data.get(field, "") if isinstance(data, dict) else ""
if isinstance(value, str):
    print(value)
PY
}

validate_install_metadata_file() {
  local metadata_path="$1"
  python3 - "$metadata_path" <<'PY'
import json
import sys

def pairs(items):
    result = {}
    for key, value in items:
        if key in result:
            raise ValueError(f"duplicate JSON key: {key}")
        result[key] = value
    return result

with open(sys.argv[1], encoding="utf-8") as stream:
    data = json.load(stream, object_pairs_hook=pairs)
if not isinstance(data, dict):
    raise ValueError("install metadata must be a JSON object")
PY
}

# canonical_existing_dir resolves a directory without following an untrusted
# binary symlink. It also permits a metadata-declared, not-yet-created final
# directory when its parent already exists; that is the narrow repair case.
canonical_existing_dir() {
  local dir="$1" parent base
  [[ "$dir" == /* && "$dir" != *$'\n'* && "$dir" != *$'\t'* ]] || return 1
  [[ "$dir" != */../* && "$dir" != */.. && "$dir" != *'/./'* && "$dir" != */. ]] || return 1
  if [[ -d "$dir" ]]; then
    (cd "$dir" && pwd -P)
    return
  fi
  parent="$(dirname "$dir")"
  base="$(basename "$dir")"
  [[ "$base" != "." && "$base" != ".." && -d "$parent" ]] || return 1
  printf '%s/%s\n' "$(cd "$parent" && pwd -P)" "$base"
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

# discover_existing_install adopts exactly one safe existing installation. It
# checks metadata, every absolute PATH entry, and the conventional user/system
# bin locations. Two distinct executable TUI installations are an unsafe
# ambiguity and stop the install; a stale but structurally valid metadata file
# is repaired later rather than used as a version oracle.
discover_existing_install() {
  local metadata_path="${LINGTAI_INSTALL_METADATA:-$HOME/.lingtai-tui/install.json}"
  local metadata_bin="" metadata_runtime="" metadata_version="" metadata_kind=""
  local metadata_target="" candidate_dir="" candidate_tag="" path_entry
  local -a path_entries=() candidate_dirs=()
  local old_ifs="${IFS:- }"

  DISCOVERED_BIN_DIR=""
  DISCOVERED_CURRENT_TUI_TAG=""
  DISCOVERED_METADATA_VERSION=""
  DISCOVERED_METADATA_INSTALL_KIND=""
  DISCOVERED_METADATA_PRESENT=0
  DISCOVERED_RUNTIME_VENV=""

  if [[ -e "$metadata_path" ]]; then
    DISCOVERED_METADATA_PRESENT=1
    [[ -f "$metadata_path" && -r "$metadata_path" ]] || {
      echo "error: existing install metadata is not a readable regular file: $metadata_path" >&2
      return 1
    }
    if ! validate_install_metadata_file "$metadata_path" >/dev/null 2>&1; then
      echo "error: existing install metadata is malformed or unsafe: $metadata_path" >&2
      echo "       Refusing to overwrite it; repair the JSON or pass --prefix/--bin-dir explicitly." >&2
      return 1
    fi
    metadata_bin="$(metadata_field "$metadata_path" bin_dir || true)"
    metadata_runtime="$(metadata_field "$metadata_path" runtime_venv || true)"
    metadata_version="$(metadata_field "$metadata_path" stamped_version || true)"
    metadata_kind="$(metadata_field "$metadata_path" install_kind || true)"
    if [[ -n "$metadata_bin" ]]; then
      metadata_target="$(canonical_existing_dir "$metadata_bin" || true)"
      [[ -n "$metadata_target" ]] || {
        echo "error: existing install metadata names an unsafe binary directory: $metadata_bin" >&2
        echo "       Retry with an explicit --prefix or --bin-dir." >&2
        return 1
      }
    fi
    if [[ -n "$metadata_runtime" ]]; then
      local runtime_root="$HOME/.lingtai-tui/runtime" physical_runtime=""
      if [[ "$metadata_runtime" != /* || "$metadata_runtime" == *$'\n'* || "$metadata_runtime" == *$'\t'* || "$metadata_runtime" == */../* ]]; then
        echo "error: existing install metadata names an unsafe runtime venv: $metadata_runtime" >&2
        echo "       Refusing to guess which runtime state is owned; repair metadata or pass --prefix/--bin-dir." >&2
        return 1
      fi
      physical_runtime="$(canonical_runtime_venv "$metadata_runtime" "$runtime_root" || true)"
      if [[ -z "$physical_runtime" ]]; then
        echo "error: existing install metadata names a runtime venv outside the owned runtime root (possibly via a symlink): $metadata_runtime" >&2
        echo "       Refusing to adopt or mutate state outside $runtime_root; repair metadata or pass --prefix/--bin-dir." >&2
        return 1
      fi
      DISCOVERED_RUNTIME_VENV="${metadata_runtime%/}"
    fi
    DISCOVERED_METADATA_VERSION="$metadata_version"
    DISCOVERED_METADATA_INSTALL_KIND="$metadata_kind"
  fi

  # add_candidate is deliberately filesystem-metadata-only: it never executes
  # a discovered binary. Distinct candidate directories are identified purely
  # by path plus executable-bit presence, so ambiguity detection (below) does
  # not require running anything. The real version tag is unknown at this
  # point; it is resolved later by discover_current_tui_tag, called only
  # after the plan is printed and consent is obtained.
  add_candidate() {
    local dir="$1" canonical existing
    canonical="$(canonical_existing_dir "$dir" || true)"
    [[ -n "$canonical" && -x "$canonical/lingtai-tui" ]] || return 0
    for existing in "${candidate_dirs[@]:-}"; do
      [[ "$existing" == "$canonical" ]] && return 0
    done
    candidate_dirs+=("$canonical")
  }

  if [[ -n "$metadata_target" ]]; then
    add_candidate "$metadata_target"
  fi
  IFS=: read -r -a path_entries <<< "${PATH:-}"
  IFS="$old_ifs"
  for path_entry in "${path_entries[@]:-}"; do
    [[ -n "$path_entry" ]] || path_entry="."
    [[ "$path_entry" == /* ]] || continue
    add_candidate "$path_entry"
  done
  add_candidate "$HOME/.local/bin"
  add_candidate "/usr/local/bin"

  if [[ "${#candidate_dirs[@]}" -gt 1 ]]; then
    echo "error: multiple installed lingtai-tui binaries were discovered; refusing to guess:" >&2
    local index
    for index in "${!candidate_dirs[@]}"; do
      echo "       ${candidate_dirs[$index]}" >&2
    done
    echo "       Retry with an explicit --prefix or --bin-dir." >&2
    return 1
  fi
  if [[ "${#candidate_dirs[@]}" == "1" ]]; then
    if [[ -n "$metadata_target" && "${candidate_dirs[0]}" != "$metadata_target" ]]; then
      echo "error: install metadata and PATH identify different lingtai-tui directories; refusing to guess." >&2
      echo "       metadata: $metadata_target" >&2
      echo "       PATH:     ${candidate_dirs[0]}" >&2
      echo "       Retry with an explicit --prefix or --bin-dir." >&2
      return 1
    fi
    DISCOVERED_BIN_DIR="${candidate_dirs[0]}"
  elif [[ -n "$metadata_target" ]]; then
    DISCOVERED_BIN_DIR="$metadata_target"
  fi

  # The real installed-binary version tag is deliberately NOT probed here:
  # that requires executing the discovered binary, which must not happen
  # before the plan is printed and consent is obtained (see
  # discover_current_tui_tag, called by print_install_plan's caller only
  # after consent, and used for the final before/after report).
  if [[ -n "$DISCOVERED_METADATA_INSTALL_KIND" ]]; then
    note "Existing install method: $DISCOVERED_METADATA_INSTALL_KIND."
  fi
  RUNTIME_VENV_DIR="${DISCOVERED_RUNTIME_VENV:-$HOME/.lingtai-tui/runtime/venv}"
}

# discover_explicit_target_install runs when --prefix/--bin-dir is given. The
# explicit destination is authoritative for WHERE to install — it is never
# redirected — but it is not authorization to skip disclosure: if that exact
# target already contains an executable lingtai-tui (installer-managed or
# not), the same plan+consent gate as unambiguous PATH/metadata discovery
# applies before it is overwritten. This is filesystem/metadata-only, same as
# discover_existing_install: no binary is executed and no runtime is
# imported here.
discover_explicit_target_install() {
  local metadata_path="${LINGTAI_INSTALL_METADATA:-$HOME/.lingtai-tui/install.json}"
  local target_dir metadata_bin metadata_runtime metadata_target=""

  DISCOVERED_BIN_DIR=""
  DISCOVERED_CURRENT_TUI_TAG=""
  DISCOVERED_METADATA_VERSION=""
  DISCOVERED_METADATA_INSTALL_KIND=""
  DISCOVERED_METADATA_PRESENT=0
  DISCOVERED_RUNTIME_VENV=""

  target_dir="$(plan_bin_dir)"
  target_dir="$(canonical_existing_dir "$target_dir" || true)"

  if [[ -e "$metadata_path" ]]; then
    [[ -f "$metadata_path" && -r "$metadata_path" ]] || {
      echo "error: existing install metadata is not a readable regular file: $metadata_path" >&2
      return 1
    }
    if ! validate_install_metadata_file "$metadata_path" >/dev/null 2>&1; then
      echo "error: existing install metadata is malformed or unsafe: $metadata_path" >&2
      echo "       Refusing to overwrite it; repair the JSON or pass --prefix/--bin-dir explicitly." >&2
      return 1
    fi
    metadata_bin="$(metadata_field "$metadata_path" bin_dir || true)"
    metadata_runtime="$(metadata_field "$metadata_path" runtime_venv || true)"
    if [[ -n "$metadata_bin" ]]; then
      metadata_target="$(canonical_existing_dir "$metadata_bin" || true)"
    fi
    if [[ -n "$target_dir" && -n "$metadata_target" && "$target_dir" == "$metadata_target" ]]; then
      DISCOVERED_METADATA_PRESENT=1
      DISCOVERED_METADATA_VERSION="$(metadata_field "$metadata_path" stamped_version || true)"
      DISCOVERED_METADATA_INSTALL_KIND="$(metadata_field "$metadata_path" install_kind || true)"
      if [[ -n "$metadata_runtime" ]]; then
        local runtime_root="$HOME/.lingtai-tui/runtime" physical_runtime=""
        if [[ "$metadata_runtime" == /* && "$metadata_runtime" != *$'\n'* && "$metadata_runtime" != *$'\t'* && "$metadata_runtime" != */../* ]]; then
          physical_runtime="$(canonical_runtime_venv "$metadata_runtime" "$runtime_root" || true)"
        fi
        if [[ -z "$physical_runtime" ]]; then
          echo "error: existing install metadata names an unsafe or unowned runtime venv: $metadata_runtime" >&2
          echo "       Refusing to adopt or mutate state outside $runtime_root; repair metadata explicitly." >&2
          return 1
        fi
        DISCOVERED_RUNTIME_VENV="${metadata_runtime%/}"
      fi
    fi
  fi

  if [[ -n "$target_dir" && -x "$target_dir/lingtai-tui" ]]; then
    DISCOVERED_BIN_DIR="$target_dir"
  fi

  RUNTIME_VENV_DIR="${DISCOVERED_RUNTIME_VENV:-$HOME/.lingtai-tui/runtime/venv}"
}

runtime_current_summary() {
  local venv_dir="$1" state py probe
  state="$(runtime_venv_state "$venv_dir")"
  py="$(runtime_python_for_venv "$venv_dir")"
  if [[ -z "$py" ]]; then
    printf '%s\n' "$state (runtime interpreter missing)"
    return 0
  fi
  probe="$(PYTHONPATH= "$py" - <<'PY' 2>/dev/null || true
import importlib
try:
    package = importlib.import_module("lingtai")
    kernel = importlib.import_module("lingtai.kernel")
    print(f"lingtai {getattr(package, '__version__', '?')}; kernel module {getattr(kernel, '__file__', '?')}")
except Exception:
    pass
PY
  )"
  if [[ -n "$probe" ]]; then
    printf '%s; %s\n' "$state" "$probe"
  else
    printf '%s (lingtai/lingtai.kernel import unavailable)\n' "$state"
  fi
}

# runtime_static_summary is the pre-consent counterpart to
# runtime_current_summary: filesystem-metadata-only, it never executes the
# venv's interpreter or imports anything. It is used to form the printed
# repair plan so a refusal or EOF at the consent prompt leaves no
# execution/import/pyc side effect behind (see runtime_health_check /
# discover_current_tui_tag for the accurate post-consent probes).
runtime_static_summary() {
  local venv_dir="$1"
  if [[ ! -d "$venv_dir" ]]; then
    printf '%s\n' "missing"
    return 0
  fi
  if [[ -x "$venv_dir/bin/python" || -x "$venv_dir/bin/python3" ]]; then
    printf '%s\n' "present (unverified — health will be checked after consent)"
  else
    printf '%s\n' "present, no interpreter found (unverified — will be checked after consent)"
  fi
}

plan_bin_dir() {
  if [[ -n "$BIN_DIR_OVERRIDE" ]]; then
    printf '%s\n' "$BIN_DIR_OVERRIDE"
  elif [[ -n "$INSTALL_PREFIX" ]]; then
    bin_dir_for_prefix "$INSTALL_PREFIX"
  elif [[ -n "${DISCOVERED_BIN_DIR:-}" ]]; then
    printf '%s\n' "$DISCOVERED_BIN_DIR"
  elif [[ -w /usr/local/bin ]]; then
    printf '%s\n' /usr/local/bin
  else
    printf '%s\n' "$HOME/.local/bin"
  fi
}

# print_install_plan is intentionally called after read-only target resolution
# but before resolve_bin_dir/build/install. Existing installs get a diagnosis,
# exact target/pin, ownership boundary, and an explicit consent gate. A fresh
# install has no repair mutation and keeps the historical non-prompting flow.
#
# Everything printed here is either a filesystem/metadata fact or explicitly
# labeled as declared-but-unverified — no discovered binary is executed and
# no runtime module is imported to build this plan (see runtime_static_summary
# and the DISCOVERED_CURRENT_TUI_TAG contract in discover_existing_install /
# discover_explicit_target_install). The kernel pin is likewise reported as a
# declared tag, not yet a verified artifact: the manifest/artifact fetch that
# would verify it only happens after consent, inside ensure_runtime_venv.
print_install_plan() {
  local target_tui target_kernel_tag target_kernel_version target_source target_bin
  local current_tui current_metadata current_runtime
  PLANNED_RUNTIME_REPAIR_PATH=""
  [[ "$DISCOVERED_METADATA_PRESENT" == "1" || -n "$DISCOVERED_BIN_DIR" ]] || return 0

  target_bin="$(plan_bin_dir)"
  target_tui="${TARGET_TAG:-${VERSION:-${REF:-dev}}}"
  current_tui="${DISCOVERED_CURRENT_TUI_TAG:-not found (unverified — will be probed after consent)}"
  current_metadata="${DISCOVERED_METADATA_VERSION:-not found}"
  current_runtime="$(runtime_static_summary "$RUNTIME_VENV_DIR")"
  target_kernel_tag="$(kernel_tag_for_install || true)"
  target_source="$(kernel_source_for_install || true)"
  if [[ -n "${KERNEL_VERSION_INSTALLED:-}" ]]; then
    target_kernel_version="$KERNEL_VERSION_INSTALLED"
  elif [[ "$target_source" == "bundle" ]]; then
    target_kernel_version="${BUNDLE_MANIFEST_KERNEL_VERSION:-unknown} (declared by bundle manifest; artifact not yet verified)"
  elif [[ -n "$target_kernel_tag" ]]; then
    target_kernel_version="declared pin $target_kernel_tag (release manifest/artifact not yet fetched or verified)"
  else
    target_kernel_version="not pinned (explicit source/dev path)"
  fi

  PLAN_BEFORE_TUI="$current_tui"
  PLAN_BEFORE_RUNTIME="$current_runtime"
  say "Existing LingTai installation diagnosed; proposed one-shot repair plan:"
  printf '    Current TUI:     %s\n' "$current_tui"
  printf '    Metadata TUI:    %s (%s)\n' "$current_metadata" "${DISCOVERED_METADATA_INSTALL_KIND:-install kind unknown}"
  printf '    Current runtime: %s\n' "$current_runtime"
  printf '    Target TUI:      %s\n' "$target_tui"
  printf '    Target kernel:   %s (%s)\n' "${target_kernel_tag:-none}" "${target_kernel_version:-unknown}"
  printf '    Target binary:   %s\n' "$target_bin"
  printf '    Changes:         replace/repair the selected TUI binary, exact pinned runtime, and install metadata.\n'
  printf '    Preserved:        projects, presets, MCP/addon configs, secrets, recipes, channel state, and all other user-owned state.\n'
  if [[ "$SKIP_VENV" == "1" ]]; then
    printf '    Runtime action:   --skip-python explicitly opts out; runtime state is not claimed repaired.\n'
  else
    printf '    Runtime target:   %s (retained and repaired in place if healthy)\n' "$RUNTIME_VENV_DIR"
    PLANNED_RUNTIME_REPAIR_PATH="$(runtime_repair_path_preview || true)"
    if [[ -z "$PLANNED_RUNTIME_REPAIR_PATH" ]]; then
      echo "error: no safe, free stable runtime repair path is available under $HOME/.lingtai-tui/runtime." >&2
      echo "       No repair consent was requested and no installation state was changed." >&2
      return 1
    fi
    printf '    Runtime if broken: %s (exact path used only if the retained runtime cannot be repaired in place; never deleted)\n' "$PLANNED_RUNTIME_REPAIR_PATH"
  fi

  if [[ "$NON_INTERACTIVE" == "1" ]]; then
    note "--non-interactive supplies consent for this printed repair plan."
  else
    if [[ ! -t 0 ]]; then
      echo "error: existing installation repair requires interactive confirmation; use --non-interactive only after reviewing the plan." >&2
      return 1
    fi
    printf '    Proceed with this repair? [y/N] '
    local answer
    IFS= read -r answer || answer=""
    case "$(printf '%s' "$answer" | tr '[:upper:]' '[:lower:]')" in
      y|yes) ;;
      *) echo "Repair cancelled; no installation state was changed." >&2; return 1 ;;
    esac
  fi
  INSTALL_PLAN_APPROVED=1
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
  local positional=""
  POSITIONAL_MODE=0
  if [[ $# -gt 0 && "$1" != -* ]]; then
    positional="$1"
    POSITIONAL_MODE=1
    shift
  fi
  case "$positional" in
    ""|install) MODE="install" ;;
    update) MODE="update"; UPDATE_MODE=1 ;;
    *) echo "error: unknown mode: $positional (choose install or update)" >&2; usage >&2; exit 1 ;;
  esac

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --dev) DEV_MODE=1; shift ;;
      --kernel-source|--dev-kernel-source) DEV_KERNEL_SOURCE="${2:?error: $1 requires a path}"; shift 2 ;;
      --tui-source|--dev-tui-source) DEV_TUI_SOURCE="${2:?error: $1 requires a path}"; shift 2 ;;
      --ref) REF="${2:?error: --ref requires a value}"; shift 2 ;;
      --version) VERSION="${2:?error: --version requires a value}"; shift 2 ;;
      --tui-tag) UPDATE_TUI_TAG="${2:?error: --tui-tag requires a value}"; shift 2 ;;
      --runtime-python|--python) UPDATE_RUNTIME_ARG="${2:?error: $1 requires a path}"; shift 2 ;;
      --migration-root) UPDATE_MIGRATION_ROOT="${2:?error: --migration-root requires a URL}"; shift 2 ;;
      --hash-policy) UPDATE_HASH_POLICY="${2:?error: --hash-policy requires sha256}"; shift 2 ;;
      --prefix) INSTALL_PREFIX="${2:?error: --prefix requires a value}"; shift 2 ;;
      --bin-dir) BIN_DIR_OVERRIDE="${2:?error: --bin-dir requires a value}"; shift 2 ;;
      --from-source) FROM_SOURCE=1; shift ;;
      --skip-portal) SKIP_PORTAL=1; shift ;;
      --skip-python|--skip-venv) SKIP_VENV=1; shift ;;
      --source) SOURCE_ARG="${2:?error: --source requires a value}"; shift 2 ;;
      --update) UPDATE_MODE=1; MODE="update"; shift ;;
      --yes|--authorized) UPDATE_AUTHORIZED=1; shift ;;
      --refresh) UPDATE_REFRESH=1; shift ;;
      --non-interactive) NON_INTERACTIVE=1; shift ;;
      -h|--help)
        if [[ "$POSITIONAL_MODE" == "0" ]]; then usage; else show_help_for_mode "$MODE"; fi
        exit 0
        ;;
      *) echo "error: unknown flag: $1" >&2; show_help_for_mode "$MODE" >&2; exit 1 ;;
    esac
  done

  if [[ "$MODE" == "update" ]]; then
    if [[ -n "$VERSION" && -z "$UPDATE_TUI_TAG" ]]; then
      # Keep the old --update --version spelling as an explicit TUI-tag alias;
      # it never supplies or overrides the manifest-pinned kernel version.
      UPDATE_TUI_TAG="$VERSION"
    fi
    if [[ "$DEV_MODE" == "1" || -n "$REF" || "$FROM_SOURCE" == "1" || "$SKIP_VENV" == "1" || "$SKIP_PORTAL" == "1" ]]; then
      echo "error: update accepts runtime/migration/mirror/authorization options only; it never aliases install or builds source" >&2
      update_usage >&2
      exit 1
    fi
  elif [[ "$DEV_MODE" == "1" && -n "$REF" ]]; then
    echo "error: install --dev accepts source paths, not --ref; use install without --dev for an official source build" >&2
    exit 1
  elif [[ "$DEV_MODE" == "1" && "$SKIP_VENV" == "1" ]]; then
    echo "error: install --dev always provisions the editable kernel; --skip-python is not truthful in development mode" >&2
    exit 1
  elif [[ "$DEV_MODE" == "1" && ( "$FROM_SOURCE" == "1" || -n "$VERSION" || "$SKIP_PORTAL" == "1" ) ]]; then
    echo "error: install --dev is already a source build; it requires both TUI and Portal and does not accept release-only source/version flags" >&2
    exit 1
  fi

  case "$SOURCE_ARG" in
    auto|github|gitee) ;;
    *) echo "error: --source must be one of auto|github|gitee, got: $SOURCE_ARG" >&2; show_help_for_mode "$MODE" >&2; exit 1 ;;
  esac
  if [[ "$MODE" == "update" && "$UPDATE_HASH_POLICY" != "sha256" ]]; then
    echo "error: update supports only --hash-policy sha256" >&2
    exit 1
  fi
}

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

# write_install_metadata records the install so `lingtai-tui`'s source updater
# can re-run this script for a newer tag. install_method stays "source" for
# updater compatibility regardless of whether we downloaded a prebuilt asset or
# built from source; install_kind records which path was taken (additive field).
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
    if [[ ! ( "$DEV_MODE" == "1" && -n "${LINGTAI_DEV_RUNTIME_PYTHON:-}" && \
              "$RUNTIME_VENV_DIR" == "$LINGTAI_DEV_RUNTIME_PYTHON" ) ]] && \
       ! canonical_runtime_venv "$RUNTIME_VENV_DIR" "$HOME/.lingtai-tui/runtime" >/dev/null; then
      echo "error: refusing to persist a runtime pointer outside the canonical owned runtime root: $RUNTIME_VENV_DIR" >&2
      return 1
    fi
    runtime_json="$(printf ',\n  "runtime_venv": "%s"' "$(json_escape "${RUNTIME_VENV_DIR%/}")")"
  elif [[ "$SKIP_VENV" == "1" && -n "${DISCOVERED_RUNTIME_VENV:-}" && \
          "${RUNTIME_VENV_DIR:-}" == "$DISCOVERED_RUNTIME_VENV" && -d "$RUNTIME_VENV_DIR" ]] && \
       canonical_runtime_venv "$RUNTIME_VENV_DIR" "$HOME/.lingtai-tui/runtime" >/dev/null; then
    # --skip-python may preserve only the exact ownership-validated pointer read
    # from existing metadata, revalidated immediately before persistence. A
    # default/legacy or newly appeared directory is not silently adopted.
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
  elif [[ "$INSTALL_KIND" == "dev-source" ]]; then
    bundle_json="$(printf ',\n  "kernel_source": "editable",\n  "kernel_source_path": "%s",\n  "tui_source_path": "%s"' \
      "$(json_escape "$DEV_KERNEL_SOURCE_PATH")" "$(json_escape "$DEV_TUI_SOURCE_PATH")")"
  fi

  metadata_path="$global_dir/install.json"
  tmp_path="$metadata_path.tmp.$$"
  installed_at="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

  if [[ -L "$global_dir" ]]; then
    echo "error: install metadata directory is a symlink; refusing to write redirected state: $global_dir" >&2
    return 1
  fi
  mkdir -p "$global_dir"
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
  mv "$tmp_path" "$metadata_path"
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
# selected by either the existing bundle manifest or the exact TUI release pin.
# LingTai itself is NEVER requested from a package index by name (only
# third-party dependencies resolve via the configured index; see
# install_kernel_from_bundle). This is mirrored by the TUI's own EnsureVenv
# logic (uv venv --python 3.13 if uv exists, else python3 -m venv; verify
# import; stamp env marker; symlink lingtai-agent).
#
# On the default release-asset one-command path (BUNDLE_REQUIRED=1), a
# resolved bundle or exact release pin plus a successful kernel-artifact
# install are MANDATORY. --ref/source-ref builds have no exact release pin and
# fail loud unless --skip-python is explicit. A broken existing venv is never
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

# validated_runtime_repair_path is the final ownership gate for every repair
# selection. Repair slots are fixed children of the owned runtime root; symlinks
# (including dangling ones) are occupied untrusted state even when their target
# would remain inside that root.
validated_runtime_repair_path() {
  local candidate="$1" runtime_root="$HOME/.lingtai-tui/runtime"
  case "$candidate" in
    "$runtime_root/venv-repair"|"$runtime_root/venv-repair-"[1-9]) ;;
    *)
      echo "error: unsafe runtime repair path was selected: ${candidate:-<empty>}" >&2
      return 1
      ;;
  esac
  if [[ -L "$candidate" ]] || ! canonical_runtime_venv "$candidate" "$runtime_root" >/dev/null; then
    echo "error: runtime repair path is not a safe physical child of $runtime_root: $candidate" >&2
    return 1
  fi
  printf '%s\n' "$candidate"
}

# runtime_repair_path returns the exact path authorized by an existing-install
# plan. If that free slot becomes occupied after consent, fail loud instead of
# silently switching to a path the user never approved. Fresh-install flows have
# no repair plan; they may reuse a healthy, non-symlink repair venv or choose the
# first safe free slot. Existing paths are never removed or reset.
runtime_repair_path() {
  local runtime_root="$HOME/.lingtai-tui/runtime" candidate index state

  if [[ -n "$PLANNED_RUNTIME_REPAIR_PATH" ]]; then
    candidate="$PLANNED_RUNTIME_REPAIR_PATH"
    if [[ -e "$candidate" || -L "$candidate" ]]; then
      echo "error: planned runtime repair path became occupied after consent: $candidate" >&2
      echo "       Refusing to select a different unapproved path; inspect the new state and re-run." >&2
      return 1
    fi
    validated_runtime_repair_path "$candidate"
    return
  fi

  if [[ -L "$runtime_root" ]]; then
    echo "error: runtime root is a symlink; refusing to select a repair path through it: $runtime_root" >&2
    return 1
  fi
  mkdir -p "$runtime_root" || {
    echo "error: could not create the owned runtime root: $runtime_root" >&2
    return 1
  }
  for index in "" 1 2 3 4 5 6 7 8 9; do
    candidate="$runtime_root/venv-repair${index:+-$index}"
    if [[ ! -e "$candidate" && ! -L "$candidate" ]]; then
      validated_runtime_repair_path "$candidate"
      return
    fi
    [[ ! -L "$candidate" ]] || continue
    state="$(runtime_venv_state "$candidate")"
    if [[ "$state" == healthy ]]; then
      validated_runtime_repair_path "$candidate"
      return
    fi
  done
  echo "error: all stable runtime repair paths under $runtime_root are occupied or unsafe." >&2
  return 1
}

# runtime_repair_path_preview computes, without executing anything or mutating
# any state, the exact free repair slot that an existing-install plan will bind
# to. Any existing object or symlink is occupied: pre-consent code never runs a
# candidate interpreter to decide whether an older repair venv is reusable.
runtime_repair_path_preview() {
  local runtime_root="$HOME/.lingtai-tui/runtime" candidate index
  for index in "" 1 2 3 4 5 6 7 8 9; do
    candidate="$runtime_root/venv-repair${index:+-$index}"
    if [[ ! -e "$candidate" && ! -L "$candidate" ]]; then
      validated_runtime_repair_path "$candidate" >/dev/null || return 1
      printf '%s\n' "$candidate"
      return 0
    fi
  done
  return 1
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
  local bin_dir="$1"
  local venv_dir="${RUNTIME_VENV_DIR:-$HOME/.lingtai-tui/runtime/venv}"
  local uv py repair_attempt install_kernel_tag recreate_reason runtime_state
  local runtime_root="$HOME/.lingtai-tui/runtime" physical_venv_dir

  if [[ "$SKIP_VENV" == "1" ]]; then
    note "Skipping Python runtime venv (--skip-python)."
    return 0
  fi

  physical_venv_dir="$(canonical_runtime_venv "$venv_dir" "$runtime_root" || true)"
  if [[ -z "$physical_venv_dir" ]]; then
    echo "error: selected runtime venv path is outside the owned runtime root (possibly via a symlink): $venv_dir" >&2
    echo "       Refusing to create or repair state outside $runtime_root." >&2
    return 1
  fi
  # Only after the non-mutating lexical+physical ownership gate succeeds may a
  # fresh install create the owned root.
  mkdir -p "$runtime_root" || {
    echo "error: could not create the owned runtime root: $runtime_root" >&2
    return 1
  }

  install_kernel_tag="$(kernel_tag_for_install || true)"
  if [[ -z "$install_kernel_tag" ]]; then
    if [[ "$BUNDLE_REQUIRED" == "1" ]]; then
      echo "error: no pinned kernel release or exact TUI release pin could be resolved for this install." >&2
      echo "       Tried provider(s): $BUNDLE_PROVIDER (with same-tag fallback to the other provider)." >&2
      echo "       LingTai's Python runtime is installed only from a verified pinned release" >&2
      echo "       artifact, never from PyPI/an index by package name — so this is a hard stop," >&2
      echo "       not a silent fallback." >&2
      echo "       Options:" >&2
      echo "         - Retry after the exact TUI release's kernel pin is published." >&2
      echo "         - Pass --version <tag> for an exact release with a valid kernel pin." >&2
      echo "         - Pass --skip-python to install the TUI/portal binaries only, then set up the" >&2
      echo "           Python runtime yourself (e.g. from an editable lingtai-kernel checkout)." >&2
      return 1
    else
      echo "error: --ref/source-ref builds have no exact pinned kernel release to install from." >&2
      echo "       LingTai's Python runtime is installed only from a verified pinned release" >&2
      echo "       artifact, never from PyPI/an index by package name, so this build cannot" >&2
      echo "       provision the Python runtime automatically." >&2
      echo "       Pass --skip-python to install the TUI/portal binaries only, then set up the" >&2
      echo "       Python runtime yourself — for example an editable install against a local" >&2
      echo "       lingtai-kernel checkout (see RELEASING.md / CLAUDE.md \"Agent venv\")." >&2
      return 1
    fi
  fi

  say "Setting up Python runtime venv at $venv_dir ..."
  if ! ensure_python; then
    echo "error: Python 3.11+ with venv/pip support is required to repair the runtime." >&2
    return 1
  fi

  mkdir -p "$(dirname "$venv_dir")"
  repair_attempt=0
  runtime_state="$(runtime_venv_state "$venv_dir")"
  if [[ "$runtime_state" == broken ]]; then
    warn "existing runtime venv at $venv_dir is broken; retaining it and provisioning the planned stable repair path."
    venv_dir="$(runtime_repair_path)" || return 1
    repair_attempt=1
  fi
  RUNTIME_VENV_DIR="$venv_dir"

  while true; do
    uv="$(find_uv 2>/dev/null || true)"
    py="$(runtime_python_for_venv "$venv_dir")"

    recreate_reason=""
    if [[ -d "$venv_dir" && -z "$py" ]]; then
      recreate_reason="runtime venv Python is missing"
    elif [[ -n "$py" ]] && ! "$py" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 11) else 1)' 2>/dev/null; then
      recreate_reason="runtime venv Python is older than 3.11"
    fi

    if [[ -n "$recreate_reason" ]]; then
      if [[ "$repair_attempt" != "0" ]]; then
        echo "error: $recreate_reason after runtime repair attempt; refusing to claim a healthy runtime." >&2
        return 1
      fi
      warn "$recreate_reason; retaining it and provisioning a new runtime venv path."
      venv_dir="$(runtime_repair_path)" || return 1
      RUNTIME_VENV_DIR="$venv_dir"
      repair_attempt=1
      py=""
    fi

    if [[ -z "$py" ]]; then
      if [[ -n "$uv" ]]; then
        if ! "$uv" venv --python 3.13 "$venv_dir"; then
          if python_ok; then
            warn "uv venv failed; falling back to python3 -m venv"
            uv=""
          else
            echo "error: uv venv failed and no Python 3.11+ with venv/ensurepip is available." >&2
            echo "       Install uv or Python with venv/ensurepip support, then re-run the installer." >&2
            return 1
          fi
        fi
      fi
      if [[ ! -x "$venv_dir/bin/python" && ! -x "$venv_dir/bin/python3" && -z "$uv" ]]; then
        if python_ok; then
          python3 -m venv "$venv_dir" || { echo "error: failed to create runtime venv at $venv_dir." >&2; return 1; }
        else
          echo "error: cannot create runtime venv: uv is unavailable and no Python 3.11+ with venv/ensurepip is available." >&2
          echo "       Install uv or Python with venv/ensurepip support, then re-run the installer." >&2
          return 1
        fi
      fi
      if [[ -x "$venv_dir/bin/python" ]]; then
        py="$venv_dir/bin/python"
      elif [[ -x "$venv_dir/bin/python3" ]]; then
        py="$venv_dir/bin/python3"
      else
        echo "error: runtime venv Python not found at $venv_dir after creation." >&2
        return 1
      fi
      # Re-check Python version after creating/recreating the venv.
      continue
    fi

    if ! runtime_prefix_matches_venv "$py" "$venv_dir"; then
      if [[ "$repair_attempt" == "0" ]]; then
        warn "runtime venv interpreter prefix does not match $venv_dir; retaining it and provisioning a new runtime venv path."
        venv_dir="$(runtime_repair_path)" || return 1
        RUNTIME_VENV_DIR="$venv_dir"
        repair_attempt=1
        continue
      fi
      echo "error: runtime venv interpreter prefix still mismatches the selected repair path." >&2
      return 1
    fi

    if ! "$py" -m pip --version >/dev/null 2>&1 && [[ -z "$uv" ]]; then
      if [[ "$repair_attempt" == "0" ]]; then
        warn "runtime venv pip is missing; retaining it and provisioning a new runtime venv path."
        venv_dir="$(runtime_repair_path)" || return 1
        RUNTIME_VENV_DIR="$venv_dir"
        repair_attempt=1
        continue
      fi
      echo "error: runtime venv pip is missing after repair attempt." >&2
      return 1
    fi

    local install_ok=0
    # The pinned release-bundle kernel artifact is the ONLY LingTai install
    # source (guaranteed present at this point — see the BUNDLE_MANIFEST_JSON
    # guard above). Any failure here (incoherent manifest, no compatible
    # wheel/sdist, checksum mismatch, install command failure) is retried
    # once after a venv recreate (a legitimate transient-environment repair,
    # the same pattern every other step in this loop uses), then FAILS LOUD —
    # it never falls back to `pip install lingtai` from an index.
    if install_kernel_from_bundle "$py" "$uv"; then
      install_ok=1
    fi
    if [[ "$install_ok" != "1" ]]; then
      if [[ "$repair_attempt" == "0" ]]; then
        warn "failed to install the pinned kernel bundle artifact; retaining the venv and provisioning a new runtime venv path."
        venv_dir="$(runtime_repair_path)" || return 1
        RUNTIME_VENV_DIR="$venv_dir"
        repair_attempt=1
        continue
      fi
      echo "error: failed to install the pinned kernel artifact into the runtime venv after recreate." >&2
      echo "       source: $(kernel_source_for_install 2>/dev/null || echo "?") kernel: $(kernel_tag_for_install 2>/dev/null || echo "?") via $KERNEL_MANIFEST_PROVIDER" >&2
      echo "       LingTai's Python runtime is never installed from PyPI/an index by package name," >&2
      echo "       so this is a hard stop rather than a silent fallback. Re-run the installer, or" >&2
      echo "       pass --skip-python to install the TUI/portal binaries only." >&2
      return 1
    fi

    if ! runtime_health_check "$py" "$KERNEL_VERSION_INSTALLED"; then
      if [[ "$repair_attempt" == "0" ]]; then
        warn "runtime venv failed import/version/kernel health check; retaining it and provisioning a new runtime venv path."
        venv_dir="$(runtime_repair_path)" || return 1
        RUNTIME_VENV_DIR="$venv_dir"
        repair_attempt=1
        continue
      fi
      echo "error: runtime venv is still unhealthy after repair attempt." >&2
      return 1
    fi
    break
  done

  RUNTIME_VENV_DIR="$venv_dir"
  # Stamp the env marker (best-effort — older kernels may lack the subcommand).
  "$py" -m lingtai.venv_resolve env-marker stamp --venv "$venv_dir" >/dev/null 2>&1 || true

  # Symlink lingtai-agent into the chosen bin dir (best-effort).
  if [[ -x "$venv_dir/bin/lingtai-agent" ]]; then
    ln -sfn "$venv_dir/bin/lingtai-agent" "$bin_dir/lingtai-agent" 2>/dev/null \
      || warn "could not symlink lingtai-agent into $bin_dir"
  fi
  return 0
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
    hit="$(python3 - "$manifest_file" "$combo" <<'PY'
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
  local manifest_json="$1" manifest_file
  manifest_file="$(mktemp "${TMPDIR:-/tmp}/lingtai-kernel-manifest.XXXXXX")"
  printf '%s' "$manifest_json" > "$manifest_file"
  python3 - "$manifest_file" <<'PY'
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
    artifact_line="$(kernel_sdist_fallback "$kernel_manifest" || true)"
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

  index_url="${LINGTAI_PYPI_INDEX_URL:-https://pypi.org/simple}"
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

# --- explicit runtime update flow (schema lingtai.kernel.release/v1) ----------
#
# This branch is intentionally separate from the first-install flow below. It
# is the one executable procedure that an authorized human/config owner can
# invoke after a nudge: it updates one paired TUI/Portal + runtime installation.
# The exact target is discovered (or explicitly constrained), and both official release manifests are inspected when
# available, and every transport is constrained to the same manifest-selected
# wheel filename and digest. No source build, sdist, or package-index "latest"
# resolution is reachable from this branch.

UPDATE_RUNTIME_PYTHON=""
UPDATE_MANIFEST_FILE=""
UPDATE_WHEEL_PATH=""

UPDATE_CURRENT_KERNEL_VERSION=""
UPDATE_CURRENT_KERNEL_PATH=""
UPDATE_CURRENT_TUI_TAG=""
UPDATE_TARGET_TUI_TAG=""
UPDATE_TARGET_KERNEL_TAG=""
UPDATE_TARGET_KERNEL_VERSION=""
UPDATE_TARGET_BUNDLE_JSON=""
UPDATE_TARGET_BUNDLE_PROVIDER=""
UPDATE_TARGET_TUI_ARCHIVE=""
UPDATE_TARGET_TUI_SHA=""
UPDATE_TARGET_TUI_PROVIDER=""
UPDATE_TARGET_KERNEL_MANIFEST=""
UPDATE_TARGET_KERNEL_PROVIDER=""
UPDATE_TARGET_KERNEL_WHEEL=""
UPDATE_TARGET_KERNEL_SHA=""

runtime_probe() {
  local candidate="$1" output
  [[ -x "$candidate" ]] || return 1
  output="$($candidate - <<'PY' 2>/dev/null
import importlib, sys
try:
    module = importlib.import_module("lingtai")
except Exception:
    raise SystemExit(1)
version = getattr(module, "__version__", "")
path = getattr(module, "__file__", "") or ""
if not version or not path:
    raise SystemExit(1)
if sys.version_info < (3, 11):
    raise SystemExit(1)
print(f"{version}\t{path}\t{sys.prefix}")
PY
)" || return 1
  [[ "$output" == *$'\t'* ]] || return 1
  printf '%s\n' "$output"
}

resolve_update_runtime_python() {
  local explicit="${UPDATE_RUNTIME_ARG:-${LINGTAI_RUNTIME_PYTHON:-}}" candidate real probe
  local -a candidates=() valid=() seen=()
  local add_candidate
  add_candidate() {
    local item="$1" resolved
    [[ -n "$item" ]] || return 0
    if [[ "$item" != */* ]]; then item="$(command -v "$item" 2>/dev/null || true)"; fi
    [[ -x "$item" ]] || return 0
    resolved="$(cd "$(dirname "$item")" && pwd -P)/$(basename "$item")"
    local prior
    for prior in "${candidates[@]:-}"; do [[ "$prior" == "$resolved" ]] && return 0; done
    candidates+=("$resolved")
  }
  if [[ -n "$explicit" ]]; then
    add_candidate "$explicit"
    if [[ "${#candidates[@]}" != "1" ]] || ! probe="$(runtime_probe "${candidates[0]}" 2>/dev/null)"; then
      echo "error: explicit update runtime is not a valid LingTai Python interpreter: ${explicit}" >&2
      echo "       Retry with: LINGTAI_RUNTIME_PYTHON=/absolute/path/to/runtime/bin/python ./install.sh update" >&2
      return 1
    fi
  else
    if [[ -n "${VIRTUAL_ENV:-}" ]]; then
      add_candidate "$VIRTUAL_ENV/bin/python"
      add_candidate "$VIRTUAL_ENV/bin/python3"
    fi
    add_candidate "$HOME/.lingtai-tui/runtime/venv/bin/python"
    add_candidate "$HOME/.lingtai-tui/runtime/venv/bin/python3"
    add_candidate "$HOME/.lingtai/runtime/venv/bin/python"
    add_candidate "$HOME/.lingtai/runtime/venv/bin/python3"
    if [[ -n "${LINGTAI_RUNTIME_VENV:-}" ]]; then
      add_candidate "$LINGTAI_RUNTIME_VENV/bin/python"
      add_candidate "$LINGTAI_RUNTIME_VENV/bin/python3"
    fi
    # The current process interpreter is considered only when it really imports
    # LingTai; an arbitrary system Python is never guessed as the runtime.
    add_candidate "${LINGTAI_CURRENT_PROCESS_PYTHON:-${PYTHON_EXECUTABLE:-}}"
    for candidate in "${candidates[@]:-}"; do
      if probe="$(runtime_probe "$candidate" 2>/dev/null)"; then
        valid+=("$candidate::$probe")
      fi
    done
    local -a distinct=()
    for item in "${valid[@]:-}"; do
      candidate="${item%%::*}"
      probe="${item#*::}"
      real="${probe##*$'\t'}"
      local prior
      for prior in "${distinct[@]:-}"; do [[ "$prior" == "$real" ]] && continue 2; done
      distinct+=("$real")
    done
    if [[ "${#distinct[@]}" != "1" ]]; then
      if [[ "${#valid[@]}" == "0" ]]; then
        echo "error: no valid installed LingTai runtime interpreter was found." >&2
      else
        echo "error: more than one valid LingTai runtime interpreter was found; refusing to guess." >&2
      fi
      echo "       Retry with: LINGTAI_RUNTIME_PYTHON=/absolute/path/to/runtime/bin/python ./install.sh update" >&2
      return 1
    fi
    candidate="${valid[0]%%::*}"
    probe="${valid[0]#*::}"
  fi
  UPDATE_RUNTIME_PYTHON="$candidate"
  UPDATE_CURRENT_KERNEL_VERSION="${probe%%$'\t'*}"
  local probe_rest="${probe#*$'\t'}"
  UPDATE_CURRENT_KERNEL_PATH="${probe_rest%%$'\t'*}"
  note "Using LingTai runtime $UPDATE_RUNTIME_PYTHON (kernel $UPDATE_CURRENT_KERNEL_VERSION; import $UPDATE_CURRENT_KERNEL_PATH)."
}

update_github_manifest_url() {
  local tag="$1"
  printf '%s/%s/lingtai-kernel-release-manifest.json' "${UPDATE_GITHUB_DOWNLOAD_BASE%/}" "$tag"
}

update_gitee_manifest_url() {
  local tag="$1" saved_api="$GITEE_API_BASE" url
  GITEE_API_BASE="$UPDATE_GITEE_API_BASE"
  url="$(gitee_release_asset_url "$tag" "lingtai-kernel-release-manifest.json" || true)"
  GITEE_API_BASE="$saved_api"
  [[ -n "$url" ]] || return 1
  printf '%s' "$url"
}

# update_validate_manifest validates the source-owned kernel manifest schema
# using the selected runtime Python, then emits canonical JSON for provider
# disagreement comparison. Keeping this parser strict prevents a malformed or
# provider-specific shape from silently changing the selected artifact.
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

UPDATE_GITHUB_TUI_DOWNLOAD_BASE="${LINGTAI_UPDATE_GITHUB_TUI_DOWNLOAD_BASE:-https://github.com/Lingtai-AI/lingtai/releases/download}"
UPDATE_GITEE_TUI_DOWNLOAD_BASE="${LINGTAI_UPDATE_GITEE_TUI_DOWNLOAD_BASE:-}"
UPDATE_GITHUB_KERNEL_MIGRATION_BASE="${LINGTAI_UPDATE_GITHUB_KERNEL_MIGRATION_BASE:-https://raw.githubusercontent.com/Lingtai-AI/lingtai-kernel}"
UPDATE_GITEE_KERNEL_MIGRATION_BASE="${LINGTAI_UPDATE_GITEE_KERNEL_MIGRATION_BASE:-https://gitee.com/${GITEE_OWNER}/${GITEE_KERNEL_REPO}/raw}"

update_json_tag() {
  python3 - "$1" <<'PY'
import json, sys
try:
    data = json.loads(sys.argv[1])
    tag = data.get("tag_name", "")
    if isinstance(tag, str): print(tag)
except Exception:
    pass
PY
}

update_canonical_json_file() {
  python3 - "$1" <<'PY'
import json, sys

def no_duplicates(items):
    value = {}
    for key, item in items:
        if key in value:
            raise ValueError(f"duplicate JSON key: {key}")
        value[key] = item
    return value

with open(sys.argv[1], encoding="utf-8") as stream:
    data = json.load(stream, object_pairs_hook=no_duplicates)
print(json.dumps(data, sort_keys=True, separators=(",", ":")))
PY
}

update_release_json() {
  local provider="$1" product="$2" base body
  if [[ "$provider" == github ]]; then
    [[ "$product" == tui ]] && base="$UPDATE_GITHUB_TUI_API_BASE" || base="$UPDATE_GITHUB_KERNEL_API_BASE"
  else
    [[ "$product" == tui ]] && base="$UPDATE_GITEE_TUI_API_BASE" || base="$UPDATE_GITEE_KERNEL_API_BASE"
  fi
  body="$(curl -fsSL --max-time 30 "$base/releases/latest" 2>/dev/null || true)"
  [[ -n "$body" ]] || return 1
  printf '%s' "$body"
}

update_tui_bundle_url() {
  local provider="$1" tag="$2" url saved
  if [[ "$provider" == github ]]; then
    printf '%s/%s/lingtai-bundle-manifest.json' "${UPDATE_GITHUB_TUI_DOWNLOAD_BASE%/}" "$tag"
  else
    saved="$GITEE_API_BASE"; GITEE_API_BASE="$UPDATE_GITEE_TUI_API_BASE"
    url="$(gitee_release_asset_url "$tag" "lingtai-bundle-manifest.json" || true)"
    GITEE_API_BASE="$saved"
    if [[ -n "$url" ]]; then printf '%s' "$url"; else return 1; fi
  fi
}

fetch_update_target_bundle() {
  local gh_meta="" gt_meta="" gh_tag="" gt_tag="" target gh_url gt_url gh_raw gt_raw gh_fields gt_fields gh_canon gt_canon
  local target_dir="$BUILD_DIR/update-target"
  mkdir -p "$target_dir"
  if [[ -n "$UPDATE_TUI_TAG" ]]; then
    target="$UPDATE_TUI_TAG"
  else
    gh_meta="$(update_release_json github tui || true)"
    gt_meta="$(update_release_json gitee tui || true)"
    gh_tag="$(update_json_tag "$gh_meta")"; gt_tag="$(update_json_tag "$gt_meta")"
    [[ -z "$gh_meta" || -n "$gh_tag" ]] || { echo "error: GitHub latest TUI release metadata is malformed." >&2; return 1; }
    [[ -z "$gt_meta" || -n "$gt_tag" ]] || { echo "error: Gitee latest TUI release metadata is malformed." >&2; return 1; }
    if [[ -n "$gh_tag" && -n "$gt_tag" && "$gh_tag" != "$gt_tag" ]]; then
      echo "error: GitHub latest TUI tag $gh_tag disagrees with Gitee latest TUI tag $gt_tag." >&2; return 1
    fi
    target="${gh_tag:-$gt_tag}"
    [[ -n "$target" ]] || { echo "error: official TUI release metadata is unavailable on GitHub and Gitee." >&2; return 1; }
  fi
  [[ -n "$(release_tag_name "$target")" ]] || { echo "error: official TUI target is not an exact release tag: $target" >&2; return 1; }
  gh_url="$(update_tui_bundle_url github "$target")"; gt_url="$(update_tui_bundle_url gitee "$target" || true)"
  gh_raw="$target_dir/github-bundle.json"; gt_raw="$target_dir/gitee-bundle.json"
  gh_canon="$target_dir/github-bundle-canonical.json"; gt_canon="$target_dir/gitee-bundle-canonical.json"
  if curl -fsSL --max-time 30 -o "$gh_raw" "$gh_url" 2>/dev/null && [[ -s "$gh_raw" ]]; then
    if ! load_bundle_manifest "$(cat "$gh_raw")" "$target"; then
      echo "error: GitHub TUI bundle manifest for $target is invalid." >&2; return 1
    fi
    gh_fields="$BUNDLE_TUI_ARCHIVE_SHA|$BUNDLE_MANIFEST_KERNEL_TAG|$BUNDLE_MANIFEST_KERNEL_VERSION|$BUNDLE_MANIFEST_KERNEL_FILENAME|$BUNDLE_MANIFEST_BUNDLE_ID"
    update_canonical_json_file "$gh_raw" >"$gh_canon" || { echo "error: GitHub TUI bundle JSON is not canonicalizable." >&2; return 1; }
  else
    gh_fields=""
    note "GitHub TUI release bundle unavailable for $target; using the mirror."
  fi
  if [[ -n "$gt_url" ]] && curl -fsSL --max-time 30 -o "$gt_raw" "$gt_url" 2>/dev/null && [[ -s "$gt_raw" ]]; then
    if ! load_bundle_manifest "$(cat "$gt_raw")" "$target"; then
      echo "error: Gitee TUI bundle manifest for $target is invalid." >&2; return 1
    fi
    gt_fields="$BUNDLE_TUI_ARCHIVE_SHA|$BUNDLE_MANIFEST_KERNEL_TAG|$BUNDLE_MANIFEST_KERNEL_VERSION|$BUNDLE_MANIFEST_KERNEL_FILENAME|$BUNDLE_MANIFEST_BUNDLE_ID"
    update_canonical_json_file "$gt_raw" >"$gt_canon" || { echo "error: Gitee TUI bundle JSON is not canonicalizable." >&2; return 1; }
  else
    gt_fields=""
    note "Gitee TUI release bundle unavailable for $target; using GitHub."
  fi
  if [[ -n "$gh_fields" && -n "$gt_fields" ]] && ! cmp -s "$gh_canon" "$gt_canon"; then
    echo "error: GitHub and Gitee TUI release bundle manifests disagree for $target; refusing update." >&2
    return 1
  fi
  if [[ -s "$gh_raw" ]]; then UPDATE_TARGET_BUNDLE_JSON="$(cat "$gh_raw")"; UPDATE_TARGET_BUNDLE_PROVIDER=github
  elif [[ -s "$gt_raw" ]]; then UPDATE_TARGET_BUNDLE_JSON="$(cat "$gt_raw")"; UPDATE_TARGET_BUNDLE_PROVIDER=gitee
  else echo "error: no valid official TUI release bundle is available for $target." >&2; return 1; fi
  load_bundle_manifest "$UPDATE_TARGET_BUNDLE_JSON" "$target"
  UPDATE_TARGET_TUI_TAG="$target"
  UPDATE_TARGET_KERNEL_TAG="$BUNDLE_MANIFEST_KERNEL_TAG"
  UPDATE_TARGET_KERNEL_VERSION="$BUNDLE_MANIFEST_KERNEL_VERSION"
  UPDATE_TARGET_TUI_SHA="$BUNDLE_TUI_ARCHIVE_SHA"
  note "Official target: TUI $UPDATE_TARGET_TUI_TAG with pinned kernel $UPDATE_TARGET_KERNEL_TAG ($UPDATE_TARGET_KERNEL_VERSION)."
}

migration_semver() {
  local tag="${1#v}"; [[ "$tag" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || return 1
  printf '%s\n' "$tag"
}

migration_tags_for() {
  local provider="$1" product="$2" base body
  if [[ "$provider" == github ]]; then [[ "$product" == tui ]] && base="$UPDATE_GITHUB_TUI_API_BASE" || base="$UPDATE_GITHUB_KERNEL_API_BASE"
  else [[ "$product" == tui ]] && base="$UPDATE_GITEE_TUI_API_BASE" || base="$UPDATE_GITEE_KERNEL_API_BASE"; fi
  body="$(curl -fsSL --max-time 30 "$base/releases?per_page=100" 2>/dev/null || true)"
  [[ -n "$body" ]] || body="$(curl -fsSL --max-time 30 "$base/tags?per_page=100" 2>/dev/null || true)"
  [[ -n "$body" ]] || return 1
  python3 - "$body" <<'PY'
import json, sys
try:
    value=json.loads(sys.argv[1])
    if not isinstance(value,list): raise ValueError()
    for item in value:
        if isinstance(item,dict):
            tag=item.get("tag_name",item.get("name",""))
            if isinstance(tag,str) and tag.startswith("v"): print(tag)
except Exception: raise SystemExit(1)
PY
}

migration_interval_tags() {
  local current="$1" target="$2" tags="$3"
  python3 - "$current" "$target" "$tags" <<'PY'
import re, sys
cur=sys.argv[1]; tgt=sys.argv[2]
def key(t): return tuple(int(x) for x in t.lstrip("v").split("."))
lo=key(cur); hi=key(tgt)
items={t for t in sys.argv[3].splitlines() if re.fullmatch(r"v[0-9]+\.[0-9]+\.[0-9]+",t)}
for tag in sorted(items,key=key):
    if lo < key(tag) <= hi: print(tag)
PY
}

migration_doc_url() {
  local provider="$1" product="$2" tag="$3" root
  if [[ -n "$UPDATE_MIGRATION_ROOT" ]]; then printf '%s/%s/%s/migration/migration.md' "${UPDATE_MIGRATION_ROOT%/}" "$product" "$tag"; return; fi
  if [[ "$product" == tui ]]; then [[ "$provider" == github ]] && root="$UPDATE_GITHUB_MIGRATION_BASE" || root="$UPDATE_GITEE_MIGRATION_BASE"
  else [[ "$provider" == github ]] && root="$UPDATE_GITHUB_KERNEL_MIGRATION_BASE" || root="$UPDATE_GITEE_KERNEL_MIGRATION_BASE"; fi
  printf '%s/%s/migration/migration.md' "${root%/}" "$tag"
}

collect_migrations_for() {
  local product="$1" current="$2" target="$3" gh_tags gt_tags merged interval tag gh_doc gt_doc gh_file gt_file
  [[ -n "$current" && -n "$target" ]] || { echo "error: cannot identify current $product and target release tags for migration routing." >&2; return 1; }
  gh_tags="$(migration_tags_for github "$product" || true)"; gt_tags="$(migration_tags_for gitee "$product" || true)"
  if [[ -z "$gh_tags" && -z "$gt_tags" ]]; then
    echo "error: cannot enumerate official $product release tags; refusing to guess migration history." >&2; return 1
  fi
  if [[ -n "$gh_tags" && -n "$gt_tags" ]] && [[ "$(printf '%s\n' "$gh_tags" | sort -u)" != "$(printf '%s\n' "$gt_tags" | sort -u)" ]]; then
    echo "error: GitHub and Gitee $product release-tag histories disagree; refusing migration routing." >&2; return 1
  fi
  merged="$gh_tags${gh_tags:+$'\n'}$gt_tags"
  if ! python3 - "$current" "$target" <<'PY'
import re, sys
values = sys.argv[1:]
if not all(re.fullmatch(r"v[0-9]+\.[0-9]+\.[0-9]+", value) for value in values):
    raise SystemExit(1)
def key(value): return tuple(int(part) for part in value[1:].split("."))
raise SystemExit(0 if key(values[0]) <= key(values[1]) else 1)
PY
  then
    echo "error: $product target $target precedes or is not comparable with current $current; refusing update." >&2
    return 1
  fi
  if ! printf '%s\n' "$merged" | grep -qxF "$target"; then
    echo "error: required $product target release tag $target is missing from the enumerated history." >&2; return 1
  fi
  if ! printf '%s\n' "$merged" | grep -qxF "$current"; then
    echo "error: required $product current release tag $current is missing from the enumerated history." >&2; return 1
  fi
  interval="$(migration_interval_tags "$current" "$target" "$merged")"
  [[ -n "$interval" ]] || return 0
  printf 'Migration guidance for %s (%s -> %s):\n' "$product" "$current" "$target"
  while IFS= read -r tag; do
    [[ -n "$tag" ]] || continue
    gh_file="$BUILD_DIR/update-target/migration-${product}-${tag}-github.md"
    gt_file="$BUILD_DIR/update-target/migration-${product}-${tag}-gitee.md"
    gh_doc="$(migration_doc_url github "$product" "$tag")"; gt_doc="$(migration_doc_url gitee "$product" "$tag")"
    if curl -fsSL --max-time 30 -o "$gh_file" "$gh_doc" 2>/dev/null && [[ -s "$gh_file" ]]; then :; else : >"$gh_file"; fi
    if curl -fsSL --max-time 30 -o "$gt_file" "$gt_doc" 2>/dev/null && [[ -s "$gt_file" ]]; then :; else : >"$gt_file"; fi
    if [[ -s "$gh_file" && -s "$gt_file" ]] && ! cmp -s "$gh_file" "$gt_file"; then
      echo "error: GitHub and Gitee $product migration content differs for exact tag $tag." >&2; return 1
    fi
    if [[ ! -s "$gh_file" && ! -s "$gt_file" ]]; then
      echo "error: required $product migration/migration.md is missing for exact tag $tag." >&2; return 1
    fi
    if [[ -s "$gh_file" ]]; then cat "$gh_file"; else cat "$gt_file"; fi
    printf '\n'
  done <<<"$interval"
}

# Fetch both manifests independently. A missing provider is allowed for
# transport fallback, but two valid provider manifests that differ are never
# merged or chosen between: the update stops before downloading an artifact.
fetch_update_manifests() {
  local update_dir="$BUILD_DIR/update" gh_raw gt_raw gh_canon gt_canon gh_url gt_url
  gh_raw="$update_dir/github-manifest.json"
  gt_raw="$update_dir/gitee-manifest.json"
  gh_canon="$update_dir/github-canonical.json"
  gt_canon="$update_dir/gitee-canonical.json"
  mkdir -p "$update_dir"
  UPDATE_MANIFEST_FILE=""

  gh_url="$(update_github_manifest_url "$VERSION")"
  if curl -fsSL --max-time 30 -o "$gh_raw" "$gh_url" 2>/dev/null && [[ -s "$gh_raw" ]]; then
    if ! update_validate_manifest "$UPDATE_RUNTIME_PYTHON" "$gh_raw" "$VERSION" >"$gh_canon"; then
      echo "error: GitHub kernel release manifest for $VERSION is invalid; refusing update." >&2
      return 1
    fi
  else
    note "GitHub kernel manifest unavailable for $VERSION; trying the mirror."
  fi

  gt_url="$(update_gitee_manifest_url "$VERSION" || true)"
  if [[ -n "$gt_url" ]] && curl -fsSL --max-time 30 -o "$gt_raw" "$gt_url" 2>/dev/null && [[ -s "$gt_raw" ]]; then
    if ! update_validate_manifest "$UPDATE_RUNTIME_PYTHON" "$gt_raw" "$VERSION" >"$gt_canon"; then
      echo "error: Gitee kernel release manifest for $VERSION is invalid; refusing update." >&2
      return 1
    fi
  else
    note "Gitee kernel manifest unavailable for $VERSION; PyPI may be used only for the exact selected wheel."
  fi

  if [[ -s "$gh_canon" && -s "$gt_canon" ]] && ! cmp -s "$gh_canon" "$gt_canon"; then
    echo "error: GitHub and Gitee kernel release manifests disagree for $VERSION; refusing update." >&2
    return 1
  fi
  if [[ -s "$gh_canon" ]]; then
    UPDATE_MANIFEST_FILE="$gh_raw"
  elif [[ -s "$gt_canon" ]]; then
    UPDATE_MANIFEST_FILE="$gt_raw"
  else
    echo "error: no authoritative GitHub/Gitee kernel release manifest is available for $VERSION; refusing update." >&2
    return 1
  fi
}

select_update_wheel() {
  local manifest_file="$1" tags_file="$2"
  "$UPDATE_RUNTIME_PYTHON" - "$manifest_file" "$tags_file" <<'PY'
import json
import sys

manifest_path, tags_path = sys.argv[1:]
with open(manifest_path, encoding="utf-8") as stream:
    data = json.load(stream)
with open(tags_path, encoding="utf-8") as stream:
    tags = [line.strip() for line in stream if line.strip()]
artifacts = [artifact for artifact in data["artifacts"] if artifact["kind"] == "wheel"]
for tag in tags:
    hits = [artifact for artifact in artifacts if f"{artifact['python_tag']}-{artifact['abi_tag']}-{artifact['platform_tag']}" == tag]
    if len(hits) == 1:
        print(f"{hits[0]['filename']} {hits[0]['sha256']}")
        raise SystemExit(0)
raise SystemExit(1)
PY
}

update_github_artifact_url() {
  local tag="$1" filename="$2"
  printf '%s/%s/%s' "${UPDATE_GITHUB_DOWNLOAD_BASE%/}" "$tag" "$filename"
}

update_gitee_artifact_url() {
  local tag="$1" filename="$2" saved_api="$GITEE_API_BASE" url
  GITEE_API_BASE="$UPDATE_GITEE_API_BASE"
  url="$(gitee_release_asset_url "$tag" "$filename" || true)"
  GITEE_API_BASE="$saved_api"
  [[ -n "$url" ]] || return 1
  printf '%s' "$url"
}

# PyPI receives the exact version endpoint only after a wheel was selected by
# the official manifest. It is never queried for /latest, and its JSON entry
# must repeat both the selected filename and SHA256 before it can be used.
update_pypi_artifact_url() {
  local version="${VERSION#v}" filename="$1" expected_sha="$2" update_dir="$BUILD_DIR/update" json_file json_url
  json_file="$update_dir/pypi-${version}.json"
  json_url="${UPDATE_PYPI_JSON_BASE%/}/lingtai/$version/json"
  if ! curl -fsSL --max-time 30 -o "$json_file" "$json_url" 2>/dev/null || [[ ! -s "$json_file" ]]; then
    return 1
  fi
  "$UPDATE_RUNTIME_PYTHON" - "$json_file" "$version" "$filename" "$expected_sha" <<'PY'
import json
import sys

path, expected_version, expected_filename, expected_sha = sys.argv[1:]
try:
    with open(path, encoding="utf-8") as stream:
        data = json.load(stream)
except (OSError, json.JSONDecodeError):
    raise SystemExit(1)
if not isinstance(data, dict) or data.get("info", {}).get("version") != expected_version:
    raise SystemExit(1)
hits = []
for entry in data.get("urls", []):
    if not isinstance(entry, dict) or entry.get("filename") != expected_filename:
        continue
    if entry.get("digests", {}).get("sha256") != expected_sha or not entry.get("url"):
        continue
    hits.append(entry["url"])
if len(hits) != 1:
    raise SystemExit(1)
print(hits[0])
PY
}

# Keep one file per transport so a bad response is retained for diagnostics
# and cannot be mistaken for a verified artifact on the next fallback.
download_update_wheel() {
  local filename="$1" expected_sha="$2" update_dir="$BUILD_DIR/update" provider url candidate
  mkdir -p "$update_dir"
  for provider in github gitee pypi; do
    url=""
    case "$provider" in
      github) url="$(update_github_artifact_url "$VERSION" "$filename" || true)" ;;
      gitee)  url="$(update_gitee_artifact_url "$VERSION" "$filename" || true)" ;;
      pypi)   url="$(update_pypi_artifact_url "$filename" "$expected_sha" || true)" ;;
    esac
    [[ -n "$url" ]] || continue
    candidate="$update_dir/${provider}-${filename}"
    say "Downloading $filename from $provider ..."
    if curl -fsSL --max-time 300 -o "$candidate" "$url" 2>/dev/null && verify_sha256 "$candidate" "$expected_sha"; then
      UPDATE_WHEEL_PATH="$candidate"
      note "Verified SHA256 for $filename from $provider."
      return 0
    fi
    warn "$provider did not provide bytes matching the manifest SHA256 for $filename; trying the next transport."
  done
  echo "error: no GitHub, Gitee, or exact-version PyPI transport supplied the manifest-selected wheel $filename" >&2
  return 1
}

current_tui_tag() {
  local metadata="${LINGTAI_INSTALL_METADATA:-$HOME/.lingtai-tui/install.json}" binary output tag
  if [[ -n "${LINGTAI_CURRENT_TUI_TAG:-}" ]]; then release_tag_name "$LINGTAI_CURRENT_TUI_TAG"; return; fi
  if [[ -n "${DISCOVERED_CURRENT_TUI_TAG:-}" ]]; then printf '%s\n' "$DISCOVERED_CURRENT_TUI_TAG"; return; fi
  if [[ -r "$metadata" ]]; then
    tag="$(python3 - "$metadata" <<'PY' 2>/dev/null
import json,sys
try:
 d=json.load(open(sys.argv[1])); print(d.get("stamped_version",d.get("resolved_ref","")))
except Exception: pass
PY
)"
    if [[ -n "$(release_tag_name "$tag")" ]]; then printf '%s\n' "$tag"; return; fi
  fi
  local path_binary="$(command -v lingtai-tui 2>/dev/null || true)"
  for binary in "${LINGTAI_TUI_BINARY:-}" "$path_binary" "$HOME/.local/bin/lingtai-tui" "/usr/local/bin/lingtai-tui"; do
    [[ -x "$binary" ]] || continue
    output="$($binary version 2>/dev/null || true)"
    tag="$(printf '%s' "$output" | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' | head -1)"
    [[ -n "$tag" ]] && { printf '%s\n' "$tag"; return; }
  done
  return 1
}

update_github_tui_asset_url() {
  printf '%s/%s/%s' "${UPDATE_GITHUB_TUI_DOWNLOAD_BASE%/}" "$1" "$2"
}
update_gitee_tui_asset_url() {
  local saved="$GITEE_API_BASE" url
  GITEE_API_BASE="$UPDATE_GITEE_TUI_API_BASE"
  url="$(gitee_release_asset_url "$1" "$2" || true)"
  GITEE_API_BASE="$saved"
  [[ -n "$url" ]] || return 1
  printf '%s' "$url"
}

download_update_tui_archive() {
  local target="$UPDATE_TARGET_TUI_TAG" name url side_url provider dest side expected="$UPDATE_TARGET_TUI_SHA"
  local dir="$BUILD_DIR/update-target"
  name="$(asset_name "$target" "$(detect_os)" "$(detect_arch)")"
  for provider in github gitee; do
    if [[ "$provider" == github ]]; then
      url="$(update_github_tui_asset_url "$target" "$name")"; side_url="${url}.sha256"
    else
      url="$(update_gitee_tui_asset_url "$target" "$name" || true)"
      side_url="$(update_gitee_tui_asset_url "$target" "${name}.sha256" || true)"
    fi
    [[ -n "$url" ]] || continue
    dest="$dir/${provider}-${name}"
    if ! curl -fsSL --max-time 300 -o "$dest" "$url" 2>/dev/null; then continue; fi
    side="$(curl -fsSL --max-time 30 "$side_url" 2>/dev/null | awk '{print $1}' || true)"
    [[ "$side" == "$expected" ]] || { warn "$provider TUI archive checksum sidecar disagrees with target bundle"; continue; }
    if ! verify_sha256 "$dest" "$expected"; then warn "$provider TUI archive bytes disagree with target bundle"; continue; fi
    UPDATE_TARGET_TUI_ARCHIVE="$dest"; UPDATE_TARGET_TUI_PROVIDER="$provider"; return 0
  done
  echo "error: no GitHub or Gitee TUI archive matched the official target manifest SHA256." >&2
  return 1
}

install_update_tui_archive() {
  local extract="$BUILD_DIR/update-target/tui-extract" tui portal
  mkdir -p "$extract"
  if ! tar -tzf "$UPDATE_TARGET_TUI_ARCHIVE" | python3 -c 'import pathlib,sys
for raw in sys.stdin:
    path=pathlib.PurePosixPath(raw.rstrip("\n"))
    if path.is_absolute() or ".." in path.parts:
        raise SystemExit(1)'; then
    echo "error: official TUI archive contains an unsafe path; refusing extraction." >&2; return 1
  fi
  tar -xzf "$UPDATE_TARGET_TUI_ARCHIVE" -C "$extract" || { echo "error: official TUI archive could not be extracted." >&2; return 1; }
  tui="$(find "$extract" -type f -name lingtai-tui | head -1)"
  [[ -n "$tui" ]] || { echo "error: official TUI archive omitted lingtai-tui." >&2; return 1; }
  resolve_bin_dir
  install_binary_atomically "$tui" "$BIN_DIR/lingtai-tui"
  PORTAL_PATH=""
  if [[ "$SKIP_PORTAL" != 1 ]]; then
    portal="$(find "$extract" -type f -name lingtai-portal | head -1)"
    if [[ -n "$portal" ]]; then install_binary_atomically "$portal" "$BIN_DIR/lingtai-portal"; PORTAL_PATH="$BIN_DIR/lingtai-portal"; fi
  fi
  ensure_lingtai_alias "$BIN_DIR"
  verify_tui_binary_version "$BIN_DIR/lingtai-tui" "$UPDATE_TARGET_TUI_TAG"
}

run_update_mode() {
  local tags_file="$BUILD_DIR/update/runtime-tags" artifact_line filename expected_sha current_tui
  resolve_update_runtime_python || return 1
  command -v curl &>/dev/null || { echo "error: curl is required for authorized runtime update" >&2; return 1; }
  if [[ "$UPDATE_AUTHORIZED" != "1" && "$NON_INTERACTIVE" == "1" ]]; then
    echo "error: update is an authorized human/config-owner operation; retry with --yes after authorization." >&2
    return 1
  fi
  current_tui="$(current_tui_tag || true)"
  [[ -n "$current_tui" ]] || { echo "error: cannot identify the installed TUI version; set LINGTAI_CURRENT_TUI_TAG only for a verified installed release." >&2; return 1; }
  UPDATE_CURRENT_TUI_TAG="$current_tui"
  fetch_update_target_bundle || return 1
  # VERSION is temporarily the manifest-selected kernel tag for the existing
  # strict kernel-manifest and GitHub -> Gitee -> PyPI exact-wheel machinery.
  VERSION="$UPDATE_TARGET_KERNEL_TAG"
  collect_migrations_for tui "$UPDATE_CURRENT_TUI_TAG" "$UPDATE_TARGET_TUI_TAG" || return 1
  collect_migrations_for kernel "v${UPDATE_CURRENT_KERNEL_VERSION#v}" "$UPDATE_TARGET_KERNEL_TAG" || return 1
  say "Migration guidance collected; no installation mutation occurred before this point."
  fetch_update_manifests || return 1
  UPDATE_TARGET_KERNEL_MANIFEST="$UPDATE_MANIFEST_FILE"
  if ! python_platform_tags "$UPDATE_RUNTIME_PYTHON" >"$tags_file" || [[ ! -s "$tags_file" ]]; then
    echo "error: could not determine compatible wheel tags from runtime $UPDATE_RUNTIME_PYTHON" >&2; return 1
  fi
  artifact_line="$(select_update_wheel "$UPDATE_TARGET_KERNEL_MANIFEST" "$tags_file" || true)"
  if [[ -z "$artifact_line" ]]; then
    echo "error: unsupported runtime: no matching prebuilt wheel is listed for pinned kernel $UPDATE_TARGET_KERNEL_TAG." >&2
    echo "       Update refuses sdist builds and never installs an unlisted wheel." >&2; return 1
  fi
  filename="${artifact_line%% *}"; expected_sha="${artifact_line##* }"
  UPDATE_TARGET_KERNEL_WHEEL="$filename"; UPDATE_TARGET_KERNEL_SHA="$expected_sha"
  # All bytes are prepared and verified before touching the official install.
  download_update_tui_archive || return 1
  download_update_wheel "$filename" "$expected_sha" || return 1
  if ! "$UPDATE_RUNTIME_PYTHON" -m pip --version >/dev/null 2>&1; then
    echo "error: runtime Python has no usable pip: $UPDATE_RUNTIME_PYTHON" >&2; return 1
  fi
  install_update_tui_archive || return 1
  say "Installing the verified $filename into $UPDATE_RUNTIME_PYTHON ..."
  "$UPDATE_RUNTIME_PYTHON" -m pip install --disable-pip-version-check --no-deps --force-reinstall "$UPDATE_WHEEL_PATH" || return 1
  local post
  post="$(runtime_probe "$UPDATE_RUNTIME_PYTHON" 2>/dev/null || true)"
  if [[ "${post%%$'\t'*}" != "$UPDATE_TARGET_KERNEL_VERSION" ]]; then
    echo "error: post-update LingTai import/version check failed (expected $UPDATE_TARGET_KERNEL_VERSION; got ${post%%$'\t'*})." >&2; return 1
  fi
  say "Disk environment updated: TUI $UPDATE_TARGET_TUI_TAG and kernel $UPDATE_TARGET_KERNEL_VERSION are installed."
  say "Agent must now call system(action='refresh'); this installer does not grant or perform Agent refresh."
  [[ "$UPDATE_REFRESH" == "1" ]] && say "Refresh handoff acknowledged for Agent: call system(action='refresh')."
}

# --- development install -----------------------------------------------------

validate_dev_checkout() {
  local path="$1" label="$2" expected="$3" explicit="$4" remote dirty
  [[ -d "$path/.git" || -f "$path/.git" ]] || { echo "error: $label source is not a Git checkout: $path" >&2; return 1; }
  [[ -d "$path/tui" || "$label" == kernel ]] || { echo "error: TUI source checkout lacks tui/: $path" >&2; return 1; }
  [[ "$label" != kernel || -f "$path/pyproject.toml" || -f "$path/setup.py" || -f "$path/README.md" ]] || { echo "error: kernel source checkout is incompatible: $path" >&2; return 1; }
  remote="$(git -C "$path" remote get-url origin 2>/dev/null || true)"
  if [[ "$explicit" != 1 && -n "$expected" && "$remote" != *"$expected"* ]]; then
    echo "error: persistent default $label checkout has incompatible origin ($remote)." >&2
    echo "       Provide an explicit --${label}-source path or repair the checkout; it will not be replaced." >&2
    return 1
  fi
  dirty="$(git -C "$path" status --porcelain 2>/dev/null || true)"
  if [[ "$explicit" != 1 && -n "$dirty" ]]; then
    echo "error: persistent default $label checkout is not clean; refusing to alter or replace it." >&2
    echo "       Commit/stash it, or pass an explicit --${label}-source path." >&2
    return 1
  fi
}

ensure_dev_checkout() {
  local path="$1" label="$2" repo="$3" explicit="$4"
  if [[ -e "$path" ]]; then
    validate_dev_checkout "$path" "$label" "$repo" "$explicit" || return 1
    printf '%s\n' "$path"; return 0
  fi
  [[ "$explicit" == 1 ]] && { echo "error: explicit $label source path does not exist: $path" >&2; return 1; }
  mkdir -p "$(dirname "$path")"
  say "Cloning development $label source into the new path $path ..." >&2
  git clone "$repo" "$path" || { echo "error: could not clone development $label source to $path." >&2; return 1; }
  validate_dev_checkout "$path" "$label" "$repo" 0
  printf '%s\n' "$path"
}

ensure_dev_runtime() {
  local kernel="$1" venv="${LINGTAI_DEV_RUNTIME_PYTHON:-$HOME/.lingtai-tui/runtime/venv}" py runtime_state
  if [[ -z "${LINGTAI_DEV_RUNTIME_PYTHON:-}" ]] && \
     ! canonical_runtime_venv "$venv" "$HOME/.lingtai-tui/runtime" >/dev/null; then
    echo "error: default development runtime is outside the canonical owned runtime root: $venv" >&2
    return 1
  fi
  runtime_state="$(runtime_venv_state "$venv")"
  if [[ "$runtime_state" == broken ]]; then
    warn "existing development runtime at $venv is broken; retaining it and using the planned stable repair path."
    venv="$(runtime_repair_path)" || return 1
  fi
  if [[ -x "$venv/bin/python" ]]; then py="$venv/bin/python"
  elif [[ -x "$venv/bin/python3" ]]; then py="$venv/bin/python3"
  else
    command -v python3 >/dev/null || { echo "error: Python 3 is required for install --dev." >&2; return 1; }
    mkdir -p "$(dirname "$venv")"; python3 -m venv "$venv" || return 1; py="$venv/bin/python"
  fi
  if ! runtime_prefix_matches_venv "$py" "$venv"; then
    echo "error: development runtime interpreter prefix does not match the selected venv: $venv" >&2
    return 1
  fi
  say "Installing editable kernel source from $kernel into $venv ..."
  if [[ -n "$(find_uv 2>/dev/null || true)" ]]; then
    "$(find_uv)" pip install --python "$py" --editable "$kernel" || return 1
  else
    "$py" -m pip install --editable "$kernel" || return 1
  fi
  dev_runtime_health_check "$py" "$venv" "$kernel" >/dev/null || {
    echo "error: editable kernel prefix/module provenance check failed in $py for source $kernel." >&2
    return 1
  }
  DEV_RUNTIME_PYTHON="$py"
  # write_install_metadata reads RUNTIME_VENV_DIR, not DEV_RUNTIME_PYTHON; if
  # discovery had adopted a prior venv-repair path, that stale pointer must
  # not silently outlive the venv actually just installed into.
  RUNTIME_VENV_DIR="$venv"
}

build_dev_from_sources() {
  local tui_source="$1" kernel_source="$2" tui portal
  ensure_go_for_source "$tui_source"
  say "Building development lingtai-tui from editable source ($tui_source/tui) ..."
  (cd "$tui_source/tui" && CGO_ENABLED=0 go build -o "$BUILD_DIR/lingtai-tui" .) || return 1
  PORTAL_PATH=""
  if [[ "$SKIP_PORTAL" != 1 ]]; then
    if ensure_node_for_portal; then
      say "Building development lingtai-portal from editable source ($tui_source/portal) ..."
      if (cd "$tui_source/portal/web" && npm ci --silent && npm run build --silent) && (cd "$tui_source/portal" && CGO_ENABLED=0 go build -o "$BUILD_DIR/lingtai-portal" .); then
        install_binary_atomically "$BUILD_DIR/lingtai-portal" "$BIN_DIR/lingtai-portal"; PORTAL_PATH="$BIN_DIR/lingtai-portal"
      else
        echo "error: development Portal source build failed; --dev never silently aliases an official release." >&2; return 1
      fi
    else
      echo "error: development Portal requires a supported Node.js/npm toolchain." >&2; return 1
    fi
  fi
  install_binary_atomically "$BUILD_DIR/lingtai-tui" "$BIN_DIR/lingtai-tui"
  ensure_lingtai_alias "$BIN_DIR"
  VERSION="dev"; RESOLVED_REF="dev"; RESOLVED_COMMIT="$(git -C "$tui_source" rev-parse HEAD 2>/dev/null || true)"; INSTALL_KIND="dev-source"
}

run_dev_install() {
  local tui_explicit=0 kernel_explicit=0 tui_source kernel_source
  [[ -n "$DEV_TUI_SOURCE" ]] && tui_explicit=1
  [[ -n "$DEV_KERNEL_SOURCE" ]] && kernel_explicit=1
  tui_source="${DEV_TUI_SOURCE:-$HOME/.lingtai-tui/dev/lingtai}"
  kernel_source="${DEV_KERNEL_SOURCE:-$HOME/.lingtai-tui/dev/lingtai-kernel}"
  tui_source="$(ensure_dev_checkout "$tui_source" tui "$REPO" "$tui_explicit")" || return 1
  kernel_source="$(ensure_dev_checkout "$kernel_source" kernel "https://github.com/Lingtai-AI/lingtai-kernel.git" "$kernel_explicit")" || return 1
  mkdir -p "$BUILD_DIR"
  ensure_dev_runtime "$kernel_source" || return 1
  build_dev_from_sources "$tui_source" "$kernel_source" || return 1
  KERNEL_SOURCE="editable"; KERNEL_VERSION_INSTALLED="${UPDATE_CURRENT_KERNEL_VERSION:-dev}"
  DEV_KERNEL_SOURCE_PATH="$kernel_source"; DEV_TUI_SOURCE_PATH="$tui_source"
  GLOBAL_DIR="$HOME/.lingtai-tui"; PREFIX="$(prefix_for_bin_dir "$BIN_DIR")"
  write_install_metadata "$GLOBAL_DIR" "$PREFIX" "$BIN_DIR" "$REPO" "dev" "dev" "$RESOLVED_COMMIT" "$VERSION" "$BIN_DIR/lingtai-tui" "$PORTAL_PATH" || return 1
  say "Development install complete: kernel source is editable at $kernel_source; TUI/Portal were built from $tui_source."
}

# --- install flows -----------------------------------------------------------

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

# build_from_source clones REF (or the release source tarball for a tag) and
# builds both binaries. Installs to BIN_DIR. Sets VERSION/RESOLVED_*/PORTAL_PATH.
build_from_source() {
  local ref="$1" requested_tag source_tarball

  requested_tag="$(release_tag_name "$ref")"
  mkdir -p "$(dirname "$BUILD_DIR")"
  rm -rf "$BUILD_DIR"

  if [[ -n "$requested_tag" ]]; then
    # Release installs must stay GitHub-Release based even when no prebuilt
    # asset exists. Use the release source tarball instead of cloning raw main.
    ensure_build_deps 0
    command -v curl &>/dev/null || { echo "error: curl is required to download the release source tarball" >&2; exit 1; }
    command -v tar &>/dev/null || { echo "error: tar is required to extract the release source tarball" >&2; exit 1; }
    say "Downloading lingtai release source ($requested_tag) ..."
    source_tarball="$TMPDIR/lingtai-$requested_tag-src-$$.tar.gz"
    curl -fsSL --max-time 120 \
      -o "$source_tarball" \
      "https://github.com/${REPO_SLUG}/archive/refs/tags/${requested_tag}.tar.gz"
    mkdir -p "$BUILD_DIR"
    tar -xzf "$source_tarball" -C "$BUILD_DIR" --strip-components 1
    rm -f "$source_tarball"
    VERSION="$requested_tag"
    RESOLVED_REF="$requested_tag"
    RESOLVED_COMMIT="$(git ls-remote --tags "$REPO" "refs/tags/$requested_tag" 2>/dev/null | awk '{print $1}' | head -1 || true)"
  else
    ensure_build_deps 1
    say "Cloning lingtai ($ref) ..."
    if ! git clone --depth 1 --branch "$ref" "$REPO" "$BUILD_DIR" 2>/dev/null; then
      # --branch only resolves branches and tags; fall back to a default clone
      # plus an explicit fetch for commit SHAs and other refs.
      git clone --depth 1 "$REPO" "$BUILD_DIR"
      if [[ "$ref" != "main" ]]; then
        if ! (cd "$BUILD_DIR" && git fetch --depth 1 origin "$ref" && git checkout --quiet FETCH_HEAD); then
          echo "error: ref '$ref' not found in $REPO" >&2
          exit 1
        fi
      fi
    fi

    VERSION="$(version_for_checkout "$BUILD_DIR" "$ref")"
    RESOLVED_REF="$(resolved_ref_for_checkout "$BUILD_DIR")"
    RESOLVED_COMMIT="$(git -C "$BUILD_DIR" rev-parse HEAD)"
  fi
  INSTALL_KIND="source-build"

  ensure_go_for_source "$BUILD_DIR"

  say "Building lingtai-tui ($VERSION) ..."
  (cd "$BUILD_DIR/tui" && CGO_ENABLED=0 go build -ldflags "-X main.version=$VERSION" -o "$BUILD_DIR/lingtai-tui" .)

  PORTAL_BUILT=0
  if [[ "$SKIP_PORTAL" == "1" ]]; then
    note "Skipping portal (--skip-portal)."
  else
    if ensure_node_for_portal; then
      say "Building lingtai-portal ($VERSION) ..."
      if (cd "$BUILD_DIR/portal/web" && npm ci --silent && npm run build --silent) &&          (cd "$BUILD_DIR/portal" && CGO_ENABLED=0 go build -ldflags "-X main.version=$VERSION" -o "$BUILD_DIR/lingtai-portal" .); then
        PORTAL_BUILT=1
      else
        warn "Skipping portal — portal build failed; continuing with lingtai-tui only."
        note "$(portal_node_requirement_note)"
      fi
    else
      warn "Skipping portal — could not prepare a supported Node.js/npm toolchain."
      note "$(portal_node_requirement_note)"
    fi
  fi

  # Install binaries (first-install/source-build semantics).
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
      echo "error: git is required for --ref source builds but not found. Install it with:" >&2
      suggest_install git
      exit 1
    fi
  fi
}

# --- main --------------------------------------------------------------------

main() {
parse_args "$@"

# Remove the build directory even when a build or install step fails midway.
cleanup() {
  cd / 2>/dev/null || true
  rm -rf "$BUILD_DIR"
}
trap cleanup EXIT

# This directory owns both install metadata and the managed runtime subtree.
# HOME itself may be symlinked, but the ownership root must not redirect through
# a `.lingtai-tui` symlink to external state in any mode, including update and
# --skip-python. Keep this gate before every mode-specific runtime discovery.
if [[ -L "$HOME/.lingtai-tui" ]]; then
  echo "error: $HOME/.lingtai-tui is a symlink; refusing to adopt or mutate redirected install/runtime state." >&2
  return 1
fi

# Keep the explicit runtime update out of every first-install decision below.
# In particular, it must not resolve a binary provider, bundle latest, source
# tree, or runtime venv; those are unchanged default-install semantics.
if [[ "$MODE" == "update" || "$UPDATE_MODE" == "1" ]]; then
  run_update_mode
  return $?
fi

# With no explicit destination, adopt one unambiguous existing installation so
# a one-shot install repairs that environment instead of creating a second copy.
# Explicit --prefix/--bin-dir remain authoritative for WHERE to install — they
# are never overridden by discovery — but they do not bypass diagnosis: an
# explicit target that already holds installer-managed/executable state still
# gets the same plan+consent gate (see discover_explicit_target_install).
if [[ -z "$BIN_DIR_OVERRIDE" && -z "$INSTALL_PREFIX" ]]; then
  discover_existing_install || return 1
else
  discover_explicit_target_install || return 1
fi

# A non-skip normal install must know before disclosure/consent that its selected
# logical runtime is a canonical child of the owned root. Missing owned roots and
# final directories remain valid prospective paths; symlinks/occupied escapes do
# not. This prevents TUI replacement followed by a late runtime ownership failure.
if [[ "$DEV_MODE" != "1" && "$SKIP_VENV" != "1" ]] && \
   ! canonical_runtime_venv "$RUNTIME_VENV_DIR" "$HOME/.lingtai-tui/runtime" >/dev/null; then
  echo "error: selected runtime venv is not a canonical child of the owned runtime root: $RUNTIME_VENV_DIR" >&2
  echo "       Refusing to present or approve a repair plan that would fail after TUI mutation." >&2
  return 1
fi

if is_wsl; then
  say "Detected Windows Subsystem for Linux (WSL)."
  note "Binaries and the Python runtime install into your Linux home ($HOME)."
  note "Run lingtai-tui from your WSL shell, not Windows PowerShell."
fi

if [[ "$DEV_MODE" == "1" ]]; then
  TARGET_TAG="dev"
  # The plan must name the same runtime ensure_dev_runtime will actually use,
  # not a stale metadata pointer adopted during discovery.
  RUNTIME_VENV_DIR="${LINGTAI_DEV_RUNTIME_PYTHON:-$HOME/.lingtai-tui/runtime/venv}"
  if [[ -z "${LINGTAI_DEV_RUNTIME_PYTHON:-}" ]] && \
     ! canonical_runtime_venv "$RUNTIME_VENV_DIR" "$HOME/.lingtai-tui/runtime" >/dev/null; then
    echo "error: default development runtime is not a canonical child of the owned runtime root: $RUNTIME_VENV_DIR" >&2
    return 1
  fi
  print_install_plan || return 1
  resolve_bin_dir
  if [[ "$DISCOVERED_METADATA_PRESENT" == "1" || -n "$DISCOVERED_BIN_DIR" ]]; then
    PLAN_BEFORE_TUI="$(discover_current_tui_tag "$DISCOVERED_BIN_DIR" || true)"
    PLAN_BEFORE_TUI="${PLAN_BEFORE_TUI:-not found}"
    if [[ "$SKIP_VENV" == "1" ]]; then
      PLAN_BEFORE_RUNTIME="not probed (--skip-python)"
    elif [[ "$DEV_MODE" == "1" && -n "${LINGTAI_DEV_RUNTIME_PYTHON:-}" ]] || \
         canonical_runtime_venv "$RUNTIME_VENV_DIR" "$HOME/.lingtai-tui/runtime" >/dev/null; then
      PLAN_BEFORE_RUNTIME="$(runtime_current_summary "$RUNTIME_VENV_DIR")"
    else
      PLAN_BEFORE_RUNTIME="untrusted runtime path; not probed"
    fi
  fi
  run_dev_install || return 1
  if [[ "$DISCOVERED_METADATA_PRESENT" == "1" || -n "$DISCOVERED_BIN_DIR" ]]; then
    say "Repair result (before -> after):"
    printf '    TUI:      %s -> %s (development binary check passed)\n' "$PLAN_BEFORE_TUI" "$(tui_binary_tag "$BIN_DIR/lingtai-tui" || echo dev)"
    printf '    Runtime:  %s -> %s\n' "$PLAN_BEFORE_RUNTIME" "$(runtime_current_summary "$RUNTIME_VENV_DIR")"
  fi
  return 0
fi

# Auto-detect CN-restricted networks. If proxy.golang.org is unreachable
# within 3 seconds (typical on mainland China without VPN), fall back to
# CN-accessible mirrors for Go modules, the Go checksum database, and npm.
# Only relevant when we build from source, but harmless otherwise. Explicit
# pre-set env vars are preserved.
if command -v curl &>/dev/null && \
   [ -z "${GOPROXY:-}" ] && \
   ! curl -sSfL --max-time 3 -o /dev/null \
     "https://proxy.golang.org/github.com/golang/go/@latest" 2>/dev/null; then
  say "proxy.golang.org unreachable; using China-friendly build mirrors."
  export GOPROXY="https://goproxy.cn,direct"
  export GOSUMDB="sum.golang.google.cn"
  export NPM_CONFIG_REGISTRY="https://registry.npmmirror.com"
fi

resolve_source_provider
if [[ "$BUNDLE_PROVIDER" == "gitee" ]]; then
  say "Source: Gitee (${GITEE_OWNER}/${GITEE_REPO}) — override with --source github or LINGTAI_SOURCE=github."
fi

# Resolve one exact TUI tag up front. A verified bundle remains first priority;
# source-only releases instead fetch kernel-release.json from this same tag and
# feed its pin into the same kernel release-manifest/artifact installer.
# try_release_asset, build_from_source's tag-based source-tarball path, and the
# kernel artifact install in ensure_runtime_venv all reuse BUNDLE_TAG.
#
# This is the default release-asset one-command path (no --ref): a pinned
# kernel release is REQUIRED here. LingTai must never be installed from a
# package index by name, so an absent bundle and absent exact pin fail loud —
# see BUNDLE_REQUIRED.
if [[ -z "$REF" ]]; then
  BUNDLE_REQUIRED=1
  if fetch_bundle_manifest; then
    note "Resolved bundle $BUNDLE_TAG via $BUNDLE_PROVIDER (kernel $(bundle_manifest_field kernel_tag))."
  else
    warn "No usable bundle manifest available for $BUNDLE_TAG on GitHub or Gitee; trying the exact TUI release pin."
    if [[ -n "$(release_tag_name "$BUNDLE_TAG")" ]] && fetch_kernel_pin "$BUNDLE_TAG"; then
      note "Resolved kernel release pin $KERNEL_PIN_TAG from TUI $KERNEL_PIN_TUI_TAG via $KERNEL_PIN_PROVIDER."
    else
      warn "No valid kernel release pin available for exact TUI tag $BUNDLE_TAG on GitHub or Gitee."
    fi
  fi
fi

# Resolve the target without mutating the selected installation. This exact
# target and bundle/pin state are what the repair plan presents before consent.
#   --ref         : explicit source build of that ref
#   --version tag : that release (asset, else source tarball)
#   default       : latest release (asset, else source tarball)
if [[ -n "$REF" ]]; then
  TARGET_TAG="$REF"
else
  TARGET_TAG="$VERSION"
  if [[ -z "$TARGET_TAG" ]]; then
    # fetch_bundle_manifest resolves latest at most once and leaves BUNDLE_TAG
    # populated even when the bundle is absent, so the pin fallback and TUI
    # source always use that exact same tag.
    TARGET_TAG="$BUNDLE_TAG"
    if [[ -z "$TARGET_TAG" ]]; then
      echo "error: could not determine the exact TUI release tag from GitHub or Gitee." >&2
      echo "       Pass one explicitly: ./install.sh --version vX.Y.Z" >&2
      exit 1
    fi
    say "Latest release is $TARGET_TAG"
  fi
fi

print_install_plan || return 1
resolve_bin_dir

# Consent has now been obtained (or --non-interactive supplied it). Only now
# is it safe to execute the discovered binary / probe the discovered runtime
# to record the real "before" state for the before -> after report below;
# doing this earlier would be exactly the pre-consent execution blocker 2
# forbids. This does not change what will be installed — only what is
# reported as the starting point.
if [[ "$DISCOVERED_METADATA_PRESENT" == "1" || -n "$DISCOVERED_BIN_DIR" ]]; then
  PLAN_BEFORE_TUI="$(discover_current_tui_tag "$DISCOVERED_BIN_DIR" || true)"
  PLAN_BEFORE_TUI="${PLAN_BEFORE_TUI:-not found}"
  if [[ "$SKIP_VENV" == "1" ]]; then
    PLAN_BEFORE_RUNTIME="not probed (--skip-python)"
  elif canonical_runtime_venv "$RUNTIME_VENV_DIR" "$HOME/.lingtai-tui/runtime" >/dev/null; then
    PLAN_BEFORE_RUNTIME="$(runtime_current_summary "$RUNTIME_VENV_DIR")"
  else
    PLAN_BEFORE_RUNTIME="untrusted runtime path; not probed"
  fi
fi

# Decide what to install (the explicit runtime update returned above).
if [[ -n "$REF" ]]; then
  build_from_source "$REF"
else
  if [[ -z "$(release_tag_name "$TARGET_TAG")" ]]; then
    warn "'$TARGET_TAG' is not a vX.Y.Z release tag; treating it as a source ref."
    build_from_source "$TARGET_TAG"
  elif [[ "$FROM_SOURCE" != "1" ]]; then
    if try_release_asset "$TARGET_TAG"; then
      :
    else
      asset_rc=$?
      [[ "$asset_rc" != "2" ]] || exit 1
      build_from_source "$TARGET_TAG"
    fi
  else
    build_from_source "$TARGET_TAG"
  fi
fi

if [[ ! -x "$BIN_DIR/lingtai-tui" ]] || ! verify_tui_binary_version "$BIN_DIR/lingtai-tui" "$VERSION"; then
  echo "error: installed lingtai-tui failed the final binary/version health check." >&2
  exit 1
fi

# Provision the pinned runtime before recording install metadata. This makes
# kernel_source and its provenance fields a postcondition of verified
# provisioning, never a claim about a partially completed install.
if ! ensure_runtime_venv "$BIN_DIR"; then
  echo "error: LingTai install incomplete — the TUI/portal binaries installed, but the" >&2
  echo "       Python runtime could not be provisioned from a verified pinned kernel release." >&2
  echo "       See the error above. Re-run, or pass --skip-python if TUI-only is intended." >&2
  exit 1
fi

# Re-run the real postconditions after repair, before metadata records success.
# This also gives existing users an explicit before→after result.
final_tui_tag="$(tui_binary_tag "$BIN_DIR/lingtai-tui" || true)"
if ! verify_tui_binary_version "$BIN_DIR/lingtai-tui" "$VERSION"; then
  echo "error: final installed lingtai-tui health check failed." >&2
  exit 1
fi
final_runtime_summary="runtime intentionally skipped"
if [[ "$SKIP_VENV" != "1" ]]; then
  final_runtime_python="$(runtime_python_for_venv "$RUNTIME_VENV_DIR")"
  final_runtime_summary="$(runtime_health_check "$final_runtime_python" "$KERNEL_VERSION_INSTALLED" 2>/dev/null || true)"
  if [[ -z "$final_runtime_python" || -z "$final_runtime_summary" ]]; then
    echo "error: final Python runtime import/version health check failed." >&2
    exit 1
  fi
fi
if [[ "$DISCOVERED_METADATA_PRESENT" == "1" || -n "$DISCOVERED_BIN_DIR" ]]; then
  say "Repair result (before → after):"
  printf '    TUI:      %s → %s (binary/version check passed)\n' "$PLAN_BEFORE_TUI" "${final_tui_tag:-$VERSION}"
  printf '    Runtime:  %s → %s\n' "$PLAN_BEFORE_RUNTIME" "$final_runtime_summary"
fi

# Record install metadata for the TUI source updater only after the runtime
# gate above succeeds (or --skip-python explicitly opted out).
GLOBAL_DIR="$HOME/.lingtai-tui"
PREFIX="$(prefix_for_bin_dir "$BIN_DIR")"
REQUESTED_REF="${REF:-${VERSION:-main}}"
write_install_metadata \
  "$GLOBAL_DIR" \
  "$PREFIX" \
  "$BIN_DIR" \
  "$REPO" \
  "$REQUESTED_REF" \
  "${RESOLVED_REF:-$VERSION}" \
  "${RESOLVED_COMMIT:-}" \
  "$VERSION" \
  "$BIN_DIR/lingtai-tui" \
  "$PORTAL_PATH"
say "Wrote install metadata to $GLOBAL_DIR/install.json"

say "Done. $("$BIN_DIR/lingtai-tui" version 2>&1 || echo "$VERSION")"

# Tell the user how to put BIN_DIR on PATH if it isn't already.
case ":$PATH:" in
  *":$BIN_DIR:"*) ;;
  *)
    say "Note: $BIN_DIR is not on your PATH. Add it with:"
    note "echo 'export PATH=\"$BIN_DIR:\$PATH\"' >> ~/.bashrc && source ~/.bashrc"
    ;;
esac
}

if [[ "${LINGTAI_INSTALL_SH_SOURCE_ONLY:-0}" != "1" ]]; then
  main "$@"
fi
