---
related_files:
  - docs/release-mirror/CONTRACT.md
  - ANATOMY.md
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
  Keep related_files complete and reciprocal with the paired CONTRACT.md and
  root ANATOMY.md. Update verified line anchors when state validation,
  transaction phases, route composition, workflow serialization, key grammar,
  or the R2 binding changes.
---
# Latest-only release-mirror Anatomy

This component is the web-side latest-release transaction and serving boundary
for two allowlisted GitHub repositories. GitHub owns release authority; one R2
state object per repository selects one complete active generation and carries
exact crash-recoverable cleanup intent.

## Components

- **Receiving workflow** `.github/workflows/mirror-release-assets.yml:1-50`
  receives `release-asset-published` at lines 11-13, serializes one group per
  payload `source_repo` at lines 18-20, derives generation from workflow run
  identity at lines 34-36, and invokes the orchestrator once at lines 49-50.
- **Transaction orchestrator** `scripts/sync-latest-release.mjs:39-441` validates
  workflow input and official GitHub latest at lines 39-92; owns state-read,
  put-outcome, pending-recovery, and candidate-cleanup primitives at lines
  107-182; composes the prepare/upload/recheck/promote/retire transaction in
  `syncLatestRelease` at lines 184-313; and provides deterministic Wrangler,
  verifier, hardcoded GitHub, and exact-temp adapters at lines 315-441.
- **One-asset verifier/uploader** `scripts/sync-release-asset.sh:1-137` keeps the
  hardcoded repository/tag/generation/name/SHA/size checks, downloads one named
  public GitHub asset, independently checks size then SHA-256, and writes only
  its generation-scoped candidate key through one quoted override executable or
  the internal `npx --no-install wrangler` argv.
- **Shared state and route logic** `src/lib/release-mirror.mjs:1-266` defines the
  allowlist and schemas at lines 5-15; validates source/tag/name/SHA/size/release
  id/generation and derives state/generation/legacy keys at lines 40-108;
  validates named payloads and exact state/deletion intent at lines 111-224;
  and owns public projection plus legacy and active request selection at lines
  226-266.
- **Public latest adapter** `src/pages/dl/[owner]/[repo]/latest.json.ts:1-44`
  reads the deterministic state object, returns only the public latest
  projection, and makes missing/uninitialized/corrupt state a no-store 503.
- **Exact-tag asset adapter**
  `src/pages/dl/[owner]/[repo]/[tag]/[asset].ts:1-79` reads state before assets,
  permits one exact legacy read only when state is absent at lines 30-59, makes
  any present no-latest/corrupt state unavailable, then reads only the active
  manifest's pinned key and checks object size at lines 61-79.
- **Hermetic fixtures** `scripts/test-release-mirror-route.mjs:1-250`,
  `scripts/test-sync-latest-release.mjs:1-473`, and
  `scripts/test-sync-release-asset.sh:1-178` cover the shared state/selection,
  in-memory update, first-initialization handoff, post-deploy recovery, and the
  fake-curl/exact-executable fake-Wrangler verifier surfaces.
- **Binding template** `wrangler.jsonc:1-27` declares
  `RELEASE_MIRROR_BUCKET`; it does not create, initialize, or deploy the bucket.

## Connections

Publisher workflows in `Lingtai-AI/lingtai-kernel` and `Lingtai-AI/lingtai`
name already-uploaded assets in one dispatch. The receiving workflow supplies
payload fields to `sync-latest-release.mjs` but supplies generation from its own
run id/attempt. The orchestrator uses `src/lib/release-mirror.mjs` for the same
validation/key grammar trusted by both public routes, calls
`sync-release-asset.sh` once per validated asset, and uses only exact Wrangler
object get/put/delete operations against the binding's bucket.

Both routes import shared state logic rather than deriving active object keys
from an untrusted tag. `latest.json.ts` exposes a stripped metadata projection;
the exact-tag adapter uses the internal storage key and expected size while
keeping generation and deletion state private.

## Composition

After the state-aware route is public, ordinary synchronization composes as:

`repository_dispatch` -> per-repository workflow group -> validate and recover
old pending intent -> GitHub `releases/latest` check -> prepare exact candidate
intent -> verified generation uploads -> exact state reread -> second GitHub
latest check -> one state promotion -> exact old-generation/current-legacy
deletes -> pending-intent clear.

First initialization is instead a two-phase deployment handoff: the first
current-latest dispatch promotes the new generation but returns with its exact
named legacy keys still pending while the old route remains public; the
state-aware route is then published; one visible current-latest re-dispatch
recovers and clears those exact keys before any new upload. No other dispatch
may intervene between first promotion and the route switch.

Serving composes as:

`latest.json` -> state key read -> strict parse -> stripped no-store JSON;
`<tag>/<asset>` -> state key read -> strict parse -> active tag/name selection
-> pinned generation-key read -> size check -> no-store byte response.

Before the state object exists, the already-validated exact-tag request may
reach its one legacy key. State creation removes that edge permanently; a
present `latest: null` state is unavailable until first promotion. Therefore the
first dispatch runs while the old route remains public, promotes without deleting
legacy bytes, and returns with their exact names pending. Only after the
state-aware route is public may a visible current-latest re-dispatch recover that
intent. The normative Contract forbids any intervening dispatch because the two
route versions cannot both serve after state creation.

## State

Each allowlisted repository owns exactly one internal state object at
`releases/<owner>/<repo>/state.json`. `latest` is null before initialization or
contains one GitHub release id/tag, workflow generation, and nonempty asset
manifest with exact immutable storage keys. `pending_delete` is null or one
nonempty set of exact validated inactive keys. It is written before candidate
uploads, transferred to exact retirement keys in the same put that promotes the
candidate, and cleared only after idempotent deletes finish. On first
initialization, the promoted exact legacy intent deliberately survives until the
post-deploy current-latest re-dispatch performs that recovery.

Candidate bytes live at
`releases/<owner>/<repo>/objects/<tag>/<run-id>-<run-attempt>/<asset>`. Legacy
bootstrap bytes use the former `releases/<owner>/<repo>/<tag>/<asset>` shape but
are selected only while the state object is absent. Unknown historical legacy
objects are neither discovered nor deleted because no component lists the
bucket.

The workflow concurrency group is the supported per-repository single-writer
path. Strongly consistent R2 object operations make exact post-error rereads
meaningful, but the state object is not a general CAS lock and the two source
repositories do not share an atomic bundle. GitHub can replace its sole pending
run; when that drops current latest, the source release owner must observe and
re-send it because no scheduler or reconciler owns eventual delivery.

## Notes

The paired Contract is normative for authority, failure/status behavior,
bootstrap deployment order, cache limits, and the installer's bounded 404 retry
requirement. These files implement no installer change, source switch, database,
history, scheduler, bucket listing, deployment, or Cloudflare configuration
mutation. Fixture tests and an Astro build do not constitute live GitHub, R2,
Pages, initialization, or end-to-end installer evidence.
