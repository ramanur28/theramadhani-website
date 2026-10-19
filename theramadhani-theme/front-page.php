<?php
/**
 * Template Name: Front Page
 * 
 * The Homepage template for The Ramadhani Theme
 * @package TheRamadhani
 */
if (!defined('ABSPATH')) exit;

get_header();
?>

<!-- 1. HERO SECTION -->
<section class="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <!-- Left Hero Content -->
            <div class="lg:col-span-7 space-y-6">
                <!-- Pill Badge -->
                <div class="inline-flex items-center gap-2 rounded-full border border-brand-accent/30 bg-brand-accent/10 px-3.5 py-1 text-xs font-mono font-semibold text-brand-accent">
                    <span class="h-2 w-2 rounded-full bg-brand-accent animate-pulse"></span>
                    Search Rankings &amp; Article Conversion Specialist
                </div>

                <!-- Main H1 -->
                <h1 class="font-display text-3xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight text-brand-text leading-[1.12]">
                    Rank Top 3 On Google. <br class="hidden sm:inline" />
                    Turn Search Traffic Into An <br class="hidden sm:inline" />
                    <span class="text-brand-accent font-serif italic font-normal">Automated Lead Generator.</span>
                </h1>

                <!-- Subheadline -->
                <p class="text-sm sm:text-base text-brand-text-muted leading-relaxed max-w-xl">
                    Engineered for Home Services and businesses burned by past SEO agencies. I bridge the gap between top Google rankings and in-article conversion architecture that transforms passive readers into booked jobs and phone calls.
                </p>

                <!-- CTAs -->
                <div class="flex flex-wrap items-center gap-4 pt-2">
                    <a
                        href="<?php echo esc_url(home_url('/contact/')); ?>"
                        class="btn-primary text-xs sm:text-sm py-3 px-6 shadow-md"
                    >
                        <span>Get Free Traffic &amp; Lead Audit</span>
                        <span aria-hidden="true">&rarr;</span>
                    </a>
                    <a
                        href="<?php echo esc_url(home_url('/services/seo/')); ?>"
                        class="btn-secondary text-xs sm:text-sm py-3 px-5"
                    >
                        <span>Explore 3-Pillar System</span>
                    </a>
                </div>

                <!-- Verified Metric Badges -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-brand-border text-left">
                    <div>
                        <div class="font-mono text-lg font-bold text-brand-text">+640%</div>
                        <div class="text-[11px] text-brand-text-dim">Inbound Leads</div>
                    </div>
                    <div>
                        <div class="font-mono text-lg font-bold text-brand-text">Top 2-3</div>
                        <div class="text-[11px] text-brand-text-dim">Commercial Queries</div>
                    </div>
                    <div>
                        <div class="font-mono text-lg font-bold text-brand-text">95/100</div>
                        <div class="text-[11px] text-brand-text-dim">Mobile PageSpeed</div>
                    </div>
                    <div>
                        <div class="font-mono text-lg font-bold text-brand-text">1-on-1</div>
                        <div class="text-[11px] text-brand-text-dim">Direct Partnership</div>
                    </div>
                </div>
            </div>

            <!-- Right Hero Card / Visual Preview -->
            <div class="lg:col-span-5">
                <div class="minimal-card p-4 sm:p-6 relative group overflow-hidden shadow-2xl">
                    <div class="aspect-video w-full rounded-xl overflow-hidden bg-brand-surface relative border border-brand-border">
                        <img
                            src="<?php echo esc_url(get_template_directory_uri() . '/assets/images/hero-poster.webp'); ?>"
                            alt="The Ramadhani Search Rankings & Article Conversion Dashboard"
                            width="600"
                            height="338"
                            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div class="absolute inset-0 bg-gradient-to-t from-brand-bg/90 via-transparent to-transparent flex items-end p-4">
                            <span class="font-mono text-[11px] text-white bg-black/60 px-2.5 py-1 rounded backdrop-blur-xs font-semibold">
                                Live Case Study &bull; Panorama Lens Trip
                            </span>
                        </div>
                    </div>

                    <div class="mt-5 space-y-2">
                        <div class="flex items-center justify-between text-xs font-semibold">
                            <span class="text-brand-text">Client Performance Yield</span>
                            <span class="text-brand-accent font-mono">3.39K Organic Clicks</span>
                        </div>
                        <p class="text-xs text-brand-text-muted leading-relaxed">
                            Sub-second Core Web Vitals optimization and in-article WhatsApp booking funnels delivered 231K Google search impressions.
                        </p>
                    </div>
                </div>
            </div>

        </div>
    </div>
