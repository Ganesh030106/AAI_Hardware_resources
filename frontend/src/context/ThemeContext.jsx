import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const saved = sessionStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light'; // Default to light mode as original config
  });

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    sessionStorage.setItem('theme', theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [theme]);

  // Inject dark mode legibility helper style
  useEffect(() => {
    let styleEl = document.getElementById('dark-mode-legibility');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.setAttribute('id', 'dark-mode-legibility');
      styleEl.innerText = `
        .dark body {
            color: #f8fafc;
            background-color: #101622;
        }
        .dark a { color: #e2e8f0; }
        .dark p, .dark span, .dark h1, .dark h2, .dark h3, .dark h4, .dark h5, .dark h6, .dark label {
            color: #f8fafc;
        }
        .dark input, .dark select, .dark textarea, .dark button {
            color: #f8fafc;
            background-color: #111827;
            caret-color: #f8fafc;
        }
        .dark ::placeholder { color: #94a3b8; }
      `;
      document.head.appendChild(styleEl);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: setThemeState }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
