---
name: lingtai-public-installation
contract_version: 4
root_contract: CONTRACT.md
related_files:
  - ANATOMY.md
  - public/help/reference/installation/ANATOMY.md
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
  This component contract is governed by the root CONTRACT.md. Keep related_files
  complete and repo-relative, keep this Contract reciprocal with its ANATOMY.md,
  and keep the public executables, installation skill, postconditions, and real
  operation evidence synchronized. Report root/pair mismatches;
  do not duplicate or auto-fix the root convention here.
---

# LingTai public installation contract

## Purpose

This file is the normative contract for choosing and maintaining the public
installation entrypoints served by `lingtai.ai`:

- `/install.sh`
- `/install.ps1`
- `/remove.sh`
- `/remove.ps1`
- `/help/reference/installation/assets/update.sh`
- `/help/reference/installation/assets/dev.sh`
- `/help/reference/installation/assets/fix.sh`
- `/help/reference/installation/assets/verify.sh`

`Lingtai-AI/lingtai` is the sole canonical owner of every byte of these eight
files. This repository publishes exact, unmodified mirrors at the URLs above;
`.github/workflows/sync-installers.yml` performs that mirroring and
`scripts/test-lifecycle-mirror-parity.sh` proves byte equality on demand. A fix
to any executable's behavior belongs upstream in `Lingtai-AI/lingtai`, never as
a local edit here — a local edit is silently reverted by the next sync and is
therefore a defect regardless of intent.

`/remove.sh` and `/remove.ps1` are the first deletion-purpose lifecycle assets:
they mirror at the same tier as `/install.sh`/`/install.ps1` (repository root,
not under `assets/`) because canonical `Lingtai-AI/lingtai` places them there
too. Their deletion authority is bounded entirely by §2.6 and §4.6/§4.6a below;
the receipt is their only deletion oracle.

The executable files own their exact CLI syntax. This contract owns the stable
state classes, entrypoint boundaries, allowed writes, provenance requirements,
postconditions, and failure meaning. The installation skill explains the
surface; it does not weaken this contract or authorize a mutation.

If this file, the installation skill, an executable, or observed operation
evidence disagree, **stop and treat the disagreement as a product defect**. Do
not guess, silently heal, or select a more permissive path.

This is not a release-publication, deployment, refresh, or migration procedure.
Exact release migrations remain owned by each product repository's tagged
`migration/migration.md` history.

## Behavior

Every entrypoint MUST preserve these invariants except where its adapter subsection
expressly narrows one; the adapter owns that named exception.

### 2.1 Explicit operation selection

1. `/install.sh` ordinary install is first-install-only. Its explicit `--latest`
   selection is a native mode of the same mirrored script: it resolves both the
   TUI and kernel repositories' current `main` to full SHAs, verifies both
   checkouts, and builds/installs from them directly — there is no separate
   public-side delegation or handoff download. `/install.ps1` is an explicit
   Windows adapter with the exact-release repeat semantics stated in §4.1a;
   neither exception changes ordinary install or the update/fix separation.
2. Update, arbitrary-ref development, repair, verification, and removal remain
   separate standalone assets. `/remove.sh` and `/remove.ps1` delete only the
   exact artifact set the receipt they read proves the given bin directory
   owns; see §2.6.
3. `/skill.md`, `/help/skill.md`, and the installation skill are guidance only.
   They MUST NOT infer or authorize mutation.
4. For `/install.sh` and the maintenance assets, a missing child URL,
   unclassified state, conflicting receipt, redirected path, or ambiguous
   provenance is a stop condition. `/install.ps1` follows its explicit
   fixed-destination trust and failure contract in §4.1a.
5. No entrypoint downloads, sources, or executes another installation entrypoint.
   `--latest` resolves and verifies TUI/kernel main SHAs and builds from them
   in-process within the same mirrored `install.sh`; it does not fetch or hand
   off to a second script.

### 2.2 Exact ownership

1. Paths supplied to maintenance assets are exact absolute paths.
2. For `/install.sh` and the maintenance assets, the selected binary directory
   and `$HOME/.lingtai-tui` state MUST be ordinary owned paths, not redirected
   through a disallowed symlink. `/install.ps1` uses its configured fixed paths
   without claiming this check.
3. A runtime interpreter MUST resolve to a virtual environment physically under
   `$HOME/.lingtai-tui/runtime`, and its `sys.prefix` MUST equal that selected
   environment.
