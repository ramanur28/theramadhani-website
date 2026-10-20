import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

export const prerender = true;

export const GET: APIRoute = async () => {
  try {
    const articles = await getCollection('articles');
    const work = await getCollection('work');

    const items = [
      ...articles.map((a) => {
        const slug = a.data.slug || a.id.replace(/\.mdx?$/, '');
        return {
          type: 'article',
          title: a.data.title,
          slug: slug,
          url: `/articles/${slug}/`,
          description: a.data.description || '',
          tags: a.data.tags || [],
        };
      }),
      ...work.map((w) => {
        const slug = w.data.slug || w.id.replace(/\.mdx?$/, '');
        return {
          type: 'case-study',
          title: w.data.title,
          slug: slug,
          url: `/work/${slug}/`,
          description: w.data.description || '',
          tags: [w.data.industry, w.data.service].filter(Boolean),
        };
      }),
    ];

    return new Response(JSON.stringify(items, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};
