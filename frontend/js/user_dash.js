//frontend/js/user_dash.js

// ==========================================
// USER DASHBOARD PAGE SCRIPT
// ==========================================

//API BASE URL
const API_BASE="https://app-aai-hardware-resources-backend.onrender.com";

let showToast; // will be dynamically imported on page load


// --- 1. AUTHENTICATION & USER CHECK ---
const user = JSON.parse(sessionStorage.getItem("user"));

// Ensure user is logged in
if (!user) {
    window.location.href = "../html/UserLogin.html"; // Redirect if no session
} else {
    // Update Welcome Message
    const welcomeElement = document.getElementById('welcome-text');
    if (welcomeElement) {
        const name = user.name || "User";
        welcomeElement.innerText = `Welcome back, ${name}`;
    }

    // Update Sidebar Name
    if (document.getElementById("sidebar-username")) {
        document.getElementById("sidebar-username").innerText = user.name || "User";
    }
    // Update Sidebar Department
    if (document.getElementById("sidebar-dept")) {
        document.getElementById("sidebar-dept").innerText = user.department || user.dept || "Department";
    }
    // Dynamic Avatar
    if (document.getElementById("sidebar-avatar") && user.name) {
        document.getElementById("sidebar-avatar").style.backgroundImage =
            `url('https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=135bec&color=fff')`;
    }
}

// --- 2. LOAD DASHBOARD DATA ---
async function loadUserDashboard() {
    if (!user || !user.emp_id) return;

    try {
        // A. Load Stats (Cards)
        const statsRes = await fetch(`${API_BASE}/api/user/dashboard/stats?emp_id=${user.emp_id}`);
        const stats = await statsRes.json();

        if (statsRes.ok) {
            document.getElementById('total-tickets-count').innerText = stats.total || 0;
            document.getElementById('rejected-tickets-count').innerText = stats.rejected || 0;
            document.getElementById('completed-tickets-count').innerText = stats.completed || 0;
        }

        // B. Load Recent Activity (Table)
        const activityRes = await fetch(`${API_BASE}/api/user/dashboard/activity?emp_id=${user.emp_id}`);
        const activities = await activityRes.json();

        const tableBody = document.getElementById('activity-table-body');
        tableBody.innerHTML = ""; // Clear loading row

        if (activities.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-text-muted-light">No recent requests found.</td></tr>`;
            return;
        }

        // Render all activity rows (search filter removed)
        let allRows = activities.map(req => {
            let statusColor = "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-500";
            let statusLabel = req.status;
            if (req.status === "Approved" || req.status === "In Progress") {
                statusColor = "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500";
            } else if (req.status === "Completed" || req.status === "Allocated") {
                statusColor = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500";
                statusLabel = "Allocated";
            } else if (req.status === "Rejected") {
                statusColor = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500";
                statusLabel = "Rejected";
            }
            return `<tr class=\"hover:bg-background-light/50 dark:hover:bg-gray-800/50 transition-colors\">
                            <td class=\"px-6 py-4 font-medium text-text-main-light dark:text-text-main-dark\">#${req.request_id}</td>
                            <td class=\"px-6 py-4 font-medium text-text-main-light dark:text-text-main-dark\">${req.asset_name || "Unknown"} (${req.asset_id || "-"})</td>
                            <td class=\"px-6 py-4 font-medium text-text-main-light dark:text-text-main-dark\">QTY: ${req.quantity || 1}</td>
                            <td class=\"px-6 py-4\">
                                <span class=\"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor}\">
                                    ${statusLabel}
                                </span>
                            </td>
                        </tr>`;
        });
        if (allRows.length === 0) {
            tableBody.innerHTML = `<tr><td colspan=\"4\" class=\"px-6 py-8 text-center text-text-muted-light dark:text-slate-300\">No recent requests found.</td></tr>`;
        } else {
            tableBody.innerHTML = allRows.join("");
        }

    } catch (error) {
        console.error("Error loading user dashboard:", error);
    }
}

// Initialize Data Load
loadUserDashboard();

// --- 3. UTILITIES ---

// Date Display
function formatDate(date) {
    return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}
function setToday() {
    const dateText = document.getElementById("dateText");
    if (dateText) dateText.innerText = formatDate(new Date());
}
setToday();

// Toggle Recent Activity
function toggleRecentActivity() {
    window.location.href = "../html/MyRequest.html";
}

// Sidebar Navigation
const links = document.querySelectorAll(".sidebar-link");
links.forEach(link => {
    link.addEventListener("click", () => {
        links.forEach(l => l.classList.remove("sidebar-active"));
        link.classList.add("sidebar-active");
    });
});

// Logout Handler
function handleLogout() {
    const confirmLogout = confirm("Are you sure you want to log out?");
    if (confirmLogout) {
        console.log("[LOGOUT] User logged out");
        sessionStorage.clear();
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
