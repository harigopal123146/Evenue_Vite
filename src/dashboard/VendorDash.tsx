import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export default function VendorDash() {
  const navigate = useNavigate();
  const location = useLocation();

  // Logged-in Vendor Information
  const [businessName, setBusinessName] = useState<string>("Vendor Business");
  const [ownerName, setOwnerName] = useState<string>("Registered Vendor");
  const [shopPic, setShopPic] = useState<string>("");

  // 👉 Sidebar Slide Toggle State (true = Open, false = Closed/Slide)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // ----------------------------------------------------
  // 1. Check Authentication & Fetch Vendor Details
  // ----------------------------------------------------
  useEffect(() => {
    let email = localStorage.getItem("vendorEmail");
    const token = localStorage.getItem("token");

    // 🔒 Security Check: Redirect to login if not authenticated
    if (!token && !email && !localStorage.getItem("evenue_user")) {
      navigate("/login", { replace: true });
      return;
    }

    if (!email) {
      const storedUser = localStorage.getItem("evenue_user");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          email = parsed.emailid;
        } catch (e) {
          console.error("Error reading stored user:", e);
        }
      }
    }

    if (email) {
      const cleanEmail = email.trim();

      // Email se clean fallback name generate karo
      const emailPrefix = cleanEmail.split("@")[0];
      const initialName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
      setOwnerName(initialName);

      // Backend se vendor details fetch karo
      if (API_URL) {
        axios
          .post(
            `${API_URL}/vendor/vendorFetch`,
            { emailid: cleanEmail },
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
          )
          .then((resp) => {
            if (resp.data.status === true) {
              const rawData = resp.data.msg;
              const data = Array.isArray(rawData) ? rawData[0] : rawData || resp.data.doc;
              if (data) {
                if (data.business && data.business.trim() !== "") setBusinessName(data.business.trim());
                if (data.name && data.name.trim() !== "") setOwnerName(data.name.trim());
                if (data.shoppicurl) setShopPic(data.shoppicurl);
              }
            }
          })
          .catch((err) => console.log("Vendor profile fetch notice:", err));
      }
    }
  }, [navigate]);

  // ----------------------------------------------------
  // 2. Logout Handler
  // ----------------------------------------------------
  function handleLogout() {
    const confirmLogout = window.confirm("Are you sure you want to sign out from Evenue Vendor Portal?");
    if (confirmLogout) {
      localStorage.removeItem("token");
      localStorage.removeItem("vendorEmail");
      localStorage.removeItem("evenue_user");
      navigate("/login", { replace: true });
    }
  }

  // Active route checking
  const isFormActive = location.pathname.includes("/vendorregistration");
  const isWelcomePage = !isFormActive;

  // Name to display in Welcome Greeting
  const displayName =
    businessName !== "Vendor Business" ? businessName : ownerName;

  // Initials for avatar fallback
  const initials = displayName
    ? displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "V";

  return (
    <div className="min-h-screen flex bg-[#f4f6f4] font-sans antialiased text-[#11130F]">
      
      {/* ==================================================== */}
      {/* 1. LEFT SIDEBAR (SLIDE TOGGLE ENABLED)               */}
      {/* ==================================================== */}
      <aside
        className={`bg-[#111c15] text-white flex flex-col justify-between border-r border-[#1a2b21] shrink-0 min-h-screen transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "w-64 p-5" : "w-20 p-3 items-center"
        }`}
      >
        <div className="w-full">
          {/* Top Row: Brand & Side Slide Button */}
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-white/5">
            {isSidebarOpen ? (
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center">
                  Evenue<span className="text-[#86efac]">.</span>
                </h1>
                <p className="text-[10px] font-semibold tracking-wider text-emerald-500/80 uppercase mt-0.5">
                  Vendor Dashboard
                </p>
              </div>
            ) : (
              <span className="font-bold text-lg text-white mx-auto">
                E<span className="text-[#86efac]">.</span>
              </span>
            )}

            {/* 👉 Side Slide Button (Collapse/Expand Arrow) */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-[#86efac] hover:text-[#111c15] text-gray-300 transition-colors cursor-pointer"
              title={isSidebarOpen ? "Slide Close Sidebar" : "Slide Open Sidebar"}
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

          {/* Vendor Profile Mini Card in Sidebar */}
          {isSidebarOpen ? (
            <div className="bg-[#17251d] border border-white/5 rounded-2xl p-3.5 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#86efac] text-[#111c15] font-bold text-base flex items-center justify-center shrink-0 overflow-hidden">
                {shopPic ? (
                  <img src={shopPic} alt={businessName} className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="overflow-hidden">
                <h2 className="text-sm font-semibold text-white truncate capitalize">
                  {businessName}
                </h2>
                <p className="text-[11px] text-gray-300 truncate capitalize">
                  Owner: {ownerName}
                </p>
                <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Verified Partner
                </span>
              </div>
            </div>
          ) : (
            /* Collapsed Profile Icon */
            <div
              className="mb-6 w-10 h-10 rounded-xl bg-[#86efac] text-[#111c15] font-bold text-sm flex items-center justify-center overflow-hidden mx-auto shadow-sm"
              title={`${businessName} (${ownerName})`}
            >
              {shopPic ? (
                <img src={shopPic} alt="" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
          )}

          {/* Menu Category */}
          {isSidebarOpen && (
            <div className="mb-2">
              <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                Workspace
              </span>
            </div>
          )}

          {/* Navigation Items */}
          <nav className="space-y-1.5 w-full">
            {/* 1. Profile (Opens Welcome Screen) */}
            <button
              onClick={() => navigate('/vendordash')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                !isSidebarOpen && "justify-center px-2"
              } ${
                isWelcomePage
                  ? "bg-[#86efac] text-[#0f1712] shadow-sm"
                  : "text-gray-300 hover:text-white hover:bg-white/5"
              }`}
              title="Profile"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {isSidebarOpen && <span>Profile</span>}
            </button>

            {/* 2. Vendor Registration Form */}
            <button
              onClick={() => navigate('vendorregistration')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                !isSidebarOpen && "justify-center px-2"
              } ${
                isFormActive
                  ? "bg-[#86efac] text-[#0f1712] shadow-sm"
                  : "text-gray-300 hover:text-white hover:bg-white/5"
              }`}
              title="Vendor Registration"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {isSidebarOpen && <span>Vendor Registration</span>}
            </button>
          </nav>
        </div>

        {/* Bottom Sign Out Button */}
        <div className="pt-4 border-t border-white/5 w-full">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition cursor-pointer ${
              !isSidebarOpen && "justify-center px-1"
            }`}
            title="Sign Out"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {isSidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ==================================================== */}
      {/* 2. RIGHT PANEL: TOP BAR + MAIN CONTENT               */}
      {/* ==================================================== */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">

        {/* Top Bar Header with Hamburger Slide Button */}
        <header className="px-6 py-4 bg-white/70 backdrop-blur-sm border-b border-gray-200/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 👉 Top Header Slide Hamburger Button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-xl bg-gray-100 hover:bg-emerald-950 hover:text-white text-gray-700 transition cursor-pointer"
              title="Toggle Sidebar Slide"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Vendor Workspace
              </p>
              <h2 className="text-sm font-semibold text-gray-800">
                Evenue Vendor Management
              </h2>
            </div>
          </div>

          {/* Right mini profile avatar */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-800 capitalize">{displayName}</p>
              <p className="text-[10px] text-gray-400">Vendor Account</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#86efac] text-[#111c15] font-bold text-xs flex items-center justify-center overflow-hidden">
              {shopPic ? (
                <img src={shopPic} alt="" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="p-8 flex-1">
          {isWelcomePage ? (
            /* ==================================================== */
            /* 1. PROFILE / WELCOME SCREEN                          */
            /* ==================================================== */
            <div className="space-y-8 max-w-6xl">
              
              {/* HERO BANNER (Dark Forest Green) */}
              <div className="relative overflow-hidden rounded-3xl bg-[#143225] text-white p-8 sm:p-10 shadow-sm">
                
                {/* Decorative Circular Accent */}
                <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full border-[18px] border-emerald-800/30 pointer-events-none" />

                <div className="relative z-10 max-w-xl">
                  {/* Badge */}
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-600/40 text-emerald-300 mb-4">
                    Vendor Dashboard
                  </span>

                  {/* Heading */}
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2 leading-tight">
                    Welcome Back,<br />
                    <span>{displayName}!</span>
                  </h1>

                  {/* Description */}
                  <p className="text-emerald-100/75 text-xs sm:text-sm leading-relaxed mb-6 font-normal">
                    Welcome to Evenue. Manage your event services, update your business registration, and connect with clients for their celebrations.
                  </p>

                  {/* Action Button: Opens the form */}
                  <button
                    onClick={() => navigate('vendorregistration')}
                    className="inline-flex items-center gap-2 bg-[#86efac] hover:bg-[#6ee7b7] text-[#0f1712] text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-sm cursor-pointer"
                  >
                    <span>Open Registration Form</span>
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
                  Manage Your Business
                </h3>
                <p className="text-xs text-gray-500 mb-5">
                  Select an option to update or manage your vendor profile.
                </p>

                {/* ONLY 1 CARD: Vendor Registration */}
                <div className="max-w-md">
                  <div
                    onClick={() => navigate('vendorregistration')}
                    className="bg-white rounded-2xl border border-gray-200/70 p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md">
                        Form
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 group-hover:text-emerald-700 transition">
                      Vendor Registration
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Fill or update your business registration details, address, and contact info.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            /* ==================================================== */
            /* 2. VENDOR REGISTRATION FORM                          */
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