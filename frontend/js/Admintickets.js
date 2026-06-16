// frontend/js/Admintickets.js
/* ==========================================
   ADMIN ISSUE MANAGEMENT PAGE SCRIPT
========================================== */

// API BASE URL
const API_BASE="https://app-aai-hardware-resources-backend.onrender.com";

// --- STATE VARIABLES ---
let currentPage = 1;
const limit = 5;
let totalItems = 0;
let searchTimeout = null;
let showToast; // will be dynamically imported on page load


// --- AUTH CHECK & SIDEBAR UPDATE ---
const user = JSON.parse(sessionStorage.getItem("user"));
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
    // Dynamic Avatar based on name
    if (document.getElementById("sidebar-avatar") && user.name) {
        document.getElementById("sidebar-avatar").src =
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=135bec&color=fff`;
    }
}

// --- FETCH TICKETS ---
async function loadTickets(page = 1) {
    currentPage = page;
    const search = document.getElementById("search-input").value.trim();
    const dept = document.getElementById("filter-dept").value;
    console.log("Frontend filters:", { search, dept });

    // Use encodeURIComponent to handle special characters safely
    const url = `${API_BASE}/api/tickets?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&dept=${encodeURIComponent(dept)}`;

    console.log("Request URL:", url);

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch data");

        const data = await res.json();
        console.log("Received data:", data);
        renderTable(data.tickets);
        totalItems = data.total;
        updatePagination(data.total);
    } catch (err) {
        console.error(err);
        document.getElementById("ticket-table-body").innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-red-500">Error loading tickets. Ensure server is running.</td></tr>`;
    }
}

// --- RENDER TABLE ---
function renderTable(tickets) {
    const tbody = document.getElementById("ticket-table-body");
    tbody.innerHTML = "";

    if (tickets.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">No tickets found.</td></tr>`;
        return;
    }

    tickets.forEach(t => {
        // Status Color Logic - case insensitive
        const status = (t.status || "").toLowerCase();
        let statusClass = "bg-gray-100 text-gray-700 border-gray-200 dark:text-gray-100";
        if (status === 'allocated') statusClass = "bg-green-50 text-green-700 border-green-200 dark:text-green-700";
        else if (status === 'rejected') statusClass = "bg-red-50 text-red-700 border-red-200 dark:text-red-700";

        const row = `
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td class="px-6 py-4 font-bold text-[#0d121b] dark:text-white">#${t.request_id}</td>
                    <td class="px-6 py-4">
                        <span class="text-sm font-bold text-[#0d121b] dark:text-white">${t.asset_name || t.asset_id}</span>
                    </td>
                    <td class="px-6 py-4">
                        <span class="text-sm text-[#4c669a] dark:text-white">${t.emp_name || t.emp_id}</span>
                    </td>
                    <td class="px-6 py-4">
                        <span class="text-sm text-[#4c669a] dark:text-white">${t.emp_dept || "-"}</span>
                    </td>
                    <td class="px-6 py-4">
                        <span class="text-sm font-semibold text-[#0d121b] dark:text-white">${t.quantity || 1}</span>
                    </td>
                    <td class="px-6 py-4">
                        <span class="text-xs font-bold rounded-full px-3 py-1 border ${statusClass}">${t.status ? t.status.charAt(0).toUpperCase() + t.status.slice(1) : "Unknown"}</span>
                    </td>
                </tr>`;
        tbody.innerHTML += row;
    });
}

// --- UTILS ---

function updatePagination(total) {
    document.getElementById("total-results").innerText = total;
    document.getElementById("prev-btn").disabled = currentPage <= 1;
    document.getElementById("next-btn").disabled = currentPage >= Math.ceil(total / limit);
}

function changePage(dir) {
    loadTickets(currentPage + dir);
}

