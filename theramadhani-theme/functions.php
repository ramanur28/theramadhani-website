<?php
/**
 * The Ramadhani WordPress Theme Functions & Definitions
 * 
 * @package TheRamadhani
 * @version 1.0.0
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

/**
 * 1. Theme Setup
 */
function theramadhani_setup() {
    // Let WordPress manage document title tag
    add_theme_support('title-tag');

    // Enable featured images
    add_theme_support('post-thumbnails');

    // Switch default core markup to HTML5
    add_theme_support('html5', array(
        'search-form',
        'comment-form',
        'comment-list',
        'gallery',
        'caption',
        'style',
        'script'
    ));

    // Custom Logo Support
    add_theme_support('custom-logo', array(
        'height'      => 64,
        'width'       => 64,
        'flex-height' => true,
        'flex-width'  => true,
    ));

    // Register Navigation Menus
    register_nav_menus(array(
        'primary-menu'   => __('Primary Navigation Header', 'theramadhani'),
        'footer-services'=> __('Footer Services Menu', 'theramadhani'),
    ));
}
add_action('after_setup_theme', 'theramadhani_setup');

/**
 * 2. Enqueue Styles & Scripts
 */
function theramadhani_enqueue_assets() {
    // High-performance Google Fonts
    wp_enqueue_style(
        'theramadhani-fonts',
        'https://fonts.googleapis.com/css2?family=Alex+Brush&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap',
        array(),
        null
    );

    // Main Theme Compiled CSS (Tailwind & Utilities)
    wp_enqueue_style(
        'theramadhani-core-css',
        get_template_directory_uri() . '/assets/css/theme.css',
        array(),
        '1.0.0'
    );

    // Active Theme style.css
    wp_enqueue_style(
        'theramadhani-style',
        get_stylesheet_uri(),
        array('theramadhani-core-css'),
        '1.0.0'
    );

    // Main Theme JavaScript
    wp_enqueue_script(
        'theramadhani-js',
        get_template_directory_uri() . '/assets/js/theme.js',
        array(),
        '1.0.0',
        true
    );

    // Pass AJAX configuration to JavaScript
    wp_localize_script('theramadhani-js', 'theramadhani_ajax', array(
        'ajax_url' => admin_url('admin-ajax.php'),
        'nonce'    => wp_create_nonce('theramadhani_contact_nonce'),
    ));
}
add_action('wp_enqueue_scripts', 'theramadhani_enqueue_assets');

/**
 * 3. Enforce Trailing Slash Consistency for Clean SEO Indexing
 */
function theramadhani_enforce_trailing_slash($string, $type_of_url = '') {
    if ($type_of_url !== 'single' && !preg_match('/\.[a-zA-Z0-9]+$/', $string)) {
        $string = trailingslashit($string);
    }
    return $string;
}
add_filter('user_trailingslashit', 'theramadhani_enforce_trailing_slash', 10, 2);

/**
 * 4. Helper Function: Get Asset URL
 */
function theramadhani_asset($path) {
    return esc_url(get_template_directory_uri() . '/assets/images/' . ltrim($path, '/'));
}

/**
 * 5. Helper Function: Breadcrumbs
 */
function theramadhani_render_breadcrumbs($items = array()) {
    if (empty($items)) return;
    ?>
    <nav aria-label="Breadcrumb" class="mb-6 flex items-center gap-2 text-xs text-brand-text-dim font-mono">
        <a href="<?php echo esc_url(home_url('/')); ?>" class="hover:text-brand-accent transition-colors">Home</a>
        <?php foreach ($items as $name => $url) : ?>
            <span>/</span>
            <?php if (!empty($url)) : ?>
                <a href="<?php echo esc_url($url); ?>" class="hover:text-brand-accent transition-colors"><?php echo esc_html($name); ?></a>
            <?php else : ?>
                <span class="text-brand-text font-semibold"><?php echo esc_html($name); ?></span>
            <?php endif; ?>
        <?php endforeach; ?>
    </nav>
    <?php
}

/**
 * 6. Contact Form AJAX Handler
 */
function theramadhani_handle_contact_ajax() {
    // 1. Verify Nonce
    if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'theramadhani_contact_nonce')) {
        wp_send_json_error(__('Security verification failed. Please refresh and try again.', 'theramadhani'));
    }

    // 2. Honeypot check (anti-spam)
    if (!empty($_POST['website_hp'])) {
        wp_send_json_error(__('Spam detected.', 'theramadhani'));
    }

    // 3. Sanitize inputs
    $name     = isset($_POST['name']) ? sanitize_text_field($_POST['name']) : '';
    $email    = isset($_POST['email']) ? sanitize_email($_POST['email']) : '';
    $website  = isset($_POST['website']) ? esc_url_raw($_POST['website']) : '';
    $industry = isset($_POST['industry']) ? sanitize_text_field($_POST['industry']) : '';
    $service  = isset($_POST['service']) ? sanitize_text_field($_POST['service']) : '';
    $message  = isset($_POST['message']) ? sanitize_textarea_field($_POST['message']) : '';

    if (empty($name) || empty($email) || empty($website) || empty($message)) {
        wp_send_json_error(__('Please fill in all required fields.', 'theramadhani'));
    }

    // 4. Construct Email Notification
    $admin_email = get_option('admin_email');
    $to = !empty($admin_email) ? $admin_email : 'contact@theramadhani.com';
    $subject = sprintf('[Audit Request] New Inquiry from %s (%s)', $name, $website);
    $body  = "A new strategic audit inquiry has been received on The Ramadhani:\n\n";
    $body .= "Name: " . $name . "\n";
    $body .= "Business Email: " . $email . "\n";
    $body .= "Website: " . $website . "\n";
    $body .= "Industry / Priority: " . $industry . "\n";
    $body .= "Primary Goal: " . $service . "\n\n";
    $body .= "Search Bottlenecks & Monthly Goals:\n" . $message . "\n\n";
    $body .= "IP Address: " . sanitize_text_field($_SERVER['REMOTE_ADDR']) . "\n";
    $body .= "Date: " . current_time('mysql') . "\n";

    $headers = array(
        'Content-Type: text/plain; charset=UTF-8',
        'Reply-To: ' . $name . ' <' . $email . '>'
    );

    $sent = wp_mail($to, $subject, $body, $headers);

    wp_send_json_success(array(
        'message' => __('Audit request received successfully! We will review your domain and respond within 24 business hours.', 'theramadhani')
    ));
}
add_action('wp_ajax_theramadhani_submit_contact', 'theramadhani_handle_contact_ajax');
add_action('wp_ajax_nopriv_theramadhani_submit_contact', 'theramadhani_handle_contact_ajax');
