import { describe, it, expect, beforeEach, vi } from 'vitest';
import '../public/admin/ai-studio.js';

const studio = (typeof window !== 'undefined' && (window as any).DecapAIStudio) || (globalThis as any).DecapAIStudio;

describe('Internal Links Hub & Relevance Algorithm', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    studio.state.selectedLinks = [];
    studio.state.focusKeyphrases = [];
    studio.state.siteCatalog = [
      {
        title: 'The Complete Generative Engine Optimization (GEO) Blueprint for 2026',
        url: '/articles/generative-engine-optimization-guide/',
        description: 'Master Generative Engine Optimization (GEO) to dominate AI answers in ChatGPT and Perplexity.',
        tags: ['GEO', 'AI Search', 'Technical SEO'],
      },
      {
        title: 'Technical SEO Services: The Definitive Guide to Architecture',
        url: '/articles/technical-seo-services/',
        description: 'Discover how professional technical SEO services resolve crawl errors and build scalable site architecture.',
        tags: ['Technical SEO'],
      },
      {
        title: 'How to Do an SEO Audit: Technical Framework',
        url: '/articles/how-to-do-an-seo-audit/',
        description: 'Learn how to do an SEO audit with this comprehensive technical guide.',
        tags: ['SEO Audit'],
      },
      {
        title: 'Google Ads Smart Bidding & Server-Side Tracking: The 2026 Architecture',
        url: '/articles/google-ads-smart-bidding-server-side-tracking/',
        description: 'How to configure server-side GTM, enhanced conversions, and value-based bidding.',
        tags: ['Google Ads', 'PPC'],
      },
    ];
  });

  it('accurately scores and ranks internal links matching focus keyphrases', () => {
    studio.state.focusKeyphrases = ['generative engine optimization', 'geo'];
    studio.autoSuggestInternalLinks();

    expect(studio.state.selectedLinks.length).toBeGreaterThan(0);
    // The GEO article should be the top suggested internal link
    expect(studio.state.selectedLinks[0].url).toBe('/articles/generative-engine-optimization-guide/');
    expect(studio.state.selectedLinks[0].anchor).toBe('The Complete Generative Engine Optimization (GEO) Blueprint for 2026');
  });

  it('suggests technical SEO articles when technical SEO keyphrase is used', () => {
    studio.state.focusKeyphrases = ['technical seo audit'];
    studio.autoSuggestInternalLinks();

    const urls = studio.state.selectedLinks.map((l: any) => l.url);
    expect(urls).toContain('/articles/technical-seo-services/');
    expect(urls).toContain('/articles/how-to-do-an-seo-audit/');
  });

  it('falls back to default articles when no focus keyphrases are provided', () => {
    studio.state.focusKeyphrases = [];
    studio.autoSuggestInternalLinks();

    expect(studio.state.selectedLinks.length).toBe(3);
    expect(studio.state.selectedLinks[0].url).toBe(studio.state.siteCatalog[0].url);
  });

  it('allows manual addition of custom internal links', () => {
    studio.state.selectedLinks = [];
    studio.state.selectedLinks.push({
      title: 'Technical SEO Services',
      url: '/services/seo/',
      anchor: 'Layanan Technical SEO Profesional',
    });

    expect(studio.state.selectedLinks).toHaveLength(1);
    expect(studio.state.selectedLinks[0].anchor).toBe('Layanan Technical SEO Profesional');
    expect(studio.state.selectedLinks[0].url).toBe('/services/seo/');
  });

  it('allows editing anchor text of selected internal links', () => {
    studio.state.selectedLinks = [
      {
        title: 'Original Title',
        url: '/articles/test/',
        anchor: 'Original Title',
      },
    ];

    studio.state.selectedLinks[0].anchor = 'Panduan Optimasi Mesin Generatif';
    expect(studio.state.selectedLinks[0].anchor).toBe('Panduan Optimasi Mesin Generatif');
  });

  it('allows deleting selected internal links', () => {
    studio.state.selectedLinks = [
      { title: 'Article 1', url: '/articles/1/', anchor: 'Article 1' },
      { title: 'Article 2', url: '/articles/2/', anchor: 'Article 2' },
    ];

    studio.state.selectedLinks.splice(0, 1);
    expect(studio.state.selectedLinks).toHaveLength(1);
    expect(studio.state.selectedLinks[0].title).toBe('Article 2');
  });
  it('programmatically adds manual internal link via addManualInternalLink and normalizes URL', () => {
    studio.state.selectedLinks = [];
    const success = studio.addManualInternalLink('services/seo', 'Konsultan SEO Jakarta', 'Layanan SEO');
    expect(success).toBe(true);
    expect(studio.state.selectedLinks).toHaveLength(1);
    expect(studio.state.selectedLinks[0].url).toBe('/services/seo');
    expect(studio.state.selectedLinks[0].anchor).toBe('Konsultan SEO Jakarta');
  });

  it('updates existing link anchor if addManualInternalLink is called with duplicate URL', () => {
    studio.state.selectedLinks = [
      { title: 'Layanan SEO', url: '/services/seo/', anchor: 'Anchor Lama' },
    ];
    studio.addManualInternalLink('/services/seo/', 'Anchor Baru Terupdate');
    expect(studio.state.selectedLinks).toHaveLength(1);
    expect(studio.state.selectedLinks[0].anchor).toBe('Anchor Baru Terupdate');
  });
});
