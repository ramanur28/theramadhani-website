/**
 * The Ramadhani WordPress Theme - Interactive Scripts
 * Handles mobile drawer, scroll animations, FAQ accordions, 
 * interactive audit calculator, and AJAX form handling.
 */

document.addEventListener('DOMContentLoaded', function () {
  // 1. Mobile Menu Toggle & Morphing Animation
  const menuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const innerMenu = document.getElementById('mobile-menu-inner');
  const iconOpen = document.getElementById('menu-icon-open');
  const iconClose = document.getElementById('menu-icon-close');

  if (menuBtn && mobileMenu && iconOpen && iconClose) {
    function setMenuState(isOpen) {
      menuBtn.setAttribute('aria-expanded', isOpen.toString());
      if (isOpen) {
        mobileMenu.classList.remove('grid-rows-[0fr]', 'opacity-0', 'pointer-events-none');
        mobileMenu.classList.add('grid-rows-[1fr]', 'opacity-100', 'pointer-events-auto');
        if (innerMenu) {
          innerMenu.classList.remove('-translate-y-2');
          innerMenu.classList.add('translate-y-0');
        }
        iconOpen.classList.remove('opacity-100', 'scale-100', 'rotate-0');
        iconOpen.classList.add('opacity-0', 'scale-75', '-rotate-90');
        iconClose.classList.remove('opacity-0', 'scale-75', 'rotate-90', 'pointer-events-none');
        iconClose.classList.add('opacity-100', 'scale-100', 'rotate-0');
      } else {
        mobileMenu.classList.remove('grid-rows-[1fr]', 'opacity-100', 'pointer-events-auto');
        mobileMenu.classList.add('grid-rows-[0fr]', 'opacity-0', 'pointer-events-none');
        if (innerMenu) {
          innerMenu.classList.remove('translate-y-0');
          innerMenu.classList.add('-translate-y-2');
        }
        iconOpen.classList.remove('opacity-0', 'scale-75', '-rotate-90');
        iconOpen.classList.add('opacity-100', 'scale-100', 'rotate-0');
        iconClose.classList.remove('opacity-100', 'scale-100', 'rotate-0');
        iconClose.classList.add('opacity-0', 'scale-75', 'rotate-90', 'pointer-events-none');
      }
    }

    menuBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      const isOpen = menuBtn.getAttribute('aria-expanded') === 'true';
      setMenuState(!isOpen);
    });

    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        setMenuState(false);
      });
    });

    document.addEventListener('click', function (e) {
      if (!mobileMenu.contains(e.target) && !menuBtn.contains(e.target)) {
        setMenuState(false);
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        setMenuState(false);
      }
    });
  }

  // 2. Scroll Progress Bar
  const progressBar = document.getElementById('scroll-progress-bar');
  if (progressBar) {
    function updateProgress() {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = scrollHeight > 0 ? scrollY / scrollHeight : 0;
      progressBar.style.transform = `scaleX(${progress})`;
    }
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  // 3. Scroll Reveal Animations (IntersectionObserver)
  const revealElements = document.querySelectorAll('.reveal-on-scroll, .reveal-fade-left, .reveal-fade-right, .reveal-scale');
  if (revealElements.length > 0) {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.05,
        rootMargin: '0px 0px -40px 0px'
      });

      revealElements.forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add('is-visible');
        } else {
          observer.observe(el);
        }
      });
    } else {
      revealElements.forEach(function (el) {
        el.classList.add('is-visible');
      });
    }
  }

  // 4. FAQ Accordion Toggle
  const faqToggles = document.querySelectorAll('.faq-toggle');
  faqToggles.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const isExpanded = btn.getAttribute('aria-expanded') === 'true';
      const panelId = btn.getAttribute('aria-controls');
      const panel = document.getElementById(panelId);
      const icon = btn.querySelector('.faq-icon');

      btn.setAttribute('aria-expanded', (!isExpanded).toString());
      if (panel) {
        if (!isExpanded) {
          panel.classList.remove('hidden');
          if (icon) icon.classList.add('rotate-180');
        } else {
          panel.classList.add('hidden');
          if (icon) icon.classList.remove('rotate-180');
        }
      }
    });
  });

  // 5. Interactive Performance Audit & Lead Loss Calculator
  const trafficInput = document.getElementById('calc-traffic');
  const cvrInput = document.getElementById('calc-cvr');
  const dealInput = document.getElementById('calc-deal');

  if (trafficInput && cvrInput && dealInput) {
    const monthlyLeakEl = document.getElementById('calc-monthly-leak');
    const annualLeakEl = document.getElementById('calc-annual-leak');
    const potentialLeadsEl = document.getElementById('calc-potential-leads');

    function calculateAudit() {
      const traffic = parseFloat(trafficInput.value) || 0;
      const currentCvr = parseFloat(cvrInput.value) || 0.5; // in %
      const avgDeal = parseFloat(dealInput.value) || 0;

      const targetCvr = 2.5;
      const cvrDelta = Math.max(0, (targetCvr - currentCvr) / 100);

      const missedLeads = Math.round(traffic * cvrDelta);
      const closedDeals = Math.round(missedLeads * 0.20);
      const monthlyRevenueLeak = closedDeals * avgDeal;
      const annualRevenueLeak = monthlyRevenueLeak * 12;

      const formatUSD = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

      if (monthlyLeakEl) monthlyLeakEl.textContent = formatUSD(monthlyRevenueLeak);
      if (annualLeakEl) annualLeakEl.textContent = formatUSD(annualRevenueLeak);
      if (potentialLeadsEl) potentialLeadsEl.textContent = missedLeads.toLocaleString() + ' leads/mo';
    }

    [trafficInput, cvrInput, dealInput].forEach(function (inp) {
      inp.addEventListener('input', calculateAudit);
    });
    calculateAudit();
  }

  // 6. Contact Form AJAX Submission
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    const formSuccess = document.getElementById('form-success');
    const formError = document.getElementById('form-error');
    const formErrorMsg = document.getElementById('form-error-msg');
    const submitBtn = document.getElementById('submit-btn');

    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      if (formError) formError.classList.add('hidden');
      if (formSuccess) formSuccess.classList.add('hidden');

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Transmitting Audit Request...</span>';
      }

      const formData = new FormData(contactForm);
      formData.append('action', 'theramadhani_submit_contact');
      if (window.theramadhani_ajax && window.theramadhani_ajax.nonce) {
        formData.append('nonce', window.theramadhani_ajax.nonce);
      }

      const ajaxUrl = (window.theramadhani_ajax && window.theramadhani_ajax.ajax_url) ? window.theramadhani_ajax.ajax_url : '/wp-admin/admin-ajax.php';

      fetch(ajaxUrl, {
        method: 'POST',
        body: formData
      })
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        if (data.success) {
          contactForm.reset();
          if (formSuccess) formSuccess.classList.remove('hidden');
          if (submitBtn) {
            submitBtn.innerHTML = '<span>Audit Request Sent &check;</span>';
          }
        } else {
          throw new Error(data.data || 'Failed to submit inquiry. Please try again.');
        }
      })
      .catch(function (err) {
        if (formError && formErrorMsg) {
          formErrorMsg.textContent = err.message || 'An error occurred while transmitting your request.';
          formError.classList.remove('hidden');
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Request Free Search &amp; Lead Audit &rarr;</span>';
        }
      });
    });
  }
});
