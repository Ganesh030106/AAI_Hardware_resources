//frontend/js/user_set.js 

import { showToast } from './Toast.js';

// ==========================================
// USER SETTINGS PAGE SCRIPT

// Settings Page Functional Logic
// ==========================================

// API BASE URL
const API_BASE="https://app-aai-hardware-resources-backend.onrender.com";

let showToast; // will be dynamically imported on page load

// --- 1. GLOBAL AUTH & SETUP ---
const user = JSON.parse(sessionStorage.getItem("user"));

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadUserProfile();

    // UI Initialization
    initPasswordSecurity();

    // Theme Init - Default to light theme
    const currentTheme = sessionStorage.getItem('theme') || 'light';
    setTheme(currentTheme);
});

function checkAuth() {
    if (!user) {
        window.location.href = "../html/UserLogin.html";
    }
}

function loadUserProfile() {
    if (!user) return;

    // Update Sidebar Info
    const nameEl = document.getElementById("sidebar-user-name");
    const emailEl = document.getElementById("sidebar-user-email");
    const avatarEl = document.getElementById("sidebar-user-avatar");

    if (nameEl) nameEl.innerText = user.name || "User";
    const department = user.department || user.dept;
    if (emailEl) emailEl.innerText = department || user.email || "Employee"; // Display Dept or fallback

    if (avatarEl && user.name) {
        avatarEl.style.backgroundImage = `url('https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=135bec&color=fff')`;
    }

}


// --- 2. PASSWORD SECURITY LOGIC ---
function initPasswordSecurity() {
    const form = document.getElementById('security-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const currentPass = document.getElementById('current-password')?.value || '';
        const newPass = document.getElementById('new-password')?.value || '';
        const confirmPass = document.getElementById('confirm-password')?.value || '';
        const submitBtn = form.querySelector('button');

        console.log("Current:", currentPass);
        console.log("New:", newPass);
        console.log("Confirm:", confirmPass);
        // Client-side Validation
        if (!newPass || !confirmPass) {
            alert('All password fields are required');
            return;
        }
        if (newPass.length < 4) {
            alert('New password is too short');
            return;
        }
        if (newPass !== confirmPass) {
            alert('New passwords do not match');
            return;
        }
        if (currentPass === newPass) {
            alert('New password cannot be the same as current');
            return;
        }

        // API Call
        const originalBtnText = submitBtn.innerText;
        submitBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm">sync</span> Updating...';
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-75');

        try {
            const response = await fetch(`${API_BASE}/api/user-settings/change-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    emp_id: user.emp_id,
                    currentPassword: currentPass,
                    newPassword: newPass
                })
            });

            const result = await response.json();

            if (response.ok) {
                showToast(result.message, "success");
                form.reset();
            } else {
                showToast(result.message, "error");
            }

        } catch (error) {
            console.error("Password Update Error:", error);
            alert("Failed to connect to server");
        } finally {
            // Reset Button
            submitBtn.innerText = originalBtnText;
            submitBtn.disabled = false;
            submitBtn.classList.remove('opacity-75');
        }
    });
}

// --- 5. SYSTEM UTILITIES ---

// Sidebar Navigation Active State
const links = document.querySelectorAll(".sidebar-link");
links.forEach(link => {
    link.addEventListener("click", () => {
        links.forEach(l => l.classList.remove("sidebar-active"));
        link.classList.remove("text-text-muted-light", "dark:text-text-muted-dark");
        link.classList.add("sidebar-active");
    });
});

// Date Display
function formatDate(date) {
    return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}
function setToday() {
    const dateText = document.getElementById("dateText");
    if (dateText) dateText.innerText = formatDate(new Date());
}
setToday();

// Logout
function handleLogout() {
    const confirmLogout = confirm("Are you sure you want to log out?");
    if (confirmLogout) {
        sessionStorage.removeItem("user");
        window.location.href = "../html/UserLogin.html";
    }
}

// Theme Switcher
function setTheme(theme) {
    const lightBtn = document.getElementById('theme-light-btn');
    const darkBtn = document.getElementById('theme-dark-btn');

    // Reset UI
    if (lightBtn) {
        lightBtn.classList.remove('border-primary', 'bg-blue-50', 'dark:bg-blue-900/10');
        lightBtn.classList.add('border-transparent');
        lightBtn.querySelector('.check-circle div').classList.add('hidden');
        lightBtn.querySelector('.check-circle').classList.remove('border-primary');
    }
    if (darkBtn) {
        darkBtn.classList.remove('border-primary', 'bg-blue-50', 'dark:bg-blue-900/10');
        darkBtn.classList.add('border-transparent');
        darkBtn.querySelector('.check-circle div').classList.add('hidden');
        darkBtn.querySelector('.check-circle').classList.remove('border-primary');
    }

    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        sessionStorage.setItem('theme', 'dark');
        if (darkBtn) {
            darkBtn.classList.remove('border-transparent');
            darkBtn.classList.add('border-primary', 'bg-blue-50', 'dark:bg-blue-900/10');
            darkBtn.querySelector('.check-circle div').classList.remove('hidden');
            darkBtn.querySelector('.check-circle').classList.add('border-primary');
        }
    } else {
        document.documentElement.classList.remove('dark');
        sessionStorage.setItem('theme', 'light');
        if (lightBtn) {
            lightBtn.classList.remove('border-transparent');
            lightBtn.classList.add('border-primary', 'bg-blue-50', 'dark:bg-blue-900/10');
            lightBtn.querySelector('.check-circle div').classList.remove('hidden');
            lightBtn.querySelector('.check-circle').classList.add('border-primary');
        }
    }
}

// Function to toggle password visibility
function togglePassword(btn) {
    // Find the input field inside the same parent div
    const input = btn.previousElementSibling;
    const icon = btn.querySelector('.material-symbols-outlined');

    if (input.type === "password") {
        input.type = "text";
        icon.innerText = "visibility"; // Change icon to open eye
    } else {
        input.type = "password";
        icon.innerText = "visibility_off"; // Change icon to slashed eye
    }
}
