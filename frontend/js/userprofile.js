//frontend/js/userprofile.js

// User Profile Frontend Logic
// This file should be loaded in profile_dashboard.html

// ==========================================
// USER PROFILE PAGE SCRIPT
// ==========================================

// API BASE URL
const API_BASE="https://app-aai-hardware-resources-backend.onrender.com";

const user = JSON.parse(sessionStorage.getItem("user"));
let originalData = {};
let showToast; // will be dynamically imported on page load

document.addEventListener('DOMContentLoaded', () => {
    if (!user) {
        window.location.href ="../html/UserLogin.html";
    } else {
        fetchProfileData();
    }
});

async function fetchProfileData() {
    try {
        const response = await fetch(`${API_BASE}/api/profile?emp_id=${user.emp_id}`);
        const data = await response.json();

        // Use .data property if present (from routes/profile.js)
        const userData = data.data || data;

        if (response.ok && userData) {
            // showToast("Profile loaded successfully!", "success");
            updateUI(userData);
            originalData = userData;
        } else {
            console.error("Failed to load profile");
        }
    } catch (error) {
        console.error("Error fetching profile:", error);
    }
}

function updateUI(data) {
    // Sidebar
    if (document.getElementById("sidebar-name")) document.getElementById("sidebar-name").innerText = data.name || "User";
    if (document.getElementById("sidebar-role")) document.getElementById("sidebar-role").innerText = data.role || "Employee";

    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || 'User')}&background=135bec&color=fff`;
    if (document.getElementById("sidebar-avatar")) document.getElementById("sidebar-avatar").style.backgroundImage = `url('${avatarUrl}')`;
    if (document.getElementById("profile-avatar-large")) document.getElementById("profile-avatar-large").style.backgroundImage = `url('${avatarUrl}')`;

    // Main Profile Card
    document.getElementById("display-name").innerText = data.name || "User";
    const department = data.department || data.dept;
    document.getElementById("display-role").innerText = `${data.role || 'Employee'} • ${department || 'General'}`;

    // Form Inputs
    document.getElementById("input-name").value = data.name || "";
    document.getElementById("input-emp-id").value = data.emp_id || "";
    document.getElementById("input-username").value = data.username || "";
    document.getElementById("input-dept").value = department || "";
    document.getElementById("input-role").value = data.role || "";
}

function toggleEditMode(isEditing) {
    const inputs = document.querySelectorAll('.edit-input');
    const editBtn = document.getElementById('edit-btn');
    const saveCancelGroup = document.getElementById('save-cancel-group');

    inputs.forEach(input => {
        // Prevent editing of Employee ID, Department, and Role (usually fixed)
        if (!["emp_id", "dept", "role"].includes(input.name)) {
            input.readOnly = !isEditing;
            if (isEditing) {
                input.classList.remove('bg-background-light', 'dark:bg-background-dark', 'border-transparent', 'focus:ring-0');
                input.classList.add('bg-card-light', 'dark:bg-card-dark', 'border-border-light', 'dark:border-border-dark', 'focus:ring-2', 'focus:ring-blue-600', 'focus:border-blue-600');
            } else {
                input.value = originalData[input.name] || "";
                input.classList.add('bg-background-light', 'dark:bg-background-dark', 'border-transparent', 'focus:ring-0');
                input.classList.remove('bg-card-light', 'dark:bg-card-dark', 'border-border-light', 'dark:border-border-dark', 'focus:ring-2', 'focus:ring-blue-600', 'focus:border-blue-600');
            }
        }
    });

    if (isEditing) {
        editBtn.classList.add('hidden');
        saveCancelGroup.classList.remove('hidden');
        saveCancelGroup.classList.add('flex');
    } else {
        editBtn.classList.remove('hidden');
        saveCancelGroup.classList.add('hidden');
        saveCancelGroup.classList.remove('flex');
    }
}

async function saveProfileChanges() {
    const updatedData = {
        emp_id: user.emp_id,
        name: document.getElementById("input-name").value,
        username: document.getElementById("input-username").value,
        password: (document.getElementById("input-password") ? document.getElementById("input-password").value : ""),
        dept: document.getElementById("input-dept").value,
        role: document.getElementById("input-role").value
    };

    try {
        const response = await fetch(`${API_BASE}/api/user/profile`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedData)
        });

        const result = await response.json();
        // Support both {user} and {data} response
        const updatedUser = result.user || result.data;

        if (response.ok && updatedUser) {
            showToast("Profile updated successfully!", "success");
            originalData = updatedUser;
            const ssUser = JSON.parse(sessionStorage.getItem("user"));
            ssUser.name = updatedUser.name;
            sessionStorage.setItem("user", JSON.stringify(ssUser));
            updateUI(updatedUser);
            const inputs = document.querySelectorAll('.edit-input');
            inputs.forEach(input => {
                input.readOnly = true;
                input.classList.add('bg-background-light', 'dark:bg-background-dark', 'border-transparent', 'focus:ring-0');
                input.classList.remove('bg-card-light', 'dark:bg-card-dark', 'border-border-light', 'dark:border-border-dark', 'focus:ring-2', 'focus:ring-blue-600', 'focus:border-blue-600');
            });
            document.getElementById('edit-btn').classList.remove('hidden');
            document.getElementById('save-cancel-group').classList.add('hidden');
        } else {
            alert("Error: " + (result.message || "Unknown error"));
        }
    } catch (error) {
        console.error("Save error:", error);
        alert("Failed to save changes.");
    }
}

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


function handleLogout() {
    if (confirm("Are you sure you want to log out?")) {
        sessionStorage.removeItem("user");
        window.location.href = "../html/UserLogin.html";
    }
}

// Theme Toggle
function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.classList.toggle("dark");
    const themeText = document.getElementById("themeText");
    if (themeText) {
        themeText.innerText = isDark ? "Light Mode" : "Dark Mode";
    }
}

// Initialize Theme Toggle
const toggleBtn = document.getElementById("ToggleBtn");
if (toggleBtn) {
    toggleBtn.addEventListener("click", toggleTheme);
    // Initialize theme text
    const html = document.documentElement;
    const isDark = html.classList.contains("dark");
    const themeText = document.getElementById("themeText");
    if (themeText) {
        themeText.innerText = isDark ? "Light Mode" : "Dark Mode";
    }
}       