import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'site-eval': '#8b5cf6',
        'operational': '#f59e0b',
        'process-sys': '#10b981',
        'planning': '#3b82f6',
        'admin': '#6b7280',
        'regulatory': '#ef4444',
        'lease': '#ec4899',
        'financial': '#f97316',
        'facility': '#14b8a6',
        'governance': '#6366f1',
      },
    },
  },
  plugins: [],
}

export default config
