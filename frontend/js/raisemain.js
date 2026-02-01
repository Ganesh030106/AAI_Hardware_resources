//frontend/js/raisemain.js

// ==========================================
// USER MAIN DASHBOARD PAGE SCRIPT
// ==========================================

//API BASE URL
const API_BASE="https://app-aai-hardware-resources-backend.onrender.com";

// 1. Sidebar Active State
const links = document.querySelectorAll(".sidebar-link");
links.forEach(link => {
    link.addEventListener("click", () => {
        links.forEach(l => l.classList.remove("sidebar-active"));
        // Remove text color overrides when active so the white text shows through
        link.classList.remove("text-text-muted-light", "dark:text-text-muted-dark");
        link.classList.add("sidebar-active");
    });
});

// 2. Logout Logic
function handleLogout() {
    const confirmLogout = confirm("Are you sure you want to log out?");
    if (confirmLogout) {
        sessionStorage.clear();
        window.location.href = "../html/UserLogin.html";
    }
}

function getUserFromSession() {
    const sessionUser = sessionStorage.getItem("user");
    if (sessionUser) {
        try {
            return JSON.parse(sessionUser);
        } catch (e) {
            console.warn("Failed to parse session user", e);
            return null;
        }
    }
    return null;
}

async function loadUserDetails() {
    const user = getUserFromSession();
    if (!user || !user.emp_id) {
        alert("Please login first");
        window.location.href = "../html/UserLogin.html";
        return;
    }
    // Display user data from session
    document.getElementById("empName").innerText = user.name || "N/A";
    document.getElementById("empId").innerText = user.emp_id || "N/A";
}

async function loadAssetIds() {
    const user = getUserFromSession();
    if (!user || !user.emp_id) {
        alert("Employee not logged in");
        return;
    }
    const empId = user.emp_id;
    try {
        const res = await fetch(`${API_BASE}/api/allocations/employee/${empId}`);
        if (!res.ok) throw new Error("Failed to fetch allocations");
        const assets = await res.json();
        const assetDropdown = document.getElementById("hardwareName");
        assetDropdown.innerHTML = '<option value="">Select Asset ID</option>';
        if (assets.length === 0) {
            assetDropdown.innerHTML += `<option disabled>No assets allocated</option>`;
            return;
        }
        assets.forEach(item => {
            const opt = document.createElement("option");
            opt.value = item.asset_id;
            opt.textContent = item.asset_id;
            assetDropdown.appendChild(opt);
        });
    } catch (err) {
        console.error("Error loading assets", err);
        alert("Failed to load assets");
    }
}

async function loadHardwareDetails(assetId) {
    if (!assetId) {
        document.getElementById("hardwareNameDisplay").value = "";
        document.getElementById("hardwareModelDisplay").value = "";
        return;
    }
    try {
        const res = await fetch(`${API_BASE}/api/hardware/asset/${assetId}`);
        if (!res.ok) throw new Error("Failed to fetch hardware details");
        const data = await res.json();
        document.getElementById("hardwareNameDisplay").value = data.name || "";
        document.getElementById("hardwareModelDisplay").value = data.model || "";
    } catch (err) {
        console.error("Error loading hardware details", err);
        alert("Unable to fetch hardware details");
    }
}
document.getElementById("hardwareName").addEventListener("change", function () {
    loadHardwareDetails(this.value);
});

async function loadCategories() {
    try {
        const res = await fetch(`${API_BASE}/api/issues/categories`);
        if (!res.ok) throw new Error("Failed to load categories");
        const categories = await res.json();
        const categoryDropdown = document.getElementById("issueCategory");
        categoryDropdown.innerHTML = '<option value="">Select category</option>';
        categories.forEach(cat => {
            const opt = document.createElement("option");
            opt.value = cat;
            opt.textContent = cat;
            categoryDropdown.appendChild(opt);
        });
    } catch (err) {
        console.error("Category load failed", err);
    }
}

async function loadIssuesByCategory(category) {
    const issueDropdown = document.getElementById("issueSelect");
    const priorityField = document.getElementById("priorityDisplay");
    issueDropdown.innerHTML = '<option value="">Select issue</option>';
    priorityField.value = "";
    if (!category) return;
    try {
        const res = await fetch(`${API_BASE}/api/issues/by-category/${encodeURIComponent(category)}`);
        if (!res.ok) throw new Error("Failed to load issues");
        const issues = await res.json();
        issues.forEach(item => {
            const opt = document.createElement("option");
            opt.value = item.issue;
            opt.textContent = item.issue;
            opt.dataset.priority = item.priority;
            issueDropdown.appendChild(opt);
        });
    } catch (err) {
        console.error("Issue load failed", err);
    }
}

document.getElementById("submitRequestBtn").addEventListener("click", submitIssueRequest);
async function submitIssueRequest() {
    const user = getUserFromSession();
    if (!user || !user.emp_id) {
        alert("Session expired. Please login again.");
        window.location.href = "../html/UserLogin.html";
        return;
    }
    const emp_id = user.emp_id;
    const asset_id = document.getElementById("hardwareName").value;
    const hardwareName = document.getElementById("hardwareNameDisplay").value;
    const hardwareModel = document.getElementById("hardwareModelDisplay").value;
    const category = document.getElementById("issueCategory").value;
    const issue = document.getElementById("issueSelect").value;
    const priority = document.getElementById("priorityDisplay").value;
    const description = document.getElementById("issueDescription").value.trim();

    // Validate all required fields
    if (!asset_id) {
        alert("Please select Asset ID.");
        return;
    }
    if (!hardwareName) {
        alert("Hardware Name is required.");
        return;
    }
    if (!hardwareModel) {
        alert("Hardware Model is required.");
        return;
    }
    if (!category) {
        alert("Please select Category.");
        return;
    }
    if (!issue) {
        alert("Please select Issue.");
        return;
    }
    if (!priority) {
        alert("Priority Level is required.");
        return;
    }
    if (!description) {
        alert("Please provide a description of the issue.");
        return;
    }

    const submitBtn = document.getElementById("submitRequestBtn");
    submitBtn.disabled = true;
    try {
        const res = await fetch(`${API_BASE}/api/issuerequest`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                emp_id,
                asset_id,
                category,
                issue,
                description
            })
        });
        const data = await res.json();
        if (!res.ok) {
            alert(data.message || "Failed to submit request");
            return;
        }
        alert("Maintenance request submitted successfully");
        clearForm();
        window.location.href = "../html/user_dash.html";
    } catch (error) {
        console.error("Submit request error:", error);
        alert("Server error. Please try again later.");
    } finally {
        submitBtn.disabled = false;
    }
}

function clearForm() {
    document.getElementById("hardwareName").value = "";
    document.getElementById("hardwareNameDisplay").value = "";
    document.getElementById("hardwareModelDisplay").value = "";
    document.getElementById("issueCategory").value = "";
    document.getElementById("issueSelect").innerHTML = '<option value="">Select Issue</option>';
    document.getElementById("priorityDisplay").value = "";
    document.getElementById("issueDescription").value = "";
}


function loadPriority() {
    const issueDropdown = document.getElementById("issueSelect");
    const priorityField = document.getElementById("priorityDisplay");
    const selectedOption = issueDropdown.options[issueDropdown.selectedIndex];
    priorityField.value = selectedOption?.dataset.priority || "";
}

document.getElementById("issueCategory").addEventListener("change", function () {
    loadIssuesByCategory(this.value);
});

document.getElementById("issueSelect").addEventListener("change", loadPriority);
window.addEventListener("DOMContentLoaded", () => {
    loadUserDetails();
    loadCategories();
    loadAssetIds();
});