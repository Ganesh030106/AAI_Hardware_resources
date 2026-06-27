import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Layout from '../../components/Layout';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export default function AdTicket() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 5;

  const deptChartRef = useRef(null);
  const statusChartRef = useRef(null);
  const deptChartInstance = useRef(null);
  const statusChartInstance = useRef(null);

  // Debounced/Delayed search logic could be used, but let's load tickets on state change
  useEffect(() => {
    if (!user || (user.role || '').toLowerCase() !== 'admin') {
      navigate('/html/AdminLogin.html');
      return;
    }
  }, [user, navigate]);

  const loadTickets = async (page = 1) => {
    try {
      const url = `/api/tickets?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&dept=${encodeURIComponent(selectedDept)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch tickets');
      const data = await res.json();
      setTickets(data.tickets || []);
      setTotalItems(data.total || 0);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error loading tickets:', err);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const res = await fetch('/api/tickets/filter-options');
      if (!res.ok) throw new Error('Failed to fetch filter options');
      const data = await res.json();
      setDepartments(data.departments || []);
    } catch (err) {
      console.error('Error loading filter options:', err);
    }
  };

  const loadTicketStats = async () => {
    try {
      const res = await fetch('/api/tickets/stats');
      const data = await res.json();
      if (res.ok) {
        initCharts(data.departmentDistribution || [], data.statusDistribution || []);
      }
    } catch (err) {
      console.error('Error loading ticket stats:', err);
    }
  };

  const initCharts = (deptData, statusData) => {
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? '#334155' : '#e2e8f0';

    // 1. Department Bar Chart
    if (deptChartRef.current) {
      const deptLabels = deptData.map(d => d._id || 'Unknown');
      const deptCounts = deptData.map(d => d.count);

      if (deptChartInstance.current) {
        deptChartInstance.current.destroy();
      }

      deptChartInstance.current = new Chart(deptChartRef.current, {
        type: 'bar',
        data: {
          labels: deptLabels,
          datasets: [{
            label: 'Requests',
            data: deptCounts,
            backgroundColor: '#135bec',
            borderRadius: 4,
            barThickness: 30,
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

    // 2. Status Doughnut Chart
    if (statusChartRef.current) {
      const statusMap = {
        allocated: { count: 0, color: '#22c55e' },
        pending: { count: 0, color: '#f59e0b' },
        rejected: { count: 0, color: '#ef4444' }
      };

      statusData.forEach(item => {
        const key = (item._id || '').toLowerCase();
        if (statusMap[key]) statusMap[key].count = item.count;
        if (key === 'completed') statusMap['allocated'].count += item.count;
      });

      const sLabels = Object.keys(statusMap).map(k => k.charAt(0).toUpperCase() + k.slice(1));
      const sData = Object.keys(statusMap).map(k => statusMap[k].count);
      const sColors = Object.keys(statusMap).map(k => statusMap[k].color);

      if (statusChartInstance.current) {
        statusChartInstance.current.destroy();
      }

      statusChartInstance.current = new Chart(statusChartRef.current, {
        type: 'doughnut',
        data: {
          labels: sLabels,
          datasets: [{
            data: sData,
            backgroundColor: sColors,
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: textColor,
                usePointStyle: true,
                padding: 20,
                font: { size: 11 }
              }
            }
          }
        }
      });
    }
  };

  // Run on mount
  useEffect(() => {
    loadFilterOptions();
    loadTicketStats();
  }, []);

  // Fetch tickets whenever search, selectedDept, or currentPage changes
  useEffect(() => {
    loadTickets(currentPage);
  }, [search, selectedDept, currentPage]);

  // Adjust chart colors when theme updates
  useEffect(() => {
    if (deptChartInstance.current && statusChartInstance.current) {
      const isDark = theme === 'dark';
      const textColor = isDark ? '#94a3b8' : '#64748b';
      const gridColor = isDark ? '#334155' : '#e2e8f0';

      deptChartInstance.current.options.scales.x.ticks.color = textColor;
      deptChartInstance.current.options.scales.y.ticks.color = textColor;
      deptChartInstance.current.options.scales.y.grid.color = gridColor;
      deptChartInstance.current.update();

      statusChartInstance.current.options.plugins.legend.labels.color = textColor;
      statusChartInstance.current.update();
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
              <span className="material-symbols-outlined text-blue-600 text-[30px] align-middle">confirmation_number</span>
              Hardware Management
            </h2>
            <p className="text-[#4c669a] text-base font-medium dark:text-[#94a3b8]">Manage the New Hardware request status</p>
          </div>
          <div>
            <Link 
              to="/html/Ad-issue.html"
              className="animated-btn inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm shadow-blue-600/30 transition-all"
            >
              Maintenance Requests
            </Link>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-[#151c2b] rounded-xl p-5 border border-[#cfd7e7] dark:border-gray-800 shadow-sm">
            <h3 className="text-sm font-bold text-[#0d121b] dark:text-white mb-4 uppercase">Requests by Department</h3>
            <div className="relative h-60 w-full">
              <canvas ref={deptChartRef}></canvas>
            </div>
          </div>

          <div className="bg-white dark:bg-[#151c2b] rounded-xl p-5 border border-[#cfd7e7] dark:border-gray-800 shadow-sm">
            <h3 className="text-sm font-bold text-[#0d121b] dark:text-white mb-4 uppercase">Request Status</h3>
            <div className="relative h-60 w-full flex justify-center">
              <canvas ref={statusChartRef}></canvas>
            </div>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-[#151c2b] p-5 rounded-xl border border-[#cfd7e7] dark:border-gray-800 shadow-sm">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#4c669a] dark:text-white uppercase">Search</label>
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
                placeholder="Search by Ticket ID, Employee Name or Asset Name" 
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#4c669a] dark:text-white uppercase">Department</label>
            <select 
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-3 pr-8 py-2.5 bg-background-light dark:bg-gray-900 border border-[#cfd7e7] dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none cursor-pointer text-[#0d121b] dark:text-white"
            >
              <option value="">All Departments</option>
              {departments.map((dept, index) => (
                <option key={index} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table List */}
        <div className="bg-white dark:bg-[#151c2b] rounded-xl border border-[#cfd7e7] dark:border-gray-800 shadow-sm overflow-hidden flex flex-col flex-1 min-h-[500px]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr class="bg-gray-50 dark:bg-gray-900 border-b border-[#cfd7e7] dark:border-gray-700">
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#4c669a] dark:text-white uppercase w-[100px]">Request ID</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#4c669a] dark:text-white uppercase w-[150px]">Asset</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#4c669a] dark:text-white uppercase w-[120px]">Employee</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#4c669a] dark:text-white uppercase w-[100px]">Dept</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#4c669a] dark:text-white uppercase w-[80px]">Qty</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#4c669a] dark:text-white uppercase w-[150px]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#cfd7e7] dark:divide-gray-800">
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No tickets found.</td>
                  </tr>
                ) : (
                  tickets.map((t, idx) => {
                    const status = (t.status || '').toLowerCase();
                    let statusClass = 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300';
                    if (status === 'allocated') {
                      statusClass = 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400';
                    } else if (status === 'rejected') {
                      statusClass = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400';
                    }

                    return (
                      <tr key={t.request_id || idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-[#0d121b] dark:text-white">#{t.request_id}</td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-[#0d121b] dark:text-white">{t.asset_name || t.asset_id}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-[#4c669a] dark:text-white">{t.emp_name || t.emp_id}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-[#4c669a] dark:text-white">{t.emp_dept || '-'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-[#0d121b] dark:text-white">{t.quantity || 1}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-bold rounded-full px-3 py-1 border ${statusClass}`}>
                            {t.status ? t.status.charAt(0).toUpperCase() + t.status.slice(1) : 'Unknown'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

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

        <div className="mt-8 text-center text-xs text-text-muted-light dark:text-text-muted-dark pb-4">
          © 2026 AAI Hardware Maintenance System. All rights reserved.
        </div>
      </div>
    </Layout>
  );
}
