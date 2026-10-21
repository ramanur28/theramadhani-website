import { describe, it, expect, beforeEach, vi } from 'vitest';
import '../public/admin/ai-studio.js';

const studio = (typeof window !== 'undefined' && (window as any).DecapAIStudio) || (globalThis as any).DecapAIStudio;

describe('Multi-Stage AI Article Pipeline', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    studio.state.provider = 'openai';
    studio.state.openaiKey = 'mock-key';
    studio.state.openaiModel = 'gpt-6-luna';
    studio.state.topic = 'Generative Engine Optimization Architecture';
    studio.state.focusKeyphrases = ['generative engine optimization', 'geo blueprint'];
    studio.state.strategy = 'geo_ai_search';
    studio.state.selectedLinks = [
      { title: 'Technical SEO Guide', url: '/articles/technical-seo-services/', anchor: 'layanan technical SEO' },
    ];
  });

  describe('Stage 1: Vision Image Analysis', () => {
    it('analyzes uploaded image and returns structured alt, caption, and insights', async () => {
      studio.state.uploadedImage = {
        name: 'geo-diagram.png',
        cleanName: 'article-geo-diagram.png',
        base64: 'data:image/png;base64,mockbase64',
        url: '/images/uploads/article-geo-diagram.png',
      };

      const mockVisionResponse = JSON.stringify({
        alt: 'Arsitektur Generative Engine Optimization Entity Graph',
        caption: 'Diagram alur koneksi schema entity untuk AI Search Engine.',
        visualInsights: 'Menunjukkan relasi antara entity graph, RAG extraction, dan definitive answer block.',
        recommendedPlacement: 'Bagian 2: Arsitektur Entity Graph',
      });

      global.fetch = vi.fn().mockImplementation(async () => ({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: mockVisionResponse } }],
        }),
      }));

      const result = await studio.runStage1ImageAnalysis();

      expect(result).not.toBeNull();
      expect(result.alt).toBe('Arsitektur Generative Engine Optimization Entity Graph');
      expect(result.caption).toContain('Diagram alur koneksi schema entity');
      expect(studio.state.visionAnalysis).toEqual(result);
    });

    it('returns null when no image is uploaded', async () => {
      studio.state.uploadedImage = null;
      const result = await studio.runStage1ImageAnalysis();
      expect(result).toBeNull();
      expect(studio.state.visionAnalysis).toBeNull();
    });
  });

  describe('Stage 2: Outline Generation', () => {
    it('generates a structured outline with H2/H3 hierarchy and FAQ intent', async () => {
      const mockOutlineResponse = JSON.stringify({
        proposedTitle: 'The Complete Generative Engine Optimization Blueprint for 2026',
        proposedSlug: 'generative-engine-optimization-blueprint-2026',
        sections: [
          {
            heading: 'Memahami Pergeseran dari 10 Blue Links ke AI Answer Synthesis',
            subheadings: ['Evolusi Search Engine', 'Peran Retrieval Augmented Generation (RAG)'],
            focus: 'Fondasi teoretis dan arsitektural',
            includesImage: false,
          },
          {
            heading: 'Empat Pilar Utama Implementasi GEO',
            subheadings: ['Direct Answer Block 40-60 Kata', 'Connected Schema Entity Graphs'],
            focus: 'Implementasi teknis',
            includesImage: true,
          },
          {
            heading: 'Metrik Evaluasi dan Monitoring AI Answer Citations',
            subheadings: ['Tracking Citation Frequency', 'Pengaruh terhadap Organic Pipeline'],
            focus: 'Analisis dan evaluasi',
            includesImage: false,
          },
        ],
        faqSuggestions: [
          { question: 'Berapa lama waktu yang dibutuhkan untuk terindeks di AI answers?' },
          { question: 'Apa perbedaan mendasar SEO tradisional dengan GEO?' },
        ],
      });

      global.fetch = vi.fn().mockImplementation(async () => ({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: mockOutlineResponse } }],
        }),
      }));

      const outline = await studio.runStage2OutlineGeneration();

      expect(outline.sections).toHaveLength(3);
      expect(outline.proposedTitle).toBe('The Complete Generative Engine Optimization Blueprint for 2026');
      expect(outline.sections[1].includesImage).toBe(true);
      expect(studio.state.outline).toHaveLength(3);
      expect(studio.state.proposedTitle).toBe(outline.proposedTitle);
    });
  });

  describe('Stage 3: Multi-turn Chunked Body Generation', () => {
    it('divides outline into 3 chunks and chains context across turns', async () => {
      studio.state.chunkPref = 3;
      studio.state.outline = [
        { heading: 'Section 1: Introduction', subheadings: ['Sub 1A'], focus: 'Intro' },
        { heading: 'Section 2: Architecture', subheadings: ['Sub 2A'], focus: 'Architecture', includesImage: true },
        { heading: 'Section 3: Optimization', subheadings: ['Sub 3A'], focus: 'Optimization' },
      ];
      studio.state.uploadedImage = {
        url: '/images/uploads/diagram.png',
        cleanName: 'diagram.png',
      };
      studio.state.visionAnalysis = {
        alt: 'Diagram Arsitektur',
        caption: 'Alur proses RAG',
      };

      const capturedPrompts: string[] = [];
      global.fetch = vi.fn().mockImplementation(async (_url, opts) => {
        const body = JSON.parse(opts.body);
        const userMsg = body.messages[body.messages.length - 1].content;
        capturedPrompts.push(userMsg);
        return {
          ok: true,
          json: async () => ({
            choices: [{ message: { content: `## Generated Content for Turn ${capturedPrompts.length}\n\nParagraf konten teknis mendalam...` } }],
          }),
        };
      });

      const fullBody = await studio.runStage3ChunkedBodyGeneration();

      // Expect 3 sequential AI calls
      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(studio.state.bodyChunks).toHaveLength(3);

      // Turn 1 should contain Quick Answer instruction
      expect(capturedPrompts[0]).toContain('Quick Answer Block definitif 40-60 kata');

      // Turn 2 should contain preceding chunk context (Context Chaining)
      expect(capturedPrompts[1]).toContain('KONTEKS SEBELUMNYA');

      // Turn 2 should contain image component instruction because section 2 includesImage = true
      expect(capturedPrompts[1]).toContain('<figure class="article-image-figure">');

      // Turn 3 should contain conclusion instruction
      expect(capturedPrompts[2]).toContain('PENTING UNTUK BAGIAN AKHIR');

      expect(fullBody).toContain('## Generated Content for Turn 1');
      expect(fullBody).toContain('## Generated Content for Turn 3');
    });

    it('generates a single chunk when chunkPref = 1', async () => {
      studio.state.chunkPref = 1;
      studio.state.outline = [
        { heading: 'Section 1', subheadings: [] },
        { heading: 'Section 2', subheadings: [] },
      ];

      global.fetch = vi.fn().mockImplementation(async () => ({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '## Full Single Body Content' } }],
        }),
      }));

      const body = await studio.runStage3ChunkedBodyGeneration();
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(studio.state.bodyChunks).toHaveLength(1);
      expect(body).toBe('## Full Single Body Content');
    });
  });

  describe('Stage 4: Synthesis & Supporting Metadata', () => {
    it('synthesizes title, slug, meta description, quickAnswer, and FAQs', async () => {
      studio.state.bodyChunks = [
        '## Bagian 1\nPenjelasan fondasi...',
        '## Bagian 2\nPenjelasan implementasi...',
      ];

      const mockSynthesisResponse = JSON.stringify({
        title: 'Panduan Generative Engine Optimization (GEO) 2026',
        slug: 'panduan-generative-engine-optimization-2026',
        description: 'Kuasai Generative Engine Optimization (GEO) untuk mendominasi jawaban ChatGPT, Perplexity, dan Google AI Overviews.',
        quickAnswer: 'Generative Engine Optimization (GEO) adalah metodologi optimasi konten digital yang dirancang khusus untuk mesin pencari berbasis Large Language Models.',
        tags: ['GEO', 'Technical SEO', 'AI Search', 'LLM'],
        faq: [
          {
            question: 'Apa perbedaan SEO dan GEO?',
            answer: 'SEO berfokus pada ranking 10 blue links, sedangkan GEO berfokus pada kutipan LLM.',
          },
          {
            question: 'Apakah schema entity wajib dalam GEO?',
            answer: 'Ya, schema entity membantu AI mengekstrak relasi fakta tanpa ambiguitas.',
          },
        ],
      });

      global.fetch = vi.fn().mockImplementation(async () => ({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: mockSynthesisResponse } }],
        }),
      }));

      const result = await studio.runStage4Synthesis();

      expect(result).not.toBeNull();
      expect(result.title).toBe('Panduan Generative Engine Optimization (GEO) 2026');
      expect(result.slug).toBe('panduan-generative-engine-optimization-2026');
      expect(result.description.length).toBeGreaterThan(50);
      expect(result.quickAnswer).toContain('Generative Engine Optimization (GEO) adalah');
      expect(result.faq).toHaveLength(2);
      expect(result.tags).toContain('GEO');
      expect(studio.state.synthesizedArticle).toEqual(result);
    });
  });
  describe('Strategy Management & Custom Strategy CRUD', () => {
    it('retrieves all default strategy presets', () => {
      const all = studio.getAllStrategies();
      expect(all).toHaveProperty('geo_ai_search');
      expect(all).toHaveProperty('technical_deepdive');
      expect(all).toHaveProperty('executive_roi');
      expect(all).toHaveProperty('step_by_step_tutorial');
      expect(all.geo_ai_search.isCustom).toBe(false);
    });

    it('creates and persists a new custom strategy without localStorage reliance', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async () => ({
        ok: true,
        json: async () => ({ success: true }),
      } as any));

      const custom = await studio.createCustomStrategy({
        title: 'B2B High-Converting SaaS Copywriting',
        desc: 'Fokus pada CTA, ROI, dan perbandingan solusi langsung.',
        instructions: 'Adopt a senior SaaS copywriter persona with strong direct-response principles.',
      });

      expect(custom).toHaveProperty('id');
      expect(custom.id).toMatch(/^strat_/);
      expect(custom.title).toBe('B2B High-Converting SaaS Copywriting');
      expect(custom.isCustom).toBe(true);

      // Verify fetch was dispatched to /api/strategies
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/strategies',
        expect.objectContaining({ method: 'POST' })
      );

      // Verify localStorage was NOT used for storing strategies
      expect(localStorage.getItem('__decap_ai_custom_strategies')).toBeNull();

      const all = studio.getAllStrategies();
      expect(all[custom.id]).toBeDefined();
      expect(all[custom.id].instructions).toContain('senior SaaS copywriter');
    });

    it('updates an existing custom strategy on disk', async () => {
      vi.spyOn(global, 'fetch').mockImplementation(async () => ({
        ok: true,
        json: async () => ({ success: true }),
      } as any));

      const custom = await studio.createCustomStrategy({
        title: 'Initial Title',
        desc: 'Initial Desc',
        instructions: 'Initial Instructions',
      });

      const updated = await studio.updateCustomStrategy(custom.id, {
        title: 'Updated Strategic Title',
        desc: 'Updated Desc',
        instructions: 'Updated Instructions for AI',
      });

      expect(updated.title).toBe('Updated Strategic Title');
      expect(updated.instructions).toBe('Updated Instructions for AI');

      const retrieved = studio.getStrategy(custom.id);
      expect(retrieved.title).toBe('Updated Strategic Title');
    });

    it('prevents editing or deleting built-in default presets', async () => {
      await expect(async () => {
        await studio.updateCustomStrategy('geo_ai_search', {
          title: 'Hacked Title',
          instructions: 'Hacked',
        });
      }).rejects.toThrow('Strategi bawaan sistem tidak dapat diedit.');

      await expect(async () => {
        await studio.deleteCustomStrategy('geo_ai_search');
      }).rejects.toThrow('Strategi bawaan sistem tidak dapat dihapus.');
    });

    it('deletes custom strategy and resets to default if selected', async () => {
      vi.spyOn(global, 'fetch').mockImplementation(async () => ({
        ok: true,
        json: async () => ({ success: true }),
      } as any));

      const custom = await studio.createCustomStrategy({
        title: 'Temporary Strategy',
        desc: 'Temp',
        instructions: 'Temp instructions',
      });

      studio.state.strategy = custom.id;
      const deleted = await studio.deleteCustomStrategy(custom.id);
      expect(deleted).toBe(true);

      const all = studio.getAllStrategies();
      expect(all[custom.id]).toBeUndefined();
      expect(studio.state.strategy).toBe('geo_ai_search');
    });

    it('validates required fields when creating or updating custom strategy', async () => {
      await expect(async () => {
        await studio.createCustomStrategy({ title: '', instructions: 'some instructions' });
      }).rejects.toThrow('Judul strategi tidak boleh kosong.');

      await expect(async () => {
        await studio.createCustomStrategy({ title: 'My Strategy', instructions: '' });
      }).rejects.toThrow('Instruksi AI prompt strategi tidak boleh kosong.');
    });
  });
  describe('Rich Outline Specification, Citations & Language Consistency', () => {
    it('OUT-01: generates a rich outline with 50-60 char title, meta description, slug, tags, H1, word counts, table, quotes, and 3 CTAs', async () => {
      studio.state.topic = 'Generative Engine Optimization Guide';
      studio.state.focusKeyphrases = ['Generative Engine Optimization', 'GEO Audit'];
      studio.state.includeCitations = true;

      const mockRichOutline = JSON.stringify({
        title: 'Generative Engine Optimization: The Definitive Blueprint', // 56 chars, includes Primary Keyword
        metaDescription: 'Master Generative Engine Optimization to capture citations in Perplexity, Claude, and Google AI Overviews with our technical architectural framework.', // 152 chars
        slug: 'generative-engine-optimization-blueprint', // 41 chars, hyphens only
        tags: ['GEO', 'Technical SEO', 'AI Search', 'Knowledge Graph'],
        h1: 'Generative Engine Optimization: The Definitive Architectural Guide',
        sections: [
          {
            heading: 'From 10 Blue Links to Synthesized AI Citations',
            subheadings: ['How LLMs Retrieve Web Documents', 'The RAG Pipeline Explained'],
            targetWordCount: 400,
            focus: 'Theoretical shift to RAG answer engines',
            tableNote: null,
            quoteNote: 'Quote from leading information retrieval researcher on probabilistic answer generation',
            ctaNote: 'CTA #1: Complimentary Architectural GEO Audit',
            includesImage: false,
          },
          {
            heading: 'Benchmark Matrix: Traditional SEO vs Generative Engine Optimization',
            subheadings: ['Entity Extraction Fidelity', 'Token Context Window Limits'],
            targetWordCount: 500,
            focus: 'Direct technical comparison',
            tableNote: 'Comparison Table: Traditional SEO vs GEO across 6 architectural dimensions',
            quoteNote: null,
            ctaNote: 'CTA #2: Download the Enterprise GEO Implementation Checklist',
            includesImage: true,
          },
          {
            heading: 'Strategic Execution & Long-Term Competitive Advantage',
            subheadings: ['Brand Entity Graph Optimization', 'Monitoring AI Search Share of Voice'],
            targetWordCount: 450,
            focus: 'Actionable transformation and measurement',
            tableNote: null,
            quoteNote: null,
            ctaNote: 'CTA #3: Schedule Direct Consultation with Ramadhani',
            includesImage: false,
          },
        ],
        faqSuggestions: [
          { question: 'What is Generative Engine Optimization?', intent: 'Definition' },
          { question: 'How does GEO differ from traditional SEO?', intent: 'Comparison' },
          { question: 'Does Schema Markup impact AI search citation?', intent: 'Technical verification' },
          { question: 'What tools monitor brand mentions in ChatGPT?', intent: 'Tooling & instrumentation' },
          { question: 'How long does it take to see citations?', intent: 'Timeline & ROI' },
        ],
      });

      global.fetch = vi.fn().mockImplementation(async () => ({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: mockRichOutline } }],
        }),
      }));

      const parsed = await studio.runStage2OutlineGeneration();

      expect(parsed.title).toBe('Generative Engine Optimization: The Definitive Blueprint');
      expect(parsed.title.length).toBeGreaterThanOrEqual(50);
      expect(parsed.title.length).toBeLessThanOrEqual(60);
      expect(parsed.title).toContain('Generative Engine Optimization');

      expect(parsed.metaDescription.length).toBeGreaterThanOrEqual(140);
      expect(parsed.metaDescription.length).toBeLessThanOrEqual(160);

      expect(parsed.slug.length).toBeLessThanOrEqual(60);
      expect(parsed.slug).not.toContain(' ');
      expect(parsed.slug).toContain('generative-engine-optimization');

      expect(parsed.tags).toHaveLength(4);
      expect(parsed.h1).toBe('Generative Engine Optimization: The Definitive Architectural Guide');

      // Verify sections with word counts, table, quote, and 3 CTAs
      expect(parsed.sections).toHaveLength(3);
      expect(parsed.sections[0].targetWordCount).toBe(400);
      expect(parsed.sections[1].tableNote).toContain('Comparison Table');
      expect(parsed.sections[0].quoteNote).toContain('Quote');

      // Verify all 3 outcome-driven CTAs are present across the outline
      const ctas = parsed.sections.map((s: any) => s.ctaNote).filter(Boolean);
      expect(ctas).toHaveLength(3);
      expect(ctas[0]).toContain('CTA #1');
      expect(ctas[1]).toContain('CTA #2');
      expect(ctas[2]).toContain('CTA #3');

      // Verify state was populated correctly
      expect(studio.state.proposedTitle).toBe(parsed.title);
      expect(studio.state.proposedSlug).toBe(parsed.slug);
      expect(studio.state.proposedDescription).toBe(parsed.metaDescription);
      expect(studio.state.proposedTags).toEqual(parsed.tags);
      expect(studio.state.proposedH1).toBe(parsed.h1);
    });

    it('CIT-01: prompts for inline citations and references section when includeCitations is enabled', async () => {
      studio.state.includeCitations = true;
      studio.state.chunkPref = 1;
      studio.state.language = 'en';
      studio.state.outline = [
        {
          heading: 'Core Architecture',
          subheadings: ['Entity Relations'],
          targetWordCount: 500,
          tableNote: null,
          quoteNote: null,
          ctaNote: 'CTA #1: Audit',
        },
      ];

      let capturedPrompt = '';
      global.fetch = vi.fn().mockImplementation(async (_url, options: any) => {
        const body = JSON.parse(options.body);
        capturedPrompt = body.messages[1].content;
        return {
          ok: true,
          json: async () => ({
            choices: [{
              message: {
                content: '## Core Architecture\n\nEntities play a vital role [^1].\n\n### References & Authoritative Sources\n\n1. [^1]: Google Search Central, 2025.',
              },
            }],
          }),
        };
      });

      const body = await studio.runStage3ChunkedBodyGeneration();
      expect(capturedPrompt).toContain('CITATION INSTRUCTIONS');
      expect(capturedPrompt).toContain('### References & Authoritative Sources');
      expect(body).toContain('### References & Authoritative Sources');
    });

    it('LNG-01: strictly enforces English system and user prompts without Indonesian words when language is en', async () => {
      studio.state.language = 'en';
      studio.state.bodyChunks = [
        '## Executive Overview\n\nGenerative Engine Optimization is the discipline of optimizing digital content for large language models.',
      ];

      let capturedSystemPrompt = '';
      let capturedUserPrompt = '';

      global.fetch = vi.fn().mockImplementation(async (_url, options: any) => {
        const body = JSON.parse(options.body);
        capturedSystemPrompt = body.messages[0].content;
        capturedUserPrompt = body.messages[1].content;
        return {
          ok: true,
          json: async () => ({
            choices: [{
              message: {
                content: JSON.stringify({
                  title: 'Generative Engine Optimization Blueprint 2026',
                  slug: 'geo-blueprint-2026',
                  description: 'The authoritative technical guide on generative engine optimization for technical SEO professionals and architects.',
                  quickAnswer: 'Generative Engine Optimization (GEO) is the technical methodology of structuring content with semantic entity graphs for LLM retrieval.',
                  tags: ['GEO', 'Technical SEO'],
                  faq: [
                    { question: 'What is GEO?', answer: 'GEO stands for Generative Engine Optimization.' },
                    { question: 'How to implement GEO?', answer: 'Deploy structured JSON-LD and direct answer blocks.' },
                    { question: 'Does GEO replace SEO?', answer: 'No, GEO complements traditional organic search.' },
                    { question: 'How is citation tracked?', answer: 'Use LLM answer monitoring benchmarks.' },
                  ],
                }),
              },
            }],
          }),
        };
      });

      const res = await studio.runStage4Synthesis();

      expect(capturedSystemPrompt).toContain('strictly in English');
      expect(capturedUserPrompt).toContain('CRITICAL LANGUAGE REQUIREMENT');
      expect(capturedUserPrompt).toContain('All outputs must be 100% in English');

      expect(res.quickAnswer).toContain('Generative Engine Optimization');
      expect(res.faq).toHaveLength(4);
      expect(res.faq[0].question).toBe('What is GEO?');
    });

    it('FAQ-02: generates and synthesizes more than 3 FAQs without artificial limitation', async () => {
      studio.state.language = 'en';
      studio.state.bodyChunks = ['## Full Content...'];

      const mockFaqList = [
        { question: 'Question 1?', answer: 'Answer 1.' },
        { question: 'Question 2?', answer: 'Answer 2.' },
        { question: 'Question 3?', answer: 'Answer 3.' },
        { question: 'Question 4?', answer: 'Answer 4.' },
        { question: 'Question 5?', answer: 'Answer 5.' },
      ];

      global.fetch = vi.fn().mockImplementation(async () => ({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                title: 'Guide Title',
                slug: 'guide-title',
                description: 'Meta description',
                quickAnswer: 'Quick answer',
                tags: ['GEO'],
                faq: mockFaqList,
              }),
            },
          }],
        }),
      }));

      const res = await studio.runStage4Synthesis();
      expect(res.faq.length).toBe(5);
      expect(res.faq.length).toBeGreaterThan(3);
    });
  });

  describe('Multi-Image Upload & WebP Client Compression Engine', () => {
    it('IMG-01: supports uploading multiple images and populates state.uploadedImages', async () => {
      // Mock File objects
      const file1 = new File(['mock svg content'], 'architecture-flow.svg', { type: 'image/svg+xml' });
      const file2 = new File(['mock png content'], 'benchmark-table.png', { type: 'image/png' });

      // Clear existing
      studio.state.uploadedImages = [];
      studio.state.uploadedImage = null;

      await studio.handleUploadedImages([file1, file2]);

      expect(studio.state.uploadedImages.length).toBe(2);
      expect(studio.state.uploadedImages[0].name).toBe('architecture-flow.svg');
      expect(studio.state.uploadedImages[1].name).toBe('benchmark-table.png');

      // First image should be marked as cover by default
      expect(studio.state.uploadedImages[0].isCover).toBe(true);
      expect(studio.state.uploadedImages[1].isCover).toBe(false);

      // state.uploadedImage should point to cover
      expect(studio.state.uploadedImage).toBe(studio.state.uploadedImages[0]);
    });

    it('IMG-02: allows switching cover image dynamically with setCoverImage', () => {
      expect(studio.state.uploadedImages.length).toBe(2);
      const secondId = studio.state.uploadedImages[1].id;

      studio.setCoverImage(secondId);

      expect(studio.state.uploadedImages[0].isCover).toBe(false);
      expect(studio.state.uploadedImages[1].isCover).toBe(true);
      expect(studio.state.uploadedImage.id).toBe(secondId);
      expect(studio.state.uploadedImage.name).toBe('benchmark-table.png');
    });

    it('IMG-03: supports removing single image and re-assigning cover if cover was removed', () => {
      const removedId = studio.state.uploadedImages[1].id;
      studio.removeUploadedImage(removedId);

      expect(studio.state.uploadedImages.length).toBe(1);
      // Remaining image should automatically become cover
      expect(studio.state.uploadedImages[0].isCover).toBe(true);
      expect(studio.state.uploadedImage.id).toBe(studio.state.uploadedImages[0].id);

      studio.clearAllImages();
      expect(studio.state.uploadedImages.length).toBe(0);
      expect(studio.state.uploadedImage).toBeNull();
    });

    it('IMG-04: compresses SVG with zero pixel distortion and returns valid metadata', async () => {
      const svgFile = new File(['<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>'], 'icon.svg', {
        type: 'image/svg+xml',
      });
      const comp = await studio.compressImage(svgFile);

      expect(comp).not.toBeNull();
      expect(comp.format).toBe('svg');
      expect(comp.mimeType).toBe('image/svg+xml');
      expect(comp.base64).toContain('data:image/svg+xml');
    });

    it('IMG-05: distributes multiple uploaded images across article sections in Stage 3 chunking', async () => {
      studio.state.uploadedImages = [
        {
          id: 'img-1',
          name: 'hero-architecture.webp',
          cleanName: 'article-hero.webp',
          url: '/images/uploads/article-hero.webp',
          base64: 'data:image/webp;base64,mock1',
          isCover: true,
          visionAnalysis: { alt: 'Architecture Hero', caption: 'High-level system topology.' },
        },
        {
          id: 'img-2',
          name: 'benchmark-graph.webp',
          cleanName: 'article-benchmark.webp',
          url: '/images/uploads/article-benchmark.webp',
          base64: 'data:image/webp;base64,mock2',
          isCover: false,
          visionAnalysis: { alt: 'Performance Benchmarks', caption: 'Latency comparison across models.' },
        },
      ];
      studio.state.uploadedImage = studio.state.uploadedImages[0];

      studio.state.outline = [
        { heading: 'Overview', subheadings: [], focus: 'Intro', includesImage: true },
        { heading: 'Benchmark Details', subheadings: [], focus: 'Data', includesImage: true },
      ];
      studio.state.chunkPref = 1;

      let capturedPrompt = '';
      global.fetch = vi.fn().mockImplementation(async (_url, opts) => {
        const body = JSON.parse(opts.body);
        capturedPrompt = body.messages[1].content;
        return {
          ok: true,
          json: async () => ({
            choices: [{ message: { content: '## Section with images\nContent...' } }],
          }),
        };
      });

      await studio.runStage3ChunkedBodyGeneration();

      expect(capturedPrompt).toContain('/images/uploads/article-hero.webp');
      expect(capturedPrompt).toContain('/images/uploads/article-benchmark.webp');
    });
  });
});
