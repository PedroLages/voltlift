/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        surface: '#111111',
        surfaceHighlight: '#222222',
        primary: '#ccff00',
        primaryDark: '#aadd00',
        text: '#ffffff',
        textMuted: '#9ca3af', // Updated for WCAG AA compliance (4.74:1 contrast ratio on black)
        textSecondary: '#888888', // WCAG AA compliant secondary text (5.92:1 contrast on black)
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'neon': '0 0 20px rgba(204, 255, 0, 0.3)',
        'neon-strong': '0 0 30px rgba(204, 255, 0, 0.5)',
        'neon-intense': '0 0 40px rgba(204, 255, 0, 0.7), 0 0 60px rgba(204, 255, 0, 0.4)',
        'flame': '0 0 20px rgba(255, 100, 0, 0.4)',
        'flame-strong': '0 0 30px rgba(255, 100, 0, 0.6)',
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-in',
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'power-up': 'powerUp 0.6s ease-out',
        'shake': 'shake 0.5s ease-in-out',
        'scan': 'scan 2s linear infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)', opacity: '1' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(204, 255, 0, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(204, 255, 0, 0.6)' },
        },
        powerUp: {
          '0%': { transform: 'scaleY(0)', transformOrigin: 'bottom' },
          '100%': { transform: 'scaleY(1)', transformOrigin: 'bottom' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      }
    }
  },
  plugins: [],
}
