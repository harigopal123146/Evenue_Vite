
import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export default function CitizenDash() {
  const navigate = useNavigate();
  const location = useLocation();

  // Logged-in citizen state
  const [userEmail, setUserEmail] = useState<string>('kori@gmail.com');
  const [userName, setUserName] = useState<string>('Citizen');

  // Load active citizen email, check authentication & fetch details
  useEffect(() => {
    let email = localStorage.getItem('citizenEmail');
    const token = localStorage.getItem('token');

    // 🔒 Security Check: Agar token ya user data na ho to login par bhej do
    if (!token && !email && !localStorage.getItem('evenue_user')) {
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

      // Email prefix se first name banao (e.g. kori@gmail.com -> Kori)
      const prefix = cleanEmail.split('@')[0];
      setUserName(prefix.charAt(0).toUpperCase() + prefix.slice(1));

      // Backend se registered Real Name fetch karo
      if (API_URL) {
        axios
          .post(
            `${API_URL}/citizen/citizenFetch`,
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
    }
  }, [navigate]);

  // Logout handler
  function handleLogout() {
    const confirmLogout = window.confirm('Are you sure you want to logout from Evenue?');
    if (confirmLogout) {
      localStorage.removeItem('token');
      localStorage.removeItem('citizenEmail');
      localStorage.removeItem('evenue_user');
      navigate('/login', { replace: true });
    }
  }

  // Active route check helpers
  const isSearchActive = location.pathname.includes('/search');
  const isFavsActive = location.pathname.includes('/favs');
  const isFormActive = location.pathname.includes('/form');

  // Check agar user Home/Profile screen par hai (Welcome banner dikhane ke liye)
  const isWelcomePage = !isSearchActive && !isFavsActive && !isFormActive;

  // Avatar icon letter (e.g., 'K' ya 'E')
  const initialLetter = (userEmail ? userEmail[0] : userName[0] || 'C').toUpperCase();

  return (
    <div className="min-h-screen flex bg-[#f4f6f4] font-sans antialiased text-[#11130F]">

      {/* ==================================================== */}
      {/* 1. LEFT SIDEBAR (DARK THEME - Evenue.)               */}
      {/* ==================================================== */}
      <aside className="w-64 bg-[#111c15] text-white flex flex-col justify-between p-5 border-r border-[#1a2b21] shrink-0 min-h-screen">
        
        <div>
          {/* Logo / Brand Header */}
          <div className="mb-6">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center">
              Evenue<span className="text-[#86efac]">.</span>
            </h1>
            <p className="text-[10px] font-semibold tracking-wider text-emerald-500/80 uppercase mt-0.5">
              Citizen Dashboard
            </p>
          </div>

          {/* User Profile Mini Card in Sidebar */}
          <div className="bg-[#17251d] border border-white/5 rounded-2xl p-3.5 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#86efac] text-[#111c15] font-bold text-base flex items-center justify-center shrink-0">
              {initialLetter}
            </div>
            <div className="overflow-hidden">
              <h2 className="text-sm font-semibold text-white truncate capitalize">
                {userName}
              </h2>
              <p className="text-xs text-gray-400 truncate font-mono">
                {userEmail}
              </p>
              <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Active
              </span>
            </div>
          </div>

          {/* Menu Category */}
          <div className="mb-2">
            <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
              Workspace
            </span>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5">
            {/* 1. Profile (Opens Welcome Screen) */}
            <button
              onClick={() => navigate('/citizendash')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isWelcomePage
                  ? 'bg-[#86efac] text-[#0f1712] shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm-1-13h2v6h-2zm0 8h2v2h-2z" />
              </svg>
              <span>Profile</span>
            </button>

            {/* 2. Search Vendors */}
            <button
              onClick={() => navigate('search')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isSearchActive
                  ? 'bg-[#86efac] text-[#0f1712] shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search Vendors</span>
            </button>

            {/* 3. My Favourites */}
            <button
              onClick={() => navigate('favs')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isFavsActive
                  ? 'bg-[#86efac] text-[#0f1712] shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>My Favourites</span>
            </button>

            {/* 4. Citizen Form */}
            <button
              onClick={() => navigate('form')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isFormActive
                  ? 'bg-[#86efac] text-[#0f1712] shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Citizen Form</span>
            </button>
          </nav>
        </div>

        {/* Bottom Sign Out Button */}
        <div className="pt-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ==================================================== */}
      {/* 2. RIGHT PANEL: TOP BAR + MAIN CONTENT               */}
      {/* ==================================================== */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">

        {/* Top Bar Header */}
        <header className="px-8 py-4 bg-white/70 backdrop-blur-sm border-b border-gray-200/60 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Citizen Workspace
            </p>
            <h2 className="text-sm font-semibold text-gray-800">
              Evenue Event Management
            </h2>
          </div>

          {/* Right mini profile avatar */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-800 capitalize">{userName}</p>
              <p className="text-[10px] text-gray-400">Citizen Account</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#86efac] text-[#111c15] font-bold text-xs flex items-center justify-center">
              {initialLetter}
            </div>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="p-8 flex-1">
          {isWelcomePage ? (
            /* ==================================================== */
            /* WELCOME BANNER + 3 QUICK NAVIGATION CARDS            */
            /* ==================================================== */
            <div className="space-y-8 max-w-6xl">
              
              {/* HERO BANNER (Dark Forest Green) */}
              <div className="relative overflow-hidden rounded-3xl bg-[#143225] text-white p-8 sm:p-10 shadow-sm">
                
                {/* Decorative Circular Accent */}
                <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full border-[18px] border-emerald-800/30 pointer-events-none" />

                <div className="relative z-10 max-w-xl">
                  {/* Badge */}
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-600/40 text-emerald-300 mb-4">
                    Citizen Dashboard
                  </span>

                  {/* Heading */}
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2 leading-tight">
                    Welcome Back,<br />
                    <span>{userEmail}!</span>
                  </h1>

                  {/* Description with Evenue */}
                  <p className="text-emerald-100/75 text-xs sm:text-sm leading-relaxed mb-6 font-normal">
                    Welcome to Evenue. Discover trusted event vendors, save your favourites and make every celebration special.
                  </p>

                  {/* Action Button */}
                  <button
                    onClick={() => navigate('search')}
                    className="inline-flex items-center gap-2 bg-[#86efac] hover:bg-[#6ee7b7] text-[#0f1712] text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-sm cursor-pointer"
                  >
                    <span>Explore Vendors</span>
                    <span>→</span>
                  </button>
                </div>
              </div>

              {/* QUICK NAVIGATION SECTION */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Quick Navigation
                </p>
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                  Manage Your Account
                </h3>
                <p className="text-xs text-gray-500 mb-5">
                  Select an option to continue.
                </p>

                {/* 3 Quick Navigation Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  
                  {/* Card 1: Search Vendors */}
                  <div
                    onClick={() => navigate('search')}
                    className="bg-white rounded-2xl border border-gray-200/70 p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md">
                        Explore
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 group-hover:text-emerald-700 transition">
                      Search Vendors
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Find professional event service providers for your celebrations.
                    </p>
                  </div>

                  {/* Card 2: My Favourites */}
                  <div
                    onClick={() => navigate('favs')}
                    className="bg-white rounded-2xl border border-gray-200/70 p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md">
                        Saved
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 group-hover:text-emerald-700 transition">
                      My Favourites
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      View all your saved and favourite event vendors.
                    </p>
                  </div>

                  {/* Card 3: Citizen Form (Opens Citizen Form page) */}
                  <div
                    onClick={() => navigate('form')}
                    className="bg-white rounded-2xl border border-gray-200/70 p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md">
                        Profile
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 group-hover:text-emerald-700 transition">
                      Citizen Form
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Submit your citizen details using the Aadhaar OCR form.
                    </p>
                  </div>

                </div>
              </div>

            </div>
          ) : (
            /* ==================================================== */
            /* CHILD PAGES (Citizen Form, Search, Favs)             */
            /* ==================================================== */
            <div className="bg-white rounded-2xl border border-gray-200/70 p-6 shadow-sm">
              <Outlet />
            </div>
          )}
        </main>

      </div>

    </div>
  );
}
