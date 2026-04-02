import { useEffect, useState } from "react";
import { useUndoSnackbar } from "../../layouts/UndoSnackbar.jsx";
import { usePermissions } from "../../hooks/userPermissions.js";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import AdminBookingsTab from "../admin/AdminBookingsTab.jsx";
import SubmitRequestTab from "../superadmin/SubmitRequestTab.jsx";
import PermissionsTab from "../superadmin/PermissionsTab.jsx";
import ApprovalQueueTab from "../superadmin/ApprovalQueueTab.jsx";
import { BookingAnalyticsTab, RevenueAnalyticsTab, LiveActivityTab, UserAnalyticsTab } from "../superadmin/AnalyticsTab.jsx";
import { ShowsTab, VenuesTab , MoviesTab } from "../superadmin/SuperAdminDashboard.jsx";
import ConfirmModal from "../popup/ConfirmModel.jsx";
import Pagination from "../pagenavigation/Pagination.jsx";
import axios from "axios";
import { getToken } from "../../utils/jwtUtil";
import { toast } from "react-toastify";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { API } from "../../config/api.js";


// const API  = "http://localhost:8080/api";
const auth = () => ({ Authorization: `Bearer ${getToken()}` });

const fetchBookings = ()       => axios.get(`${API.ADMIN}/bookings`,          { headers: auth() });
const fetchUsers    = ()       => axios.get(`${API.ADMIN}/users`,            { headers: auth() });
const fetchMovies   = ()       => axios.get(`${API.BASE}/api/user/movies`,            { headers: auth() });
const createUser    = (d)      => axios.post(`${API.ADMIN}/users`,      d,   { headers: auth() });
const updateUser    = (id, d)  => axios.put(`${API.ADMIN}/users/${id}`, d,   { headers: auth() });
const deleteUser    = (id)     => axios.delete(`${API.ADMIN}/users/${id}`,   { headers: auth() });
const confirmBook   = (id)     => axios.post(`${API.BOOKINGS}/${id}/confirm`, {}, { headers: auth() });
const cancelBook    = (id)     => axios.delete(`${API.BOOKINGS}/${id}/cancel`,  { headers: auth() });

// Shows & Venues — use superadmin endpoints (accessible by ADMIN after backend fix)
// const SA = "http://localhost:8080/api/superadmin";
const fetchShows  = ()        => axios.get(`${API.SUPER_ADMIN}/shows`,                { headers: auth() });
const createShow  = (d)       => axios.post(`${API.SUPER_ADMIN}/shows`,          d,   { headers: auth() });
const updateShow  = (id, d)   => axios.put(`${API.SUPER_ADMIN}/shows/${id}`,     d,   { headers: auth() });
const deleteShow  = (id)      => axios.delete(`${API.SUPER_ADMIN}/shows/${id}`,       { headers: auth() });
const fetchVenues = ()        => axios.get(`${API.SUPER_ADMIN}/venues`,               { headers: auth() });
const createVenue = (d)       => axios.post(`${API.SUPER_ADMIN}/venues`,         d,   { headers: auth() });
const updateVenue = (id, d)   => axios.put(`${API.SUPER_ADMIN}/venues/${id}`,    d,   { headers: auth() });
const deleteVenue = (id)      => axios.delete(`${API.SUPER_ADMIN}/venues/${id}`,      { headers: auth() });

const STATUS_META = {
  CONFIRMED: { label:"Confirmed", color:"bg-green-100  text-green-700",  dot:"bg-green-500"  },
  CANCELLED: { label:"Cancelled", color:"bg-red-100    text-red-700",    dot:"bg-red-500"    },
  LOCKED:    { label:"Locked",    color:"bg-yellow-100 text-yellow-700", dot:"bg-yellow-500" },
  EXPIRED:   { label:"Expired",   color:"bg-gray-100   text-gray-500",   dot:"bg-gray-400"   },
};
const ROLE_META = {
  SUPER_ADMIN: { label:"Super Admin", color:"bg-purple-100 text-purple-700" },
  ADMIN:       { label:"Admin",       color:"bg-red-100    text-red-700"    },
  MANAGER:     { label:"Manager",     color:"bg-blue-100   text-blue-700"   },
  USER:        { label:"User",        color:"bg-gray-100   text-gray-600"   },
};
const PIE_COLORS    = ["#22c55e","#ef4444","#f59e0b","#94a3b8"];
const GENRE_COLORS  = ["#ef4444","#f59e0b","#22c55e","#3b82f6","#8b5cf6","#ec4899"];

const normalizeRole = (raw) => {
  if (!raw) return "USER";
  const val = Array.isArray(raw) ? raw[0] : raw;
  const str = typeof val === "object" ? (val?.authority ?? val?.name ?? "") : String(val);
  return str.replace(/^ROLE_/i, "").toUpperCase();
};
const getUserRole = (u) => normalizeRole(u.role ?? u.roles?.[0] ?? u.authorities?.[0]);

