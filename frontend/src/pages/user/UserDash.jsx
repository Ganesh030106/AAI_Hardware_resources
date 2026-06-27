import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';

export default function UserDash() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({ total: 0, rejected: 0, completed: 0 });
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !user.emp_id) {
      navigate('/html/UserLogin.html');
      return;
    }

    const fetchDashboardData = async () => {
      try {
        // A. Load Stats (Cards)
        const statsRes = await fetch(`/api/user/dashboard/stats?emp_id=${user.emp_id}`);
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats({
            total: statsData.total || 0,
            rejected: statsData.rejected || 0,
            completed: statsData.completed || 0
          });
        }

        // B. Load Recent Activity (Table)
        const activityRes = await fetch(`/api/user/dashboard/activity?emp_id=${user.emp_id}`);
        if (activityRes.ok) {
          const activityData = await activityRes.json();
          setActivities(activityData);
        }
      } catch (error) {
        console.error("Error loading user dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, navigate]);

  const getStatusStyleAndLabel = (req) => {
    let statusColor = "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-500";
    let statusLabel = req.status;

    if (req.status === "Approved" || req.status === "In Progress") {
      statusColor = "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500";
    } else if (req.status === "Completed" || req.status === "Allocated") {
      statusColor = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500";
      statusLabel = "Allocated";
    } else if (req.status === "Rejected") {
      statusColor = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500";
      statusLabel = "Rejected";
    }

    return { statusColor, statusLabel };
  };

  const displayName = user?.name || "User";

  return (
    <Layout>
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 id="welcome-text" className="text-3xl font-bold tracking-tight text-text-main-light dark:text-text-main-dark">
              Welcome back, {displayName}
            </h2>
            <p className="text-text-muted-light dark:text-slate-300 mt-1">
              Track your hardware requests and status updates.
            </p>
          </div>
          <Link to="/html/user_request.html">
            <button className="animated-btn glow-blue-600 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg shadow-sm shadow-blue-600/30 transition-all text-sm font-bold dark:bg-blue-600 dark:hover:bg-blue-700 dark:shadow-blue-800/50">
              <span className="material-symbols-outlined text-[20px]">add</span>
              New Request
            </button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-card-light dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group hover:bg-blue-50/50 dark:hover:bg-blue-900/10 hover:-translate-y-1 hover:shadow-md transition-all duration-300 cursor-default">
            <div className="absolute right-[-20px] top-[-20px] opacity-5 dark:opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-500">
              <span className="material-symbols-outlined text-[120px]">confirmation_number</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                <span className="material-symbols-outlined">confirmation_number</span>
              </div>
              <p className="font-medium text-text-secondary-light dark:text-text-secondary-dark">Total Tickets</p>
            </div>
            <div className="flex items-baseline gap-2 mt-4">
              <h3 id="total-tickets-count" className="text-4xl font-bold text-text-blue-600-light dark:text-text-blue-600-dark">
                {stats.total}
              </h3>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-card-light dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group hover:bg-red-50/50 dark:hover:bg-red-900/10 hover:-translate-y-1 hover:shadow-md transition-all duration-300 cursor-default">
            <div className="absolute right-[-20px] top-[-20px] opacity-5 dark:opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-500">
              <span className="material-symbols-outlined text-[120px]">cancel</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg text-red-600 dark:text-red-400 group-hover:bg-red-200 dark:group-hover:bg-red-800 transition-colors">
                <span className="material-symbols-outlined">cancel</span>
              </div>
              <p className="font-medium text-text-secondary-light dark:text-text-secondary-dark">Rejected Requests</p>
            </div>
            <div className="flex items-baseline gap-2 mt-4">
              <h3 id="rejected-tickets-count" className="text-4xl font-bold text-text-blue-600-light dark:text-text-blue-600-dark">
                {stats.rejected}
              </h3>
              <span className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">Rejected</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-card-light dark:bg-slate-800 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group hover:bg-green-50/50 dark:hover:bg-green-900/10 hover:-translate-y-1 hover:shadow-md transition-all duration-300 cursor-default">
            <div className="absolute right-[-20px] top-[-20px] opacity-5 dark:opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-500">
              <span className="material-symbols-outlined text-[120px]">check_circle</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg text-green-600 dark:text-green-400 group-hover:bg-green-200 dark:group-hover:bg-green-800 transition-colors">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <p className="font-medium text-text-secondary-light dark:text-text-secondary-dark">Completed Services</p>
            </div>
            <div className="flex items-baseline gap-2 mt-4">
              <h3 id="completed-tickets-count" className="text-4xl font-bold text-text-blue-600-light dark:text-text-blue-600-dark">
                {stats.completed}
              </h3>
              <span className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">Resolved</span>
            </div>
          </div>
        </div>

        {/* Maintenance Callout */}
        <div className="bg-card-light dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm border border-border-light dark:border-slate-700 flex flex-col md:flex-row relative group">
          <div className="p-8 md:p-10 flex flex-col justify-center gap-4 flex-1 z-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full w-fit">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider">Support</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-text-main-light dark:text-text-main-dark tracking-tight">
              Need assistance?
            </h2>
            <p className="text-text-muted-light dark:text-slate-300 text-lg max-w-xl">
              Submit a new maintenance request to get immediate support from our technicians.
            </p>
            <div className="mt-2">
              <Link to="/html/raise_main.html">
                <button className="animated-btn glow-blue-600 inline-flex items-center justify-center h-10 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg shadow-blue-600/30 dark:bg-blue-600 dark:hover:bg-blue-700 dark:shadow-blue-800/50">
                  Raise New Maintenance Request
                </button>
              </Link>
            </div>
          </div>

          <div className="relative w-full md:w-5/12 min-h-[220px] md:min-h-full overflow-hidden flex items-center justify-center bg-blue-50/30 dark:bg-blue-900/5">
            <div className="absolute inset-0 bg-gradient-to-r from-card-light via-card-light/50 to-transparent dark:from-card-dark dark:via-card-dark/50 z-10 pointer-events-none"></div>
            <div className="relative w-full h-full transform transition-transform duration-700 group-hover:scale-105">
              <svg className="absolute -top-10 -right-10 w-48 h-48 text-gray-200 dark:text-gray-800 opacity-50 animate-[spin_10s_linear_infinite]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                <path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z" clipRule="evenodd" opacity="0" />
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5.5-2.5l7.51-3.49L17.5 6.5 9.99 9.99 6.5 17.5zm5.5-6.6c.61 0 1.1.49 1.1 1.1s-.49 1.1-1.1 1.1-1.1-.49-1.1-1.1.49-1.1 1.1-1.1z" />
              </svg>
              <svg className="absolute top-8 right-1/3 w-24 h-24 text-blue-100 dark:text-blue-900/40" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2zm2 4v8h8V8H8z" />
                <path d="M2 9h2v6H2zM20 9h2v6h-2zM9 2v2h6V2zM9 20v2h6v-2z" />
              </svg>
              <svg className="absolute bottom-4 right-16 w-36 h-36 text-blue-200 dark:text-blue-800 drop-shadow-md transform translate-x-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 3a2 2 0 012-2h12a2 2 0 012 2v18a2 2 0 01-2 2H6a2 2 0 01-2-2V3zm2 2v4h12V5H6zm0 6v4h12v-4H6zm0 6v4h12v-4H6z" />
                <circle cx="8" cy="7" r="1" className="text-blue-400 dark:text-blue-500" fill="currentColor" />
                <circle cx="8" cy="13" r="1" className="text-blue-400 dark:text-blue-500" fill="currentColor" />
                <circle cx="8" cy="19" r="1" className="text-green-400" fill="currentColor" />
              </svg>
              <svg className="absolute -bottom-2 -right-2 w-28 h-28 text-blue-600/30 dark:text-blue-600/40" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13.7 2.29a1 1 0 00-1.4 1.4l2.29 2.29a1 1 0 001.4-1.4l-2.29-2.29zM18.7 7.29a1 1 0 00-1.4 1.4l2.29 2.29a1 1 0 001.4-1.4l-2.29-2.29zM6 13a1 1 0 00-1.4 1.4l10 10a1 1 0 001.4-1.4l-10-10zM17 11a1 1 0 100-2 1 1 0 000 2z" />
                <path d="M7 2l10 10-3 3-10-10z" className="text-blue-300 dark:text-blue-700 opacity-50" />
              </svg>
            </div>
          </div>
        </div>

        {/* Recent Activity Table */}
        <div className="bg-white dark:bg-slate-800 backdrop-blur rounded-xl border border-border-light dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-border-light dark:border-slate-700 flex justify-between items-center">
            <h3 className="text-lg font-bold text-text-main-light dark:text-text-main-dark flex items-center gap-2">
              <span className="material-symbols-outlined align-middle text-[40px]">history</span>
              Recent Activity
            </h3>
            <Link to="/html/MyRequest.html" className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
              View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-text-muted-light dark:text-slate-300">
              <thead className="bg-background-light dark:bg-slate-700 text-xs uppercase font-bold text-text-main-light dark:text-text-main-dark">
                <tr>
                  <th className="px-6 py-4">Request ID</th>
                  <th class="px-6 py-4">Asset Name (Asset_ID)</th>
                  <th class="px-6 py-4">Quantity</th>
                  <th class="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="border-border-light dark:border-slate-700 divide-y divide-gray-100 dark:divide-gray-800">
                {isLoading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-text-muted-light dark:text-slate-300">
                      Loading recent requests...
                    </td>
                  </tr>
                ) : activities.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-text-muted-light dark:text-slate-300">
                      No recent requests found.
                    </td>
                  </tr>
                ) : (
                  activities.map(req => {
                    const { statusColor, statusLabel } = getStatusStyleAndLabel(req);
                    return (
                      <tr key={req.request_id} className="hover:bg-background-light/50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-text-main-light dark:text-text-main-dark">
                          #{req.request_id}
                        </td>
                        <td className="px-6 py-4 font-medium text-text-main-light dark:text-text-main-dark">
                          {req.asset_name || "Unknown"} ({req.asset_id || "-"})
                        </td>
                        <td className="px-6 py-4 font-medium text-text-main-light dark:text-text-main-dark">
                          QTY: {req.quantity || 1}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="mt-8 text-center text-xs text-text-muted-light dark:text-slate-300 pb-4">
        &copy; 2026 AAI Hardware Maintenance System. All rights reserved.
      </div>
    </Layout>
  );
}
