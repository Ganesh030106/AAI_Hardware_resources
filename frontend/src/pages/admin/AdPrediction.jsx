import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';

export default function AdPrediction() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || (user.role || '').toLowerCase() !== 'admin') {
      navigate('/html/AdminLogin.html');
      return;
    }

    const fetchPredictions = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/inventory/predict');
        if (!res.ok) throw new Error('Failed to fetch predictions');
        const data = await res.json();
        setPredictions(data.predictions || []);
      } catch (err) {
        console.error(err);
        setError('Failed to load prediction.');
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, [user, navigate]);

  const headerActions = (
    <div className="flex items-center gap-2">
      <Link to="/html/Ad-inventory.html" title="Back to Inventory">
        <span className="material-symbols-outlined text-blue-600 align-middle text-[30px] hover:bg-blue-100 dark:hover:bg-slate-700 rounded-full p-1 transition">
          arrow_back
        </span>
      </Link>
      <h1 className="text-2xl font-bold text-blue-700 flex items-center gap-2">
        <span className="material-symbols-outlined text-blue-600 align-middle text-[30px]">trending_up</span>
        Demand Prediction
      </h1>
    </div>
  );

  return (
    <Layout headerActions={headerActions}>
      <div className="max-w-[900px] mx-auto flex flex-col gap-6">
        
        {loading ? (
          <div className="text-[#4c669a] dark:text-slate-400 text-center py-8">Loading predictions...</div>
        ) : error ? (
          <div className="text-red-600 text-center py-8">{error}</div>
        ) : predictions.length === 0 ? (
          <div className="text-red-600 text-center py-8">No prediction data available.</div>
        ) : (
          <div className="my-4 w-full">
            <h3 className="text-lg font-bold mb-4 text-[#0d121b] dark:text-white">Predicted Demand (Next Month)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-slate-200 dark:border-slate-800 rounded-xl shadow mb-6 bg-white dark:bg-slate-900">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                    <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 font-semibold text-left">Asset</th>
                    <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 font-semibold text-left">Model</th>
                    <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 font-semibold text-center">Predicted Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map((p, idx) => {
                    const rowBg = idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800/50';
                    let qtyClass = 'px-4 py-3 border-b border-slate-200 dark:border-slate-800 text-center font-bold';
                    let qtyIcon = null;

                    if (p.predicted_next_month === 0) {
                      qtyClass += ' text-slate-400';
                      qtyIcon = (
                        <span className="material-symbols-outlined align-middle text-[18px] text-slate-400 mr-1" title="No demand">
                          do_not_disturb
                        </span>
                      );
                    } else if (p.predicted_next_month <= 2) {
                      qtyClass += ' text-yellow-600';
                      qtyIcon = (
                        <span className="material-symbols-outlined align-middle text-[18px] text-yellow-600 mr-1" title="Low demand">
                          trending_flat
                        </span>
                      );
                    } else {
                      qtyClass += ' text-green-600';
                      qtyIcon = (
                        <span className="material-symbols-outlined align-middle text-[18px] text-green-600 mr-1" title="High demand">
                          trending_up
                        </span>
                      );
                    }

                    return (
                      <tr key={idx} className={`${rowBg} hover:bg-slate-100/30 dark:hover:bg-slate-800/30 transition-colors`}>
                        <td className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 text-[#0d121b] dark:text-white">
                          {p.name}
                        </td>
                        <td className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 text-[#4c669a] dark:text-slate-300">
                          {p.model}
                        </td>
                        <td className={qtyClass}>
                          {qtyIcon}
                          {p.predicted_next_month}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
