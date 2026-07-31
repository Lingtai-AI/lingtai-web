---
related_files:
  - public/help/reference/installation/CONTRACT.md
  - ANATOMY.md
  - public/install.sh
  - public/install.ps1
  - public/remove.sh
  - public/remove.ps1
  - public/help/reference/installation/skill.md
  - public/_headers
  - public/help/reference/installation/assets/update.sh
  - public/help/reference/installation/assets/dev.sh
  - public/help/reference/installation/assets/fix.sh
  - public/help/reference/installation/assets/verify.sh
  - .github/workflows/sync-installers.yml
  - scripts/test-lifecycle-mirror-parity.sh
maintenance: |
  Keep related_files repo-relative, duplicate-free, and linked to real files.
  Keep this Anatomy reciprocal with its installation CONTRACT.md and with the
  root ANATOMY.md. Code is structural truth: update file/symbol/connections/state
  citations with executable changes, keep public guidance linked, and run each
  changed executable as a real operation on the exact final candidate.
---
# Public installation Anatomy

The public installation component is eight byte-for-byte mirrored lifecycle
scripts (six POSIX shell, two native-Windows PowerShell), the automation that
keeps them mirrored, one progressively disclosed skill, one normative Contract,
and real behavior evidence. `Lingtai-AI/lingtai` is the sole canonical owner of
every byte; nothing here edits them.

## Components

- `public/install.sh:2338-2372` `build_latest_from_main` is the native
  `--latest` mode: recognizes only explicit `--latest`, resolves
  `refs/heads/main` in both `Lingtai-AI/lingtai` and `Lingtai-AI/lingtai-kernel`
  to full SHAs, verifies both checkouts against those pins, and builds/installs
  from them directly in-process — no separate delegated download or handoff
  script.
- `public/install.sh:959-1047` `write_install_metadata` publishes the first strict
  success receipt only after postconditions; exclusive linking preserves a raced
  receipt.
- `public/install.sh:1304-1321` `ensure_runtime_pip` self-heals pip only inside the
  new owned venv via its interpreter's `ensurepip`, then selected uv scoped to
  that venv, followed by prefix/pip revalidation.
- `public/install.sh:1349-1376` `runtime_health_check` binds `sys.prefix`, exact
  version, and physical module provenance for both ordinary and development
  installs.
- `public/install.sh:1406-1643` `ensure_runtime_venv` rejects existing state, creates
  one new owned runtime, proves pip, installs a pinned local kernel artifact, and
  proves final runtime health.
- `public/install.sh:1965-2037` `install_kernel_from_bundle` selects, verifies, and
  installs the exact pinned artifact by local path; only dependencies use the
  configured index.
- `public/install.sh:2113-2127` `validate_fresh_install_state` is the fail-closed
  first-install state gate.
- `public/install.ps1:947-977` `Install-KernelWheel` downloads and SHA-256
  verifies the pinned kernel wheel, then installs it by explicit local path.
- `public/install.ps1:1316-1360` `Install-Venv` provisions the owned runtime venv
  and orchestrates kernel wheel selection, install, and provenance proof; it is
  the PowerShell counterpart to `ensure_runtime_venv`.
- `public/help/reference/installation/assets/update.sh:22-105` is exact-artifact
  ordinary update after `--yes`.
- `public/help/reference/installation/assets/fix.sh:22-109` is read-only diagnosis
  plus explicit bounded new-runtime repair after `--apply --yes`.
- `public/help/reference/installation/assets/verify.sh:21-150` is read-only proof
  for one exact target/runtime/receipt.
- `public/help/reference/installation/assets/dev.sh:22-245` is explicit editable
  development composition after `--yes`.
- `public/remove.sh:84-94` `is_homebrew_path` refuses (does not partially
  remove) a Homebrew-shaped target by path pattern, the same check
  `tui/internal/config/venv.go`'s `detectHomebrewTUIInstall` makes upstream.
  `public/remove.sh:210-219` `remove_symlink_if_exact` deletes the `lingtai`/
  `lingtai-agent` symlinks only when the live symlink target exactly matches
  the owned shape, leaving an unrelated pre-existing file at that name
  untouched. The receipt at `$HOME/.lingtai-tui/install.json` is the only
  deletion oracle; there is no filename-pattern sweep of any runtime directory.
