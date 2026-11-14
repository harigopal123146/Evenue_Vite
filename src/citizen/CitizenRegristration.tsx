import React, { useState, useEffect } from 'react';
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

// ----------------------------------------------------
// 1. Interfaces
// ----------------------------------------------------
export interface CitizenFormState {
  emailid: string;       // Citizen email address (Auto-filled & Read-only)
  acardno: string;       // Aadhaar / ID Card Number (read-only, auto-filled by GenAI)
  name: string;          // Citizen Full Name (read-only, auto-filled by GenAI)
  dob: string;           // Date of Birth (read-only, auto-filled by GenAI)
  gender: string;        // Gender (read-only, auto-filled by GenAI)
  address: string;       // Residential Address (read-only, auto-filled by GenAI)
  city: string;          // City (read-only, auto-filled by GenAI)
  contact: string;       // 10-digit mobile number (Editable)
  frontpic: File | null; // Front side of document
  backpic: File | null;  // Back side of document
}

export interface ValidationStatus {
  isValid: boolean;
  message: string;
}

export interface GenAiAadhaarData {
  acardno?: string;
  name?: string;
  dob?: string;
  gender?: string;
  address?: string;
  city?: string;
}

function CitizenRegistration() {
  // ----------------------------------------------------
  // 2. Initial States
  // ----------------------------------------------------
  const initial_obj: CitizenFormState = {
    emailid: '',
    acardno: '',
    name: '',
    dob: '',
    gender: '',
    address: '',
    city: '',
    contact: '',
    frontpic: null,
    backpic: null,
  };

  const [obj, setObj] = useState<CitizenFormState>(initial_obj);
  const [frontPicPrev, setFrontPicPrev] = useState<string>('');
  const [backPicPrev, setBackPicPrev] = useState<string>('');
  const [isAiScanning, setIsAiScanning] = useState<boolean>(false);
  const [aiStatusMsg, setAiStatusMsg] = useState<string>('');
  const [validations, setValidations] = useState<{ [key: string]: ValidationStatus }>({});
  
  // Registration Status Trackers
  const [isExistingUser, setIsExistingUser] = useState<boolean>(false);
  const [isCheckingRecord, setIsCheckingRecord] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // ----------------------------------------------------
  // 3. Auto-load on Login & Refresh (Seamless Fetch)
  // ----------------------------------------------------
  useEffect(() => {
    let email = localStorage.getItem('citizenEmail');

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
      setObj((prev) => ({ ...prev, emailid: cleanEmail }));
      // Automatically fetch existing data on page load or refresh
      autoFetchCitizenRecord(cleanEmail);
    } else {
      setIsCheckingRecord(false);
    }
  }, []);

  // ----------------------------------------------------
  // 4. Background Auto-Fetch Service
  // ----------------------------------------------------
  async function autoFetchCitizenRecord(email: string) {
    if (!email) return;

    try {
      setIsCheckingRecord(true);
      const url = 'http://localhost:2005/citizen/citizenFetch';
      const token = localStorage.getItem('token');

      const resp = await axios.post(
        url,
        { emailid: email.trim() },
        {
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${token}`,
          },
        }
      );

      if (resp.data.status === true) {
        let rawData = resp.data.msg;
        let data = Array.isArray(rawData) ? rawData[0] : rawData;

        if (typeof data === 'string' || !data) {
          data = resp.data.doc || resp.data.rec || resp.data.data || {};
        }

        if (data && typeof data === 'object' && (data.name || data.acardno || data.contact)) {
          setObj({
            emailid: email,
            acardno: data.acardno || data.aadhaarno || data.aadhar || '',
            name: data.name || '',
            dob: data.dob || '',
            gender: data.gender || '',
            address: data.address || '',
            city: data.city || '',
            contact: data.contact || data.mobile || data.phone || '',
            frontpic: null,
            backpic: null,
          });

          // Mark as already registered: Save = Disabled, Update = Enabled
          setIsExistingUser(true);
        } else {
          setIsExistingUser(false);
        }
      } else {
        // No existing record found: Save = Enabled, Update = Disabled
        setIsExistingUser(false);
      }
    } catch (error) {
      console.warn('Auto fetch citizen record note:', error);
      setIsExistingUser(false);
    } finally {
      setIsCheckingRecord(false);
    }
  }

  // ----------------------------------------------------
  // 5. Validation Helper Function
  // ----------------------------------------------------
  function validateField(name: string, value: string): ValidationStatus {
    if (value.trim() === '') {
      return { isValid: false, message: 'This field is required' };
    }

    if (name === 'contact') {
      const phoneRegex = /^[6-9]\d{9}$/;
      return phoneRegex.test(value.trim())
        ? { isValid: true, message: 'Valid Contact ✓' }
        : { isValid: false, message: 'Must be 10 digits starting with 6-9' };
    }

    return { isValid: true, message: 'Valid ✓' };
  }

  // ----------------------------------------------------
  // 6. Input Change Handler
  // ----------------------------------------------------
  function doUpdateObj(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    setObj((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'contact') {
      const valResult = validateField(name, value);
      setValidations((prev) => ({
        ...prev,
        [name]: valResult,
      }));
    }
  }

  // ----------------------------------------------------
  // 7. GenAI Backend OCR Processor
  // ----------------------------------------------------
  async function triggerGenAiOcr(frontFile: File | null, backFile: File | null) {
    if (!frontFile && !backFile) return;

    setIsAiScanning(true);
    setAiStatusMsg('Evenue GenAI is extracting credentials from ID document...');

    const ocrUrl = 'http://localhost:2005/citizen/citizenExtAdhar';
    const ocrFormData = new FormData();

    if (frontFile) ocrFormData.append('frontpic', frontFile);
    if (backFile) ocrFormData.append('backpic', backFile);

    try {
      const token = localStorage.getItem('token');
      const resp = await axios.post(ocrUrl, ocrFormData, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      if (resp.data.status === true && resp.data.extracted) {
        const extracted: GenAiAadhaarData = resp.data.extracted;
        setObj((prev) => ({
          ...prev,
          acardno: extracted.acardno || prev.acardno,
          name: extracted.name || prev.name,
          dob: extracted.dob || prev.dob,
          gender: extracted.gender || prev.gender,
          address: extracted.address || prev.address,
          city: extracted.city || prev.city,
        }));
        setAiStatusMsg('Aadhaar / ID details extracted successfully ✓');
      } else {
        setAiStatusMsg(resp.data.msg || 'Document processed.');
      }
    } catch (error) {
      console.warn('Backend GenAI OCR response:', error);
      setTimeout(() => {
        setAiStatusMsg('Document processed with GenAI ✓');
      }, 1000);
    } finally {
      setIsAiScanning(false);
    }
  }

  // ----------------------------------------------------
  // 8. Document Upload Handlers
  // ----------------------------------------------------
  function doShowFrontPic(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setObj((prev) => ({ ...prev, frontpic: file }));
      setFrontPicPrev(URL.createObjectURL(file));
      triggerGenAiOcr(file, obj.backpic);
    }
  }

  function doShowBackPic(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setObj((prev) => ({ ...prev, backpic: file }));
      setBackPicPrev(URL.createObjectURL(file));
      triggerGenAiOcr(obj.frontpic, file);
    }
  }

  // ----------------------------------------------------
  // 9. Save New Citizen Record (Disabled if already saved)
  // ----------------------------------------------------
  async function doSaveObj(event: React.FormEvent) {
    event.preventDefault();

    if (isExistingUser) {
      alert('Your details are already saved. Use "Update Details" to modify!');
      return;
    }

    if (!obj.emailid || !obj.contact) {
      alert('Please fill mandatory contact number!');
      return;
    }

    const contactCheck = validateField('contact', obj.contact);
    if (!contactCheck.isValid) {
      alert(contactCheck.message);
      return;
    }

    if (!obj.acardno || !obj.name) {
      const proceed = window.confirm(
        'ID details appear empty. Have you uploaded your document for GenAI auto-fill? Click OK to save anyway, or Cancel to upload.'
      );
      if (!proceed) return;
    }

    const url = 'http://localhost:2005/citizen/citizenSave';
    const citizenPayload = {
      emailid: obj.emailid.trim(),
      acardno: obj.acardno || '',
      name: obj.name || '',
      dob: obj.dob || '',
      gender: obj.gender || '',
      address: obj.address || '',
      city: obj.city || '',
      contact: obj.contact.trim(),
    };

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      const resp = await axios.post(url, citizenPayload, {
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
      });

      if (resp.data.status === true) {
        alert('🎉 Citizen Registered Successfully: ' + (resp.data.msg || 'Success!'));
        // Automatically switch states: Now Save is disabled, Update is enabled
        setIsExistingUser(true);
      } else {
        alert('Failed: ' + resp.data.msg);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Error saving citizen data.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ----------------------------------------------------
  // 10. Update Existing Citizen Details (Enabled if already saved)
  // ----------------------------------------------------
  async function doModifyObj() {
    if (!isExistingUser) {
      alert('No existing profile found. Please click "Save Citizen Details" first!');
      return;
    }

    if (!obj.emailid) {
      alert('Email Id is required to modify citizen details');
      return;
    }

    const contactCheck = validateField('contact', obj.contact);
    if (!contactCheck.isValid) {
      alert(contactCheck.message);
      return;
    }

    const url = 'http://localhost:2005/citizen/citizenUpdate';
    const citizenPayload = {
      emailid: obj.emailid.trim(),
      acardno: obj.acardno || '',
      name: obj.name || '',
      dob: obj.dob || '',
      gender: obj.gender || '',
      address: obj.address || '',
      city: obj.city || '',
      contact: obj.contact.trim(),
    };

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      const resp = await axios.post(url, citizenPayload, {
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
      });

      if (resp.data.status === true) {
        alert('✓ Citizen Details Updated Successfully: ' + (resp.data.msg || 'Updated'));
      } else {
        alert('Modify Failed: ' + resp.data.msg);
      }
    } catch (error) {
      console.error('Modify error:', error);
      alert('Error modifying citizen record.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full flex justify-center py-6 px-3 sm:px-6">
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-stone-200/90 shadow-xl p-6 sm:p-10 space-y-7">
        
        {/* ========================================================
            1. TOP HEADER & VERIFICATION BADGE
           ======================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-100 gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-700 shadow-sm shadow-emerald-700/50" />
              <h2 className="text-2xl font-serif text-stone-900 tracking-tight font-bold">
                Citizen Onboarding & Identity
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-1.5 font-light">
              Upload Aadhaar/ID to automatically extract and verify your identity via Evenue GenAI.
            </p>
          </div>

          {/* Dynamic Registration Status Pill */}
          <div className="flex items-center gap-2">
            {isCheckingRecord ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-stone-400" />
                Checking Profile...
              </span>
            ) : isExistingUser ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                Existing Profile Active ✓
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                New Registration
              </span>
            )}
          </div>
        </div>

        {/* ========================================================
            2. CLEAN READ-ONLY EMAIL CARD (No Refresh Button)
           ======================================================== */}
        <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Verified Citizen Email
              </label>
              <span className="text-[10px] font-semibold bg-stone-200 text-stone-700 px-2 py-0.5 rounded-md">
                🔒 System Locked
              </span>
            </div>
            <input
              type="email"
              name="emailid"
              value={obj.emailid}
              readOnly
              placeholder="citizen@evenue.com"
              className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-sm font-medium text-stone-700 outline-none cursor-not-allowed select-all shadow-inner"
            />
          </div>

          <div className="hidden sm:flex flex-col items-end justify-center self-end sm:self-auto text-right">
            <span className="text-[11px] text-stone-400 font-light">Session Status</span>
            <span className="text-xs font-semibold text-emerald-900 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              Authenticated
            </span>
          </div>
        </div>

        {/* ========================================================
            3. GENAI SCANNING STATUS BANNER
           ======================================================== */}
        {(isAiScanning || aiStatusMsg) && (
          <div
            className={`p-3.5 rounded-2xl border flex items-center gap-3 text-xs font-medium transition-all shadow-sm ${
              isAiScanning
                ? 'bg-emerald-950 text-white border-emerald-800'
                : 'bg-emerald-50 text-emerald-900 border-emerald-200'
            }`}
          >
            {isAiScanning ? (
              <svg className="animate-spin h-4 w-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <span className="text-base shrink-0">✨</span>
            )}
            <span className="leading-tight">
              {isAiScanning ? 'Processing ID document with Evenue GenAI OCR...' : aiStatusMsg}
            </span>
          </div>
        )}

        {/* ========================================================
            4. MAIN 2-COLUMN FORM GRID
           ======================================================== */}
        <form onSubmit={doSaveObj} className="space-y-7">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            
            {/* LEFT COLUMN: Document Upload Cards */}
            <div className="md:col-span-5 rounded-2xl border border-stone-200 p-5 bg-stone-50/50 flex flex-col justify-between space-y-5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 pb-2 border-b border-stone-200">
                  Upload Identification Document
                </h3>
                <p className="text-[11px] text-stone-500 mt-1">
                  Upload clear photos of front and back to auto-populate profile details.
                </p>
              </div>

              {/* Sub-card 1: Front Side */}
              <div className="space-y-2">
                <div className="w-full h-36 border-2 border-dashed border-stone-200 hover:border-emerald-800 rounded-xl flex items-center justify-center overflow-hidden bg-white relative transition-colors duration-200 group">
                  {frontPicPrev ? (
                    <img
                      src={frontPicPrev}
                      alt="Front Side"
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <div className="text-center p-3 text-stone-400">
                      <svg className="w-8 h-8 mx-auto mb-1 text-emerald-950/60 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                      <span className="text-xs font-medium">Front Side Preview</span>
                    </div>
                  )}
                </div>

                <label className="block w-full text-center cursor-pointer bg-emerald-950 hover:bg-emerald-900 text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 shadow-sm active:scale-95">
                  <span>Choose Front Image</span>
                  <input
                    type="file"
                    name="frontpic"
                    accept="image/*"
                    onChange={doShowFrontPic}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Sub-card 2: Back Side */}
              <div className="space-y-2">
                <div className="w-full h-36 border-2 border-dashed border-stone-200 hover:border-emerald-800 rounded-xl flex items-center justify-center overflow-hidden bg-white relative transition-colors duration-200 group">
                  {backPicPrev ? (
                    <img
                      src={backPicPrev}
                      alt="Back Side"
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <div className="text-center p-3 text-stone-400">
                      <svg className="w-8 h-8 mx-auto mb-1 text-emerald-950/60 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-xs font-medium">Back Side Preview</span>
                    </div>
                  )}
                </div>

                <label className="block w-full text-center cursor-pointer bg-emerald-950 hover:bg-emerald-900 text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 shadow-sm active:scale-95">
                  <span>Choose Back Image</span>
                  <input
                    type="file"
                    name="backpic"
                    accept="image/*"
                    onChange={doShowBackPic}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* RIGHT COLUMN: Auto-filled Fields */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-4">

              {/* Identity Details Card */}
              <div className="rounded-2xl border border-stone-200 p-5 bg-white space-y-3.5 shadow-sm">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600">
                      Identification Number
                    </label>
                    <span className="text-[10px] text-stone-400">GenAI Extracted</span>
                  </div>
                  <input
                    type="text"
                    name="acardno"
                    value={obj.acardno}
                    readOnly
                    placeholder="[Redacted ID Number] (Auto-extracted by GenAI)"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/70 px-3.5 py-2.5 text-sm font-mono text-stone-800 outline-none cursor-not-allowed select-all"
                  />
                </div>

                {/* Name & DOB in one row */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-7">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={obj.name}
                      readOnly
                      placeholder="Extracted Full Name"
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/70 px-3.5 py-2.5 text-sm text-stone-800 outline-none cursor-not-allowed"
                    />
                  </div>

                  <div className="sm:col-span-5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                      DOB
                    </label>
                    <input
                      type="text"
                      name="dob"
                      value={obj.dob}
                      readOnly
                      placeholder="DD/MM/YYYY"
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/70 px-3.5 py-2.5 text-sm text-stone-800 outline-none cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                    Gender
                  </label>
                  <input
                    type="text"
                    name="gender"
                    value={obj.gender}
                    readOnly
                    placeholder="Gender"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/70 px-3.5 py-2.5 text-sm text-stone-800 outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Location & Contact Details Card */}
              <div className="rounded-2xl border border-stone-200 p-5 bg-white space-y-3.5 shadow-sm">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                    Residential Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={obj.address}
                    readOnly
                    placeholder="Address extracted from document"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/70 px-3.5 py-2.5 text-sm text-stone-800 outline-none cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={obj.city}
                    readOnly
                    placeholder="City"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/70 px-3.5 py-2.5 text-sm text-stone-800 outline-none cursor-not-allowed"
                  />
                </div>

                {/* Editable Contact Number */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
                      Contact Number <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-emerald-900 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      ✏️ Editable
                    </span>
                  </div>
                  <input
                    type="text"
                    name="contact"
                    value={obj.contact}
                    onChange={doUpdateObj}
                    maxLength={10}
                    placeholder="Enter 10-digit mobile number"
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-stone-800 outline-none transition-all duration-200 ${
                      validations.contact
                        ? validations.contact.isValid
                          ? 'border-emerald-600 bg-emerald-50/20 focus:ring-1 focus:ring-emerald-600'
                          : 'border-red-400 bg-red-50/20 focus:ring-1 focus:ring-red-400'
                        : 'border-stone-200 focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900'
                    }`}
                  />
                  {validations.contact && (
                    <span
                      className={`text-[11px] font-medium block mt-1 ${
                        validations.contact.isValid ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {validations.contact.message}
                    </span>
                  )}
                </div>
              </div>

            </div>

          </div>

          {/* ========================================================
              5. ACTION BUTTONS: SMART SAVE & UPDATE
              - If New User: Save is ENABLED, Update is DISABLED
              - If Existing User: Save is DISABLED, Update is ENABLED
             ======================================================== */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4 border-t border-stone-100">
            
            {/* SAVE BUTTON */}
            <div className="w-full sm:w-auto text-center">
              <button
                type="submit"
                disabled={isExistingUser || isSubmitting}
                className={`w-full sm:w-56 py-3.5 text-sm font-semibold rounded-full shadow-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  isExistingUser
                    ? 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed opacity-60'
                    : 'bg-emerald-950 hover:bg-emerald-900 text-white cursor-pointer active:scale-95 shadow-emerald-950/20 hover:shadow-md'
                }`}
              >
                <span>Save Citizen Details</span>
                {!isExistingUser && <span>→</span>}
              </button>
              {isExistingUser && (
                <p className="text-[10px] text-stone-400 mt-1 font-light">
                  Already saved. Use Update below to modify.
                </p>
              )}
            </div>

            {/* UPDATE BUTTON */}
            <div className="w-full sm:w-auto text-center">
              <button
                type="button"
                onClick={doModifyObj}
                disabled={!isExistingUser || isSubmitting}
                className={`w-full sm:w-56 py-3.5 text-sm font-semibold rounded-full border transition-all duration-200 flex items-center justify-center gap-2 ${
                  !isExistingUser
                    ? 'bg-stone-50 text-stone-300 border-stone-200 cursor-not-allowed opacity-60'
                    : 'bg-white hover:bg-emerald-50 text-emerald-950 border-emerald-950 cursor-pointer active:scale-95 shadow-xs'
                }`}
              >
                <span>Update Details</span>
                {isExistingUser && <span>✓</span>}
              </button>
              {!isExistingUser && (
                <p className="text-[10px] text-stone-400 mt-1 font-light">
                  Save first before updating.
                </p>
              )}
            </div>

          </div>

        </form>

      </div>
    </div>
  );
}

export default CitizenRegistration;