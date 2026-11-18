/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        night: '#0e1118',
        panel: '#1b2030',
        panel2: '#262d42',
        line: '#3a4466',
        grass: '#5cb85c',
        wood: '#b07a3e',
        stone: '#9aa0a6',
        iron: '#d8d8e0',
        gold: '#f5c518',
        diamond: '#4de2e0',
        danger: '#ef5350',
        ok: '#66d17a',
        ink: '#f2f2f7',
        mute: '#9aa3bd',
      },
      fontFamily: {
        pixel: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Courier New', 'monospace'],
      },
      boxShadow: {
        pixel: '4px 4px 0 0 #000',
        'pixel-sm': '2px 2px 0 0 #000',
      },
      keyframes: {
        trick: {
          '0%': { transform: 'scale(0.4) rotate(-20deg)', opacity: '0' },
          '30%': { transform: 'scale(1.15) rotate(6deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0)', opacity: '1' },
        },
        flip: {
          '0%': { transform: 'rotateX(0) rotateY(0)' },
          '100%': { transform: 'rotateX(360deg) rotateY(360deg)' },
        },
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-6px)' },
          '75%': { transform: 'translateX(6px)' },
        },
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        slideup: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      animation: {
        trick: 'trick 0.5s steps(6) both',
        flip: 'flip 0.7s linear',
        shake: 'shake 0.3s linear',
        floaty: 'floaty 2.4s ease-in-out infinite',
        slideup: 'slideup 0.22s ease-out both',
      },
    },
  },
  plugins: [],
}
