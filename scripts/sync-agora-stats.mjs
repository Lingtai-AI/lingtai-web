// Walks agora-data/entries/*.yaml and writes agora-stats.json.
// For each entry, fetches:
//   - stargazers_count from the recipe's own GitHub repo
//   - reaction totals from the discussion thread on Lingtai-AI/lingtai-agora
//     whose title matches the entry id (giscus mapping="specific", term=id).
//
// Auth: pass a token via GITHUB_TOKEN env var. Without it the script still
// works but is bound by the 60/hr unauthenticated rate limit.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

const ROOT = new URL('..', import.meta.url).pathname;
const ENTRIES_DIR = join(ROOT, 'agora-data/entries');
const OUT_PATH = join(ROOT, 'agora-stats.json');
const AGORA_REPO = 'Lingtai-AI/lingtai-agora';

const token = process.env.GITHUB_TOKEN;
const headers = {
  accept: 'application/vnd.github+json',
  'x-github-api-version': '2022-11-28',
  ...(token ? { authorization: `Bearer ${token}` } : {}),
};

async function gh(path) {
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`GitHub ${path}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function ghGraphql(query, variables) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { ...headers, 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    throw new Error(`GraphQL ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  if (json.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  }
  return json.data;
}

async function fetchStars(repo) {
  const data = await gh(`/repos/${repo}`);
  return data?.stargazers_count ?? null;
}

// Discussions live under Lingtai-AI/lingtai-agora; giscus uses the entry id
// as the discussion title. Search for an exact title match via GraphQL —
// the REST list endpoint can't filter by title.
async function fetchDiscussionReactions(term) {
  if (!token) {
    return null;
  }
  const data = await ghGraphql(
    `query($q:String!) {
      search(query: $q, type: DISCUSSION, first: 5) {
        nodes {
          ... on Discussion {
            title
            number
            repository { nameWithOwner }
            reactionGroups {
              content
              reactors { totalCount }
            }
          }
        }
      }
    }`,
    { q: `repo:${AGORA_REPO} "${term}" in:title` }
  );
  const exact = data.search.nodes.find(
    (n) => n.title === term && n.repository?.nameWithOwner === AGORA_REPO
  );
  if (!exact) return null;
  const reactions = {};
  let total = 0;
  for (const g of exact.reactionGroups) {
    const count = g.reactors.totalCount;
    if (count > 0) {
      reactions[g.content] = count;
      total += count;
    }
  }
  return { number: exact.number, total, reactions };
}

function loadEntries() {
  const files = readdirSync(ENTRIES_DIR).filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));
  return files.map((f) => parseYaml(readFileSync(join(ENTRIES_DIR, f), 'utf8')));
}

async function main() {
  const entries = loadEntries();
  const stats = {};

  for (const entry of entries) {
    const { id, repo } = entry;
    const out = {};

    try {
      const stars = await fetchStars(repo);
      if (stars !== null) out.stars = stars;
    } catch (err) {
      console.error(`stars failed for ${id} (${repo}):`, err.message);
    }

    try {
      const disc = await fetchDiscussionReactions(id);
      if (disc) {
        out.discussion = disc.number;
        out.reactions = disc.reactions;
        out.reactionsTotal = disc.total;
      }
    } catch (err) {
      console.error(`reactions failed for ${id}:`, err.message);
    }

    stats[id] = out;
    console.log(`${id}:`, out);
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    stats,
  };
  writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2) + '\n');
  console.log(`\nwrote ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
