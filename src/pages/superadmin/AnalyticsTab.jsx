import { useEffect, useState, useRef } from "react";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import axios from "axios";
import { getToken } from "../../utils/jwtUtil";
import { API } from "../../config/api";

const auth = () => ({ Authorization: `Bearer ${getToken()}` });
// const API  = "http://localhost:8080/api/superadmin";
const fetchAdminBookings    = () => axios.get(`${API.ADMIN}bookings`, { headers: auth() });
const fetchBookingAnalytics = () => axios.get(`${API.SUPER_ADMIN}/analytics/bookings`, { headers: auth() });
const fetchUserAnalytics    = () => axios.get(`${API.SUPER_ADMIN}/analytics/users`,    { headers: auth() });
const fetchRevenue          = (p) => axios.get(`${API.SUPER_ADMIN}/revenue?period=${p}`, { headers: auth() });
const fetchRevenueMovie     = () => axios.get(`${API.SUPER_ADMIN}/revenue/by-movie`,   { headers: auth() });
const fetchRevenueVenue     = () => axios.get(`${API.SUPER_ADMIN}/revenue/by-venue`,   { headers: auth() });
const fetchAllUsers         = () => axios.get(`${API.SUPER_ADMIN}/users?page=0&size=9999`, { headers: auth() });

function Spinner({ color = "violet" }) {
  const c2 = color === "violet" ? "border-violet-200 border-t-violet-600"
           : "border-blue-200 border-t-blue-500";
  return (
    <div className="flex items-center justify-center py-16">
      <div className={`w-8 h-8 border-4 rounded-full animate-spin ${c2}`} />
    </div>
  );
}
function ErrorBanner({ message }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 text-sm">
      <p className="font-semibold">⚠️ Failed to load data</p>
      <p className="text-xs mt-0.5 text-red-500">{message}</p>
    </div>
  );
}
function getWeekNumber(d) {
  const date = new Date(d);
  date.setHours(0,0,0,0);
  date.setDate(date.getDate() + 3 - (date.getDay()+6)%7);
  const week1 = new Date(date.getFullYear(),0,4);
  return 1 + Math.round(((date-week1)/86400000 - 3 + (week1.getDay()+6)%7)/7);
}


