import React, { useState } from 'react';
import axios from 'axios';

// ----------------------------------------------------
// Global Axios Interceptor for Token Expiry / Unauthorized Access
// ----------------------------------------------------
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      alert('Your session has expired. Please log in again.');
      localStorage.removeItem('token');
      localStorage.removeItem('citizenEmail');
      localStorage.removeItem('evenue_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface UpdatePasswordState {
  emailid: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface FormErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

function UpdatePassword() {
  const [formData, setFormData] = useState<UpdatePasswordState>({
    emailid: localStorage.getItem('citizenEmail') || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [showCurrent, setShowCurrent] = useState<boolean>(false);
  const [showNew, setShowNew] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({
      ...prev,
      [name]: '',
    }));
  }

  function validateForm(): boolean {
    const newErrors: FormErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required.';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required.';
    } else {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (formData.newPassword.length < 8) {
        newErrors.newPassword = 'Password must be at least 8 characters long.';
      } else if (!passwordRegex.test(formData.newPassword)) {
        newErrors.newPassword = 'Must include uppercase, lowercase, number & special character.';
      } else if (formData.newPassword === formData.currentPassword) {
        newErrors.newPassword = 'New password cannot be the same as your current password.';
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password.';
    } else if (formData.confirmPassword !== formData.newPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      const url = 'http://localhost:2005/citizen/updatePassword';
      const token = localStorage.getItem('token');

      const payload = {
        emailid: formData.emailid.trim(),
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      };

      const resp = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'authorization': `Bearer ${token}`,
        },
      });

      if (resp.data.status === true) {
        alert(resp.data.msg || 'Password updated successfully!');
        setFormData({
          emailid: formData.emailid,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        const serverMsg = resp.data.msg || '';
        // Agar backend se wrong password ka message aaye
        if (serverMsg.toLowerCase().includes('wrong password') || serverMsg.toLowerCase().includes('current password')) {
          setErrors((prev) => ({ ...prev, currentPassword: 'Wrong password' }));
        } else {
          alert('Failed: ' + serverMsg);
        }
      }
    } catch (error: any) {
      console.error('Password update error:', error);
      if (error.response && error.response.data && error.response.data.msg) {
        const msg = error.response.data.msg;
        if (msg.toLowerCase().includes('wrong password') || msg.toLowerCase().includes('current password')) {
          setErrors((prev) => ({ ...prev, currentPassword: 'Wrong password' }));
        } else {
          alert(msg);
        }
      } else {
        alert('An error occurred while updating your password.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full flex justify-center py-6 px-4">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-gray-200/80 shadow-xl p-8 sm:p-12 space-y-7">
        
        {/* Header Section */}
        <div className="pb-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-700 animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-800">
                Security Settings
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif text-gray-900 tracking-tight">
              Update Password
            </h2>
            <p className="text-xs text-gray-500 mt-1 font-light">
              Ensure your Evenue account is secure with a strong password.
            </p>
          </div>
          <span className="hidden sm:inline-block bg-emerald-50 text-emerald-900 border border-emerald-200 text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            Encrypted
          </span>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Current Password Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
              Current Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="••••••••••••"
                className={`w-full px-4 py-3 pr-16 rounded-xl border text-sm outline-none transition-all ${
                  errors.currentPassword
                    ? 'border-red-400 bg-red-50/20 focus:ring-1 focus:ring-red-400'
                    : 'border-gray-200 bg-gray-50/40 focus:bg-white focus:border-emerald-950 focus:ring-1 focus:ring-emerald-950'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-emerald-950 font-medium cursor-pointer"
              >
                {showCurrent ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-xs text-red-600 font-medium mt-1 animate-shake">
                {errors.currentPassword}
              </p>
            )}
          </div>

          {/* New Password Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="••••••••••••"
                className={`w-full px-4 py-3 pr-16 rounded-xl border text-sm outline-none transition-all ${
                  errors.newPassword
                    ? 'border-red-400 bg-red-50/20 focus:ring-1 focus:ring-red-400'
                    : 'border-gray-200 bg-gray-50/40 focus:bg-white focus:border-emerald-950 focus:ring-1 focus:ring-emerald-950'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-emerald-950 font-medium cursor-pointer"
              >
                {showNew ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-xs text-red-600 font-medium mt-1">
                {errors.newPassword}
              </p>
            )}
            <p className="text-[10px] text-gray-400 font-light">
              Must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number & 1 special character.
            </p>
          </div>

          {/* Confirm New Password Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••••••"
                className={`w-full px-4 py-3 pr-16 rounded-xl border text-sm outline-none transition-all ${
                  errors.confirmPassword
                    ? 'border-red-400 bg-red-50/20 focus:ring-1 focus:ring-red-400'
                    : 'border-gray-200 bg-gray-50/40 focus:bg-white focus:border-emerald-950 focus:ring-1 focus:ring-emerald-950'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-emerald-950 font-medium cursor-pointer"
              >
                {showConfirm ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-600 font-medium mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-gray-100 flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-64 py-4 bg-emerald-950 hover:bg-emerald-900 text-white font-medium text-xs tracking-wider uppercase rounded-full shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Updating Password...' : 'Update Password →'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

export default UpdatePassword;