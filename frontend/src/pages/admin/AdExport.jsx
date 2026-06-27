import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdExport() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dateRange, setDateRange] = useState('All Tickets');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [format, setFormat] = useState('pdf');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!user || (user.role || '').toLowerCase() !== 'admin') {
      navigate('/html/AdminLogin.html');
      return;
    }
  }, [user, navigate]);

  const getDateRangeParams = () => {
    const today = new Date();
    let computedFrom, computedTo = new Date();

    if (dateRange === 'Custom Range') {
      if (!fromDate || !toDate) {
        alert('Please select both From and To dates.');
        return null;
      }
      return { from: fromDate, to: toDate, label: `${fromDate} to ${toDate}` };
    }

    if (dateRange === 'All Issues' || dateRange === 'All Tickets') {
      return { from: null, to: null, label: 'All' };
    }

    switch (dateRange) {
      case 'Last 7 Days':
        computedFrom = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'Last 30 Days':
        computedFrom = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'This Month':
        computedFrom = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'Last Quarter':
        computedFrom = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        computedFrom = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    return {
      from: computedFrom.toISOString().split('T')[0],
      to: computedTo.toISOString().split('T')[0],
      label: dateRange
    };
  };

  const toCSV = (headers, rows) => {
    const escape = v => '"' + String(v).replace(/"/g, '""') + '"';
    const lines = [headers.map(escape).join(',')];
    rows.forEach(r => lines.push(r.map(escape).join(',')));
    return lines.join('\n');
  };

  const downloadFile = (filename, content, mime) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const exportToPDF = (headers, rows, rangeInfo) => {
    const w = window.open('', '_blank');
    if (!w) {
      alert('Please allow popups.');
      return;
    }

    const html = `<!doctype html><html><head><title>Hardware Request Report</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; }
                    h1 { color: #135bec; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background: #135bec; color: white; }
                    tr:nth-child(even) { background: #f9f9f9; }
                </style>
            </head><body>
                <h1>Hardware Request Export Report</h1>
                <p>Range: ${rangeInfo.label} | Generated: ${new Date().toLocaleDateString()}</p>
                <table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
                <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
                </table>
            </body></html>`;

    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  const handleExport = async () => {
    const rangeInfo = getDateRangeParams();
    if (!rangeInfo) return;

    setIsExporting(true);

    try {
      let url = '/api/export/data';
      if (rangeInfo.from && rangeInfo.to) {
        url += `?from=${rangeInfo.from}&to=${rangeInfo.to}`;
      }

      const response = await fetch(url);
      const result = await response.json();

      if (!result.success) {
        alert('Server error while fetching export data.');
        setIsExporting(false);
        return;
      }

      const headers = ['Request ID', 'Employee ID', 'Employee Name', 'Department', 'Asset ID', 'Asset Name', 'Quantity', 'Status', 'Date'];
      const rows = result.data.map(req => [
        req.request_id,
        req.emp_id,
        req.emp_name,
        req.emp_dept,
        req.asset_id,
        req.asset_name,
        req.quantity,
        req.status,
        req.order_date
      ]);

      const timestamp = new Date().toISOString().slice(0, 10);

      if (format === 'csv') {
        const csv = toCSV(headers, rows);
        downloadFile(`hardware_request_report_${timestamp}.csv`, csv, 'text/csv;charset=utf-8;');
        alert(rows.length ? `✓ CSV exported (${rows.length} records)` : '✓ CSV exported (no records, headers only)');
      } else if (format === 'excel') {
        const csv = toCSV(headers, rows);
        downloadFile(`hardware_request_report_${timestamp}.xls`, csv, 'application/vnd.ms-excel');
        alert(rows.length ? `✓ Excel exported (${rows.length} records)` : '✓ Excel exported (no records, headers only)');
      } else if (format === 'pdf') {
        exportToPDF(headers, rows, rangeInfo);
        alert(rows.length ? `✓ PDF ready (${rows.length} records)` : '✓ PDF ready (no records, headers only)');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Error: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 dark:bg-slate-950/70 backdrop-blur-sm">
      
      {/* Export Modal Content */}
      <div className="relative w-full max-w-lg max-h-screen overflow-y-auto transform rounded-2xl bg-white dark:bg-slate-900 p-8 text-left shadow-2xl ring-1 ring-black/5 transition-all">
        
        {/* Close button */}
        <button 
          onClick={() => navigate('/html/Ad-dash.html')}
          className="absolute top-4 right-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-600/10 p-2 rounded-lg text-blue-600">
              <span className="material-symbols-outlined">download</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Export Report</h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 ml-11">
            Select date range and format to export hardware request data.
          </p>
        </div>

        <div className="space-y-6">
          
          {/* Date Range Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Date Range
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined text-[18px]">
                calendar_month
              </span>
              <select 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm py-2.5 pl-10 pr-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none"
              >
                <option value="All Tickets">All Tickets</option>
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="Last 30 Days">Last 30 Days</option>
                <option value="This Month">This Month</option>
                <option value="Last Quarter">Last Quarter</option>
                <option value="Custom Range">Custom Range</option>
              </select>
            </div>
          </div>

          {/* Custom Dates */}
          {dateRange === 'Custom Range' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  From Date
                </label>
                <input 
                  type="date" 
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm py-2 px-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  To Date
                </label>
                <input 
                  type="date" 
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm py-2 px-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none" 
                />
              </div>
            </div>
          )}

          {/* Export Format Options */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Export Format
            </label>
            <div className="grid grid-cols-3 gap-3">
              <label 
                className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all ${
                  format === 'pdf' 
                    ? 'border-blue-600 bg-blue-50/20 dark:bg-blue-950/20 text-blue-600' 
                    : 'border-gray-200 dark:border-gray-700 text-gray-950 dark:text-gray-300'
                }`}
              >
                <input 
                  type="radio" 
                  name="format" 
                  value="pdf" 
                  checked={format === 'pdf'}
                  onChange={() => setFormat('pdf')}
                  className="hidden" 
                />
                <span className="material-symbols-outlined text-2xl text-red-500">picture_as_pdf</span>
                <span className="text-xs font-medium">PDF</span>
              </label>

              <label 
                className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all ${
                  format === 'excel' 
                    ? 'border-blue-600 bg-blue-50/20 dark:bg-blue-950/20 text-blue-600' 
                    : 'border-gray-200 dark:border-gray-700 text-gray-950 dark:text-gray-300'
                }`}
              >
                <input 
                  type="radio" 
                  name="format" 
                  value="excel" 
                  checked={format === 'excel'}
                  onChange={() => setFormat('excel')}
                  className="hidden" 
                />
                <span className="material-symbols-outlined text-2xl text-green-600">table_view</span>
                <span className="text-xs font-medium">Excel</span>
              </label>

              <label 
                className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all ${
                  format === 'csv' 
                    ? 'border-blue-600 bg-blue-50/20 dark:bg-blue-950/20 text-blue-600' 
                    : 'border-gray-200 dark:border-gray-700 text-gray-950 dark:text-gray-300'
                }`}
              >
                <input 
                  type="radio" 
                  name="format" 
                  value="csv" 
                  checked={format === 'csv'}
                  onChange={() => setFormat('csv')}
                  className="hidden" 
                />
                <span className="material-symbols-outlined text-2xl text-blue-500">description</span>
                <span className="text-xs font-medium">CSV</span>
              </label>
            </div>
          </div>

        </div>

        {/* Modal Actions */}
        <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-800">
          <button 
            onClick={() => navigate('/html/Ad-dash.html')}
            className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isExporting ? 'hourglass_bottom' : 'export_notes'}
            </span>
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>

        {/* Footer */}
        <footer className="w-full flex justify-center py-3 bg-transparent mt-4 border-t border-gray-100 dark:border-gray-800">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            &copy; 2026 AAI Hardware Maintenance System. All rights reserved.
          </span>
        </footer>

      </div>
    </div>
  );
}
