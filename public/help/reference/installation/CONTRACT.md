---
name: lingtai-public-installation
contract_version: 2
root_contract: CONTRACT.md
related_files:
  - ANATOMY.md
  - public/help/reference/installation/ANATOMY.md
  - public/install.sh
  - public/help/reference/installation/skill.md
  - public/_headers
  - public/help/reference/installation/assets/update.sh
  - public/help/reference/installation/assets/dev.sh
  - public/help/reference/installation/assets/fix.sh
  - public/help/reference/installation/assets/verify.sh
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
- `/help/reference/installation/assets/update.sh`
- `/help/reference/installation/assets/dev.sh`
- `/help/reference/installation/assets/fix.sh`
- `/help/reference/installation/assets/verify.sh`

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

Every entrypoint MUST preserve these invariants.

### 2.1 Explicit operation selection

1. Ordinary install is first-install-only.
2. Update, development, repair, and verification are separate standalone assets.
3. `/skill.md`, `/help/skill.md`, and the installation skill are guidance only.
   They MUST NOT infer or authorize mutation.
4. A missing child URL, unclassified state, conflicting receipt, redirected path,
   or ambiguous provenance is a stop condition.
5. No entrypoint downloads, sources, or executes another installation entrypoint.

### 2.2 Exact ownership

1. Paths supplied to maintenance assets are exact absolute paths.
2. The selected binary directory and `$HOME/.lingtai-tui` state MUST be ordinary
   owned paths, not redirected through a disallowed symlink.
3. A runtime interpreter MUST resolve to a virtual environment physically under
   `$HOME/.lingtai-tui/runtime`, and its `sys.prefix` MUST equal that selected
   environment.
4. An existing target is mutable only when a strict
   `lingtai.tui.install/v1` receipt owns that exact target and runtime.
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
2. `update.sh` and `dev.sh` require `--yes` before mutation.
3. `fix.sh` is read-only unless both `--apply` and `--yes` are present.
4. `verify.sh` is always read-only.
5. These entrypoints do not call LingTai `refresh`, merge, release, deploy, edit
   authentication/configuration, or publish a release.
6. Only process-owned scratch may be removed automatically. Failure is not
   permission to delete an existing target, receipt, runtime, or source checkout
   as rollback. `dev.sh` may run normal build tooling in the explicitly supplied
   checkouts, including generated dependency/build-tree writes.

### 2.5 Receipt publication

1. A successful operation records schema `lingtai.tui.install/v1`, schema version
   `1`, exact target ownership, provenance, and the state needed by its supported
   successor operations.
2. Fresh install publishes a mode-`0600` receipt by same-directory, exclusive,
   no-clobber creation. A raced receipt is preserved byte-for-byte.
3. Update and repair re-read and revalidate the prior receipt immediately before
   atomically replacing it. A changed receipt is an explicit partial failure.
4. Development writes one complete `dev-source` receipt only after build,
   install, identity, import, and provenance postconditions pass.
5. A receipt is evidence of completed postconditions, not a progress marker.

## Port

| Observed state | Allowed entrypoint | Why | Forbidden shortcut |
|---|---|---|---|
| Fresh: no `install.json`, no runtime root, and no managed target in the selected bin directory | `/install.sh` | Canonical ordinary first install | Do not use update/fix to manufacture ownership |
| Healthy ordinary receipt (`release-asset` or `source-build`) with matching target and runtime | `verify.sh`; then `update.sh` for an exact update | Ownership and runtime provenance are available | Do not rerun ordinary install; do not use dev implicitly |
| Strict ordinary receipt with a missing or broken old runtime | `fix.sh` diagnosis; then `fix.sh --apply --yes` with one new free runtime child | Repair can bind the prior receipt without executing the old runtime | Do not delete/reuse the old runtime or rerun ordinary install |
| Valid `dev-source` receipt and explicit Git checkouts | `verify.sh` or `dev.sh` | Editable provenance remains explicit | `update.sh` and `fix.sh` MUST reject it |
| Exact release interval needs schema/config migration | Tagged product `migration/migration.md` files | Migration history is product- and tag-owned | Do not use `main`, `latest`, another repo, or skip a tag |
| Receipt, target, runtime, or provenance is missing, conflicting, redirected, or otherwise unclassified | Stop and report the exact state | No executable owns an inferred recovery | Do not adopt, overwrite, auto-heal, or guess |

The existence of `$HOME/.lingtai-tui` as an ordinary directory alone does not
make a prior installation. Freshness is lost when an install receipt or runtime
root exists, or when a managed target already occupies the selected bin path.

`--skip-python` / `--skip-venv` is an explicit TUI-only ordinary-install opt-out.
Its receipt intentionally omits runtime/kernel fields. The runtime-dependent
update, repair, and verification assets do not promise to infer or backfill that
state; stop and choose an explicit supported plan rather than treating it as a
normal healthy ordinary runtime installation.

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
- No skill/helper download, source, or execution.

**Success and failure meaning**

- Success means the exact TUI identity, optional pinned runtime provenance, and
  exclusive receipt publication passed.
- A nonzero exit is not rollback. It may leave newly created target/runtime or
  dependency state, but MUST NOT claim success or replace pre-existing state.
  A later ordinary invocation sees that state and fails closed.

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
5. `_headers` or routers when a public path/content type changed.

The acceptance test is the actual declared operation of the exact final candidate
in a brand-new isolated non-root Linux environment, using real precondition state
and inputs and observing postconditions or partial failure directly. Ordinary
install additionally uses an empty `HOME`, real network/artifact inputs, and proves
TUI, pip, pinned kernel distribution/import/version/physical provenance, and the
strict success receipt. Update, repair, verification, and development prove their
operation-specific state; verification also proves byte-for-byte read-only behavior.
Source grep, shims, fake commands, static assertions, and hermetic simulations are
not acceptance. Shell syntax, `--help`, citation inspection, and `git diff --check`
are maintenance diagnostics only.


## Maintenance

Before changing this component, read the repository-root `CONTRACT.md`, the
paired `ANATOMY.md`, and this contract. Keep all five executable entrypoints,
the installation skill, both Anatomy/Contract pairs, real operation evidence, and
any affected public routing in the same change. Validate the exact final candidate;
do not use source text, a mock, static assertion, shim, fake command, hermetic
simulation, or intermediate head as evidence for behavior it did not exercise.
