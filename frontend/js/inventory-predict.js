// inventory-predict.js
// Fetches and displays inventory demand prediction for admin
const API_BASE="https://app-aai-hardware-resources-backend.onrender.com";

document.addEventListener('DOMContentLoaded', () => {
    const resultDiv = document.getElementById('prediction-result');
    if (!resultDiv) return;
    // Auto-load prediction data on page load
    (async function showPrediction() {
        resultDiv.innerHTML = '';
        try {
            const res = await fetch(`${API_BASE}/api/inventory/predict`);
            const data = await res.json();
            if (!data.predictions || !data.predictions.length) {
                resultDiv.innerHTML = '<div class="text-red-600">No prediction data available.</div>';
            } else {
                let html = `<h3 class='text-lg font-bold mb-4'>Predicted Demand (Next Month)</h3>`;
                html += `<div class='overflow-x-auto'><table class='w-full text-sm border border-slate-200 rounded-xl shadow mb-6 bg-white dark:bg-slate-900'>`;
                html += `<thead><tr class='bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'>`;
                html += `<th class='px-4 py-3 border-b font-semibold text-left'>Asset</th>`;
                html += `<th class='px-4 py-3 border-b font-semibold text-left'>Model</th>`;
                html += `<th class='px-4 py-3 border-b font-semibold text-center'>Predicted Qty</th>`;
                html += `</tr></thead><tbody>`;
                data.predictions.forEach((p, i) => {
                    const rowBg = i % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800';
                    let qtyClass = 'text-center font-bold';
                    let qtyIcon = '';
                    if (p.predicted_next_month === 0) {
                        qtyClass += ' text-slate-400';
                        qtyIcon = "<span class='material-symbols-outlined align-middle text-[18px] text-slate-400' title='No demand'>do_not_disturb</span> ";
                    } else if (p.predicted_next_month <= 2) {
                        qtyClass += ' text-yellow-600';
                        qtyIcon = "<span class='material-symbols-outlined align-middle text-[18px] text-yellow-600' title='Low demand'>trending_flat</span> ";
                    } else {
                        qtyClass += ' text-green-600';
                        qtyIcon = "<span class='material-symbols-outlined align-middle text-[18px] text-green-600' title='High demand'>trending_up</span> ";
                    }
                    html += `<tr class='${rowBg}'>`;
                    html += `<td class='px-4 py-3 border-b'>${p.name}</td>`;
                    html += `<td class='px-4 py-3 border-b'>${p.model}</td>`;
                    html += `<td class='px-4 py-3 border-b ${qtyClass}'>${qtyIcon}${p.predicted_next_month}</td>`;
                    html += `</tr>`;
                });
                html += '</tbody></table></div>';
                resultDiv.innerHTML = html;
            }
        } catch (err) {
            resultDiv.innerHTML = '<div class="text-red-600">Failed to load prediction.</div>';
        }
    })();
});
