//frontend/js/user_request.js

// ==========================================
// USER HARDWARE REQUEST PAGE SCRIPT
// ==========================================

//API BASE URL
const API_BASE="https://app-aai-hardware-resources-backend.onrender.com";

let showToast; // will be dynamically imported on page load


// Resolve current user from storage
function getCurrentUser() {
    try {
        const s = sessionStorage.getItem("user");
        if (s) return JSON.parse(s);
    } catch { }
    try {
        const sEmp = sessionStorage.getItem("emp_id");
        if (sEmp) return { emp_id: sEmp };
    } catch { }
    try {
        const l = localStorage.getItem("user");
        if (l) return JSON.parse(l);
    } catch { }
    try {
        const lEmp = localStorage.getItem("emp_id");
        if (lEmp) return { emp_id: lEmp };
    } catch { }
    return null;
}

// 1. Sidebar Active State
const links = document.querySelectorAll(".sidebar-link");
links.forEach(link => {
    link.addEventListener("click", () => {
        links.forEach(l => l.classList.remove("sidebar-active"));
        link.classList.remove("text-text-muted-light", "dark:text-text-muted-dark");
        link.classList.add("sidebar-active");
    });
});

// 3. Logout Logic (unified)
function handleLogout() {
    const confirmLogout = confirm("Are you sure you want to log out?");
    if (confirmLogout) {
        try { sessionStorage.clear(); } catch { }
        try { localStorage.clear(); } catch { }
        window.location.href = "../html/UserLogin.html";
    }
}

// 6. Load User Info
async function loadUserDetails() {
    const user = getCurrentUser();
    if (!user || !user.emp_id) {
        alert("Please login first");
        window.location.href = "../html/UserLogin.html";
        return;
    }
    const res = await fetch(`${API_BASE}/api/users/${encodeURIComponent(user.emp_id)}`);
    const data = await res.json();
    document.getElementById("empName").innerText = data.name;
    document.getElementById("empId").innerText = data.emp_id;
}

// Load hardware names into first select
async function loadHardwareNames() {
    try {
        const res = await fetch(`${API_BASE}/api/hardware/names`);
        const names = await res.json();
        const sel = document.getElementById('hardwareName');
        sel.innerHTML = '<option value="">Select Hardware</option>';
        names.forEach(n => {
            const opt = document.createElement('option');
            opt.value = n;
            opt.textContent = n;
            sel.appendChild(opt);
        });
    } catch (e) {
        console.error('Failed to load hardware names', e);
    }
}

// When hardware name changes, load its models
async function loadModels() {
    const name = document.getElementById('hardwareName').value;
    const modelSel = document.getElementById('modelName');
    modelSel.innerHTML = '<option value="">Select Model</option>';
    if (!name) return;
    try {
        const res = await fetch(`${API_BASE}/api/hardware/models?name=${encodeURIComponent(name)}`);
        const models = await res.json();
        models.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m;
            opt.textContent = m;
            modelSel.appendChild(opt);
        });
    } catch (e) {
        console.error('Failed to load models', e);
    }
}

// Check how many assets are available for the selected name+model
async function checkAvailability() {
    const name = document.getElementById('hardwareName').value.trim();
    const model = document.getElementById('modelName').value.trim();
    const out = document.getElementById('availableQty');
    const btnSubmit = document.getElementById('btnSubmit');
    const contactMsg = document.getElementById('contactAdminMsg');
    if (!name || !model) {
        out.value = '';
        if (btnSubmit) btnSubmit.disabled = true;
        if (contactMsg) contactMsg.style.display = 'none';
        return;
    }
    try {
        const res = await fetch(`${API_BASE}/api/hardware/count?name=${encodeURIComponent(name)}&model=${encodeURIComponent(model)}`);
        const data = await res.json();
        const available = data.available ?? 0;
        out.value = available;
        if (available === 0) {
            out.classList.add('input-error');
            if (btnSubmit) btnSubmit.disabled = true;
            if (contactMsg) contactMsg.style.display = 'block';
        } else {
            out.classList.remove('input-error');
            if (btnSubmit) btnSubmit.disabled = false;
            if (contactMsg) contactMsg.style.display = 'none';
        }
    } catch (e) {
        console.error('Failed to load availability', e);
        out.value = '0';
        if (btnSubmit) btnSubmit.disabled = true;
        if (contactMsg) contactMsg.style.display = 'block';
    }
}

// Submit the request
async function submitRequest() {
    const user = getCurrentUser();
    const emp_id = user && user.emp_id;
    const name = document.getElementById('hardwareName').value;
    const model = document.getElementById('modelName').value;
    const qtyEl = document.getElementById('qty');
    const quantity = parseInt(qtyEl.value || '0', 10);
    const available = parseInt(document.getElementById('availableQty').value || '0', 10);

    // Validate all required fields
    if (!emp_id) {
        alert('Please login first');
        window.location.href = '../html/UserLogin.html';
        return;
    }
    if (!name) {
        alert('Please select hardware name.');
        document.getElementById('hardwareName').focus();
        return;
    }
    if (!model) {
        alert('Please select hardware model.');
        document.getElementById('modelName').focus();
        return;
    }
    if (!qtyEl.value || isNaN(quantity) || quantity < 1) {
        alert('Please enter a valid quantity.');
        qtyEl.focus();
        return;
    }
    if (!document.getElementById('availableQty').value) {
        alert('Please check availability.');
        document.getElementById('availableQty').focus();
        return;
    }
    if (quantity !== 1) {
        alert('Only 1 asset can be allocated per request');
        return;
    }
    if (quantity > available) {
        alert('Requested quantity exceeds available stock');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/requests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emp_id, name, model, quantity })
        });
        const data = await res.json();
        if (!res.ok) {
            alert(data.message || 'Request failed');
            return;
        }
        alert(`Request submitted successfully!\nRequest ID: ${data.request_id}`);
        window.location.href = '../html/user_dash.html';
    } catch (e) {
        console.error(e);
        alert('Server error');
    }
}

function clearForm() {
    document.getElementById('hardwareName').value = '';
    document.getElementById('modelName').value = '';
    document.getElementById('qty').value = '';
    document.getElementById('availableQty').value = '';
    document.getElementById('availableQty').classList.remove('input-error');
}

// Bind events after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    loadUserDetails();
    loadHardwareNames();

    const hwSel = document.getElementById('hardwareName');
    const modelSel = document.getElementById('modelName');
    const btnSubmit = document.getElementById('btnSubmit');
    const btnClear = document.getElementById('btnClear');

    if (hwSel) hwSel.addEventListener('change', () => { loadModels(); checkAvailability(); });
    if (modelSel) modelSel.addEventListener('change', checkAvailability);
    if (btnSubmit) btnSubmit.addEventListener('click', submitRequest);
    if (btnClear) btnClear.addEventListener('click', clearForm);
});

