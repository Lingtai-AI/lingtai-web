---
name: lingtai-release-mirror
contract_version: 1
root_contract: CONTRACT.md
related_files:
  - ANATOMY.md
  - docs/release-mirror/ANATOMY.md
  - src/lib/release-mirror.mjs
  - src/pages/dl/[owner]/[repo]/[tag]/[asset].ts
  - scripts/sync-release-asset.sh
  - .github/workflows/mirror-release-assets.yml
  - wrangler.jsonc
maintenance: |
  This component contract is governed by the root CONTRACT.md. Keep it
  reciprocal with its ANATOMY.md, keep the allowlist/ordering/failure rules
  synchronized with the mirror script and the receiving workflow, and update
  it whenever a new upstream repo, object-key scheme, or binding name is
  authorized.
---
# LingTai release-mirror download route contract

## Purpose

This is the normative contract for `lingtai.ai/dl/<owner>/<repo>/<tag>/<asset>`:
a download-acceleration mirror intended for mainland-China users, serving GitHub release assets for
the two actual upstream repositories, `Lingtai-AI/lingtai-kernel` and
`Lingtai-AI/lingtai`. GitHub remains the sole official release authority; this
component never creates, edits, or supersedes a release, and it never selects
a version on the user's behalf. It exists only to shorten the network path for
bytes GitHub has already published, for callers (such as `install.sh`'s
mirror source, see the TUI repository's own contract for that caller's rules)
that choose to use it.

## Behavior

1. An asset becomes mirrorable only after its publisher workflow's own upload
   to the GitHub release has already succeeded. `Lingtai-AI/lingtai-kernel`'s
   `wheels.yml` `release-manifest` job and `Lingtai-AI/lingtai`'s
   `release.yml` `windows-release` job own the exact dispatch point; this
   repository never listens to `release.published` directly, because a
   release can exist before its assets finish uploading.
2. `.github/workflows/mirror-release-assets.yml` accepts exactly one
   `repository_dispatch` event type (`release-asset-published`) and processes
   only the assets named in that event's own payload; it never lists a
   release's assets itself and never discovers new tags on a schedule.
3. `scripts/sync-release-asset.sh` re-downloads each named asset directly from
   `github.com/<repo>/releases/download/<tag>/<asset>` and independently
   re-verifies its size (when supplied) and sha256 against the digest the
   dispatch payload carries — a digest the publisher already computed from
   its own release manifest, never re-derived by this script from a
   possibly-truncated download. A mismatch or incomplete download is rejected
   before any upload is attempted; there is no partial or best-effort upload.
4. The object key is `releases/<owner>/<repo>/<tag>/<asset>` — tag-scoped, not
   a promise of long-lived byte-identity. Each sync independently re-verifies
   the downloaded bytes against that invocation's own supplied digest before
   uploading, so a re-sync of the same key is a verified overwrite, not a
   silent/unverified one — but if a publisher re-dispatches the same tag/asset
   with a genuinely different digest (e.g. a regenerated manifest file with a
   fresh timestamp), the object at that key changes. The route's cache
   lifetime (`Cache-Control`) is short precisely because this key is not
   guaranteed immutable; it is never a silent version change to a *different
   release*, only a possible byte change within the same tag's own re-sync.
5. `src/pages/dl/[owner]/[repo]/[tag]/[asset].ts` serves exactly the object at
   that derived key, or 404 when the repo/tag/asset shape is invalid or the
   object does not exist, or 503 when the `RELEASE_MIRROR_BUCKET` binding
   itself is absent (unconfigured deployment). It never redirects to GitHub,
   never serves a different tag's bytes, and never lists the bucket.
6. This component performs no merge, deploy, release, or publication action
   itself; the deployment prerequisites in `wrangler.jsonc` and this
   workflow's required secrets/vars (`CLOUDFLARE_API_TOKEN`,
   `CLOUDFLARE_ACCOUNT_ID`, `vars.RELEASE_MIRROR_BUCKET`) are explicit
   configuration gates, not actions this repository's CI performs.

## Port

