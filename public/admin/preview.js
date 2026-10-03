/**
 * Decap CMS Editor Optimization & Preview Registration
 * Ramadhani Personal Brand & Technical Blog
 * Includes Automatic Local Media Persistence & Zero-404 Image Recovery
 */

(function () {
  // Ensure CMS is available
  if (typeof window.CMS === 'undefined') {
    console.warn('[Decap CMS] window.CMS is not loaded yet.');
    return;
  }

  const CMS = window.CMS;
  const h = window.h || (window.React && window.React.createElement);

  // Initialize in-memory blob URL cache on all accessible window levels
  window.__decap_blob_urls = window.__decap_blob_urls || {};
  try {
    if (window.parent) window.parent.__decap_blob_urls = window.parent.__decap_blob_urls || {};
    if (window.top) window.top.__decap_blob_urls = window.top.__decap_blob_urls || {};
  } catch (e) {}

  // =========================================================================
  // 1. Sleek Toast Notification Helper
  // =========================================================================
  function showUploadToast(msg, isSuccess = true) {
    try {
      const doc = (window.top && window.top.document) || document;
      let toast = doc.getElementById('decap-upload-toast');
      if (!toast) {
        toast = doc.createElement('div');
        toast.id = 'decap-upload-toast';
        toast.style.cssText =
          'position:fixed;bottom:24px;right:24px;z-index:999999;' +
          'background:#111317;color:#F9FAFB;padding:10px 18px;' +
          'border-radius:10px;font-family:JetBrains Mono,monospace;font-size:12px;' +
          'font-weight:600;box-shadow:0 10px 25px -5px rgba(0,0,0,0.3);' +
          'border:1px solid ' + (isSuccess ? '#10B981' : '#EF4444') + ';' +
          'display:flex;align-items:center;gap:8px;transition:opacity 0.3s ease, transform 0.3s ease;' +
          'pointer-events:none;transform:translateY(0);opacity:0;';
        doc.body.appendChild(toast);
      }
      toast.textContent = msg;
      toast.style.borderColor = isSuccess ? '#10B981' : '#EF4444';
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
      clearTimeout(toast._timeout);
      toast._timeout = setTimeout(function () {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(8px)';
      }, 4000);
    } catch (e) {}
  }

  // =========================================================================
  // 2. Slug & Filename Sanitizer
  // =========================================================================
  function sanitizeName(name) {
    if (!name) return 'image-' + Date.now() + '.png';
    const ext = name.includes('.') ? '.' + name.split('.').pop().toLowerCase() : '';
    const base = name.includes('.') ? name.substring(0, name.lastIndexOf('.')) : name;
    const cleanBase = base
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return (cleanBase || 'upload-' + Date.now()) + ext;
  }

  // =========================================================================
  // 3. Cross-Frame Blob URL Registry
  // =========================================================================
  function setDecapBlobUrl(filename, url) {
    if (!filename || !url) return;
    const clean = sanitizeName(filename);
    const basename = filename.split('/').pop().trim();
    const cleanBase = sanitizeName(basename);

    const keys = [
      filename,
      basename,
      clean,
      cleanBase,
      '/' + basename,
      '/' + clean,
      '/images/uploads/' + basename,
      '/images/uploads/' + clean,
      'images/uploads/' + basename,
      'images/uploads/' + clean,
    ];

    const wins = [window, window.parent, window.top].filter(Boolean);
    for (const w of wins) {
      try {
        w.__decap_blob_urls = w.__decap_blob_urls || {};
        for (const k of keys) {
          w.__decap_blob_urls[k] = url;
        }
      } catch (e) {}
    }
  }

  function getDecapBlobUrl(rawPath) {
    if (!rawPath) return null;
    const clean = sanitizeName(rawPath);
    const basename = rawPath.split('/').pop().trim();
    const cleanBase = sanitizeName(basename);

    const candidates = [
      rawPath,
      basename,
      clean,
      cleanBase,
      '/' + basename,
      '/' + clean,
      '/images/uploads/' + basename,
      '/images/uploads/' + clean,
      'images/uploads/' + basename,
      'images/uploads/' + clean,
    ];

    const wins = [window, window.parent, window.top].filter(Boolean);
    for (const w of wins) {
      try {
        if (w.__decap_blob_urls) {
          for (const c of candidates) {
            if (w.__decap_blob_urls[c]) return w.__decap_blob_urls[c];
          }
        }
      } catch (e) {}
    }
    return null;
  }

  // Normalizes an image path to eliminate relative-path 404s
  function normalizeImagePath(path) {
    if (!path) return '';
    path = path.trim();
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || path.startsWith('data:')) {
      return path;
    }
    // Check blob cache first for instant local preview
    const blob = getDecapBlobUrl(path);
    if (blob) return blob;

    // Ensure leading slash so browser resolves against root, not /admin/
    return path.startsWith('/') ? path : '/' + path;
  }

  // =========================================================================
  // 4. Immediate Local Media Persistence Hook
  // =========================================================================
  async function persistFileToLocalBackend(file) {
    if (!file || !file.name) return;

    const rawName = file.name;
    const cleanName = sanitizeName(rawName);

    // Register blob URL immediately across all windows
    try {
      const objectUrl = URL.createObjectURL(file);
      setDecapBlobUrl(rawName, objectUrl);
      setDecapBlobUrl(cleanName, objectUrl);
    } catch (e) {}

    // Read base64
    let base64Data = null;
    try {
      base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = reader.result;
          resolve(typeof res === 'string' ? res.split(',')[1] : null);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    } catch (e) {}

    if (!base64Data) return;

    // 1. Direct instant disk persistence via Astro/Vite dev server
    try {
      await fetch('/api/dev-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: cleanName, content: base64Data }),
      });

      if (rawName !== cleanName) {
        await fetch('/api/dev-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: rawName, content: base64Data }),
        });
      }

      console.log('[Decap Auto-Persist] Saved to disk: public/images/uploads/' + cleanName);
      showUploadToast('✓ Image saved to disk: /images/uploads/' + cleanName, true);
    } catch (err) {
      console.warn('[Decap Auto-Persist] dev-upload skipped:', err);
    }

    // 2. Also notify decap-server on 8081 if active
    try {
      const payload = {
        action: 'persistMedia',
        params: {
          branch: 'main',
          asset: {
            path: 'public/images/uploads/' + cleanName,
            content: base64Data,
            encoding: 'base64',
          },
          options: {
            commitMessage: 'Upload ' + cleanName,
          },
        },
      };
      await fetch('http://localhost:8081/api/v1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) {}
  }

  // Intercept file selection in Decap CMS UI
  document.addEventListener('change', function (e) {
    if (e.target && e.target.type === 'file' && e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach(function (file) {
        if (file.type && file.type.startsWith('image/')) {
          persistFileToLocalBackend(file);
        }
      });
    }
  }, true);

  // Intercept drag and drop of images
  document.addEventListener('drop', function (e) {
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(function (file) {
        if (file.type && file.type.startsWith('image/')) {
          persistFileToLocalBackend(file);
        }
      });
    }
  }, true);

  // Intercept pasted images (clipboard screenshots)
  document.addEventListener('paste', function (e) {
    if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
      Array.from(e.clipboardData.files).forEach(function (file) {
        if (file.type && file.type.startsWith('image/')) {
          persistFileToLocalBackend(file);
        }
      });
    }
  }, true);

  // =========================================================================
  // 5. Register Fonts & Custom CSS into Preview Frame
  // =========================================================================
  CMS.registerPreviewStyle(
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap'
  );
  CMS.registerPreviewStyle('/admin/preview.css');

  // =========================================================================
  // 6. Register Article Image with Caption Component for Markdown Toolbar
  // =========================================================================
  CMS.registerEditorComponent({
    id: 'article-image',
    label: 'Image with Caption',
    fields: [
      {
        name: 'image',
        label: 'Image (Upload or select from Media Library)',
        widget: 'image',
        choose_url: true,
      },
      {
        name: 'alt',
        label: 'Alt Text (Mandatory for SEO & Screen Readers)',
        widget: 'string',
        default: '',
      },
      {
        name: 'caption',
        label: 'Caption (Text displayed directly under the image)',
        widget: 'string',
        default: '',
      },
    ],
    pattern: /^<figure class="article-image-figure">\s*<img\s+src="([^"]*)"\s+alt="([^"]*)"[^>]*\/>(?:\s*<figcaption[^>]*>([\s\S]*?)<\/figcaption>)?\s*<\/figure>$/m,
    fromBlock: function (match) {
      return {
        image: match[1] || '',
        alt: match[2] || '',
        caption: match[3] || '',
      };
    },
    toBlock: function (data) {
      let img = (data.image || '').trim();
      const alt = (data.alt || '').trim();
      const cap = (data.caption || '').trim();
      if (!img) return '';
      // Ensure leading slash so relative paths never break
      if (!img.startsWith('http://') && !img.startsWith('https://') && !img.startsWith('blob:') && !img.startsWith('/')) {
        img = '/' + img;
      }
      return (
        '<figure class="article-image-figure">\n  <img src="' + img + '" alt="' + (alt || 'Article diagram') + '" class="article-body-image" loading="lazy" />\n' + (cap ? '  <figcaption class="article-image-caption">' + cap + '</figcaption>\n' : '') + '</figure>'
      );
    },
    toPreview: function (data, getAsset) {
      const rawImg = (data.image || '').trim();
      let src = rawImg;
      if (getAsset && rawImg) {
        try {
          const resolved = getAsset(rawImg);
          src = resolved ? resolved.toString() : rawImg;
        } catch (e) {
          src = rawImg;
        }
      }
      src = normalizeImagePath(src || rawImg);

      const alt = data.alt || '';
      const cap = data.caption || '';
      return (
        '<figure style="margin: 1.75rem 0; border-radius: 0.75rem; overflow: hidden; border: 1px solid #E5E7EB; background: #FAF9F5;">' +
        (src ? '<img src="' + src + '" alt="' + alt + '" style="width: 100%; height: auto; display: block;" />' : '<div style="padding: 2rem; text-align: center; color: #9CA3AF; font-size: 0.875rem;">No image selected</div>') +
        (cap ? '<figcaption style="padding: 0.625rem 1rem; text-align: center; font-size: 0.75rem; color: #6B7280; font-family: monospace; border-top: 1px solid #E5E7EB; background: #F4F4F0;">' + cap + '</figcaption>' : '') +
        '</figure>'
      );
    },
  });

  // =========================================================================
  // 7. Register Inline Expandable Q&A (Accordion) Component
  // =========================================================================
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
    pattern: /^<details class="qa-item">\s*<summary class="qa-question">([\s\S]*?)<\/summary>\s*<div class="qa-answer">\s*<p>([\s\S]*?)<\/p>\s*<\/div>\s*<\/details>$/m,
    fromBlock: function (match) {
      return {
        question: match[1] || '',
        answer: match[2] || '',
      };
    },
    toBlock: function (data) {
      const q = (data.question || '').trim();
      const a = (data.answer || '').trim();
      if (!q && !a) return '';
      return (
        '<details class="qa-item">\n  <summary class="qa-question">' + q + '</summary>\n  <div class="qa-answer">\n    <p>' + a + '</p>\n  </div>\n</details>'
      );
    },
    toPreview: function (data) {
      const q = data.question || 'Accordion Question';
      const a = data.answer || 'Accordion Answer details...';
      return (
        '<details style="margin: 1.25rem 0; border-radius: 0.75rem; border: 1px solid #E5E7EB; background: #FFFFFF; overflow: hidden;" open>' +
        '<summary style="padding: 1rem 1.25rem; font-weight: 600; cursor: pointer; color: #111317; background: #F4F4F0;">' + q + '</summary>' +
        '<div style="padding: 1rem 1.25rem; font-size: 0.875rem; color: #475063; line-height: 1.6; border-top: 1px solid #E5E7EB;"><p style="margin: 0;">' + a + '</p></div>' +
        '</details>'
      );
    },
  });

  // =========================================================================
  // 8. Article Preview Template
  // =========================================================================
  const ArticlePreview = function (props) {
    const entry = props.entry;
    const getAsset = props.getAsset;
    const widgetFor = props.widgetFor;

    const title = entry.getIn(['data', 'title']) || 'Untitled Article';
    const status = entry.getIn(['data', 'status']) || 'published';
    const rawDate = entry.getIn(['data', 'publishDate']);
    const publishDate = rawDate ? new Date(rawDate) : null;
    const formattedDate = publishDate && !isNaN(publishDate.getTime()) ? publishDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) : 'Draft';
    const isFuture = publishDate && publishDate.getTime() > Date.now();
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

    let resolvedCover = null;
    if (coverImage) {
      try {
        const asset = getAsset(coverImage);
        resolvedCover = asset ? asset.toString() : coverImage;
      } catch (e) {
        resolvedCover = coverImage;
      }
      resolvedCover = normalizeImagePath(resolvedCover || coverImage);
    }

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

    // Self-healing hook: fixes any broken relative markdown body images
    setTimeout(function () {
      try {
        const imgs = document.querySelectorAll('img');
        imgs.forEach(function (img) {
          const rawSrc = img.getAttribute('src');
          if (rawSrc && !rawSrc.startsWith('http') && !rawSrc.startsWith('blob:') && !rawSrc.startsWith('data:')) {
            const fixed = normalizeImagePath(rawSrc);
            if (fixed && fixed !== rawSrc) {
              img.src = fixed;
            }
          }
          // Fallback on image error
          img.onerror = function () {
            const fallback = getDecapBlobUrl(rawSrc);
            if (fallback && img.src !== fallback) {
              img.src = fallback;
            }
          };
        });
      } catch (e) {}
    }, 50);

    return h(
      'div',
      { className: 'preview-container' },
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
              src: resolvedCover,
              alt: coverAlt,
              className: 'preview-cover-image',
              onError: function (e) {
                const fallback = getDecapBlobUrl(coverImage);
                if (fallback && e.target.src !== fallback) {
                  e.target.src = fallback;
                }
              },
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

  // =========================================================================
  // 9. Case Study & Work Preview Template
  // =========================================================================
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

    let resolvedCover = null;
    if (coverImage) {
      try {
        const asset = getAsset(coverImage);
        resolvedCover = asset ? asset.toString() : coverImage;
      } catch (e) {
        resolvedCover = coverImage;
      }
      resolvedCover = normalizeImagePath(resolvedCover || coverImage);
    }
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
              src: resolvedCover,
              alt: title,
              className: 'preview-cover-image',
              onError: function (e) {
                const fallback = getDecapBlobUrl(coverImage);
                if (fallback && e.target.src !== fallback) {
                  e.target.src = fallback;
                }
              },
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
})();
