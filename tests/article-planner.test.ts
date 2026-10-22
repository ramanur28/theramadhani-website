process.env.PLANNER_DB_PATH = 'data/test-article-plans.db';
process.env.PLANNER_JSON_PATH = 'data/test-article-plans.json';

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAllPlans,
  createPlan,
  updatePlan,
  deletePlan,
  bulkCreatePlans,
  syncWithWebsiteArticles,
  parseCSV,
  generateSlug,
  splitKeyphrases,
} from '../src/utils/planner-db';

describe('Article Planner Database & Sync Engine', () => {
  beforeEach(() => {
    // Reset test database or files if needed
    const plans = getAllPlans();
    for (const p of plans) {
      deletePlan(p.id);
    }
  });

  it('PLN-01: initializes SQLite database and creates single article plan with required attributes', () => {
    const plan = createPlan({
      focusKeyphrase: 'Generative Engine Optimization',
      pageRole: 'Pillar Page',
      articleTitle: 'The Complete GEO Guide for Enterprise 2026',
      status: 'Planned',
      intent: 'Informational',
    });

    expect(plan.id).toBeDefined();
    expect(plan.focusKeyphrase).toBe('Generative Engine Optimization');
    expect(plan.pageRole).toBe('Pillar Page');
    expect(plan.articleTitle).toBe('The Complete GEO Guide for Enterprise 2026');
    expect(plan.status).toBe('Planned');
    expect(plan.intent).toBe('Informational');
    expect(plan.slug).toBe('the-complete-geo-guide-for-enterprise-2026');

    const all = getAllPlans();
    expect(all.length).toBe(1);
    expect(all[0].articleTitle).toBe('The Complete GEO Guide for Enterprise 2026');
  });

  it('PLN-02: updates article plan status, intent, and page role', () => {
    const plan = createPlan({
      focusKeyphrase: 'Technical SEO Audit',
      pageRole: 'Supporting Guide',
      articleTitle: 'Step by Step Technical SEO Audit',
      status: 'Planned',
      intent: 'Informational',
    });

    const updated = updatePlan(plan.id, {
      status: 'In Progress',
      intent: 'Commercial Investigation',
      pageRole: 'Pillar Page',
      notes: 'Drafting in progress with AI Article Studio',
    });

    expect(updated).not.toBeNull();
    expect(updated?.status).toBe('In Progress');
    expect(updated?.intent).toBe('Commercial Investigation');
    expect(updated?.pageRole).toBe('Pillar Page');
    expect(updated?.notes).toBe('Drafting in progress with AI Article Studio');

    const fetched = getAllPlans().find(p => p.id === plan.id);
    expect(fetched?.status).toBe('In Progress');
  });

  it('PLN-03: deletes article plan and updates database', () => {
    const plan1 = createPlan({ articleTitle: 'Plan 1', focusKeyphrase: 'K1' });
    const plan2 = createPlan({ articleTitle: 'Plan 2', focusKeyphrase: 'K2' });

    expect(getAllPlans().length).toBe(2);

    const deleted = deletePlan(plan1.id);
    expect(deleted).toBe(true);

    const remaining = getAllPlans();
    expect(remaining.length).toBe(1);
    expect(remaining[0].id).toBe(plan2.id);
  });

  it('PLN-04: parses CSV with standard commas and maps column headers', () => {
    const csvContent = `Focus Keyphrase,Page Role,Article Title,Status,Intent
AI Overviews Optimization,Pillar Page,Dominating Google AI Overviews in 2026,Planned,Informational
Entity Schema Graph,Topic Cluster,How to Build Entity Graph for GEO,In Progress,Informational
Technical SEO Consultant,Landing Page,Hire Premier Technical SEO Consultant,Scheduled,Commercial`;

    const { rows, errors } = parseCSV(csvContent);

    expect(errors.length).toBe(0);
    expect(rows.length).toBe(3);

    expect(rows[0].focusKeyphrase).toBe('AI Overviews Optimization');
    expect(rows[0].pageRole).toBe('Pillar Page');
    expect(rows[0].articleTitle).toBe('Dominating Google AI Overviews in 2026');
    expect(rows[0].status).toBe('Planned');
    expect(rows[0].intent).toBe('Informational');

    expect(rows[1].focusKeyphrase).toBe('Entity Schema Graph');
    expect(rows[1].pageRole).toBe('Topic Cluster');
    expect(rows[1].status).toBe('In Progress');

    expect(rows[2].pageRole).toBe('Landing Page');
    expect(rows[2].intent).toBe('Commercial Investigation');
  });

  it('PLN-05: parses CSV with semicolon delimiters, quoted values, and Indonesian aliases', () => {
    const csvContent = `"Kata Kunci";"Peran";"Judul Artikel";"Keadaan";"Niat Pencarian"
"RAG SEO";"Pillar Page";"Panduan Lengkap RAG SEO, Vector Search, dan AI";"Rencana";"Informational"
"Schema Entity";"Topic Cluster";"Menghubungkan Schema @id untuk AI";"Sedang Ditulis";"Komersial"`;

    const { rows, errors } = parseCSV(csvContent);

    expect(errors.length).toBe(0);
    expect(rows.length).toBe(2);

    expect(rows[0].focusKeyphrase).toBe('RAG SEO');
    expect(rows[0].pageRole).toBe('Pillar Page');
    expect(rows[0].articleTitle).toBe('Panduan Lengkap RAG SEO, Vector Search, dan AI');
    expect(rows[0].status).toBe('Planned');

    expect(rows[1].status).toBe('In Progress');
    expect(rows[1].intent).toBe('Commercial Investigation');
  });

  it('PLN-06: bulk creates plans from parsed CSV items', () => {
    const sampleRows = [
      { focusKeyphrase: 'Bulk 1', articleTitle: 'Bulk Title 1', pageRole: 'Pillar Page' as const },
      { focusKeyphrase: 'Bulk 2', articleTitle: 'Bulk Title 2', pageRole: 'Topic Cluster' as const },
      { focusKeyphrase: 'Bulk 3', articleTitle: 'Bulk Title 3', pageRole: 'Case Study' as const },
    ];

    const result = bulkCreatePlans(sampleRows);
    expect(result.inserted).toBe(3);
    expect(result.errors.length).toBe(0);

    const all = getAllPlans();
    expect(all.length).toBe(3);
  });

  it('PLN-07: synchronizes plans with live website articles, auto-updating status and liveUrl', () => {
    // 1. Create a planned article that matches a live article by slug
    createPlan({
      articleTitle: 'The Complete Generative Engine Optimization (GEO) Blueprint for 2026',
      focusKeyphrase: 'Generative Engine Optimization',
      slug: 'generative-engine-optimization-guide',
      status: 'Planned', // currently planned
      intent: 'Informational',
    });

    // 2. Mock website articles (representing src/content/articles/)
    const liveArticles = [
      {
        title: 'The Complete Generative Engine Optimization (GEO) Blueprint for 2026',
        slug: 'generative-engine-optimization-guide',
        url: '/articles/generative-engine-optimization-guide/',
        tags: ['GEO', 'Technical SEO'],
      },
      {
        title: 'How to Do an SEO Audit: Step-by-Step Technical Framework',
        slug: 'how-to-do-an-seo-audit-step-by-step-technical-framework-for-organic-growth',
        url: '/articles/how-to-do-an-seo-audit-step-by-step-technical-framework-for-organic-growth/',
        tags: ['SEO Audit', 'Technical SEO'],
      },
    ];

    // 3. Run synchronization
    const syncRes = syncWithWebsiteArticles(liveArticles, true);

    expect(syncRes.syncedCount).toBeGreaterThanOrEqual(1);

    // Verify existing plan is now Published and connected to liveUrl
    const updatedGEO = getAllPlans().find(p => p.slug === 'generative-engine-optimization-guide');
    expect(updatedGEO?.status).toBe('Published');
    expect(updatedGEO?.liveUrl).toBe('/articles/generative-engine-optimization-guide/');

    // Verify missing article was auto-imported into planner
    const importedAudit = getAllPlans().find(p => p.slug === 'how-to-do-an-seo-audit-step-by-step-technical-framework-for-organic-growth');
    expect(importedAudit).toBeDefined();
    expect(importedAudit?.status).toBe('Published');
    expect(importedAudit?.liveUrl).toContain('/articles/');
  });

  it('PLN-08: generates clean URL slugs from article titles', () => {
    expect(generateSlug('Generative Engine Optimization: The 2026 Playbook!')).toBe('generative-engine-optimization-the-2026-playbook');
    expect(generateSlug('B2B SaaS Technical SEO & GEO Guide')).toBe('b2b-saas-technical-seo-geo-guide');
  });
  it('PLN-09: supports multiple focus keyphrases per article (array and comma-delimited)', () => {
    // 1. Create with comma-separated string
    const plan1 = createPlan({
      articleTitle: 'Enterprise Technical Architecture',
      focusKeyphrase: 'Technical SEO, Core Web Vitals, Schema Graph',
      pageRole: 'Pillar Page',
      status: 'Planned',
      intent: 'Informational',
    });

    expect(plan1.focusKeyphrase).toBe('Technical SEO, Core Web Vitals, Schema Graph');
    expect(plan1.focusKeyphrases).toEqual(['Technical SEO', 'Core Web Vitals', 'Schema Graph']);

    // 2. Create with array
    const plan2 = createPlan({
      articleTitle: 'Advanced Server-Side Tracking',
      focusKeyphrases: ['Server-Side GTM', 'First-Party Cookies', 'Google Ads'],
      pageRole: 'Topic Cluster',
    });

    expect(plan2.focusKeyphrase).toBe('Server-Side GTM, First-Party Cookies, Google Ads');
    expect(plan2.focusKeyphrases).toEqual(['Server-Side GTM', 'First-Party Cookies', 'Google Ads']);

    // 3. Update with new keyphrases
    const updated = updatePlan(plan1.id, {
      focusKeyphrases: ['Technical SEO', 'Answer Engine Optimization'],
    });
    expect(updated?.focusKeyphrase).toBe('Technical SEO, Answer Engine Optimization');
    expect(updated?.focusKeyphrases).toEqual(['Technical SEO', 'Answer Engine Optimization']);

    // 4. Test splitKeyphrases utility
    expect(splitKeyphrases('keyword 1, keyword 2; keyword 3')).toEqual(['keyword 1', 'keyword 2', 'keyword 3']);
    expect(splitKeyphrases(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
  });

  it('PLN-10: parses CSV with multiple keyphrases and syncs all article tags as multiple keyphrases', () => {
    const csvContent = `Focus Keyphrase,Page Role,Article Title,Status,Intent
"Technical SEO, Core Web Vitals, INP",Pillar Page,Enterprise INP Architecture,Planned,Informational
"GEO, AI Overviews",Topic Cluster,Optimizing for Generative Engines,In Progress,Informational`;

    const { rows, errors } = parseCSV(csvContent);
    expect(errors.length).toBe(0);
    expect(rows.length).toBe(2);
    expect(rows[0].focusKeyphrases).toEqual(['Technical SEO', 'Core Web Vitals', 'INP']);
    expect(rows[0].focusKeyphrase).toBe('Technical SEO, Core Web Vitals, INP');
    expect(rows[1].focusKeyphrases).toEqual(['GEO', 'AI Overviews']);

    // Sync live articles and ensure all tags become focus keyphrases
    const liveArticles = [
      {
        title: 'Modern Web Performance Architecture',
        slug: 'modern-web-performance-architecture',
        url: '/articles/modern-web-performance-architecture/',
        tags: ['Performance', 'Core Web Vitals', 'Speed Optimization'],
      },
    ];

    syncWithWebsiteArticles(liveArticles, true);
    const imported = getAllPlans().find(p => p.slug === 'modern-web-performance-architecture');
    expect(imported).toBeDefined();
    expect(imported?.focusKeyphrase).toBe('Performance, Core Web Vitals, Speed Optimization');
    expect(imported?.focusKeyphrases).toEqual(['Performance', 'Core Web Vitals', 'Speed Optimization']);
  });
  it('PLN-11: robustly parses CSV with heavily quoted multi-keyphrases and multi-intents without column shifting', () => {
    const complexCsv = `focus keyphrase,page role,article title,status,intent
"organic seo fundamentals, what is an organic search, how organic search works, organic search results, organic seo optimization",Pillar page,Organic SEO Fundamentals: The Complete Guide to Natural Search Growth,Planned (Rencana),Informational
"ctr seo, organic ctr, organic click through rate, organic click, organic ctr by position, organic click through rate by search position, improve organic ctr, finding your own ctr, ctr organic search, blogs about organic click through rate, organic ctr and seo, seo ctr only company name, how to increase ctr in seo, google organic ctr",Sub page,Organic CTR in SEO: Benchmarks by Position & How to Improve Click-Through Rate,Planned (Rencana),"Informational, Transactional"
"what are organic keywords, seo organic keywords, organic keywords definition, top organic keywords, organic search keywords, organic keywords example, organic serp ranking, what do you mean by organic keywords",Sub page,"What Are SEO Organic Keywords? Definition, Examples & How to Find Them",Planned (Rencana),"Informational, Commercial"`;

    const { rows, errors } = parseCSV(complexCsv);
    expect(errors.length).toBe(0);
    expect(rows.length).toBe(3);

    // Row 0
    expect(rows[0].focusKeyphrases?.length).toBe(5);
    expect(rows[0].articleTitle).toBe('Organic SEO Fundamentals: The Complete Guide to Natural Search Growth');
    expect(rows[0].pageRole).toBe('Pillar Page');
    expect(rows[0].intent).toBe('Informational');

    // Row 1 (14 keyphrases, dual intent)
    expect(rows[1].focusKeyphrases?.length).toBe(14);
    expect(rows[1].articleTitle).toBe('Organic CTR in SEO: Benchmarks by Position & How to Improve Click-Through Rate');
    expect(rows[1].pageRole).toBe('Topic Cluster');
    expect(rows[1].intent).toBe('Transactional');

    // Row 2 (8 keyphrases, quoted title and dual intent)
    expect(rows[2].focusKeyphrases?.length).toBe(8);
    expect(rows[2].articleTitle).toBe('What Are SEO Organic Keywords? Definition, Examples & How to Find Them');
    expect(rows[2].intent).toBe('Commercial Investigation');
  });
  it('PLN-12: verifies multi-status sync (Published, Scheduled, In Progress, Planned)', () => {
    // 1. Create 4 plans to test all 4 status scenarios
    const p1 = createPlan({
      articleTitle: 'Advanced Technical SEO Architecture',
      slug: 'advanced-technical-seo-architecture',
      status: 'Planned', // Should become Published
    });
    const p2 = createPlan({
      articleTitle: 'Future Algorithm Predictions 2027',
      slug: 'future-algorithm-predictions-2027',
      status: 'Planned', // Should become Scheduled
    });
    const p3 = createPlan({
      articleTitle: 'Draft WIP Guide on Indexing',
      slug: 'draft-wip-guide-on-indexing',
      status: 'Planned', // Should become In Progress
    });
    const p4 = createPlan({
      articleTitle: 'Deleted or Unwritten Guide',
      slug: 'deleted-or-unwritten-guide',
      status: 'Published', // File no longer exists, should revert to Planned
    });

    // 2. Mock website articles representing different frontmatter states
    const futureDate = new Date(Date.now() + 86400000 * 5).toISOString(); // 5 days in future
    const pastDate = new Date(Date.now() - 86400000 * 2).toISOString(); // 2 days ago

    const liveArticles = [
      {
        title: 'Advanced Technical SEO Architecture',
        slug: 'advanced-technical-seo-architecture',
        url: '/articles/advanced-technical-seo-architecture/',
        status: 'published',
        draft: false,
        publishDate: pastDate,
      },
      {
        title: 'Future Algorithm Predictions 2027',
        slug: 'future-algorithm-predictions-2027',
        url: '/articles/future-algorithm-predictions-2027/',
        status: 'scheduled',
        publishDate: futureDate,
      },
      {
        title: 'Draft WIP Guide on Indexing',
        slug: 'draft-wip-guide-on-indexing',
        url: '/articles/draft-wip-guide-on-indexing/',
        status: 'draft',
        draft: true,
      },
      // Note: p4 has no matching file in liveArticles
    ];

    // 3. Execute sync
    const res = syncWithWebsiteArticles(liveArticles, false);

    expect(res.syncedCount).toBe(4);
    expect(res.updatedPlanIds).toContain(p1.id);
    expect(res.updatedPlanIds).toContain(p2.id);
    expect(res.updatedPlanIds).toContain(p3.id);
    expect(res.updatedPlanIds).toContain(p4.id);

    const all = getAllPlans();
    const up1 = all.find(p => p.id === p1.id);
    const up2 = all.find(p => p.id === p2.id);
    const up3 = all.find(p => p.id === p3.id);
    const up4 = all.find(p => p.id === p4.id);

    expect(up1?.status).toBe('Published');
    expect(up2?.status).toBe('Scheduled');
    expect(up3?.status).toBe('In Progress');
    expect(up4?.status).toBe('Planned');
  });
  it('PLN-13: accurately matches plan with short title/omitted slug to published website article and prevents duplicates', () => {
    // User created a plan with short title, no slug, status In Progress
    const userPlan = createPlan({
      articleTitle: 'Organic SEO Fundamentals',
      focusKeyphrase: 'Organic SEO, Search Visibility',
      pageRole: 'Topic Cluster',
      status: 'In Progress',
      intent: 'Informational',
    });

    expect(userPlan.status).toBe('In Progress');

    // Website article was published with full title and specific slug
    const liveArticles = [
      {
        type: 'article' as const,
        title: 'Organic SEO Fundamentals: How Organic Search Works',
        slug: 'organic-seo-fundamentals-how-organic-search-works',
        url: '/articles/organic-seo-fundamentals-how-organic-search-works/',
        description: 'Comprehensive guide to organic SEO fundamentals.',
        tags: ['Organic SEO', 'Search Visibility'],
        status: 'published',
        draft: false,
        publishDate: '2026-10-22T14:53:00+07:00',
      },
    ];

    const result = syncWithWebsiteArticles(liveArticles, true);

    expect(result.syncedCount).toBe(1);
    expect(result.newImportedCount).toBe(0); // MUST NOT create duplicate!

    const plans = getAllPlans();
    expect(plans.length).toBe(1);

    const updatedPlan = plans.find((p) => p.id === userPlan.id);
    expect(updatedPlan).toBeDefined();
    expect(updatedPlan?.status).toBe('Published');
    expect(updatedPlan?.slug).toBe('organic-seo-fundamentals-how-organic-search-works');
    expect(updatedPlan?.liveUrl).toBe('/articles/organic-seo-fundamentals-how-organic-search-works/');
  });
});
