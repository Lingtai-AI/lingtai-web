---
related_files:
  - docs/release-mirror/CONTRACT.md
  - ANATOMY.md
  - src/lib/release-mirror.mjs
  - src/pages/dl/[owner]/[repo]/[tag]/[asset].ts
  - scripts/sync-release-asset.sh
  - scripts/test-sync-release-asset.sh
  - scripts/test-release-mirror-route.mjs
  - .github/workflows/mirror-release-assets.yml
  - wrangler.jsonc
maintenance: |
  Keep related_files complete and reciprocal with the paired CONTRACT.md and
  root ANATOMY.md. Update this file when the object-key scheme, the receiving
  workflow, or the R2 binding name changes; update CONTRACT.md when the
  behavior, allowlist, or failure meaning changes.
---
# Release-mirror download route Anatomy

This component serves a copy of GitHub release assets for download acceleration from
two allowlisted upstream repositories. It never discovers, lists, or invents
a release; it only re-serves bytes a publisher workflow already uploaded to
GitHub and this component already re-verified and copied into R2.

## Components

- **Receiving workflow** `.github/workflows/mirror-release-assets.yml:1-85`
  handles one `repository_dispatch` (`release-asset-published`) per finished
  publisher run and loops its `client_payload.assets` array.
- **Mirror script** `scripts/sync-release-asset.sh:1-136` mirrors
  exactly one asset: downloads it from `github.com/<repo>/releases/download/<tag>/<asset>`,
  re-verifies size/sha256 against the caller-supplied digest, then uploads to
  R2 via `wrangler r2 object put`.
- **Route logic** `src/lib/release-mirror.mjs:1-59` is the pure
  allowlist/tag/asset validation and R2-key derivation, framework-free so it
  is directly unit-testable.
- **Route adapter** `src/pages/dl/[owner]/[repo]/[tag]/[asset].ts:1-53` is the thin
  Astro/Cloudflare binding: `prerender = false`, reads the
  `RELEASE_MIRROR_BUCKET` R2 binding via `cloudflare:workers`' `env`, and
  streams the object or returns 404/503.
- **Bindings template** `wrangler.jsonc` declares the
  `RELEASE_MIRROR_BUCKET` R2 binding (`bucket_name: "lingtai-release-mirror"`)
  as a deployment prerequisite, not a live resource created by this repo's CI.

## Connections

Publisher workflows in `Lingtai-AI/lingtai-kernel` (`wheels.yml`) and
`Lingtai-AI/lingtai` (`release.yml`) dispatch to the receiving workflow above
AFTER their own asset upload succeeds (see CONTRACT.md `## Behavior` for the
exact hook points, which live in those other repositories, not here). The
route adapter is the only reader of the R2 bucket the mirror script writes;
nothing else in this repository touches that bucket.

## Composition

`repository_dispatch` → receiving workflow → `sync-release-asset.sh` (one
call per asset) → R2 object at `releases/<owner>/<repo>/<tag>/<asset>` →
route adapter `bucket.get(key)` → HTTP response. Each stage only ever
consumes the exact key/digest the previous stage already verified; there is
no independent "latest" resolution or listing at any stage.

## State

The only state this component owns is the R2 bucket's object set, keyed by
`releases/<owner>/<repo>/<tag>/<asset>`. This is NOT a long-lived-immutable
key: each sync independently re-verifies the downloaded bytes against that
invocation's own supplied digest before uploading, so a re-dispatch is a
verified overwrite, not a silent one — but a publisher can legitimately
re-dispatch the same tag/asset with a genuinely different digest (e.g. a
regenerated manifest file carrying a fresh timestamp), which changes the
object at that key. The route's short cache lifetime exists because of this.
There is no separate manifest, index, or "latest" pointer in this repository;
the tag-scoped key is the sole address.

## Notes

This is a download-acceleration mirror, not a second release-publication
system: it has no authority to create, rename, or supersede a GitHub release,
and CONTRACT.md's Behavior section states the ordering that keeps it that way.
