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
});
