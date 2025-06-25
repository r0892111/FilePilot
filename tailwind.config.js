/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        slate: {
          900: '#1E293B',
          800: '#334155',
          700: '#475569',
        },
        gray: {
          50: '#F1F5F9',
          100: '#F8FAFC',
        },
        blue: {
          600: '#3B82F6',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'scroll-left': 'scrollLeft 40s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scrollLeft: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
  safelist: [
    'bg-blue-100',
    'bg-green-100', 
    'bg-purple-100',
    'bg-red-100',
    'text-blue-600',
    'text-green-600',
    'text-purple-600', 
    'text-red-600',
  ],
};