// --- LOAD FILTER OPTIONS ---
async function loadFilterOptions() {
    try {
        const res = await fetch(`${API_BASE}/api/tickets/filter-options`);
        if (!res.ok) throw new Error("Failed to fetch filter options");

        const data = await res.json();
        console.log("Filter options loaded:", data);

        // Populate Department dropdown
        const deptSelect = document.getElementById("filter-dept");
        deptSelect.innerHTML = '<option value="">All Departments</option>';
        data.departments.forEach(dept => {
            const option = document.createElement("option");
            option.value = dept;
            option.textContent = dept;
            deptSelect.appendChild(option);
        });

    } catch (err) {
        console.error("Error loading filter options:", err);
    }
}

function handleLogout() {
    if (confirm("Are you sure you want to logout?")) {
        sessionStorage.clear();
        window.location.href = "./AdminLogin.html";
    }
}

/* =========================
   SET DATE
========================= */
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

loadFilterOptions();
loadTickets(1);

/* ==========================================
   CHART VISUALIZATIONS
   ========================================== */
let deptChartInstance = null;
let statusChartInstance = null;

// Helper: Get theme colors
function getThemeColor(type) {
    const isDark = document.documentElement.classList.contains('dark');
    if (type === 'text') return isDark ? '#94a3b8' : '#64748b';
    if (type === 'grid') return isDark ? '#334155' : '#e2e8f0';
    return '#000000';
}

async function loadTicketStats() {
    try {
        const res = await fetch(`${API_BASE}/api/tickets/stats`);
        const data = await res.json();

        if (res.ok) {
            initTicketCharts(data.departmentDistribution, data.statusDistribution);
        }
    } catch (err) {
        console.error("Error loading ticket stats:", err);
    }
}

function initTicketCharts(deptData, statusData) {
    const ctxDept = document.getElementById('deptChart');
    const ctxStatus = document.getElementById('statusChart');

    if (!ctxDept || !ctxStatus) return;

    const textColor = getThemeColor('text');
    const gridColor = getThemeColor('grid');

    // --- 1. Department Bar Chart ---
    const deptLabels = deptData.map(d => d._id || "Unknown");
    const deptCounts = deptData.map(d => d.count);

    if (deptChartInstance) {
        deptChartInstance.data.labels = deptLabels;
        deptChartInstance.data.datasets[0].data = deptCounts;
        deptChartInstance.update();
    } else {
        deptChartInstance = new Chart(ctxDept.getContext('2d'), {
            type: 'bar',
            data: {
                labels: deptLabels,
                datasets: [{
                    label: 'Requests',
                    data: deptCounts,
                    backgroundColor: '#135bec',
                    borderRadius: 4,
                    barThickness: 30,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: gridColor, borderDash: [4, 4] },
                        ticks: { color: textColor, stepSize: 1 }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor }
                    }
                }
            }
        });
    }

    // --- 2. Status Doughnut Chart ---
    const statusMap = {
        'allocated': { count: 0, color: '#22c55e' }, // Green
        'pending': { count: 0, color: '#f59e0b' }, // Amber
        'rejected': { count: 0, color: '#ef4444' }  // Red
    };

    if (statusData) {
        statusData.forEach(item => {
            const key = (item._id || "").toLowerCase();
            if (statusMap[key]) statusMap[key].count = item.count;
            // Handle cases where 'completed' maps to 'allocated'
            if (key === 'completed') statusMap['allocated'].count += item.count;
        });
    }

    const sLabels = Object.keys(statusMap).map(k => k.charAt(0).toUpperCase() + k.slice(1));
    const sData = Object.keys(statusMap).map(k => statusMap[k].count);
    const sColors = Object.keys(statusMap).map(k => statusMap[k].color);

    if (statusChartInstance) {
        statusChartInstance.data.datasets[0].data = sData;
        statusChartInstance.update();
    } else {
        statusChartInstance = new Chart(ctxStatus.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: sLabels,
                datasets: [{
                    data: sData,
                    backgroundColor: sColors,
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: textColor,
                            usePointStyle: true,
                            padding: 20,
                            font: { size: 11 }
                        }
                    }
                }
            }
        });
    }
}

// Call on load
loadTicketStats();
