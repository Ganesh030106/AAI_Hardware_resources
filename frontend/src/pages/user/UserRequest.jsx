import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logoImg from '../../assets/logo.jpeg';

export default function UserRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [requesterName, setRequesterName] = useState('Loading...');
  const [requesterEmpId, setRequesterEmpId] = useState('Loading...');

  const [hardwareNames, setHardwareNames] = useState([]);
  const [models, setModels] = useState([]);
  
  const [selectedHardware, setSelectedHardware] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [availableQty, setAvailableQty] = useState('');
  const [showContactAdmin, setShowContactAdmin] = useState(false);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);

  useEffect(() => {
    if (!user || !user.emp_id) {
      alert("Please login first");
      navigate('/html/UserLogin.html');
      return;
    }

    // Load Requester details
    const loadUserDetails = async () => {
      try {
        const res = await fetch(`/api/users/${encodeURIComponent(user.emp_id)}`);
        if (res.ok) {
          const data = await res.json();
          setRequesterName(data.name || user.name || 'User');
          setRequesterEmpId(data.emp_id || user.emp_id);
        } else {
          setRequesterName(user.name || 'User');
          setRequesterEmpId(user.emp_id);
        }
      } catch (err) {
        console.error(err);
        setRequesterName(user.name || 'User');
        setRequesterEmpId(user.emp_id);
      }
    };

    // Load Hardware dropdown
    const loadHardwareNames = async () => {
      try {
        const res = await fetch('/api/hardware/names');
        if (res.ok) {
          const data = await res.json();
          setHardwareNames(data);
        }
      } catch (err) {
        console.error('Failed to load hardware names', err);
      }
    };

    loadUserDetails();
    loadHardwareNames();
  }, [user, navigate]);

  // Load models on hardware change
  useEffect(() => {
    const loadModels = async () => {
      if (!selectedHardware) {
        setModels([]);
        setSelectedModel('');
        setAvailableQty('');
        setShowContactAdmin(false);
        setIsSubmitDisabled(true);
        return;
      }

      try {
        const res = await fetch(`/api/hardware/models?name=${encodeURIComponent(selectedHardware)}`);
        if (res.ok) {
          const data = await res.json();
          setModels(data);
        }
      } catch (err) {
        console.error('Failed to load models', err);
      }
    };

    loadModels();
  }, [selectedHardware]);

  // Check availability on hardware or model change
  useEffect(() => {
    const checkAvailability = async () => {
      if (!selectedHardware || !selectedModel) {
        setAvailableQty('');
        setShowContactAdmin(false);
        setIsSubmitDisabled(true);
        return;
      }

      try {
        const res = await fetch(`/api/hardware/count?name=${encodeURIComponent(selectedHardware)}&model=${encodeURIComponent(selectedModel)}`);
        if (res.ok) {
          const data = await res.json();
          const available = data.available ?? 0;
          setAvailableQty(available);
          if (available === 0) {
            setShowContactAdmin(true);
            setIsSubmitDisabled(true);
          } else {
            setShowContactAdmin(false);
            setIsSubmitDisabled(false);
          }
        }
      } catch (err) {
        console.error('Failed to load availability', err);
        setAvailableQty(0);
        setShowContactAdmin(true);
        setIsSubmitDisabled(true);
      }
    };

    checkAvailability();
  }, [selectedHardware, selectedModel]);

  const handleClear = () => {
    setSelectedHardware('');
    setSelectedModel('');
    setAvailableQty('');
    setShowContactAdmin(false);
    setIsSubmitDisabled(true);
  };

  const handleSubmit = async () => {
    if (!user || !user.emp_id) {
      alert('Please login first');
      navigate('/html/UserLogin.html');
      return;
    }
    if (!selectedHardware) {
      alert('Please select hardware name.');
      return;
    }
    if (!selectedModel) {
      alert('Please select hardware model.');
      return;
    }

    const available = parseInt(availableQty, 10);
    if (isNaN(available) || available < 1) {
      alert('Requested quantity exceeds available stock');
      return;
    }

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emp_id: user.emp_id,
          name: selectedHardware,
          model: selectedModel,
          quantity: 1 // hardcoded to 1 as in original submission validations
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Request failed');
        return;
      }
      alert(`Request submitted successfully!\nRequest ID: ${data.request_id}`);
      navigate('/html/user_dash.html');
    } catch (e) {
      console.error(e);
      alert('Server error');
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark font-display antialiased overflow-hidden h-screen flex relative">
      
      {/* Blurred background mimicking the main dashboard shell for layout preservation */}
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

        {/* Modal Overlay Content */}
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4">
          <div className="bg-white dark:bg-[#1a2230] w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h2 className="text-[#0d121b] dark:text-white text-xl font-bold leading-tight tracking-[-0.015em] flex items-center">
                  <span className="material-symbols-outlined text-slate-400 mr-2">add_box</span>
                  Hardware Request
                </h2>
              </div>
              <Link to="/html/user_dash.html" className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </Link>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              <div className="max-w-3xl mx-auto space-y-8">
                
                {/* Requester Details */}
                <div className="bg-blue-600/5 dark:bg-blue-600/10 border border-blue-600/10 dark:border-blue-600/20 rounded-xl p-5">
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
                  <h3 className="text-lg font-semibold text-[#0d121b] dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400">computer</span>
                    Hardware Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex flex-col flex-1">
                      <p className="text-[#0d121b] dark:text-slate-200 text-sm font-medium pb-2">Hardware Name</p>
                      <select
                        id="hardwareName"
                        className="form-input flex w-full rounded-lg text-[#0d121b] dark:text-white focus:outline-0 focus:ring-2 focus:ring-blue-600/20 border border-[#cfd7e7] dark:border-slate-600 bg-[#f8f9fc] dark:bg-slate-800 focus:border-blue-600 h-12 px-4 text-sm"
                        value={selectedHardware}
                        onChange={(e) => setSelectedHardware(e.target.value)}
                      >
                        <option value="">Select Hardware</option>
                        {hardwareNames.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </label>

                    <label className="flex flex-col flex-1">
                      <p className="text-[#0d121b] dark:text-slate-200 text-sm font-medium pb-2">Model Name</p>
                      <select
                        id="modelName"
                        className="form-input flex w-full rounded-lg text-[#0d121b] dark:text-white focus:outline-0 focus:ring-2 focus:ring-blue-600/20 border border-[#cfd7e7] dark:border-slate-600 bg-[#f8f9fc] dark:bg-slate-800 focus:border-blue-600 h-12 px-4 text-sm"
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        disabled={!selectedHardware}
                      >
                        <option value="">Select Model</option>
                        {models.map(model => (
                          <option key={model} value={model}>{model}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                {/* Form: Quantity */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#0d121b] dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400">inventory_2</span>
                    Quantity
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex flex-col flex-1">
                      <p className="text-[#0d121b] dark:text-slate-200 text-sm font-medium pb-2">Quantity Required</p>
                      <input
                        id="qty"
                        className="form-input flex w-full rounded-lg text-[#0d121b] dark:text-white focus:outline-0 focus:ring-2 focus:ring-blue-600/20 border border-[#cfd7e7] dark:border-slate-600 bg-[#f8f9fc] dark:bg-slate-800 focus:border-blue-600 h-12 px-4 text-sm font-normal"
                        value="1"
                        readOnly
                      />
                    </label>

                    <label className="flex flex-col flex-1">
                      <p className="text-[#0d121b] dark:text-slate-200 text-sm font-medium pb-2">Available Quantity</p>
                      <input
                        id="availableQty"
                        className="form-input flex w-full rounded-lg text-[#0d121b] dark:text-white focus:outline-0 focus:ring-2 focus:ring-blue-600/20 border border-[#cfd7e7] dark:border-slate-600 bg-[#f8f9fc] dark:bg-slate-800 focus:border-blue-600 h-12 px-4 text-sm font-normal"
                        value={availableQty}
                        readOnly
                      />
                      {showContactAdmin && (
                        <div id="contactAdminMsg" className="mt-2 text-xs text-red-600 dark:text-red-400 font-semibold">
                          No request can be submitted. Please contact the IT Department/Admin.
                        </div>
                      )}
                    </label>
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-[#1a2230] flex justify-end items-center gap-3">
              <button
                id="btnClear"
                onClick={handleClear}
                className="px-6 h-12 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm"
              >
                Clear Form
              </button>
              <button
                id="btnSubmit"
                onClick={handleSubmit}
                disabled={isSubmitDisabled}
                className="px-6 h-12 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg shadow-blue-600/30 transition-all text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Submit Request</span>
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}
