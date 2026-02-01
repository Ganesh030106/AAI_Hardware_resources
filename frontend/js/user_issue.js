//frontend/js/user_issue.js

// ==========================================
// USER ISSUE TRACKING PAGE SCRIPT
// ==========================================

//API BASE URL
const API_BASE="https://app-aai-hardware-resources-backend.onrender.com";

// --- API & CONFIG ---
const API_URL = `${API_BASE}/api/issue-requests/user`; // GET /api/issue-requests/user/:emp_id
let allRequests = [];
let currentPage = 1;
const itemsPerPage = 5;
let currentFilter = 'All';

// --- 1. SETUP ---
const user = JSON.parse(sessionStorage.getItem("user"));

document.addEventListener('DOMContentLoaded', () => {
    if (!user) {
        window.location.href = "./UserLogin.html";
        return;
    }
    // Update Sidebar
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
        console.log("[TRACK REQUESTS] Fetching user requests for emp_id:", user.emp_id);
        const response = await fetch(`${API_URL}/${user.emp_id}`);
        if (!response.ok) throw new Error("Fetch failed");
        allRequests = await response.json();
        console.log("[TRACK REQUESTS] Requests fetched successfully:", allRequests);
        console.log("[TRACK REQUESTS] Department values:", allRequests.map(r => ({ request_id: r.request_id, department: r.department || r.dept })));
        renderTable();
    } catch (error) {
        console.error("[TRACK REQUESTS] Error fetching data:", error);
        document.getElementById("track-table-body").innerHTML = `<tr><td colspan="8" class="px-6 py-8 text-center text-red-500">Failed to load data.</td></tr>`;
    }
}

// --- 3. RENDER LOGIC ---
function renderTable() {
    const tbody = document.getElementById("track-table-body");

    // Filter only by status
    let filtered = allRequests.filter(req => {
        const derivedStatus = req.technician_status === 'assigned' ? 'Completed' : 'Pending';
        const statusMatch = currentFilter === 'All' || derivedStatus === currentFilter;
        req._derivedStatus = derivedStatus;
        return statusMatch;
    });

    // Pagination
    const total = filtered.length;
    const totalPages = Math.ceil(total / itemsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = filtered.slice(start, end);

    // Update Counts
    document.getElementById("total-items").innerText = total;
    document.getElementById("page-start").innerText = total > 0 ? start + 1 : 0;
    document.getElementById("page-end").innerText = Math.min(end, total);
    document.getElementById("current-page-num").innerText = currentPage;
    document.getElementById("prev-btn").disabled = currentPage === 1;
    document.getElementById("next-btn").disabled = currentPage === totalPages;

    // HTML Generation
    if (pageData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-8 text-center text-text-muted-light">No records found.</td></tr>`;
        return;
    }

    tbody.innerHTML = pageData.map(req => {
        const derivedStatus = req._derivedStatus || (req.technician_status === 'assigned' ? 'Completed' : 'Pending');

        // Styles for derived status
        let statusClass = "bg-gray-100 text-gray-700";
        let statusDot = "bg-gray-500";
        if (derivedStatus === 'Completed') { statusClass = "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"; statusDot = "bg-green-600"; }
        if (derivedStatus === 'Pending') { statusClass = "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"; statusDot = "bg-yellow-600"; }

        const assetLabel = req.asset_name ? `${req.asset_name} (${req.asset_id || "ID"})` : (req.asset_id || "Hardware");
        const category = req.category || "Others";
        const issue = req.issue || "Others Hardware Issue";
        const description = req.description || req.issue_description || "No description provided.";
        const priority = req.priority ?? 'Pending'; // priority from collection

        // Technician status styling
        const techStatus = req.technician_status === 'assigned' ? 'Assigned' : 'Unassigned';
        let techStatusClass = "";
        let techStatusDot = "";
        if (req.technician_status === 'assigned') {
            techStatusClass = "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
            techStatusDot = "bg-green-600";
        } else {
            techStatusClass = "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300";
            techStatusDot = "bg-yellow-600";
        }

        return `
    <tr class="hover:bg-[#f1f5f9] dark:hover:bg-[#2d3748] cursor-pointer transition-colors">
        <td class="px-6 py-4">
            <div class="flex flex-col">
                <span class="font-medium">${assetLabel}</span>
                <span class="text-xs text-[#4c669a] dark:text-gray-400">Hardware Request</span>
            </div>
        </td>
        <td class="px-6 py-4 text-[#0d121b] dark:text-white">${category}</td>
        <td class="px-6 py-4 text-[#4c669a] dark:text-gray-300">${issue}</td>
        <td class="px-6 py-4 text-[#0d121b] dark:text-white">${description}</td>
        <td class="px-6 py-4">
            <span class="text-sm font-medium ${priority === 'High' ? 'text-red-500' : priority === 'Medium' ? 'text-orange-500' : priority === 'Low' ? 'text-green-600' : 'text-[#9ca3af]'}">${priority}</span>
        </td>
        <td class="px-6 py-4">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${techStatusClass} border border-transparent">
                <span class="size-1.5 rounded-full ${techStatusDot}"></span>
                ${techStatus}
            </span>
        </td>
        <td class="px-6 py-4">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusClass} border border-transparent">
                <span class="size-1.5 rounded-full ${statusDot}"></span>
                ${derivedStatus}
            </span>
        </td>
    </tr>
    `;
    }).join('');
}

// --- 4. ACTIONS ---
function filterRequests() {
    currentPage = 1;
    renderTable();
}

function handleStatusFilter() {
    const select = document.getElementById('status-filter');
    currentFilter = select.value;
    renderTable();
}

function changePage(dir) {
    currentPage += dir;
    renderTable();
}

// 5. Navigation
const links = document.querySelectorAll(".sidebar-link");
links.forEach(link => {
    link.addEventListener("click", () => {
        links.forEach(l => l.classList.remove("sidebar-active"));
        link.classList.add("sidebar-active");
    });
});

// Date Display
function formatDate(date) {
    return date.toLocaleDateString("en-US",
        {
            month: "short",
            day: "2-digit",
            year: "numeric"
        });
}
function setToday() {
    const dateText = document.getElementById("dateText");
    if (dateText) dateText.innerText = formatDate(new Date());
}

setToday();

function handleLogout() {
    if (confirm("Are you sure you want to log out?")) {
        sessionStorage.removeItem("user");
        window.location.href = "./UserLogin.html";
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