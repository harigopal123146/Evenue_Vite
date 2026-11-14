
import React, { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";

const Main1: React.FC = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const eventCategories = [
    {
      title: "Weddings & Receptions",
      tag: "Premier Venues & Planners",
      img: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80",
    },
    {
      title: "Religious & Path Ceremonies",
      tag: "Akhand Path, Jagran & Bhog",
      img: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=600&q=80",
    },
    {
      title: "Luxury Catering & Food",
      tag: "Multi-Cuisine Experts",
      img: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=600&q=80",
    },
    {
      title: "Decor & Lighting",
      tag: "Floral, Stage & Ambience",
      img: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=600&q=80",
    },
    {
      title: "Photography & Cinema",
      tag: "Candid, Drone & Pre-Wedding",
      img: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=600&q=80",
    },
    {
      title: "Live Music, DJ & Sound",
      tag: "Bhangra, Acoustic & Bands",
      img: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBFA] text-[#11130F] font-sans selection:bg-emerald-100 selection:text-emerald-950">
      
      {/* ========================================================
          1. NAVIGATION BAR (Find Vendors Removed)
         ======================================================== */}
      <nav className="sticky top-0 z-50 bg-[#FBFBFA]/85 backdrop-blur-md border-b border-gray-200/60 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link
            to="/"
            className="group flex items-center gap-2.5 text-xl font-medium tracking-tight text-emerald-950 transition-opacity hover:opacity-85"
          >
            <span className="w-9 h-9 rounded-xl bg-emerald-950 text-white font-serif italic text-lg flex items-center justify-center shadow-sm">
              E
            </span>
            <span className="font-serif text-2xl tracking-tight text-gray-900">
              Evenue<span className="text-emerald-800">.</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-8 text-xs font-semibold uppercase tracking-wider text-gray-600">
            <Link to="/" className="text-emerald-950 font-bold hover:text-emerald-700 transition-colors">
              Home
            </Link>
            <a href="#services" className="hover:text-emerald-950 transition-colors">
              Services
            </a>
            <a href="#features" className="hover:text-emerald-950 transition-colors">
              Why Evenue
            </a>
            <a href="#vendors" className="hover:text-emerald-950 transition-colors">
              For Vendors
            </a>
          </div>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <button
              onClick={() => navigate("/login")}
              type="button"
              className="px-5 py-2 text-xs font-semibold text-emerald-950 hover:bg-emerald-50/80 rounded-full transition-all duration-200 cursor-pointer"
            >
              Sign In
            </button>

            <button
              onClick={() => navigate("/signup")}
              type="button"
              className="px-6 py-2.5 text-xs font-semibold text-white bg-emerald-950 hover:bg-emerald-900 rounded-full shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 cursor-pointer"
            >
              Get Started
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              type="button"
              className="p-2 rounded-xl text-gray-700 hover:text-emerald-950 hover:bg-gray-100 transition"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-200 px-6 py-5 space-y-4 shadow-xl">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-sm font-semibold text-emerald-950"
            >
              Home
            </Link>
            <a
              href="#services"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-sm font-medium text-gray-700 hover:text-emerald-950"
            >
              Services
            </a>
            <a
              href="#features"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-sm font-medium text-gray-700 hover:text-emerald-950"
            >
              Why Evenue
            </a>
            <a
              href="#vendors"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-sm font-medium text-gray-700 hover:text-emerald-950"
            >
              For Vendors
            </a>
            
            <div className="pt-3 border-t border-gray-100 flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate("/login");
                }}
                className="w-full py-2.5 text-center text-xs font-semibold text-emerald-950 border border-emerald-950 rounded-full"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate("/signup");
                }}
                className="w-full py-2.5 text-center text-xs font-semibold text-white bg-emerald-950 rounded-full shadow-sm"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ========================================================
          2. HERO SECTION (Clean Pic, Badges Removed)
         ======================================================== */}
      <section id="home" className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 px-6 sm:px-8">
        
        {/* Subtle Background Glows */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-100/40 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-950 tracking-wide uppercase">
                Verified Event Marketplace
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-gray-900 tracking-tight leading-[1.12]">
              Crafting unforgettable moments, <span className="italic font-light text-emerald-900">perfectly planned.</span>
            </h1>

            {/* Sub-text */}
            <p className="text-base sm:text-lg text-gray-600 font-light max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              From intimate family path ceremonies to grand weddings and celebrations — connect with verified caterers, photographers, decorators, and planners in your city.
            </p>

            {/* CTA Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={() => navigate("/signup")}
                type="button"
                className="w-full sm:w-auto px-8 py-4 bg-emerald-950 hover:bg-emerald-900 text-white font-medium text-sm tracking-wide rounded-full shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer active:scale-95"
              >
                Find Event Vendors →
              </button>

              <button
                onClick={() => navigate("/signup")}
                type="button"
                className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-50 text-emerald-950 font-medium text-sm tracking-wide rounded-full border border-gray-300 shadow-xs transition-all duration-200 cursor-pointer active:scale-95"
              >
                Join as a Vendor
              </button>
            </div>

            {/* Trust Metrics Bar */}
            <div className="pt-6 border-t border-gray-200/70 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-gray-600 font-medium">
              <div className="flex items-center gap-2">
                <span className="text-emerald-800 text-sm">✓</span> 100% Aadhaar Verified
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-800 text-sm">★</span> 4.9/5 Client Rating
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-800 text-sm">🛡️</span> Direct Contact & Quotes
              </div>
            </div>

          </div>

          {/* Right Hero Visual Showcase (New Crisp Photo, Badges Completely Removed) */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Primary Visual Card */}
              <div className="rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white aspect-[4/5] relative group">
                <img
                  src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80"
                  alt="Evenue Luxury Celebration"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/85 via-black/20 to-transparent flex items-end p-8 text-white">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-300">
                      Curated Experiences
                    </span>
                    <h3 className="font-serif text-2xl text-white mt-1 font-bold">
                      Weddings & Banquets
                    </h3>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

      </section>

      {/* ========================================================
          3. FEATURED EVENT CATEGORIES
         ======================================================== */}
      <section id="services" className="py-16 sm:py-24 bg-white border-y border-gray-200/60 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-800">
                BROWSE BY OCCASION
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-gray-900 tracking-tight mt-1">
                Everything for your special day
              </h2>
            </div>

            <button
              onClick={() => navigate("/login")}
              className="text-xs font-bold uppercase tracking-wider text-emerald-950 hover:text-emerald-700 flex items-center gap-1 transition cursor-pointer"
            >
              <span>Explore All Categories</span>
              <span>→</span>
            </button>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventCategories.map((cat, idx) => (
              <div
                key={idx}
                onClick={() => navigate("/login")}
                className="group relative rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200/80 cursor-pointer h-72 flex flex-col justify-end p-6"
              >
                {/* Background Image */}
                <img
                  src={cat.img}
                  alt={cat.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent group-hover:from-emerald-950/90 transition-colors" />

                {/* Content */}
                <div className="relative z-10 text-white space-y-1">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-300">
                    {cat.tag}
                  </span>
                  <h3 className="font-serif text-xl sm:text-2xl text-white font-bold">
                    {cat.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================
          4. WHY CHOOSE EVENUE
         ======================================================== */}
      <section id="features" className="py-20 sm:py-28 px-6 sm:px-8 bg-[#FBFBFA]">
        <div className="max-w-7xl mx-auto space-y-16">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-800">
              TRUSTED & TRANSPARENT
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-gray-900 tracking-tight">
              Why citizens and vendors choose Evenue
            </h2>
            <p className="text-sm text-gray-500 font-light">
              We eliminate the stress of finding verified event partners with transparent profiles and direct communication.
            </p>
          </div>

          {/* 4 Feature Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            
            <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-950 flex items-center justify-center text-xl mb-6 shadow-inner font-serif">
                🛡️
              </div>
              <h3 className="font-serif text-xl font-bold text-gray-900 mb-2">Aadhaar Verified</h3>
              <p className="text-xs text-gray-500 font-light leading-relaxed">
                Every citizen and vendor profile is verified through GenAI Aadhaar OCR for authentic business interactions.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-950 flex items-center justify-center text-xl mb-6 shadow-inner font-serif">
                📍
              </div>
              <h3 className="font-serif text-xl font-bold text-gray-900 mb-2">City-Specific Search</h3>
              <p className="text-xs text-gray-500 font-light leading-relaxed">
                Filter local caterers, decorators, and venues operating directly in your city for timely service delivery.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-950 flex items-center justify-center text-xl mb-6 shadow-inner font-serif">
                📞
              </div>
              <h3 className="font-serif text-xl font-bold text-gray-900 mb-2">Direct Contact</h3>
              <p className="text-xs text-gray-500 font-light leading-relaxed">
                Connect directly via telephone, WhatsApp, Instagram portfolio, and email without intermediary commissions.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-950 flex items-center justify-center text-xl mb-6 shadow-inner font-serif">
                ❤️
              </div>
              <h3 className="font-serif text-xl font-bold text-gray-900 mb-2">Shortlist & Compare</h3>
              <p className="text-xs text-gray-500 font-light leading-relaxed">
                Save your favorite vendors with one tap, compare pricing and portfolios, and plan at your own pace.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================
          5. VENDOR PARTNER CALLOUT BANNER
         ======================================================== */}
      <section id="vendors" className="py-12 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto rounded-[2.5rem] bg-emerald-950 text-white p-8 sm:p-14 shadow-2xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
          
          <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-emerald-800/30 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-xl space-y-3 text-center lg:text-left">
            <span className="text-xs font-bold tracking-widest text-emerald-300 uppercase">
              GROW YOUR EVENT BUSINESS
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-white tracking-tight">
              Are you a photographer, caterer, or decorator?
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 font-light leading-relaxed">
              Join Evenue as a verified vendor partner. Showcase your portfolio to thousands of citizens looking for event professionals.
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <button
              onClick={() => navigate("/signup")}
              className="px-8 py-4 bg-white hover:bg-gray-100 text-emerald-950 font-semibold text-xs tracking-wider uppercase rounded-full shadow-lg transition active:scale-95 cursor-pointer text-center"
            >
              Register as Vendor →
            </button>
          </div>

        </div>
      </section>

      {/* ========================================================
          6. FOOTER
         ======================================================== */}
      <footer className="mt-auto bg-white border-t border-gray-200/80 pt-16 pb-12 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
            
            {/* Col 1: Brand */}
            <div className="space-y-4">
              <Link to="/" className="flex items-center gap-2 text-xl font-medium tracking-tight text-emerald-950">
                <span className="w-8 h-8 rounded-xl bg-emerald-950 text-white font-serif italic text-base flex items-center justify-center">
                  E
                </span>
                <span className="font-serif text-2xl tracking-tight text-gray-900 font-bold">
                  Evenue<span className="text-emerald-800">.</span>
                </span>
              </Link>
              <p className="text-xs text-gray-500 font-light leading-relaxed">
                Premier Event & Vendor Management Platform connecting verified citizens with top-rated event professionals.
              </p>
            </div>

            {/* Col 2: Citizen Links */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-900">For Citizens</p>
              <ul className="space-y-2 text-xs text-gray-600">
                <li><Link to="/citizendash/search" className="hover:text-emerald-950 transition">Find Vendors</Link></li>
                <li><Link to="/citizendash/favs" className="hover:text-emerald-950 transition">Saved Wishlist</Link></li>
                <li><Link to="/citizendash/profile" className="hover:text-emerald-950 transition">Citizen Verification</Link></li>
              </ul>
            </div>

            {/* Col 3: Vendor Links */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-900">For Vendors</p>
              <ul className="space-y-2 text-xs text-gray-600">
                <li><Link to="/vendordash/profile" className="hover:text-emerald-950 transition">Vendor Dashboard</Link></li>
                <li><Link to="/signup" className="hover:text-emerald-950 transition">Partner Registration</Link></li>
                <li><Link to="/login" className="hover:text-emerald-950 transition">Vendor Portal Login</Link></li>
              </ul>
            </div>

            {/* Col 4: Platform */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-900">Security & Trust</p>
              <p className="text-xs text-gray-500 font-light leading-relaxed">
                Evenue is designed to make discovering event professionals simple, convenient, and transparent.
              </p>
            </div>

            {/* Col 5: Developer Contact */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-900">Connect with Developer</p>
              <p className="text-xs text-gray-500 font-light">Hari Gopal</p>
              <a
                href="mailto:goyalharry62@gmail.com"
                className="block text-xs text-gray-600 hover:text-emerald-800 transition-colors break-words"
              >
                goyalharry62@gmail.com
              </a>
              <a
                href="https://github.com/harigopal123146"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-gray-600 hover:text-emerald-800 transition-colors"
              >
                <span aria-hidden="true">↗</span> GitHub
              </a>
              <a
                href="https://www.linkedin.com/in/hari-gopal-77b80b3b5/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-gray-600 hover:text-emerald-800 transition-colors"
              >
                <span aria-hidden="true">↗</span> LinkedIn
              </a>
            </div>

          </div>

          <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-4">
            <p>© {new Date().getFullYear()} Evenue Event Platform. All rights reserved.</p>
            <div className="flex gap-6">
              <span className="hover:text-gray-600 cursor-pointer">Privacy Policy</span>
              <span className="hover:text-gray-600 cursor-pointer">Terms of Service</span>
            </div>
          </div>

        </div>
      </footer>

      {/* Outlet in case child routes are rendered */}
      <Outlet />

    </div>
  );
};

export default Main1;
