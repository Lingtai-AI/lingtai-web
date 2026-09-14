---
related_files:
  - docs/release-mirror/CONTRACT.md
  - ANATOMY.md
  - src/lib/release-mirror.mjs
  - src/pages/dl/[owner]/[repo]/[tag]/[asset].ts
  - src/pages/dl/[owner]/[repo]/latest.json.ts
  - scripts/sync-release-asset.sh
  - scripts/sync-release-latest.sh
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

This component serves GitHub release assets for download acceleration from two
allowlisted upstream repositories. It projects GitHub's authoritative latest
release into the strict installer metadata schema, serves verified R2 copies
when present, and routes an exact valid asset to its GitHub release URL when the
R2 copy has not been populated yet.

## Components

- **Receiving workflow** `.github/workflows/mirror-release-assets.yml`
  handles one `repository_dispatch` (`release-asset-published`) per finished
  publisher run, mirrors every declared asset, then publishes latest metadata.
- **Asset sync** `scripts/sync-release-asset.sh` mirrors one asset after
  re-verifying its size and SHA-256.
- **Latest sync** `scripts/sync-release-latest.sh` authenticates to GitHub with
  the workflow token, verifies the dispatch tag/release ID and complete asset
  records, then writes `releases/<owner>/<repo>/latest.json` only after all
  asset syncs succeed.
- **Route logic** `src/lib/release-mirror.mjs` is the pure
  allowlist/tag/asset validation, R2-key derivation, and exact GitHub release
  asset URL derivation.
- **Asset route** `src/pages/dl/[owner]/[repo]/[tag]/[asset].ts` is the thin
  Astro/Cloudflare binding: it streams the R2 object when present and redirects
  an exact valid miss to the same tag/asset on GitHub Releases.
- **Latest route** `src/pages/dl/[owner]/[repo]/latest.json.ts` serves the
  publisher-validated `releases/<owner>/<repo>/latest.json` R2 object and never
  performs a per-request GitHub API lookup.
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

Asset publication remains `repository_dispatch` → receiving workflow →
`sync-release-asset.sh` → R2. At request time, the asset route reads that exact
object and uses the validated GitHub release URL only when the object is absent.
After every asset sync succeeds, `sync-release-latest.sh` validates the release
through GitHub's authenticated API and atomically replaces the repo-scoped R2
latest metadata object. `/dl/<owner>/<repo>/latest.json` reads only that object.

## State

The only state this component owns is the R2 bucket's object set, keyed by
`releases/<owner>/<repo>/<tag>/<asset>`. This is NOT a long-lived-immutable
key: each sync independently re-verifies the downloaded bytes against that
invocation's own supplied digest before uploading, so a re-dispatch is a
verified overwrite, not a silent one — but a publisher can legitimately
re-dispatch the same tag/asset with a genuinely different digest (e.g. a
regenerated manifest file carrying a fresh timestamp), which changes the
object at that key. The route's short cache lifetime exists because of this.
R2 owns both tag-scoped asset keys and one mutable, repo-scoped `latest.json`
object per allowlisted source. The latest object is published last, so it never
announces a dispatch whose asset loop failed partway.

## Notes

This is a download-acceleration mirror, not a second release-publication
system: it has no authority to create, rename, or supersede a GitHub release,
and CONTRACT.md's Behavior section states the ordering that keeps it that way.
