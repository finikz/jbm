/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // 九维暗色赛博朋克主题
        cyber: {
          bg: '#1a1a2e',         // 主背景
          surface: '#16213e',     // 卡片面
          surface2: '#0f3460',    // 次级面
          border: '#1e2a4a',      // 边框
          gold: '#e6a817',        // 琥珀金强调色
          'gold-dim': '#b8860b',  // 暗金
          text: '#e0e0e0',        // 主文字
          'text-dim': '#8888aa',  // 次要文字
          danger: '#e94560',      // 危险红
          success: '#0fbc7c',     // 成功绿
          warning: '#f5a623',     // 警告橙
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'monospace'],
      },
      boxShadow: {
        'glow-gold': '0 0 12px rgba(230, 168, 23, 0.3)',
        'glow-danger': '0 0 12px rgba(233, 69, 96, 0.3)',
      },
    },
  },
  plugins: [],
};
