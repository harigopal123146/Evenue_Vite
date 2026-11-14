
import React, { useState, useEffect } from "react";
import axios from "axios";

// Vendor Interface with rating fields
interface Vendor {
  _id?: string;
  emailid: string;
  name: string;
  contact: string;
  business: string;
  area: string;
  address: string;
  city: string;
  estd: string;
  selcate: string;
  website?: string;
  insta?: string;
  shoppicurl?: string;
  certpicurl?: string;
  ratingCount?: number;
  overallRating?: number;
}

// Field-level Validation Errors
interface FormErrors {
  event?: string;
  services?: string;
  city?: string;
}

function Services() {
  const eventOptions = [
    "Birthday",
    "Wedding",
    "Engagement",
    "Anniversary",
    "Jagran",
    "Bhog",
    "Sukhmani Sahib Path",
    "Akhand Path Sahib",
    "Housewarming",
    "Mata Ki Chowki",
    "Kirtan Darbar",
    "Baby Shower",
    "Retirement Party",
    "Griha Pravesh",
    "Bhangra Night",
    "Farewell Party",
  ];

  // Database States
  const [citiesList, setCitiesList] = useState<string[]>([]);
  const [servicesList, setServicesList] = useState<string[]>([]);

  // Logged-in citizen email automatically retrieved from session
  const [citizenEmail, setCitizenEmail] = useState<string>("");

  // Selected filters
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("");

  // Result vendors & UI states
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loadingServices, setLoadingServices] = useState<boolean>(false);
  const [loadingVendors, setLoadingVendors] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  // Wishlist State (holds array of wishlisted vendor emailids for this citizen)
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState<string | null>(null);

  // Image Modal / Lightbox Zoom State
  const [zoomedImage, setZoomedImage] = useState<{ url: string; title: string } | null>(null);

  // Pagination States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const vendorsPerPage = 4;

  // ========================================================
  // 1. PAGE LOAD: FETCH LOGGED-IN EMAIL & CITIES
  // ========================================================
  useEffect(() => {
    let email = localStorage.getItem("citizenEmail");
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
      setCitizenEmail(cleanEmail);
      fetchUserWishlist(cleanEmail);
    }

    doFetchCities();
  }, []);

  async function doFetchCities() {
    try {
      const url = "http://localhost:2005/eventss/eventCityFetch";
      const resp = await axios.post(url);

      if (resp.data.status === true && Array.isArray(resp.data.msg)) {
        setCitiesList(resp.data.msg);
      } else if (Array.isArray(resp.data)) {
        setCitiesList(resp.data);
      } else {
        setCitiesList([]);
      }
    } catch (error) {
      console.error("Error fetching cities from database:", error);
      setCitiesList([]);
    }
  }

  // ========================================================
  // 2. EVENT SELECT: FETCH SERVICES
  // ========================================================
  async function doSelectEvent(event: React.ChangeEvent<HTMLSelectElement>) {
    const chosenEvent = event.target.value;
    setSelectedEvent(chosenEvent);
    setSelectedServices([]);
    setServicesList([]);
    setErrors((prev) => ({ ...prev, event: "" }));

    if (!chosenEvent) return;

    setLoadingServices(true);
    try {
      const url = "http://localhost:2005/eventss/eventSerFetch";

      const resp = await axios.post(
        url,
        { eventOptions: chosenEvent },
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      if (resp.data.status === true) {
        let serv = resp.data.msg?.services || resp.data.msg;

        if (Array.isArray(serv)) {
          setServicesList(serv);
        } else if (typeof serv === "string") {
          setServicesList(serv.split(",").map((s: string) => s.trim()));
        } else {
          setServicesList([]);
        }
      } else {
        setServicesList([]);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoadingServices(false);
    }
  }

  // ========================================================
  // 3. TOGGLE SERVICE (Selection Handler)
  // ========================================================
  function doToggleService(service: string) {
    if (selectedServices.includes(service)) {
      setSelectedServices(selectedServices.filter((s) => s !== service));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
    setErrors((prev) => ({ ...prev, services: "" }));
  }

  function doSelectAllServices() {
    setSelectedServices([...servicesList]);
    setErrors((prev) => ({ ...prev, services: "" }));
  }

  function doClearServices() {
    setSelectedServices([]);
  }

  // ========================================================
  // 4. FETCH CITIZEN'S WISHLIST FROM DB
  // ========================================================
  async function fetchUserWishlist(email: string) {
    if (!email) return;
    try {
      const url = "http://localhost:2005/eventss/eventFetchFav";
      const resp = await axios.post(url, { citizenEmail: email.trim() });

      if (resp.data.status === true && Array.isArray(resp.data.msg)) {
        setWishlist(resp.data.msg);
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    }
  }

  // ========================================================
  // 5. TOGGLE WISHLIST (Heart Like Button)
  // ========================================================
  async function doToggleWishlist(vendorEmail: string) {
    if (!citizenEmail) {
      alert("Please login first to add vendors to your wishlist!");
      return;
    }

    setWishlistLoading(vendorEmail);

    try {
      const url = "http://localhost:2005/eventss/eventAddtoFav";

      const resp = await axios.post(url, {
        citizenEmail: citizenEmail.trim(),
        vendorEmail: vendorEmail.trim(),
      });

      if (resp.data.status === true) {
        if (resp.data.action === "saved") {
          setWishlist((prev) => [...prev, vendorEmail.trim()]);
        } else if (resp.data.action === "removed") {
          setWishlist((prev) => prev.filter((email) => email !== vendorEmail.trim()));
        }
      } else {
        alert(resp.data.msg || "Error updating favorites");
      }
    } catch (error: any) {
      console.error("Error in doToggleWishlist:", error);
      alert(error.response?.data?.msg || "Server error while saving favorite");
    } finally {
      setWishlistLoading(null);
    }
  }

  // ========================================================
  // 6. FORM VALIDATION
  // ========================================================
  function validateForm(): boolean {
    const err: FormErrors = {};

    if (!selectedEvent.trim()) {
      err.event = "Please choose an event";
    }

    if (selectedServices.length === 0) {
      err.services = "Please select at least 1 service";
    }

    if (!selectedCity.trim()) {
      err.city = "Please select a city";
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  }

  // ========================================================
  // 7. FIND VENDORS
  // ========================================================
  async function doFindVendors(event: React.FormEvent) {
    event.preventDefault();

    if (!validateForm()) return;

    setLoadingVendors(true);
    setHasSearched(true);
    setCurrentPage(1);

    if (citizenEmail) {
      fetchUserWishlist(citizenEmail);
    }

    try {
      const url = "http://localhost:2005/eventss/eventVendorDetails";
      const payload = {
        event: selectedEvent,
        services: selectedServices,
        city: selectedCity,
      };

      const resp = await axios.post(url, payload);

      if (resp.data.status === true && Array.isArray(resp.data.msg)) {
        setVendors(resp.data.msg);
      } else {
        setVendors([]);
      }
    } catch (error) {
      console.error("Error finding vendors:", error);
      setVendors([]);
    } finally {
      setLoadingVendors(false);
    }
  }

  // Helper to validate uploaded pictures (filters "No_Pic.jpg" placeholders)
  function isValidPic(url?: string): boolean {
    return Boolean(url && url.trim() !== "" && url !== "No_Pic.jpg");
  }

  // ========================================================
  // 8. PAGINATION
  // ========================================================
  const totalPages = Math.ceil(vendors.length / vendorsPerPage);
  const indexOfLastVendor = currentPage * vendorsPerPage;
  const indexOfFirstVendor = indexOfLastVendor - vendorsPerPage;
  const currentVendors = vendors.slice(indexOfFirstVendor, indexOfLastVendor);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 350, behavior: "smooth" });
  };

  return (
    <div className="w-full text-[#11130F] font-sans antialiased">
      
      {/* Top Banner */}
      <div className="mb-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-emerald-600/20 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-white/10 text-emerald-200 border border-white/10 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Verified Event Marketplace
            </span>
            <h1 className="font-serif text-2xl sm:text-4xl text-white tracking-tight">
              Discover Premier Vendors for Your <span className="italic text-emerald-300">Evenue</span>
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-xl font-light">
              Choose your event type, select required services, and browse verified vendors with customer ratings.
            </p>
          </div>

          {citizenEmail && (
            <div className="bg-white/10 backdrop-blur-md border border-white/15 px-4 py-2.5 rounded-2xl self-start md:self-auto flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <div className="text-right">
                <span className="text-[10px] text-emerald-200 block uppercase font-medium">Active Citizen</span>
                <span className="text-xs font-semibold text-white font-mono">{citizenEmail}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ==================== LEFT COLUMN: FILTER CONTROLS ==================== */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 shadow-lg border border-stone-200/80 hover:shadow-xl transition-shadow duration-300">
          <form onSubmit={doFindVendors} className="space-y-6">
            
            <div className="pb-4 border-b border-stone-100">
              <h2 className="font-serif text-xl font-bold text-stone-900 tracking-tight">
                Event Requirements
              </h2>
              <p className="text-xs text-stone-500 font-light mt-0.5">
                Filter verified vendors by event, service & location
              </p>
            </div>

            {/* 1. Event Dropdown */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
                1. Select Event Type <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedEvent}
                onChange={doSelectEvent}
                className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium outline-none transition-all duration-200 cursor-pointer ${
                  errors.event
                    ? "border-red-400 bg-red-50/20 focus:ring-1 focus:ring-red-400"
                    : "border-stone-200 bg-stone-50/50 hover:border-emerald-800 focus:bg-white focus:border-emerald-950 focus:ring-1 focus:ring-emerald-950"
                }`}
              >
                <option value="">-- Choose an Event --</option>
                {eventOptions.map((ev, index) => (
                  <option key={index} value={ev}>
                    ✨ {ev}
                  </option>
                ))}
              </select>
              {errors.event && (
                <p className="text-xs text-red-600 font-medium mt-1.5">{errors.event}</p>
              )}
            </div>

            {/* 2. Services Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-700">
                  2. Select Services <span className="text-red-500">*</span>
                </label>
                {servicesList.length > 0 && !loadingServices && (
                  <div className="flex gap-2 text-xs font-medium">
                    <button
                      type="button"
                      onClick={doSelectAllServices}
                      className="text-emerald-900 hover:underline cursor-pointer font-semibold"
                    >
                      Select All
                    </button>
                    <span className="text-stone-300">|</span>
                    <button
                      type="button"
                      onClick={doClearServices}
                      className="text-stone-400 hover:text-stone-700 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {loadingServices ? (
                <div className="p-5 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200 animate-pulse">
                  <p className="text-xs text-emerald-900 font-medium">Loading available services...</p>
                </div>
              ) : servicesList.length > 0 ? (
                <div
                  className={`max-h-60 overflow-y-auto p-3 bg-stone-50/60 rounded-2xl border ${
                    errors.services ? "border-red-400" : "border-stone-200"
                  } space-y-2`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {servicesList.map((service, index) => {
                      const isChecked = selectedServices.includes(service);
                      return (
                        <div
                          key={index}
                          onClick={() => doToggleService(service)}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-medium cursor-pointer select-none transition-all duration-200 ${
                            isChecked
                              ? "bg-emerald-950 text-white border-emerald-950 shadow-sm"
                              : "bg-white text-stone-800 border-stone-200 hover:border-emerald-800 hover:bg-emerald-50/40"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="accent-emerald-900 cursor-pointer"
                          />
                          <span className="truncate">{service}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-stone-50 border border-dashed border-stone-200 text-center text-xs text-stone-400">
                  {selectedEvent ? "No services listed for this event yet." : "👈 Select an event to view services"}
                </div>
              )}

              {selectedServices.length > 0 && (
                <p className="text-xs text-stone-600 font-medium mt-2">
                  Selected ({selectedServices.length}):{" "}
                  <span className="text-emerald-900 font-semibold">{selectedServices.join(", ")}</span>
                </p>
              )}

              {errors.services && (
                <p className="text-xs text-red-600 font-medium mt-1.5">{errors.services}</p>
              )}
            </div>

            {/* 3. City Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
                3. Select City <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  setErrors((prev) => ({ ...prev, city: "" }));
                }}
                className={`w-full px-4 py-3 rounded-2xl border text-sm font-medium outline-none transition-all duration-200 cursor-pointer ${
                  errors.city
                    ? "border-red-400 bg-red-50/20 focus:ring-1 focus:ring-red-400"
                    : "border-stone-200 bg-stone-50/50 hover:border-emerald-800 focus:bg-white focus:border-emerald-950 focus:ring-1 focus:ring-emerald-950"
                }`}
              >
                <option value="">-- Choose City from Database --</option>
                {citiesList.map((city, index) => (
                  <option key={index} value={city}>
                    📍 {city}
                  </option>
                ))}
              </select>
              {errors.city && (
                <p className="text-xs text-red-600 font-medium mt-1.5">{errors.city}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loadingVendors}
              className="w-full py-3.5 bg-emerald-950 hover:bg-emerald-900 text-white font-medium text-xs tracking-widest uppercase rounded-full shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 cursor-pointer active:scale-95"
            >
              {loadingVendors ? "Searching Verified Vendors..." : "Find Verified Vendors"}
            </button>

          </form>
        </div>

        {/* ==================== RIGHT COLUMN: VENDOR CARDS ==================== */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Header Status Count */}
          <div className="bg-white rounded-2xl border border-stone-200/80 px-5 py-3.5 flex justify-between items-center text-xs shadow-sm">
            <span className="font-semibold text-stone-700">
              {hasSearched
                ? `Vendors in ${selectedCity} (Page ${currentPage} of ${totalPages || 1})`
                : "Verified Vendors Pool"}
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-950 font-semibold border border-emerald-200">
              {vendors.length} Total Found
            </span>
          </div>

          {/* Empty Prompt State Before Search */}
          {!loadingVendors && !hasSearched && (
            <div className="bg-white rounded-3xl p-12 text-center border border-stone-200/80 shadow-sm">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-50 text-emerald-900 flex items-center justify-center text-2xl font-serif">
                ✦
              </div>
              <h3 className="font-serif text-2xl text-stone-900 font-bold">Explore Available Event Services</h3>
              <p className="text-xs text-stone-500 mt-2 max-w-md mx-auto font-light leading-relaxed">
                Choose an event type on the left, pick the services you need, and select your city to retrieve registered, background-verified vendors.
              </p>
            </div>
          )}

          {/* No Vendors Found State */}
          {!loadingVendors && hasSearched && vendors.length === 0 && (
            <div className="bg-white rounded-3xl p-12 text-center border border-stone-200/80 shadow-sm">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-2xl">
                ✕
              </div>
              <h3 className="font-serif text-2xl text-stone-900 font-bold">No Vendors Found</h3>
              <p className="text-xs text-stone-500 mt-2 max-w-md mx-auto font-light">
                No vendors are currently available in <strong>{selectedCity}</strong> for the selected services. Try choosing broader services or another city.
              </p>
            </div>
          )}

          {/* Vendor Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentVendors.map((vendor, index) => {
              const isWishlisted = wishlist.includes(vendor.emailid);
              const isProcessing = wishlistLoading === vendor.emailid;
              const hasValidImage = isValidPic(vendor.shoppicurl);
              
              // Ratings Data
              const currentRating = Number(vendor.overallRating) || 0;
              const reviewCount = Number(vendor.ratingCount) || 0;

              return (
                <div
                  key={vendor._id || vendor.emailid || index}
                  className="bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-200/90 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group"
                >
                  {/* Photo area with Zoom-on-Click */}
                  <div
                    className={`relative h-52 bg-stone-900 overflow-hidden ${hasValidImage ? "cursor-zoom-in" : ""}`}
                    onClick={() => {
                      if (hasValidImage && vendor.shoppicurl) {
                        setZoomedImage({
                          url: vendor.shoppicurl,
                          title: vendor.business || vendor.name,
                        });
                      }
                    }}
                    title="Click to enlarge image"
                  >
                    {hasValidImage ? (
                      <img
                        src={vendor.shoppicurl}
                        alt={vendor.business || vendor.name}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 bg-stone-800 text-xs">
                        <span>No Preview Image</span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                      <span className="text-[11px] text-white bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                        🔍 Click to Enlarge
                      </span>
                    </div>

                    {/* ❤️ Wishlist Heart Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        doToggleWishlist(vendor.emailid);
                      }}
                      disabled={isProcessing}
                      title={isWishlisted ? "Remove from Favorites" : "Save to Favorites"}
                      className={`absolute top-3 left-3 p-2.5 rounded-full transition-all duration-200 shadow-md flex items-center justify-center cursor-pointer ${
                        isWishlisted
                          ? "bg-red-500 text-white scale-105 shadow-red-500/30"
                          : "bg-white/90 text-stone-600 hover:text-red-500 hover:bg-white"
                      } ${isProcessing ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill={isWishlisted ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>

                    {/* Dynamic Established Tag */}
                    {vendor.estd && (
                      <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-medium px-2.5 py-0.5 rounded-full border border-white/10">
                        Estd. {vendor.estd.split("-")[0]}
                      </span>
                    )}

                    {/* City Tag on Image */}
                    {vendor.city && (
                      <span className="absolute top-3 right-3 bg-white/95 backdrop-blur-md text-stone-900 text-[10px] font-bold px-3 py-1 rounded-full shadow-xs">
                        📍 {vendor.city}
                      </span>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      {/* Business Name & Review Pill */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-emerald-950 transition-colors leading-snug">
                            {vendor.business || vendor.name}
                          </h3>
                          {vendor.name && (
                            <p className="text-xs text-stone-500 font-light mt-0.5">
                              Owner: <span className="font-medium text-stone-700">{vendor.name}</span>
                            </p>
                          )}
                        </div>

                        {/* ========================================================
                            ⭐ REVIEW BADGE ON CARD HEADER
                           ======================================================== */}
                        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl shrink-0 shadow-xs">
                          <span className="text-amber-500 text-xs">★</span>
                          <span className="text-xs font-bold text-amber-950">
                            {currentRating > 0 ? currentRating.toFixed(1) : "0.0"}
                          </span>
                          <span className="text-[10px] text-stone-400 font-medium">
                            ({reviewCount})
                          </span>
                        </div>
                      </div>

                      {/* ========================================================
                          ⭐ 5-STAR VISUAL REVIEW BAR
                         ======================================================== */}
                      <div className="flex items-center gap-2 mt-2 pt-1">
                        <div className="flex items-center text-sm">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={
                                star <= Math.round(currentRating)
                                  ? "text-amber-400 drop-shadow-xs"
                                  : "text-stone-200"
                              }
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-[11px] text-stone-500 font-medium">
                          {reviewCount > 0
                            ? `${currentRating.toFixed(1)} / 5.0 (${reviewCount} review${reviewCount > 1 ? "s" : ""})`
                            : "No reviews yet"}
                        </span>
                      </div>

                      {/* Address */}
                      <p className="text-xs text-stone-600 mt-2.5 flex items-start gap-1.5 leading-relaxed">
                        <span className="text-emerald-800 shrink-0">📍</span>
                        <span>
                          {vendor.address ? `${vendor.address}, ` : ""}
                          {vendor.area ? `${vendor.area}, ` : ""}
                          <strong className="text-stone-900">{vendor.city}</strong>
                        </span>
                      </p>

                      {/* Selected Category Badges */}
                      {vendor.selcate && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {vendor.selcate
                            .split(",")
                            .map((c) => c.trim())
                            .filter(Boolean)
                            .map((cat, i) => (
                              <span
                                key={i}
                                className="bg-stone-100 text-stone-700 text-[10px] font-medium px-2.5 py-0.5 rounded-full border border-stone-200/60"
                              >
                                {cat}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Card Footer Actions */}
                    <div className="mt-5 pt-3.5 border-t border-stone-100 flex items-center justify-between text-xs">
                      {vendor.contact && (
                        <a
                          href={`tel:${vendor.contact}`}
                          className="font-semibold text-stone-800 hover:text-emerald-950 flex items-center gap-1 transition-colors"
                        >
                          📞 {vendor.contact}
                        </a>
                      )}

                      <div className="flex items-center gap-1.5">
                        {vendor.insta && (
                          <a
                            href={
                              vendor.insta.startsWith("http")
                                ? vendor.insta
                                : `https://instagram.com/${vendor.insta.replace("@", "")}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="text-pink-600 hover:text-pink-700 font-semibold px-2 py-1 rounded-lg hover:bg-pink-50 transition"
                            title="Instagram"
                          >
                            Insta
                          </a>
                        )}

                        {vendor.website && (
                          <a
                            href={
                              vendor.website.startsWith("http")
                                ? vendor.website
                                : `https://${vendor.website}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-900 hover:text-emerald-950 font-semibold px-2 py-1 rounded-lg hover:bg-emerald-50 transition"
                            title="Website"
                          >
                            Web
                          </a>
                        )}

                        <a
                          href={`mailto:${vendor.emailid}`}
                          className="bg-emerald-950 hover:bg-emerald-900 text-white transition px-3.5 py-1.5 rounded-full font-medium text-[11px] shadow-xs active:scale-95"
                        >
                          Email
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ==================== PAGINATION BAR ==================== */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-full border border-stone-200 bg-white text-xs font-semibold text-stone-700 hover:border-emerald-950 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                ◀ Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-9 h-9 rounded-full text-xs font-semibold transition cursor-pointer ${
                    currentPage === pageNum
                      ? "bg-emerald-950 text-white shadow-md scale-105"
                      : "bg-white border border-stone-200 text-stone-700 hover:border-emerald-950"
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-full border border-stone-200 bg-white text-xs font-semibold text-stone-700 hover:border-emerald-950 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Next ▶
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ============================================================= */}
      {/* 9. IMAGE ENLARGE LIGHTBOX MODAL                              */}
      {/* ============================================================= */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setZoomedImage(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h4 className="font-serif text-lg font-bold text-stone-900">{zoomedImage.title}</h4>
                <p className="text-xs text-stone-500">Storefront & Portfolio Photo</p>
              </div>
              <button
                type="button"
                onClick={() => setZoomedImage(null)}
                className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center text-sm font-bold cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[75vh] overflow-hidden flex items-center justify-center bg-stone-950 p-2">
              <img
                src={zoomedImage.url}
                alt={zoomedImage.title}
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
              />
            </div>

            <div className="px-6 py-3 bg-stone-50 flex items-center justify-end text-xs text-stone-500">
              <button
                type="button"
                onClick={() => setZoomedImage(null)}
                className="px-4 py-1.5 rounded-full bg-emerald-950 text-white font-medium hover:bg-emerald-900 transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Services;