4. An existing target is mutable only when a strict
   `lingtai.tui.install/v1` receipt owns that exact target and runtime for
   `/install.sh` and the maintenance assets. `/install.ps1` has its explicit
   fixed-destination semantics in §4.1a and makes no disallowed-symlink or
   foreign-ownership claim beyond what its implementation proves.
5. Ordinary and development provenance are distinct. Ordinary update/repair MUST
   reject `dev-source`; development MUST record editable source provenance.
6. System and Homebrew Python interpreters are never installation runtimes.

### 2.3 Exact identity and provenance

1. A TUI version probe contains exactly one identity token: either one exact
   `vX.Y.Z` or one standalone `dev`. Missing, repeated, mixed, substring, or
   garbage identities fail closed.
2. Ordinary release inputs are exact artifacts. Checksums, archive safety,
   unique-binary selection, and requested identity are verified before their
   mutation phase.
3. Ordinary runtime imports of `lingtai` and `lingtai.kernel` resolve physically
   inside the selected venv. Development imports resolve physically inside the
   receipt-declared kernel checkout while `sys.prefix` remains the selected venv.
4. The observed `lingtai.__version__` equals the receipt's `kernel_version`
   exactly wherever a runtime receipt is verified or changed.
5. No ordinary path falls back to installing LingTai by package name. It uses the
   verified pinned local artifact chosen for the exact release.

### 2.4 Consent and side-effect ceiling

1. Invoking `/install.sh` authorizes only a fresh ordinary installation.
   Invoking `/install.ps1` authorizes convergence to its explicit or
   once-resolved exact input under §4.1a.
2. `update.sh` and `dev.sh` require `--yes` before mutation.
3. `fix.sh` is read-only unless both `--apply` and `--yes` are present.
4. `verify.sh` is always read-only.
5. `remove.sh`/`remove.ps1` require `--bin-dir`/`-BinDir` and `--yes`/`-Yes`
   before any deletion; a dry-run-shaped invocation (missing `--yes`/`-Yes`)
   prints the exact planned deletions and deletes nothing. See §2.6.
6. These entrypoints do not call LingTai `refresh`, merge, release, deploy, edit
   authentication/configuration, or publish a release.
7. Only process-owned scratch may be removed automatically outside `remove.sh`/
   `remove.ps1`. Failure is not permission to delete an existing target,
   receipt, runtime, or source checkout as rollback. `dev.sh` may run normal
   build tooling in the explicitly supplied checkouts, including generated
   dependency/build-tree writes.

### 2.5 Receipt publication

1. A successful operation records schema `lingtai.tui.install/v1`, schema version
   `1`, exact target ownership, provenance, and the state needed by its supported
   successor operations.
2. Fresh `/install.sh` publishes a mode-`0600` receipt by same-directory,
   exclusive, no-clobber creation. A raced receipt is preserved byte-for-byte.
   `/install.ps1` follows §4.1a: it may replace its managed metadata only after
   its final postconditions pass.
3. Update and repair re-read and revalidate the prior receipt immediately before
   atomically replacing it. A changed receipt is an explicit partial failure.
4. Development writes one complete `dev-source` receipt only after build,
   install, identity, import, and provenance postconditions pass.
5. A receipt is evidence of completed postconditions, not a progress marker.

### 2.6 Deletion is receipt-oracle-only

1. `remove.sh`/`remove.ps1` delete only the exact artifact set the
   `lingtai.tui.install/v1` receipt at the given bin directory proves that
   directory owns: the managed binaries (and, on POSIX, the `lingtai`/
   `lingtai-agent` symlinks only when they are exactly the owned symlink
   shape), the receipt-pointed runtime venv, and finally the receipt itself.
2. There is no filename-pattern sweep of any kind. A directory that merely
   matches a naming convention (e.g. `venv-repair-*`) but is not the receipt's
   own `runtime_venv` is never deleted; it is reported as a survivor.
3. Config, secrets, presets, per-project state, and any receipt-unproven
   directory are never touched. Accepted receipt kinds are `release-asset`,
   `source-build`, and `dev-source` alike — a dev install is a real install a
   user may fully remove.
4. A target whose resolved binary path is Homebrew-shaped is refused, not
   partially removed; the message points at `brew uninstall` instead.
5. The receipt is deleted last, only after every other owned artifact's
   deletion succeeds, so a partial failure always leaves a receipt that
   accurately describes the still-partially-present install. Failure output
   names exactly which artifacts were and were not removed.
6. Running either script twice is idempotent: a second run with no receipt
   present reports "nothing to remove" and exits 0.

