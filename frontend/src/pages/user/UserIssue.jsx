import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';

export default function UserIssue() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [allRequests, setAllRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentFilter, setCurrentFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Details Modal and comments states
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  const commentsEndRef = useRef(null);

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (selectedIssue) {
      scrollToBottom();
    }
  }, [comments]);

  const itemsPerPage = 5;

  const fetchComments = async (issueId) => {
    try {
      const response = await fetch(`/api/issues/${issueId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data || []);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  useEffect(() => {
    if (selectedIssue) {
      const issueId = selectedIssue.request_id;
      fetchComments(issueId);
      const interval = setInterval(() => {
        fetchComments(issueId);
      }, 5000); // 5 seconds polling window
      return () => clearInterval(interval);
    } else {
      setComments([]);
    }
  }, [selectedIssue]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedIssue) return;
    setIsPostingComment(true);
    try {
      const response = await fetch(`/api/issues/${selectedIssue.request_id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author_id: user.emp_id,
          author_name: user.name || user.username || 'Employee',
          author_role: 'Employee',
          comment: newCommentText.trim()
        })
      });
      if (response.ok) {
        setNewCommentText('');
        fetchComments(selectedIssue.request_id);
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setIsPostingComment(false);
    }
  };

  const fetchRequests = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const response = await fetch(`/api/issue-requests/user/${user.emp_id}`);
      if (!response.ok) throw new Error("Fetch failed");
      const data = await response.json();
      setAllRequests(data);
    } catch (error) {
      console.error("Error fetching issue data:", error);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchRequests(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (!user || !user.emp_id) {
      navigate('/html/UserLogin.html');
      return;
    }

    fetchRequests(true);

    const interval = setInterval(() => {
      fetchRequests(false);
    }, 10000); // Auto-refresh list every 10 seconds

    return () => clearInterval(interval);
  }, [user, navigate]);

  // Handle filtering
  useEffect(() => {
    const filtered = allRequests.filter(req => {
      const derivedStatus = req.technician_status === 'Resolved' ? 'Completed' : 'Pending';
      return currentFilter === 'All' || derivedStatus === currentFilter;
    });
    setFilteredRequests(filtered);
    setCurrentPage(1); // Reset page on filter change
  }, [allRequests, currentFilter]);

  const total = filteredRequests.length;
  const totalPages = Math.ceil(total / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

  const startIdx = (safeCurrentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const pageData = filteredRequests.slice(startIdx, endIdx);

  const changePage = (dir) => {
    setCurrentPage(prev => Math.min(Math.max(prev + dir, 1), totalPages));
  };

  return (
    <Layout>
      <main className="flex-1 flex flex-col items-center py-8 px-4 sm:px-10 lg:px-40 gap-8 w-full max-w-[1440px] mx-auto overflow-y-auto">
        
        {/* Banner Section */}
        <section className="w-full max-w-[960px] flex flex-col gap-6">
          <div className="flex flex-col gap-2 text-center items-center">
            <h1 className="text-[#0d121b] dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] flex items-center gap-2">
              <span className="material-symbols-outlined align-middle text-[36px] md:text-[48px]">build</span>
              Maintenance Requests
            </h1>
            <p className="text-[#4c669a] dark:text-gray-400 text-base font-normal leading-normal max-w-2xl">
              Monitor and manage your hardware Maintenance Requests with ease.
            </p>
          </div>
        </section>

        {/* Requests Table Box */}
        <section className="w-full flex flex-col gap-6">
          <div className="bg-white dark:bg-[#1a202c] rounded-xl shadow-sm border border-[#e7ebf3] dark:border-[#2a3441] overflow-hidden flex flex-col">
            
            {/* Table Header Filter */}
            <div className="px-6 py-4 border-b border-[#e7ebf3] dark:border-[#2a3441] flex flex-wrap items-center justify-between gap-4 bg-[#f8f9fc] dark:bg-[#1f2937]/50">
              <h3 className="text-lg font-bold text-[#0d121b] dark:text-white">Maintenance Requests</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="animated-btn p-2 rounded-lg bg-white dark:bg-[#2d3748] border border-[#e7ebf3] dark:border-[#4a5568] text-[#4c669a] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm flex items-center justify-center cursor-pointer"
                  title="Refresh Data"
                >
                  <span className={`material-symbols-outlined text-[18px] ${isRefreshing ? 'animate-spin' : ''}`}>
                    sync
                  </span>
                </button>
                <select
                  id="status-filter"
                  value={currentFilter}
                  onChange={(e) => setCurrentFilter(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-[#2d3748] border border-[#e7ebf3] dark:border-[#4a5568] rounded-lg text-sm font-medium text-[#4c669a] dark:text-gray-300 hover:text-blue-600 dark:hover:text-white transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Table Grid */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#e7ebf3] dark:border-[#2a3441] text-xs font-semibold text-[#4c669a] dark:text-gray-400 uppercase tracking-wider bg-[#f8f9fc] dark:bg-[#1f2937]">
                    <th className="px-6 py-4">Asset</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Issue</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Priority</th>
                    <th className="px-6 py-4">Technician</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e7ebf3] dark:divide-[#2a3441] text-sm text-[#0d121b] dark:text-white">
                  {isLoading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <div className="loader"></div>
                          <span className="text-sm text-[#4c669a]">Loading tracking data...</span>
                        </div>
                      </td>
                    </tr>
                  ) : pageData.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-text-muted-light">
                        No records found.
                      </td>
                    </tr>
                  ) : (
                    pageData.map((req, i) => {
                      const derivedStatus = req.technician_status === 'Resolved' ? 'Completed' : 'Pending';

                      let statusClass = "bg-gray-100 text-gray-700";
                      let statusDot = "bg-gray-500";
                      if (derivedStatus === 'Completed') {
                        statusClass = "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
                        statusDot = "bg-green-600";
                      } else if (derivedStatus === 'Pending') {
                        statusClass = "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300";
                        statusDot = "bg-yellow-600";
                      }

                      const assetLabel = req.asset_name ? `${req.asset_name} (${req.asset_id || "ID"})` : (req.asset_id || "Hardware");
                      const category = req.category || "Others";
                      const issue = req.issue || "Others Hardware Issue";
                      const description = req.description || req.issue_description || "No description provided.";
                      const priority = req.priority ?? 'Pending';

                      const techStatus = req.technician_status || 'Unassigned';
                      let techStatusClass = "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
                      let techStatusDot = "bg-gray-500";
                      if (techStatus === 'assigned') {
                        techStatusClass = "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
                        techStatusDot = "bg-blue-600";
                      } else if (techStatus === 'In Progress') {
                        techStatusClass = "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300";
                        techStatusDot = "bg-yellow-600";
                      } else if (techStatus === 'Resolved') {
                        techStatusClass = "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
                        techStatusDot = "bg-green-600";
                      }

                      return (
                        <tr 
                          key={req.request_id || i} 
                          className="hover:bg-[#f1f5f9] dark:hover:bg-[#2d3748] cursor-pointer transition-colors"
                          onClick={() => setSelectedIssue(req)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-medium">{assetLabel}</span>
                              <span className="text-xs text-[#4c669a] dark:text-gray-400">Hardware Request</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-[#0d121b] dark:text-white">{category}</td>
                          <td className="px-6 py-4 text-[#4c669a] dark:text-gray-300">{issue}</td>
                          <td className="px-6 py-4 text-[#0d121b] dark:text-white">{description}</td>
                          <td className="px-6 py-4">
                            <span className={`text-sm font-medium ${priority === 'High' ? 'text-red-500' : priority === 'Medium' ? 'text-orange-500' : priority === 'Low' ? 'text-green-600' : 'text-[#9ca3af]'}`}>
                              {priority}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${techStatusClass} border border-transparent`}>
                              <span className={`size-1.5 rounded-full ${techStatusDot}`}></span>
                              {techStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusClass} border border-transparent`}>
                              <span className={`size-1.5 rounded-full ${statusDot}`}></span>
                              {derivedStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-6 py-4 border-t border-[#e7ebf3] dark:border-[#2a3441] flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#1a202c]">
              <span className="text-sm text-[#4c669a] dark:text-gray-400">
                Showing <span id="page-start" className="font-bold text-[#0d121b] dark:text-white">{total > 0 ? startIdx + 1 : 0}</span> to <span id="page-end" className="font-bold text-[#0d121b] dark:text-white">{Math.min(endIdx, total)}</span> of <span id="total-items" className="font-bold text-[#0d121b] dark:text-white">{total}</span> requests
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => changePage(-1)}
                  disabled={safeCurrentPage === 1}
                  id="prev-btn"
                  className="size-8 flex items-center justify-center rounded-lg border border-[#e7ebf3] dark:border-[#2a3441] text-[#9ca3af] hover:bg-[#f8f9fc] dark:hover:bg-[#2d3748] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <span id="current-page-num" className="text-sm font-bold text-blue-600 px-2">{safeCurrentPage}</span>
                <button
                  onClick={() => changePage(1)}
                  disabled={safeCurrentPage === totalPages}
                  id="next-btn"
                  className="size-8 flex items-center justify-center rounded-lg border border-[#e7ebf3] dark:border-[#2a3441] text-[#4c669a] dark:text-gray-300 hover:bg-[#f8f9fc] dark:hover:bg-[#2d3748] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* DETAILS & COMMENTS MODAL */}
        {selectedIssue && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
            <div className="bg-white dark:bg-[#1a202c] rounded-2xl shadow-xl w-full max-w-2xl border border-gray-200 dark:border-[#2a3441] overflow-hidden flex flex-col max-h-[90vh] mx-4 relative animate-scaleIn">
              
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-gray-200 dark:border-[#2a3441] flex items-center justify-between bg-gray-50 dark:bg-[#1f2937]/50">
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">info</span>
                    Ticket Details &amp; Activity Log
                  </h3>
                  <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-1">ID: #{selectedIssue.request_id}</p>
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
                    <span className="text-xs text-[#4c669a] dark:text-gray-400 uppercase tracking-wider font-bold">Technician Status</span>
                    <div className="mt-1">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        selectedIssue.technician_status === 'Resolved' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                        selectedIssue.technician_status === 'In Progress' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' :
                        selectedIssue.technician_status === 'assigned' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {selectedIssue.technician_status || 'Unassigned'}
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700/50">
                    <span className="text-xs text-[#4c669a] dark:text-gray-400 uppercase tracking-wider font-bold">Ticket Priority</span>
                    <div className={`mt-1 text-sm font-bold ${
                      selectedIssue.priority === 'High' ? 'text-red-500' :
                      selectedIssue.priority === 'Medium' ? 'text-orange-500' :
                      selectedIssue.priority === 'Low' ? 'text-green-600' : 'text-[#9ca3af]'
                    }`}>
                      {selectedIssue.priority}
                    </div>
                  </div>
                </div>

                {/* Reporter / Asset Description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Assigned Technician</h4>
                    <p className="mt-1 text-base font-bold text-gray-900 dark:text-white">{selectedIssue.technician_name || "Unassigned"}</p>
                    <p className="text-xs text-[#4c669a] dark:text-gray-400">Queue assignment status: {selectedIssue.technician_status || "Unassigned"}</p>
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
                    {selectedIssue.description || "No detailed description provided."}
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
                      placeholder="Ask technician for updates or leave a note..."
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
              <div className="px-6 py-4 border-t border-gray-200 dark:border-[#2a3441] bg-gray-50 dark:bg-[#1f2937]/50 flex justify-end">
                <button
                  onClick={() => setSelectedIssue(null)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  Close
                </button>
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
