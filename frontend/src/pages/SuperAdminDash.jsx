import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function SuperAdminDash() {
  const { superadminUser, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [allUsers, setAllUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals Visibility
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  // Form states - Add User
  const [addName, setAddName] = useState('');
  const [addEmpId, setAddEmpId] = useState('');
  const [addDept, setAddDept] = useState('');
  const [addUsername, setAddUsername] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addRole, setAddRole] = useState('Employee');
  const [showAddPassword, setShowAddPassword] = useState(false);

  // Form states - Edit User
  const [editUserId, setEditUserId] = useState('');
  const [editName, setEditName] = useState('');
  const [editEmpId, setEditEmpId] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editUsername, setEditUsername] = useState('');

  // Form states - Password Reset
  const [resetUsername, setResetUsername] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);

  useEffect(() => {
    // Note: The original code checks if superadmin user is logged in
    const sa = sessionStorage.getItem('superadmin_user');
    if (!sa) {
      navigate('/html/SuperAdminLogin.html');
      return;
    }
    fetchUsers();
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/superadmin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setAllUsers(data || []);
    } catch (error) {
      console.error(error);
      showToast('Error loading users. Are you logged in?', 'error');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/html/SuperAdminLogin.html');
  };

  // Add User Submission
  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    if (!addName || !addEmpId || !addDept || !addUsername || !addPassword || !addRole) {
      alert('All fields are required.');
      return;
    }

    if (addPassword.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }

    try {
      const res = await fetch('/api/superadmin/add-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addName,
          emp_id: addEmpId,
          dept: addDept,
          username: addUsername,
          password: addPassword,
          role: addRole
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert('User added successfully!');
        setShowAddModal(false);
        // Clear fields
        setAddName('');
        setAddEmpId('');
        setAddDept('');
        setAddUsername('');
        setAddPassword('');
        setAddRole('Employee');
        fetchUsers();
      } else {
        alert(data.message || 'Failed to add user');
      }
    } catch (err) {
      console.error(err);
      alert('Server Error');
    }
  };

  // Edit User Details Submission
  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    if (!editName || !editEmpId || !editDept || !editUsername) {
      alert('All fields are required.');
      return;
    }

    try {
      const res = await fetch(`/api/superadmin/update-details/${editUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          emp_id: editEmpId,
          dept: editDept,
          username: editUsername
        })
      });

      if (res.ok) {
        alert('User details updated!');
        setShowEditModal(false);
        fetchUsers();
      } else {
        const text = await res.text();
        console.error(text);
        alert('Update failed');
      }
    } catch (err) {
      console.error(err);
      alert('Server Error');
    }
  };

  // Password Reset Submission
  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault();
    if (!resetPassword) {
      alert('Please enter a password');
      return;
    }
    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: resetUsername, newPassword: resetPassword })
      });
      if (res.ok) {
        alert('Password updated successfully!');
        setShowResetModal(false);
        setResetUsername('');
        setResetPassword('');
      } else {
        const text = await res.text();
        console.error(text);
        alert('Update failed');
      }
    } catch (err) {
      console.error(err);
      alert('Server Error');
    }
  };

  // Role Promotion / Demotion
  const handleUpdateRole = async (id, newRole) => {
    if (!confirm(`Are you sure you want to change this user to ${newRole}?`)) return;
    try {
      const res = await fetch(`/api/superadmin/update-role/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        fetchUsers();
      } else {
        alert('Failed to update role');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // User Deletion
  const handleDeleteUser = async (id) => {
    if (!confirm('Are you sure? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/superadmin/delete/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchUsers();
      } else {
        alert('Failed to delete user');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Edit Details Modal
  const openEditModal = (user) => {
    setEditUserId(user._id);
    setEditName(user.name || '');
    setEditEmpId(user.emp_id || '');
    setEditDept(user.dept || '');
    setEditUsername(user.username || '');
    setShowEditModal(true);
  };

  // Open Reset Password Modal
  const openResetModal = (username) => {
    setResetUsername(username);
    setResetPassword('');
    setShowResetModal(true);
  };

  // Statistics
  const totalUsersCount = allUsers.length;
  const adminUsersCount = allUsers.filter(u => u.role === 'Admin').length;
  const employeeUsersCount = allUsers.filter(u => u.role === 'Employee').length;
  const technicianUsersCount = allUsers.filter(u => u.role === 'Technician').length;

  // Search Filter (excluding Superadmin accounts)
  const filteredUsers = allUsers
    .filter(u => u.role !== 'Superadmin')
    .filter(u => {
      const q = searchQuery.toLowerCase();
      return (
        (u.name || '').toLowerCase().includes(q) ||
        (u.emp_id || '').toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q)
      );
    });

  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg-light dark:bg-bg-dark text-slate-800 dark:text-white font-display">
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div className="p-6 flex items-center gap-3">
            <div className="p-2 rounded-lg flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-[#135bec]">
              <span className="material-symbols-outlined text-[24px]">admin_panel_settings</span>
            </div>
            <div>
              <h1 className="text-base font-bold leading-none tracking-tight">SuperAdmin</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Master Portal</p>
            </div>
          </div>

          {/* Search Header input */}
          <div className="relative w-full max-w-xl">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined text-[20px]">
              search
            </span>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-600 focus:outline-none text-sm text-slate-900 dark:text-white transition-all"
              placeholder="Search users by Name, ID or Username..." 
            />
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors text-sm font-medium"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Logout
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 bg-slate-50 dark:bg-slate-900">
          <div className="max-w-7xl mx-auto flex flex-col gap-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Super Admin System Overview
              </h2>
              <p className="text-slate-500 dark:text-gray-400 mt-1">Manage users, administrators, and roles.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              {/* Stats Card 1 */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2">
                <div className="flex items-center gap-3 mb-2">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                    <span className="material-symbols-outlined text-[24px]">group</span>
                  </span>
                  <span className="ml-auto text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full dark:bg-slate-700 dark:text-slate-300">
                    Total
                  </span>
                </div>
                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Accounts</span>
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{totalUsersCount}</span>
              </div>

              {/* Stats Card 2 */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2">
                <div className="flex items-center gap-3 mb-2">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400">
                    <span className="material-symbols-outlined text-[24px]">shield_person</span>
                  </span>
                </div>
                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Administrators</span>
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{adminUsersCount}</span>
              </div>

              {/* Stats Card 3 */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2">
                <div className="flex items-center gap-3 mb-2">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                    <span className="material-symbols-outlined text-[24px]">badge</span>
                  </span>
                </div>
                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Standard Employees</span>
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{employeeUsersCount}</span>
              </div>

              {/* Stats Card 4 (Technicians) */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2">
                <div className="flex items-center gap-3 mb-2">
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                    <span className="material-symbols-outlined text-[24px]">build</span>
                  </span>
                </div>
                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Technicians</span>
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{technicianUsersCount}</span>
              </div>
            </div>

            {/* Table Directory */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-[24px]">table_view</span>
                  User Directory
                </h3>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={fetchUsers}
                    className="text-sm font-medium text-[#135bec] hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[18px]">refresh</span> Refresh
                  </button>
                  <button 
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 rounded-lg bg-[#135bec] text-white hover:bg-blue-700 font-medium shadow-md shadow-blue-500/20 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[20px]">person_add</span>
                    Add User
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-950 dark:text-white">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-xs uppercase font-bold text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Emp ID</th>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Department</th>
                      <th className="px-6 py-4">Username</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-slate-500">No users found</td>
                      </tr>
                    ) : (
                      filteredUsers.map((u, idx) => {
                        let badgeClass = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
                        if (u.role === 'Admin') {
                          badgeClass = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
                        } else if (u.role === 'Technician') {
                          badgeClass = 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
                        }
                        return (
                          <tr key={u._id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                            <td className="px-6 py-4 font-medium">{u.emp_id || 'N/A'}</td>
                            <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{u.name}</td>
                            <td className="px-6 py-4">{u.dept || '-'}</td>
                            <td className="px-6 py-4 font-mono text-xs">{u.username}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${badgeClass}`}>{u.role}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              
                              {/* Edit details */}
                              <button 
                                onClick={() => openEditModal(u)}
                                className="p-1.5 rounded-md text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors mr-1"
                                title="Edit Details"
                              >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </button>

                              {/* Reset password */}
                              <button 
                                onClick={() => openResetModal(u.username)}
                                className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors mr-1"
                                title="Reset Password"
                              >
                                <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                              </button>

                              {/* Promoted / Demoted toggle */}
                              {u.role === 'Admin' && (
                                <button 
                                  onClick={() => handleUpdateRole(u._id, 'Employee')}
                                  className="p-1.5 rounded-md text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors mr-1"
                                  title="Demote to Employee"
                                >
                                  <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                                </button>
                              )}
                              {u.role === 'Employee' && (
                                <button 
                                  onClick={() => handleUpdateRole(u._id, 'Admin')}
                                  className="p-1.5 rounded-md text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors mr-1"
                                  title="Promote to Admin"
                                >
                                  <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                                </button>
                              )}

                              {/* Delete Account */}
                              <button 
                                onClick={() => handleDeleteUser(u._id)}
                                className="p-1.5 rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                title="Delete User"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>

                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* MODAL 1: Password Reset */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold mb-2">Quick Password Reset</h3>
            <p className="text-sm text-slate-500 mb-6">Resetting password for: <span className="font-semibold">{resetUsername}</span></p>

            <form onSubmit={handlePasswordResetSubmit}>
              <div className="relative group flex items-center mb-6">
                <input 
                  type={showResetPassword ? 'text' : 'password'}
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-600 focus:outline-none text-slate-900 dark:text-white"
                  placeholder="Enter new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowResetPassword(!showResetPassword)}
                  className="absolute right-3.5 my-auto text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 cursor-pointer flex items-center transition-colors"
                  aria-label="Toggle password visibility"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showResetPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>

              <div className="flex gap-3 justify-end">
                <button 
                  type="button"
                  onClick={() => {
                    setShowResetModal(false);
                    setResetPassword('');
                  }}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md shadow-blue-500/20"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit User Details */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold mb-2">Edit User Details</h3>
            <p className="text-sm text-slate-500 mb-6">Update information for this account</p>

            <form onSubmit={handleEditUserSubmit}>
              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-300 uppercase mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-600 focus:outline-none text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-300 uppercase mb-1">Emp ID</label>
                    <input 
                      type="text" 
                      value={editEmpId}
                      onChange={(e) => setEditEmpId(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-600 focus:outline-none text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-300 uppercase mb-1">Department</label>
                    <input 
                      type="text" 
                      value={editDept}
                      onChange={(e) => setEditDept(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-600 focus:outline-none text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-300 uppercase mb-1">Username</label>
                  <input 
                    type="text" 
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-600 focus:outline-none text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button 
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md shadow-blue-500/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Add New User */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold mb-2">Add New User</h3>
            <p className="text-sm text-slate-500 mb-6">Fill in details to create a new Employee or Admin account.</p>

            <form onSubmit={handleAddUserSubmit}>
              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-300 uppercase mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-600 focus:outline-none text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-300 uppercase mb-1">Emp ID</label>
                    <input 
                      type="text" 
                      value={addEmpId}
                      onChange={(e) => setAddEmpId(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-600 focus:outline-none text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-300 uppercase mb-1">Department</label>
                    <input 
                      type="text" 
                      value={addDept}
                      onChange={(e) => setAddDept(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-600 focus:outline-none text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-300 uppercase mb-1">Username</label>
                  <input 
                    type="text" 
                    value={addUsername}
                    onChange={(e) => setAddUsername(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-600 focus:outline-none text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-300 uppercase mb-1">Password</label>
                  <div className="relative">
                    <input 
                      type={showAddPassword ? 'text' : 'password'}
                      value={addPassword}
                      onChange={(e) => setAddPassword(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-600 focus:outline-none text-slate-900 dark:text-white pr-10"
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowAddPassword(!showAddPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 cursor-pointer flex items-center transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showAddPassword ? 'visibility' : 'visibility_off'}
                      </span>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-300 uppercase mb-1">Role</label>
                  <select 
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-600 focus:outline-none text-slate-900 dark:text-white"
                  >
                    <option value="Employee">Employee</option>
                    <option value="Admin">Admin</option>
                    <option value="Technician">Technician</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium shadow-md shadow-green-500/20"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