## Port

| Observed state | Allowed entrypoint | Why | Forbidden shortcut |
|---|---|---|---|
| Fresh: no `install.json`, no runtime root, and no managed target in the selected bin directory (Unix-like) | `/install.sh` | Canonical ordinary first install | Do not use update/fix to manufacture ownership |
| Native Windows invocation with one explicit or once-resolved exact release/local artifact | `/install.ps1` | Validates that selected input and converges its fixed managed destinations to it | Do not bypass exact selection/trust gates or assume transactional rollback |
| Healthy ordinary receipt (`release-asset` or `source-build`) with matching target and runtime | `verify.sh`; then `update.sh` for an exact update | Ownership and runtime provenance are available | Do not rerun ordinary install; do not use dev implicitly |
| Strict ordinary receipt with a missing or broken old runtime | `fix.sh` diagnosis; then `fix.sh --apply --yes` with one new free runtime child | Repair can bind the prior receipt without executing the old runtime | Do not delete/reuse the old runtime or rerun ordinary install |
| Valid `dev-source` receipt and explicit Git checkouts | `verify.sh` or `dev.sh` | Editable provenance remains explicit | `update.sh` and `fix.sh` MUST reject it |
| Any valid receipt (`release-asset`, `source-build`, or `dev-source`) the user wants fully removed | `remove.sh --bin-dir DIR --yes` / `remove.ps1 -BinDir DIR -Yes` | Receipt is the only deletion oracle; deletes exactly the owned artifact set, receipt last | Do not sweep by filename pattern; do not delete a Homebrew-shaped target; do not remove config/secrets/per-project state |
| Exact release interval needs schema/config migration | Tagged product `migration/migration.md` files | Migration history is product- and tag-owned | Do not use `main`, `latest`, another repo, or skip a tag |
| POSIX/maintenance receipt, target, runtime, or provenance is missing, conflicting, redirected, or otherwise unclassified | Stop and report the exact state | No POSIX/maintenance executable owns an inferred recovery | Do not adopt, overwrite, auto-heal, or guess; the explicit Windows adapter remains governed by §4.1a |

For `/install.sh`, the existence of `$HOME/.lingtai-tui` as an ordinary directory
alone does not make a prior installation. Its freshness is lost when an install
receipt or runtime root exists, or when a managed target already occupies the
selected bin path. `/install.ps1` uses the convergence rules in §4.1a instead.

`--skip-python` / `--skip-venv` (`-SkipVenv` on `install.ps1`) is an explicit
binary-only ordinary-install opt-out. Its receipt intentionally omits
runtime/kernel fields. The runtime-dependent update, repair, and verification
assets do not promise to infer or backfill that state; stop and choose an
explicit supported plan rather than treating it as a normal healthy ordinary
runtime installation. On Windows, `-SkipVenv` skips only the kernel venv; both
the TUI and Portal binaries remain required and are installed.

## Adapters

### 4.1 `/install.sh` — fresh ordinary install

**Preconditions**

- Exact official release selection (`vX.Y.Z`), or current official release
  resolution; `--from-source` changes only how that exact release is built.
- No existing install receipt, runtime root, or managed target.
- The state root and selected bin directory are not redirected symlinks.

**Allowed reads/downloads/writes**

- Resolve the official release, bundle/pin, TUI/Portal artifact or exact-tag
  source fallback, and pinned kernel artifact.
- Write the selected bin directory and managed TUI/Portal binaries; create the
  `lingtai` alias and, when available, the `lingtai-agent` runtime link.
- Unless `--skip-python` is explicit, create the owned runtime venv, install the
  pinned kernel artifact, and write runtime metadata.
- Publish the first receipt only after TUI and runtime postconditions pass.
- In interactive mode with root/sudo, missing Debian-family prerequisites may be
  installed through `apt-get`. The installer may bootstrap official `uv` under
  `${UV_INSTALL_DIR:-$HOME/.local/bin}` without editing shell startup files, and
  may download temporary official Python/Go/Node toolchains. `--non-interactive`
  prints unmet host-package requirements and fails instead of invoking `apt`.

**Forbidden behavior**

- No adoption, overwrite, update, or repair of existing state.
- No arbitrary development ref. `--ref` and development/update compatibility
  flags hand off with exit status `2`.
- No skill/helper download, source, or execution on the ordinary path. The
  native `--latest` mode is governed separately by §4.1b.

**Success and failure meaning**