</section>

<!-- 2. THE LEAKY BUCKET PROBLEM -->
<section class="py-16 bg-brand-surface/40 border-y border-brand-border">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div class="max-w-2xl mb-12">
            <div class="font-mono text-xs font-semibold text-brand-accent mb-2">
                The Industry Problem &bull; The Leaky Bucket
            </div>
            <h2 class="font-display text-2xl sm:text-3xl font-bold text-brand-text">
                Why Most Businesses Get Traffic But Almost Zero Leads
            </h2>
            <p class="mt-3 text-xs sm:text-sm text-brand-text-muted leading-relaxed">
                Traditional agencies celebrate monthly PDF reports showing impression growth. But impressions don't pay payroll or book jobs.
            </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Problem Card -->
            <div class="minimal-card p-6 sm:p-8 border-l-4 border-l-rose-500/80">
                <span class="font-mono text-xs font-bold text-rose-500 block mb-2">&times; The Agency Vanity Trap</span>
                <h3 class="font-display text-lg font-bold text-brand-text mb-3">Ranking For Irrelevant Informational Fluff</h3>
                <p class="text-xs sm:text-sm text-brand-text-muted leading-relaxed">
                    Thousands of visitors read your articles and blog posts, but 99% bounce without calling or requesting a quote. Your content is treated as informational trivia rather than an engineered lead-generation funnel.
                </p>
            </div>

            <!-- Solution Card -->
            <div class="minimal-card p-6 sm:p-8 border-l-4 border-l-emerald-500/80">
                <span class="font-mono text-xs font-bold text-emerald-500 block mb-2">&check; The Ramadhani Revenue Architecture</span>
                <h3 class="font-display text-lg font-bold text-brand-text mb-3">Commercial Intent &amp; In-Article Conversion</h3>
                <p class="text-xs sm:text-sm text-brand-text-muted leading-relaxed">
                    We rank you for high-ticket commercial keywords when customers are ready to buy, and equip every article with direct answer callouts, instant quote calculators, and high-trust booking triggers.
                </p>
            </div>
        </div>
    </div>
</section>

