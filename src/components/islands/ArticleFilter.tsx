import { useState, useMemo, useEffect } from 'react';

export interface ArticleItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  publishDate: string;
  author: string;
  tags: string[];
  coverImage?: string;
  coverAlt?: string;
  quickAnswer: string;
}

interface Props {
  articles: ArticleItem[];
  allTags: string[];
}

const ITEMS_PER_PAGE = 18;

export const CORE_TOPICS = [
  {
    id: 'all',
    label: 'All Publications',
    match: () => true,
  },
  {
    id: 'technical-seo',
    label: 'Technical SEO',
    match: (art: ArticleItem) =>
      art.tags.some((t) =>
        /technical seo|site architecture|crawl|javascript seo|schema/i.test(t)
      ) || /technical seo/i.test(art.title),
  },
  {
    id: 'geo',
    label: 'GEO & AI Search',
    match: (art: ArticleItem) =>
      art.tags.some((t) => /geo|ai search|llm|ai overviews/i.test(t)) ||
      /geo|generative engine|ai overviews/i.test(art.title),
  },
  {
    id: 'google-ads',
    label: 'Google Ads & PPC',
    match: (art: ArticleItem) =>
      art.tags.some((t) => /google ads|ppc|conversion tracking|smart bidding/i.test(t)) ||
      /google ads/i.test(art.title),
  },
  {
    id: 'seo-audit',
    label: 'SEO Audit',
    match: (art: ArticleItem) =>
      art.tags.some((t) => /audit/i.test(t)) || /audit/i.test(art.title),
  },
  {
    id: 'core-web-vitals',
    label: 'Core Web Vitals',
    match: (art: ArticleItem) =>
      art.tags.some((t) => /core web vitals/i.test(t)) || /core web vitals/i.test(art.title),
  },
  {
    id: 'metrics-kpis',
    label: 'Metrics & KPIs',
    match: (art: ArticleItem) =>
      art.tags.some((t) => /metrics|kpis|roi|measur/i.test(t)) ||
      /metrics|measuring/i.test(art.title),
  },
  {
    id: 'b2b-growth',
    label: 'B2B & Tech',
    match: (art: ArticleItem) =>
      art.tags.some((t) => /b2b|saas|technology companies|startup|pipeline/i.test(t)) ||
      /b2b|technology companies/i.test(art.title),
  },
];

