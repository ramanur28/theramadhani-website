import { describe, it, expect, beforeEach, vi } from 'vitest';
import '../public/admin/ai-studio.js';

const studio = (typeof window !== 'undefined' && (window as any).DecapAIStudio) || (globalThis as any).DecapAIStudio;

describe('End-to-End Real User Flow: AI Article Generation in Decap Editor', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();

    // Prepare simulated Decap CMS DOM
    document.body.innerHTML = `
      <div id="nc-root">
        <header class="AppHeaderContent">
          <nav>Decap CMS Navbar</nav>
        </header>
        <main>
          <form class="decap-editor-form">
            <div class="control-pane">
              <label for="title-field-1">Title</label>
              <input id="title-field-1" name="title" value="" />
            </div>
            <div class="control-pane">
              <label for="slug-field-1">Slug</label>
              <input id="slug-field-1" name="slug" value="" />
            </div>
            <div class="control-pane">
              <label for="description-field-1">Description</label>
              <textarea id="description-field-1" name="description"></textarea>
            </div>
            <div class="control-pane">
              <label for="quickAnswer-field-1">Quick Answer</label>
              <textarea id="quickAnswer-field-1" name="quickAnswer"></textarea>
            </div>
            <div class="control-pane">
              <label for="coverImage-field-1">Cover Image</label>
              <input id="coverImage-field-1" name="coverImage" value="" />
            </div>
            <div class="control-pane">
              <label for="coverAlt-field-1">Cover Alt</label>
              <input id="coverAlt-field-1" name="coverAlt" value="" />
            </div>
            <div class="control-pane">
              <label for="body-field-1">Body</label>
              <textarea id="body-field-1" name="body"></textarea>
            </div>
          </form>
        </main>
      </div>
      <div class="ai-toast" id="ai-studio-toast"></div>
    `;

    // Populate catalog
    studio.state.siteCatalog = [
      {
        title: 'B2B SEO Services: The Complete Strategy for Enterprise Pipeline',
        url: '/articles/b2b-seo-services/',
        description: 'Scale enterprise pipeline with specialized B2B SEO services.',
        tags: ['B2B SEO'],
      },
      {
        title: 'The Complete Generative Engine Optimization (GEO) Blueprint for 2026',
        url: '/articles/generative-engine-optimization-guide/',
        description: 'Master Generative Engine Optimization (GEO) to dominate AI answers.',
        tags: ['GEO', 'Technical SEO'],
      },
    ];
  });

  it('completes the entire real user lifecycle from configuration to Decap CMS form injection', async () => {
    // -----------------------------------------------------------------------
    // Phase 1: User Configures Provider & Model (GPT-6 Luna)
    // -----------------------------------------------------------------------
    studio.state.provider = 'openai';
    studio.state.openaiKey = 'sk-live-test-key-ramadhani';
    studio.state.openaiModel = 'gpt-6-luna';

    expect(studio.getActiveModelName()).toBe('GPT-6 Luna');

    // -----------------------------------------------------------------------
    // Phase 2: User Enters Topic, Keyphrases, and Selects GEO Strategy
    // -----------------------------------------------------------------------
    studio.state.topic = 'The Enterprise GEO Blueprint: Dominating AI Search Answers';
    studio.state.focusKeyphrases = ['Generative Engine Optimization', 'B2B SEO Pipeline'];
    studio.state.strategy = 'geo_ai_search';

    // Auto-suggest internal links based on keyphrases
    studio.autoSuggestInternalLinks();
    expect(studio.state.selectedLinks.length).toBeGreaterThan(0);
    // User edits anchor text of first internal link
    studio.state.selectedLinks[0].anchor = 'layanan B2B SEO enterprise';

    // -----------------------------------------------------------------------
    // Phase 3: User Uploads Architecture Image & Configures 3x Chunks
    // -----------------------------------------------------------------------
    studio.state.uploadedImage = {
      name: 'geo-rag-architecture.png',
      cleanName: 'article-geo-rag-architecture.png',
      base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      url: '/images/uploads/article-geo-rag-architecture.png',
    };
    studio.state.chunkPref = 3;

    // -----------------------------------------------------------------------
    // Phase 4: Mocking AI Calls across Pipeline Stages (Vision -> Outline -> 3 Chunks -> Synthesis)
    // -----------------------------------------------------------------------
    const visionResponse = JSON.stringify({
      alt: 'Enterprise Generative Engine Optimization Neural Schema Architecture',
      caption: 'Diagram visualisasi alur RAG indexing dan entity connecting untuk LLM.',
      visualInsights: 'Menghubungkan entity Person, Organization, dan definitive answer block.',
      recommendedPlacement: 'Bagian 2: Arsitektur Entity Schema',
    });

    const outlineResponse = JSON.stringify({
      proposedTitle: 'The Complete Enterprise Generative Engine Optimization (GEO) Blueprint',
      proposedSlug: 'enterprise-generative-engine-optimization-blueprint',
      sections: [
        {
          heading: 'Pergeseran Lanskap Search: Dari Ranking Tautan ke Sintesis AI',
          subheadings: ['Dinamika ChatGPT Search & Perplexity', 'Kebutuhan Information Density'],
          focus: 'Fondasi teoretis',
          includesImage: false,
        },
        {
          heading: 'Arsitektur Teknis GEO: Definitive Answer & Entity Graph',
          subheadings: ['Penerapan 40-60 Word Quick Answer', 'Integrasi Multi-Schema JSON-LD'],
          focus: 'Implementasi arsitektur',
          includesImage: true,
        },
        {
          heading: 'Metrik Pengukuran ROI Organik & Checklist Eksekusi',
          subheadings: ['Tracking Citation Share of Voice', 'Pipeline Marketing Attribution'],
          focus: 'Strategi bisnis dan evaluasi',
          includesImage: false,
        },
      ],
      faqSuggestions: [
        { question: 'Berapa lama AI Search mengindeks answer block baru?' },
        { question: 'Mengapa traditional SEO tidak cukup untuk AI answers?' },
      ],
    });

    const chunk1Content = `Generative Engine Optimization (GEO) adalah pendekatan strategis untuk mengoptimalkan konten digital agar disintesis dan dikutip secara otoritatif oleh mesin jawaban AI seperti ChatGPT, Claude, dan Perplexity melalui struktur entitas yang rapat dan ringkasan definitif 40-60 kata.

## Pergeseran Lanskap Search: Dari Ranking Tautan ke Sintesis AI

Selama dua dekade, strategi pencarian terfokus pada menangkap klik dari sepuluh tautan biru. Di era generatif saat ini, tujuan utama bergeser menjadi sumber referensi otoritatif dalam sintesis LLM.`;

    const chunk2Content = `## Arsitektur Teknis GEO: Definitive Answer & Entity Graph

Membangun visibilitas di mesin jawaban membutuhkan dua fondasi teknis: densitas informasi dan kejelasan entitas.

<figure class="article-image-figure">
  <img src="/images/uploads/article-geo-rag-architecture.png" alt="Enterprise Generative Engine Optimization Neural Schema Architecture" class="article-body-image" loading="lazy" />
  <figcaption class="article-image-caption">Diagram visualisasi alur RAG indexing dan entity connecting untuk LLM.</figcaption>
</figure>

Setiap entitas dalam diagram di atas saling terhubung melalui identifier schema @id, memungkinkan bot ekstraksi AI memahami konteks merek Anda tanpa ambiguitas. Untuk kebutuhan scale-up, kolaborasi dengan [layanan B2B SEO enterprise](/articles/b2b-seo-services/) dapat mempercepat penetrasi pipeline organik.`;

    const chunk3Content = `## Metrik Pengukuran ROI Organik & Checklist Eksekusi

Mengukur keberhasilan GEO memerlukan transisi dari sekadar ranking posisi kata kunci ke metrik **Share of Model (SoM)** dan frekuensi kutipan AI.

### Checklist Implementasi Praktis
1. Audit densitas entitas pada halaman pilar utama.
2. Pasang definitive answer block 40-60 kata tepat di bawah heading H1.
3. Sambungkan skema Organization, Article, dan FAQPage.

Strategi ini menjamin visibilitas jangka panjang perusahaan Anda di seluruh ekosistem pencarian AI masa depan.`;

    const synthesisResponse = JSON.stringify({
      title: 'The Complete Enterprise Generative Engine Optimization (GEO) Blueprint',
      slug: 'enterprise-generative-engine-optimization-blueprint',
      description: 'Panduan arsitektur Generative Engine Optimization (GEO) untuk mendominasi jawaban ChatGPT, Perplexity, dan Google AI Overviews.',
      quickAnswer: 'Generative Engine Optimization (GEO) adalah pendekatan strategis untuk mengoptimalkan konten digital agar disintesis dan dikutip secara otoritatif oleh mesin jawaban AI.',
      tags: ['GEO', 'Technical SEO', 'B2B SEO', 'AI Search'],
      faq: [
        {
          question: 'Berapa lama AI Search mengindeks answer block baru?',
          answer: 'Siklus pengindeksan LLM biasanya berkisar antara 7 hingga 21 hari setelah schema entity dideploy.',
        },
        {
          question: 'Mengapa traditional SEO tidak cukup untuk AI answers?',
          answer: 'SEO tradisional mengoptimalkan link ranking, sedangkan AI engine melakukan RAG passage retrieval.',
        },
      ],
    });

    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(async (_url, _opts) => {
      callCount++;
      // Call 1: Vision Analysis
      if (callCount === 1) {
        return {
          ok: true,
          json: async () => ({ choices: [{ message: { content: visionResponse } }] }),
        };
      }
      // Call 2: Outline Generation
      if (callCount === 2) {
        return {
          ok: true,
          json: async () => ({ choices: [{ message: { content: outlineResponse } }] }),
        };
      }
      // Call 3: Chunk 1
      if (callCount === 3) {
        return {
          ok: true,
          json: async () => ({ choices: [{ message: { content: chunk1Content } }] }),
        };
      }
      // Call 4: Chunk 2
      if (callCount === 4) {
        return {
          ok: true,
          json: async () => ({ choices: [{ message: { content: chunk2Content } }] }),
        };
      }
      // Call 5: Chunk 3
      if (callCount === 5) {
        return {
          ok: true,
          json: async () => ({ choices: [{ message: { content: chunk3Content } }] }),
        };
      }
      // Call 6: Synthesis
      if (callCount === 6) {
        return {
          ok: true,
          json: async () => ({ choices: [{ message: { content: synthesisResponse } }] }),
        };
      }
      return { ok: true, json: async () => ({}) };
    });

    // -----------------------------------------------------------------------
    // Phase 5: Executing Multi-Stage Pipeline in Real Order
    // -----------------------------------------------------------------------
    // Stage 1: Vision
    const vision = await studio.runStage1ImageAnalysis();
    expect(vision.alt).toContain('Enterprise Generative Engine Optimization');

    // Stage 2: Outline
    const outline = await studio.runStage2OutlineGeneration();
    expect(outline.sections).toHaveLength(3);

    // Stage 3: Multi-turn 3x Body Generation
    const fullBody = await studio.runStage3ChunkedBodyGeneration();
    expect(studio.state.bodyChunks).toHaveLength(3);
    expect(fullBody).toContain('<figure class="article-image-figure">');
    expect(fullBody).toContain('[layanan B2B SEO enterprise](/articles/b2b-seo-services/)');

    // Stage 4: Synthesis
    const article = await studio.runStage4Synthesis();
    expect(article.title).toBe('The Complete Enterprise Generative Engine Optimization (GEO) Blueprint');
    expect(article.slug).toBe('enterprise-generative-engine-optimization-blueprint');
    expect(article.faq).toHaveLength(2);

    // -----------------------------------------------------------------------
    // Phase 6: User clicks "Terapkan ke Editor Decap" (DOM Injection)
    // -----------------------------------------------------------------------
    const injectionSuccess = studio.injectIntoDecapForm();
    expect(injectionSuccess).toBe(true);

    // Verify all Decap CMS inputs now hold the synthesized content
    const titleField = document.getElementById('title-field-1') as HTMLInputElement;
    const slugField = document.getElementById('slug-field-1') as HTMLInputElement;
    const descField = document.getElementById('description-field-1') as HTMLTextAreaElement;
    const quickField = document.getElementById('quickAnswer-field-1') as HTMLTextAreaElement;
    const coverImageField = document.getElementById('coverImage-field-1') as HTMLInputElement;
    const coverAltField = document.getElementById('coverAlt-field-1') as HTMLInputElement;
    const bodyField = document.getElementById('body-field-1') as HTMLTextAreaElement;

    expect(titleField.value).toBe('The Complete Enterprise Generative Engine Optimization (GEO) Blueprint');
    expect(slugField.value).toBe('enterprise-generative-engine-optimization-blueprint');
    expect(descField.value).toContain('Panduan arsitektur Generative Engine Optimization');
    expect(quickField.value).toContain('Generative Engine Optimization (GEO) adalah pendekatan strategis');
    expect(coverImageField.value).toBe('/images/uploads/article-geo-rag-architecture.png');
    expect(coverAltField.value).toContain('Enterprise Generative Engine Optimization');
    expect(bodyField.value).toContain('Pergeseran Lanskap Search: Dari Ranking Tautan ke Sintesis AI');
    expect(bodyField.value).toContain('<figure class="article-image-figure">');
    expect(bodyField.value).toContain('[layanan B2B SEO enterprise](/articles/b2b-seo-services/)');
  });
});
