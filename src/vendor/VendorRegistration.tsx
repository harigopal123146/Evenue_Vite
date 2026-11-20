
import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:2005";

// ----------------------------------------------------
// 1. DATA STRUCTURE
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
  const [shopPicPrev, setShopPicPrev] = useState<string>("");
  const [certPicPrev, setCertPicPrev] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [isExistingVendor, setIsExistingVendor] = useState<boolean>(false);
  const [isCheckingRecord, setIsCheckingRecord] = useState<boolean>(true);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState<boolean>(false);

  const categoryOptions = [
    "Decoration",
    "Photography",
    "Catering",
    "DJ & Sound",
    "Mehndi Artist",
    "Bridal Makeup",
    "Wedding Planner",
    "Cake",
    "Wedding Cake",
    "Tent House",
    "Lighting",
    "Invitation Cards",
    "Sweets",
    "Bridal Wear",
    "Pandit",
    "Jagran Party",
    "Bhangra Group",
    "Cleaning",
  ];

  // ----------------------------------------------------
  // 2. AUTO-FETCH DATA ON PAGE LOAD
  // ----------------------------------------------------
  useEffect(() => {
    let email = localStorage.getItem("vendorEmail");

    if (email) {
      setObj((prev) => ({ ...prev, emailid: email }));
      autoFetchVendorDetails(email);
    } else {
      setIsCheckingRecord(false);
    }
  }, []);

  async function autoFetchVendorDetails(emailToFetch: string) {
    try {
      setIsCheckingRecord(true);
      const token = localStorage.getItem("token");

      const resp = await axios.post(
        `${API_URL}/vendor/vendorFetch`,
        { emailid: emailToFetch.trim() },
        { headers: { authorization: `Bearer ${token}` } }
      );

      if (resp.data.status === true && resp.data.msg) {
        const vendorData = resp.data.msg;

        if (vendorData.estd) {
          vendorData.estd = vendorData.estd.split("T")[0];
        }

        setObj(vendorData);

        if (vendorData.shoppicurl && vendorData.shoppicurl !== "No_Pic.jpg") {
          setShopPicPrev(vendorData.shoppicurl);
        }
        if (vendorData.certpicurl && vendorData.certpicurl !== "No_Pic.jpg") {
          setCertPicPrev(vendorData.certpicurl);
        }

        setIsExistingVendor(true);
      } else {
        setIsExistingVendor(false);
      }
    } catch (error) {
      console.log("No previous record found.");
      setIsExistingVendor(false);
    } finally {
      setIsCheckingRecord(false);
    }
  }

  // ----------------------------------------------------
  // 3. INPUT CHANGE HANDLERS
  // ----------------------------------------------------
  function doUpdateObj(event: React.ChangeEvent<HTMLInputElement>) {
    let { name, value } = event.target;

    // Contact number restriction: Sirf numbers aur max 10
    if (name === "contact") {
      value = value.replace(/\D/g, "").slice(0, 10);
    }

    setObj((prev) => ({ ...prev, [name]: value }));
  }

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
  }

  function doShopPic(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setObj((prev) => ({ ...prev, shoppic: file }));
      setShopPicPrev(URL.createObjectURL(file));
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
  // 4. SIMPLE ALL-FIELDS VALIDATION (Beginner-Level)
  // ----------------------------------------------------
  function checkValidation(isUpdate: boolean = false): boolean {
    if (!obj.emailid.trim()) {
      alert("Email is required!");
      return false;
    }
    if (!obj.name.trim()) {
      alert("Owner Name is required!");
      return false;
    }
    if (!obj.contact.trim() || obj.contact.length !== 10) {
      alert("Please enter a valid 10-digit Contact Number!");
      return false;
    }
    if (!obj.business.trim()) {
      alert("Business Name is required!");
      return false;
    }
    if (!obj.area.trim()) {
      alert("Area / Locality is required!");
      return false;
    }
    if (!obj.address.trim()) {
      alert("Street Address is required!");
      return false;
    }
    if (!obj.city.trim()) {
      alert("City is required!");
      return false;
    }
    if (!obj.estd.trim()) {
      alert("Established Date is required!");
      return false;
    }
    if (!obj.selcate.trim()) {
      alert("Please select at least one Business Category!");
      return false;
    }
    if (!obj.website.trim()) {
      alert("Website URL is required!");
      return false;
    }
    if (!obj.insta.trim()) {
      alert("Instagram Handle is required!");
      return false;
    }

    // Photo Check: Save karte time nayi photo chahiye, Update me purani bhi chalegi
    if (!isUpdate && !obj.shoppic) {
      alert("Storefront / Work Photo is required!");
      return false;
    }
    if (isUpdate && !obj.shoppic && !shopPicPrev) {
      alert("Storefront / Work Photo is required!");
      return false;
    }

    return true; // Sabhi fields sahi hain
  }

  // ----------------------------------------------------
  // 5. HELPER: FORMDATA PACKER
  // ----------------------------------------------------
  function prepareFormData(): FormData {
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

    return frmData;
  }

  // ----------------------------------------------------
  // 6. SAVE RECORD
  // ----------------------------------------------------
  async function doFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // 1. Validation Check
    if (!checkValidation(false)) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const frmData = prepareFormData();

      const resp = await axios.post(`${API_URL}/vendor/vendorSave`, frmData, {
        headers: { authorization: `Bearer ${token}` },
      });

      alert(resp.data.msg || "🎉 Vendor Profile Registered Successfully!");
      setIsExistingVendor(true);
    } catch (error) {
      alert("Error saving vendor details!");
    } finally {
      setLoading(false);
    }
  }

  // ----------------------------------------------------
  // 7. UPDATE RECORD
  // ----------------------------------------------------
  async function doUpdate() {
    // 1. Validation Check
    if (!checkValidation(true)) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const frmData = prepareFormData();

      const resp = await axios.post(`${API_URL}/vendor/vendorUpdate`, frmData, {
        headers: { authorization: `Bearer ${token}` },
      });

      alert(resp.data.msg || "✓ Vendor Details Updated Successfully!");
    } catch (error) {
      alert("Error updating vendor details!");
    } finally {
      setLoading(false);
    }
  }

  // ----------------------------------------------------
  // 8. EXACT SAME USER INTERFACE (UI)
  // ----------------------------------------------------
  return (
    <div className="w-full flex justify-center py-6 px-3 sm:px-6 text-[#11130F]">
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-stone-200/90 shadow-xl p-6 sm:p-10 space-y-7">
        
        {/* ================= HEADER & STATUS ================= */}
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

          {/* ================= REGISTERED EMAIL (LOCKED) ================= */}
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
            </div>

            <div className="hidden sm:flex flex-col items-end justify-center self-end sm:self-auto text-right">
              <span className="text-[11px] text-stone-400 font-light">Partner Status</span>
              <span className="text-xs font-semibold text-emerald-900 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Verified Access
              </span>
            </div>
          </div>

          {/* ================= OWNER NAME & CONTACT ================= */}
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
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/40 text-sm outline-none transition-all focus:bg-white focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900"
              />
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
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/40 text-sm outline-none transition-all focus:bg-white focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900"
              />
            </div>
          </div>

          {/* ================= BUSINESS NAME, AREA, ADDRESS ================= */}
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
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/40 text-sm outline-none transition-all focus:bg-white focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900"
              />
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
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/40 text-sm outline-none transition-all focus:bg-white focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900"
              />
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
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/40 text-sm outline-none transition-all focus:bg-white focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900"
              />
            </div>
          </div>

          {/* ================= CITY & ESTABLISHED DATE ================= */}
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
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/40 text-sm outline-none transition-all focus:bg-white focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900"
              />
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
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/40 text-sm outline-none transition-all focus:bg-white focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900"
              />
            </div>
          </div>

          {/* ================= BUSINESS CATEGORIES MULTI-SELECT ================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/40 text-sm outline-none transition-all focus:bg-white focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900"
              />
            </div>
          </div>

          {/* ================= WEBSITE & INSTAGRAM ================= */}
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
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/40 text-sm outline-none transition-all focus:bg-white focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900"
              />
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
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/40 text-sm outline-none transition-all focus:bg-white focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900"
              />
            </div>
          </div>

          {/* ================= PHOTOS & PREVIEWS ================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            
            {/* Storefront Photo */}
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
              <div className="w-full h-36 border-2 border-dashed border-stone-200 rounded-xl overflow-hidden flex items-center justify-center bg-white shadow-sm">
                {shopPicPrev ? (
                  <img src={shopPicPrev} alt="Shop Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-stone-400">Shop / Portfolio Photo Preview</span>
                )}
              </div>
            </div>

            {/* Certificate Photo */}
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

          {/* ================= ACTION BUTTONS: SAVE & UPDATE ================= */}
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