- Success means the exact TUI identity, optional pinned runtime provenance, and
  exclusive receipt publication passed.
- A nonzero exit is not rollback. It may leave newly created target/runtime or
  dependency state, but MUST NOT claim success or replace pre-existing state.
  A later ordinary invocation sees that state and fails closed.

### 4.1b `/install.sh --latest` — explicit latest-main install

**Preconditions and authority**

- `--latest` is explicit; it is not inferred from no arguments, `--ref`, receipt
  state, or any environment default.
- Invoking it authorizes a current-main install of both TUI and kernel, performed
  natively within this same mirrored `install.sh`. There is no second script and
  no public-side delegation; this repository publishes exactly the bytes
  `Lingtai-AI/lingtai` owns for this mode, unmodified.

**Allowed behavior**

- Require `git`; resolve `refs/heads/main` in both `Lingtai-AI/lingtai` and
  `Lingtai-AI/lingtai-kernel` to full SHAs; verify both checkouts against those
  pins; build the TUI from the checked-out source; install the kernel from the
  checked-out source (never by package name); own target/runtime validation and
  the final receipt.
- MUST resolve, verify, record, and show the exact TUI and kernel main SHAs. It
  MUST fail loud rather than falling back to ordinary stable releases or
  installing LingTai by package name.

**Success and failure meaning**

- Success means the exact TUI+kernel main SHAs were verified and the install's
  own postconditions and receipt publication passed.
- Any resolution, checkout, build, install, or postcondition failure propagates
  nonzero and never retries as an ordinary stable install. No rollback is claimed.

### 4.1a `/install.ps1` — exact-release ordinary install/reinstall (native Windows)

The PowerShell counterpart to `/install.sh`; parses and runs identically under
Windows PowerShell 5.1 and PowerShell 7+.

**Input and validation**

- Select one exact official release (`-Version vX.Y.Z`, or one release resolved
  by the public mode). `-ArchivePath`/`-ChecksumPath` selects local-artifact
  mode; the archive and sidecar are still SHA-256 verified and the staged TUI
  identity must match the requested exact version.
- Before any destination copy, validate the exact release inputs and staging,
  require both `lingtai-tui.exe` and `lingtai-portal.exe`, and, unless
  `-SkipVenv` is present, complete the pinned-runtime trust and import/version
  postconditions. The installer does not claim disallowed-symlink or
  foreign-ownership checks.

**Allowed reads/downloads/writes**

- Resolve and validate the official release manifest, or verify the supplied
  local archive and sidecar; stage the archive and confirm the exact staged TUI
  identity before touching the fixed bin directory. Both managed binaries are
  required before destination copy.
- Unless `-SkipVenv` is explicit, provision the runtime venv under
  `%USERPROFILE%\.lingtai-tui\runtime\venv` from the release's pinned kernel
  bundle: select and SHA-256-verify a compatible `cp311`/`cp312`/`cp313`
  `win_amd64` wheel, install LingTai only from that verified local wheel path,
  and verify import/version/provenance. Third-party dependencies may resolve
  through the configured package index; there is no `pip install lingtai` or
  other package-name fallback.
- On a real invocation, converge the fixed managed binary names and owned
  runtime/metadata to the exact selected input: they may be created or replaced
  after validation. Repeating the same input is supported; selecting a different
  exact release applies that release through this adapter rather than the POSIX
  update/fix assets. Publish success metadata only after final postconditions pass.
- `-DryRun` is a zero-write planning pass, not a full real-run preflight. Public
  mode resolves the release once and reports its selected URLs; local mode
  verifies the supplied archive checksum. It does not download, stage, probe,
  install, or prove that every real-run artifact will pass.

**Failure meaning**

- This is not transactional rollback. Failure may leave staging, runtime, or
  dependency state; a late write failure may also leave partial changes among
  the fixed managed destinations. It MUST NOT publish success metadata unless
  postconditions pass. Staging is retained for inspection/recovery.
- No skill/helper download, source, or execution.

**Success and failure meaning**

- Success means the verified archive contained both managed binaries, the staged
  TUI identity matched the exact selection, optional pinned runtime provenance
  passed, managed destinations were written, and success metadata postconditions passed.
- `-DryRun` is zero-write. `-SkipVenv` skips only the kernel venv; it does not
  skip either required binary.

### 4.2 `assets/update.sh` — healthy exact ordinary update

**Preconditions**

- Strict healthy ordinary receipt owning the exact bin directory and selected
  runtime; current TUI identity matches the receipt.
