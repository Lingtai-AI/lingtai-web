---
name: lingtai-release-mirror
contract_version: 2
root_contract: CONTRACT.md
related_files:
  - ANATOMY.md
  - docs/release-mirror/ANATOMY.md
  - src/lib/release-mirror.mjs
  - src/pages/dl/[owner]/[repo]/latest.json.ts
  - src/pages/dl/[owner]/[repo]/[tag]/[asset].ts
  - scripts/sync-latest-release.mjs
  - scripts/sync-release-asset.sh
  - scripts/test-sync-latest-release.mjs
  - scripts/test-sync-release-asset.sh
  - scripts/test-release-mirror-route.mjs
  - .github/workflows/mirror-release-assets.yml
  - wrangler.jsonc
maintenance: |
  This component contract is governed by the root CONTRACT.md. Keep it
  reciprocal with its ANATOMY.md and keep state, validation, transaction,
  serving, bootstrap, ordering, and failure claims synchronized across the
  routes, orchestrator, verifier, receiving workflow, and fixture tests.
---
# LingTai latest-only release-mirror contract

## Purpose

This component owns the web-side mirror used by the default installer to obtain
current release metadata and current release assets without GitHub. GitHub
remains the sole official release authority. The mirror stores and serves only
one active latest release per allowlisted source repository; it does not create,
edit, discover, or publish releases and does not make the two repositories an
atomic bundle.

The only allowed sources are `Lingtai-AI/lingtai-kernel` and
`Lingtai-AI/lingtai`. The public ports are:

- `GET /dl/<owner>/<repo>/latest.json`, the no-store active metadata projection;
- `GET /dl/<owner>/<repo>/<tag>/<asset>`, which serves that exact asset only when
  the tag and name are in the same repository's active manifest.

Neither route redirects or falls back to GitHub, and neither route or writer
lists GitHub release assets or the R2 bucket.

## Behavior

### Input and authority

1. The receiving workflow accepts only `repository_dispatch` event type
   `release-asset-published`. Its named payload is `source_repo`, an exact
   `vX.Y.Z` `tag`, and one nonempty, duplicate-free `assets` array whose entries
   contain exactly safe basename `name`, lowercase SHA-256 `sha256`, and positive
   integer `size`.
2. Publisher workflows send that event only after their own GitHub release
   upload succeeds. This component consumes only those named assets; it never
   enumerates a release or invents an asset.
3. `.github/workflows/mirror-release-assets.yml` serializes by `source_repo` with
   `cancel-in-progress: false`. Every run uses numeric
   `GITHUB_RUN_ID-GITHUB_RUN_ATTEMPT` as its generation; generation never comes
   from `client_payload`.
4. After recovering prior cleanup and again immediately before promotion, the
   orchestrator fetches the hardcoded public GitHub API endpoint
   `https://api.github.com/repos/<allowlisted-source>/releases/latest` with Node
   `fetch`. An inherited `GITHUB_TOKEN` is optional and never printed. Each
   response must identify a positive release id, exact requested tag, and
   `draft: false`, `prerelease: false`; the second response must retain the first
   release id. Failure or change prevents promotion.
5. Each named asset is downloaded from the hardcoded public GitHub release URL
   by `sync-release-asset.sh`, then independently checked against the payload's
   exact positive size and SHA-256 before any upload.

### State and transaction

Each source owns one deterministic strongly-consistent R2 state object at
`releases/<owner>/<repo>/state.json`:

```json
{
  "schema": "lingtai.release_mirror.state/v1",
  "source_repo": "Lingtai-AI/lingtai",
  "latest": {
    "release_id": 200,
    "tag": "v2.0.0",
    "generation": "34723594907-1",
    "assets": [
      {
        "name": "lingtai.zip",
        "sha256": "<64 lowercase hex>",
        "size": 123,
        "storage_key": "releases/Lingtai-AI/lingtai/objects/v2.0.0/34723594907-1/lingtai.zip"
      }
    ]
  },
  "pending_delete": null
}
```

`latest` and `pending_delete` may be null. Every present object and field is
strictly validated, with no extra fields. An active storage key must exactly
match its source, tag, generation, and asset. A pending key must be one exact,
unique, grammar-validated inactive generation key or legacy tag-scoped key under
the same allowlisted repository. A prefix, arbitrary key, cross-repository key,
or active key never authorizes deletion.

One serialized transaction executes in this order:

