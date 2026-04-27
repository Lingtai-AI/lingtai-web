import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.enum(['tech', 'philosophy', 'devlog', 'daily'])).default([]),
    lang: z.enum(['en', 'zh', 'wen']).default('en'),
    description: z.string().optional(),
  }),
});

const agora = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './agora-data/entries' }),
  schema: z.object({
    id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
    repo: z.string().regex(/^[\w.-]+\/[\w.-]+$/),
    name: z.string().min(1),
    description: z.string().min(10).max(500),
    author: z.string().min(1),
    authorUrl: z.string().url(),
    ref: z.string().default('main'),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    addedAt: z.coerce.date().optional(),
  }),
});

export const collections = { blog, agora };
