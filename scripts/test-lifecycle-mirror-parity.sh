#!/usr/bin/env bash
# For coding-agent maintainers:
# - Read the root ANATOMY.md and public/help/reference/installation/CONTRACT.md
#   before changing this file.
# - This script is the local/CI-gate counterpart to
#   .github/workflows/sync-installers.yml: the workflow repairs drift on a
#   schedule, this script fails a PR loudly if it introduces drift.
# - It proves literal byte equality, never a reformatted/transformed diff. A
#   change to any lifecycle script's public bytes belongs upstream in
#   Lingtai-AI/lingtai, not here.
#
# Usage:
#   scripts/test-lifecycle-mirror-parity.sh <path-to-lingtai-checkout> [path-to-remove-source]
#
# <path-to-lingtai-checkout> is a local clone/worktree of Lingtai-AI/lingtai
# (any ref) whose root holds the canonical install.sh, install.ps1, update.sh,
# fix.sh, verify.sh, dev.sh, remove.sh, remove.ps1. Compares each against this
# repo's public mirror byte-for-byte and reports every mismatch before exiting
# nonzero.
#
# [path-to-remove-source] is optional and defaults to the same checkout as the
# first argument. It exists only for the pre-merge window where remove.sh/
# remove.ps1 land in a separate PR branch/worktree from the other six scripts
# (e.g. verifying PR3's mirror against PR1's open head for six files and PR2's
# open head for the two remove scripts, before PR1/PR2 land on the same main).
# Once PR1 and PR2 are both merged to lingtai@main, a single checkout answers
# both positions and the second argument is unnecessary.
#
# Uses parallel name/path lists rather than an associative array: macOS ships
# bash 3.2, which has no `declare -A`, and this script must run under the
# system /bin/bash on the same macOS hosts the installer itself targets.
set -euo pipefail

if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
  echo "usage: $0 <path-to-lingtai-checkout> [path-to-remove-source]" >&2
  exit 2
fi

CANON="$1"
REMOVE_CANON="${2:-$1}"
if [ ! -d "$CANON" ]; then
  echo "error: $CANON is not a directory" >&2
  exit 2
fi
if [ ! -d "$REMOVE_CANON" ]; then
  echo "error: $REMOVE_CANON is not a directory" >&2
  exit 2
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

NAMES="install.sh install.ps1 update.sh fix.sh verify.sh dev.sh remove.sh remove.ps1"
mirror_path_for() {
  case "$1" in
    install.sh) echo "public/install.sh" ;;
    install.ps1) echo "public/install.ps1" ;;
    remove.sh) echo "public/remove.sh" ;;
    remove.ps1) echo "public/remove.ps1" ;;
    update.sh) echo "public/help/reference/installation/assets/update.sh" ;;
    fix.sh) echo "public/help/reference/installation/assets/fix.sh" ;;
    verify.sh) echo "public/help/reference/installation/assets/verify.sh" ;;
    dev.sh) echo "public/help/reference/installation/assets/dev.sh" ;;
    *) echo "error: unknown lifecycle script $1" >&2; exit 2 ;;
  esac
}
source_root_for() {
  case "$1" in
    remove.sh|remove.ps1) echo "$REMOVE_CANON" ;;
    *) echo "$CANON" ;;
  esac
}

fail=0
for name in $NAMES; do
  source_root="$(source_root_for "$name")"
  canon_file="$source_root/$name"
  mirror_rel="$(mirror_path_for "$name")"
  mirror_file="$REPO_ROOT/$mirror_rel"

  if [ ! -f "$canon_file" ]; then
    echo "MISSING canonical source: $canon_file" >&2
    fail=1
    continue
  fi
  if [ ! -f "$mirror_file" ]; then
    echo "MISSING mirror: $mirror_file" >&2
    fail=1
    continue
  fi

  if cmp -s "$canon_file" "$mirror_file"; then
    echo "OK    $name"
  else
    echo "DRIFT $name: $mirror_rel does not match $canon_file byte-for-byte" >&2
    diff -u "$canon_file" "$mirror_file" | head -20 >&2 || true
    fail=1
  fi
done

if [ "$fail" -ne 0 ]; then
  echo >&2
  echo "error: one or more lifecycle scripts have drifted from canonical Lingtai-AI/lingtai bytes." >&2
  echo "Fix the mismatch upstream in lingtai, then re-run the sync; do not hand-edit the mirror." >&2
  exit 1
fi

echo
echo "PASS: all eight lifecycle scripts are byte-identical to their canonical sources"
