// frontend/js/Adminsetting.js

// ==========================================
// ADMIN SETTINGS PAGE SCRIPT
// ==========================================

// API BASE URL
const API_BASE="https://app-aai-hardware-resources-backend.onrender.com";

let showToast; // will be dynamically imported on page load

// --- DISABLE ADMIN PASSWORD FIELDS ON LOAD ---
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("admin-new-password").disabled = true;
    document.getElementById("admin-confirm-password").disabled = true;
});
async function validateEmpId() {
    const empId = document.getElementById("admin-user-identifier").value.trim();

    if (!empId) return;

    try {
        const res = await fetch(`${API_BASE}/api/settings/validate-user`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ identifier: empId })
        });

        const data = await res.json();

        if (res.ok) {
            // Enable password fields
            document.getElementById("admin-new-password").disabled = false;
            document.getElementById("admin-confirm-password").disabled = false;
            showToast("✅ Employee ID validated");
        } else {
            // Disable password fields
            document.getElementById("admin-new-password").disabled = true;
            document.getElementById("admin-confirm-password").disabled = true;
            alert("❌ " + data.message);
        }

    } catch (err) {
        console.error(err);
        alert("Server error while validating Emp ID");
    }
}


// --- ADMIN USER PASSWORD UPDATE FUNCTION ---
async function handleAdminUserPasswordUpdate(event) {
    event.preventDefault();

    const identifier = document
        .getElementById("admin-user-identifier")
        .value.trim();

    const newPassword =
        document.getElementById("admin-new-password").value;

    const confirmPassword =
        document.getElementById("admin-confirm-password").value;

    // Validation
    if (newPassword !== confirmPassword) {
        alert("Passwords do not match");
        return;
    }

    if (newPassword.length < 4) {
        alert("Password too short (min 4 chars)");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/settings/user-change-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                identifier,
                newPassword
            })
        });

        const data = await res.json();

        if (res.ok) {
            alert("✅ User password updated successfully");
            document.getElementById("admin-user-identifier").value = "";
            document.getElementById("admin-new-password").value = "";
            document.getElementById("admin-confirm-password").value = "";
        } else {
            alert("❌ " + data.message);
        }

    } catch (err) {
        console.error(err);
        alert("Server error while updating password");
    }
}


// --- AUTH CHECK & PROFILE LOAD ---
const user = JSON.parse(sessionStorage.getItem("user"));
if (!user || user.role !== "Admin") {
    window.location.href = "./AdminLogin.html";
} else {
    // Fill Sidebar Profile
    // Note: Ensure you added IDs 'admin-name-sidebar' & 'admin-role-sidebar' to your sidebar HTML like in previous steps
    const nameEl = document.getElementById("admin-name-sidebar");
    const roleEl = document.getElementById("admin-role-sidebar");
    if (nameEl) nameEl.innerText = user.name;
    if (roleEl) roleEl.innerText = user.role;
}


// --- PASSWORD UPDATE FUNCTION ---
async function handlePasswordUpdate(event) {
    event.preventDefault();

    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    // 1. Client-side Validation
    if (newPassword !== confirmPassword) {
        alert("New passwords do not match!");
        return;
    }
    if (newPassword.length < 4) {
        alert("Password is too short (min 4 chars)");
        return;
    }

    // 2. Call API
    try {
        // Use username first, fallback to emp_id
        const identifier = user.username || user.emp_id;
        console.log("Sending password change request with:", {
            identifier,
            newPassword
        });

        const response = await fetch(`${API_BASE}/api/settings/change-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                identifier: identifier,
                newPassword: newPassword
            })
        });

        const data = await response.json();
        console.log("Password change response:", data);

        if (response.ok) {
            showToast("✅ Success: " + data.message);
            // Clear fields
            document.getElementById("new-password").value = "";
            document.getElementById("confirm-password").value = "";
        } else {
            alert("❌ " + data.message);
        }

    } catch (error) {
        console.error("Error:", error);
        alert("Failed to connect to server");
    }
}

// format date as "MMM DD, YYYY"
function formatDate(date) {
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric"
    });
}

// set current date
function setToday() {
    const today = new Date();
    document.getElementById("dateText").innerText = formatDate(today);
}

// run on load
setToday();

// optional: refresh at midnight automatically
setInterval(setToday, 60000);

// Sidebar link active state handling
const links = document.querySelectorAll(".sidebar-link");

links.forEach(link => {
    link.addEventListener("click", () => {
        links.forEach(l => l.classList.remove("sidebar-active"));
        link.classList.add("sidebar-active");
    });
});

// Animate horizontal chart bars
document.addEventListener("DOMContentLoaded", () => {
    const bars = document.querySelectorAll(".chart-bar-h");

    bars.forEach(bar => {
        bar.style.width = "0%";

        setTimeout(() => {
            bar.style.width = bar.getAttribute("data-width");
        }, 300);
    });
});

function handleLogout() {
    if (confirm("Are you sure you want to logout?")) {
        sessionStorage.clear();
        window.location.href = "./AdminLogin.html";
    }
}


// ========== DARK MODE TOGGLE WITH SAVING ==========
const toggleBtn = document.querySelector('[role="switch"]');
const html = document.documentElement;

// 1. Initialize the toggle state based on current mode
if (html.classList.contains('dark')) {
    toggleBtn.setAttribute('aria-checked', 'true');
} else {
    toggleBtn.setAttribute('aria-checked', 'false');
}

// 2. Handle Click
toggleBtn.addEventListener("click", () => {
    // Toggle the class on the HTML tag
    html.classList.toggle("dark");

    // Check if it is now dark
    const isDark = html.classList.contains("dark");

    // Save preference to session storage
    sessionStorage.setItem("theme", isDark ? "dark" : "light");

    // Update Accessibility Attribute
    toggleBtn.setAttribute("aria-checked", isDark);
});

// ========== TOGGLE SWITCH STATES ==========
document.querySelectorAll("input[type='checkbox']").forEach(cb => {
    cb.addEventListener("change", () => {
        cb.classList.toggle("checked");
    });
});

// ========== BUTTON CLICK FEEDBACK ==========
document.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
        btn.classList.add("scale-95");
        setTimeout(() => btn.classList.remove("scale-95"), 120);
    });
});

// // ========== FORM ACTION FEEDBACK ==========
// document.querySelectorAll("form").forEach(form => {
//     form.addEventListener("submit", () => {
//         alert("Changes saved successfully ✔️");
//     });
// });

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


// --- AUTH CHECK & SIDEBAR UPDATE ---
if (!user || user.role !== "Admin") {
    window.location.href = "./AdminLogin.html";
} else {
    // UPDATE SIDEBAR PROFILE
    if (document.getElementById("sidebar-name")) {
        document.getElementById("sidebar-name").innerText = user.name || "Admin";
    }
    if (document.getElementById("sidebar-role")) {
        document.getElementById("sidebar-role").innerText = user.role || "Administrator";
    }
    // Optional: Dynamic Avatar based on name
    if (document.getElementById("sidebar-avatar") && user.name) {
        document.getElementById("sidebar-avatar").src =
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=135bec&color=fff`;
    }
}
