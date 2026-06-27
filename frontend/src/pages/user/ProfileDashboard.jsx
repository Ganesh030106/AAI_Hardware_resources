import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';

export default function ProfileDashboard() {
  const { user, loginUser } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    emp_id: '',
    username: '',
    dept: '',
    role: ''
  });

  const [formFields, setFormFields] = useState({
    name: '',
    username: '',
    dept: '',
    role: ''
  });

  useEffect(() => {
    if (!user || !user.emp_id) {
      navigate('/html/UserLogin.html');
      return;
    }

    const fetchProfileData = async () => {
      try {
        const response = await fetch(`/api/profile?emp_id=${user.emp_id}`);
        if (response.ok) {
          const data = await response.json();
          const userData = data.data || data;
          setProfileData(userData);
          setFormFields({
            name: userData.name || '',
            username: userData.username || '',
            dept: userData.department || userData.dept || '',
            role: userData.role || ''
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfileData();
  }, [user, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormFields(prev => ({ ...prev, [name]: value }));
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    // Reset back to original fetched data
    setFormFields({
      name: profileData.name || '',
      username: profileData.username || '',
      dept: profileData.department || profileData.dept || '',
      role: profileData.role || ''
    });
  };

  const handleSaveClick = async (e) => {
    e.preventDefault();

    const updatedData = {
      emp_id: user.emp_id,
      name: formFields.name,
      username: formFields.username,
      dept: formFields.dept,
      role: formFields.role,
      password: ""
    };

    try {
      const response = await fetch('/api/user/profile', {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData)
      });

      const result = await response.json();
      const updatedUser = result.user || result.data;

      if (response.ok && updatedUser) {
        if (window.showToast) {
          window.showToast("Profile updated successfully!", "success");
        } else {
          alert("Profile updated successfully!");
        }

        setProfileData(updatedUser);
        
        // Sync back to auth context session user
        const updatedContextUser = {
          ...user,
          name: updatedUser.name
        };
        loginUser(updatedContextUser);

        setIsEditing(false);
      } else {
        alert("Error: " + (result.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save changes.");
    }
  };

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name || 'User')}&background=135bec&color=fff`;

  const inputStyle = isEditing
    ? "w-full p-3 rounded-lg border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark text-text-main-light dark:text-text-main-dark focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all"
    : "w-full p-3 rounded-lg border border-transparent bg-background-light dark:bg-slate-800 text-text-main-light dark:text-text-main-dark focus:ring-0 outline-none transition-all";

  return (
    <Layout>
      <div className="max-w-[1280px] mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-main-light dark:text-text-main-dark flex items-center gap-2">
            <span className="material-symbols-outlined align-middle text-[32px]">person</span>
            My Profile
          </h1>
          <p className="text-text-muted-light dark:text-text-muted-dark mt-1">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Avatar Panel */}
          <div className="lg:col-span-4">
            <div className="card-hover bg-card-light dark:bg-slate-800 rounded-xl shadow-sm border border-border-light dark:border-slate-700 p-8 flex flex-col items-center text-center">
              <div className="mb-6 relative group">
                <div 
                  id="profile-avatar-large"
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-32 shadow-md border-4 border-background-light dark:border-background-dark"
                  style={{ backgroundImage: `url('${avatarUrl}')` }}
                />
              </div>
              <h2 id="display-name" className="text-2xl font-bold text-text-main-light dark:text-text-main-dark">
                {profileData.name || "Loading..."}
              </h2>
              <p id="display-role" className="text-text-muted-light dark:text-text-muted-dark font-medium mb-4">
                {profileData.role || "Employee"} &bull; {profileData.dept || "Department"}
              </p>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold uppercase tracking-wider border border-green-100 dark:border-green-800">
                <span className="size-2 rounded-full bg-green-500 animate-pulse"></span> Active
              </span>
            </div>
          </div>

          {/* Settings Fields Form */}
          <div className="lg:col-span-8">
            <section className="card-hover bg-card-light dark:bg-card-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden">
              <div className="px-6 py-5 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-background-light/50 dark:bg-gray-800/30">
                <h2 className="text-text-main-light dark:text-text-main-dark text-lg font-bold">Personal Information</h2>
                <div id="button-group">
                  {!isEditing ? (
                    <button 
                      id="edit-btn" 
                      onClick={handleEditClick}
                      className="animated-btn flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors dark:bg-blue-600 dark:hover:bg-blue-700"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span> Edit Profile
                    </button>
                  ) : (
                    <div id="save-cancel-group" className="flex gap-2">
                      <button 
                        onClick={handleCancelClick}
                        className="px-4 py-2 bg-background-light dark:bg-gray-700 text-text-main-light dark:text-text-main-dark border border-border-light dark:border-border-dark rounded-lg text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleSaveClick}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-green-600/20"
                      >
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6">
                <form id="profile-form" className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6" onSubmit={(e) => e.preventDefault()}>
                  
                  {/* Name field */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-text-muted-light dark:text-text-muted-dark text-xs font-bold uppercase w-full">
                      Full Name
                      <input 
                        name="name" 
                        id="input-name" 
                        type="text" 
                        value={formFields.name}
                        onChange={handleInputChange}
                        readOnly={!isEditing} 
                        className={inputStyle}
                      />
                    </label>
                  </div>

                  {/* Employee ID (ReadOnly always) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-text-muted-light dark:text-text-muted-dark text-xs font-bold uppercase w-full">
                      Employee ID
                      <input 
                        name="emp_id" 
                        id="input-emp-id" 
                        type="text" 
                        value={profileData.emp_id}
                        readOnly 
                        className="w-full p-3 rounded-lg border border-transparent bg-background-light dark:bg-slate-800 text-text-main-light dark:text-text-main-dark focus:ring-0 outline-none transition-all opacity-70 cursor-not-allowed"
                      />
                    </label>
                  </div>

                  {/* Username field */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-text-muted-light dark:text-text-muted-dark text-xs font-bold uppercase w-full">
                      Username
                      <input 
                        name="username" 
                        id="input-username" 
                        type="text" 
                        value={formFields.username}
                        onChange={handleInputChange}
                        readOnly={!isEditing}
                        className={inputStyle}
                      />
                    </label>
                  </div>

                  {/* Department (ReadOnly) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-text-muted-light dark:text-text-muted-dark text-xs font-bold uppercase w-full">
                      Department
                      <input 
                        name="dept" 
                        id="input-dept" 
                        type="text" 
                        value={formFields.dept}
                        readOnly 
                        className="w-full p-3 rounded-lg border border-transparent bg-background-light dark:bg-slate-800 text-text-main-light dark:text-text-main-dark focus:ring-0 outline-none transition-all opacity-70 cursor-not-allowed"
                      />
                    </label>
                  </div>

                  {/* Role (ReadOnly) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-text-muted-light dark:text-text-muted-dark text-xs font-bold uppercase w-full">
                      Role
                      <input 
                        name="role" 
                        id="input-role" 
                        type="text" 
                        value={formFields.role}
                        readOnly 
                        className="w-full p-3 rounded-lg border border-transparent bg-background-light dark:bg-slate-800 text-text-main-light dark:text-text-main-dark focus:ring-0 outline-none transition-all opacity-70 cursor-not-allowed"
                      />
                    </label>
                  </div>

                </form>
              </div>
            </section>
          </div>

        </div>
      </div>
      <div className="mt-8 text-center text-xs text-text-muted-light dark:text-text-muted-dark pb-4">
        &copy; 2026 AAI Hardware Maintenance System. All rights reserved.
      </div>
    </Layout>
  );
}
