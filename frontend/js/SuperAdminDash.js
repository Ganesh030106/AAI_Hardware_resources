// frontend/js/SuperAdminDash.js

// ==========================================
// SUPER ADMIN DASHBOARD SCRIPT
// ==========================================

//API BASE URL
const API_BASE="https://app-aai-hardware-resources-backend.onrender.com";

// --- API ENDPOINTS ---
const API_URLS = {
    GET_USERS: `${API_BASE}/api/superadmin/users`,
    UPDATE_ROLE: `${API_BASE}/api/superadmin/update-role`,
    UPDATE_DETAILS: `${API_BASE}/api/superadmin/update-details`, // New Endpoint
    DELETE_USER: `${API_BASE}/api/superadmin/delete`,
    LOGOUT: `${API_BASE}/api/logout`,
    ADD_USER: `${API_BASE}/api/superadmin/add-user`
};

// --- ADD USER MODAL LOGIC ---

function openAddUserModal() {
    document.getElementById('addName').value = '';
    document.getElementById('addEmpId').value = '';
    document.getElementById('addDept').value = '';
    document.getElementById('addUsername').value = '';
    document.getElementById('addPassword').value = '';
    document.getElementById('addRole').value = 'Employee';
    const modal = document.getElementById('addUserModal');
    const content = document.getElementById('addUserModalContent');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);
}

// Close Add User Modal
function closeAddUserModal() {
    const modal = document.getElementById('addUserModal');
    const content = document.getElementById('addUserModalContent');
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }, 300);
}

// Submit Add User Form
async function submitAddUser() {
    const name = document.getElementById('addName').value.trim();
    const emp_id = document.getElementById('addEmpId').value.trim();
    const dept = document.getElementById('addDept').value.trim();
    const username = document.getElementById('addUsername').value.trim();
    const password = document.getElementById('addPassword').value;
    const role = document.getElementById('addRole').value;

    if (!name || !emp_id || !dept || !username || !password || !role) {
        alert('All fields are required.');
        return;
    }

    if (password.length < 8) {
        alert("Password must be at least 8 characters");
        return;
    }

    try {
        const res = await fetch(API_URLS.ADD_USER, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, emp_id, dept, username, password, role })
        });
        const data = await res.json();
        if (res.ok) {
            alert('User added successfully!');
            closeAddUserModal();
            fetchUsers();
        } else {
            alert(data.message || 'Failed to add user');
        }
    } catch (err) {
        console.error(err);
        alert('Server Error');
    }
}

document.addEventListener('DOMContentLoaded', fetchUsers);
let allUsers = [];

// Fetch users from API
async function fetchUsers() {
    try {
        const response = await fetch(API_URLS.GET_USERS);
        if (!response.ok) throw new Error("Failed to fetch data");
        allUsers = await response.json();
        renderTable(allUsers);
        updateStats(allUsers);
    } catch (error) {
        console.error(error);
        document.getElementById('userTableBody').innerHTML = `
    <tr><td colspan="6" class="px-6 py-8 text-center text-red-500">Error loading data. Are you logged in?</td></tr>
    `;
    }
}

// Render user table
function renderTable(users) {
    const tbody = document.getElementById('userTableBody');
    tbody.innerHTML = '';

    // FILTER: Remove Superadmin from visible list
    const visibleUsers = users.filter(user => user.role !== 'Superadmin');

    if (visibleUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-slate-500">No users found</td></tr>';
        return;
    }

    visibleUsers.forEach(user => {
        let badgeClass = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
        if (user.role === 'Admin') badgeClass = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';

        let actionButtons = '';
        // NEW: Edit Details Button
        actionButtons += `<button class="p-1.5 rounded-md text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors mr-1" title="Edit Details" onclick="openEditModal('${user._id}')"><span class="material-symbols-outlined text-[18px]">edit</span></button>`;

        actionButtons += `<button class="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors mr-1" title="Reset Password" onclick="openResetModal('${user.username}')"><span class="material-symbols-outlined text-[18px]">lock_reset</span></button>`;

        if (user.role === 'Admin') {
            actionButtons += `<button class="p-1.5 rounded-md text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors mr-1" title="Demote to Employee" onclick="updateRole('${user._id}', 'Employee')"><span class="material-symbols-outlined text-[18px]">arrow_downward</span></button>`;
        } else {
            actionButtons += `<button class="p-1.5 rounded-md text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors mr-1" title="Promote to Admin" onclick="updateRole('${user._id}', 'Admin')"><span class="material-symbols-outlined text-[18px]">arrow_upward</span></button>`;
        }
        actionButtons += `<button class="p-1.5 rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete User" onclick="deleteUser('${user._id}')"><span class="material-symbols-outlined text-[18px]">delete</span></button>`;

        const row = `
    <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
        <td class="px-6 py-4 font-medium">${user.emp_id || 'N/A'}</td>
        <td class="px-6 py-4 font-semibold text-slate-900 dark:text-white">${user.name}</td>
        <td class="px-6 py-4">${user.dept || '-'}</td>
        <td class="px-6 py-4 font-mono text-xs">${user.username}</td>
        <td class="px-6 py-4"><span class="px-2 py-1 rounded-full text-xs font-bold ${badgeClass}">${user.role}</span></td>
        <td class="px-6 py-4 text-right">${actionButtons}</td>
    </tr>
    `;
        tbody.innerHTML += row;
    });
}

