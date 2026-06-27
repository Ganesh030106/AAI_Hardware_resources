import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import Layout from '../../components/Layout';

export default function AdSettings() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Admin Self Password States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // User Security Password States (admin resetting a user's password)
  const [userEmpId, setUserEmpId] = useState('');
  const [userValidated, setUserValidated] = useState(false);
  const [userNewPassword, setUserNewPassword] = useState('');
  const [userConfirmPassword, setUserConfirmPassword] = useState('');
  const [showUserNewPassword, setShowUserNewPassword] = useState(false);
  const [showUserConfirmPassword, setShowUserConfirmPassword] = useState(false);

  useEffect(() => {
    if (!user || (user.role || '').toLowerCase() !== 'admin') {
      navigate('/html/AdminLogin.html');
      return;
    }
  }, [user, navigate]);

  const validateEmpId = async () => {
    const empId = userEmpId.trim();
    if (!empId) return;

    try {
      const res = await fetch('/api/settings/validate-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: empId })
      });

      const data = await res.json();

      if (res.ok) {
        setUserValidated(true);
        showToast('✅ Employee ID validated', 'success');
      } else {
        setUserValidated(false);
        alert('❌ ' + data.message);
      }
    } catch (err) {
      console.error(err);
      alert('Server error while validating Emp ID');
    }
  };

  const handleAdminUserPasswordUpdate = async (e) => {
    e.preventDefault();

    const identifier = userEmpId.trim();
    if (!userValidated) {
      alert('Please verify the Employee ID first');
      return;
    }

    if (userNewPassword !== userConfirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (userNewPassword.length < 4) {
      alert('Password too short (min 4 chars)');
      return;
    }

    try {
      const res = await fetch('/api/settings/user-change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          newPassword: userNewPassword
        })
      });

      const data = await res.json();

      if (res.ok) {
        alert('✅ User password updated successfully');
        setUserEmpId('');
        setUserNewPassword('');
        setUserConfirmPassword('');
        setUserValidated(false);
      } else {
        alert('❌ ' + data.message);
      }
    } catch (err) {
      console.error(err);
      alert('Server error while updating password');
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    if (newPassword.length < 4) {
      alert('Password is too short (min 4 chars)');
      return;
    }

    try {
      const identifier = user.username || user.emp_id;
      const response = await fetch('/api/settings/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        showToast('✅ Success: ' + data.message, 'success');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        alert('❌ ' + data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to connect to server');
    }
  };

  return (
    <Layout>
      <div className="mx-auto flex flex-col gap-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-text-main-light dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 text-[30px] align-middle">settings</span>
            Account Settings
          </h2>
          <p className="text-text-muted-light dark:text-[#94a3b8] mt-1">
            Manage your security preferences, notifications, and dashboard configuration.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Security & Appearance Form */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            
            {/* Self Password Change Card */}
            <div className="card-hover bg-white dark:bg-slate-900 rounded-xl border border-border-light dark:border-border-dark p-6 shadow-sm">
              <h3 className="text-lg font-bold text-text-main-light dark:text-text-main-dark mb-4">Security</h3>
              <p className="text-sm text-text-muted-light dark:text-[#94a3b8] mb-6">
                Update your account password regularly to keep your account secure.
              </p>

              <form className="max-w-xl" onSubmit={handlePasswordUpdate}>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-text-main-light dark:text-text-main-dark mb-1.5">
                        New Password
                      </label>
                      <div className="relative group">
                        <input 
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark pl-4 pr-10 py-2.5 text-text-main-light dark:text-text-main-dark focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all placeholder:text-text-muted-light text-sm"
                          required 
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted-light hover:text-blue-600 transition-colors cursor-pointer outline-none"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {showNewPassword ? 'visibility' : 'visibility_off'}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-text-main-light dark:text-text-main-dark mb-1.5">
                        Confirm Password
                      </label>
                      <div className="relative group">
                        <input 
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark pl-4 pr-10 py-2.5 text-text-main-light dark:text-text-main-dark focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all placeholder:text-text-muted-light text-sm"
                          required 
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted-light hover:text-blue-600 transition-colors cursor-pointer outline-none"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {showConfirmPassword ? 'visibility' : 'visibility_off'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button 
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg shadow-sm shadow-blue-600/30 transition-all text-sm font-bold"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </div>

            {/* Appearance Card */}
            <div className="card-hover bg-gradient-to-br from-card-light to-blue-50/50 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-border-light dark:border-border-dark p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-blue-600">
                <span className="material-symbols-outlined">admin_panel_settings</span>
                <h3 className="text-xs uppercase font-bold tracking-wider">Appearance Settings</h3>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-text-main-light dark:text-text-main-dark">Appearance</p>
                  <p className="text-xs text-text-muted-light dark:text-[#94a3b8] mt-1">Switch application theme</p>
                </div>
                <button 
                  onClick={toggleTheme}
                  aria-checked={theme === 'dark'}
                  className="group relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 dark:bg-blue-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                  role="switch" 
                  type="button"
                >
                  <span className="sr-only">Toggle Theme</span>
                  <span 
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                    } group-hover:scale-95`}
                  >
                    <span className={`absolute inset-0 flex h-full w-full items-center justify-center transition-opacity ${
                      theme === 'dark' ? 'opacity-0 duration-100' : 'opacity-100 duration-200'
                    }`}>
                      <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    </span>
                    <span className={`absolute inset-0 flex h-full w-full items-center justify-center transition-opacity ${
                      theme === 'dark' ? 'opacity-100 duration-200' : 'opacity-0 duration-100'
                    }`}>
                      <svg className="h-3 w-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                      </svg>
                    </span>
                  </span>
                </button>
              </div>
              <p className="text-xs text-text-muted-light dark:text-[#94a3b8] mt-4 pt-4 border-t border-border-light dark:border-border-dark italic">
                This preference overrides the system default.
              </p>
            </div>

          </div>

          {/* User security management */}
          <div>
            <div className="card-hover bg-white dark:bg-slate-900 rounded-xl border border-border-light dark:border-border-dark p-6 shadow-sm">
              <h3 className="text-lg font-bold text-text-main-light dark:text-text-main-dark mb-2">User Security</h3>
              <p className="text-sm text-text-muted-light dark:text-[#94a3b8] mb-6">
                Reset passwords for <b>non-admin users</b>. Admin accounts cannot be modified here.
              </p>

              <form onSubmit={handleAdminUserPasswordUpdate}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-text-main-light dark:text-text-main-dark">
                      Emp ID
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={userEmpId}
                        onChange={(e) => {
                          setUserEmpId(e.target.value);
                          setUserValidated(false);
                        }}
                        className="flex-1 rounded-lg border px-4 py-2.5 text-sm bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark text-text-main-light dark:text-text-main-dark focus:ring-2 focus:ring-blue-600 outline-none"
                        placeholder="Enter emp_id" 
                        required 
                      />
                      <button 
                        type="button" 
                        onClick={validateEmpId}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-colors"
                      >
                        Verify
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-text-main-light dark:text-text-main-dark">
                      New Password
                    </label>
                    <div className="relative group">
                      <input 
                        type={showUserNewPassword ? 'text' : 'password'}
                        value={userNewPassword}
                        onChange={(e) => setUserNewPassword(e.target.value)}
                        disabled={!userValidated}
                        className="w-full rounded-lg border px-4 pr-10 py-2.5 text-sm bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark text-text-main-light dark:text-text-main-dark focus:ring-2 focus:ring-blue-600 outline-none disabled:opacity-50"
                        required 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowUserNewPassword(!showUserNewPassword)}
                        disabled={!userValidated}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer outline-none disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {showUserNewPassword ? 'visibility' : 'visibility_off'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-text-main-light dark:text-text-main-dark">
                      Confirm Password
                    </label>
                    <div className="relative group">
                      <input 
                        type={showUserConfirmPassword ? 'text' : 'password'}
                        value={userConfirmPassword}
                        onChange={(e) => setUserConfirmPassword(e.target.value)}
                        disabled={!userValidated}
                        className="w-full rounded-lg border px-4 pr-10 py-2.5 text-sm bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark text-text-main-light dark:text-text-main-dark focus:ring-2 focus:ring-blue-600 outline-none disabled:opacity-50"
                        required 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowUserConfirmPassword(!showUserConfirmPassword)}
                        disabled={!userValidated}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer outline-none disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {showUserConfirmPassword ? 'visibility' : 'visibility_off'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button 
                    type="submit"
                    disabled={!userValidated}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>

        <div className="mt-8 text-center text-xs text-text-muted-light dark:text-text-muted-dark pb-4">
          © 2026 AAI Hardware Maintenance System. All rights reserved.
        </div>
      </div>
    </Layout>
  );
}
