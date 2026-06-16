
//frontend/js/Admin_n_req.js

// ==========================================
// ADMIN INVENTORY & REQUESTS PAGE SCRIPT
// ==========================================

//API BASE URL
const API_BASE="https://app-aai-hardware-resources-backend.onrender.com";

// --- STATE VARIABLES ---
let formOptions = {};
let newItemMode = false;
let newModelMode = false;
let newSupplierMode = false;
let showToast; // will be dynamically imported on page load

// --- 1. LOAD FORM OPTIONS ---
async function loadFormOptions() {
    try {
        const res = await fetch(`${API_BASE}/api/inventory/form-options`);
        if (!res.ok) throw new Error('Failed to load form options');
        formOptions = await res.json();

        console.log('Form options loaded:', formOptions);
        console.log('Vendors by name:', formOptions.vendorsByName);

        // Populate Item Name dropdown
        const itemSelect = document.getElementById('item-name');
        itemSelect.innerHTML = '<option value="">-- Select Item or Add New --</option>';
        formOptions.items.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item;
            opt.textContent = item;
            itemSelect.appendChild(opt);
        });
        itemSelect.addEventListener('change', onItemNameChange);

        // Populate Model dropdown
        const modelSelect = document.getElementById('item-model');
        modelSelect.innerHTML = '<option value="">-- Select Model or Add New --</option>';
        formOptions.models.forEach(model => {
            const opt = document.createElement('option');
            opt.value = model;
            opt.textContent = model;
            modelSelect.appendChild(opt);
        });
        modelSelect.addEventListener('change', onModelChange);

        // Populate Supplier dropdown
        const supplierSelect = document.getElementById('item-supplier');
        supplierSelect.innerHTML = '<option value="">-- Select Supplier or Add New --</option>';
        formOptions.supplierNames.forEach(supplier => {
            const opt = document.createElement('option');
            opt.value = supplier;
            opt.textContent = supplier;
            supplierSelect.appendChild(opt);
        });
        supplierSelect.addEventListener('change', onSupplierChange);

        // Populate Seller ID dropdown
        const sellerSelect = document.getElementById('seller_id');
        sellerSelect.innerHTML = '<option value="">-- Select Seller ID --</option>';
        formOptions.sellerIds.forEach(id => {
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = id;
            sellerSelect.appendChild(opt);
        });
    } catch (err) {
        console.error('Error loading form options', err);
        alert('Failed to load form options');
    }
}

// --- 2. EVENT HANDLERS FOR DROPDOWN CHANGES ---
function onItemNameChange() {
    const itemName = document.getElementById('item-name').value;
    if (!itemName) return;

    // Populate models for this item name if exists
    const models = formOptions.itemModelsMap[itemName] || [];
    const modelSelect = document.getElementById('item-model');
    modelSelect.innerHTML = '<option value="">-- Select Model --</option>';
    models.forEach(model => {
        const opt = document.createElement('option');
        opt.value = model;
        opt.textContent = model;
        modelSelect.appendChild(opt);
    });
}

function onModelChange() {
    // Model selected, can use it
}

// --- 3. Auto-fill supplier details on selection ---
function onSupplierChange() {
    const supplier = document.getElementById('item-supplier').value;
    console.log('Selected supplier:', supplier);
    console.log('Vendor info available:', formOptions.vendorsByName[supplier]);

    if (!supplier || !formOptions.vendorsByName[supplier]) {
        console.warn('No vendor info found for:', supplier);
        return;
    }

    const vendorInfo = formOptions.vendorsByName[supplier];
    console.log('Vendor details:', vendorInfo);

    // Auto-fill phone
    const phoneValue = vendorInfo.phone || '';
    document.getElementById('supplier-phone').value = phoneValue;
    console.log('Set phone to:', phoneValue);

    // Auto-fill GST number
    const gstValue = vendorInfo.gst_number || '';
    document.getElementById('gst-number').value = gstValue;
    console.log('Set GST to:', gstValue);

    // Auto-select seller_id
    const sellerSelect = document.getElementById('seller_id');
    sellerSelect.value = vendorInfo.seller_id;
    console.log('Set seller_id to:', vendorInfo.seller_id);
}

// --- 4. TOGGLE NEW ITEM/MODEL/SUPPLIER MODE ---
function toggleNewItemMode() {
    newItemMode = !newItemMode;
    const select = document.getElementById('item-name');
    const input = document.getElementById('item-name-new');
    if (newItemMode) {
        select.style.display = 'none';
        input.style.display = 'block';
        input.focus();
    } else {
        select.style.display = 'block';
        input.style.display = 'none';
        input.value = '';
    }
}

// --- 5. Toggle New Model Mode ---
function toggleNewModelMode() {
    newModelMode = !newModelMode;
    const select = document.getElementById('item-model');
    const input = document.getElementById('item-model-new');
    if (newModelMode) {
        select.style.display = 'none';
        input.style.display = 'block';
        input.focus();
    } else {
        select.style.display = 'block';
        input.style.display = 'none';
        input.value = '';
    }
}

