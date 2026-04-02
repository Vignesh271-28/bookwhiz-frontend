import { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../../utils/jwtUtil";
import { toast } from "react-toastify";
import Pagination from "../pagenavigation/Pagination";
import { API } from "../../config/api";

// const API  = "http://localhost:8080/api";
const auth = () => ({ Authorization: `Bearer ${getToken()}` });

const adminCancelBooking = (id) =>
  axios.delete(`${API.ADMIN}/bookings/${id}/cancel`, { headers: auth() });

const STATUS_CONFIG = {
  CONFIRMED: { dot: "bg-green-400",  pill: "bg-green-500/10  text-green-400  border-green-500/25"  },
  LOCKED:    { dot: "bg-yellow-400", pill: "bg-yellow-500/10 text-yellow-400 border-yellow-500/25" },
  CANCELLED: { dot: "bg-red-400",    pill: "bg-red-500/10    text-red-400    border-red-500/25"     },
  EXPIRED:   { dot: "bg-white/20",   pill: "bg-white/5       text-white/30   border-white/10"       },
};
const STATUSES = ["ALL", "CONFIRMED", "LOCKED", "CANCELLED", "EXPIRED"];

const fmt = (dt) => dt
  ? new Date(dt).toLocaleString("en-IN", {
      day:"2-digit", month:"short", year:"numeric",
      hour:"2-digit", minute:"2-digit", hour12:true,
    })
  : "—";

export default function AdminBookingsTab() {
  const [bookings,     setBookings]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [acting,       setActing]       = useState(null);
  const [expanded,     setExpanded]     = useState(null);
  const [page,         setPage]         = useState(1);
  const [perPage,      setPerPage]      = useState(10);

  // ── Simple full-fetch — NO ?page/size params sent ────────
  const load = () => {
    setLoading(true);
    axios
      .get(`${API}/admin/bookings`, { headers: auth() })
      .then(r => setBookings(r.data))
      .catch(err => toast.error(err.response?.data?.message ?? "Failed to load bookings"))
      .finally(() => setLoading(false));
      
  };

  useEffect(() => { load(); }, []);

  // ── Client-side filter + page slice ──────────────────────
  const filtered = bookings.filter(b => {
    const q = search.toLowerCase();
    const match =
      String(b.id).includes(q) ||
      (b.userName  ?? "").toLowerCase().includes(q) ||
      (b.userEmail ?? "").toLowerCase().includes(q) ||
      (b.movieTitle ?? "").toLowerCase().includes(q) ||
      (b.venueName  ?? "").toLowerCase().includes(q);
    return match && (statusFilter === "ALL" || b.status === statusFilter);
  });

  const resetPage = () => setPage(1);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // ── Cancel ────────────────────────────────────────────────
  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this booking? This cannot be undone.")) return;
    try {
      setActing(id);
      await adminCancelBooking(id);
      toast.success("Booking cancelled");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed to cancel");
    } finally { setActing(null); }
  };

  // ── Stats across ALL bookings ─────────────────────────────
  const stats = {
    total:     bookings.length,
    confirmed: bookings.filter(b => b.status === "CONFIRMED").length,
    locked:    bookings.filter(b => b.status === "LOCKED").length,
    cancelled: bookings.filter(b => b.status === "CANCELLED").length,
  };

  return (
    <div className="space-y-6">

      {/* Heading */}
      <div className="flex items-center gap-3">
        <div className="w-1 h-7 bg-red-500 rounded-full shadow shadow-red-500/50" />
        <div>
          <h2 className="text-xl font-black text-white">All Bookings</h2>
          <p className="text-white/25 text-xs mt-0.5">View and manage all user bookings</p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:"Total",     value: stats.total,     color:"text-white",      bg:"bg-white/[0.04] border-white/[0.08]"  },
          { label:"Confirmed", value: stats.confirmed, color:"text-green-400",  bg:"bg-green-500/5  border-green-500/20"  },
          { label:"Locked",    value: stats.locked,    color:"text-yellow-400", bg:"bg-yellow-500/5 border-yellow-500/20" },
          { label:"Cancelled", value: stats.cancelled, color:"text-red-400",    bg:"bg-red-500/5    border-red-500/20"    },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border px-5 py-4 ${s.bg}`}>
            <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search + status filter */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-52">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">🔍</span>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); resetPage(); }}
            placeholder="Search by user, movie, venue, ID…"
            className="w-full pl-9 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08]
                       rounded-xl text-white placeholder-white/20 text-sm
                       focus:outline-none focus:ring-2 focus:ring-red-500/30
                       focus:border-red-500/40 transition" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUSES.map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); resetPage(); }}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition
                ${statusFilter === s
                  ? "bg-red-500 text-white shadow-lg shadow-red-500/25"
                  : "bg-white/[0.04] border border-white/[0.08] text-white/40 hover:text-white"}`}>
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 bg-black border border-white/[0.06] rounded-2xl">
          <p className="text-4xl opacity-20 mb-3"></p>
          <p className="text-white/30 font-semibold">No bookings found</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paged.map(booking => {
              const cfg         = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.EXPIRED;
              const seats       = booking.seats?.map(s => s.seatNumber ?? s).filter(Boolean) ?? [];
              const isExpanded  = expanded === booking.id;
              const cancellable = booking.status === "CONFIRMED" || booking.status === "LOCKED";

              return (
                <div key={booking.id}
                  className="bg-black border border-white/[0.07] rounded-2xl overflow-hidden
                             hover:border-red-500/20 transition group">

                  {/* Collapsed row */}
                  <div className="flex items-center gap-4 px-5 py-4 cursor-pointer"
                    onClick={() => setExpanded(isExpanded ? null : booking.id)}>

                    <span className="font-mono text-xs bg-white/[0.06] border border-white/10
                                     text-white/50 px-2 py-0.5 rounded-lg shrink-0">
                      #{booking.id}
                    </span>

                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-xl bg-red-500 flex items-center
                                      justify-center font-black text-white text-xs shrink-0">
                        {(booking.userName ?? "?")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-bold text-sm truncate group-hover:text-red-400 transition">
                          {booking.userName ?? "—"}
                        </p>
                        <p className="text-white/30 text-xs truncate">{booking.userEmail ?? "—"}</p>
                      </div>
                    </div>

                    <div className="hidden sm:block flex-1 min-w-0">
                      <p className="text-white/70 text-sm font-semibold truncate">
                        {booking.movieTitle ?? "—"}
                      </p>
                      <p className="text-white/25 text-xs">
                        {booking.showDate ?? ""} {booking.showTime ?? ""}
                      </p>
                    </div>

                    <div className="hidden md:flex flex-wrap gap-1 max-w-[100px]">
                      {seats.slice(0, 3).map((s, i) => (
                        <span key={i}
                          className="bg-red-500/15 border border-red-500/25
                                     text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {s}
                        </span>
                      ))}
                      {seats.length > 3 && (
                        <span className="text-white/25 text-[10px]">+{seats.length - 3}</span>
                      )}
                    </div>

                    <span className={`flex items-center gap-1.5 text-[10px] font-black
                                      uppercase tracking-widest px-2.5 py-1 rounded-full
                                      border shrink-0 ${cfg.pill}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}
                                        ${booking.status === "LOCKED" ? "animate-pulse" : ""}`} />
                      {booking.status}
                    </span>

                    {cancellable && (
                      <button
                        onClick={e => { e.stopPropagation(); handleCancel(booking.id); }}
                        disabled={acting === booking.id}
                        className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-black transition-all
                          ${acting === booking.id
                            ? "bg-white/[0.04] text-white/20 cursor-not-allowed"
                            : "bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-500/25"}`}>
                        {acting === booking.id ? "…" : "Cancel"}
                      </button>
                    )}

                    <span className={`text-white/20 text-xs transition-transform duration-200
                                      ${isExpanded ? "rotate-180" : ""}`}>▾</span>
                  </div>

                  {/* Expanded detail panel */}
                  {isExpanded && (
                    <div className="border-t border-white/[0.06] px-5 py-4
                                    grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 bg-white/[0.02]">
                      <Detail label="Venue"
                        value={[booking.venueName, booking.venueArea, booking.venueCity]
                          .filter(Boolean).join(", ") || "—"} />
                      <Detail label="Show Time"
                        value={booking.showDate
                          ? `${booking.showDate} · ${booking.showTime}`
                          : "—"} />
                      <Detail label="All Seats"
                        value={seats.length > 0
                          ? <div className="flex flex-wrap gap-1">
                              {seats.map((s, i) => (
                                <span key={i}
                                  className="bg-red-500/15 border border-red-500/25 text-red-400
                                             text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                  {s}
                                </span>
                              ))}
                            </div>
                          : "—"} />
                      <Detail label="Amount"
                        value={booking.totalPrice
                          ? <span className="font-black">₹{Number(booking.totalPrice).toLocaleString("en-IN")}</span>
                          : "—"} />
                      <Detail label="Booked At"  value={fmt(booking.bookingTime)} />
                      <Detail label="Locked At"  value={fmt(booking.lockedAt)} />
                      <Detail label="Confirmed"  value={fmt(booking.confirmedAt)} />
                      <Detail label="Email"
                        value={<span className="text-white/50 text-xs break-all">{booking.userEmail ?? "—"}</span>} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Pagination
            total={filtered.length}
            page={page}
            perPage={perPage}
            onPage={setPage}
            onPerPage={(n) => { setPerPage(n); setPage(1); }}
          />
        </>
      )}
    </div>
  );
}

// ── Detail cell ───────────────────────────────────────────────
function Detail({ label, value }) {
  return (
    <div>
      <p className="text-white/25 text-[10px] font-black uppercase tracking-widest mb-1.5">{label}</p>
      <div className="text-white text-sm font-semibold">{value}</div>
    </div>
  );
}