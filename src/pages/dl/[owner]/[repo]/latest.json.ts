export const prerender = false;

import type { APIRoute } from 'astro';
import {
  isAllowedSourceRepo,
  isValidAssetName,
  isValidTag,
} from '../../../../lib/release-mirror.mjs';

const SHA256_RE = /^sha256:([0-9a-f]{64})$/;

function upstreamFailure(message: string): Response {
  return new Response(message, {
    status: 502,
    headers: { 'cache-control': 'no-store' },
  });
}

export const GET: APIRoute = async ({ params }) => {
  const { owner, repo } = params;
  if (!owner || !repo || !isAllowedSourceRepo(owner, repo)) {
    return new Response('Not found', { status: 404 });
  }

  let response: Response;
  try {
    response = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, {
      headers: {
        accept: 'application/vnd.github+json',
        'user-agent': 'lingtai.ai-release-mirror',
        'x-github-api-version': '2022-11-28',
      },
    });
  } catch {
    return upstreamFailure('Release authority is unavailable');
  }
  if (!response.ok) {
    return upstreamFailure(`Release authority returned HTTP ${response.status}`);
  }

  let raw: unknown;
  try {
    raw = await response.json();
  } catch {
    return upstreamFailure('Release authority returned invalid JSON');
  }
  if (!raw || typeof raw !== 'object') {
    return upstreamFailure('Release authority returned invalid metadata');
  }

  const release = raw as Record<string, unknown>;
  const tag = release.tag_name;
  const releaseId = release.id;
  const rawAssets = release.assets;
  if (
    typeof tag !== 'string' ||
    !isValidTag(tag) ||
    typeof releaseId !== 'number' ||
    !Number.isSafeInteger(releaseId) ||
    releaseId <= 0 ||
    !Array.isArray(rawAssets) ||
    rawAssets.length === 0
  ) {
    return upstreamFailure('Release authority returned invalid metadata');
  }

  const seen = new Set<string>();
  const assets: Array<{ name: string; sha256: string; size: number }> = [];
  for (const rawAsset of rawAssets) {
    if (!rawAsset || typeof rawAsset !== 'object') {
      return upstreamFailure('Release authority returned invalid asset metadata');
    }
    const asset = rawAsset as Record<string, unknown>;
    const name = asset.name;
    const size = asset.size;
    const digest = asset.digest;
    const digestMatch = typeof digest === 'string' ? SHA256_RE.exec(digest) : null;
    if (
      typeof name !== 'string' ||
      !isValidAssetName(name) ||
      seen.has(name) ||
      typeof size !== 'number' ||
      !Number.isSafeInteger(size) ||
      size <= 0 ||
      !digestMatch
    ) {
      return upstreamFailure('Release authority returned invalid asset metadata');
    }
    seen.add(name);
    assets.push({ name, sha256: digestMatch[1], size });
  }
  assets.sort((left, right) => left.name.localeCompare(right.name));

  return new Response(
    JSON.stringify({
      schema: 'lingtai.release_mirror.latest/v1',
      source_repo: `${owner}/${repo}`,
      tag,
      release_id: releaseId,
      assets,
    }),
    {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'public, max-age=300',
        'x-content-type-options': 'nosniff',
      },
    },
  );
};
