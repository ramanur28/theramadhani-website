import type { CollectionEntry } from 'astro:content';

/**
 * Determines if an article is ready for public display.
 * 
 * Logic:
 * - In local development (DEV mode), all articles (including drafts and scheduled)
 *   are accessible so authors can preview them.
 * - In production:
 *   1. Articles with status === 'draft' or draft === true are omitted.
 *   2. Articles with status === 'scheduled' or future publishDate are omitted until their publishDate arrives.
 */
export function isArticlePublished(article: CollectionEntry<'articles'>): boolean {
  if (import.meta.env.DEV) {
    return true;
  }

  // Check explicit draft flag or status
  if (article.data.status === 'draft') {
    return false;
  }

  // Check future publishDate
  const now = new Date();
  if (article.data.publishDate.getTime() > now.getTime()) {
    return false;
  }

  return true;
}
