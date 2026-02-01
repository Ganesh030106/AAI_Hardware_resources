// frontend/js/Admininventory.js

/* ==========================================
   ADMIN INVENTORY PAGE SCRIPT
========================================== */
// --- EXPORT FUNCTIONS ---
function openExportModal() {
    const modal = document.getElementById('exportModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeExportModal() {
    const modal = document.getElementById('exportModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

const API_BASE="https://app-aai-hardware-resources-backend.onrender.com";

// --- CHART INSTANCE ---
let stockBarChart = null;

// --- VARIABLES ---
let currentPage = 1;
const limit = 5;
let totalItems = 0;

// Filters state
let filterItem = "All";
let filterSupplier = "All";
let searchTerm = "";

// Simple debounce helper for search
let searchTimeout;
function debounceSearch(fn, delay = 300) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(fn, delay);
}

Chart.defaults.responsive = true;
Chart.defaults.maintainAspectRatio = false;

// --- AUTH CHECK ---
const user = JSON.parse(sessionStorage.getItem("user"));
if (!user || user.role !== "Admin") {
    window.location.href = "./AdminLogin.html";
}

// --- FETCH & RENDER INVENTORY ---
async function loadInventory(page = 1) {
    try {
        currentPage = page;
        const query = new URLSearchParams({
            page,
            limit,
            search: searchTerm,
            item: filterItem,
            supplier: filterSupplier
        });

        const response = await fetch(`${API_BASE}/api/inventory?${query.toString()}`);
        const data = await response.json();

        const items = data.items;
        totalItems = data.total;

        const tableBody = document.getElementById("inventory-table-body");
        tableBody.innerHTML = "";

        if (items.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="4" class="p-8 text-center text-slate-500">No items found in inventory.</td></tr>`;
            updatePaginationHTML(0, 0, 0);
            return;
        }

        items.forEach(item => {
            const stock = item.stock || 0;

            const row = `
            <tr class="group hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors">
                <td class="p-4"><span class="font text-sm text-[#0d121b] dark:text-white font-semibold">${item.name}</span></td>
                <td class="p-4 text-sm text-slate-600 dark:text-slate-400 font-mono">${item.model}</td>
                <td class="p-4">
                    <div class="flex flex-col gap-1.5">
                        <span class="text-sm font-bold text-slate-700 dark:text-slate-300">${stock} units</span>
                    </div>
                </td>
                <td class="p-4 text-sm text-slate-600 dark:text-slate-400">${item.seller}</td>
            </tr>`;
            tableBody.innerHTML += row;
        });

        // Update Pagination Text
        const start = (currentPage - 1) * limit + 1;
        const end = Math.min(currentPage * limit, totalItems);
        updatePaginationHTML(start, end, totalItems);

        // Render Charts
        renderCharts(data.items);

    } catch (error) {
        console.error("Error loading inventory:", error);
    }
}

// --- RENDER CHARTS ---

function renderCharts(items) {
    const barCanvas = document.getElementById("stockBarChart");
    if (!barCanvas || !window.Chart) return;

    // Labels: Item Name + Brand / SKU Model
    const labels = items.map(
        i => `${i.name} - ${i.model}`
    );

    // Stock values
    const stocks = items.map(i => i.stock);

    // Color palette (auto rotate)
    const colors = [
        "#3B82F6", // blue
        "#10B981", // green
        "#F59E0B", // amber
        "#EF4444", // red
        "#8B5CF6", // violet
        "#06B6D4", // cyan
        "#EC4899", // pink
        "#22C55E", // lime
        "#F97316", // orange
        "#6366F1"  // indigo
    ];

    const barColors = labels.map((_, i) => colors[i % colors.length]);

    // Destroy existing chart safely
    if (stockBarChart instanceof Chart) {
        stockBarChart.destroy();
    }

    // Create colorful bar chart
    stockBarChart = new Chart(barCanvas, {
        type: "bar",
        data: {
            labels,
            datasets: [
                {
                    label: "Units",
                    data: stocks,
                    backgroundColor: barColors,
                    borderRadius: 8,
                    borderSkipped: false,
                    barPercentage: 0.6,
                    categoryPercentage: 0.7
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true
                },
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.parsed.y} units`
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        autoSkip: false,
                        maxRotation: 30,
                        minRotation: 30
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// --- PAGINATION HELPERS ---

function updatePaginationHTML(start, end, total) {
    document.getElementById("start-index").innerText = start;
    document.getElementById("end-index").innerText = end;
    document.getElementById("total-results").innerText = total;

    const totalPages = Math.ceil(total / limit);
    document.getElementById("prev-btn").disabled = (currentPage <= 1);
    document.getElementById("next-btn").disabled = (currentPage >= totalPages);
}

function changePage(direction) {
    const newPage = currentPage + direction;
    if (newPage > 0) loadInventory(newPage);
}

// --- LOAD FILTER OPTIONS FROM SERVER ---

async function loadFilterOptions() {
    try {
        const res = await fetch(`${API_BASE}/api/inventory/filter-options`);
        if (!res.ok) throw new Error('Failed to load filter options');
        const data = await res.json();

        // Populate items
        const itemMenu = document.getElementById('itemMenu');
        if (itemMenu) {
            itemMenu.innerHTML = '';
            const all = document.createElement('p');
            all.className = 'dropdown-item px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800';
            all.dataset.type = 'Item';
            all.dataset.value = 'All';
            all.textContent = 'All';
            itemMenu.appendChild(all);

            data.items.forEach(item => {
                const p = document.createElement('p');
                p.className = 'dropdown-item px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800';
                p.dataset.type = 'Item';
                p.dataset.value = item;
                p.textContent = item;
                itemMenu.appendChild(p);
            });
        }

        // Populate suppliers
        const supplierMenu = document.getElementById('supplierMenu');
        if (supplierMenu) {
            supplierMenu.innerHTML = '';
            const all = document.createElement('p');
            all.className = 'dropdown-item px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800';
            all.dataset.type = 'Supplier';
            all.dataset.value = 'All';
            all.textContent = 'All';
            supplierMenu.appendChild(all);

            data.suppliers.forEach(supplier => {
                const p = document.createElement('p');
                p.className = 'dropdown-item px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800';
                p.dataset.type = 'Supplier';
                p.dataset.value = supplier;
                p.textContent = supplier;
                supplierMenu.appendChild(p);
            });
        }
    } catch (err) {
        console.error('Error loading filter options', err);
    }
}

// --- LOAD ON START ---
loadFilterOptions().then(() => loadInventory(1));

// --- EVENT LISTENERS ---

document.addEventListener("click", function (e) {

    // Toggle menus
    const toggle = (btnId, menuId) => {
        if (document.getElementById(btnId).contains(e.target)) {
            document.getElementById(menuId).classList.toggle("hidden");
        } else {
            document.getElementById(menuId).classList.add("hidden");
        }
    };

    toggle("itemBtn", "itemMenu");
    toggle("supplierBtn", "supplierMenu");

    // Update label on select
    if (e.target.classList.contains("dropdown-item")) {
        const type = e.target.dataset.type;
        const value = e.target.dataset.value;

        document.getElementById(type.toLowerCase() + "Label").textContent =
            type + ": " + value;

        if (type === "Item") {
            filterItem = value;
        }
        if (type === "Supplier") {
            filterSupplier = value;
        }

        // Reload with new filters
        loadInventory(1);
    }
});

// Hook up search
const searchInput = document.getElementById("inventory-search");
if (searchInput) {
    searchInput.addEventListener("input", () => {
        searchTerm = searchInput.value.trim();
        debounceSearch(() => loadInventory(1));
    });
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

// --- 6. LOGOUT FUNCTION ---

function handleLogout() {
    if (confirm("Are you sure you want to logout?")) {
        sessionStorage.clear();
        window.location.href = "./AdminLogin.html";
    }
}


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

// --- EXPORT FUNCTIONALITY ---

async function performExport() {
    try {
        const format = document.querySelector('input[name="exportFormat"]:checked').value;

        const query = new URLSearchParams({
            item: filterItem,
            supplier: filterSupplier,
            search: searchTerm,
            format: format
        });

        const response = await fetch(`${API_BASE}/api/inventory/export?${query.toString()}`);

        if (!response.ok) {
            throw new Error("Failed to export data");
        }

        // For PDF, handle client-side preview like Ad-export.html
        if (format === "pdf") {
            const data = await response.json();
            exportInventoryToPDF(data.items, data.filters);
            closeExportModal();
            return;
        }

        // For CSV and Excel, download as blob
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        let ext = format;
        if (format === "excel") ext = "xls";

        const a = document.createElement("a");
        a.href = url;
        a.download = `inventory_export_${dateStr}.${ext}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        closeExportModal();
        alert("Export completed successfully!");
    } catch (error) {
        console.error("Export error:", error);
        alert("Failed to export data. Please try again.");
    }
}

// Open export modal

function exportInventoryToPDF(items, filters) {
    const w = window.open('', '_blank');
    if (!w) {
        alert('Please allow popups to preview PDF.');
        return;
    }

    const filterText = `Item: ${filters.item || 'All'} | Supplier: ${filters.supplier || 'All'}${filters.search ? ' | Search: ' + filters.search : ''}`;

    let html = `<!doctype html><html><head><title>Inventory Export Report</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; }
                    h1 { color: #135bec; margin-bottom: 10px; }
                    .meta { color: #666; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                    th { background: #135bec; color: white; font-weight: 600; }
                    tr:nth-child(even) { background: #f9f9f9; }
                    .footer { margin-top: 30px; text-align: right; color: #666; font-size: 14px; }
                    @media print {
                        .no-print { display: none; }
                    }
                </style>
            </head><body>
                <h1>Inventory Export Report</h1>
                <div class="meta">
                    <p><strong>Filters:</strong> ${filterText}</p>
                    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
                    <p><strong>Total Items:</strong> ${items.length}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Item Name</th>
                            <th>Model</th>
                            <th>Stock Level</th>
                            <th>Supplier</th>
                        </tr>
                    </thead>
                    <tbody>`;

    items.forEach(item => {
        html += `<tr>
                    <td>${item.name}</td>
                    <td>${item.model}</td>
                    <td>${item.stock} units</td>
                    <td>${item.seller}</td>
                </tr>`;
    });

    html += `</tbody></table>
                <div class="footer">
                    AAI Hardware - Inventory Management System
                </div>
            </body></html>`;

    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 500);
}

// Close modal when clicking outside
document.getElementById("exportModal").addEventListener("click", (e) => {
    if (e.target.id === "exportModal") {
        closeExportModal();
    }
});
