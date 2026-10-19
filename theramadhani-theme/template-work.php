<?php
/**
 * Template Name: Work / Case Studies
 * 
 * Case studies and verified proof of performance template
 * @package TheRamadhani
 */
if (!defined('ABSPATH')) exit;

get_header();

$breadcrumbs = array(
    'Proof / Work' => ''
);
?>

<div class="py-12 sm:py-16">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-16">
        
        <!-- Breadcrumbs & Hero -->
        <div>
            <?php theramadhani_render_breadcrumbs($breadcrumbs); ?>
            <div class="max-w-3xl space-y-4">
                <div class="inline-flex items-center gap-2 rounded-full border border-brand-accent/30 bg-brand-surface px-3.5 py-1 text-xs font-mono font-semibold text-brand-accent">
                    Proof &bull; Performance
                </div>
                <h1 class="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-brand-text leading-tight">
                    Engineered Results: Real-World Case Studies.
                </h1>
                <p class="text-sm sm:text-base text-brand-text-muted leading-relaxed">
                    Explore how full-stack Technical SEO, sub-second Core Web Vitals, and Article-to-Lead conversion frameworks drive verified commercial revenue.
                </p>
            </div>
        </div>

        <!-- FEATURED CASE STUDY: PANORAMA LENS TRIP -->
        <article class="minimal-card p-8 sm:p-12 overflow-hidden shadow-xl border border-brand-accent/20">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                
                <div class="lg:col-span-7 space-y-5">
                    <div class="flex items-center gap-3">
                        <span class="font-mono text-xs font-semibold text-brand-accent bg-brand-accent/10 px-2.5 py-0.5 rounded">
                            Featured Case Study
                        </span>
                        <span class="text-xs text-brand-text-dim font-mono">panoramalenstrip.com</span>
                    </div>

                    <h2 class="font-display text-2xl sm:text-3xl font-bold text-brand-text">
                        Panorama Lens Trip: 3.39K Organic Clicks, 95 Mobile Performance &amp; WhatsApp Lead Conversion Engine
                    </h2>

                    <p class="text-xs sm:text-sm text-brand-text-muted leading-relaxed">
                        How technical SEO, Core Web Vitals refactoring to a 95 Mobile PageSpeed score, and high-intent commercial keyword rankings generated 3.39K organic clicks, 231K impressions, and a direct WhatsApp tour booking pipeline.
                    </p>

                    <!-- Key Metrics Grid -->
                    <div class="grid grid-cols-3 gap-3 pt-3 border-t border-brand-border">
                        <div class="p-3.5 rounded-lg bg-brand-surface border border-brand-border text-center">
                            <div class="font-mono text-xl sm:text-2xl font-bold text-brand-accent">95/100</div>
                            <div class="text-[10px] sm:text-[11px] text-brand-text-dim mt-0.5">Mobile PageSpeed</div>
                        </div>
                        <div class="p-3.5 rounded-lg bg-brand-surface border border-brand-border text-center">
                            <div class="font-mono text-xl sm:text-2xl font-bold text-brand-accent">3.39K</div>
                            <div class="text-[10px] sm:text-[11px] text-brand-text-dim mt-0.5">Organic Clicks</div>
                        </div>
                        <div class="p-3.5 rounded-lg bg-brand-surface border border-brand-border text-center">
                            <div class="font-mono text-xl sm:text-2xl font-bold text-brand-accent">Top 2-3</div>
                            <div class="text-[10px] sm:text-[11px] text-brand-text-dim mt-0.5">240 Keywords</div>
                        </div>
                    </div>

                    <!-- Tech Stack Tags -->
                    <div class="flex flex-wrap gap-2 pt-2">
                        <span class="font-mono text-[10px] bg-brand-surface border border-brand-border px-2 py-0.5 rounded text-brand-text-dim">Core Web Vitals Engineering</span>
                        <span class="font-mono text-[10px] bg-brand-surface border border-brand-border px-2 py-0.5 rounded text-brand-text-dim">GA4 Telemetry</span>
                        <span class="font-mono text-[10px] bg-brand-surface border border-brand-border px-2 py-0.5 rounded text-brand-text-dim">WhatsApp Funnels</span>
                        <span class="font-mono text-[10px] bg-brand-surface border border-brand-border px-2 py-0.5 rounded text-brand-text-dim">Schema.org TouristTrip</span>
                    </div>
                </div>

                <!-- Case Study Visual Preview -->
                <div class="lg:col-span-5">
                    <div class="rounded-xl overflow-hidden border border-brand-border shadow-lg aspect-video bg-brand-surface relative group">
                        <img
                            src="<?php echo esc_url(get_template_directory_uri() . '/assets/images/hero-poster.webp'); ?>"
                            alt="Panorama Lens Trip Case Study"
                            width="600"
                            height="338"
                            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    </div>
                </div>

            </div>

            <!-- Detailed Case Study Breakdown Inside -->
            <div class="mt-12 pt-8 border-t border-brand-border space-y-6">
                <h3 class="font-display text-xl font-bold text-brand-text">Verified Lighthouse Mobile Performance Audit</h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs border border-brand-border rounded-lg overflow-hidden">
                        <thead class="bg-brand-surface text-brand-text font-mono uppercase text-[10px]">
                            <tr>
                                <th class="p-3 border-b border-brand-border">Category</th>
                                <th class="p-3 border-b border-brand-border">Score</th>
                                <th class="p-3 border-b border-brand-border">Status</th>
                                <th class="p-3 border-b border-brand-border">Technical Assessment</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-brand-border text-brand-text-muted">
                            <tr>
                                <td class="p-3 font-semibold text-brand-text">Performance</td>
                                <td class="p-3 font-mono font-bold text-emerald-600">95 / 100</td>
                                <td class="p-3 text-emerald-600 font-semibold">Green (Good)</td>
                                <td class="p-3">Sub-second rendering across SI, FCP, LCP, and CLS</td>
                            </tr>
                            <tr>
                                <td class="p-3 font-semibold text-brand-text">Best Practices</td>
                                <td class="p-3 font-mono font-bold text-emerald-600">100 / 100</td>
                                <td class="p-3 text-emerald-600 font-semibold">Perfect Score</td>
                                <td class="p-3">Zero console errors, modern secure web standards</td>
                            </tr>
                            <tr>
                                <td class="p-3 font-semibold text-brand-text">Accessibility</td>
                                <td class="p-3 font-mono font-bold text-emerald-600">93 / 100</td>
                                <td class="p-3 text-emerald-600 font-semibold">Green (Good)</td>
                                <td class="p-3">High contrast compliance, descriptive labels, ARIA landmarks</td>
                            </tr>
                            <tr>
                                <td class="p-3 font-semibold text-brand-text">SEO</td>
                                <td class="p-3 font-mono font-bold text-emerald-600">92 / 100</td>
                                <td class="p-3 text-emerald-600 font-semibold">Green (Good)</td>
                                <td class="p-3">Valid metadata, crawlable semantic structure, clean hierarchy</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </article>

        <!-- Final CTA Banner -->
        <section class="minimal-card p-8 sm:p-12 text-center bg-brand-surface/80 border border-brand-accent/20">
            <h3 class="font-display text-2xl font-bold text-brand-text mb-3">
                Want Similar Measurable Performance For Your Business?
            </h3>
            <p class="text-xs sm:text-sm text-brand-text-muted max-w-lg mx-auto mb-6">
                Request a confidential performance audit to see how sub-second speed and commercial intent architecture can scale your inbound revenue.
            </p>
            <a href="<?php echo esc_url(home_url('/contact/')); ?>" class="btn-primary text-xs py-3 px-6 shadow-md inline-flex items-center gap-2">
                <span>Request Free Strategic Audit &rarr;</span>
            </a>
        </section>

    </div>
</div>

<?php get_footer(); ?>
