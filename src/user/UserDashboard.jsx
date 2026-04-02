import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import axios from "axios";
import { getToken, getUserFromToken } from "../utils/jwtUtil";
import { toast } from "react-toastify";
import { API } from "../config/api";

// const API  = "http://localhost:8080/api";
const auth = () => ({ Authorization: `Bearer ${getToken()}` });

const fetchMyBookings = ()    => axios.get(`${API.API_URL}/bookings/my`,             { headers: auth() });
const cancelMyBooking = (id)  => axios.put(`${API.API_URL}/bookings/${id}/cancel`, {}, { headers: auth() });

const STATUS_META = {
  CONFIRMED: { label:"Confirmed", color:"bg-green-100  text-green-700",  icon:"✅", border:"border-green-200",  dot:"bg-green-500"  },
  CANCELLED: { label:"Cancelled", color:"bg-red-100    text-red-700",    icon:"❌", border:"border-red-200",    dot:"bg-red-400"    },
  LOCKED:    { label:"Pending",   color:"bg-yellow-100 text-yellow-700", icon:"⏳", border:"border-yellow-200", dot:"bg-yellow-400" },
  EXPIRED:   { label:"Expired",   color:"bg-gray-100   text-gray-500",   icon:"⌛", border:"border-gray-200",   dot:"bg-gray-300"   },
};

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  return (
    <DashboardLayout role="USER" activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === "home" && <Home />}
      {activeTab === "overview"  && <UserOverview setActiveTab={setActiveTab} />}
      {activeTab === "bookings"  && <UserBookings />}
      {activeTab === "profile"   && <UserProfile />}
    </DashboardLayout>
  );
}

