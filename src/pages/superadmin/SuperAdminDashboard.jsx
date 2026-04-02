import React, { useEffect, useState } from "react";
import { BookingAnalyticsTab, UserAnalyticsTab, RevenueAnalyticsTab, LiveActivityTab } from "../superadmin/AnalyticsTab.jsx";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { useUndoSnackbar } from  "../../layouts/UndoSnackbar.jsx";
import FilterPanel, { applyFilters } from "../../layouts/FilterPanel.jsx";
import { usePermissions } from "../../hooks/userPermissions.js";
import PermissionsTab from "./PermissionsTab.jsx";
import PosterUpload from "../upload/PosterUpload.jsx";
import AdminBookingsTab from "../admin/AdminBookingsTab.jsx";
import ApprovalQueueTab from "./ApprovalQueueTab.jsx";
import ConfirmModal from "../popup/ConfirmModel.jsx";
import Pagination from "../pagenavigation/Pagination.jsx";
import RolesTab from "./RolesTab.jsx";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import axios from "axios";
import { getToken } from "../../utils/jwtUtil";
import { toast } from "react-toastify";
import { API  } from "../../config/api.js";


// const API  = "http://localhost:8080/api/superadmin";
// const UAPI = "http://localhost:8080/api/user";
const auth = () => ({ Authorization: `Bearer ${getToken()}` });

const fetchDashboard     = ()         => axios.get(`${API.SUPER_ADMIN}/stats`,                        { headers: auth() });
const fetchRevenue       = (period)   => axios.get(`${API.SUPER_ADMIN}/revenue?period=${period}`,       { headers: auth() });
const fetchRevenueMovie  = ()         => axios.get(`${API.SUPER_ADMIN}/revenue/by-movie`,               { headers: auth() });
const fetchRevenueVenue  = ()         => axios.get(`${API.SUPER_ADMIN}/revenue/by-venue`,               { headers: auth() });
const fetchAdminBookings      = ()  => axios.get(`http://localhost:8080/api/admin/bookings`, { headers: auth() });
const fetchBookingAnalytics   = ()  => axios.get(`${API.SUPER_ADMIN}/analytics/bookings`, { headers: auth() });
const fetchUserAnalytics      = ()  => axios.get(`${API.SUPER_ADMIN}/analytics/users`,    { headers: auth() });
const fetchAllUsers      = ()      => axios.get(`${API.SUPER_ADMIN}/users?page=0&size=9999`,  { headers: auth() });
const createUser         = (d)     => axios.post(`${API.SUPER_ADMIN}/users`,             d,   { headers: auth() });
const updateUser         = (id, d) => axios.put(`${API.SUPER_ADMIN}/users/${id}`,        d,   { headers: auth() });
const deleteUser         = (id)    => axios.delete(`${API.SUPER_ADMIN}/users/${id}`,          { headers: auth() });
const fetchPendingEvents = ()      => axios.get(`${API.SUPER_ADMIN}/events/pending`,          { headers: auth() });
const approveEvent       = (id)    => axios.put(`${API.SUPER_ADMIN}/events/${id}/approve`, {},{ headers: auth() });
const rejectEvent        = (id)    => axios.put(`${API.SUPER_ADMIN}/events/${id}/reject`,  {},{ headers: auth() });
const fetchMovies        = ()      => axios.get(`${API.SUPER_ADMIN}/movies`,                 { headers: auth() });
const createMovie        = (d)     => axios.post(`${API.SUPER_ADMIN}/movies`,            d,   { headers: auth() });
const updateMovie        = (id, d) => axios.put(`${API.SUPER_ADMIN}/movies/${id}`,       d,   { headers: auth() });
const deleteMovie        = (id)    => axios.delete(`${API.SUPER_ADMIN}/movies/${id}`,         { headers: auth() });
const fetchShows         = ()      => axios.get(`${API.SUPER_ADMIN}/shows`,                   { headers: auth() });
const createShow         = (d)     => axios.post(`${API.SUPER_ADMIN}/shows`,             d,   { headers: auth() });
const updateShow         = (id, d) => axios.put(`${API.SUPER_ADMIN}/shows/${id}`,        d,   { headers: auth() });
const deleteShow         = (id)    => axios.delete(`${API.SUPER_ADMIN}/shows/${id}`,          { headers: auth() });
const fetchVenues        = ()      => axios.get(`${API.SUPER_ADMIN}/venues`,                  { headers: auth() });
const createVenue        = (d)     => axios.post(`${API.SUPER_ADMIN}/venues`,            d,   { headers: auth() });
const updateVenue        = (id, d) => axios.put(`${API.SUPER_ADMIN}/venues/${id}`,       d,   { headers: auth() });
const deleteVenue        = (id)    => axios.delete(`${API.SUPER_ADMIN}/venues/${id}`,         { headers: auth() });

const ROLE_META = {
  SUPER_ADMIN: { label: "Super Admin", color: "bg-violet-100 text-violet-700" },
  ADMIN:       { label: "Admin",       color: "bg-red-100    text-red-700"    },
  MANAGER:     { label: "Manager",     color: "bg-blue-100   text-blue-700"   },
  USER:        { label: "User",        color: "bg-gray-100   text-gray-600"   },
};

const GENRES    = ["ACTION","DRAMA","COMEDY","ROMANCE","THRILLER","HORROR","SPORTS","LIVE","EVENT","DOCUMENTARY"];
const FORMATS   = ["2D","3D","IMAX","4DX","LIVE","ONLINE"];
const LANGUAGES = ["Tamil","Hindi","English","Telugu","Malayalam","Kannada","Bengali"];

const normalizeRole = (raw) => {
  if (!raw) return "USER";
  const val = Array.isArray(raw) ? raw[0] : raw;
  const str = typeof val === "object" ? (val?.authority ?? val?.name ?? "") : String(val);
  return str.replace(/^ROLE_/i, "").toUpperCase();
};

const getUserRole = (u) => normalizeRole(u.role ?? u.roles?.[0] ?? u.authorities?.[0]);
const userHasRole = (u, r) => getUserRole(u) === r;

