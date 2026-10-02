import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        teal: {
          primary: '#1f6f5c',
          light: '#4fb69b',
          dark: '#155045',
        },
      },
    },
  },
  plugins: [],
};
export default config;