// ════════════════════════════════════════════════════════════
// 📊 BOOKING ANALYTICS TAB
// ════════════════════════════════════════════════════════════
export function BookingAnalyticsTab() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    Promise.allSettled([fetchBookingAnalytics(), fetchAdminBookings()])
      .then(([ana, bk]) => {
        if (ana.status === "fulfilled") setData(ana.value.data);
        else setError(ana.reason?.response?.data?.message ?? "Failed to load analytics");
        // fallback: derive from raw bookings if API fails
        if (ana.status !== "fulfilled" && bk.status === "fulfilled") {
          const bookings = Array.isArray(bk.value.data) ? bk.value.data : [];
          deriveFallback(bookings, setData);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const deriveFallback = (bookings, setData) => {
    const statusMap = {};
    const trendMap  = {};
    const hourMap   = {};
    bookings.forEach(b => {
      statusMap[b.status] = (statusMap[b.status] || 0) + 1;
      const d = new Date(b.confirmedAt ?? b.lockedAt);
      if (!isNaN(d)) {
        const day = d.toISOString().split("T")[0];
        if (!trendMap[day]) trendMap[day] = { date: day, bookings: 0, confirmed: 0, cancelled: 0 };
        trendMap[day].bookings++;
        if (b.status === "CONFIRMED") trendMap[day].confirmed++;
        if (b.status === "CANCELLED") trendMap[day].cancelled++;
        const h = d.getHours();
        const label = String(h).padStart(2,"0") + ":00";
        hourMap[label] = (hourMap[label] || 0) + 1;
      }
    });
    const total     = bookings.length;
    const confirmed = statusMap["CONFIRMED"] || 0;
    setData({
      totalBookings:   total,
      confirmed,
      cancelled:       statusMap["CANCELLED"] || 0,
      locked:          statusMap["LOCKED"]    || 0,
      expired:         statusMap["EXPIRED"]   || 0,
      conversionRate:  total > 0 ? Math.round((confirmed / total) * 100) : 0,
      trend:           Object.values(trendMap).sort((a,b) => a.date.localeCompare(b.date)).slice(-30),
      peakHours:       Object.entries(hourMap).map(([hour, count]) => ({ hour, count })).sort((a,b) => a.hour.localeCompare(b.hour)),
    });
  };

  if (loading) return <Spinner color="violet" />;
  if (!data)   return <ErrorBanner message={error ?? "No data"} />;

  const rp = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
  const total     = data.totalBookings || 0;
  const confirmed = data.confirmed     || 0;
  const cancelled = data.cancelled     || 0;
  const locked    = data.locked        || 0;
  const expired   = data.expired       || 0;
  const rate      = data.conversionRate || 0;
  const trend     = data.trend         || [];
  const hours     = data.peakHours     || [];
  const maxHour   = Math.max(...hours.map(h => h.count), 1);

  const statCards = [
    { label:"Total Bookings",    value: total,      icon:"", from:"from-violet-500", to:"to-violet-600" },
    { label:"Confirmed",         value: confirmed,  icon:"",  from:"from-green-500",  to:"to-green-600"  },
    { label:"Cancelled",         value: cancelled,  icon:"",  from:"from-red-500",    to:"to-red-600"    },
    { label:"Locked / Unpaid",   value: locked,     icon:"",  from:"from-amber-500",  to:"to-amber-600"  },
    { label:"Expired",           value: expired,    icon:"",  from:"from-gray-400",   to:"to-gray-500"   },
    { label:"Conversion Rate",   value: `${rate}%`, icon:"",  from:"from-blue-500",   to:"to-blue-600"   },
  ];

  return (
    <div className="space-y-6">
      {error && <div className="bg-orange-50 border border-orange-200 text-orange-700 rounded-xl px-4 py-3 text-sm">
        ⚠️ {error} — showing derived data.
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

      {/* ── Booking Trend Line Chart ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-gray-800 mb-1">📈 Booking Trend</h3>
        <p className="text-xs text-gray-400 mb-4">Daily confirmed & cancelled bookings — last 30 days</p>
        {trend.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-300">
            <p className="text-4xl mb-2">📊</p><p className="text-sm">No trend data yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trend} margin={{ top:4, right:4, left:0, bottom:4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
              <XAxis dataKey="date" tick={{ fontSize:10 }}
                tickFormatter={d => { const dt = new Date(d); return `${dt.getDate()} ${dt.toLocaleString("en",{month:"short"})}`; }} />
              <YAxis tick={{ fontSize:10 }} allowDecimals={false} />
              <Tooltip labelFormatter={d => new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})} />
              <Legend wrapperStyle={{ fontSize:11 }} />
              <Line type="monotone" dataKey="confirmed" stroke="#22c55e" strokeWidth={2.5}
                dot={false} name="Confirmed" />
              <Line type="monotone" dataKey="cancelled" stroke="#ef4444" strokeWidth={2}
                dot={false} name="Cancelled" strokeDasharray="4 2" />
              <Line type="monotone" dataKey="bookings"  stroke="#8b5cf6" strokeWidth={1.5}
                dot={false} name="Total" strokeDasharray="2 2" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Peak Booking Hours + Booking Funnel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Peak hours heatmap */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-1">🕐 Peak Booking Hours</h3>
          <p className="text-xs text-gray-400 mb-4">Which hours get the most bookings</p>
          {hours.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-36 text-gray-300">
              <p className="text-3xl mb-2">🕐</p><p className="text-sm">No hour data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hours} margin={{ top:4, right:4, left:0, bottom:4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="hour" tick={{ fontSize:9 }} />
                <YAxis tick={{ fontSize:10 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Bookings" radius={[4,4,0,0]}>
                  {hours.map((h, i) => {
                    const intensity = h.count / maxHour;
                    const r = Math.round(239 * intensity + 139 * (1-intensity));
                    const g = Math.round(68  * intensity + 92  * (1-intensity));
                    const b = Math.round(68  * intensity + 246 * (1-intensity));
                    return <Cell key={i} fill={`rgb(${r},${g},${b})`} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Booking funnel */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-4">🔽 Booking Funnel</h3>
          <div className="space-y-3">
            {[
              { label:"Total Bookings",  value: total,      color:"bg-violet-500", pct: 100 },
              { label:"Confirmed",       value: confirmed,  color:"bg-green-500",  pct: total ? Math.round((confirmed/total)*100) : 0 },
              { label:"Cancelled",       value: cancelled,  color:"bg-red-400",    pct: total ? Math.round((cancelled/total)*100) : 0 },
              { label:"Locked/Unpaid",   value: locked,     color:"bg-amber-400",  pct: total ? Math.round((locked/total)*100) : 0 },
              { label:"Expired",         value: expired,    color:"bg-gray-300",   pct: total ? Math.round((expired/total)*100) : 0 },
            ].map(row => (
              <div key={row.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">{row.label}</span>
                  <span className="text-xs font-bold text-gray-700">{row.value} <span className="text-gray-400">({row.pct}%)</span></span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${row.color} rounded-full transition-all`}
                    style={{ width:`${row.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


// ════════════════════════════════════════════════════════════
// 👥 USER ANALYTICS TAB
// ════════════════════════════════════════════════════════════
export function UserAnalyticsTab() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    Promise.allSettled([fetchUserAnalytics(), fetchAllUsers(), fetchAdminBookings()])
      .then(([ana, users, bk]) => {
        if (ana.status === "fulfilled") {
          setData(ana.value.data);
        } else {
          // derive fallback from users + bookings
          const userList = users.status === "fulfilled"
            ? (Array.isArray(users.value.data) ? users.value.data : users.value.data?.content ?? [])
            : [];
          const bookings = bk.status === "fulfilled"
            ? (Array.isArray(bk.value.data) ? bk.value.data : []) : [];
          deriveFallback(userList, bookings, setData);
          setError("Analytics endpoint unavailable — showing derived data");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const deriveFallback = (userList, bookings, setData) => {
    const bookingMap = {};
    bookings.forEach(b => {
      const email = b.userEmail ?? "";
      if (!bookingMap[email]) bookingMap[email] = { email, name: b.userName, total: 0, confirmed: 0, spent: 0 };
      bookingMap[email].total++;
      if (b.status === "CONFIRMED") { bookingMap[email].confirmed++; bookingMap[email].spent += Number(b.totalPrice||0); }
    });
    const activeSet = new Set(bookings.map(b => b.userEmail));
    setData({
      totalUsers:   userList.length,
      activeUsers:  activeSet.size,
      inactiveUsers: Math.max(0, userList.length - activeSet.size),
      registrationTrend: [],
      topUsers: Object.values(bookingMap).sort((a,b) => b.total - a.total).slice(0,10).map((u,i) => ({
        userId: i, name: u.name ?? u.email, email: u.email,
        totalBookings: u.total, confirmed: u.confirmed, spent: u.spent
      })),
    });
  };

  if (loading) return <Spinner color="violet" />;
  if (!data)   return <ErrorBanner message={error ?? "No data"} />;

  const rp = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
  const total    = data.totalUsers    || 0;
  const active   = data.activeUsers   || 0;
  const inactive = data.inactiveUsers || 0;
  const regTrend = data.registrationTrend || [];
  const topUsers = data.topUsers || [];
  const activePct   = total > 0 ? Math.round((active   / total) * 100) : 0;
  const inactivePct = total > 0 ? Math.round((inactive / total) * 100) : 0;

  const PIE_DATA = [
    { name:"Active",   value: active,   fill:"#22c55e" },
    { name:"Inactive", value: inactive, fill:"#e5e7eb" },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {error && <div className="bg-orange-50 border border-orange-200 text-orange-700 rounded-xl px-4 py-3 text-sm">
        ⚠️ {error}
      </div>}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl p-5 text-white shadow-lg">
          <span className="text-3xl">👥</span>
          <p className="text-4xl font-black mt-3">{total}</p>
          <p className="text-sm text-white/70 mt-1">Total Users</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 text-white shadow-lg">
          <span className="text-3xl">✅</span>
          <p className="text-4xl font-black mt-3">{active}</p>
          <p className="text-sm text-white/70 mt-1">Active Users <span className="opacity-70">({activePct}%)</span></p>
        </div>
        <div className="bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl p-5 text-white shadow-lg">
          <span className="text-3xl">😴</span>
          <p className="text-4xl font-black mt-3">{inactive}</p>
          <p className="text-sm text-white/70 mt-1">Inactive Users <span className="opacity-70">({inactivePct}%)</span></p>
        </div>
      </div>

      {/* ── Registration Trend + Active/Inactive Pie ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Registration trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-1">📅 New Registrations Over Time</h3>
          <p className="text-xs text-gray-400 mb-4">New users per month</p>
          {regTrend.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-300">
              <p className="text-4xl mb-2">📅</p>
              <p className="text-sm">No registration trend data</p>
              <p className="text-xs mt-1 text-gray-300">Add a created_at column to users table to enable this</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={regTrend} margin={{ top:4, right:4, left:0, bottom:4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="month" tick={{ fontSize:10 }} />
                <YAxis tick={{ fontSize:10 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="newUsers" stroke="#8b5cf6" strokeWidth={2.5}
                  dot={{ fill:"#8b5cf6", r:4 }} name="New Users" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Active vs Inactive pie */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-1">🟢 Active vs Inactive</h3>
          <p className="text-xs text-gray-400 mb-4">Users who have booked at least once</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={PIE_DATA} cx="50%" cy="50%" outerRadius={70} innerRadius={35}
                dataKey="value" nameKey="name"
                label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                labelLine={false}>
                {PIE_DATA.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex gap-4 justify-center mt-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />Active
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-3 h-3 rounded-full bg-gray-200 inline-block" />Inactive
            </div>
          </div>
        </div>
      </div>

      {/* ── Top Users Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-gray-800 mb-4">🏆 Top Users by Bookings</h3>
        {topUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-300">
            <p className="text-3xl mb-2">👥</p><p className="text-sm">No user booking data</p>
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Rank","User","Email","Bookings","Confirmed","Total Spent"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topUsers.map((u, i) => (
                  <tr key={i} className={`hover:bg-gray-50/80 ${i===0?"bg-yellow-50/40":""}`}>
                    <td className="px-4 py-3">
                      <span className={`font-black text-lg ${i===0?"text-yellow-500":i===1?"text-gray-400":i===2?"text-amber-600":"text-gray-300"}`}>
                        {i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm shrink-0">
                          {(u.name?.[0] ?? u.email?.[0] ?? "?").toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-900">{u.name || "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{u.email}</td>
                    <td className="px-4 py-3 font-bold text-violet-600">{u.totalBookings}</td>
                    <td className="px-4 py-3 text-green-600 font-semibold">{u.confirmed}</td>
                    <td className="px-4 py-3 font-bold text-emerald-600">{rp(u.spent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}



// ════════════════════════════════════════════════════════════
// 💰 REVENUE ANALYTICS TAB
// ════════════════════════════════════════════════════════════
export function RevenueAnalyticsTab() {
  const [revenue,    setRevenue]    = useState([]);
  const [movieRev,   setMovieRev]   = useState([]);
  const [venueRev,   setVenueRev]   = useState([]);
  const [bookings,   setBookings]   = useState([]);
  const [period,     setPeriod]     = useState("daily");
  const [loading,    setLoading]    = useState(true);
  const [loadingRev, setLoadingRev] = useState(false);
  const [error,      setError]      = useState(null);

  useEffect(() => {
    Promise.allSettled([
      fetchRevenue("monthly"), fetchRevenueMovie(),
      fetchRevenueVenue(), fetchAdminBookings()
    ]).then(([rev, mRev, vRev, bk]) => {
      if (rev.status  === "fulfilled") setRevenue(rev.value.data   ?? []);
      if (mRev.status === "fulfilled") setMovieRev(mRev.value.data ?? []);
      if (vRev.status === "fulfilled") setVenueRev(vRev.value.data ?? []);
      if (bk.status   === "fulfilled") setBookings(Array.isArray(bk.value.data) ? bk.value.data : []);
      else setError("Some endpoints unavailable — showing derived data");
    }).finally(() => setLoading(false));
  }, []);

  const switchPeriod = async (p) => {
    setPeriod(p);
    setLoadingRev(true);
    try { const r = await fetchRevenue(p); setRevenue(r.data ?? []); }
    catch {}
    finally { setLoadingRev(false); }
  };

  const rp = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

  // Fallback derived data
  const derivedMovieRev = movieRev.length > 0 ? movieRev : (() => {
    const map = {};
    bookings.filter(b => b.status === "CONFIRMED").forEach(b => {
      const t = b.movieTitle ?? "Unknown";
      if (!map[t]) map[t] = { movieTitle: t, revenue: 0, bookings: 0 };
      map[t].revenue  += Number(b.totalPrice || 0);
      map[t].bookings += 1;
    });
    return Object.values(map).sort((a,b) => b.revenue - a.revenue).slice(0,10);
  })();

  const derivedVenueRev = venueRev.length > 0 ? venueRev : (() => {
    const map = {};
    bookings.filter(b => b.status === "CONFIRMED").forEach(b => {
      const n = b.venueName ?? "Unknown";
      if (!map[n]) map[n] = { venueName: n, city: b.venueCity ?? "", revenue: 0, bookings: 0 };
      map[n].revenue  += Number(b.totalPrice || 0);
      map[n].bookings += 1;
    });
    return Object.values(map).sort((a,b) => b.revenue - a.revenue).slice(0,10);
  })();

  const revenueData = revenue.length > 0 ? revenue.map(r => ({
    label:     r.label ?? r.month ?? "",
    revenue:   Number(r.revenue   || 0),
    bookings:  Number(r.bookings  || 0),
    cancelled: Number(r.cancelled || 0),
  })) : (() => {
    if (bookings.length === 0) return [];
    const map = {};
    bookings.filter(b => b.status === "CONFIRMED").forEach(b => {
      const d = new Date(b.confirmedAt ?? b.lockedAt ?? b.createdAt);
      if (isNaN(d.getTime())) return;
      const key = period === "daily"
        ? d.toLocaleDateString("en-IN", { day:"2-digit", month:"short" })
        : period === "weekly"
          ? `W${getWeekNumber(d)} ${d.getFullYear()}`
          : d.toLocaleDateString("en-IN", { month:"short", year:"numeric" });
      if (!map[key]) map[key] = { label: key, revenue: 0, bookings: 0 };
      map[key].revenue  += Number(b.totalPrice || 0);
      map[key].bookings += 1;
    });
    return Object.values(map).slice(-12);
  })();

  const totalRevenue = revenueData.reduce((s, r) => s + r.revenue, 0);

  const PERIOD_TABS = [
    { id:"daily",   label:"Daily"   },
    { id:"weekly",  label:"Weekly"  },
    { id:"monthly", label:"Monthly" },
  ];

  if (loading) return <Spinner color="violet" />;

  return (
    <div className="space-y-6">
      {error && <div className="bg-orange-50 border border-orange-200 text-orange-700 rounded-xl px-4 py-3 text-sm">
        ⚠️ {error}
      </div>}

      {/* ── Summary card ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg">
          <span className="text-3xl">💰</span>
          <p className="text-4xl font-black mt-3">{rp(totalRevenue)}</p>
          <p className="text-sm text-white/70 mt-1">Revenue in view</p>
        </div>
        <div className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl p-5 text-white shadow-lg">
          <span className="text-3xl">🎬</span>
          <p className="text-4xl font-black mt-3">{derivedMovieRev.length}</p>
          <p className="text-sm text-white/70 mt-1">Movies generating revenue</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-5 text-white shadow-lg">
          <span className="text-3xl">🏛️</span>
          <p className="text-4xl font-black mt-3">{derivedVenueRev.length}</p>
          <p className="text-sm text-white/70 mt-1">Venues generating revenue</p>
        </div>
      </div>

      {/* ── Revenue Trend with period toggle ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h3 className="font-bold text-gray-800">💰 Revenue Trend</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Total: {rp(totalRevenue)}
              {revenue.length === 0 && bookings.length > 0 &&
                <span className="ml-2 text-orange-500">⚠ Derived from bookings</span>}
            </p>
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {PERIOD_TABS.map(pt => (
              <button key={pt.id} onClick={() => switchPeriod(pt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition
                  ${period === pt.id ? "bg-white text-red-500 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
                {loadingRev && period === pt.id ? "⟳" : pt.label}
              </button>
            ))}
          </div>
        </div>
        {revenueData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-300">
            <p className="text-4xl mb-2">📊</p><p className="text-sm">No revenue data yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData} margin={{ top:4, right:4, left:0, bottom:4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
              <XAxis dataKey="label" tick={{ fontSize:10 }} />
              <YAxis tick={{ fontSize:10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => [`₹${Number(v).toLocaleString("en-IN")}`, "Revenue"]} />
              <Bar dataKey="revenue" radius={[6,6,0,0]} fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Revenue per Movie + Venue ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="mb-4">
            <h3 className="font-bold text-gray-800">🎬 Revenue per Movie</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Top {Math.min(derivedMovieRev.length,8)} movies
              {movieRev.length === 0 && <span className="ml-1 text-orange-500">⚠ derived</span>}
            </p>
          </div>
          {derivedMovieRev.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-36 text-gray-300">
              <p className="text-3xl mb-2">🎬</p><p className="text-sm">No data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={derivedMovieRev.slice(0,8)} layout="vertical"
                margin={{ top:0, right:60, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" horizontal={false} />
                <XAxis type="number" tick={{ fontSize:10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey={d => d.movieTitle ?? d.title ?? "?"}
                  width={100} tick={{ fontSize:10 }} />
                <Tooltip formatter={v => [`₹${Number(v).toLocaleString("en-IN")}`, "Revenue"]} />
                <Bar dataKey="revenue" radius={[0,6,6,0]} fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="mb-4">
            <h3 className="font-bold text-gray-800">🏛️ Revenue per Venue</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Top {Math.min(derivedVenueRev.length,8)} venues
              {venueRev.length === 0 && <span className="ml-1 text-orange-500">⚠ derived</span>}
            </p>
          </div>
          {derivedVenueRev.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-36 text-gray-300">
              <p className="text-3xl mb-2">🏛️</p><p className="text-sm">No data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={derivedVenueRev.slice(0,8)} layout="vertical"
                margin={{ top:0, right:60, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" horizontal={false} />
                <XAxis type="number" tick={{ fontSize:10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey={d => d.venueName ?? "?"}
                  width={100} tick={{ fontSize:10 }} />
                <Tooltip formatter={v => [`₹${Number(v).toLocaleString("en-IN")}`, "Revenue"]}
                  labelFormatter={(_, items) => items?.[0]?.payload?.city ?? ""} />
                <Bar dataKey="revenue" radius={[0,6,6,0]} fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Top performing movies table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-gray-800 mb-4">🏆 Top Performing Movies by Revenue</h3>
        {derivedMovieRev.length === 0 ? (
          <div className="text-center py-8 text-gray-300">
            <p className="text-3xl mb-2">🎬</p><p className="text-sm">No data yet</p>
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Rank","Movie","Revenue","Bookings","Avg/Booking","Share %"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {derivedMovieRev.slice(0,10).map((m, i) => {
                  const total = derivedMovieRev.reduce((s,x) => s + x.revenue, 0);
                  const share = total > 0 ? ((m.revenue / total) * 100).toFixed(1) : 0;
                  const avg   = m.bookings > 0 ? (m.revenue / m.bookings).toFixed(0) : 0;
                  return (
                    <tr key={i} className={`hover:bg-gray-50/80 ${i===0?"bg-yellow-50/50":""}`}>
                      <td className="px-4 py-3">
                        <span className={`font-black text-lg ${i===0?"text-yellow-500":i===1?"text-gray-400":i===2?"text-amber-600":"text-gray-300"}`}>
                          {i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{m.movieTitle ?? m.title ?? "—"}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600">{rp(m.revenue)}</td>
                      <td className="px-4 py-3 text-gray-500">{m.bookings ?? 0}</td>
                      <td className="px-4 py-3 text-gray-500">{rp(avg)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-2 max-w-[80px]">
                            <div className="bg-red-400 h-2 rounded-full" style={{ width:`${share}%` }} />
                          </div>
                          <span className="text-xs text-gray-400 font-semibold">{share}%</span>
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
  );
}

// ════════════════════════════════════════════════════════════
// 🔴 LIVE ACTIVITY TAB
// ════════════════════════════════════════════════════════════
export function LiveActivityTab() {
  const [bookings,   setBookings]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [feed,       setFeed]       = useState([]);  // activity feed log
  const prevBookingsRef = useRef([]);
const feedRef         = useRef([]);
  const rp = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const r = await fetchAdminBookings();
      const all = Array.isArray(r.data) ? r.data : [];
      const prev = prevBookingsRef.current;

      // Detect new bookings since last poll
      const prevIds = new Set(prev.map(b => b.id));
      const newEntries = all.filter(b => !prevIds.has(b.id));
      if (newEntries.length > 0 && prev.length > 0) {
        const newFeedItems = newEntries.map(b => ({
          id:        b.id,
          type:      b.status === "CONFIRMED" ? "confirmed" : "locked",
          movie:     b.movieTitle ?? "Unknown",
          user:      b.userName   ?? b.userEmail ?? "User",
          venue:     b.venueName  ?? "—",
          seats:     Array.isArray(b.seats) ? b.seats.length : 1,
          amount:    Number(b.totalPrice || 0),
          time:      new Date(),
        }));
        feedRef.current = [...newFeedItems, ...feedRef.current].slice(0, 20);
        setFeed([...feedRef.current]);
      }

      prevBookingsRef.current = all;
      setBookings(all);
      setLastUpdate(new Date());
    } catch (e) {
      console.error("Live poll error:", e);
    } finally {
      setLoading(false);
    }
  };

  // Poll every 15 seconds
  useEffect(() => {
    load();
    const interval = setInterval(() => load(true), 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading && bookings.length === 0) return <Spinner color="violet" />;

  const locked    = bookings.filter(b => b.status === "LOCKED");
  const confirmed = bookings.filter(b => b.status === "CONFIRMED");
  const today     = new Date().toISOString().split("T")[0];
  const todayConfirmed = confirmed.filter(b =>
    (b.confirmedAt ?? b.lockedAt ?? "").startsWith(today)
  );

  // Trending movies — top 5 by confirmed bookings in last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const recentMap = {};
  confirmed
    .filter(b => (b.confirmedAt ?? b.lockedAt ?? "") >= sevenDaysAgo)
    .forEach(b => {
      const t = b.movieTitle ?? "Unknown";
      if (!recentMap[t]) recentMap[t] = { title: t, bookings: 0, revenue: 0, venues: new Set() };
      recentMap[t].bookings++;
      recentMap[t].revenue += Number(b.totalPrice || 0);
      if (b.venueName) recentMap[t].venues.add(b.venueName);
    });
  const trending = Object.values(recentMap)
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 5)
    .map(m => ({ ...m, venues: m.venues.size }));

  // Seats currently locked
  const totalLockedSeats = locked.reduce((s, b) =>
    s + (Array.isArray(b.seats) ? b.seats.length : 1), 0
  );

  // Time remaining for each locked booking
  const now = Date.now();
  const lockedWithTimer = locked.map(b => {
    const lockedAt = new Date(b.lockedAt).getTime();
    const expiresAt = lockedAt + 30 * 60 * 1000;
    const remaining = Math.max(0, expiresAt - now);
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    const urgency = remaining < 5 * 60 * 1000 ? "red"
                  : remaining < 15 * 60 * 1000 ? "amber"
                  : "green";
    return { ...b, remaining, mins, secs, urgency };
  }).sort((a, b) => a.remaining - b.remaining);

  const URGENCY_STYLE = {
    red:   { bg: "bg-red-50",   badge: "bg-red-100 text-red-700",   dot: "bg-red-500 animate-pulse"  },
    amber: { bg: "bg-amber-50", badge: "bg-amber-100 text-amber-700",dot: "bg-amber-500"               },
    green: { bg: "bg-green-50", badge: "bg-green-100 text-green-700",dot: "bg-green-500"               },
  };

  const FEED_STYLE = {
    confirmed: { icon: "✅", color: "text-green-600", bg: "bg-green-50" },
    locked:    { icon: "🔒", color: "text-amber-600", bg: "bg-amber-50" },
  };

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
          <h2 className="font-black text-gray-900 text-lg">Live Activity</h2>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-xs text-gray-400">
              Updated {lastUpdate.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit", second:"2-digit" })}
            </span>
          )}
          <button onClick={() => load(true)}
            className="px-3 py-1.5 text-xs bg-violet-50 text-violet-600 rounded-lg
                       hover:bg-violet-100 transition font-semibold">
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* ── Live stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:"Active Locks",        value: locked.length,      icon:"🔒", color:"bg-amber-500",  sub: `${totalLockedSeats} seats held` },
          { label:"Today's Bookings",    value: todayConfirmed.length, icon:"📅", color:"bg-green-500", sub: `₹${todayConfirmed.reduce((s,b)=>s+Number(b.totalPrice||0),0).toLocaleString("en-IN")} revenue` },
          { label:"Total Confirmed",     value: confirmed.length,   icon:"✅", color:"bg-blue-500",   sub: "all time" },
          { label:"Seats Being Locked",  value: totalLockedSeats,   icon:"💺", color:"bg-red-500",    sub: "expiring in 30min" },
        ].map(card => (
          <div key={card.label} className={`${card.color} rounded-2xl p-4 text-white shadow-lg`}>
            <span className="text-2xl">{card.icon}</span>
            <p className="text-3xl font-black mt-2">{card.value}</p>
            <p className="text-xs font-bold mt-0.5">{card.label}</p>
            <p className="text-xs text-white/60 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Active locked bookings ── */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">🔒 Seats Being Locked Right Now</h3>
            <span className="text-xs text-gray-400">{locked.length} active</span>
          </div>
          {locked.length === 0 ? (
            <div className="text-center py-10 text-gray-300">
              <p className="text-4xl mb-2">✅</p>
              <p className="text-sm">No seats currently locked</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {lockedWithTimer.map(b => {
                const style = URGENCY_STYLE[b.urgency];
                const seats = Array.isArray(b.seats) ? b.seats.map(s => s.seatNumber).join(", ") : "—";
                return (
                  <div key={b.id} className={`${style.bg} rounded-xl p-3 flex items-center gap-3`}>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {b.movieTitle ?? "—"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {b.userName ?? b.userEmail ?? "—"} · {b.venueName ?? "—"}
                      </p>
                      <p className="text-xs text-gray-400">Seats: {seats}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-xs font-black px-2 py-1 rounded-lg ${style.badge}`}>
                        {b.mins}m {b.secs}s
                      </span>
                      <p className="text-xs text-gray-400 mt-1">{rp(b.totalPrice)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Trending movies ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-4">🔥 Trending This Week</h3>
          {trending.length === 0 ? (
            <div className="text-center py-10 text-gray-300">
              <p className="text-3xl mb-2">🎬</p>
              <p className="text-sm">No bookings this week yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {trending.map((m, i) => {
                const maxB = trending[0].bookings;
                const pct  = maxB > 0 ? (m.bookings / maxB) * 100 : 0;
                const MEDAL = ["🥇","🥈","🥉","4️⃣","5️⃣"];
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{MEDAL[i]}</span>
                        <span className="text-sm font-semibold text-gray-800 truncate max-w-[130px]">{m.title}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-500">{m.bookings} bookings</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{rp(m.revenue)} · {m.venues} venue{m.venues !== 1 ? "s" : ""}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Live Activity Feed ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">📡 Live Booking Feed</h3>
          <span className="text-xs text-gray-400">Auto-refreshes every 15s</span>
        </div>
        {feed.length === 0 ? (
          <div className="text-center py-8 text-gray-300">
            <p className="text-3xl mb-2">📡</p>
            <p className="text-sm">Waiting for new booking activity...</p>
            <p className="text-xs mt-1">New bookings will appear here in real time</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {feed.map((item, i) => {
              const style = FEED_STYLE[item.type] ?? FEED_STYLE.locked;
              const timeStr = item.time.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit", second:"2-digit" });
              return (
                <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${style.bg}`}>
                  <span className="text-base shrink-0">{style.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">
                      <span className="font-semibold">{item.user}</span>
                      {" "}{item.type === "confirmed" ? "confirmed" : "locked"}{" "}
                      <span className="font-semibold">{item.seats} seat{item.seats !== 1 ? "s" : ""}</span>
                      {" "}for <span className="font-semibold">{item.movie}</span>
                    </p>
                    <p className="text-xs text-gray-400">{item.venue} · {rp(item.amount)}</p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 font-mono">{timeStr}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}