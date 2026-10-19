<?php
/**
 * Template Name: About Page
 * 
 * Template for the About page in The Ramadhani Theme
 * @package TheRamadhani
 */
if (!defined('ABSPATH')) exit;

get_header();

$breadcrumbs = array(
    'About' => ''
);
?>

<div class="py-12 sm:py-16">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        
        <!-- Breadcrumbs -->
        <?php theramadhani_render_breadcrumbs($breadcrumbs); ?>

        <!-- Hero Header -->
        <div class="max-w-3xl mb-12 space-y-4">
            <div class="inline-flex items-center gap-2 rounded-full border border-brand-accent/30 bg-brand-surface px-3.5 py-1 text-xs font-mono font-semibold text-brand-accent">
                Entity Profile &bull; E-E-A-T
            </div>
            <h1 class="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-brand-text leading-tight">
                Turning Google Search into a predictable lead-generation machine.
            </h1>
            <p class="text-sm sm:text-base text-brand-text-muted leading-relaxed">
                I bridge the critical gap between top Google rankings, in-article conversion architecture, and actual booked revenue for Home Services and data-led businesses.
            </p>
        </div>

        <?php 
        // Optional Editor Content from Gutenberg
        if (have_posts()) : while (have_posts()) : the_post();
            if (trim(get_the_content()) !== '') : ?>
                <div class="minimal-card p-6 sm:p-8 mb-12 prose max-w-none text-brand-text">
                    <?php the_content(); ?>
                </div>
            <?php endif;
        endwhile; endif; 
        ?>

        <div class="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <!-- Left: Entity Profile Card -->
            <div class="lg:col-span-4 space-y-6">
                <div class="minimal-card p-6 sm:p-7">
                    <div class="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-accent/15 border border-brand-accent/30 font-mono text-2xl font-bold text-brand-accent">
                        R
                    </div>

                    <div class="mt-5">
                        <h2 class="font-display text-xl font-bold text-brand-text">Ramadhani</h2>
                        <p class="text-xs text-brand-accent font-mono mt-0.5 font-semibold">
                            Search Rankings &amp; Conversion Specialist
                        </p>
                    </div>

                    <div class="mt-6 border-t border-brand-border pt-5 space-y-3 text-xs text-brand-text-muted">
                        <div class="flex justify-between">
                            <span>Specialization:</span>
                            <span class="font-semibold text-brand-text">Home Services &amp; Lead Gen</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Core Focus:</span>
                            <span class="font-semibold text-brand-text">Rankings + Article Conversion</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Key Outcome:</span>
                            <span class="font-semibold text-brand-text">Booked Jobs &amp; Inbound Calls</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Engagement Model:</span>
                            <span class="font-semibold text-brand-text">Direct 1-on-1 Specialist Partnership</span>
                        </div>
                    </div>

                    <div class="mt-6 pt-2">
                        <a href="<?php echo esc_url(home_url('/contact/')); ?>" class="btn-primary w-full text-xs py-2.5">
                            Get Free Traffic &amp; Lead Audit &rarr;
                        </a>
                    </div>
                </div>

                <!-- Verified External Profiles (sameAs) -->
                <div class="minimal-card p-6">
                    <h3 class="font-mono text-xs font-semibold uppercase tracking-wider text-brand-text mb-3">
                        Verified Profiles (`sameAs`)
                    </h3>
                    <ul class="space-y-2.5 text-xs text-brand-text-muted">
                        <li>
                            <a href="https://www.linkedin.com/in/ramadhani-marketing" target="_blank" rel="noopener noreferrer" class="flex items-center justify-between text-brand-text hover:text-brand-accent transition-colors font-medium">
                                <span>LinkedIn Profile</span>
                                <span class="text-brand-text-dim text-[11px] font-mono">&nearr;</span>
                            </a>
                        </li>
                        <li>
                            <a href="https://twitter.com/ramadhani_seo" target="_blank" rel="noopener noreferrer" class="flex items-center justify-between text-brand-text hover:text-brand-accent transition-colors font-medium">
                                <span>Twitter / X (@ramadhani_seo)</span>
                                <span class="text-brand-text-dim text-[11px] font-mono">&nearr;</span>
                            </a>
                        </li>
                        <li>
                            <a href="https://github.com/ramadhani" target="_blank" rel="noopener noreferrer" class="flex items-center justify-between text-brand-text hover:text-brand-accent transition-colors font-medium">
                                <span>GitHub Organization</span>
                                <span class="text-brand-text-dim text-[11px] font-mono">&nearr;</span>
                            </a>
                        </li>
                    </ul>
                </div>

                <!-- Verified Credentials -->
                <div class="minimal-card p-6">
                    <h3 class="font-mono text-xs font-semibold uppercase tracking-wider text-brand-text mb-3">
                        Certifications &amp; Credentials
                    </h3>
                    <ul class="space-y-2 text-xs text-brand-text-muted">
                        <li class="flex items-start gap-2">
                            <span class="text-brand-accent font-mono font-bold">&bull;</span>
                            <span class="text-brand-text font-medium">Advanced Search Architecture &amp; Conversion Specialist</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <span class="text-brand-accent font-mono font-bold">&bull;</span>
                            <span class="text-brand-text font-medium">Generative Search &amp; AI Overviews Grounding Specialist</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <span class="text-brand-accent font-mono font-bold">&bull;</span>
                            <span class="text-brand-text font-medium">Google Search &amp; Measurement Certified Professional</span>
                        </li>
                    </ul>
                </div>
            </div>

            <!-- Right: Narrative & Philosophy -->
            <div class="lg:col-span-8 space-y-8">
                <!-- Philosophy -->
                <section class="minimal-card p-8 sm:p-10">
                    <div class="font-mono text-xs font-semibold text-brand-accent mb-2">
                        The Anti-Agency Philosophy &bull; Revenue First
                    </div>
                    <h2 class="font-display text-2xl font-bold text-brand-text mb-6">
                        Why Traffic Without Conversions Is Pure Vanity
                    </h2>
                    <div class="space-y-5 text-sm leading-relaxed text-brand-text-muted">
                        <p>
                            For years, the digital marketing agency playbook has been broken. Agencies sell clients on "keyword volume" and celebrate monthly reports showing organic impression growth. But when you look at the client's bank account or sales schedule, nothing has changed.
                        </p>
                        <p>
                            You cannot pay payroll or buy materials with "impressions." A business only wins when organic search traffic turns into <strong>qualified inbound phone calls, quote requests, and booked jobs</strong>.
                        </p>
                        <p>
                            The biggest missed opportunity in digital marketing today is <strong>Article SEO without conversion architecture</strong>. Businesses publish informational articles that attract thousands of visitors, but 99% of them leave without a trace because the article never provides a clear, high-trust bridge to take action.
                        </p>
                        <p>
                            My work is engineered around solving this exact problem: getting your website to rank top-3 for commercial buyer searches, and re-architecting your articles with instant quote calculators, direct answer blocks, and high-converting funnels that turn searchers into booked revenue.
                        </p>
                    </div>
                </section>

                <!-- Strict Positioning -->
                <section class="minimal-card p-8 sm:p-10 border-l-4 border-l-brand-accent">
                    <div class="font-mono text-xs font-semibold text-brand-accent mb-2">
                        Strict Positioning &bull; Transparency
                    </div>
                    <h2 class="font-display text-2xl font-bold text-brand-text mb-4">
                        Who I Work With (And Who I Do Not)
                    </h2>
                    <p class="text-xs sm:text-sm text-brand-text-muted leading-relaxed mb-6">
                        To maintain high execution rigor and guarantee direct personal access, I strictly partner with businesses where search visibility creates transformative revenue:
                    </p>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div class="rounded-xl border border-brand-border bg-brand-surface p-4">
                            <span class="font-mono font-bold text-red-600 block mb-1">&times; What I Do NOT Do</span>
                            <ul class="space-y-2 text-brand-text-muted mt-2">
                                <li>&bull; Vanity traffic reports that don't affect sales</li>
                                <li>&bull; Generic informational blog posts with zero CTAs</li>
                                <li>&bull; Spammy link building or PBNs</li>
                                <li>&bull; Handing client work off to junior account managers</li>
                            </ul>
                        </div>

                        <div class="rounded-xl border border-brand-border bg-brand-surface p-4">
                            <span class="font-mono font-bold text-brand-accent block mb-1">&check; Who This IS For</span>
                            <ul class="space-y-2 text-brand-text-muted mt-2">
                                <li>&bull; <strong>Primary Focus:</strong> Home services agencies &amp; Real estate agencies</li>
                                <li>&bull; <strong>Core Verticals:</strong> Medical &amp; wellness, B2B SaaS, Finance, Travel</li>
                                <li>&bull; <strong>Agency Burnouts:</strong> Businesses burned by agencies that delivered zero sales impact</li>
                                <li>&bull; Companies looking to turn articles into automated lead machines</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <!-- Core Domains of Authority -->
                <section class="minimal-card p-8 sm:p-10">
                    <h2 class="font-display text-xl font-bold text-brand-text mb-4">
                        Core Domains of Authority (`knowsAbout`)
                    </h2>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div class="rounded-lg border border-brand-border bg-brand-surface p-3.5 flex items-center gap-2.5">
                            <span class="h-1.5 w-1.5 rounded-full bg-brand-accent"></span>
                            <span class="font-semibold text-brand-text">High-Intent Google Search Rankings</span>
                        </div>
                        <div class="rounded-lg border border-brand-border bg-brand-surface p-3.5 flex items-center gap-2.5">
                            <span class="h-1.5 w-1.5 rounded-full bg-brand-accent"></span>
                            <span class="font-semibold text-brand-text">Article-to-Lead Conversion Architecture</span>
                        </div>
                        <div class="rounded-lg border border-brand-border bg-brand-surface p-3.5 flex items-center gap-2.5">
                            <span class="h-1.5 w-1.5 rounded-full bg-brand-accent"></span>
                            <span class="font-semibold text-brand-text">Generative Engine Optimization (GEO)</span>
                        </div>
                        <div class="rounded-lg border border-brand-border bg-brand-surface p-3.5 flex items-center gap-2.5">
                            <span class="h-1.5 w-1.5 rounded-full bg-brand-accent"></span>
                            <span class="font-semibold text-brand-text">Core Web Vitals Code Engineering</span>
                        </div>
                        <div class="rounded-lg border border-brand-border bg-brand-surface p-3.5 flex items-center gap-2.5">
                            <span class="h-1.5 w-1.5 rounded-full bg-brand-accent"></span>
                            <span class="font-semibold text-brand-text">Schema.org Knowledge Graph Modeling</span>
                        </div>
                        <div class="rounded-lg border border-brand-border bg-brand-surface p-3.5 flex items-center gap-2.5">
                            <span class="h-1.5 w-1.5 rounded-full bg-brand-accent"></span>
                            <span class="font-semibold text-brand-text">Conversion Rate Optimization (CRO)</span>
                        </div>
                    </div>
                </section>
            </div>
        </div>

    </div>
</div>

<?php get_footer(); ?>
