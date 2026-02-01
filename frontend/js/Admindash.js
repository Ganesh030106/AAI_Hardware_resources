// frontend/js/Admindash.js

/* =========================
   ADMIN DASHBOARD PAGE SCRIPT
========================= */

const API_BASE = "https://app-aai-hardware-resources-backend.onrender.com";

// --- 1. AUTH CHECK & GET USER DATA ---

let currentUser = null;
let empId = null;
let showToast; // will be dynamically imported on page load


// Get user data from sessionStorage
const storedUser = sessionStorage.getItem('user');
if (storedUser) {
    try {
        currentUser = JSON.parse(storedUser);
        empId = currentUser.emp_id;
    } catch (e) {
        console.error("Error parsing user data:", e);
    }
}

// Redirect to login if no user found
if (!currentUser || !empId) {
    window.location.href = "../html/AdminLogin.html";
}


// --- 2. LOAD ADMIN DETAILS FROM SESSION ---

function loadAdminDetails() {
    if (!currentUser) return;

    try {
        // Update Sidebar Name & Role from sessionStorage
        document.getElementById("sidebar-name").innerText = currentUser.name || "Admin";
        document.getElementById("sidebar-role").innerText = currentUser.role || "Administrator";

        // Update Welcome Message
        document.getElementById("welcome-message").innerText = currentUser.name || "Admin";

        // Generate profile pic from name
        if (currentUser.name) {
            document.getElementById("sidebar-avatar").src =
                `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=0D8ABC&color=fff`;
        }
    } catch (error) {
        console.error("Error loading admin info:", error);
    }
}

// Call this function when the page loads
loadAdminDetails();

// --- 3. LOAD DASHBOARD DATA ---

let availableStatuses = [];
async function loadDashboard() {
    try {
        const response = await fetch(`${API_BASE}/api/dashboard/stats`);
        const data = await response.json();

        // Update KPI Cards
        if (data) {
            document.getElementById("total-requests-count").innerText = data.total || 0;
            document.getElementById("urgent-tickets-count").innerText = data.pending || 0;
            document.getElementById("completed-requests-count").innerText = data.allocated || 0;
        }

        // Store statuses from collection
        if (data.statuses && Array.isArray(data.statuses)) {
            availableStatuses = data.statuses;
            console.log("Available statuses from collection:", availableStatuses);
        }

        // Populate Table
        const tableBody = document.getElementById("activity-table-body");
        tableBody.innerHTML = ""; // Clear loading state

        if (data.recent_activity && data.recent_activity.length > 0) {
            for (const req of data.recent_activity) {
                // Use asset_name from enriched data; fallback to asset_id
                const assetLabel = req.asset_name || `Asset ${req.asset_id || "N/A"}`;

                // Format Date from order_date
                const dateObj = new Date(req.order_date);
                const formattedDate = dateObj.toLocaleDateString('en-US', {
                    month: 'short',
                    day: '2-digit',
                    year: 'numeric'
                });

                // Determine Status Color - case insensitive
                const status = (req.status || "allocated").toLowerCase();
                let statusColor = "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100";
                let statusDisplay = req.status || "Allocated";

                if (status === "allocated")
                    statusColor = "bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-200";

                else if (status === "rejected")
                    statusColor = "bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-200";

                const row = `
    <tr class="hover:bg-background-light/50 dark:hover:bg-gray-800/50 transition-colors">
        <td class="px-6 py-4 font-medium">#${req.request_id}</td>
        <td class="px-6 py-4">${assetLabel}</td>
        <td class="px-6 py-4">${req.employee_name || req.emp_id}</td>
        <td class="px-6 py-4">Qty: ${req.quantity || 1}</td>
        <td class="px-6 py-4">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor}">
                ${statusDisplay.charAt(0).toUpperCase() + statusDisplay.slice(1)}
            </span>
        </td>
    </tr>
    `;
                tableBody.innerHTML += row;
            }
        } else {
            tableBody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center">No requests found</td></tr>';
        }

    } catch (error) {
        console.error("Error loading dashboard:", error);
        document.getElementById("activity-table-body").innerHTML =
            '<tr><td colspan="5" class="px-6 py-8 text-center text-red-500">Error loading data</td></tr>';
    }
}

// Run on load and refresh every 10s for live data
loadDashboard();
setInterval(loadDashboard, 10000);

// --- 4. SEARCH / FILTER FUNCTION ---

function filterDashboardTable() {
    const filter = document.getElementById("dashboard-search").value.toLowerCase();
    const tableBody = document.getElementById("activity-table-body");
    const rows = tableBody.getElementsByTagName("tr");

    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName("td");
        if (cells.length < 5) continue;

        const ticketId = (cells[0].textContent || "").toLowerCase();
        const assetName = (cells[1].textContent || "").toLowerCase();
        const employeeName = (cells[2].textContent || "").toLowerCase();

        const match = ticketId.includes(filter) || employeeName.includes(filter) || assetName.includes(filter);
        rows[i].style.display = match ? "" : "none";
    }
}

