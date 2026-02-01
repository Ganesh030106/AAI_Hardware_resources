// frontend/js/Login.js
// ==========================================
// LOGIN PAGE SCRIPT
// ==========================================

//
const API_BASE= "https://app-aai-hardware-resources-backend.onrender.com";

// Modal display functions
function showTermsModal() {
    const modal = document.getElementById('termsModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}
function closeTermsModal() {
    const modal = document.getElementById('termsModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function showCardModal() {
    const modal = document.getElementById('HelpCenter');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}
function closeCardModal() {
    const modal = document.getElementById('HelpCenter');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function showPrivacyModal() {
    const modal = document.getElementById('privacyModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}
function closePrivacyModal() {
    const modal = document.getElementById('privacyModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function showContactModal() {
    const modal = document.getElementById('contactModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}
function closeContactModal() {
    const modal = document.getElementById('contactModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}


// ==========================================
// PASSWORD VISIBILITY TOGGLE
// ==========================================
// Toggle between showing/hiding password
function togglePasswordVisibility(btn) {
    const parent = btn.closest('.relative');
    const input = parent ? parent.querySelector('input[id="password"], input[type="password"], input[type="text"]') :
        document.getElementById('password');
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

// ==========================================
// SUPER ADMIN LOGIN HANDLER
// ==========================================

async function handleSuperAdminLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        alert('Please enter both username and password');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/superadminlogin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.message || 'Login failed');
            return;
        }

        // ✅ Store SuperAdmin session
        sessionStorage.setItem('superadmin_user', JSON.stringify(data.user));

        // ✅ Redirect
        window.location.href = "../html/SuperAdminDash.html";

    } catch (err) {
        console.error('SuperAdmin login error:', err);
        alert('Server error during login');
    }
}


// ==========================================
// ADMIN LOGIN HANDLER
// ==========================================
async function handleLogin() {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const username = (usernameInput?.value || '').trim();
    const password = (passwordInput?.value || '').trim();

    if (!username || !password) {
        alert('Please enter both username and password');
        return;
    }

    const loginBtn = document.querySelector('button[onclick="handleLogin()"]');
    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.classList.add('opacity-70', 'cursor-not-allowed');
    }

    try {
        const resp = await fetch(`${API_BASE}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await resp.json();

        if (!resp.ok || !data.success) {
            alert(data.message || 'Login failed');
            return;
        }

        // Ensure admin role
        const user = data.user || {};
        if ((user.role || '').toLowerCase() !== 'admin') {
            alert('Access Denied: Admins only');
            return;
        }

        // Store session (sessionStorage-only) and redirect
        sessionStorage.setItem('user', JSON.stringify(user));
        window.location.href = '../html/Ad-dash.html';
    } catch (err) {
        console.error('Admin login error:', err);
        alert('Server error during login');
    } finally {
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.classList.remove('opacity-70', 'cursor-not-allowed');
        }
    }
}

// ==========================================
// USER LOGIN HANDLER
// ==========================================
async function userLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    // Basic validation
    if (!username || !password) {
        alert('Please enter both username and password');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/user-login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            // Store user information in sessionStorage only
            sessionStorage.setItem('user', JSON.stringify(data.user));
            sessionStorage.setItem('isLoggedIn', 'true');

            // Redirect to user dashboard
            window.location.href = '../html/user_dash.html';
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login. Please try again.');
    }
}

// Allow Enter key to submit form
document.addEventListener('DOMContentLoaded', function () {
    const passwordInput = document.getElementById('password');
    const usernameInput = document.getElementById('username');

    [usernameInput, passwordInput].forEach(input => {
        input.addEventListener('keypress', function (event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                userLogin();
            }
        });
    });
});
