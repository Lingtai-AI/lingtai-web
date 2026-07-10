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

export const collections = { blog };
