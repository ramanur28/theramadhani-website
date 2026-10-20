/**
 * AI Article Studio for Decap CMS
 * Multi-Stage AI Content Engineering Platform
 * 
 * Supports:
 * - Providers: Google Gemini & OpenAI (including GPT-6 Luna & GPT Mini)
 * - Stage 1: Multimodal Vision Image Analysis & Disk Persistence
 * - Stage 2: Structural Outline Generation with Strategy & Keyphrases
 * - Stage 3: Multi-turn Chunked Body Writing (1x, 2x, 3x Chunks)
 * - Stage 4: Synthesis of Supporting Elements (Slug, Meta Desc, Quick Answer, FAQs, Tags)
 * - Internal Links Hub: Auto-discovery + Manual Link Editor
 * - Decap Form Synchronizer: One-click injection into CMS fields
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. Storage & State Management
  // =========================================================================
  const STORAGE_KEYS = {
    PROVIDER: '__decap_ai_provider',
    GEMINI_KEY: '__decap_ai_gemini_key',
    OPENAI_KEY: '__decap_ai_openai_key',
    GEMINI_MODEL: '__decap_ai_gemini_model',
    OPENAI_MODEL: '__decap_ai_openai_model',
    STRATEGY: '__decap_ai_strategy',
    CHUNKS: '__decap_ai_chunks_pref',
  };

  const state = {
    isOpen: false,
    currentStep: 1, // 1: Setup & Strategy, 2: Media & Links, 3: Outline, 4: Body, 5: Review
    provider: localStorage.getItem(STORAGE_KEYS.PROVIDER) || 'gemini',
    geminiKey: localStorage.getItem(STORAGE_KEYS.GEMINI_KEY) || '',
    openaiKey: localStorage.getItem(STORAGE_KEYS.OPENAI_KEY) || '',
    geminiModel: (() => {
      const saved = localStorage.getItem(STORAGE_KEYS.GEMINI_MODEL);
      if (!saved || saved === 'gemini-2.5-flash') {
        localStorage.setItem(STORAGE_KEYS.GEMINI_MODEL, 'gemini-3.8-flash');
        return 'gemini-3.8-flash';
      }
      return saved;
    })(),
    openaiModel: localStorage.getItem(STORAGE_KEYS.OPENAI_MODEL) || 'gpt-6-luna',
    strategy: localStorage.getItem(STORAGE_KEYS.STRATEGY) || 'geo_ai_search',
    chunkPref: parseInt(localStorage.getItem(STORAGE_KEYS.CHUNKS) || '3', 10),
    
    // User inputs
    topic: '',
    focusKeyphrases: [],
    language: 'id', // 'id' or 'en'
    
    // Media & Vision
    uploadedImage: null, // { file, name, cleanName, base64, url }
    visionAnalysis: null, // { alt, caption, visualInsights, entities }
    
    // Internal Links
    siteCatalog: [],
    selectedLinks: [], // [{ title, url, anchor }]
    
    // Generation outputs
    outline: [],
    bodyChunks: [],
    synthesizedArticle: null, // { title, slug, description, quickAnswer, tags, faq, body, coverImage, coverAlt }
    isGenerating: false,
  };

  // =========================================================================
  // 2. Default Strategy Presets
  // =========================================================================
  const STRATEGY_PRESETS = {
    geo_ai_search: {
      title: 'GEO & AI Answer Authority',
      desc: 'Optimasi kutipan ChatGPT, Perplexity, Claude, dan Google AI Overviews. Fokus pada 40-60 word quick answer block, densitas entitas teknis, dan data empiris.',
      instructions: 'Prioritize Generative Engine Optimization (GEO). Write dense, entity-rich explanations. Provide a definitive 40-60 word executive answer block directly under the primary heading. Avoid conversational fluff. Include structured technical comparisons.',
    },
    technical_deepdive: {
      title: 'Technical SEO & Engineering Deep-Dive',
      desc: 'Arsitektur web, crawlability, Core Web Vitals, server configuration, dan audit teknis komprehensif.',
      instructions: 'Adopt a senior technical SEO engineer persona. Deeply explain architecture, crawl budget, DOM rendering, schema graphs, and performance diagnostics with rigorous accuracy.',
    },
    executive_roi: {
      title: 'Executive Thought Leadership & ROI',
      desc: 'Strategi pertumbuhan organik B2B, atribusi pendapatan, pipeline marketing, dan efisiensi CAC.',
      instructions: 'Write for C-level executives, founders, and VP of Marketing. Focus on organic pipeline ROI, commercial intent keywords, customer acquisition cost reduction, and enterprise scalability.',
    },
    step_by_step_tutorial: {
      title: 'Step-by-Step Technical Tutorial',
      desc: 'Panduan implementasi praktis bertahap dari prasyarat, setup, eksekusi kode/konfigurasi, hingga pengujian.',
      instructions: 'Provide an actionable, methodical step-by-step implementation guide with clear prerequisites, configuration snippets, verification steps, and troubleshooting FAQs.',
    },
  };

  // =========================================================================
  // 3. API Client Engine (Gemini & OpenAI)
  // =========================================================================
  async function callAI({ prompt, systemPrompt, imageBase64, mimeType = 'image/png', jsonMode = false }) {
    if (state.provider === 'gemini') {
      return callGemini({ prompt, systemPrompt, imageBase64, mimeType, jsonMode });
    } else {
      return callOpenAI({ prompt, systemPrompt, imageBase64, mimeType, jsonMode });
    }
  }

  async function callGemini({ prompt, systemPrompt, imageBase64, mimeType, jsonMode }) {
    if (!state.geminiKey) throw new Error('Google Gemini API Key belum diisi. Masukkan kunci di tab Pengaturan.');
    
    const model = state.geminiModel || 'gemini-3.8-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(state.geminiKey)}`;

    const parts = [];
    if (systemPrompt) {
      parts.push({ text: `System Instruction: ${systemPrompt}\n\n` });
    }
    parts.push({ text: prompt });

    if (imageBase64) {
      parts.push({
        inline_data: {
          mime_type: mimeType || 'image/jpeg',
          data: imageBase64.replace(/^data:image\/[a-z]+;base64,/, ''),
        },
      });
    }

    const payload = {
      contents: [{ role: 'user', parts: parts }],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 8192,
        ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
      },
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Gemini API Error: Status ${res.status}`);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    if (!candidate || !candidate.content?.parts?.[0]?.text) {
      throw new Error('Gemini tidak mengembalikan teks output. Periksa kuota atau prompt Anda.');
    }
    return candidate.content.parts[0].text;
  }

  async function callOpenAI({ prompt, systemPrompt, imageBase64, mimeType, jsonMode }) {
    if (!state.openaiKey) throw new Error('OpenAI API Key belum diisi. Masukkan kunci di tab Pengaturan.');

    const model = state.openaiModel || 'gpt-6-luna';
    const endpoint = 'https://api.openai.com/v1/chat/completions';

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    if (imageBase64) {
      const fullDataUrl = imageBase64.startsWith('data:') 
        ? imageBase64 
        : `data:${mimeType || 'image/jpeg'};base64,${imageBase64}`;
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: fullDataUrl, detail: 'high' } },
        ],
      });
    } else {
      messages.push({ role: 'user', content: prompt });
    }

    // Reasoning models (Luna, o1, o3, gpt-6) often do not support temperature parameters
    const isReasoning = model.includes('luna') || model.startsWith('o1') || model.startsWith('o3') || model.startsWith('gpt-6');

    const payload = {
      model: model,
      messages: messages,
      ...(isReasoning ? {} : { temperature: 0.6 }),
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${state.openaiKey.trim()}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `OpenAI API Error: Status ${res.status}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI tidak mengembalikan output teks.');
    }
    return content;
  }

  // =========================================================================
  // 4. Catalog & Internal Links Auto-Discovery
  // =========================================================================
  async function loadSiteCatalog() {
    try {
      const res = await fetch('/api/articles-index');
      if (res.ok) {
        state.siteCatalog = await res.json();
        return state.siteCatalog;
      }
    } catch (e) {}

    try {
      const res = await fetch('/api/articles-index.json');
      if (res.ok) {
        state.siteCatalog = await res.json();
        return state.siteCatalog;
      }
    } catch (e) {}

    try {
      const res = await fetch('/rss.xml');
      if (res.ok) {
        const text = await res.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');
        const items = xml.querySelectorAll('item');
        const list = [];
        items.forEach((item) => {
          const title = item.querySelector('title')?.textContent || '';
          const link = item.querySelector('link')?.textContent || '';
          const desc = item.querySelector('description')?.textContent || '';
          const pathUrl = link ? new URL(link).pathname : '';
          if (title && pathUrl) {
            list.push({ title, url: pathUrl, description: desc, tags: [] });
          }
        });
        if (list.length > 0) {
          state.siteCatalog = list;
          return list;
        }
      }
    } catch (e) {}

    // Hardcoded safety baseline if offline
    state.siteCatalog = [
      { title: 'The Complete Generative Engine Optimization (GEO) Blueprint for 2026', url: '/articles/generative-engine-optimization-guide/', tags: ['GEO', 'AI Search'] },
      { title: 'Technical SEO Services: The Definitive Guide to Architecture', url: '/articles/technical-seo-services/', tags: ['Technical SEO'] },
      { title: 'How to Do an SEO Audit: Technical Framework', url: '/articles/how-to-do-an-seo-audit/', tags: ['SEO Audit'] },
      { title: 'B2B SEO Services: The Complete Strategy for Enterprise Pipeline', url: '/articles/b2b-seo-services/', tags: ['B2B SEO'] },
      { title: 'Technical SEO for AI Overviews: Core Web Vitals & Schema', url: '/articles/technical-seo-mastery-for-ai-overviews/', tags: ['AI Overviews'] },
    ];
    return state.siteCatalog;
  }

  function autoSuggestInternalLinks() {
    if (!state.siteCatalog || state.siteCatalog.length === 0) return;
    const keywords = state.focusKeyphrases.map((k) => k.toLowerCase().trim()).filter(Boolean);
    if (keywords.length === 0) {
      state.selectedLinks = state.siteCatalog.slice(0, 3).map((item) => ({
        title: item.title,
        url: item.url,
        anchor: item.title.split(':')[0].trim(),
      }));
      return;
    }

    const matches = [];
    state.siteCatalog.forEach((item) => {
      const textToSearch = (item.title + ' ' + (item.description || '') + ' ' + (item.tags || []).join(' ')).toLowerCase();
      let score = 0;
      keywords.forEach((kw) => {
        if (textToSearch.includes(kw)) score += 2;
        const words = kw.split(' ');
        words.forEach((w) => {
          if (w.length > 3 && textToSearch.includes(w)) score += 1;
        });
      });
      if (score > 0) {
        matches.push({ item, score });
      }
    });

    matches.sort((a, b) => b.score - a.score);
    const chosen = (matches.length > 0 ? matches.slice(0, 4).map((m) => m.item) : state.siteCatalog.slice(0, 3));
    state.selectedLinks = chosen.map((item) => ({
      title: item.title,
      url: item.url,
      anchor: item.title.split(':')[0].trim(),
    }));
  }

  // =========================================================================
  // 5. Multi-Stage Pipeline Implementations
  // =========================================================================

  // STAGE 1: Image Analysis (Vision API)
  async function runStage1ImageAnalysis() {
    if (!state.uploadedImage || !state.uploadedImage.base64) {
      state.visionAnalysis = null;
      return null;
    }

    updateProgressUI('Tahap 1: Menganalisa Gambar dengan Vision AI...', 'Mengekstrak entitas visual, diagram teks, dan rekomendasi penempatan...', 15);

    const prompt = `Analisa gambar/diagram teknis ini secara mendalam untuk artikel teknis digital marketing, SEO arsitektural, atau GEO.
Kembalikan respon HANYA dalam format JSON valid dengan struktur:
{
  "alt": "Alt text teroptimasi SEO dan screen reader (maksimal 120 karakter)",
  "caption": "Deskripsi teknis singkat yang akan diletakkan di figcaption di bawah gambar",
  "visualInsights": "Ringkasan konsep utama, relasi komponen, atau temuan statistik dari gambar ini",
  "recommendedPlacement": "Rekomendasi di section outline mana diagram ini harus dibahas dan diintegrasikan"
}`;

    const rawResponse = await callAI({
      prompt,
      systemPrompt: 'You are a senior technical SEO & multimodal vision expert. Output valid JSON only.',
      imageBase64: state.uploadedImage.base64,
      jsonMode: true,
    });

    try {
      const cleanJson = rawResponse.replace(/```json\n?|```/g, '').trim();
      state.visionAnalysis = JSON.parse(cleanJson);
      return state.visionAnalysis;
    } catch (e) {
      state.visionAnalysis = {
        alt: state.uploadedImage.cleanName.replace(/[-_]/g, ' '),
        caption: 'Diagram arsitektur sistem dan visualisasi alur implementasi.',
        visualInsights: rawResponse.substring(0, 300),
        recommendedPlacement: 'Bagian implementasi arsitektur teknis',
      };
      return state.visionAnalysis;
    }
  }

  // STAGE 2: Outline Generation
  async function runStage2OutlineGeneration() {
    updateProgressUI('Tahap 2: Menyusun Outline Artikel Terstruktur...', 'Merancang hierarki H2 & H3, penempatan Quick Answer, dan FAQ...', 30);

    const strategyConfig = STRATEGY_PRESETS[state.strategy] || STRATEGY_PRESETS.geo_ai_search;
    const keyphrasesList = state.focusKeyphrases.join(', ') || state.topic || 'Technical SEO';
    const internalLinksContext = state.selectedLinks.map((l) => `- [${l.anchor}](${l.url}) : ${l.title}`).join('\n');
    
    let visionContext = 'Tidak ada gambar yang diunggah.';
    if (state.visionAnalysis) {
      visionContext = `Gambar terunggah: ${state.uploadedImage.cleanName}\nAlt: ${state.visionAnalysis.alt}\nCaption: ${state.visionAnalysis.caption}\nVisual Insights: ${state.visionAnalysis.visualInsights}`;
    }

    const prompt = `Buat outline artikel komprehensif, mendalam (target 2.000+ kata), dan teroptimasi untuk GEO / Google AI Overviews dalam bahasa ${state.language === 'id' ? 'Indonesia formal profesional' : 'English technical'}.

Topik Utama: "${state.topic || state.focusKeyphrases[0] || 'Technical SEO'}"
Focus Keyphrases: ${keyphrasesList}
Strategi Penulisan: ${strategyConfig.title} (${strategyConfig.instructions})

Konteks Gambar (Vision):
${visionContext}

Internal Links yang harus disisipkan:
${internalLinksContext}

Kembalikan HANYA format JSON valid dengan struktur:
{
  "proposedTitle": "Judul artikel memikat & berbobot SEO (< 60 karakter)",
  "proposedSlug": "slug-url-ramah-seo",
  "sections": [
    {
      "heading": "H2 Heading Text",
      "subheadings": ["H3 Subheading A", "H3 Subheading B"],
      "focus": "Fokus pembahasan pada bagian ini",
      "includesImage": true/false,
      "internalLinkAnchor": "Anchor text jika ada link yang cocok"
    }
  ],
  "faqSuggestions": [
    { "question": "Pertanyaan FAQ 1", "intent": "Mengapa ini penting" },
    { "question": "Pertanyaan FAQ 2", "intent": "Cara implementasi" },
    { "question": "Pertanyaan FAQ 3", "intent": "Dampak terhadap AI Answer Engines" }
  ]
}`;

    const rawResponse = await callAI({
      prompt,
      systemPrompt: 'You are an elite SEO strategist and technical architect. Always output valid JSON only.',
      jsonMode: true,
    });

    try {
      const cleanJson = rawResponse.replace(/```json\n?|```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      state.outline = parsed.sections || [];
      state.proposedTitle = parsed.proposedTitle || '';
      state.proposedSlug = parsed.proposedSlug || '';
      state.faqSuggestions = parsed.faqSuggestions || [];
      return parsed;
    } catch (e) {
      throw new Error('Gagal memproses JSON outline dari AI: ' + e.message);
    }
  }

  // STAGE 3: Chunked Body Generation (1x, 2x, 3x)
  async function runStage3ChunkedBodyGeneration() {
    const chunkCount = state.chunkPref || 3;
    state.bodyChunks = [];
    
    const sections = state.outline;
    if (!sections || sections.length === 0) {
      throw new Error('Outline belum tersedia. Silakan selesaikan tahap outline terlebih dahulu.');
    }

    const chunks = [];
    if (chunkCount === 1) {
      chunks.push({ index: 1, total: 1, sections: sections, name: 'Seluruh Artikel' });
    } else if (chunkCount === 2) {
      const mid = Math.ceil(sections.length / 2);
      chunks.push({ index: 1, total: 2, sections: sections.slice(0, mid), name: 'Bagian 1: Fondasi & Arsitektur Utama' });
      chunks.push({ index: 2, total: 2, sections: sections.slice(mid), name: 'Bagian 2: Implementasi Lanjutan & Evaluasi' });
    } else {
      const p1 = Math.ceil(sections.length / 3);
      const p2 = Math.ceil((sections.length * 2) / 3);
      chunks.push({ index: 1, total: 3, sections: sections.slice(0, p1), name: 'Bagian 1: Definisi Eksekutif & Fondasi' });
      chunks.push({ index: 2, total: 3, sections: sections.slice(p1, p2), name: 'Bagian 2: Arsitektur Inti & Pembahasan Visual' });
      chunks.push({ index: 3, total: 3, sections: sections.slice(p2), name: 'Bagian 3: Optimasi Lanjutan, Praktik Terbaik & Kesimpulan' });
    }

    let accumulatedText = '';
    const internalLinksList = state.selectedLinks.map((l) => `[${l.anchor}](${l.url})`).join(', ');

    for (const chunk of chunks) {
      const pct = 40 + Math.round((chunk.index / chunk.total) * 45);
      updateProgressUI(
        `Tahap 3: Menulis Body Artikel (${chunk.index}/${chunk.total})...`,
        `Sedang menyusun ${chunk.name} dengan model ${state.provider === 'openai' ? state.openaiModel : state.geminiModel}...`,
        pct
      );

      const sectionOutlineText = chunk.sections.map((s) => {
        let txt = `## ${s.heading}\n`;
        if (s.subheadings && s.subheadings.length > 0) {
          txt += s.subheadings.map((sub) => `### ${sub}`).join('\n') + '\n';
        }
        if (s.focus) txt += `Fokus: ${s.focus}\n`;
        if (s.includesImage && state.uploadedImage) {
          txt += `[SERTAKAN GAMBAR]: Gunakan komponen <figure class="article-image-figure"><img src="${state.uploadedImage.url}" alt="${state.visionAnalysis?.alt || 'Diagram'}" class="article-body-image" loading="lazy" /><figcaption class="article-image-caption">${state.visionAnalysis?.caption || ''}</figcaption></figure>\n`;
        }
        return txt;
      }).join('\n\n');

      const isFirst = chunk.index === 1;
      const isLast = chunk.index === chunk.total;

      const prompt = `Anda adalah penulis teknis kelas dunia untuk theramadhani.com. Tulis bagian artikel berikut dalam bahasa ${state.language === 'id' ? 'Indonesia baku berstandar tinggi' : 'English'}.

Topik Utama: "${state.proposedTitle || state.topic}"
Fokus Keyphrases: ${state.focusKeyphrases.join(', ')}
Internal Link yang relevan untuk disisipkan alami: ${internalLinksList}

${isFirst ? `PENTING UNTUK BAGIAN AWAL:
- Mulai langsung dengan Quick Answer Block definitif 40-60 kata yang merangkum inti jawaban untuk GEO / AI Search.
- Setelah itu lanjutkan ke H2 pertama tanpa kalimat pengantar basa-basi.` : ''}

${!isFirst ? `KONTEKS SEBELUMNYA (Jaga kesinambungan alur tanpa mengulang kalimat pembuka):
${accumulatedText.slice(-800)}` : ''}

${isLast ? `PENTING UNTUK BAGIAN AKHIR:
- Sertakan kesimpulan strategis, rekomendasi langkah berikutnya, dan ringkasan eksekutif.` : ''}

OUTLINE YANG HARUS DITULIS PADA CHUNK INI:
${sectionOutlineText}

INSTRUKSI TEKNIS:
- Gunakan heading ## untuk H2 dan ### untuk H3.
- Jangan menyertakan H1 (karena judul H1 otomatis dirender oleh sistem template).
- Tulis secara mendalam, sertakan poin-poin struktural, metrik kuantitatif, dan fakta teknis.
- Tulis hanya isi Markdown-nya saja.`;

      const chunkOutput = await callAI({
        prompt,
        systemPrompt: 'You are a world-class Technical SEO & GEO Author. Write dense, high-impact technical markdown without fluff.',
      });

      state.bodyChunks.push(chunkOutput);
      accumulatedText += '\n\n' + chunkOutput;
    }

    return accumulatedText.trim();
  }

  // STAGE 4: Synthesis & Supporting Elements
  async function runStage4Synthesis() {
    updateProgressUI('Tahap 4: Sintesis Artikel & Metadata Pendukung...', 'Menghasilkan meta description, slug, Quick Answer, dan FAQ accordion...', 90);

    const fullBody = state.bodyChunks.join('\n\n').trim();
    const keyphrasesList = state.focusKeyphrases.join(', ');

    const prompt = `Evaluasi draf artikel berikut dan hasilkan metadata pendukung yang sempurna:

Artikel Body:
${fullBody.substring(0, 3000)}...

Focus Keyphrases: ${keyphrasesList}

Kembalikan HANYA format JSON valid dengan struktur:
{
  "title": "Judul SEO final yang memicu CTR tinggi (< 60 karakter)",
  "slug": "slug-url-bersih-tanpa-spasi",
  "description": "Meta description padat 140-160 karakter yang menggugah klik",
  "quickAnswer": "Definitive summary 40-60 kata langsung to-the-point untuk kutipan AI Overviews & Perplexity",
  "tags": ["Tag1", "Tag2", "Tag3", "Tag4"],
  "faq": [
    {
      "question": "Pertanyaan FAQ 1?",
      "answer": "Jawaban mendalam dan faktual 2-3 kalimat."
    },
    {
      "question": "Pertanyaan FAQ 2?",
      "answer": "Jawaban teknis jelas."
    },
    {
      "question": "Pertanyaan FAQ 3?",
      "answer": "Jawaban terukur."
    }
  ]
}`;

    const rawResponse = await callAI({
      prompt,
      systemPrompt: 'You are an SEO metadata synthesizer. Output valid JSON only.',
      jsonMode: true,
    });

    try {
      const cleanJson = rawResponse.replace(/```json\n?|```/g, '').trim();
      const meta = JSON.parse(cleanJson);

      state.synthesizedArticle = {
        title: meta.title || state.proposedTitle || 'Artikel Teknis',
        slug: meta.slug || state.proposedSlug || 'artikel-teknis',
        description: meta.description || '',
        quickAnswer: meta.quickAnswer || '',
        tags: meta.tags || ['Technical SEO', 'GEO'],
        faq: meta.faq || [],
        coverImage: state.uploadedImage ? state.uploadedImage.url : '/images/uploads/geo-blueprint.svg',
        coverAlt: state.visionAnalysis?.alt || 'Article cover diagram',
        body: fullBody,
      };

      return state.synthesizedArticle;
    } catch (e) {
      throw new Error('Gagal mensintesis metadata artikel: ' + e.message);
    }
  }

  // =========================================================================
  // 6. Decap CMS Form Injector Engine
  // =========================================================================
  function setNativeValue(element, value) {
    if (!element) return false;
    const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
    const prototype = Object.getPrototypeOf(element);
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

    if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
      prototypeValueSetter.call(element, value);
    } else if (valueSetter) {
      valueSetter.call(element, value);
    } else {
      element.value = value;
    }

    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  function injectIntoDecapForm() {
    const art = state.synthesizedArticle;
    if (!art) {
      showStudioToast('Belum ada artikel yang disintesis untuk diterapkan.', false);
      return false;
    }

    let injectedCount = 0;

    function findFieldInput(fieldName, tag = 'input') {
      return (
        document.querySelector(`${tag}[id*="${fieldName}-field"]`) ||
        document.querySelector(`${tag}[name="${fieldName}"]`) ||
        document.querySelector(`[data-field-name="${fieldName}"] ${tag}`) ||
        Array.from(document.querySelectorAll('label')).find((l) =>
          l.textContent.toLowerCase().includes(fieldName.toLowerCase())
        )?.parentElement?.querySelector(`${tag}, textarea`)
      );
    }

    // 1. Title
    const titleEl = findFieldInput('title', 'input');
    if (titleEl && setNativeValue(titleEl, art.title)) injectedCount++;

    // 2. Slug
    const slugEl = findFieldInput('slug', 'input');
    if (slugEl && setNativeValue(slugEl, art.slug)) injectedCount++;

    // 3. Description
    const descEl = findFieldInput('description', 'input') || findFieldInput('description', 'textarea');
    if (descEl && setNativeValue(descEl, art.description)) injectedCount++;

    // 4. Quick Answer
    const qaEl = findFieldInput('quickAnswer', 'textarea') || findFieldInput('quickAnswer', 'input');
    if (qaEl && setNativeValue(qaEl, art.quickAnswer)) injectedCount++;

    // 5. Cover Image & Alt
    const coverEl = findFieldInput('coverImage', 'input');
    if (coverEl && setNativeValue(coverEl, art.coverImage)) injectedCount++;

    const coverAltEl = findFieldInput('coverAlt', 'input');
    if (coverAltEl && setNativeValue(coverAltEl, art.coverAlt)) injectedCount++;

    // 6. Body Markdown
    const bodyEl = findFieldInput('body', 'textarea') || document.querySelector('.CodeMirror textarea') || document.querySelector('[class*="editorControl"] textarea');
    if (bodyEl) {
      if (setNativeValue(bodyEl, art.body)) injectedCount++;
    } else {
      const cm = document.querySelector('.CodeMirror')?.CodeMirror;
      if (cm) {
        cm.setValue(art.body);
        injectedCount++;
      }
    }

    showStudioToast(`✓ Berhasil menerapkan artikel ke ${injectedCount} bidang di Decap Editor!`, true);
    return true;
  }

  // =========================================================================
  // 7. UI Components & Modal Rendering
  // =========================================================================
  let drawerEl = null;
  let backdropEl = null;

  function getActiveModelName() {
    if (state.provider === 'openai') {
      if (state.openaiModel === 'gpt-6-luna') return 'GPT-6 Luna';
      if (state.openaiModel === 'gpt-5.6-luna') return 'GPT-5.6 Luna';
      if (state.openaiModel === 'gpt-5.4') return 'GPT-5.4';
      if (state.openaiModel === 'gpt-5.4-mini') return 'GPT-5.4 Mini';
      if (state.openaiModel === 'gpt-4o-mini') return 'GPT-4o Mini';
      if (state.openaiModel === 'gpt-4o') return 'GPT-4o';
      return state.openaiModel;
    }
    if (state.geminiModel === 'gemini-3.8-flash') return 'Gemini 3.8 Flash';
    if (state.geminiModel === 'gemini-3.8-pro') return 'Gemini 3.8 Pro';
    if (state.geminiModel === 'gemini-2.5-pro') return 'Gemini 2.5 Pro';
    return state.geminiModel || 'Gemini 3.8 Flash';
  }

  function updateActiveModelBadge() {
    const badge = document.getElementById('ai-active-model-badge');
    if (badge) {
      badge.textContent = `Model: ${getActiveModelName()}`;
    }
  }

  function renderDrawerUI() {
    if (document.getElementById('decap-ai-studio-drawer')) return;

    // Create Backdrop
    backdropEl = document.createElement('div');
    backdropEl.id = 'decap-ai-studio-backdrop';
    backdropEl.className = 'ai-studio-backdrop';
    backdropEl.onclick = closeStudioDrawer;
    document.body.appendChild(backdropEl);

    // Create Drawer
    drawerEl = document.createElement('div');
    drawerEl.id = 'decap-ai-studio-drawer';
    drawerEl.className = 'ai-studio-drawer';
    drawerEl.innerHTML = `
      <!-- Header -->
      <div class="ai-studio-header">
        <div class="ai-studio-title-wrap">
          <div class="ai-studio-badge-logo">✨</div>
          <div>
            <h3 class="ai-studio-title">AI Article Studio</h3>
            <p class="ai-studio-subtitle">Multi-Stage Technical Content Generator • <span id="ai-active-model-badge" style="color:var(--ai-primary); font-weight:600;">Model: ${getActiveModelName()}</span></p>
          </div>
        </div>
        <div class="ai-studio-header-actions">
          <button class="ai-studio-icon-btn" id="ai-btn-config" title="Konfigurasi API Key">⚙️</button>
          <button class="ai-studio-icon-btn" id="ai-btn-close" title="Tutup Studio">✕</button>
        </div>
      </div>

      <!-- Stepper Navigation -->
      <div class="ai-studio-stepper" id="ai-stepper">
        <div class="ai-step-item is-active" data-step="1"><span class="ai-step-num">1</span> Strategi</div>
        <div class="ai-step-item" data-step="2"><span class="ai-step-num">2</span> Media & Link</div>
        <div class="ai-step-item" data-step="3"><span class="ai-step-num">3</span> Outline</div>
        <div class="ai-step-item" data-step="4"><span class="ai-step-num">4</span> Body Chunks</div>
        <div class="ai-step-item" data-step="5"><span class="ai-step-num">5</span> Review & Terapkan</div>
      </div>

      <!-- Toast Container -->
      <div class="ai-toast" id="ai-studio-toast"></div>

      <!-- Scrollable Body Content -->
      <div class="ai-studio-body" id="ai-studio-body">

        <!-- ================= STEP 1: SETUP & STRATEGI ================= -->
        <div class="ai-step-pane is-active" id="ai-pane-1">
          <div class="ai-form-group">
            <label class="ai-form-label">Topik Utama atau Judul Panduan</label>
            <input type="text" class="ai-input" id="ai-topic-input" placeholder="e.g. Panduan Arsitektur Generative Engine Optimization (GEO) 2026" />
            <div class="ai-form-hint">Masukkan ide pokok atau draft judul yang ingin dibahas secara komprehensif.</div>
          </div>

          <div class="ai-form-group">
            <label class="ai-form-label">Focus Keyphrases (Bisa Lebih dari Satu)</label>
            <div class="ai-chips-wrap" id="ai-chips-wrap">
              <input type="text" class="ai-chip-input" id="ai-chip-input" placeholder="Ketik kata kunci & tekan Enter..." />
            </div>
            <div class="ai-form-hint">Keyphrase pertama menjadi <b>Primary Keyphrase</b>. Tambahkan variasi long-tail dan sinonim semantik.</div>
          </div>

          <div class="ai-form-group">
            <label class="ai-form-label">Strategi Penulisan Konten</label>
            <div class="ai-card-grid-1" id="ai-strategy-cards">
              <div class="ai-radio-card is-selected" data-strategy="geo_ai_search">
                <div class="ai-radio-title">🚀 GEO & AI Answer Authority <span>Rekomendasi</span></div>
                <div class="ai-radio-desc">Optimasi untuk Perplexity, ChatGPT, dan Google AI Overviews dengan 40-60 word quick answer block & entity graphs.</div>
              </div>
              <div class="ai-radio-card" data-strategy="technical_deepdive">
                <div class="ai-radio-title">🛠️ Technical SEO & Engineering Deep-Dive</div>
                <div class="ai-radio-desc">Arsitektur web, crawlability, Core Web Vitals, dan engineering audit mendalam.</div>
              </div>
              <div class="ai-radio-card" data-strategy="executive_roi">
                <div class="ai-radio-title">📈 Executive Thought Leadership & ROI</div>
                <div class="ai-radio-desc">Fokus pada pertumbuhan pipeline organik B2B, efisiensi CAC, dan dampak komersial.</div>
              </div>
              <div class="ai-radio-card" data-strategy="step_by_step_tutorial">
                <div class="ai-radio-title">📚 Step-by-Step Technical Tutorial</div>
                <div class="ai-radio-desc">Panduan langkah demi langkah praktis dengan prasyarat, konfigurasi, dan verifikasi.</div>
              </div>
            </div>
          </div>

          <div class="ai-form-group">
            <label class="ai-form-label">Bahasa Penulisan</label>
            <select class="ai-select" id="ai-lang-select">
              <option value="id" selected>Bahasa Indonesia (Formal & Teknis)</option>
              <option value="en">English (Professional & Authoritative)</option>
            </select>
          </div>
        </div>

        <!-- ================= STEP 2: MEDIA & INTERNAL LINKS ================= -->
        <div class="ai-step-pane" id="ai-pane-2">
          <!-- Image Upload & Vision Section -->
          <div class="ai-form-group">
            <label class="ai-form-label">Upload Gambar / Diagram (Analisis Vision AI)</label>
            <div class="ai-upload-dropzone" id="ai-upload-dropzone">
              <div class="ai-upload-icon">🖼️</div>
              <div class="ai-upload-text">Tarik & letakkan diagram di sini atau klik untuk memilih</div>
              <div class="ai-upload-subtext">Mendukung PNG, JPG, WebP, SVG (Maks. 5MB). Otomatis disimpan ke disk.</div>
              <input type="file" id="ai-file-input" accept="image/*" style="display:none" />
            </div>
            <div id="ai-image-preview-container"></div>
          </div>

          <!-- Internal Links Hub -->
          <div class="ai-form-group">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <label class="ai-form-label" style="margin:0;">Internal Links Hub</label>
              <button class="ai-btn ai-btn-secondary" id="ai-btn-add-link" style="padding:4px 10px; font-size:11px;">+ Tambah Link</button>
            </div>
            <div class="ai-form-hint">Internal link yang terpilih akan disisipkan secara kontekstual ke dalam paragraf artikel. Anda dapat mengedit anchor text-nya secara langsung.</div>
            <div class="ai-links-table-wrap" id="ai-links-table-wrap">
              <div style="padding:16px; text-align:center; color:var(--ai-text-muted); font-size:12px;">Memuat katalog artikel website...</div>
            </div>
          </div>

          <!-- Chunk Preference -->
          <div class="ai-form-group">
            <label class="ai-form-label">Preferensi Pembagian Body (Multi-Turn Chunks)</label>
            <div class="ai-card-grid" id="ai-chunks-selector">
              <div class="ai-radio-card" data-chunks="1">
                <div class="ai-radio-title">1x Sekaligus</div>
                <div class="ai-radio-desc">Draft cepat (~1.000 kata)</div>
              </div>
              <div class="ai-radio-card" data-chunks="2">
                <div class="ai-radio-title">2x Generate</div>
                <div class="ai-radio-desc">Standar (~1.800 kata)</div>
              </div>
              <div class="ai-radio-card is-selected" data-chunks="3" style="grid-column: span 2;">
                <div class="ai-radio-title">3x Bertahap <span>Pillar Guide (2.500+ kata)</span></div>
                <div class="ai-radio-desc">Rekomendasi terbaik: Menulis intro & fondasi, arsitektur inti + pembahasan gambar, lalu optimasi lanjutan tanpa batas token.</div>
              </div>
            </div>
          </div>
        </div>

        <!-- ================= STEP 3: OUTLINE ================= -->
        <div class="ai-step-pane" id="ai-pane-3">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <label class="ai-form-label" style="margin:0;">Struktur Outline Artikel</label>
            <button class="ai-btn ai-btn-secondary" id="ai-btn-regen-outline" style="padding:4px 10px; font-size:11px;">🔄 Buat Ulang Outline</button>
          </div>

          <!-- Vision Insights Banner if analyzed -->
          <div id="ai-vision-insights-card" style="display:none; background:rgba(99, 102, 241, 0.08); border:1px solid rgba(99, 102, 241, 0.3); border-radius:8px; padding:12px; margin-bottom:16px;">
            <div style="font-size:12px; font-weight:600; color:#818CF8; margin-bottom:4px;">🔍 Hasil Analisis Vision AI:</div>
            <div id="ai-vision-insights-text" style="font-size:11px; color:var(--ai-text-secondary); line-height:1.5;"></div>
          </div>

          <div class="ai-outline-list" id="ai-outline-list">
            <div style="padding:24px; text-align:center; color:var(--ai-text-muted); font-size:12px;">Klik 'Mulai Analisa & Buat Outline' di bawah untuk merancang artikel.</div>
          </div>
        </div>

        <!-- ================= STEP 4: BODY GENERATION PROGRESS ================= -->
        <div class="ai-step-pane" id="ai-pane-4">
          <div class="ai-progress-card" id="ai-progress-card">
            <div class="ai-spinner"></div>
            <div class="ai-progress-title" id="ai-progress-title">Sedang Menyiapkan Pipeline...</div>
            <div class="ai-progress-desc" id="ai-progress-desc">Memulai penulisan multi-turn chunk...</div>
            <div class="ai-progress-bar-wrap">
              <div class="ai-progress-bar-fill" id="ai-progress-bar-fill"></div>
            </div>
          </div>

          <div id="ai-live-chunks-preview" style="display:none;">
            <label class="ai-form-label">Pratinjau Hasil Chunks Sementara</label>
            <div id="ai-chunks-text-container" style="background:var(--ai-bg-input); border:1px solid var(--ai-border); border-radius:8px; padding:14px; font-size:12px; color:var(--ai-text-secondary); max-height:260px; overflow-y:auto; line-height:1.6; white-space:pre-wrap;"></div>
          </div>
        </div>

        <!-- ================= STEP 5: REVIEW & TERAPKAN ================= -->
        <div class="ai-step-pane" id="ai-pane-5">
          <div class="ai-form-group">
            <label class="ai-form-label">SEO Title <span id="ai-title-len" style="color:var(--ai-primary); font-size:11px;">(0 chars)</span></label>
            <input type="text" class="ai-input" id="ai-res-title" />
          </div>

          <div class="ai-form-group">
            <label class="ai-form-label">URL Slug</label>
            <input type="text" class="ai-input" id="ai-res-slug" />
          </div>

          <div class="ai-form-group">
            <label class="ai-form-label">Meta Description <span id="ai-desc-len" style="color:var(--ai-primary); font-size:11px;">(0 chars)</span></label>
            <textarea class="ai-textarea" id="ai-res-desc" rows="2"></textarea>
          </div>

          <div class="ai-form-group">
            <label class="ai-form-label">Quick Answer Block (40-60 words)</label>
            <textarea class="ai-textarea" id="ai-res-quick" rows="3"></textarea>
          </div>

          <div class="ai-form-group">
            <label class="ai-form-label">Tags</label>
            <input type="text" class="ai-input" id="ai-res-tags" />
          </div>

          <div class="ai-form-group">
            <label class="ai-form-label">FAQ Accordions (<span id="ai-faq-count">3</span> items)</label>
            <div id="ai-res-faq-container" style="display:flex; flex-direction:column; gap:8px;"></div>
          </div>

          <div class="ai-form-group">
            <label class="ai-form-label">Full Body Markdown</label>
            <textarea class="ai-textarea" id="ai-res-body" style="min-height:220px; font-family:var(--ai-font-mono); font-size:11px;"></textarea>
          </div>
        </div>

        <!-- ================= CONFIG MODAL PANE ================= -->
        <div class="ai-step-pane" id="ai-pane-config">
          <div style="margin-bottom:18px; padding-bottom:12px; border-bottom:1px solid var(--ai-border); display:flex; justify-content:space-between; align-items:center;">
            <h4 style="margin:0; font-size:14px;">⚙️ Pengaturan Provider & Kunci API</h4>
            <button class="ai-btn ai-btn-secondary" id="ai-btn-config-back" style="padding:4px 10px; font-size:11px;">Kembali</button>
          </div>

          <div class="ai-form-group">
            <label class="ai-form-label">Pilih Provider AI Utama</label>
            <div class="ai-card-grid" id="ai-provider-selector">
              <div class="ai-radio-card ${state.provider === 'gemini' ? 'is-selected' : ''}" data-provider="gemini">
                <div class="ai-radio-title">Google Gemini <span>Multimodal Native</span></div>
                <div class="ai-radio-desc">Gemini 2.5 Pro & Flash. Cepat, analisa gambar presisi, jendela konteks 1M.</div>
              </div>
              <div class="ai-radio-card ${state.provider === 'openai' ? 'is-selected' : ''}" data-provider="openai">
                <div class="ai-radio-title">OpenAI / GPT <span>Reasoning & Luna</span></div>
                <div class="ai-radio-desc">GPT-6 Luna, GPT Mini, GPT-4o dengan penalaran teknis mendalam.</div>
              </div>
            </div>
          </div>

          <!-- Google Gemini Group -->
          <div style="background:rgba(255,255,255,0.02); border:1px solid var(--ai-border); border-radius:10px; padding:14px; margin-bottom:16px;">
            <div style="font-size:13px; font-weight:700; color:#F59E0B; margin-bottom:10px;">🌟 Google Gemini Configuration</div>
            
            <div class="ai-form-group">
              <label class="ai-form-label">Google Gemini API Key</label>
              <input type="password" class="ai-input" id="ai-cfg-gemini-key" placeholder="AIzaSy..." value="${state.geminiKey}" />
              <div class="ai-form-hint">Dapatkan gratis di <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color:var(--ai-primary);">Google AI Studio</a>.</div>
            </div>

            <div class="ai-form-group" style="margin-bottom:0;">
              <label class="ai-form-label">Gemini Model</label>
              <select class="ai-select" id="ai-cfg-gemini-model">
                <option value="gemini-3.8-flash" ${state.geminiModel === 'gemini-3.8-flash' ? 'selected' : ''}>⚡ Gemini 3.8 Flash (Direkomendasikan - Cepat, Efisien, Multimodal)</option>
                <option value="gemini-3.8-pro" ${state.geminiModel === 'gemini-3.8-pro' ? 'selected' : ''}>🧠 Gemini 3.8 Pro (Penalaran Maksimal & Analitis)</option>
                <option value="gemini-2.5-pro" ${state.geminiModel === 'gemini-2.5-pro' ? 'selected' : ''}>Gemini 2.5 Pro</option>
                <option value="gemini-1.5-flash" ${state.geminiModel === 'gemini-1.5-flash' ? 'selected' : ''}>Gemini 1.5 Flash</option>
                <option value="gemini-1.5-pro" ${state.geminiModel === 'gemini-1.5-pro' ? 'selected' : ''}>Gemini 1.5 Pro</option>
              </select>
            </div>
          </div>

          <!-- OpenAI / GPT Group -->
          <div style="background:rgba(255,255,255,0.02); border:1px solid var(--ai-border); border-radius:10px; padding:14px; margin-bottom:16px;">
            <div style="font-size:13px; font-weight:700; color:#10B981; margin-bottom:10px;">🤖 OpenAI / GPT Configuration</div>

            <div class="ai-form-group">
              <label class="ai-form-label">OpenAI API Key</label>
              <input type="password" class="ai-input" id="ai-cfg-openai-key" placeholder="sk-..." value="${state.openaiKey}" />
              <div class="ai-form-hint">Dapatkan di platform.openai.com. Tersimpan secara aman di localStorage browser Anda.</div>
            </div>

            <div class="ai-form-group">
              <label class="ai-form-label">OpenAI / GPT Model Selection</label>
              <select class="ai-select" id="ai-cfg-openai-model">
                <option value="gpt-6-luna" ${state.openaiModel === 'gpt-6-luna' ? 'selected' : ''}>🌙 GPT-6 Luna (Advanced Reasoning & Deep Pillar)</option>
                <option value="gpt-5.6-luna" ${state.openaiModel === 'gpt-5.6-luna' ? 'selected' : ''}>🌙 GPT-5.6 Luna (Flagship Reasoning)</option>
                <option value="gpt-5.4" ${state.openaiModel === 'gpt-5.4' ? 'selected' : ''}>🧠 GPT-5.4 (Next-Gen Flagship)</option>
                <option value="gpt-5.4-mini" ${state.openaiModel === 'gpt-5.4-mini' ? 'selected' : ''}>⚡ GPT-5.4 Mini (Fast & Intelligent)</option>
                <option value="gpt-4o" ${state.openaiModel === 'gpt-4o' ? 'selected' : ''}>🌐 GPT-4o (Omni Multimodal Flagship)</option>
                <option value="gpt-4o-mini" ${state.openaiModel === 'gpt-4o-mini' ? 'selected' : ''}>⚡ GPT-4o Mini (Hemat Token & Kuota Cepat)</option>
                <option value="custom" ${!['gpt-6-luna', 'gpt-5.6-luna', 'gpt-5.4', 'gpt-5.4-mini', 'gpt-4o', 'gpt-4o-mini'].includes(state.openaiModel) ? 'selected' : ''}>🔧 Custom Model ID...</option>
              </select>
            </div>

            <div class="ai-form-group" id="ai-cfg-custom-model-wrap" style="display:${!['gpt-6-luna', 'gpt-5.6-luna', 'gpt-5.4', 'gpt-5.4-mini', 'gpt-4o', 'gpt-4o-mini'].includes(state.openaiModel) ? 'block' : 'none'}; margin-bottom:0;">
              <label class="ai-form-label">Custom Model ID</label>
              <input type="text" class="ai-input" id="ai-cfg-custom-model-input" placeholder="e.g. gpt-5.4 atau custom-model" value="${!['gpt-6-luna', 'gpt-5.6-luna', 'gpt-5.4', 'gpt-5.4-mini', 'gpt-4o', 'gpt-4o-mini'].includes(state.openaiModel) ? state.openaiModel : ''}" />
              <div class="ai-form-hint">Ketik ID model kustom yang ingin dipanggil secara spesifik.</div>
            </div>
          </div>

          <div style="display:flex; gap:10px; margin-top:20px;">
            <button class="ai-btn ai-btn-primary" id="ai-btn-save-config" style="flex:1;">Simpan Pengaturan</button>
            <button class="ai-btn ai-btn-secondary" id="ai-btn-test-config">Uji Koneksi</button>
          </div>
        </div>

      </div>

      <!-- Drawer Footer Action Bar -->
      <div class="ai-studio-footer" id="ai-studio-footer">
        <button class="ai-btn ai-btn-secondary" id="ai-btn-prev">Kembali</button>
        <div style="display:flex; gap:10px;">
          <button class="ai-btn ai-btn-secondary" id="ai-btn-copy-mdx" style="display:none;">📋 Salin MDX</button>
          <button class="ai-btn ai-btn-primary" id="ai-btn-next">Lanjut ke Media & Link ➔</button>
        </div>
      </div>
    `;

    document.body.appendChild(drawerEl);
    setupStudioEvents();
  }

  function showStudioToast(msg, isSuccess = true) {
    const toast = document.getElementById('ai-studio-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = `ai-toast is-visible ${isSuccess ? 'ai-toast-success' : 'ai-toast-error'}`;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.className = 'ai-toast';
    }, 4000);
  }

  function updateProgressUI(title, desc, pct) {
    const t = document.getElementById('ai-progress-title');
    const d = document.getElementById('ai-progress-desc');
    const b = document.getElementById('ai-progress-bar-fill');
    if (t) t.textContent = title;
    if (d) d.textContent = desc;
    if (b) b.style.width = pct + '%';
  }

  function openStudioDrawer() {
    renderDrawerUI();
    state.isOpen = true;
    drawerEl.classList.add('is-open');
    backdropEl.classList.add('is-open');
    updateActiveModelBadge();
    loadSiteCatalog().then(() => {
      renderInternalLinksTable();
    });
  }

  function closeStudioDrawer() {
    state.isOpen = false;
    if (drawerEl) drawerEl.classList.remove('is-open');
    if (backdropEl) backdropEl.classList.remove('is-open');
  }

  function switchStep(step) {
    state.currentStep = step;
    
    // Update Stepper
    document.querySelectorAll('.ai-step-item').forEach((item) => {
      const s = parseInt(item.getAttribute('data-step'), 10);
      item.classList.toggle('is-active', s === step);
      item.classList.toggle('is-completed', s < step);
    });

    // Update Panes
    document.querySelectorAll('.ai-step-pane').forEach((p) => p.classList.remove('is-active'));
    const pane = document.getElementById(`ai-pane-${step}`);
    if (pane) pane.classList.add('is-active');

    // Update Footer Buttons
    const prevBtn = document.getElementById('ai-btn-prev');
    const nextBtn = document.getElementById('ai-btn-next');
    const copyBtn = document.getElementById('ai-btn-copy-mdx');

    if (prevBtn) prevBtn.style.visibility = step === 1 ? 'hidden' : 'visible';
    if (copyBtn) copyBtn.style.display = step === 5 ? 'inline-flex' : 'none';

    if (nextBtn) {
      if (step === 1) nextBtn.innerHTML = 'Lanjut ke Media & Link ➔';
      else if (step === 2) nextBtn.innerHTML = '🚀 Mulai Analisa & Buat Outline';
      else if (step === 3) nextBtn.innerHTML = '⚡ Mulai Tulis Artikel (Chunks) ➔';
      else if (step === 4) nextBtn.innerHTML = 'Sedang Menulis...';
      else if (step === 5) {
        nextBtn.innerHTML = '🎯 Terapkan ke Editor Decap';
        nextBtn.className = 'ai-btn ai-btn-success';
      }
      nextBtn.disabled = step === 4 && state.isGenerating;
    }
  }

  // =========================================================================
  // 8. Event Handlers & User Interactions
  // =========================================================================
  function setupStudioEvents() {
    // Header buttons
    document.getElementById('ai-btn-close')?.addEventListener('click', closeStudioDrawer);
    document.getElementById('ai-btn-config')?.addEventListener('click', () => {
      document.querySelectorAll('.ai-step-pane').forEach((p) => p.classList.remove('is-active'));
      document.getElementById('ai-pane-config')?.classList.add('is-active');
    });
    document.getElementById('ai-btn-config-back')?.addEventListener('click', () => {
      switchStep(state.currentStep);
    });

    // Stepper item clicks
    document.querySelectorAll('.ai-step-item').forEach((item) => {
      item.addEventListener('click', () => {
        const s = parseInt(item.getAttribute('data-step'), 10);
        switchStep(s);
      });
    });

    // Focus Keyphrase Chip Input
    const chipInput = document.getElementById('ai-chip-input');
    chipInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const val = chipInput.value.trim().replace(/^,+|,+$/g, '');
        if (val && !state.focusKeyphrases.includes(val)) {
          state.focusKeyphrases.push(val);
          renderChips();
          chipInput.value = '';
          autoSuggestInternalLinks();
          renderInternalLinksTable();
        }
      }
    });

    // Strategy Selection
    document.querySelectorAll('#ai-strategy-cards .ai-radio-card').forEach((card) => {
      card.addEventListener('click', () => {
        document.querySelectorAll('#ai-strategy-cards .ai-radio-card').forEach((c) => c.classList.remove('is-selected'));
        card.classList.add('is-selected');
        state.strategy = card.getAttribute('data-strategy');
        localStorage.setItem(STORAGE_KEYS.STRATEGY, state.strategy);
      });
    });

    // Chunk Preference Selection
    document.querySelectorAll('#ai-chunks-selector .ai-radio-card').forEach((card) => {
      card.addEventListener('click', () => {
        document.querySelectorAll('#ai-chunks-selector .ai-radio-card').forEach((c) => c.classList.remove('is-selected'));
        card.classList.add('is-selected');
        state.chunkPref = parseInt(card.getAttribute('data-chunks'), 10);
        localStorage.setItem(STORAGE_KEYS.CHUNKS, state.chunkPref);
      });
    });

    // File Upload Drag & Drop
    const dropzone = document.getElementById('ai-upload-dropzone');
    const fileInput = document.getElementById('ai-file-input');
    dropzone?.addEventListener('click', () => fileInput?.click());

    dropzone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('is-dragover');
    });
    dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('is-dragover'));
    dropzone?.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('is-dragover');
      if (e.dataTransfer?.files?.[0]) handleUploadedImage(e.dataTransfer.files[0]);
    });
    fileInput?.addEventListener('change', (e) => {
      if (e.target?.files?.[0]) handleUploadedImage(e.target.files[0]);
    });

    // Add Manual Internal Link
    document.getElementById('ai-btn-add-link')?.addEventListener('click', () => {
      const title = prompt('Masukkan Judul atau Target Halaman:');
      const url = prompt('Masukkan URL internal (misal /services/seo/ atau /articles/slug/):');
      const anchor = prompt('Masukkan Anchor Text:') || title;
      if (title && url) {
        state.selectedLinks.push({ title, url, anchor: anchor || title });
        renderInternalLinksTable();
      }
    });

    // Custom Model dropdown toggle
    const openAIModelSelect = document.getElementById('ai-cfg-openai-model');
    const customWrap = document.getElementById('ai-cfg-custom-model-wrap');
    openAIModelSelect?.addEventListener('change', (e) => {
      if (customWrap) {
        customWrap.style.display = e.target.value === 'custom' ? 'block' : 'none';
      }
    });

    // Config Save & Test
    document.getElementById('ai-btn-save-config')?.addEventListener('click', () => {
      state.geminiKey = document.getElementById('ai-cfg-gemini-key')?.value.trim() || '';
      state.openaiKey = document.getElementById('ai-cfg-openai-key')?.value.trim() || '';
      state.geminiModel = document.getElementById('ai-cfg-gemini-model')?.value || 'gemini-3.8-flash';
      
      const selectedOpenAI = document.getElementById('ai-cfg-openai-model')?.value || 'gpt-6-luna';
      if (selectedOpenAI === 'custom') {
        state.openaiModel = document.getElementById('ai-cfg-custom-model-input')?.value.trim() || 'gpt-6-luna';
      } else {
        state.openaiModel = selectedOpenAI;
      }
      
      localStorage.setItem(STORAGE_KEYS.GEMINI_KEY, state.geminiKey);
      localStorage.setItem(STORAGE_KEYS.OPENAI_KEY, state.openaiKey);
      localStorage.setItem(STORAGE_KEYS.GEMINI_MODEL, state.geminiModel);
      localStorage.setItem(STORAGE_KEYS.OPENAI_MODEL, state.openaiModel);
      localStorage.setItem(STORAGE_KEYS.PROVIDER, state.provider);

      updateActiveModelBadge();
      showStudioToast(`✓ Pengaturan disimpan. Model Aktif: ${getActiveModelName()}`, true);
      switchStep(state.currentStep);
    });

    document.getElementById('ai-btn-test-config')?.addEventListener('click', async () => {
      const btn = document.getElementById('ai-btn-test-config');
      if (btn) {
        btn.textContent = 'Menguji...';
        btn.disabled = true;
      }
      try {
        state.geminiKey = document.getElementById('ai-cfg-gemini-key')?.value.trim() || '';
        state.openaiKey = document.getElementById('ai-cfg-openai-key')?.value.trim() || '';
        state.geminiModel = document.getElementById('ai-cfg-gemini-model')?.value || state.geminiModel;
        const testRes = await callAI({ prompt: 'Ping! Balas hanya dengan kata: OK' });
        showStudioToast(`✓ Koneksi Berhasil (${state.provider.toUpperCase()} - ${getActiveModelName()}): ${testRes.trim()}`, true);
      } catch (err) {
        showStudioToast(`✕ Gagal Koneksi: ${err.message}`, false);
      } finally {
        if (btn) {
          btn.textContent = 'Uji Koneksi';
          btn.disabled = false;
        }
      }
    });

    document.querySelectorAll('#ai-provider-selector .ai-radio-card').forEach((card) => {
      card.addEventListener('click', () => {
        document.querySelectorAll('#ai-provider-selector .ai-radio-card').forEach((c) => c.classList.remove('is-selected'));
        card.classList.add('is-selected');
        state.provider = card.getAttribute('data-provider');
        updateActiveModelBadge();
      });
    });

    // Copy MDX Button
    document.getElementById('ai-btn-copy-mdx')?.addEventListener('click', () => {
      if (!state.synthesizedArticle) return;
      const mdx = `---
title: "${state.synthesizedArticle.title}"
description: "${state.synthesizedArticle.description}"
slug: "${state.synthesizedArticle.slug}"
publishDate: ${new Date().toISOString().split('T')[0]}
author: "Ramadhani"
tags: ${JSON.stringify(state.synthesizedArticle.tags)}
coverImage: "${state.synthesizedArticle.coverImage}"
coverAlt: "${state.synthesizedArticle.coverAlt}"
quickAnswer: "${state.synthesizedArticle.quickAnswer}"
featured: false
---

${state.synthesizedArticle.body}`;
      navigator.clipboard.writeText(mdx);
      showStudioToast('✓ Seluruh dokumen MDX disalin ke clipboard!', true);
    });

    // Navigation Buttons (Prev & Next)
    document.getElementById('ai-btn-prev')?.addEventListener('click', () => {
      if (state.currentStep > 1) switchStep(state.currentStep - 1);
    });

    document.getElementById('ai-btn-next')?.addEventListener('click', async () => {
      if (state.currentStep === 1) {
        state.topic = document.getElementById('ai-topic-input')?.value.trim() || '';
        state.language = document.getElementById('ai-lang-select')?.value || 'id';
        if (!state.topic && state.focusKeyphrases.length === 0) {
          showStudioToast('Harap masukkan Topik atau minimal 1 Focus Keyphrase.', false);
          return;
        }
        switchStep(2);
      } else if (state.currentStep === 2) {
        // Trigger Stage 1 & Stage 2
        switchStep(3);
        await startPipelineStage1And2();
      } else if (state.currentStep === 3) {
        // Trigger Stage 3 Body Chunks
        switchStep(4);
        await startPipelineStage3And4();
      } else if (state.currentStep === 5) {
        // One-Click Inject
        injectIntoDecapForm();
      }
    });

    // Regenerate Outline
    document.getElementById('ai-btn-regen-outline')?.addEventListener('click', async () => {
      await startPipelineStage1And2();
    });
  }

  // =========================================================================
  // 9. Image Upload & Instant Persistence
  // =========================================================================
  async function handleUploadedImage(file) {
    if (!file || !file.type.startsWith('image/')) {
      showStudioToast('Berkas harus berupa gambar valid.', false);
      return;
    }

    const cleanName = 'article-' + Date.now() + '-' + file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result;
      state.uploadedImage = {
        file: file,
        name: file.name,
        cleanName: cleanName,
        base64: base64,
        url: `/images/uploads/${cleanName}`,
      };

      try {
        const rawBase64 = base64.split(',')[1];
        await fetch('/api/dev-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: cleanName, content: rawBase64 }),
        });
        showStudioToast('✓ Gambar disimpan ke disk: /images/uploads/' + cleanName, true);
      } catch (err) {}

      renderImagePreview();
    };
    reader.readAsDataURL(file);
  }

  function renderImagePreview() {
    const container = document.getElementById('ai-image-preview-container');
    if (!container) return;
    if (!state.uploadedImage) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = `
      <div class="ai-image-preview-card">
        <img src="${state.uploadedImage.base64}" class="ai-image-preview-thumb" alt="Preview" />
        <div class="ai-image-preview-info">
          <div class="ai-image-preview-name">${state.uploadedImage.name}</div>
          <div class="ai-image-preview-meta">URL: ${state.uploadedImage.url}</div>
        </div>
        <button class="ai-studio-icon-btn" id="ai-btn-remove-image" title="Hapus Gambar" style="color:var(--ai-error);">✕</button>
      </div>
    `;

    document.getElementById('ai-btn-remove-image')?.addEventListener('click', () => {
      state.uploadedImage = null;
      state.visionAnalysis = null;
      renderImagePreview();
    });
  }

  // =========================================================================
  // 10. Chips & Internal Links Table Rendering
  // =========================================================================
  function renderChips() {
    const wrap = document.getElementById('ai-chips-wrap');
    const input = document.getElementById('ai-chip-input');
    if (!wrap || !input) return;

    wrap.querySelectorAll('.ai-chip').forEach((c) => c.remove());

    state.focusKeyphrases.forEach((kp, idx) => {
      const chip = document.createElement('div');
      chip.className = `ai-chip ${idx === 0 ? 'ai-chip-primary' : ''}`;
      chip.innerHTML = `
        <span>${kp} ${idx === 0 ? '<small style="font-size:9px; opacity:0.8;">(Utama)</small>' : ''}</span>
        <span class="ai-chip-remove" data-idx="${idx}">✕</span>
      `;
      chip.querySelector('.ai-chip-remove')?.addEventListener('click', () => {
        state.focusKeyphrases.splice(idx, 1);
        renderChips();
        autoSuggestInternalLinks();
        renderInternalLinksTable();
      });
      wrap.insertBefore(chip, input);
    });
  }

  function renderInternalLinksTable() {
    const container = document.getElementById('ai-links-table-wrap');
    if (!container) return;

    if (!state.selectedLinks || state.selectedLinks.length === 0) {
      autoSuggestInternalLinks();
    }

    if (!state.selectedLinks || state.selectedLinks.length === 0) {
      container.innerHTML = `<div style="padding:16px; text-align:center; color:var(--ai-text-muted); font-size:12px;">Belum ada internal link. Klik '+ Tambah Link' di atas.</div>`;
      return;
    }

    container.innerHTML = '';
    state.selectedLinks.forEach((link, idx) => {
      const row = document.createElement('div');
      row.className = 'ai-link-row';
      row.innerHTML = `
        <span style="color:var(--ai-primary); font-family:var(--ai-font-mono); font-size:10px;">#${idx + 1}</span>
        <input type="text" class="ai-input ai-link-anchor" value="${link.anchor}" title="Edit Anchor Text" style="padding:4px 8px; font-size:11px;" />
        <span class="ai-link-url" title="${link.url}">${link.url}</span>
        <button class="ai-studio-icon-btn" data-del-link="${idx}" title="Hapus" style="width:24px; height:24px; font-size:11px; color:var(--ai-error);">✕</button>
      `;

      row.querySelector('.ai-link-anchor')?.addEventListener('input', (e) => {
        state.selectedLinks[idx].anchor = e.target.value;
      });

      row.querySelector('[data-del-link]')?.addEventListener('click', () => {
        state.selectedLinks.splice(idx, 1);
        renderInternalLinksTable();
      });

      container.appendChild(row);
    });
  }

  // =========================================================================
  // 11. Pipeline Orchestrator (Stages Execution)
  // =========================================================================
  async function startPipelineStage1And2() {
    try {
      state.isGenerating = true;
      const nextBtn = document.getElementById('ai-btn-next');
      if (nextBtn) nextBtn.disabled = true;

      if (state.uploadedImage) {
        showStudioToast('Memulai analisa Vision AI untuk gambar...', true);
        await runStage1ImageAnalysis();
        const vCard = document.getElementById('ai-vision-insights-card');
        const vText = document.getElementById('ai-vision-insights-text');
        if (vCard && vText && state.visionAnalysis) {
          vCard.style.display = 'block';
          vText.innerHTML = `<b>Alt Text:</b> ${state.visionAnalysis.alt}<br/><b>Caption:</b> ${state.visionAnalysis.caption}<br/><b>Insight:</b> ${state.visionAnalysis.visualInsights}`;
        }
      }

      showStudioToast('Menghasilkan outline terstruktur...', true);
      await runStage2OutlineGeneration();
      renderOutlineList();
      showStudioToast('✓ Outline berhasil disusun! Anda dapat menyesuaikan setiap section.', true);
    } catch (err) {
      showStudioToast('✕ Terjadi kesalahan: ' + err.message, false);
    } finally {
      state.isGenerating = false;
      const nextBtn = document.getElementById('ai-btn-next');
      if (nextBtn) nextBtn.disabled = false;
    }
  }

  function renderOutlineList() {
    const listEl = document.getElementById('ai-outline-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    if (!state.outline || state.outline.length === 0) {
      listEl.innerHTML = `<div style="padding:20px; text-align:center; color:var(--ai-text-muted);">Tidak ada section. Klik 'Buat Ulang Outline'.</div>`;
      return;
    }

    state.outline.forEach((sec, idx) => {
      const item = document.createElement('div');
      item.className = 'ai-outline-item';
      item.innerHTML = `
        <span class="ai-outline-num">H2.${idx + 1}</span>
        <input type="text" class="ai-outline-input" value="${sec.heading}" data-sec-idx="${idx}" />
        ${sec.includesImage ? '<span style="font-size:10px; background:rgba(99,102,241,0.2); color:#A5B4FC; padding:2px 6px; border-radius:4px;">🖼️ Gambar</span>' : ''}
        <button class="ai-studio-icon-btn" data-del-sec="${idx}" title="Hapus Section" style="width:24px; height:24px; font-size:11px; color:var(--ai-error);">✕</button>
      `;

      item.querySelector('.ai-outline-input')?.addEventListener('input', (e) => {
        state.outline[idx].heading = e.target.value;
      });

      item.querySelector('[data-del-sec]')?.addEventListener('click', () => {
        state.outline.splice(idx, 1);
        renderOutlineList();
      });

      listEl.appendChild(item);
    });
  }

  async function startPipelineStage3And4() {
    try {
      state.isGenerating = true;
      const nextBtn = document.getElementById('ai-btn-next');
      if (nextBtn) nextBtn.disabled = true;

      // Stage 3: Body Chunks
      const fullBody = await runStage3ChunkedBodyGeneration();

      // Show live preview
      const previewCard = document.getElementById('ai-live-chunks-preview');
      const textPreview = document.getElementById('ai-chunks-text-container');
      if (previewCard && textPreview) {
        previewCard.style.display = 'block';
        textPreview.textContent = fullBody.substring(0, 1500) + '...';
      }

      // Stage 4: Synthesis & Supporting Elements
      await runStage4Synthesis();

      // Fill Step 5 UI
      populateReviewPane();
      switchStep(5);
      showStudioToast('✓ Artikel selesai disusun! Silakan periksa & klik "Terapkan ke Editor Decap".', true);
    } catch (err) {
      showStudioToast('✕ Gagal pada pembuatan body: ' + err.message, false);
      switchStep(3);
    } finally {
      state.isGenerating = false;
      const nextBtn = document.getElementById('ai-btn-next');
      if (nextBtn) nextBtn.disabled = false;
    }
  }

  function populateReviewPane() {
    const art = state.synthesizedArticle;
    if (!art) return;

    const titleEl = document.getElementById('ai-res-title');
    const slugEl = document.getElementById('ai-res-slug');
    const descEl = document.getElementById('ai-res-desc');
    const quickEl = document.getElementById('ai-res-quick');
    const tagsEl = document.getElementById('ai-res-tags');
    const bodyEl = document.getElementById('ai-res-body');
    const faqContainer = document.getElementById('ai-res-faq-container');

    if (titleEl) {
      titleEl.value = art.title;
      updateCharCounter('ai-title-len', art.title.length, 60);
      titleEl.oninput = (e) => updateCharCounter('ai-title-len', e.target.value.length, 60);
    }

    if (slugEl) slugEl.value = art.slug;

    if (descEl) {
      descEl.value = art.description;
      updateCharCounter('ai-desc-len', art.description.length, 160);
      descEl.oninput = (e) => updateCharCounter('ai-desc-len', e.target.value.length, 160);
    }

    if (quickEl) quickEl.value = art.quickAnswer;
    if (tagsEl) tagsEl.value = Array.isArray(art.tags) ? art.tags.join(', ') : art.tags;
    if (bodyEl) bodyEl.value = art.body;

    if (faqContainer && art.faq) {
      faqContainer.innerHTML = '';
      art.faq.forEach((f, i) => {
        const d = document.createElement('div');
        d.style.cssText = 'background:var(--ai-bg-input); border:1px solid var(--ai-border); border-radius:6px; padding:10px; font-size:12px;';
        d.innerHTML = `
          <div style="font-weight:600; color:var(--ai-text-primary); margin-bottom:4px;">Q${i + 1}: ${f.question}</div>
          <div style="color:var(--ai-text-secondary); line-height:1.4;">${f.answer}</div>
        `;
        faqContainer.appendChild(d);
      });
      const countEl = document.getElementById('ai-faq-count');
      if (countEl) countEl.textContent = art.faq.length;
    }
  }

  function updateCharCounter(id, current, optimal) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = `(${current}/${optimal} chars - ${current <= optimal ? 'Optimal' : 'Terlalu Panjang'})`;
    el.style.color = current <= optimal ? 'var(--ai-success)' : 'var(--ai-error)';
  }

  // =========================================================================
  // 12. Mount Triggers into Decap CMS DOM
  // =========================================================================
  function injectStudioTriggerButton() {
    if (!document.getElementById('decap-ai-floating-btn')) {
      const floatBtn = document.createElement('button');
      floatBtn.id = 'decap-ai-floating-btn';
      floatBtn.className = 'ai-studio-trigger-btn ai-studio-floating-trigger';
      floatBtn.innerHTML = '✨ AI Article Studio';
      floatBtn.onclick = openStudioDrawer;
      document.body.appendChild(floatBtn);
    }

    const interval = setInterval(() => {
      const topbar = document.querySelector('[class*="AppHeaderContent"]') || document.querySelector('header nav') || document.querySelector('#nc-root header');
      if (topbar && !document.getElementById('decap-ai-topbar-btn')) {
        const topBtn = document.createElement('button');
        topBtn.id = 'decap-ai-topbar-btn';
        topBtn.className = 'ai-studio-trigger-btn';
        topBtn.style.marginLeft = '12px';
        topBtn.innerHTML = '✨ AI Studio';
        topBtn.onclick = openStudioDrawer;
        topbar.appendChild(topBtn);
      }
    }, 1500);

    setTimeout(() => clearInterval(interval), 30000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectStudioTriggerButton);
  } else {
    injectStudioTriggerButton();
  }

  const studioAPI = {
    open: openStudioDrawer,
    close: closeStudioDrawer,
    state: state,
    callAI: callAI,
    callGemini: callGemini,
    callOpenAI: callOpenAI,
    getActiveModelName: getActiveModelName,
    loadSiteCatalog: loadSiteCatalog,
    autoSuggestInternalLinks: autoSuggestInternalLinks,
    runStage1ImageAnalysis: runStage1ImageAnalysis,
    runStage2OutlineGeneration: runStage2OutlineGeneration,
    runStage3ChunkedBodyGeneration: runStage3ChunkedBodyGeneration,
    runStage4Synthesis: runStage4Synthesis,
    setNativeValue: setNativeValue,
    injectIntoDecapForm: injectIntoDecapForm,
    handleUploadedImage: handleUploadedImage,
    updateCharCounter: updateCharCounter,
    STRATEGY_PRESETS: STRATEGY_PRESETS,
    STORAGE_KEYS: STORAGE_KEYS,
  };

  if (typeof window !== 'undefined') {
    window.DecapAIStudio = studioAPI;
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.DecapAIStudio = studioAPI;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = studioAPI;
  }

  console.log('[Decap CMS] AI Article Studio Engine loaded successfully with GPT-6 Luna & GPT Mini support.');
})();
