import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.string(),
    category: z.string().optional().default('Guide'),
    author: z.string().optional().default('Screen Size Calculator Team'),
  }),
});

export const collections = {
  blog: blogCollection,
};