// Update statistics
function updateStats(users) {
    document.getElementById('totalUsers').innerText = users.length;
    document.getElementById('totalAdmins').innerText = users.filter(u => u.role === 'Admin').length;
    document.getElementById('totalEmployees').innerText = users.filter(u => u.role === 'Employee').length;
}

// Filter table based on search input
function filterTable() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filtered = allUsers.filter(user =>
        (user.name && user.name.toLowerCase().includes(query)) ||
        (user.emp_id && user.emp_id.toLowerCase().includes(query)) ||
        (user.username && user.username.toLowerCase().includes(query))
    );
    renderTable(filtered);
}

// Update user role
async function updateRole(id, newRole) {
    if (!confirm(`Are you sure you want to change this user to ${newRole}?`)) return;
    try {
        const res = await fetch(`${API_URLS.UPDATE_ROLE}/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: newRole })
        });
        if (res.ok) fetchUsers();
        else alert("Failed to update role");
    } catch (err) { console.error(err); }
}

// Delete user
async function deleteUser(id) {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    try {
        const res = await fetch(`${API_URLS.DELETE_USER}/${id}`, { method: 'DELETE' });
        if (res.ok) fetchUsers();
        else alert("Failed to delete user");
    } catch (err) { console.error(err); }
}

// Logout
function logout() { window.location.href = './SuperAdminLogin.html'; }

// --- Password Reset Modal Logic ---
let currentResetTarget = null;
function openResetModal(username) {
    currentResetTarget = username;
    document.getElementById('modalUserText').innerText = `Resetting password for: ${username}`;
    document.getElementById('newPasswordInput').value = '';
    const modal = document.getElementById('resetModal');
    const content = document.getElementById('resetModalContent');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);
}

// Close Reset Modal
function closeResetModal() {
    const modal = document.getElementById('resetModal');
    const content = document.getElementById('resetModalContent');
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
        currentResetTarget = null;
    }, 300);
}

// Submit Password Reset
async function submitPasswordReset() {
    const newPass = document.getElementById('newPasswordInput').value;
    if (!newPass) { alert("Please enter a password"); return; }
    try {
        const res = await fetch('/api/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: currentResetTarget, newPassword: newPass })
        });
        if (!res.ok) {
            const text = await res.text();
            console.error(text);
            alert("Update failed");
            return;
        }
        if (res.ok) { alert("Password updated successfully!"); closeResetModal(); }
        else { alert(data.message || "Failed to update password"); }
    } catch (err) { console.error(err); alert("Server Error"); }
}

// Edit Details Modal Logic 
function openEditModal(userId) {
    // Find user data from local copy
    const user = allUsers.find(u => u._id === userId);
    if (!user) return;

    document.getElementById('editUserId').value = user._id;
    document.getElementById('editName').value = user.name || '';
    document.getElementById('editEmpId').value = user.emp_id || '';
    document.getElementById('editDept').value = user.dept || '';
    document.getElementById('editUsername').value = user.username || '';

    const modal = document.getElementById('editUserModal');
    const content = document.getElementById('editUserModalContent');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);
}

// Close Edit Modal
function closeEditModal() {
    const modal = document.getElementById('editUserModal');
    const content = document.getElementById('editUserModalContent');
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }, 300);
}

// Submit Edit User Details
async function submitUserUpdate() {
    const id = document.getElementById('editUserId').value;
    const payload = {
        name: document.getElementById('editName').value,
        emp_id: document.getElementById('editEmpId').value,
        dept: document.getElementById('editDept').value,
        username: document.getElementById('editUsername').value
    };

    try {
        const res = await fetch(`${API_URLS.UPDATE_DETAILS}/${id}`, {
            method: 'PATCH', // or PUT depending on your backend
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("User details updated!");
            closeEditModal();
            fetchUsers(); // Refresh table
        } else {
            if (!res.ok) {
                const text = await res.text();
                console.error(text);
                alert("Update failed");
                return;
            }

            alert(data.message || "Failed to update details");
        }
    } catch (err) {
        console.error(err);
        alert("Server Error");
    }
}

// Toggle password visibility utility
function togglePasswordVisibility(btn, inputId) {
    const input = document.getElementById(inputId);
    const icon = btn.querySelector('span');
    if (input.type === 'password') {
        input.type = 'text';
        icon.textContent = 'visibility';
    } else {
        input.type = 'password';
        icon.textContent = 'visibility_off';
    }
}
