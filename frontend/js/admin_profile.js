// frontend/js/admin_profile.js

// ==========================================
// ADMIN PROFILE PAGE SCRIPT
// ==========================================

const API_BASE="https://app-aai-hardware-resources-backend.onrender.com";

// --- 1. SETUP DATE ---
function formatDate(date) {
    return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}
document.getElementById("dateText").innerText = formatDate(new Date());

// --- 2. AUTH CHECK & LOAD PROFILE ---
async function loadProfile() {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (!user || user.role !== "Admin") {
        window.location.href = "./AdminLogin.html";
        return;
    }

    // Fill Sidebar immediately from session storage (faster perceived load)
    updateUI(user);

    // Fetch fresh data from DB to get any updates
    try {
        const response = await fetch(`${API_BASE}/api/profile?emp_id=${user.emp_id}`);
        const data = await response.json();

        if (data.success && data.data) {
            // Merge session data with fresh data
            const freshData = { ...user, ...data.data };
            updateUI(freshData);
        }
    } catch (error) {
        console.error("Failed to load profile from server, using cached data.", error);
    }
}

// -- 3. Helper to update HTML elements ---
function updateUI(data) {
    // Generate Avatar
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=135bec&color=fff&size=150`;

    // Update Sidebar
    const sidebarName = document.getElementById("sidebar-name");
    const sidebarRole = document.getElementById("sidebar-role");
    const sidebarAvatar = document.getElementById("sidebar-avatar");

    if (sidebarName) sidebarName.innerText = data.name || "Loading...";
    if (sidebarRole) sidebarRole.innerText = data.role || "...";
    if (sidebarAvatar) sidebarAvatar.src = avatarUrl;

    // Update Main Content
    const dispName = document.getElementById("display-name");
    const dispRole = document.getElementById("display-role");
    const dispEmpId = document.getElementById("display-emp-id");
    const dispUsername = document.getElementById("display-username");
    const dispDept = document.getElementById("display-dept");
    const dispLastLogin = document.getElementById("display-last-login");
    const mainAvatar = document.getElementById("main-avatar-img");

    if (dispName) dispName.innerText = data.name || "Loading...";
    if (dispRole) dispRole.innerText = `${data.role || "..."} | ${data.dept || "..."}`;
    if (dispEmpId) dispEmpId.innerText = data.emp_id || "...";
    if (dispUsername) dispUsername.innerText = data.username || "...";
    if (dispDept) dispDept.innerText = data.dept || "...";
    if (dispLastLogin) {
        const lastLogin = data.lastLogin || new Date().toLocaleString();
        dispLastLogin.innerText = lastLogin;
    }
    if (mainAvatar) mainAvatar.src = avatarUrl;
    document.getElementById("stat-role").innerText = data.role || "-";
}

loadProfile();

// --- 4. NAVIGATION ---
const links = document.querySelectorAll(".sidebar-link");
links.forEach(link => {
    link.addEventListener("click", () => {
        links.forEach(l => l.classList.remove("sidebar-active"));
        link.classList.add("sidebar-active");
    });
});

// --- 5. LOGOUT FUNCTION ---
function handleLogout() {
    if (confirm("Are you sure you want to logout?")) {
        sessionStorage.clear();
        window.location.href = "./AdminLogin.html";
    }
}

