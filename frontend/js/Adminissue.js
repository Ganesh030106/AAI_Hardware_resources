// frontend/js/Adminissue.js
/* ==========================================
   ADMIN ISSUE MANAGEMENT PAGE SCRIPT
   ========================================== */

// Base API URL
const API_BASE = "https://app-aai-hardware-resources-backend.onrender.com";

// --- STATE VARIABLES ---
let currentPage = 1;
const limit = 5;
let totalItems = 0;
let searchTimeout = null;

// --- AUTH CHECK & SIDEBAR UPDATE ---

const user = JSON.parse(sessionStorage.getItem("user"));
if (!user || user.role !== "Admin") {
    window.location.href = "./AdminLogin.html";
} else {
    if (document.getElementById("sidebar-name")) {
        document.getElementById("sidebar-name").innerText = user.name || "Admin";
    }
    if (document.getElementById("sidebar-role")) {
        document.getElementById("sidebar-role").innerText = user.role || "Administrator";
    }
    if (document.getElementById("sidebar-avatar") && user.name) {
        document.getElementById("sidebar-avatar").src =
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=135bec&color=fff`;
    }
}

// --- FETCH ISSUES ---

async function loadIssues(page = 1) {
    currentPage = page;
    const search = document.getElementById("search-input").value.trim();
    const dept = document.getElementById("filter-dept").value;

    const url = `${API_BASE}/api/issues?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&dept=${encodeURIComponent(dept)}`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch data");

        const data = await res.json();
        renderTable(data.issues);
        totalItems = data.total;
        updatePagination(data.total);
    } catch (err) {
        console.error(err);
        document.getElementById("issue-table-body").innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-red-500">Error loading issues. Ensure server is running.</td></tr>`;
    }
}

// --- RENDER TABLE ---

function renderTable(issues) {
    const tbody = document.getElementById("issue-table-body");
    tbody.innerHTML = "";

    if (issues.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-8 text-center text-gray-500">No issues found.</td></tr>`;
        return;
    }

    issues.forEach(issue => {
        // Priority Color Logic
        const priority = (issue.priority || "").toLowerCase();
        let priorityClass = "bg-gray-100 text-gray-700 border-gray-200";
        if (priority === 'pending') priorityClass = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-100 dark:text-blue-800 dark:border-blue-300";
        else if (priority === 'low') priorityClass = "bg-green-50 text-green-700 border-green-200 dark:bg-green-100 dark:text-green-800 dark:border-green-300";
        else if (priority === 'medium') priorityClass = "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-100 dark:text-yellow-800 dark:border-yellow-300";
        else if (priority === 'high') priorityClass = "bg-red-50 text-red-700 border-red-200 dark:bg-red-100 dark:text-red-800 dark:border-red-300";

        // Technician Status Color Logic
        const techStatus = (issue.technician_status || "unassigned").toLowerCase();
        let techStatusClass = "bg-blue-100 text-blue-700 border-blue-200";
        if (techStatus === 'unassigned') techStatusClass = "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-100 dark:text-yellow-800 dark:border-yellow-300";
        else if (techStatus === 'assigned') techStatusClass = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-100 dark:text-blue-800 dark:border-blue-300";

        // Check if category is "Others" and issue is "Other hardware issues"
        const isOtherHardware = (issue.category || "").toLowerCase() === 'others' ||
            (issue.issue || "").toLowerCase() === 'other hardware issues';

        // Priority dropdown options
        const priorityOptions = ['Pending', 'Low', 'Medium', 'High']
            .map(opt => {
                const selected = opt.toLowerCase() === priority ? "selected" : "";
                return `<option value="${opt}" ${selected}>${opt}</option>`;
            })
            .join("");

        // Technician status dropdown options
        const techStatusOptions = ['Unassigned', 'assigned']
            .map(opt => {
                const selected = opt.toLowerCase() === techStatus ? "selected" : "";
                return `<option value="${opt}" ${selected}>${opt}</option>`;
            })
            .join("");

        // For "Others"/"Other hardware issues": priority must be assigned (not Pending) before technician can be assigned
        const isPriorityAssigned = priority !== 'pending';
        const canAssignTechnician = isOtherHardware ? isPriorityAssigned : true;

        // AI Analysis rendering
        let aiHtml = `<button onclick=\"analyzeWithAI('${issue._id}', this)\" class=\"px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold mb-2\">Analyze with AI</button>`;
        aiHtml += `<div id=\"ai-details-${issue._id}\" style=\"display:none;\"></div>`;

        const row = `
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td class="px-6 py-4 text-sm font-semibold text-[#0d121b] dark:text-white">${issue.emp_name}</td>
                    <td class="px-6 py-4 text-sm text-[#4c669a] dark:text-gray-300">${issue.emp_dept}</td>
                    <td class="px-6 py-4 text-sm text-[#0d121b] dark:text-white font-medium">${issue.asset_name}</td>
                    <td class="px-6 py-4 text-sm text-[#4c669a] dark:text-gray-300">${issue.category}</td>
                    <td class="px-6 py-4 text-sm text-[#4c669a] dark:text-gray-300">${issue.issue}</td>
                    <td class="px-6 py-4 text-sm text-[#4c669a] dark:text-gray-300">${issue.description || ''}</td>
                    <td class="px-6 py-4 text-sm">
                        ${isOtherHardware && !isPriorityAssigned ?
                `<select onchange="updatePriority('${issue._id}', this.value)" class="text-xs font-bold rounded px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white cursor-pointer focus:ring-2 focus:ring-blue-600 outline-none">
                                ${priorityOptions}
                            </select>` :
                `<span class="px-3 py-1 rounded-full border text-xs font-semibold ${priorityClass}">${issue.priority}</span>`
            }
                    </td>
                    <td class="px-6 py-4 text-sm">
                        ${techStatus === 'assigned' || !canAssignTechnician ?
                `<span class="px-3 py-1 rounded-full border text-xs font-semibold ${techStatusClass}">${issue.technician_status.charAt(0).toUpperCase() + issue.technician_status.slice(1)}</span>` :
                `<select onchange="updateTechnicianStatus('${issue._id}', this.value)" class="text-xs font-bold rounded px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white cursor-pointer focus:ring-2 focus:ring-blue-600 outline-none">
                                ${techStatusOptions}
                            </select>`
            }
                    </td>
                    <td class="px-6 py-4 text-sm w-[260px] align-top">${aiHtml}</td>
                </tr>`;
        tbody.innerHTML += row;
    });
}

