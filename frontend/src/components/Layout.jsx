import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import logoImg from '../assets/logo.jpeg';

export default function Layout({ children, headerActions }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [dateStr, setDateStr] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const formatDate = (date) => {
      return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
    };
    setDateStr(formatDate(new Date()));
  }, []);

  // Determine if we are on the admin, technician, or user side
  const isAdminPortal = location.pathname.startsWith('/admin') || 
                        location.pathname.startsWith('/html/Ad-') || 
                        location.pathname.startsWith('/html/SuperAdmin');

  const isTechPortal = location.pathname.startsWith('/tech') || 
                       location.pathname.startsWith('/html/Tech') || 
                       user?.role === 'Technician';

  const fetchNotifications = async () => {
    if (!user || user.role !== 'Technician') return;
    try {
      const response = await fetch(`/api/issues/technician/notifications?tech_id=${user.emp_id}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user || user.role !== 'Technician') return;
    try {
      const response = await fetch('/api/issues/technician/notifications/read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tech_id: user.emp_id })
      });
      if (response.ok) {
        setNotifications([]);
        setShowDropdown(false);
      }
    } catch (error) {
      console.error('Error marking notifications read:', error);
    }
  };

  useEffect(() => {
    if (user && user.role === 'Technician') {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogoutClick = () => {
    const confirmLogout = window.confirm("Are you sure you want to log out?");
    if (confirmLogout) {
      logout();
      if (isAdminPortal) {
        navigate('/html/AdminLogin.html');
      } else if (isTechPortal) {
        navigate('/html/TechnicianLogin.html');
      } else {
        navigate('/html/UserLogin.html');
      }
    }
  };

  const getActiveLinkClass = (pathOrPaths) => {
    const paths = Array.isArray(pathOrPaths) ? pathOrPaths : [pathOrPaths];
    const isActive = paths.includes(location.pathname);
    return isActive 
      ? 'sidebar-link sidebar-active flex items-center gap-3 px-3 py-2.5 rounded-lg' 
      : 'sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-muted-light dark:text-slate-300 hover:bg-background-light dark:hover:bg-gray-800 transition-colors';
  };

  const displayName = user?.name || user?.username || "User";
  const displayRole = user?.role || "Employee";
  const displayDept = user?.dept || user?.department || "Department";

  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-slate-900 text-text-main-light dark:text-text-main-dark font-display antialiased overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 h-full flex flex-col bg-card-light dark:bg-slate-800 border-r border-border-light dark:border-slate-700 flex-shrink-0 z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="p-2 rounded-lg flex items-center justify-center">
            <img src={logoImg} className="w-10 h-10 object-cover rounded" alt="logo" />
          </div>
          <div>
            <Link to={isAdminPortal ? "/html/Ad-dash.html" : (isTechPortal ? "/html/TechDash.html" : "/html/user_dash.html")}>
              <h1 className="text-base font-bold leading-none tracking-tight">AAI Hardware</h1>
            </Link>
            <p className="text-xs text-text-muted-light dark:text-slate-300 mt-1">
              {isAdminPortal ? 'Admin Portal' : (isTechPortal ? 'Technician Portal' : 'User Portal')}
            </p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 flex flex-col gap-2 overflow-y-auto">
          {isAdminPortal ? (
            /* Admin Sidebar */
            <>
              <Link to="/html/Ad-dash.html" className={getActiveLinkClass('/html/Ad-dash.html')}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>dashboard</span>
                <span className="text-sm font-medium">Dashboard</span>
              </Link>
              <Link to="/html/Ad-ticket.html" className={getActiveLinkClass('/html/Ad-ticket.html')}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>confirmation_number</span>
                <span className="text-sm font-medium">Request Management</span>
              </Link>
              <Link to="/html/Ad-inventory.html" className={getActiveLinkClass('/html/Ad-inventory.html')}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>inventory_2</span>
                <span className="text-sm font-medium">Inventory</span>
              </Link>
              <div className="my-2 border-t border-border-light dark:border-slate-700"></div>
              <Link to="/html/Ad-settings.html" className={getActiveLinkClass('/html/Ad-settings.html')}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>settings</span>
                <span className="text-sm font-medium">Settings</span>
              </Link>
            </>
          ) : isTechPortal ? (
            /* Technician Sidebar */
            <>
              <Link to="/html/TechDash.html" className={getActiveLinkClass(['/html/TechDash.html', '/tech/dash'])}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>dashboard</span>
                <span className="text-sm font-medium">Dashboard</span>
              </Link>
              <div className="my-2 border-t border-border-light dark:border-slate-700"></div>
              <Link to="/html/Settings.html" className={getActiveLinkClass(['/html/Settings.html', '/user/settings'])}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>settings</span>
                <span className="text-sm font-medium">Settings</span>
              </Link>
            </>
          ) : (
            /* User Sidebar */
            <>
              <Link to="/html/user_dash.html" className={getActiveLinkClass('/html/user_dash.html')}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>dashboard</span>
                <span className="text-sm font-medium">Dashboard</span>
              </Link>
              <Link to="/html/MyRequest.html" className={getActiveLinkClass('/html/MyRequest.html')}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>assignment</span>
                <span className="text-sm font-medium">Hardware Requests</span>
              </Link>
              <Link to="/html/user_issue.html" className={getActiveLinkClass('/html/user_issue.html')}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>build</span>
                <span className="text-sm font-medium">Maintenance Requests</span>
              </Link>
              <div className="my-2 border-t border-border-light dark:border-slate-700"></div>
              <Link to="/html/Settings.html" className={getActiveLinkClass('/html/Settings.html')}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>settings</span>
                <span className="text-sm font-medium">Settings</span>
              </Link>
            </>
          )}
        </nav>

        {/* Profile Card Footer */}
        <Link 
          to={isAdminPortal ? "/html/Ad-profile_dashboard.html" : (isTechPortal ? "/html/TechDash.html" : "/html/profile_dashboard.html")} 
          className="animated-btn border-t border-border-light dark:border-slate-700 block"
        >
          <div className="flex items-center gap-3 p-4 rounded-lg hover:bg-background-light dark:hover:bg-background-dark cursor-pointer transition-colors">
            <div 
              className="w-10 h-10 rounded-full bg-cover bg-center border border-gray-200 dark:border-gray-700 flex-shrink-0"
              style={{
                backgroundImage: `url('https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=135bec&color=fff')`
              }}
            />
            <div className="flex flex-col flex-1 min-w-0">
              <p className="text-sm font-bold text-text-main-light dark:text-text-main-dark truncate">
                {displayName}
              </p>
              <p className="text-xs text-text-muted-light dark:text-slate-300 truncate">
                {isAdminPortal ? displayRole : displayDept}
              </p>
            </div>
          </div>
        </Link>
      </aside>

      {/* Main Body Panel */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 bg-card-light dark:bg-slate-800 border-b border-border-light dark:border-slate-700 flex-shrink-0">
          <div className="flex items-center w-full max-w-xl">
            {headerActions}
          </div>
          <div className="flex items-center gap-4 flex-shrink-0 relative">
            {/* Notifications Bell Button for Technician */}
            {isTechPortal && (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="animated-btn flex items-center justify-center p-2 rounded-lg bg-background-light dark:bg-slate-900 text-text-main-light dark:text-text-main-dark hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors relative animate-fadeIn"
                  aria-label="View notifications"
                >
                  <span className="material-symbols-outlined text-[20px]">notifications</span>
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-card-light dark:ring-slate-800">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {showDropdown && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowDropdown(false)}></div>
                    <div className="absolute right-0 top-full mt-2 w-80 bg-card-light dark:bg-slate-800 border border-border-light dark:border-slate-700 rounded-xl shadow-xl z-40 overflow-hidden text-sm animate-scaleIn">
                      <div className="p-4 border-b border-border-light dark:border-slate-700 flex items-center justify-between bg-gray-50 dark:bg-slate-800/80">
                        <span className="font-bold text-text-main-light dark:text-white flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[18px]">notifications</span>
                          Notifications
                        </span>
                        {notifications.length > 0 && (
                          <button 
                            onClick={markAllAsRead} 
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-60 overflow-y-auto divide-y divide-border-light dark:divide-slate-700">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-text-muted-light dark:text-gray-400 text-xs">
                            No new notifications
                          </div>
                        ) : (
                          notifications.map((notif, idx) => (
                            <div key={notif._id || idx} className="p-3 hover:bg-background-light dark:hover:bg-slate-700/50 transition-colors">
                              <p className="text-xs font-medium text-text-main-light dark:text-gray-200 leading-normal">{notif.message}</p>
                              <p className="text-[10px] text-text-muted-light dark:text-gray-400 mt-1">
                                {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme}
              className="animated-btn flex items-center gap-2 px-3 py-2 rounded-lg bg-background-light dark:bg-slate-900 text-text-main-light dark:text-text-main-dark hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              <span className="material-symbols-outlined text-[18px]">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
              <span className="hidden sm:inline">
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </span>
            </button>

            {/* Date Button */}
            <button className="animated-btn flex items-center gap-2 px-3 py-2 rounded-lg bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium">
              <span className="material-symbols-outlined text-[18px]">calendar_today</span>
              <span>{dateStr}</span>
            </button>

            {/* Logout Button */}
            <button 
              onClick={handleLogoutClick}
              className="animated-btn flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-6 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
