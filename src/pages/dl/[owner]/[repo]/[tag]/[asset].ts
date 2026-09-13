// Serves only the state-pinned latest release asset from the R2 mirror. A
// narrow rollout bootstrap preserves the former exact legacy-key read only
// while the state object is absent; any present state disables that fallback.
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import {
  parseMirrorState,
  resolveActiveDownloadRequest,
  resolveLegacyDownloadRequest,
  stateObjectKey,
} from '../../../../../lib/release-mirror.mjs';

const textResponse = (body: string, status: number) =>
  new Response(body, { status, headers: { 'cache-control': 'no-store' } });
const unavailable = () => textResponse('Download mirror state is unavailable or corrupt', 503);

function assetResponse(object: R2ObjectBody) {
  return new Response(object.body, {
    status: 200,
    headers: {
      'content-type': 'application/octet-stream',
      'content-length': String(object.size),
      'cache-control': 'no-store',
    },
  });
}

async function serveLegacyBootstrap(bucket: R2Bucket, key: string) {
  try {
    const object = await bucket.get(key);
    return object ? assetResponse(object) : textResponse('Not found', 404);
  } catch {
    return unavailable();
  }
}

export const GET: APIRoute = async ({ params }) => {
  const request = resolveLegacyDownloadRequest(params as Record<string, string | undefined>);
  if (!request.ok) return textResponse(request.body, request.status);

  const bucket = (env as unknown as { RELEASE_MIRROR_BUCKET?: R2Bucket }).RELEASE_MIRROR_BUCKET;
  if (!bucket) {
    return textResponse('Download mirror is not configured on this deployment', 503);
  }

  const sourceRepo = `${params.owner}/${params.repo}`;
  let stateObject: R2ObjectBody | null;
  try {
    stateObject = await bucket.get(stateObjectKey(sourceRepo));
  } catch {
    return unavailable();
  }

  // Zero-downtime deployment bridge only: an absent state may read this exact
  // legacy key. Once any valid state exists, even with latest:null, legacy
  // bytes are unreachable and initialization stays fail-loud until promotion.
  if (!stateObject) return serveLegacyBootstrap(bucket, request.key);

  let state;
  try {
    state = parseMirrorState(await stateObject.text(), sourceRepo);
  } catch {
    return unavailable();
  }
  if (state.latest === null) return unavailable();

  const resolved = resolveActiveDownloadRequest(params as Record<string, string | undefined>, state);
  if (!resolved.ok) return textResponse(resolved.body, resolved.status);

  try {
    const object = await bucket.get(resolved.key);
    if (!object || object.size !== resolved.size) return unavailable();
    return assetResponse(object);
  } catch {
    return unavailable();
  }
};
