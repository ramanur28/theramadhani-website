<?php
/**
 * Template Name: Service - SEO Workflow
 * 
 * In-depth Dual Workflow Execution Roadmap (30-Day Sprint & 90-Day Cycle)
 * @package TheRamadhani
 */
if (!defined('ABSPATH')) exit;

get_header();

$breadcrumbs = array(
    'Services' => home_url('/services/seo/'),
    'Technical & Organic SEO' => home_url('/services/seo/'),
    'SEO Service Workflow' => ''
);
?>

<div class="py-12 sm:py-16">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-16">
        
        <!-- Breadcrumbs & Hero -->
        <div>
            <?php theramadhani_render_breadcrumbs($breadcrumbs); ?>
            <div class="max-w-3xl space-y-4">
                <div class="inline-flex items-center gap-2 rounded-full border border-brand-accent/30 bg-brand-surface px-3.5 py-1 text-xs font-mono font-semibold text-brand-accent">
                    SOP &bull; Dual Execution Models
                </div>
                <h1 class="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-brand-text leading-tight">
                    SEO Service Workflow: 30-Day Sprint &amp; 3-Month Growth Engine.
                </h1>
                <p class="text-sm sm:text-base text-brand-text-muted leading-relaxed">
                    A structured engineering framework aligning in-depth technical audits, commercial intent keyword architecture, Core Web Vitals speed acceleration, and measurable lead conversion funnels.
                </p>
            </div>
        </div>

        <!-- Executive Overview -->
        <section class="rounded-2xl border border-brand-accent/30 bg-brand-surface p-8 sm:p-10 shadow-sm">
            <div class="flex items-center gap-2 mb-3">
                <span class="h-2 w-2 rounded-full bg-brand-accent animate-pulse"></span>
                <span class="font-mono text-xs font-semibold text-brand-accent uppercase tracking-wider">
                    Standard Operating Procedure
                </span>
            </div>
            <h2 class="font-display text-2xl sm:text-3xl font-bold tracking-tight text-brand-text mb-4">
                Connecting Search Visibility Directly to Inbound Commercial Revenue
            </h2>
            <p class="text-xs sm:text-sm text-brand-text-muted leading-relaxed mb-6">
                The Ramadhani's SEO workflow combines technical crawling hygiene, Core Web Vitals acceleration, commercial intent architecture, and conversion rate optimization (CRO) so that every organic visitor is guided toward becoming an active lead.
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-brand-border">
                <a href="#workflow-30-day" class="p-4 rounded-xl bg-brand-card border border-brand-border hover:border-brand-accent transition-colors block">
                    <span class="font-mono text-xs font-bold text-brand-accent block mb-1">Option 1: 30-Day Intensive Sprint &rarr;</span>
                    <span class="text-xs text-brand-text-muted">Technical Audit, Index Fixes, Core Web Vitals Speed, High-Converting Article Architecture.</span>
                </a>
                <a href="#workflow-90-day" class="p-4 rounded-xl bg-brand-card border border-brand-border hover:border-brand-accent transition-colors block">
                    <span class="font-mono text-xs font-bold text-brand-accent block mb-1">Option 2: 90-Day (3-Month) Growth Engine &rarr;</span>
                    <span class="text-xs text-brand-text-muted">End-to-End Validation, Topic Cluster Domination, CRO A/B Testing, Multi-Channel Lead Scaling.</span>
                </a>
            </div>
        </section>

        <!-- SECTION 1: WORKFLOW 30-DAY SPRINT -->
        <section id="workflow-30-day" class="minimal-card p-8 sm:p-10 scroll-mt-20">
            <div class="flex items-center gap-2.5 mb-2">
                <span class="h-2.5 w-2.5 rounded-full bg-brand-accent"></span>
                <span class="font-mono text-xs font-bold text-brand-accent uppercase tracking-wider">Option 1</span>
            </div>
            <h2 class="font-display text-2xl sm:text-3xl font-bold tracking-tight text-brand-text mb-4">
                30-Day Intensive Sprint: Foundation, In-Depth Audit &amp; Quick-Wins
            </h2>
            <p class="text-xs sm:text-sm text-brand-text-muted leading-relaxed mb-8">
                Designed for businesses with an existing website facing ranking drops, technical debt, or traffic that fails to convert. Within 4 weeks, we overhaul foundational technical blockers and deploy high-converting article templates.
            </p>

            <div class="space-y-6">
                <!-- Week 1 -->
                <div class="rounded-xl border border-brand-border bg-brand-surface p-6">
                    <div class="flex items-center justify-between mb-2">
                        <span class="font-mono text-xs font-bold text-brand-accent">Week 1 (Days 1–7)</span>
                        <span class="font-mono text-[10px] bg-brand-accent/10 text-brand-accent px-2 py-0.5 rounded">Discovery &amp; Telemetry</span>
                    </div>
                    <h3 class="font-display text-base font-bold text-brand-text mb-2">Deep Infrastructure Audit &amp; Tracking Setup</h3>
                    <ul class="space-y-1.5 text-xs text-brand-text-muted">
                        <li>&bull; <strong>Crawlability &amp; Indexation:</strong> Inspect robots.txt, canonical loops, sitemaps, 404s, and 301 redirect chains.</li>
                        <li>&bull; <strong>Conversion Telemetry:</strong> Verify GA4 and GTM events for phone calls, contact forms, and WhatsApp inquiries.</li>
                        <li>&bull; <strong>Search Console Benchmarks:</strong> Identify low-hanging fruit keywords ranking between positions 4 and 15.</li>
                    </ul>
                </div>

                <!-- Week 2 -->
                <div class="rounded-xl border border-brand-border bg-brand-surface p-6">
                    <div class="flex items-center justify-between mb-2">
                        <span class="font-mono text-xs font-bold text-brand-accent">Week 2 (Days 8–14)</span>
                        <span class="font-mono text-[10px] bg-brand-accent/10 text-brand-accent px-2 py-0.5 rounded">Speed &amp; CWV</span>
                    </div>
                    <h3 class="font-display text-base font-bold text-brand-text mb-2">Sub-Second Core Web Vitals Remediation</h3>
                    <ul class="space-y-1.5 text-xs text-brand-text-muted">
                        <li>&bull; <strong>LCP Optimization:</strong> Responsive modern WebP/AVIF images, image preloading, critical CSS inlining.</li>
                        <li>&bull; <strong>CLS Elimination:</strong> Explicit width/height attributes on dynamic elements and ad containers.</li>
                        <li>&bull; <strong>Server Latency Tuning:</strong> Aggressive LiteSpeed/Nginx caching and compression directives.</li>
                    </ul>
                </div>

                <!-- Week 3 -->
                <div class="rounded-xl border border-brand-border bg-brand-surface p-6">
                    <div class="flex items-center justify-between mb-2">
                        <span class="font-mono text-xs font-bold text-brand-accent">Week 3 (Days 15–21)</span>
                        <span class="font-mono text-[10px] bg-brand-accent/10 text-brand-accent px-2 py-0.5 rounded">CRO &amp; Funnels</span>
                    </div>
                    <h3 class="font-display text-base font-bold text-brand-text mb-2">Article-to-Lead Architecture Deployment</h3>
                    <ul class="space-y-1.5 text-xs text-brand-text-muted">
                        <li>&bull; <strong>In-Article Conversion Hooks:</strong> Dynamic quote triggers, pricing calculators, and direct answer summaries.</li>
                        <li>&bull; <strong>Commercial Landing Page Redesign:</strong> Frictionless quote request forms with mobile tap-to-call integrations.</li>
                        <li>&bull; <strong>On-Page Commercial Realignment:</strong> Rewriting title tags and H1-H3 headers for transactional buyer queries.</li>
                    </ul>
                </div>

                <!-- Week 4 -->
                <div class="rounded-xl border border-brand-border bg-brand-surface p-6">
                    <div class="flex items-center justify-between mb-2">
                        <span class="font-mono text-xs font-bold text-brand-accent">Week 4 (Days 22–30)</span>
                        <span class="font-mono text-[10px] bg-brand-accent/10 text-brand-accent px-2 py-0.5 rounded">Schema &amp; Review</span>
                    </div>
                    <h3 class="font-display text-base font-bold text-brand-text mb-2">Schema Knowledge Graph &amp; Handover</h3>
                    <ul class="space-y-1.5 text-xs text-brand-text-muted">
                        <li>&bull; <strong>JSON-LD Knowledge Graph:</strong> Interconnected Organization, LocalBusiness, Service, and FAQ schemas.</li>
                        <li>&bull; <strong>Executive Sprint Review:</strong> Comprehensive report benchmarking Core Web Vitals and initial lead responses.</li>
                    </ul>
                </div>
            </div>
        </section>

        <!-- SECTION 2: WORKFLOW 90-DAY (3-MONTH) GROWTH ENGINE -->
        <section id="workflow-90-day" class="minimal-card p-8 sm:p-10 scroll-mt-20">
            <div class="flex items-center gap-2.5 mb-2">
                <span class="h-2.5 w-2.5 rounded-full bg-brand-accent"></span>
                <span class="font-mono text-xs font-bold text-brand-accent uppercase tracking-wider">Option 2</span>
            </div>
            <h2 class="font-display text-2xl sm:text-3xl font-bold tracking-tight text-brand-text mb-4">
                3-Month Growth Engine: Hypothesis Validation &amp; Lead Scalability
            </h2>
            <p class="text-xs sm:text-sm text-brand-text-muted leading-relaxed mb-8">
                A continuous quarterly growth engagement executing end-to-end commercial topical authority, conversion rate testing, and aggressive market capture.
            </p>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Month 1 -->
                <div class="rounded-xl border border-brand-border bg-brand-surface p-6">
                    <span class="font-mono text-xs font-bold text-brand-accent block mb-1">Month 1 (Days 1–30)</span>
                    <h3 class="font-display text-base font-bold text-brand-text mb-3">Audit, Setup &amp; Quick Wins</h3>
                    <p class="text-xs text-brand-text-muted leading-relaxed mb-4">
                        Fixing all technical bottlenecks, establishing verified conversion telemetry, and deploying instant-win CRO upgrades on existing traffic.
                    </p>
                    <ul class="space-y-1.5 text-[11px] text-brand-text-dim">
                        <li>&bull; Full Technical Audit Report</li>
                        <li>&bull; Core Web Vitals Resolution</li>
                        <li>&bull; On-Page Intent Optimization</li>
                    </ul>
                </div>

                <!-- Month 2 -->
                <div class="rounded-xl border border-brand-border bg-brand-surface p-6">
                    <span class="font-mono text-xs font-bold text-brand-accent block mb-1">Month 2 (Days 31–60)</span>
                    <h3 class="font-display text-base font-bold text-brand-text mb-3">Topic Clusters &amp; Conversion Funnels</h3>
                    <p class="text-xs text-brand-text-muted leading-relaxed mb-4">
                        Publishing high-intent commercial content pillars, designing lead capture widgets, and building internal silo link equity.
                    </p>
                    <ul class="space-y-1.5 text-[11px] text-brand-text-dim">
                        <li>&bull; Commercial Cluster Deployment</li>
                        <li>&bull; In-Article Quote Magnets</li>
                        <li>&bull; Internal Link Silo Blueprints</li>
                    </ul>
                </div>

                <!-- Month 3 -->
                <div class="rounded-xl border border-brand-border bg-brand-surface p-6">
                    <span class="font-mono text-xs font-bold text-brand-accent block mb-1">Month 3 (Days 61–90)</span>
                    <h3 class="font-display text-base font-bold text-brand-text mb-3">CRO Testing &amp; Scaling</h3>
                    <p class="text-xs text-brand-text-muted leading-relaxed mb-4">
                        A/B testing call-to-action copy, optimizing for Google AI Overviews citations, and scaling inbound deal volume.
                    </p>
                    <ul class="space-y-1.5 text-[11px] text-brand-text-dim">
                        <li>&bull; CTA Copy A/B Testing</li>
                        <li>&bull; AI Overview Citation Telemetry</li>
                        <li>&bull; Executive ROI Reconciliation</li>
                    </ul>
                </div>
            </div>
        </section>

        <!-- Final CTA Banner -->
        <section class="minimal-card p-8 sm:p-12 text-center bg-brand-surface/80 border border-brand-accent/20">
            <h3 class="font-display text-2xl font-bold text-brand-text mb-3">
                Ready to Implement This Workflow For Your Business?
            </h3>
            <p class="text-xs sm:text-sm text-brand-text-muted max-w-lg mx-auto mb-6">
                Schedule a confidential consultation to determine whether the 30-Day Sprint or 90-Day Growth Engine is the ideal fit for your goals.
            </p>
            <a href="<?php echo esc_url(home_url('/contact/')); ?>" class="btn-primary text-xs py-3 px-6 shadow-md inline-flex items-center gap-2">
                <span>Schedule Workflow Consultation &rarr;</span>
            </a>
        </section>

    </div>
</div>

<?php get_footer(); ?>
