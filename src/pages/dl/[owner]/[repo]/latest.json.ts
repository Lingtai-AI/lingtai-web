// Public latest metadata for the default installer. It projects only trusted
// active release fields from the per-repo state and is never a cache or GitHub
// fallback surface.
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import {
  isAllowedSourceRepo,
  parseMirrorState,
  projectPublicLatest,
  stateObjectKey,
} from '../../../../lib/release-mirror.mjs';

const textResponse = (body: string, status: number) =>
  new Response(body, { status, headers: { 'cache-control': 'no-store' } });
const unavailable = () => textResponse('Download mirror state is unavailable or uninitialized', 503);

export const GET: APIRoute = async ({ params }) => {
  const { owner, repo } = params;
  if (!isAllowedSourceRepo(owner, repo)) return textResponse('Not found', 404);

  const bucket = (env as unknown as { RELEASE_MIRROR_BUCKET?: R2Bucket }).RELEASE_MIRROR_BUCKET;
  if (!bucket) {
    return textResponse('Download mirror is not configured on this deployment', 503);
  }

  const sourceRepo = `${owner}/${repo}`;
  try {
    const stateObject = await bucket.get(stateObjectKey(sourceRepo));
    if (!stateObject) return unavailable();
    const state = parseMirrorState(await stateObject.text(), sourceRepo);
    const latest = projectPublicLatest(state);
    return new Response(`${JSON.stringify(latest)}\n`, {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  } catch {
    return unavailable();
  }
};