// ─── Reusable error banner ────────────────────────────────────
function ErrorBanner({ message }) {
  return (
    <div className="flex items-center gap-3 bg-red-50 border border-red-200
                    text-red-700 rounded-2xl px-5 py-4 text-sm">
      <span className="text-xl shrink-0">⚠️</span>
      <div>
        <p className="font-semibold">Failed to load data</p>
        <p className="text-red-500 text-xs mt-0.5">{message}</p>
        <p className="text-red-400 text-xs mt-1">
          Check that the backend endpoint is running and returning data correctly.
        </p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
export default function SuperAdminDashboard() {
  const [activeTab,    setActiveTab]    = useState("overview");
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    axios.get(`${API.SUPER_ADMIN}/requests/count`,
      { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => setPendingCount(r.data?.pending ?? 0))
      .catch(() => {});
  }, [activeTab]);

  return (
    <DashboardLayout
      role="SUPER_ADMIN"
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      pendingCount={pendingCount}
    >
      {activeTab === "home"         && <OverviewTab />}
      {activeTab === "mybookings"   && <AdminBookingsTab />}
      {activeTab === "overview"          && <OverviewTab />}
      {activeTab === "bookinganalytics"  && <BookingAnalyticsTab />}
      {activeTab === "useranalytics"     && <UserAnalyticsTab />}
      {activeTab === "live"             && <LiveActivityTab />}
      {activeTab === "revenueanalytics"  && <RevenueAnalyticsTab />}
      {activeTab === "allbookings"  && <AdminBookingsTab />}
      {activeTab === "users"        && <UsersTab />}
      {activeTab === "movies"       && <MoviesTab />}
      {activeTab === "shows"        && <ShowsTab />}
      {activeTab === "venues"       && <VenuesTab />}
      {activeTab === "events"       && <EventsTab />}
      {activeTab === "approvals"            && <ApprovalQueueTab defaultFilter="PENDING"  />}
      {activeTab === "approvals:pending"    && <ApprovalQueueTab defaultFilter="PENDING"  showTabs={false} />}
      {activeTab === "approvals:approved"   && <ApprovalQueueTab defaultFilter="APPROVED" showTabs={false} />}
      {activeTab === "approvals:rejected"   && <ApprovalQueueTab defaultFilter="REJECTED" showTabs={false} />}
      {activeTab === "approvals:all"        && <ApprovalQueueTab defaultFilter="ALL"      showTabs={false} />}
      {activeTab === "partners"             && <PartnerApprovalsTab defaultFilter="PENDING"  />}
      {activeTab === "partners:pending"     && <PartnerApprovalsTab defaultFilter="PENDING"  showTabs={false} />}
      {activeTab === "partners:approved"    && <PartnerApprovalsTab defaultFilter="APPROVED" showTabs={false} />}
      {activeTab === "partners:rejected"    && <PartnerApprovalsTab defaultFilter="REJECTED" showTabs={false} />}
      {activeTab === "partners:all"         && <PartnerApprovalsTab defaultFilter="ALL"      showTabs={false} />}
      {activeTab === "roles"                && <RolesTab />}
      {activeTab === "permissions"          && <PermissionsTab />}
    </DashboardLayout>
  );
}


// ════════════════════════════════════════════════════════════
// 📊 OVERVIEW
// ════════════════════════════════════════════════════════════
function OverviewTab() {
  const [stats,   setStats]   = useState(null);
  const [users,   setUsers]   = useState([]);
  const [movies,  setMovies]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // ── Initial load ──────────────────────────────────────────
  useEffect(() => {
    Promise.allSettled([fetchDashboard(), fetchAllUsers(), fetchMovies()])
      .then(([d, u, m]) => {
        if (d.status === "fulfilled") setStats(d.value.data);
        else setError(d.reason?.response?.data?.message ?? d.reason?.message ?? "Stats unavailable");
        if (u.status === "fulfilled") setUsers(Array.isArray(u.value.data) ? u.value.data : (u.value.data?.content ?? []));
        if (m.status === "fulfilled") setMovies(Array.isArray(m.value.data) ? m.value.data : (m.value.data?.content ?? []));
      }).finally(() => setLoading(false));
  }, []);



  // (Revenue derived data moved to RevenueAnalyticsTab)
  if (loading) return <Spinner color="violet" />;

  const rp     = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
  const totalRevenue   = stats?.totalRevenue  ?? 0;
  const totalBookings  = stats?.totalBookings ?? 0;
  const countRole      = (r) => users.filter(u => userHasRole(u, r)).length;
  const totalUsers     = countRole("USER");
  const totalManagers  = countRole("MANAGER");
  const totalAdmins    = countRole("ADMIN");
  const customRoleList = stats?.customRoles ?? [];           // [{name,displayName,color,icon,count}]
  const totalCustom    = customRoleList.reduce((s,r) => s + Number(r.count ?? 0), 0);

  const statCards = [
    { label:"Total Users",     value: totalUsers,      icon:"👤", from:"from-slate-500",   to:"to-slate-600"   },
    { label:"Managers",        value: totalManagers,   icon:"🏪", from:"from-blue-500",    to:"to-blue-600"    },
    { label:"Admins",          value: totalAdmins,     icon:"🛠️", from:"from-red-500",     to:"to-red-600"     },
    { label:"Custom Role Users",value: totalCustom,   icon:"🎭", from:"from-violet-500",  to:"to-violet-600"  },
    { label:"Movies",          value: movies.length,   icon:"🎬", from:"from-indigo-500",  to:"to-indigo-600"  },
    { label:"Total Revenue",   value: rp(totalRevenue),icon:"💰", from:"from-emerald-500", to:"to-emerald-600" },
  ];

  const PERIOD_TABS = [
    { id: "daily",   label: "Daily"   },
    { id: "weekly",  label: "Weekly"  },
    { id: "monthly", label: "Monthly" },
  ];

  const PIE_COLORS = ["#ef4444","#f59e0b","#22c55e","#3b82f6","#8b5cf6","#ec4899","#14b8a6","#f97316"];

  const roleChart = [
    { role:"Users",    count: totalUsers,    fill:"#64748b" },
    { role:"Managers", count: totalManagers, fill:"#3b82f6" },
    { role:"Admins",   count: totalAdmins,   fill:"#ef4444" },
    ...customRoleList.filter(r => r.count > 0).map(r => ({
      role: r.displayName ?? r.name,
      count: Number(r.count),
      fill: r.color ?? "#8b5cf6",
    })),
  ];

  const genreData = GENRES.map(g => ({
    name: g, value: movies.filter(m => m.genre?.toUpperCase() === g).length,
  })).filter(d => d.value > 0);

  const summary = [
    { label:"Confirmed",       value: stats?.confirmedBookings ?? bookings.filter(b=>b.status==="CONFIRMED").length,  icon:"✅", color:"text-green-600"  },
    { label:"Cancelled",       value: stats?.cancelledBookings ?? bookings.filter(b=>b.status==="CANCELLED").length,  icon:"❌", color:"text-red-500"    },
    { label:"Pending/Locked",  value: stats?.pendingBookings   ?? bookings.filter(b=>b.status==="LOCKED").length,     icon:"⏳", color:"text-yellow-500" },
    { label:"Total Venues",    value: stats?.totalVenues       ?? "—",                                                 icon:"🏛️", color:"text-violet-500" },
    { label:"Total Movies",    value: movies.length,                                                                   icon:"🎥", color:"text-orange-500" },
    { label:"Avg Rev/Booking", value: totalBookings > 0 ? rp(totalRevenue / (stats?.confirmedBookings || 1)) : "—",   icon:"📈", color:"text-emerald-600"},
  ];

  return (
    <div className="space-y-6">
      {error && <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl px-4 py-3 text-sm">
        ⚠️ Some stats unavailable: {error}. Showing derived data from bookings.
      </div>}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map(card => (
          <div key={card.label} className={`bg-gradient-to-br ${card.from} ${card.to} rounded-2xl p-4 text-white shadow-lg`}>
            <span className="text-2xl">{card.icon}</span>
            <p className="text-2xl font-black mt-2">{card.value}</p>
            <p className="text-xs text-white/70 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>


      {/* ── Bottom row: users by role + genre ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-1">👥 Users by Role</h3>
          <p className="text-xs text-gray-400 mb-4">Total: {users.length}</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={roleChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
              <XAxis dataKey="role" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" radius={[6,6,0,0]}>
                {roleChart.map((entry, i) => (
                  <Cell key={i} fill={entry.fill ?? ["#64748b","#3b82f6","#ef4444","#8b5cf6"][i] ?? "#8b5cf6"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-1">🎭 Content by Genre</h3>
          <p className="text-xs text-gray-400 mb-4">Movies: {movies.length}</p>
          {genreData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={genreData} cx="50%" cy="50%" outerRadius={70}
                  dataKey="value" nameKey="name" label={({ name, percent }) =>
                    `${name} ${(percent*100).toFixed(0)}%`}
                  labelLine={false}>
                  {genreData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-300 text-sm">No genre data</div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-4">📋 Platform Summary</h3>
          <div className="space-y-3">
            {summary.map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-xs text-gray-400 flex items-center gap-2">
                  <span>{s.icon}</span>{s.label}
                </span>
                <span className={`font-black text-sm ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// helper for week number
function getWeekNumber(d) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

function UsersTab() {
  const { can } = usePermissions();
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [colFilters, setColFilters] = useState({ name:"", email:"", role:"ALL" });
  const [filters,    setFilters]   = useState({ names: [], emails: [], roles: [] });
  const [userSearch,   setUserSearch]   = useState("");
  const [showModal, setShowModal]   = useState(false);
  const [editUser, setEditUser]     = useState(null);
  const [page,    setPage]          = useState(1);
  const [perPage, setPerPage]       = useState(10);
  const [confirm,       setConfirm]       = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [customRoles,     setCustomRoles]     = useState([]);
  const [roleAssignments, setRoleAssignments] = useState({});

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetchAllUsers(),
      axios.get(API.SUPER_ADMIN_ROLES, { headers: auth() }).catch(() => ({ data: [] })),
      axios.get(`${API.SUPER_ADMIN_ROLES}/assignable-users`, { headers: auth() }).catch(() => ({ data: [] })),
    ]).then(([u, r, au]) => {
        setUsers(Array.isArray(u.data) ? u.data : (u.data?.content ?? []));
        setCustomRoles(r.data ?? []);
        const map = {};
        (au.data ?? []).forEach(user => {
          if (user.customRole) map[user.id] = user.customRole;
        });
        setRoleAssignments(map);
      })
      .catch(e => {
        const msg = e.response?.data?.message ?? e.message ?? "Unknown error";
        setError(`${e.response?.status ?? ""} ${msg}`.trim());
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const countRole = (r) => users.filter(u => userHasRole(u, r)).length;
  const filtered = applyFilters(Array.isArray(users) ? users : [], "users", filters).filter(u => {
    const name  = (colFilters.name || userSearch || "").toLowerCase();
    const email = (colFilters.email || "").toLowerCase();
    const roleOk = colFilters.role === "ALL" || (() => {
      const r = (u.role ?? u.roles?.[0]?.name ?? u.roles?.[0] ?? "").toString()
                  .toUpperCase().replace("ROLE_","");
      return r === colFilters.role;
    })();
    return (!name  || u.name?.toLowerCase().includes(name))
        && (!email || u.email?.toLowerCase().includes(email))
        && roleOk;
  });
  const activeUserFilters = (filters.names?.length || 0) +
    (filters.emails?.length || 0) + (filters.roles?.length || 0);

  const { showSnackbar: showUserSnack, SnackbarPortal: UserSnackbar } = useUndoSnackbar();
  const handleDelete = () => {
    const { id, name } = confirm;
    setConfirm(null);
    // remove from UI immediately
    const backup = [...users];
    setUsers(prev => prev.filter(u => u.id !== id));
    toast.success(`"${name}" deleted`);
    showUserSnack({
      message: `"${name}" deleted`,
      onUndo:   () => { setUsers(backup); toast.info(`Undo — "${name}" restored`); },
      onCommit: async () => {
        try { await deleteUser(id); load(); }
        catch { toast.error("Failed to delete user"); setUsers(backup); }
      },
    });
  };

  return (
    <div className="space-y-5">
      <UserSnackbar />
      <ConfirmModal
        open={!!confirm}
        title="Delete User?"
        message={`Are you sure you want to remove "${confirm?.name}"? This cannot be undone.`}
        confirmLabel="🗑️ Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { role:"USER",        label:"Users",        icon:"👤", color:"bg-slate-50   border-slate-200"  },
          { role:"MANAGER",     label:"Managers",     icon:"🏪", color:"bg-blue-50    border-blue-200"   },
          { role:"ADMIN",       label:"Admins",       icon:"🛠️", color:"bg-red-50     border-red-200"    },
          { role:"SUPER_ADMIN", label:"Super Admins", icon:"👑", color:"bg-violet-50  border-violet-200" },
        ].map(r => (
          <button key={r.role}
            onClick={() => {
              const current = filters.roles || [];
              const updated = current.includes(r.role)
                ? current.filter(x => x !== r.role)
                : [...current, r.role];
              setFilters(p => ({ ...p, roles: updated }));
            }}
            className={`rounded-2xl border p-4 text-left transition hover:shadow-md ${r.color}
              ${(filters.roles || []).includes(r.role) ? "ring-2 ring-violet-400 ring-offset-1" : ""}`}>
            <span className="text-xl">{r.icon}</span>
            <p className="text-2xl font-black text-gray-900 mt-1">{countRole(r.role)}</p>
            <p className="text-xs text-gray-500">{r.label}</p>
          </button>
        ))}
      </div>

      {error && <ErrorBanner message={error} />}

      {/* Search + Filter row */}
      <div className="flex gap-2 items-center">
        <div style={{ position:"relative", flex:1 }}>
          <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)",
            fontSize:14, color:"#9ca3af" }}>🔍</span>
          <input value={userSearch} onChange={e => setUserSearch(e.target.value)}
            placeholder="Search by name or email..."
            style={{
              width:"100%", boxSizing:"border-box",
              border:"1.5px solid #e5e7eb", borderRadius:10,
              padding:"9px 12px 9px 38px", fontSize:13,
              outline:"none", color:"#111", background:"#fff",
              transition:"border-color 0.2s"
            }}
            onFocus={e => e.target.style.borderColor="#7c3aed"}
            onBlur={e => e.target.style.borderColor="#e5e7eb"}
          />
        </div>
        <FilterPanel tab="users" filters={filters} onChange={setFilters} data={users} />
        {selectedUsers.length > 0 && (
          <button onClick={() => {
            if (!window.confirm(`Delete ${selectedUsers.length} selected user(s)?`)) return;
            const backup = [...users];
            const ids = [...selectedUsers];
            setUsers(prev => prev.filter(u => !ids.includes(u.id)));
            setSelectedUsers([]);
            showUserSnack({
              message: `${ids.length} user${ids.length > 1 ? "s" : ""} deleted`,
              onUndo: () => setUsers(backup),
              onCommit: async () => {
                try { await Promise.all(ids.map(id => deleteUser(id))); load(); }
                catch { toast.error("Failed to delete some users"); setUsers(backup); }
              },
            });
          }}
            style={{ display:"inline-flex", alignItems:"center", gap:6,
              padding:"7px 14px", borderRadius:10,
              background:"#ef4444", border:"none",
              color:"#fff", fontSize:12, fontWeight:700,
              cursor:"pointer", whiteSpace:"nowrap",
              boxShadow:"0 4px 12px rgba(239,68,68,0.3)" }}>
            🗑️ Delete {selectedUsers.length} selected
          </button>
        )}
        {activeUserFilters > 0 && (
          <button onClick={() => setFilters({ names:[], emails:[], roles:[] })}
            style={{
              display:"inline-flex", alignItems:"center", gap:5,
              padding:"7px 12px", borderRadius:10,
              background:"#fef2f2", border:"1px solid #fecaca",
              color:"#ef4444", fontSize:12, fontWeight:700,
              cursor:"pointer", whiteSpace:"nowrap"
            }}>
            ✕ Clear
          </button>
        )}
        {can("USER_CREATE") && (
          <button onClick={() => { setEditUser(null); setShowModal(true); }}
            className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5
                       rounded-xl text-sm font-semibold transition whitespace-nowrap">
            ＋ Add User
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-auto">
        {loading ? <Spinner color="violet" /> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 w-10">
                  <input type="checkbox"
                    checked={selectedUsers.length > 0 && filtered.slice((page-1)*perPage, page*perPage).every(u => selectedUsers.includes(u.id))}
                    onChange={e => {
                      const pageIds = filtered.slice((page-1)*perPage, page*perPage).map(u => u.id);
                      setSelectedUsers(e.target.checked
                        ? [...new Set([...selectedUsers, ...pageIds])]
                        : selectedUsers.filter(id => !pageIds.includes(id)));
                    }}
                    style={{ width:16, height:16, cursor:"pointer", accentColor:"#ef4444" }}
                  />
                </th>
                {["Name","Email","Role","Actions"].map(h => (
                  <th key={h} className={thCls(h === "Actions")}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0
                ? <EmptyRow cols={5} text="No users found" />
                : filtered.slice((page-1)*perPage, page*perPage).map(u => {
                  const role = getUserRole(u);
                  const meta = ROLE_META[role] ?? ROLE_META.USER;
                  return (
                    <tr key={u.id}
                      className={`hover:bg-gray-50/80 transition ${selectedUsers.includes(u.id) ? "bg-red-50/60" : ""}`}>
                      <td className="px-4 py-3.5">
                        <input type="checkbox"
                          checked={selectedUsers.includes(u.id)}
                          onChange={e => setSelectedUsers(e.target.checked
                            ? [...selectedUsers, u.id]
                            : selectedUsers.filter(id => id !== u.id))}
                          style={{ width:16, height:16, cursor:"pointer", accentColor:"#ef4444" }}
                        />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700
                                          flex items-center justify-center font-bold text-sm shrink-0">
                            {u.name?.[0]?.toUpperCase() ?? "?"}
                          </div>
                          <span className="font-semibold text-gray-900">{u.name ?? "N/A"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 text-xs">{u.email}</td>
                      <td className="px-5 py-3.5">
                        {roleAssignments[u.id] ? (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
                            style={{ background: roleAssignments[u.id].color ?? "#8b5cf6" }}>
                            {roleAssignments[u.id].displayName ?? roleAssignments[u.id].name}
                          </span>
                        ) : (
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${meta.color}`}>
                            {meta.label}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => { setEditUser(u); setShowModal(true); }}
                            className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600
                                       rounded-lg hover:bg-blue-100 transition font-medium">
                            ✏️ Edit
                          </button>
                          <button onClick={() => setConfirm({ id: u.id, name: u.name })}
                            className="px-3 py-1.5 text-xs bg-red-50 text-red-600
                                       rounded-lg hover:bg-red-100 transition font-medium">
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        )}
      </div>
      <Pagination total={filtered.length} page={page} perPage={perPage}
        onPage={setPage} onPerPage={n => { setPerPage(n); setPage(1); }} />

      {showModal && <UserModal user={editUser}
        customRoles={customRoles}
        roleAssignments={roleAssignments}
        onClose={() => setShowModal(false)}
        onSaved={() => { setShowModal(false); load(); }} />}
    </div>
  );
}

function UserModal({ user, onClose, onSaved, customRoles = [], roleAssignments = {} }) {
  const isEdit        = !!user;
  const [showPass,    setShowPass]    = useState(false);
  // Detect if user currently has a custom role
  const existingCustomRole = user ? (roleAssignments[user.id] ?? null) : null;
  const [form, setForm] = useState({
    name: user?.name ?? "", email: user?.email ?? "",
    password: "",
    role: user ? getUserRole(user) : "USER",
    customRoleId: existingCustomRole ? String(existingCustomRole.id) : "",
  });
  const [saving, setSaving] = useState(false);

  // Whether selected value is a custom role
  const selectedCustomRole = form.customRoleId
    ? customRoles.find(r => String(r.id) === form.customRoleId) : null;

  const submit = async () => {
    if (!form.name || !form.email) { toast.error("Name and email required"); return; }
    if (!isEdit && !form.password) { toast.error("Password required"); return; }
    try {
      setSaving(true);
      // Determine spring role (use customRole's base if selected)
      const springRole = selectedCustomRole
        ? selectedCustomRole.baseSpringRole
        : form.role;
      const payload = { name: form.name, email: form.email, role: springRole };
      if (form.password) payload.password = form.password;

      let savedUserId = user?.id;
      if (isEdit) {
        await updateUser(user.id, payload);
      } else {
        const res = await createUser({ ...payload, password: form.password });
        savedUserId = res.data?.id;
      }

      // Assign/unassign custom role
      if (savedUserId) {
        if (selectedCustomRole) {
          await axios.post(
            `${API.SUPER_ADMIN}/${selectedCustomRole.id}/users/${savedUserId}`,
            {}, { headers: auth() }
          );
        } else if (existingCustomRole && !form.customRoleId) {
          // Remove custom role
          await axios.delete(
            `${API.SUPER_ADMIN}/${existingCustomRole.id}/users/${savedUserId}`,
            { headers: auth() }
          );
        }
      }

      toast.success(isEdit ? "User updated" : "User created");
      onSaved();
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={isEdit ? "✏️ Edit User" : "➕ Add User"} onClose={onClose}>
      <Field label="Full Name *">
        <input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))}
          placeholder="John Doe" className={inputCls + " w-full"} />
      </Field>
      <Field label="Email *">
        <input type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))}
          placeholder="john@example.com" className={inputCls + " w-full"} />
      </Field>
      <Field label={isEdit ? "Password" : "Password *"}>
        <div style={{ position: "relative" }}>
          <input type={showPass ? "text" : "password"} value={form.password}
            onChange={e => setForm(p => ({...p, password: e.target.value}))}
            placeholder={isEdit ? "Enter new password to change" : "••••••••"}
            className={inputCls + " w-full pr-10"} />
          <button type="button" onClick={() => setShowPass(p => !p)}
            style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)",
              background:"none", border:"none", cursor:"pointer", padding:4,
              color: showPass ? "#7c3aed" : "#9ca3af", fontSize:14 }}>
            {showPass ? "🙈" : "👁️"}
          </button>
        </div>
        {isEdit && <p style={{fontSize:11,color:"#9ca3af",marginTop:4}}>
          Leave blank to keep the current password
        </p>}
      </Field>
      <Field label="Role">
        <select value={form.customRoleId || form.role}
          onChange={e => {
            const val = e.target.value;
            const customMatch = customRoles.find(r => String(r.id) === val);
            if (customMatch) {
              setForm(p => ({ ...p, customRoleId: val, role: customMatch.baseSpringRole }));
            } else {
              setForm(p => ({ ...p, customRoleId: "", role: val }));
            }
          }}
          className={inputCls + " w-full"}>
          <optgroup label="Standard Roles">
            <option value="USER">👤 User</option>
            <option value="MANAGER">🏪 Manager</option>
            <option value="ADMIN">🛠️ Admin</option>
            <option value="SUPER_ADMIN">👑 Super Admin</option>
          </optgroup>
          {customRoles.length > 0 && (
            <optgroup label="Custom Roles">
              {customRoles.map(r => (
                <option key={r.id} value={String(r.id)}>
                  {r.icon ?? "🎭"} {r.displayName} ({r.name})
                </option>
              ))}
            </optgroup>
          )}
        </select>
        {selectedCustomRole && (
          <p style={{fontSize:11, color:"#8b5cf6", marginTop:4}}>
            ✨ Custom role — uses <strong>{selectedCustomRole.baseSpringRole}</strong> access level
          </p>
        )}
      </Field>
      <ModalFooter onClose={onClose} onSubmit={submit} saving={saving}
        label={isEdit ? "Update User" : "Create User"} accent="#7c3aed" />
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════
// 🎬 MOVIES
// ════════════════════════════════════════════════════════════
export function MoviesTab() {
  const [movies, setMovies]      = useState([]);
  const [loading, setLoading]    = useState(true);
  const [error, setError]        = useState(null);
  const [search,  setSearch]  = useState("");
  const [genreF,  setGenreF]  = useState("ALL");
  const [filters, setFilters] = useState({ titles: [], genres: [], languages: [], formats: [], duration: "ALL" });
  const [showModal, setShowModal] = useState(false);
  const [editMovie, setEditMovie] = useState(null);
  const [page,    setPage]        = useState(1);
  const [perPage, setPerPage]     = useState(10);
  const [confirm,        setConfirm]        = useState(null);
  const [selectedMovies, setSelectedMovies] = useState([]);

  const load = () => {
    setLoading(true);
    setError(null);
    fetchMovies()
      .then(r => setMovies(Array.isArray(r.data) ? r.data : (r.data?.content ?? [])))
      .catch(e => setError(e.response?.data?.message ?? e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const fpFiltered = applyFilters(Array.isArray(movies) ? movies : [], "movies", filters);
  const filtered = fpFiltered.filter(m => {
    const ms = m.title?.toLowerCase().includes(search.toLowerCase()) ||
               m.genre?.toLowerCase().includes(search.toLowerCase());
    return ms && (genreF === "ALL" || m.genre?.toUpperCase() === genreF);
  });

  const { showSnackbar: showMovieSnack, SnackbarPortal: MovieSnackbar } = useUndoSnackbar();
  const handleDelete = () => {
    const { id, label } = confirm;
    setConfirm(null);
    const backup = [...movies];
    setMovies(prev => prev.filter(m => m.id !== id));
    toast.success(`"${label || "Movie"}" deleted`);
    showMovieSnack({
      message: `"${label || "Movie"}" deleted`,
      onUndo:   () => { setMovies(backup); toast.info("Undo — movie restored"); },
      onCommit: async () => {
        try { await deleteMovie(id); load(); }
        catch { toast.error("Failed to delete movie"); setMovies(backup); }
      },
    });
  };

  return (
    <div className="space-y-4">
      <MovieSnackbar />
      <ConfirmModal
        open={!!confirm}
        title="Delete Movie?"
        message={`Are you sure you want to delete "${confirm?.title}"? This cannot be undone.`}
        confirmLabel="🗑️ Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />
      {error && <ErrorBanner message={error} />}

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search movies..." className={inputCls + " pl-9 w-full"} />
        </div>
        <select value={genreF} onChange={e => setGenreF(e.target.value)} className={inputCls}>
          <option value="ALL">All Genres</option>
          {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        {selectedMovies.length > 0 && (
          <button onClick={() => {
            if (!window.confirm(`Delete ${selectedMovies.length} selected movie(s)?`)) return;
            const backup = [...movies];
            const ids = [...selectedMovies];
            setMovies(prev => prev.filter(m => !ids.includes(m.id)));
            setSelectedMovies([]);
            showMovieSnack({
              message: `${ids.length} movie${ids.length > 1 ? "s" : ""} deleted`,
              onUndo: () => setMovies(backup),
              onCommit: async () => {
                try { await Promise.all(ids.map(id => deleteMovie(id))); load(); }
                catch { toast.error("Failed to delete some movies"); setMovies(backup); }
              },
            });
          }}
            style={{ display:"inline-flex", alignItems:"center", gap:6,
              padding:"7px 14px", borderRadius:10,
              background:"#ef4444", border:"none",
              color:"#fff", fontSize:12, fontWeight:700,
              cursor:"pointer", whiteSpace:"nowrap",
              boxShadow:"0 4px 12px rgba(239,68,68,0.3)" }}>
            🗑️ Delete {selectedMovies.length} selected
          </button>
        )}
        <FilterPanel tab="movies" filters={filters} onChange={setFilters} data={movies} />
        {(filters.titles.length || filters.genres.length || filters.languages.length || filters.formats.length || filters.duration !== "ALL") ? (
          <button onClick={() => setFilters({ titles:[], genres:[], languages:[], formats:[], duration:"ALL" })}
            style={{ display:"inline-flex", alignItems:"center", gap:5,
              padding:"7px 12px", borderRadius:10,
              background:"#fef2f2", border:"1px solid #fecaca",
              color:"#ef4444", fontSize:12, fontWeight:700,
              cursor:"pointer", whiteSpace:"nowrap" }}>
            ✕ Clear
          </button>
        ) : null}
        <button onClick={() => { setEditMovie(null); setShowModal(true); }}
          className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5
                     rounded-xl text-sm font-semibold transition whitespace-nowrap">
          ＋ Add Movie
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-auto">
        {loading ? <Spinner color="violet" /> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input type="checkbox"
                    checked={selectedMovies.length > 0 && filtered.slice((page-1)*perPage, page*perPage).every(m => selectedMovies.includes(m.id))}
                    onChange={e => {
                      const pageIds = filtered.slice((page-1)*perPage, page*perPage).map(m => m.id);
                      setSelectedMovies(e.target.checked
                        ? [...new Set([...selectedMovies, ...pageIds])]
                        : selectedMovies.filter(id => !pageIds.includes(id)));
                    }}
                    style={{ width:16, height:16, cursor:"pointer", accentColor:"#ef4444" }}
                  />
                </th>
                {["Poster","Title","Genre","Language","Format","Duration","Actions"].map(h => (
                  <th key={h} className={thCls(h === "Actions")}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0
                ? <EmptyRow cols={8} text="No movies found" />
                : filtered.slice((page-1)*perPage, page*perPage).map(m => (
                <tr key={m.id} className={`hover:bg-gray-50/80 ${selectedMovies.includes(m.id) ? "bg-red-50/60" : ""}`}>
                  <td className="px-4 py-3" style={{verticalAlign:"middle"}}>
                    <input type="checkbox"
                      checked={selectedMovies.includes(m.id)}
                      onChange={e => setSelectedMovies(e.target.checked
                        ? [...selectedMovies, m.id]
                        : selectedMovies.filter(id => id !== m.id))}
                      style={{ width:16, height:16, cursor:"pointer", accentColor:"#ef4444", marginRight:8 }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    {m.posterUrl ? (
                      <img src={m.posterUrl} alt={m.title}
                        className="w-10 h-14 object-cover rounded-lg border border-gray-200" />
                    ) : (
                      <div className="w-10 h-14 rounded-lg bg-gray-100 border border-gray-200
                                      flex items-center justify-center text-gray-300 text-lg">
                        🎬
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-gray-900">{m.title}</td>
                  <td className="px-4 py-3.5">
                    {m.genre && <span className="text-xs font-semibold px-2 py-1
                      rounded-full bg-violet-50 text-violet-600">{m.genre}</span>}
                  </td>
                  <td className="px-4 py-3.5 text-gray-400 text-xs">{m.language ?? "—"}</td>
                  <td className="px-4 py-3.5 text-gray-400 text-xs">{m.format ?? "—"}</td>
                  <td className="px-4 py-3.5 text-gray-400 text-xs">{m.duration ?? "—"}</td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setEditMovie(m); setShowModal(true); }}
                        className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600
                                   rounded-lg hover:bg-blue-100">✏️ Edit</button>
                      <button onClick={() => setConfirm({ id: m.id, title: m.title })}
                        className="px-3 py-1.5 text-xs bg-red-50 text-red-600
                                   rounded-lg hover:bg-red-100">🗑️ Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Pagination total={filtered.length} page={page} perPage={perPage}
        onPage={setPage} onPerPage={n => { setPerPage(n); setPage(1); }} />
      {showModal && <MovieModal movie={editMovie}
        onClose={() => setShowModal(false)}
        onSaved={() => { setShowModal(false); load(); }} />}
    </div>
  );
}

function MovieModal({ movie, onClose, onSaved }) {
  const isEdit = !!movie;
  const [form, setForm] = useState({
    title:       movie?.title       ?? "",
    genre:       movie?.genre       ?? "",
    language:    movie?.language    ?? "",
    format:      movie?.format      ?? "",
    duration:    movie?.duration    ?? "",
    director:    movie?.director    ?? "",
    cast:        movie?.cast        ?? "",
    description: movie?.description ?? "",
    releaseDate: movie?.releaseDate ?? "",
    rating:      movie?.rating      ?? "",
    posterUrl:   movie?.posterUrl   ?? "",
  });
  const [saving, setSaving] = useState(false);
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    if (!form.title) { toast.error("Title required"); return; }
    try {
      setSaving(true);
      isEdit ? await updateMovie(movie.id, form) : await createMovie(form);
      toast.success(isEdit ? "Updated" : "Movie added successfully");
      onSaved();
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={isEdit ? "✏️ Edit Movie" : "➕ Add Movie"} onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-4">
        <Field label="" full>
          <PosterUpload
            currentUrl={form.posterUrl}
            onUploaded={url => setForm(p => ({ ...p, posterUrl: url ?? "" }))}
            label="Movie Poster"
            aspectRatio="portrait"
          />
        </Field>
        <Field label="Title *" full>
          <input value={form.title} onChange={f("title")} placeholder="Movie title"
            className={inputCls + " w-full"} />
        </Field>
        <Field label="Genre">
          <select value={form.genre} onChange={f("genre")} className={inputCls + " w-full"}>
            <option value="">Select genre</option>
            {GENRES.map(g => <option key={g}>{g}</option>)}
          </select>
        </Field>
        <Field label="Language">
          <select value={form.language} onChange={f("language")} className={inputCls + " w-full"}>
            <option value="">Select</option>
            {LANGUAGES.map(l => <option key={l}>{l}</option>)}
          </select>
        </Field>
        <Field label="Format">
          <select value={form.format} onChange={f("format")} className={inputCls + " w-full"}>
            <option value="">Select</option>
            {FORMATS.map(x => <option key={x}>{x}</option>)}
          </select>
        </Field>
        <Field label="Duration">
          <input value={form.duration} onChange={f("duration")} placeholder="2h 30m"
            className={inputCls + " w-full"} />
        </Field>
        <Field label="Release Date">
          <input type="date" value={form.releaseDate} onChange={f("releaseDate")}
            className={inputCls + " w-full"} />
        </Field>
        <Field label="Director">
          <input value={form.director} onChange={f("director")} placeholder="Director name"
            className={inputCls + " w-full"} />
        </Field>
        <Field label="Certificate / Rating">
          <input value={form.rating} onChange={f("rating")} placeholder="U/A, A, U..."
            className={inputCls + " w-full"} />
        </Field>
        <Field label="Cast" full>
          <input value={form.cast} onChange={f("cast")} placeholder="Actor 1, Actor 2..."
            className={inputCls + " w-full"} />
        </Field>
        <Field label="Description" full>
          <textarea value={form.description} onChange={f("description")} rows={3}
            placeholder="Movie synopsis..." className={inputCls + " w-full resize-none"} />
        </Field>
      </div>
      <ModalFooter onClose={onClose} onSubmit={submit} saving={saving}
        label={isEdit ? "Update Movie" : "Add Movie"} accent="#7c3aed" />
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════
// 🕐 SHOWS
// ════════════════════════════════════════════════════════════
export function ShowsTab() {
  const { can } = usePermissions();
  const [shows,       setShows]       = useState([]);
  const [movies,      setMovies]      = useState([]);
  const [venues,      setVenues]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [showFilters,  setShowFilters]  = useState({ movieSearch: [], venueSearch: [], dateRange: "ALL", timeSlot: [], priceRange: "ALL" });
  const [showSearch,   setShowSearch]   = useState("");
  const [showModal,    setShowModal]    = useState(false);
  const [editShow, setEditShow]   = useState(null);
  const [page,    setPage]        = useState(1);
  const [perPage, setPerPage]     = useState(10);
  const [confirm,       setConfirm]       = useState(null);
  const [selectedShows, setSelectedShows] = useState([]);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.allSettled([fetchShows(), fetchMovies(), fetchVenues()])
      .then(([s, m, v]) => {
        if (s.status === "fulfilled") setShows(s.value.data ?? []);
        else setError(s.reason?.response?.data?.message ?? s.reason?.message ?? "Failed to load shows");
        if (m.status === "fulfilled") setMovies(m.value.data?.content ?? m.value.data ?? []);
        if (v.status === "fulfilled") setVenues(v.value.data?.content ?? v.value.data ?? []);
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const { showSnackbar: showShowSnack, SnackbarPortal: ShowSnackbar } = useUndoSnackbar();
  const handleDelete = () => {
    const { id, label } = confirm;
    setConfirm(null);
    const backup = [...shows];
    setShows(prev => prev.filter(s => s.id !== id));
    toast.success(`Show "${label || id}" deleted`);
    showShowSnack({
      message: `Show "${label || id}" deleted`,
      onUndo:   () => { setShows(backup); toast.info("Undo — show restored"); },
      onCommit: async () => {
        try { await deleteShow(id); load(); }
        catch { toast.error("Failed to delete show"); setShows(backup); }
      },
    });
  };

  // ── Apply filters + search ──────────────────────────────────
  const fpShows    = applyFilters(Array.isArray(shows) ? shows : [], "shows", showFilters);
  const fpFiltered = showSearch.trim()
    ? fpShows.filter(s =>
        (s.movie?.title ?? s.movieTitle ?? "").toLowerCase().includes(showSearch.toLowerCase()) ||
        (s.venue?.name  ?? s.venueName  ?? "").toLowerCase().includes(showSearch.toLowerCase()) ||
        (s.showDate ?? "").includes(showSearch)
      )
    : fpShows;

  return (
    <div className="space-y-4">
      <ConfirmModal
        open={!!confirm}
        title="Delete Show Timing?"
        message={`Delete the show "${confirm?.label}"? All related bookings will also be removed.`}
        confirmLabel="🗑️ Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />
      {error && <ErrorBanner message={error} />}

      <ShowSnackbar />
      {/* Search bar */}
      <div style={{ position:"relative", marginBottom:10 }}>
        <span style={{ position:"absolute", left:12, top:"50%",
          transform:"translateY(-50%)", fontSize:14, opacity:0.4 }}>🔍</span>
        <input value={showSearch} onChange={e => setShowSearch(e.target.value)}
          placeholder="Search by movie, venue or date..."
          style={{
            width:"100%", boxSizing:"border-box",
            border:"1.5px solid #e5e7eb", borderRadius:10,
            padding:"9px 12px 9px 36px", fontSize:13,
            outline:"none", color:"#111", background:"#fff"
          }}
          onFocus={e => e.target.style.borderColor="#7c3aed"}
          onBlur={e => e.target.style.borderColor="#e5e7eb"}
        />
      </div>

      <div className="flex justify-end items-center gap-2 flex-wrap">
        {selectedShows.length > 0 && (
          <button onClick={() => {
            if (!window.confirm(`Delete ${selectedShows.length} selected show(s)?`)) return;
            const backup = [...shows];
            const ids = [...selectedShows];
            setShows(prev => prev.filter(s => !ids.includes(s.id)));
            setSelectedShows([]);
            showShowSnack({
              message: `${ids.length} show${ids.length > 1 ? "s" : ""} deleted`,
              onUndo: () => setShows(backup),
              onCommit: async () => {
                try { await Promise.all(ids.map(id => deleteShow(id))); load(); }
                catch { toast.error("Failed to delete some shows"); setShows(backup); }
              },
            });
          }}
            style={{ display:"inline-flex", alignItems:"center", gap:6,
              padding:"7px 14px", borderRadius:10,
              background:"#ef4444", border:"none",
              color:"#fff", fontSize:12, fontWeight:700,
              cursor:"pointer", whiteSpace:"nowrap",
              boxShadow:"0 4px 12px rgba(239,68,68,0.3)" }}>
            🗑️ Delete {selectedShows.length} selected
          </button>
        )}
        <FilterPanel tab="shows" filters={showFilters} onChange={setShowFilters} data={shows} />
        {(showFilters.movieSearch?.length || showFilters.venueSearch?.length || showFilters.timeSlot?.length || showFilters.dateRange !== "ALL" || showFilters.priceRange !== "ALL") ? (
          <button onClick={() => setShowFilters({ movieSearch:[], venueSearch:[], dateRange:"ALL", timeSlot:[], priceRange:"ALL" })}
            style={{ display:"inline-flex", alignItems:"center", gap:5,
              padding:"7px 12px", borderRadius:10,
              background:"#fef2f2", border:"1px solid #fecaca",
              color:"#ef4444", fontSize:12, fontWeight:700,
              cursor:"pointer", whiteSpace:"nowrap" }}>
            ✕ Clear
          </button>
        ) : null}
        {can("SHOW_CREATE") && (
          <button onClick={() => { setEditShow(null); setShowModal(true); }}
            className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5
                       rounded-xl text-sm font-semibold transition">
            ＋ Add Show Timing
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-auto">
        {loading ? <Spinner color="violet" /> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input type="checkbox"
                    checked={selectedShows.length > 0 && fpFiltered.slice((page-1)*perPage, page*perPage).every(s => selectedShows.includes(s.id))}
                    onChange={e => {
                      const pageIds = fpFiltered.slice((page-1)*perPage, page*perPage).map(s => s.id);
                      setSelectedShows(e.target.checked
                        ? [...new Set([...selectedShows, ...pageIds])]
                        : selectedShows.filter(id => !pageIds.includes(id)));
                    }}
                    style={{ width:16, height:16, cursor:"pointer", accentColor:"#ef4444" }}
                  />
                </th>
                {["Movie","Venue","Date","Time","Price","Seats","Actions"].map(h => (
                  <th key={h} className={thCls(h === "Actions")}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {shows.length === 0
                ? <EmptyRow cols={8} text="No shows added" />
                : fpFiltered.slice((page-1)*perPage, page*perPage).map(s => (
                <tr key={s.id} className={`hover:bg-gray-50/80 ${selectedShows.includes(s.id) ? "bg-red-50/60" : ""}`}>
                  <td className="px-4 py-3.5">
                    <input type="checkbox"
                      checked={selectedShows.includes(s.id)}
                      onChange={e => setSelectedShows(e.target.checked
                        ? [...selectedShows, s.id]
                        : selectedShows.filter(id => id !== s.id))}
                      style={{ width:16, height:16, cursor:"pointer", accentColor:"#ef4444" }}
                    />
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-gray-900">{s.movie?.title ?? s.movieTitle ?? "—"}</td>
                  <td className="px-4 py-3.5 text-gray-400 text-xs">{s.venue?.name ?? s.venueName ?? "—"}</td>
                  <td className="px-4 py-3.5 text-gray-500 text-xs">{s.showDate ?? "—"}</td>
                  <td className="px-4 py-3.5 text-gray-500 text-xs">{s.showTime ?? "—"}</td>
                  <td className="px-4 py-3.5 font-semibold text-emerald-600 text-xs">
                    {s.price ? `₹${s.price}` : "—"}
                  </td>
                  <td className="px-4 py-3.5 text-gray-400 text-xs">{s.totalSeats ?? "—"}</td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex justify-end gap-2">
                      {can("SHOW_EDIT") && (
                        <button onClick={() => { setEditShow(s); setShowModal(true); }}
                          className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">✏️</button>
                      )}
                      {can("SHOW_DELETE") && (
                        <button onClick={() => setConfirm({ id: s.id, label: `${s.movie?.title ?? s.movieTitle ?? "Show"} @ ${s.showDate ?? ""}` })}
                          className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100">🗑️</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Pagination total={shows.length} page={page} perPage={perPage}
        onPage={setPage} onPerPage={n => { setPerPage(n); setPage(1); }} />
      {showModal && <ShowModal show={editShow} movies={movies} venues={venues}
        onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />}
    </div>
  );
}

function ShowModal({ show, movies, venues, onClose, onSaved }) {
  const isEdit = !!show;
  const [form, setForm] = useState({
    movieId: show?.movie?.id ?? show?.movieId ?? "",
    venueId: show?.venue?.id ?? show?.venueId ?? "",
    showDate: show?.showDate ?? "",
    showTime: show?.showTime ?? "",
    price: show?.price ?? "",
    totalSeats: show?.totalSeats ?? "",
  });
  const [saving, setSaving] = useState(false);
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const submit = async () => {
    if (!form.movieId || !form.venueId || !form.showDate || !form.showTime) {
      toast.error("All fields required"); return;
    }
    try {
      setSaving(true);
      isEdit ? await updateShow(show.id, form) : await createShow(form);
      toast.success(isEdit ? "Updated" : "Added");
      onSaved();
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };
  return (
    <Modal title={isEdit ? "✏️ Edit Show" : "➕ Add Show Timing"} onClose={onClose}>
      <Field label="Movie *">
        <select value={form.movieId} onChange={f("movieId")} className={inputCls + " w-full"}>
          <option value="">Select movie</option>
          {movies.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
        </select>
      </Field>
      <Field label="Venue *">
        <select value={form.venueId} onChange={f("venueId")} className={inputCls + " w-full"}>
          <option value="">Select venue</option>
          {venues.map(v => <option key={v.id} value={v.id}>{v.name} — {v.city}</option>)}
        </select>
      </Field>
      <Field label="Date *">
        <input type="date" value={form.showDate} onChange={f("showDate")} className={inputCls + " w-full"} />
      </Field>
      <Field label="Time *">
        <input type="time" value={form.showTime} onChange={f("showTime")} className={inputCls + " w-full"} />
      </Field>
      <Field label="Price (₹)">
        <input type="number" value={form.price} onChange={f("price")} placeholder="250"
          className={inputCls + " w-full"} />
      </Field>
      <Field label="Total Seats">
        <input type="number" value={form.totalSeats} onChange={f("totalSeats")} placeholder="200"
          className={inputCls + " w-full"} />
      </Field>
      <ModalFooter onClose={onClose} onSubmit={submit} saving={saving}
        label={isEdit ? "Update" : "Add Show"} accent="#7c3aed" />
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════
// 🏛️ VENUES
// ════════════════════════════════════════════════════════════
export function VenuesTab() {
  const { can } = usePermissions();
  const [venues,       setVenues]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [search,       setSearch]       = useState("");
  const [venueFilters, setVenueFilters] = useState({ nameSearch: [], addressSearch: [], cities: [], seatCapacity: "ALL" });
  const [showModal, setShowModal] = useState(false);
  const [editVenue, setEditVenue] = useState(null);
  const [page,    setPage]        = useState(1);
  const [perPage, setPerPage]     = useState(10);
  const [confirm,        setConfirm]        = useState(null);
  const [selectedVenues, setSelectedVenues] = useState([]);

  const load = () => {
    setLoading(true);
    setError(null);
    fetchVenues()
      .then(r => setVenues(Array.isArray(r.data) ? r.data : (r.data?.content ?? [])))
      .catch(e => setError(e.response?.data?.message ?? e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const fpVenues  = applyFilters(Array.isArray(venues) ? venues : [], "venues", venueFilters);
  const filtered = fpVenues.filter(v =>
    v.name?.toLowerCase().includes(search.toLowerCase()) ||
    v.city?.toLowerCase().includes(search.toLowerCase())
  );

  const { showSnackbar: showVenueSnack, SnackbarPortal: VenueSnackbar } = useUndoSnackbar();
  const handleDelete = () => {
    const { id, name } = confirm;
    setConfirm(null);
    const backup = [...venues];
    setVenues(prev => prev.filter(v => v.id !== id));
    toast.success(`"${name || "Venue"}" deleted`);
    showVenueSnack({
      message: `"${name || "Venue"}" deleted`,
      onUndo:   () => { setVenues(backup); toast.info("Undo — venue restored"); },
      onCommit: async () => {
        try { await deleteVenue(id); load(); }
        catch { toast.error("Failed to delete venue"); setVenues(backup); }
      },
    });
  };

  return (
    <div className="space-y-4">
      <VenueSnackbar />
      <ConfirmModal
        open={!!confirm}
        title="Delete Venue?"
        message={`Are you sure you want to delete "${confirm?.name}"? This cannot be undone.`}
        confirmLabel="🗑️ Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />
      {error && <ErrorBanner message={error} />}

      <div className="flex gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search venues..." className={inputCls + " pl-9 w-full"} />
        </div>
        {selectedVenues.length > 0 && (
          <button onClick={() => {
            if (!window.confirm(`Delete ${selectedVenues.length} selected venue(s)?`)) return;
            const backup = [...venues];
            const ids = [...selectedVenues];
            setVenues(prev => prev.filter(v => !ids.includes(v.id)));
            setSelectedVenues([]);
            showVenueSnack({
              message: `${ids.length} venue${ids.length > 1 ? "s" : ""} deleted`,
              onUndo: () => setVenues(backup),
              onCommit: async () => {
                try { await Promise.all(ids.map(id => deleteVenue(id))); load(); }
                catch { toast.error("Failed to delete some venues"); setVenues(backup); }
              },
            });
          }}
            style={{ display:"inline-flex", alignItems:"center", gap:6,
              padding:"7px 14px", borderRadius:10,
              background:"#ef4444", border:"none",
              color:"#fff", fontSize:12, fontWeight:700,
              cursor:"pointer", whiteSpace:"nowrap",
              boxShadow:"0 4px 12px rgba(239,68,68,0.3)" }}>
            🗑️ Delete {selectedVenues.length} selected
          </button>
        )}
        <FilterPanel tab="venues" filters={venueFilters} onChange={setVenueFilters} data={venues} />
        {(venueFilters.nameSearch?.length || venueFilters.addressSearch?.length || venueFilters.cities?.length || venueFilters.seatCapacity !== "ALL") ? (
          <button onClick={() => setVenueFilters({ nameSearch:[], addressSearch:[], cities:[], seatCapacity:"ALL" })}
            style={{ display:"inline-flex", alignItems:"center", gap:5,
              padding:"7px 12px", borderRadius:10,
              background:"#fef2f2", border:"1px solid #fecaca",
              color:"#ef4444", fontSize:12, fontWeight:700,
              cursor:"pointer", whiteSpace:"nowrap" }}>
            ✕ Clear
          </button>
        ) : null}
        {can("VENUE_CREATE") && (
          <button onClick={() => { setEditVenue(null); setShowModal(true); }}
            className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5
                       rounded-xl text-sm font-semibold transition whitespace-nowrap">
            ＋ Add Venue
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-auto">
        {loading ? <Spinner color="violet" /> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input type="checkbox"
                    checked={selectedVenues.length > 0 && filtered.slice((page-1)*perPage, page*perPage).every(v => selectedVenues.includes(v.id))}
                    onChange={e => {
                      const pageIds = filtered.slice((page-1)*perPage, page*perPage).map(v => v.id);
                      setSelectedVenues(e.target.checked
                        ? [...new Set([...selectedVenues, ...pageIds])]
                        : selectedVenues.filter(id => !pageIds.includes(id)));
                    }}
                    style={{ width:16, height:16, cursor:"pointer", accentColor:"#ef4444" }}
                  />
                </th>
                {["Name","City","Area","Address","Seats","Actions"].map(h => (
                  <th key={h} className={thCls(h === "Actions")}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0
                ? <EmptyRow cols={7} text="No venues found" />
                : filtered.slice((page-1)*perPage, page*perPage).map(v => (
                <tr key={v.id} className={`hover:bg-gray-50/80 ${selectedVenues.includes(v.id) ? "bg-red-50/60" : ""}`}>
                  <td className="px-4 py-3.5">
                    <input type="checkbox"
                      checked={selectedVenues.includes(v.id)}
                      onChange={e => setSelectedVenues(e.target.checked
                        ? [...selectedVenues, v.id]
                        : selectedVenues.filter(id => id !== v.id))}
                      style={{ width:16, height:16, cursor:"pointer", accentColor:"#ef4444" }}
                    />
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-gray-900">{v.name}</td>
                  <td className="px-4 py-3.5 text-gray-500 text-xs">📍 {v.city}</td>
                  <td className="px-4 py-3.5 text-gray-400 text-xs">{v.area ?? "—"}</td>
                  <td className="px-4 py-3.5 text-gray-400 text-xs max-w-[160px]">
                    <p className="truncate">{v.address ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3.5 text-gray-500 text-xs text-center">{v.totalSeats ?? "—"}</td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex justify-end gap-2">
                      {can("VENUE_EDIT") && (
                        <button onClick={() => { setEditVenue(v); setShowModal(true); }}
                          className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">✏️</button>
                      )}
                      {can("VENUE_DELETE") && (
                        <button onClick={() => setConfirm({ id: v.id, name: v.name })}
                          className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100">🗑️</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Pagination total={filtered.length} page={page} perPage={perPage}
        onPage={setPage} onPerPage={n => { setPerPage(n); setPage(1); }} />
      {showModal && <VenueModal venue={editVenue}
        onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />}
    </div>
  );
}

function VenueModal({ venue, onClose, onSaved }) {
  const isEdit = !!venue;
  const [form, setForm] = useState({
    name: venue?.name ?? "", city: venue?.city ?? "", area: venue?.area ?? "",
    address: venue?.address ?? "", totalSeats: venue?.totalSeats ?? "",
  });
  const [saving, setSaving] = useState(false);
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const submit = async () => {
    if (!form.name || !form.city) { toast.error("Name and city required"); return; }
    try {
      setSaving(true);
      isEdit ? await updateVenue(venue.id, form) : await createVenue(form);
      toast.success(isEdit ? "Updated" : "Added");
      onSaved();
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };
  return (
    <Modal title={isEdit ? "✏️ Edit Venue" : "➕ Add Venue"} onClose={onClose}>
      <Field label="Name *">
        <input value={form.name} onChange={f("name")} placeholder="PVR Cinemas"
          className={inputCls + " w-full"} />
      </Field>
      <Field label="City *">
        <input value={form.city} onChange={f("city")} placeholder="Chennai"
          className={inputCls + " w-full"} />
      </Field>
      <Field label="Area">
        <input value={form.area} onChange={f("area")} placeholder="T.Nagar"
          className={inputCls + " w-full"} />
      </Field>
      <Field label="Address">
        <input value={form.address} onChange={f("address")} placeholder="123 Main St"
          className={inputCls + " w-full"} />
      </Field>
      <Field label="Total Seats">
        <input type="number" value={form.totalSeats} onChange={f("totalSeats")} placeholder="200"
          className={inputCls + " w-full"} />
      </Field>
      <ModalFooter onClose={onClose} onSubmit={submit} saving={saving}
        label={isEdit ? "Update" : "Add Venue"} accent="#7c3aed" />
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════
// ⏳ PENDING EVENTS
// ════════════════════════════════════════════════════════════
function EventsTab() {
  const [events, setEvents]    = useState([]);
  const [loading, setLoading]  = useState(true);
  const [error, setError]      = useState(null);
  const [actingId, setActingId] = useState(null);
  const [confirm, setConfirm]   = useState(null); // { id, title, action }

  const load = () => {
    setLoading(true);
    setError(null);
    fetchPendingEvents()
      .then(r => setEvents(r.data))
      .catch(e => setError(e.response?.data?.message ?? e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleApprove = async () => {
    const { id, title } = confirm;
    try { setActingId(id); await approveEvent(id); toast.success(`"${title}" approved`); load(); }
    catch { toast.error("Failed"); } finally { setActingId(null); setConfirm(null); }
  };
  const handleReject = async () => {
    const { id, title } = confirm;
    try { setActingId(id); await rejectEvent(id); toast.success(`"${title}" rejected`); load(); }
    catch { toast.error("Failed"); } finally { setActingId(null); setConfirm(null); }
  };

  if (loading) return <Spinner color="violet" />;
  if (error)   return <ErrorBanner message={error} />;

  return (
    <div className="space-y-4">
      <ConfirmModal
        open={!!confirm}
        variant={confirm?.action === "approve" ? "success" : "danger"}
        title={confirm?.action === "approve" ? "Approve Event?" : "Reject Event?"}
        message={`${confirm?.action === "approve" ? "Approve" : "Reject"} "${confirm?.title}"?`}
        confirmLabel={confirm?.action === "approve" ? "✅ Approve" : "❌ Reject"}
        onConfirm={confirm?.action === "approve" ? handleApprove : handleReject}
        onCancel={() => setConfirm(null)}
      />
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800">⏳ Pending Approvals</h3>
        <span className="text-sm text-gray-400">{events.length} pending</span>
      </div>
      {events.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-gray-500">Nothing pending — all caught up!</p>
        </div>
      ) : events.map(e => (
        <div key={e.id} className="bg-white rounded-2xl border border-gray-100
                                   shadow-sm p-5 flex items-start justify-between gap-4">
          <div className="flex-1">
            <h4 className="font-bold text-gray-900">{e.title ?? e.name ?? `Event #${e.id}`}</h4>
            <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-400">
              {e.venue?.name && <span>📍 {e.venue.name}</span>}
              {e.date        && <span>📅 {e.date}</span>}
              {e.category    && <span>🎭 {e.category}</span>}
            </div>
            {e.description && <p className="text-sm text-gray-400 mt-2 line-clamp-2">{e.description}</p>}
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setConfirm({ id: e.id, title: e.title ?? e.name, action: "approve" })} disabled={actingId === e.id}
              className="px-4 py-2 text-xs font-semibold bg-green-500 hover:bg-green-600
                         text-white rounded-xl disabled:opacity-50 transition">
              ✅ Approve
            </button>
            <button onClick={() => setConfirm({ id: e.id, title: e.title ?? e.name, action: "reject" })} disabled={actingId === e.id}
              className="px-4 py-2 text-xs font-semibold bg-red-500 hover:bg-red-600
                         text-white rounded-xl disabled:opacity-50 transition">
              ❌ Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}



// ─── Shared UI ────────────────────────────────────────────────
const inputCls = `border border-gray-200 rounded-xl px-3 py-2.5 text-sm
  focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white`;

const thCls = (right = false) =>
  `px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider
   ${right ? "text-right" : "text-left"}`;

function Modal({ title, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full p-6
                       max-h-[90vh] overflow-y-auto ${wide ? "max-w-2xl" : "max-w-md"}`}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-xl">✕</button>
        </div>
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
}

function ModalFooter({ onClose, onSubmit, saving, label, accent = "#7c3aed" }) {
  return (
    <div className="flex gap-3 pt-2">
      <button onClick={onClose}
        className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl
                   text-sm font-medium hover:bg-gray-50 transition">
        Cancel
      </button>
      <button onClick={onSubmit} disabled={saving}
        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition"
        style={{ background: saving ? "#9ca3af" : accent, cursor: saving ? "not-allowed" : "pointer" }}>
        {saving ? "Saving..." : label}
      </button>
    </div>
  );
}

function Field({ label, children, full }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="text-xs font-semibold text-gray-400 mb-1 block">{label}</label>
      {children}
    </div>
  );
}

function EmptyRow({ cols, text }) {
  return (
    <tr><td colSpan={cols}>
      <div className="text-center py-12 text-gray-400">
        <p className="text-3xl mb-2">📭</p><p className="text-sm">{text}</p>
      </div>
    </td></tr>
  );
}

function Spinner({ color = "violet" }) {
  const c = color === "violet" ? "border-violet-200 border-t-violet-600"
          : color === "red"    ? "border-red-200    border-t-red-500"
          :                      "border-blue-200   border-t-blue-500";
  return (
    <div className="flex items-center justify-center py-16">
      <div className={`w-8 h-8 border-4 rounded-full animate-spin ${c}`} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 🤝 PARTNER APPLICATIONS
// ════════════════════════════════════════════════════════════
function PartnerApprovalsTab({ defaultFilter = "PENDING", showTabs = true }) {
  // const PARTNER_API = "http://localhost:8080/api/superadmin/partners";
  const [apps,    setApps]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState(defaultFilter);
  const [acting,  setActing]  = useState(null);
  const [rejectId,setRejectId]= useState(null);
  const [rejectNote,setRejectNote] = useState("");
  const [noteErr, setNoteErr] = useState("");
  const [confirmApprove,  setConfirmApprove]  = useState(null);
  const [partnerFilters,  setPartnerFilters]  = useState({ partnerSearch: [], cities: [] });
  const [partnerSearch,   setPartnerSearch]   = useState("");

  const load = () => {
    setLoading(true);
    axios.get(API.PARTNER_API, { headers: auth() })
      .then(r => setApps(r.data ?? []))
      .catch(() => toast.error("Failed to load partner applications"))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const fpApps = applyFilters(Array.isArray(apps) ? apps : [], "partners", partnerFilters);
  const searchApps = partnerSearch.trim()
    ? fpApps.filter(a =>
        a.name?.toLowerCase().includes(partnerSearch.toLowerCase()) ||
        a.email?.toLowerCase().includes(partnerSearch.toLowerCase()) ||
        a.theatreName?.toLowerCase().includes(partnerSearch.toLowerCase()) ||
        a.city?.toLowerCase().includes(partnerSearch.toLowerCase())
      )
    : fpApps;
  const filtered = searchApps.filter(a => filter === "ALL" || a.status === filter);

  const doApprove = async () => {
    const id = confirmApprove;
    setActing(id);
    try {
      await axios.post(`${API.PARTNER_API}/${id}/approve`, {}, { headers: auth() });
      toast.success(" Partner approved! Account created.");
      load();
    } catch (e) {
      toast.error(e.response?.data?.error ?? "Failed to approve");
    } finally { setActing(null); setConfirmApprove(null); }
  };

  const doReject = async () => {
    if (!rejectNote.trim()) { setNoteErr("Reason is required"); return; }
    setActing(rejectId);
    try {
      await axios.post(`${API.PARTNER_API}/${rejectId}/reject`,
        { note: rejectNote }, { headers: auth() });
      toast.success("Application rejected.");
      load();
    } catch (e) {
      toast.error(e.response?.data?.error ?? "Failed to reject");
    } finally { setActing(null); setRejectId(null); setRejectNote(""); setNoteErr(""); }
  };

  const STATUS_COLOR = {
    PENDING:  "bg-yellow-50 text-yellow-700 border-yellow-200",
    APPROVED: "bg-green-50  text-green-700  border-green-200",
    REJECTED: "bg-red-50    text-red-700    border-red-200",
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-bold text-gray-800 text-lg">🤝 Partner Applications</h3>
          <p className="text-gray-400 text-sm mt-0.5">Theatre owners who applied to join BookWhiz</p>
        </div>
        {/* Search bar */}
        <div style={{ position:"relative", marginBottom:12 }}>
          <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)",
            fontSize:14, opacity:0.4 }}>🔍</span>
          <input value={partnerSearch} onChange={e => setPartnerSearch(e.target.value)}
            placeholder="Search by name, email, theatre or city..."
            style={{
              width:"100%", boxSizing:"border-box",
              border:"1.5px solid rgba(255,255,255,0.1)", borderRadius:10,
              padding:"9px 12px 9px 36px", fontSize:13,
              outline:"none", color:"#fff",
              background:"rgba(255,255,255,0.05)"
            }}
            onFocus={e => e.target.style.borderColor="rgba(239,68,68,0.5)"}
            onBlur={e => e.target.style.borderColor="rgba(255,255,255,0.1)"}
          />
        </div>

        <div className="flex items-center gap-2">
          <FilterPanel tab="partners" filters={partnerFilters} onChange={setPartnerFilters} data={apps} />
          {(partnerFilters.partnerSearch?.length || partnerFilters.cities?.length) ? (
            <button onClick={() => { setPartnerFilters({ partnerSearch:[], cities:[] }); setPartnerSearch(""); }}
              style={{ display:"inline-flex", alignItems:"center", gap:5,
                padding:"7px 12px", borderRadius:10,
                background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.3)",
                color:"#ef4444", fontSize:12, fontWeight:700,
                cursor:"pointer", whiteSpace:"nowrap" }}>
              ✕ Clear
            </button>
          ) : null}
        </div>
        {showTabs && (
          <div className="flex gap-2">
          {["PENDING","APPROVED","REJECTED","ALL"].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition
                ${filter === s ? "bg-violet-600 text-white border-violet-600" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"}`}>
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
              {s !== "ALL" && <span className="ml-1 text-[10px] opacity-70">
                ({apps.filter(a => a.status === s).length})
              </span>}
            </button>
          ))}
        </div>
        )}
      </div>

      {/* Confirm approve modal */}
      <ConfirmModal
        open={!!confirmApprove}
        variant="success"
        title="Approve Partner?"
        message="This will create a Theatre Owner account. They'll receive login credentials."
        confirmLabel="✅ Approve & Create Account"
        onConfirm={doApprove}
        onCancel={() => setConfirmApprove(null)}
      />

      {/* Reject modal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-black text-gray-900">❌ Reject Application</h3>
            <p className="text-gray-500 text-sm">Provide a reason — the applicant will see this.</p>
            <textarea value={rejectNote} onChange={e => { setRejectNote(e.target.value); setNoteErr(""); }}
              rows={3} placeholder="Reason for rejection..."
              className={`w-full border rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none
                focus:ring-2 focus:ring-red-400 ${noteErr ? "border-red-400" : "border-gray-200"}`} />
            {noteErr && <p className="text-red-500 text-xs">⚠ {noteErr}</p>}
            <div className="flex gap-3">
              <button onClick={() => { setRejectId(null); setRejectNote(""); setNoteErr(""); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-bold hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={doReject} disabled={!!acting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-black transition disabled:opacity-50">
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? <Spinner color="violet" /> : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <p className="text-4xl mb-2">📭</p>
          <p className="text-gray-400 text-sm">No {filter.toLowerCase()} applications</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(app => (
            <div key={app.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h4 className="font-black text-gray-900 text-base">{app.theatreName}</h4>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${STATUS_COLOR[app.status]}`}>
                      {app.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 mt-2">
                    <p className="text-sm text-gray-600">👤 {app.name}</p>
                    <p className="text-sm text-gray-600">📧 {app.email}</p>
                    <p className="text-sm text-gray-600">📱 {app.phone}</p>
                    <p className="text-sm text-gray-600">📍 {app.city}{app.state ? `, ${app.state}` : ""}</p>
                  </div>
                  {app.address && <p className="text-xs text-gray-400 mt-1">🏠 {app.address}</p>}
                  {app.description && (
                    <p className="text-xs text-gray-400 mt-1 italic line-clamp-2">"{app.description}"</p>
                  )}
                  {app.reviewNote && (
                    <div className={`mt-2 px-3 py-2 rounded-lg text-xs
                      ${app.status === "REJECTED" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                      <strong>Note:</strong> {app.reviewNote}
                    </div>
                  )}
                  <p className="text-gray-300 text-[11px] mt-1">
                    Applied {new Date(app.createdAt).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })}
                  </p>
                </div>

                {app.status === "PENDING" && (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setConfirmApprove(app.id)} disabled={!!acting}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-black rounded-xl transition disabled:opacity-50">
                      ✅ Approve
                    </button>
                    <button onClick={() => setRejectId(app.id)} disabled={!!acting}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-black rounded-xl transition disabled:opacity-50">
                      ❌ Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}