import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Layout from '../../components/Layout';

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!user || !user.emp_id) {
      navigate('/html/UserLogin.html');
    }
  }, [user, navigate]);

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      alert('All password fields are required');
      return;
    }
    if (newPassword.length < 4) {
      alert('New password is too short');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    if (currentPassword === newPassword) {
      alert('New password cannot be the same as current');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch('/api/user-settings/change-password', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emp_id: user.emp_id,
          currentPassword,
          newPassword
        })
      });

      const result = await response.json();

      if (response.ok) {
        if (window.showToast) {
          window.showToast(result.message, "success");
        } else {
          alert(result.message || "Password updated successfully");
        }
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        if (window.showToast) {
          window.showToast(result.message, "error");
        } else {
          alert("Error: " + result.message);
        }
      }
    } catch (error) {
      console.error("Password Update Error:", error);
      alert("Failed to connect to server");
    } finally {
      setIsUpdating(false);
    }
  };

  const getThemeCardClass = (mode) => {
    const isActive = theme === mode;
    return isActive
      ? "cursor-pointer border-2 rounded-xl p-4 flex items-center gap-4 hover:bg-background-light dark:hover:bg-gray-800 transition-all border-primary bg-blue-50 dark:bg-blue-900/10"
      : "cursor-pointer border-2 rounded-xl p-4 flex items-center gap-4 hover:bg-background-light dark:hover:bg-gray-800 transition-all border-transparent";
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Settings Title Header */}
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-text-main-light dark:text-text-main-dark flex items-center gap-2">
            <span className="material-symbols-outlined align-middle text-[32px]">settings</span>
            Settings
          </h1>
          <p className="text-text-muted-light dark:text-text-muted-dark mt-1">Manage your application preferences and security.</p>
        </div>

        {/* Appearance Settings Section */}
        <section className="card-hover bg-card-light dark:bg-card-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden">
          <div className="p-6 border-b border-border-light dark:border-border-dark">
            <h2 className="text-lg font-bold text-text-main-light dark:text-text-main-dark flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">palette</span> Appearance
            </h2>
            <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-1">Customize how the dashboard looks on your device.</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Light Mode Card */}
              <div onClick={() => setTheme('light')} className={getThemeCardClass('light')}>
                <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center">
                  <span className="material-symbols-outlined">light_mode</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-text-main-light dark:text-text-main-dark">Light Mode</h3>
                  <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Standard light theme</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 border-border-light dark:border-border-dark flex items-center justify-center check-circle ${theme === 'light' ? 'border-primary' : ''}`}>
                  <div className={`w-3 h-3 rounded-full bg-primary ${theme === 'light' ? '' : 'hidden'}`}></div>
                </div>
              </div>

              {/* Dark Mode Card */}
              <div onClick={() => setTheme('dark')} className={getThemeCardClass('dark')}>
                <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center">
                  <span className="material-symbols-outlined">dark_mode</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-text-main-light dark:text-text-main-dark">Dark Mode</h3>
                  <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Easy on the eyes</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 border-border-light dark:border-border-dark flex items-center justify-center check-circle ${theme === 'dark' ? 'border-primary' : ''}`}>
                  <div className={`w-3 h-3 rounded-full bg-primary ${theme === 'dark' ? '' : 'hidden'}`}></div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Security Password Section */}
        <section className="card-hover bg-card-light dark:bg-card-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden">
          <div className="p-6 border-b border-border-light dark:border-border-dark">
            <h2 className="text-lg font-bold text-text-main-light dark:text-text-main-dark flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">lock</span> Security
            </h2>
            <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-1">Update your password and security settings.</p>
          </div>
          <div className="p-6">
            <form id="security-form" className="space-y-4" onSubmit={handlePasswordUpdate}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-muted-light dark:text-text-muted-dark text-xs font-bold uppercase w-full">
                    Current Password
                    <div className="relative group mt-1">
                      <input 
                        id="current-password" 
                        type={showCurrentPassword ? "text" : "password"} 
                        required 
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full p-3 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowCurrentPassword(prev => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted-light hover:text-primary transition-colors cursor-pointer outline-none flex items-center"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {showCurrentPassword ? "visibility" : "visibility_off"}
                        </span>
                      </button>
                    </div>
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-muted-light dark:text-text-muted-dark text-xs font-bold uppercase w-full">
                    New Password
                    <div className="relative group mt-1">
                      <input 
                        id="new-password" 
                        type={showNewPassword ? "text" : "password"} 
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full p-3 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowNewPassword(prev => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted-light hover:text-primary transition-colors cursor-pointer outline-none flex items-center"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {showNewPassword ? "visibility" : "visibility_off"}
                        </span>
                      </button>
                    </div>
                  </label>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-muted-light dark:text-text-muted-dark text-xs font-bold uppercase w-full">
                    Confirm New Password
                    <div className="relative group mt-1">
                      <input 
                        id="confirm-password" 
                        type={showConfirmPassword ? "text" : "password"} 
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full p-3 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowConfirmPassword(prev => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted-light hover:text-primary transition-colors cursor-pointer outline-none flex items-center"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {showConfirmPassword ? "visibility" : "visibility_off"}
                        </span>
                      </button>
                    </div>
                  </label>
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="animated-btn glow-primary px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/30 transition-all bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 dark:shadow-blue-800/50 flex items-center gap-2 disabled:opacity-50"
                >
                  {isUpdating ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                      Updating...
                    </>
                  ) : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </section>

      </div>
      <div className="mt-8 text-center text-xs text-text-muted-light dark:text-text-muted-dark pb-4">
        &copy; 2026 AAI Hardware Maintenance System. All rights reserved.
      </div>
    </Layout>
  );
}
