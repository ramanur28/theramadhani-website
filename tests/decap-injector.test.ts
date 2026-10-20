import { describe, it, expect, beforeEach } from 'vitest';
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
});
