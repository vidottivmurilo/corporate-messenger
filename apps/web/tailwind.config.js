/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
    "../../packages/chat-widget/src/**/*.{vue,js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#090D16',
        surface: '#111827',
        border: 'rgba(255, 255, 255, 0.1)',
        foreground: '#F9FAFB',
        muted: '#9CA3AF',
        primary: '#3B82F6',
        destructive: '#EF4444',
        success: '#10B981'
      }
    },
  },
  plugins: [],
}
