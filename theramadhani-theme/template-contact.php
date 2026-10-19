<?php
/**
 * Template Name: Contact Page
 * 
 * Template for the Contact & Audit Request page
 * @package TheRamadhani
 */
if (!defined('ABSPATH')) exit;

get_header();

$breadcrumbs = array(
    'Contact' => ''
);
?>

<div class="py-12 sm:py-16">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        
        <!-- Breadcrumbs -->
        <?php theramadhani_render_breadcrumbs($breadcrumbs); ?>

        <!-- Hero Header -->
        <div class="max-w-3xl mb-12 space-y-4">
            <div class="inline-flex items-center gap-2 rounded-full border border-brand-accent/30 bg-brand-surface px-3.5 py-1 text-xs font-mono font-semibold text-brand-accent">
                Confidential Consultation &bull; 48-Hour Audit
            </div>
            <h1 class="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-brand-text leading-tight">
                Stop losing search traffic. Start generating qualified leads.
            </h1>
            <p class="text-sm sm:text-base text-brand-text-muted leading-relaxed">
                I personally audit your Google rankings, pinpoint where article readers are bouncing, and deliver a concrete blueprint to turn your website into an automated lead-generating machine.
            </p>
        </div>

        <div class="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <!-- Left: Audit Request Form -->
            <div class="lg:col-span-7">
                <div class="minimal-card p-8 sm:p-10">
                    <h2 class="font-display text-xl font-bold text-brand-text mb-2">
                        Request Your Search &amp; Lead Conversion Audit
                    </h2>
                    <p class="text-xs text-brand-text-muted mb-8">
                        Fill out your details below. I personally review your domain's rankings and conversion bottlenecks and respond within 24 business hours.
                    </p>

                    <form
                        method="POST"
                        class="space-y-5"
                        id="contact-form"
                    >
                        <!-- Honeypot anti-spam (hidden from real users) -->
                        <div style="display:none !important;" aria-hidden="true">
                            <input type="text" name="website_hp" tabindex="-1" autocomplete="off" />
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label for="name" class="block text-xs font-medium text-brand-text-muted mb-1.5 font-mono">
                                    Your Name *
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    required
                                    placeholder="John Davis"
                                    class="w-full rounded-lg border border-brand-border bg-brand-surface px-3.5 py-2.5 text-xs text-brand-text placeholder-brand-text-dim focus:border-brand-accent focus:outline-none"
                                />
                            </div>

                            <div>
                                <label for="email" class="block text-xs font-medium text-brand-text-muted mb-1.5 font-mono">
                                    Business Email *
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    required
                                    placeholder="john@mybusiness.com"
                                    class="w-full rounded-lg border border-brand-border bg-brand-surface px-3.5 py-2.5 text-xs text-brand-text placeholder-brand-text-dim focus:border-brand-accent focus:outline-none"
                                />
                            </div>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label for="website" class="block text-xs font-medium text-brand-text-muted mb-1.5 font-mono">
                                    Website URL *
                                </label>
                                <input
                                    type="url"
                                    id="website"
                                    name="website"
                                    required
                                    placeholder="https://mybusiness.com"
                                    class="w-full rounded-lg border border-brand-border bg-brand-surface px-3.5 py-2.5 text-xs text-brand-text placeholder-brand-text-dim focus:border-brand-accent focus:outline-none"
                                />
                            </div>

                            <div>
                                <label for="industry" class="block text-xs font-medium text-brand-text-muted mb-1.5 font-mono">
                                    Industry Priority / Business Type *
                                </label>
                                <select
                                    id="industry"
                                    name="industry"
                                    required
                                    class="w-full rounded-lg border border-brand-border bg-brand-surface px-3.5 py-2.5 text-xs text-brand-text focus:border-brand-accent focus:outline-none"
                                >
                                    <optgroup label="Primary Priority Focus">
                                        <option value="home-services">Home Services Agencies &amp; Contractors</option>
                                        <option value="real-estate">Real Estate Agencies &amp; Brokerages</option>
                                    </optgroup>
                                    <optgroup label="Specialized Growth Verticals">
                                        <option value="medical-wellness">Medical &amp; Wellness Businesses</option>
                                        <option value="b2b-saas">B2B SaaS &amp; Tech Platforms</option>
                                        <option value="finance">Finance &amp; Wealth Advisory</option>
                                        <option value="travel">Travel &amp; Hospitality Agencies</option>
                                    </optgroup>
                                    <optgroup label="Other Scenarios">
                                        <option value="agency-burnout">Burned By Past SEO Agency (Need Sales)</option>
                                        <option value="other">Other High-Intent Commercial Business</option>
                                    </optgroup>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label for="service" class="block text-xs font-medium text-brand-text-muted mb-1.5 font-mono">
                                Primary Goal *
                            </label>
                            <select
                                id="service"
                                name="service"
                                required
                                class="w-full rounded-lg border border-brand-border bg-brand-surface px-3.5 py-2.5 text-xs text-brand-text focus:border-brand-accent focus:outline-none"
                            >
                                <option value="article-conversion">Turn Search Traffic &amp; Articles Into Leads (Primary)</option>
                                <option value="rankings">Rank Top-3 on Google for Commercial Keywords</option>
                                <option value="geo">Dominate Google AI Overviews &amp; Generative Engines</option>
                                <option value="full-engine">Full Search-to-Lead Growth Engine (All 3)</option>
                            </select>
                        </div>

                        <div>
                            <label for="message" class="block text-xs font-medium text-brand-text-muted mb-1.5 font-mono">
                                Current Search Bottlenecks &amp; Monthly Lead Goals *
                            </label>
                            <textarea
                                id="message"
                                name="message"
                                rows="4"
                                required
                                placeholder="Tell me about your current website traffic, past experience with SEO agencies, and how many qualified leads or booked jobs you want per month..."
                                class="w-full rounded-lg border border-brand-border bg-brand-surface px-3.5 py-2.5 text-xs text-brand-text placeholder-brand-text-dim focus:border-brand-accent focus:outline-none"
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            id="submit-btn"
                            class="btn-primary w-full text-xs py-3 cursor-pointer shadow-sm"
                        >
                            <span>Request Free Search &amp; Lead Audit &rarr;</span>
                        </button>
                    </form>

                    <!-- Feedback Alert Boxes -->
                    <div id="form-error" class="hidden mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-xs text-red-600 text-center">
                        <p id="form-error-msg" class="font-medium"></p>
                    </div>

                    <div id="form-success" class="hidden mt-6 rounded-xl border border-brand-accent/40 bg-brand-accent/10 p-5 text-center text-xs text-brand-text">
                        <p class="font-bold text-brand-accent text-sm">Audit Request Received &check;</p>
                        <p class="mt-1 text-brand-text-muted">I have received your domain details and will reply personally with initial diagnostic insights within 24 business hours.</p>
                    </div>
                </div>
            </div>

            <!-- Right: Direct Expectations & Engagement Details -->
            <div class="lg:col-span-5 space-y-6">
                <div class="minimal-card p-6 sm:p-7">
                    <h3 class="font-display text-sm font-bold text-brand-text mb-4">What Happens in the Audit?</h3>
                    <ol class="space-y-3.5 text-xs text-brand-text-muted">
                        <li class="flex gap-2.5">
                            <span class="font-mono text-brand-accent font-bold">01.</span>
                            <span><strong class="text-brand-text">Traffic Leak Analysis:</strong> I pinpoint exactly where your current article and page visitors are bouncing without taking action.</span>
                        </li>
                        <li class="flex gap-2.5">
                            <span class="font-mono text-brand-accent font-bold">02.</span>
                            <span><strong class="text-brand-text">Commercial Keyword Gap:</strong> I identify high-ticket commercial keywords your competitors are ranking for that you are currently missing.</span>
                        </li>
                        <li class="flex gap-2.5">
                            <span class="font-mono text-brand-accent font-bold">03.</span>
                            <span><strong class="text-brand-text">Lead Engine Blueprint:</strong> A step-by-step roadmap to re-engineer your articles and rank in Google's Top 3 with measurable revenue accountability.</span>
                        </li>
                    </ol>
                </div>

                <div class="minimal-card p-6 sm:p-7">
                    <h3 class="font-display text-sm font-bold text-brand-text mb-4">Direct Communication</h3>
                    <div class="space-y-3 text-xs text-brand-text-muted">
                        <div>
                            <span class="block text-brand-text-dim font-mono text-[11px]">Direct Email:</span>
                            <a href="mailto:contact@theramadhani.com" class="font-semibold text-brand-text hover:text-brand-accent transition-colors">
                                contact@theramadhani.com
                            </a>
                        </div>
                        <div>
                            <span class="block text-brand-text-dim font-mono text-[11px]">Response Time Commitment:</span>
                            <span class="font-semibold text-brand-text">&lt; 24 Business Hours</span>
                        </div>
                        <div>
                            <span class="block text-brand-text-dim font-mono text-[11px]">Specialist Guarantee:</span>
                            <span class="font-medium text-brand-text">Zero junior account managers. You work directly with me.</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>
</div>

<?php get_footer(); ?>
