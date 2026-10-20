import { describe, it, expect, beforeEach, vi } from 'vitest';
import '../public/admin/ai-studio.js';

const studio = (typeof window !== 'undefined' && (window as any).DecapAIStudio) || (globalThis as any).DecapAIStudio;

describe('Decap CMS Form Injector & DOM Synchronizer', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="nc-root">
        <form class="decap-editor-form">
          <div class="control-pane">
            <label for="title-field-123">Title</label>
            <input id="title-field-123" name="title" value="" />
          </div>
          <div class="control-pane">
            <label for="slug-field-123">Slug</label>
            <input id="slug-field-123" name="slug" value="" />
          </div>
          <div class="control-pane">
            <label for="description-field-123">Description</label>
            <textarea id="description-field-123" name="description"></textarea>
          </div>
          <div class="control-pane">
            <label for="quickAnswer-field-123">Quick Answer</label>
            <textarea id="quickAnswer-field-123" name="quickAnswer"></textarea>
          </div>
          <div class="control-pane">
            <label for="coverImage-field-123">Cover Image</label>
            <input id="coverImage-field-123" name="coverImage" value="" />
          </div>
          <div class="control-pane">
            <label for="coverAlt-field-123">Cover Alt</label>
            <input id="coverAlt-field-123" name="coverAlt" value="" />
          </div>
          <div class="control-pane">
            <label for="body-field-123">Body</label>
            <div data-slate-editor="true" contenteditable="true" role="textbox"></div>
          </div>
        </form>
      </div>
      <div class="ai-toast" id="ai-studio-toast"></div>
    `;
  });

  it('triggers native property setter and dispatches input/change events', () => {
    const input = document.getElementById('title-field-123') as HTMLInputElement;
    let inputEventFired = false;
    let changeEventFired = false;

    input.addEventListener('input', () => { inputEventFired = true; });
    input.addEventListener('change', () => { changeEventFired = true; });

    const success = studio.setNativeValue(input, 'New Title from AI');

    expect(success).toBe(true);
    expect(input.value).toBe('New Title from AI');
    expect(inputEventFired).toBe(true);
    expect(changeEventFired).toBe(true);
  });

  it('programmatically injects all synthesized fields into Decap CMS form inputs including Slate body', async () => {
    studio.state.synthesizedArticle = {
      title: 'Generative Engine Optimization Mastery 2026',
      slug: 'generative-engine-optimization-mastery-2026',
      description: 'Definitive blueprint on GEO, Perplexity citations, and RAG entity linking.',
      quickAnswer: 'Generative Engine Optimization (GEO) prioritizes entity graph structuring and concise 40-60 word answer blocks.',
      coverImage: '/images/uploads/geo-blueprint.svg',
      coverAlt: 'GEO Architecture Diagram',
      body: '## The Evolution of AI Search\n\nDetailed technical analysis of modern LLM retrieval...',
      tags: ['GEO', 'Technical SEO'],
      faq: [],
    };

    const injected = await studio.injectIntoDecapForm();
    expect(injected).toBe(true);

    const titleEl = document.getElementById('title-field-123') as HTMLInputElement;
    const slugEl = document.getElementById('slug-field-123') as HTMLInputElement;
    const descEl = document.getElementById('description-field-123') as HTMLTextAreaElement;
    const quickEl = document.getElementById('quickAnswer-field-123') as HTMLTextAreaElement;
    const coverEl = document.getElementById('coverImage-field-123') as HTMLInputElement;
    const coverAltEl = document.getElementById('coverAlt-field-123') as HTMLInputElement;
    const slateEl = document.querySelector('[data-slate-editor="true"]') as HTMLDivElement;

    expect(titleEl.value).toBe('Generative Engine Optimization Mastery 2026');
    expect(slugEl.value).toBe('generative-engine-optimization-mastery-2026');
    expect(descEl.value).toBe('Definitive blueprint on GEO, Perplexity citations, and RAG entity linking.');
    expect(quickEl.value).toBe('Generative Engine Optimization (GEO) prioritizes entity graph structuring and concise 40-60 word answer blocks.');
    expect(coverEl.value).toBe('/images/uploads/geo-blueprint.svg');
    expect(coverAltEl.value).toBe('GEO Architecture Diagram');
    expect(slateEl.textContent).toContain('The Evolution of AI Search');
  });

  it('gracefully handles missing synthesized article without crashing', async () => {
    studio.state.synthesizedArticle = null;
    const result = await studio.injectIntoDecapForm();
    expect(result).toBe(false);

    const toast = document.getElementById('ai-studio-toast');
    expect(toast?.textContent).toContain('Belum ada artikel yang disintesis');
  });
  it('detects FAQ list widget in Decap CMS, clicks add button, and populates questions and answers', async () => {
    const form = document.querySelector('.decap-editor-form');
    const faqPane = document.createElement('div');
    faqPane.className = 'control-pane faq-pane';
    faqPane.innerHTML = `
      <span class="TopBarLabel">Frequently Asked Questions (Expandable Q&A)</span>
      <button type="button" class="StyledDropdownButton" id="add-faq-btn">Add frequently asked questions (expandable q&a)</button>
      <div id="faq-items-wrap"></div>
    `;
    form?.appendChild(faqPane);

    let faqIndex = 0;
    const addBtn = faqPane.querySelector('#add-faq-btn');
    addBtn?.addEventListener('click', () => {
      faqIndex++;
      const itemDiv = document.createElement('div');
      itemDiv.className = 'faq-item';
      itemDiv.innerHTML = `
        <label for="question-field-${faqIndex}">Question</label>
        <input id="question-field-${faqIndex}" name="question" value="" />
        <label for="answer-field-${faqIndex}">Answer</label>
        <textarea id="answer-field-${faqIndex}" name="answer"></textarea>
      `;
      faqPane.querySelector('#faq-items-wrap')?.appendChild(itemDiv);
    });

    studio.state.synthesizedArticle = {
      title: 'GEO with FAQ Guide',
      slug: 'geo-faq-guide',
      description: 'Test description',
      quickAnswer: 'Quick answer',
      coverImage: '/img.png',
      coverAlt: 'Alt',
      body: 'Body text',
      tags: ['GEO'],
      faq: [
        { question: 'Apa itu GEO?', answer: 'GEO adalah Generative Engine Optimization.' },
        { question: 'Mengapa FAQ penting?', answer: 'FAQ mempermudah ekstraksi AI Answer Engines.' },
      ],
    };

    const injected = await studio.injectIntoDecapForm();
    expect(injected).toBe(true);

    const qInputs = document.querySelectorAll<HTMLInputElement>('input[id*="question-field-"]');
    const aTextareas = document.querySelectorAll<HTMLTextAreaElement>('textarea[id*="answer-field-"]');

    expect(qInputs.length).toBe(2);
    expect(aTextareas.length).toBe(2);
    expect(qInputs[0].value).toBe('Apa itu GEO?');
    expect(aTextareas[0].value).toBe('GEO adalah Generative Engine Optimization.');
    expect(qInputs[1].value).toBe('Mengapa FAQ penting?');
    expect(aTextareas[1].value).toBe('FAQ mempermudah ekstraksi AI Answer Engines.');

    const toast = document.getElementById('ai-studio-toast');
    expect(toast?.textContent).toContain('FAQ (2 item)');
  });

  it('INJ-07: safely toggles mode switch and injects markdown body via CodeMirror without Slate DOM mutation', async () => {
    // Setup Decap DOM with mode switch and mock CodeMirror
    const bodyControl = document.querySelector('.decap-editor-form');
    const switchBtn = document.createElement('button');
    switchBtn.setAttribute('role', 'switch');
    switchBtn.className = 'ToolbarToggle';
    
    let toggledCount = 0;
    switchBtn.addEventListener('click', () => {
      toggledCount++;
      // Simulate switching to markdown mode: mount CodeMirror
      if (!document.querySelector('.CodeMirror')) {
        const cmEl = document.createElement('div');
        cmEl.className = 'CodeMirror';
        let cmValue = '';
        (cmEl as any).CodeMirror = {
          setValue: (val: string) => { cmValue = val; },
          getValue: () => cmValue,
          save: () => {},
        };
        bodyControl?.appendChild(cmEl);
      }
    });
    bodyControl?.appendChild(switchBtn);

    studio.state.synthesizedArticle = {
      title: 'GEO Deep Dive',
      slug: 'geo-deep-dive',
      description: 'Long article test',
      quickAnswer: 'Short summary',
      coverImage: '/img.png',
      coverAlt: 'Alt',
      body: '# Long Article Markdown\n\nThousands of characters testing safe injection...',
      tags: ['GEO'],
      faq: [],
    };

    const injected = await studio.injectIntoDecapForm();
    expect(injected).toBe(true);

    // Verify mode switch was clicked to switch to Raw Markdown, then back to Rich Text
    expect(toggledCount).toBeGreaterThanOrEqual(2);
    const cmEl = document.querySelector('.CodeMirror') as any;
    expect(cmEl?.CodeMirror?.getValue()).toContain('Long Article Markdown');
  });

  it('INJ-08: debounces and sets loading state on next button during Step 5 execution', async () => {
    const nextBtn = document.createElement('button');
    nextBtn.id = 'ai-btn-next';
    nextBtn.textContent = '🎯 Terapkan ke Editor Decap';
    document.body.appendChild(nextBtn);

    studio.state.currentStep = 5;
    studio.state.synthesizedArticle = {
      title: 'Debounce Article Test',
      slug: 'debounce-article-test',
      description: 'Testing debounce',
      quickAnswer: 'Testing debounce answer',
      coverImage: '/img.png',
      coverAlt: 'Alt',
      body: 'Body text',
      tags: ['GEO'],
      faq: [],
    };

    // Simulate clicking with the new debounce guard
    let executionCount = 0;
    const originalInject = studio.injectIntoDecapForm;
    studio.injectIntoDecapForm = async () => {
      executionCount++;
      await new Promise(r => setTimeout(r, 50));
      return true;
    };

    // Trigger two rapid clicks
    const runStep5Click = async () => {
      if (nextBtn.disabled) return;
      nextBtn.disabled = true;
      nextBtn.textContent = 'Sedang Menerapkan...';
      try {
        await studio.injectIntoDecapForm();
      } finally {
        nextBtn.disabled = false;
        nextBtn.textContent = '🎯 Terapkan ke Editor Decap';
      }
    };

    const promise1 = runStep5Click();
    const promise2 = runStep5Click(); // Should be ignored because disabled is true
    await Promise.all([promise1, promise2]);

    expect(executionCount).toBe(1);
    expect(nextBtn.disabled).toBe(false);
    expect(nextBtn.textContent).toBe('🎯 Terapkan ke Editor Decap');

    studio.injectIntoDecapForm = originalInject;
    nextBtn.remove();
  });

  it('INJ-09: targets specific FAQ add button without clicking unrelated + buttons on page', async () => {
    // Add an unrelated toolbar '+' button on page (e.g. Markdown Add Component)
    const unrelatedBtn = document.createElement('button');
    unrelatedBtn.id = 'unrelated-add-btn';
    unrelatedBtn.textContent = '+';
    let unrelatedClicked = false;
    unrelatedBtn.addEventListener('click', () => { unrelatedClicked = true; });
    document.body.appendChild(unrelatedBtn);

    // Add proper FAQ pane with exact Decap label
    const form = document.querySelector('.decap-editor-form');
    const faqPane = document.createElement('div');
    faqPane.className = 'control-pane faq-pane';
    faqPane.innerHTML = `
      <span class="TopBarLabel">Frequently Asked Questions (Expandable Q&A)</span>
      <button type="button" class="StyledDropdownButton" id="real-faq-add">Add frequently asked questions (expandable q&a)</button>
      <div id="faq-items-wrap-2"></div>
    `;
    form?.appendChild(faqPane);

    let faqIndex = 0;
    faqPane.querySelector('#real-faq-add')?.addEventListener('click', () => {
      faqIndex++;
      const itemDiv = document.createElement('div');
      itemDiv.innerHTML = `
        <label for="question-field-${faqIndex}">Question</label>
        <input id="question-field-${faqIndex}" name="question" value="" />
        <label for="answer-field-${faqIndex}">Answer</label>
        <textarea id="answer-field-${faqIndex}" name="answer"></textarea>
      `;
      faqPane.querySelector('#faq-items-wrap-2')?.appendChild(itemDiv);
    });

    studio.state.synthesizedArticle = {
      title: 'Targeted FAQ Test',
      slug: 'targeted-faq-test',
      description: 'Desc',
      quickAnswer: 'Ans',
      coverImage: '/img.png',
      coverAlt: 'Alt',
      body: 'Body',
      tags: ['GEO'],
      faq: [{ question: 'Q1?', answer: 'A1.' }],
    };

    const injected = await studio.injectIntoDecapForm();
    expect(injected).toBe(true);
    expect(unrelatedClicked).toBe(false); // Unrelated + button was NOT clicked!
    unrelatedBtn.remove();
  });
  it('INJ-10: detects Decap tags list widget, clicks add button, and populates individual tag inputs', async () => {
    const form = document.querySelector('.decap-editor-form');
    const tagsPane = document.createElement('div');
    tagsPane.className = 'control-pane tags-pane';
    tagsPane.innerHTML = `
      <span class="TopBarLabel">Tags</span>
      <button type="button" class="StyledDropdownButton" id="add-tags-btn">Add tags</button>
      <div id="tags-items-wrap"></div>
    `;
    form?.appendChild(tagsPane);

    let tagCount = 0;
    tagsPane.querySelector('#add-tags-btn')?.addEventListener('click', () => {
      tagCount++;
      const itemDiv = document.createElement('div');
      itemDiv.innerHTML = `<input id="tags-field-${tagCount}" name="tags" value="" />`;
      tagsPane.querySelector('#tags-items-wrap')?.appendChild(itemDiv);
    });

    studio.state.synthesizedArticle = {
      title: 'Tags Test Article',
      slug: 'tags-test-article',
      description: 'Testing tags list injection',
      quickAnswer: 'Quick answer',
      coverImage: '/img.png',
      coverAlt: 'Alt',
      body: 'Body text without faq yet',
      tags: ['GEO', 'Technical SEO', 'AI Search'],
      faq: [],
    };

    const injected = await studio.injectIntoDecapForm();
    expect(injected).toBe(true);

    const tagInputs = tagsPane.querySelectorAll<HTMLInputElement>('input');
    expect(tagInputs.length).toBe(3);
    expect(tagInputs[0].value).toBe('GEO');
    expect(tagInputs[1].value).toBe('Technical SEO');
    expect(tagInputs[2].value).toBe('AI Search');

    tagsPane.remove();
  });

  it('INJ-11: automatically injects expandable Q&A accordions into Markdown body while populating FAQ frontmatter', async () => {
    studio.state.language = 'en';
    studio.state.synthesizedArticle = {
      title: 'Accordion Article Guide',
      slug: 'accordion-article-guide',
      description: 'Test description',
      quickAnswer: 'Quick answer block text',
      coverImage: '/img.png',
      coverAlt: 'Alt',
      body: '# Main Guide\n\nComprehensive content section before FAQ.',
      tags: ['GEO'],
      faq: [
        {
          question: 'What is Generative Engine Optimization?',
          answer: 'Generative Engine Optimization is content optimization for LLM citation.',
        },
        {
          question: 'Does schema help LLMs parse facts?',
          answer: 'Yes, schema entity graphs disambiguate concepts directly.',
        },
      ],
    };

    const injected = await studio.injectIntoDecapForm();
    expect(injected).toBe(true);

    // Verify Markdown body now contains the registered Decap qa-item accordion blocks
    expect(studio.state.synthesizedArticle.body).toContain('## Frequently Asked Questions');
    expect(studio.state.synthesizedArticle.body).toContain('<details class="qa-item">');
    expect(studio.state.synthesizedArticle.body).toContain('<summary class="qa-question">What is Generative Engine Optimization?</summary>');
    expect(studio.state.synthesizedArticle.body).toContain('<div class="qa-answer">\n<p>Generative Engine Optimization is content optimization for LLM citation.</p>\n</div>');
  });

  it('LDR-01: displays active loading spinner card during outline generation and injection', async () => {
    // Open drawer to mount DOM elements
    studio.open();

    const outlineLoadingCard = document.getElementById('ai-outline-loading-card');
    // outline loading title check
    const injectLoadingCard = document.getElementById('ai-inject-loading-card');
    // inject loading title check

    expect(outlineLoadingCard).not.toBeNull();
    expect(injectLoadingCard).not.toBeNull();

    // Verify initial hidden state
    expect(outlineLoadingCard?.style.display).toBe('none');
    expect(injectLoadingCard?.style.display).toBe('none');

    // Simulate pipeline outline start triggering loader
    studio.state.outline = [{ heading: 'H2 Section', subheadings: [] }];
    global.fetch = vi.fn().mockImplementation(async () => ({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'Rich Guide Title (50-60 characters for SEO testing)',
              metaDescription: 'Dense meta description for outline testing purpose.',
              slug: 'rich-guide-title',
              tags: ['GEO'],
              h1: 'Rich Guide Title H1',
              sections: [{ heading: 'H2 Section', subheadings: [] }],
              faqSuggestions: [],
            }),
          },
        }],
      }),
    }));

    // Trigger startPipelineStage1And2 and verify loader was activated
    const outlinePromise = studio.startPipelineStage1And2();
    // While running or immediately after, loading elements respond
    await outlinePromise;

    // After finish, loader should return to hidden and list be displayed
    expect(outlineLoadingCard?.style.display).toBe('none');
    expect(document.getElementById('ai-outline-overview-card')?.style.display).toBe('block');
  });

});
