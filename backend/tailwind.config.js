/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable dark mode via class strategy
  content: [
    "../frontend/html/**/*.html", // path to your HTML files
    "../frontend/js/**/*.js",     // path to your JS files
    "../frontend/css/**/*.css"    // path to your CSS files
  ],
  theme: {
    extend: {
      spacing: {
        '18': '4.5rem',          // Custom spacing value
        '22': '5.5rem',          // Custom spacing value
      },
      // colors: {
      //   'background-light': '#F9FAFB',
      //   'background-dark': '#1E293B',
      //   'text-main-light': '#111827',
      //   'text-main-dark': '#F3F4F6',
      //   'card-light': '#FFFFFF',
      //   'card-dark': '#334155',
      //   'border-light': '#E5E7EB',
      //   'border-dark': '#475569',
      //   'primary-light': '#3B82F6',
      //   'primary-dark': '#60A5FA',
      //   'secondary-light': '#6B7280',
      //   'secondary-dark': '#9CA3AF',
      //   'accent-light': '#10B981',
      //   'accent-dark': '#34D399', 
      // }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),   // Tailwind CSS Forms plugin
    require('@tailwindcss/container-queries'), // Tailwind CSS Container Queries plugin
  ],
}


