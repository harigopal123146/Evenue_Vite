
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export interface Vendor {
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
  myGivenRating?: number;
}

export default function Favs() {
  const navigate = useNavigate();
  const API_BASE = "http://localhost:2005";

  const [email, setEmail] = useState<string>("");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<{ url: string; title: string } | null>(null);

  // Rating States
  const [hoveredRating, setHoveredRating] = useState<{ [vendorEmail: string]: number }>({});
  const [ratingSubmitting, setRatingSubmitting] = useState<{ [vendorEmail: string]: boolean }>({});
  const [userRatings, setUserRatings] = useState<{ [vendorEmail: string]: number }>({});

  // ========================================================
  // 1. LOCAL PERSISTENCE HELPERS (Per Citizen Email)
  // ========================================================
  function getStoredCitizenRatings(citizenMail: string): { [vendorEmail: string]: number } {
    if (!citizenMail) return {};
    try {
      const key = `evenue_ratings_${citizenMail.toLowerCase().trim()}`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  }

  function saveStoredCitizenRating(citizenMail: string, vendorMail: string, stars: number) {
    if (!citizenMail || !vendorMail) return;
    try {
      const key = `evenue_ratings_${citizenMail.toLowerCase().trim()}`;
      const existing = getStoredCitizenRatings(citizenMail);
      existing[vendorMail.toLowerCase().trim()] = stars;
      localStorage.setItem(key, JSON.stringify(existing));
    } catch {}
  }

  // 2. Extract Active Citizen Email
  function getActiveCitizenEmail(): string {
    const direct = localStorage.getItem("citizenEmail");
    if (direct && direct.trim()) return direct.trim();

    const storedUser = localStorage.getItem("evenue_user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed?.emailid) return parsed.emailid.trim();
        if (parsed?.email) return parsed.email.trim();
      } catch (e) {}
    }

    return "";
  }

  // 3. Page Load: Auto Load Citizen Ratings on Login/Refresh
  useEffect(() => {
    const activeEmail = getActiveCitizenEmail();
    if (activeEmail) {
      setEmail(activeEmail);

      // Instant UI restore: Logout ke baad login karne par turant pehle se diye hue stars dikhenge
      const localSaved = getStoredCitizenRatings(activeEmail);
      setUserRatings(localSaved);

      // Fetch fresh wishlist & sync with backend database
      doFetchWishlist(activeEmail);
    } else {
      setLoading(false);
    }
  }, []);

  async function doFetchWishlist(targetEmail: string) {
    if (!targetEmail) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const resp = await axios.post(`${API_BASE}/favrs/fetchWishlist`, {
        citizenEmail: targetEmail.trim(),
      });

      if (resp.data.status === true) {
        const list: Vendor[] = Array.isArray(resp.data.msg) ? resp.data.msg : [];
        setVendors(list);

        // Merge backend ratings with local citizen ratings
        const localSaved = getStoredCitizenRatings(targetEmail);
        const mergedRatings: { [vendorEmail: string]: number } = { ...localSaved };

        list.forEach((v) => {
          const vKey = v.emailid.toLowerCase().trim();
          if (v.myGivenRating && v.myGivenRating > 0) {
            mergedRatings[vKey] = v.myGivenRating;
            saveStoredCitizenRating(targetEmail, vKey, v.myGivenRating);
          }
        });

        setUserRatings(mergedRatings);
      } else {
        setVendors([]);
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  }

  // ========================================================
  // 4. SUBMIT / UPDATE 5-STAR RATING
  // ========================================================
  async function doRateVendor(vendorEmail: string, stars: number) {
    if (!email) {
      alert("Please log in as a citizen to rate vendors.");
      return;
    }

    const cleanVendorEmail = vendorEmail.trim();

    try {
      setRatingSubmitting((prev) => ({ ...prev, [cleanVendorEmail]: true }));

      // Instant local persistence: Save right away for this citizen
      saveStoredCitizenRating(email, cleanVendorEmail, stars);
      setUserRatings((prev) => ({
        ...prev,
        [cleanVendorEmail]: stars,
        [cleanVendorEmail.toLowerCase()]: stars,
      }));

      // Send to backend endpoint: /favrs/rating
      const resp = await axios.post(`${API_BASE}/favrs/rating`, {
        vendorEmail: cleanVendorEmail,
        citizenEmail: email.trim(),
        rating: stars,
      });

      if (resp.data.status === true) {
        // Update vendor's overallRating and reviewCount in state
        setVendors((prev) =>
          prev.map((v) => {
            if (v.emailid.toLowerCase().trim() === cleanVendorEmail.toLowerCase()) {
              return {
                ...v,
                overallRating: resp.data.overallRating,
                ratingCount: resp.data.ratingCount,
                myGivenRating: stars,
              };
            }
            return v;
          })
        );
      } else {
        alert(resp.data.msg || "Rating could not be saved.");
      }
    } catch (error: any) {
      console.error("Rating submission error:", error);
      alert("Error submitting rating.");
    } finally {
      setRatingSubmitting((prev) => ({ ...prev, [cleanVendorEmail]: false }));
    }
  }

  // ========================================================
  // 5. REMOVE FROM WISHLIST
  // ========================================================
  async function doRemoveFromWishlist(vendorEmail: string, businessName: string) {
    if (!window.confirm(`Remove "${businessName || vendorEmail}" from favorites?`)) return;

    setRemovingEmail(vendorEmail);

    try {
      const resp = await axios.post(`${API_BASE}/favrs/RemoveFavs`, {
        citizenEmail: email.trim(),
        vendorEmail: vendorEmail.trim(),
      });

      if (resp.data.status === true) {
        setVendors((prev) => prev.filter((v) => v.emailid !== vendorEmail));
      } else {
        alert(resp.data.msg || "Could not remove vendor.");
      }
    } catch (error: any) {
      console.error("Error removing vendor:", error);
      alert("Error removing vendor from favorites.");
    } finally {
      setRemovingEmail(null);
    }
  }

  function formatEstd(val: string): string {
    if (!val) return "";
    const d = new Date(val);
    return isNaN(d.getTime()) ? val : String(d.getFullYear());
  }

  function isValidPic(url?: string): boolean {
    return Boolean(url && url.trim() !== "" && url !== "No_Pic.jpg");
  }

  return (
    <div className="w-full text-[#11130F] font-sans antialiased py-2">
      
      {/* 1. Header Banner */}
      <div className="mb-6 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-emerald-600/20 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-white/10 text-emerald-200 border border-white/10 mb-2.5">
              <span className="text-red-400">❤️</span> Shortlisted Vendors
            </span>
            <h1 className="font-serif text-2xl sm:text-4xl text-white tracking-tight">
              Favorite Event Partners
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-xl font-light">
              Review your saved vendor contacts, view portfolios, and submit ratings.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            {email && (
              <div className="bg-white/10 backdrop-blur-md border border-white/15 px-4 py-2 rounded-2xl flex items-center gap-2.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <div className="text-right">
                  <span className="text-[10px] text-emerald-200 block uppercase font-medium">Logged-in</span>
                  <span className="text-xs font-semibold text-white font-mono">{email}</span>
                </div>
              </div>
            )}

            <button
              onClick={() => doFetchWishlist(email)}
              disabled={loading}
              title="Refresh Wishlist"
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <svg
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Stats Bar */}
      <div className="bg-white rounded-2xl border border-stone-200/80 px-6 py-4 mb-6 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-serif text-base font-bold text-stone-900">Saved Wishlist</span>
          <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-950 border border-emerald-200">
            {vendors.length} {vendors.length === 1 ? "Vendor" : "Vendors"}
          </span>
        </div>

        <button
          onClick={() => navigate("../search")}
          className="text-xs font-semibold text-emerald-950 hover:text-emerald-700 flex items-center gap-1.5 transition cursor-pointer"
        >
          <span>Find More Vendors</span>
          <span>→</span>
        </button>
      </div>

      {/* 3. Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-3xl border border-stone-200 p-5 space-y-4">
              <div className="w-full h-48 bg-stone-200 rounded-2xl" />
              <div className="h-4 bg-stone-200 rounded-md w-3/4" />
              <div className="h-3 bg-stone-100 rounded-md w-1/2" />
              <div className="h-10 bg-stone-100 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* 4. Empty Wishlist Prompt */}
      {!loading && vendors.length === 0 && (
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-stone-200/90 shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-50 text-emerald-900 flex items-center justify-center text-3xl font-serif">
            ♡
          </div>
          <h3 className="font-serif text-2xl text-stone-900 font-bold">No Shortlisted Vendors</h3>
          <p className="text-xs sm:text-sm text-stone-500 mt-2 max-w-md mx-auto font-light leading-relaxed">
            {email ? (
              <>No saved vendors found for <strong className="text-stone-800">{email}</strong>. Browse vendors and tap the heart icon to shortlist them here.</>
            ) : (
              <>Please log in with your citizen account to view your saved vendors.</>
            )}
          </p>

          <button
            onClick={() => navigate("../search")}
            className="mt-6 px-7 py-3 bg-emerald-950 hover:bg-emerald-900 text-white font-medium text-xs tracking-wider uppercase rounded-full shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-95"
          >
            Explore Event Vendors →
          </button>
        </div>
      )}

      {/* 5. Rendered Vendor Cards */}
      {!loading && vendors.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vendors.map((vendor, index) => {
            const currentOverall = Number(vendor.overallRating) || 0;
            const currentCount = Number(vendor.ratingCount) || 0;
            const hovered = hoveredRating[vendor.emailid] || 0;

            // Rating matching (case-insensitive)
            const userRated =
              userRatings[vendor.emailid] ||
              userRatings[vendor.emailid.toLowerCase().trim()] ||
              vendor.myGivenRating ||
              0;

            const isSubmittingRating = ratingSubmitting[vendor.emailid] || false;
            const hasValidImage = isValidPic(vendor.shoppicurl);

            return (
              <div
                key={vendor._id || vendor.emailid || index}
                className="bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-200/90 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group"
              >
                {/* Photo Area */}
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
                >
                  {hasValidImage ? (
                    <img
                      src={vendor.shoppicurl}
                      alt={vendor.business || vendor.name}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 bg-stone-800 text-xs">
                      <span>No Photo Uploaded</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

                  {/* Dynamic City Tag */}
                  {vendor.city && (
                    <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-md text-stone-900 text-[10px] font-bold px-3 py-1 rounded-full shadow-xs">
                      📍 {vendor.city}
                    </span>
                  )}

                  {/* Dynamic Established Date Tag */}
                  {vendor.estd && (
                    <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-medium px-2.5 py-0.5 rounded-full border border-white/10">
                      Estd. {formatEstd(vendor.estd)}
                    </span>
                  )}

                  {/* Dynamic Certificate Link */}
                  {isValidPic(vendor.certpicurl) && (
                    <a
                      href={vendor.certpicurl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-3 right-3 bg-emerald-900/90 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full hover:bg-emerald-800 transition"
                    >
                      ✓ License
                    </a>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Header: Business & Owner Name */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-emerald-950 transition-colors leading-snug">
                          {vendor.business || vendor.name}
                        </h3>
                        {vendor.name && (
                          <p className="text-xs text-stone-500 font-light mt-0.5">
                            Contact Person: <span className="font-medium text-stone-700">{vendor.name}</span>
                          </p>
                        )}
                      </div>

                      {/* Dynamic Rating Score Badge */}
                      <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl shrink-0">
                        <span className="text-amber-500 text-xs">★</span>
                        <span className="text-xs font-bold text-amber-950">
                          {currentOverall > 0 ? currentOverall.toFixed(1) : "0.0"}
                        </span>
                        <span className="text-[10px] text-stone-400 font-medium">
                          ({currentCount})
                        </span>
                      </div>
                    </div>

                    {/* Dynamic Address */}
                    {(vendor.address || vendor.area || vendor.city) && (
                      <p className="text-xs text-stone-600 mt-2.5 flex items-start gap-1.5 leading-relaxed">
                        <span className="text-emerald-800 shrink-0">📍</span>
                        <span>
                          {vendor.address ? `${vendor.address}, ` : ""}
                          {vendor.area ? `${vendor.area}, ` : ""}
                          <strong className="text-stone-900">{vendor.city}</strong>
                        </span>
                      </p>
                    )}

                    {/* Dynamic Categories */}
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

                  {/* Dynamic 5-Star Interactive Rating (Persisted across Logout/Login) */}
                  <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-stone-700 text-[11px] uppercase tracking-wider">
                        {userRated > 0 ? "Your Rating:" : "Rate Vendor:"}
                      </span>
                      <span className="text-[11px] font-medium text-emerald-800">
                        {isSubmittingRating
                          ? "Saving..."
                          : userRated > 0
                          ? `${userRated} ★ (Saved • Click to change)`
                          : hovered > 0
                          ? `${hovered} Star${hovered > 1 ? "s" : ""}`
                          : "Tap a star"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between px-1">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isFilled = hovered >= star || (!hovered && userRated >= star);

                        return (
                          <button
                            key={star}
                            type="button"
                            disabled={isSubmittingRating}
                            onMouseEnter={() =>
                              setHoveredRating((prev) => ({ ...prev, [vendor.emailid]: star }))
                            }
                            onMouseLeave={() =>
                              setHoveredRating((prev) => ({ ...prev, [vendor.emailid]: 0 }))
                            }
                            onClick={() => doRateVendor(vendor.emailid, star)}
                            className="p-1 text-xl sm:text-2xl transition-transform duration-150 hover:scale-125 cursor-pointer disabled:opacity-50 select-none focus:outline-none"
                            title={`Rate ${star} Star${star > 1 ? "s" : ""}`}
                          >
                            <span className={isFilled ? "text-amber-400 drop-shadow-xs" : "text-stone-300"}>
                              ★
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Real Contact and Links */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                    {vendor.contact ? (
                      <a
                        href={`tel:${vendor.contact}`}
                        className="font-semibold text-stone-800 hover:text-emerald-950 flex items-center gap-1 transition-colors"
                      >
                        📞 {vendor.contact}
                      </a>
                    ) : (
                      <span className="text-stone-400 text-[11px]">No contact number</span>
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

                      {vendor.emailid && (
                        <a
                          href={`mailto:${vendor.emailid}`}
                          className="bg-emerald-950 hover:bg-emerald-900 text-white transition px-3 py-1 rounded-full font-medium text-[11px] shadow-xs active:scale-95"
                        >
                          Email
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Remove from Wishlist Action */}
                <div className="p-5 pt-0">
                  <button
                    type="button"
                    onClick={() => doRemoveFromWishlist(vendor.emailid, vendor.business || vendor.name)}
                    disabled={removingEmail === vendor.emailid}
                    className="w-full py-2.5 bg-stone-50 hover:bg-red-50 text-stone-600 hover:text-red-700 border border-stone-200 hover:border-red-200 rounded-full font-semibold text-[11px] tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>
                      {removingEmail === vendor.emailid ? "Removing..." : "Remove from Favorites"}
                    </span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* 6. Lightbox Zoom Modal */}
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
                <p className="text-xs text-stone-500">Storefront Photo</p>
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
