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
      global.fetch = vi.fn().mockImplementation(async (url, opts) => {
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
});
