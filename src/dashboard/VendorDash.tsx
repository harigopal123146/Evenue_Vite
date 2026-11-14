
import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

export default function VendorDash() {
  const navigate = useNavigate();
  const location = useLocation();

  // Logged-in Vendor Information
  const [vendorEmail, setVendorEmail] = useState<string>("");
  const [businessName, setBusinessName] = useState<string>("Vendor Business");
  const [ownerName, setOwnerName] = useState<string>("Registered Vendor");
  const [shopPic, setShopPic] = useState<string>("");

  // Sidebar toggle state (true = expanded, false = collapsed)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // ----------------------------------------------------
  // 1. Load Vendor Details & Check Authentication on Mount
  // ----------------------------------------------------
  useEffect(() => {
    let email = localStorage.getItem("vendorEmail");
    const token = localStorage.getItem("token");

    // 🔒 Security Check: If no token or email exists, force redirect to login
    if (!token || (!email && !localStorage.getItem("evenue_user"))) {
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
      setVendorEmail(cleanEmail);

      // ✨ Smart Initial Fallback: Email username se clean name banao (e.g. royaldecor -> Royaldecor)
      const emailPrefix = cleanEmail.split("@")[0];
      const initialName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
      setOwnerName(initialName);

      // Fetch vendor details from MongoDB
      axios
        .post(
          "http://localhost:2005/vendor/vendorFetch",
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
      
      alert("Signed out successfully.");
      navigate("/", { replace: true });
    }
  }

  // Active route checker
  const isActive = (path: string) => location.pathname.includes(path);

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
                  Vendor Partner
                </span>
              </div>
              <p className="text-emerald-200/70 text-xs hidden sm:block font-light">
                Professional Event Management & Service Portal
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
                  {displayName}!
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600/90 hover:bg-red-600 text-white text-xs font-semibold rounded-full transition-all duration-200 shadow-sm active:scale-95 cursor-pointer hover:shadow-red-900/20"
              title="Sign Out"
            >
              Sign Out
            </button>
          </div>

        </div>
      </header>

      {/* ==================================================== */}
      {/* 2. DASHBOARD BODY: SIDEBAR + MAIN OUTLET CONTAINER  */}
      {/* ==================================================== */}
      <div className="flex-1 flex overflow-hidden p-4 md:p-6 gap-6">

        {/* LEFT SIDEBAR */}
        <aside
          className={`bg-white rounded-3xl border border-gray-200/70 shadow-lg transition-all duration-300 flex flex-col ${
            isSidebarOpen ? "w-72 p-5" : "w-20 p-3 items-center"
          }`}
        >
          {/* Top Collapse Toggle */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 w-full">
            {isSidebarOpen && (
              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Vendor Console
              </span>
            )}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-xl bg-gray-100 hover:bg-emerald-950 hover:text-white text-gray-600 transition-colors duration-200 cursor-pointer"
              title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              <svg
                className={`w-4 h-4 transform transition-transform duration-200 ${
                  isSidebarOpen ? "rotate-180" : "rotate-0"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* VENDOR PROFILE CARD */}
          {isSidebarOpen ? (
            <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 text-white shadow-md relative overflow-hidden group">
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-amber-300 text-base flex-shrink-0 shadow-sm overflow-hidden">
                  {shopPic ? (
                    <img src={shopPic} alt={businessName} className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>

                <div className="overflow-hidden">
                  <span className="text-sm font-semibold truncate block capitalize">
                    {businessName}
                  </span>
                  <span className="text-[11px] text-emerald-200/90 truncate block capitalize">
                    Owner: {ownerName}
                  </span>
                  <span className="text-[10px] text-emerald-300/80 truncate block font-mono font-light">
                    {vendorEmail || "vendor@evenue.com"}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-emerald-300/80">
                <span>Vendor Partner</span>
                <span className="flex items-center gap-1.5 text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Verified Business
                </span>
              </div>
            </div>
          ) : (
            <div
              className="mb-4 w-11 h-11 rounded-xl bg-emerald-950 text-amber-300 flex items-center justify-center font-bold text-xs shadow-md overflow-hidden cursor-pointer"
              title={`${businessName} (${vendorEmail})`}
            >
              {shopPic ? (
                <img src={shopPic} alt="" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
          )}

          {/* Navigation Menu Buttons */}
          <nav className="flex-1 space-y-2 w-full">
            <button
              onClick={() => navigate("profile")}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                isActive("profile") || location.pathname === "/vendordash"
                  ? "bg-emerald-950 text-amber-300 shadow-md shadow-emerald-950/20"
                  : "text-gray-600 hover:bg-emerald-50/60 hover:text-emerald-950"
              }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {isSidebarOpen && <span>Business Profile</span>}
            </button>
          </nav>

          {/* Bottom Logout Button */}
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
