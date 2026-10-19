<?php
/**
 * The template for displaying all single pages
 * 
 * @package TheRamadhani
 */
if (!defined('ABSPATH')) exit;

get_header();

$breadcrumbs = array(
    get_the_title() => ''
);
?>

<div class="py-12 sm:py-16">
    <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        
        <!-- Breadcrumbs -->
        <?php theramadhani_render_breadcrumbs($breadcrumbs); ?>

        <?php while (have_posts()) : the_post(); ?>
            <article id="post-<?php the_ID(); ?>" <?php post_class('space-y-8'); ?>>
                
                <header class="border-b border-brand-border pb-6">
                    <h1 class="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-brand-text">
                        <?php the_title(); ?>
                    </h1>
                </header>

                <?php if (has_post_thumbnail()) : ?>
                    <div class="aspect-video w-full rounded-2xl overflow-hidden bg-brand-surface border border-brand-border shadow-sm">
                        <?php the_post_thumbnail('large', array('class' => 'w-full h-full object-cover')); ?>
                    </div>
                <?php endif; ?>

                <div class="prose max-w-none text-base leading-relaxed text-[#374151]">
                    <?php
                    the_content();

                    wp_link_pages(array(
                        'before' => '<div class="page-links mt-8 font-mono text-xs">' . esc_html__('Pages:', 'theramadhani'),
                        'after'  => '</div>',
                    ));
                    ?>
                </div>

            </article>
        <?php endwhile; ?>

    </div>
</div>

<?php get_footer(); ?>
