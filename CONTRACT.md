---
name: component-contract-convention
contract_version: 1
related_files:
  - ANATOMY.md
  - public/help/reference/installation/CONTRACT.md
  - package.json
  - astro.config.mjs
  - scripts/test-architecture-documents.py
  - scripts/test-install-sh-kernel-pin.sh
maintenance: |
  This file is the normative root of the distributed code interface definition
  system and the contract-of-contract for lingtai-web. Keep the root ANATOMY.md
  reciprocal. Keep each governed child CONTRACT.md linked here exactly once,
  pointing back with root_contract: CONTRACT.md and paired with a co-located
  ANATOMY.md. Change architecture rules, schemas, maintenance contracts, public
  behavior, tests, and final-head acceptance evidence together. Revalidate every
  linked pair when this convention changes and bump contract_version for a
  breaking convention change.
---
# Component Contract Convention

## Design principles

These rules are normative for every lingtai-web change and pull request.

1. **Start from the real user path and its owning invariant.** Before editing,
   identify who reaches the surface, which path they execute or open, which state
   it reads or changes, and what observable promise must remain true. A convenient
   internal unit or mocked path is not automatically the product path.
2. **A final candidate needs real evidence.** Every PR MUST run at least one
   risk-matched critical-path acceptance against its exact final head. Static,
   mocked, fake-command, type, unit, or hermetic tests are useful but do not
   replace the real path they abstract. For public installation changes, the
   stricter child Contract requires a brand-new `HOME` ordinary install and
   direct proof of TUI, pip, pinned Python package, import/version/provenance, and
   the success receipt. Only explicit `--skip-python` may omit the runtime.
3. **Keep one public truth.** Pages, components, data, translations, public
   assets, executable comments, manuals, Contracts, Anatomies, and tests change
   together when they describe the same user-facing behavior. Do not repair a
   mismatch by silently weakening the normative promise.
4. **Receipts and success UI mean completed postconditions.** A receipt, `PASS`,
   successful build, or published page is never a progress marker. Partial
   failure stays explicit and retained state is reported honestly.
5. **Whole-diff and authorization discipline.** Review the complete base-to-head
   product surface, not only the last remediation patch. A passing gate does not
   authorize merge, release, deploy, publication, configuration/auth changes,
   deletion, cleanup, or another external side effect.
6. **Prefer the smallest earned mechanism.** Add validation that prevents a real
   regression; do not grow speculative schemas, stages, reviewers, or policy
   engines merely to make a process look complete.

## Purpose

**CONTRACT is the distributed code interface definition system.** A governed
architectural component keeps a `CONTRACT.md` beside the surface whose behavior,
state, errors, consent, ordering, and conformance evidence it owns. Contracts
form a graph from this repository root to the narrow promise relevant to a
change.

This file is the **contract of contract**: it defines repository-wide behavior,
child frontmatter/body/link rules, maintenance, and validation. The first
governed child is the public installation component at
[`public/help/reference/installation/CONTRACT.md`](public/help/reference/installation/CONTRACT.md).

[`ANATOMY.md`](ANATOMY.md) is the paired distributed code navigation system.
Anatomy says where code is and how it composes; Contract says how a layer may be
used and what it promises. They link to each other instead of duplicating their
jobs.

## Architecture foundation

lingtai-web is an Astro static site deployed through the Cloudflare adapter.
Pages compose layouts, components, typed data, content collections, and locale
translations. `public/` is copied to the deployed origin as public bytes; that
makes its shell scripts and agent-facing Markdown executable/public interfaces,
not incidental documentation.

The current repository does not claim an invented Core/Port/Adapter separation.
Its honest boundaries are:

- route/page composition under `src/pages/`;
- layouts and reusable presentation under `src/layouts/` and `src/components/`;
- release/tutorial/project/opportunity data under `src/data/`;
- content and content loading under `src/content/` and `src/lib/`;
- locale vocabulary under `src/i18n/`;
- public static and executable interfaces under `public/`;
- build/deploy composition in `astro.config.mjs`, `wrangler.jsonc`, and
  `package.json`;
- focused repository checks under `scripts/`.

A new governed child must own a coherent independently meaningful promise. A
folder, file count, or desire for symmetry does not earn an empty Contract. The
root Contract lists every governed child exactly once; its paired Anatomy maps
the real files and composition.

## Behavior

1. Before changing the repository, coding agents MUST read this root Contract
   and [`ANATOMY.md`](ANATOMY.md). Before changing a governed component, they
   MUST also read its paired child Contract and Anatomy.
2. Every PR MUST name the owning invariant, real user path, validation performed
   on the exact final candidate, and anything not exercised. No intermediate
   head, stale artifact, mocked command, or unrelated green build may be reported
   as final-head real acceptance.
