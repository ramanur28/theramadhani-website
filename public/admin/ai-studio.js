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
    includeCitations: true, // Academic & Industry citations toggle
    
    // Media & Vision
    uploadedImage: null, // Pointer to active cover image { file, name, cleanName, base64, url }
    uploadedImages: [], // Array of { id, file, name, cleanName, base64, url, originalSize, compressedSize, savingsPercent, width, height, format, isCover, visionAnalysis }
    visionAnalysis: null, // { alt, caption, visualInsights, entities }
    
    // Internal Links
    siteCatalog: [],
    selectedLinks: [], // [{ title, url, anchor }]
    
    // Generation outputs
    outline: [],
    proposedTitle: '',
    proposedSlug: '',
    proposedDescription: '',
    proposedTags: [],
    proposedH1: '',
    faqSuggestions: [],
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
  // 2.1 Custom Strategy CRUD Engine & Direct Disk Persistence (/api/strategies)
  // =========================================================================
  let customStrategiesCache = [];

  async function loadCustomStrategies() {
    try {
      const res = await fetch('/api/strategies');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          customStrategiesCache = data;
          return data;
        }
      }
    } catch (_) {}

    try {
      const resFallback = await fetch('/admin/strategies.json');
      if (resFallback.ok) {
        const dataFallback = await resFallback.json();
        if (Array.isArray(dataFallback)) {
          customStrategiesCache = dataFallback;
          return dataFallback;
        }
      }
    } catch (_) {}

    return customStrategiesCache || [];
  }

  async function saveCustomStrategies(list) {
    customStrategiesCache = list || [];
    try {
      await fetch('/api/strategies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customStrategiesCache),
      });
    } catch (err) {
      console.warn('[AI Studio] Gagal menyimpan custom strategies ke disk via API:', err);
    }
  }

  function getAllStrategies() {
    const custom = customStrategiesCache || [];
    const merged = {};
    Object.keys(STRATEGY_PRESETS).forEach((key) => {
      merged[key] = { ...STRATEGY_PRESETS[key], isCustom: false, id: key };
    });
    custom.forEach((item) => {
      if (item && item.id) {
        merged[item.id] = { ...item, isCustom: true };
      }
    });
    return merged;
  }

  function getStrategy(id) {
    const all = getAllStrategies();
    return all[id] || all.geo_ai_search || STRATEGY_PRESETS.geo_ai_search;
  }

  async function createCustomStrategy({ title, desc, instructions }) {
    if (!title || !title.trim()) throw new Error('Judul strategi tidak boleh kosong.');
    if (!instructions || !instructions.trim()) throw new Error('Instruksi AI prompt strategi tidak boleh kosong.');

    const id = 'strat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const item = {
      id,
      title: title.trim(),
      desc: (desc || '').trim() || title.trim(),
      instructions: instructions.trim(),
      isCustom: true,
      updatedAt: Date.now(),
    };

    const current = [...(customStrategiesCache || [])];
    current.push(item);
    await saveCustomStrategies(current);
    renderStrategyCards();
    return item;
  }

  async function updateCustomStrategy(id, { title, desc, instructions }) {
    if (!id) throw new Error('ID strategi tidak valid.');
    if (STRATEGY_PRESETS[id]) throw new Error('Strategi bawaan sistem tidak dapat diedit.');
    if (!title || !title.trim()) throw new Error('Judul strategi tidak boleh kosong.');
    if (!instructions || !instructions.trim()) throw new Error('Instruksi AI prompt strategi tidak boleh kosong.');

    const current = [...(customStrategiesCache || [])];
    const idx = current.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Strategi kustom tidak ditemukan.');

    current[idx] = {
      ...current[idx],
      title: title.trim(),
      desc: (desc || '').trim() || title.trim(),
      instructions: instructions.trim(),
      updatedAt: Date.now(),
    };

    await saveCustomStrategies(current);
    renderStrategyCards();
    return current[idx];
  }

  async function deleteCustomStrategy(id) {
    if (!id) throw new Error('ID strategi tidak valid.');
    if (STRATEGY_PRESETS[id]) throw new Error('Strategi bawaan sistem tidak dapat dihapus.');

    const current = (customStrategiesCache || []).filter((s) => s.id !== id);
    await saveCustomStrategies(current);

    if (state.strategy === id) {
      state.strategy = 'geo_ai_search';
      localStorage.setItem(STORAGE_KEYS.STRATEGY, state.strategy);
    }
    renderStrategyCards();
    return true;
  }

  function openStrategyForm(editId = null) {
    const formBox = document.getElementById('ai-strategy-form-box');
    const formTitle = document.getElementById('ai-strategy-form-title');
    const idInput = document.getElementById('ai-strat-edit-id');
    const titleInput = document.getElementById('ai-strat-title-input');
    const descInput = document.getElementById('ai-strat-desc-input');
    const instInput = document.getElementById('ai-strat-instructions-input');

    if (!formBox) return;

    if (editId) {
      const strat = getStrategy(editId);
      if (formTitle) formTitle.textContent = 'Edit Strategi Kustom';
      if (idInput) idInput.value = editId;
      if (titleInput) titleInput.value = strat.title;
      if (descInput) descInput.value = strat.desc;
      if (instInput) instInput.value = strat.instructions;
    } else {
      if (formTitle) formTitle.textContent = 'Tambah Strategi Kustom Baru';
      if (idInput) idInput.value = '';
      if (titleInput) titleInput.value = '';
      if (descInput) descInput.value = '';
      if (instInput) instInput.value = '';
    }

    formBox.style.display = 'block';
    titleInput?.focus();
  }

  function closeStrategyForm() {
    const formBox = document.getElementById('ai-strategy-form-box');
    if (formBox) formBox.style.display = 'none';
  }

  function renderStrategyCards() {
    const container = document.getElementById('ai-strategy-cards');
    if (!container) return;

    const all = getAllStrategies();
    container.innerHTML = '';

    Object.keys(all).forEach((key) => {
      const s = all[key];
      const isSelected = state.strategy === key;
      const card = document.createElement('div');
      card.className = 'ai-radio-card ' + (isSelected ? 'is-selected' : '');
      card.setAttribute('data-strategy', key);

      let badge = '';
      if (key === 'geo_ai_search') {
        badge = '<span style="background:rgba(245,158,11,0.2); color:#F59E0B; font-size:9px; padding:2px 6px; border-radius:4px; margin-left:6px;">Rekomendasi</span>';
      } else if (s.isCustom) {
        badge = '<span style="background:rgba(99,102,241,0.2); color:#A5B4FC; font-size:9px; padding:2px 6px; border-radius:4px; margin-left:6px;">Kustom</span>';
      }

      let actionsHtml = '';
      if (s.isCustom) {
        actionsHtml = `
          <div style="display:flex; gap:4px; margin-left:8px;" class="ai-strat-actions">
            <button type="button" class="ai-studio-icon-btn" data-edit-strat="${key}" title="Edit Strategi" style="width:22px; height:22px; font-size:10px;">✏️</button>
            <button type="button" class="ai-studio-icon-btn" data-del-strat="${key}" title="Hapus Strategi" style="width:22px; height:22px; font-size:10px; color:var(--ai-error);">🗑️</button>
          </div>
        `;
      }

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div class="ai-radio-title" style="flex:1;">
            ${s.isCustom ? '🎯 ' : ''}${s.title} ${badge}
          </div>
          ${actionsHtml}
        </div>
        <div class="ai-radio-desc" style="margin-top:4px;">${s.desc}</div>
      `;

      card.addEventListener('click', (e) => {
        if (e.target.closest('[data-edit-strat]') || e.target.closest('[data-del-strat]')) return;
        document.querySelectorAll('#ai-strategy-cards .ai-radio-card').forEach((c) => c.classList.remove('is-selected'));
        card.classList.add('is-selected');
        state.strategy = key;
        localStorage.setItem(STORAGE_KEYS.STRATEGY, state.strategy);
      });

      card.querySelector('[data-edit-strat]')?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openStrategyForm(key);
      });

      card.querySelector('[data-del-strat]')?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm(`Hapus strategi kustom "${s.title}"?`)) {
          deleteCustomStrategy(key).then(() => {
            showStudioToast(`✓ Strategi "${s.title}" telah dihapus dari disk`, true);
          });
        }
      });

      container.appendChild(card);
    });
  }

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

  
  function addManualInternalLink(url, anchor, title) {
    if (!url) return false;
    if (!url.startsWith('/') && !url.startsWith('http')) url = '/' + url;
    if (!anchor) anchor = title || url;
    state.selectedLinks = state.selectedLinks || [];
    const existing = state.selectedLinks.find((l) => l.url === url);
    if (existing) {
      existing.anchor = anchor;
      if (title) existing.title = title;
    } else {
      state.selectedLinks.push({ title: title || anchor, url, anchor });
    }
    renderInternalLinksTable();
    return true;
  }

  function autoSuggestInternalLinks() {
    if (!state.siteCatalog || !Array.isArray(state.siteCatalog) || state.siteCatalog.length === 0) return;
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

  // STAGE 1: Image Analysis (Vision API with Multi-Image Support)
  async function runStage1ImageAnalysis() {
    const imagesToAnalyze = (state.uploadedImages && state.uploadedImages.length > 0)
      ? state.uploadedImages
      : (state.uploadedImage ? [state.uploadedImage] : []);

    if (imagesToAnalyze.length === 0 || !imagesToAnalyze[0]?.base64) {
      state.visionAnalysis = null;
      return null;
    }

    const isEn = state.language === 'en';
    updateProgressUI(
      isEn ? 'Stage 1: Analyzing Images with Multimodal Vision AI...' : 'Tahap 1: Menganalisa Gambar dengan Vision AI...',
      isEn ? `Extracting visual entities & architecture flow for ${imagesToAnalyze.length} image(s)...` : `Mengekstrak entitas visual & diagram untuk ${imagesToAnalyze.length} gambar...`,
      15
    );

    for (let i = 0; i < imagesToAnalyze.length; i++) {
      const img = imagesToAnalyze[i];
      if (!img.base64) continue;
      if (img.visionAnalysis) continue; // Skip if already analyzed

      const currentTopic = state.topic || (state.focusKeyphrases && state.focusKeyphrases[0]) || '';
      const keyphrasesStr = state.focusKeyphrases && state.focusKeyphrases.length > 0 ? state.focusKeyphrases.join(', ') : currentTopic;
      const roleLabel = img.isCover ? (isEn ? 'Cover Hero Image' : 'Gambar Sampul/Hero Utama') : (isEn ? 'Body Content Diagram' : 'Diagram Pendukung Tubuh Artikel');

      const prompt = isEn
        ? `You are analyzing a technical diagram/image for an authoritative article.
Article Context:
- Topic / Focus: "${currentTopic || 'Technical SEO & Digital Architecture'}"
- Focus Keyphrases: "${keyphrasesStr || currentTopic}"
- Image Role: ${roleLabel} (Image ${i + 1}/${imagesToAnalyze.length}: "${img.name}")

Analyze this image in-depth and return response ONLY in valid JSON format:
{
  "alt": "Descriptive, SEO-optimized, and screen-reader friendly alt text mentioning core visual elements (max 120 characters)",
  "caption": "Professional, highly contextual figcaption (1-2 clear sentences, max 200 characters) directly explaining what specific architectural flow, data metrics, benchmark comparison, or process this diagram illustrates regarding ${currentTopic || 'the topic'}. Avoid generic filler like 'This image shows' or 'Diagram of', state the takeaway directly.",
  "visualInsights": "Detailed breakdown of specific entities, components, metrics, or relationships visible in this image to reference in the article narrative",
  "recommendedPlacement": "Specific article outline section/heading where this image provides the strongest evidentiary or explanatory value"
}`
        : `Anda sedang menganalisa gambar/diagram teknis untuk artikel profesional.
Konteks Artikel:
- Topik / Fokus: "${currentTopic || 'SEO Teknis & Arsitektur Digital'}"
- Focus Keyphrases: "${keyphrasesStr || currentTopic}"
- Peran Gambar: ${roleLabel} (Gambar ${i + 1}/${imagesToAnalyze.length}: "${img.name}")

Analisa gambar ini secara mendalam dan kembalikan respon HANYA dalam format JSON valid:
{
  "alt": "Alt text deskriptif, teroptimasi SEO, dan ramah screen-reader yang menyebutkan elemen visual utama (maksimal 120 karakter)",
  "caption": "Caption profesional dan sangat kontekstual untuk <figcaption> (1-2 kalimat lugas, maksimal 200 karakter) yang menjelaskan secara spesifik alur arsitektur, data/metrik, perbandingan tolok ukur, atau proses apa yang diilustrasikan diagram ini terkait ${currentTopic || 'topik artikel'}. Hindari kalimat klise seperti 'Gambar ini menampilkan' atau 'Diagram tentang', langsung sampaikan poin/insight utamanya.",
  "visualInsights": "Rincian spesifik entitas, komponen, data/metrik, atau relasi yang terlihat pada gambar untuk diintegrasikan ke narasi teks artikel",
  "recommendedPlacement": "Rekomendasi subjudul/section artikel yang paling tepat agar gambar ini memberikan nilai penjelasan maksimal"
}`;

      try {
        const rawResponse = await callAI({
          prompt,
          systemPrompt: isEn
            ? 'You are a senior technical SEO & multimodal vision expert. Output valid JSON only. Respond strictly in English.'
            : 'You are a senior technical SEO & multimodal vision expert. Output valid JSON only.',
          imageBase64: img.base64,
          jsonMode: true,
        });

        const cleanJson = rawResponse.replace(/```json\n?|```/g, '').trim();
        img.visionAnalysis = JSON.parse(cleanJson);
      } catch (e) {
        const fallbackTopic = currentTopic || (isEn ? 'Technical Architecture' : 'Arsitektur Teknis');
        const cleanImgTitle = (img.cleanName || img.name || 'Diagram').replace(/[-_]/g, ' ').replace(/\.[a-zA-Z0-9]+$/, '');
        img.visionAnalysis = {
          alt: `${cleanImgTitle} - ${fallbackTopic}`.slice(0, 120),
          caption: isEn
            ? `Visualization of ${cleanImgTitle} demonstrating key architectural flows and data relations for ${fallbackTopic}.`
            : `Visualisasi ${cleanImgTitle} yang mengilustrasikan alur arsitektur dan relasi komponen utama dalam ${fallbackTopic}.`,
          visualInsights: isEn
            ? `Technical architectural components and implementation stages for ${fallbackTopic}.`
            : `Komponen arsitektur teknis dan tahapan implementasi untuk ${fallbackTopic}.`,
          recommendedPlacement: isEn ? 'Technical architecture implementation section' : 'Bagian implementasi arsitektur teknis',
        };
      }
    }

    const coverImg = imagesToAnalyze.find((im) => im.isCover) || imagesToAnalyze[0];
    state.visionAnalysis = coverImg ? coverImg.visionAnalysis : null;
    return state.visionAnalysis;
  }

  // STAGE 2: Outline Generation
  async function runStage2OutlineGeneration() {
    const isEn = state.language === 'en';
    updateProgressUI(
      isEn ? 'Stage 2: Structuring Rich Article Outline...' : 'Tahap 2: Menyusun Outline Artikel Terstruktur...',
      isEn ? 'Designing H1/H2/H3 hierarchy, word count allocation, Table, Quotes, 3 CTAs, and dynamic FAQs...' : 'Merancang hierarki H1/H2/H3, alokasi kata, Tabel, Kutipan, 3 CTA, dan FAQ dinamis...',
      30
    );

    const strategyConfig = getAllStrategies()[state.strategy] || STRATEGY_PRESETS.geo_ai_search;
    const primaryKeyword = state.focusKeyphrases[0] || state.topic || (isEn ? 'Technical SEO' : 'SEO Teknis');
    const keyphrasesList = state.focusKeyphrases.join(', ') || state.topic || primaryKeyword;
    const internalLinksContext = state.selectedLinks.length > 0
      ? state.selectedLinks.map((l) => `- [${l.anchor}](${l.url}) : ${l.title}`).join('\n')
      : (isEn ? 'None provided.' : 'Tidak ada.');
    
    let visionContext = isEn ? 'No image uploaded.' : 'Tidak ada gambar yang diunggah.';
    const availableImages = (state.uploadedImages && state.uploadedImages.length > 0)
      ? state.uploadedImages
      : (state.uploadedImage ? [state.uploadedImage] : []);

    if (availableImages.length > 0) {
      visionContext = availableImages.map((img, idx) => {
        const va = img.visionAnalysis || {};
        return isEn
          ? `Image ${idx + 1} (${img.isCover ? 'Cover Hero' : 'Body Diagram'}): ${img.cleanName || img.name}\nAlt: ${va.alt || img.name}\nCaption: ${va.caption || ''}\nVisual Insights: ${va.visualInsights || ''}`
          : `Gambar ${idx + 1} (${img.isCover ? 'Sampul/Cover' : 'Diagram Tubuh'}): ${img.cleanName || img.name}\nAlt: ${va.alt || img.name}\nCaption: ${va.caption || ''}\nVisual Insights: ${va.visualInsights || ''}`;
      }).join('\n\n');
    }

    const citationInstruction = state.includeCitations
      ? (isEn
          ? 'CITATIONS REQUIREMENT: Plan integration of authoritative industry/academic references (Google Search Central, IEEE, arXiv, Gartner, W3C) with inline citation anchors and a planned References section.'
          : 'PERSYARATAN SITASI: Rencanakan integrasi rujukan industri/akademik otoritatif (Google Search Central, IEEE, arXiv, Gartner, W3C) dengan jangkar sitasi dan rencana bagian Referensi.')
      : '';

    const prompt = isEn
      ? `You are an elite SEO strategist and technical architect creating an outline for an authoritative, comprehensive technical guide (target: 2,500+ words) optimized for Generative Engine Optimization (GEO) and Google AI Overviews.

CRITICAL LANGUAGE INSTRUCTION:
Write 100% in English. Never output Indonesian words, labels, or placeholders.

Primary Topic: "${state.topic || primaryKeyword}"
Primary Keyword (MUST be in Title & Slug): "${primaryKeyword}"
Focus Keyphrases: ${keyphrasesList}
Writing Strategy: ${strategyConfig.title} (${strategyConfig.instructions})
${citationInstruction}

Image / Diagram Context (Vision):
${visionContext}

Internal Links to Integrate Naturally:
${internalLinksContext}

SPECIFICATION REQUIREMENTS:
1. Title: 50-60 characters, MUST include the Primary Keyword.
2. Meta Description: 140-160 characters, high CTR compelling search snippet.
3. URL Slug: Max 60 characters, lowercase hyphens only, includes Primary Keyword.
4. Tags: Array of 3-6 relevant technical tags.
5. Outline Hierarchy:
   - H1: Authoritative article headline.
   - Sections (H2s and H3s): Allocate a proposed target word count for each section (e.g. 300 to 500 words per section).
   - Strategic Placements:
     * Exactly 1 Comparison / Benchmark Table: Specify the exact section in "tableNote".
     * 1 to 2 Expert Quotes: Specify the exact section in "quoteNote".
     * Exactly 3 Outcome-Driven CTAs placed strategically across the outline:
       - CTA #1 (Early transition CTA after foundations)
       - CTA #2 (Mid-article implementation/advisory CTA)
       - CTA #3 (Final strategic conversion CTA in closing section)
       Specify these in "ctaNote" of the respective sections.
6. FAQ Suggestions: 4 to 8 dynamic high-intent questions & search intents. Do NOT limit to 3 items.

Return ONLY a valid JSON object with the following structure:
{
  "title": "Title (50-60 characters, includes Primary Keyword)",
  "metaDescription": "Meta description (140-160 characters)",
  "slug": "url-slug-max-60-chars",
  "tags": ["Tag1", "Tag2", "Tag3", "Tag4"],
  "h1": "Article H1 Headline",
  "sections": [
    {
      "heading": "H2 Heading Text",
      "subheadings": ["H3 Subheading A", "H3 Subheading B"],
      "targetWordCount": 350,
      "focus": "Core focus of this section",
      "tableNote": "Comparison Table: X vs Y benchmark (or null)",
      "quoteNote": "Expert Quote: Quote from senior authority (or null)",
      "ctaNote": "CTA #1 / #2 / #3: Outcome-driven CTA copy and link (or null)",
      "includesImage": true/false,
      "internalLinkAnchor": "Anchor text if an internal link fits here"
    }
  ],
  "faqSuggestions": [
    { "question": "Question 1?", "intent": "Search intent" },
    { "question": "Question 2?", "intent": "Implementation clarity" },
    { "question": "Question 3?", "intent": "Impact on AI Answer Engines" },
    { "question": "Question 4?", "intent": "Troubleshooting / edge cases" },
    { "question": "Question 5?", "intent": "Cost & resource allocation" }
  ]
}`
      : `Buat outline artikel komprehensif, mendalam (target 2.500+ kata), dan teroptimasi untuk Generative Engine Optimization (GEO) dan Google AI Overviews.

TARGET BAHASA: ${isEn ? 'English' : 'Bahasa Indonesia'}
INSTRUKSI BAHASA: Tulis 100% dalam ${isEn ? 'English' : 'Bahasa Indonesia'}. Seluruh output JSON, judul, heading, dan FAQ harus konsisten dalam ${isEn ? 'English' : 'Bahasa Indonesia'}.

Topik Utama: "${state.topic || primaryKeyword}"
Primary Keyword (WAJIB ada di Judul & Slug): "${primaryKeyword}"
Focus Keyphrases: ${keyphrasesList}
Strategi Penulisan: ${strategyConfig.title} (${strategyConfig.instructions})
${citationInstruction}

Konteks Gambar (Vision):
${visionContext}

Internal Links yang harus disisipkan:
${internalLinksContext}

PERSYARATAN SPESIFIKASI:
1. Title: 50-60 karakter, WAJIB menyertakan Primary Keyword.
2. Meta Description: 140-160 karakter, padat dan menggugah CTR.
3. URL Slug: Maksimal 60 karakter, huruf kecil dengan tanda hubung (-), menyertakan Primary Keyword.
4. Tags: Array 3-6 tag teknis relevan.
5. Hierarki Outline:
   - H1: Judul H1 artikel yang berbobot.
   - Sections (H2 & H3): Alokasikan usulan target kata untuk setiap bagian (misal 300 - 500 kata per section).
   - Penempatan Khusus:
     * Tepat 1 Tabel Perbandingan / Benchmark: Catat di "tableNote".
     * 1-2 Kutipan Ahli (Expert Quotes): Catat di "quoteNote".
     * Tepat 3 CTA Berorientasi Hasil (Outcome-Driven CTAs) yang ditempatkan secara strategis di outline:
       - CTA #1 (Awal artikel / transisi fondasi)
       - CTA #2 (Pertengahan artikel / implementasi)
       - CTA #3 (Akhir artikel / transformasi strategis)
       Catat di "ctaNote" pada section terkait.
6. Rekomendasi FAQ: 4 hingga 8 pertanyaan berniat tinggi (search intent). Jangan batasi hanya 3 item.

Kembalikan HANYA format JSON valid dengan struktur:
{
  "title": "Judul (50-60 karakter, menyertakan Primary Keyword)",
  "metaDescription": "Meta description (140-160 karakter)",
  "slug": "url-slug-maks-60-karakter",
  "tags": ["Tag1", "Tag2", "Tag3", "Tag4"],
  "h1": "Judul H1 Utama",
  "sections": [
    {
      "heading": "H2 Heading Text",
      "subheadings": ["H3 Subheading A", "H3 Subheading B"],
      "targetWordCount": 350,
      "focus": "Fokus pembahasan pada bagian ini",
      "tableNote": "Tabel Perbandingan: X vs Y (atau null)",
      "quoteNote": "Kutipan Ahli: Pernyataan dari otoritas industri (atau null)",
      "ctaNote": "CTA #1 / #2 / #3: Ajakan bertindak berorientasi hasil (atau null)",
      "includesImage": true/false,
      "internalLinkAnchor": "Anchor text jika ada link yang cocok"
    }
  ],
  "faqSuggestions": [
    { "question": "Pertanyaan 1?", "intent": "Niat pencarian" },
    { "question": "Pertanyaan 2?", "intent": "Kejelasan implementasi" },
    { "question": "Pertanyaan 3?", "intent": "Dampak terhadap AI Answer Engines" },
    { "question": "Pertanyaan 4?", "intent": "Studi kasus / penanganan kendala" },
    { "question": "Pertanyaan 5?", "intent": "Alokasi sumber daya & biaya" }
  ]
}`;

    const rawResponse = await callAI({
      prompt,
      systemPrompt: isEn
        ? 'You are an elite SEO strategist and technical architect. Always output valid JSON only. Respond 100% in English.'
        : 'Anda adalah pakar strategi SEO teknis dan arsitektur web kelas dunia. Selalu hasilkan format JSON valid saja dalam Bahasa Indonesia formal.',
      jsonMode: true,
    });

    try {
      const cleanJson = rawResponse.replace(/```json\n?|```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      state.outline = parsed.sections || [];
      state.proposedTitle = parsed.title || parsed.proposedTitle || '';
      state.proposedSlug = parsed.slug || parsed.proposedSlug || '';
      state.proposedDescription = parsed.metaDescription || parsed.description || '';
      state.proposedTags = parsed.tags || [];
      state.proposedH1 = parsed.h1 || parsed.title || parsed.proposedTitle || '';
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

    const isEn = state.language === 'en';
    const chunks = [];
    if (chunkCount === 1) {
      chunks.push({ index: 1, total: 1, sections: sections, name: isEn ? 'Complete Article' : 'Seluruh Artikel' });
    } else if (chunkCount === 2) {
      const mid = Math.ceil(sections.length / 2);
      chunks.push({ index: 1, total: 2, sections: sections.slice(0, mid), name: isEn ? 'Part 1: Foundations & Architecture' : 'Bagian 1: Fondasi & Arsitektur Utama' });
      chunks.push({ index: 2, total: 2, sections: sections.slice(mid), name: isEn ? 'Part 2: Advanced Implementation & Synthesis' : 'Bagian 2: Implementasi Lanjutan & Evaluasi' });
    } else {
      const p1 = Math.ceil(sections.length / 3);
      const p2 = Math.ceil((sections.length * 2) / 3);
      chunks.push({ index: 1, total: 3, sections: sections.slice(0, p1), name: isEn ? 'Part 1: Executive Answer & Core Foundations' : 'Bagian 1: Definisi Eksekutif & Fondasi' });
      chunks.push({ index: 2, total: 3, sections: sections.slice(p1, p2), name: isEn ? 'Part 2: Deep Architecture, Visuals & Frameworks' : 'Bagian 2: Arsitektur Inti & Pembahasan Visual' });
      chunks.push({ index: 3, total: 3, sections: sections.slice(p2), name: isEn ? 'Part 3: Advanced Optimization, Synthesis & Roadmaps' : 'Bagian 3: Optimasi Lanjutan, Praktik Terbaik & Kesimpulan' });
    }

    let accumulatedText = '';
    const internalLinksList = state.selectedLinks.map((l) => `[${l.anchor}](${l.url})`).join(', ');

    for (const chunk of chunks) {
      const pct = 40 + Math.round((chunk.index / chunk.total) * 45);
      updateProgressUI(
        isEn
          ? `Stage 3: Writing Article Body (${chunk.index}/${chunk.total})...`
          : `Tahap 3: Menulis Body Artikel (${chunk.index}/${chunk.total})...`,
        isEn
          ? `Synthesizing ${chunk.name} using ${state.provider === 'openai' ? state.openaiModel : state.geminiModel}...`
          : `Sedang menyusun ${chunk.name} dengan model ${state.provider === 'openai' ? state.openaiModel : state.geminiModel}...`,
        pct
      );

      const sectionOutlineText = chunk.sections.map((s, sIdx) => {
        let txt = `## ${s.heading}\n`;
        if (s.subheadings && s.subheadings.length > 0) {
          txt += s.subheadings.map((sub) => `### ${sub}`).join('\n') + '\n';
        }
        if (s.targetWordCount) txt += `Proposed Word Count: ~${s.targetWordCount} words\n`;
        if (s.focus) txt += `Focus: ${s.focus}\n`;
        if (s.tableNote) txt += `[INCLUDE COMPARISON TABLE]: ${s.tableNote}\n`;
        if (s.quoteNote) txt += `[INCLUDE EXPERT QUOTE]: ${s.quoteNote}\n`;
        if (s.ctaNote) txt += `[INCLUDE OUTCOME-DRIVEN CTA]: ${s.ctaNote}\n`;
        if (s.includesImage) {
          const availableImages = (state.uploadedImages && state.uploadedImages.length > 0)
            ? state.uploadedImages
            : (state.uploadedImage ? [state.uploadedImage] : []);

          if (availableImages.length > 0) {
            const imgIdx = (chunk.index - 1 + sIdx) % availableImages.length;
            const targetImg = availableImages[imgIdx] || availableImages[0];
            const altText = targetImg.visionAnalysis?.alt || targetImg.name || 'Diagram';
            const captionText = targetImg.visionAnalysis?.caption || '';
            txt += `[INCLUDE IMAGE]: Use HTML <figure class="article-image-figure"><img src="${targetImg.url}" alt="${altText}" class="article-body-image" loading="lazy" /><figcaption class="article-image-caption">${captionText}</figcaption></figure>\n`;
          }
        }
        return txt;
      }).join('\n\n');

      const isFirst = chunk.index === 1;
      const isLast = chunk.index === chunk.total;

      const strategyConfig = getAllStrategies()[state.strategy] || STRATEGY_PRESETS.geo_ai_search;
      const prompt = isEn
        ? `You are an elite technical author writing for theramadhani.com. Write the following article section strictly in professional, authoritative English.

CRITICAL LANGUAGE INSTRUCTION:
Write 100% in English. Never output Indonesian words, labels, or placeholders.

Primary Topic: "${state.proposedTitle || state.topic}"
Strategy (${strategyConfig.title}):
${strategyConfig.instructions}
Focus Keyphrases: ${state.focusKeyphrases.join(', ')}
Relevant Internal Links to embed naturally: ${internalLinksList}

${isFirst ? `CRITICAL FOR FIRST SECTION:
- Start IMMEDIATELY with a definitive 40-60 word Quick Answer Block summarizing the direct answer for AI Overviews, Perplexity, and ChatGPT. Must be 100% in English.
- Proceed directly to the first H2 without conversational greetings or rhetorical opening remarks.` : ''}

${!isFirst ? `PREVIOUS NARRATIVE CONTEXT (Maintain seamless flow without repeating intro phrases):
${accumulatedText.slice(-800)}` : ''}

${isLast ? `CRITICAL FOR FINAL SECTION:
- Provide strategic conclusions, next actionable steps, and executive takeaways.
${state.includeCitations ? '- Append a formal `### References & Authoritative Sources` section listing cited research, standards, and whitepapers (e.g., Google Search Central, IEEE, W3C, arXiv) with formal citations.' : ''}` : ''}

${state.includeCitations ? `CITATION INSTRUCTIONS:
- Include inline citations such as [^1], [^2], or authoritative in-text citations (e.g. Google Search Central, 2025) for data claims, technical metrics, and algorithmic explanations.` : ''}

OUTLINE FOR THIS CHUNK:
${sectionOutlineText}

TECHNICAL RULES:
- Use ## for H2 and ### for H3.
- Do NOT output an H1 (rendered automatically by the template).
- If a section contains a tableNote, construct a full, clean Markdown comparison table.
- If a section contains a quoteNote, include a formatted blockquote (> "...") with expert attribution.
- If a section contains a ctaNote, format a high-converting outcome-driven call-to-action block.
- Write dense, high-impact technical markdown with specific metrics, architecture, and examples.
- Output pure Markdown only.`
        : `Anda adalah penulis teknis kelas dunia untuk theramadhani.com. Tulis bagian artikel berikut dengan gaya profesional, otoritatif, dan mendalam.

TARGET BAHASA: ${isEn ? 'English' : 'Bahasa Indonesia'}
INSTRUKSI BAHASA: Tulis 100% dalam ${isEn ? 'English' : 'Bahasa Indonesia'}. Seluruh konten, heading, tabel, kutipan, dan CTA harus konsisten dalam ${isEn ? 'English' : 'Bahasa Indonesia'}.

Topik Utama: "${state.proposedTitle || state.topic}"
Strategi Penulisan (${strategyConfig.title}):
${strategyConfig.instructions}
Fokus Keyphrases: ${state.focusKeyphrases.join(', ')}
Internal Link yang relevan untuk disisipkan alami: ${internalLinksList}

${isFirst ? `PENTING UNTUK BAGIAN AWAL:
- Mulai langsung dengan Quick Answer Block definitif 40-60 kata yang merangkum inti jawaban untuk GEO / AI Search dalam Bahasa Indonesia baku.
- Setelah itu lanjutkan ke H2 pertama tanpa kalimat pengantar basa-basi.` : ''}

${!isFirst ? `KONTEKS SEBELUMNYA (Jaga kesinambungan alur tanpa mengulang kalimat pembuka):
${accumulatedText.slice(-800)}` : ''}

${isLast ? `PENTING UNTUK BAGIAN AKHIR:
- Sertakan kesimpulan strategis, rekomendasi langkah berikutnya, dan ringkasan eksekutif.
${state.includeCitations ? '- Sertakan bagian `### Referensi & Sumber Rujukan` yang mencantumkan sumber resmi (Google Search Central, IEEE, W3C, arXiv).' : ''}` : ''}

${state.includeCitations ? `INSTRUKSI SITASI:
- Sertakan sitasi inline seperti [^1], [^2], atau kutipan otoritatif (misal Google Search Central, 2025) untuk klaim data dan metrik teknis.` : ''}

OUTLINE YANG HARUS DITULIS PADA CHUNK INI:
${sectionOutlineText}

INSTRUKSI TEKNIS:
- Gunakan heading ## untuk H2 dan ### untuk H3.
- Jangan menyertakan H1 (karena judul H1 otomatis dirender oleh sistem template).
- Jika ada catatan tableNote, bangun tabel Markdown lengkap.
- Jika ada catatan quoteNote, sertakan blockquote (> "...") dengan atribusi ahli.
- Jika ada catatan ctaNote, format blok Call-To-Action yang persuasif.
- Tulis secara mendalam, sertakan poin-poin struktural, metrik kuantitatif, dan fakta teknis.
- Tulis hanya isi Markdown-nya saja.`;

      const chunkOutput = await callAI({
        prompt,
        systemPrompt: isEn
          ? 'You are a world-class Technical SEO & GEO Author writing exclusively in English. Dense, high-impact technical markdown without fluff.'
          : 'You are a world-class Technical SEO & GEO Author. Write dense, high-impact technical markdown without fluff.',
      });

      state.bodyChunks.push(chunkOutput);
      accumulatedText += '\n\n' + chunkOutput;
    }

    return accumulatedText.trim();
  }

  // STAGE 4: Synthesis & Supporting Elements
  async function runStage4Synthesis() {
    const isEn = state.language === 'en';
    updateProgressUI(
      isEn ? 'Stage 4: Synthesizing Metadata & Dynamic FAQs...' : 'Tahap 4: Sintesis Artikel & Metadata Pendukung...',
      isEn ? 'Generating meta description, slug, Quick Answer, tags, and 4-8 dynamic FAQs...' : 'Menghasilkan meta description, slug, Quick Answer, tags, dan 4-8 FAQ dinamis...',
      90
    );

    const fullBody = state.bodyChunks.join('\n\n').trim();
    const keyphrasesList = state.focusKeyphrases.join(', ');

    const prompt = isEn
      ? `Evaluate the following draft article and produce the final metadata strictly in English:

Article Body:
${fullBody.substring(0, 3500)}...

Focus Keyphrases: ${keyphrasesList}

CRITICAL LANGUAGE REQUIREMENT:
All outputs must be 100% in English. The Quick Answer block and ALL FAQ questions and answers MUST be strictly in English. Never output Indonesian words, terms, or placeholders.

Return ONLY a valid JSON object with the following structure:
{
  "title": "Final SEO Title (50-60 characters, CTR-optimized, includes primary keyword)",
  "slug": "url-slug-max-60-chars-lowercase-hyphens",
  "description": "Dense meta description (140-160 characters) driving high organic CTR",
  "quickAnswer": "Definitive summary (40-60 words) directly answering the primary query for AI Overviews and Perplexity citations. 100% in English.",
  "tags": ["Tag1", "Tag2", "Tag3", "Tag4"],
  "faq": [
    {
      "question": "High-intent FAQ Question 1?",
      "answer": "In-depth, factual 2-3 sentence answer with specific technical detail."
    },
    {
      "question": "High-intent FAQ Question 2?",
      "answer": "Direct technical explanation."
    },
    {
      "question": "High-intent FAQ Question 3?",
      "answer": "Empirical impact and metrics."
    },
    {
      "question": "High-intent FAQ Question 4?",
      "answer": "Implementation nuances and edge cases."
    },
    {
      "question": "High-intent FAQ Question 5?",
      "answer": "Resource and execution recommendations."
    }
  ]
}

NOTE: Provide 4 to 8 high-intent FAQ items based on user search journeys. Do NOT restrict to 3 items.`
      : `Evaluasi draf artikel berikut dan hasilkan metadata pendukung yang sempurna dalam Bahasa Indonesia:

Artikel Body:
${fullBody.substring(0, 3500)}...

Focus Keyphrases: ${keyphrasesList}

Kembalikan HANYA format JSON valid dengan struktur:
{
  "title": "Judul SEO final yang memicu CTR tinggi (50-60 karakter, menyertakan keyword utama)",
  "slug": "slug-url-bersih-tanpa-spasi",
  "description": "Meta description padat 140-160 karakter yang menggugah klik",
  "quickAnswer": "Definitive summary 40-60 kata langsung to-the-point untuk kutipan AI Overviews & Perplexity dalam Bahasa Indonesia",
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
    },
    {
      "question": "Pertanyaan FAQ 4?",
      "answer": "Jawaban implementasi praktis."
    },
    {
      "question": "Pertanyaan FAQ 5?",
      "answer": "Jawaban evaluasi dan biaya."
    }
  ]
}

CATATAN: Buat 4 hingga 8 FAQ dinamis berniat tinggi sesuai alur pembaca. Jangan batasi hanya 3 item.`;

    const rawResponse = await callAI({
      prompt,
      systemPrompt: isEn
        ? 'You are an SEO metadata synthesizer. Output valid JSON only. Respond strictly in English.'
        : 'You are an SEO metadata synthesizer. Output valid JSON only.',
      jsonMode: true,
    });

    try {
      const cleanJson = rawResponse.replace(/```json\n?|```/g, '').trim();
      const meta = JSON.parse(cleanJson);

      state.synthesizedArticle = {
        title: meta.title || state.proposedTitle || (isEn ? 'Technical SEO Guide' : 'Artikel Teknis'),
        slug: meta.slug || state.proposedSlug || (isEn ? 'technical-seo-guide' : 'artikel-teknis'),
        description: meta.description || state.proposedDescription || '',
        quickAnswer: meta.quickAnswer || '',
        tags: meta.tags || (state.proposedTags && state.proposedTags.length > 0 ? state.proposedTags : ['Technical SEO', 'GEO']),
        faq: meta.faq || [],
        coverImage: (state.uploadedImages && state.uploadedImages.length > 0)
          ? (state.uploadedImages.find((im) => im.isCover) || state.uploadedImages[0]).url
          : (state.uploadedImage ? state.uploadedImage.url : '/images/uploads/geo-blueprint.svg'),
        coverAlt: (state.uploadedImages && state.uploadedImages.length > 0)
          ? ((state.uploadedImages.find((im) => im.isCover) || state.uploadedImages[0]).visionAnalysis?.alt || state.visionAnalysis?.alt || (isEn ? 'Article cover diagram' : 'Diagram sampul artikel'))
          : (state.visionAnalysis?.alt || (isEn ? 'Article cover diagram' : 'Diagram sampul artikel')),
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
    if (element.type === 'file') return false;
    try {
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
    } catch (err) {
      console.warn('[AI Studio] setNativeValue warning:', err);
      return false;
    }
  }

  // =========================================================================
  // Decap CMS Redux Store Discovery & Direct Field Dispatch (Tier 1)
  // =========================================================================
  function getDecapReduxStore() {
    if (typeof window !== 'undefined') {
      if (window.store && typeof window.store.dispatch === 'function') return window.store;
      if (window.CMS && typeof window.CMS.getStore === 'function') {
        try {
          const cmsStore = window.CMS.getStore();
          if (cmsStore && typeof cmsStore.dispatch === 'function') return cmsStore;
        } catch (e) { /* ignore */ }
      }
    }

    const ncRoot = typeof document !== 'undefined' ? document.getElementById('nc-root') : null;
    if (ncRoot) {
      const rootKeys = Object.keys(ncRoot).filter(
        (k) => k.startsWith('_reactRootContainer') || k.startsWith('__reactContainer$') || k.startsWith('__reactFiber$')
      );
      for (const key of rootKeys) {
        let fiber = ncRoot[key];
        if (fiber && fiber._internalRoot) fiber = fiber._internalRoot.current;
        if (!fiber) continue;

        const queue = [fiber];
        let visited = 0;
        while (queue.length > 0 && visited < 1000) {
          const node = queue.shift();
          visited++;
          if (!node) continue;

          if (node.memoizedProps && node.memoizedProps.store && typeof node.memoizedProps.store.dispatch === 'function') {
            return node.memoizedProps.store;
          }
          if (node.stateNode && node.stateNode.store && typeof node.stateNode.store.dispatch === 'function') {
            return node.stateNode.store;
          }
          if (node.child) queue.push(node.child);
          if (node.sibling) queue.push(node.sibling);
        }
      }
    }

    if (typeof document !== 'undefined') {
      const candidates = document.querySelectorAll(
        '.decap-editor-form, [class*="EditorContainer"], [class*="CollectionPage"], [class*="AppHeader"], form'
      );
      for (const el of Array.from(candidates)) {
        const fKey = Object.keys(el).find((k) => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'));
        if (fKey && el[fKey]) {
          let curr = el[fKey];
          let depth = 0;
          while (curr && depth < 80) {
            if (curr.memoizedProps && curr.memoizedProps.store && typeof curr.memoizedProps.store.dispatch === 'function') {
              return curr.memoizedProps.store;
            }
            if (curr.stateNode && curr.stateNode.store && typeof curr.stateNode.store.dispatch === 'function') {
              return curr.stateNode.store;
            }
            curr = curr.return;
            depth++;
          }
        }
      }
    }

    return null;
  }

  function setCoverImageViaRedux(imageUrl) {
    const store = getDecapReduxStore();
    if (!store || typeof store.dispatch !== 'function') return false;

    try {
      const state = typeof store.getState === 'function' ? store.getState() : null;
      const entryDraft = state && state.entryDraft;
      let coverField = null;

      if (entryDraft && typeof entryDraft.get === 'function') {
        const fields = entryDraft.get('fields');
        if (fields) {
          if (typeof fields.find === 'function') {
            coverField = fields.find((f) => {
              const name = f && f.get ? f.get('name') : f && f.name;
              return name === 'coverImage';
            });
          } else if (typeof fields.forEach === 'function') {
            fields.forEach((f) => {
              const name = f && f.get ? f.get('name') : f && f.name;
              if (name === 'coverImage') coverField = f;
            });
          }
        }
      }

      if (!coverField) {
        coverField = {
          get: (k) => (k === 'name' ? 'coverImage' : k === 'meta' ? false : null),
          name: 'coverImage',
          widget: 'image',
        };
      }

      store.dispatch({
        type: 'DRAFT_CHANGE_FIELD',
        payload: {
          field: coverField,
          value: imageUrl,
        },
      });

      console.log('[AI Studio] Cover image dispatched via Decap Redux store:', imageUrl);
      return true;
    } catch (err) {
      console.warn('[AI Studio] Error in setCoverImageViaRedux:', err);
      return false;
    }
  }

  function setCoverImageViaFiber(imageUrl) {
    const candidates = [
      ...Array.from(document.querySelectorAll('[class*="ControlPane"], [class*="control"], [class*="Field"], .control-pane, .cover-pane')),
      ...Array.from(document.querySelectorAll('label, [class*="TopBarLabel"], [class*="ControlLabel"], span'))
        .filter((el) => {
          const txt = (el.textContent || '').trim().toLowerCase();
          return txt === 'cover image' || txt === 'cover image / diagram' || txt.startsWith('cover image');
        })
        .map((el) => el.closest('[class*="ControlPane"], [class*="control"], [class*="Field"], .control-pane') || el.parentElement?.parentElement || el.parentElement)
        .filter(Boolean),
      ...Array.from(document.querySelectorAll('button'))
        .filter((b) => {
          const bt = (b.textContent || '').toLowerCase();
          return bt.includes('choose different image') || bt.includes('choose an image') || bt.includes('replace with url') || bt.includes('remove image');
        })
        .map((b) => b.closest('[class*="ControlPane"], [class*="control"], [class*="Field"], .control-pane') || b.parentElement?.parentElement || b.parentElement)
        .filter(Boolean),
    ];

    for (const el of candidates) {
      let dom = el;
      while (dom && dom !== document.body) {
        const fiberKey = Object.keys(dom).find(
          (k) => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance')
        );
        if (fiberKey && dom[fiberKey]) {
          let curr = dom[fiberKey];
          let depth = 0;
          while (curr && depth < 45) {
            const props = curr.memoizedProps;
            if (props && typeof props.onChange === 'function') {
              const fName = props.field && props.field.get ? props.field.get('name') : props.field && props.field.name;
              const isCover = fName === 'coverImage' || (props.forID && props.forID.includes('coverImage'));
              if (isCover) {
                try {
                  if (props.field && props.onChange.length >= 2) {
                    props.onChange(props.field, imageUrl);
                    console.log('[AI Studio] Cover image injected via React Fiber (ControlHOC signature):', imageUrl);
                    return true;
                  }
                } catch (e1) {
                  console.warn('[AI Studio] Fiber (field, value) invocation error:', e1);
                }

                try {
                  props.onChange(imageUrl);
                  console.log('[AI Studio] Cover image injected via React Fiber (FileControl signature):', imageUrl);
                  return true;
                } catch (e2) {
                  console.warn('[AI Studio] Fiber (value) invocation error:', e2);
                }

                if (props.field) {
                  try {
                    props.onChange(props.field, imageUrl);
                    return true;
                  } catch (e3) { /* ignore */ }
                }
              }
            }

            if (curr.stateNode && curr.stateNode.props && typeof curr.stateNode.props.onChange === 'function') {
              const snProps = curr.stateNode.props;
              const fName = snProps.field && snProps.field.get ? snProps.field.get('name') : snProps.field && snProps.field.name;
              if (fName === 'coverImage') {
                try {
                  snProps.onChange(imageUrl);
                  console.log('[AI Studio] Cover image injected via Fiber stateNode.props.onChange:', imageUrl);
                  return true;
                } catch (eSn) { /* ignore */ }
              }
            }

            curr = curr.return;
            depth++;
          }
        }
        dom = dom.parentElement;
      }
    }

    return false;
  }

  function setCoverImageViaUrlButton(imageUrl) {
    const candidates = [
      ...Array.from(document.querySelectorAll('[class*="ControlPane"], [class*="control"], [class*="Field"], .control-pane, .cover-pane')),
      ...Array.from(document.querySelectorAll('label, [class*="TopBarLabel"], [class*="ControlLabel"], span'))
        .filter((el) => {
          const txt = (el.textContent || '').trim().toLowerCase();
          return txt === 'cover image' || txt === 'cover image / diagram' || txt.startsWith('cover image');
        })
        .map((el) => el.closest('[class*="ControlPane"], [class*="control"], [class*="Field"], .control-pane') || el.parentElement?.parentElement || el.parentElement)
        .filter(Boolean),
    ];

    for (const pane of candidates) {
      const buttons = Array.from(pane.querySelectorAll('button'));
      const urlBtn = buttons.find((b) => {
        const txt = (b.textContent || '').trim().toLowerCase();
        return txt.includes('url') || txt.includes('replace with url') || txt.includes('insert from url') || txt.includes('choose from url');
      });

      if (urlBtn) {
        const origPrompt = window.prompt;
        try {
          window.prompt = () => imageUrl;
          urlBtn.click();
          console.log('[AI Studio] Cover image set via Decap native URL button prompt:', imageUrl);
          return true;
        } catch (bErr) {
          console.warn('[AI Studio] Error triggering URL button:', bErr);
        } finally {
          window.prompt = origPrompt;
        }
      }
    }

    return false;
  }

  function findCoverImageFiberOnChange() {
    const candidates = [
      ...Array.from(document.querySelectorAll('[class*="ControlPane"], [class*="control"], [class*="Field"], .control-pane, .cover-pane')),
      ...Array.from(document.querySelectorAll('label, [class*="TopBarLabel"], [class*="ControlLabel"], span'))
        .filter((el) => {
          const txt = (el.textContent || '').trim().toLowerCase();
          return txt === 'cover image' || txt === 'cover image / diagram' || txt.startsWith('cover image');
        })
        .map((el) => el.closest('[class*="ControlPane"], [class*="control"], [class*="Field"], .control-pane') || el.parentElement?.parentElement || el.parentElement)
        .filter(Boolean),
      ...Array.from(document.querySelectorAll('button'))
        .filter((b) => {
          const bt = (b.textContent || '').toLowerCase();
          return bt.includes('choose different image') || bt.includes('choose an image') || bt.includes('replace with url') || bt.includes('remove image');
        })
        .map((b) => b.closest('[class*="ControlPane"], [class*="control"], [class*="Field"], .control-pane') || b.parentElement?.parentElement || b.parentElement)
        .filter(Boolean),
    ];

    for (const el of candidates) {
      let dom = el;
      while (dom && dom !== document.body) {
        const fiberKey = Object.keys(dom).find(
          (k) => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance')
        );
        if (fiberKey && dom[fiberKey]) {
          let curr = dom[fiberKey];
          let depth = 0;
          while (curr && depth < 45) {
            if (curr.memoizedProps) {
              const props = curr.memoizedProps;
              const fName = props.field && props.field.get ? props.field.get('name') : props.field && props.field.name;
              const isCover = fName === 'coverImage' || (props.forID && props.forID.includes('coverImage'));
              if (isCover && typeof props.onChange === 'function') {
                return function(val, optVal) {
                  const actualVal = optVal !== undefined ? optVal : val;
                  try {
                    if (props.field && props.onChange.length >= 2) {
                      props.onChange(props.field, actualVal);
                      return;
                    }
                  } catch (e1) {}
                  try {
                    props.onChange(actualVal);
                  } catch (e2) {
                    if (props.field) props.onChange(props.field, actualVal);
                  }
                };
              }
            }
            curr = curr.return;
            depth++;
          }
        }
        dom = dom.parentElement;
      }
    }

    return null;
  }

  async function injectIntoDecapForm() {
    const art = state.synthesizedArticle;
    if (!art) {
      showStudioToast('Belum ada artikel yang disintesis untuk diterapkan.', false);
      return false;
    }

    setInjectLoading(true, 'Menyiapkan Editor Decap CMS...', 'Memeriksa koneksi DOM editor artikel Decap CMS...');

    // 1. Ensure Decap CMS editor is currently mounted
    const hasEditorDOM = () => {
      return !!(
        document.querySelector('input[id*="title-field-"]') ||
        document.querySelector('input[name="title"]') ||
        document.querySelector('[data-slate-editor="true"]') ||
        document.querySelector('.CodeMirror') ||
        document.querySelector('label[for*="title-field"]')
      );
    };

    if (!hasEditorDOM()) {
      showStudioToast('Mengarahkan ke editor artikel Decap CMS...', true);
      window.location.hash = '#/collections/articles/new';

      let attempts = 0;
      while (attempts < 20) {
        await new Promise((r) => setTimeout(r, 200));
        attempts++;
        if (hasEditorDOM()) break;
      }
      await new Promise((r) => setTimeout(r, 250));
    }

    // Ensure all uploaded images are persisted to disk and decap-server before injecting
    const imagesToPersist = [
      ...(state.uploadedImages || []),
      ...(state.uploadedImage ? [state.uploadedImage] : []),
    ];
    if (imagesToPersist.length > 0) {
      setInjectLoading(true, 'Menyimpan Berkas Media...', `Mengunggah & memverifikasi ${imagesToPersist.length} gambar ke media library...`);
      for (const img of imagesToPersist) {
        await persistImageFile(img);
      }
      await new Promise((r) => setTimeout(r, 60));
    }

    let injectedCount = 0;
    const populatedFields = [];

    // Helper to find field React Fiber onChange handler (fallback when native input is not present)
    function findFieldFiberOnChange(fieldName) {
      const targetVariants = [
        fieldName.toLowerCase(),
        fieldName.replace(/([A-Z])/g, ' $1').toLowerCase().trim(),
        fieldName.replace(/([A-Z])/g, '-$1').toLowerCase(),
      ];

      // Decap CMS uses span.TopBarLabel and div.ControlLabel, not only HTML <label>
      const labelElements = Array.from(
        document.querySelectorAll('label, [class*="TopBarLabel"], [class*="ControlLabel"], [class*="Label"], span, div')
      ).filter((el) => {
        const txt = (el.textContent || '').trim().toLowerCase();
        const elFor = (el.getAttribute('for') || '').toLowerCase();
        return targetVariants.some((v) => txt === v || txt.startsWith(v) || elFor.includes(v));
      });

      for (const label of labelElements) {
        const pane =
          label.closest('[class*="ControlPane"], [class*="control"], [class*="Field"], .control-pane') ||
          label.parentElement?.parentElement ||
          label.parentElement;
        if (!pane) continue;

        let dom = pane;
        while (dom && dom !== document.body) {
          const fiberKey = Object.keys(dom).find(
            (k) => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance')
          );
          if (fiberKey && dom[fiberKey]) {
            let curr = dom[fiberKey];
            let depth = 0;
            while (curr && depth < 45) {
              if (curr.memoizedProps && typeof curr.memoizedProps.onChange === 'function') {
                const fn = curr.memoizedProps.field?.get
                  ? curr.memoizedProps.field.get('name')
                  : curr.memoizedProps.field?.name;
                if (fn === fieldName || (curr.memoizedProps.value !== undefined && curr.memoizedProps.field)) {
                  return curr.memoizedProps.onChange;
                }
              }
              curr = curr.return;
              depth++;
            }
          }
          dom = dom.parentElement;
        }
      }

      // Fallback: Traverse all control panes directly for fieldName match in React Fiber
      const allPanes = Array.from(
        document.querySelectorAll('[class*="ControlPane"], [class*="control"], [class*="Field"], .control-pane')
      );
      for (const pane of allPanes) {
        const fiberKey = Object.keys(pane).find(
          (k) => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance')
        );
        if (fiberKey && pane[fiberKey]) {
          let curr = pane[fiberKey];
          let depth = 0;
          while (curr && depth < 45) {
            if (curr.memoizedProps && typeof curr.memoizedProps.onChange === 'function') {
              const fn = curr.memoizedProps.field?.get
                ? curr.memoizedProps.field.get('name')
                : curr.memoizedProps.field?.name;
              if (fn === fieldName) {
                return curr.memoizedProps.onChange;
              }
            }
            curr = curr.return;
            depth++;
          }
        }
      }

      return null;
    }

    // Dedicated Decap CMS Image Widget Fiber Discovery
    function findCoverImageFiberOnChange() {
      // 1. Check panes containing 'cover image' or image widget buttons
      const candidates = [
        ...Array.from(document.querySelectorAll('[class*="ControlPane"], [class*="control"], [class*="Field"], .control-pane')),
        ...Array.from(document.querySelectorAll('label, [class*="TopBarLabel"], [class*="ControlLabel"], span'))
          .filter((el) => {
            const txt = (el.textContent || '').trim().toLowerCase();
            return txt === 'cover image' || txt === 'cover image / diagram' || txt.startsWith('cover image');
          })
          .map((el) => el.closest('[class*="ControlPane"], [class*="control"], [class*="Field"]') || el.parentElement?.parentElement || el.parentElement)
          .filter(Boolean),
        ...Array.from(document.querySelectorAll('button'))
          .filter((b) => {
            const bt = (b.textContent || '').toLowerCase();
            return bt.includes('choose different image') || bt.includes('choose an image') || bt.includes('remove image');
          })
          .map((b) => b.closest('[class*="ControlPane"], [class*="control"], [class*="Field"]') || b.parentElement?.parentElement || b.parentElement)
          .filter(Boolean),
      ];

      for (const el of candidates) {
        let dom = el;
        while (dom && dom !== document.body) {
          const fiberKey = Object.keys(dom).find(
            (k) => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance')
          );
          if (fiberKey && dom[fiberKey]) {
            let curr = dom[fiberKey];
            let depth = 0;
            while (curr && depth < 45) {
              if (curr.memoizedProps) {
                const props = curr.memoizedProps;
                const fName = props.field?.get ? props.field.get('name') : props.field?.name;
                if ((fName === 'coverImage' || (props.forID && props.forID.includes('coverImage'))) && typeof props.onChange === 'function') {
                  return function(val, optVal) {
                    const actualVal = optVal !== undefined ? optVal : val;
                    try {
                      if (props.field && props.onChange.length >= 2) {
                        props.onChange(props.field, actualVal);
                        return;
                      }
                    } catch (e1) {}
                    try {
                      props.onChange(actualVal);
                    } catch (e2) {
                      if (props.field) props.onChange(props.field, actualVal);
                    }
                  };
                }
              }
              curr = curr.return;
              depth++;
            }
          }
          dom = dom.parentElement;
        }
      }

      return null;
    }

    // Helper to find field inputs across various Decap CMS DOM variations
    function findFieldInput(fieldName, widgetType = 'input') {
      const byId = document.querySelector(
        `input[id*="${fieldName}-field-"], textarea[id*="${fieldName}-field-"], input[id^="${fieldName}-"], textarea[id^="${fieldName}-"]`
      );
      if (byId) return byId;

      const byName = document.querySelector(`input[name="${fieldName}"], textarea[name="${fieldName}"]`);
      if (byName) return byName;

      const byDataField = document.querySelector(`[data-field-name="${fieldName}"] ${widgetType}`);
      if (byDataField) return byDataField;

      const labels = Array.from(document.querySelectorAll('label'));
      const targetVariants = [
        fieldName.toLowerCase(),
        fieldName.replace(/([A-Z])/g, ' $1').toLowerCase().trim(),
        fieldName.replace(/([A-Z])/g, '-$1').toLowerCase(),
      ];

      for (const label of labels) {
        const labelFor = (label.getAttribute('for') || '').toLowerCase();
        if (targetVariants.some((v) => labelFor.includes(v))) {
          const el = document.getElementById(label.getAttribute('for'));
          if (el) return el;
        }

        const labelText = label.textContent.trim().toLowerCase();
        if (targetVariants.some((v) => labelText.includes(v) || labelText.startsWith(v))) {
          const pane =
            label.closest('[class*="ControlPane"], [class*="control"], [class*="Field"]') ||
            label.parentElement?.parentElement ||
            label.parentElement;
          const input = pane?.querySelector('input, textarea');
          if (input) return input;
        }
      }

      return null;
    }

    setInjectLoading(true, 'Menyuntikkan Metadata & Judul...', 'Mengisi Title, Slug, Description, dan Quick Answer...');

    // 1. Title
    const titleEl = findFieldInput('title', 'input');
    if (titleEl && setNativeValue(titleEl, art.title)) {
      injectedCount++;
      populatedFields.push('Judul');
    }
    await new Promise((r) => setTimeout(r, 25));

    // 2. Slug
    const slugEl = findFieldInput('slug', 'input');
    if (slugEl && setNativeValue(slugEl, art.slug)) {
      injectedCount++;
      populatedFields.push('Slug');
    }
    await new Promise((r) => setTimeout(r, 25));

    // 3. Description
    const descEl = findFieldInput('description', 'textarea') || findFieldInput('description', 'input');
    if (descEl && setNativeValue(descEl, art.description)) {
      injectedCount++;
      populatedFields.push('Deskripsi');
    }
    await new Promise((r) => setTimeout(r, 25));

    // 4. Quick Answer
    const qaEl = findFieldInput('quickAnswer', 'textarea') || findFieldInput('quickAnswer', 'input');
    if (qaEl && setNativeValue(qaEl, art.quickAnswer)) {
      injectedCount++;
      populatedFields.push('Quick Answer');
    }
    await new Promise((r) => setTimeout(r, 25));

    // 5. Cover Image & Alt (Multi-Tier Injector)
    let coverInjected = false;

    // Check if normal input exists
    const coverEl = findFieldInput('coverImage', 'input');
    if (coverEl && coverEl.type !== 'file' && setNativeValue(coverEl, art.coverImage)) {
      coverInjected = true;
    }

    // Tier 1: Redux Store Direct Dispatch (100% reliable for Decap core draft)
    if (!coverInjected) {
      if (setCoverImageViaRedux(art.coverImage)) {
        coverInjected = true;
      }
    }

    // Tier 2: React Fiber Smart Invocation (supporting both ControlHOC and FileControl)
    if (!coverInjected) {
      if (setCoverImageViaFiber(art.coverImage)) {
        coverInjected = true;
      }
    }

    // Tier 3: React Fiber onChange fallback lookup
    if (!coverInjected) {
      const coverFiberOnChange = findCoverImageFiberOnChange() || findFieldFiberOnChange('coverImage');
      if (typeof coverFiberOnChange === 'function') {
        try {
          coverFiberOnChange(art.coverImage);
          coverInjected = true;
          console.log('[AI Studio] Cover image injected successfully via fallback React Fiber:', art.coverImage);
        } catch (fibErr) {
          console.warn('[AI Studio] Cover image fiber injection warning:', fibErr);
        }
      }
    }

    // Tier 4: Native Decap CMS URL Button Click Simulation
    if (!coverInjected) {
      if (setCoverImageViaUrlButton(art.coverImage)) {
        coverInjected = true;
      }
    }

    if (coverInjected) {
      injectedCount++;
      populatedFields.push('Gambar Sampul');
    }

    const coverAltEl = findFieldInput('coverAlt', 'input');
    if (coverAltEl && setNativeValue(coverAltEl, art.coverAlt)) {
      injectedCount++;
      populatedFields.push('Alt Sampul');
    }
    await new Promise((r) => setTimeout(r, 25));

    // 6. Tags Widget in Decap CMS (List Widget and Single Input Support)
    if (art.tags && Array.isArray(art.tags) && art.tags.length > 0) {
      setInjectLoading(true, 'Menyuntikkan Tags...', `Mengisi ${art.tags.length} tags ke dalam form Decap CMS...`);
      try {
        const labels = Array.from(document.querySelectorAll('label, [class*="TopBarLabel"], [class*="ControlLabel"], span'));
        const tagsLabel = labels.find((l) => {
          const lt = (l.textContent || '').trim().toLowerCase();
          return lt === 'tags' || lt === 'tag' || lt.startsWith('tags (');
        });
        const tagsPane = tagsLabel?.closest('[class*="ControlPane"], [class*="control"], [class*="Field"], .control-pane, .tags-pane') || tagsLabel?.parentElement?.parentElement;

        let addTagsBtn = null;
        if (tagsPane) {
          const buttons = Array.from(tagsPane.querySelectorAll('button'));
          addTagsBtn = buttons.find((b) => {
            const bt = (b.textContent || '').trim().toLowerCase();
            return bt.includes('add tags') || bt.includes('add tag') || bt === '+' || bt.includes('tambah');
          });
        }
        if (!addTagsBtn) {
          const allButtons = Array.from(document.querySelectorAll('button'));
          addTagsBtn = allButtons.find((b) => {
            const bt = (b.textContent || '').trim().toLowerCase();
            return bt.includes('add tags') || bt.includes('add tag') || bt === '+ add tag';
          });
        }

        let tagInputs = tagsPane
          ? Array.from(tagsPane.querySelectorAll('input:not([type="button"]):not([type="submit"])'))
          : Array.from(document.querySelectorAll('input[id*="tags-field-"], input[name*="tags"], input[id*="tags-"]'));

        if (addTagsBtn) {
          for (let i = tagInputs.length; i < art.tags.length; i++) {
            addTagsBtn.click();
            await new Promise((r) => setTimeout(r, 80));
          }
          tagInputs = tagsPane
            ? Array.from(tagsPane.querySelectorAll('input:not([type="button"]):not([type="submit"])'))
            : Array.from(document.querySelectorAll('input[id*="tags-field-"], input[name*="tags"], input[id*="tags-"]'));
        }

        let populatedTagsCount = 0;
        art.tags.forEach((tagText, idx) => {
          if (tagInputs[idx]) {
            setNativeValue(tagInputs[idx], tagText.trim());
            populatedTagsCount++;
          }
        });

        // Fallback if Decap uses a single input field for tags
        if (populatedTagsCount === 0) {
          const singleTagInput = findFieldInput('tags', 'input');
          if (singleTagInput) {
            setNativeValue(singleTagInput, art.tags.join(', '));
            populatedTagsCount = art.tags.length;
          }
        }

        if (populatedTagsCount > 0) {
          injectedCount++;
          populatedFields.push(`Tags (${art.tags.length} item)`);
        }
      } catch (tagErr) {
        console.warn('[AI Studio] Tag injection notice:', tagErr);
      }
      await new Promise((r) => setTimeout(r, 25));
    }

    // 7. Body Markdown & Expandable Q&A Accordion (Non-blocking & Slate-safe)
    setInjectLoading(true, 'Menyuntikkan Body & Expandable Q&A...', 'Menyusun body markdown dan komponen accordion...');
    let bodyContent = art.body || '';

    // Automatically append Expandable Q&A accordions into Markdown body if not already present
    if (art.faq && Array.isArray(art.faq) && art.faq.length > 0) {
      if (!bodyContent.includes('class="qa-item"')) {
        const isEn = state.language === 'en';
        const faqSectionHeading = isEn ? '## Frequently Asked Questions' : '## Pertanyaan yang Sering Diajukan';
        const faqAccordions = art.faq.map((item) => {
          const q = (item.question || '').trim();
          const a = (item.answer || '').trim();
          return `<details class="qa-item">\n<summary class="qa-question">${q}</summary>\n<div class="qa-answer">\n<p>${a}</p>\n</div>\n</details>`;
        }).join('\n\n');

        bodyContent = `${bodyContent.trim()}\n\n${faqSectionHeading}\n\n${faqAccordions}`;
        art.body = bodyContent;
      }
    }

    let bodyInjected = false;

    // Helper to find Decap CMS MarkdownControl React Fiber onChange handler
    function findBodyFiberOnChange() {
      const candidates = [
        document.querySelector('[data-slate-editor="true"]'),
        document.querySelector('.cms-editor-visual'),
        document.querySelector('.cms-editor-raw'),
        document.querySelector('button[role="switch"], [class*="ToolbarToggle"]')?.closest('[class*="ControlPane"], [class*="control"], .control-pane'),
      ].filter(Boolean);

      for (const el of candidates) {
        let dom = el;
        while (dom && dom !== document.body) {
          const fiberKey = Object.keys(dom).find(
            (k) => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance')
          );
          if (fiberKey && dom[fiberKey]) {
            let curr = dom[fiberKey];
            let depth = 0;
            while (curr && depth < 35) {
              if (curr.memoizedProps && typeof curr.memoizedProps.onChange === 'function') {
                const fieldName = curr.memoizedProps.field?.get
                  ? curr.memoizedProps.field.get('name')
                  : curr.memoizedProps.field?.name;
                if (fieldName === 'body' || (curr.memoizedProps.value !== undefined && curr.memoizedProps.field)) {
                  return curr.memoizedProps.onChange;
                }
              }
              curr = curr.return;
              depth++;
            }
          }
          dom = dom.parentElement;
        }
      }
      return null;
    }

    // Helper to find the specific Rich Text / Markdown mode toggle switch inside the Body widget toolbar
    // (Crucial: Avoids accidentally selecting the "Featured on Homepage" boolean switch)
    function findBodyModeSwitch() {
      const bodyPane = document.querySelector(
        '.cms-editor-visual, .cms-editor-raw, [data-slate-editor="true"]'
      )?.closest('[class*="ControlPane"], [class*="control"], .control-pane')
      || Array.from(document.querySelectorAll('[class*="ControlPane"], [class*="control"]')).find((pane) => {
        const text = pane.textContent || '';
        return text.includes('Rich Text') && text.includes('Markdown');
      });

      if (bodyPane) {
        const switchInPane = bodyPane.querySelector(
          'button[role="switch"], [class*="ToolbarToggle"], [class*="ToggleContainer"], [class*="EditorToggle"]'
        );
        if (switchInPane) return switchInPane;
      }

      const allSwitches = Array.from(
        document.querySelectorAll('button[role="switch"], [class*="ToolbarToggle"], [class*="EditorToggle"]')
      );
      for (const sw of allSwitches) {
        const parentText = (sw.parentElement?.textContent || '') + (sw.closest('div')?.textContent || '');
        if (parentText.includes('Rich Text') || parentText.includes('Markdown')) {
          return sw;
        }
      }

      return null;
    }

    // 7a. Primary: Decap CMS React Fiber onChange injection (Updates Redux & Preview immediately)
    const bodyOnChange = findBodyFiberOnChange();
    if (bodyOnChange) {
      try {
        bodyOnChange(bodyContent);
        bodyInjected = true;

        // Toggle mode to re-mount VisualEditor so Slate parses the new Redux markdown value into Slate AST
        const modeSwitch = findBodyModeSwitch();
        if (modeSwitch) {
          modeSwitch.click();
          await new Promise((r) => setTimeout(r, 150));
          modeSwitch.click();
          await new Promise((r) => setTimeout(r, 150));
        }
      } catch (fiberErr) {
        console.warn('[AI Studio] React Fiber injection notice:', fiberErr);
      }
    }

    // 7b. Secondary: CodeMirror / Raw mode switch injection (Standard fallback or for unit test mocks)
    if (!bodyInjected) {
      const modeSwitch = findBodyModeSwitch() || document.querySelector('button[role="switch"], [class*="ToolbarToggle"]');
      
      if (modeSwitch && !document.querySelector('.CodeMirror')) {
        try {
          modeSwitch.click();
          await new Promise((r) => setTimeout(r, 100));
        } catch (_) {}
      }

      const cm = document.querySelector('.CodeMirror')?.CodeMirror;
      if (cm && typeof cm.setValue === 'function') {
        try {
          cm.setValue(bodyContent);
          if (typeof cm.save === 'function') cm.save();
          bodyInjected = true;
        } catch (cmErr) {
          console.warn('[AI Studio] CodeMirror injection notice:', cmErr);
        }
      }

      if (!bodyInjected) {
        const bodyTextarea = document.querySelector(
          '.cms-editor-raw textarea, textarea[id*="body-field-"], textarea[name="body"]'
        );
        if (bodyTextarea && setNativeValue(bodyTextarea, bodyContent)) {
          bodyInjected = true;
        }
      }

      if (modeSwitch && bodyInjected) {
        await new Promise((r) => setTimeout(r, 60));
        try {
          modeSwitch.click();
          await new Promise((r) => setTimeout(r, 100));
        } catch (_) {}
      }
    }

    // 7c. Fallback for mock/test environments (e.g. JSDOM without React Fiber)
    if (!bodyInjected) {
      const slateEditor = document.querySelector('[data-slate-editor="true"]');
      if (slateEditor) {
        try {
          slateEditor.textContent = bodyContent;
          slateEditor.dispatchEvent(new Event('input', { bubbles: true }));
          bodyInjected = true;
        } catch (_) {}
      }
    }

    if (bodyInjected) {
      injectedCount++;
      populatedFields.push('Body Artikel & Expandable Q&A');

      // Auto-sync plan in Article Planner database if matching plan exists
      try {
        if (window.ArticlePlanner && window.ArticlePlanner.state?.plans) {
          const matchedPlan = window.ArticlePlanner.state.plans.find((p) => {
            const pTitle = (p.articleTitle || '').toLowerCase();
            const aTitle = (art.title || '').toLowerCase();
            const pKey = (p.focusKeyphrase || '').toLowerCase();
            const aKey = (state.primaryKeyword || '').toLowerCase();
            return pTitle === aTitle || (pKey && pKey === aKey);
          });
          if (matchedPlan) {
            window.ArticlePlanner.savePlan({
              id: matchedPlan.id,
              status: 'Published',
              slug: art.slug,
              liveUrl: art.slug ? `/articles/${art.slug}/` : undefined,
            });
          }
        }
      } catch (syncErr) {
        console.warn('[AI Studio] Article Planner sync notice:', syncErr);
      }
    }
    await new Promise((r) => setTimeout(r, 40));

    // 8. Frequently Asked Questions (FAQ) List Widget in Decap CMS (Supports Unlimited >3 FAQs)
    if (art.faq && Array.isArray(art.faq) && art.faq.length > 0) {
      setInjectLoading(true, 'Menyuntikkan FAQ Decap CMS...', `Mengisi ${art.faq.length} item FAQ ke widget Decap...`);
      try {
        const allButtons = Array.from(document.querySelectorAll('button'));
        let addFaqBtn = allButtons.find((b) => {
          const bt = (b.textContent || '').trim().toLowerCase();
          return bt.includes('add frequently asked questions') || bt === 'add faq' || bt === '+ add faq';
        });

        if (!addFaqBtn) {
          const labels = Array.from(document.querySelectorAll('label, [class*="TopBarLabel"], [class*="ControlLabel"]'));
          const faqLabel = labels.find((l) => {
            const lt = (l.textContent || '').trim().toLowerCase();
            return lt.includes('frequently asked questions') || lt === 'faq';
          });
          const pane = faqLabel?.closest('[class*="ControlPane"], [class*="control"], [class*="Field"], .control-pane');
          if (pane) {
            const paneButtons = Array.from(pane.querySelectorAll('button'));
            addFaqBtn = paneButtons.find((b) => {
              const bt = (b.textContent || '').trim().toLowerCase();
              return bt.includes('add') || bt.includes('tambah') || bt.includes('+');
            });
          }
        }

        let questionInputs = Array.from(
          document.querySelectorAll('input[id*="question"], input[name*="question"], [data-field-name="question"] input')
        );

        if (addFaqBtn) {
          for (let i = questionInputs.length; i < art.faq.length; i++) {
            addFaqBtn.click();
            await new Promise((r) => setTimeout(r, 120)); // wait for React DOM mount
          }
        }

        questionInputs = Array.from(
          document.querySelectorAll('input[id*="question"], input[name*="question"], [data-field-name="question"] input')
        );
        const answerTextareas = Array.from(
          document.querySelectorAll('textarea[id*="answer"], textarea[name*="answer"], [data-field-name="answer"] textarea, input[id*="answer"]')
        );

        let populatedFaqCount = 0;
        for (let idx = 0; idx < art.faq.length; idx++) {
          const faqItem = art.faq[idx];
          if (questionInputs[idx] && faqItem.question) {
            setNativeValue(questionInputs[idx], faqItem.question);
            populatedFaqCount++;
          }
          if (answerTextareas[idx] && faqItem.answer) {
            setNativeValue(answerTextareas[idx], faqItem.answer);
          }
          await new Promise((r) => setTimeout(r, 25));
        }

        if (populatedFaqCount > 0) {
          injectedCount++;
          populatedFields.push(`FAQ (${art.faq.length} item)`);
        }
      } catch (faqErr) {
        console.warn('[AI Studio] FAQ injection notice:', faqErr);
      }
    }

    setInjectLoading(false);
  // 8. Auto-copy fallback to Clipboard
    try {
      const fullMdx = `---
title: "${art.title}"
description: "${art.description}"
slug: "${art.slug}"
publishDate: ${new Date().toISOString().split('T')[0]}
coverImage: "${art.coverImage || ''}"
coverAlt: "${art.coverAlt || ''}"
quickAnswer: "${art.quickAnswer || ''}"
tags: ${JSON.stringify(art.tags || [])}${(art.faq && art.faq.length > 0) ? `
faq:
` + art.faq.map(f => `  - question: "${(f.question || '').replace(/"/g, '\"')}"
    answer: "${(f.answer || '').replace(/"/g, '\"')}"`).join('\n') : ''}
---

${art.body}`;
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(fullMdx);
      }
    } catch (_) {}

    if (injectedCount > 0) {
      showStudioToast(`✓ Berhasil menerapkan ke ${injectedCount} bidang: ${populatedFields.join(', ')}! (Disalin ke clipboard)`, true);
      setTimeout(() => {
        closeStudioDrawer();
      }, 1200);
      return true;
    } else {
      showStudioToast('⚠️ Form Decap Editor belum terbuka. Pastikan Anda berada di halaman "New Article". Konten telah disalin ke clipboard!', false);
      return false;
    }
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
          <button type="button" class="ai-studio-icon-btn" id="ai-btn-config" title="Konfigurasi API Key">⚙️</button>
          <button type="button" class="ai-studio-icon-btn" id="ai-btn-close" title="Tutup Studio">✕</button>
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
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <label class="ai-form-label" style="margin:0;">Topik Utama atau Judul Panduan</label>
              <button type="button" class="ai-btn ai-btn-secondary" id="ai-btn-pick-plan" style="padding:2px 8px; font-size:11px; color:#FBBF24; border-color:rgba(217,119,6,0.3);">📋 Ambil dari Rencana Artikel</button>
            </div>
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
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <label class="ai-form-label" style="margin:0;">Strategi Penulisan Konten</label>
              <button type="button" class="ai-btn ai-btn-secondary" id="ai-btn-add-strategy" style="padding:4px 10px; font-size:11px;">+ Tambah Strategi</button>
            </div>

            <!-- Inline Strategy Form Modal (Add / Edit) -->
            <div id="ai-strategy-form-box" class="ai-strategy-form-box" style="display:none; margin-bottom:10px; padding:12px; background:var(--ai-bg-card); border:1px solid var(--ai-border); border-radius:8px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span id="ai-strategy-form-title" style="font-size:11px; font-weight:700; color:var(--ai-text-primary);">Tambah Strategi Kustom Baru</span>
                <button type="button" id="ai-btn-close-strat-form" class="ai-studio-icon-btn" style="width:20px; height:20px; font-size:10px;">✕</button>
              </div>

              <input type="hidden" id="ai-strat-edit-id" value="" />

              <div style="margin-bottom:8px;">
                <label style="font-size:10px; color:var(--ai-text-muted); display:block; margin-bottom:4px;">Nama / Judul Strategi:</label>
                <input type="text" id="ai-strat-title-input" class="ai-input" placeholder="e.g. B2B Enterprise Conversion Blueprint" style="font-size:11px; padding:6px 8px;" />
              </div>

              <div style="margin-bottom:8px;">
                <label style="font-size:10px; color:var(--ai-text-muted); display:block; margin-bottom:4px;">Deskripsi Singkat:</label>
                <input type="text" id="ai-strat-desc-input" class="ai-input" placeholder="e.g. Fokus pada customer pain points, ROI, dan perbandingan solusi langsung" style="font-size:11px; padding:6px 8px;" />
              </div>

              <div style="margin-bottom:10px;">
                <label style="font-size:10px; color:var(--ai-text-muted); display:block; margin-bottom:4px;">Instruksi Prompt AI (Persona & Panduan Penulisan):</label>
                <textarea id="ai-strat-instructions-input" class="ai-input" rows="3" placeholder="Berikan instruksi spesifik kepada AI tentang gaya bahasa, format paragraf, pembuktian fakta, dan CTA..." style="font-size:11px; padding:6px 8px; font-family:var(--ai-font-sans);"></textarea>
              </div>

              <div style="display:flex; justify-content:flex-end; gap:6px;">
                <button type="button" class="ai-btn ai-btn-secondary" id="ai-btn-cancel-strat" style="padding:4px 10px; font-size:11px;">Batal</button>
                <button type="button" class="ai-btn ai-btn-primary" id="ai-btn-save-strat" style="padding:4px 12px; font-size:11px;">Simpan Strategi</button>
              </div>
            </div>

            <div class="ai-card-grid-1" id="ai-strategy-cards"></div>
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
            <label class="ai-form-label">Upload Gambar / Diagram (Multi-Upload & Kompresi WebP Otomatis)</label>
            <div class="ai-upload-dropzone" id="ai-upload-dropzone" tabindex="0" role="button" aria-label="Pilih gambar untuk diunggah">
              <div class="ai-upload-icon">🖼️</div>
              <div class="ai-upload-text">Tarik & letakkan satu atau banyak gambar di sini, atau klik untuk memilih</div>
              <div class="ai-upload-subtext">Mendukung banyak gambar sekaligus (PNG, JPG, WebP, SVG). Dilengkapi kompresi cerdas WebP agar load speed tetap kencang.</div>
            </div>
            <input type="file" id="ai-file-input" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/*" multiple style="display:none;" />
            <div id="ai-image-preview-container"></div>
          </div>
          <!-- Internal Links Hub -->
          <div class="ai-form-group">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <label class="ai-form-label" style="margin:0;">Internal Links Hub</label>
              <button type="button" class="ai-btn ai-btn-secondary" id="ai-btn-add-link" style="padding:4px 10px; font-size:11px;">+ Tambah Link</button>
            </div>
            <div class="ai-form-hint">Internal link yang terpilih akan disisipkan secara kontekstual ke dalam paragraf artikel. Anda dapat mengedit anchor text-nya secara langsung.</div>

            <!-- Dedicated Add Link Form Card (Inline, No prompt blocking) -->
            <div id="ai-add-link-box" class="ai-add-link-box" style="display:none; margin:10px 0; padding:12px; background:var(--ai-bg-card); border:1px solid var(--ai-border); border-radius:8px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span style="font-size:11px; font-weight:700; color:var(--ai-text-primary);">Tambah Internal Link Baru</span>
                <button type="button" id="ai-btn-close-add-link" class="ai-studio-icon-btn" title="Tutup" style="width:20px; height:20px; font-size:10px;">✕</button>
              </div>

              <!-- Quick catalog dropdown -->
              <div style="margin-bottom:8px;">
                <label style="font-size:10px; color:var(--ai-text-muted); display:block; margin-bottom:4px;">Pilih Cepat dari Halaman / Artikel Website:</label>
                <select id="ai-link-preset-select" class="ai-select" style="font-size:11px; padding:6px 8px; width:100%;">
                  <option value="">-- Pilih Halaman atau Artikel Tersedia --</option>
                </select>
              </div>

              <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px;">
                <div>
                  <label style="font-size:10px; color:var(--ai-text-muted); display:block; margin-bottom:4px;">URL Tujuan:</label>
                  <input type="text" id="ai-manual-link-url" class="ai-input" placeholder="/services/seo/ atau /articles/..." style="font-size:11px; padding:6px 8px;" />
                </div>
                <div>
                  <label style="font-size:10px; color:var(--ai-text-muted); display:block; margin-bottom:4px;">Anchor Text (Teks Tautan):</label>
                  <input type="text" id="ai-manual-link-anchor" class="ai-input" placeholder="e.g. Layanan SEO Profesional" style="font-size:11px; padding:6px 8px;" />
                </div>
              </div>

              <div style="display:flex; justify-content:flex-end; gap:6px;">
                <button type="button" class="ai-btn ai-btn-secondary" id="ai-btn-cancel-link" style="padding:4px 10px; font-size:11px;">Batal</button>
                <button type="button" class="ai-btn ai-btn-primary" id="ai-btn-confirm-link" style="padding:4px 12px; font-size:11px;">+ Tambahkan Link</button>
              </div>
            </div>

            <div class="ai-links-table-wrap" id="ai-links-table-wrap">
              <div style="padding:16px; text-align:center; color:var(--ai-text-muted); font-size:12px;">Memuat katalog artikel website...</div>
            </div>
          </div>

          <!-- Citations & References Feature Toggle -->
          <div class="ai-form-group">
            <label class="ai-form-label">Sitasi Akademik & Referensi Industri</label>
            <label class="ai-citation-toggle-box" style="display:flex; align-items:flex-start; gap:12px; background:var(--ai-bg-card); border:1px solid var(--ai-border); border-radius:10px; padding:12px 14px; cursor:pointer;">
              <input type="checkbox" id="ai-citations-toggle" checked style="margin-top:3px; accent-color:var(--ai-primary); width:16px; height:16px;" />
              <div>
                <div style="font-size:13px; font-weight:600; color:var(--ai-text-primary);">Sertakan Sitasi & Referensi Terpercaya (Citations)</div>
                <div style="font-size:11px; color:var(--ai-text-muted); margin-top:3px; line-height:1.4;">
                  Sertakan rujukan otoritatif terverifikasi (Google Search Central, IEEE, W3C, Gartner, arXiv) dengan kutipan inline [^1] serta daftar referensi di akhir artikel untuk mendongkrak kredibilitas E-E-A-T dan kutipan AI Overviews.
                </div>
              </div>
            </label>
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
            <button type="button" class="ai-btn ai-btn-secondary" id="ai-btn-regen-outline" style="padding:4px 10px; font-size:11px;">🔄 Buat Ulang Outline</button>
          </div>

          <!-- Active Loader for Outline Generation -->
          <div class="ai-progress-card" id="ai-outline-loading-card" style="display:none; margin:16px 0;">
            <div class="ai-spinner"></div>
            <div class="ai-progress-title" id="ai-outline-loading-title">Sedang Merancang Outline Artikel...</div>
            <div class="ai-progress-desc" id="ai-outline-loading-desc">Menganalisis topik, hierarki H1/H2/H3, alokasi kata, dan penempatan komponen...</div>
          </div>

          <!-- Rich Outline Overview Card (Title 50-60 chars, Meta Desc, Slug, Tags, H1) -->
          <div id="ai-outline-overview-card" style="display:none; background:var(--ai-bg-card); border:1px solid var(--ai-border); border-radius:10px; padding:16px; margin-bottom:16px;">
            <div style="font-size:12px; font-weight:700; color:var(--ai-primary); margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">
              <span>📋 Metadata & Spesifikasi Outline</span>
              <span id="ai-outline-status-badge" class="ai-badge ai-badge-success">Outline Terstruktur</span>
            </div>
            
            <div style="margin-bottom:10px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <label style="font-size:11px; font-weight:600; color:var(--ai-text-secondary); margin:0;">Target Title (50-60 karakter + Keyword):</label>
                <span id="ai-outline-title-len" style="font-size:10px; color:var(--ai-text-muted);">0 / 60 chars</span>
              </div>
              <input type="text" id="ai-outline-title-input" class="ai-input" style="font-size:12px; font-weight:600;" placeholder="Judul artikel teroptimasi SEO..." />
            </div>

            <div style="margin-bottom:10px;">
              <label style="font-size:11px; font-weight:600; color:var(--ai-text-secondary); display:block; margin-bottom:4px;">Article H1 Headline:</label>
              <input type="text" id="ai-outline-h1-input" class="ai-input" style="font-size:12px;" placeholder="H1 utama artikel..." />
            </div>

            <div style="margin-bottom:10px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <label style="font-size:11px; font-weight:600; color:var(--ai-text-secondary); margin:0;">Meta Description (140-160 karakter):</label>
                <span id="ai-outline-desc-len" style="font-size:10px; color:var(--ai-text-muted);">0 / 160 chars</span>
              </div>
              <textarea id="ai-outline-desc-input" class="ai-textarea" rows="2" style="font-size:11px;" placeholder="Deskripsi meta padat dan menggugah CTR..."></textarea>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:4px;">
              <div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                  <label style="font-size:11px; font-weight:600; color:var(--ai-text-secondary); margin:0;">URL Slug (Maks. 60 chars):</label>
                  <span id="ai-outline-slug-len" style="font-size:10px; color:var(--ai-text-muted);">0 / 60</span>
                </div>
                <input type="text" id="ai-outline-slug-input" class="ai-input" style="font-size:11px; font-family:var(--ai-font-mono);" placeholder="slug-url-artikel" />
              </div>
              <div>
                <label style="font-size:11px; font-weight:600; color:var(--ai-text-secondary); display:block; margin-bottom:4px;">Tags (Dipisahkan koma):</label>
                <input type="text" id="ai-outline-tags-input" class="ai-input" style="font-size:11px;" placeholder="GEO, Technical SEO, AI Search..." />
              </div>
            </div>
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
          <!-- Injection Active Loader Card -->
          <div class="ai-progress-card" id="ai-inject-loading-card" style="display:none; margin:16px 0; border-color:var(--ai-primary); background:rgba(217, 119, 6, 0.05);">
            <div class="ai-spinner"></div>
            <div class="ai-progress-title" id="ai-inject-loading-title">Sedang Menerapkan ke Decap CMS...</div>
            <div class="ai-progress-desc" id="ai-inject-loading-desc">Menyinkronkan judul, slug, meta description, quick answer, tags, dan expandable Q&A...</div>
          </div>

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
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <label class="ai-form-label" style="margin:0;">Frequently Asked Questions / Expandable Q&A (<span id="ai-faq-count">0</span> items)</label>
              <button type="button" class="ai-btn ai-btn-secondary" id="ai-btn-add-faq-item" style="padding:2px 8px; font-size:11px;">+ Tambah FAQ</button>
            </div>
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
            <button type="button" class="ai-btn ai-btn-secondary" id="ai-btn-config-back" style="padding:4px 10px; font-size:11px;">Kembali</button>
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
            <button type="button" class="ai-btn ai-btn-primary" id="ai-btn-save-config" style="flex:1;">Simpan Pengaturan</button>
            <button type="button" class="ai-btn ai-btn-secondary" id="ai-btn-test-config">Uji Koneksi</button>
          </div>
        </div>

      </div>

      <!-- Drawer Footer Action Bar -->
      <div class="ai-studio-footer" id="ai-studio-footer">
        <button type="button" class="ai-btn ai-btn-secondary" id="ai-btn-prev">Kembali</button>
        <div style="display:flex; gap:10px;">
          <button type="button" class="ai-btn ai-btn-secondary" id="ai-btn-copy-mdx" style="display:none;">📋 Salin MDX</button>
          <button type="button" class="ai-btn ai-btn-primary" id="ai-btn-next">Lanjut ke Media & Link ➔</button>
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
    // Sync chips from state (state may have been filled before the drawer DOM existed)
    renderChips();
    loadCustomStrategies().then(() => renderStrategyCards());
    updateActiveModelBadge();
    loadSiteCatalog().then(() => {
      autoSuggestInternalLinks();
      renderInternalLinksTable();
    });
  }

  /**
   * Open the studio and pre-fill Topic + Focus Keyphrases (used by Article Planner).
   * The drawer is rendered first so the inputs/chips exist in the DOM before populating.
   */
  function prefillStudio({ topic = '', focusKeyphrases = [] } = {}) {
    openStudioDrawer();

    const kps = (Array.isArray(focusKeyphrases) ? focusKeyphrases : String(focusKeyphrases || '').split(','))
      .map((k) => String(k).trim())
      .filter(Boolean);

    state.topic = topic || '';
    state.primaryKeyword = kps[0] || '';
    state.focusKeyphrases = [];

    const topicInput = document.getElementById('ai-topic-input');
    if (topicInput) {
      topicInput.value = state.topic;
      topicInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    const chipInput = document.getElementById('ai-chip-input');
    if (chipInput) chipInput.value = '';

    if (kps.length > 0) addFocusKeyphrases(kps.join(', '));
    renderChips();

    if (!state.isGenerating && state.currentStep !== 1) switchStep(1);
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
    document.getElementById('ai-btn-pick-plan')?.addEventListener('click', () => {
      if (window.ArticlePlanner && typeof window.ArticlePlanner.open === 'function') {
        window.ArticlePlanner.open();
      }
    });
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

    // Focus Keyphrase Chip Input (Supports Enter, Comma, Paste, Input & Blur)
    const chipInput = document.getElementById('ai-chip-input');
    if (chipInput) {
      chipInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault();
          const val = chipInput.value;
          chipInput.value = '';
          addFocusKeyphrases(val);
        }
      });

      chipInput.addEventListener('paste', (e) => {
        e.preventDefault();
        const pastedText = (e.clipboardData || window['clipboardData'])?.getData('text') || '';
        if (pastedText) {
          addFocusKeyphrases(pastedText);
          chipInput.value = '';
        }
      });

      chipInput.addEventListener('input', () => {
        if (chipInput.value.includes(',') || chipInput.value.includes(';') || chipInput.value.includes('\n')) {
          const val = chipInput.value;
          chipInput.value = '';
          addFocusKeyphrases(val);
        }
      });

      chipInput.addEventListener('blur', () => {
        if (chipInput.value.trim()) {
          const val = chipInput.value;
          chipInput.value = '';
          addFocusKeyphrases(val);
        }
      });
    }


    // Strategy Add / Edit / Cancel Event Wiring
    document.getElementById('ai-btn-add-strategy')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openStrategyForm(null);
    });

    document.getElementById('ai-btn-close-strat-form')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeStrategyForm();
    });

    document.getElementById('ai-btn-cancel-strat')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeStrategyForm();
    });

    document.getElementById('ai-btn-save-strat')?.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const editId = document.getElementById('ai-strat-edit-id')?.value.trim();
      const title = document.getElementById('ai-strat-title-input')?.value.trim();
      const desc = document.getElementById('ai-strat-desc-input')?.value.trim();
      const instructions = document.getElementById('ai-strat-instructions-input')?.value.trim();

      try {
        if (editId) {
          await updateCustomStrategy(editId, { title, desc, instructions });
          showStudioToast(`✓ Strategi "${title}" berhasil diperbarui di disk!`, true);
        } else {
          const created = await createCustomStrategy({ title, desc, instructions });
          state.strategy = created.id;
          localStorage.setItem(STORAGE_KEYS.STRATEGY, state.strategy);
          renderStrategyCards();
          showStudioToast(`✓ Strategi baru "${title}" berhasil disimpan ke disk & dipilih!`, true);
        }
        closeStrategyForm();
      } catch (err) {
        showStudioToast(`✕ ${err.message}`, false);
      }
    });

    renderStrategyCards();

    // Strategy Selection Fallback
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

    // File Upload Drag & Drop (Supports Multiple Files & Folders)
    const dropzone = document.getElementById('ai-upload-dropzone');
    const fileInput = document.getElementById('ai-file-input');

    dropzone?.addEventListener('click', (e) => {
      e.preventDefault();
      fileInput?.click();
    });

    dropzone?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput?.click();
      }
    });

    dropzone?.addEventListener('dragenter', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('is-dragover');
    });

    dropzone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('is-dragover');
    });

    dropzone?.addEventListener('dragleave', () => {
      dropzone.classList.remove('is-dragover');
    });

    dropzone?.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('is-dragover');
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        handleUploadedImages(e.dataTransfer.files);
      }
    });

    fileInput?.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    fileInput?.addEventListener('change', (e) => {
      if (e.target?.files && e.target.files.length > 0) {
        handleUploadedImages(e.target.files);
      }
      try {
        e.target.value = '';
      } catch (_) {}
    });
    // Add Manual Internal Link - Clean Inline UI
    const addLinkBtn = document.getElementById('ai-btn-add-link');
    const addLinkBox = document.getElementById('ai-add-link-box');
    const closeAddLinkBtn = document.getElementById('ai-btn-close-add-link');
    const cancelAddLinkBtn = document.getElementById('ai-btn-cancel-link');
    const confirmAddLinkBtn = document.getElementById('ai-btn-confirm-link');
    const presetSelect = document.getElementById('ai-link-preset-select');
    const manualUrlInput = document.getElementById('ai-manual-link-url');
    const manualAnchorInput = document.getElementById('ai-manual-link-anchor');

    function populateLinkCatalogDropdown() {
      if (!presetSelect) return;
      presetSelect.innerHTML = '<option value="">-- Pilih Halaman atau Artikel Tersedia --</option>';

      // Standard core pages
      const corePages = [
        { title: 'Beranda (Homepage)', url: '/' },
        { title: 'Layanan Technical SEO', url: '/services/seo/' },
        { title: 'Alur Kerja SEO (Workflow)', url: '/services/seo/workflow/' },
        { title: 'Generative Engine Optimization (GEO)', url: '/services/geo/' },
        { title: 'Google Ads & Tracking', url: '/services/google-ads/' },
        { title: 'Studi Kasus / Portfolio (Work)', url: '/work/' },
        { title: 'Tentang Saya (About)', url: '/about/' },
        { title: 'Kontak / Konsultasi', url: '/contact/' },
      ];

      const optGroupCore = document.createElement('optgroup');
      optGroupCore.label = 'Halaman Utama & Layanan';
      corePages.forEach((p) => {
        const opt = document.createElement('option');
        opt.value = p.url;
        opt.textContent = `${p.title} (${p.url})`;
        opt.dataset.title = p.title;
        optGroupCore.appendChild(opt);
      });
      presetSelect.appendChild(optGroupCore);

      // Articles catalog from API
      if (state.siteCatalog && state.siteCatalog.length > 0) {
        const optGroupArticles = document.createElement('optgroup');
        optGroupArticles.label = 'Koleksi Artikel & Panduan';
        state.siteCatalog.forEach((art) => {
          const opt = document.createElement('option');
          opt.value = art.url;
          opt.textContent = `${art.title} (${art.url})`;
          opt.dataset.title = art.title;
          optGroupArticles.appendChild(opt);
        });
        presetSelect.appendChild(optGroupArticles);
      }
    }

    addLinkBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!addLinkBox) return;
      const isOpen = addLinkBox.style.display !== 'none';
      if (isOpen) {
        addLinkBox.style.display = 'none';
      } else {
        populateLinkCatalogDropdown();
        addLinkBox.style.display = 'block';
        manualUrlInput?.focus();
      }
    });

    closeAddLinkBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (addLinkBox) addLinkBox.style.display = 'none';
    });

    cancelAddLinkBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (addLinkBox) addLinkBox.style.display = 'none';
    });

    presetSelect?.addEventListener('change', (e) => {
      const selectedUrl = e.target.value;
      if (!selectedUrl) return;
      const selectedOption = e.target.options[e.target.selectedIndex];
      const pageTitle = selectedOption?.dataset?.title || '';

      if (manualUrlInput) manualUrlInput.value = selectedUrl;
      if (manualAnchorInput) {
        manualAnchorInput.value = pageTitle.split(':')[0].trim();
      }
    });

    confirmAddLinkBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      let url = manualUrlInput?.value.trim() || '';
      let anchor = manualAnchorInput?.value.trim() || '';

      if (!url) {
        showStudioToast('Harap masukkan URL internal (misal: /services/seo/).', false);
        manualUrlInput?.focus();
        return;
      }

      // Normalize URL
      if (!url.startsWith('/') && !url.startsWith('http://') && !url.startsWith('https://')) {
        url = '/' + url;
      }
      if (!url.endsWith('/') && !url.includes('#') && !url.includes('?') && !url.includes('.')) {
        url = url + '/';
      }

      if (!anchor) {
        anchor = url;
      }

      addManualInternalLink(url, anchor, anchor);
      showStudioToast(`✓ Internal link berhasil ditambahkan: ${anchor}`, true);

      // Reset and close form
      if (manualUrlInput) manualUrlInput.value = '';
      if (manualAnchorInput) manualAnchorInput.value = '';
      if (presetSelect) presetSelect.value = '';
      if (addLinkBox) addLinkBox.style.display = 'none';
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
        // One-Click Inject with Debounce & Loading State
        const nextBtn = document.getElementById('ai-btn-next');
        if (nextBtn?.disabled) return;
        if (nextBtn) {
          nextBtn.disabled = true;
          nextBtn.textContent = 'Sedang Menerapkan...';
        }
        try {
          await injectIntoDecapForm();
        } finally {
          if (nextBtn) {
            nextBtn.disabled = false;
            nextBtn.textContent = '🎯 Terapkan ke Editor Decap';
          }
        }
      }
    });

    // Citations Feature Toggle
    document.getElementById('ai-citations-toggle')?.addEventListener('change', (e) => {
      state.includeCitations = e.target.checked;
    });

    // Regenerate Outline
    document.getElementById('ai-btn-regen-outline')?.addEventListener('click', async () => {
      await startPipelineStage1And2();
    });
  }

  // =========================================================================
  // 9. Image Compression Engine, Multi-Upload & Persistence
  // =========================================================================

  function formatFileSize(bytes) {
    if (!bytes || bytes <= 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  /**
   * Client-side high efficiency image compressor.
   * Scales down images larger than maxDimension (1600px) and converts to WebP with 0.82 quality.
   * Keeps SVG untouched as vector code.
   */
  async function compressImage(file, maxDimension = 1600, quality = 0.82) {
    if (!file) return null;
    const isSvg = file.type === 'image/svg+xml' || (file.name && file.name.toLowerCase().endsWith('.svg'));

    // SVG preservation (vector)
    if (isSvg) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            base64: e.target.result,
            mimeType: 'image/svg+xml',
            format: 'svg',
            originalSize: file.size || 0,
            compressedSize: file.size || 0,
            savingsPercent: 0,
            width: null,
            height: null,
          });
        };
        reader.onerror = () => {
          resolve({
            base64: '',
            mimeType: 'image/svg+xml',
            format: 'svg',
            originalSize: file.size || 0,
            compressedSize: file.size || 0,
            savingsPercent: 0,
            width: null,
            height: null,
          });
        };
        reader.readAsDataURL(file);
      });
    }

    return new Promise((resolve) => {
      let isDone = false;
      let safetyTimeout = null;

      const finish = (result) => {
        if (!isDone) {
          isDone = true;
          if (safetyTimeout) clearTimeout(safetyTimeout);
          resolve(result);
        }
      };

      const fileExt = (file.name && file.name.split('.').pop()?.toLowerCase()) || 'jpg';
      const fallbackMime = (file.type && file.type.startsWith('image/')) ? file.type : 'image/jpeg';

      const reader = new FileReader();

      reader.onload = (e) => {
        const dataUrl = e.target.result;
        if (typeof Image === 'undefined' || typeof document === 'undefined') {
          return finish({
            base64: dataUrl,
            mimeType: fallbackMime,
            format: fileExt,
            originalSize: file.size || 0,
            compressedSize: file.size || 0,
            savingsPercent: 0,
            width: null,
            height: null,
          });
        }

        // Fallback timeout for environments like Happy-DOM / test runners where Image decode doesn't fire
        safetyTimeout = setTimeout(() => {
          finish({
            base64: dataUrl,
            mimeType: fallbackMime,
            format: fileExt,
            originalSize: file.size || 0,
            compressedSize: file.size || 0,
            savingsPercent: 0,
            width: null,
            height: null,
          });
        }, 2500);

        const img = new Image();
        img.onload = () => {
          try {
            let width = img.naturalWidth || img.width;
            let height = img.naturalHeight || img.height;
            const origWidth = width;
            const origHeight = height;

            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              } else {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              return finish({
                base64: dataUrl,
                mimeType: fallbackMime,
                format: fileExt,
                originalSize: file.size || 0,
                compressedSize: file.size || 0,
                savingsPercent: 0,
                width: origWidth,
                height: origHeight,
              });
            }

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);

            let outputMime = 'image/webp';
            let outputExt = 'webp';
            let compressedData = canvas.toDataURL(outputMime, quality);

            if (!compressedData.startsWith('data:image/webp')) {
              outputMime = 'image/jpeg';
              outputExt = 'jpg';
              compressedData = canvas.toDataURL(outputMime, quality);
            }

            const rawB64 = compressedData.split(',')[1] || '';
            const compressedBytes = Math.round((rawB64.length * 3) / 4);

            if (compressedBytes >= (file.size || 0) && (file.size || 0) < 250 * 1024) {
              return finish({
                base64: dataUrl,
                mimeType: fallbackMime,
                format: fileExt,
                originalSize: file.size || 0,
                compressedSize: file.size || 0,
                savingsPercent: 0,
                width: origWidth,
                height: origHeight,
              });
            }

            const origSize = file.size || compressedBytes;
            const savings = origSize > compressedBytes ? Math.round(((origSize - compressedBytes) / origSize) * 100) : 0;

            finish({
              base64: compressedData,
              mimeType: outputMime,
              format: outputExt,
              originalSize: origSize,
              compressedSize: compressedBytes,
              savingsPercent: savings,
              width,
              height,
            });
          } catch (canvasErr) {
            finish({
              base64: dataUrl,
              mimeType: fallbackMime,
              format: fileExt,
              originalSize: file.size || 0,
              compressedSize: file.size || 0,
              savingsPercent: 0,
              width: null,
              height: null,
            });
          }
        };

        img.onerror = () => {
          finish({
            base64: dataUrl,
            mimeType: fallbackMime,
            format: fileExt,
            originalSize: file.size || 0,
            compressedSize: file.size || 0,
            savingsPercent: 0,
            width: null,
            height: null,
          });
        };

        img.src = dataUrl;
      };

      reader.onerror = () => {
        finish(null);
      };

      reader.readAsDataURL(file);
    });
  }

  function syncCoverImage() {
    if (!state.uploadedImages || state.uploadedImages.length === 0) {
      state.uploadedImage = null;
      state.visionAnalysis = null;
      return;
    }
    let cover = state.uploadedImages.find((img) => img.isCover);
    if (!cover) {
      state.uploadedImages[0].isCover = true;
      cover = state.uploadedImages[0];
    }
    state.uploadedImage = cover;
    state.visionAnalysis = cover.visionAnalysis || null;
  }

  /**
   * Persist an image item simultaneously through:
   * 1. Cross-frame blob cache (instant preview without 404 in Decap CMS)
   * 2. Astro / Vite dev server endpoint (/api/dev-upload) directly to public/images/uploads/
   * 3. Decap CMS proxy server (http://localhost:8081/api/v1) for media library sync
   */
  async function persistImageFile(imageItem) {
    if (!imageItem) return false;
    const cleanName = imageItem.cleanName || (imageItem.name || 'image.webp');
    const url = imageItem.url || `/images/uploads/${cleanName}`;
    const rawBase64 = (imageItem.base64 || '').includes(',')
      ? imageItem.base64.split(',')[1]
      : (imageItem.base64 || '');

    // 1. Cross-frame Blob URL registration (immediate zero-404 in Decap CMS editor & preview)
    try {
      let blobUrl = null;
      if (imageItem.file instanceof Blob) {
        blobUrl = URL.createObjectURL(imageItem.file);
      } else if (imageItem.base64 && imageItem.base64.startsWith('data:')) {
        blobUrl = imageItem.base64;
      }
      if (blobUrl) {
        const wins = [window, window.parent, window.top].filter(Boolean);
        const keys = [
          cleanName,
          imageItem.name,
          url,
          `/images/uploads/${cleanName}`,
          `images/uploads/${cleanName}`,
          `/${cleanName}`,
        ].filter(Boolean);

        for (const w of wins) {
          try {
            w.__decap_blob_urls = w.__decap_blob_urls || {};
            for (const k of keys) {
              w.__decap_blob_urls[k] = blobUrl;
            }
          } catch (_) {}
        }
      }
    } catch (e) {
      console.warn('[AI Studio] Blob registration warning:', e);
    }

    if (!rawBase64) {
      console.warn('[AI Studio] Cannot persist image without base64:', cleanName);
      return false;
    }

    let persisted = false;

    // 2. Direct server disk persistence (/api/dev-upload & /api/upload-media)
    // Handled by Astro dev server middleware locally, and by dev-upload.php on shared hosting
    const endpoints = ['/api/dev-upload', '/api/upload-media'];
    for (const ep of endpoints) {
      try {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timeoutId = controller ? setTimeout(() => controller.abort(), 6000) : null;
        const res = await fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: cleanName, content: rawBase64 }),
          signal: controller ? controller.signal : undefined,
        });
        if (timeoutId) clearTimeout(timeoutId);
        if (res.ok) {
          persisted = true;
          console.log('[AI Studio] Saved image to disk via /api/dev-upload:', cleanName);
          break;
        } else {
          console.warn(`[AI Studio] ${ep} responded with status:`, res.status);
        }
      } catch (err) {
        // Continue to fallback
      }
    }

    // 3. Direct GitHub Repository Persistence via GitHub Contents API
    // When logged into Decap CMS with GitHub backend, commit file directly to git repo
    try {
      let ghToken = null;
      let ghRepo = 'ramanur28/theramadhani-website';
      let ghBranch = 'main';

      try {
        const store = getDecapReduxStore();
        if (store && typeof store.getState === 'function') {
          const s = store.getState();
          if (s.auth && s.auth.user && s.auth.user.token) {
            ghToken = s.auth.user.token;
          }
          if (s.config && typeof s.config.getIn === 'function') {
            ghRepo = s.config.getIn(['backend', 'repo']) || ghRepo;
            ghBranch = s.config.getIn(['backend', 'branch']) || ghBranch;
          }
        }
      } catch (_) {}

      if (!ghToken) {
        try {
          const rawUser = localStorage.getItem('netlify-cms-user');
          if (rawUser) {
            const parsed = JSON.parse(rawUser);
            if (parsed && parsed.token) ghToken = parsed.token;
          }
        } catch (_) {}
      }

      if (ghToken) {
        const ghPath = `public/images/uploads/${cleanName}`;
        const apiUrl = `https://api.github.com/repos/${ghRepo}/contents/${ghPath}`;

        let existingSha = null;
        try {
          const checkRes = await fetch(`${apiUrl}?ref=${ghBranch}`, {
            headers: {
              Authorization: `Bearer ${ghToken}`,
              Accept: 'application/vnd.github.v3+json',
            },
          });
          if (checkRes.ok) {
            const checkData = await checkRes.json();
            existingSha = checkData.sha;
          }
        } catch (_) {}

        const putRes = await fetch(apiUrl, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${ghToken}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `Upload ${cleanName} via AI Article Studio`,
            content: rawBase64,
            branch: ghBranch,
            ...(existingSha ? { sha: existingSha } : {}),
          }),
        });

        if (putRes.ok) {
          persisted = true;
          console.log('[AI Studio] Committed image directly to GitHub repository:', cleanName);
        } else {
          console.warn('[AI Studio] GitHub API media commit status:', putRes.status);
        }
      }
    } catch (ghErr) {
      console.warn('[AI Studio] GitHub direct media commit notice:', ghErr);
    }

    // 4. Decap CMS proxy server on 8081 if active with timeout
    try {
      const payload = {
        action: 'persistMedia',
        params: {
          branch: 'main',
          asset: {
            path: 'public/images/uploads/' + cleanName,
            content: rawBase64,
            encoding: 'base64',
          },
          options: {
            commitMessage: 'Upload ' + cleanName + ' via AI Studio',
          },
        },
      };
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 2000) : null;
      const decapRes = await fetch('http://localhost:8081/api/v1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller ? controller.signal : undefined,
      });
      if (timeoutId) clearTimeout(timeoutId);
      if (decapRes.ok) {
        persisted = true;
        console.log('[AI Studio] Synced image with decap-server (8081):', cleanName);
      }
    } catch (_) {}

    return persisted;
  }

  async function handleUploadedImages(files) {
    if (!files) return;
    const fileList = Array.isArray(files) ? files : Array.from(files);

    const isImageFile = (f) => {
      if (!f) return false;
      if (f.type && f.type.startsWith('image/')) return true;
      const name = (f.name || '').toLowerCase();
      return /\.(png|jpe?g|webp|svg|gif|avif|bmp|tiff)$/i.test(name);
    };

    const validFiles = fileList.filter(isImageFile);

    if (validFiles.length === 0) {
      showStudioToast('Berkas harus berupa gambar valid (PNG, JPG, WebP, SVG).', false);
      return;
    }

    const dropzone = document.getElementById('ai-upload-dropzone');
    if (dropzone) {
      dropzone.classList.add('is-uploading');
      dropzone.innerHTML = `
        <div class="ai-upload-spinner"></div>
        <div class="ai-upload-text" id="ai-upload-status-title">⚡ Sedang Mengompresi & Menyimpan (1/${validFiles.length})...</div>
        <div class="ai-upload-subtext" id="ai-upload-status-sub">Mengonversi ke format WebP modern dan menyinkronkan ke media website...</div>
      `;
    }

    showStudioToast(`⚡ Mengompresi & mengunggah ${validFiles.length} gambar...`, true);

    let totalSaved = 0;
    let totalOrig = 0;
    let addedCount = 0;

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const statusTitle = document.getElementById('ai-upload-status-title');
      const statusSub = document.getElementById('ai-upload-status-sub');
      if (statusTitle) {
        statusTitle.textContent = `⚡ Mengompresi & Menyimpan (${i + 1}/${validFiles.length}): ${file.name}`;
      }
      if (statusSub) {
        statusSub.textContent = `Mengoptimalkan resolusi dan menulis ke /images/uploads/...`;
      }

      try {
        const compressed = await compressImage(file);
        if (!compressed || !compressed.base64) continue;

        const baseName = (file.name || 'image')
          .toLowerCase()
          .replace(/\.[^/.]+$/, '')
          .replace(/[^a-z0-9]+/g, '-');
        const cleanName = `article-${Date.now()}-${i + 1}-${baseName}.${compressed.format}`;

        const imageItem = {
          id: 'img-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
          file: file,
          name: file.name,
          cleanName: cleanName,
          base64: compressed.base64,
          url: `/images/uploads/${cleanName}`,
          originalSize: compressed.originalSize,
          compressedSize: compressed.compressedSize,
          savingsPercent: compressed.savingsPercent,
          width: compressed.width,
          height: compressed.height,
          format: compressed.format,
          isCover: state.uploadedImages.length === 0,
          visionAnalysis: null,
        };

        // Persist immediately to disk, decap-server, and cross-frame blob cache
        await persistImageFile(imageItem);

        state.uploadedImages.push(imageItem);
        addedCount++;
        totalOrig += compressed.originalSize;
        totalSaved += (compressed.originalSize - compressed.compressedSize);
      } catch (err) {
        console.warn('[AI Studio] Compression error on file:', file.name, err);
      }
    }

    if (dropzone) {
      dropzone.classList.remove('is-uploading');
      dropzone.innerHTML = `
        <div class="ai-upload-icon">🖼️</div>
        <div class="ai-upload-text">Tarik & letakkan satu atau banyak gambar di sini, atau klik untuk memilih</div>
        <div class="ai-upload-subtext">Mendukung banyak gambar sekaligus (PNG, JPG, WebP, SVG). Dilengkapi kompresi cerdas WebP agar load speed tetap kencang.</div>
      `;
    }

    syncCoverImage();
    renderImagePreviews();

    if (addedCount > 0) {
      const overallSavings = totalOrig > 0 ? Math.round((totalSaved / totalOrig) * 100) : 0;
      showStudioToast(
        `✓ Berhasil menambahkan ${addedCount} gambar (Terkompresi WebP, Hemat ${overallSavings}%)!`,
        true
      );
    } else {
      showStudioToast('Gagal memproses gambar. Pastikan format berkas didukung.', false);
    }
  }

  // Single-file backwards compatibility
  async function handleUploadedImage(file) {
    return handleUploadedImages(file ? [file] : []);
  }

  function setCoverImage(id) {
    state.uploadedImages.forEach((img) => {
      img.isCover = img.id === id;
    });
    syncCoverImage();
    renderImagePreviews();
    showStudioToast('⭐ Gambar sampul (Cover Image) berhasil ditetapkan!', true);
  }

  function removeUploadedImage(id) {
    state.uploadedImages = state.uploadedImages.filter((img) => img.id !== id);
    if (state.uploadedImages.length > 0 && !state.uploadedImages.some((img) => img.isCover)) {
      state.uploadedImages[0].isCover = true;
    }
    syncCoverImage();
    renderImagePreviews();
  }

  function clearAllImages() {
    state.uploadedImages = [];
    syncCoverImage();
    renderImagePreviews();
  }

  function renderImagePreviews() {
    const container = document.getElementById('ai-image-preview-container');
    if (!container) return;

    if (!state.uploadedImages || state.uploadedImages.length === 0) {
      container.innerHTML = '';
      return;
    }

    const totalCompressed = state.uploadedImages.reduce((sum, img) => sum + (img.compressedSize || 0), 0);
    const totalOriginal = state.uploadedImages.reduce((sum, img) => sum + (img.originalSize || 0), 0);
    const avgSavings = totalOriginal > 0 ? Math.round(((totalOriginal - totalCompressed) / totalOriginal) * 100) : 0;

    const summaryHtml = `
      <div class="ai-image-summary-bar">
        <div class="ai-image-summary-text">
          <b>📸 ${state.uploadedImages.length} Gambar Diunggah</b> • Total: ${formatFileSize(totalCompressed)}
          ${avgSavings > 0 ? `<span class="ai-badge ai-badge-compressed" title="Ukuran asli: ${formatFileSize(totalOriginal)}">⚡ Hemat ${avgSavings}%</span>` : ''}
        </div>
        <div style="display:flex; gap:6px;">
          <button type="button" class="ai-btn ai-btn-secondary" id="ai-btn-add-more-img" style="padding:4px 8px; font-size:11px;">+ Tambah</button>
          <button type="button" class="ai-btn ai-btn-secondary" id="ai-btn-clear-all-img" style="padding:4px 8px; font-size:11px; color:var(--ai-error);">🗑️ Hapus Semua</button>
        </div>
      </div>
    `;

    const cardsHtml = state.uploadedImages
      .map(
        (img) => `
        <div class="ai-image-preview-card ${img.isCover ? 'is-cover-card' : ''}" data-img-id="${img.id}">
          <img src="${img.base64}" class="ai-image-preview-thumb" alt="Preview" />
          <div class="ai-image-preview-info">
            <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-bottom:4px;">
              <span class="ai-image-preview-name">${escapeHtmlAttr(img.name)}</span>
              ${
                img.isCover
                  ? '<span class="ai-badge ai-badge-cover" title="Gambar ini akan digunakan sebagai Cover Image di Decap CMS">⭐ Cover Utama</span>'
                  : `<button type="button" class="ai-btn-set-cover" data-set-cover="${img.id}" title="Jadikan gambar ini sebagai sampul">Jadikan Cover</button>`
              }
            </div>
            <div class="ai-image-preview-meta">
              ${img.width ? `<span>${img.width}×${img.height} • </span>` : ''}
              <span style="text-transform:uppercase;">${img.format || 'WEBP'}</span>
              ${img.savingsPercent > 0 ? `<span class="ai-badge ai-badge-compressed" style="margin-left:6px;">⚡ ${formatFileSize(img.originalSize)} → ${formatFileSize(img.compressedSize)} (-${img.savingsPercent}%)</span>` : ''}
            </div>
            <div class="ai-image-preview-url">${escapeHtmlAttr(img.url)}</div>
          </div>
          <button type="button" class="ai-studio-icon-btn ai-btn-del-img" data-del-img="${img.id}" title="Hapus Gambar" style="color:var(--ai-error);">✕</button>
        </div>
      `
      )
      .join('');

    container.innerHTML = summaryHtml + `<div class="ai-image-preview-list">${cardsHtml}</div>`;

    document.getElementById('ai-btn-add-more-img')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      document.getElementById('ai-file-input')?.click();
    });

    document.getElementById('ai-btn-clear-all-img')?.addEventListener('click', () => {
      clearAllImages();
    });

    container.querySelectorAll('.ai-btn-set-cover').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-set-cover');
        if (id) setCoverImage(id);
      });
    });

    container.querySelectorAll('.ai-btn-del-img').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-del-img');
        if (id) removeUploadedImage(id);
      });
    });
  }

  // Backwards compatibility alias for renderImagePreview
  function renderImagePreview() {
    renderImagePreviews();
  }
  // =========================================================================
  // 10. Chips & Internal Links Table Rendering
  // =========================================================================
  function addFocusKeyphrases(rawInput) {
    if (!rawInput) return 0;
    const parts = String(rawInput)
      .split(/[,;\n\r]+/)
      .map((p) => p.trim().replace(/^['"]+|['"]+$/g, '').trim())
      .filter(Boolean);

    let addedCount = 0;
    parts.forEach((phrase) => {
      if (phrase && !state.focusKeyphrases.includes(phrase)) {
        state.focusKeyphrases.push(phrase);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      renderChips();
      autoSuggestInternalLinks();
      renderInternalLinksTable();
    }
    return addedCount;
  }

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

  
  function escapeHtmlAttr(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
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
        <input type="text" class="ai-input ai-link-anchor" value="${escapeHtmlAttr(link.anchor)}" title="Edit Anchor Text" style="padding:4px 8px; font-size:11px;" />
        <span class="ai-link-url" title="${escapeHtmlAttr(link.url)}">${escapeHtmlAttr(link.url)}</span>
        <button type="button" class="ai-studio-icon-btn" data-del-link="${idx}" title="Hapus" style="width:24px; height:24px; font-size:11px; color:var(--ai-error);">✕</button>
      `;

      row.querySelector('.ai-link-anchor')?.addEventListener('input', (e) => {
        state.selectedLinks[idx].anchor = e.target.value;
      });

      row.querySelector('[data-del-link]')?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        state.selectedLinks.splice(idx, 1);
        renderInternalLinksTable();
      });

      container.appendChild(row);
    });
  }

  // Helper Loaders for Outline Generation & Injection
  function setOutlineLoading(isLoading, title, desc) {
    const card = document.getElementById('ai-outline-loading-card');
    const t = document.getElementById('ai-outline-loading-title');
    const d = document.getElementById('ai-outline-loading-desc');
    const list = document.getElementById('ai-outline-list');
    const overview = document.getElementById('ai-outline-overview-card');

    if (card) card.style.display = isLoading ? 'block' : 'none';
    if (t && title) t.textContent = title;
    if (d && desc) d.textContent = desc;

    if (isLoading) {
      if (list) list.style.display = 'none';
      if (overview) overview.style.display = 'none';
    } else {
      if (list) list.style.display = 'flex';
      if (overview && state.outline && state.outline.length > 0) overview.style.display = 'block';
    }
  }

  function setInjectLoading(isLoading, title, desc) {
    const card = document.getElementById('ai-inject-loading-card');
    const t = document.getElementById('ai-inject-loading-title');
    const d = document.getElementById('ai-inject-loading-desc');
    const nextBtn = document.getElementById('ai-btn-next');

    if (card) card.style.display = isLoading ? 'block' : 'none';
    if (t && title) t.textContent = title;
    if (d && desc) d.textContent = desc;

    if (nextBtn && state.currentStep === 5) {
      nextBtn.disabled = isLoading;
      if (isLoading) {
        nextBtn.innerHTML = '<span class="ai-spinner" style="width:14px; height:14px; margin:0; display:inline-block; vertical-align:middle; border-width:2px;"></span> Sedang Menerapkan...';
      } else {
        nextBtn.innerHTML = '🎯 Terapkan ke Editor Decap';
      }
    }
  }

  // =========================================================================
  // 11. Pipeline Orchestrator (Stages Execution)
  // =========================================================================
  async function startPipelineStage1And2() {
    try {
      state.isGenerating = true;
      const isEn = state.language === 'en';
      setOutlineLoading(
        true,
        isEn ? 'Analyzing & Structuring Rich Outline...' : 'Sedang Merancang Outline Terstruktur...',
        isEn ? 'Establishing H1/H2/H3 hierarchy, word count allocation, and component placements...' : 'Menetapkan hierarki H1/H2/H3, alokasi kata, serta penempatan Tabel, Kutipan & 3 CTA...'
      );
      const nextBtn = document.getElementById('ai-btn-next');
      if (nextBtn) nextBtn.disabled = true;

      if (state.uploadedImage) {
        showStudioToast(isEn ? 'Analyzing image with Multimodal Vision AI...' : 'Memulai analisa Vision AI untuk gambar...', true);
        setOutlineLoading(true, isEn ? 'Analyzing Technical Diagram...' : 'Menganalisis Diagram Teknis...', isEn ? 'Extracting architectural entities and data points...' : 'Mengekstrak entitas diagram dan alur arsitektur...');
        await runStage1ImageAnalysis();
        const vCard = document.getElementById('ai-vision-insights-card');
        const vText = document.getElementById('ai-vision-insights-text');
        if (vCard && vText && state.visionAnalysis) {
          vCard.style.display = 'block';
          vText.innerHTML = `<b>Alt Text:</b> ${state.visionAnalysis.alt}<br/><b>Caption:</b> ${state.visionAnalysis.caption}<br/><b>Insight:</b> ${state.visionAnalysis.visualInsights}`;
        }
      }

      showStudioToast(isEn ? 'Structuring outline & component placements...' : 'Menghasilkan outline terstruktur & penempatan komponen...', true);
      setOutlineLoading(true, isEn ? 'Structuring Outline & Sections...' : 'Menyusun Outline & Alokasi Kata...', isEn ? 'Allocating word counts and assigning 3 Outcome-Driven CTAs...' : 'Mengalokasikan target kata & menetapkan penempatan Tabel, Kutipan, dan 3 CTA...');
      await runStage2OutlineGeneration();
      renderOutlineList();
      showStudioToast(isEn ? '✓ Outline generated successfully! Review metadata & sections below.' : '✓ Outline berhasil disusun! Periksa spesifikasi & section di bawah.', true);
    } catch (err) {
      showStudioToast('✕ Terjadi kesalahan: ' + err.message, false);
    } finally {
      state.isGenerating = false;
      setOutlineLoading(false);
      const nextBtn = document.getElementById('ai-btn-next');
      if (nextBtn) nextBtn.disabled = false;
    }
  }

  function renderOutlineList() {
    const listEl = document.getElementById('ai-outline-list');
    const overviewCard = document.getElementById('ai-outline-overview-card');
    if (!listEl) return;
    listEl.innerHTML = '';

    if (!state.outline || state.outline.length === 0) {
      if (overviewCard) overviewCard.style.display = 'none';
      listEl.innerHTML = `<div style="padding:20px; text-align:center; color:var(--ai-text-muted);">Tidak ada section. Klik 'Buat Ulang Outline'.</div>`;
      return;
    }

    // Render Rich Outline Overview Card
    if (overviewCard) {
      overviewCard.style.display = 'block';
      const titleInput = document.getElementById('ai-outline-title-input');
      const h1Input = document.getElementById('ai-outline-h1-input');
      const descInput = document.getElementById('ai-outline-desc-input');
      const slugInput = document.getElementById('ai-outline-slug-input');
      const tagsInput = document.getElementById('ai-outline-tags-input');

      if (titleInput) {
        titleInput.value = state.proposedTitle || '';
        updateCharCounter('ai-outline-title-len', (state.proposedTitle || '').length, 60);
        titleInput.oninput = (e) => {
          state.proposedTitle = e.target.value;
          updateCharCounter('ai-outline-title-len', e.target.value.length, 60);
        };
      }

      if (h1Input) {
        h1Input.value = state.proposedH1 || state.proposedTitle || '';
        h1Input.oninput = (e) => {
          state.proposedH1 = e.target.value;
        };
      }

      if (descInput) {
        descInput.value = state.proposedDescription || '';
        updateCharCounter('ai-outline-desc-len', (state.proposedDescription || '').length, 160);
        descInput.oninput = (e) => {
          state.proposedDescription = e.target.value;
          updateCharCounter('ai-outline-desc-len', e.target.value.length, 160);
        };
      }

      if (slugInput) {
        slugInput.value = state.proposedSlug || '';
        const slLen = document.getElementById('ai-outline-slug-len');
        if (slLen) slLen.textContent = `${(state.proposedSlug || '').length} / 60`;
        slugInput.oninput = (e) => {
          state.proposedSlug = e.target.value;
          if (slLen) slLen.textContent = `${e.target.value.length} / 60`;
        };
      }

      if (tagsInput) {
        tagsInput.value = Array.isArray(state.proposedTags) ? state.proposedTags.join(', ') : (state.proposedTags || '');
        tagsInput.oninput = (e) => {
          state.proposedTags = e.target.value.split(',').map((t) => t.trim()).filter(Boolean);
        };
      }
    }

    // Render Section Hierarchy Cards
    state.outline.forEach((sec, idx) => {
      const item = document.createElement('div');
      item.className = 'ai-outline-item';
      item.style.flexDirection = 'column';
      item.style.alignItems = 'stretch';
      item.style.gap = '8px';

      const subheadingsHtml = (sec.subheadings && sec.subheadings.length > 0)
        ? `<div class="ai-outline-subheadings">
            ${sec.subheadings.map((sub) => `<div class="ai-outline-subheading-item"><span style="color:var(--ai-text-muted);">↳ H3:</span> <span>${escapeHtmlAttr(sub)}</span></div>`).join('')}
           </div>`
        : '';

      const pillsHtml = `
        <div class="ai-outline-feature-pills">
          ${sec.targetWordCount ? `<span class="ai-badge ai-badge-wordcount" title="Target alokasi panjang konten">🎯 ~${sec.targetWordCount} kata</span>` : ''}
          ${sec.tableNote ? `<span class="ai-badge ai-badge-table" title="${escapeHtmlAttr(sec.tableNote)}">📊 ${escapeHtmlAttr(sec.tableNote)}</span>` : ''}
          ${sec.quoteNote ? `<span class="ai-badge ai-badge-quote" title="${escapeHtmlAttr(sec.quoteNote)}">💬 ${escapeHtmlAttr(sec.quoteNote)}</span>` : ''}
          ${sec.ctaNote ? `<span class="ai-badge ai-badge-cta" title="${escapeHtmlAttr(sec.ctaNote)}">🚀 ${escapeHtmlAttr(sec.ctaNote)}</span>` : ''}
          ${sec.includesImage ? '<span class="ai-badge" style="background:rgba(99,102,241,0.2); color:#A5B4FC;">🖼️ Gambar Diagram</span>' : ''}
          ${sec.internalLinkAnchor ? `<span class="ai-badge" style="background:rgba(16,185,129,0.15); color:#6EE7B7;">🔗 ${escapeHtmlAttr(sec.internalLinkAnchor)}</span>` : ''}
        </div>
      `;

      item.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
          <span class="ai-outline-num">H2.${idx + 1}</span>
          <input type="text" class="ai-outline-input" value="${escapeHtmlAttr(sec.heading)}" data-sec-idx="${idx}" />
          <button type="button" class="ai-studio-icon-btn" data-del-sec="${idx}" title="Hapus Section" style="width:24px; height:24px; font-size:11px; color:var(--ai-error);">✕</button>
        </div>
        ${subheadingsHtml}
        ${pillsHtml}
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
      titleEl.value = art.title || '';
      updateCharCounter('ai-title-len', (art.title || '').length, 60);
      titleEl.oninput = (e) => {
        art.title = e.target.value;
        updateCharCounter('ai-title-len', e.target.value.length, 60);
      };
    }

    if (slugEl) {
      slugEl.value = art.slug || '';
      slugEl.oninput = (e) => {
        art.slug = e.target.value;
      };
    }

    if (descEl) {
      descEl.value = art.description || '';
      updateCharCounter('ai-desc-len', (art.description || '').length, 160);
      descEl.oninput = (e) => {
        art.description = e.target.value;
        updateCharCounter('ai-desc-len', e.target.value.length, 160);
      };
    }

    if (quickEl) {
      quickEl.value = art.quickAnswer || '';
      quickEl.oninput = (e) => {
        art.quickAnswer = e.target.value;
      };
    }

    if (tagsEl) {
      tagsEl.value = Array.isArray(art.tags) ? art.tags.join(', ') : (art.tags || '');
      tagsEl.oninput = (e) => {
        art.tags = e.target.value.split(',').map((t) => t.trim()).filter(Boolean);
      };
    }

    if (bodyEl) {
      bodyEl.value = art.body || '';
      bodyEl.oninput = (e) => {
        art.body = e.target.value;
      };
    }

    function renderFaqReviewList() {
      if (!faqContainer || !art.faq) return;
      faqContainer.innerHTML = '';

      art.faq.forEach((f, i) => {
        const item = document.createElement('div');
        item.style.cssText = 'background:var(--ai-bg-input); border:1px solid var(--ai-border); border-radius:8px; padding:12px; font-size:12px; display:flex; flex-direction:column; gap:6px;';
        item.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-weight:700; color:var(--ai-primary); font-size:11px;">FAQ #${i + 1}</span>
            <button type="button" class="ai-studio-icon-btn" data-del-faq="${i}" title="Hapus FAQ" style="color:var(--ai-error); font-size:11px; width:20px; height:20px;">✕</button>
          </div>
          <input type="text" class="ai-input faq-q-input" value="${escapeHtmlAttr(f.question || '')}" placeholder="Pertanyaan FAQ..." style="font-size:12px; font-weight:600;" />
          <textarea class="ai-textarea faq-a-input" rows="2" placeholder="Jawaban FAQ..." style="font-size:11px;">${escapeHtmlAttr(f.answer || '')}</textarea>
        `;

        item.querySelector('.faq-q-input')?.addEventListener('input', (e) => {
          art.faq[i].question = e.target.value;
        });

        item.querySelector('.faq-a-input')?.addEventListener('input', (e) => {
          art.faq[i].answer = e.target.value;
        });

        item.querySelector('[data-del-faq]')?.addEventListener('click', () => {
          art.faq.splice(i, 1);
          renderFaqReviewList();
        });

        faqContainer.appendChild(item);
      });

      const countEl = document.getElementById('ai-faq-count');
      if (countEl) countEl.textContent = art.faq.length;
    }

    renderFaqReviewList();

    const addFaqBtn = document.getElementById('ai-btn-add-faq-item');
    if (addFaqBtn) {
      addFaqBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!art.faq) art.faq = [];
        art.faq.push({ question: '', answer: '' });
        renderFaqReviewList();
      };
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
    try {
      const pendingPlan = sessionStorage.getItem('ap_tulis_ai_plan');
      if (pendingPlan) {
        sessionStorage.removeItem('ap_tulis_ai_plan');
        const plan = JSON.parse(pendingPlan);
        const kps = (plan.focusKeyphrases && plan.focusKeyphrases.length > 0)
          ? plan.focusKeyphrases
          : (plan.focusKeyphrase || '').split(',').map((k) => k.trim()).filter(Boolean);
        setTimeout(() => {
          prefillStudio({ topic: plan.articleTitle, focusKeyphrases: kps });
        }, 800);
      }
    } catch (_) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectStudioTriggerButton);
  } else {
    injectStudioTriggerButton();
  }

  const studioAPI = {
    open: openStudioDrawer,
    prefill: prefillStudio,
    close: closeStudioDrawer,
    state: state,
    callAI: callAI,
    callGemini: callGemini,
    callOpenAI: callOpenAI,
    getActiveModelName: getActiveModelName,
    loadSiteCatalog: loadSiteCatalog,
    autoSuggestInternalLinks: autoSuggestInternalLinks,
    addManualInternalLink: addManualInternalLink,
    addFocusKeyphrases: addFocusKeyphrases,
    loadCustomStrategies: loadCustomStrategies,
    getAllStrategies: getAllStrategies,
    getStrategy: getStrategy,
    createCustomStrategy: createCustomStrategy,
    updateCustomStrategy: updateCustomStrategy,
    deleteCustomStrategy: deleteCustomStrategy,
    renderStrategyCards: renderStrategyCards,
    runStage1ImageAnalysis: runStage1ImageAnalysis,
    runStage2OutlineGeneration: runStage2OutlineGeneration,
    runStage3ChunkedBodyGeneration: runStage3ChunkedBodyGeneration,
    runStage4Synthesis: runStage4Synthesis,
    startPipelineStage1And2: startPipelineStage1And2,
    startPipelineStage3And4: startPipelineStage3And4,
    setOutlineLoading: setOutlineLoading,
    setInjectLoading: setInjectLoading,
    setNativeValue: setNativeValue,
    injectIntoDecapForm: injectIntoDecapForm,
    getDecapReduxStore: getDecapReduxStore,
    setCoverImageViaRedux: setCoverImageViaRedux,
    setCoverImageViaFiber: setCoverImageViaFiber,
    setCoverImageViaUrlButton: setCoverImageViaUrlButton,
    findCoverImageFiberOnChange: findCoverImageFiberOnChange,
    handleUploadedImage: handleUploadedImage,
    handleUploadedImages: handleUploadedImages,
    compressImage: compressImage,
    setCoverImage: setCoverImage,
    removeUploadedImage: removeUploadedImage,
    clearAllImages: clearAllImages,
    renderImagePreviews: renderImagePreviews,
    renderImagePreview: renderImagePreview,
    formatFileSize: formatFileSize,
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
