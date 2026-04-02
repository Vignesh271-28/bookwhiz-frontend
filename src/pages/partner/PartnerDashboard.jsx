import { useState, useEffect, useRef } from "react";
import { usePermissions } from "../../hooks/userPermissions";
import axios from "axios";
import { toast } from "react-toastify";
import DashboardLayout from "../../layouts/DashboardLayout";
import ConfirmModal from "../popup/ConfirmModel";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

import { API } from "../../config/api";

// const API   = "http://localhost:8080/api/partner-portal";
const token = () => localStorage.getItem("token");
const auth  = () => ({ Authorization: `Bearer ${token()}` });
const fmt   = n => n == null ? "—" : "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 0 });
const fmtN  = n => n == null ? "0" : Number(n).toLocaleString("en-IN");

const COLORS = ["#8b5cf6","#f97316","#22c55e","#ef4444","#3b82f6","#eab308"];

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, accent = "#8b5cf6", trend }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        {trend != null && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full
            ${trend >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-black text-gray-900">{value}</p>
        <p className="text-gray-400 text-xs font-medium mt-0.5">{label}</p>
        {sub && <p className="text-gray-300 text-[11px] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────
function Badge({ status }) {
  const MAP = {
    CONFIRMED: "bg-green-50 text-green-700 border-green-200",
    CANCELLED: "bg-red-50 text-red-600 border-red-200",
    LOCKED:    "bg-yellow-50 text-yellow-700 border-yellow-200",
    PENDING:   "bg-gray-50 text-gray-500 border-gray-200",
  };
  return (
    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${MAP[status] ?? MAP.PENDING}`}>
      {status}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════
//  OVERVIEW TAB
// ══════════════════════════════════════════════════════════════
function OverviewTab() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${API.PARTNERPORTAL}/analytics`, { headers: auth() }),
      axios.get(`${API.PARTNERPORTAL}/today`,     { headers: auth() }),
    ]).then(([a, t]) => setData({ ...a.data, today: t.data }))
      .catch(() => toast.error("Failed to load overview"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!data)   return <ErrBox text="Could not load analytics." />;

  const { today } = data;

  return (
    <div className="p-6 space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="" label="Total Revenue"  value={fmt(data.totalRevenue)}  trend={today.revenueChange} />
        <StatCard icon="" label="Total Bookings" value={fmtN(data.totalBookings)} />
        <StatCard icon="" label="My Theatres"    value={fmtN(data.totalVenues)} />
        <StatCard icon="" label="Total Shows"    value={fmtN(data.totalShows)} />
      </div>

      {/* Today spotlight */}
      <div className={`rounded-2xl p-5 border ${today.revenueChange >= 0
        ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}>
        <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Today's Snapshot</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xl font-black text-gray-900">{fmt(today.todayRevenue)}</p>
            <p className="text-gray-400 text-xs mt-0.5">Revenue Today</p>
          </div>
          <div>
            <p className="text-xl font-black text-gray-900">{fmtN(today.todayBookings)}</p>
            <p className="text-gray-400 text-xs mt-0.5">Bookings</p>
          </div>
          <div>
            <p className="text-xl font-black text-gray-900">{fmt(today.estimatedProfit)}</p>
            <p className="text-gray-400 text-xs mt-0.5">Est. Profit (70%)</p>
          </div>
          <div>
            <p className={`text-xl font-black ${today.revenueChange >= 0 ? "text-green-600" : "text-red-600"}`}>
              {today.revenueChange >= 0 ? "▲" : "▼"} {Math.abs(today.revenueChange)}%
            </p>
            <p className="text-gray-400 text-xs mt-0.5">vs Yesterday</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="font-bold text-gray-800 text-sm mb-4">Revenue — Last 30 Days</p>
          {data.dailyRevenue?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data.dailyRevenue}>
                <defs>
                  <linearGradient id="rv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d?.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => "₹" + (v/1000).toFixed(0) + "k"} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fill="url(#rv)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <ErrBox text="No revenue data yet." />}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="font-bold text-gray-800 text-sm mb-4">Top Movies by Revenue</p>
          {data.topMovies?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data.topMovies} dataKey="revenue" nameKey="title" cx="50%" cy="50%"
                     outerRadius={80} label={({ title, percent }) => `${title} (${(percent*100).toFixed(0)}%)`}
                     labelLine={false}>
                  {data.topMovies.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : <ErrBox text="No bookings yet." />}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  VENUES TAB  — add / edit / delete theatres
// ══════════════════════════════════════════════════════════════
function VenuesTab() {
  const { can } = usePermissions();
  const [venues,  setVenues]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [form,    setForm]    = useState(null);   // null = closed, {} = new, {id} = edit
  const [saving,  setSaving]  = useState(false);
  const [delConfirm, setDelConfirm] = useState(null);

  const emptyForm = { name:"", city:"", area:"", address:"", totalSeats:"", screenName:"", amenities:"" };

  const load = () => {
    axios.get(`${API.PARTNERPORTAL}/venues`, { headers: auth() })
      .then(r => setVenues(Array.isArray(r.data) ? r.data : (r.data?.content ?? [])))
      .catch(() => toast.error("Failed to load venues"))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const save = async () => {
    if (!form.name?.trim())    { toast.error("Theatre name required"); return; }
    if (!form.city?.trim())    { toast.error("City required"); return; }
    if (!form.address?.trim()) { toast.error("Address required"); return; }
    if (!form.totalSeats || Number(form.totalSeats) < 1) { toast.error("Total seats must be > 0"); return; }

    setSaving(true);
    try {
      if (form.id) {
        await axios.put(`${API.PARTNERPORTAL}/venues/${form.id}`, form, { headers: auth() });
        toast.success("Theatre updated");
      } else {
        await axios.post(`${API.PARTNERPORTAL}/venues`, form, { headers: auth() });
        toast.success("Theatre added");
      }
      setForm(null);
      load();
    } catch (ex) {
      toast.error(ex.response?.data?.error ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const del = async () => {
    try {
      await axios.delete(`${API.PARTNERPORTAL}/venues/${delConfirm.id}`, { headers: auth() });
      toast.success("Theatre deleted");
      load();
    } catch { toast.error("Delete failed"); }
    finally { setDelConfirm(null); }
  };

  const inp = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400 transition";

  return (
    <div className="p-6 space-y-5">
      <ConfirmModal open={!!delConfirm} variant="danger"
        title="Delete Theatre?" message={`Delete "${delConfirm?.name}"? All its shows will also be removed.`}
        confirmLabel="Delete" onConfirm={del} onCancel={() => setDelConfirm(null)} />

      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-black text-gray-800 text-lg">My Theatres</h3>
          <p className="text-gray-400 text-sm">{venues.length} venue{venues.length !== 1 ? "s" : ""} registered</p>
        </div>
        {can("VENUE_CREATE") && (
          <button onClick={() => setForm(emptyForm)}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-black rounded-xl transition">
            + Add Theatre
          </button>
        )}
      </div>

      {/* Modal */}
      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-lg my-8 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-gray-900 text-lg">{form.id ? "Edit Theatre" : "Add New Theatre"}</h3>
              <button onClick={() => setForm(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-500 mb-1 block">Theatre Name *</label>
                <input value={form.name ?? ""} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. PVR Velachery" className={inp} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">City *</label>
                <input value={form.city ?? ""} onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                  placeholder="Chennai" className={inp} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Area</label>
                <input value={form.area ?? ""} onChange={e => setForm(p => ({ ...p, area: e.target.value }))}
                  placeholder="Velachery" className={inp} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-500 mb-1 block">Address *</label>
                <input value={form.address ?? ""} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                  placeholder="Full address" className={inp} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Total Seats *</label>
                <input type="number" value={form.totalSeats ?? ""} onChange={e => setForm(p => ({ ...p, totalSeats: e.target.value }))}
                  placeholder="200" className={inp} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Screen Name</label>
                <input value={form.screenName ?? ""} onChange={e => setForm(p => ({ ...p, screenName: e.target.value }))}
                  placeholder="Screen 1 / Audi A" className={inp} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-500 mb-1 block">Amenities (comma-separated)</label>
                <input value={form.amenities ?? ""} onChange={e => setForm(p => ({ ...p, amenities: e.target.value }))}
                  placeholder="Dolby Atmos, Recliner, Parking, Food Court" className={inp} />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setForm(null)} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-500 text-sm font-bold hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={save} disabled={saving}
                className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-black rounded-xl transition">
                {saving ? "Saving…" : form.id ? "Save Changes" : "Add Theatre"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? <Spinner /> : venues.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <p className="text-5xl mb-3">🏟️</p>
          <p className="font-bold text-gray-700">No theatres yet</p>
          <p className="text-gray-400 text-sm mt-1">Add your first theatre to start scheduling shows</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {venues.map(v => (
            <div key={v.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-black text-gray-900">{v.name}</h4>
                  <p className="text-gray-400 text-xs mt-0.5">📍 {v.city}{v.area ? ` · ${v.area}` : ""}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {can("VENUE_EDIT") && (
                    <button onClick={() => setForm({ ...v })}
                      className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-violet-100 hover:text-violet-600 text-gray-400 text-xs flex items-center justify-center transition">
                      ✏
                    </button>
                  )}
                  {can("VENUE_DELETE") && (
                    <button onClick={() => setDelConfirm(v)}
                      className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-red-100 hover:text-red-500 text-gray-400 text-xs flex items-center justify-center transition">
                      🗑
                    </button>
                  )}
                </div>
              </div>
              <p className="text-gray-300 text-xs line-clamp-2">{v.address}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="bg-violet-50 text-violet-700 font-bold px-2 py-0.5 rounded-full">
                  {fmtN(v.totalSeats)} seats
                </span>
                {v.screenName && <span className="text-gray-400">{v.screenName}</span>}
              </div>
              {v.amenities && (
                <div className="flex flex-wrap gap-1">
                  {v.amenities.split(",").map(a => a.trim()).filter(Boolean).map(a => (
                    <span key={a} className="text-[10px] bg-gray-50 border border-gray-100 rounded-full px-2 py-0.5 text-gray-400">{a}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  SHOWS TAB  — schedule shows
// ══════════════════════════════════════════════════════════════
function ShowsTab() {
  const { can } = usePermissions();
  const [shows,   setShows]   = useState([]);
  const [venues,  setVenues]  = useState([]);
  const [movies,  setMovies]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [form,    setForm]    = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [expand,  setExpand]  = useState(null);
  const [showBks, setShowBks] = useState([]);
  const [delConfirm, setDelConfirm] = useState(null);

  const emptyForm = { movieId:"", venueId:"", showDate:"", showTime:"", price:"", totalSeats:"" };

  const load = () => {
    setLoading(true);
    Promise.all([
      axios.get(`${API.PARTNERPORTAL}/shows`,  { headers: auth() }),
      axios.get(`${API.PARTNERPORTAL}/venues`, { headers: auth() }),
      axios.get(`${API.PARTNERPORTAL}/movies`, { headers: auth() }),
    ]).then(([s, v, m]) => {
      setShows(s.data);
      setVenues(Array.isArray(v.data) ? v.data : (v.data?.content ?? []));
      setMovies(m.data);
    }).catch(() => toast.error("Failed to load shows"))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const save = async () => {
    if (!form.movieId) { toast.error("Select a movie"); return; }
    if (!form.venueId) { toast.error("Select a venue"); return; }
    if (!form.showDate) { toast.error("Show date required"); return; }
    if (!form.showTime) { toast.error("Show time required"); return; }
    if (!form.price || Number(form.price) < 1) { toast.error("Set a valid ticket price"); return; }

    setSaving(true);
    try {
      const payload = {
        movieId:    Number(form.movieId),
        venueId:    Number(form.venueId),
        showDate:   form.showDate,
        showTime:   form.showTime,
        price:      Number(form.price),
        totalSeats: form.totalSeats ? Number(form.totalSeats) : undefined,
      };
      if (form.id) {
        await axios.put(`${API.PARTNERPORTAL}/shows/${form.id}`, payload, { headers: auth() });
        toast.success("Show updated");
      } else {
        await axios.post(`${API.PARTNERPORTAL}/shows`, payload, { headers: auth() });
        toast.success("Show created");
      }
      setForm(null);
      load();
    } catch (ex) {
      toast.error(ex.response?.data?.error ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const del = async () => {
    try {
      await axios.delete(`${API.PARTNERPORTAL}/shows/${delConfirm.id}`, { headers: auth() });
      toast.success("Show deleted");
      load();
    } catch { toast.error("Delete failed"); }
    finally { setDelConfirm(null); }
  };

  const toggleExpand = async (showId) => {
    if (expand === showId) { setExpand(null); return; }
    setExpand(showId);
    try {
      const r = await axios.get(`${API.PARTNERPORTAL}/shows/${showId}/bookings`, { headers: auth() });
      setShowBks(r.data);
    } catch { toast.error("Failed to load bookings"); }
  };

  const inp = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400 transition bg-white";

  return (
    <div className="p-6 space-y-5">
      <ConfirmModal open={!!delConfirm} variant="danger"
        title="Delete Show?" message={`Remove "${delConfirm?.movieTitle}" on ${delConfirm?.showDate}?`}
        confirmLabel="Delete" onConfirm={del} onCancel={() => setDelConfirm(null)} />

      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-black text-gray-800 text-lg">Show Schedule</h3>
          <p className="text-gray-400 text-sm">{shows.length} show{shows.length !== 1 ? "s" : ""} scheduled</p>
        </div>
        {can("SHOW_CREATE") && (
          <button onClick={() => setForm(emptyForm)}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-black rounded-xl transition">
            + Schedule Show
          </button>
        )}
      </div>

      {/* Form modal */}
      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-gray-900 text-lg">{form.id ? "Edit Show" : "Schedule Show"}</h3>
              <button onClick={() => setForm(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Movie *</label>
                <select value={form.movieId} onChange={e => setForm(p => ({ ...p, movieId: e.target.value }))} className={inp}>
                  <option value="">Select movie…</option>
                  {movies.map(m => <option key={m.id} value={m.id}>{m.title} ({m.language})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Theatre / Venue *</label>
                <select value={form.venueId} onChange={e => setForm(p => ({ ...p, venueId: e.target.value }))} className={inp}>
                  <option value="">Select venue…</option>
                  {venues.map(v => <option key={v.id} value={v.id}>{v.name} — {v.city}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Date *</label>
                  <input type="date" value={form.showDate} onChange={e => setForm(p => ({ ...p, showDate: e.target.value }))} className={inp} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Time *</label>
                  <input type="time" value={form.showTime} onChange={e => setForm(p => ({ ...p, showTime: e.target.value }))} className={inp} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Ticket Price (₹) *</label>
                  <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="150" className={inp} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Total Seats</label>
                  <input type="number" value={form.totalSeats} onChange={e => setForm(p => ({ ...p, totalSeats: e.target.value }))} placeholder="Auto from venue" className={inp} />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setForm(null)} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-500 text-sm font-bold hover:bg-gray-50 transition">Cancel</button>
              <button onClick={save} disabled={saving}
                className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-black rounded-xl transition">
                {saving ? "Saving…" : form.id ? "Update" : "Schedule"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? <Spinner /> : shows.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <p className="text-5xl mb-3">🎭</p>
          <p className="font-bold text-gray-700">No shows scheduled</p>
          <p className="text-gray-400 text-sm mt-1">
            {venues.length === 0 ? "Add a theatre first, then schedule shows" : "Click '+ Schedule Show' to get started"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {shows.map(s => (
            <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                {/* Poster */}
                <div className="w-10 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                  {s.posterUrl
                    ? <img src={s.posterUrl.startsWith("http") ? s.posterUrl : `http://localhost:8080${s.posterUrl}`}
                           alt={s.movieTitle} className="w-full h-full object-cover" onError={e => e.target.style.display="none"} />
                    : <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">🎬</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-900 truncate">{s.movieTitle}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{s.venueName} · {s.city}{s.screenName ? ` · ${s.screenName}` : ""}</p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-xs text-gray-500">📅 {s.showDate}</span>
                    <span className="text-xs text-gray-500">🕐 {s.showTime}</span>
                    <span className="text-xs font-bold text-violet-600">{fmt(s.price)}/seat</span>
                    <span className="text-xs text-gray-400">{fmtN(s.totalSeats)} seats</span>
                    {s.confirmedCount > 0 && (
                      <span className="text-xs bg-green-50 text-green-700 font-bold px-2 py-0.5 rounded-full">
                        {s.confirmedCount} confirmed
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleExpand(s.id)}
                    className="text-xs text-gray-400 hover:text-violet-600 px-3 py-1.5 rounded-lg hover:bg-violet-50 transition">
                    {expand === s.id ? "▲ Hide" : "▼ Bookings"}
                  </button>
                  {can("SHOW_EDIT") && (
                    <button onClick={() => setForm({ ...s, movieId: s.movieId, venueId: s.venueId })}
                      className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-violet-100 text-gray-400 hover:text-violet-600 text-sm flex items-center justify-center transition">Edit</button>
                  )}
                  {can("SHOW_DELETE") && (
                    <button onClick={() => setDelConfirm(s)}
                      className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 text-sm flex items-center justify-center transition">Delete</button>
                  )}
                </div>
              </div>

              {/* Inline bookings */}
              {expand === s.id && (
                <div className="border-t border-gray-50 bg-gray-50/50 px-4 py-3">
                  {showBks.length === 0 ? (
                    <p className="text-gray-400 text-sm py-4 text-center">No bookings for this show yet.</p>
                  ) : (
                    <table className="w-full text-xs">
                      <thead><tr className="text-gray-400">
                        <th className="text-left py-1.5 font-semibold">Customer</th>
                        <th className="text-left py-1.5 font-semibold">Email</th>
                        <th className="text-center py-1.5 font-semibold">Seats</th>
                        <th className="text-right py-1.5 font-semibold">Amount</th>
                        <th className="text-center py-1.5 font-semibold">Status</th>
                      </tr></thead>
                      <tbody>
                        {showBks.map(b => (
                          <tr key={b.bookingId} className="border-t border-gray-100">
                            <td className="py-1.5 font-medium text-gray-800">{b.userName}</td>
                            <td className="py-1.5 text-gray-400">{b.userEmail}</td>
                            <td className="py-1.5 text-center text-gray-500">{b.seats}</td>
                            <td className="py-1.5 text-right font-bold text-gray-900">{fmt(b.amount)}</td>
                            <td className="py-1.5 text-center"><Badge status={b.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  BOOKINGS TAB
// ══════════════════════════════════════════════════════════════
function BookingsTab() {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("ALL");

  useEffect(() => {
    axios.get(`${API.PARTNERPORTAL}/bookings`, { headers: auth() })
      .then(r => setData(r.data))
      .catch(() => toast.error("Failed to load bookings"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = data.filter(b => {
    const matchFilter = filter === "ALL" || b.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || b.userName?.toLowerCase().includes(q) || b.movieTitle?.toLowerCase().includes(q) ||
                        b.userEmail?.toLowerCase().includes(q) || String(b.bookingId).includes(q);
    return matchFilter && matchSearch;
  });

  const exportCSV = async () => {
    try {
      const r = await axios.get(`${API.PARTNERPORTAL}/export`, { headers: auth(), responseType: "blob" });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement("a"); a.href = url; a.download = "bookings.csv"; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error("Export failed"); }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-black text-gray-800 text-lg">All Bookings</h3>
          <p className="text-gray-400 text-sm">{filtered.length} of {data.length} bookings</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["ALL","CONFIRMED","CANCELLED","LOCKED"].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition
                ${filter === s ? "bg-violet-600 text-white border-violet-600" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"}`}>
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
          <button onClick={exportCSV}
            className="px-4 py-1.5 text-xs font-black rounded-lg bg-green-600 hover:bg-green-700 text-white transition">
            ↓ Export CSV
          </button>
        </div>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Search by name, movie, email or booking ID…"
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400 transition" />

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <p className="text-4xl mb-2">📭</p>
          <p className="text-gray-400 text-sm">No bookings found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{["#","Customer","Movie","Venue","Date","Time","Seats","Amount","Status"].map(h => (
                  <th key={h} className="text-left text-xs font-black text-gray-400 px-4 py-3">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(b => (
                  <tr key={b.bookingId} className="hover:bg-gray-50/50 transition">
                    <td className="px-4 py-3 text-xs text-gray-300 font-mono">#{b.bookingId}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-800">{b.userName}</p>
                      <p className="text-xs text-gray-400">{b.userEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{b.movieTitle}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{b.venueName}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{b.showDate}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{b.showTime}</td>
                    <td className="px-4 py-3 text-xs text-center text-gray-500">{b.seats}</td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900">{fmt(b.amount)}</td>
                    <td className="px-4 py-3"><Badge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  ANALYTICS TAB
// ══════════════════════════════════════════════════════════════
function AnalyticsTab() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API.PARTNERPORTAL}/analytics`, { headers: auth() })
      .then(r => setData(r.data))
      .catch(() => toast.error("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!data)   return <ErrBox text="Could not load analytics." />;

  return (
    <div className="p-6 space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="" label="Total Revenue"   value={fmt(data.totalRevenue)} />
        <StatCard icon="" label="Est. Profit (70%)" value={fmt(data.estimatedProfit)} />
        <StatCard icon="" label="Confirmed Bookings" value={fmtN(data.totalBookings)} />
        <StatCard icon="" label="Occupancy Rate"  value={`${data.occupancyRate ?? 0}%`} />
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="font-bold text-gray-800 text-sm mb-4">Revenue & Bookings — Last 30 Days</p>
        {data.dailyRevenue?.length ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.dailyRevenue} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d?.slice(5)} />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} tickFormatter={v => "₹" + (v/1000).toFixed(0) + "k"} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v, name) => name === "revenue" ? fmt(v) : v} />
              <Legend />
              <Bar yAxisId="left"  dataKey="revenue"   fill="#8b5cf6" radius={[4,4,0,0]} name="Revenue" />
              <Bar yAxisId="right" dataKey="bookings"  fill="#22c55e" radius={[4,4,0,0]} name="Bookings" />
              <Bar yAxisId="right" dataKey="cancelled" fill="#ef4444" radius={[4,4,0,0]} name="Cancelled" />
            </BarChart>
          </ResponsiveContainer>
        ) : <ErrBox text="No data in the last 30 days." />}
      </div>

      {/* Top movies table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="font-bold text-gray-800 text-sm mb-4">Top Movies by Revenue</p>
        {data.topMovies?.length === 0 ? <ErrBox text="No bookings yet." /> : (
          <div className="space-y-2">
            {data.topMovies?.map((m, i) => {
              const maxRev = data.topMovies[0]?.revenue || 1;
              return (
                <div key={m.title} className="flex items-center gap-4">
                  <span className="w-6 text-xs text-gray-300 font-mono text-center">#{i+1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-800">{m.title}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{fmtN(m.bookings)} bookings</span>
                        <span className="font-bold text-gray-900">{fmt(m.revenue)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full"
                        style={{ width: `${(m.revenue / maxRev) * 100}%`, background: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  TICKET SCANNER TAB
// ══════════════════════════════════════════════════════════════
function ScannerTab() {
  const [bookingId, setBookingId] = useState("");
  const [result,    setResult]    = useState(null);
  const [loading,   setLoading]   = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const scan = async () => {
    const id = bookingId.trim();
    if (!id) return;
    setLoading(true); setResult(null);
    try {
      const r = await axios.post(`${API.PARTNERPORTAL}/scan`, { bookingId: id }, { headers: auth() });
      setResult(r.data);
    } catch (ex) {
      setResult(ex.response?.data ?? { valid: false, error: "Scan failed" });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setResult(null); setBookingId(""); inputRef.current?.focus(); };

  return (
    <div className="p-6 flex flex-col items-center space-y-6 max-w-md mx-auto">
      <div className="text-center">
        <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">📷</div>
        <h3 className="font-black text-gray-900 text-xl">Ticket Scanner</h3>
        <p className="text-gray-400 text-sm mt-1">Enter the booking ID from a customer's ticket to verify entry</p>
      </div>

      <div className="w-full space-y-3">
        <input
          ref={inputRef}
          value={bookingId}
          onChange={e => setBookingId(e.target.value)}
          onKeyDown={e => e.key === "Enter" && scan()}
          placeholder="Enter booking ID (e.g. 1042)"
          className="w-full border-2 border-gray-200 focus:border-violet-400 rounded-2xl px-5 py-4
                     text-center text-xl font-black text-gray-900 tracking-widest outline-none transition"
        />
        <button onClick={scan} disabled={loading || !bookingId.trim()}
          className="w-full py-4 bg-violet-600 hover:bg-violet-700 disabled:opacity-40
                     text-white font-black text-sm rounded-2xl transition">
          {loading ? "Scanning…" : "🔍 Scan Ticket"}
        </button>
      </div>

      {result && (
        <div className={`w-full rounded-2xl border-2 p-6 space-y-4
          ${result.valid
            ? "bg-green-50 border-green-200"
            : "bg-red-50 border-red-200"}`}>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{result.valid ? "✅" : "❌"}</span>
            <div>
              <p className={`font-black text-lg ${result.valid ? "text-green-700" : "text-red-600"}`}>
                {result.message ?? (result.error ?? "Unknown error")}
              </p>
              {result.status && <Badge status={result.status} />}
            </div>
          </div>

          {result.bookingId && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t border-current/10">
              {[
                { label:"Booking ID",  val:`#${result.bookingId}` },
                { label:"Customer",    val:result.customerName },
                { label:"Movie",       val:result.movie },
                { label:"Show Date",   val:result.showDate },
                { label:"Show Time",   val:result.showTime },
                { label:"Seats",       val:result.seats },
                { label:"Amount Paid", val:fmt(result.amount) },
              ].map(f => (
                <div key={f.label}>
                  <p className="text-[10px] uppercase tracking-wider opacity-50">{f.label}</p>
                  <p className="text-sm font-bold text-gray-900">{f.val}</p>
                </div>
              ))}
            </div>
          )}

          <button onClick={reset}
            className={`w-full py-2.5 rounded-xl text-sm font-black border transition
              ${result.valid
                ? "border-green-300 text-green-700 hover:bg-green-100"
                : "border-red-300 text-red-600 hover:bg-red-100"}`}>
            Scan Another Ticket
          </button>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  REQUEST MOVIE TAB  (reuses TheaterOwnerRequestTab logic)
// ══════════════════════════════════════════════════════════════
function RequestMovieTab() {
  // const REQ_API = "http://localhost:8080/api/admin/requests";
  const [form,    setForm]    = useState({ title:"", genre:"", language:"", format:"", director:"", duration:"", releaseDate:"", description:"", cast:"" });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const [errors,  setErrors]  = useState({});

  const validate = f => {
    const e = {};
    if (!f.title.trim())   e.title    = "Title required";
    if (!f.genre.trim())   e.genre    = "Genre required";
    if (!f.language.trim())e.language = "Language required";
    return e;
  };

  useEffect(() => {
    axios.get(`${API.THEATEROWNERREQUEST}/mine`, { headers: auth() })
      .then(r => setHistory((r.data?.content ?? r.data ?? []).filter(x => x.type === "MOVIE")))
      .catch(() => {});
  }, []);

  const set = k => e => {
    const val = e.target.value;
    setForm(p => ({ ...p, [k]: val }));
    if (touched) setErrors(validate({ ...form, [k]: val }));
  };

  const submit = async () => {
    setTouched(true);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      await axios.post(`${API.THEATEROWNERREQUEST}/movie`, form, { headers: auth() });
      toast.success("Movie request submitted!");
      setForm({ title:"",genre:"",language:"",format:"",director:"",duration:"",releaseDate:"",description:"",cast:"" });
      setTouched(false); setErrors({});
      const r = await axios.get(`${API.THEATEROWNERREQUEST}/mine`, { headers: auth() });
      setHistory((r.data?.content ?? r.data ?? []).filter(x => x.type === "MOVIE"));
    } catch { toast.error("Submission failed"); }
    finally { setLoading(false); }
  };

  const inp = k => `w-full border ${errors[k] ? "border-red-400" : "border-gray-200"} rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400 transition`;

  return (
    <div className="p-6 grid lg:grid-cols-2 gap-6">
      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div>
          <h3 className="font-black text-gray-800 text-lg">Request a Movie</h3>
          <p className="text-gray-400 text-sm mt-0.5">Submit a movie to be added to the platform for your shows</p>
        </div>
        <div className="space-y-3">
          <div>
            <input value={form.title} onChange={set("title")} placeholder="Movie title *" className={inp("title")} />
            {errors.title && <p className="text-red-400 text-xs mt-1">⚠ {errors.title}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input value={form.genre} onChange={set("genre")} placeholder="Genre *" className={inp("genre")} />
              {errors.genre && <p className="text-red-400 text-xs mt-1">⚠ {errors.genre}</p>}
            </div>
            <div>
              <input value={form.language} onChange={set("language")} placeholder="Language *" className={inp("language")} />
              {errors.language && <p className="text-red-400 text-xs mt-1">⚠ {errors.language}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input value={form.format} onChange={set("format")} placeholder="Format (2D / 3D / IMAX)" className={inp("format")} />
            <input value={form.duration} onChange={set("duration")} placeholder="Duration (e.g. 2h 30m)" className={inp("duration")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input value={form.director} onChange={set("director")} placeholder="Director" className={inp("director")} />
            <input type="date" value={form.releaseDate} onChange={set("releaseDate")} className={inp("releaseDate")} />
          </div>
          <input value={form.cast} onChange={set("cast")} placeholder="Cast (comma-separated)" className={inp("cast")} />
          <textarea value={form.description} onChange={set("description")} rows={3}
            placeholder="Movie description / synopsis…"
            className={`${inp("description")} resize-none`} />
        </div>
        <button onClick={submit} disabled={loading}
          className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-black text-sm rounded-xl transition">
          {loading ? "Submitting…" : "Submit Movie Request"}
        </button>
      </div>

      {/* History */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h3 className="font-black text-gray-800 text-lg">Request History</h3>
        {history.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-gray-400 text-sm">No requests submitted yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map(r => {
              let payload = {};
              try { payload = JSON.parse(r.payload); } catch {}
              const SC = { PENDING:"bg-yellow-50 text-yellow-700", APPROVED:"bg-green-50 text-green-700", REJECTED:"bg-red-50 text-red-600" };
              return (
                <div key={r.id} className="border border-gray-100 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-gray-800 text-sm">{payload.title ?? r.summary}</p>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${SC[r.status] ?? SC.PENDING}`}>{r.status}</span>
                  </div>
                  <p className="text-gray-400 text-xs">{payload.genre} · {payload.language}</p>
                  {r.reviewNote && <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">Note: {r.reviewNote}</p>}
                  <p className="text-gray-300 text-[11px]">{new Date(r.createdAt).toLocaleDateString("en-IN")}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  SHARED UTILITIES
// ══════════════════════════════════════════════════════════════
function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-violet-100 border-t-violet-600 rounded-full animate-spin" />
    </div>
  );
}
function ErrBox({ text }) {
  return (
    <div className="text-center py-10 text-gray-400">
      <p className="text-3xl mb-2">📭</p>
      <p className="text-sm">{text}</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  ROOT COMPONENT
// ══════════════════════════════════════════════════════════════
export default function PartnerDashboard() {
  const { can } = usePermissions();
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <DashboardLayout role="PARTNER" activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === "overview"  && <OverviewTab />}
      {activeTab === "venues"    && can("VENUE_VIEW") && <VenuesTab />}
      {activeTab === "shows" && can("SHOW_VIEW")     && <ShowsTab />}
      {activeTab === "bookings" && can("BOOKING_VIEW")  && <BookingsTab />}
      {activeTab === "analytics" && <AnalyticsTab />}
      {activeTab === "scanner"   && <ScannerTab />}
      {activeTab === "movies"    && <RequestMovieTab />}
    </DashboardLayout>
  );
}