3. Structural changes MUST update the relevant Anatomy. Behavioral, state,
   consent, failure, ordering, provenance, or postcondition changes MUST update
   the relevant Contract and tests. Public guidance and executable-local
   maintainer instructions MUST stay synchronized.
4. Agents MUST traverse YAML `related_files` as the single graph. Missing,
   stale, duplicate, unsafe, one-way, or orphaned edges are defects. Do not
   create a second component registry.
5. If code and Anatomy disagree, verify code and repair structural navigation.
   If implementation and Contract disagree, fail loud: the implementation is a
   defect unless an authorized product decision changes the promise.
6. Build, test, or receipt success does not expand external-side-effect
   authorization. Keep merge, deploy, release, publication, auth/config mutation,
   and deletion decisions separate and explicit.

## Frontmatter contract

The root Contract has exactly these YAML keys in this order:

1. `name`: `component-contract-convention`;
2. `contract_version`: positive integer;
3. `related_files`: non-empty, duplicate-free, safe repo-relative regular files;
4. `maintenance`: non-empty root maintenance statement.

It omits `root_contract` because it is the root.

Every governed child Contract has exactly these keys in order:

1. `name`: unique non-empty kebab-case component identity;
2. `contract_version`: positive integer;
3. `root_contract`: literal `CONTRACT.md`;
4. `related_files`: its paired Anatomy, structural parent Anatomy, public
   interfaces, manual/skill, focused tests, and directly relevant owners;
5. `maintenance`: a concise component maintenance statement preserving this
   root convention.

All paths use `/`, contain no `.` or `..` segments, resolve to ordinary files,
and are relative to repository root.

## Body contract

This root has these ten `##` sections once and in order:

1. `Design principles`
2. `Purpose`
3. `Architecture foundation`
4. `Behavior`
5. `Frontmatter contract`
6. `Body contract`
7. `Link semantics`
8. `Maintenance contract`
9. `Validation`
10. `Template`

A governed child has these seven `##` sections once and in order:

1. `Purpose`
2. `Behavior`
3. `Port`
4. `Adapters`
5. `Contract rules`
6. `Contract tests`
7. `Maintenance`

A specialized component may use descriptive `###` subsections inside that
shape. Contract bodies define behavior and evidence; they do not copy the paired
Anatomy's structural map or a manual's procedures.

## Link semantics

YAML `related_files` is the graph-wiring mechanism.

- Root `CONTRACT.md` and root `ANATOMY.md` list each other exactly once.
- Every governed child Contract appears exactly once in this root's
  `related_files`, points back with `root_contract: CONTRACT.md`, and lists its
  co-located paired Anatomy.
- The child Anatomy lists that Contract and its parent/root Anatomy. The root
  Anatomy lists the child Anatomy, making the structural parent/child edge
  reciprocal.
- Contract-to-contract links are reciprocal when one depends on the other's
  rules. Unrelated components do not copy promises or link merely for symmetry.
- A maintainer finding a pairing/ownership mismatch MUST report it and fail the
  architecture check; validation is not authorization to manufacture, move, or
  delete components.

## Maintenance contract

Every change assesses both distributed systems. Update Anatomy in the same
change when files, symbols, connections, composition, or state ownership move.
Update Contract and conformance evidence when behavior, consent, failure,
ordering, provenance, postconditions, or public interfaces change. If neither
changes, review may record that the pair was checked rather than manufacture
meaningless doc churn.

A breaking contract change makes a previously conforming caller, script,
maintainer, or public consumer no longer conform. Bump the affected
`contract_version` and update the implementation, paired Anatomy, guidance, and
tests together.

## Validation

`scripts/test-architecture-documents.py` checks the exact root/child frontmatter
key order, safe existing related files, reciprocal root and child twins,
parent/child Anatomy links, the child root pointer, source citation bounds, and
the visible `For coding-agent maintainers` block in all five public shell
entrypoints. Run it through `npm run test:architecture`.

`scripts/test-install-sh-kernel-pin.sh` owns the focused hermetic installation
contract checks. It does not replace the child Contract's final-head real
operation gate. Every affected executable also receives `bash -n`, `--help`, and
risk-matched real acceptance; the Astro product receives `npm run build` when
its rendered surface changes. Finish with `git diff --check` and whole-diff
review.

## Template

```markdown
---
name: <kebab-case-component-name>
contract_version: 1
root_contract: CONTRACT.md
related_files:
  - <repo-relative paired ANATOMY.md>
  - <repo-relative public or implementation file>
  - <repo-relative manual or skill>
  - <repo-relative focused test>
maintenance: |
  This component contract is governed by the root CONTRACT.md. Keep its paired
  Anatomy, implementation, public guidance, and conformance evidence synchronized.
---
# <Component name> contract

## Purpose
## Behavior
## Port
## Adapters
## Contract rules
## Contract tests
## Maintenance
```
