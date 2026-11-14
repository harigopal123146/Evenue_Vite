
import React, { useState, useEffect } from "react";
import axios from "axios";

// ----------------------------------------------------
// Interfaces
// ----------------------------------------------------
export interface VendorState {
  emailid: string;
  name: string;
  contact: string;
  business: string;
  area: string;
  address: string;
  city: string;
  estd: string;
  selcate: string;
  website: string;
  insta: string;
  shoppic: File | null;
  certpic: File | null;
}

export interface FormErrors {
  emailid?: string;
  name?: string;
  contact?: string;
  business?: string;
  area?: string;
  address?: string;
  city?: string;
  estd?: string;
  selcate?: string;
  website?: string;
  insta?: string;
  shoppic?: string;
}

function VendorRegistration() {
  const initial_obj: VendorState = {
    emailid: "",
    name: "",
    contact: "",
    business: "",
    area: "",
    address: "",
    city: "",
    estd: "",
    selcate: "",
    website: "",
    insta: "",
    shoppic: null,
    certpic: null,
  };

  const [obj, setObj] = useState<VendorState>(initial_obj);
  const [errors, setErrors] = useState<FormErrors>({});
  const [shopPicPrev, setShopPicPrev] = useState<string>("");
  const [certPicPrev, setCertPicPrev] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  
  // Registration Status Trackers
  const [isExistingVendor, setIsExistingVendor] = useState<boolean>(false);
  const [isCheckingRecord, setIsCheckingRecord] = useState<boolean>(true);

  // Dropdown Open / Close state
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState<boolean>(false);

  // Available Categories
  const categoryOptions = [
    "Decoration",
    "Photography",
    "Catering",
    "DJ & Sound",
    "Mehndi Artist",
    "Bridal Makeup",
    "Wedding Planner",
    "Cake & Bakery",
    "Tent House",
    "Lighting",
    "Invitation Cards",
    "Sweets & Deserts",
    "Bridal Wear",
    "Pandit / Officiant",
    "Jagran Party",
    "Bhangra Group",
    "Event Cleaning",
    "Security & Valet",
  ];

  // ----------------------------------------------------
  // 1. AUTO-LOAD ON LOGIN & PAGE REFRESH (Seamless Fetch)
  // ----------------------------------------------------
  useEffect(() => {
    let email = localStorage.getItem("vendorEmail");

    if (!email) {
      const storedUser = localStorage.getItem("evenue_user");
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
      // Automatically fetch details on page load / refresh
      autoFetchVendorDetails(cleanEmail);
    } else {
      setIsCheckingRecord(false);
    }
  }, []);

  // ----------------------------------------------------
  // 2. BACKGROUND AUTO-FETCH SERVICE
  // ----------------------------------------------------
  async function autoFetchVendorDetails(emailToFetch: string) {
    if (!emailToFetch) return;

    try {
      setIsCheckingRecord(true);
      const url = "http://localhost:2005/vendor/vendorFetch";
      const token = localStorage.getItem("token");

      const resp = await axios.post(
        url,
        { emailid: emailToFetch.trim() },
        {
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${token}`,
          },
        }
      );

      if (resp.data.status === true && resp.data.msg) {
        const vendorData = resp.data.msg;

        let cleanEstd = "";
        if (vendorData.estd) {
          try {
            cleanEstd = new Date(vendorData.estd).toISOString().split("T")[0];
          } catch (e) {
            cleanEstd = String(vendorData.estd).split("T")[0];
          }
        }

        if (vendorData.business || vendorData.name || vendorData.contact) {
          setObj({
            emailid: vendorData.emailid || emailToFetch,
            name: vendorData.name || "",
            contact: vendorData.contact || "",
            business: vendorData.business || "",
            area: vendorData.area || "",
            address: vendorData.address || "",
            city: vendorData.city || "",
            estd: cleanEstd,
            selcate: vendorData.selcate || "",
            website: vendorData.website || "",
            insta: vendorData.insta || "",
            shoppic: null,
            certpic: null,
          });

          if (vendorData.shoppicurl && vendorData.shoppicurl !== "No_Pic.jpg") {
            setShopPicPrev(vendorData.shoppicurl);
          }

          if (vendorData.certpicurl && vendorData.certpicurl !== "No_Pic.jpg") {
            setCertPicPrev(vendorData.certpicurl);
          }

          setErrors({});
          // Mark as existing vendor: Save = Disabled, Update = Enabled
          setIsExistingVendor(true);
        } else {
          setIsExistingVendor(false);
        }
      } else {
        // No existing record found: Save = Enabled, Update = Disabled
        setIsExistingVendor(false);
      }
    } catch (error) {
      console.warn("Auto-fetch vendor note:", error);
      setIsExistingVendor(false);
    } finally {
      setIsCheckingRecord(false);
    }
  }

  // ----------------------------------------------------
  // 3. INPUT HANDLERS
  // ----------------------------------------------------
  function doUpdateObj(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    let { name, value } = event.target;

    // Contact number restriction: Only digits & max 10
    if (name === "contact") {
      value = value.replace(/\D/g, "").slice(0, 10);
    }

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    setObj((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // Multiple Category Toggle
  function doToggleCategory(chosen: string) {
    let list = obj.selcate
      ? obj.selcate.split(",").map((c) => c.trim()).filter(Boolean)
      : [];

    if (list.includes(chosen)) {
      list = list.filter((item) => item !== chosen);
    } else {
      list.push(chosen);
    }

    setObj((prev) => ({ ...prev, selcate: list.join(", ") }));
    setErrors((prev) => ({ ...prev, selcate: "" }));
  }

  // File Upload Handlers
  function doShopPic(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setObj((prev) => ({ ...prev, shoppic: file }));
      setShopPicPrev(URL.createObjectURL(file));
      setErrors((prev) => ({ ...prev, shoppic: "" }));
    }
  }

  function doCertPic(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setObj((prev) => ({ ...prev, certpic: file }));
      setCertPicPrev(URL.createObjectURL(file));
    }
  }

  // ----------------------------------------------------
  // 4. FORM VALIDATION
  // ----------------------------------------------------
  function validateForm(isUpdate: boolean = false): boolean {
    const err: FormErrors = {};

    if (!obj.emailid.trim()) err.emailid = "Email address is required";
    if (!obj.name.trim()) err.name = "Owner full name is required";

    const mobileRegex = /^[6-9]\d{9}$/;
    if (!obj.contact.trim()) {
      err.contact = "Contact number is required";
    } else if (!mobileRegex.test(obj.contact)) {
      err.contact = "Must be a valid 10-digit number starting with 6-9";
    }

    if (!obj.business.trim()) err.business = "Business name is required";
    if (!obj.area.trim()) err.area = "Area / Locality is required";
    if (!obj.address.trim()) err.address = "Street address is required";
    if (!obj.city.trim()) err.city = "City is required";
    if (!obj.estd.trim()) err.estd = "Established date is required";
    if (!obj.selcate.trim()) err.selcate = "Please select at least one category";
    if (!obj.website.trim()) err.website = "Website URL is required";
    if (!obj.insta.trim()) err.insta = "Instagram ID is required";

    // Photos Check
    if (!isUpdate) {
      if (!obj.shoppic) err.shoppic = "Storefront photo is required";
    } else {
      if (!obj.shoppic && !shopPicPrev) {
        err.shoppic = "Storefront photo is required";
      }
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  }

  // ----------------------------------------------------
  // 5. SAVE NEW VENDOR (Disabled if already saved)
  // ----------------------------------------------------
  async function doFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isExistingVendor) {
      alert("Your business profile is already registered! Use 'Update Details' to make changes.");
      return;
    }

    if (!validateForm(false)) return;

    try {
      setLoading(true);
      const url = "http://localhost:2005/vendor/vendorSave";
      const frmData = new FormData();

      frmData.append("emailid", obj.emailid.trim());
      frmData.append("name", obj.name.trim());
      frmData.append("contact", obj.contact.trim());
      frmData.append("business", obj.business.trim());
      frmData.append("area", obj.area.trim());
      frmData.append("address", obj.address.trim());
      frmData.append("city", obj.city.trim());
      frmData.append("estd", obj.estd);
      frmData.append("selcate", obj.selcate.trim());
      frmData.append("website", obj.website.trim());
      frmData.append("insta", obj.insta.trim());

      if (obj.shoppic) frmData.append("shoppic", obj.shoppic);
      if (obj.certpic) frmData.append("certpic", obj.certpic);

      const token = localStorage.getItem("token");

      const resp = await axios.post(url, frmData, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      alert(resp.data.msg || "🎉 Vendor Profile Registered Successfully!");
      // Automatically switch to registered state: Save disabled, Update enabled
      setIsExistingVendor(true);
    } catch (error) {
      console.error(error);
      alert("Error saving vendor details!");
    } finally {
      setLoading(false);
    }
  }

  // ----------------------------------------------------
  // 6. UPDATE EXISTING VENDOR (Enabled if already saved)
  // ----------------------------------------------------
  async function doUpdate() {
    if (!isExistingVendor) {
      alert("No registered business profile found. Please save your profile first!");
      return;
    }

    if (!validateForm(true)) return;

    try {
      setLoading(true);
      const url = "http://localhost:2005/vendor/vendorUpdate";
      const frmData = new FormData();

      frmData.append("emailid", obj.emailid.trim());
      frmData.append("name", obj.name.trim());
      frmData.append("contact", obj.contact.trim());
      frmData.append("business", obj.business.trim());
      frmData.append("area", obj.area.trim());
      frmData.append("address", obj.address.trim());
      frmData.append("city", obj.city.trim());
      frmData.append("estd", obj.estd);
      frmData.append("selcate", obj.selcate.trim());
      frmData.append("website", obj.website.trim());
      frmData.append("insta", obj.insta.trim());

      if (obj.shoppic) frmData.append("shoppic", obj.shoppic);
      if (obj.certpic) frmData.append("certpic", obj.certpic);

      const token = localStorage.getItem("token");

      const resp = await axios.post(url, frmData, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      alert(resp.data.msg || "✓ Vendor Details Updated Successfully!");
    } catch (error) {
      console.error(error);
      alert("Error updating vendor details!");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full flex justify-center py-6 px-3 sm:px-6 text-[#11130F]">
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-stone-200/90 shadow-xl p-6 sm:p-10 space-y-7">
        
        {/* ========================================================
            1. TOP HEADER & VERIFICATION STATUS
           ======================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-100 gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-700 shadow-sm shadow-emerald-700/50" />
              <h2 className="text-2xl font-serif text-stone-900 tracking-tight font-bold">
                Vendor Business Profile
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-1.5 font-light">
              Register or update your business listings to receive direct customer bookings on Evenue.
            </p>
          </div>

          {/* Dynamic Registration Status Pill */}
          <div className="flex items-center gap-2">
            {isCheckingRecord ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-stone-400" />
                Checking Profile...
              </span>
            ) : isExistingVendor ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                Existing Partner Active ✓
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                New Partner Registration
              </span>
            )}
          </div>
        </div>

        <form onSubmit={doFormSubmit} className="space-y-6">

          {/* ========================================================
              2. READ-ONLY REGISTERED EMAIL CARD (No Refresh Button)
             ======================================================== */}
          <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Registered Vendor Email
                </label>
                <span className="text-[10px] font-semibold bg-stone-200 text-stone-700 px-2 py-0.5 rounded-md">
                  🔒 Locked to Account
                </span>
              </div>
              <input
                type="email"
                name="emailid"
                value={obj.emailid}
                readOnly
                placeholder="vendor@evenue.com"
                className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-sm font-medium text-stone-700 outline-none cursor-not-allowed select-all shadow-inner"
              />
              {errors.emailid && (
                <p className="text-xs text-red-600 font-medium mt-1">{errors.emailid}</p>
              )}
            </div>

            <div className="hidden sm:flex flex-col items-end justify-center self-end sm:self-auto text-right">
              <span className="text-[11px] text-stone-400 font-light">Partner Status</span>
              <span className="text-xs font-semibold text-emerald-900 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Verified Access
              </span>
            </div>
          </div>

          {/* ========================================================
              3. OWNER NAME & CONTACT
             ======================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                Owner Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={obj.name}
                onChange={doUpdateObj}
                placeholder="Owner's Full Name"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                  errors.name
                    ? "border-red-400 bg-red-50/20 focus:ring-1 focus:ring-red-400"
                    : "border-stone-200 bg-stone-50/40 focus:bg-white focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900"
                }`}
              />
              {errors.name && <p className="text-xs text-red-600 font-medium mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                Contact Number (10 Digits) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="contact"
                value={obj.contact}
                maxLength={10}
                onChange={doUpdateObj}
                placeholder="9876543210"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                  errors.contact
                    ? "border-red-400 bg-red-50/20 focus:ring-1 focus:ring-red-400"
                    : "border-stone-200 bg-stone-50/40 focus:bg-white focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900"
                }`}
              />
              {errors.contact && <p className="text-xs text-red-600 font-medium mt-1">{errors.contact}</p>}
            </div>
          </div>

          {/* ========================================================
              4. BUSINESS NAME, AREA, ADDRESS
             ======================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="business"
                value={obj.business}
                onChange={doUpdateObj}
                placeholder="Business / Studio Name"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                  errors.business
                    ? "border-red-400 bg-red-50/20 focus:ring-1 focus:ring-red-400"
                    : "border-stone-200 bg-stone-50/40 focus:bg-white focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900"
                }`}
              />
              {errors.business && <p className="text-xs text-red-600 font-medium mt-1">{errors.business}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                Area / Locality <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="area"
                value={obj.area}
                onChange={doUpdateObj}
                placeholder="e.g. Model Town"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                  errors.area
                    ? "border-red-400 bg-red-50/20 focus:ring-1 focus:ring-red-400"
                    : "border-stone-200 bg-stone-50/40 focus:bg-white focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900"
                }`}
              />
              {errors.area && <p className="text-xs text-red-600 font-medium mt-1">{errors.area}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                Street Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="address"
                value={obj.address}
                onChange={doUpdateObj}
                placeholder="Shop No., Street Address"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                  errors.address
                    ? "border-red-400 bg-red-50/20 focus:ring-1 focus:ring-red-400"
                    : "border-stone-200 bg-stone-50/40 focus:bg-white focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900"
                }`}
              />
              {errors.address && <p className="text-xs text-red-600 font-medium mt-1">{errors.address}</p>}
            </div>
          </div>

          {/* ========================================================
              5. CITY & ESTABLISHED DATE
             ======================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="city"
                value={obj.city}
                onChange={doUpdateObj}
                placeholder="City Name"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                  errors.city
                    ? "border-red-400 bg-red-50/20 focus:ring-1 focus:ring-red-400"
                    : "border-stone-200 bg-stone-50/40 focus:bg-white focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900"
                }`}
              />
              {errors.city && <p className="text-xs text-red-600 font-medium mt-1">{errors.city}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                Established In (Estd.) <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="estd"
                value={obj.estd}
                onChange={doUpdateObj}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                  errors.estd
                    ? "border-red-400 bg-red-50/20 focus:ring-1 focus:ring-red-400"
                    : "border-stone-200 bg-stone-50/40 focus:bg-white focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900"
                }`}
              />
              {errors.estd && <p className="text-xs text-red-600 font-medium mt-1">{errors.estd}</p>}
            </div>
          </div>

          {/* ========================================================
              6. BUSINESS CATEGORIES MULTI-SELECT
             ======================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Multi-select Dropdown */}
            <div className="relative">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                Select Business Categories <span className="text-red-500">*</span>
              </label>

              <button
                type="button"
                onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/40 text-sm text-left flex justify-between items-center outline-none hover:border-emerald-900 focus:bg-white focus:border-emerald-900 transition cursor-pointer shadow-xs"
              >
                <span className="text-stone-700 font-medium truncate">
                  {obj.selcate ? "Categories Selected (Click to edit)" : "Click to Select Categories"}
                </span>
                <span className="text-xs bg-emerald-950 text-white px-2 py-0.5 rounded-md font-bold">
                  {isCategoryDropdownOpen ? "▲" : "▼"}
                </span>
              </button>

              {isCategoryDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white border border-stone-200 rounded-2xl shadow-2xl p-4 transition-all">
                  <p className="text-xs text-stone-500 font-semibold mb-2">
                    Select all services you provide:
                  </p>

                  <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                    {categoryOptions.map((cat) => {
                      const isSelected = obj.selcate
                        .split(",")
                        .map((c) => c.trim())
                        .includes(cat);

                      return (
                        <label
                          key={cat}
                          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs cursor-pointer transition select-none ${
                            isSelected
                              ? "bg-emerald-50 text-emerald-950 font-bold"
                              : "text-stone-700 hover:bg-stone-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => doToggleCategory(cat)}
                            className="w-4 h-4 accent-emerald-900 cursor-pointer rounded"
                          />
                          <span>{cat}</span>
                        </label>
                      );
                    })}
                  </div>

                  <div className="pt-3 mt-2 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-xs text-stone-500 font-medium">
                      {obj.selcate ? `${obj.selcate.split(",").length} selected` : "None"}
                    </span>
                    
                    <button
                      type="button"
                      onClick={() => setIsCategoryDropdownOpen(false)}
                      className="px-5 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-white text-xs font-bold rounded-lg shadow-sm transition active:scale-95 cursor-pointer"
                    >
                      Done ✓
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Selected Categories Display */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                Active Categories Selected <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="selcate"
                value={obj.selcate}
                onChange={doUpdateObj}
                placeholder="e.g. Photography, Catering"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                  errors.selcate
                    ? "border-red-400 bg-red-50/20 focus:ring-1 focus:ring-red-400"
                    : "border-stone-200 bg-stone-50/40 focus:bg-white focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900"
                }`}
              />
              {errors.selcate && <p className="text-xs text-red-600 font-medium mt-1">{errors.selcate}</p>}
            </div>

          </div>

          {/* ========================================================
              7. WEBSITE & INSTAGRAM
             ======================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                Website URL <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="website"
                value={obj.website}
                onChange={doUpdateObj}
                placeholder="https://www.yourdomain.com"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                  errors.website
                    ? "border-red-400 bg-red-50/20 focus:ring-1 focus:ring-red-400"
                    : "border-stone-200 bg-stone-50/40 focus:bg-white focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900"
                }`}
              />
              {errors.website && <p className="text-xs text-red-600 font-medium mt-1">{errors.website}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                Instagram Handle <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="insta"
                value={obj.insta}
                onChange={doUpdateObj}
                placeholder="@your_instagram"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                  errors.insta
                    ? "border-red-400 bg-red-50/20 focus:ring-1 focus:ring-red-400"
                    : "border-stone-200 bg-stone-50/40 focus:bg-white focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900"
                }`}
              />
              {errors.insta && <p className="text-xs text-red-600 font-medium mt-1">{errors.insta}</p>}
            </div>
          </div>

          {/* ========================================================
              8. SHOP PHOTO & CERTIFICATE UPLOAD
             ======================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            
            {/* Shop Photo */}
            <div className="p-5 rounded-2xl border border-stone-200 bg-stone-50/40 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                Storefront / Work Photo <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={doShopPic}
                className="w-full text-xs text-stone-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-950 file:text-white hover:file:bg-emerald-900 transition cursor-pointer"
              />
              {errors.shoppic && (
                <p className="text-xs text-red-600 font-medium">{errors.shoppic}</p>
              )}
              <div className="w-full h-36 border-2 border-dashed border-stone-200 rounded-xl overflow-hidden flex items-center justify-center bg-white shadow-sm">
                {shopPicPrev ? (
                  <img src={shopPicPrev} alt="Shop Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-stone-400">Shop / Portfolio Photo Preview</span>
                )}
              </div>
            </div>

            {/* Business Certificate */}
            <div className="p-5 rounded-2xl border border-stone-200 bg-stone-50/40 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                Business Certificate / License <span className="text-stone-400 font-normal">(Optional)</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={doCertPic}
                className="w-full text-xs text-stone-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-950 file:text-white hover:file:bg-emerald-900 transition cursor-pointer"
              />
              <div className="w-full h-36 border-2 border-dashed border-stone-200 rounded-xl overflow-hidden flex items-center justify-center bg-white shadow-sm">
                {certPicPrev ? (
                  <img src={certPicPrev} alt="Certificate Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-stone-400">Registration Certificate Preview</span>
                )}
              </div>
            </div>

          </div>

          {/* ========================================================
              9. ACTION BUTTONS: SMART SAVE & UPDATE
              - If New Vendor: Save is ENABLED, Update is DISABLED
              - If Existing Vendor: Save is DISABLED, Update is ENABLED
             ======================================================== */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4 border-t border-stone-100">
            
            {/* SAVE BUTTON */}
            <div className="w-full sm:w-auto text-center">
              <button
                type="submit"
                disabled={isExistingVendor || loading}
                className={`w-full sm:w-56 py-3.5 text-xs font-bold tracking-wider uppercase rounded-full shadow-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  isExistingVendor
                    ? "bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed opacity-60"
                    : "bg-emerald-950 hover:bg-emerald-900 text-white cursor-pointer active:scale-95 shadow-emerald-950/20 hover:shadow-md"
                }`}
              >
                <span>{loading ? "Processing..." : "Save Vendor Profile"}</span>
                {!isExistingVendor && !loading && <span>→</span>}
              </button>
              {isExistingVendor && (
                <p className="text-[10px] text-stone-400 mt-1 font-light">
                  Already registered. Use Update below to modify.
                </p>
              )}
            </div>

            {/* UPDATE BUTTON */}
            <div className="w-full sm:w-auto text-center">
              <button
                type="button"
                onClick={doUpdate}
                disabled={!isExistingVendor || loading}
                className={`w-full sm:w-56 py-3.5 text-xs font-bold tracking-wider uppercase rounded-full border transition-all duration-200 flex items-center justify-center gap-2 ${
                  !isExistingVendor
                    ? "bg-stone-50 text-stone-300 border-stone-200 cursor-not-allowed opacity-60"
                    : "bg-white hover:bg-emerald-50 text-emerald-950 border-emerald-950 cursor-pointer active:scale-95 shadow-xs"
                }`}
              >
                <span>{loading ? "Updating..." : "Update Details"}</span>
                {isExistingVendor && !loading && <span>✓</span>}
              </button>
              {!isExistingVendor && (
                <p className="text-[10px] text-stone-400 mt-1 font-light">
                  Save profile first before updating.
                </p>
              )}
            </div>

          </div>

        </form>
      </div>
    </div>
  );
}

export default VendorRegistration;
