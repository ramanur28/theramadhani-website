import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    description: z.string().min(100).max(200),
    slug: z.string().optional(),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('Ramadhani'),
    tags: z.array(z.string()).default([]),
    coverImage: z.string().default('/images/uploads/default-cover.svg'),
    coverAlt: z.string().default('Article cover image'),
    quickAnswer: z.string().min(30),
    featured: z.boolean().default(false),
  }),
});

const work = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/work' }),
  schema: z.object({
    title: z.string(),
    client: z.string(),
    industry: z.string(),
    service: z.string(),
    description: z.string(),
    slug: z.string().optional(),
    publishDate: z.coerce.date(),
    metrics: z.array(
      z.object({
        value: z.string(),
        label: z.string(),
      })
    ),
    quickAnswer: z.string(),
    techStack: z.array(z.string()).default([]),
    coverImage: z.string().optional(),
    coverAlt: z.string().optional(),
    featured: z.boolean().default(false),
  }),
});

export const collections = {
  articles,
  work,
};