| Observed state | Allowed entrypoint | Why | Forbidden shortcut |
|---|---|---|---|
| Publisher workflow's own asset upload just succeeded | Publisher fires `repository_dispatch: release-asset-published` with the exact asset name/sha256/size | Mirrors only bytes GitHub has already accepted | Do not dispatch on `release.published` before assets are uploaded |
| Valid dispatch payload for an allowlisted repo/tag/asset | `scripts/sync-release-asset.sh` (one call per asset) | Re-verifies bytes independently before upload | Do not trust the payload's digest without re-hashing the download |
| Caller requests `/dl/<owner>/<repo>/<tag>/<asset>` | Route adapter `bucket.get` on the derived key | One exact key in, one exact object out | Do not list the bucket or guess a nearby key |
| `owner/repo` not in the allowlist, or `tag`/`asset` fails validation | 404 | No arbitrary-repo mirroring, no path traversal | Do not proxy to GitHub as a fallback from this route |
| `RELEASE_MIRROR_BUCKET` binding absent | 503 | Honest "not deployed yet", not a silent empty response | Do not fabricate a redirect or a fake success |

## Adapters

### `scripts/sync-release-asset.sh`

**Preconditions:** `SOURCE_REPO` in the hardcoded allowlist; `TAG` matches
`vX.Y.Z`; `ASSET_NAME` is a safe basename; `EXPECTED_SHA256` is 64 lowercase
hex characters; `RELEASE_MIRROR_BUCKET` is set.

**Allowed writes:** one R2 object at `releases/<SOURCE_REPO>/<TAG>/<ASSET_NAME>`,
written only after the downloaded bytes independently match the expected
size/sha256.

**Failure meaning:** any validation, download, or verification failure exits
nonzero before `wrangler r2 object put` runs; no partial or corrupt object is
ever uploaded. An upload failure (network/auth/bucket-missing) also exits
nonzero and is visible as a failed GitHub Actions run, not a silently skipped
mirror.

### `src/pages/dl/[owner]/[repo]/[tag]/[asset].ts`

**Preconditions:** none beyond an HTTP GET; all validation happens inside the
handler via `src/lib/release-mirror.mjs`.

**Allowed reads:** exactly one `bucket.get(key)` call per request, for the key
derived from the request's own path params.

**Failure meaning:** 404 for any invalid or unmirrored request; 503 when the
binding itself is missing. The handler itself never fabricates a redirect,
a fake success, or a different tag's bytes as a fallback; it does not claim
that an unexpected platform-level error (e.g. R2 unavailable) can never
surface as a generic 5xx — that is an honest transport failure, not a
disguised success.

## Contract rules

Changing the allowlist, the object-key scheme, the R2 binding name, or the
dispatch event/payload shape is a breaking change to this contract and MUST
update, in the same change: this file, `docs/release-mirror/ANATOMY.md`,
`scripts/sync-release-asset.sh`, `src/lib/release-mirror.mjs`,
`src/pages/dl/[owner]/[repo]/[tag]/[asset].ts`,
`.github/workflows/mirror-release-assets.yml`, and `wrangler.jsonc`. The
publisher-side dispatch step lives in the other two repositories and is
governed by their own contracts, not this one; this contract only defines
what this repository promises once it receives a well-formed dispatch.

## Contract tests

`scripts/test-sync-release-asset.sh` (LOCAL/fixture: fake `curl` transport,
fake `wrangler` recording its invocation — proves validation,
download-then-verify ordering, and upload-argument correctness, not real
`github.com`/Cloudflare reachability) and `scripts/test-release-mirror-route.mjs`
(LOCAL/fixture: pure-function unit tests of `src/lib/release-mirror.mjs`) are
the automated acceptance for this component. The route adapter's actual
Cloudflare/Astro wiring (the `cloudflare:workers` binding read, `prerender =
false`, and the real HTTP response) was additionally proven manually against
a local Miniflare-simulated R2 bucket (`wrangler dev` + `wrangler r2 object
put --local`, real `curl` against `localhost`, byte-for-byte diff against the
fixture) — LOCAL, not a live Cloudflare/mainland proof. Real production R2
provisioning, secrets, and mainland-reachability acceptance remain an
explicit pending deployment gate (see `wrangler.jsonc`), not something this
PR claims to have exercised.

## Maintenance

Before changing this component, read the repository-root `CONTRACT.md`, the
paired `ANATOMY.md`, and this contract. Keep the allowlist, dispatch payload
shape, object-key scheme, and failure meaning synchronized across the script,
the route, the workflow, and this document in the same change.