- Exact TUI archive and SHA-256, kernel artifact and SHA-256, TUI tag, kernel
  version, and `--yes`.
- All downloads, checksums, archive paths, unique candidate selection, candidate
  identity, receipt, target, runtime, and provenance checks finish before mutation.

**Allowed writes, in order**

1. Reinstall the exact kernel wheel in the selected owned runtime and prove its
   version/import provenance.
2. Atomically replace `lingtai-tui` and prove its exact identity.
3. Revalidate and atomically update the receipt's TUI/kernel version and time.

This asset does not update Portal, convert provenance, or select a release by
`latest`.

**Failure meaning**

Each failing phase names which of kernel, TUI, and receipt may have changed.
Cross-component rollback is not claimed; a receipt failure may leave correct new
components with stale metadata.

### 4.3 `assets/fix.sh` — bounded ordinary runtime repair

**Preconditions**

- Strict ordinary receipt owning the exact TUI target.
- A bootstrap `python3` for receipt parsing and venv creation; the old runtime is
  never executed.
- For mutation: exact kernel artifact and SHA-256, `--apply --yes`, and one
  explicitly named, unoccupied, normalized direct child under the owned runtime
  root.

**Allowed writes**

- Default invocation: none; print diagnosis and plan.
- Apply: create only the new runtime child, install the exact kernel wheel, prove
  exact prior `kernel_version` and import provenance, then atomically change only
  the receipt's runtime pointer and update time.

It does not replace TUI/Portal, change ordinary provenance, or delete/reuse the
old runtime.

**Failure meaning**

After creation starts, failure may leave the named new runtime directory partial.
The path is reported and preserved; deletion or rollback is not claimed.

### 4.4 `assets/verify.sh` — read-only receipt proof

- Reads one exact target, runtime, and receipt.
- Proves strict schema/ownership, one exact TUI identity, runtime `sys.prefix`,
  ordinary-or-editable import provenance, and exact kernel-version equality.
- Does not change target, runtime, receipt, source checkout, or environment.
- `PASS` means those checks passed for the selected TUI/runtime pair. It is not a
  Portal check, migration check, refresh, or guarantee about another install.

### 4.5 `assets/dev.sh` — explicit editable development state

**Preconditions**

- Explicit absolute TUI and kernel Git checkouts, exact bin directory, owned
  runtime selection, and `--yes`.
- Existing targets require a valid v1 receipt owning the same target/runtime.

**Allowed writes**

- Create the selected owned venv when missing.
- Run TUI/Portal build tooling in the supplied checkout (`--skip-portal` is
  explicit), editable-install the supplied kernel checkout, and install the
  resulting binaries into the selected target.
- After all postconditions, atomically write one complete `dev-source` receipt
  with canonical source paths, commits, managed binaries, runtime, and observed
  kernel version.

**Failure meaning**

A failed build/install/postcondition names possible runtime or binary changes and
writes no success receipt for the new development state. No cross-component
rollback is claimed.

### 4.6 `/remove.sh` — receipt-oracle-only POSIX removal

**Preconditions**

- `--bin-dir DIR --yes`. Without `--yes`, prints the exact planned deletions and
  exits without deleting anything.
- A `lingtai.tui.install/v1` receipt at `$HOME/.lingtai-tui/install.json` whose
  `bin_dir` matches the supplied `--bin-dir` exactly.

**Allowed writes, in order**

1. Delete the managed binaries (`lingtai-tui`, `lingtai-portal`) and the
   `lingtai`/`lingtai-agent` symlinks, but only when each is exactly the owned
   symlink shape — an unrelated pre-existing file at that name survives
   untouched.
2. Delete the receipt-pointed runtime venv, physically re-validated as
   contained under `$HOME/.lingtai-tui/runtime` immediately before deletion.
3. Delete the receipt itself, last.
4. `rmdir`-style removal only of the runtime root and state root, and only once
   empty — never a recursive removal of `$HOME/.lingtai-tui`.

**Forbidden behavior**

- No filename-pattern sweep. A directory that is not the receipt's own
  `runtime_venv` is reported as a survivor, never deleted.
- No touching `config.json`, `.env`, `tui_config.json`, `presets/saved/`,
  auth material, or per-project `.lingtai/` state.
- Refuses (does not partially remove) a Homebrew-shaped target; points at
  `brew uninstall` instead.
- No selective-removal flags, no automated legacy-Homebrew uninstall, no
  recovery of a broken/tampered receipt — removal refuses rather than guesses.

**Success and failure meaning**

