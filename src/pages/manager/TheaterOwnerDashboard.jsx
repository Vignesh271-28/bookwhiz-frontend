import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import TheaterOwnerRequestTab from "./TheaterOwnerRequestTab.jsx";
import axios from "axios";
import { getToken } from "../../utils/jwtUtil.js";
import { toast } from "react-toastify";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { API } from "../../config/api.js";

// const BASE = "http://localhost:8080/api/theater-owner";
const auth = () => ({ Authorization: `Bearer ${getToken()}` });
const get  = (path) => axios.get(`${API.THEATEROWNER}${path}`, { headers: auth() });

// ─── Formatters ───────────────────────────────────────────────
const fmt  = (n) => `₹${Number(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const pct  = (n) => `${Number(n ?? 0).toFixed(1)}%`;
const date = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—";
const time = (t) => t ? String(t).slice(0, 5) : "—";

const STATUS = {
  CONFIRMED: { label:"Confirmed", bg:"bg-green-500/15",  text:"text-green-400",  dot:"bg-green-400"  },
  CANCELLED: { label:"Cancelled", bg:"bg-red-500/15",    text:"text-red-400",    dot:"bg-red-400"    },
  LOCKED:    { label:"Pending",   bg:"bg-yellow-500/15", text:"text-yellow-400", dot:"bg-yellow-400" },
  EXPIRED:   { label:"Expired",   bg:"bg-white/10",      text:"text-white/30",   dot:"bg-white/20"   },
};

// ─── Shared UI ────────────────────────────────────────────────
const Card = ({ label, value, sub, icon, color = "text-orange-400", trend }) => (
  <div className="bg-black border border-white/[0.07] rounded-2xl p-5 space-y-3">
    <div className="flex items-center justify-between">
      <span className="text-white/30 text-xs font-black uppercase tracking-widest">{label}</span>
      <span className="text-2xl">{icon}</span>
    </div>
    <p className={`text-2xl font-black ${color}`}>{value}</p>
    <div className="flex items-center justify-between">
      {sub && <p className="text-white/25 text-xs">{sub}</p>}
      {trend !== undefined && (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full
          ${trend >= 0 ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
          {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
        </span>
      )}
    </div>
  </div>
);

const Spinner = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
  </div>
);

const Empty = ({ text = "No data found" }) => (
  <div className="text-center py-16 text-white/20">
    <p className="text-4xl mb-2">📭</p>
    <p className="text-sm">{text}</p>
  </div>
);

function StatusBadge({ status }) {
  const m = STATUS[status] ?? STATUS.EXPIRED;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${m.bg} ${m.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

// ─── Root Dashboard ───────────────────────────────────────────
export default function TheaterOwnerDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  return (
    <DashboardLayout role="MANAGER" activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === "overview"  && <OverviewTab />}
      {activeTab === "movies"    && <MoviesTab />}
      {activeTab === "shows"     && <ShowsTab />}
      {activeTab === "bookings"  && <BookingsTab />}
      {activeTab === "today"     && <TodayTab />}
      {activeTab === "requests"  && <TheaterOwnerRequestTab />}
    </DashboardLayout>
  );
}

// ════════════════════════════════════════════════════════════
// ◈ OVERVIEW
// ════════════════════════════════════════════════════════════
function OverviewTab() {
  const [summary, setSummary] = useState(null);
  const [daily,   setDaily]   = useState([]);
  const [today,   setToday]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([get("/summary"), get("/revenue/daily"), get("/today")])
      .then(([s, d, t]) => {
        setSummary(s.data);
        setDaily(d.data);
        setToday(t.data);
      })
      .catch(() => toast.error("Failed to load overview"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const ORANGE = "#f97316"; const RED = "#ef4444"; const GREEN = "#22c55e";

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-white font-black text-xl">🏟️ Theater Dashboard</h2>
        <p className="text-white/30 text-sm mt-0.5">Your theatre's performance at a glance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card label="Total Revenue"   value={fmt(summary?.totalRevenue)}  icon="" color="text-orange-400" />
        <Card label="Total Bookings"  value={summary?.totalBookings ?? 0} icon="" color="text-blue-400"   />
        <Card label="Active Movies"   value={summary?.totalMovies ?? 0}   icon="" color="text-purple-400" />
        <Card label="Total Shows"     value={summary?.totalShows ?? 0}    icon="" color="text-pink-400"   />
        <Card label="Occupancy"       value={pct(summary?.occupancyRate)} icon="" color="text-green-400"  />
        <Card label="Cancellations"   value={summary?.cancelledCount ?? 0}icon="" color="text-red-400"    />
      </div>

      {/* Today snapshot */}
      {today && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card label="Today Revenue"   value={fmt(today.todayRevenue)}   icon="" color="text-orange-400"
                trend={today.revenueChange} />
          <Card label="Today Bookings"  value={today.todayBookings}       icon="" color="text-blue-400"   />
          <Card label="Today Shows"     value={today.todayShows}          icon="" color="text-purple-400" />
          <Card label="Est. Profit"     value={fmt(today.estimatedProfit)} icon="" color="text-green-400"  />
        </div>
      )}

      {/* Revenue area chart */}
      <div className="bg-black border border-white/[0.07] rounded-2xl p-5">
        <h3 className="text-white font-black text-sm mb-4">📊 Revenue — Last 30 Days</h3>
        {daily.length === 0 ? <Empty text="No revenue data yet" /> : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={daily}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={ORANGE} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={ORANGE} stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill:"#ffffff30", fontSize:10 }}
                tickFormatter={v => new Date(v).toLocaleDateString("en-IN",{day:"2-digit",month:"short"})} />
              <YAxis tick={{ fill:"#ffffff30", fontSize:10 }}
                tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background:"#0a0a0a", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12 }}
                labelStyle={{ color:"#fff", fontWeight:900 }}
                formatter={(v, n) => [n === "revenue" ? fmt(v) : v, n === "revenue" ? "Revenue" : "Bookings"]}
              />
              <Area type="monotone" dataKey="revenue"  stroke={ORANGE} fill="url(#revGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="bookings" stroke={GREEN}  fill="none"          strokeWidth={1.5} strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bar: bookings vs cancellations */}
      {daily.length > 0 && (
        <div className="bg-black border border-white/[0.07] rounded-2xl p-5">
          <h3 className="text-white font-black text-sm mb-4">📉 Bookings vs Cancellations</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={daily.slice(-14)}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill:"#ffffff30", fontSize:10 }}
                tickFormatter={v => new Date(v).toLocaleDateString("en-IN",{day:"2-digit",month:"short"})} />
              <YAxis tick={{ fill:"#ffffff30", fontSize:10 }} />
              <Tooltip contentStyle={{ background:"#0a0a0a", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12 }} />
              <Bar dataKey="bookings"  fill={GREEN}  radius={[4,4,0,0]} />
              <Bar dataKey="cancelled" fill={RED}    radius={[4,4,0,0]} />
              <Legend wrapperStyle={{ color:"#ffffff50", fontSize:12 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 🎬 MOVIES
// ════════════════════════════════════════════════════════════
function MoviesTab() {
  const [movies,  setMovies]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

  useEffect(() => {
    get("/movies")
      .then(r => setMovies(r.data))
      .catch(() => toast.error("Failed to load movies"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = movies.filter(m =>
    m.title?.toLowerCase().includes(search.toLowerCase()) ||
    m.genre?.toLowerCase().includes(search.toLowerCase())
  );

  const COLORS = ["#f97316","#ef4444","#a855f7","#3b82f6","#22c55e","#eab308"];

  if (loading) return <Spinner />;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-white font-black text-xl">🎬 My Movies</h2>
          <p className="text-white/30 text-sm mt-0.5">Movies showing at your theatre</p>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search movies..."
          className="bg-white/[0.05] border border-white/10 text-white placeholder-white/20
                     rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500/50 w-56" />
      </div>

      {/* Revenue pie */}
      {movies.length > 0 && (
        <div className="bg-black border border-white/[0.07] rounded-2xl p-5">
          <h3 className="text-white font-black text-sm mb-4">💰 Revenue by Movie</h3>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <PieChart width={200} height={200}>
              <Pie data={movies.slice(0,6)} dataKey="revenue" nameKey="title"
                cx={100} cy={100} innerRadius={55} outerRadius={90}>
                {movies.slice(0,6).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => fmt(v)}
                contentStyle={{ background:"#0a0a0a", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12 }} />
            </PieChart>
            <div className="grid grid-cols-1 gap-2 flex-1">
              {movies.slice(0,6).map((m, i) => (
                <div key={m.id} className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-white/60 text-xs truncate flex-1">{m.title}</span>
                  <span className="text-white text-xs font-black">{fmt(m.revenue)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Movies grid */}
      {filtered.length === 0 ? <Empty text="No movies found" /> : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(m => (
            <div key={m.id} className="bg-black border border-white/[0.07] rounded-2xl overflow-hidden
                                       hover:border-orange-500/30 transition group">
              {/* Poster */}
              <div className="relative h-36 bg-white/[0.03] overflow-hidden">
                {m.posterUrl
                  ? <img src={`http://localhost:8080${m.posterUrl}`} alt={m.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  : <div className="w-full h-full flex items-center justify-center text-5xl">🎬</div>
                }
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-white font-black text-sm truncate">{m.title}</p>
                  <div className="flex gap-2 mt-1">
                    {m.genre    && <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-bold">{m.genre}</span>}
                    {m.language && <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/50 font-bold">{m.language}</span>}
                    {m.format   && <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-bold">{m.format}</span>}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="p-4 grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-orange-400 font-black text-sm">{fmt(m.revenue)}</p>
                  <p className="text-white/25 text-[10px] uppercase tracking-wide">Revenue</p>
                </div>
                <div className="text-center">
                  <p className="text-blue-400 font-black text-sm">{m.bookings ?? 0}</p>
                  <p className="text-white/25 text-[10px] uppercase tracking-wide">Bookings</p>
                </div>
                <div className="text-center">
                  <p className="text-purple-400 font-black text-sm">{m.showCount ?? 0}</p>
                  <p className="text-white/25 text-[10px] uppercase tracking-wide">Shows</p>
                </div>
              </div>
              {m.director && (
                <div className="px-4 pb-4">
                  <p className="text-white/20 text-[11px]">🎥 {m.director}
                    {m.duration ? <span className="ml-2">⏱ {m.duration} min</span> : ""}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 🎭 SHOWS REVENUE
// ════════════════════════════════════════════════════════════
function ShowsTab() {
  const [shows,    setShows]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);  // show id for drill-down
  const [detail,   setDetail]   = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search,   setSearch]   = useState("");

  useEffect(() => {
    get("/shows")
      .then(r => setShows(r.data))
      .catch(() => toast.error("Failed to load shows"))
      .finally(() => setLoading(false));
  }, []);

  const openDetail = async (show) => {
    if (selected?.id === show.id) { setSelected(null); return; }
    setSelected(show);
    setDetailLoading(true);
    try {
      const r = await get(`/shows/${show.id}/bookings`);
      setDetail(r.data);
    } catch { toast.error("Failed to load show details"); }
    finally { setDetailLoading(false); }
  };

  const filtered = shows.filter(s =>
    s.movieTitle?.toLowerCase().includes(search.toLowerCase()) ||
    s.venueName?.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue  = shows.reduce((a, s) => a + (s.revenue ?? 0), 0);
  const totalBookings = shows.reduce((a, s) => a + (s.confirmedBookings ?? 0), 0);

  if (loading) return <Spinner />;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-white font-black text-xl">🎭 Show Revenue</h2>
          <p className="text-white/30 text-sm mt-0.5">Per-show breakdown — click a row to see bookings</p>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search shows..."
          className="bg-white/[0.05] border border-white/10 text-white placeholder-white/20
                     rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500/50 w-56" />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card label="Total Shows"    value={shows.length}         icon="" color="text-purple-400" />
        <Card label="Total Revenue"  value={fmt(totalRevenue)}    icon="" color="text-orange-400" />
        <Card label="Total Bookings" value={totalBookings}        icon="" color="text-blue-400"   />
        <Card label="Avg per Show"   value={fmt(shows.length > 0 ? totalRevenue / shows.length : 0)} icon="" color="text-green-400" />
      </div>

      {/* Shows table */}
      <div className="bg-black border border-white/[0.07] rounded-2xl overflow-hidden">
        {filtered.length === 0 ? <Empty text="No shows found" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  {["Movie","Venue","Date","Time","Price","Seats","Booked","Occupancy","Revenue","Status",""].map(h => (
                    <th key={h} className="px-4 py-3.5 text-white/25 text-[10px] font-black uppercase tracking-widest
                                           text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map(s => {
                  const isOpen = selected?.id === s.id;
                  return (
                    <>
                      <tr key={s.id}
                        onClick={() => openDetail(s)}
                        className={`cursor-pointer transition
                          ${isOpen ? "bg-orange-500/10" : "hover:bg-white/[0.03]"}`}>
                        <td className="px-4 py-3.5 text-white font-bold whitespace-nowrap">{s.movieTitle ?? "—"}</td>
                        <td className="px-4 py-3.5 text-white/40 text-xs whitespace-nowrap">
                          {s.venueName ?? "—"}<br />
                          <span className="text-white/20">{s.venueCity}</span>
                        </td>
                        <td className="px-4 py-3.5 text-white/50 text-xs whitespace-nowrap">{date(s.showDate)}</td>
                        <td className="px-4 py-3.5 text-white/50 text-xs">{time(s.showTime)}</td>
                        <td className="px-4 py-3.5 text-white/50 text-xs">{fmt(s.price)}</td>
                        <td className="px-4 py-3.5 text-white/50 text-xs text-center">{s.totalSeats ?? "—"}</td>
                        <td className="px-4 py-3.5 text-blue-400 font-bold text-xs text-center">{s.confirmedBookings ?? 0}</td>
                        <td className="px-4 py-3.5 text-xs text-center">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-white/[0.07] rounded-full h-1.5 min-w-[40px]">
                              <div className="h-1.5 rounded-full bg-orange-500"
                                style={{ width: `${Math.min(s.occupancy ?? 0, 100)}%` }} />
                            </div>
                            <span className="text-white/40 text-[10px] w-8">{pct(s.occupancy)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-orange-400 font-black text-sm whitespace-nowrap">{fmt(s.revenue)}</td>
                        <td className="px-4 py-3.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
                            ${(s.occupancy ?? 0) >= 70 ? "bg-green-500/15 text-green-400"
                            : (s.occupancy ?? 0) >= 40 ? "bg-yellow-500/15 text-yellow-400"
                            : "bg-red-500/15 text-red-400"}`}>
                            {(s.occupancy ?? 0) >= 70 ? "Full" : (s.occupancy ?? 0) >= 40 ? "Avg" : "Low"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-white/25 text-xs">
                          {isOpen ? "▲" : "▼"}
                        </td>
                      </tr>

                      {/* Drill-down row */}
                      {isOpen && (
                        <tr key={`detail-${s.id}`}>
                          <td colSpan={11} className="bg-orange-500/[0.05] border-t border-orange-500/20 p-0">
                            <div className="p-4">
                              <p className="text-orange-400 font-black text-xs mb-3 uppercase tracking-widest">
                                 Bookings for {s.movieTitle} — {date(s.showDate)} {time(s.showTime)}
                              </p>
                              {detailLoading ? (
                                <div className="py-6 text-center text-white/20 text-sm">Loading...</div>
                              ) : detail.length === 0 ? (
                                <div className="py-6 text-center text-white/20 text-sm">No bookings for this show</div>
                              ) : (
                                <div className="overflow-x-auto rounded-xl border border-white/[0.07]">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="border-b border-white/[0.07]">
                                        {["#","Customer","Email","Seats","Amount","Status","Booked At"].map(h => (
                                          <th key={h} className="px-3 py-2.5 text-white/25 text-[10px] font-black uppercase text-left">{h}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.04]">
                                      {detail.map((b, i) => (
                                        <tr key={b.bookingId} className="hover:bg-white/[0.03]">
                                          <td className="px-3 py-2.5 text-white/20">{i+1}</td>
                                          <td className="px-3 py-2.5 text-white font-bold">{b.userName}</td>
                                          <td className="px-3 py-2.5 text-white/40">{b.userEmail}</td>
                                          <td className="px-3 py-2.5 text-white/50 text-center">{b.seatsCount}</td>
                                          <td className="px-3 py-2.5 text-orange-400 font-black">{fmt(b.amount)}</td>
                                          <td className="px-3 py-2.5"><StatusBadge status={b.status} /></td>
                                          <td className="px-3 py-2.5 text-white/25">{date(b.bookingTime)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
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
// 🎟️ ALL BOOKINGS
// ════════════════════════════════════════════════════════════
function BookingsTab() {
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("ALL");

  useEffect(() => {
    get("/bookings")
      .then(r => setBookings(r.data))
      .catch(() => toast.error("Failed to load bookings"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = bookings.filter(b => {
    const q = search.toLowerCase();
    const matchQ = b.userName?.toLowerCase().includes(q) ||
                   b.userEmail?.toLowerCase().includes(q) ||
                   b.movieTitle?.toLowerCase().includes(q);
    const matchF = filter === "ALL" || b.status === filter;
    return matchQ && matchF;
  });

  const confirmed  = bookings.filter(b => b.status === "CONFIRMED");
  const cancelled  = bookings.filter(b => b.status === "CANCELLED");
  const totalRev   = confirmed.reduce((a, b) => a + (b.amount ?? 0), 0);
  const cancelRev  = cancelled.reduce((a, b) => a + (b.amount ?? 0), 0);

  const handleExport = async () => {
    try {
      const resp = await axios.get(`${API.THEATEROWNER}/export`, {
        headers: auth(), responseType: "blob"
      });
      const url = URL.createObjectURL(resp.data);
      const a   = document.createElement("a");
      a.href = url;
      a.download = `booking-history-${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("📥 CSV downloaded!");
    } catch { toast.error("Export failed"); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-white font-black text-xl"> Booking Details</h2>
          <p className="text-white/30 text-sm mt-0.5">All bookings with customer details</p>
        </div>
        <button onClick={handleExport}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white
                     px-4 py-2.5 rounded-xl text-sm font-black transition">
          ⬇️ Export CSV
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card label="Total Bookings" value={bookings.length}   icon="" color="text-white"         />
        <Card label="Confirmed"      value={confirmed.length}  icon="" color="text-green-400"      />
        <Card label="Cancelled"      value={cancelled.length}  icon="" color="text-red-400"        />
        <Card label="Net Revenue"    value={fmt(totalRev - cancelRev)} icon="" color="text-orange-400" />
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search customer, movie..."
            className="w-full bg-white/[0.05] border border-white/10 text-white placeholder-white/20
                       rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-orange-500/50" />
        </div>
        {["ALL","CONFIRMED","CANCELLED","LOCKED"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition
              ${filter === s
                ? "bg-orange-500 text-white"
                : "bg-white/[0.05] text-white/40 border border-white/10 hover:border-white/20"}`}>
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-black border border-white/[0.07] rounded-2xl overflow-hidden">
        {filtered.length === 0 ? <Empty /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  {["#","Customer","Movie","Venue","Show","Seats","Amount","Status","Booked"].map(h => (
                    <th key={h} className="px-4 py-3.5 text-white/25 text-[10px] font-black uppercase
                                           tracking-widest text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((b, i) => (
                  <tr key={b.bookingId} className="hover:bg-white/[0.03] transition">
                    <td className="px-4 py-3.5 text-white/20 text-xs">{i+1}</td>
                    <td className="px-4 py-3.5">
                      <p className="text-white font-bold text-xs">{b.userName}</p>
                      <p className="text-white/30 text-[11px]">{b.userEmail}</p>
                    </td>
                    <td className="px-4 py-3.5 text-white/60 text-xs whitespace-nowrap">{b.movieTitle ?? "—"}</td>
                    <td className="px-4 py-3.5 text-white/40 text-xs whitespace-nowrap">{b.venueName ?? "—"}</td>
                    <td className="px-4 py-3.5 text-white/40 text-xs whitespace-nowrap">
                      {date(b.showDate)}<br/>
                      <span className="text-white/20">{time(b.showTime)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-white/50 text-xs text-center">{b.seatsCount}</td>
                    <td className="px-4 py-3.5 text-orange-400 font-black text-sm whitespace-nowrap">{fmt(b.amount)}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={b.status} /></td>
                    <td className="px-4 py-3.5 text-white/25 text-xs whitespace-nowrap">{date(b.bookingTime)}</td>
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
// 📊 TODAY'S REPORT
// ════════════════════════════════════════════════════════════
function TodayTab() {
  const [today,    setToday]    = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([get("/today"), get("/bookings")])
      .then(([t, b]) => {
        setToday(t.data);
        // Filter today's bookings client-side
        const todayStr = new Date().toISOString().slice(0, 10);
        setBookings((b.data ?? []).filter(bk =>
          bk.bookingTime && String(bk.bookingTime).slice(0, 10) === todayStr
        ));
      })
      .catch(() => toast.error("Failed to load today's report"))
      .finally(() => setLoading(false));
  }, []);

  const handleExport = async () => {
    if (bookings.length === 0) { toast.info("No bookings today to export"); return; }
    const headers = ["Booking ID","Customer","Email","Movie","Venue","Seats","Amount","Status","Time"];
    const rows = bookings.map(b => [
      b.bookingId, `"${b.userName}"`, b.userEmail,
      `"${b.movieTitle ?? ""}"`, `"${b.venueName ?? ""}"`,
      b.seatsCount, b.amount, b.status, b.bookingTime
    ].join(","));
    const csv  = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `today-report-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("📥 Today's report downloaded!");
  };

  if (loading) return <Spinner />;

  const confirmedToday = bookings.filter(b => b.status === "CONFIRMED");
  const cancelledToday = bookings.filter(b => b.status === "CANCELLED");
  const grossRevenue   = confirmedToday.reduce((a, b) => a + (b.amount ?? 0), 0);
  const refunds        = cancelledToday.reduce((a, b) => a + (b.amount ?? 0), 0);
  const netRevenue     = grossRevenue - refunds;
  const profit         = today?.estimatedProfit ?? netRevenue * 0.7;
  const cost           = today?.estimatedCost   ?? netRevenue * 0.3;

  const isProfit = netRevenue > 0;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-white font-black text-xl">
            📊 Today's Report
            <span className="ml-2 text-orange-400 text-base">
              {new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"})}
            </span>
          </h2>
          <p className="text-white/30 text-sm mt-0.5">Live view of today's performance</p>
        </div>
        <button onClick={handleExport}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white
                     px-4 py-2.5 rounded-xl text-sm font-black transition">
          ⬇️ Download Report
        </button>
      </div>

      {/* P&L highlight */}
      <div className={`rounded-2xl p-5 border flex items-center gap-5
        ${isProfit
          ? "bg-green-500/10 border-green-500/25"
          : "bg-red-500/10 border-red-500/25"}`}>
        <span className="text-4xl">{isProfit ? "📈" : "📉"}</span>
        <div>
          <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-1">
            Today's Net {isProfit ? "Profit" : "Loss"}
          </p>
          <p className={`text-3xl font-black ${isProfit ? "text-green-400" : "text-red-400"}`}>
            {fmt(Math.abs(netRevenue))}
          </p>
          <p className="text-white/25 text-xs mt-1">
            Gross {fmt(grossRevenue)} — Refunds {fmt(refunds)} — Est. Cost {fmt(cost)}
          </p>
        </div>
        {today?.revenueChange !== 0 && (
          <div className="ml-auto text-right">
            <p className="text-white/25 text-xs">vs Yesterday</p>
            <p className={`text-2xl font-black ${(today?.revenueChange ?? 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
              {(today?.revenueChange ?? 0) >= 0 ? "+" : ""}{today?.revenueChange ?? 0}%
            </p>
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card label="Gross Revenue"  value={fmt(grossRevenue)}       icon="" color="text-orange-400" />
        <Card label="Net Revenue"    value={fmt(netRevenue)}          icon="" color={isProfit?"text-green-400":"text-red-400"} />
        <Card label="Est. Profit"    value={fmt(profit)}              icon="" color="text-green-400"  />
        <Card label="Est. Cost"      value={fmt(cost)}                icon="" color="text-red-400"    />
        <Card label="Confirmed"      value={confirmedToday.length}    icon="" color="text-green-400"  />
        <Card label="Cancelled"      value={cancelledToday.length}    icon="" color="text-red-400"    />
      </div>

      {/* Today bookings table */}
      <div className="bg-black border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.07] flex items-center justify-between">
          <p className="text-white font-black text-sm">
             Today's Bookings
            <span className="ml-2 text-white/25 font-normal text-xs">({bookings.length} total)</span>
          </p>
        </div>
        {bookings.length === 0 ? (
          <Empty text="No bookings today yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  {["Customer","Email","Movie","Venue","Seats","Amount","Status","Time"].map(h => (
                    <th key={h} className="px-4 py-3.5 text-white/25 text-[10px] font-black
                                           uppercase tracking-widest text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {bookings.map(b => (
                  <tr key={b.bookingId} className="hover:bg-white/[0.03] transition">
                    <td className="px-4 py-3.5 text-white font-bold text-xs">{b.userName}</td>
                    <td className="px-4 py-3.5 text-white/35 text-xs">{b.userEmail}</td>
                    <td className="px-4 py-3.5 text-white/60 text-xs whitespace-nowrap">{b.movieTitle ?? "—"}</td>
                    <td className="px-4 py-3.5 text-white/40 text-xs whitespace-nowrap">{b.venueName ?? "—"}</td>
                    <td className="px-4 py-3.5 text-white/50 text-xs text-center">{b.seatsCount}</td>
                    <td className="px-4 py-3.5 text-orange-400 font-black whitespace-nowrap">{fmt(b.amount)}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={b.status} /></td>
                    <td className="px-4 py-3.5 text-white/25 text-xs whitespace-nowrap">
                      {b.bookingTime ? new Date(b.bookingTime).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-white/[0.07] bg-white/[0.02]">
                  <td colSpan={4} className="px-4 py-3 text-white/25 text-xs font-bold">Total</td>
                  <td className="px-4 py-3 text-white/60 text-xs font-black text-center">
                    {bookings.reduce((a, b) => a + (b.seatsCount ?? 0), 0)}
                  </td>
                  <td className="px-4 py-3 text-orange-400 font-black">{fmt(grossRevenue)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}