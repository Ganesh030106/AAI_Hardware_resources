import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    
    setToasts(prev => [...prev, { id, message, type, duration }]);

    setTimeout(() => {
      // Trigger fade out by updating item state or removing it
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  // Expose showToast globally for compatibility with any legacy JS files
  useEffect(() => {
    window.showToast = showToast;
    return () => {
      delete window.showToast;
    };
  }, [showToast]);

  const iconMap = {
    'success': 'check_circle',
    'error': 'error',
    'warning': 'warning',
    'info': 'info'
  };

  const borderMap = {
    'success': 'border-l-[#10b981]',
    'error': 'border-l-[#ef4444]',
    'info': 'border-l-[#3b82f6]',
    'warning': 'border-l-[#f59e0b]'
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container */}
      <div id="toast-container" className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 pointer-events-none">
        {toasts.map(toast => {
          const icon = iconMap[toast.type] || 'info';
          const borderClass = borderMap[toast.type] || 'border-l-[#3b82f6]';
          return (
            <div
              key={toast.id}
              className={`toast min-w-[300px] bg-white dark:bg-[#1e293b] text-[#1e293b] dark:text-[#f8fafc] p-4 rounded-xl shadow-lg flex items-center gap-3 border-l-4 ${borderClass} animate-slide-in pointer-events-auto`}
              style={{
                animation: 'slideIn 0.3s ease-out forwards'
              }}
            >
              <span className="material-symbols-outlined text-[20px]">{icon}</span>
              <div className="flex flex-col">
                <span className="text-sm font-bold capitalize">{toast.type}</span>
                <span className="text-xs opacity-90">{toast.message}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add inline CSS for animations to ensure exact slideIn/fadeOut match */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeOut {
          to { opacity: 0; transform: translateX(20px); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

// Helper hook
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
export default ToastContext;
