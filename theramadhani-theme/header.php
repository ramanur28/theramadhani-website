<?php
/**
 * The Header for The Ramadhani Theme
 * 
 * @package TheRamadhani
 */
if (!defined('ABSPATH')) exit;

$current_url = home_url(add_query_arg(array(), $GLOBALS['wp']->request));
$current_url = trailingslashit($current_url);

$services = array(
    array(
        'name'  => 'Technical & Organic SEO',
        'url'   => home_url('/services/seo/'),
        'desc'  => 'Architecture, schema graphs, rendering & indexing.',
        'badge' => 'Code-First'
    ),
    array(
        'name'  => 'Generative Engine Optimization (GEO)',
        'url'   => home_url('/services/geo/'),
        'desc'  => 'Answer engine visibility (Perplexity, ChatGPT, AI Overviews).',
        'badge' => 'AI Search'
    ),
    array(
        'name'  => 'Google Ads & Paid Search',
        'url'   => home_url('/services/google-ads/'),
        'desc'  => 'High-intent search capture & ROAS turnaround.',
        'badge' => 'High ROAS'
    )
);

$other_links = array(
    array('name' => 'Proof / Work', 'url' => home_url('/work/')),
    array('name' => 'About',        'url' => home_url('/about/')),
    array('name' => 'Contact',      'url' => home_url('/contact/')),
);
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?> class="scroll-smooth">
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <link rel="icon" type="image/svg+xml" href="<?php echo esc_url(get_template_directory_uri() . '/assets/images/brand-logo.svg'); ?>">
    <link rel="apple-touch-icon" href="<?php echo esc_url(get_template_directory_uri() . '/assets/images/brand-logo.png'); ?>">
    <?php wp_head(); ?>
</head>
<body <?php body_class('min-h-screen overflow-x-hidden bg-brand-bg text-brand-text'); ?>>
<?php wp_body_open(); ?>

<!-- Scroll Progress Bar -->
<div id="scroll-progress-bar" class="fixed top-0 left-0 right-0 h-[2.5px] bg-brand-accent origin-left z-[100] transform scale-x-0 transition-transform duration-75"></div>

