<?php
/**
 * The main template file (fallback)
 * 
 * @package TheRamadhani
 */
if (!defined('ABSPATH')) exit;

get_header();
?>

<div class="py-12 sm:py-16">
    <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12">
        
        <header class="border-b border-brand-border pb-6">
            <h1 class="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-brand-text">
                <?php single_post_title(); ?>
            </h1>
        </header>

        <?php if (have_posts()) : ?>
            <div class="space-y-8">
                <?php while (have_posts()) : the_post(); ?>
                    <article id="post-<?php the_ID(); ?>" <?php post_class('minimal-card p-6 sm:p-8'); ?>>
                        <div class="font-mono text-xs text-brand-text-dim mb-2">
                            <time datetime="<?php echo esc_attr(get_the_date('c')); ?>"><?php echo esc_html(get_the_date()); ?></time>
                        </div>
                        <h2 class="font-display text-xl font-bold text-brand-text hover:text-brand-accent transition-colors">
                            <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
                        </h2>
                        <div class="mt-3 text-xs sm:text-sm text-brand-text-muted leading-relaxed line-clamp-3">
                            <?php the_excerpt(); ?>
                        </div>
                        <div class="mt-4 pt-4 border-t border-brand-border">
                            <a href="<?php the_permalink(); ?>" class="text-xs font-semibold text-brand-accent hover:underline">
                                Read More &rarr;
                            </a>
                        </div>
                    </article>
                <?php endwhile; ?>
            </div>

            <!-- Pagination -->
            <div class="pt-8 text-center font-mono text-xs">
                <?php the_posts_pagination(array(
                    'prev_text' => '&larr; Previous',
                    'next_text' => 'Next &rarr;',
                )); ?>
            </div>
        <?php else : ?>
            <div class="minimal-card p-8 text-center">
                <p class="text-sm text-brand-text-muted">No content found.</p>
            </div>
        <?php endif; ?>

    </div>
</div>

<?php get_footer(); ?>