export default function ArticleFilter({ articles, allTags }: Props) {
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Sync state from URL parameters on initial client mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const tagParam = params.get('tag');
    const qParam = params.get('q');
    const pageParam = params.get('page');

    if (tagParam) {
      const isValidCore = CORE_TOPICS.some((t) => t.id === tagParam);
      const isValidTag = allTags.some((t) => t.toLowerCase() === tagParam.toLowerCase());
      if (tagParam === 'all' || isValidCore || isValidTag) {
        setSelectedTag(tagParam);
      }
    }
    if (qParam) {
      setSearchQuery(qParam);
    }
    if (pageParam) {
      const p = parseInt(pageParam, 10);
      if (!isNaN(p) && p > 0) {
        setCurrentPage(p);
      }
    }
  }, [allTags]);

  const isSpecificTag =
    selectedTag !== 'all' && !CORE_TOPICS.some((t) => t.id === selectedTag);

  // 1. Filter articles based on core topics or specific granular tags + text query
  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      let matchesTag = true;
      if (selectedTag === 'all') {
        matchesTag = true;
      } else {
        const topic = CORE_TOPICS.find((t) => t.id === selectedTag);
        if (topic) {
          matchesTag = topic.match(art);
        } else {
          matchesTag = art.tags.some(
            (t) => t.toLowerCase() === selectedTag.toLowerCase()
          );
        }
      }

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        art.title.toLowerCase().includes(q) ||
        art.description.toLowerCase().includes(q) ||
        art.tags.some((t) => t.toLowerCase().includes(q)) ||
        art.quickAnswer.toLowerCase().includes(q);

      return matchesTag && matchesSearch;
    });
  }, [articles, selectedTag, searchQuery]);

  // 2. Pagination calculations
  const totalItems = filteredArticles.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  // Sync URL query string when filters or page change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (selectedTag !== 'all') params.set('tag', selectedTag);
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (validCurrentPage > 1) params.set('page', validCurrentPage.toString());

    const queryString = params.toString();
    const newUrl = `${window.location.pathname}${queryString ? '?' + queryString : ''}`;
    window.history.replaceState(null, '', newUrl);
  }, [selectedTag, searchQuery, validCurrentPage]);

  // Reset to page 1 whenever filters change
  const handleTagChange = (tag: string) => {
    setSelectedTag(tag);
    setCurrentPage(1);
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSelectedTag('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === validCurrentPage) return;
    setCurrentPage(page);
    const container = document.getElementById('articles-list-top');
    if (container) {
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Generate pagination numbers with ellipsis (e.g. [1, '...', 4, 5, 6, '...', 12])
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (validCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (validCurrentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', validCurrentPage - 1, validCurrentPage, validCurrentPage + 1, '...', totalPages];
  }, [totalPages, validCurrentPage]);

  const startItem = totalItems === 0 ? 0 : (validCurrentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(validCurrentPage * ITEMS_PER_PAGE, totalItems);

  return (
    <div id="articles-list-top">
      {/* Search & Tag Filter Controls */}
      <div className="mb-8 space-y-4">
        {/* Row 1: Search Input & Granular Specific Tag Dropdown */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Prominent Search Input */}
          <div className="relative w-full sm:max-w-md">
            <input
              type="text"
              placeholder="Search publications, topics, or keywords..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-xl border border-brand-border bg-brand-card px-4 py-2.5 pl-10 pr-9 text-xs sm:text-sm text-brand-text placeholder-brand-text-dim focus:border-brand-accent focus:ring-1 focus:ring-brand-accent focus:outline-none transition-all shadow-xs"
              aria-label="Search all publications"
            />
            <svg
              className="absolute left-3.5 top-3 h-4 w-4 text-brand-text-dim"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-2.5 text-brand-text-dim hover:text-brand-text text-sm p-0.5 rounded cursor-pointer transition-colors"
                aria-label="Clear search"
              >
                &times;
              </button>
            )}
          </div>

          {/* Granular Tag Selector & Reset */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <div className="relative">
              <select
                aria-label="Filter by granular topic tag"
                value={isSpecificTag ? selectedTag : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    handleTagChange(e.target.value);
                  }
                }}
                className="rounded-lg border border-brand-border bg-brand-surface py-2 pl-3 pr-7 text-xs text-brand-text-muted hover:text-brand-text hover:border-brand-border-hover focus:border-brand-accent focus:outline-none cursor-pointer transition-colors"
              >
                <option value="">Specific Tag / Keyword ({allTags.length})...</option>
                {allTags.slice().sort().map((t) => (
                  <option key={t} value={t}>
                    #{t}
                  </option>
                ))}
              </select>
            </div>

            {(selectedTag !== 'all' || searchQuery) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 rounded-lg border border-brand-border bg-brand-card px-3 py-2 text-xs font-semibold text-brand-accent hover:bg-brand-surface hover:border-brand-border-hover transition-colors shadow-xs cursor-pointer"
              >
                <span>Reset</span>
                <span>&times;</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Clean Core Topic Pills */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1">
          {CORE_TOPICS.map((topic) => {
            const isCurrent = selectedTag === topic.id;
            const count = topic.id === 'all'
              ? articles.length
              : articles.filter(topic.match).length;

            return (
              <button
                key={topic.id}
                type="button"
                onClick={() => handleTagChange(topic.id)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all border cursor-pointer ${
                  isCurrent
                    ? 'bg-brand-accent text-white font-semibold border-brand-accent shadow-xs'
                    : 'bg-brand-surface text-brand-text-muted hover:text-brand-text hover:bg-brand-panel border-brand-border'
                }`}
              >
                {topic.label} <span className="text-[10px] ml-1 opacity-75">({count})</span>
              </button>
            );
          })}

          {/* Active Specific Tag Pill (if picked from select dropdown or tag click) */}
          {isSpecificTag && (
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-brand-accent px-3 py-1.5 text-xs font-semibold text-white shadow-xs">
              <span>#{selectedTag}</span>
              <button
                type="button"
                onClick={() => handleTagChange('all')}
                className="hover:opacity-75 text-sm leading-none cursor-pointer"
                aria-label="Remove active tag filter"
              >
                &times;
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Result Status & Counter Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-xs text-brand-text-dim border-b border-brand-border/60 pb-3 font-mono">
        <div>
          {totalItems > 0 ? (
            <span>
              Showing <strong className="text-brand-text">{startItem}–{endItem}</strong> of{' '}
              <strong className="text-brand-text">{totalItems}</strong> publications
              {selectedTag !== 'all' && (
                <span>
                  {' '}in{' '}
                  <span className="text-brand-accent font-semibold">
                    {CORE_TOPICS.find((t) => t.id === selectedTag)?.label || `#${selectedTag}`}
                  </span>
                </span>
              )}
              {searchQuery && <span> matching "<span className="text-brand-accent">{searchQuery}</span>"</span>}
            </span>
          ) : (
            <span>No publications found</span>
          )}
        </div>
        {(searchQuery || selectedTag !== 'all') && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-[11px] text-brand-accent hover:underline font-semibold cursor-pointer"
          >
            Clear all filters &rarr;
          </button>
        )}
      </div>

      {/* Articles Grid */}
      {filteredArticles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-brand-border bg-brand-surface p-12 text-center text-xs text-brand-text-muted">
          <p className="font-semibold text-brand-text mb-2 text-sm">No publications match your criteria.</p>
          <p className="mb-4 text-brand-text-dim">Try adjusting your search terms or clearing the active tag filter.</p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="rounded-md bg-brand-accent px-4 py-2 text-xs font-semibold text-brand-bg shadow-xs hover:bg-brand-accent-hover transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map((art, index) => {
            const pageStart = (validCurrentPage - 1) * ITEMS_PER_PAGE;
            const isOnCurrentPage = index >= pageStart && index < pageStart + ITEMS_PER_PAGE;
            const safeImg = art.coverImage
              ? art.coverImage.startsWith('http') || art.coverImage.startsWith('/')
                ? art.coverImage
                : `/${art.coverImage}`
              : null;

            return (
              <article
                key={art.slug}
                hidden={!isOnCurrentPage}
                className={
                  isOnCurrentPage
                    ? 'minimal-card group flex flex-col justify-between overflow-hidden'
                    : 'hidden'
                }
              >
                {safeImg && (
                  <a
                    href={`/articles/${art.slug}/`}
                    className="block overflow-hidden border-b border-brand-border bg-brand-surface aspect-video relative focus:outline-none"
                  >
                    <img
                      src={safeImg}
                      alt={art.coverAlt || art.title}
                      width="600"
                      height="338"
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute top-3 right-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleTagChange(art.tags[0]);
                        }}
                        className="font-mono text-[10px] text-brand-accent bg-brand-bg/90 backdrop-blur-xs px-2 py-0.5 rounded border border-brand-border font-semibold shadow-xs hover:border-brand-accent hover:bg-brand-bg transition-colors cursor-pointer"
                        title={`Filter by #${art.tags[0]}`}
                      >
                        #{art.tags[0] || 'Guide'}
                      </button>
                    </div>
                  </a>
                )}

                <div className="p-6 sm:p-7 flex flex-col justify-between flex-1">
                  <div>
                    {!safeImg && (
                      <div className="flex items-center gap-2 text-xs text-brand-text-dim mb-3 font-mono">
                        <time>{art.publishDate}</time>
                        <span>&bull;</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleTagChange(art.tags[0]);
                          }}
                          className="text-brand-accent font-semibold hover:underline cursor-pointer"
                          title={`Filter by #${art.tags[0]}`}
                        >
                          #{art.tags[0] || 'Guide'}
                        </button>
                      </div>
                    )}

                    {safeImg && (
                      <div className="flex items-center gap-2 text-[11px] text-brand-text-dim mb-2.5 font-mono">
                        <time>{art.publishDate}</time>
                        <span>&bull;</span>
                        <span>By {art.author}</span>
                      </div>
                    )}

                    <h2 className="font-display text-base sm:text-lg font-bold text-brand-text group-hover:text-brand-accent transition-colors leading-snug">
                      <a href={`/articles/${art.slug}/`} className="hover:underline">
                        {art.title}
                      </a>
                    </h2>

                    <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-brand-text-muted line-clamp-2">
                      {art.description}
                    </p>

                    <div className="mt-4 rounded-md border border-brand-border bg-brand-surface p-3 text-xs text-brand-text-muted">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-brand-accent block mb-1 font-semibold">Key Takeaway</span>
                      <p className="font-editorial italic line-clamp-2 text-brand-text font-normal">"{art.quickAnswer}"</p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-brand-border pt-4 text-xs">
                    <span className="text-brand-text-dim font-mono text-[11px]">By {art.author}</span>
                    <a
                      href={`/articles/${art.slug}/`}
                      className="font-semibold text-brand-accent inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>Read Guide</span>
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <nav
          className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-brand-border pt-8 sm:flex-row"
          aria-label="Pagination Navigation"
        >
          {/* Previous Page Link */}
          <a
            href={validCurrentPage > 2 ? `/articles/?page=${validCurrentPage - 1}` : '/articles/'}
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(validCurrentPage - 1);
            }}
            aria-disabled={validCurrentPage === 1}
            className={`inline-flex items-center gap-1.5 rounded-lg border border-brand-border bg-brand-card px-4 py-2 font-mono text-xs font-medium text-brand-text transition-all hover:border-brand-border-hover hover:bg-brand-surface cursor-pointer ${
              validCurrentPage === 1 ? 'opacity-30 pointer-events-none' : ''
            }`}
            aria-label="Go to previous page"
          >
            <span>&larr;</span>
            <span>Previous</span>
          </a>

          {/* Page Numbers */}
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {pageNumbers.map((num, i) => {
              if (num === '...') {
                return (
                  <span
                    key={`ellipsis-${i}`}
                    className="flex h-9 w-7 items-center justify-center font-mono text-xs text-brand-text-dim select-none"
                  >
                    &hellip;
                  </span>
                );
              }
              const pageNum = num as number;
              const isCurrent = pageNum === validCurrentPage;
              return (
                <a
                  key={`page-${pageNum}`}
                  href={pageNum > 1 ? `/articles/?page=${pageNum}` : '/articles/'}
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(pageNum);
                  }}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={`inline-flex items-center justify-center h-9 min-w-[2.25rem] px-2.5 rounded-lg font-mono text-xs font-semibold transition-all border cursor-pointer ${
                    isCurrent
                      ? 'border-brand-accent bg-brand-accent text-brand-bg shadow-xs'
                      : 'border-brand-border bg-brand-card text-brand-text-muted hover:border-brand-border-hover hover:bg-brand-surface hover:text-brand-text'
                  }`}
                >
                  {pageNum}
                </a>
              );
            })}
          </div>

          {/* Next Page Link */}
          <a
            href={validCurrentPage < totalPages ? `/articles/?page=${validCurrentPage + 1}` : `/articles/?page=${totalPages}`}
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(validCurrentPage + 1);
            }}
            aria-disabled={validCurrentPage === totalPages}
            className={`inline-flex items-center gap-1.5 rounded-lg border border-brand-border bg-brand-card px-4 py-2 font-mono text-xs font-medium text-brand-text transition-all hover:border-brand-border-hover hover:bg-brand-surface cursor-pointer ${
              validCurrentPage === totalPages ? 'opacity-30 pointer-events-none' : ''
            }`}
            aria-label="Go to next page"
          >
            <span>Next</span>
            <span>&rarr;</span>
          </a>
        </nav>
      )}
    </div>
  );
}
