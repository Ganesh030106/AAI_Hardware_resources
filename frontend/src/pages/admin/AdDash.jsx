import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Layout from '../../components/Layout';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export default function AdDash() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [stats, setStats] = useState({ total: 0, rejected: 0, completed: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');
  
  const topAssetsChartRef = useRef(null);
  const statusChartRef = useRef(null);
  const topAssetsChartInstance = useRef(null);
  const statusChartInstance = useRef(null);

  useEffect(() => {
    if (!user || (user.role || '').toLowerCase() !== 'admin') {
      navigate('/html/AdminLogin.html');
      return;
    }

    const loadDashboard = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        const data = await response.json();

        if (data) {
          setStats({
            total: data.total || 0,
            rejected: data.rejected || 0,
            completed: data.allocated || 0
          });
          setRecentActivity(data.recent_activity || []);

          // Theme color helper inside chart update
          const isDark = document.documentElement.classList.contains('dark');
          const textColor = isDark ? '#94a3b8' : '#64748b';
          const gridColor = isDark ? '#334155' : '#e2e8f0';

          // 1. Render Top Assets Chart
          if (topAssetsChartRef.current) {
            const assetLabels = (data.chart_top_assets || []).map(a => a.asset_name);
            const assetCounts = (data.chart_top_assets || []).map(a => a.count);

            if (topAssetsChartInstance.current) {
              topAssetsChartInstance.current.destroy();
            }

            topAssetsChartInstance.current = new Chart(topAssetsChartRef.current, {
              type: 'bar',
              data: {
                labels: assetLabels,
                datasets: [{
                  label: 'Requests',
                  data: assetCounts,
                  backgroundColor: ['#1658e5', '#7c3aed', '#e03a3a', '#f59e42', '#22c55e'],
                  borderRadius: 8,
                  maxBarThickness: 36
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  title: { display: false }
                },
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: { color: textColor }
                  },
                  y: {
                    beginAtZero: true,
                    grid: { color: gridColor },
                    ticks: { color: textColor }
                  }
                }
              }
            });
          }

          // 2. Render Status Chart
          if (statusChartRef.current) {
            const statusLabels = (data.chart_status_dist || []).map(s => s._id.charAt(0).toUpperCase() + s._id.slice(1));
            const statusCounts = (data.chart_status_dist || []).map(s => s.count);
            const statusColors = ['#1658e5', '#e03a3a', '#22c55e', '#f59e42', '#7c3aed'];

            if (statusChartInstance.current) {
              statusChartInstance.current.destroy();
            }

            statusChartInstance.current = new Chart(statusChartRef.current, {
              type: 'doughnut',
              data: {
                labels: statusLabels,
                datasets: [{
                  data: statusCounts,
                  backgroundColor: statusColors,
                  borderWidth: 1
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: true,
                    position: 'bottom',
                    labels: { color: textColor }
                  },
                  title: { display: false }
                }
              }
            });
          }
        }
      } catch (error) {
        console.error("Error loading admin dashboard stats:", error);
      }
    };

    loadDashboard();
    
    // Refresh interval every 10s for live data as in original code
    const interval = setInterval(loadDashboard, 10000);
    return () => {
      clearInterval(interval);
      if (topAssetsChartInstance.current) topAssetsChartInstance.current.destroy();
      if (statusChartInstance.current) statusChartInstance.current.destroy();
    };
  }, [user, navigate]);

  // Handle dark mode theme change chart redraw
  useEffect(() => {
    if (topAssetsChartInstance.current && statusChartInstance.current) {
      const isDark = theme === 'dark';
      const textColor = isDark ? '#94a3b8' : '#64748b';
      const gridColor = isDark ? '#334155' : '#e2e8f0';

      // Update Top Assets chart ticks
      topAssetsChartInstance.current.options.scales.x.ticks.color = textColor;
      topAssetsChartInstance.current.options.scales.y.ticks.color = textColor;
      topAssetsChartInstance.current.options.scales.y.grid.color = gridColor;
      topAssetsChartInstance.current.update();

      // Update status chart legend
      statusChartInstance.current.options.plugins.legend.labels.color = textColor;
      statusChartInstance.current.update();
    }
  }, [theme]);

  // Client-side search filters recent activity rows
  const filteredActivity = recentActivity.filter(req => {
    const filter = searchFilter.toLowerCase();
    const ticketId = `#${req.request_id || ''}`.toLowerCase();
    const assetName = (req.asset_name || '').toLowerCase();
    const employeeName = (req.employee_name || req.emp_id || '').toLowerCase();
    return ticketId.includes(filter) || assetName.includes(filter) || employeeName.includes(filter);
  });

  const searchHeader = (
    <div className="relative w-full max-w-xl">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined text-[20px]">search</span>
      <input 
        id="dashboard-search"
        type="text"
        value={searchFilter}
        onChange={(e) => setSearchFilter(e.target.value)}
        className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#f4f6fa] dark:bg-[#101622] border border-gray-200 dark:border-[#232e42] focus:ring-2 focus:ring-[#1658e5] text-sm text-text-main-light dark:text-text-main-dark focus:outline-none" 
        placeholder="Search requests by Ticket ID, Employee Name or Asset Name ..." 
      />
    </div>
  );

  return (
    <Layout headerActions={searchHeader}>
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Welcome back, <span id="welcome-message" className="text-gray-900 dark:text-white">{user?.name || "Admin"}</span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Real-time overview of system performance and requests.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div className="card-hover bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col gap-2 min-h-[140px]">
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#eaf1ff] text-[#1658e5] dark:bg-blue-900/20 dark:text-blue-400">
                <span className="material-symbols-outlined text-[28px]">confirmation_number</span>
              </span>
              <span className="ml-auto text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full dark:bg-blue-500/20">Live</span>
            </div>
            <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Requests</span>
            <span id="total-requests-count" className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</span>
          </div>

          {/* Card 2 */}
          <div className="card-hover bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col gap-2 min-h-[140px]">
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#fff3f3] text-[#e03a3a] dark:bg-red-900/20 dark:text-red-400">
                <span className="material-symbols-outlined text-[28px]">warning</span>
              </span>
              <span className="ml-auto text-xs font-bold text-[#e03a3a] bg-[#fff3f3] px-2 py-1 rounded-full dark:bg-red-500/20">Action Needed</span>
            </div>
            <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">Rejected Requests</span>
            <span id="urgent-tickets-count" className="text-3xl font-bold text-gray-900 dark:text-white">{stats.rejected}</span>
          </div>

          {/* Card 3 */}
          <div className="card-hover bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col gap-2 min-h-[140px]">
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#f3f1ff] text-[#7c3aed] dark:bg-purple-900/20 dark:text-purple-400">
                <span className="material-symbols-outlined text-[28px]">task_alt</span>
              </span>
              <span className="ml-auto text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full dark:bg-green-700/20 dark:text-green-300">Completed</span>
            </div>
            <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">Completed Requests</span>
            <span id="completed-requests-count" className="text-3xl font-bold text-gray-900 dark:text-white">{stats.completed}</span>
          </div>

        </div>

        {/* Visualization Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col h-[340px]">
            <h4 className="text-base font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[22px] align-middle">bar_chart</span>
              Top 5 Requested Assets
            </h4>
            <div className="flex-1 relative w-full h-[240px]">
              <canvas ref={topAssetsChartRef} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col h-[340px]">
            <h4 className="text-base font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[22px] align-middle">pie_chart</span>
              Request Status Distribution
            </h4>
            <div className="flex-1 relative w-full h-[240px]">
              <canvas ref={statusChartRef} />
            </div>
          </div>
        </div>

        {/* Activity Table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm mt-2">
          <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[24px] align-middle">history</span>
              Recent Requests
            </h3>
            <div className="flex items-center gap-4">
              <Link to="/html/Ad-export.html">
                <button className="flex items-center gap-2 bg-[#1658e5] hover:bg-[#0e4bce] text-white px-5 py-2.5 rounded-lg shadow-sm shadow-blue-600/30 transition-all text-sm font-bold">
                  <span className="material-symbols-outlined text-[20px]">download</span>
                  Export Report
                </button>
              </Link>
              <Link to="/html/Ad-ticket.html" className="text-sm font-semibold text-[#1658e5] hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2 rounded-lg flex items-center gap-1 transition-all">
                View All <span className="material-symbols-outlined align-middle text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-900 dark:text-white">
              <thead className="bg-[#f4f6fa] dark:bg-[#101622] text-xs uppercase font-bold text-gray-900 dark:text-white">
                <tr>
                  <th className="px-6 py-4">REQUEST ID</th>
                  <th className="px-6 py-4">ASSET</th>
                  <th className="px-6 py-4">REQUESTED BY</th>
                  <th className="px-6 py-4">QUANTITY</th>
                  <th className="px-6 py-4">STATUS</th>
                </tr>
              </thead>
              <tbody id="activity-table-body" className="divide-y divide-gray-200 dark:divide-[#232e42] text-gray-900 dark:text-white">
                {filteredActivity.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No requests found</td>
                  </tr>
                ) : (
                  filteredActivity.map((req, i) => {
                    const assetLabel = req.asset_name || `Asset ${req.asset_id || "N/A"}`;
                    const statusRaw = (req.status || "allocated").toLowerCase();

                    let statusBadge = "";
                    if (statusRaw === "allocated") {
                      statusBadge = <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Allocated</span>;
                    } else if (statusRaw === "rejected") {
                      statusBadge = <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Rejected</span>;
                    } else {
                      statusBadge = <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</span>;
                    }

                    return (
                      <tr key={req.request_id || i} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors border-b border-gray-100 dark:border-slate-700 last:border-0">
                        <td className="px-6 py-4 font-mono text-xs text-gray-500 dark:text-gray-400">#{req.request_id}</td>
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{assetLabel}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{req.employee_name || req.emp_id}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{req.quantity || 1}</td>
                        <td className="px-6 py-4">{statusBadge}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
      <div className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400 pb-4">
        &copy; 2026 AAI Hardware Maintenance System. All rights reserved.
      </div>
    </Layout>
  );
}
