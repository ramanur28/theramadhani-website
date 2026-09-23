import { useState, useMemo } from 'react';

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

export default function ArticleFilter({ articles, allTags }: Props) {
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      const matchesTag = selectedTag === 'all' || art.tags.includes(selectedTag);
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        q === '' ||
        art.title.toLowerCase().includes(q) ||
        art.description.toLowerCase().includes(q) ||
        art.tags.some((t) => t.toLowerCase().includes(q));
      return matchesTag && matchesSearch;
    });
  }, [articles, selectedTag, searchQuery]);

  return (
    <div>
      {/* Search & Tag Filter Controls */}
      <div className="mb-12 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs">
          <input
            type="text"
            placeholder="Filter publications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-brand-border bg-brand-card px-3.5 py-2 pl-9 text-xs text-brand-text placeholder-brand-text-dim focus:border-brand-accent focus:outline-none"
            aria-label="Filter guides"
          />
          <svg
            className="absolute left-3 top-2.5 h-3.5 w-3.5 text-brand-text-dim"
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
        </div>

        {/* Tag Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedTag('all')}
            className={`rounded-md px-3 py-1.5 font-mono text-[11px] transition-colors border ${
              selectedTag === 'all'
                ? 'bg-brand-accent text-brand-bg font-semibold border-brand-accent shadow-sm'
                : 'bg-brand-surface text-brand-text-muted hover:text-brand-text border-brand-border'
            }`}
          >
            All ({articles.length})
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              className={`rounded-md px-3 py-1.5 font-mono text-[11px] transition-colors border ${
                selectedTag === tag
                  ? 'bg-brand-accent text-brand-bg font-semibold border-brand-accent shadow-sm'
                  : 'bg-brand-surface text-brand-text-muted hover:text-brand-text border-brand-border'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      {filteredArticles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-brand-border bg-brand-surface p-12 text-center text-xs text-brand-text-muted">
          No publications match the selected query.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map((art) => {
            const safeImg = art.coverImage
              ? art.coverImage.startsWith('http') || art.coverImage.startsWith('/')
                ? art.coverImage
                : `/${art.coverImage}`
              : null;

            return (
              <article key={art.slug} className="minimal-card group flex flex-col justify-between overflow-hidden">
                {safeImg && (
                  <a
                    href={`/articles/${art.slug}`}
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
                      <span className="font-mono text-[10px] text-brand-accent bg-brand-bg/90 backdrop-blur-xs px-2 py-0.5 rounded border border-brand-border font-semibold shadow-xs">
                        #{art.tags[0] || 'Guide'}
                      </span>
                    </div>
                  </a>
                )}

                <div className="p-6 sm:p-7 flex flex-col justify-between flex-1">
                  <div>
                    {!safeImg && (
                      <div className="flex items-center gap-2 text-xs text-brand-text-dim mb-3 font-mono">
                        <time>{art.publishDate}</time>
                        <span>&bull;</span>
                        <span className="text-brand-accent font-semibold">#{art.tags[0] || 'Guide'}</span>
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
                      <a href={`/articles/${art.slug}`} className="hover:underline">
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
                      href={`/articles/${art.slug}`}
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
    </div>
  );
}
