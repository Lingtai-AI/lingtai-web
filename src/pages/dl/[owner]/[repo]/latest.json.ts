export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import {
  isAllowedSourceRepo,
  latestMetadataObjectKey,
} from '../../../../lib/release-mirror.mjs';

export const GET: APIRoute = async ({ params }) => {
  const { owner, repo } = params;
  if (!owner || !repo || !isAllowedSourceRepo(owner, repo)) {
    return new Response('Not found', { status: 404 });
  }

  const bucket = (env as unknown as { RELEASE_MIRROR_BUCKET?: R2Bucket }).RELEASE_MIRROR_BUCKET;
  if (!bucket) {
    return new Response('Latest release metadata is not configured', { status: 503 });
  }

  const object = await bucket.get(latestMetadataObjectKey(owner, repo));
  if (!object) {
    return new Response('Latest release metadata is not available', { status: 503 });
  }

  return new Response(object.body, {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-length': String(object.size),
      'cache-control': 'public, max-age=300',
      'x-content-type-options': 'nosniff',
    },
  });
};
