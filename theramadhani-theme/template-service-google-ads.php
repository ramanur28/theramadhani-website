<?php
/**
 * Template Name: Service - Google Ads
 * 
 * Template for Google Ads High-ROI Optimization Service
 * @package TheRamadhani
 */
if (!defined('ABSPATH')) exit;

get_header();

$breadcrumbs = array(
    'Services' => home_url('/services/google-ads/'),
    'Google Ads Optimization' => ''
);

$faqs = array(
    array(
        'q' => 'How do you prevent wasted ad spend on broad-match queries?',
        'a' => 'We deploy strict Single-Themed Ad Groups (STAGs) using phrase and exact match commercial intents, maintain daily negative keyword hygiene lists, and separate Brand, Generic, and Competitor search terms into isolated budget tiers.'
    ),
    array(
        'q' => 'What is server-side conversion tracking and why is it necessary?',
        'a' => 'Browser privacy protections (Safari ITP, ad-blockers) block up to 28% of standard client-side conversion pixels. Server-side tracking (via Google Tag Manager and Enhanced Conversions API) transmits conversion data directly from your server, feeding accurate value signals to Smart Bidding algorithms.'
    ),
    array(
        'q' => 'What minimum ad spend do you require to take on a client?',
        'a' => 'We typically work with companies spending between $5,000 and $100,000 per month on Google Ads. Below $5,000/mo, machine learning algorithms lack sufficient conversion density to optimize Smart Bidding models effectively.'
    ),
    array(
        'q' => 'How quickly can we expect to see an improvement in CPA and ROAS?',
        'a' => 'Negative keyword pruning and waste elimination produce immediate CPA reductions within the first 14 days. Re-training Smart Bidding algorithms with server-side conversion data typically achieves optimal target ROAS scaling within 30 to 60 days.'
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
                    Service /03 &bull; Paid Acquisition &amp; High ROAS
                </div>
                <h1 class="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-brand-text leading-tight">
                    Google Ads High-ROI Optimization.
                </h1>
                <p class="text-sm sm:text-base text-brand-text-muted leading-relaxed">
                    Eliminate wasted spend on low-intent search terms. Scale your paid customer acquisition with exact intent targeting, server-side tracking, and value bidding.
                </p>
            </div>
        </div>

        <!-- 1. Quick Answer Block -->
        <div class="rounded-xl border border-brand-accent/30 bg-brand-accent/5 p-6 sm:p-7">
            <span class="font-mono text-[11px] font-bold uppercase tracking-wider text-brand-accent block mb-2">
                Executive Definition &bull; High-ROAS Architecture
            </span>
            <p class="text-xs sm:text-sm text-brand-text leading-relaxed font-editorial italic">
                "Google Ads Optimization is the disciplined management of paid search campaigns, server-side conversion telemetry, and post-click landing pages. It eliminates wasted spend on low-intent keywords, trains Smart Bidding algorithms on high-value offline conversions, and maximizes return on ad spend (ROAS) for technology and commercial businesses."
            </p>
        </div>

        <!-- 2. Target ICP vs Root Problems -->
        <section class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="minimal-card p-8">
                <span class="font-mono text-xs font-semibold text-brand-accent uppercase tracking-wider block mb-2">
                    Target ICP
                </span>
                <h2 class="font-display text-xl font-bold text-brand-text mb-4">
                    Who This Service Is For
                </h2>
                <ul class="space-y-2.5 text-xs sm:text-sm text-brand-text-muted leading-relaxed">
                    <li class="flex items-start gap-2">
                        <span class="text-brand-accent font-bold">&bull;</span>
                        <span><strong>High-Ticket Service Businesses:</strong> Companies spending $5K+ monthly on Google Ads seeking predictable cost-per-lead.</span>
                    </li>
                    <li class="flex items-start gap-2">
                        <span class="text-brand-accent font-bold">&bull;</span>
                        <span><strong>Companies Burned by Paid Ads Agencies:</strong> Businesses paying high agency management fees for stagnant or diminishing returns.</span>
                    </li>
                    <li class="flex items-start gap-2">
                        <span class="text-brand-accent font-bold">&bull;</span>
                        <span><strong>Data-Led Brands:</strong> Organizations requiring airtight server-side GA4 and CRM conversion attribution.</span>
                    </li>
                </ul>
            </div>

            <div class="minimal-card p-8">
                <span class="font-mono text-xs font-semibold text-brand-accent uppercase tracking-wider block mb-2">
                    Root Problems
                </span>
                <h2 class="font-display text-xl font-bold text-brand-text mb-4">
                    What Problems This Solves
                </h2>
                <ul class="space-y-2.5 text-xs sm:text-sm text-brand-text-muted leading-relaxed">
                    <li class="flex items-start gap-2">
                        <span class="text-brand-accent font-bold">&bull;</span>
                        <span><strong>Broad-Match Budget Bleed:</strong> Google auto-applying broad match terms that burn ad budget on irrelevant searchers.</span>
                    </li>
                    <li class="flex items-start gap-2">
                        <span class="text-brand-accent font-bold">&bull;</span>
                        <span><strong>Blind Machine Learning:</strong> Smart Bidding optimizing toward low-quality micro-conversions instead of qualified closed deals.</span>
                    </li>
                    <li class="flex items-start gap-2">
                        <span class="text-brand-accent font-bold">&bull;</span>
                        <span><strong>Pixel Tracking Discrepancies:</strong> Browser tracking blockers causing Google Ads to underreport conversions by up to 28%.</span>
                    </li>
                </ul>
            </div>
        </section>

        <!-- 3. Concrete Deliverables -->
        <section class="minimal-card p-8 sm:p-10">
            <div class="font-mono text-xs font-semibold text-brand-accent mb-2">
                Execution &bull; Deliverables
            </div>
            <h2 class="font-display text-2xl font-bold text-brand-text mb-6">
                What Is Included (Concrete Deliverables)
            </h2>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div class="rounded-xl border border-brand-border bg-brand-surface p-5">
                    <span class="font-mono text-xs font-bold text-brand-accent block mb-1">01. Smart Bidding &amp; STAG Restructuring</span>
                    <p class="text-xs sm:text-sm text-brand-text-muted leading-relaxed">
                        Re-architecting campaigns into clean Single-Themed Ad Groups (STAGs) with isolated match types and value-based bidding.
                    </p>
                </div>

                <div class="rounded-xl border border-brand-border bg-brand-surface p-5">
                    <span class="font-mono text-xs font-bold text-brand-accent block mb-1">02. Server-Side GTM &amp; Enhanced Conversions</span>
                    <p class="text-xs sm:text-sm text-brand-text-muted leading-relaxed">
                        Bypassing ad-blockers and iOS privacy limits with server-side tagging, transmitting hashed lead data directly to Google Ads.
                    </p>
                </div>

                <div class="rounded-xl border border-brand-border bg-brand-surface p-5">
                    <span class="font-mono text-xs font-bold text-brand-accent block mb-1">03. Aggressive Negative Keyword Governance</span>
                    <p class="text-xs sm:text-sm text-brand-text-muted leading-relaxed">
                        Pruning wasteful search terms daily with extensive universal and account-level negative lists to maximize intent purity.
                    </p>
                </div>

                <div class="rounded-xl border border-brand-border bg-brand-surface p-5">
                    <span class="font-mono text-xs font-bold text-brand-accent block mb-1">04. Landing Page Conversion Rate Optimization</span>
                    <p class="text-xs sm:text-sm text-brand-text-muted leading-relaxed">
                        Aligning ad copy headline intent with dedicated, sub-second landing pages to boost Quality Scores and cut cost-per-click.
                    </p>
                </div>
            </div>
        </section>

        <!-- 4. Interactive FAQ Accordion -->
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
                    $panel_id = 'ads-faq-' . $idx;
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

        <!-- 5. Final CTA Banner -->
        <section class="minimal-card p-8 sm:p-12 text-center bg-brand-surface/80 border border-brand-accent/20">
            <h3 class="font-display text-2xl font-bold text-brand-text mb-3">
                Stop Wasting Ad Spend. Scale With High ROAS.
            </h3>
            <p class="text-xs sm:text-sm text-brand-text-muted max-w-lg mx-auto mb-6">
                Request a confidential Google Ads audit. I personally review your search term reports, conversion tracking accuracy, and bid efficiency.
            </p>
            <a href="<?php echo esc_url(home_url('/contact/')); ?>" class="btn-primary text-xs py-3 px-6 shadow-md inline-flex items-center gap-2">
                <span>Request Free Google Ads Audit &rarr;</span>
            </a>
        </section>

    </div>
</div>

<?php get_footer(); ?>
