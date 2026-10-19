<?php
/**
 * The Footer for The Ramadhani Theme
 * 
 * @package TheRamadhani
 */
if (!defined('ABSPATH')) exit;
$current_year = date('Y');
?>
</main>

<footer class="border-t border-brand-border bg-brand-bg py-16 text-brand-text-muted mt-20">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 gap-10 md:grid-cols-4">
            
            <!-- Brand Column -->
            <div class="md:col-span-2 space-y-4">
                <a href="<?php echo esc_url(home_url('/')); ?>" class="group flex items-center gap-2 text-brand-text focus:outline-none" aria-label="The Ramadhani Homepage">
                    <img
                        src="<?php echo esc_url(get_template_directory_uri() . '/assets/images/brand-logo.webp'); ?>"
                        alt="The Ramadhani monogram"
                        width="32"
                        height="32"
                        class="h-8 w-8 object-contain group-hover:scale-105 transition-transform duration-200"
                    />
                    <span class="font-script text-[26px] font-normal tracking-normal text-brand-text group-hover:text-brand-accent transition-colors leading-none pt-1">
                        The Ramadhani
                    </span>
                </a>
                <p class="max-w-sm text-xs leading-relaxed text-brand-text-muted">
                    Digital marketing authority engineering Technical SEO, Generative Engine Optimization (GEO), and high-ROI Google Ads campaigns for data-led brands.
                </p>
                <div class="flex items-center gap-3 pt-2 text-brand-text-dim text-xs font-medium">
                    <a href="https://www.linkedin.com/in/ramadhani-marketing" target="_blank" rel="noopener noreferrer" class="hover:text-brand-accent transition-colors">LinkedIn</a>
                    <span>&bull;</span>
                    <a href="https://twitter.com/ramadhani_seo" target="_blank" rel="noopener noreferrer" class="hover:text-brand-accent transition-colors">Twitter/X</a>
                    <span>&bull;</span>
                    <a href="https://github.com/ramadhani" target="_blank" rel="noopener noreferrer" class="hover:text-brand-accent transition-colors">GitHub</a>
                </div>
            </div>

            <!-- Services -->
            <div>
                <h4 class="text-xs font-semibold uppercase tracking-wider text-brand-text">Services</h4>
                <ul class="mt-3 space-y-2 text-xs">
                    <li><a href="<?php echo esc_url(home_url('/services/seo/')); ?>" class="hover:text-brand-accent transition-colors">Technical &amp; Organic SEO</a></li>
                    <li><a href="<?php echo esc_url(home_url('/services/geo/')); ?>" class="hover:text-brand-accent transition-colors">Generative Engine Optimization</a></li>
                    <li><a href="<?php echo esc_url(home_url('/services/google-ads/')); ?>" class="hover:text-brand-accent transition-colors">Google Ads Optimization</a></li>
                    <li><a href="<?php echo esc_url(home_url('/services/seo/workflow/')); ?>" class="hover:text-brand-accent transition-colors">SEO Service Workflow</a></li>
                </ul>
            </div>

            <!-- Directives & Info -->
            <div>
                <h4 class="text-xs font-semibold uppercase tracking-wider text-brand-text">Directory &amp; Proof</h4>
                <ul class="mt-3 space-y-2 text-xs">
                    <li><a href="<?php echo esc_url(home_url('/work/')); ?>" class="hover:text-brand-accent transition-colors">Proof / Case Studies</a></li>
                    <li><a href="<?php echo esc_url(home_url('/about/')); ?>" class="hover:text-brand-accent transition-colors">About Ramadhani</a></li>
                    <li><a href="<?php echo esc_url(home_url('/contact/')); ?>" class="hover:text-brand-accent transition-colors">Request Strategic Audit</a></li>
                </ul>
            </div>
        </div>

        <div class="mt-12 flex flex-col items-center justify-between border-t border-brand-border pt-6 text-[11px] text-brand-text-dim sm:flex-row font-medium">
            <p>&copy; <?php echo esc_html($current_year); ?> The Ramadhani. Engineered for search authority &amp; revenue conversion.</p>
            <div class="mt-2 sm:mt-0 flex gap-4">
                <span>WCAG AA Compliant</span>
                <span>&bull;</span>
                <span>WordPress Custom Theme</span>
            </div>
        </div>
    </div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
