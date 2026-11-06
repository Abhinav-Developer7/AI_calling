/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        app: 'var(--bg-app)',
        surface: {
          DEFAULT: 'var(--surface)',
          muted: 'var(--surface-muted)',
          elevated: 'var(--surface-elevated)',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          secondary: 'var(--ink-secondary)',
          soft: 'var(--ink-soft)',
        },
        frame: {
          DEFAULT: 'var(--frame)',
          dark: 'var(--frame-dark)',
          active: 'var(--frame-active)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          soft: 'var(--accent-soft)',
          ink: 'var(--accent-ink)',
        },
        status: {
          'success-bg': 'var(--status-success-bg)',
          'success-ink': 'var(--status-success-ink)',
          'neutral-bg': 'var(--status-neutral-bg)',
          'neutral-ink': 'var(--status-neutral-ink)',
          'danger-bg': 'var(--status-danger-bg)',
          'danger-ink': 'var(--status-danger-ink)',
          'info-bg': 'var(--status-info-bg)',
          'info-ink': 'var(--status-info-ink)',
          'warning-bg': 'var(--status-warning-bg)',
          'warning-ink': 'var(--status-warning-ink)',
        },
      },
      borderRadius: {
        sm: '12px',
        DEFAULT: '12px',
        md: '20px',
        lg: '24px',
        pill: '9999px',
        full: '9999px',
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        hover: 'var(--shadow-hover)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        malayalam: ['"Noto Sans Malayalam"', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