1. validate the entire dispatch before an R2 write;
2. read and validate state; if `pending_delete` exists, idempotently delete only
   those exact keys and clear the intent before checking whether this dispatch
   is still latest;
3. check official GitHub latest;
4. derive immutable candidate keys
   `releases/<source>/objects/<tag>/<generation>/<asset>`, then atomically write
   unchanged old `latest` plus `pending_delete.keys` containing every candidate
   key before uploading;
5. download, size-check, hash-check, and upload every named asset;
6. reread state and require exact equality with the prepared state, then recheck
   official GitHub latest and its release id;
7. promote in one state-object put to the complete candidate manifest, with
   `pending_delete.keys` equal to the prior active generation's exact keys plus
   the candidate tag's exact named legacy keys;
8. when the transaction began without an active latest, preserve that promoted
   exact named-legacy intent and return under the two-phase bootstrap handoff
   below; otherwise delete the exact inactive keys and atomically clear
   `pending_delete`.

The candidate generation is disjoint from active bytes, including a same-tag
rerun with changed digests. All candidate uploads finish before the one-object
promotion. The promoted manifest is complete or the old manifest remains
active; there is no partially promoted asset list.

The persisted deletion intent makes crash and timeout recovery idempotent. On an
unacknowledged state put, the orchestrator rereads strongly-consistent state and
acts only on exact validated equality: desired candidate active enters the same
post-promotion handling (preserving first-initialization legacy intent or
finishing ordinary retirement); old active plus exact candidate pending means
clean only that candidate; unreadable or any other state stops without deletion.
A failed process attempts the same safe recovery, but never manufactures success.

This protocol relies on R2/Workers' strongly globally consistent object
put/update/delete behavior and on the per-repository Actions concurrency group
as the supported single-writer path. It is not a general compare-and-swap fence,
database, history, queue, scheduler, or cross-system transaction with GitHub.
GitHub Actions may retain only one pending run; official-latest revalidation
ensures a stale retained run cannot promote. It does not restore a newer
current-release dispatch that GitHub discarded from the pending slot. The source
release owner must treat that visible dropped/replaced run as incomplete mirror
delivery and explicitly re-send the current GitHub-latest dispatch; there is no
scheduler or background reconciler.

### Serving and bootstrap

`latest.json` reads only the deterministic state object, validates it, and
returns `lingtai.release_mirror.latest/v1` with source repository, release id,
tag, and each asset's name/SHA-256/size. It strips generation, storage keys, and
pending deletion intent. It returns 404 for a disallowed repository and 503 for
an absent binding or missing, uninitialized, corrupt, or no-latest state.
Successful metadata is `application/json` with `Cache-Control: no-store`.

The exact-tag route validates the path, reads and validates state, requires the
requested tag and asset in `latest`, reads only its pinned `storage_key`, and
requires the stored object's byte size to equal the manifest. Old tags, pending
candidates, retired generations, and unknown assets are 404. Missing/corrupt
active state, a missing/corrupt active object, or transport failure is a loud
503. Successful asset responses use `Cache-Control: no-store`.

There is one narrow rollout bridge for the currently deployed legacy
`releases/<source>/<tag>/<asset>` keys. **Only while the state object is absent**
the exact-tag route may read the validated request's one legacy key. Any present
state, including valid `latest: null`, permanently disables legacy reads; a
no-latest or corrupt state is a no-store 503. The protocol cannot infer, list,
or delete unknown historical inventory.

Initial migration is an explicit two-phase handoff. While the old route still
serves legacy bytes, the first current-latest dispatch prepares and uploads the
new generation, promotes it, then returns with only that dispatch's exact named
legacy keys retained in `pending_delete`; it must not delete or clear them. The
state-aware route is then made public and serves the promoted generation. Only
a visible post-deploy re-dispatch of current latest may recover those exact
legacy deletes and clear the intent before continuing. No further dispatch may
run between first promotion and the public route switch. This ordering keeps the
old route readable before deployment and the new route readable afterward; if
it cannot be guaranteed, deployment stops rather than widening the bootstrap or
accepting an outage. `latest.json` is 503 only before first promotion.

`no-store` prevents new cache reuse as synchronization, but deployment cannot
recall bytes cached under the older route contract. A caller can also fetch old
metadata immediately before promotion and then race retirement. The installer
repository must own one bounded metadata refetch/retry when the mirror returns
404; this web change does not modify that consumer and does not claim atomicity
between two HTTP requests or between GitHub's latest pointer and R2.