- `public/remove.ps1:130-275` `Invoke-Main` is the PowerShell counterpart:
  reads the receipt at `%USERPROFILE%\.lingtai-tui\install.json`, deletes the
  managed binaries, then the receipt-pointed runtime venv, then the receipt
  itself last, and reports any receipt-unproven survivor by name rather than
  sweeping it.
- `.github/workflows/sync-installers.yml` fetches all eight files from
  `Lingtai-AI/lingtai@main` at one resolved SHA, validates each before it can
  touch `public/`, and commits only the files that actually changed. It repairs
  drift on an hourly schedule and on `workflow_dispatch`/`repository_dispatch`;
  it never writes upstream.
- `scripts/test-lifecycle-mirror-parity.sh` proves literal byte equality between
  local `Lingtai-AI/lingtai` checkout(s) and all eight public mirror paths, for
  use in local verification or a PR gate. It accepts a second, optional source
  root for `remove.sh`/`remove.ps1` alone, for the pre-merge window where their
  canonical bytes land via a different open PR/branch than the other six. It is
  the fail-loud counterpart to the sync workflow's fail-loud fetch validation.

## Connections

`public/skill.md` routes to the help router, which routes to the installation
skill. The skill selects an operation but never authorizes or executes it. Each
operation's standalone shell or PowerShell file enforces its own CLI and state
boundary. The four `assets/`-owned shell files point maintainers to the
repository and child Contracts in visible header comments; `install.sh`,
`install.ps1`, `remove.sh`, and `remove.ps1` are all owned and versioned by
`Lingtai-AI/lingtai` and mirrored here unmodified, at the same repository-root
public tier.

The root Contract governs this child; the child Contract owns operation, consent,
state, receipt, provenance, and failure promises. This Anatomy maps the real
files and symbols implementing those promises.

## Composition

Ordinary install resolves one exact official TUI release and pinned kernel
artifact, creates one new target/runtime, proves identity/import/provenance, then
publishes its first receipt. Explicit `--latest` is a native mode of the same
mirrored `install.sh`: it resolves and verifies both TUI+kernel main SHAs itself
and owns the final receipt: there is no separate public-side delegation. Update,
arbitrary-ref development, repair, verification, and removal remain standalone
assets with explicit exact inputs and consent. Removal is the mirror image of
install: it reads the same receipt install writes and deletes exactly the
artifact set that receipt proves owned, receipt last, so a partial failure can
never leave a receipt that overstates what remains.

Every changed entrypoint is exercised as its real declared operation in a
brand-new isolated non-root Linux environment with real precondition state and
inputs, then judged only by observed postconditions or partial failure. Ordinary
install additionally uses an empty `HOME`, official exact-tag TUI source or
release bytes, the pinned kernel artifact, and direct post-install probes. Source
grep, shims, fake commands, static assertions, and hermetic simulations do not
count as acceptance.

## State

Owned machine state is the exact binary target, `$HOME/.lingtai-tui/runtime`, and
`$HOME/.lingtai-tui/install.json`. A strict `lingtai.tui.install/v1` receipt binds
operation provenance, target, runtime, TUI identity, and kernel identity.
Process-owned download/build scratch is ephemeral; partial target/runtime state
is retained and reported on failure rather than treated as rollback authority.
`remove.sh`/`remove.ps1` are the only assets authorized to delete this owned
state, and only the exact subset the receipt itself names — config, secrets,
presets, and per-project state were never part of this owned state and stay
untouched regardless of which lifecycle asset runs.

## Notes

`--skip-python` / `--skip-venv` (`-SkipVenv` on `install.ps1`) is the only
ordinary TUI-only opt-out. It does not promise later implicit runtime backfill.
Ordinary install never adopts or repairs existing state; `fix.sh` owns explicit
repair. A receipt or `PASS` is emitted only after the operation's full declared
postconditions pass.
