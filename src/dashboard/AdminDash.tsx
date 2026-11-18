
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

export interface UserItem {
  _id?: string;
  emailid: string;
  utype: "Citizen" | "Vendor" | string;
  status: boolean; // true = Active, false = Blocked
  createdAt?: string;
}

export default function AdminDash() {
  const navigate = useNavigate();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [alertMessage, setAlertMessage] = useState<string>("");

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");

  // Check admin session on mount
  useEffect(() => {
    const savedAdmin = localStorage.getItem("evenue_admin");
    if (!savedAdmin) {
      // 🔒 Agar Admin login nahi hai toh /login page par bhej do
      navigate("/login");
    } else {
      fetchAllUsers();
    }
  }, [navigate]);

  // Admin Logout
  function handleAdminLogout() {
    if (window.confirm("Are you sure you want to sign out from Admin Console?")) {
      localStorage.removeItem("evenue_admin");
      localStorage.removeItem("evenue_user");
      navigate("/login");
    }
  }

  // Fetch Users
  async function fetchAllUsers() {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await axios.post(`${API_URL}/admin/fetchallusers`);

      if (response.data && response.data.status && Array.isArray(response.data.data)) {
        setUsers(response.data.data);
      } else if (Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        setUsers([]);
      }
    } catch (error: any) {
      console.error("Fetch Users Error:", error);
      setErrorMessage("Could not fetch users. Please check backend connection.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  // Block / Resume User
  async function handleToggleStatus(emailid: string, currentStatus: boolean) {
    const newStatus = !currentStatus;
    const actionText = newStatus ? "Resumed (Active)" : "Blocked";

    try {
      const response = await axios.post(`${API_URL}/admin/updatestatus`, {
        emailid: emailid,
        status: newStatus,
      });

      if (response.data && response.data.status === false) {
        showAlert(response.data.msg || "Failed to update status.");
        return;
      }

      // Live update table state
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.emailid === emailid ? { ...user, status: newStatus } : user
        )
      );

      showAlert(`User ${emailid} has been ${actionText} successfully!`);
    } catch (err) {
      showAlert("Server communication error while updating status.");
    }
  }

  // Delete User Permanently
  async function handleDeleteUser(emailid: string) {
    const confirmDelete = window.confirm(
      `⚠️ PERMANENT DELETE: Are you sure you want to delete user: ${emailid}? This cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      const response = await axios.post(`${API_URL}/admin/deleteuser`, {
        emailid: emailid,
      });

      if (response.data && response.data.status === false) {
        showAlert(response.data.msg || "Failed to delete user.");
        return;
      }

      // Live remove from state
      setUsers((prevUsers) => prevUsers.filter((user) => user.emailid !== emailid));
      showAlert(`User ${emailid} was permanently deleted.`);
    } catch (err) {
      showAlert("Server communication error while deleting user.");
    }
  }

  function showAlert(msg: string) {
    setAlertMessage(msg);
    setTimeout(() => setAlertMessage(""), 3500);
  }

  // Stats
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === true).length;
  const blockedUsers = users.filter((u) => u.status === false).length;
  const totalCitizens = users.filter((u) => u.utype?.toLowerCase() === "citizen").length;
  const totalVendors = users.filter((u) => u.utype?.toLowerCase() === "vendor").length;

  // Search filter
  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.emailid.toLowerCase().includes(searchTerm.toLowerCase().trim());
    const matchesType =
      selectedType === "All" || user.utype?.toLowerCase() === selectedType.toLowerCase();
    const matchesStatus =
      selectedStatus === "All" ||
      (selectedStatus === "Active" && user.status === true) ||
      (selectedStatus === "Blocked" && user.status === false);

    return matchesSearch && matchesType && matchesStatus;
  });

  const currentAdmin = localStorage.getItem("evenue_admin") || "admin@evenue.com";

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#11130F] font-sans p-3 sm:p-6 lg:p-8 selection:bg-emerald-100 selection:text-emerald-900">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-7">
        
        {/* ==================================================== */}
        {/* 1. TOP ADMIN BANNER (RESPONSIVE)                    */}
        {/* ==================================================== */}
        <div className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-emerald-950 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-5 sm:gap-6">
          <div className="absolute -right-10 -bottom-10 w-60 h-60 sm:w-72 sm:h-72 rounded-full bg-emerald-600/20 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-white/10 text-emerald-300 border border-white/10 mb-2">
              ✦ Evenue Master Admin Console
            </span>
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-serif font-bold tracking-tight">
              User Regulation & Directory
            </h1>
            <p className="text-xs sm:text-sm text-emerald-200 mt-1 font-light">
              Monitor, regulate, block, and permanently manage Citizens and Vendors in real-time.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-2.5 sm:gap-3 w-full md:w-auto">
            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/15 text-left md:text-right flex-1 sm:flex-initial">
              <span className="text-[9px] sm:text-[10px] text-emerald-200 block uppercase font-medium">Logged in Admin</span>
              <span className="text-xs font-semibold text-white font-mono break-all">{currentAdmin}</span>
            </div>

            <button
              onClick={fetchAllUsers}
              disabled={loading}
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold cursor-pointer transition active:scale-95 disabled:opacity-50"
            >
              {loading ? "..." : "↻ Refresh"}
            </button>

            <button
              onClick={handleAdminLogout}
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition active:scale-95 cursor-pointer shadow-sm"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Runtime Notifications */}
        {alertMessage && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <span>✓</span>
              <span>{alertMessage}</span>
            </div>
            <button onClick={() => setAlertMessage("")} className="font-bold text-sm cursor-pointer p-1">✕</button>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <span>⚠</span>
              <span>{errorMessage}</span>
            </div>
            <button onClick={fetchAllUsers} className="px-3 py-1 bg-red-600 text-white rounded-lg cursor-pointer">Retry</button>
          </div>
        )}

        {/* ==================================================== */}
        {/* 2. STATS CARDS (RESPONSIVE GRID)                    */}
        {/* ==================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase text-stone-500 tracking-wider">Total Registered</p>
            <p className="text-xl sm:text-2xl font-serif font-bold text-stone-900 mt-1">{totalUsers}</p>
            <p className="text-[10px] sm:text-[11px] text-stone-400 mt-0.5">Citizens + Vendors</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
            <div className="flex justify-between items-center">
              <p className="text-[10px] sm:text-[11px] font-bold uppercase text-stone-500 tracking-wider">Active Users</p>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-xl sm:text-2xl font-serif font-bold text-emerald-900 mt-1">{activeUsers}</p>
            <p className="text-[10px] sm:text-[11px] text-emerald-700 mt-0.5">Unrestricted Access</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
            <div className="flex justify-between items-center">
              <p className="text-[10px] sm:text-[11px] font-bold uppercase text-stone-500 tracking-wider">Blocked Accounts</p>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600">
                {blockedUsers}
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-serif font-bold text-red-600 mt-1">{blockedUsers}</p>
            <p className="text-[10px] sm:text-[11px] text-red-500 mt-0.5">Access Suspended</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase text-stone-500 tracking-wider">User Distribution</p>
            <div className="flex items-center gap-2 text-xs font-bold text-stone-800 mt-2">
              <span className="text-emerald-900">Citizens: {totalCitizens}</span>
              <span className="text-stone-300">|</span>
              <span className="text-purple-700">Vendors: {totalVendors}</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-stone-400 mt-0.5">Role Breakdown</p>
          </div>
        </div>

        {/* ==================================================== */}
        {/* 3. SEARCH & FILTER BAR (STACKS ON MOBILE)           */}
        {/* ==================================================== */}
        <div className="bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400 text-xs">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by registered email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 sm:py-2.5 text-xs rounded-full border border-stone-200 bg-stone-50/50 outline-none focus:bg-white focus:border-emerald-950 transition"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full sm:w-36 md:w-44 px-3.5 py-2 sm:py-2.5 text-xs rounded-full border border-stone-200 bg-white font-medium text-stone-700 outline-none focus:border-emerald-950 cursor-pointer"
            >
              <option value="All">All User Types</option>
              <option value="Citizen">Citizens Only</option>
              <option value="Vendor">Vendors Only</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full sm:w-36 md:w-44 px-3.5 py-2 sm:py-2.5 text-xs rounded-full border border-stone-200 bg-white font-medium text-stone-700 outline-none focus:border-emerald-950 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Blocked">Blocked Only</option>
            </select>
          </div>
        </div>

        {/* ==================================================== */}
        {/* 4. USER DIRECTORY CONTAINER                         */}
        {/* ==================================================== */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
          
          {/* Loading and Empty State */}
          {loading && (
            <div className="p-10 text-center text-xs text-stone-400">
              Loading users from database collection...
            </div>
          )}

          {!loading && filteredUsers.length === 0 && (
            <div className="p-10 text-center text-xs text-stone-400">
              No matching users found in the database.
            </div>
          )}

          {/* -------------------------------------------------- */}
          {/* A. MOBILE VIEW: CARDS (Visible only on mobile)     */}
          {/* -------------------------------------------------- */}
          {!loading && filteredUsers.length > 0 && (
            <div className="md:hidden divide-y divide-stone-100">
              {filteredUsers.map((user) => {
                const isActive = user.status === true;

                return (
                  <div key={user.emailid} className="p-4 space-y-3">
                    {/* Row 1: Email and Role */}
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-mono font-medium text-xs text-stone-900 break-all">
                        {user.emailid}
                      </p>
                      {user.utype?.toLowerCase() === "vendor" ? (
                        <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                          Vendor
                        </span>
                      ) : (
                        <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-900 border border-emerald-200">
                          Citizen
                        </span>
                      )}
                    </div>

                    {/* Row 2: Status & Action Buttons */}
                    <div className="flex items-center justify-between pt-1">
                      {/* Status */}
                      {isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                          Blocked
                        </span>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        {isActive ? (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(user.emailid, user.status)}
                            className="px-3 py-1.5 text-xs font-bold rounded-full border border-amber-200 bg-amber-50 active:bg-amber-100 text-amber-900 cursor-pointer"
                          >
                            ⛔ Block
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(user.emailid, user.status)}
                            className="px-3 py-1.5 text-xs font-bold rounded-full bg-emerald-950 active:bg-emerald-900 text-white cursor-pointer"
                          >
                            ✓ Resume
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteUser(user.emailid)}
                          className="px-3 py-1.5 text-xs font-bold rounded-full border border-stone-200 text-stone-600 active:bg-red-50 active:text-red-700 active:border-red-200 cursor-pointer"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* -------------------------------------------------- */}
          {/* B. DESKTOP VIEW: TABLE (Visible on tablets & above)*/}
          {/* -------------------------------------------------- */}
          {!loading && filteredUsers.length > 0 && (
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-200 text-left text-xs">
                <thead className="bg-stone-50 text-[11px] uppercase font-bold text-stone-500 tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-4">User Email</th>
                    <th scope="col" className="px-6 py-4">Role / Type</th>
                    <th scope="col" className="px-6 py-4">Account Status</th>
                    <th scope="col" className="px-6 py-4 text-right">Admin Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-stone-100 bg-white">
                  {filteredUsers.map((user) => {
                    const isActive = user.status === true;

                    return (
                      <tr key={user.emailid} className="hover:bg-stone-50/80 transition-colors">
                        
                        {/* 1. Email ID */}
                        <td className="px-6 py-4 font-mono font-medium text-stone-900 whitespace-nowrap">
                          {user.emailid}
                        </td>

                        {/* 2. Role Badge */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.utype?.toLowerCase() === "vendor" ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                              Vendor
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-900 border border-emerald-200">
                              Citizen
                            </span>
                          )}
                        </td>

                        {/* 3. Account Status Badge */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                              Blocked
                            </span>
                          )}
                        </td>

                        {/* 4. Action Buttons */}
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {isActive ? (
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(user.emailid, user.status)}
                                className="px-3.5 py-1.5 text-xs font-bold rounded-full border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 transition active:scale-95 cursor-pointer shadow-xs"
                              >
                                ⛔ Block
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(user.emailid, user.status)}
                                className="px-3.5 py-1.5 text-xs font-bold rounded-full bg-emerald-950 hover:bg-emerald-900 text-white transition active:scale-95 cursor-pointer shadow-xs"
                              >
                                ✓ Resume
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteUser(user.emailid)}
                              className="px-3.5 py-1.5 text-xs font-bold rounded-full border border-stone-200 text-stone-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200 transition active:scale-95 cursor-pointer shadow-xs"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
