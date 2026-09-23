import { useState, useMemo } from 'react';

export interface WorkItem {
  id: string;
  slug: string;
  title: string;
  client: string;
  industry: string;
  service: string;
  description: string;
  publishDate: string;
  metrics: { value: string; label: string }[];
  quickAnswer: string;
  techStack: string[];
  coverImage?: string;
  coverAlt?: string;
}

interface Props {
  workItems: WorkItem[];
  allServices: string[];
}

export default function WorkFilter({ workItems, allServices }: Props) {
  const [selectedService, setSelectedService] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredItems = useMemo(() => {
    return workItems.filter((item) => {
      const matchesService =
        selectedService === 'all' ||
        item.service.toLowerCase().includes(selectedService.toLowerCase());
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        q === '' ||
        item.title.toLowerCase().includes(q) ||
        item.client.toLowerCase().includes(q) ||
        item.industry.toLowerCase().includes(q) ||
        item.service.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.techStack.some((t) => t.toLowerCase().includes(q));
      return matchesService && matchesSearch;
    });
  }, [workItems, selectedService, searchQuery]);

  return (
    <div>
      {/* Search & Service Filter Tabs */}
      <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs">
          <input
            type="text"
            placeholder="Search projects & case studies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-brand-border bg-brand-card px-3.5 py-2 pl-9 text-xs text-brand-text placeholder-brand-text-dim focus:border-brand-accent focus:outline-none"
            aria-label="Filter case studies"
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

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedService('all')}
            className={`rounded-md px-3 py-1.5 font-mono text-[11px] transition-colors border ${
              selectedService === 'all'
                ? 'bg-brand-accent text-brand-bg font-semibold border-brand-accent shadow-sm'
                : 'bg-brand-surface text-brand-text-muted hover:text-brand-text border-brand-border'
            }`}
          >
            All Work ({workItems.length})
          </button>
          {allServices.map((svc) => (
            <button
              key={svc}
              type="button"
              onClick={() => setSelectedService(svc)}
              className={`rounded-md px-3 py-1.5 font-mono text-[11px] transition-colors border ${
                selectedService === svc
                  ? 'bg-brand-accent text-brand-bg font-semibold border-brand-accent shadow-sm'
                  : 'bg-brand-surface text-brand-text-muted hover:text-brand-text border-brand-border'
              }`}
            >
              {svc}
            </button>
          ))}
        </div>
      </div>

      {/* Case Studies Grid */}
      {filteredItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-brand-border bg-brand-surface p-12 text-center text-xs text-brand-text-muted">
          No case studies match the selected query.
        </div>
      ) : (
        <div className="space-y-8">
          {filteredItems.map((study) => {
            const safeImg = study.coverImage
              ? (study.coverImage.startsWith('http') || study.coverImage.startsWith('/')
                  ? study.coverImage
                  : `/${study.coverImage}`)
              : null;

            return (
              <div key={study.slug} className="minimal-card p-7 sm:p-9 group overflow-hidden">
                {safeImg && (
                  <div className="mb-6 overflow-hidden rounded-xl border border-brand-border bg-brand-surface aspect-video max-h-64">
                    <img
                      src={safeImg}
                      alt={study.coverAlt || study.title}
                      width="800"
                      height="450"
                      className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Top Row: Service, Industry & Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-brand-border pb-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-mono text-xs font-semibold text-brand-accent bg-brand-accent/10 px-2 py-0.5 rounded">
                        {study.service}
                      </span>
                      <span className="font-mono text-xs text-brand-text-dim">
                        &bull; Industry: {study.industry}
                      </span>
                    </div>
                    <h2 className="font-display text-xl sm:text-2xl font-bold text-brand-text group-hover:text-brand-accent transition-colors">
                      <a href={`/work/${study.slug}`} className="hover:underline">
                        {study.title}
                      </a>
                    </h2>
                    <p className="text-xs text-brand-text-dim mt-1 font-medium">
                      Client: <span className="text-brand-text font-semibold">{study.client}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                    <a
                      href={`/work/${study.slug}`}
                      className="btn-primary text-xs py-2 px-3.5"
                    >
                      <span>Read Case Study</span>
                      <span className="ml-1" aria-hidden="true">&rarr;</span>
                    </a>
                  </div>
                </div>

                {/* 3 Metrics Highlights */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {study.metrics.map((res, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl bg-brand-surface p-4 border border-brand-border text-center sm:text-left"
                    >
                      <div className="font-mono text-2xl sm:text-3xl font-extrabold text-brand-text">
                        {res.value}
                      </div>
                      <div className="mt-1 text-xs text-brand-accent font-semibold">
                        {res.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Executive Summary & Tech Stack Footer */}
                <div className="mt-6 rounded-xl bg-brand-surface p-5 border border-brand-border">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-brand-accent font-semibold block mb-1">
                    Strategy &amp; Impact
                  </span>
                  <p className="text-xs sm:text-sm leading-relaxed text-brand-text-muted">
                    {study.quickAnswer}
                  </p>

                  {study.techStack && study.techStack.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-brand-border/60 flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[10px] text-brand-text-dim uppercase mr-1">
                        Tooling:
                      </span>
                      {study.techStack.map((tech) => (
                        <span
                          key={tech}
                          className="font-mono text-[11px] text-brand-text-muted bg-brand-card px-2 py-0.5 rounded border border-brand-border"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
