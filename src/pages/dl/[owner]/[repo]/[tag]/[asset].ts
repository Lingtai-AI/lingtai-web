// Serves one mirrored GitHub release asset out of the R2 download-acceleration
// bucket. Read docs/release-mirror/CONTRACT.md and docs/release-mirror/ANATOMY.md before
// changing this route, scripts/sync-release-asset.sh, or
// .github/workflows/mirror-release-assets.yml -- the three must stay in sync.
//
// This route is a thin Cloudflare/Astro binding adapter; the actual repo/tag/
// asset validation and key derivation live in src/lib/release-mirror.mjs so
// they can be unit-tested without an Astro/Cloudflare runtime (see
// scripts/test-release-mirror-route.mjs).
export const prerender = false;

import type { APIRoute } from 'astro';
// Astro 6 + @astrojs/cloudflare removed `Astro.locals.runtime.env`; bindings
// are read from the Workers runtime module directly.
import { env } from 'cloudflare:workers';
import { resolveDownloadRequest } from '../../../../../lib/release-mirror.mjs';

export const GET: APIRoute = async ({ params }) => {
  const resolved = resolveDownloadRequest(params as Record<string, string | undefined>);
  if (!resolved.ok) {
    return new Response(resolved.body, { status: resolved.status });
  }

  // Deployment prerequisite: RELEASE_MIRROR_BUCKET must be bound in
  // wrangler.jsonc (r2_buckets) with a real bucket_name before this can ever
  // return anything but 503. That binding is a template in this PR, not a
  // live provisioning action.
  const bucket = (env as unknown as { RELEASE_MIRROR_BUCKET?: R2Bucket }).RELEASE_MIRROR_BUCKET;
  if (!bucket) {
    return new Response('Download mirror is not configured on this deployment', { status: 503 });
  }

  const object = await bucket.get(resolved.key);
  if (!object) {
    return new Response('Not found', { status: 404 });
  }

  return new Response(object.body, {
    status: 200,
    headers: {
      'content-type': 'application/octet-stream',
      'content-length': String(object.size),
      // NOT a long-lived-immutable promise: sync-release-asset.sh
      // independently re-verifies each sync against the publisher's digest,
      // but that digest can itself change for the SAME tag/key across
      // re-syncs -- e.g. a regenerated bundle manifest with a fresh
      // `generated_at` timestamp on a re-run of the same release tag. A
      // short cache window bounds staleness without claiming byte-identity
      // this key does not actually guarantee.
      'cache-control': 'public, max-age=300',
    },
  });
};
