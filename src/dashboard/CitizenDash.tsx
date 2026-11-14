
import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

export default function CitizenDash() {
  const navigate = useNavigate();
  const location = useLocation();

  // Logged-in user state
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('Citizen');

  // Sidebar toggle state
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Load active citizen email, check authentication & fetch details
  useEffect(() => {
    let email = localStorage.getItem('citizenEmail');
    const token = localStorage.getItem('token');

    // 🔒 Security Check: If no token or email/user exists, force redirect to login
    if (!token || (!email && !localStorage.getItem('evenue_user'))) {
      navigate('/login', { replace: true });
      return;
    }

    if (!email) {
      const storedUser = localStorage.getItem('evenue_user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          email = parsed.emailid;
        } catch (e) {
          console.error(e);
        }
      }
    }

    if (email) {
      const cleanEmail = email.trim();
      setUserEmail(cleanEmail);

      // ✨ Smart Fallback: Email username se capitalized name banao (e.g. goyalharry -> Goyalharry)
      const emailPrefix = cleanEmail.split('@')[0];
      const initialGreetingName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
      setUserName(initialGreetingName);

      // Fetch citizen details to show their registered Real Name from MongoDB
      axios
        .post(
          'http://localhost:2005/citizen/citizenFetch',
          { emailid: cleanEmail },
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        )
        .then((resp) => {
          if (resp.data.status === true) {
            const rawData = resp.data.msg;
            const data = Array.isArray(rawData) ? rawData[0] : rawData || resp.data.doc;
            if (data && data.name && data.name.trim() !== '') {
              setUserName(data.name.trim());
            }
          }
        })
        .catch((err) => console.log('Citizen name fetch fallback:', err));
    }
  }, [navigate]);

  // Logout handler
  function handleLogout() {
    const confirmLogout = window.confirm('Are you sure you want to logout from Evenue?');
    if (confirmLogout) {
      localStorage.removeItem('token');
      localStorage.removeItem('citizenEmail');
      localStorage.removeItem('evenue_user');
      
      alert('Logged out successfully');
      navigate('/', { replace: true });
    }
  }

  // Helper function to check active route
  const isActive = (path: string) => location.pathname.includes(path);

  // Initials for avatar icon
  const initials = userName
    ? userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'C';

  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col font-sans antialiased text-[#11130F]">

      {/* ==================================================== */}
      {/* 1. TOP NAVBAR (WITH PROMINENT WELCOME GREETING)      */}
      {/* ==================================================== */}
      <header className="w-full bg-emerald-950 border-b border-emerald-900/60 px-6 py-3.5 shadow-md sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center justify-between">
          
          {/* Left: Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-900 border border-emerald-700/60 flex items-center justify-center font-serif italic text-amber-300 text-xl shadow-inner">
              E
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-serif text-2xl tracking-tight font-bold">
                  Evenue<span className="text-emerald-400">.</span>
                </span>
                <span className="bg-emerald-900/90 text-emerald-200 border border-emerald-700/60 text-[10px] font-semibold px-2.5 py-0.5 rounded-full tracking-wider uppercase">
                  Citizen Portal
                </span>
              </div>
              <p className="text-emerald-200/70 text-xs hidden sm:block font-light">
                Premier Event & Citizen Verification Platform
              </p>
            </div>
          </div>

          {/* Center / Right: ✨ PROMINENT "WELCOME [NAME]" GREETING */}
          <div className="flex items-center gap-3 sm:gap-5">
            
            {/* WELCOME BADGE */}
            <div className="flex items-center gap-2 bg-emerald-900/90 border border-emerald-700/70 px-4 py-1.5 rounded-full shadow-inner">
              <span className="text-base animate-pulse">👋</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs font-normal text-emerald-200/90">Welcome,</span>
                <span className="text-xs sm:text-sm font-bold text-amber-300 tracking-wide capitalize truncate max-w-[150px] sm:max-w-[220px]">
                  {userName}!
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600/90 hover:bg-red-600 text-white text-xs font-semibold rounded-full transition-all duration-200 shadow-sm active:scale-95 cursor-pointer"
              title="Logout from Evenue"
            >
              Sign Out
            </button>
          </div>

        </div>
      </header>

      {/* ==================================================== */}
      {/* 2. DASHBOARD BODY: SIDEBAR + OUTLET CONTAINER        */}
      {/* ==================================================== */}
      <div className="flex-1 flex overflow-hidden p-4 md:p-6 gap-6">

        {/* LEFT SIDEBAR */}
        <aside
          className={`bg-white rounded-3xl border border-gray-200/70 shadow-lg transition-all duration-300 flex flex-col ${
            isSidebarOpen ? 'w-72 p-5' : 'w-20 p-3 items-center'
          }`}
        >
          {/* Top Collapse Toggle */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 w-full">
            {isSidebarOpen && (
              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Dashboard Menu
              </span>
            )}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-xl bg-gray-100 hover:bg-emerald-950 hover:text-white text-gray-600 transition-colors duration-200 cursor-pointer"
              title={isSidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
            >
              <svg
                className={`w-4 h-4 transform transition-transform duration-200 ${
                  isSidebarOpen ? 'rotate-180' : 'rotate-0'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* USER PROFILE CARD */}
          {isSidebarOpen ? (
            <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950 to-emerald-900 text-white shadow-md relative overflow-hidden group">
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-amber-300 text-base flex-shrink-0 shadow-sm">
                  {initials}
                </div>
                <div className="overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold truncate block capitalize">
                      {userName}
                    </span>
                  </div>
                  <span className="text-xs text-emerald-200/90 truncate block font-mono font-light">
                    {userEmail || 'citizen@evenue.com'}
                  </span>
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-emerald-300/80">
                <span>Citizen Account</span>
                <span className="flex items-center gap-1 text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active
                </span>
              </div>
            </div>
          ) : (
            <div
              className="mb-4 w-10 h-10 rounded-xl bg-emerald-950 text-amber-300 flex items-center justify-center font-bold text-xs shadow-md"
              title={`${userName} (${userEmail})`}
            >
              {initials}
            </div>
          )}

          {/* Navigation Menu Buttons */}
          <nav className="flex-1 space-y-2 w-full">
            <button
              onClick={() => navigate('profile')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                isActive('profile')
                  ? 'bg-emerald-950 text-amber-300 shadow-md shadow-emerald-950/20'
                  : 'text-gray-600 hover:bg-emerald-50/60 hover:text-emerald-950'
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {isSidebarOpen && <span>Citizen Profile</span>}
            </button>

            <button
              onClick={() => navigate('search')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                isActive('search')
                  ? 'bg-emerald-950 text-amber-300 shadow-md shadow-emerald-950/20'
                  : 'text-gray-600 hover:bg-emerald-50/60 hover:text-emerald-950'
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {isSidebarOpen && <span>Search Vendors</span>}
            </button>

            <button
              onClick={() => navigate('favs')}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                isActive('favs')
                  ? 'bg-emerald-950 text-amber-300 shadow-md shadow-emerald-950/20'
                  : 'text-gray-600 hover:bg-emerald-50/60 hover:text-emerald-950'
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0 text-red-500 fill-current" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              {isSidebarOpen && <span>Saved Favorites</span>}
            </button>
          </nav>

          {/* Bottom Logout */}
          <div className="pt-3 border-t border-gray-100 w-full">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors duration-150 cursor-pointer"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {isSidebarOpen && <span>Sign Out</span>}
            </button>
          </div>
        </aside>

        {/* RIGHT MAIN PANEL */}
        <main className="flex-1 bg-white rounded-3xl border border-gray-200/70 shadow-lg p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </main>

      </div>

    </div>
  );
}
