/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#FAFAF8',
          surface: '#F4F4F0',
          panel: '#ECECE6',
          card: '#FFFFFF',
          border: 'rgba(0, 0, 0, 0.08)',
          'border-hover': 'rgba(0, 0, 0, 0.18)',
          text: '#111317',
          'text-muted': '#475063',
          'text-dim': '#6B7280',
          accent: '#D97706',
          'accent-hover': '#B45309',
          'accent-dim': 'rgba(217, 119, 6, 0.08)',
          'accent-glow': 'rgba(217, 119, 6, 0.15)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        editorial: ['Newsreader', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
        script: ['"Alex Brush"', '"Great Vibes"', 'cursive'],
      },
      maxWidth: {
        prose: '68ch',
      },
      transitionTimingFunction: {
        'brand': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      typography: () => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': '#374151',
            '--tw-prose-headings': '#111317',
            '--tw-prose-lead': '#4B5563',
            '--tw-prose-links': '#D97706',
            '--tw-prose-bold': '#111317',
            '--tw-prose-counters': '#6B7280',
            '--tw-prose-bullets': '#D97706',
            '--tw-prose-hr': 'rgba(0, 0, 0, 0.08)',
            '--tw-prose-quotes': '#1F2937',
            '--tw-prose-quote-borders': '#D97706',
            '--tw-prose-captions': '#6B7280',
            '--tw-prose-code': '#B45309',
            '--tw-prose-pre-code': '#1F2937',
            '--tw-prose-pre-bg': '#F4F4F0',
            '--tw-prose-th-borders': 'rgba(0, 0, 0, 0.12)',
            '--tw-prose-td-borders': 'rgba(0, 0, 0, 0.06)',
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
