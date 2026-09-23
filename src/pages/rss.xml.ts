import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const articles = await getCollection('articles');
  const sortedArticles = articles.sort((a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime());

  return rss({
    title: 'The Ramadhani | SEO, GEO & Google Ads Insights',
    description: 'Actionable publications on Technical SEO Engineering, Generative Engine Optimization (GEO), and High-ROI Paid Search.',
    site: context.site || 'https://theramadhani.com',
    items: sortedArticles.map((article) => ({
      title: article.data.title,
      description: article.data.description,
      pubDate: article.data.publishDate,
      link: `/articles/${article.data.slug || article.id}`,
      author: `${article.data.author} (contact@theramadhani.com)`,
      categories: article.data.tags,
      customData: `<guid isPermaLink="true">https://theramadhani.com/articles/${article.data.slug || article.id}</guid>`,
    })),
    customData: `<language>en-us</language>`,
  });
}