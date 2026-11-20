import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:2005";

export default function CitizenDash() {
  const navigate = useNavigate();
  const location = useLocation();

  // ----------------------------------------------------
  // 1. STATE VARIABLES
  // ----------------------------------------------------
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("Citizen");

  // Sidebar Open / Close state (Desktop par open, Mobile par band)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(window.innerWidth >= 768);

  // ----------------------------------------------------
  // 2. CHECK LOGIN & FETCH CITIZEN NAME
  // ----------------------------------------------------
  useEffect(() => {
    // LocalStorage se login data read karna
    const email = localStorage.getItem("citizenEmail");
    const token = localStorage.getItem("token");

    // Agar token ya email nahi hai, to login page par bhej do
    if (!token && !email) {
      navigate("/login", { replace: true });
      return;
    }

    if (email) {
      setUserEmail(email);

      // Backend se citizen ka real name fetch karna
      axios
        .post(
          `${API_URL}/citizen/citizenFetch`,
          { emailid: email },
          { headers: { authorization: `Bearer ${token}` } }
        )
        .then((resp) => {
          if (resp.data.status === true && resp.data.msg) {
            let data = resp.data.msg;
            if (Array.isArray(data)) data = data[0];
            if (data.name) setUserName(data.name);
          }
        })
        .catch(() => console.log("Name fetch fallback"));
    }
  }, [navigate]);

  // ----------------------------------------------------
  // 3. NAVIGATION & LOGOUT HANDLERS
  // ----------------------------------------------------
  function handleNavigation(path: string) {
    navigate(path);
    // Mobile screen par page click hote hi sidebar band ho jaye
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }

  function handleLogout() {
    const isConfirm = window.confirm("Are you sure you want to logout from Evenue?");
    if (isConfirm) {
      localStorage.removeItem("token");
      localStorage.removeItem("citizenEmail");
      localStorage.removeItem("evenue_user");
      navigate("/login", { replace: true });
    }
  }

  // Active page identify karne ke liye
  const isSearchActive = location.pathname.includes("/search");
  const isFavsActive = location.pathname.includes("/favs");
  const isFormActive = location.pathname.includes("/form");

  // Agar user home dashboard par hai to welcome banner dikhao
  const isWelcomePage = !isSearchActive && !isFavsActive && !isFormActive;

  // Profile icon letter (e.g., 'K' ya 'C')
  const initialLetter = (userEmail ? userEmail[0] : userName[0] || "C").toUpperCase();

  // ----------------------------------------------------
  // 4. EXACT SAME USER INTERFACE (UI)
  // ----------------------------------------------------
  return (
    <div className="min-h-screen flex bg-[#f4f6f4] font-sans antialiased text-[#11130F] relative">

      {/* ================= 0. MOBILE BACKDROP OVERLAY ================= */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity"
        />
      )}

      {/* ================= 1. LEFT SIDEBAR ================= */}
      <aside
        className={`bg-[#111c15] text-white flex flex-col justify-between border-r border-[#1a2b21] shrink-0 min-h-screen transition-all duration-300 ease-in-out overflow-y-auto
          fixed inset-y-0 left-0 z-50 md:static
          ${
            isSidebarOpen
              ? "w-64 p-5 translate-x-0"
              : "-translate-x-full md:translate-x-0 md:w-20 md:p-3 md:items-center"
          }
        `}
      >
        <div className="w-full">
          {/* Top Brand & Toggle Button */}
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-white/5">
            {isSidebarOpen ? (
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center">
                  Evenue<span className="text-[#86efac]">.</span>
                </h1>
                <p className="text-[10px] font-semibold tracking-wider text-emerald-500/80 uppercase mt-0.5">
                  Citizen Dashboard
                </p>
              </div>
            ) : (
              <span className="font-bold text-lg text-white mx-auto">
                E<span className="text-[#86efac]">.</span>
              </span>
            )}

            {/* Sidebar Toggle Button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-[#86efac] hover:text-[#111c15] text-gray-300 transition-colors cursor-pointer"
              title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
            >
              <svg
                className={`w-4 h-4 transform transition-transform duration-300 ${
                  isSidebarOpen ? "rotate-0" : "rotate-180"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* User Mini Profile Card */}
          {isSidebarOpen ? (
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
          ) : (
            <div
              className="mb-6 w-10 h-10 rounded-xl bg-[#86efac] text-[#111c15] font-bold text-sm flex items-center justify-center mx-auto shadow-sm"
              title={`${userName} (${userEmail})`}
            >
              {initialLetter}
            </div>
          )}

          {/* Menu Title */}
          {isSidebarOpen && (
            <div className="mb-2">
              <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                Workspace
              </span>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1.5 w-full">
            {/* 1. Profile / Home */}
            <button
              onClick={() => handleNavigation("/citizendash")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                !isSidebarOpen && "md:justify-center md:px-2"
              } ${
                isWelcomePage
                  ? "bg-[#86efac] text-[#0f1712] shadow-sm"
                  : "text-gray-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm-1-13h2v6h-2zm0 8h2v2h-2z" />
              </svg>
              {isSidebarOpen && <span>Profile</span>}
            </button>

            {/* 2. Search Vendors */}
            <button
              onClick={() => handleNavigation("search")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                !isSidebarOpen && "md:justify-center md:px-2"
              } ${
                isSearchActive
                  ? "bg-[#86efac] text-[#0f1712] shadow-sm"
                  : "text-gray-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {isSidebarOpen && <span>Search Vendors</span>}
            </button>

            {/* 3. My Favourites */}
            <button
              onClick={() => handleNavigation("favs")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                !isSidebarOpen && "md:justify-center md:px-2"
              } ${
                isFavsActive
                  ? "bg-[#86efac] text-[#0f1712] shadow-sm"
                  : "text-gray-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {isSidebarOpen && <span>My Favourites</span>}
            </button>

            {/* 4. Citizen Form */}
            <button
              onClick={() => handleNavigation("form")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                !isSidebarOpen && "md:justify-center md:px-2"
              } ${
                isFormActive
                  ? "bg-[#86efac] text-[#0f1712] shadow-sm"
                  : "text-gray-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {isSidebarOpen && <span>Citizen Form</span>}
            </button>
          </nav>
        </div>

        {/* Bottom Logout Button */}
        <div className="pt-4 pb-2 border-t border-white/5 w-full">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition cursor-pointer ${
              !isSidebarOpen && "md:justify-center md:px-1"
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {isSidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ================= 2. MAIN CONTENT AREA ================= */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-x-hidden">

        {/* Top Navbar */}
        <header className="px-4 sm:px-6 py-3 sm:py-4 bg-white/70 backdrop-blur-sm border-b border-gray-200/60 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-xl bg-gray-100 hover:bg-emerald-950 hover:text-white text-gray-700 transition cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div>
              <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Citizen Workspace
              </p>
              <h2 className="text-xs sm:text-sm font-semibold text-gray-800 truncate max-w-[170px] sm:max-w-none">
                Evenue Event Management
              </h2>
            </div>
          </div>

          {/* User Mini Avatar */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-gray-800 capitalize">{userName}</p>
              <p className="text-[10px] text-gray-400">Citizen Account</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#86efac] text-[#111c15] font-bold text-xs flex items-center justify-center shrink-0">
              {initialLetter}
            </div>
          </div>
        </header>

        {/* Main Body */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          {isWelcomePage ? (
            /* Welcome Hero + Quick Action Cards */
            <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto">
              
              {/* HERO BANNER */}
              <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-[#143225] text-white p-6 sm:p-10 shadow-sm">
                <div className="absolute -right-12 -top-12 w-48 h-48 sm:w-64 sm:h-64 rounded-full border-[14px] sm:border-[18px] border-emerald-800/30 pointer-events-none" />

                <div className="relative z-10 max-w-xl">
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-600/40 text-emerald-300 mb-3 sm:mb-4">
                    Citizen Dashboard
                  </span>

                  <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-white mb-2 leading-tight">
                    Welcome Back,<br />
                    <span className="break-all text-[#86efac]">{userEmail}!</span>
                  </h1>

                  <p className="text-emerald-100/75 text-xs sm:text-sm leading-relaxed mb-6 font-normal">
                    Welcome to Evenue. Discover trusted event vendors, save your favourites and make every celebration special.
                  </p>

                  <button
                    onClick={() => handleNavigation("search")}
                    className="inline-flex items-center gap-2 bg-[#86efac] hover:bg-[#6ee7b7] text-[#0f1712] text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-sm cursor-pointer"
                  >
                    <span>Explore Vendors</span>
                    <span>→</span>
                  </button>
                </div>
              </div>

              {/* 3 QUICK NAVIGATION CARDS */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Quick Navigation
                </p>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                  Manage Your Account
                </h3>
                <p className="text-xs text-gray-500 mb-4 sm:mb-5">
                  Select an option to continue.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                  
                  {/* Card 1: Search Vendors */}
                  <div
                    onClick={() => handleNavigation("search")}
                    className="bg-white rounded-2xl border border-gray-200/70 p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group active:scale-[0.99]"
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
                    onClick={() => handleNavigation("favs")}
                    className="bg-white rounded-2xl border border-gray-200/70 p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group active:scale-[0.99]"
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

                  {/* Card 3: Citizen Form */}
                  <div
                    onClick={() => handleNavigation("form")}
                    className="bg-white rounded-2xl border border-gray-200/70 p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group active:scale-[0.99]"
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
            /* CHILD ROUTES RENDER CONTAINER (Search, Favs, Form) */
            <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200/70 p-4 sm:p-6 shadow-sm overflow-x-auto">
              <Outlet />
            </div>
          )}
        </main>

      </div>

    </div>
  );
}