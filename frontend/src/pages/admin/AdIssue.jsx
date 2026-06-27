import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Layout from '../../components/Layout';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export default function AdIssue() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [issues, setIssues] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 5;

  // AI Analysis states
  const [aiAnalysis, setAiAnalysis] = useState({}); // { [issueId]: data }
  const [aiLoading, setAiLoading] = useState({});   // { [issueId]: boolean }
  const [aiOpen, setAiOpen] = useState({});         // { [issueId]: boolean }

  // Present Technicians state
  const [presentTechnicians, setPresentTechnicians] = useState([]);

  // Live Ops & Comments states
  const [liveOps, setLiveOps] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  const loadLiveOps = async () => {
    try {
      const res = await fetch('/api/issues/admin/live-ops');
      if (res.ok) {
        const data = await res.json();
        setLiveOps(data || []);
      }
    } catch (err) {
      console.error('Error loading live ops monitor:', err);
    }
  };

  const fetchComments = async (issueId) => {
    try {
      const response = await fetch(`/api/issues/${issueId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data || []);
      }
    } catch (err) {
      console.error('Error loading comments:', err);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedIssue) return;
    setIsPostingComment(true);
    try {
      const response = await fetch(`/api/issues/${selectedIssue._id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author_id: user?.emp_id || 'admin',
          author_name: user?.name || user?.username || 'Admin',
          author_role: 'Admin',
          comment: newCommentText.trim()
        })
      });
      if (response.ok) {
        setNewCommentText('');
        fetchComments(selectedIssue._id);
      }
    } catch (err) {
      console.error('Error posting comment:', err);
    } finally {
      setIsPostingComment(false);
    }
  };

  useEffect(() => {
    if (selectedIssue) {
      fetchComments(selectedIssue._id);
    } else {
      setComments([]);
    }
  }, [selectedIssue]);

  const categoryChartRef = useRef(null);
  const priorityChartRef = useRef(null);
  const categoryChartInstance = useRef(null);
  const priorityChartInstance = useRef(null);

  useEffect(() => {
    if (!user || (user.role || '').toLowerCase() !== 'admin') {
      navigate('/html/AdminLogin.html');
      return;
    }
  }, [user, navigate]);

  const loadIssues = async (page = 1) => {
    try {
      const url = `/api/issues?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&dept=${encodeURIComponent(selectedDept)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch issues');
      const data = await res.json();
      setIssues(data.issues || []);
      setTotalItems(data.total || 0);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error loading issues:', err);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const res = await fetch('/api/issues/filter-options');
      if (!res.ok) throw new Error('Failed to fetch filter options');
      const data = await res.json();
      setDepartments(data.departments || []);
    } catch (err) {
      console.error('Error loading filter options:', err);
    }
  };

  const loadIssueStats = async () => {
    try {
      const res = await fetch('/api/issues/stats');
      const data = await res.json();
      if (res.ok) {
        initCharts(data.categoryStats || [], data.priorityStats || []);
      }
    } catch (err) {
      console.error('Error loading issue stats:', err);
    }
  };

  const initCharts = (catData, prioData) => {
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? '#334155' : '#e2e8f0';

    // 1. Category Doughnut Chart
    if (categoryChartRef.current) {
      const catLabels = catData.map(c => c._id || 'Other');
      const catCounts = catData.map(c => c.count);
      const catColors = ['#135bec', '#7c3aed', '#f59e0b', '#10b981', '#ef4444'];

      if (categoryChartInstance.current) {
        categoryChartInstance.current.destroy();
      }

      categoryChartInstance.current = new Chart(categoryChartRef.current, {
        type: 'doughnut',
        data: {
          labels: catLabels,
          datasets: [{
            data: catCounts,
            backgroundColor: catColors
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: {
              position: 'right',
              labels: {
                color: textColor,
                usePointStyle: true,
                boxWidth: 8,
                padding: 15,
                font: { size: 11 }
              }
            }
          }
        }
      });
    }

    // 2. Priority Bar Chart
    if (priorityChartRef.current) {
      const prioOrder = ['high', 'medium', 'low', 'pending'];
      const prioColors = {
        high: '#ef4444',
        medium: '#f59e0b',
        low: '#22c55e',
        pending: '#94a3b8'
      };

      const pMap = { high: 0, medium: 0, low: 0, pending: 0 };
      prioData.forEach(item => {
        const key = (item._id || 'pending').toLowerCase();
        if (pMap.hasOwnProperty(key)) pMap[key] = item.count;
      });

      const pLabels = prioOrder.map(k => k.charAt(0).toUpperCase() + k.slice(1));
      const pData = prioOrder.map(k => pMap[k]);
      const pColorArray = prioOrder.map(k => prioColors[k]);

      if (priorityChartInstance.current) {
        priorityChartInstance.current.destroy();
      }

      priorityChartInstance.current = new Chart(priorityChartRef.current, {
        type: 'bar',
        data: {
          labels: pLabels,
          datasets: [{
            label: 'Issues',
            data: pData,
            backgroundColor: pColorArray,
            borderRadius: 4,
            barThickness: 40,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: gridColor, borderDash: [4, 4] },
              ticks: { color: textColor, stepSize: 1 }
            },
            x: {
              grid: { display: false },
              ticks: { color: textColor }
            }
          }
        }
      });
    }
  };

  const updatePriority = async (id, val) => {
    try {
      const res = await fetch(`/api/issues/${id}/priority`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: val })
      });
      if (res.ok) {
        loadIssues(currentPage);
        loadIssueStats();
      } else {
        alert('Failed to update priority');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadPresentTechnicians = async () => {
    try {
      const res = await fetch('/api/issues/technicians');
      if (res.ok) {
        const data = await res.json();
        setPresentTechnicians(data || []);
      }
    } catch (err) {
      console.error('Error loading present technicians:', err);
    }
  };

  const updateTechnicianStatus = async (id, techId) => {
    if (!techId) return;
    try {
      const res = await fetch(`/api/issues/${id}/technician-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          technician_status: 'assigned',
          assigned_to: techId 
        })
      });
      if (res.ok) {
        loadIssues(currentPage);
        loadLiveOps();
      } else {
        alert('Failed to update technician status');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const analyzeWithAI = async (issueId) => {
    if (aiLoading[issueId]) return;

    if (aiOpen[issueId]) {
      setAiOpen(prev => ({ ...prev, [issueId]: false }));
      return;
    }

    setAiLoading(prev => ({ ...prev, [issueId]: true }));
    try {
      const res = await fetch(`/api/aianalysis/${issueId}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'AI analysis failed');

      setAiAnalysis(prev => ({ ...prev, [issueId]: data.aianalysis }));
      setAiOpen(prev => ({ ...prev, [issueId]: true }));
      
      // Update local issues list state
      setIssues(prev => prev.map(item => item._id === issueId ? { ...item, aianalysis: data.aianalysis } : item));
    } catch (err) {
      alert(err.message);
      console.error(err);
    } finally {
      setAiLoading(prev => ({ ...prev, [issueId]: false }));
    }
  };

  // Run on mount
  useEffect(() => {
    loadFilterOptions();
    loadIssueStats();
    loadPresentTechnicians();
    loadLiveOps();

    const interval = setInterval(() => {
      loadLiveOps();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // Fetch issues when filter options change
  useEffect(() => {
    loadIssues(currentPage);
  }, [search, selectedDept, currentPage]);

  // Handle theme updates for charts
  useEffect(() => {
    if (categoryChartInstance.current && priorityChartInstance.current) {
      const isDark = theme === 'dark';
      const textColor = isDark ? '#94a3b8' : '#64748b';
      const gridColor = isDark ? '#334155' : '#e2e8f0';

      categoryChartInstance.current.options.plugins.legend.labels.color = textColor;
      categoryChartInstance.current.update();

      priorityChartInstance.current.options.scales.x.ticks.color = textColor;
      priorityChartInstance.current.options.scales.y.ticks.color = textColor;
      priorityChartInstance.current.options.scales.y.grid.color = gridColor;
      priorityChartInstance.current.update();
    }
  }, [theme]);

  const changePage = (dir) => {
    const nextPage = currentPage + dir;
    if (nextPage >= 1 && nextPage <= Math.ceil(totalItems / limit)) {
      setCurrentPage(nextPage);
    }
  };

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-[#0d121b] dark:text-white text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-[30px] align-middle">build</span>
              Maintenance Management
            </h2>
            <p className="text-[#4c669a] text-base font-medium dark:text-text-muted-dark">Manage reported hardware Maintenance Requests</p>
          </div>
          <div>
            <Link 
              to="/html/Ad-ticket.html"
              className="animated-btn inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm shadow-blue-600/30 transition-all"
            >
              Hardware Request
            </Link>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#151c2b] rounded-xl p-5 border border-[#cfd7e7] dark:border-gray-800 shadow-sm flex flex-col h-80">
            <h3 className="text-sm font-bold text-[#0d121b] dark:text-white mb-4 uppercase">Maintenances by Category</h3>
            <div className="flex-1 relative w-full flex justify-center h-60">
              <canvas ref={categoryChartRef}></canvas>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-[#151c2b] rounded-xl p-5 border border-[#cfd7e7] dark:border-gray-800 shadow-sm flex flex-col h-80">
            <h3 className="text-sm font-bold text-[#0d121b] dark:text-white mb-4 uppercase">Maintenances by Priority</h3>
            <div className="flex-1 relative w-full h-60">
              <canvas ref={priorityChartRef}></canvas>
            </div>
          </div>
        </div>

        {/* Live Operations Monitor Section */}
        <section className="bg-white dark:bg-[#151c2b] p-5 rounded-xl border border-[#cfd7e7] dark:border-gray-800 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
            <h3 className="text-sm font-bold text-[#0d121b] dark:text-white uppercase flex items-center gap-1.5">
              <span className="material-symbols-outlined text-green-500">sensors</span>
              Live Operations Monitor
            </h3>
            <span className="text-xs text-[#4c669a] dark:text-gray-400">Real-time Technician Workloads</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {liveOps.length === 0 ? (
              <div className="col-span-full py-4 text-center text-xs text-text-muted-light dark:text-gray-400">
                No technicians registered in the system.
              </div>
            ) : (
              liveOps.map((op, idx) => (
                <div key={idx} className="bg-background-light dark:bg-gray-900/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800/80 flex flex-col gap-2 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#0d121b] dark:text-white truncate max-w-[120px]">{op.name}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      op.isPresent 
                        ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' 
                        : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${op.isPresent ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      {op.isPresent ? 'Present' : 'Absent'}
                    </span>
                  </div>
                  <div className="text-xs text-[#4c669a] dark:text-gray-400 flex flex-col gap-0.5">
                    <p>Emp ID: <span className="font-mono font-bold">{op.emp_id}</span></p>
                    <p>Shift: {op.isPresent ? `Checked-in at ${op.check_in_at || 'N/A'}` : 'Offline'}</p>
                  </div>
                  <div className="border-t border-gray-100 dark:border-gray-800/80 pt-2 mt-1 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-text-muted-light dark:text-gray-500 uppercase tracking-wider font-bold">Active Load</span>
                      <p className="font-bold text-sm text-blue-600 dark:text-blue-400">{op.activeCount} tickets</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-text-muted-light dark:text-gray-500 uppercase tracking-wider font-bold">Resolved Today</span>
                      <p className="font-bold text-sm text-green-600">{op.resolvedCount} resolved</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Search & Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-[#151c2b] p-5 rounded-xl border border-[#cfd7e7] dark:border-gray-800 shadow-sm">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#4c669a] dark:text-white uppercase font-display">Search</label>
            <div className="relative group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4c669a] material-symbols-outlined text-[20px]">search</span>
              <input 
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-background-light dark:bg-gray-900 border border-[#cfd7e7] dark:border-gray-700 rounded-lg text-sm text-[#0d121b] dark:text-white focus:ring-2 focus:ring-blue-600 outline-none"
                placeholder="Search by Employee Name or Asset Name" 
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#4c669a] dark:text-white uppercase font-display">Department</label>
            <select 
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-3 pr-8 py-2.5 bg-background-light dark:bg-gray-900 border border-[#cfd7e7] dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none cursor-pointer text-[#0d121b] dark:text-white"
            >
              <option value="">All Departments</option>
              {departments.map((dept, idx) => (
                <option key={idx} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table List */}
        <div className="bg-white dark:bg-[#151c2b] rounded-xl border border-[#cfd7e7] dark:border-gray-800 shadow-sm overflow-hidden flex flex-col flex-1 min-h-[500px]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900 border-b border-[#cfd7e7] dark:border-gray-700">
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#4c669a] dark:text-white uppercase w-[120px]">Employee</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#4c669a] dark:text-white uppercase w-[100px]">Dept</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#4c669a] dark:text-white uppercase w-[150px]">Asset</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#4c669a] dark:text-white uppercase w-[120px]">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#4c669a] dark:text-white uppercase w-[150px]">Maintenance</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#4c669a] dark:text-white uppercase w-[200px]">Description</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#4c669a] dark:text-white uppercase w-[120px]">Priority</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#4c669a] dark:text-white uppercase w-[140px]">Technician Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#4c669a] dark:text-white uppercase w-[260px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#cfd7e7] dark:divide-gray-800">
                {issues.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-8 text-center text-gray-500">No issues found.</td>
                  </tr>
                ) : (
                  issues.map((issue, idx) => {
                    const priority = (issue.priority || '').toLowerCase();
                    let priorityClass = 'bg-gray-100 text-gray-700 border-gray-200';
                    if (priority === 'pending') priorityClass = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400';
                    else if (priority === 'low') priorityClass = 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400';
                    else if (priority === 'medium') priorityClass = 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400';
                    else if (priority === 'high') priorityClass = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400';

                    const techStatus = (issue.technician_status || 'unassigned').toLowerCase();
                    let techStatusClass = 'bg-blue-100 text-blue-700 border-blue-200';
                    if (techStatus === 'unassigned') techStatusClass = 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400';
                    else if (techStatus === 'assigned') techStatusClass = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400';

                    const isOtherHardware = (issue.category || '').toLowerCase() === 'others' || (issue.issue || '').toLowerCase() === 'other hardware issues';
                    const isPriorityAssigned = priority !== 'pending';
                    const canAssignTechnician = isOtherHardware ? isPriorityAssigned : true;

                    return (
                      <React.Fragment key={issue._id || idx}>
                        <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-semibold text-[#0d121b] dark:text-white">{issue.emp_name}</td>
                        <td className="px-6 py-4 text-sm text-[#4c669a] dark:text-gray-300">{issue.emp_dept}</td>
                        <td className="px-6 py-4 text-sm text-[#0d121b] dark:text-white font-medium">{issue.asset_name}</td>
                        <td className="px-6 py-4 text-sm text-[#4c669a] dark:text-gray-300">{issue.category}</td>
                        <td className="px-6 py-4 text-sm text-[#4c669a] dark:text-gray-300">{issue.issue}</td>
                        <td className="px-6 py-4 text-sm text-[#4c669a] dark:text-gray-300">{issue.description || ''}</td>
                        
                        {/* Priority Column */}
                        <td className="px-6 py-4 text-sm">
                          {isOtherHardware && !isPriorityAssigned ? (
                            <select 
                              onChange={(e) => updatePriority(issue._id, e.target.value)}
                              value={issue.priority || 'Pending'}
                              className="text-xs font-bold rounded px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white cursor-pointer focus:ring-2 focus:ring-blue-600 outline-none"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Low">Low</option>
                              <option value="Medium">Medium</option>
                              <option value="High">High</option>
                            </select>
                          ) : (
                            <span className={`px-3 py-1 rounded-full border text-xs font-semibold ${priorityClass}`}>{issue.priority}</span>
                          )}
                        </td>

                        {/* Technician Status Column */}
                        <td className="px-6 py-4 text-sm">
                          {techStatus !== 'unassigned' || !canAssignTechnician ? (
                            <div className="flex flex-col gap-1 items-start">
                              <span className={`px-3 py-1 rounded-full border text-xs font-semibold ${
                                techStatus === 'resolved' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400' :
                                techStatus === 'in progress' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400'
                              }`}>
                                {issue.technician_status ? issue.technician_status : 'Assigned'}
                              </span>
                              {issue.assigned_to && (
                                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                                  ID: {issue.assigned_to}
                                </span>
                              )}
                            </div>
                          ) : (
                            <select 
                              onChange={(e) => {
                                if (e.target.value !== '') {
                                  updateTechnicianStatus(issue._id, e.target.value);
                                }
                              }}
                              defaultValue=""
                              disabled={presentTechnicians.length === 0}
                              className="text-xs font-bold rounded px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white cursor-pointer focus:ring-2 focus:ring-blue-600 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="" disabled>
                                {presentTechnicians.length === 0 ? 'No tech present' : 'Assign tech...'}
                              </option>
                              {presentTechnicians.map(tech => (
                                <option key={tech.emp_id} value={tech.emp_id}>
                                  {tech.name} ({tech.emp_id})
                                </option>
                              ))}
                            </select>
                          )}
                        </td>

                        {/* Actions Column */}
                        <td className="px-6 py-4 text-sm w-[260px] align-top">
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => setSelectedIssue(issue)}
                              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              <span className="material-symbols-outlined text-sm">forum</span>
                              View Details &amp; Activity
                            </button>

                            {techStatus === 'unassigned' && (
                              <button 
                                onClick={() => analyzeWithAI(issue._id)}
                                disabled={aiLoading[issue._id]}
                                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors disabled:opacity-50 shadow-sm"
                              >
                                {aiLoading[issue._id] ? 'Analyzing...' : 'Analyze with AI'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {aiOpen[issue._id] && (
                        <tr className="bg-blue-50/10 dark:bg-blue-950/5 animate-fadeIn">
                          <td colSpan="9" className="px-6 py-4">
                            <div className="bg-blue-50/40 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/40 p-4 rounded-xl space-y-2 max-w-4xl mx-auto shadow-sm">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-[18px]">psychology</span>
                                  AI Diagnostic Protocol Results
                                </h4>
                                <button 
                                  onClick={() => setAiOpen(prev => ({ ...prev, [issue._id]: false }))}
                                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 font-semibold"
                                >
                                  Hide
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-xs mt-2">
                                <div>
                                  <span className="text-[#4c669a] dark:text-gray-400 font-medium">Recommended Priority:</span>
                                  <p className={`font-bold ${
                                    aiAnalysis[issue._id]?.priority === 'High' ? 'text-red-500' :
                                    aiAnalysis[issue._id]?.priority === 'Medium' ? 'text-orange-500' :
                                    'text-green-600'
                                  }`}>{aiAnalysis[issue._id]?.priority || "Low"}</p>
                                </div>
                                <div>
                                  <span className="text-[#4c669a] dark:text-gray-400 font-medium">Auto Recommendation:</span>
                                  <p className="text-gray-900 dark:text-white font-semibold">{aiAnalysis[issue._id]?.recommendation || "Standard repair"}</p>
                                </div>
                              </div>
                              <div className="text-xs mt-2 pt-2 border-t border-blue-100/50 dark:border-blue-900/30">
                                <span className="text-[#4c669a] dark:text-gray-400 font-medium">Diagnostic Reason:</span>
                                <p className="text-gray-700 dark:text-gray-300 mt-1 italic">"{aiAnalysis[issue._id]?.reason || "N/A"}"</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#cfd7e7] dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 mt-auto">
            <p className="text-sm text-[#4c669a]">
              Total: <span className="font-bold text-[#0d121b] dark:text-white">{totalItems}</span>
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => changePage(-1)}
                disabled={currentPage <= 1}
                className="px-4 py-2 text-sm font-bold bg-white border border-[#cfd7e7] rounded-lg disabled:opacity-50 dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-white"
              >
                Prev
              </button>
              <button 
                onClick={() => changePage(1)}
                disabled={currentPage >= Math.ceil(totalItems / limit)}
                className="px-4 py-2 text-sm font-bold bg-white border border-[#cfd7e7] rounded-lg disabled:opacity-50 dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-white"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* DETAILS & COMMENTS MODAL */}
        {selectedIssue && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
            <div className="bg-white dark:bg-[#1a202c] rounded-2xl shadow-xl w-full max-w-2xl border border-gray-200 dark:border-[#2a3441] overflow-hidden flex flex-col max-h-[90vh] mx-4 relative animate-scaleIn">
              
              <div className="px-6 py-5 border-b border-gray-200 dark:border-[#2a3441] flex items-center justify-between bg-gray-50 dark:bg-[#1f2937]/50">
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">info</span>
                    Ticket Details &amp; Activity Log
                  </h3>
                  <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-1">ID: #{selectedIssue._id}</p>
                </div>
                <button 
                  onClick={() => setSelectedIssue(null)}
                  className="size-8 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 flex items-center justify-center text-xl font-bold transition-all outline-none"
                >
                  &times;
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-gray-800 dark:text-gray-300">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-slate-800/80 p-4 rounded-xl border border-gray-100 dark:border-slate-700/50">
                    <span className="text-xs text-[#4c669a] dark:text-gray-400 uppercase tracking-wider font-bold">Technician Status</span>
                    <div className="mt-1">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        selectedIssue.technician_status === 'resolved' || selectedIssue.technician_status === 'Resolved' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                        selectedIssue.technician_status === 'In Progress' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' :
                        selectedIssue.technician_status === 'assigned' || selectedIssue.technician_status === 'Assigned' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {selectedIssue.technician_status || 'Unassigned'}
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-800/80 p-4 rounded-xl border border-gray-100 dark:border-slate-700/50">
                    <span className="text-xs text-[#4c669a] dark:text-gray-400 uppercase tracking-wider font-bold">Reported Priority</span>
                    <div className="mt-1 font-bold text-gray-900 dark:text-white">
                      {selectedIssue.priority || 'Pending'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reported By</h4>
                    <p className="mt-1 text-base font-bold text-gray-900 dark:text-white">{selectedIssue.emp_name}</p>
                    <p className="text-xs text-[#4c669a] dark:text-gray-400">ID: {selectedIssue.emp_id} | Dept: {selectedIssue.emp_dept}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Asset Detail</h4>
                    <p className="mt-1 text-base font-bold text-gray-900 dark:text-white">{selectedIssue.asset_name}</p>
                    <p className="text-xs text-[#4c669a] dark:text-gray-400">ID: {selectedIssue.asset_id}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category &amp; Problem</h4>
                  <p className="text-base font-bold text-gray-900 dark:text-white">{selectedIssue.category} - {selectedIssue.issue}</p>
                  <div className="mt-2 bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700/50 whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">
                    {selectedIssue.description || "No description provided."}
                  </div>
                </div>

                {/* AI Analysis Block */}
                {selectedIssue.aianalysis && (
                  <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/30 p-5 rounded-xl space-y-3">
                    <h4 className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px]">psychology</span>
                      AI DIAGNOSTIC PROTOCOL
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[#4c669a] dark:text-gray-400 font-medium">Recommended Priority:</span>
                        <p className={`font-bold ${
                          selectedIssue.aianalysis.priority === 'High' ? 'text-red-500' :
                          selectedIssue.aianalysis.priority === 'Medium' ? 'text-orange-500' :
                          'text-green-600'
                        }`}>{selectedIssue.aianalysis.priority || "Low"}</p>
                      </div>
                      <div>
                        <span className="text-[#4c669a] dark:text-gray-400 font-medium">Auto Recommendation:</span>
                        <p className="text-gray-900 dark:text-white font-semibold">{selectedIssue.aianalysis.recommendation || "Standard repair"}</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-[#4c669a] dark:text-gray-400 font-medium">Diagnostic Reason:</span>
                      <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 italic">"{selectedIssue.aianalysis.reason || "N/A"}"</p>
                    </div>
                  </div>
                )}

                {/* Comments activity stream */}
                <div className="border-t border-gray-200 dark:border-[#2a3441] pt-6 space-y-4">
                  <h4 className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">forum</span>
                    Activity Stream &amp; Comments
                  </h4>

                  <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-slate-700/50 space-y-3 max-h-56 overflow-y-auto">
                    {comments.length === 0 ? (
                      <p className="text-xs text-text-muted-light dark:text-gray-400 italic text-center py-4">
                        No activity comments on this request yet.
                      </p>
                    ) : (
                      comments.map((c, idx) => (
                        <div key={c._id || idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-gray-900 dark:text-white">
                              {c.author_name}{' '}
                              <span className={`inline-block ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                c.author_role === 'Technician' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                c.author_role === 'Admin' || c.author_role === 'Superadmin' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              }`}>
                                {c.author_role}
                              </span>
                            </span>
                            <span className="text-[10px] text-text-muted-light dark:text-gray-400">
                              {new Date(c.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-gray-700 dark:text-gray-300 leading-normal pl-2 border-l border-gray-200 dark:border-slate-700">
                            {c.comment}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handlePostComment} className="flex gap-2">
                    <input
                      type="text"
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      placeholder="Write response or comment..."
                      className="flex-1 p-2.5 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-xs rounded-lg text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={isPostingComment || !newCommentText.trim()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs flex items-center gap-1 transition-all"
                    >
                      {isPostingComment ? 'Posting...' : 'Post'}
                    </button>
                  </form>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 dark:border-[#2a3441] bg-gray-50 dark:bg-[#1f2937]/50 flex justify-end">
                <button
                  onClick={() => setSelectedIssue(null)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )}

        <div className="mt-8 text-center text-xs text-text-muted-light dark:text-text-muted-dark pb-4">
          © 2026 AAI Hardware Maintenance System. All rights reserved.
        </div>
      </div>
    </Layout>
  );
}