- Success (including "nothing to remove" on a second run) exits 0.
- A missing `--bin-dir`/`--yes` is a usage error, exit `2`. A runtime/ownership
  refusal (bin-dir mismatch, Homebrew-shaped target, unclassified state) is
  exit `1`.
- A partial failure leaves the receipt intact describing the still-partially-
  present install; failure output names exactly which artifacts were and were
  not removed. No rollback is claimed.

### 4.6a `/remove.ps1` — receipt-oracle-only native-Windows removal

The PowerShell counterpart to `/remove.sh`; same receipt-is-the-only-oracle
contract, same ordered deletion, same non-goals.

**Preconditions**

- `-BinDir DIR -Yes`. Without `-Yes`, prints the exact planned deletions and
  makes no destination write.
- A `lingtai.tui.install/v1` receipt at `%USERPROFILE%\.lingtai-tui\install.json`
  whose `bin_dir` matches the supplied `-BinDir` exactly.

**Allowed writes, in order**

1. Delete the managed binaries (`lingtai-tui.exe`, `lingtai-portal.exe`).
2. Delete the receipt-pointed runtime venv.
3. Delete the receipt itself, last.

**Forbidden behavior**

- Same as §4.6: no filename-pattern sweep, no touching non-owned state, refuses
  a target outside the owned roots rather than partially removing it (there is
  no Homebrew concept on native Windows, but the same path-based refusal logic
  applies to a receipt pointing outside the owned roots).

**Success and failure meaning**

- Exit `0` means success, including "nothing to remove" on a second run.
- Exit-code asymmetry with `remove.sh` is intentional, not a defect:
  `remove.ps1` relies on PowerShell's own `param()` binding plus one `Fail`
  helper for every refusal path, so a missing `-BinDir` and every other
  refusal both exit `1` (documented in `remove.ps1`'s own `.NOTES`).
- A partial failure leaves the receipt intact; no rollback is claimed.

## Contract rules

Installation changes bytes and records ownership. Migration applies
release-specific state/schema instructions. They are separate decisions.

For TUI/Portal and kernel independently:

1. Identify current and target tags.
2. Enumerate every tag in `(current, target]`.
3. Read that product repository's exact tagged `migration/migration.md` in order.
4. Stop if any tag/file is missing, inaccessible, inconsistent, or out of order.
5. Complete required migration before refresh.

GitHub/Gitee fallback is valid only for the same product, same tag, and same
path, with matching tag targets/content.

## Contract tests

A change is incomplete unless the same candidate updates every affected layer:

1. this `CONTRACT.md`;
2. `skill.md` when public selection/guidance changed;
3. the owning executable asset;
4. its executable-local behavior-first maintenance rule;
5. `_headers` or routers when a public path/content type changed;
6. `.github/workflows/sync-installers.yml` when the set of mirrored files or
   their fetch/validation logic changed;
7. `scripts/test-lifecycle-mirror-parity.sh` when the set of mirrored files or
   their destination paths changed.

Bytes never change here directly: a behavior change to any of the eight mirrored
files is authored upstream in `Lingtai-AI/lingtai`, then mirrored by (6) and
proven by (7). A candidate that hand-edits mirrored bytes without an upstream
source is a defect, not a fix.

The acceptance test is the actual declared operation of the exact final candidate
in a brand-new isolated non-root Linux environment, using real precondition state
and inputs and observing postconditions or partial failure directly. Ordinary
install additionally uses an empty `HOME`, real network/artifact inputs, and proves
TUI, pip, pinned kernel distribution/import/version/physical provenance, and the
strict success receipt. Update, repair, verification, and development prove their
operation-specific state; verification also proves byte-for-byte read-only behavior;
removal proves the owned artifact set is actually gone, NOT-owned state actually
survives, idempotent re-run, and a real fault-injected partial-failure/retry.
Source grep, shims, fake commands, static assertions, and hermetic simulations are
not acceptance. Shell syntax, `--help`, citation inspection, and `git diff --check`
are maintenance diagnostics only.


## Maintenance

Before changing this component, read the repository-root `CONTRACT.md`, the
paired `ANATOMY.md`, and this contract. Keep all eight executable entrypoints,
the installation skill, both Anatomy/Contract pairs, real operation evidence,
the sync workflow, the parity script, and any affected public routing in the
same change. Validate the exact final candidate; do not use source text, a
mock, static assertion, shim, fake command, hermetic simulation, or
intermediate head as evidence for behavior it did not exercise.
