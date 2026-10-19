<?php
/**
 * The template for displaying 404 pages (not found)
 * 
 * @package TheRamadhani
 */
if (!defined('ABSPATH')) exit;

get_header();
?>

<div class="relative py-20 sm:py-32 overflow-hidden">
    <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        
        <!-- Status Badge -->
        <div class="inline-flex items-center gap-2 rounded-full border border-brand-accent/30 bg-brand-surface px-4 py-1.5 font-mono text-xs font-semibold text-brand-accent mb-6 shadow-xs animate-hero-entrance">
            <span class="h-2 w-2 rounded-full bg-brand-accent animate-pulse"></span>
            HTTP Status 404 &bull; Resource Not Found
        </div>

        <!-- Headline -->
        <h1 class="font-display text-4xl font-extrabold tracking-tight text-brand-text sm:text-6xl lg:text-7xl leading-tight mb-6">
            Page Not Found
        </h1>

        <p class="mx-auto max-w-xl text-base sm:text-lg text-brand-text-muted leading-relaxed mb-10">
            The URL you requested could not be located on this server. It may have been relocated during site architecture optimization or generative engine updates.
        </p>

        <!-- Navigation CTAs -->
        <div class="flex flex-wrap items-center justify-center gap-4 mb-16">
            <a
                href="<?php echo esc_url(home_url('/')); ?>"
                class="inline-flex items-center gap-2 rounded-xl bg-brand-accent px-6 py-3.5 font-mono text-xs font-bold text-white transition-all hover:bg-brand-accent-hover shadow-sm"
            >
                <span>&larr; Return to Homepage</span>
            </a>
            <a
                href="<?php echo esc_url(home_url('/work/')); ?>"
                class="inline-flex items-center gap-2 rounded-xl border border-brand-border bg-brand-card px-6 py-3.5 font-mono text-xs font-semibold text-brand-text transition-all hover:border-brand-border-hover hover:bg-brand-surface"
            >
                <span>Verified Case Studies &rarr;</span>
            </a>
            <a
                href="<?php echo esc_url(home_url('/contact/')); ?>"
                class="inline-flex items-center gap-2 rounded-xl border border-brand-border bg-brand-card px-6 py-3.5 font-mono text-xs font-semibold text-brand-text transition-all hover:border-brand-border-hover hover:bg-brand-surface"
            >
                <span>Contact &amp; Audit</span>
            </a>
        </div>

        <!-- Quick Directory Cards -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3 text-left border-t border-brand-border/60 pt-12">
            <a
                href="<?php echo esc_url(home_url('/services/seo/')); ?>"
                class="group rounded-xl border border-brand-border bg-brand-card p-5 transition-all hover:border-brand-accent/50 hover:bg-brand-surface"
            >
                <div class="font-mono text-[11px] font-bold text-brand-accent uppercase mb-1">Service /01</div>
                <div class="font-display text-sm font-bold text-brand-text group-hover:text-brand-accent transition-colors">Technical &amp; Organic SEO &rarr;</div>
                <p class="mt-1 text-xs text-brand-text-dim">Commercial-intent rankings &amp; in-article conversion architecture.</p>
            </a>

            <a
                href="<?php echo esc_url(home_url('/services/geo/')); ?>"
                class="group rounded-xl border border-brand-border bg-brand-card p-5 transition-all hover:border-brand-accent/50 hover:bg-brand-surface"
            >
                <div class="font-mono text-[11px] font-bold text-brand-accent uppercase mb-1">Service /02</div>
                <div class="font-display text-sm font-bold text-brand-text group-hover:text-brand-accent transition-colors">Generative Engine Optimization &rarr;</div>
                <p class="mt-1 text-xs text-brand-text-dim">Answer engine synthesis in ChatGPT, Perplexity, and Claude.</p>
            </a>

            <a
                href="<?php echo esc_url(home_url('/contact/')); ?>"
                class="group rounded-xl border border-brand-border bg-brand-card p-5 transition-all hover:border-brand-accent/50 hover:bg-brand-surface"
            >
                <div class="font-mono text-[11px] font-bold text-brand-accent uppercase mb-1">Direct Contact</div>
                <div class="font-display text-sm font-bold text-brand-text group-hover:text-brand-accent transition-colors">Consultation &amp; Inquiries &rarr;</div>
                <p class="mt-1 text-xs text-brand-text-dim">Discuss organic growth and high-conversion search acquisition.</p>
            </a>
        </div>

    </div>
</div>

<?php get_footer(); ?>