<!-- 3. INTERACTIVE PERFORMANCE & LEAD LOSS AUDIT CALCULATOR -->
<section class="py-20">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div class="minimal-card p-8 sm:p-12 border border-brand-accent/30 bg-gradient-to-br from-brand-card via-brand-bg to-brand-surface shadow-xl">
            <div class="max-w-xl mb-8">
                <div class="font-mono text-xs font-semibold text-brand-accent mb-2">
                    Interactive Revenue Calculator
                </div>
                <h2 class="font-display text-2xl sm:text-3xl font-bold text-brand-text">
                    How Much Revenue Is Leaking From Your Search Traffic?
                </h2>
                <p class="mt-2 text-xs sm:text-sm text-brand-text-muted">
                    Estimate your monthly and annual revenue lost to passive readers bouncing without conversion:
                </p>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <!-- Calculator Inputs -->
                <div class="lg:col-span-7 space-y-5">
                    <div>
                        <label for="calc-traffic" class="flex justify-between text-xs font-medium text-brand-text mb-1.5 font-mono">
                            <span>Monthly Website Visitors (Traffic)</span>
                            <span class="text-brand-accent">Visitors/mo</span>
                        </label>
                        <input
                            type="number"
                            id="calc-traffic"
                            value="5000"
                            step="500"
                            min="500"
                            class="w-full rounded-lg border border-brand-border bg-brand-surface px-4 py-2.5 text-xs text-brand-text font-mono focus:border-brand-accent focus:outline-none"
                        />
                    </div>

                    <div>
                        <label for="calc-cvr" class="flex justify-between text-xs font-medium text-brand-text mb-1.5 font-mono">
                            <span>Current Visitor-to-Lead Conversion Rate (%)</span>
                            <span class="text-brand-accent">Industry avg: 0.5%</span>
                        </label>
                        <input
                            type="number"
                            id="calc-cvr"
                            value="0.5"
                            step="0.1"
                            min="0.1"
                            max="5.0"
                            class="w-full rounded-lg border border-brand-border bg-brand-surface px-4 py-2.5 text-xs text-brand-text font-mono focus:border-brand-accent focus:outline-none"
                        />
                    </div>

                    <div>
                        <label for="calc-deal" class="flex justify-between text-xs font-medium text-brand-text mb-1.5 font-mono">
                            <span>Average Customer Job / Deal Value ($ USD)</span>
                            <span class="text-brand-accent">Revenue per closed client</span>
                        </label>
                        <input
                            type="number"
                            id="calc-deal"
                            value="1200"
                            step="100"
                            min="100"
                            class="w-full rounded-lg border border-brand-border bg-brand-surface px-4 py-2.5 text-xs text-brand-text font-mono focus:border-brand-accent focus:outline-none"
                        />
                    </div>
                </div>

                <!-- Calculator Results Display -->
                <div class="lg:col-span-5 bg-brand-surface p-6 sm:p-8 rounded-2xl border border-brand-border text-center space-y-4">
                    <span class="font-mono text-xs text-brand-text-dim uppercase tracking-wider block">
                        Estimated Annual Revenue Opportunity
                    </span>
                    <div id="calc-annual-leak" class="font-mono text-3xl sm:text-4xl font-extrabold text-brand-accent">
                        $288,000
                    </div>
                    <div class="text-xs text-brand-text-muted space-y-1">
                        <div>Monthly Revenue Leakage: <strong id="calc-monthly-leak" class="text-brand-text font-mono">$24,000</strong></div>
                        <div>Potential Extra Leads: <strong id="calc-potential-leads" class="text-brand-text font-mono">100 leads/mo</strong></div>
                    </div>
                    <div class="pt-3">
                        <a
                            href="<?php echo esc_url(home_url('/contact/')); ?>"
                            class="btn-primary w-full text-xs py-2.5"
                        >
                            Request Full Conversion Audit &rarr;
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- 4. CORE SERVICES OVERVIEW -->
<section class="py-16 bg-brand-surface/30 border-t border-brand-border">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div class="max-w-xl mb-12">
            <div class="font-mono text-xs font-semibold text-brand-accent mb-2">
                The 3-Pillar Architecture
            </div>
            <h2 class="font-display text-2xl sm:text-3xl font-bold text-brand-text">
                How We Turn Google Search Into A Predictable Growth Engine
            </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <!-- Service 01 -->
            <div class="minimal-card p-6 sm:p-8 flex flex-col justify-between">
                <div>
                    <div class="flex items-center justify-between mb-4">
                        <span class="font-mono text-xs font-semibold text-brand-accent">/01</span>
                        <span class="font-mono text-[10px] text-brand-accent bg-brand-accent/10 px-2 py-0.5 rounded">Rankings</span>
                    </div>
                    <h3 class="font-display text-lg font-bold text-brand-text mb-3">
                        High-Intent Google Rankings &amp; Traffic
                    </h3>
                    <p class="text-xs sm:text-sm text-brand-text-muted leading-relaxed mb-6">
                        Targeting commercial buyer keywords, sub-second Core Web Vitals optimization, and schema graphs to capture top-3 rankings when prospects are ready to buy.
                    </p>
                </div>
                <a href="<?php echo esc_url(home_url('/services/seo/')); ?>" class="text-xs font-semibold text-brand-accent hover:underline inline-flex items-center gap-1">
                    <span>Explore Service Details</span>
                    <span>&rarr;</span>
                </a>
            </div>

            <!-- Service 02 -->
            <div class="minimal-card p-6 sm:p-8 flex flex-col justify-between">
                <div>
                    <div class="flex items-center justify-between mb-4">
                        <span class="font-mono text-xs font-semibold text-brand-accent">/02</span>
                        <span class="font-mono text-[10px] text-brand-accent bg-brand-accent/10 px-2 py-0.5 rounded">Conversions</span>
                    </div>
                    <h3 class="font-display text-lg font-bold text-brand-text mb-3">
                        Article-to-Lead Conversion Engine
                    </h3>
                    <p class="text-xs sm:text-sm text-brand-text-muted leading-relaxed mb-6">
                        Re-architecting articles with high-converting bridge blocks, dynamic estimate calculators, direct answers, and CRO telemetry to stop traffic leaks.
                    </p>
                </div>
                <a href="<?php echo esc_url(home_url('/services/seo/')); ?>" class="text-xs font-semibold text-brand-accent hover:underline inline-flex items-center gap-1">
                    <span>Explore Conversion Architecture</span>
                    <span>&rarr;</span>
                </a>
            </div>

            <!-- Service 03 -->
            <div class="minimal-card p-6 sm:p-8 flex flex-col justify-between">
                <div>
                    <div class="flex items-center justify-between mb-4">
                        <span class="font-mono text-xs font-semibold text-brand-accent">/03</span>
                        <span class="font-mono text-[10px] text-brand-accent bg-brand-accent/10 px-2 py-0.5 rounded">AI Search</span>
                    </div>
                    <h3 class="font-display text-lg font-bold text-brand-text mb-3">
                        Generative Engine Optimization (GEO)
                    </h3>
                    <p class="text-xs sm:text-sm text-brand-text-muted leading-relaxed mb-6">
                        Engineering your brand as the primary cited source in ChatGPT, Perplexity, Claude, and Google AI Overviews when buyers query conversational models.
                    </p>
                </div>
                <a href="<?php echo esc_url(home_url('/services/geo/')); ?>" class="text-xs font-semibold text-brand-accent hover:underline inline-flex items-center gap-1">
                    <span>Explore GEO Blueprint</span>
                    <span>&rarr;</span>
                </a>
            </div>
        </div>
    </div>
