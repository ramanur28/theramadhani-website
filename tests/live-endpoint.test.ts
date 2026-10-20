import { describe, it, expect } from 'vitest';

describe('Live Dev Server & Catalog Endpoint Validation', () => {
  const BASE_URL = 'http://localhost:4321';

  it('serves live /api/articles-index with valid JSON and complete metadata', async () => {
    const res = await fetch(`${BASE_URL}/api/articles-index`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');

    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(5);

    // Verify schema of first article
    const firstArticle = data[0];
    expect(firstArticle).toHaveProperty('type');
    expect(firstArticle).toHaveProperty('title');
    expect(firstArticle).toHaveProperty('slug');
    expect(firstArticle).toHaveProperty('url');
    expect(firstArticle).toHaveProperty('description');
    expect(firstArticle).toHaveProperty('tags');

    // Ensure leading and trailing slashes for clean URL paths
    expect(firstArticle.url).toMatch(/^\/(articles|work)\/[a-z0-9-]+\/$/);
  });

  it('serves /admin/ containing AI Article Studio assets in DOM', async () => {
    const res = await fetch(`${BASE_URL}/admin/`);
    expect(res.status).toBe(200);

    const html = await res.text();
    expect(html).toContain('/admin/ai-studio.css');
    expect(html).toContain('/admin/ai-studio.js');
    expect(html).toContain('decap-cms');
  });

  it('serves static /admin/ai-studio.js successfully', async () => {
    const res = await fetch(`${BASE_URL}/admin/ai-studio.js`);
    expect(res.status).toBe(200);

    const js = await res.text();
    expect(js).toContain('AI Article Studio for Decap CMS');
    expect(js).toContain('gpt-6-luna');
    expect(js).toContain('gpt-5.4-mini');
  });

  it('serves static /admin/ai-studio.css successfully', async () => {
    const res = await fetch(`${BASE_URL}/admin/ai-studio.css`);
    expect(res.status).toBe(200);

    const css = await res.text();
    expect(css).toContain('.ai-studio-drawer');
    expect(css).toContain('.ai-studio-trigger-btn');
  });

  it('serves clean admin URL /admin/collections/work without 404 and includes router bridge', async () => {
    const res = await fetch(`${BASE_URL}/admin/collections/work`);
    expect(res.status).toBe(200);

    const html = await res.text();
    expect(html).toContain('Clean URL to Hash Router Bridge');
    expect(html).toContain('/admin/#');
  });

  it('serves clean admin URL /admin/collections/articles and /admin/media without 404', async () => {
    const resArticles = await fetch(`${BASE_URL}/admin/collections/articles`);
    expect(resArticles.status).toBe(200);

    const resMedia = await fetch(`${BASE_URL}/admin/media`);
    expect(resMedia.status).toBe(200);
  });
});
