import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';

export default function AdProfileDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    if (!user || (user.role || '').toLowerCase() !== 'admin') {
      navigate('/html/AdminLogin.html');
      return;
    }

    const loadProfile = async () => {
      // Default immediately from session storage
      setProfileData(user);

      // Fetch fresh data from DB to get updates
      try {
        const response = await fetch(`/api/profile?emp_id=${user.emp_id}`);
        const data = await response.json();
        if (data.success && data.data) {
          setProfileData(prev => ({ ...prev, ...data.data }));
        }
      } catch (error) {
        console.error('Failed to load profile from server, using cached data.', error);
      }
    };

    loadProfile();
  }, [user, navigate]);

  if (!profileData) {
    return (
      <Layout>
        <div className="text-center text-[#4c669a] py-8">Loading profile...</div>
      </Layout>
    );
  }

  const displayName = profileData.name || 'Admin';
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=135bec&color=fff&size=150`;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        
        {/* Profile Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-blue-600">
              <img src={avatarUrl} alt="User Avatar" className="object-cover w-full h-full" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-text-main-light dark:text-text-main-dark">
                {displayName}
              </h2>
              <p className="text-text-muted-light dark:text-[#94a3b8] mt-1">
                {(profileData.role || 'Administrator')} | {(profileData.dept || 'Admin Department')}
              </p>
            </div>
          </div>
        </div>

        {/* Profile Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="card-hover bg-white dark:bg-slate-900 rounded-xl p-6 border border-border-light dark:border-border-dark shadow-sm">
            <h3 className="text-lg font-bold text-text-main-light dark:text-text-main-dark mb-4">
              Personal Information
            </h3>
            <ul className="text-text-muted-light dark:text-[#94a3b8] space-y-2">
              <li>
                <strong>Employee ID: </strong> <span>{profileData.emp_id || '...'}</span>
              </li>
              <li>
                <strong>Username: </strong> <span>{profileData.username || '...'}</span>
              </li>
              <li>
                <strong>Department: </strong> <span>{profileData.dept || '...'}</span>
              </li>
            </ul>
          </div>

          <div className="card-hover bg-white dark:bg-slate-900 rounded-xl p-6 border border-border-light dark:border-border-dark shadow-sm">
            <h3 className="text-lg font-bold text-text-main-light dark:text-text-main-dark mb-4">
              Security & Settings
            </h3>
            <ul className="text-text-muted-light dark:text-[#94a3b8] space-y-2">
              <li className="flex items-center">
                <strong>Password: </strong> <span className="ml-1">********</span>
                <Link to="/html/Ad-settings.html" className="text-blue-600 hover:underline ml-2 text-sm">
                  Change
                </Link>
              </li>
              <li>
                <strong>Last Login: </strong>{' '}
                <span>{profileData.lastLogin || new Date().toLocaleString()}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Roles Details card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="rounded-xl p-4 bg-white dark:bg-slate-800 border">
            <p className="text-xs text-text-muted-light dark:text-[#94a3b8]">Role</p>
            <p className="text-lg font-bold text-text-main-light dark:text-white">
              {profileData.role || '—'}
            </p>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-text-muted-light dark:text-text-muted-dark pb-4">
          © 2026 AAI Hardware Maintenance System. All rights reserved.
        </div>
      </div>
    </Layout>
  );
}