// --- 5. SET DATE ---

// Date Formatting
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

// --- 6. LOGOUT FUNCTION ---

function handleLogout() {
    if (confirm("Are you sure you want to logout?")) {
        sessionStorage.clear();
        window.location.href = "../html/AdminLogin.html";
    }
}

// --- 7. CHART.JS VISUALIZATIONS ---

// Global chart instances to prevent canvas duplication
let topAssetsChartInstance = null;
let statusChartInstance = null;

// Helper: Get colors dynamically based on current theme
function getThemeColor(type) {
    const isDark = document.documentElement.classList.contains('dark');
    if (type === 'text') return isDark ? '#94a3b8' : '#64748b'; // slate-400 : slate-500
    if (type === 'grid') return isDark ? '#334155' : '#e2e8f0'; // slate-700 : slate-200
    return '#000000';
}

// --- 8. UPDATED DASHBOARD DATA LOADER ---

/* ==========================================
   UPDATED DASHBOARD LOADER
   (Replaces the previous loadDashboard function)
   ========================================== */
async function loadDashboard() {
    try {
        const response = await fetch(`${API_BASE}/api/dashboard/stats`);
        const data = await response.json();

        // 1. Update KPI Cards
        if (data) {
            document.getElementById("total-requests-count").innerText = data.total || 0;
            // Note: Backend sends 'rejected' count, frontend ID is 'urgent-tickets-count'
            document.getElementById("urgent-tickets-count").innerText = data.rejected || 0;
            document.getElementById("completed-requests-count").innerText = data.allocated || 0;
        }

        // 3. Populate Recent Activity Table
        const tableBody = document.getElementById("activity-table-body");
        tableBody.innerHTML = "";

        if (data.recent_activity && data.recent_activity.length > 0) {
            for (const req of data.recent_activity) {
                const assetLabel = req.asset_name || `Asset ${req.asset_id || "N/A"}`;
                const statusRaw = (req.status || "allocated").toLowerCase();

                // Status Badge Styling
                let statusBadge = "";
                if (statusRaw === "allocated") {
                    statusBadge = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Allocated</span>`;
                } else if (statusRaw === "rejected") {
                    statusBadge = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Rejected</span>`;
                } else {
                    statusBadge = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</span>`;
                }

                const row = `
                <tr class="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors border-b border-gray-100 dark:border-slate-700 last:border-0">
                    <td class="px-6 py-4 font-mono text-xs text-gray-500 dark:text-gray-400">#${req.request_id}</td>
                    <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">${assetLabel}</td>
                    <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">${req.employee_name}</td>
                    <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">${req.quantity || 1}</td>
                    <td class="px-6 py-4">${statusBadge}</td>
                </tr>`;
                tableBody.innerHTML += row;
            }
        } else {
            tableBody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500">No requests found</td></tr>';
        }

        // 4. Render Top Assets Chart
        if (window.Chart && document.getElementById('top-assets-chart')) {
            const ctx = document.getElementById('top-assets-chart').getContext('2d');
            const assetLabels = (data.chart_top_assets || []).map(a => a.asset_name);
            const assetCounts = (data.chart_top_assets || []).map(a => a.count);

            // Destroy previous instance if exists
            if (window.topAssetsChartInstance) {
                window.topAssetsChartInstance.destroy();
            }
            window.topAssetsChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: assetLabels,
                    datasets: [{
                        label: 'Requests',
                        data: assetCounts,
                        backgroundColor: [
                            '#1658e5', '#7c3aed', '#e03a3a', '#f59e42', '#22c55e'
                        ],
                        borderRadius: 8,
                        maxBarThickness: 36
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { display: false },
                        title: { display: false }
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: { color: getThemeColor('text') }
                        },
                        y: {
                            beginAtZero: true,
                            grid: { color: getThemeColor('grid') },
                            ticks: { color: getThemeColor('text') }
                        }
                    }
                }
            });
        }

        // 5. Render Status Distribution Chart
        if (window.Chart && document.getElementById('status-distribution-chart')) {
            const ctx = document.getElementById('status-distribution-chart').getContext('2d');
            const statusLabels = (data.chart_status_dist || []).map(s => s._id.charAt(0).toUpperCase() + s._id.slice(1));
            const statusCounts = (data.chart_status_dist || []).map(s => s.count);
            const statusColors = ['#1658e5', '#e03a3a', '#22c55e', '#f59e42', '#7c3aed'];

            // Destroy previous instance if exists
            if (window.statusChartInstance) {
                window.statusChartInstance.destroy();
            }
            window.statusChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: statusLabels,
                    datasets: [{
                        data: statusCounts,
                        backgroundColor: statusColors,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'bottom',
                            labels: { color: getThemeColor('text') }
                        },
                        title: { display: false }
                    }
                }
            });
        }

    } catch (error) {
        console.error("Error loading dashboard:", error);
    }
}