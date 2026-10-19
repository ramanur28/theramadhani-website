<?php
/**
 * Template Name: Service - GEO
 * 
 * Template for Generative Engine Optimization (GEO) Service
 * @package TheRamadhani
 */
if (!defined('ABSPATH')) exit;

get_header();

$breadcrumbs = array(
    'Services' => home_url('/services/geo/'),
    'Generative Engine Optimization (GEO)' => ''
);

$faqs = array(
    array(
        'q' => 'What is Generative Engine Optimization (GEO) and how does it work?',
        'a' => 'GEO is the technical practice of structuring website content, entity schemas, and data density so that large language models (LLMs) and AI answer engines (ChatGPT Search, Perplexity Pro, Google AI Overviews, Claude) extract, synthesize, and cite your brand as the primary authority for user queries.'
    ),
    array(
        'q' => 'How do AI engines decide which sources to cite in their answers?',
        'a' => 'AI engines use semantic vector search (RAG) combined with authority weighting algorithms. They prioritize sources that feature concise direct answer blocks (40-60 words), verified Schema.org entity graphs, machine-readable /llms.txt indexes, and empirical benchmark data.'
    ),
    array(
        'q' => 'How do you measure ROI from conversational AI search engines?',
        'a' => 'We track three core metrics: Grounding Citation Share (how frequently your domain appears in Perplexity and ChatGPT source carousels), AI Overviews Share of Voice, and Assisted Referral Traffic using dedicated UTM telemetry.'
    ),
    array(
        'q' => 'Does optimizing for GEO hurt traditional Google organic rankings?',
        'a' => 'No. GEO enhances traditional SEO because both Google algorithms and AI models reward high-information density, clean semantic HTML, sub-second Core Web Vitals, and authoritative structured data.'
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
                    Service /02 &bull; Answer Engine Visibility
                </div>
                <h1 class="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-brand-text leading-tight">
                    Generative Engine Optimization (GEO).
                </h1>
                <p class="text-sm sm:text-base text-brand-text-muted leading-relaxed">
                    When buyers ask conversational AI models for recommendations, ensure your brand is the primary cited source in ChatGPT, Perplexity, Claude, and Google AI Overviews.
                </p>
            </div>
        </div>

        <!-- 1. Quick Answer Block -->
        <div class="rounded-xl border border-brand-accent/30 bg-brand-accent/5 p-6 sm:p-7">
            <span class="font-mono text-[11px] font-bold uppercase tracking-wider text-brand-accent block mb-2">
                Executive Definition &bull; GEO Grounding
            </span>
            <p class="text-xs sm:text-sm text-brand-text leading-relaxed font-editorial italic">
                "Generative Engine Optimization (GEO) is the strategic engineering of website content, entity schemas, and information density to ensure large language models (ChatGPT, Perplexity, Claude, Google AI Overviews) retrieve, synthesize, and cite your brand in generated answers, capturing high-intent conversational buyers."
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
                        <span><strong>Home Services &amp; Contractors:</strong> Businesses whose customers ask AI Overviews or ChatGPT for top recommended providers.</span>
                    </li>
                    <li class="flex items-start gap-2">
                        <span class="text-brand-accent font-bold">&bull;</span>
                        <span><strong>Businesses Losing Traffic to AI Overviews:</strong> Companies seeing traditional clicks drop as AI answers questions directly.</span>
                    </li>
                    <li class="flex items-start gap-2">
                        <span class="text-brand-accent font-bold">&bull;</span>
                        <span><strong>Companies Burned by Traditional SEO:</strong> Teams seeking modern 2026 search authority instead of outdated keyword stuffing.</span>
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
                        <span><strong>AI Citation Exclusion:</strong> Competitors being recommended and cited in ChatGPT / Perplexity while your brand is ignored.</span>
                    </li>
                    <li class="flex items-start gap-2">
                        <span class="text-brand-accent font-bold">&bull;</span>
                        <span><strong>Zero-Click Dropoffs:</strong> Google AI Overviews answering user queries without driving traditional search clicks.</span>
                    </li>
                    <li class="flex items-start gap-2">
                        <span class="text-brand-accent font-bold">&bull;</span>
                        <span><strong>Crawler Inefficiency:</strong> Bloated client-side JavaScript preventing headless AI bots (GPTBot, ClaudeBot) from indexing your content.</span>
                    </li>
                </ul>
            </div>
        </section>

        <!-- 3. Deliverables -->
        <section class="minimal-card p-8 sm:p-10">
            <div class="font-mono text-xs font-semibold text-brand-accent mb-2">
                Execution &bull; Deliverables
            </div>
            <h2 class="font-display text-2xl font-bold text-brand-text mb-6">
                What Is Included (Concrete Deliverables)
            </h2>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div class="rounded-xl border border-brand-border bg-brand-surface p-5">
                    <span class="font-mono text-xs font-bold text-brand-accent block mb-1">01. Direct Answer (TL;DR) Extract Formatting</span>
                    <p class="text-xs sm:text-sm text-brand-text-muted leading-relaxed">
                        Structuring 40-60 word high-density answer blocks beneath primary headings across all cornerstone product and service pages.
                    </p>
                </div>

                <div class="rounded-xl border border-brand-border bg-brand-surface p-5">
                    <span class="font-mono text-xs font-bold text-brand-accent block mb-1">02. Standards-Compliant /llms.txt Architecture</span>
                    <p class="text-xs sm:text-sm text-brand-text-muted leading-relaxed">
                        Deployment of clean, machine-readable Markdown indexes optimized for direct LLM ingestion and context-window grounding.
                    </p>
                </div>

                <div class="rounded-xl border border-brand-border bg-brand-surface p-5">
                    <span class="font-mono text-xs font-bold text-brand-accent block mb-1">03. Neural Entity Linking &amp; Fact Extraction</span>
                    <p class="text-xs sm:text-sm text-brand-text-muted leading-relaxed">
                        Structuring proprietary statistics, benchmark studies, and named author credentials for unambiguous vector search retrieval.
                    </p>
                </div>

                <div class="rounded-xl border border-brand-border bg-brand-surface p-5">
                    <span class="font-mono text-xs font-bold text-brand-accent block mb-1">04. AI Answer Engine Telemetry &amp; Auditing</span>
                    <p class="text-xs sm:text-sm text-brand-text-muted leading-relaxed">
                        Continuous tracking of citation inclusion across Perplexity, ChatGPT Search, and Google AI Overviews with monthly share-of-voice reports.
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
                    $panel_id = 'geo-faq-' . $idx;
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
                Ensure Your Brand Dominates AI Answer Engines
            </h3>
            <p class="text-xs sm:text-sm text-brand-text-muted max-w-lg mx-auto mb-6">
                Request an AI visibility audit to see how often ChatGPT, Perplexity, and Google AI Overviews cite your website today versus your competitors.
            </p>
            <a href="<?php echo esc_url(home_url('/contact/')); ?>" class="btn-primary text-xs py-3 px-6 shadow-md inline-flex items-center gap-2">
                <span>Request Free GEO Visibility Audit &rarr;</span>
            </a>
        </section>

    </div>
</div>

<?php get_footer(); ?>
