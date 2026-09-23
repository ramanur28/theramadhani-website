import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface PlatformMetric {
  id: string;
  name: string;
  category: string;
  metric: string;
  delta: string;
  groundingStatus: string;
}

const platforms: PlatformMetric[] = [
  { id: 'geo', name: 'Google AI Overviews', category: 'Generative Engine', metric: '94% Citation Rate', delta: 'Top 3 Grounding Source', groundingStatus: 'Verified Entity' },
  { id: 'perplexity', name: 'Perplexity Pro', category: 'AI Answer Engine', metric: '98% Citation Inclusion', delta: 'Primary Domain Reference', groundingStatus: 'High Trust Schema' },
  { id: 'seo', name: 'Google Organic Search', category: 'Traditional Search', metric: '100% Core Web Vitals', delta: '#1-#3 Pos Ranking', groundingStatus: 'Sub-Second LCP' },
  { id: 'ads', name: 'Google Ads Search', category: 'Paid Acquisition', metric: '4.8x Average ROAS', delta: '-34% Cost Per Acquisition', groundingStatus: 'Smart Value Bidding' },
];

export default function HeroInteractive() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardContentRef = useRef<HTMLDivElement>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !containerRef.current) return;

    // Smooth Entrance Animation
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 24, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 1.1, ease: 'power3.out' }
    );

    // Auto slide timer
    const interval = setInterval(() => {
      setSelectedIdx((prev) => (prev + 1) % platforms.length);
    }, 4500);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Animate content change smoothly on tab switch
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !cardContentRef.current) return;

    gsap.fromTo(
      cardContentRef.current,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.65, ease: 'power2.out' }
    );
  }, [selectedIdx]);

  const active = platforms[selectedIdx];

  return (
    <div
      ref={containerRef}
      className="minimal-card rounded-2xl p-6 sm:p-7 bg-brand-card border border-brand-border shadow-lg"
    >
      {/* Top Status Header */}
      <div className="flex items-center justify-between border-b border-brand-border pb-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-accent"></span>
          </span>
          <span className="font-mono text-xs font-semibold text-brand-text">
            Search &amp; AI Engine Telemetry
          </span>
        </div>
        <span className="font-mono text-[11px] text-brand-text-dim font-medium bg-brand-surface px-2 py-0.5 rounded border border-brand-border/60">
          Live Diagnostic
        </span>
      </div>

      {/* Navigation selector */}
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {platforms.map((p, idx) => {
          const isSelected = idx === selectedIdx;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedIdx(idx)}
              className={`rounded-lg px-2.5 py-2.5 text-left transition-all duration-300 border ${
                isSelected
                  ? 'bg-brand-accent text-white font-semibold border-brand-accent shadow-md translate-y-[-1px]'
                  : 'bg-brand-surface text-brand-text-muted hover:text-brand-text border-brand-border hover:bg-brand-panel'
              }`}
            >
              <div className="truncate text-xs">{p.name}</div>
            </button>
          );
        })}
      </div>

      {/* Active Metrics Display with Animated Container */}
      <div
        ref={cardContentRef}
        className="mt-6 rounded-xl border border-brand-border bg-brand-surface p-5.5 transition-colors duration-400"
      >
        <div className="flex items-center justify-between text-xs text-brand-text-dim">
          <span>Optimization Benchmark</span>
          <span className="font-mono font-semibold text-brand-accent bg-brand-accent/10 px-2 py-0.5 rounded border border-brand-accent/20">
            {active.category}
          </span>
        </div>

        <div className="mt-3.5">
          <div className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-brand-text">
            {active.metric}
          </div>
          <div className="mt-1 text-xs text-brand-text-muted font-medium">
            {active.delta}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-brand-border pt-3.5 text-[11px]">
          <span className="text-brand-text-dim font-medium">Architecture Status:</span>
          <span className="font-mono font-semibold text-brand-text flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            {active.groundingStatus}
          </span>
        </div>
      </div>
    </div>
  );
}