</section>

<!-- 5. TARGET INDUSTRIES -->
<section class="py-16">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div class="minimal-card p-8 sm:p-12 border-l-4 border-l-brand-accent">
            <div class="max-w-2xl mb-8">
                <div class="font-mono text-xs font-semibold text-brand-accent mb-2">
                    Industry Specialization
                </div>
                <h2 class="font-display text-2xl font-bold text-brand-text">
                    Tailored Exclusively For High-Intent Commercial Businesses
                </h2>
                <p class="mt-2 text-xs sm:text-sm text-brand-text-muted">
                    We strictly partner with businesses where ranking in Google's Top 3 creates immediate commercial ROI:
                </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div class="p-4 rounded-xl bg-brand-surface border border-brand-border">
                    <strong class="text-brand-text block mb-1">Home Services</strong>
                    <p class="text-brand-text-muted">Roofing, HVAC, Solar, Plumbing, High-ticket Contractors.</p>
                </div>
                <div class="p-4 rounded-xl bg-brand-surface border border-brand-border">
                    <strong class="text-brand-text block mb-1">Real Estate</strong>
                    <p class="text-brand-text-muted">High-value brokerages, development agencies, property groups.</p>
                </div>
                <div class="p-4 rounded-xl bg-brand-surface border border-brand-border">
                    <strong class="text-brand-text block mb-1">Medical &amp; Wellness</strong>
                    <p class="text-brand-text-muted">Specialist clinics, cosmetic surgeries, rehabilitation centers.</p>
                </div>
                <div class="p-4 rounded-xl bg-brand-surface border border-brand-border">
                    <strong class="text-brand-text block mb-1">B2B SaaS &amp; Finance</strong>
                    <p class="text-brand-text-muted">Enterprise software, corporate advisory, wealth management.</p>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- 6. FINAL CTA BANNER -->
<section class="py-20 bg-brand-card border-t border-brand-border">
    <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <h2 class="font-display text-3xl sm:text-4xl font-extrabold text-brand-text tracking-tight">
            Ready to Turn Search Traffic Into An Automated Lead Machine?
        </h2>
        <p class="text-sm sm:text-base text-brand-text-muted max-w-xl mx-auto leading-relaxed">
            Request a confidential 48-hour audit. I personally review your domain, diagnose your traffic leaks, and deliver a concrete blueprint to rank top 3 on Google.
        </p>
        <div class="pt-2">
            <a
                href="<?php echo esc_url(home_url('/contact/')); ?>"
                class="btn-primary text-xs sm:text-sm py-3.5 px-8 shadow-lg inline-flex items-center gap-2"
            >
                <span>Request Free Search &amp; Lead Audit</span>
                <span aria-hidden="true">&rarr;</span>
            </a>
        </div>
    </div>
</section>

<?php get_footer(); ?>
