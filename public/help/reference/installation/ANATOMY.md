---
related_files:
  - public/help/reference/installation/CONTRACT.md
  - ANATOMY.md
  - public/install.sh
  - public/help/reference/installation/skill.md
  - public/_headers
  - public/help/reference/installation/assets/update.sh
  - public/help/reference/installation/assets/dev.sh
  - public/help/reference/installation/assets/fix.sh
  - public/help/reference/installation/assets/verify.sh
maintenance: |
  Keep related_files repo-relative, duplicate-free, and linked to real files.
  Keep this Anatomy reciprocal with its installation CONTRACT.md and with the
  root ANATOMY.md. Code is structural truth: update file/symbol/connections/state
  citations with executable changes, keep public guidance linked, and run each
  changed executable as a real operation on the exact final candidate.
---
# Public installation Anatomy

The public installation component is five standalone shell entrypoints plus one
progressively disclosed skill, one normative Contract, and real behavior evidence.

## Components

- `public/install.sh:912-995` `write_install_metadata` publishes the first strict
  success receipt only after postconditions; exclusive linking preserves a raced
  receipt.
- `public/install.sh:1179-1196` `ensure_runtime_pip` self-heals pip only inside the
  new owned venv via its interpreter's `ensurepip`, then selected uv scoped to
  that venv, followed by prefix/pip revalidation.
- `public/install.sh:1219-1279` `runtime_health_check` and its development counterpart
  bind `sys.prefix`, exact version, and physical module provenance.
- `public/install.sh:1281-1336` `ensure_runtime_venv` rejects existing state, creates
  one new owned runtime, proves pip, installs a pinned local kernel artifact, and
  proves final runtime health.
- `public/install.sh:1651-1721` `install_kernel_from_bundle` selects, verifies, and
  installs the exact pinned artifact by local path; only dependencies use the
  configured index.
- `public/install.sh:2157-2171` `validate_fresh_install_state` is the fail-closed
  first-install state gate.
- `public/help/reference/installation/assets/update.sh:22-105` is exact-artifact
  ordinary update after `--yes`.
- `public/help/reference/installation/assets/fix.sh:22-109` is read-only diagnosis
  plus explicit bounded new-runtime repair after `--apply --yes`.
- `public/help/reference/installation/assets/verify.sh:21-150` is read-only proof
  for one exact target/runtime/receipt.
- `public/help/reference/installation/assets/dev.sh:22-246` is explicit editable
  development composition after `--yes`.

## Connections

`public/skill.md` routes to the help router, which routes to the installation
skill. The skill selects an operation but never authorizes or executes it. Each
operation's standalone shell file enforces its own CLI and state boundary. All
five point maintainers to the repository and child Contracts in visible header
comments.

The root Contract governs this child; the child Contract owns operation, consent,
state, receipt, provenance, and failure promises. This Anatomy maps the real
files and symbols implementing those promises.

## Composition

Ordinary install resolves one exact official TUI release and pinned kernel
artifact, creates one new target/runtime, proves identity/import/provenance, then
publishes its first receipt. Successor operations are not modes inside
`install.sh`: update, development, repair, and verification remain standalone
assets with explicit exact inputs and consent.

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

## Notes

`--skip-python` / `--skip-venv` is the only ordinary TUI-only opt-out. It does not
promise later implicit runtime backfill. Ordinary install never adopts or repairs
existing state; `fix.sh` owns explicit repair. A receipt or `PASS` is emitted only
after the operation's full declared postconditions pass.
