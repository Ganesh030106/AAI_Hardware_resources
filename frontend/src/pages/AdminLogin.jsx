import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.jpeg';

export default function AdminLogin() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Modal states
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdminLogin();
    }
  };

  const handleAdminLogin = async () => {
    const trimmedUser = username.trim();
    if (!trimmedUser || !password) {
      alert('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: trimmedUser, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const user = data.user || {};
        if ((user.role || '').toLowerCase() !== 'admin') {
          alert('Access Denied: Admins only');
          return;
        }

        loginUser(user);
        navigate('/html/Ad-dash.html');
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Admin login error:', error);
      alert('Server error during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="font-display bg-gray-50 dark:bg-[#101622] min-h-screen flex flex-col relative overflow-x-hidden antialiased">
      {/* Background Gradients */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]"></div>
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] rounded-full bg-primary/10 blur-[100px]"></div>
      </div>

      {/* Container */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="mb-8 text-center flex flex-col items-center gap-3">
          <img src={logoImg} alt="AAI Hardware Logo" className="h-14 w-14 object-contain" />
          <h1 className="text-gray-900 dark:text-white text-2xl font-bold">Hardware Management Login</h1>
          <p className="text-blue-700 dark:text-blue-400 text-sm font-medium">AAI Hardware Management Portal</p>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-[480px] bg-white dark:bg-[#181f2a] rounded-2xl shadow-lg border border-gray-200 dark:border-[#232e42] overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-[#232e42]">
            <div className="flex">
              {/* User Tab (Inactive) */}
              <Link to="/html/UserLogin.html" className="group flex flex-1 flex-col items-center justify-center gap-2 pt-4 pb-3 relative hover:bg-gray-50 dark:hover:bg-[#232e42] transition-colors">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-gray-400 group-hover:text-gray-950 dark:text-gray-500 dark:group-hover:text-white">person</span>
                  <span className="text-xs sm:text-sm font-bold tracking-[0.015em] text-gray-500 dark:text-gray-400 group-hover:text-gray-950 dark:group-hover:text-white">User</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-transparent rounded-t-full mx-4"></div>
              </Link>
              {/* Admin Tab (Active) */}
              <button className="group flex flex-1 flex-col items-center justify-center gap-2 pt-4 pb-3 relative text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#232e42] transition-colors">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold">
                  <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                  <span className="text-xs sm:text-sm font-bold tracking-[0.015em]">Admin</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-blue-600 dark:bg-blue-400 rounded-t-full mx-4"></div>
              </button>
              {/* Technician Tab (Inactive) */}
              <Link to="/html/TechnicianLogin.html" className="group flex flex-1 flex-col items-center justify-center gap-2 pt-4 pb-3 relative text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#232e42] transition-colors">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-gray-400 group-hover:text-gray-950 dark:text-gray-500 dark:group-hover:text-white">build</span>
                  <span className="text-xs sm:text-sm font-bold tracking-[0.015em] text-gray-500 dark:text-gray-400 group-hover:text-gray-950 dark:group-hover:text-white">Technician</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-transparent rounded-t-full mx-4"></div>
              </Link>
            </div>
          </div>

          {/* Form */}
          <div className="p-6 sm:p-8 flex flex-col gap-6">
            <div className="text-center">
              <h2 className="text-gray-900 dark:text-white tracking-tight text-[24px] font-bold leading-tight mb-2">Welcome Back</h2>
              <p className="text-gray-500 dark:text-gray-400 text-[15px] font-normal leading-normal">Please enter your credentials.</p>
            </div>

            <form className="flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1" htmlFor="username">USERNAME</label>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 transition-colors group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 pointer-events-none flex items-center">
                    <span className="material-symbols-outlined text-[20px]">person</span>
                  </div>
                  <input
                    className="w-full bg-white dark:bg-[#232e42] text-gray-900 dark:text-white text-sm font-medium border border-gray-200 dark:border-[#2a3447] rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-blue-600 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-600 dark:focus:ring-blue-400 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    id="username"
                    type="text"
                    placeholder="Enter username"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 ml-1" htmlFor="password">PASSWORD</label>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 transition-colors group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 pointer-events-none flex items-center">
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                  </div>
                  <input
                    className="w-full bg-white dark:bg-[#232e42] text-gray-900 dark:text-white text-sm font-medium border border-gray-200 dark:border-[#2a3447] rounded-lg pl-10 pr-10 py-3 focus:outline-none focus:border-blue-600 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-600 dark:focus:ring-blue-400 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    id="password"
                    placeholder="Enter password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <button
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 cursor-pointer flex items-center transition-colors"
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    aria-label="Toggle password visibility"
                    title="Show/hide password"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Action Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative flex items-center">
                    <input
                      className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-gray-300 bg-white dark:bg-[#232e42] transition-all checked:border-blue-600 dark:checked:border-blue-400 checked:bg-blue-600 dark:checked:bg-blue-400 hover:border-blue-400 dark:hover:border-blue-400"
                      id="remember"
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    <span className="material-symbols-outlined pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[14px] text-white opacity-0 transition-opacity peer-checked:opacity-100 font-bold">check</span>
                  </div>
                  <label className="cursor-pointer text-sm font-medium text-blue-700 dark:text-blue-300 select-none" htmlFor="remember">Remember me</label>
                </div>
              </div>

              {/* Submit */}
              <button
                className="w-full flex items-center justify-center gap-2 bg-blue-600 dark:bg-blue-400 hover:bg-blue-700 dark:hover:bg-blue-500 text-white text-sm font-bold rounded-lg py-3 px-4 shadow-md shadow-blue-600/20 dark:shadow-blue-400/20 hover:shadow-lg hover:shadow-blue-600/30 dark:hover:shadow-blue-400/30 transition-all active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed"
                type="button"
                onClick={handleAdminLogin}
                disabled={isLoading}
              >
                <span>{isLoading ? "Logging in..." : "Login"}</span>
                {!isLoading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
              </button>
            </form>
          </div>

          {/* Footer Notice */}
          <div className="bg-white dark:bg-[#181f2a] px-6 py-4 border-t border-gray-200 dark:border-[#232e42] flex flex-col items-center justify-center text-center gap-2">
            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[20px] mt-0.5">info</span>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed text-center flex-wrap">
              By logging in, you agree to the Hardware Maintenance System{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); setIsTermsOpen(true); }} className="text-gray-900 dark:text-white font-semibold underline decoration-slate-300 dark:decoration-slate-600 underline-offset-2">
                Terms of Service
              </a>.
            </p>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-8 flex items-center gap-6 text-sm font-medium text-[#64748b] dark:text-[#64748b]">
          <a className="hover:text-primary transition-colors cursor-pointer" onClick={() => setIsHelpOpen(true)}>Help Center</a>
          <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
          <a className="hover:text-primary transition-colors cursor-pointer" onClick={() => setIsPrivacyOpen(true)}>Privacy Policy</a>
          <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
          <a className="hover:text-primary transition-colors cursor-pointer" onClick={() => setIsContactOpen(true)}>Contact Support</a>
        </div>

        <footer className="mt-6 mb-2 w-full flex justify-center">
          <span className="text-xs text-gray-400 dark:text-gray-500">&copy; 2026 AAI Hardware Maintenance System. All rights reserved.</span>
        </footer>
      </div>

      {/* Modals */}
      {isTermsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-[#181f2a] rounded-xl shadow-lg max-w-lg w-full p-6 relative mx-4">
            <button onClick={() => setIsTermsOpen(false)} className="absolute top-3 right-3 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-xl font-bold">&times;</button>
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Terms of Service</h3>
            <div className="text-sm text-gray-500 dark:text-gray-400 max-h-72 overflow-y-auto">
              <p>
                By using this system, you agree to comply with all applicable policies and procedures. Unauthorized access or misuse is strictly prohibited and may result in disciplinary action. Please contact your administrator for more information.
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setIsTermsOpen(false)} className="bg-blue-600 dark:bg-blue-400 hover:bg-blue-700 dark:hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition-all">Close</button>
            </div>
          </div>
        </div>
      )}

      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-[#181f2a] rounded-xl shadow-lg max-w-md w-full p-6 relative mx-4">
            <button onClick={() => setIsHelpOpen(false)} className="absolute top-3 right-3 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-xl font-bold">&times;</button>
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Help Center</h3>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>
                Welcome to the Help Center!<br />
                Here you can find answers to common questions and get support for the Hardware Maintenance System.
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setIsHelpOpen(false)} className="bg-blue-600 dark:bg-blue-400 hover:bg-blue-700 dark:hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition-all">Close</button>
            </div>
          </div>
        </div>
      )}

      {isPrivacyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-[#181f2a] rounded-xl shadow-lg max-w-md w-full p-6 relative mx-4">
            <button onClick={() => setIsPrivacyOpen(false)} className="absolute top-3 right-3 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-xl font-bold">&times;</button>
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Privacy Policy</h3>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>
                Your privacy is important to us. We only collect information necessary for authentication and system security. Data is not shared with third parties except as required by law. For more details, contact your administrator.
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setIsPrivacyOpen(false)} className="bg-blue-600 dark:bg-blue-400 hover:bg-blue-700 dark:hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition-all">Close</button>
            </div>
          </div>
        </div>
      )}

      {isContactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-[#181f2a] rounded-xl shadow-lg max-w-md w-full p-6 relative mx-4">
            <button onClick={() => setIsContactOpen(false)} className="absolute top-3 right-3 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-xl font-bold">&times;</button>
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Contact Support</h3>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>
                Need help? Contact our support team:<br />
                <strong>Email:</strong> <a href="mailto:support@aai-hardware.com" className="text-blue-600 dark:text-blue-400 underline">support@aai-hardware.com</a><br />
                <strong>Phone:</strong> <a href="tel:+1234567890" className="text-blue-600 dark:text-blue-400 underline">+1 (234) 567-890</a>
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setIsContactOpen(false)} className="bg-blue-600 dark:bg-blue-400 hover:bg-blue-700 dark:hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition-all">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
