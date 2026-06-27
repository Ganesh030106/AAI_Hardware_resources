import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logoImg from '../../assets/logo.jpeg';

export default function RaiseMain() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [requesterName, setRequesterName] = useState('Loading...');
  const [requesterEmpId, setRequesterEmpId] = useState('Loading...');

  const [allocatedAssets, setAllocatedAssets] = useState([]);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [hardwareName, setHardwareName] = useState('');
  const [hardwareModel, setHardwareModel] = useState('');

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState('');
  const [priority, setPriority] = useState('');
  const [description, setDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user || !user.emp_id) {
      alert("Please login first");
      navigate('/html/UserLogin.html');
      return;
    }

    setRequesterName(user.name || 'N/A');
    setRequesterEmpId(user.emp_id || 'N/A');

    // Load user allocations (Asset IDs)
    const loadAssetIds = async () => {
      try {
        const res = await fetch(`/api/allocations/employee/${user.emp_id}`);
        if (res.ok) {
          const data = await res.json();
          setAllocatedAssets(data);
        }
      } catch (err) {
        console.error("Error loading assets", err);
      }
    };

    // Load categories
    const loadCategories = async () => {
      try {
        const res = await fetch('/api/issues/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (err) {
        console.error("Category load failed", err);
      }
    };

    loadAssetIds();
    loadCategories();
  }, [user, navigate]);

  // Load hardware details when asset ID changes
  useEffect(() => {
    const loadHardwareDetails = async () => {
      if (!selectedAssetId) {
        setHardwareName('');
        setHardwareModel('');
        return;
      }

      try {
        const res = await fetch(`/api/hardware/asset/${selectedAssetId}`);
        if (res.ok) {
          const data = await res.json();
          setHardwareName(data.name || '');
          setHardwareModel(data.model || '');
        }
      } catch (err) {
        console.error("Error loading hardware details", err);
      }
    };

    loadHardwareDetails();
  }, [selectedAssetId]);

  // Load issues when category changes
  useEffect(() => {
    const loadIssuesByCategory = async () => {
      if (!selectedCategory) {
        setIssues([]);
        setSelectedIssue('');
        setPriority('');
        return;
      }

      try {
        const res = await fetch(`/api/issues/by-category/${encodeURIComponent(selectedCategory)}`);
        if (res.ok) {
          const data = await res.json();
          setIssues(data);
          setSelectedIssue('');
          setPriority('');
        }
      } catch (err) {
        console.error("Issue load failed", err);
      }
    };

    loadIssuesByCategory();
  }, [selectedCategory]);

  const handleIssueChange = (e) => {
    const val = e.target.value;
    setSelectedIssue(val);
    if (!val) {
      setPriority('');
      return;
    }
    const matchingIssue = issues.find(item => item.issue === val);
    setPriority(matchingIssue?.priority || '');
  };

  const handleClear = () => {
    setSelectedAssetId('');
    setHardwareName('');
    setHardwareModel('');
    setSelectedCategory('');
    setSelectedIssue('');
    setPriority('');
    setDescription('');
  };

  const handleSubmit = async () => {
    if (!user || !user.emp_id) {
      alert("Session expired. Please login again.");
      navigate('/html/UserLogin.html');
      return;
    }
    if (!selectedAssetId) {
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
    if (!selectedCategory) {
      alert("Please select Category.");
      return;
    }
    if (!selectedIssue) {
      alert("Please select Issue.");
      return;
    }
    if (!priority) {
      alert("Priority Level is required.");
      return;
    }
    if (!description.trim()) {
      alert("Please provide a description of the issue.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/issuerequest', {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          emp_id: user.emp_id,
          asset_id: selectedAssetId,
          category: selectedCategory,
          issue: selectedIssue,
          description: description.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to submit request");
        return;
      }
      alert("Maintenance request submitted successfully");
      handleClear();
      navigate('/html/user_dash.html');
    } catch (error) {
      console.error("Submit request error:", error);
      alert("Server error. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark font-display antialiased overflow-hidden h-screen flex relative">
      
      {/* Sidebar background (blurred layout preservation) */}
      <aside className="w-64 h-full flex flex-col bg-card-light dark:bg-slate-800 border-r border-border-light dark:border-slate-700 flex-shrink-0 z-20 filter blur-[2px] opacity-30 pointer-events-none">
        <div className="p-6 flex items-center gap-3">
          <div className="p-2 rounded-lg flex items-center justify-center">
            <img src={logoImg} className="w-10 h-10 object-cover rounded" alt="logo" />
          </div>
          <div>
            <h1 className="text-base font-bold leading-none tracking-tight">AAI Hardware</h1>
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-1">User Portal</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative z-0">
        <header className="h-16 flex items-center justify-between px-6 bg-card-light dark:bg-card-dark border-b border-border-light dark:border-border-dark flex-shrink-0 filter blur-[2px] opacity-30 pointer-events-none">
          <div className="flex items-center w-full max-w-md">
            <div className="relative w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-light dark:text-text-muted-dark material-symbols-outlined text-[20px]">search</span>
              <input className="w-full pl-10 pr-4 py-2 rounded-lg bg-background-light dark:bg-background-dark border-none text-sm" type="text" readOnly />
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 lg:p-10 opacity-30 pointer-events-none filter blur-[2px]">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-text-main-light dark:text-text-main-dark">Welcome back</h1>
          </header>
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl border border-border-light dark:border-border-dark h-36"></div>
            <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl border border-border-light dark:border-border-dark h-36"></div>
            <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl border border-border-light dark:border-border-dark h-36"></div>
          </section>
        </div>

        {/* Modal Overlay Form */}
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <section className="bg-white dark:bg-card-dark w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-border-light dark:ring-border-dark">
            
            {/* Form Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border-light dark:border-border-dark">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-blue-600">build</span>
                  <h2 className="text-text-main-light dark:text-text-main-dark text-xl font-bold leading-tight tracking-[-0.015em]">
                    New Maintenance Request
                  </h2>
                </div>
                <p className="text-text-muted-light dark:text-text-muted-dark text-sm font-medium mt-1">
                  Submit a request for Hardware issues. Our team will review shortly.
                </p>
              </div>
              <Link to="/html/user_dash.html" className="p-2 rounded-full hover:bg-background-light dark:hover:bg-gray-800 text-text-muted-light dark:text-text-muted-dark transition-colors">
                <span className="material-symbols-outlined">close</span>
              </Link>
            </div>

            {/* Form Body */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-white dark:bg-background-dark/50">
              <div className="max-w-3xl mx-auto space-y-8">
                
                {/* Requester Details */}
                <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3 text-blue-600 font-semibold text-sm uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[18px]">badge</span>
                    <span>Requester Details</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase mb-1">Full Name</p>
                      <p className="text-[#0d121b] dark:text-white text-base font-medium" id="empName">{requesterName}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase mb-1">Employee ID</p>
                      <p className="text-[#0d121b] dark:text-white text-base font-medium" id="empId">{requesterEmpId}</p>
                    </div>
                  </div>
                </div>

                {/* Form: Hardware details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-text-main-light dark:text-text-main-dark flex items-center gap-2">
                    <span className="material-symbols-outlined text-text-muted-light dark:text-text-muted-dark">computer</span>
                    Hardware Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex flex-col flex-1">
                      <p className="text-text-main-light dark:text-text-main-dark text-sm font-medium pb-2">Asset ID</p>
                      <select
                        id="hardwareName"
                        className="form-input flex w-full rounded-lg text-[#0d121b] dark:text-white focus:outline-0 focus:ring-2 focus:ring-blue-600/20 border border-[#cfd7e7] dark:border-slate-600 bg-[#f8f9fc] dark:bg-slate-800 focus:border-blue-600 h-12 px-4 text-sm"
                        value={selectedAssetId}
                        onChange={(e) => setSelectedAssetId(e.target.value)}
                      >
                        <option value="">Select Asset ID</option>
                        {allocatedAssets.map(item => (
                          <option key={item.asset_id} value={item.asset_id}>{item.asset_id}</option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col flex-1">
                      <p className="text-text-main-light dark:text-text-main-dark text-sm font-medium pb-2">Hardware Name</p>
                      <input
                        id="hardwareNameDisplay"
                        className="form-input flex w-full rounded-lg text-[#0d121b] dark:text-white focus:outline-0 focus:ring-2 focus:ring-blue-600/20 border border-[#cfd7e7] dark:border-slate-600 bg-[#f8f9fc] dark:bg-slate-800 focus:border-blue-600 h-12 px-4 text-sm font-normal"
                        value={hardwareName}
                        readOnly
                      />
                    </label>
                    <label className="flex flex-col flex-1">
                      <p className="text-text-main-light dark:text-text-main-dark text-sm font-medium pb-2">Hardware Model</p>
                      <input
                        id="hardwareModelDisplay"
                        className="form-input flex w-full rounded-lg text-[#0d121b] dark:text-white focus:outline-0 focus:ring-2 focus:ring-blue-600/20 border border-[#cfd7e7] dark:border-slate-600 bg-[#f8f9fc] dark:bg-slate-800 focus:border-blue-600 h-12 px-4 text-sm font-normal"
                        value={hardwareModel}
                        readOnly
                      />
                    </label>
                  </div>
                </div>

                {/* Form: Issue details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-text-main-light dark:text-text-main-dark flex items-center gap-2">
                    <span className="material-symbols-outlined text-text-muted-light dark:text-text-muted-dark">bug_report</span>
                    Issue Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex flex-col flex-1">
                      <p className="text-text-main-light dark:text-text-main-dark text-sm font-medium pb-2">Category</p>
                      <select
                        id="issueCategory"
                        className="flex w-full rounded-lg text-text-main-light dark:text-text-main-dark focus:ring-2 focus:ring-blue-600 border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark h-11 px-4 text-sm"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                      >
                        <option value="">Select category</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col flex-1">
                      <p className="text-text-main-light dark:text-text-main-dark text-sm font-medium pb-2">Issue</p>
                      <select
                        id="issueSelect"
                        className="flex w-full rounded-lg text-text-main-light dark:text-text-main-dark focus:ring-2 focus:ring-blue-600 border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark h-11 px-4 text-sm"
                        value={selectedIssue}
                        onChange={handleIssueChange}
                        disabled={!selectedCategory}
                      >
                        <option value="">Select Issue</option>
                        {issues.map(item => (
                          <option key={item.issue} value={item.issue}>{item.issue}</option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col flex-1">
                      <p className="text-[#0d121b] dark:text-slate-200 text-sm font-medium pb-2">Priority Level</p>
                      <input
                        id="priorityDisplay"
                        className="form-input flex w-full rounded-lg text-[#0d121b] dark:text-white focus:outline-0 focus:ring-2 focus:ring-blue-600/20 border border-[#cfd7e7] dark:border-slate-600 bg-[#f8f9fc] dark:bg-slate-800 focus:border-blue-600 h-12 px-4 text-sm font-normal"
                        value={priority}
                        readOnly
                      />
                    </label>
                  </div>
                  <label className="flex flex-col w-full">
                    <p className="text-text-main-light dark:text-text-main-dark text-sm font-medium pb-2">Description</p>
                    <textarea
                      id="issueDescription"
                      className="flex w-full rounded-lg text-text-main-light dark:text-text-main-dark focus:ring-2 focus:ring-blue-600 border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark h-32 placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark p-4 text-sm resize-none"
                      placeholder="Please describe the issue in detail if not mentioned in the list. Include any error codes displayed on the screen."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </label>
                </div>

              </div>
            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 border-t border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark flex justify-end items-center gap-3">
              <button
                type="button"
                onClick={handleClear}
                className="animated-btn px-6 h-11 rounded-lg border border-border-light dark:border-border-dark text-text-muted-light dark:text-text-muted-dark font-bold hover:bg-background-light dark:hover:bg-gray-800 transition-colors text-sm"
              >
                Clear Form
              </button>
              <button
                id="submitRequestBtn"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="animated-btn glow-blue-600 px-6 h-11 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-600/30 transition-all text-sm flex items-center gap-2 disabled:opacity-50"
              >
                <span>{isSubmitting ? "Submitting..." : "Submit Request"}</span>
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </div>

          </section>
        </div>

      </main>
    </div>
  );
}
