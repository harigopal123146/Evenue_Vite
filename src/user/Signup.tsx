import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const BACKEND_URL = 'http://localhost:2005';

export default function Signup() {
  const navigate = useNavigate();

  // Mobile menu toggle for customized navbar
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // ==========================================
  // 1. FORM STATE VARIABLES
  // ==========================================
  const [emailid, setEmailid] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [utype, setUtype] = useState<'Citizen' | 'Vendor'>('Citizen');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [emailStatus, setEmailStatus] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // ==========================================
  // 2. VALIDATION HELPERS
  // ==========================================
  function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  function isStrongPassword(pwd: string): boolean {
    const strongRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{6,}$/;
    return strongRegex.test(pwd);
  }

  // 🔍 Live Email Availability Check
  async function checkEmailInDatabase() {
    const cleanEmail = emailid.trim().toLowerCase();
    if (!cleanEmail || !isValidEmail(cleanEmail)) return;

    try {
      setEmailStatus('Checking...');
      
      const response = await axios.post(`${BACKEND_URL}/user/checkEmail`, {
        emailid: cleanEmail,
      });

      if (response.data.exists === true) {
        setEmailStatus('Already Registered');
        setErrors((prev) => ({
          ...prev,
          emailid: 'This email is already registered! Please log in.',
        }));
      } else {
        setEmailStatus('Available');
        setErrors((prev) => ({ ...prev, emailid: '' }));
      }
    } catch {
      setEmailStatus('');
    }
  }

  // 🔒 Password Strength Meter
  function handlePasswordChange(val: string) {
    setPassword(val);
    setErrors((prev) => ({ ...prev, password: '' }));

    if (!val) {
      setPasswordStatus('');
      return;
    }

    const emailUsername = emailid.split('@')[0].toLowerCase();
    if (emailUsername && emailUsername.length >= 3 && val.toLowerCase().includes(emailUsername)) {
      setPasswordStatus('Cannot contain your email name');
      return;
    }

    if (val.length < 6) {
      setPasswordStatus('Too Short (Min 6 chars)');
    } else if (!isStrongPassword(val)) {
      setPasswordStatus('Weak: Add letter, number & symbol (@$!%*?&#)');
    } else {
      setPasswordStatus('Strong Password');
    }
  }

  function validateForm(): boolean {
    const newErrors: { [key: string]: string } = {};

    if (!emailid.trim()) {
      newErrors.emailid = 'Email address is required!';
    } else if (!isValidEmail(emailid.trim())) {
      newErrors.emailid = 'Please enter a valid email address.';
    } else if (emailStatus === 'Already Registered') {
      newErrors.emailid = 'This email is already registered. Please log in!';
    }

    if (!password) {
      newErrors.password = 'Password is required!';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    } else if (!isStrongPassword(password)) {
      newErrors.password = 'Include at least 1 letter, 1 number, and 1 symbol (@$!%*?&#).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ==========================================
  // 3. SUBMIT HANDLER
  // ==========================================
  async function doSignup(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      const payload = {
        emailid: emailid.trim().toLowerCase(),
        password: password,
        utype: utype,
      };


    const API_URL = import.meta.env.VITE_API_URL;
    alert(API_URL)
     const response = await axios.post(`${API_URL}/user/signup`, payload,
  {
    withCredentials: true
  }
);

      if (response.data.status === true) {
        alert(response.data.msg || '🎉 Signup Successful! Welcome to Evenue.');
        navigate('/login');
      } else {
        alert(response.data.msg || 'Signup failed, please try again.');
        if (response.data.msg?.toLowerCase().includes('already')) {
          setErrors((prev) => ({ ...prev, emailid: response.data.msg }));
          setEmailStatus('Already Registered');
        }
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      alert(error.response?.data?.msg || 'Error connecting to server. Please try again!');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#11130F] flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* ========================================================
          1. CUSTOMIZED FULL NAVIGATION BAR
         ======================================================== */}
      <nav className="sticky top-0 z-50 bg-[#FBFBFA]/90 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 text-xl font-medium tracking-tight text-emerald-950 transition hover:opacity-85"
          >
            <span className="w-10 h-10 rounded-xl bg-emerald-950 text-amber-300 font-serif italic text-xl flex items-center justify-center shadow-md shadow-emerald-950/20">
              E
            </span>
            <span className="font-serif text-2xl tracking-tight text-stone-900 font-bold">
              Evenue<span className="text-emerald-700">.</span>
            </span>
          </Link>

          {/* Desktop Nav Links (Find Vendors Removed) */}
          <div className="hidden md:flex items-center space-x-8 text-xs font-semibold uppercase tracking-wider text-stone-600">
            <Link to="/" className="hover:text-emerald-950 transition">
              Home
            </Link>
            <Link to="/#services" className="hover:text-emerald-950 transition">
              Services
            </Link>
            <Link to="/#help-us" className="hover:text-emerald-950 transition">
              Help Us
            </Link>
            <Link to="/#vendors-section" className="hover:text-emerald-950 transition">
              For Vendors
            </Link>
          </div>

          {/* Action Button: Sign In */}
          <div className="hidden md:flex items-center space-x-3">
            <span className="text-xs text-stone-500 font-light">Already registered?</span>
            <button
              onClick={() => navigate("/login")}
              type="button"
              className="px-6 py-2.5 text-xs font-semibold text-emerald-950 border border-emerald-950 hover:bg-emerald-950 hover:text-white rounded-full transition active:scale-95 cursor-pointer shadow-xs"
            >
              Sign In
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              type="button"
              className="p-2 rounded-xl text-stone-700 hover:text-emerald-950 hover:bg-stone-100 transition"
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

        {/* Mobile Dropdown Menu (Find Vendors Removed) */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-stone-200 px-6 py-5 space-y-4 shadow-xl">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="block text-sm font-semibold text-emerald-950">
              Home
            </Link>
            <Link to="/#services" onClick={() => setIsMobileMenuOpen(false)} className="block text-sm font-medium text-stone-700 hover:text-emerald-950">
              Services
            </Link>
            <Link to="/#help-us" onClick={() => setIsMobileMenuOpen(false)} className="block text-sm font-medium text-stone-700 hover:text-emerald-950">
              Help Us (FAQ)
            </Link>
            <Link to="/#vendors-section" onClick={() => setIsMobileMenuOpen(false)} className="block text-sm font-medium text-stone-700 hover:text-emerald-950">
              For Vendors
            </Link>
            
            <div className="pt-3 border-t border-stone-100">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate("/login");
                }}
                className="w-full py-2.5 text-center text-xs font-semibold text-emerald-950 border border-emerald-950 rounded-full"
              >
                Sign In to Account
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ========================================================
          2. SIGNUP CONTAINER
         ======================================================== */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl border border-gray-200/70 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
          
          {/* Left Column: Form */}
          <div className="lg:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-between">
            <div>
              
              <div className="mb-6">
                <span className="text-xs font-bold tracking-widest text-emerald-800 uppercase">
                  GET STARTED
                </span>
                <h1 className="font-serif text-3xl sm:text-4xl text-gray-900 tracking-tight mt-1">
                  Create your Evenue account
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 font-light mt-1.5">
                  Join our curated network as an event host or verified vendor.
                </p>
              </div>

              <form onSubmit={doSignup} className="space-y-5" noValidate>
                
                {/* 1. Account Role Cards */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
                    I want to join as <span className="text-red-500">*</span>
                  </label>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      onClick={() => {
                        setUtype('Citizen');
                        setErrors((prev) => ({ ...prev, utype: '' }));
                      }}
                      className={`cursor-pointer rounded-2xl p-3.5 border-2 transition-all duration-200 select-none flex items-center justify-between ${
                        utype === 'Citizen'
                          ? 'border-emerald-900 bg-emerald-50/40 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 bg-gray-50/30'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${
                          utype === 'Citizen' ? 'bg-emerald-950 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                          👤
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">Citizen</p>
                          <p className="text-[10px] text-gray-500">Host events</p>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        utype === 'Citizen' ? 'border-emerald-900 bg-emerald-900' : 'border-gray-300'
                      }`}>
                        {utype === 'Citizen' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>

                    <div
                      onClick={() => {
                        setUtype('Vendor');
                        setErrors((prev) => ({ ...prev, utype: '' }));
                      }}
                      className={`cursor-pointer rounded-2xl p-3.5 border-2 transition-all duration-200 select-none flex items-center justify-between ${
                        utype === 'Vendor'
                          ? 'border-emerald-900 bg-emerald-50/40 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 bg-gray-50/30'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${
                          utype === 'Vendor' ? 'bg-emerald-950 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                          🏢
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">Vendor</p>
                          <p className="text-[10px] text-gray-500">Provide services</p>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        utype === 'Vendor' ? 'border-emerald-900 bg-emerald-900' : 'border-gray-300'
                      }`}>
                        {utype === 'Vendor' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Email Address */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={emailid}
                      onChange={(e) => {
                        setEmailid(e.target.value);
                        setErrors((prev) => ({ ...prev, emailid: '' }));
                      }}
                      onBlur={checkEmailInDatabase}
                      placeholder="name@example.com"
                      className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all duration-200 ${
                        errors.emailid
                          ? 'border-red-400 bg-red-50/20 focus:ring-1 focus:ring-red-400'
                          : 'border-gray-200 bg-gray-50/40 focus:bg-white focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900'
                      }`}
                    />

                    {emailStatus && (
                      <span
                        className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                          emailStatus === 'Available'
                            ? 'text-emerald-800 bg-emerald-50'
                            : emailStatus === 'Already Registered'
                            ? 'text-red-600 bg-red-50'
                            : 'text-amber-700 bg-amber-50'
                        }`}
                      >
                        {emailStatus === 'Available' ? '✓ ' + emailStatus : emailStatus}
                      </span>
                    )}
                  </div>
                  {errors.emailid && <p className="text-xs text-red-600 font-medium mt-1.5">{errors.emailid}</p>}
                </div>

                {/* 3. Password */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      placeholder="••••••••••••"
                      className={`w-full px-4 py-3 pr-16 rounded-xl border text-sm outline-none transition-all duration-200 ${
                        errors.password
                          ? 'border-red-400 bg-red-50/20 focus:ring-1 focus:ring-red-400'
                          : 'border-gray-200 bg-gray-50/40 focus:bg-white focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900'
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 hover:text-emerald-950 focus:outline-none transition-colors cursor-pointer px-1 py-0.5"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  {passwordStatus && (
                    <p
                      className={`text-xs font-medium mt-1.5 flex items-center gap-1.5 ${
                        passwordStatus === 'Strong Password'
                          ? 'text-emerald-700'
                          : passwordStatus.includes('Weak')
                          ? 'text-amber-600'
                          : 'text-red-600'
                      }`}
                    >
                      <span className="text-[10px]">●</span> {passwordStatus}
                    </p>
                  )}

                  {errors.password && (
                    <p className="text-xs text-red-600 font-medium mt-1.5">{errors.password}</p>
                  )}
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || emailStatus === 'Already Registered'}
                    className="w-full py-3.5 bg-emerald-950 hover:bg-emerald-900 text-white font-medium text-sm tracking-wide rounded-full shadow-sm hover:shadow-md transition-all duration-300 ease-in-out cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span>Creating Account...</span>
                    ) : (
                      <>
                        <span>Create Evenue Account</span>
                        <span>→</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>

            <div className="pt-6 text-center border-t border-gray-100 mt-6">
              <p className="text-xs text-gray-500">
                Already registered with Evenue?{' '}
                <Link to="/login" className="font-semibold text-emerald-950 hover:underline">
                  Sign In to your dashboard
                </Link>
              </p>
            </div>

          </div>

          {/* Right Column: Hero Visual */}
          <div className="lg:col-span-5 relative bg-emerald-950 p-8 sm:p-10 flex flex-col justify-between overflow-hidden min-h-[380px]">
            <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-emerald-800/30 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-emerald-600/20 blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/80 border border-emerald-700/60 text-emerald-200 text-[10px] font-semibold tracking-widest uppercase">
                <span>✦</span> Verified Event Network
              </span>
            </div>

            <div className="relative z-10 my-auto py-6 space-y-6">
              <div className="w-full h-48 rounded-2xl overflow-hidden border border-emerald-700/40 shadow-xl relative group">
                <img
                  src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80"
                  alt="Evenue Event Celebration"
                  className="w-full h-full object-cover grayscale opacity-90 transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-transparent to-transparent" />
              </div>

              <div className="space-y-2">
                <h2 className="font-serif text-2xl sm:text-3xl text-white leading-snug">
                  &ldquo;New Beginnings. Beautifully Planned.&rdquo;
                </h2>
                <p className="text-xs text-emerald-200/80 font-light leading-relaxed">
                  Join thousands of citizens booking trusted vendors for weddings, path ceremonies, birthdays, and celebrations.
                </p>
              </div>
            </div>

            <div className="relative z-10 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4">
              <p className="text-[10px] font-semibold tracking-widest text-emerald-300 uppercase">
                ONE ECOSYSTEM
              </p>
              <p className="text-xs text-white/90 font-light mt-0.5">
                Verified vendors, Aadhaar-verified citizens, and seamless bookings.
              </p>
            </div>

          </div>

        </div>
      </main>

    </div>
  );
}