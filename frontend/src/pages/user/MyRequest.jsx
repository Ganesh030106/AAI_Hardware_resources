import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';

export default function MyRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [allRequests, setAllRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchVal, setSearchVal] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const itemsPerPage = 5;

  useEffect(() => {
    if (!user || !user.emp_id) {
      navigate('/html/UserLogin.html');
      return;
    }

    const fetchRequests = async () => {
      try {
        const response = await fetch(`/api/tickets/user/${user.emp_id}`);
        if (response.ok) {
          const data = await response.json();
          setAllRequests(data);
        }
      } catch (err) {
        console.error("Error loading tickets", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, [user, navigate]);

  // Handle local searching & filtering
  useEffect(() => {
    const q = searchVal.toLowerCase();
    const filtered = allRequests.filter(req => {
      const matchesSearch = 
        (req.asset_id && req.asset_id.toLowerCase().includes(q)) ||
        (req.asset_name && req.asset_name.toLowerCase().includes(q)) ||
        (req.request_id && String(req.request_id).toLowerCase().includes(q));
      
      const matchesStatus = statusFilter === "All" || req.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    setFilteredRequests(filtered);
    setCurrentPage(1);
  }, [allRequests, searchVal, statusFilter]);

  const totalItems = filteredRequests.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedData = filteredRequests.slice(startIndex, startIndex + itemsPerPage);

  const changePage = (direction) => {
    setCurrentPage(prev => Math.min(Math.max(prev + direction, 1), totalPages));
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Page title header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined align-middle text-[28px]">assignment</span>
              Hardware Requests
            </h1>
            <p className="text-text-muted-light dark:text-text-muted-dark text-sm mt-1">
              Track and manage your New Hardware requests and orders.
            </p>
          </div>
          <Link to="/html/user_request.html">
            <button className="animated-btn glow-blue-600 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-lg shadow-blue-600/25 transition-all font-bold text-sm dark:bg-blue-600 dark:hover:bg-blue-700 dark:shadow-blue-800/50">
              <span className="material-symbols-outlined text-[20px]">add</span>
              New Request
            </button>
          </Link>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-card-light dark:bg-card-dark p-4 rounded-xl border border-border-light dark:border-border-dark shadow-sm">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-light dark:text-white">search</span>
              <input
                id="search-input"
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-slate-700 text-text-main-light dark:text-text-main-dark focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm transition-all placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark focus:outline-none"
                placeholder="Search by Asset Name or Asset ID"
              />
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 md:pb-0">
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-3 pr-10 py-2.5 rounded-lg border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark dark:bg-slate-700 text-text-main-light dark:text-text-main-dark text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 cursor-pointer min-w-[140px] focus:outline-none"
              >
                <option value="All">All Status</option>
                <option value="Allocated">Allocated</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background-light dark:bg-slate-800 border-b border-border-light dark:border-border-dark">
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-text-main-light dark:text-text-main-dark">Request ID</th>
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-text-main-light dark:text-text-main-dark">Asset(Asset_ID)</th>
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-text-main-light dark:text-text-main-dark">Quantity</th>
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-text-main-light dark:text-text-main-dark">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-border-dark">
                {isLoading ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <div className="loader"></div>
                        <span className="text-sm text-text-muted-light dark:text-text-muted-dark">Loading requests...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-text-muted-light dark:text-text-muted-dark">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((req) => {
                    let statusClass = "bg-gray-100 text-gray-800";
                    if (req.status === "Allocated") statusClass = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500";
                    if (req.status === "Rejected") statusClass = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500";

                    const assetLabel = req.asset_name ? `${req.asset_name} (${req.asset_id || "ID"})` : (req.asset_id || "Hardware");

                    return (
                      <tr key={req.request_id} className="group hover:bg-background-light/50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="py-4 px-6">
                          <span className="font-medium text-text-main-light dark:text-text-main-dark">#{req.request_id}</span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center flex-none">
                              <span className="material-symbols-outlined text-[18px]">devices</span>
                            </div>
                            <span className="text-sm font-medium text-text-main-light dark:text-text-main-dark">{assetLabel}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-text-main-light dark:text-text-main-dark text-sm">
                          {req.quantity ?? 1}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusClass}`}>
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Navigation */}
          <div className="px-6 py-4 border-t border-border-light dark:border-border-dark flex items-center justify-between">
            <div className="text-sm text-text-muted-light dark:text-text-muted-dark">
              Total Requests: <span className="font-bold text-text-main-light dark:text-text-main-dark">{totalItems}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => changePage(-1)}
                disabled={safeCurrentPage === 1}
                className="p-2 rounded-lg border border-border-light dark:border-border-dark dark:bg-slate-700 text-text-muted-light dark:text-text-muted-dark hover:bg-background-light dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <span className="text-sm font-medium px-2">Page {safeCurrentPage} of {totalPages}</span>
              <button
                onClick={() => changePage(1)}
                disabled={safeCurrentPage === totalPages}
                className="p-2 rounded-lg border border-border-light dark:border-border-dark dark:bg-slate-700 text-text-muted-light dark:text-text-muted-dark hover:bg-background-light dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

      </div>
      <div className="mt-8 text-center text-xs text-text-muted-light dark:text-text-muted-dark pb-4">
        &copy; 2026 AAI Hardware Maintenance System. All rights reserved.
      </div>
    </Layout>
  );
}
