//frontend/js/MyRequest.js

// ==========================================
// USER HARDWARE REQUESTS PAGE SCRIPT
// ==========================================

//API BASE URL
const API_BASE="https://app-aai-hardware-resources-backend.onrender.com";

// --- API & STATE ---
const API_URL = `${API_BASE}/api/tickets/user`; // GET /api/tickets/user/:emp_id
let allRequests = [];
let currentPage = 1;
const itemsPerPage = 5;
let showToast; // will be dynamically imported on page load

// --- 1. SETUP & AUTH ---
const user = JSON.parse(sessionStorage.getItem("user"));

document.addEventListener('DOMContentLoaded', () => {
    if (!user) {
        window.location.href = "../html/UserLogin.html";
        return;
    }
    // Populate Sidebar
    document.getElementById("sidebar-name").innerText = user.name || "User";
    document.getElementById("sidebar-id").innerText = user.emp_id || "ID";
    if (user.name) {
        const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=135bec&color=fff`;
        document.getElementById("sidebar-avatar").style.backgroundImage = `url('${avatar}')`;
    }

    // Fetch Data
    fetchRequests();
});

// --- 2. FETCH DATA ---
async function fetchRequests() {
    try {
        // Fetch requests for specific user
        const response = await fetch(`${API_URL}/${user.emp_id}`);

        if (!response.ok) throw new Error("Failed to fetch");

        allRequests = await response.json();

        // Initial Render
        renderTable();
    } catch (error) {
        console.error("Error:", error);
        document.getElementById("table-body").innerHTML = `
                    <tr>
                        <td colspan="6" class="py-8 text-center text-red-500">
                            Failed to load data. Please try refreshing.
                        </td>
                    </tr>`;
    }
}

// --- 3. RENDER TABLE WITH FILTERS & PAGINATION ---
function renderTable() {
    const tbody = document.getElementById("table-body");
    const searchVal = document.getElementById("search-input").value.toLowerCase();
    const statusVal = document.getElementById("status-filter").value;

    // Filter Logic (Search & Status)
    let filteredData = allRequests.filter(req => {
        const matchesSearch = (req.asset_id && req.asset_id.toLowerCase().includes(searchVal)) ||
            (req.asset_name && req.asset_name.toLowerCase().includes(searchVal)) ||
            (req.request_id && String(req.request_id).toLowerCase().includes(searchVal));
        const matchesStatus = statusVal === "All" || req.status === statusVal;
        return matchesSearch && matchesStatus;
    });

    // Pagination Logic
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

    // Adjust page if out of bounds
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    // Update Counts & Buttons
    document.getElementById("total-count").innerText = totalItems;
    document.getElementById("page-indicator").innerText = `Page ${currentPage} of ${totalPages}`;
    document.getElementById("prev-btn").disabled = currentPage === 1;
    document.getElementById("next-btn").disabled = currentPage === totalPages;

    // HTML Generation
    if (paginatedData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-text-muted-light dark:text-text-muted-dark">No records found.</td></tr>`;
        return;
    }

    tbody.innerHTML = paginatedData.map(req => {
        // Status Styling
        let statusClass = "bg-gray-100 text-gray-800";
        if (req.status === "Allocated") statusClass = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500";
        if (req.status === "Rejected") statusClass = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500";

        const assetLabel = req.asset_name ? `${req.asset_name} (${req.asset_id || "ID"})` : (req.asset_id || "Hardware");

        return `
                <tr class="group hover:bg-background-light/50 dark:hover:bg-gray-800/50 transition-colors">
                    <td class="py-4 px-6">
                        <span class="font-medium text-text-main-light dark:text-text-main-dark">#${req.request_id}</span>
                    </td>
                    <td class="py-4 px-6">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center flex-none">
                                <span class="material-symbols-outlined text-[18px]">devices</span>
                            </div>
                            <span class="text-sm font-medium text-text-main-light dark:text-text-main-dark">${assetLabel}</span>
                        </div>
                    </td>
                    <td class="py-4 px-6 text-text-main-light dark:text-text-main-dark text-sm">
                      ${req.quantity ?? 1}
                    </td>
                    <td class="py-4 px-6">
                        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusClass}">${req.status}</span>
                    </td>
                </tr>
                `;
    }).join('');
}

// --- 4. ACTIONS (Called by UI events) ---
function filterRequests() {
    currentPage = 1; // Reset to page 1 on filter
    renderTable();
}

function changePage(direction) {
    currentPage += direction;
    renderTable();
}

async function updateUserStatus(requestId, newStatus) {
    try {
        const user = JSON.parse(sessionStorage.getItem("user"));
        if (!user || !user.emp_id) {
            alert("User not authenticated", "error");
            return;
        }

        const response = await fetch(`${API_BASE}/api/tickets/${requestId}/user-status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                emp_id: user.emp_id,
                status: newStatus
            })
        });

        const data = await response.json();

        if (response.ok) {
            showToast("Status updated successfully", "success");
            fetchRequests(); // Refresh the table
        } else {
            alert(data.message || "Failed to update status");
        }
    } catch (error) {
        console.error("Status update error:", error);
        alert("Error updating status: " + error.message);
    }
}

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
    if (confirm("Are you sure you want to log out?")) {
        sessionStorage.removeItem("user");
        window.location.href = "../html/UserLogin.html";
    }
}

// Sidebar Active State
const links = document.querySelectorAll(".sidebar-link");
links.forEach(link => {
    link.addEventListener("click", () => {
        links.forEach(l => l.classList.remove("sidebar-active"));
        link.classList.add("sidebar-active");
    });
});

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