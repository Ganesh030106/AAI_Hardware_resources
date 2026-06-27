/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        "primary": "#135bec",
        "primary-hover": "#0e4bce",
        "background-light": "#f6f6f8",
        "background-dark": "#101622",
        "card-light": "#ffffff",
        "card-dark": "#1e293b",
        "text-main-light": "#0d121b",
        "text-main-dark": "#f8fafc",
        "text-muted-light": "#4c669a",
        "text-muted-dark": "#94a3b8",
        "border-light": "#e2e8f0",
        "border-dark": "#334155",
      },
      fontFamily: {
        "display": ["Plus Jakarta Sans", "sans-serif"]
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}