// --- UPDATE HANDLERS ---

async function updatePriority(id, val) {
    try {
        const res = await fetch(`${API_BASE}/api/issues/${id}/priority`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ priority: val })
        });
        if (res.ok) loadIssues(currentPage);
        else alert("Failed to update priority");
    } catch (e) { console.error(e); }
}

// --- UPDATE TECHNICIAN STATUS ---

async function updateTechnicianStatus(id, val) {
    try {
        const res = await fetch(`${API_BASE}/api/issues/${id}/technician-status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ technician_status: val })
        });
        if (res.ok) loadIssues(currentPage);
        else alert("Failed to update technician status");
    } catch (e) { console.error(e); }
}

// --- UPDATE PAGINATION ---

function updatePagination(total) {
    document.getElementById("total-results").innerText = total;
    document.getElementById("prev-btn").disabled = currentPage <= 1;
    document.getElementById("next-btn").disabled = currentPage >= Math.ceil(total / limit);
}

function changePage(dir) {
    loadIssues(currentPage + dir);
}

// ---------------- AI ANALYSIS (TOGGLE + COLOR) ----------------
window.analyzeWithAI = async function (issueId, btn) {
    const detailsDiv = document.getElementById(`ai-details-${issueId}`);

    // CLOSE
    if (btn.dataset.open === "true") {
        detailsDiv.classList.add("hidden");
        btn.dataset.open = "false";
        btn.innerText = "Analyze with AI";
        return;
    }

    // OPEN (already loaded)
    if (btn.dataset.loaded === "true") {
        detailsDiv.classList.remove("hidden");
        btn.dataset.open = "true";
        btn.innerText = "Hide AI Analysis";
        return;
    }

    // FIRST TIME FETCH
    btn.disabled = true;
    btn.innerText = "Analyzing...";

    try {
        const res = await fetch(API_BASE, { method: 'POST' });
        if (!res.ok) throw new Error('AI analysis failed');
        const data = await res.json();
        // Show AI details for this row only
        const detailsDiv = document.getElementById(`ai-details-${issueId}`);
        if (detailsDiv && data.aianalysis) {
            detailsDiv.style.display = '';
            detailsDiv.innerHTML = `
                        <div class=\"text-xs text-left\">
                            <div class=\"mb-1\"><span class=\"font-bold\">AI Priority:</span> <span class=\"inline-block px-2 py-0.5 rounded-full ${data.aianalysis.priority === 'High' ? 'bg-red-100 text-red-700' :
                    data.aianalysis.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'}\">${data.aianalysis.priority}</span></div>
                            <div class=\"mb-1\"><span class=\"font-bold\">AI Recommendation:</span> ${data.aianalysis.recommendation}</div>
                            <div><span class=\"font-bold\">AI Reason:</span> ${data.aianalysis.reason}</div>
                        </div>
                    `;
        }
    } catch (err) {
        alert('AI analysis failed.');
        console.error(err);
    } finally {
        btn.disabled = false;
        btn.innerText = 'Analyze with AI';
    }
}


// --- LOAD FILTER OPTIONS ---

async function loadFilterOptions() {
    try {
        const res = await fetch(`${API_BASE}/api/issues/filter-options`);
        if (!res.ok) throw new Error("Failed to fetch filter options");

        const data = await res.json();

        // Populate Department dropdown
        const deptSelect = document.getElementById("filter-dept");
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

// --- LOGOUT FUNCTION ---

function handleLogout() {
    if (confirm("Are you sure you want to logout?")) {
        sessionStorage.clear();
        window.location.href = "./AdminLogin.html";
    }
}

// --- DATE FORMATTING ---

function formatDate(date) {
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric"
    });
}

function setToday() {
    const today = new Date();
    document.getElementById("dateText").innerText = formatDate(today);
}

setToday();
setInterval(setToday, 60000);

loadFilterOptions();
loadIssues(1);

// --- CHART VISUALIZATIONS ---

let categoryChartInstance = null;
let priorityChartInstance = null;

// Helper: Get theme colors
function getThemeColor(type) {
    const isDark = document.documentElement.classList.contains('dark');
    if (type === 'text') return isDark ? '#94a3b8' : '#64748b';
    if (type === 'grid') return isDark ? '#334155' : '#e2e8f0';
    return '#000000';
}

// Load issue statistics and render charts

async function loadIssueStats() {
    try {
        const res = await fetch(`${API_BASE}/api/issues/stats`);
        const data = await res.json();

        if (res.ok) {
            initIssueCharts(data.categoryStats, data.priorityStats);
        }
    } catch (err) {
        console.error("Error loading issue stats:", err);
    }
}

// Initialize Issue Charts

function initIssueCharts(catData, prioData) {
    const ctxCategory = document.getElementById('categoryChart');
    const ctxPriority = document.getElementById('priorityChart');

    if (!ctxCategory || !ctxPriority) return;

    const textColor = getThemeColor('text');
    const gridColor = getThemeColor('grid');

    // --- 1. Category Doughnut Chart ---
    const catLabels = catData.map(c => c._id || "Other");
    const catCounts = catData.map(c => c.count);

    // Generate simple palette for categories
    const catColors = ['#135bec', '#7c3aed', '#f59e0b', '#10b981', '#ef4444'];

    if (categoryChartInstance) {
        categoryChartInstance.data.labels = catLabels;
        categoryChartInstance.data.datasets[0].data = catCounts;
        categoryChartInstance.update();
    } else {
        categoryChartInstance = new Chart(ctxCategory.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: catLabels,
                datasets: [{
                    data: catCounts,
                    backgroundColor: catColors
                }]
            },
            options: {
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: textColor,
                            usePointStyle: true,
                            boxWidth: 8,
                            padding: 15,
                            font: { size: 11 }
                        }
                    }
                }
            }
        });
    }

    // --- 2. Priority Bar Chart ---
    // Define strict order and colors for Priority
    const prioOrder = ['high', 'medium', 'low', 'pending'];
    const prioColors = {
        'high': '#ef4444',    // Red
        'medium': '#f59e0b',  // Orange
        'low': '#22c55e',     // Green
        'pending': '#94a3b8'  // Gray
    };

    // Map API data to fixed structure
    const pMap = { 'high': 0, 'medium': 0, 'low': 0, 'pending': 0 };
    if (prioData) {
        prioData.forEach(item => {
            const key = (item._id || "pending").toLowerCase();
            if (pMap.hasOwnProperty(key)) pMap[key] = item.count;
        });
    }

    const pLabels = prioOrder.map(k => k.charAt(0).toUpperCase() + k.slice(1));
    const pData = prioOrder.map(k => pMap[k]);
    const pColorArray = prioOrder.map(k => prioColors[k]);

    if (priorityChartInstance) {
        priorityChartInstance.data.datasets[0].data = pData;
        priorityChartInstance.update();
    } else {
        priorityChartInstance = new Chart(ctxPriority.getContext('2d'), {
            type: 'bar',
            data: {
                labels: pLabels,
                datasets: [{
                    label: 'Issues',
                    data: pData,
                    backgroundColor: pColorArray,
                    borderRadius: 4,
                    barThickness: 40,
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
}

// Initial Load
loadIssueStats();

