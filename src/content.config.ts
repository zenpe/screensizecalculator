import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blogCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.string(),
    updatedDate: z.string().optional(),
    category: z.string().optional().default('Guide'),
    author: z.string().optional().default('Screen Size Calculator'),
    keywords: z.string().optional(),
  }),
});

export const collections = {
  blog: blogCollection,
};