// ── Overview ─────────────────────────────────────────────────
function UserOverview({ setActiveTab }) {
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    fetchMyBookings().then(r=>setBookings(r.data))
      .catch(console.error).finally(()=>setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const total     = bookings.length;
  const confirmed = bookings.filter(b=>b.status==="CONFIRMED").length;
  const pending   = bookings.filter(b=>b.status==="LOCKED").length;
  const cancelled = bookings.filter(b=>b.status==="CANCELLED").length;
  const totalSpent= bookings
    .filter(b=>b.status==="CONFIRMED")
    .reduce((s,b)=>s+(b.totalAmount??b.amount??0),0);

  const cards = [
    { label:"Total Bookings", value:total,     icon:"", from:"from-cyan-500",    to:"to-cyan-700"    },
    { label:"Confirmed",      value:confirmed, icon:"✅", from:"from-green-500",   to:"to-green-700"   },
    { label:"Pending",        value:pending,   icon:"⏳", from:"from-amber-500",   to:"to-amber-700"   },
    { label:"Cancelled",      value:cancelled, icon:"❌", from:"from-red-500",     to:"to-red-700"     },
  ];

  const recent = bookings.slice(0,5);

  return (
    <div className="space-y-6">

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label}
            className={`bg-gradient-to-br ${c.from} ${c.to} rounded-2xl p-4 text-white shadow-lg`}>
            <span className="text-2xl">{c.icon}</span>
            <p className="text-2xl font-black mt-2">{c.value}</p>
            <p className="text-xs text-white/70 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Total spent banner */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-700 rounded-2xl p-5
                      flex items-center justify-between text-white">
        <div>
          <p className="text-sm text-gray-300">Total Spent</p>
          <p className="text-3xl font-black mt-1">₹{totalSpent.toLocaleString()}</p>
        </div>
        <span className="text-6xl opacity-20">💳</span>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => window.location.href="/"}
          className="bg-white border border-gray-100 rounded-2xl p-5 text-left
                     hover:shadow-md transition group">
          <span className="text-3xl group-hover:scale-110 transition-transform inline-block"></span>
          <p className="font-bold text-gray-800 mt-3">Browse Movies</p>
          <p className="text-xs text-gray-400 mt-0.5">Find shows near you</p>
        </button>
        <button onClick={() => setActiveTab("bookings")}
          className="bg-white border border-gray-100 rounded-2xl p-5 text-left
                     hover:shadow-md transition group">
          <span className="text-3xl group-hover:scale-110 transition-transform inline-block"></span>
          <p className="font-bold text-gray-800 mt-3">My Bookings</p>
          <p className="text-xs text-gray-400 mt-0.5">{total} total</p>
        </button>
      </div>

      {/* Recent bookings */}
      {recent.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">🕐 Recent Bookings</h3>
            <button onClick={() => setActiveTab("bookings")}
              className="text-xs text-gray-400 hover:text-cyan-500 underline transition">
              View all →
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {recent.map(b => {
              const meta = STATUS_META[b.status] ?? STATUS_META.EXPIRED;
              return (
                <div key={b.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${meta.dot}`} />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {b.show?.movie?.title ?? "—"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {b.show?.showDate ?? "—"} · {b.show?.venue?.name ?? "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-700">
                      ₹{b.totalAmount ?? b.amount ?? 0}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>
                      {meta.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── My Bookings ───────────────────────────────────────────────
function UserBookings() {
  const [bookings,     setBookings]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [cancelling,   setCancelling]   = useState(null);
  const [, setTick] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    fetchMyBookings().then(r=>setBookings(r.data))
      .catch(console.error).finally(()=>setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setInterval(()=>setTick(p=>p+1), 1000);
    return () => clearInterval(t);
  }, []);

  const filtered = bookings.filter(b =>
    statusFilter==="ALL" || b.status===statusFilter
  );

  const canCancel = (b) => {
    if (b.status!=="CONFIRMED"&&b.status!=="LOCKED") return false;
    const cutoff = new Date(new Date(b.bookingTime??b.createdAt).getTime()+30*60*1000);
    return new Date() < cutoff;
  };

  const timeLeft = (b) => {
    const cutoff = new Date(new Date(b.bookingTime??b.createdAt).getTime()+30*60*1000);
    const diff   = Math.max(0, cutoff - new Date());
    const m = Math.floor(diff/60000);
    const s = Math.floor((diff%60000)/1000);
    return diff > 0 ? `${m}m ${s}s` : null;
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      setCancelling(id);
      await cancelMyBooking(id);
      toast.success("Booking cancelled");
      load();
    } catch(e) {
      toast.error(e.response?.data?.message ?? "Cannot cancel");
    } finally { setCancelling(null); }
  };

  return (
    <div className="space-y-4">

      {/* Status filter pills */}
      <div className="flex gap-2 flex-wrap">
        {["ALL","CONFIRMED","LOCKED","CANCELLED","EXPIRED"].map(s => (
          <button key={s} onClick={()=>setStatusFilter(s)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full border transition
              ${statusFilter===s
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
            {s==="ALL"?"All":s==="LOCKED"?"Pending":s.charAt(0)+s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : filtered.length===0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <p className="text-5xl mb-3"></p>
          <p className="text-gray-500 font-medium">No bookings found</p>
          <button onClick={()=>window.location.href="/"}
            className="mt-3 text-sm text-cyan-500 underline hover:text-cyan-700">
            Browse movies
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(b => {
            const meta     = STATUS_META[b.status] ?? STATUS_META.EXPIRED;
            const eligible = canCancel(b);
            const left     = eligible ? timeLeft(b) : null;

            return (
              <div key={b.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                {/* Status strip */}
                <div className={`px-5 py-2.5 flex items-center justify-between
                                 ${meta.color} border-b ${meta.border}`}>
                  <span className="text-xs font-bold tracking-wide flex items-center gap-1.5">
                    {meta.icon} {meta.label}
                  </span>
                  <span className="text-xs font-mono text-gray-400">#{b.id}</span>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-black text-gray-900">
                        {b.show?.movie?.title ?? "—"}
                      </h3>
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                        <span>📅 {b.show?.showDate??"—"}</span>
                        <span>🕐 {b.show?.showTime??"—"}</span>
                        <span>📍 {b.show?.venue?.name??"—"}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {(Array.isArray(b.seats)?b.seats:(b.seatNumbers??"").split(","))
                          .filter(Boolean).map(s=>(
                            <span key={s}
                              className="px-2.5 py-1 bg-gray-100 text-gray-700
                                         text-xs font-bold rounded-lg">
                              Seat {s}
                            </span>
                          ))}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-2xl font-black text-gray-900">
                        ₹{b.totalAmount??b.amount??0}
                      </p>
                      {eligible && left && (
                        <div className="mt-2">
                          <p className="text-xs text-orange-500 font-semibold mb-1.5">
                            ⏱ Cancel in {left}
                          </p>
                          <button onClick={()=>handleCancel(b.id)} disabled={cancelling===b.id}
                            className="px-4 py-2 text-xs font-bold bg-red-500 hover:bg-red-600
                                       text-white rounded-xl disabled:opacity-50 transition">
                            {cancelling===b.id?"Cancelling...":"Cancel Booking"}
                          </button>
                        </div>
                      )}
                      {(b.status==="CONFIRMED"||b.status==="LOCKED")&&!eligible && (
                        <p className="text-xs text-gray-400 mt-2">Window closed</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Profile ───────────────────────────────────────────────────
function UserProfile() {
  const user  = getUserFromToken() ?? {};
  const name  = user?.name  ?? user?.sub  ?? "—";
  const email = user?.email ?? user?.sub  ?? "—";
  const role  = (user?.role ?? "USER").replace(/^ROLE_/i,"");

  return (
    <div className="max-w-lg space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-cyan-500 to-blue-600" />
        <div className="px-6 pb-6">
          <div className="-mt-10 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-lg
                            flex items-center justify-center text-3xl font-black text-gray-700">
              {name?.[0]?.toUpperCase()??"?"}
            </div>
          </div>
          <h2 className="text-xl font-black text-gray-900">{name}</h2>
          <p className="text-sm text-gray-400">{email}</p>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5
                          bg-cyan-50 text-cyan-700 rounded-full text-xs font-bold border border-cyan-200">
            {role}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h3 className="font-bold text-gray-800">Account Details</h3>
        {[
          { label:"Full Name", value:name,  icon:"" },
          { label:"Email",     value:email, icon:"" },
          { label:"Role",      value:role,  icon:"" },
        ].map(f => (
          <div key={f.label}>
            <label className="text-xs font-semibold text-gray-400 flex items-center gap-1.5 mb-1">
              {f.icon} {f.label}
            </label>
            <div className="w-full bg-gray-50 border border-gray-200 rounded-xl
                            px-3 py-2.5 text-sm text-gray-700">
              {f.value}
            </div>
          </div>
        ))}
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200
                        text-blue-600 rounded-xl px-3 py-2.5 text-xs">
          <span>ℹ️</span>
          To update profile details, please contact support.
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return <div className="flex items-center justify-center py-16">
    <div className="w-8 h-8 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin"/>
  </div>;
}