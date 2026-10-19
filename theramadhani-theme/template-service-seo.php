<?php
/**
 * Template Name: Service - SEO
 * 
 * Template for Technical SEO & Article Conversion Service
 * @package TheRamadhani
 */
if (!defined('ABSPATH')) exit;

get_header();

$breadcrumbs = array(
    'Services' => home_url('/services/seo/'),
    'Search Rankings & Article Conversion' => ''
);

$faqs = array(
    array(
        'q' => 'Why does our current search traffic produce almost zero leads?',
        'a' => 'Most SEO agencies write articles purely for search engines, attracting passive informational readers who scan and leave. Without intentional conversion architecture—such as commercial bridge blocks, dynamic estimate calculators, direct answer callouts, and multi-tier CTAs—99% of your traffic leaks away without ever contacting your business.'
    ),
    array(
        'q' => 'How does this specifically benefit Home Services and contractors?',
        'a' => 'Home Services (HVAC, Roofing, Plumbing, Remodeling, Solar) rely on customers who have immediate, high-ticket needs. When a homeowner searches for solutions, they need instant clarity, local trust proof, and effortless quote submission. We rank you for emergency and commercial intent keywords, while converting guide readers into scheduled inspections and job estimates.'
    ),
    array(
        'q' => 'We were burned by a previous SEO agency. How is your approach different?',
        'a' => 'Traditional agencies celebrate vanity metrics like impression counts, ranking for irrelevant low-intent keywords, and sending monthly PDF reports. We operate on revenue accountability: every keyword targeted must have commercial value, and every article published is engineered with conversion mechanisms to generate measurable inbound calls and form submissions.'
    ),
    array(
        'q' => 'How quickly will we see performance improvements and leads?',
        'a' => 'Conversion architecture changes on existing search traffic can start generating additional leads within 7 to 14 days of deployment. Technical Core Web Vitals fixes and indexing improvements register with Googlebot within 2 to 4 weeks, with competitive top-3 keyword rankings compounding over 60 to 90 days.'
    ),
    array(
        'q' => 'Do you implement the changes directly or just deliver audit documents?',
        'a' => 'We provide hands-on implementation: writing engineered article content, structuring JSON-LD schema graphs, optimizing frontend performance, and setting up conversion tracking directly in your codebase or CMS.'
    )
);
?>

