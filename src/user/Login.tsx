import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
const API_URL = import.meta.env.VITE_API_URL;
interface LoginState {
  emailid: string;
  password: string;
}

interface FormErrors {
  emailid?: string;
  password?: string;
  general?: string;
}

interface LoggedInUser {
  emailid: string;
  utype: 'Citizen' | 'Vendor' | 'Admin' | string;
}

function Login() {
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const initial_obj: LoginState = {
    emailid: '',
    password: '',
  };

  const [obj, setObj] = useState<LoginState>(initial_obj);
  const [errors, setErrors] = useState<FormErrors>({});
  const [emailStatus, setEmailStatus] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // --- FORGOT PASSWORD STATES ---
  const [isForgotMode, setIsForgotMode] = useState<boolean>(false);
  const [forgotStep, setForgotStep] = useState<number>(1);
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [forgotMessage, setForgotMessage] = useState<{ text: string; isError: boolean } | null>(null);

  function isValidEmail(email: string): boolean {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email.trim());
  }

  function doUpdateObj(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    if (name === 'emailid') {
      if (value.trim() === '') {
        setEmailStatus('');
      } else if (isValidEmail(value)) {
        setEmailStatus('Valid Email');
      } else {
        setEmailStatus('Invalid Email Format');
      }
    }

    setErrors((prev) => ({
      ...prev,
      [name]: '',
      general: '',
    }));

    setObj((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function validateForm(): boolean {
    const err: FormErrors = {};

    const trimmedEmail = obj.emailid.trim();
    if (!trimmedEmail) {
      err.emailid = 'Email ID is required.';
    } else if (!isValidEmail(trimmedEmail)) {
      err.emailid = 'Please enter a valid email address (e.g., user@example.com).';
    }

    if (!obj.password) {
      err.password = 'Password is required.';
    } else if (obj.password.length < 6) {
      err.password = 'Password must be at least 6 characters.';
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  }

  // ========================================================
  // MAIN LOGIN FUNCTION
  // ========================================================
  async function doLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      setErrors({});

      // const url = 'http://localhost:2005/user/login';
      const cleanEmail = obj.emailid.trim().toLowerCase();
      const payload = {
        emailid: cleanEmail,
        password: obj.password,
      };

      const resp = await axios.post(`${API_URL}/user/login`, payload);

      // 🟢 1. LOGIN SUCCESSFUL
      if (resp.data.status === true) {
        const receivedUser: LoggedInUser = {
          emailid: resp.data.emailid || cleanEmail,
          utype: resp.data.utype,
        };

        if (resp.data.token) {
          localStorage.setItem('token', resp.data.token);
        }
        localStorage.setItem('evenue_user', JSON.stringify(receivedUser));

        const role = receivedUser.utype?.trim().toLowerCase();

        // 👑 AGAR ADMIN HAI -> DIRECT OPEN ADMIN DASHBOARD
        if (role === 'admin') {
          localStorage.setItem('evenue_admin', receivedUser.emailid);
          alert('Welcome Administrator!');
          navigate('/admindash');
          return;
        }

        // 🏢 AGAR VENDOR HAI -> VENDOR DASHBOARD
        if (role === 'vendor') {
          localStorage.setItem('vendorEmail', receivedUser.emailid);
          alert('Welcome to Evenue Vendor Portal!');
          navigate('/vendordash');
          return;
        }

        // 👤 AGAR CITIZEN HAI -> CITIZEN DASHBOARD
        if (role === 'citizen') {
          localStorage.setItem('citizenEmail', receivedUser.emailid);
          alert('Welcome to Evenue!');
          navigate('/citizendash');
          return;
        }

        navigate('/');

      } else {
        // 🔴 2. LOGIN FAILED YA USER BLOCKED HAI
        const errorMsg = resp.data.msg || 'Invalid Email or Password!';

        // 🚨 Blocked user alert
        if (
          resp.data.isBlocked ||
          errorMsg.toLowerCase().includes('blocked') ||
          errorMsg.toLowerCase().includes('disabled')
        ) {
          alert(`⚠️ Alert: ${errorMsg}`);
        }

        setErrors({ general: errorMsg });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const serverMsg = error.response?.data?.msg || 'Error connecting to server. Please try again!';

      if (serverMsg.toLowerCase().includes('blocked')) {
        alert(`⚠️ Alert: ${serverMsg}`);
      }

      setErrors({ general: serverMsg });
    } finally {
      setLoading(false);
    }
  }

  // --- FORGOT PASSWORD HANDLERS ---
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    const targetEmail = forgotEmail || obj.emailid;

    if (!targetEmail || !isValidEmail(targetEmail)) {
      setForgotMessage({ text: 'Please enter a valid email address (e.g., user@example.com).', isError: true });
      return;
    }

    try {
      setLoading(true);
      setForgotMessage(null);
      const resp = await axios.post(`${API_URL}/user/forgot-password`, {
        emailid: targetEmail.trim().toLowerCase(),
      });
      
      if (resp.data.status === true) {
        setForgotMessage({ text: resp.data.msg, isError: false });
        setForgotStep(2);
      } else {
        setForgotMessage({ text: resp.data.msg, isError: true });
      }
    } catch (error: any) {
      setForgotMessage({ text: error.response?.data?.msg || 'Failed to send OTP. Try again.', isError: true });
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      setForgotMessage({ text: 'Please enter a valid 6-digit OTP code.', isError: true });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setForgotMessage({ text: 'New password must be at least 6 characters long.', isError: true });
      return;
    }

    try {
      setLoading(true);
      setForgotMessage(null);
      const resp = await axios.post(`${API_URL}/user/reset-password`, {
        emailid: (forgotEmail || obj.emailid).trim().toLowerCase(),
        otp: otp.trim(),
        newPassword: newPassword,
      });

      if (resp.data.status === true) {
        alert(resp.data.msg);
        setIsForgotMode(false);
        setForgotStep(1);
        setForgotEmail('');
        setOtp('');
        setNewPassword('');
        setForgotMessage(null);
      } else {
        setForgotMessage({ text: resp.data.msg, isError: true });
      }
    } catch (error: any) {
      setForgotMessage({ text: error.response?.data?.msg || 'Failed to reset password.', isError: true });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#11130F] flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* 1. NAVBAR */}
      <nav className="sticky top-0 z-50 bg-[#FBFBFA]/90 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between">
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

          <div className="hidden md:flex items-center space-x-8 text-xs font-semibold uppercase tracking-wider text-stone-600">
            <Link to="/" className="hover:text-emerald-950 transition">Home</Link>
            <Link to="/#services" className="hover:text-emerald-950 transition">Services</Link>
            <Link to="/#help-us" className="hover:text-emerald-950 transition">Help Us</Link>
            <Link to="/#vendors" className="hover:text-emerald-950 transition">For Vendors</Link>
          </div>

          <div className="hidden md:flex items-center space-x-3">
            <span className="text-xs text-stone-500 font-light">New to Evenue?</span>
            <button
              onClick={() => navigate("/signup")}
              type="button"
              className="px-6 py-2.5 text-xs font-semibold text-amber-300 bg-emerald-950 hover:bg-emerald-900 rounded-full shadow-sm hover:shadow-md transition active:scale-95 cursor-pointer"
            >
              Get Started
            </button>
          </div>

          <div className="flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              type="button"
              className="p-2 rounded-xl text-stone-700 hover:text-emerald-950 hover:bg-stone-100 transition"
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

        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-stone-200 px-6 py-5 space-y-4 shadow-xl">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="block text-sm font-semibold text-emerald-950">Home</Link>
            <Link to="/#services" onClick={() => setIsMobileMenuOpen(false)} className="block text-sm font-medium text-stone-700 hover:text-emerald-950">Services</Link>
            <Link to="/#help-us" onClick={() => setIsMobileMenuOpen(false)} className="block text-sm font-medium text-stone-700 hover:text-emerald-950">Help Us</Link>
            <Link to="/#vendors" onClick={() => setIsMobileMenuOpen(false)} className="block text-sm font-medium text-stone-700 hover:text-emerald-950">For Vendors</Link>
            <div className="pt-3 border-t border-stone-100">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate("/signup");
                }}
                className="w-full py-2.5 text-center text-xs font-semibold text-white bg-emerald-950 rounded-full shadow-sm"
              >
                Create Account
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* 2. LOGIN MAIN CARD */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl border border-gray-200/70 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
          
          {/* Left Hero */}
          <div className="lg:col-span-5 relative bg-emerald-950 p-8 sm:p-10 flex flex-col justify-between overflow-hidden min-h-[380px]">
            <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-emerald-800/30 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-emerald-600/20 blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/80 border border-emerald-700/60 text-emerald-200 text-[10px] font-semibold tracking-widest uppercase">
                <span>✦</span> Verified Event Network
              </span>
            </div>

            <div className="relative z-10 my-auto py-6 space-y-5">
              <div className="w-full h-52 sm:h-56 rounded-2xl overflow-hidden border border-emerald-700/40 shadow-2xl relative group">
                <img
                  src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1000&q=80"
                  alt="Floral Mandap Celebration"
                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-transparent to-transparent flex items-end p-4">
                  <span className="text-white text-[11px] font-serif tracking-wide bg-emerald-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                    Bespoke Mandap & Decor
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <h2 className="font-serif text-2xl sm:text-3xl text-white leading-snug">
                  &ldquo;New Beginnings. Beautifully Planned.&rdquo;
                </h2>
                <p className="text-xs text-emerald-200/80 font-light leading-relaxed">
                  Sign in to browse curated caterers, photographers, decor specialists, and manage event operations.
                </p>
              </div>
            </div>

            <div className="relative z-10 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3.5">
              <p className="text-[10px] font-semibold tracking-widest text-emerald-300 uppercase">
                ONE ECOSYSTEM
              </p>
              <p className="text-xs text-white/90 font-light mt-0.5">
                Verified vendors, Aadhaar-verified citizens, and seamless bookings.
              </p>
            </div>
          </div>

          {/* Right Form */}
          <div className="lg:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-center bg-white">
            
            {!isForgotMode ? (
              <>
                <div className="mb-6">
                  <span className="text-xs font-bold tracking-widest text-emerald-800 uppercase">
                    SECURE ACCESS
                  </span>
                  <h2 className="font-serif text-3xl sm:text-4xl text-gray-900 tracking-tight mt-1">
                    Sign In to Evenue
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 font-light">
                    Enter your email and password to access your Citizen, Vendor, or Admin dashboard.
                  </p>
                </div>

                {errors.general && (
                  <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                    <span>⚠️</span>
                    <span>{errors.general}</span>
                  </div>
                )}

                <form onSubmit={doLogin} className="space-y-5" noValidate>
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="emailid"
                      value={obj.emailid}
                      onChange={doUpdateObj}
                      placeholder="name@example.com"
                      className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all duration-200 ${
                        errors.emailid
                          ? 'border-red-400 bg-red-50/20 focus:ring-1 focus:ring-red-400'
                          : 'border-gray-200 bg-gray-50/40 focus:bg-white focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900'
                      }`}
                    />

                    {emailStatus && !errors.emailid && (
                      <p className={`text-xs font-medium mt-1.5 flex items-center gap-1 ${
                        emailStatus === 'Valid Email' ? 'text-emerald-700' : 'text-amber-600'
                      }`}>
                        <span className="text-[10px]">●</span> {emailStatus}
                      </p>
                    )}

                    {errors.emailid && (
                      <p className="text-xs text-red-600 font-medium mt-1.5">{errors.emailid}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotMode(true);
                          setForgotStep(1);
                          setForgotEmail(obj.emailid);
                          setForgotMessage(null);
                        }}
                        className="text-xs text-emerald-800 hover:underline font-medium cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={obj.password}
                        onChange={doUpdateObj}
                        placeholder="••••••••"
                        className={`w-full px-4 py-3 pr-14 rounded-xl border text-sm outline-none transition-all duration-200 ${
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

                    {errors.password && (
                      <p className="text-xs text-red-600 font-medium mt-1.5">{errors.password}</p>
                    )}
                  </div>

                  {/* Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-emerald-950 hover:bg-emerald-900 text-white font-medium text-sm tracking-wide rounded-full shadow-sm hover:shadow-md transition-all duration-300 ease-in-out cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <span>Authenticating...</span>
                      ) : (
                        <>
                          <span>Sign In to Account</span>
                          <span>→</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-center text-xs text-gray-500 pt-2">
                    Don't have an account?{' '}
                    <Link to="/signup" className="font-semibold text-emerald-950 hover:underline">
                      Create one now
                    </Link>
                  </p>
                </form>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <span className="text-xs font-bold tracking-widest text-emerald-800 uppercase">
                    ACCOUNT RECOVERY
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl text-gray-900 tracking-tight mt-1">
                    Reset Password
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 font-light">
                    {forgotStep === 1
                      ? "Enter your registered email to receive a 6-digit verification code."
                      : "Enter the verification code sent to your email and your new password."}
                  </p>
                </div>

                {forgotMessage && (
                  <div
                    className={`mb-4 p-3 rounded-xl border text-xs font-medium ${
                      forgotMessage.isError
                        ? 'bg-red-50 border-red-200 text-red-700'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    }`}
                  >
                    {forgotMessage.isError ? '⚠️ ' : '✅ '} {forgotMessage.text}
                  </div>
                )}

                {forgotStep === 1 ? (
                  <form onSubmit={handleSendOtp} className="space-y-4" noValidate>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
                        Registered Email Address
                      </label>
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => {
                          setForgotEmail(e.target.value);
                          setForgotMessage(null);
                        }}
                        placeholder="name@example.com"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/40 text-sm outline-none focus:bg-white focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-emerald-950 hover:bg-emerald-900 text-white font-medium text-sm tracking-wide rounded-full shadow-sm transition-all duration-300 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? 'Sending OTP...' : 'Send Verification OTP'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotMode(false);
                        setForgotMessage(null);
                      }}
                      className="w-full py-2 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                    >
                      Back to Sign In
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-4" noValidate>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
                        6-Digit OTP Code
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => {
                          setOtp(e.target.value.replace(/\D/g, ''));
                          setForgotMessage(null);
                        }}
                        placeholder="123456"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/40 text-sm tracking-widest font-mono outline-none focus:bg-white focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
                        New Password (Min 6 chars)
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => {
                            setNewPassword(e.target.value);
                            setForgotMessage(null);
                          }}
                          placeholder="••••••••"
                          required
                          className="w-full px-4 py-3 pr-14 rounded-xl border border-gray-200 bg-gray-50/40 text-sm outline-none focus:bg-white focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 hover:text-emerald-950 focus:outline-none transition-colors cursor-pointer px-1 py-0.5"
                        >
                          {showNewPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-emerald-950 hover:bg-emerald-900 text-white font-medium text-sm tracking-wide rounded-full shadow-sm transition-all duration-300 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? 'Resetting...' : 'Reset Password'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setForgotStep(1);
                        setOtp('');
                        setNewPassword('');
                        setForgotMessage(null);
                      }}
                      className="w-full py-2 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                    >
                      Change Email Address
                    </button>
                  </form>
                )}
              </>
            )}

          </div>

        </div>
      </main>

    </div>
  );
}

export default Login;