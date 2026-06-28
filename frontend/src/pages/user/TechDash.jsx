import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Layout from '../../components/Layout';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export default function TechDash() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  // State lists
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [checkedIn, setCheckedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedIssue, setSelectedIssue] = useState(null); // Drawer/Modal state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Stats & Performance Analytics states
  const [stats, setStats] = useState({ totalAssigned: 0, inProgress: 0, resolved: 0, checkIns: 0 });
  const [shiftHistory, setShiftHistory] = useState([]);
  
  // Comments stream states
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [checkedSteps, setCheckedSteps] = useState({});
  const commentsEndRef = useRef(null);

  useEffect(() => {
    if (!user || user.role !== 'Technician') {
      navigate('/html/TechnicianLogin.html');
      return;
    }

    fetchAttendanceStatus();
    fetchAssignedIssues();
    fetchStats();
    fetchShiftHistory();

    // Refresh issues and stats list periodically (every 10s)
    const interval = setInterval(() => {
      fetchAssignedIssues();
      fetchStats();
    }, 10000);

    return () => clearInterval(interval);
  }, [user, navigate]);

  // Filter issues based on status selector
  useEffect(() => {
    const filtered = issues.filter(issue => {
      if (statusFilter === 'All') return true;
      return issue.technician_status === statusFilter;
    });
    setFilteredIssues(filtered);
    setCurrentPage(1);
  }, [issues, statusFilter]);

  // Load comments when drawer ticket changes & set up 5s polling
  useEffect(() => {
    let interval;
    if (selectedIssue) {
      fetchComments(selectedIssue._id);
      
      interval = setInterval(() => {
        fetchComments(selectedIssue._id);
      }, 5000); // 5 seconds polling

      const stored = localStorage.getItem(`checklist_${selectedIssue._id}`);
      if (stored) {
        setCheckedSteps(JSON.parse(stored));
      } else {
        setCheckedSteps({});
      }
    } else {
      setComments([]);
      setCheckedSteps({});
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedIssue]);

  // Update chart elements when theme changes
  useEffect(() => {
    if (chartInstance.current) {
      const isDark = theme === 'dark';
      const textColor = isDark ? '#94a3b8' : '#64748b';
      const gridColor = isDark ? '#334155' : '#e2e8f0';

      chartInstance.current.options.scales.x.ticks.color = textColor;
      chartInstance.current.options.scales.y.ticks.color = textColor;
      chartInstance.current.options.scales.y.grid.color = gridColor;
      chartInstance.current.update();
    }
  }, [theme]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchAttendanceStatus(),
        fetchAssignedIssues(),
        fetchStats(),
        fetchShiftHistory()
      ]);
    } catch (err) {
      console.error("Error refreshing data:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchAttendanceStatus = async () => {
    try {
      const response = await fetch(`/api/issues/technician/attendance/status?tech_id=${user.emp_id}`);
      if (response.ok) {
        const data = await response.json();
        setCheckedIn(data.checkedIn);
      }
    } catch (error) {
      console.error('Error fetching attendance status:', error);
    }
  };

  const fetchAssignedIssues = async () => {
    try {
      const response = await fetch(`/api/issues/technician/issues?tech_id=${user.emp_id}`);
      if (response.ok) {
        const data = await response.json();
        setIssues(data);
      }
    } catch (error) {
      console.error('Error fetching assigned issues:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/issues/technician/stats?tech_id=${user.emp_id}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || { totalAssigned: 0, inProgress: 0, resolved: 0, checkIns: 0 });
        initChart(data.categoryChartData || []);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchShiftHistory = async () => {
    try {
      const response = await fetch(`/api/issues/technician/attendance/history?tech_id=${user.emp_id}`);
      if (response.ok) {
        const data = await response.json();
        setShiftHistory(data || []);
      }
    } catch (error) {
      console.error('Error fetching shift history:', error);
    }
  };

  const fetchComments = async (issueId) => {
    try {
      const response = await fetch(`/api/issues/${issueId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
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
          author_id: user.emp_id,
          author_name: user.name || user.username,
          author_role: 'Technician',
          comment: newCommentText.trim()
        })
      });
      if (response.ok) {
        setNewCommentText('');
        fetchComments(selectedIssue._id);
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setIsPostingComment(false);
    }
  };

  const initChart = (chartData) => {
    if (!chartRef.current) return;
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? '#334155' : '#e2e8f0';

    const labels = chartData.map(d => d._id || 'Other');
    const counts = chartData.map(d => d.count);
    const colors = ['#135bec', '#7c3aed', '#f59e0b', '#10b981', '#ef4444'];

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    chartInstance.current = new Chart(chartRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Resolved Tickets',
          data: counts,
          backgroundColor: colors,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            ticks: { color: textColor },
            grid: { display: false }
          },
          y: {
            ticks: { color: textColor, precision: 0 },
            grid: { color: gridColor }
          }
        }
      }
    });
  };

  const handleAttendanceToggle = async () => {
    const nextStatus = !checkedIn ? 'Present' : 'Absent';
    try {
      const response = await fetch('/api/issues/technician/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tech_id: user.emp_id, status: nextStatus })
      });

      if (response.ok) {
        setCheckedIn(!checkedIn);
        fetchShiftHistory();
        fetchStats();
        if (window.showToast) {
          window.showToast(`Checked in status updated to ${nextStatus}`, "success");
        } else {
          alert(`Checked in status updated to ${nextStatus}`);
        }
      }
    } catch (error) {
      console.error('Error toggling attendance:', error);
      alert('Error updating attendance status');
    }
  };

  const handleStatusChange = async (issueId, newStatus) => {
    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/issues/technician/issues/${issueId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technician_status: newStatus })
      });

      if (response.ok) {
        // Update local issue state
        setIssues(prev => prev.map(issue => issue._id === issueId ? { ...issue, technician_status: newStatus } : issue));
        if (selectedIssue && selectedIssue._id === issueId) {
          setSelectedIssue(prev => ({ ...prev, technician_status: newStatus }));
        }
        fetchStats();

        if (window.showToast) {
          window.showToast(`Ticket status updated to ${newStatus}`, "success");
        } else {
          alert(`Ticket status updated to ${newStatus}`);
        }
      } else {
        alert('Failed to update ticket status');
      }
    } catch (error) {
      console.error('Error changing issue status:', error);
      alert('Server error changing status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Pagination logic
  const total = filteredIssues.length;
  const totalPages = Math.ceil(total / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIdx = (safeCurrentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const pageData = filteredIssues.slice(startIdx, endIdx);

  const changePage = (dir) => {
    setCurrentPage(prev => Math.min(Math.max(prev + dir, 1), totalPages));
  };

  const getChecklistSteps = (issue) => {
    if (!issue) return [];
    const category = (issue.category || '').toLowerCase();
    const recommendation = (issue.aianalysis?.recommendation || '').toLowerCase();
    
    if (category.includes('network') || category.includes('wifi') || recommendation.includes('network')) {
      return [
        "Verify physical connections and cable integrity",
        "Check router/switch configuration and status lights",
        "Run ping diagnostics and check local DNS resolution",
        "Perform bandwidth test and verify throughput speed"
      ];
    } else if (category.includes('software') || category.includes('operating system') || recommendation.includes('patch') || recommendation.includes('slow')) {
      return [
        "Inspect active process logs and CPU/RAM utilization",
        "Clear cache, temp logs, and scan for malware",
        "Check for conflicting software or pending updates",
        "Apply patch, reboot system, and verify application functionality"
      ];
    } else if (category.includes('hardware') || category.includes('computer') || category.includes('laptop') || recommendation.includes('inspection')) {
      return [
        "Perform physical visual inspection of the device",
        "Test individual hardware modules (RAM, Storage, PSU)",
        "Replace or clean faulty hardware components",
        "Run post-boot diagnostic test to verify stable operation"
      ];
    } else {
      return [
        "Review reporter description and isolate the problem",
        "Perform diagnostic verification of the affected asset",
        "Apply corrective configuration or repair patch",
        "Conduct user validation test and confirm resolution"
      ];
    }
  };

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (selectedIssue) {
      scrollToBottom();
    }
  }, [comments]);

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'High':
        return 'text-red-500 font-bold';
      case 'Medium':
        return 'text-orange-500 font-bold';
      case 'Low':
        return 'text-green-600 font-bold';
      default:
        return 'text-[#9ca3af] font-medium';
    }
  };

  const getStatusBadge = (status) => {
    let classes = "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    let dot = "bg-gray-500";

    if (status === 'assigned') {
      classes = "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
      dot = "bg-blue-600";
    } else if (status === 'In Progress') {
      classes = "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300";
      dot = "bg-yellow-600";
    } else if (status === 'Resolved') {
      classes = "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
      dot = "bg-green-600";
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${classes} border border-transparent`}>
        <span className={`size-1.5 rounded-full ${dot}`}></span>
        {status}
      </span>
    );
  };

  return (
    <Layout>
      <main className="max-w-[1440px] mx-auto space-y-8 animate-fadeIn">
        
        {/* Portal Greeting Banner */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[#0d121b] dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[36px]">engineering</span>
              Technician Portal
            </h1>
            <p className="text-[#4c669a] dark:text-gray-400 mt-1">
              Welcome back, <strong className="text-blue-600 dark:text-blue-400">{user?.name || user?.username}</strong>. Manage your maintenance and service requests.
            </p>
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="animated-btn p-2.5 rounded-xl bg-white dark:bg-[#1a202c] border border-[#e7ebf3] dark:border-[#2a3441] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm flex items-center justify-center cursor-pointer"
            title="Refresh Dashboard"
          >
            <span className={`material-symbols-outlined text-[20px] ${isRefreshing ? 'animate-spin' : ''}`}>
              sync
            </span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-[#1a202c] p-5 rounded-xl border border-[#e7ebf3] dark:border-[#2a3441] shadow-sm flex items-center gap-4">
            <div className="size-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined">assignment</span>
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-text-muted-light dark:text-gray-400 font-bold uppercase tracking-wider">Assigned Tickets</p>
              <h3 className="text-2xl font-black mt-1 text-[#0d121b] dark:text-white leading-none">{stats.totalAssigned}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1a202c] p-5 rounded-xl border border-[#e7ebf3] dark:border-[#2a3441] shadow-sm flex items-center gap-4">
            <div className="size-10 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined">sync</span>
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-text-muted-light dark:text-gray-400 font-bold uppercase tracking-wider">In Progress</p>
              <h3 className="text-2xl font-black mt-1 text-[#0d121b] dark:text-white leading-none">{stats.inProgress}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1a202c] p-5 rounded-xl border border-[#e7ebf3] dark:border-[#2a3441] shadow-sm flex items-center gap-4">
            <div className="size-10 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-text-muted-light dark:text-gray-400 font-bold uppercase tracking-wider">Resolved Tickets</p>
              <h3 className="text-2xl font-black mt-1 text-[#0d121b] dark:text-white leading-none">{stats.resolved}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1a202c] p-5 rounded-xl border border-[#e7ebf3] dark:border-[#2a3441] shadow-sm flex items-center gap-4">
            <div className="size-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined">calendar_today</span>
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-text-muted-light dark:text-gray-400 font-bold uppercase tracking-wider">Check-in Days</p>
              <h3 className="text-2xl font-black mt-1 text-[#0d121b] dark:text-white leading-none">{stats.checkIns}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1a202c] p-5 rounded-xl border border-[#e7ebf3] dark:border-[#2a3441] shadow-sm flex items-center gap-4 col-span-2 md:col-span-1">
            <div className="size-10 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-600 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined">star</span>
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-text-muted-light dark:text-gray-400 font-bold uppercase tracking-wider">Efficiency Score</p>
              <div className="flex items-center gap-1.5 mt-1">
                <h3 className="text-2xl font-black text-[#0d121b] dark:text-white leading-none">{stats.efficiencyScore || 0}%</h3>
                <div className="flex text-amber-500 text-xs">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const rating = (stats.efficiencyScore || 0) / 20;
                    return (
                      <span key={i} className="material-symbols-outlined text-[14px]">
                        {i < Math.floor(rating) ? 'star' : i < rating ? 'star_half' : 'star_outline'}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Chart & Shift History logs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Card */}
          <div className="lg:col-span-2 bg-white dark:bg-[#1a202c] rounded-xl p-5 border border-[#e7ebf3] dark:border-[#2a3441] shadow-sm flex flex-col h-80">
            <h3 className="text-sm font-bold text-[#0d121b] dark:text-white mb-4 uppercase">Resolved Maintenances by Category</h3>
            <div className="flex-1 relative w-full h-56">
              <canvas ref={chartRef}></canvas>
            </div>
          </div>

          {/* Shift History Logs Panel */}
          <div className="bg-white dark:bg-[#1a202c] rounded-xl p-5 border border-[#e7ebf3] dark:border-[#2a3441] shadow-sm flex flex-col h-80 overflow-hidden">
            <h3 className="text-sm font-bold text-[#0d121b] dark:text-white mb-3 uppercase flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[18px]">schedule</span>
              Shift check-in logs
            </h3>
            <div className="flex-1 overflow-y-auto divide-y divide-[#e7ebf3] dark:divide-[#2a3441] pr-1">
              {shiftHistory.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-text-muted-light dark:text-gray-400">
                  No shifts recorded yet
                </div>
              ) : (
                shiftHistory.map((shift, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-[#0d121b] dark:text-white">{shift.date}</p>
                      <p className="text-text-muted-light dark:text-gray-400 text-[10px] mt-0.5">Check-in time</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1 font-bold ${shift.status === 'Present' ? 'text-green-600' : 'text-red-500'}`}>
                        {shift.status === 'Present' ? 'Present' : 'Absent'}
                      </span>
                      <p className="text-text-muted-light dark:text-gray-400 text-[10px] mt-0.5">
                        {shift.check_in_at ? `${shift.check_in_at}` : 'N/A'} - {shift.check_out_at ? `${shift.check_out_at}` : 'Active'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Daily Attendance Card */}
        <div className="bg-white dark:bg-[#1a202c] rounded-xl shadow-sm border border-[#e7ebf3] dark:border-[#2a3441] p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${checkedIn ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
              <span className="material-symbols-outlined text-[28px]">{checkedIn ? 'how_to_reg' : 'person_off'}</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-text-main-light dark:text-white">Daily Assignment Attendance Check-In</h2>
              <p className="text-sm text-[#4c669a] dark:text-gray-400 mt-1">
                {checkedIn 
                  ? "You are checked in as 'Present' for today's assignment queue. Admin can assign maintenance tasks to you." 
                  : "You are currently checked out. Toggle attendance check-in to be eligible for receiving ticket allocations."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className={`text-sm font-bold ${checkedIn ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
              {checkedIn ? 'Checked In' : 'Checked Out'}
            </span>
            <button 
              onClick={handleAttendanceToggle}
              className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 outline-none border-none ${checkedIn ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}`}
              aria-label="Toggle Attendance"
            >
              <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-all duration-300 ${checkedIn ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
          </div>
        </div>

        {/* Assigned Issues Section */}
        <section className="bg-white dark:bg-[#1a202c] rounded-xl shadow-sm border border-[#e7ebf3] dark:border-[#2a3441] overflow-hidden flex flex-col">
          {/* Section Header */}
          <div className="px-6 py-4 border-b border-[#e7ebf3] dark:border-[#2a3441] flex flex-wrap items-center justify-between gap-4 bg-[#f8f9fc] dark:bg-[#1f2937]/50">
            <h3 className="text-lg font-bold text-[#0d121b] dark:text-white">Assigned Tickets</h3>
            <div className="flex items-center gap-3">
              <label htmlFor="status-filter" className="text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:inline">Filter Status:</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-[#2d3748] border border-[#e7ebf3] dark:border-[#4a5568] rounded-lg text-sm font-medium text-[#4c669a] dark:text-gray-300 hover:text-blue-600 dark:hover:text-white transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="All">All Statuses</option>
                <option value="assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#e7ebf3] dark:border-[#2a3441] text-xs font-semibold text-[#4c669a] dark:text-gray-400 uppercase tracking-wider bg-[#f8f9fc] dark:bg-[#1f2937]">
                  <th className="px-6 py-4">Request ID</th>
                  <th className="px-6 py-4">Asset Detail</th>
                  <th className="px-6 py-4">Reporter</th>
                  <th className="px-6 py-4">Category / Issue</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e7ebf3] dark:divide-[#2a3441] text-sm text-[#0d121b] dark:text-white">
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <span className="material-symbols-outlined animate-spin text-blue-600">sync</span>
                        <span className="text-sm text-[#4c669a]">Loading assigned tickets...</span>
                      </div>
                    </td>
                  </tr>
                ) : pageData.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-text-muted-light text-gray-500 dark:text-gray-400">
                      No ticket assignments found matching this status.
                    </td>
                  </tr>
                ) : (
                  pageData.map((issue, idx) => (
                    <tr key={issue._id || idx} className="hover:bg-[#f1f5f9] dark:hover:bg-[#2d3748] transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-xs text-gray-500 dark:text-gray-400">
                        #{issue._id.substring(issue._id.length - 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold">{issue.asset_name || "Hardware Asset"}</span>
                          <span className="text-xs text-[#4c669a] dark:text-gray-400">Asset ID: {issue.asset_id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium">{issue.emp_name}</span>
                          <span className="text-xs text-[#4c669a] dark:text-gray-400">{issue.emp_dept}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 dark:text-white">{issue.category}</span>
                          <span className="text-xs text-[#4c669a] dark:text-gray-400 truncate max-w-[150px]">{issue.issue}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={getPriorityClass(issue.priority)}>
                          {issue.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(issue.technician_status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 flex-wrap sm:flex-nowrap">
                          <button
                            onClick={() => setSelectedIssue(issue)}
                            className="px-2.5 py-1.5 rounded-lg border border-[#e7ebf3] dark:border-[#2a3441] text-xs font-semibold text-[#4c669a] dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
                            title="View Details"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                            Details
                          </button>

                          {issue.technician_status === 'assigned' && (
                            <button
                              onClick={() => handleStatusChange(issue._id, 'In Progress')}
                              disabled={isUpdatingStatus}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm flex items-center gap-1 transition-all"
                            >
                              <span className="material-symbols-outlined text-sm">play_arrow</span>
                              Start Work
                            </button>
                          )}

                          {issue.technician_status === 'In Progress' && (
                            <button
                              onClick={() => handleStatusChange(issue._id, 'Resolved')}
                              disabled={isUpdatingStatus}
                              className="px-2.5 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold shadow-sm flex items-center gap-1 transition-all"
                            >
                              <span className="material-symbols-outlined text-sm">check</span>
                              Resolve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-[#e7ebf3] dark:border-[#2a3441] flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#1a202c]">
            <span className="text-sm text-[#4c669a] dark:text-gray-400">
              Showing <span className="font-bold text-[#0d121b] dark:text-white">{total > 0 ? startIdx + 1 : 0}</span> to <span className="font-bold text-[#0d121b] dark:text-white">{Math.min(endIdx, total)}</span> of <span className="font-bold text-[#0d121b] dark:text-white">{total}</span> assignments
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => changePage(-1)}
                disabled={safeCurrentPage === 1}
                className="size-8 flex items-center justify-center rounded-lg border border-[#e7ebf3] dark:border-[#2a3441] text-[#9ca3af] hover:bg-[#f8f9fc] dark:hover:bg-[#2d3748] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <span className="text-sm font-bold text-blue-600 px-2">{safeCurrentPage}</span>
              <button
                onClick={() => changePage(1)}
                disabled={safeCurrentPage === totalPages}
                className="size-8 flex items-center justify-center rounded-lg border border-[#e7ebf3] dark:border-[#2a3441] text-[#4c669a] dark:text-gray-300 hover:bg-[#f8f9fc] dark:hover:bg-[#2d3748] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        </section>

        {/* DETAILS MODAL / DRAWER */}
        {selectedIssue && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
            <div className="bg-white dark:bg-[#1a202c] rounded-2xl shadow-xl w-full max-w-2xl border border-gray-200 dark:border-[#2a3441] overflow-hidden flex flex-col max-h-[90vh] mx-4 relative animate-scaleIn">
              
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-gray-200 dark:border-[#2a3441] flex items-center justify-between bg-gray-50 dark:bg-[#1f2937]/50">
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">info</span>
                    Ticket Details
                  </h3>
                  <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-1">ID: #{selectedIssue._id}</p>
                </div>
                <button 
                  onClick={() => setSelectedIssue(null)}
                  className="size-8 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 flex items-center justify-center text-xl font-bold transition-all outline-none"
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-gray-800 dark:text-gray-300">
                {/* Status and Priority Overview */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700/50">
                    <span className="text-xs text-[#4c669a] dark:text-gray-400 uppercase tracking-wider font-bold">Status</span>
                    <div className="mt-1">{getStatusBadge(selectedIssue.technician_status)}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700/50">
                    <span className="text-xs text-[#4c669a] dark:text-gray-400 uppercase tracking-wider font-bold">Priority</span>
                    <div className={`mt-1 text-sm ${getPriorityClass(selectedIssue.priority)}`}>
                      {selectedIssue.priority}
                    </div>
                  </div>
                </div>

                {/* Reporter / Asset Description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reported By</h4>
                    <p className="mt-1 text-base font-bold text-gray-900 dark:text-white">{selectedIssue.emp_name}</p>
                    <p className="text-xs text-[#4c669a] dark:text-gray-400">Employee ID: {selectedIssue.emp_id} | Dept: {selectedIssue.emp_dept}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Asset Information</h4>
                    <p className="mt-1 text-base font-bold text-gray-900 dark:text-white">{selectedIssue.asset_name}</p>
                    <p className="text-xs text-[#4c669a] dark:text-gray-400">Asset ID: {selectedIssue.asset_id}</p>
                  </div>
                </div>

                {/* Problem Description */}
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category &amp; Issue</h4>
                  <p className="text-base font-bold text-gray-900 dark:text-white">{selectedIssue.category} - {selectedIssue.issue}</p>
                  <div className="mt-2 bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700/50 whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">
                    {selectedIssue.description || "No detailed description provided by the reporter."}
                  </div>
                </div>

                {/* AI Analysis Block */}
                {selectedIssue.aianalysis && (
                  <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/30 p-5 rounded-xl space-y-3">
                    <h4 className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px]">psychology</span>
                      AI DIAGNOSTIC PROTOCOL & REPAIR CHECKLIST
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[#4c669a] dark:text-gray-400 font-medium">Recommended Priority:</span>
                        <p className={`font-bold ${getPriorityClass(selectedIssue.aianalysis.priority)}`}>{selectedIssue.aianalysis.priority || "Low"}</p>
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
                    
                    <div className="mt-4 pt-3 border-t border-blue-200/30 dark:border-blue-800/20 space-y-2">
                      <span className="text-xs text-[#4c669a] dark:text-gray-400 font-bold uppercase tracking-wider">Interactive Repair Checklist</span>
                      <div className="space-y-1.5 mt-1.5">
                        {getChecklistSteps(selectedIssue).map((step, idx) => {
                          const isChecked = !!checkedSteps[idx];
                          return (
                            <label key={idx} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-blue-500/5 dark:hover:bg-blue-400/5 cursor-pointer transition-colors text-xs text-gray-700 dark:text-gray-300">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  const updated = { ...checkedSteps, [idx]: !isChecked };
                                  setCheckedSteps(updated);
                                  localStorage.setItem(`checklist_${selectedIssue._id}`, JSON.stringify(updated));
                                }}
                                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700"
                              />
                              <span className={isChecked ? 'line-through text-gray-400 dark:text-gray-500' : ''}>
                                {step}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Comments Activity Stream */}
                <div className="border-t border-gray-200 dark:border-[#2a3441] pt-6 space-y-4">
                  <h4 className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">forum</span>
                    Activity Stream &amp; Comments
                  </h4>

                  {/* Scrollable list */}
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
                    <div ref={commentsEndRef} />
                  </div>

                  {/* Post comment form */}
                  <form onSubmit={handlePostComment} className="flex gap-2">
                    <input
                      type="text"
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      placeholder="Write updates or troubleshooting notes..."
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

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-[#2a3441] bg-gray-50 dark:bg-[#1f2937]/50 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedIssue(null)}
                  className="px-4 py-2 border border-[#e7ebf3] dark:border-[#2a3441] text-sm font-semibold rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>

                {selectedIssue.technician_status === 'assigned' && (
                  <button
                    onClick={() => handleStatusChange(selectedIssue._id, 'In Progress')}
                    disabled={isUpdatingStatus}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm flex items-center gap-1 transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">play_arrow</span>
                    Start Work
                  </button>
                )}

                {selectedIssue.technician_status === 'In Progress' && (
                  <button
                    onClick={() => handleStatusChange(selectedIssue._id, 'Resolved')}
                    disabled={isUpdatingStatus}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg shadow-sm flex items-center gap-1 transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">check</span>
                    Mark Resolved
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

      </main>
      <div className="mt-8 text-center text-xs text-text-muted-light dark:text-text-muted-dark pb-4">
        &copy; 2026 AAI Hardware Maintenance System. All rights reserved.
      </div>
    </Layout>
  );
}