<div class="py-12 sm:py-16">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-16">
        
        <!-- Breadcrumbs & Hero -->
        <div>
            <?php theramadhani_render_breadcrumbs($breadcrumbs); ?>
            <div class="max-w-3xl space-y-4">
                <div class="inline-flex items-center gap-2 rounded-full border border-brand-accent/30 bg-brand-surface px-3.5 py-1 text-xs font-mono font-semibold text-brand-accent">
                    Service /01 &bull; Rank + Convert
                </div>
                <h1 class="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-brand-text leading-tight">
                    Rank Top of Google. Turn Searchers &amp; Articles Into Paying Leads.
                </h1>
                <p class="text-sm sm:text-base text-brand-text-muted leading-relaxed">
                    Engineered specifically for Home Services and businesses burned by traditional agencies. I combine top-3 Google rankings with in-article conversion architecture that transforms passive readers into booked estimates.
                </p>
            </div>
        </div>

        <!-- 1. Executive Quick Answer Block -->
        <div class="rounded-xl border border-brand-accent/30 bg-brand-accent/5 p-6 sm:p-7">
            <span class="font-mono text-[11px] font-bold uppercase tracking-wider text-brand-accent block mb-2">
                Executive Summary &bull; Plain-Language Definition
            </span>
            <p class="text-xs sm:text-sm text-brand-text leading-relaxed font-editorial italic">
                "Search Rankings &amp; Article-to-Lead Conversion Engineering is a dual-focus organic growth system: First, we rank your website in Google's Top 3 for commercial-intent keywords where customers are actively looking to hire. Second, we engineer your articles and blog posts with high-converting bridge architecture—turning passive search readers into qualified inbound phone calls, quote requests, and booked jobs."
            </p>
        </div>

        <!-- 2. The Leaky Bucket Problem -->
        <section class="minimal-card p-8 sm:p-10 border-l-4 border-l-brand-accent">
            <div class="font-mono text-xs font-semibold text-brand-accent mb-2">
                The Industry Problem &bull; The Leaky Bucket
            </div>
            <h2 class="font-display text-2xl font-bold text-brand-text mb-4">
                Why Most Businesses Get Traffic But No Sales
            </h2>
            <p class="text-xs sm:text-sm text-brand-text-muted leading-relaxed mb-6">
                Most SEO agencies operate with an outdated mindset: they churn out generic 800-word blog posts, target high-volume informational keywords with zero commercial intent, and send monthly PDFs highlighting "impression growth."
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-brand-border">
                <div class="p-4 rounded-xl bg-brand-surface border border-brand-border">
                    <span class="font-mono text-xs font-bold text-rose-500 block mb-1">&times; The Traditional Agency Trap</span>
                    <p class="text-xs text-brand-text-muted leading-relaxed">
                        Chasing vanity keywords, buying toxic backlinks, and writing informational fluff that attracts students rather than customers ready to hire your services.
                    </p>
                </div>
                <div class="p-4 rounded-xl bg-brand-surface border border-brand-accent/40">
                    <span class="font-mono text-xs font-bold text-emerald-500 block mb-1">&check; The Revenue &amp; Lead Engine</span>
                    <p class="text-xs text-brand-text-muted leading-relaxed">
                        Targeting commercial buyer-intent queries, optimizing Core Web Vitals to <strong class="text-brand-text">outrank competitors</strong>, and building in-article conversion bridges that capture real customer inquiries.
                    </p>
                </div>
            </div>
        </section>

        <!-- 3. Methodology & 4 Core Pillars -->
        <section>
            <div class="max-w-xl mb-8">
                <div class="font-mono text-xs font-semibold text-brand-accent mb-2">
                    Methodology &bull; The 4 Core Pillars
                </div>
                <h2 class="font-display text-2xl font-bold tracking-tight text-brand-text">
                    How We Turn Google Search Into A Lead Machine
                </h2>
                <p class="mt-2 text-xs sm:text-sm text-brand-text-muted">
                    A systematic framework designed for high-ticket Home Services and businesses requiring dependable inbound acquisition:
                </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="rounded-xl border border-brand-border bg-brand-surface p-6">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="h-2 w-2 rounded-full bg-brand-accent"></span>
                        <span class="font-mono text-xs font-bold text-brand-text">01. Commercial-Intent Google Rankings</span>
                    </div>
                    <p class="text-xs sm:text-sm text-brand-text-muted leading-relaxed">
                        We target the exact high-value keywords customers type when ready to hire (e.g. emergency repairs, cost guides, replacement services). We eliminate wasted effort on zero-intent vanity queries.
                    </p>
                </div>

                <div class="rounded-xl border border-brand-border bg-brand-surface p-6">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="h-2 w-2 rounded-full bg-brand-accent"></span>
                        <span class="font-mono text-xs font-bold text-brand-text">02. Article-to-Lead Conversion Funnels</span>
                    </div>
                    <p class="text-xs sm:text-sm text-brand-text-muted leading-relaxed">
                        We transform articles from passive reading into interactive lead magnets: embedding instant project cost calculators, direct answer summary blocks, and frictionless quote forms directly within the text.
                    </p>
                </div>

                <div class="rounded-xl border border-brand-border bg-brand-surface p-6">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="h-2 w-2 rounded-full bg-brand-accent"></span>
                        <span class="font-mono text-xs font-bold text-brand-text">03. Sub-Second Performance &amp; CWV</span>
                    </div>
                    <p class="text-xs sm:text-sm text-brand-text-muted leading-relaxed">
                        Mobile homeowners bounce if a website takes more than 2 seconds to load. We optimize Core Web Vitals (LCP &lt; 0.8s, CLS 0.0) so your site ranks higher and visitors never drop off.
                    </p>
                </div>

                <div class="rounded-xl border border-brand-border bg-brand-surface p-6">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="h-2 w-2 rounded-full bg-brand-accent"></span>
                        <span class="font-mono text-xs font-bold text-brand-text">04. Local &amp; Entity Schema Architecture</span>
                    </div>
                    <p class="text-xs sm:text-sm text-brand-text-muted leading-relaxed">
                        Interconnected Schema.org JSON-LD graphs linking Organization, LocalBusiness, Service, and E-E-A-T credentials so Google and AI engines recognize you as the verified local authority.
                    </p>
                </div>
            </div>
        </section>

        <!-- 4. Execution Roadmap Preview -->
        <section class="minimal-card p-8 sm:p-10">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border pb-5 mb-8">
                <div>
                    <div class="font-mono text-xs font-semibold text-brand-accent mb-1">
                        Execution &bull; Dual Roadmap Options
                    </div>
                    <h2 class="font-display text-2xl font-bold text-brand-text">
                        SEO Execution Roadmap: 30-Day Sprint &amp; 3-Month Growth Engine
                    </h2>
                </div>
                <a
                    href="<?php echo esc_url(home_url('/services/seo/workflow/')); ?>"
                    class="btn-primary text-xs py-2 px-3.5 inline-flex items-center gap-1.5 self-start sm:self-auto shrink-0"
                >
                    <span>View Full Workflow Details</span>
                    <span aria-hidden="true">&rarr;</span>
                </a>
            </div>

            <p class="text-xs sm:text-sm text-brand-text-muted leading-relaxed mb-8">
                We provide two structured execution pathways tailored to your growth objectives—whether you need rapid foundational remediation (30-Day Sprint) or a continuous acquisition engine (90-Day Cycle).
            </p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="rounded-xl border border-brand-border bg-brand-surface p-6">
                    <span class="font-mono text-xs font-bold text-brand-accent block mb-2">Option A: 30-Day Intensive Sprint</span>
                    <p class="text-xs text-brand-text-muted leading-relaxed mb-4">
                        A focused, rapid deployment solving technical debt, Core Web Vitals bottlenecks, indexing errors, and establishing the high-converting article template.
                    </p>
                    <ul class="space-y-1.5 text-xs text-brand-text-dim">
                        <li>&bull; Full Technical Audit &amp; Index Fixes</li>
                        <li>&bull; LCP &amp; CLS Speed Acceleration</li>
                        <li>&bull; Schema.org Graph Integration</li>
                    </ul>
                </div>

                <div class="rounded-xl border border-brand-border bg-brand-surface p-6">
                    <span class="font-mono text-xs font-bold text-brand-accent block mb-2">Option B: 90-Day (3-Month) Growth Engine</span>
                    <p class="text-xs text-brand-text-muted leading-relaxed mb-4">
                        A comprehensive 3-month growth engagement validating conversion hypotheses, building out commercial topic clusters, and scaling organic lead volume.
                    </p>
                    <ul class="space-y-1.5 text-xs text-brand-text-dim">
                        <li>&bull; Commercial Keyword Cluster Expansion</li>
                        <li>&bull; In-Article CRO &amp; Instant Quote Triggers</li>
                        <li>&bull; Ongoing Google AI Overview Optimization</li>
                    </ul>
                </div>
            </div>
        </section>

        <!-- 5. Interactive FAQ Accordion -->
        <section class="border-t border-brand-border pt-12">
            <div class="max-w-xl mb-8">
                <div class="font-mono text-xs font-semibold text-brand-accent mb-2">
                    Transparency &bull; Q&amp;A
                </div>
                <h2 class="font-display text-2xl font-bold tracking-tight text-brand-text">
                    Frequently Asked Questions
                </h2>
            </div>

            <div class="space-y-3">
                <?php foreach ($faqs as $idx => $item) : 
                    $panel_id = 'faq-panel-' . $idx;
                ?>
                    <div class="minimal-card overflow-hidden">
                        <button
                            type="button"
                            class="faq-toggle w-full px-6 py-4 flex items-center justify-between text-left text-xs sm:text-sm font-semibold text-brand-text hover:text-brand-accent transition-colors"
                            aria-expanded="false"
                            aria-controls="<?php echo esc_attr($panel_id); ?>"
                        >
                            <span><?php echo esc_html($item['q']); ?></span>
                            <svg class="faq-icon h-4 w-4 shrink-0 transition-transform duration-200 text-brand-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        <div id="<?php echo esc_attr($panel_id); ?>" class="hidden px-6 pb-5 text-xs text-brand-text-muted leading-relaxed border-t border-brand-border/40 pt-3">
                            <?php echo esc_html($item['a']); ?>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        </section>

        <!-- 6. Final CTA Banner -->
        <section class="minimal-card p-8 sm:p-12 text-center bg-brand-surface/80 border border-brand-accent/20">
            <h3 class="font-display text-2xl font-bold text-brand-text mb-3">
                Ready to Turn Search Into An Inbound Lead Machine?
            </h3>
            <p class="text-xs sm:text-sm text-brand-text-muted max-w-lg mx-auto mb-6">
                Request a confidential search rankings and article conversion audit. I will personally review your domain and outline where leads are leaking.
            </p>
            <a href="<?php echo esc_url(home_url('/contact/')); ?>" class="btn-primary text-xs py-3 px-6 shadow-md inline-flex items-center gap-2">
                <span>Request Free Strategic Audit &rarr;</span>
            </a>
        </section>

    </div>
</div>

<?php get_footer(); ?>