## Port

| Observed state | Allowed entrypoint/result | Forbidden shortcut |
|---|---|---|
| Valid publisher payload for an allowlisted source | One `sync-latest-release.mjs` transaction under per-repo workflow serialization | No per-asset workflow loop, payload generation, listing, schedule, DB, or queue |
| Existing exact pending deletion intent | Recover it before even rejecting a stale new tag | No prefix deletion or cleanup conditioned on the new event being current |
| Candidate not yet promoted | Old `latest` remains the only active manifest | No overwrite of active keys or partial pointer update |
| Valid active state and matching tag/asset | Read exactly the manifest's generation-scoped storage key | No derived legacy read after activation and no GitHub fallback |
| Valid active state but old/unknown tag or asset | 404 | No serving a pending or retiring object |
| Disallowed repository or invalid request path | 404 | No arbitrary repository, traversal, redirect, or proxy |
| Missing binding or unusable authoritative state/object | 503 | No fake metadata, stale fallback, or hidden transport failure |

## Adapters

### `scripts/sync-latest-release.mjs`

Owns payload validation, prior recovery, both official-latest checks, prepared
intent, verified upload calls, exact state reread, one-put promotion, retirement,
and state-put acknowledgement recovery. Its R2 adapter uses deterministic
Wrangler object get/put/delete arguments and process-owned temporary files. It
never invokes an R2 list command or prints inherited credentials.

### `scripts/sync-release-asset.sh`

Mirrors exactly one named asset to its required generation-scoped key. It retains
the hardcoded source allowlist and public GitHub download URL, rejects unsafe
repo/tag/generation/name/SHA/size before transport, downloads to an exact
process-owned temporary directory, verifies nonempty bytes and exact size before
SHA-256, and calls Wrangler only after both checks pass.

### Public route adapters

`src/pages/dl/[owner]/[repo]/latest.json.ts` and
`src/pages/dl/[owner]/[repo]/[tag]/[asset].ts` are dynamic Astro/Cloudflare
adapters over `src/lib/release-mirror.mjs`. Their only storage dependency is the
`RELEASE_MIRROR_BUCKET` binding declared in `wrangler.jsonc`; configuration and
provisioning are external deployment gates, not actions these routes perform.

## Contract rules

Changing the allowlist, payload, state schema, public latest schema, key grammar,
transaction order, bootstrap boundary, R2 binding, route status/cache behavior,
or dispatch event is a breaking change. Update this Contract, paired Anatomy,
shared validation, routes, orchestrator, verifier, workflow, and fixtures in one
cohesive change. Do not add source switches, compatibility settings, installer
logic, release entries, geography behavior, bucket listing, schedules, generic
state machinery, or unrelated cleanup at this owning layer.

## Contract tests

- `node scripts/test-release-mirror-route.mjs` is LOCAL/hermetic pure coverage of
  allowlist/tag/name/SHA/size/generation validation, exact state and deletion-key
  parsing, bootstrap boundary, public projection, and active-only selection.
- `node scripts/test-sync-latest-release.mjs` is LOCAL/hermetic in-memory coverage
  of transaction ordering, stale/race/failure recovery, same-tag generations,
  exact retirement, unacknowledged puts, hardcoded GitHub API use, and
  token-safe output. Its GitHub, upload, and R2 operations are fakes.
- `scripts/test-sync-release-asset.sh` is LOCAL/hermetic fixture coverage using a
  fake `curl` and fake Wrangler to prove download/size/SHA/upload ordering and
  arguments.
- `npm run build`, Contract/Anatomy graph checks, and `git diff --check` are
  required diagnostics for the exact final candidate.

These fixtures and build do not prove GitHub availability, real R2 behavior,
Cloudflare/Pages deployment, route behavior on a deployed Worker, initialization,
mainland reachability, or installer retry behavior. Those remain explicit
integration/deployment gates; no live proof is claimed by this change.

## Maintenance

Before changing this component, read root `CONTRACT.md`/`ANATOMY.md` and this
paired Contract/Anatomy. Keep the source allowlist, payload validation,
generation/state/key grammar, transaction order, deletion authority, serving
semantics, bootstrap activation order, and failure meanings synchronized.
Validate the whole final diff and report unexercised real operations honestly;
test or build success does not authorize configuration, deployment, release, or
cleanup side effects.
