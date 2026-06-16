window.TAILWIND_CONFIG = {
    darkMode: "class",  // Enable class-based dark mode
    theme: {
        extend: {
            // ==========================================
            //      COLOR PALETTE
            // ==========================================
            colors: {
                // Primary brand colors
                "primary": "#135bec",
                "primary-hover": "#0e4bce",

                // Background colors for light/dark modes
                "background-light": "#f6f6f8",
                "background-dark": "#101622",

                // Card/Panel colors
                "card-light": "#ffffff",
                "card-dark": "#1e293b",

                // Text colors
                "text-main-light": "#0d121b",
                "text-main-dark": "#f8fafc",
                "text-muted-light": "#4c669a",
                "text-muted-dark": "#94a3b8",

                // Border colors
                "border-light": "#e2e8f0",
                "border-dark": "#334155",
            },
            // ==========================================
            //      TYPOGRAPHY
            // ==========================================
            fontFamily: {
                "display": ["Plus Jakarta Sans", "sans-serif"]
            },
        },
    },
};


// ==========================================
//      AUTOMATIC THEME DETECTION
// ==========================================
// Check for saved theme preference or system preference

// ==========================================
//      AUTOMATIC THEME DETECTION & SETTING
// ==========================================
// 1. Check for saved theme in sessionStorage
// 2. If not set, check system preference
// 3. Default to light mode

function setThemeClass(theme) {
    if (theme === "dark") {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
    } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
    }
}

const savedTheme = sessionStorage.getItem("theme");
if (savedTheme === "dark" || savedTheme === "light") {
    setThemeClass(savedTheme);
} else {
    // No saved theme, default to light mode
    setThemeClass("light");
}

// ==========================================
//      DARK MODE LEGIBILITY HELPERS
// ==========================================
// Enforce readable text and form inputs across pages when dark mode is active
(function ensureDarkModeLegibility() {
    const style = document.createElement("style");
    style.setAttribute("id", "dark-mode-legibility");
    style.innerText = `
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
    document.head.appendChild(style);
})();

// ==========================================
//     PASSWORD VISIBILITY TOGGLE
// ==========================================

function togglePasswordVisibility(btn) {
    const parent = btn.closest('.relative');
    const input = parent ? parent.querySelector('input[id="password"], input[type="password"], input[type="text"]') : document.getElementById('password');
    if (!input) return;
    const icon = btn.querySelector('.material-symbols-outlined');
    if (input.type === 'password') {
        input.type = 'text';
        if (icon) icon.textContent = 'visibility';
    } else {
        input.type = 'password';
        if (icon) icon.textContent = 'visibility_off';
    }
}