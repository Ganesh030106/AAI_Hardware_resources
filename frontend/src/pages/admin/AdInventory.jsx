import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Layout from '../../components/Layout';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export default function AdInventory() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [itemsList, setItemsList] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 5;

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterItem, setFilterItem] = useState('All');
  const [filterSupplier, setFilterSupplier] = useState('All');

  // Dropdown states
  const [isItemOpen, setIsItemOpen] = useState(false);
  const [isSupplierOpen, setIsSupplierOpen] = useState(false);
  const [availableItems, setAvailableItems] = useState([]);
  const [availableSuppliers, setAvailableSuppliers] = useState([]);

  // Modals
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');

  // Refs
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Auth Guard
  useEffect(() => {
    if (!user || (user.role || '').toLowerCase() !== 'admin') {
      navigate('/html/AdminLogin.html');
    }
  }, [user, navigate]);

  // Load Dropdown Options
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await fetch('/api/inventory/filter-options');
        if (res.ok) {
          const data = await res.json();
          setAvailableItems(data.items || []);
          setAvailableSuppliers(data.suppliers || []);
        }
      } catch (err) {
        console.error('Error loading filter options', err);
      }
    };
    fetchFilters();
  }, []);

  // Fetch Inventory Data
  const loadInventory = async (page = 1) => {
    try {
      setCurrentPage(page);
      const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: searchTerm.trim(),
        item: filterItem,
        supplier: filterSupplier
      });

      const response = await fetch(`/api/inventory?${query.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setItemsList(data.items || []);
        setTotal(data.total || 0);

        // Render stock bar chart
        if (chartRef.current && (data.items || []).length > 0) {
          const labels = (data.items || []).map(i => `${i.name} - ${i.model}`);
          const stocks = (data.items || []).map(i => i.stock);
          const colors = [
            "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
            "#06B6D4", "#EC4899", "#22C55E", "#F97316", "#6366F1"
          ];
          const barColors = labels.map((_, idx) => colors[idx % colors.length]);

          if (chartInstance.current) {
            chartInstance.current.destroy();
          }

          const isDark = document.documentElement.classList.contains('dark');
          const textColor = isDark ? '#94a3b8' : '#64748b';
          const gridColor = isDark ? '#334155' : '#e2e8f0';

          chartInstance.current = new Chart(chartRef.current, {
            type: "bar",
            data: {
              labels,
              datasets: [{
                label: "Units",
                data: stocks,
                backgroundColor: barColors,
                borderRadius: 8,
                borderSkipped: false,
                barPercentage: 0.6,
                categoryPercentage: 0.7
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: true, labels: { color: textColor } },
                tooltip: {
                  callbacks: { label: ctx => `${ctx.parsed.y} units` }
                }
              },
              scales: {
                x: {
                  grid: { display: false },
                  ticks: {
                    color: textColor,
                    autoSkip: false,
                    maxRotation: 30,
                    minRotation: 30
                  }
                },
                y: {
                  beginAtZero: true,
                  grid: { color: gridColor },
                  ticks: { color: textColor, stepSize: 1 }
                }
              }
            }
          });
        }
      }
    } catch (error) {
      console.error("Error loading inventory:", error);
    }
  };

  // Trigger load on search/filter/page change
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      loadInventory(1);
    }, 300); // Debounce search changes

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, filterItem, filterSupplier]);

  useEffect(() => {
    if (chartInstance.current) {
      const isDark = theme === 'dark';
      const textColor = isDark ? '#94a3b8' : '#64748b';
      const gridColor = isDark ? '#334155' : '#e2e8f0';

      chartInstance.current.options.plugins.legend.labels.color = textColor;
      chartInstance.current.options.scales.x.ticks.color = textColor;
      chartInstance.current.options.scales.y.ticks.color = textColor;
      chartInstance.current.options.scales.y.grid.color = gridColor;
      chartInstance.current.update();
    }
  }, [theme]);

  const changePage = (dir) => {
    const newPage = currentPage + dir;
    if (newPage > 0) {
      loadInventory(newPage);
    }
  };

  // Perform Export Function
  const handleExport = async () => {
    try {
      const query = new URLSearchParams({
        item: filterItem,
        supplier: filterSupplier,
        search: searchTerm.trim(),
        format: exportFormat
      });

      const response = await fetch(`/api/inventory/export?${query.toString()}`);
      if (!response.ok) throw new Error("Failed to export data");

      if (exportFormat === "pdf") {
        const data = await response.json();
        exportInventoryToPDF(data.items, data.filters);
        setIsExportOpen(false);
        return;
      }

      // Handle download of CSV/Excel
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const ext = exportFormat === "excel" ? "xls" : exportFormat;

      const a = document.createElement("a");
      a.href = url;
      a.download = `inventory_export_${dateStr}.${ext}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setIsExportOpen(false);
      alert("Export completed successfully!");
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export data. Please try again.");
    }
  };

  const exportInventoryToPDF = (items, filters) => {
    const w = window.open('', '_blank');
    if (!w) {
      alert('Please allow popups to preview PDF.');
      return;
    }

    const filterText = `Item: ${filters.item || 'All'} | Supplier: ${filters.supplier || 'All'}${filters.search ? ' | Search: ' + filters.search : ''}`;

    let html = `<!doctype html><html><head><title>Inventory Export Report</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; }
                    h1 { color: #135bec; margin-bottom: 10px; }
                    .meta { color: #666; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                    th { background: #135bec; color: white; font-weight: 600; }
                    tr:nth-child(even) { background: #f9f9f9; }
                    .footer { margin-top: 30px; text-align: right; color: #666; font-size: 14px; }
                    @media print {
                        .no-print { display: none; }
                    }
                </style>
            </head><body>
                <h1>Inventory Export Report</h1>
                <div class="meta">
                    <p><strong>Filters:</strong> ${filterText}</p>
                    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
                    <p><strong>Total Items:</strong> ${items.length}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Item Name</th>
                            <th>Model</th>
                            <th>Stock Level</th>
                            <th>Supplier</th>
                        </tr>
                    </thead>
                    <tbody>`;

    items.forEach(item => {
      html += `<tr>
                    <td>${item.name}</td>
                    <td>${item.model}</td>
                    <td>${item.stock} units</td>
                    <td>${item.seller}</td>
                </tr>`;
    });

    html += `</tbody></table>
                <div class="footer">
                    AAI Hardware - Inventory Management System
                </div>
            </body></html>`;

    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  const startIdx = total > 0 ? (currentPage - 1) * limit + 1 : 0;
  const endIdx = Math.min(currentPage * limit, total);
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <Layout>
      <div className="flex-1 w-full max-w-[1440px] mx-auto bg-slate-100 dark:bg-slate-900 p-6 lg:p-10 flex flex-col gap-6 rounded-2xl">
        
        {/* Title row */}
        <div className="flex flex-col md:flex-row flex-wrap justify-between gap-4 items-start md:items-center">
          <div className="flex flex-col gap-1">
            <h1 className="text-[#0d121b] dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 align-middle text-[30px]">inventory_2</span>
              Inventory Management
            </h1>
            <p className="text-slate-500 dark:text-base font-normal leading-normal dark:text-slate-400">
              Manage inventory items across all Suppliers.
            </p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Link to="/html/Ad-prediction.html">
              <button className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold mb-2 w-full flex items-center gap-2 justify-center">
                <span className="material-symbols-outlined align-middle text-[20px]">trending_up</span>
                Show Demand Prediction
              </button>
            </Link>
          </div>
          <Link to="/html/Ad_n_request.html">
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-sm transition-all active:scale-95">
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span>Add New Item</span>
            </button>
          </Link>
        </div>

        {/* Stock Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-2">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow">
            <h3 className="font-semibold mb-2">Stock by Item</h3>
            <div className="h-[280px] w-full relative">
              <canvas ref={chartRef} />
            </div>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-col lg:flex-row justify-between gap-4 p-1">
          <div className="flex-1 max-w-lg">
            <label className="flex w-full items-center rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 h-11 px-3 shadow-sm focus-within:ring-2 focus-within:ring-blue-600/20 focus-within:border-blue-600 transition-all">
              <span className="material-symbols-outlined text-slate-400 text-[22px]">search</span>
              <input
                id="inventory-search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent border-none text-sm text-[#0d121b] dark:text-white placeholder:text-slate-400 focus:ring-0 focus:outline-none pl-2"
                placeholder="Search by item name, model, or supplier"
              />
            </label>
          </div>

          <div className="flex gap-3">
            {/* Item Dropdown */}
            <div className="relative">
              <button
                id="itemBtn"
                onClick={() => { setIsItemOpen(prev => !prev); setIsSupplierOpen(false); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm focus:outline-none"
              >
                <span className="material-symbols-outlined text-[18px]">category</span>
                <span id="itemLabel">Item: {filterItem}</span>
                <span className="material-symbols-outlined text-[18px]">expand_more</span>
              </button>
              {isItemOpen && (
                <div className="absolute top-full mt-2 right-0 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                  <p 
                    onClick={() => { setFilterItem('All'); setIsItemOpen(false); }}
                    className="dropdown-item px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-sm"
                  >
                    All
                  </p>
                  {availableItems.map(item => (
                    <p
                      key={item}
                      onClick={() => { setFilterItem(item); setIsItemOpen(false); }}
                      className="dropdown-item px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-sm"
                    >
                      {item}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Supplier Dropdown */}
            <div className="relative">
              <button
                id="supplierBtn"
                onClick={() => { setIsSupplierOpen(prev => !prev); setIsItemOpen(false); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm focus:outline-none"
              >
                <span className="material-symbols-outlined text-[18px]">store</span>
                <span id="supplierLabel">Supplier: {filterSupplier}</span>
                <span className="material-symbols-outlined text-[18px]">expand_more</span>
              </button>
              {isSupplierOpen && (
                <div className="absolute top-full mt-2 right-0 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                  <p
                    onClick={() => { setFilterSupplier('All'); setIsSupplierOpen(false); }}
                    className="dropdown-item px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-sm"
                  >
                    All
                  </p>
                  {availableSuppliers.map(supplier => (
                    <p
                      key={supplier}
                      onClick={() => { setFilterSupplier(supplier); setIsSupplierOpen(false); }}
                      className="dropdown-item px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-sm"
                    >
                      {supplier}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Export Trigger */}
            <button
              onClick={() => setIsExportOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all shadow-sm animated-btn dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4 text-xs font-semibold text-slate-500 dark:text-white uppercase tracking-wider">Item Name</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 dark:text-white uppercase tracking-wider">Brand - SKU Model</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 dark:text-white uppercase tracking-wider min-w-[140px]">Stock Level</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 dark:text-white uppercase tracking-wider">Supplier</th>
                </tr>
              </thead>
              <tbody id="inventory-table-body" className="divide-y divide-slate-100 dark:divide-slate-800">
                {itemsList.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-slate-500 dark:text-slate-400">No items found in inventory.</td>
                  </tr>
                ) : (
                  itemsList.map((item, idx) => (
                    <tr key={item._id || idx} className="group hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-4">
                        <span className="text-sm text-[#0d121b] dark:text-white font-semibold">{item.name}</span>
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-400 font-mono">{item.model}</td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{item.stock || 0} units</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{item.seller}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table footer Pagination */}
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/30">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Showing <span id="start-index" className="font-medium text-[#0d121b] dark:text-white">{startIdx}</span>-
              <span id="end-index" className="font-medium text-[#0d121b] dark:text-white">{endIdx}</span> of{' '}
              <span id="total-results" className="font-medium text-[#0d121b] dark:text-white">{total}</span> items
            </div>
            <div className="flex gap-2">
              <button
                id="prev-btn"
                onClick={() => changePage(-1)}
                disabled={currentPage <= 1}
                className="flex h-8 items-center justify-center rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                id="next-btn"
                onClick={() => changePage(1)}
                disabled={currentPage >= totalPages}
                className="flex h-8 items-center justify-center rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Export Dialog Modal */}
      {isExportOpen && (
        <div 
          id="exportModal" 
          onClick={(e) => { if (e.target.id === 'exportModal') setIsExportOpen(false); }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <div className="relative w-full max-w-lg max-h-screen overflow-y-auto transform rounded-2xl bg-white dark:bg-slate-900 p-8 text-left shadow-2xl ring-1 ring-black/5 transition-all">
            <button 
              onClick={() => setIsExportOpen(false)}
              className="absolute top-4 right-4 rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-600/10 p-2 rounded-lg text-blue-600">
                  <span className="material-symbols-outlined">download</span>
                </div>
                <h3 className="text-xl font-bold text-[#0d121b] dark:text-white">Export Inventory</h3>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 ml-11">
                Export inventory data with selected filters and format.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <span className="block text-sm font-semibold text-[#0d121b] dark:text-white mb-3">Export Format</span>
                <div className="grid grid-cols-3 gap-3">
                  
                  {/* CSV Option */}
                  <label className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all ${exportFormat === 'csv' ? 'border-blue-600 bg-blue-600/5 text-blue-600' : 'border-slate-200 dark:border-slate-700'}`}>
                    <input 
                      type="radio" 
                      name="exportFormat" 
                      value="csv" 
                      checked={exportFormat === 'csv'}
                      onChange={() => setExportFormat('csv')}
                      className="hidden" 
                    />
                    <span className="material-symbols-outlined text-2xl text-blue-500">description</span>
                    <span className="text-xs font-medium">CSV</span>
                  </label>

                  {/* Excel Option */}
                  <label className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all ${exportFormat === 'excel' ? 'border-blue-600 bg-blue-600/5 text-blue-600' : 'border-slate-200 dark:border-slate-700'}`}>
                    <input 
                      type="radio" 
                      name="exportFormat" 
                      value="excel" 
                      checked={exportFormat === 'excel'}
                      onChange={() => setExportFormat('excel')}
                      className="hidden" 
                    />
                    <span className="material-symbols-outlined text-2xl text-green-600">table_view</span>
                    <span className="text-xs font-medium">Excel</span>
                  </label>

                  {/* PDF Option */}
                  <label className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all ${exportFormat === 'pdf' ? 'border-blue-600 bg-blue-600/5 text-blue-600' : 'border-slate-200 dark:border-slate-700'}`}>
                    <input 
                      type="radio" 
                      name="exportFormat" 
                      value="pdf" 
                      checked={exportFormat === 'pdf'}
                      onChange={() => setExportFormat('pdf')}
                      className="hidden" 
                    />
                    <span className="material-symbols-outlined text-2xl text-red-500">picture_as_pdf</span>
                    <span className="text-xs font-medium">PDF</span>
                  </label>

                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
              <button 
                onClick={() => setIsExportOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-[#0d121b] dark:text-slate-400 dark:hover:text-white transition-colors focus:outline-none"
              >
                Cancel
              </button>
              <button 
                id="exportBtn" 
                onClick={handleExport}
                className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 focus:outline-none"
              >
                <span className="material-symbols-outlined text-[18px]">export_notes</span>
                Export
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 text-center text-xs text-text-muted-light dark:text-text-muted-dark pb-4">
        &copy; 2026 AAI Hardware Maintenance System. All rights reserved.
      </div>
    </Layout>
  );
}
