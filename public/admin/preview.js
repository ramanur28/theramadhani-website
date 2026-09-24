/**
 * Decap CMS Editor Optimization & Preview Registration
 * Ramadhani Personal Brand & Technical Blog
 */

(function () {
  // Ensure CMS is available
  if (typeof window.CMS === 'undefined') {
    console.warn('Decap CMS is not loaded yet.');
    return;
  }

  const CMS = window.CMS;
  // React createElement helper (Decap CMS exposes `h` globally or React.createElement)
  const h = window.h || (window.React && window.React.createElement);

  // 1. Register Google Fonts & Custom CSS into Preview Frame
  CMS.registerPreviewStyle(
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap'
  );
  CMS.registerPreviewStyle('/admin/preview.css');

  // 2. Register Inline Expandable Q&A (Accordion) Editor Component for Markdown Toolbar
  CMS.registerEditorComponent({
    id: 'qa-accordion',
    label: 'Expandable Q&A (Accordion)',
    fields: [
      {
        name: 'question',
        label: 'Question',
        widget: 'string',
        default: '',
      },
      {
        name: 'answer',
        label: 'Answer',
        widget: 'text',
        default: '',
      },
    ],
    // Flexible regex matching details/summary blocks
    pattern: /^<details(?:\s+class="[^"]*")?>\s*<summary(?:\s+class="[^"]*")?>([\s\S]*?)<\/summary>\s*(?:<div(?:\s+class="[^"]*")?>)?\s*([\s\S]*?)\s*(?:<\/div>)?\s*<\/details>$/m,
    fromBlock: function (match) {
      return {
        question: match[1] ? match[1].trim() : '',
        answer: match[2] ? match[2].trim() : '',
      };
    },
    toBlock: function (data) {
      const q = (data.question || '').trim();
      const a = (data.answer || '').trim();
      return '<details class="faq-accordion-item">\n<summary class="faq-accordion-question">' + q + '</summary>\n<div class="faq-accordion-answer">\n\n' + a + '\n\n</div>\n</details>';
    },
    toPreview: function (data) {
      const q = data.question || 'Frequently Asked Question';
      const a = data.answer || 'Detailed answer explanation...';
      if (h) {
        return h(
          'details',
          { className: 'faq-accordion-item', open: true },
          h('summary', { className: 'faq-accordion-question' }, q),
          h('div', { className: 'faq-accordion-answer' }, h('p', null, a))
        );
      }
      return '<details class="faq-accordion-item" open><summary class="faq-accordion-question">' + q + '</summary><div class="faq-accordion-answer"><p>' + a + '</p></div></details>';
    },
  });

  // 3. Articles Preview Template (Mirroring ArticleLayout.astro)
  if (h) {
    const ArticlePreview = function (props) {
      const entry = props.entry;
      const getAsset = props.getAsset;
      const widgetFor = props.widgetFor;

      const title = entry.getIn(['data', 'title']) || 'Untitled Article';
      const status = entry.getIn(['data', 'status']) || 'published';
      const publishDate = entry.getIn(['data', 'publishDate']);
      const formattedDate = publishDate ? new Date(publishDate).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) : 'Draft';
      const isFuture = publishDate && new Date(publishDate).getTime() > Date.now();
      const author = entry.getIn(['data', 'author']) || 'Ramadhani';
      const tags = entry.getIn(['data', 'tags']);
      const primaryTag = tags && tags.size > 0 ? tags.get(0) : 'Technical SEO';
      const coverImage = entry.getIn(['data', 'coverImage']);
      const coverAlt = entry.getIn(['data', 'coverAlt']) || 'Article cover image';
      const quickAnswer = entry.getIn(['data', 'quickAnswer']);
      const rawFaq = entry.getIn(['data', 'faq']);

      let faqItems = [];
      if (rawFaq && rawFaq.toJS) {
        faqItems = rawFaq.toJS().filter(function (item) {
          return item && (item.question || item.answer);
        });
      }

      // Default FAQ fallback if no custom items are entered
      if (!faqItems || faqItems.length === 0) {
        faqItems = [
          {
            question: 'What is the core takeaway of "' + title + '"?',
            answer: quickAnswer || 'Definitive outcome summary.',
          },
          {
            question: 'How does this methodology align with AI Answer Engines (Perplexity, ChatGPT, Claude)?',
            answer: 'It leverages entity-dense semantic linking, high-speed static DOM rendering, and concise 40-60 word definitive answer blocks to optimize retrieval augmented generation (RAG) synthesis.',
          },
          {
            question: 'Who is the author of this technical publication?',
            answer: author + ' is a Senior Digital Marketing Specialist with expertise in Technical SEO, Generative Engine Optimization (GEO), and Google Ads acquisition funnels.',
          },
        ];
      }

      const resolvedCover = coverImage ? getAsset(coverImage) : null;

      // Status & Schedule Banner
      let statusBanner = null;
      if (status === 'draft') {
        statusBanner = h(
          'div',
          { className: 'preview-status-banner preview-status-draft' },
          h('span', { className: 'preview-status-icon' }, '📝'),
          h('div', null,
            h('strong', null, 'DRAFT ARTICLE — HIDDEN FROM PUBLIC'),
            h('div', { className: 'preview-status-desc' }, 'This article is saved as a draft and will not appear on the live site.')
          )
        );
      } else if (status === 'scheduled' || isFuture) {
        statusBanner = h(
          'div',
          { className: 'preview-status-banner preview-status-scheduled' },
          h('span', { className: 'preview-status-icon' }, '⏰'),
          h('div', null,
            h('strong', null, 'SCHEDULED PUBLICATION'),
            h('div', { className: 'preview-status-desc' }, 'Scheduled for release on ' + formattedDate + '. It will automatically go live when this time arrives.')
          )
        );
      }

      return h(
        'div',
        { className: 'preview-container' },
        // Scheduling / Draft Status Banner
        statusBanner,

        // Breadcrumbs
        h(
          'nav',
          { className: 'preview-breadcrumbs', 'aria-label': 'Breadcrumbs' },
          h('span', null, 'Articles'),
          h('span', { className: 'sep' }, '›'),
          h('span', { className: 'current' }, title)
        ),

        // Metadata Bar
        h(
          'div',
          { className: 'preview-meta' },
          h('time', null, formattedDate),
          h('span', null, '•'),
          h('span', { className: 'preview-tag' }, '#' + primaryTag)
        ),

        // Editorial H1
        h('h1', { className: 'preview-title' }, title),

        // Cover Image Banner
        resolvedCover
          ? h(
              'figure',
              { className: 'preview-cover-figure' },
              h('img', {
                src: resolvedCover.toString(),
                alt: coverAlt,
                className: 'preview-cover-image',
              }),
              coverAlt && coverAlt !== 'Article cover image'
                ? h('figcaption', { className: 'preview-cover-caption' }, coverAlt)
                : null
            )
          : null,

        // Quick Answer Block
        quickAnswer
          ? h(
              'aside',
              { className: 'preview-quick-answer' },
              h(
                'div',
                { className: 'preview-quick-answer-header' },
                h('span', { className: 'preview-quick-answer-badge' }, 'Definitive Quick Answer')
              ),
              h('p', { className: 'preview-quick-answer-text' }, quickAnswer)
            )
          : null,

        // Rendered Markdown Body
        h('div', { className: 'prose' }, widgetFor('body')),

        // FAQ Section (Interactive Accordion)
        faqItems && faqItems.length > 0
          ? h(
              'section',
              { className: 'preview-faq-section' },
              h('h2', { className: 'preview-faq-title' }, 'Frequently Asked Questions & Citations'),
              h(
                'div',
                { className: 'preview-faq-list' },
                faqItems.map(function (item, idx) {
                  return h(
                    'details',
                    {
                      key: idx,
                      className: 'faq-accordion-item',
                      open: idx === 0,
                    },
                    h(
                      'summary',
                      { className: 'faq-accordion-question' },
                      item.question || ('Question #' + (idx + 1))
                    ),
                    h(
                      'div',
                      { className: 'faq-accordion-answer' },
                      h('p', null, item.answer || 'No answer provided yet.')
                    )
                  );
                })
              )
            )
          : null,

        // Author Bio Card
        h(
          'div',
          { className: 'preview-author-card' },
          h('div', { className: 'preview-author-avatar' }, (author && author.charAt(0)) || 'R'),
          h(
            'div',
            { className: 'preview-author-info' },
            h(
              'div',
              { className: 'preview-author-header' },
              h('span', { className: 'preview-author-name' }, 'Written by ' + author),
              h('span', { className: 'preview-author-link' }, 'Profile →')
            ),
            h(
              'p',
              { style: { margin: '0.25rem 0 0 0' } },
              'Digital Marketing Specialist in Technical SEO, Generative Engine Optimization (GEO), and paid search acquisition.'
            )
          )
        )
      );
    };

    CMS.registerPreviewTemplate('articles', ArticlePreview);

    // 4. Case Study & Work Preview Template
    const WorkPreview = function (props) {
      const entry = props.entry;
      const getAsset = props.getAsset;
      const widgetFor = props.widgetFor;

      const title = entry.getIn(['data', 'title']) || 'Untitled Case Study';
      const client = entry.getIn(['data', 'client']) || 'Client';
      const industry = entry.getIn(['data', 'industry']) || 'Industry';
      const service = entry.getIn(['data', 'service']) || 'Service';
      const quickAnswer = entry.getIn(['data', 'quickAnswer']);
      const coverImage = entry.getIn(['data', 'coverImage']);
      const resolvedCover = coverImage ? getAsset(coverImage) : null;
      const rawMetrics = entry.getIn(['data', 'metrics']);

      let metrics = [];
      if (rawMetrics && rawMetrics.toJS) {
        metrics = rawMetrics.toJS().filter(function (m) {
          return m && m.value;
        });
      }

      return h(
        'div',
        { className: 'preview-container' },
        h(
          'div',
          { className: 'preview-meta' },
          h('span', null, client),
          h('span', null, '•'),
          h('span', { className: 'preview-tag' }, industry)
        ),
        h('h1', { className: 'preview-title' }, title),
        h('p', { style: { color: 'var(--text-dim)', fontStyle: 'italic', marginBottom: '1.5rem' } }, service),

        resolvedCover
          ? h(
              'figure',
              { className: 'preview-cover-figure' },
              h('img', {
                src: resolvedCover.toString(),
                alt: title,
                className: 'preview-cover-image',
              })
            )
          : null,

        metrics && metrics.length > 0
          ? h(
              'div',
              { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', margin: '2rem 0' } },
              metrics.map(function (m, idx) {
                return h(
                  'div',
                  { key: idx, style: { padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-main)', background: 'var(--card-bg)' } },
                  h('div', { style: { fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)', fontFamily: 'Plus Jakarta Sans' } }, m.value),
                  h('div', { style: { fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' } }, m.label)
                );
              })
            )
          : null,

        quickAnswer
          ? h(
              'aside',
              { className: 'preview-quick-answer' },
              h(
                'div',
                { className: 'preview-quick-answer-header' },
                h('span', { className: 'preview-quick-answer-badge' }, 'Executive Outcome')
              ),
              h('p', { className: 'preview-quick-answer-text' }, quickAnswer)
            )
          : null,

        h('div', { className: 'prose' }, widgetFor('body'))
      );
    };

    CMS.registerPreviewTemplate('work', WorkPreview);
  }
})();