// --- 6. Toggle New Supplier Mode ---
function toggleNewSupplierMode() {
    newSupplierMode = !newSupplierMode;
    const select = document.getElementById('item-supplier');
    const input = document.getElementById('item-supplier-new');
    const sellerSelect = document.getElementById('seller_id');
    const sellerAuto = document.getElementById('seller_id_auto');
    const sellerNote = document.getElementById('seller_id_note');

    if (newSupplierMode) {
        select.style.display = 'none';
        input.style.display = 'block';
        input.focus();

        // Clear auto-filled fields
        document.getElementById('supplier-phone').value = '';
        document.getElementById('gst-number').value = '';

        // Show auto-generated seller ID
        sellerSelect.style.display = 'none';
        sellerAuto.style.display = 'block';
        sellerNote.style.display = 'block';

        // Generate next seller ID
        const nextSellerId = generateNextSellerId();
        sellerAuto.value = nextSellerId;
    } else {
        select.style.display = 'block';
        input.style.display = 'none';
        input.value = '';

        // Show seller dropdown
        sellerSelect.style.display = 'block';
        sellerAuto.style.display = 'none';
        sellerNote.style.display = 'none';
        sellerSelect.value = '';
    }
}

// --- 7. Generate next seller ID based on existing IDs ---
function generateNextSellerId() {
    if (!formOptions.sellerIds || formOptions.sellerIds.length === 0) {
        return 'S001';
    }

    // Extract numbers from seller IDs (e.g., "S005" -> 5)
    const numbers = formOptions.sellerIds
        .map(id => {
            const match = id.match(/S(\d+)/);
            return match ? parseInt(match[1], 10) : 0;
        })
        .filter(num => num > 0);

    if (numbers.length === 0) return 'S001';

    const maxNumber = Math.max(...numbers);
    const nextNumber = maxNumber + 1;
    return `S${String(nextNumber).padStart(3, '0')}`;
}

// --- 8. AUTH CHECK & SIDEBAR ---
const user = JSON.parse(sessionStorage.getItem("user"));
if (!user || user.role !== "Admin") {
    window.location.href = "./AdminLogin.html";
} else {
    if (document.getElementById("sidebar-name")) document.getElementById("sidebar-name").innerText = user.name || "Admin";
    if (document.getElementById("sidebar-role")) document.getElementById("sidebar-role").innerText = user.role || "Administrator";
    if (document.getElementById("sidebar-avatar") && user.name) {
        document.getElementById("sidebar-avatar").src =
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=135bec&color=fff`;
    }
}

// --- 9. SET DATE ---
function setToday() {
    const date = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
    document.getElementById("dateText").innerText = date;
}
setToday();


// --- 10. ADD NEW ITEM FUNCTION ---
async function addNewItem() {
    // Get values, considering new vs existing modes
    let itemName = newItemMode
        ? document.getElementById("item-name-new").value.trim()
        : document.getElementById("item-name").value.trim();

    let model = newModelMode
        ? document.getElementById("item-model-new").value.trim()
        : document.getElementById("item-model").value.trim();

    let supplier = newSupplierMode
        ? document.getElementById("item-supplier-new").value.trim()
        : document.getElementById("item-supplier").value.trim();

    const phone = document.getElementById("supplier-phone").value.trim();
    const gst = document.getElementById("gst-number").value.trim();

    // Get seller_id - use auto-generated if in new supplier mode
    const seller_id = newSupplierMode
        ? document.getElementById("seller_id_auto").value.trim()
        : document.getElementById("seller_id").value.trim();

    const quantity = document.getElementById("quantity").value;
    const arrival_date = document.getElementById("arrival_date").value;

    // Validation
    if (!itemName || !model || !supplier || !quantity) {
        alert("Please fill in all required fields marked with * (Item Name, Model, Supplier, Quantity).");
        return;
    }

    if (!seller_id) {
        alert("Seller ID is required. Please select an existing supplier or create a new one.");
        return;
    }

    if (quantity < 1) {
        alert("Quantity must be at least 1.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/inventory/add`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                itemName,
                model,
                supplier,
                phone,
                gst,
                seller_id,
                quantity,
                arrival_date
            })
        });

        const result = await response.json();

        if (response.ok) {
            Toast.showToast(`✅ Success! ${result.data.totalItems} item(s) added to inventory.`, "success");
            window.location.href = "./Ad-inventory.html";
        } else {
            alert("❌ Error: " + result.message, "error");
        }

    } catch (error) {
        console.error("Error submitting form:", error);
        alert("❌ Failed to connect to the server. Please try again.");
    }
}

// --- 11. LOGOUT FUNCTION ---
function handleLogout() {
    if (confirm("Are you sure you want to logout?")) {
        sessionStorage.clear();
        window.location.href = "./AdminLogin.html";
    }
}

// ---12. INITIALIZE ON PAGE LOAD ---
document.addEventListener('DOMContentLoaded', loadFormOptions);