<!-- Site Header -->
<header class="sticky top-0 z-50 w-full border-b border-brand-border bg-brand-bg/95 backdrop-blur-md">
    <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        <!-- Brand Logo & Monogram -->
        <a href="<?php echo esc_url(home_url('/')); ?>" class="group flex items-center gap-2 focus:outline-none" aria-label="The Ramadhani Homepage">
            <img
                src="<?php echo esc_url(get_template_directory_uri() . '/assets/images/brand-logo.webp'); ?>"
                alt="The Ramadhani monogram"
                width="32"
                height="32"
                class="h-7 w-7 sm:h-8 sm:w-8 object-contain group-hover:scale-105 transition-transform duration-200"
            />
            <span class="font-script text-[28px] sm:text-[32px] font-normal text-brand-text group-hover:text-brand-accent transition-colors leading-none tracking-normal pt-1.5">
                The Ramadhani
            </span>
        </a>

        <!-- Desktop Navigation -->
        <nav class="hidden md:flex items-center gap-6" aria-label="Main Navigation">
            
            <!-- Services Dropdown Group -->
            <div class="relative group">
                <button
                    type="button"
                    class="flex items-center gap-1.5 text-xs font-medium text-brand-text-muted hover:text-brand-text focus:outline-none py-2 transition-colors cursor-pointer"
                    aria-haspopup="true"
                    aria-expanded="false"
                >
                    <span>Services</span>
                    <svg class="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-180 text-brand-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                <!-- Dropdown Flyout Panel -->
                <div class="invisible group-hover:visible group-focus-within:visible opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-200 absolute top-full left-1/2 -translate-x-1/2 w-80 rounded-xl border border-brand-border bg-brand-bg/98 backdrop-blur-lg shadow-xl p-2 z-50">
                    <div class="space-y-1">
                        <?php foreach ($services as $srv) : 
                            $is_active = (strpos($current_url, $srv['url']) !== false);
                        ?>
                            <a
                                href="<?php echo esc_url($srv['url']); ?>"
                                class="block rounded-lg p-2.5 hover:bg-brand-surface transition-colors <?php echo $is_active ? 'bg-brand-surface text-brand-accent' : 'text-brand-text'; ?>"
                            >
                                <div class="flex items-center justify-between text-xs font-semibold">
                                    <span><?php echo esc_html($srv['name']); ?></span>
                                    <span class="font-mono text-[10px] text-brand-accent bg-brand-accent/10 px-1.5 py-0.5 rounded">
                                        <?php echo esc_html($srv['badge']); ?>
                                    </span>
                                </div>
                                <p class="text-[11px] text-brand-text-muted leading-snug mt-1">
                                    <?php echo esc_html($srv['desc']); ?>
                                </p>
                            </a>
                        <?php endforeach; ?>
                    </div>
                </div>
            </div>

            <!-- Other Links -->
            <?php foreach ($other_links as $link) : 
                $is_active = ($current_url === $link['url']);
            ?>
                <a
                    href="<?php echo esc_url($link['url']); ?>"
                    class="text-xs font-medium transition-colors <?php echo $is_active ? 'text-brand-accent font-semibold' : 'text-brand-text-muted hover:text-brand-text'; ?>"
                >
                    <?php echo esc_html($link['name']); ?>
                </a>
            <?php endforeach; ?>

            <!-- Header Action Button (Book Audit) -->
            <a
                href="<?php echo esc_url(home_url('/contact/')); ?>"
                class="ml-2 inline-flex items-center justify-center rounded-lg bg-brand-accent px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-accent-hover transition-colors focus-visible:ring-2 focus-visible:ring-brand-accent shadow-xs"
            >
                Book Audit
            </a>
        </nav>

        <!-- Mobile Menu Toggle Button with Morphing Animation -->
        <div class="flex items-center md:hidden">
            <button
                type="button"
                id="mobile-menu-btn"
                class="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-brand-text hover:bg-brand-surface hover:text-brand-accent focus:outline-none cursor-pointer transition-colors"
                aria-controls="mobile-menu"
                aria-expanded="false"
                aria-label="Toggle navigation menu"
            >
                <!-- Hamburger Bars Icon -->
                <svg id="menu-icon-open" class="h-5 w-5 transition-all duration-300 transform opacity-100 scale-100 rotate-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <!-- Close (X) Icon -->
                <svg id="menu-icon-close" class="absolute h-5 w-5 transition-all duration-300 transform opacity-0 scale-75 rotate-90 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    </div>

    <!-- Mobile Dropdown Navigation -->
    <div
        id="mobile-menu"
        class="absolute top-full left-0 w-full grid grid-rows-[0fr] opacity-0 pointer-events-none transition-all duration-300 md:hidden border-b border-brand-border bg-brand-bg/95 backdrop-blur-xl shadow-2xl overflow-hidden"
    >
        <div id="mobile-menu-inner" class="min-h-0 px-4 py-4 space-y-3 transition-transform duration-300 -translate-y-2">
            <!-- Services Group -->
            <div class="space-y-1">
                <div class="font-mono text-[11px] font-bold uppercase tracking-wider text-brand-accent px-3 py-1">
                    Services
                </div>
                <?php foreach ($services as $srv) : ?>
                    <a
                        href="<?php echo esc_url($srv['url']); ?>"
                        class="block rounded-lg px-3 py-2 text-xs font-medium text-brand-text hover:bg-brand-surface hover:text-brand-accent transition-colors"
                    >
                        <?php echo esc_html($srv['name']); ?>
                    </a>
                <?php endforeach; ?>
            </div>

            <!-- Other Links -->
            <div class="border-t border-brand-border pt-2 space-y-1">
                <?php foreach ($other_links as $link) : ?>
                    <a
                        href="<?php echo esc_url($link['url']); ?>"
                        class="block rounded-lg px-3 py-2 text-sm text-brand-text hover:bg-brand-surface hover:text-brand-accent transition-colors"
                    >
                        <?php echo esc_html($link['name']); ?>
                    </a>
                <?php endforeach; ?>
            </div>

            <!-- CTA -->
            <div class="pt-2">
                <a
                    href="<?php echo esc_url(home_url('/contact/')); ?>"
                    class="block w-full rounded-lg bg-brand-accent py-2.5 text-center text-xs font-semibold text-white hover:bg-brand-accent-hover transition-colors shadow-sm"
                >
                    Book Strategic Audit
                </a>
            </div>
        </div>
    </div>
</header>
<main class="flex-grow">
