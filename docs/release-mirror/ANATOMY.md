---
related_files:
  - docs/release-mirror/CONTRACT.md
  - ANATOMY.md
  - src/lib/release-mirror.mjs
  - src/pages/dl/[owner]/[repo]/[tag]/[asset].ts
  - src/pages/dl/[owner]/[repo]/latest.json.ts
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

This component serves GitHub release assets for download acceleration from two
allowlisted upstream repositories. It projects GitHub's authoritative latest
release into the strict installer metadata schema, serves verified R2 copies
when present, and routes an exact valid asset to its GitHub release URL when the
R2 copy has not been populated yet.

## Components

- **Receiving workflow** `.github/workflows/mirror-release-assets.yml:1-85`
  handles one `repository_dispatch` (`release-asset-published`) per finished
  publisher run and loops its `client_payload.assets` array.
- **Mirror script** `scripts/sync-release-asset.sh:1-136` mirrors
  exactly one asset: downloads it from `github.com/<repo>/releases/download/<tag>/<asset>`,
  re-verifies size/sha256 against the caller-supplied digest, then uploads to
  R2 via `wrangler r2 object put`.
- **Route logic** `src/lib/release-mirror.mjs` is the pure
  allowlist/tag/asset validation, R2-key derivation, and exact GitHub release
  asset URL derivation.
- **Asset route** `src/pages/dl/[owner]/[repo]/[tag]/[asset].ts` is the thin
  Astro/Cloudflare binding: it streams the R2 object when present and redirects
  an exact valid miss to the same tag/asset on GitHub Releases.
- **Latest route** `src/pages/dl/[owner]/[repo]/latest.json.ts` fetches GitHub's
  authoritative latest release and fail-closed projects its tag, release ID,
  asset names, sizes, and GitHub-provided SHA-256 digests into
  `lingtai.release_mirror.latest/v1`.
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
Independently, `/dl/<owner>/<repo>/latest.json` reads GitHub's official latest
release API and emits the installer metadata projection; it does not list R2 or
invent a tag.

## State

The only state this component owns is the R2 bucket's object set, keyed by
`releases/<owner>/<repo>/<tag>/<asset>`. This is NOT a long-lived-immutable
key: each sync independently re-verifies the downloaded bytes against that
invocation's own supplied digest before uploading, so a re-dispatch is a
verified overwrite, not a silent one — but a publisher can legitimately
re-dispatch the same tag/asset with a genuinely different digest (e.g. a
regenerated manifest file carrying a fresh timestamp), which changes the
object at that key. The route's short cache lifetime exists because of this.
The latest metadata response is computed from GitHub's release API and is not
stored as mutable R2 state. Tag-scoped asset keys remain the only mirror-owned
persistent addresses.

## Notes

This is a download-acceleration mirror, not a second release-publication
system: it has no authority to create, rename, or supersede a GitHub release,
and CONTRACT.md's Behavior section states the ordering that keeps it that way.