// ════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
// 🤝 PARTNER APPROVALS TAB
// ══════════════════════════════════════════════════════════════
function PartnerApprovalsTab({ defaultFilter = "PENDING", showTabs = true }) {
  // const PARTNER_API = "http://localhost:8080/api/superadmin/partners";
  const [apps,       setApps]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState(defaultFilter);
  const [acting,     setActing]     = useState(null);
  const [rejectId,   setRejectId]   = useState(null);
  const [rejectNote, setRejectNote] = useState("");
  const [noteErr,    setNoteErr]    = useState("");
  const [confirmApprove, setConfirmApprove] = useState(null);

  const load = () => {
    setLoading(true);
    axios.get(API.PARTNER_API, { headers: auth() })
      .then(r => setApps(r.data ?? []))
      .catch(() => toast.error("Failed to load partner applications"))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = apps.filter(a => filter === "ALL" || a.status === filter);

  const doApprove = async () => {
    const id = confirmApprove;
    setActing(id);
    try {
      await axios.post(`${API.PARTNER_API}/${id}/approve`, {}, { headers: auth() });
      toast.success("✅ Partner approved! Account created.");
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
    <div className="space-y-5 p-1">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-bold text-gray-800 text-lg">🤝 Partner Applications</h3>
          <p className="text-gray-400 text-sm mt-0.5">Theatre owners who applied to join BookWhiz</p>
        </div>
        {showTabs && <div className="flex gap-2 flex-wrap">
          {["PENDING","APPROVED","REJECTED","ALL"].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition
                ${filter === s ? "bg-red-500 text-white border-red-500" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"}`}>
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
              {s !== "ALL" && <span className="ml-1 text-[10px] opacity-70">
                ({apps.filter(a => a.status === s).length})
              </span>}
            </button>
          ))}
        </div>}
      </div>

      {/* Confirm approve modal */}
      {confirmApprove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-black text-gray-900">✅ Approve Partner?</h3>
            <p className="text-gray-500 text-sm">This will create a Theatre Owner account with login credentials.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmApprove(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-bold hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={doApprove} disabled={!!acting}
                className="flex-1 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-black transition disabled:opacity-50">
                {acting ? "Approving…" : "Approve & Create Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
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
                {acting ? "Rejecting…" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-red-200 border-t-red-500 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
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

export default function AdminDashboard() {
  const { can } = usePermissions();
  const [activeTab,    setActiveTab]    = useState("overview");
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!can("PARTNER_APPROVE")) return;
    axios.get( `${API.SUPER_ADMIN}/requests/count`, { headers: auth() })
      .then(r => setPendingCount(r.data?.pending ?? 0))
      .catch(() => {});
  }, [activeTab]);
  return (
    <DashboardLayout role="ADMIN" activeTab={activeTab} setActiveTab={setActiveTab} pendingCount={pendingCount}>
      {activeTab === "overview"  && <AdminOverview setActiveTab={setActiveTab} />}
      {activeTab === "bookings"  && can("BOOKING_VIEW") && <AdminBookingsTab />}
      {activeTab === "users"     && can("USER_VIEW") && <AdminUsers />}
      {activeTab === "movies"    && can("MOVIE_VIEW") && <AdminMovies />}
      {activeTab === "shows"     && can("SHOW_VIEW")  && <AdminShowsTab />}
      {activeTab === "venues"    && can("VENUE_VIEW") && <AdminVenuesTab />}
      {activeTab === "requests"  && <SubmitRequestTab />}
      {activeTab === "partners"           && can("PARTNER_APPROVE") && <PartnerApprovalsTab defaultFilter="PENDING" />}
      {activeTab === "partners:pending"   && can("PARTNER_APPROVE") && <PartnerApprovalsTab defaultFilter="PENDING"  showTabs={false} />}
      {activeTab === "partners:approved"  && can("PARTNER_APPROVE") && <PartnerApprovalsTab defaultFilter="APPROVED" showTabs={false} />}
      {activeTab === "partners:rejected"  && can("PARTNER_APPROVE") && <PartnerApprovalsTab defaultFilter="REJECTED" showTabs={false} />}
      {activeTab === "partners:all"       && can("PARTNER_APPROVE") && <PartnerApprovalsTab defaultFilter="ALL"      showTabs={false} />}
      {activeTab === "permissions"       && can("PERMISSION_MANAGE")   && <PermissionsTab adminMode />}
      {activeTab === "bookinganalytics"  && can("BOOKING_ANALYTICS")  && <BookingAnalyticsTab />}
      {activeTab === "revenueanalytics"  && can("REVENUE_ANALYTICS")  && <RevenueAnalyticsTab />}
      {activeTab === "live"              && can("LIVE_ANALYTICS")      && <LiveActivityTab />}
      {activeTab === "useranalytics"     && can("USER_ANALYTICS")      && <UserAnalyticsTab />}
      {activeTab === "approvals"             && can("APPROVAL_VIEW")   && <ApprovalQueueTab defaultFilter="PENDING" />}
      {activeTab === "approvals:pending"     && can("APPROVAL_VIEW")   && <ApprovalQueueTab defaultFilter="PENDING"  showTabs={false} />}
      {activeTab === "approvals:approved"    && can("APPROVAL_VIEW")   && <ApprovalQueueTab defaultFilter="APPROVED" showTabs={false} />}
      {activeTab === "approvals:rejected"    && can("APPROVAL_VIEW")   && <ApprovalQueueTab defaultFilter="REJECTED" showTabs={false} />}
      {activeTab === "approvals:all"         && can("APPROVAL_VIEW")   && <ApprovalQueueTab defaultFilter="ALL"      showTabs={false} />}
    </DashboardLayout>
  );
}

// ── Overview ─────────────────────────────────────────────────
function AdminOverview({ setActiveTab }) {
  const [bookings, setBookings] = useState([]);
  const [users,    setUsers]    = useState([]);
  const [movies,   setMovies]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const { can } = usePermissions();

  const [customRoles, setCustomRoles] = useState([]);

  useEffect(() => {
    Promise.all([
      fetchBookings().catch(() => ({ data: [] })),
      fetchUsers().catch(()    => ({ data: [] })),
      fetchMovies().catch(()   => ({ data: [] })),
      axios.get(`${API.SUPER_ADMIN}/roles`, { headers: auth() }).catch(() => ({ data: [] })),
    ]).then(([b,u,m,r]) => {
      setBookings(Array.isArray(b.data) ? b.data : (b.data?.content ?? []));
      setUsers(Array.isArray(u.data) ? u.data : (u.data?.content ?? []));
      setMovies(Array.isArray(m.data) ? m.data : (m.data?.content ?? []));
      setCustomRoles(r.data ?? []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const countRole = (r) => users.filter(u => getUserRole(u) === r).length;
  const totalUsers    = countRole("USER");
  const totalManagers = countRole("MANAGER");
  const totalAdmins   = countRole("ADMIN");

  const confirmed = bookings.filter(b => b.status === "CONFIRMED").length;
  const cancelled = bookings.filter(b => b.status === "CANCELLED").length;
  const locked    = bookings.filter(b => b.status === "LOCKED").length;
  const revenue   = bookings
    .filter(b => b.status === "CONFIRMED")
    .reduce((s, b) => s + (Number(b.totalPrice) || 0), 0);

  // Top cards
  const topCards = [
    { label:"Users",           value: totalUsers,    icon:"👤", from:"from-slate-500",   to:"to-slate-700",   tab:"users"    },
    { label:"Managers",        value: totalManagers, icon:"🏪", from:"from-blue-500",    to:"to-blue-700",    tab:"users"    },
    { label:"Admins",          value: totalAdmins,   icon:"🛠️", from:"from-red-500",     to:"to-red-700",     tab:"users"    },
    { label:"Movies",          value: movies.length, icon:"🎬", from:"from-violet-500",  to:"to-violet-700",  tab:"movies"   },
    can("BOOKING_VIEW") ? { label:"Total Bookings",  value: bookings.length, icon:"🎟️",from:"from-amber-500",  to:"to-amber-700",   tab:"bookings" } : null,
    can("STATS_VIEW")   ? { label:"Revenue",         value:`₹${revenue.toLocaleString()}`, icon:"💰", from:"from-emerald-500", to:"to-emerald-700", tab:null } : null,
  ];

  // Pie
  const pieData = [
    { name:"Confirmed", value:confirmed },
    { name:"Cancelled", value:cancelled },
    { name:"Locked",    value:locked    },
    { name:"Expired",   value:bookings.length-confirmed-cancelled-locked },
  ].filter(d => d.value > 0);

  // Trend
  const trendMap = {};
  bookings.forEach(b => {
    const d = (b.lockedAt ?? b.confirmedAt ?? "")?.split("T")[0];
    if (d) trendMap[d] = (trendMap[d] || 0) + 1;
  });
  const trend = Object.entries(trendMap).sort().slice(-7)
    .map(([date, count]) => ({ date: date.slice(5), count }));

  // Genre chart
  const genreMap = {};
  movies.forEach(m => { const g = m.genre ?? "Other"; genreMap[g] = (genreMap[g]||0)+1; });
  const genreData = Object.entries(genreMap).sort((a,b)=>b[1]-a[1]).slice(0,5)
    .map(([name,value]) => ({ name, value }));

  return (
    <div className="space-y-6">

      {/* Gradient stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {topCards.filter(Boolean).map(c => (
          <div key={c.label}
            onClick={() => c.tab && setActiveTab(c.tab)}
            className={`bg-gradient-to-br ${c.from} ${c.to} rounded-2xl p-4 text-white
                        shadow-lg ${c.tab ? "cursor-pointer hover:opacity-90 transition" : ""}`}>
            <span className="text-2xl">{c.icon}</span>
            <p className="text-2xl font-black mt-2">{c.value}</p>
            <p className="text-xs text-white/70 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* User breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { role:"USER",    label:"Regular Users", icon:"👤", bg:"bg-slate-50", border:"border-slate-200", count:totalUsers    },
          { role:"MANAGER", label:"Managers",      icon:"🏪", bg:"bg-blue-50",  border:"border-blue-200",  count:totalManagers },
          { role:"ADMIN",   label:"Admins",        icon:"🛠️", bg:"bg-red-50",   border:"border-red-200",   count:totalAdmins   },
          ...customRoles.filter(cr => cr.userCount > 0).map(cr => ({
            role: cr.name, label: cr.displayName, icon: cr.icon ?? "🎭",
            bg: "bg-violet-50", border: "border-violet-200", count: cr.userCount ?? 0,
            customColor: cr.color,
          })),
        ].map(r => (
          <div key={r.role}
            onClick={() => setActiveTab("users")}
            className={`${r.bg} border ${r.border} rounded-2xl p-5 flex items-center
                        gap-4 cursor-pointer hover:shadow-md transition`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl
                             ${r.bg} border ${r.border}`}>
              {r.icon}
            </div>
            <div className="flex-1">
              <p className="text-2xl font-black text-gray-900">{r.count}</p>
              <p className="text-sm text-gray-500">{r.label}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-400">
                {users.length > 0 ? ((r.count/users.length)*100).toFixed(0) : 0}%
              </p>
              <p className="text-xs text-gray-300">of total</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-4">📈 Bookings (7 days)</h3>
          {trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="date" tick={{ fontSize:10 }} />
                <YAxis tick={{ fontSize:10 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#dc2626" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart text="No data yet" />}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-4">🍩 Booking Status</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={70}
                  dataKey="value" label={({name,value})=>`${name}:${value}`}
                  labelLine={false} fontSize={10}>
                  {pieData.map((_,i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart text="No bookings yet" />}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-4">🎭 Movies by Genre</h3>
          {genreData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={genreData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis type="number" tick={{ fontSize:10 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize:10 }} width={60} />
                <Tooltip />
                <Bar dataKey="value" radius={[0,6,6,0]}>
                  {genreData.map((_,i) => <Cell key={i} fill={GENRE_COLORS[i%GENRE_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart text="No movies yet" />}
        </div>
      </div>

      {/* Recent bookings */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">🕐 Recent Bookings</h3>
          <button onClick={() => setActiveTab("bookings")}
            className="text-xs text-gray-400 hover:text-red-500 underline transition">
            View all →
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {bookings.slice(0,6).map(b => {
            const meta = STATUS_META[b.status] ?? STATUS_META.EXPIRED;
            return (
              <div key={b.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${meta.dot}`} />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{b.userName ?? "User"}</p>
                    <p className="text-xs text-gray-400">{b.movieTitle ?? "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>
                    {meta.label}
                  </span>
                  <span className="text-xs font-bold text-gray-700">
                    ₹{Number(b.totalPrice) || 0}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Bookings ──────────────────────────────────────────────────
function AdminBookings() {
  const { can } = usePermissions();
  const [bookings,     setBookings]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [acting,       setActing]       = useState(null);

  const load = () => {
    setLoading(true);
    fetchBookings().then(r => setBookings(r.data)).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = bookings.filter(b => {
    const q  = search.toLowerCase();
    const ms = b.userName?.toLowerCase().includes(q) ||
               b.userEmail?.toLowerCase().includes(q) ||
               b.movieTitle?.toLowerCase().includes(q) ||
               String(b.id).includes(q);
    return ms && (statusFilter === "ALL" || b.status === statusFilter);
  });

  const handleConfirm = async (id) => {
    try { setActing(id); await confirmBook(id); toast.success("Confirmed"); load(); }
    catch { toast.error("Failed"); } finally { setActing(null); }
  };
  const { showSnackbar: showCancelSnack, SnackbarPortal: CancelSnackbar } = useUndoSnackbar();
  const handleCancel = (id) => {
    const booking = bookings.find(b => b.id === id);
    const backup  = [...bookings];
    // Optimistically remove from list
    setBookings(prev => prev.filter(b => b.id !== id));
    toast.success(`Booking #${id} cancelled`);
    showCancelSnack({
      message: `Booking #${id} cancelled`,
      onUndo:   () => { setBookings(backup); toast.info(`Undo — Booking #${id} restored`); },
      onCommit: async () => {
        try { await cancelBook(id); load(); }
        catch { toast.error("Failed to cancel booking"); setBookings(backup); }
      },
    });
  };

  return (
    <div className="space-y-4">
      <CancelSnackbar />
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by user, movie, ID..."
            className={inputCls + " pl-9 w-full"} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={inputCls}>
          <option value="ALL">All Status</option>
          {Object.keys(STATUS_META).map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-auto">
        {loading ? <Spinner /> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{["#","User","Movie","Show","Seats","Amount","Status","Actions"].map(h=>(
                <th key={h} className={thCls(h==="Actions")}>{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0
                ? <EmptyRow cols={8} text="No bookings found" />
                : filtered.map(b => {
                  const meta = STATUS_META[b.status] ?? STATUS_META.EXPIRED;
                  return (
                    <tr key={b.id} className="hover:bg-gray-50/80 transition">
                      <td className="px-4 py-3 text-xs font-mono text-gray-400">#{b.id}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-xs text-gray-900">{b.userName ?? "—"}</p>
                        <p className="text-xs text-gray-400">{b.userEmail ?? "—"}</p>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-gray-800">
                        {b.movieTitle ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        <p>{b.showDate ?? "—"}</p>
                        <p className="text-gray-400">{b.showTime ?? "—"}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {Array.isArray(b.seats) ? b.seats.join(", ") : (b.seatNumbers ?? "—")}
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-emerald-600">
                        ₹{Number(b.totalPrice) || 0}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${meta.color}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          {b.status === "LOCKED" && can("BOOKING_CONFIRM") && (
                            <button onClick={() => handleConfirm(b.id)} disabled={acting===b.id}
                              className="px-2.5 py-1 text-xs bg-green-50 text-green-700
                                         rounded-lg hover:bg-green-100 disabled:opacity-50">✅</button>
                          )}
                          {(b.status==="LOCKED"||b.status==="CONFIRMED") && can("BOOKING_CANCEL") && (
                            <button onClick={() => handleCancel(b.id)} disabled={acting===b.id}
                              className="px-2.5 py-1 text-xs bg-red-50 text-red-600
                                         rounded-lg hover:bg-red-100 disabled:opacity-50">❌</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Users CRUD ────────────────────────────────────────────────
function AdminUsers() {
  const { can }      = usePermissions();
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [showModal,  setShowModal]  = useState(false);
  const [editUser,   setEditUser]   = useState(null);
  const [page,    setPage]          = useState(1);
  const [perPage, setPerPage]       = useState(10);
  const [confirm, setConfirm]       = useState(null); // { id, name }

  const load = () => {
    setLoading(true);
    fetchUsers().then(r=>setUsers(r.data)).catch(console.error).finally(()=>setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const countRole = (r) => users.filter(u => getUserRole(u) === r).length;
  const filtered  = users.filter(u => {
    const q  = search.toLowerCase();
    return (u.name?.toLowerCase().includes(q)||u.email?.toLowerCase().includes(q)) &&
           (roleFilter==="ALL" || getUserRole(u)===roleFilter);
  });

  const handleDelete = async () => {
    try { await deleteUser(confirm.id); toast.success(`${confirm.name} removed`); load(); }
    catch (e) { toast.error(e.response?.data?.message ?? "Failed"); }
    finally { setConfirm(null); }
  };

  return (
    <div className="space-y-5">
      <ConfirmModal
        open={!!confirm}
        title="Delete User?"
        message={`Are you sure you want to remove "${confirm?.name}"? This cannot be undone.`}
        confirmLabel="🗑️ Remove"
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
      />

      {/* Role count cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { role:"USER",    label:"Regular Users", icon:"👤", bg:"bg-slate-50",   border:"border-slate-200"   },
          { role:"MANAGER", label:"Managers",      icon:"🏪", bg:"bg-blue-50",    border:"border-blue-200"    },
          { role:"ADMIN",   label:"Admins",        icon:"🛠️", bg:"bg-red-50",     border:"border-red-200"     },
          { role:"ALL",     label:"All Users",     icon:"👥", bg:"bg-gray-50",    border:"border-gray-200"    },
        ].map(r => (
          <button key={r.role}
            onClick={() => setRoleFilter(r.role)}
            className={`${r.bg} border ${r.border} rounded-2xl p-4 text-left transition
                        hover:shadow-md ${roleFilter===r.role?"ring-2 ring-red-400 ring-offset-1":""}`}>
            <span className="text-xl">{r.icon}</span>
            <p className="text-2xl font-black text-gray-900 mt-1">
              {r.role==="ALL" ? users.length : countRole(r.role)}
            </p>
            <p className="text-xs text-gray-500">{r.label}</p>
          </button>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className={inputCls+" pl-9 w-full"} />
        </div>
        <select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)} className={inputCls}>
          <option value="ALL">All Roles</option>
          <option value="USER">User</option>
          <option value="MANAGER">Manager</option>
          <option value="ADMIN">Admin</option>
        </select>
        {can("USER_CREATE") && (
          <button onClick={()=>{setEditUser(null);setShowModal(true);}}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2.5
                       rounded-xl text-sm font-semibold transition whitespace-nowrap">
            ＋ Add User
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-auto">
        {loading ? <Spinner /> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{["Name","Email","Role","Actions"].map(h=>(
                <th key={h} className={thCls(h==="Actions")}>{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length===0
                ? <EmptyRow cols={4} text="No users found"/>
                : filtered.slice((page-1)*perPage, page*perPage).map(u => {
                  const role = getUserRole(u);
                  const meta = ROLE_META[role] ?? ROLE_META.USER;
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/80 transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600
                                          flex items-center justify-center font-bold text-sm shrink-0">
                            {u.name?.[0]?.toUpperCase()??"?"}
                          </div>
                          <span className="font-semibold text-gray-900">{u.name??"—"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 text-xs">{u.email}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${meta.color}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-2">
                          {can("USER_EDIT") && <button onClick={()=>{setEditUser(u);setShowModal(true);}}
                            className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600
                                       rounded-lg hover:bg-blue-100 font-medium">✏️ Edit</button>}
                          {can("USER_DELETE") && <button onClick={()=>setConfirm({ id: u.id, name: u.name })}
                            className="px-3 py-1.5 text-xs bg-red-50 text-red-600
                                       rounded-lg hover:bg-red-100 font-medium">🗑️ Remove</button>}
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
        onClose={()=>setShowModal(false)}
        onSaved={()=>{setShowModal(false);load();}} />}
    </div>
  );
}

function UserModal({ user, onClose, onSaved }) {
  const isEdit = !!user;
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({
    name:user?.name??"", email:user?.email??"", password:"",
    role: user ? getUserRole(user) : "USER",
  });
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!form.name||!form.email) { toast.error("Name & email required"); return; }
    if (!isEdit&&!form.password) { toast.error("Password required"); return; }
    try {
      setSaving(true);
      const payload = {...form};
      if (isEdit&&!payload.password) delete payload.password;
      isEdit ? await updateUser(user.id,payload) : await createUser(payload);
      toast.success(isEdit?"Updated":"Created");
      onSaved();
    } catch(e) { toast.error(e.response?.data?.message??"Failed"); }
    finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900">
            {isEdit?"✏️ Edit User":"➕ Add User"}
          </h3>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-xl">✕</button>
        </div>
        <div className="space-y-4">
          {[
            { label:"Full Name *", key:"name",  type:"text",  ph:"John Doe"         },
            { label:"Email *",     key:"email", type:"email", ph:"john@example.com" },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs font-semibold text-gray-400 block mb-1">{f.label}</label>
              <input type={f.type} value={form[f.key]}
                onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))}
                placeholder={f.ph} className={inputCls+" w-full"} />
            </div>
          ))}
          {/* Password field with show/hide */}
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1">
              {isEdit ? "Password" : "Password *"}
            </label>
            <div style={{ position:"relative" }}>
              <input type={showPass ? "text" : "password"} value={form.password}
                onChange={e => setForm(p => ({...p, password: e.target.value}))}
                placeholder={isEdit ? "Enter new password to change" : "••••••••"}
                className={inputCls+" w-full pr-10"} />
              <button type="button" onClick={() => setShowPass(p => !p)}
                style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)",
                  background:"none", border:"none", cursor:"pointer", padding:4,
                  color: showPass ? "#ef4444" : "#9ca3af", fontSize:16 }}>
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
            {isEdit && (
              <p className="text-xs text-gray-400 mt-1">
                💡 Leave blank to keep the current password
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1">Role</label>
            <select value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))}
              className={inputCls+" w-full"}>
              <option value="USER">👤 User</option>
              <option value="MANAGER">🏪 Manager</option>
              <option value="ADMIN">🛠️ Admin</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">ℹ️ Super Admin role assigned by Super Admin only.</p>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl
                       text-sm font-medium hover:bg-gray-50 transition">Cancel</button>
          <button onClick={submit} disabled={saving}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition
              ${saving?"bg-gray-400 cursor-not-allowed":"bg-red-500 hover:bg-red-600"}`}>
            {saving?"Saving...":isEdit?"Update User":"Create User"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Movies (read-only for Admin) ──────────────────────────────
function AdminMovies() {
  const [movies,  setMovies]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [genreF,  setGenreF]  = useState("ALL");
  const [page,    setPage]    = useState(1);
  const [perPage, setPerPage] = useState(10);

  useEffect(() => {
    fetchMovies().then(r=>setMovies(r.data)).catch(console.error).finally(()=>setLoading(false));
  }, []);

  const genres   = [...new Set(movies.map(m=>m.genre).filter(Boolean))];
  const filtered = movies.filter(m => {
    const q = search.toLowerCase();
    return (m.title?.toLowerCase().includes(q)||m.genre?.toLowerCase().includes(q)) &&
           (genreF==="ALL"||m.genre===genreF);
  });

  const summaryCards = [
    { label:"Total Movies", value:movies.length,                               icon:"🎬" },
    { label:"Action",       value:movies.filter(m=>m.genre==="ACTION").length, icon:"💥" },
    { label:"Drama",        value:movies.filter(m=>m.genre==="DRAMA").length,  icon:"🎭" },
    { label:"Comedy",       value:movies.filter(m=>m.genre==="COMEDY").length, icon:"😂" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 bg-blue-50 border border-blue-200
                      text-blue-700 rounded-xl px-4 py-3 text-sm">
        <span>ℹ️</span>
        <p>View-only. Contact Super Admin to add or edit movies.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {summaryCards.map(c => (
          <div key={c.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4
                                        flex items-center gap-3">
            <span className="text-2xl">{c.icon}</span>
            <div>
              <p className="text-xl font-black text-gray-900">{c.value}</p>
              <p className="text-xs text-gray-400">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search by title or genre..."
            className={inputCls+" pl-9 w-full"} />
        </div>
        <select value={genreF} onChange={e=>setGenreF(e.target.value)} className={inputCls}>
          <option value="ALL">All Genres</option>
          {genres.map(g=><option key={g}>{g}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-auto">
        {loading ? <Spinner /> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{["Title","Genre","Language","Format","Duration","Director"].map(h=>(
                <th key={h} className={thCls(false)}>{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length===0
                ? <EmptyRow cols={6} text="No movies found"/>
                : filtered.slice((page-1)*perPage, page*perPage).map(m=>(
                <tr key={m.id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-3.5 font-semibold text-gray-900">{m.title}</td>
                  <td className="px-4 py-3.5">
                    {m.genre && <span className="text-xs font-semibold px-2 py-1 rounded-full
                      bg-red-50 text-red-500">{m.genre}</span>}
                  </td>
                  <td className="px-4 py-3.5 text-gray-400 text-xs">{m.language??"—"}</td>
                  <td className="px-4 py-3.5 text-gray-400 text-xs">{m.format??"—"}</td>
                  <td className="px-4 py-3.5 text-gray-400 text-xs">{m.duration??"—"}</td>
                  <td className="px-4 py-3.5 text-gray-400 text-xs">{m.director??"—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Pagination total={filtered.length} page={page} perPage={perPage}
        onPage={setPage} onPerPage={n => { setPerPage(n); setPage(1); }} />
    </div>
  );
}

// ─── Shared ───────────────────────────────────────────────────
const inputCls = `border border-gray-200 rounded-xl px-3 py-2.5 text-sm
  focus:outline-none focus:ring-2 focus:ring-red-300 bg-white`;
const thCls = (right=false) =>
  `px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider
   ${right?"text-right":"text-left"}`;
function EmptyRow({cols,text}) {
  return <tr><td colSpan={cols}><div className="text-center py-12 text-gray-400">
    <p className="text-3xl mb-2">📭</p><p className="text-sm">{text}</p>
  </div></td></tr>;
}
function EmptyChart({text}) {
  return <div className="flex items-center justify-center h-44 text-sm text-gray-400">{text}</div>;
}
function Spinner() {
  return <div className="flex items-center justify-center py-16">
    <div className="w-8 h-8 border-4 border-red-200 border-t-red-500 rounded-full animate-spin"/>
  </div>;
}


// ═══════════════════════════════════════════════════════════════
// 🕐 ADMIN SHOWS TAB
// ═══════════════════════════════════════════════════════════════
const GENRES    = ["ACTION","DRAMA","COMEDY","ROMANCE","THRILLER","HORROR","SPORTS","LIVE","EVENT","DOCUMENTARY"];
const FORMATS   = ["2D","3D","IMAX","4DX","LIVE","ONLINE"];
const LANGUAGES = ["Tamil","Hindi","English","Telugu","Malayalam","Kannada","Bengali"];

function AdminShowsTab() {
  const { can } = usePermissions();
  const [shows,    setShows]    = useState([]);
  const [movies,   setMovies]   = useState([]);
  const [venues,   setVenues]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [search,   setSearch]   = useState("");
  const [showModal,setShowModal]= useState(false);
  const [editShow, setEditShow] = useState(null);
  const [confirm,  setConfirm]  = useState(null);
  const [page,     setPage]     = useState(1);
  const [perPage,  setPerPage]  = useState(10);

  const load = () => {
    setLoading(true); setError(null);
    Promise.allSettled([fetchShows(), fetchMovies(), fetchVenues()])
      .then(([s, m, v]) => {
        if (s.status === "fulfilled") setShows(s.value.data ?? []);
        else setError(s.reason?.response?.data?.message ?? "Failed to load shows");
        if (m.status === "fulfilled") setMovies(m.value.data?.content ?? m.value.data ?? []);
        if (v.status === "fulfilled") setVenues(v.value.data?.content ?? v.value.data ?? []);
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = shows.filter(s =>
    (s.movie?.title ?? s.movieTitle ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (s.venue?.name  ?? s.venueName  ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (s.showDate ?? "").includes(search)
  );

  const handleDelete = () => {
    const { id, label } = confirm; setConfirm(null);
    const backup = [...shows];
    setShows(prev => prev.filter(s => s.id !== id));
    toast.success(`Show "${label}" deleted`);
    deleteShow(id).catch(() => { toast.error("Failed"); setShows(backup); });
  };

  return (
    <div className="space-y-4">
      <ConfirmModal open={!!confirm} title="Delete Show?" confirmLabel="🗑️ Delete"
        message={`Delete "${confirm?.label}"?`}
        onConfirm={handleDelete} onCancel={() => setConfirm(null)} />

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">⚠️ {error}</div>}

      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by movie, venue or date..."
            className={inputCls + " pl-9 w-full"} />
        </div>
        {can("SHOW_CREATE") && (
          <button onClick={() => { setEditShow(null); setShowModal(true); }}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition whitespace-nowrap">
            ＋ Add Show
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-auto">
        {loading ? <Spinner /> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{["Movie","Venue","Date","Time","Price","Seats","Actions"].map(h => (
                <th key={h} className={thCls(h === "Actions")}>{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0
                ? <EmptyRow cols={7} text="No shows found" />
                : filtered.slice((page-1)*perPage, page*perPage).map(s => (
                <tr key={s.id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-3.5 font-semibold text-gray-900">{s.movie?.title ?? s.movieTitle ?? "—"}</td>
                  <td className="px-4 py-3.5 text-gray-400 text-xs">{s.venue?.name ?? s.venueName ?? "—"}</td>
                  <td className="px-4 py-3.5 text-gray-500 text-xs">{s.showDate ?? "—"}</td>
                  <td className="px-4 py-3.5 text-gray-500 text-xs">{s.showTime ?? "—"}</td>
                  <td className="px-4 py-3.5 font-semibold text-emerald-600 text-xs">{s.price ? `₹${s.price}` : "—"}</td>
                  <td className="px-4 py-3.5 text-gray-400 text-xs">{s.totalSeats ?? "—"}</td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex justify-end gap-2">
                      {can("SHOW_EDIT") && (
                        <button onClick={() => { setEditShow(s); setShowModal(true); }}
                          className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">✏️</button>
                      )}
                      {can("SHOW_DELETE") && (
                        <button onClick={() => setConfirm({ id: s.id, label: `${s.movie?.title ?? "Show"} @ ${s.showDate ?? ""}` })}
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
    showDate: show?.showDate ?? "", showTime: show?.showTime ?? "",
    price: show?.price ?? "", totalSeats: show?.totalSeats ?? "",
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
      toast.success(isEdit ? "Updated" : "Show added"); onSaved();
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900">{isEdit ? "✏️ Edit Show" : "➕ Add Show"}</h3>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-xl">✕</button>
        </div>
        <div className="space-y-4">
          {[
            { label:"Movie *", key:"movieId", type:"select", opts: movies.map(m => ({ v: m.id, l: m.title })) },
            { label:"Venue *", key:"venueId", type:"select", opts: venues.map(v => ({ v: v.id, l: `${v.name} — ${v.city}` })) },
          ].map(fi => (
            <div key={fi.key}>
              <label className="text-xs font-semibold text-gray-400 block mb-1">{fi.label}</label>
              <select value={form[fi.key]} onChange={f(fi.key)} className={inputCls + " w-full"}>
                <option value="">Select...</option>
                {fi.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>
          ))}
          {[
            { label:"Date *", key:"showDate", type:"date" },
            { label:"Time *", key:"showTime", type:"time" },
            { label:"Price (₹)", key:"price", type:"number", ph:"250" },
            { label:"Total Seats", key:"totalSeats", type:"number", ph:"200" },
          ].map(fi => (
            <div key={fi.key}>
              <label className="text-xs font-semibold text-gray-400 block mb-1">{fi.label}</label>
              <input type={fi.type} value={form[fi.key]} onChange={f(fi.key)}
                placeholder={fi.ph ?? ""} className={inputCls + " w-full"} />
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={submit} disabled={saving}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white ${saving ? "bg-gray-400" : "bg-red-500 hover:bg-red-600"}`}>
            {saving ? "Saving..." : isEdit ? "Update" : "Add Show"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 🏛️ ADMIN VENUES TAB
// ═══════════════════════════════════════════════════════════════
function AdminVenuesTab() {
  const { can } = usePermissions();
  const [venues,   setVenues]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [search,   setSearch]   = useState("");
  const [showModal,setShowModal]= useState(false);
  const [editVenue,setEditVenue]= useState(null);
  const [confirm,  setConfirm]  = useState(null);
  const [page,     setPage]     = useState(1);
  const [perPage,  setPerPage]  = useState(10);

  const load = () => {
    setLoading(true); setError(null);
    fetchVenues()
      .then(r => setVenues(Array.isArray(r.data) ? r.data : (r.data?.content ?? [])))
      .catch(e => setError(e.response?.data?.message ?? e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = venues.filter(v =>
    v.name?.toLowerCase().includes(search.toLowerCase()) ||
    v.city?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = () => {
    const { id, name } = confirm; setConfirm(null);
    const backup = [...venues];
    setVenues(prev => prev.filter(v => v.id !== id));
    toast.success(`"${name}" deleted`);
    deleteVenue(id).catch(() => { toast.error("Failed"); setVenues(backup); });
  };

  return (
    <div className="space-y-4">
      <ConfirmModal open={!!confirm} title="Delete Venue?" confirmLabel="🗑️ Delete"
        message={`Delete "${confirm?.name}"?`}
        onConfirm={handleDelete} onCancel={() => setConfirm(null)} />

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">⚠️ {error}</div>}

      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search venues..." className={inputCls + " pl-9 w-full"} />
        </div>
        {can("VENUE_CREATE") && (
          <button onClick={() => { setEditVenue(null); setShowModal(true); }}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition whitespace-nowrap">
            ＋ Add Venue
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-auto">
        {loading ? <Spinner /> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{["Name","City","Area","Address","Seats","Actions"].map(h => (
                <th key={h} className={thCls(h === "Actions")}>{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0
                ? <EmptyRow cols={6} text="No venues found" />
                : filtered.slice((page-1)*perPage, page*perPage).map(v => (
                <tr key={v.id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-3.5 font-semibold text-gray-900">{v.name}</td>
                  <td className="px-4 py-3.5 text-gray-500 text-xs">📍 {v.city}</td>
                  <td className="px-4 py-3.5 text-gray-400 text-xs">{v.area ?? "—"}</td>
                  <td className="px-4 py-3.5 text-gray-400 text-xs max-w-[160px]"><p className="truncate">{v.address ?? "—"}</p></td>
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
    name: venue?.name ?? "", city: venue?.city ?? "",
    area: venue?.area ?? "", address: venue?.address ?? "",
    totalSeats: venue?.totalSeats ?? "",
  });
  const [saving, setSaving] = useState(false);
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const submit = async () => {
    if (!form.name || !form.city) { toast.error("Name and city required"); return; }
    try {
      setSaving(true);
      isEdit ? await updateVenue(venue.id, form) : await createVenue(form);
      toast.success(isEdit ? "Updated" : "Venue added"); onSaved();
    } catch (e) { toast.error(e.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900">{isEdit ? "✏️ Edit Venue" : "➕ Add Venue"}</h3>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-xl">✕</button>
        </div>
        <div className="space-y-4">
          {[
            { label:"Name *",     key:"name",       ph:"PVR Cinemas"  },
            { label:"City *",     key:"city",       ph:"Chennai"      },
            { label:"Area",       key:"area",       ph:"T.Nagar"      },
            { label:"Address",    key:"address",    ph:"123 Main St"  },
            { label:"Total Seats",key:"totalSeats", ph:"200", type:"number" },
          ].map(fi => (
            <div key={fi.key}>
              <label className="text-xs font-semibold text-gray-400 block mb-1">{fi.label}</label>
              <input type={fi.type ?? "text"} value={form[fi.key]} onChange={f(fi.key)}
                placeholder={fi.ph} className={inputCls + " w-full"} />
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={submit} disabled={saving}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white ${saving ? "bg-gray-400" : "bg-red-500 hover:bg-red-600"}`}>
            {saving ? "Saving..." : isEdit ? "Update" : "Add Venue"}
          </button>
        </div>
      </div>
    </div>
  );
}