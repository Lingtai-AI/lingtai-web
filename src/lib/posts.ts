import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n/translations';

/**
 * Strip the trailing "-en" / "-zh" / "-wen" suffix from a post's file id
 * to get the canonical, language-agnostic slug. Posts without a suffix
 * (e.g. "agent-agora") keep their id as-is.
 */
export function canonicalSlug(id: string): string {
  return id.replace(/-(en|zh|wen)$/, '');
}

/**
 * Get all posts, grouped by canonical slug.
 * { "spiritual-bliss-run": { en: <post>, zh: <post>, ... }, ... }
 */
export async function postsByCanonicalSlug(): Promise<Map<string, Partial<Record<Lang, CollectionEntry<'blog'>>>>> {
  const all = await getCollection('blog');
  const groups = new Map<string, Partial<Record<Lang, CollectionEntry<'blog'>>>>();
  for (const post of all) {
    const slug = canonicalSlug(post.id);
    const existing = groups.get(slug) ?? {};
    existing[post.data.lang] = post;
    groups.set(slug, existing);
  }
  return groups;
}

/**
 * For a given language, pick the best version of a post: native if present,
 * else fall back to English. Returns undefined if neither exists.
 */
export function pickForLang(
  versions: Partial<Record<Lang, CollectionEntry<'blog'>>>,
  lang: Lang
): CollectionEntry<'blog'> | undefined {
  return versions[lang] ?? versions.en;
}

/**
 * All posts that should appear on a given language's blog index,
 * one entry per canonical slug, with language fallback applied.
 * Returns { slug, post, isFallback } so the template can show a badge
 * if the post is falling back to English.
 */
export async function postsForLang(lang: Lang): Promise<Array<{
  slug: string;
  post: CollectionEntry<'blog'>;
  isFallback: boolean;
}>> {
  const groups = await postsByCanonicalSlug();
  const results: Array<{ slug: string; post: CollectionEntry<'blog'>; isFallback: boolean }> = [];
  for (const [slug, versions] of groups) {
    const post = pickForLang(versions, lang);
    if (!post) continue;
    results.push({
      slug,
      post,
      isFallback: post.data.lang !== lang,
    });
  }
  return results;
}
