---
name: lingtai-installation
description: Route ordinary installation and explicit installation maintenance assets.
---

# LingTai installation

## Normative contract

Read the [Contract](https://lingtai.ai/help/reference/installation/CONTRACT.md)
and paired [Anatomy](https://lingtai.ai/help/reference/installation/ANATOMY.md)
before choosing or maintaining an entrypoint. The Contract fixes state classes, ownership,
provenance, allowed writes, postconditions, and partial-failure meaning for this
surface. If the contract, this guidance, an executable, or its tests disagree,
stop and report the drift instead of inferring a more permissive operation.

## Ordinary install

`https://lingtai.ai/install.sh` is the canonical ordinary official-install happy
path. It installs one exact TUI release, verifies release provenance and the
pinned kernel artifact, checks the selected target and runtime ownership, and
writes metadata only after binary/runtime postconditions pass.

```sh
curl -fsSL https://lingtai.ai/install.sh | bash
```

The ordinary path is first-install-only: it does **not** adopt, overwrite, or
silently repair an existing target. It does **not** download, source, or execute
this skill or any helper asset. `--version` must be an exact `vX.Y.Z` official
release. `--from-source` only selects the source-build fallback for that exact
official release; arbitrary `--ref` development work is handed off to
`assets/dev.sh` with exit status 2.

## Native Windows install

`https://lingtai.ai/install.ps1` is the canonical ordinary official-install happy
path for native Windows (PowerShell 5.1 and PowerShell 7+). It parses and runs
identically under both editions and is the PowerShell counterpart to
`install.sh`: it resolves one exact TUI release, verifies the release's bundle
manifest and archive checksum, verifies the staged `lingtai-tui.exe` reports the
resolved version, and provisions the pinned managed Python runtime before
writing any success metadata.

```powershell
irm https://lingtai.ai/install.ps1 | iex
```

Like the POSIX path, ordinary install is first-install-only, never falls back to
installing LingTai by package name, and only writes its receipt after binary and
runtime postconditions pass. `-SkipVenv` remains the explicit TUI-only opt-out
that omits the managed runtime and its receipt fields; it is not the default
public path. WSL2 with `/install.sh` remains a supported alternative for users
who prefer a Unix-like terminal on Windows.

## Choose an explicit asset

Each asset is a standalone, directly fetchable CLI. Read its `--help`, supply
absolute exact paths, review its plan, and provide its explicit authorization
flag before mutation. Skill prose is not a safety mechanism.

- **Healthy exact update** —
  [`assets/update.sh`](https://lingtai.ai/help/reference/installation/assets/update.sh).
  Requires an existing ordinary owned target, exact TUI archive and kernel
  artifact inputs plus their SHA-256 values, `--yes`, and an executable runtime
  launcher under the owned runtime root. A normal venv `bin/python` symlink is
  accepted only when its `sys.prefix` resolves to the selected physical venv;
  dev-source receipts are rejected. The pinned kernel input is copied to a
  recognized `.whl` filename before pip is called. Downloads, checksums, archive
  safety, unique-binary, exact identity, and receipt checks finish before
  mutation. Kernel/TUI/receipt phases are explicit and a failure reports
  possible partial changes; no rollback is claimed.
- **Developer checkout** —
  [`assets/dev.sh`](https://lingtai.ai/help/reference/installation/assets/dev.sh).
  Requires explicit TUI/kernel checkout paths, an owned target, `--yes`, and
  declared source/runtime provenance. It builds editable development state only.
  After all postconditions it writes a complete `lingtai.tui.install/v1`
  receipt atomically, including canonical runtime/source paths, commits, and the
  observed kernel version. JSON is serialized by the selected runtime.
- **Repair** —
  [`assets/fix.sh`](https://lingtai.ai/help/reference/installation/assets/fix.sh).
  Defaults to a read-only diagnosis. `--apply --yes` requires one explicitly
  named free runtime directory directly under the owned runtime root, binds the
  prior ordinary receipt/provenance, and creates no replacement over occupied
  state. It uses the required `python3` bootstrap only to parse the old receipt
  and create the new venv; a missing or broken old runtime is never executed.
  The pinned kernel input is passed to pip as a `.whl` path, and its observed
  `lingtai.__version__` must exactly match the prior receipt's `kernel_version`
  before the runtime pointer can change. A venv/install/postcondition failure
  names the possible partial directory and never claims deletion or rollback.
- **Read-only receipt** —
  [`assets/verify.sh`](https://lingtai.ai/help/reference/installation/assets/verify.sh).
  Checks release and dev-source receipts structurally through the selected
  runtime. `sys.prefix` remains bound to the selected venv; ordinary imports
  must be physically inside it, while editable imports must be physically under
  the metadata-declared kernel source. TUI output must contain exactly one
  release identity token or standalone `dev`, matching the receipt; the observed
  `lingtai.__version__` must exactly match `kernel_version`.

All mutating assets independently validate exact target ownership, metadata
provenance, authorization, and postconditions. Assets do not call `refresh`,
merge, release, deploy, or source `install.sh`.
