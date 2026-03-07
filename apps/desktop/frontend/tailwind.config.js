/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          // 清爽白色背景，黑黄为装饰色
          primary: {
            DEFAULT: '#FFD200',      // 黄色主装饰色
            hover: '#FFDF40',
            low: 'rgba(255, 210, 0, 0.15)',
          },
          secondary: '#1A1A1A',      // 黑色副装饰色
          sub: '#FFFFFF',            // 主背景：纯白
          accent: '#FFD200',         // 黄色强调
          'text-main': '#1A1A1A',    // 主文字：黑色
          muted: '#9CA3AF',          // 灰色辅助文字
          'surface': '#F5F5F5',      // 卡片/模块背景：浅灰
          'border': '#E5E7EB',       // 边框颜色
        },
        fontFamily: {
          sans: ['Barlow', 'Inter', 'system-ui', 'sans-serif'],
          mono: ['ui-monospace', 'Consolas', 'monospace'],
        },
        keyframes: {
          breath: {
            '0%, 100%': { opacity: '0.3', transform: 'scaleX(0.95)' },
            '50%': { opacity: '1', transform: 'scaleX(1)' },
          },
          'scan-line': {
            '0%': { transform: 'translateY(-100%)' },
            '100%': { transform: 'translateY(100%)' },
          },
          pulse: {
            '0%, 100%': { opacity: '1' },
            '50%': { opacity: '0.5' },
          }
        },
        animation: {
          breath: 'breath 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          'scan-fast': 'scan-line 3s linear infinite',
          pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        },
      },
    },
    plugins: [],
  }
