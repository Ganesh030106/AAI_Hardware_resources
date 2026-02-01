// frontend/js/export.js

// ==========================================
// EXPORT HARDWARE REQUEST DATA SCRIPT
// ==========================================

//API BASE URL
const API_BASE="https://app-aai-hardware-resources-backend.onrender.com";
let showToast; // will be dynamically imported on page load


// Show/Hide custom date picker
document.getElementById('dateRange').addEventListener('change', function () {
    const customPicker = document.getElementById('customDatePicker');
    customPicker.classList.toggle('hidden', this.value !== 'Custom Range');
});

// Calculate date range
function getDateRange() {
    const selection = document.getElementById('dateRange').value;
    const today = new Date();
    let fromDate, toDate = new Date();

    if (selection === 'Custom Range') {
        const from = document.getElementById('fromDate').value;
        const to = document.getElementById('toDate').value;
        if (!from || !to) {
            alert('Please select both From and To dates.');
            return null;
        }
        return { from, to, label: `${from} to ${to}` };
    }

    if (selection === 'All Issues' || selection === 'All Tickets') {
        return { from: null, to: null, label: 'All' };
    }

    switch (selection) {
        case 'Last 7 Days':
            fromDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'Last 30 Days':
            fromDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        case 'This Month':
            fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
            break;
        case 'Last Quarter':
            fromDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        default:
            fromDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    return {
        from: fromDate.toISOString().split('T')[0],
        to: toDate.toISOString().split('T')[0],
        label: selection
    };
}

function toCSV(headers, rows) {
    const escape = v => '"' + String(v).replace(/"/g, '""') + '"';
    const lines = [headers.map(escape).join(',')];
    rows.forEach(r => lines.push(r.map(escape).join(',')));
    return lines.join('\n');
}

function downloadFile(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function exportToPDF(headers, rows, dateRange) {
    const w = window.open('', '_blank');
    if (!w) {
        alert('Please allow popups.');
        return;
    }

    let html = `<!doctype html><html><head><title>Hardware Request Report</title>
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
                <p>Range: ${dateRange.label} | Generated: ${new Date().toLocaleDateString()}</p>
                <table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
                <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
                </table>
            </body></html>`;

    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 500);
}

// Export button handler
document.getElementById('exportBtn').addEventListener('click', async () => {
    const dateRange = getDateRange();
    if (!dateRange) return;

    const format = document.querySelector('input[name="format"]:checked').value;
    const btn = document.getElementById('exportBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined text-[18px]">hourglass_bottom</span> Exporting...';

    try {
        // Build query
        let url = `${API_BASE}/api/export/data`;
        if (dateRange.from && dateRange.to) {
            url += `?from=${dateRange.from}&to=${dateRange.to}`;
        }

        const response = await fetch(url);
        const result = await response.json();

        if (!result.success) {
            alert('Server error while fetching export data.');
            btn.disabled = false;
            btn.innerHTML = '<span class="material-symbols-outlined text-[18px]">export_notes</span> Export';
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
            exportToPDF(headers, rows, dateRange);
            alert(rows.length ? `✓ PDF ready (${rows.length} records)` : '✓ PDF ready (no records, headers only)');
        }
    } catch (error) {
        console.error('Export error:', error);
        alert('Error: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined text-[18px]">export_notes</span> Export';
    }
});
