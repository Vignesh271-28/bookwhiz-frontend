import { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../../utils/jwtUtil";
import { cancelBooking } from "../../api/bookingApi";
import { toast } from "react-toastify";
import Pagination from "../pagenavigation/Pagination";
import { useUndoSnackbar } from "../../layouts/UndoSnackbar";
import { API } from "../../config/api";

// const API  = "http://localhost:8080/api";
const auth = () => ({ Authorization: `Bearer ${getToken()}` });

const isCancellable = (booking) => {
  // LOCKED seats can always be cancelled (user is still deciding / hasn't paid)
  if (booking.status === "LOCKED") return true;
  // CONFIRMED bookings: only within 30 minutes of locking
  if (booking.status === "CONFIRMED") {
    if (!booking.lockedAt) return false;
    return (new Date() - new Date(booking.lockedAt)) / 1000 / 60 <= 30;
  }
  return false;
};

const getCancelTimeRemaining = (booking) => {
  if (booking.status === "LOCKED") return null; // no countdown for LOCKED
  if (!booking.lockedAt) return null;
  const diff = new Date(booking.lockedAt).getTime() + 30 * 60 * 1000 - Date.now();
  if (diff <= 0) return null;
  return `${Math.floor(diff / 60000)}m ${Math.floor((diff / 1000) % 60)}s`;
};

const formatDateTime = (dt) => dt
  ? new Date(dt).toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit", hour12:true })
  : "N/A";

const STATUS_STYLE = {
  CONFIRMED: { dot:"bg-green-400",  pill:"bg-green-500/10  text-green-400  border-green-500/25"  },
  LOCKED:    { dot:"bg-yellow-400", pill:"bg-yellow-500/10 text-yellow-400 border-yellow-500/25" },
  CANCELLED: { dot:"bg-red-400",    pill:"bg-red-500/10    text-red-400    border-red-500/25"     },
  EXPIRED:   { dot:"bg-white/20",   pill:"bg-white/5       text-white/30   border-white/10"       },
};

export default function MyBookings() {
  const [allBookings,  setAllBookings]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [page,         setPage]         = useState(1);
  const [perPage,      setPerPage]      = useState(10);

  // ── Filter state ──────────────────────────────────────────
  const [filterOpen,   setFilterOpen]   = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [movieFilter,  setMovieFilter]  = useState("ALL");
  const [venueFilter,  setVenueFilter]  = useState("ALL");
  const [dateFilter,   setDateFilter]   = useState("ALL");

  const load = () => {
    setLoading(true);
    axios.get(`${API.API_URL}/bookings/my`, { headers: auth() })
      .then(r => setAllBookings(Array.isArray(r.data) ? r.data : []))
      .catch(() => toast.error("Failed to load bookings"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const { showSnackbar: showCancelSnack, SnackbarPortal: CancelSnackbar } = useUndoSnackbar();
  const handleCancel = (bookingId) => {
    const backup = [...allBookings];
    setAllBookings(prev => prev.filter(b => b.id !== bookingId));
    toast.success(`Booking #${bookingId} cancelled`);
    showCancelSnack({
      message: `Booking #${bookingId} cancelled`,
      onUndo:   () => { setAllBookings(backup); toast.info(`Undo — Booking #${bookingId} restored`); },
      onCommit: async () => {
        try { await cancelBooking(bookingId); load(); }
        catch (err) { toast.error(err.response?.data?.message || "Failed to cancel."); setAllBookings(backup); }
      },
    });
  };

  // ── Derived filter options from data ─────────────────────
  const uniqueMovies = [...new Set(allBookings.map(b => b.movieTitle).filter(Boolean))].sort();
  const uniqueVenues = [...new Set(allBookings.map(b => b.venueName).filter(Boolean))].sort();

  const today   = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  const monthAgo= new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

  const filtered = allBookings.filter(b => {
    if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
    if (movieFilter  !== "ALL" && b.movieTitle !== movieFilter) return false;
    if (venueFilter  !== "ALL" && b.venueName  !== venueFilter) return false;
    if (dateFilter === "today" && b.showDate !== today) return false;
    if (dateFilter === "week"  && b.showDate < weekAgo) return false;
    if (dateFilter === "month" && b.showDate < monthAgo) return false;
    return true;
  });

  const activeFilters = [statusFilter, movieFilter, venueFilter, dateFilter].filter(v => v !== "ALL").length;
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  if (loading && allBookings.length === 0) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin mx-auto" />
        <p className="text-white/30 text-sm">Loading your bookings…</p>
      </div>
    </div>
  );

  if (!loading && filtered.length === 0 && allBookings.length === 0) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center">
      <p className="text-6xl opacity-20 mb-4">🎭</p>
      <p className="text-white/40 text-lg font-bold">No bookings yet</p>
      <p className="text-white/20 text-sm mt-1">Book a movie to see it here</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <CancelSnackbar />
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* Title + Filter Button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-7 bg-red-500 rounded-full shadow shadow-red-500/50" />
            <div>
              <h2 className="text-2xl font-black text-white">My Bookings</h2>
              <p className="text-white/25 text-xs mt-0.5">
                {filtered.length} of {allBookings.length} booking{allBookings.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Filter icon */}
          <button onClick={() => setFilterOpen(p => !p)}
            style={{ position:"relative" }}
            className={`flex items-center justify-center w-10 h-10 rounded-xl border transition
              ${filterOpen || activeFilters > 0
                ? "bg-red-500 border-red-500 text-white"
                : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20"}`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            {activeFilters > 0 && (
              <span style={{
                position:"absolute", top:-5, right:-5,
                width:16, height:16, borderRadius:"50%",
                background:"#ef4444", color:"#fff",
                fontSize:9, fontWeight:800,
                display:"flex", alignItems:"center", justifyContent:"center"
              }}>{activeFilters}</span>
            )}
          </button>
        </div>

        {/* ── Slide-in Filter Panel ── */}
        {filterOpen && (
          <div style={{
            position:"fixed", inset:0, zIndex:50,
            display:"flex", justifyContent:"flex-end"
          }}>
            {/* Backdrop */}
            <div onClick={() => setFilterOpen(false)}
              style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(2px)" }} />

            {/* Panel */}
            <div style={{
              position:"relative", width:290, background:"#111", height:"100%",
              boxShadow:"-8px 0 40px rgba(0,0,0,0.5)",
              display:"flex", flexDirection:"column",
              fontFamily:"DM Sans, system-ui, sans-serif",
              animation:"slideIn 0.25s ease-out"
            }}>
              {/* Panel Header */}
              <div style={{
                padding:"20px 20px 14px",
                borderBottom:"1px solid rgba(255,255,255,0.07)",
                display:"flex", alignItems:"center", justifyContent:"space-between"
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                  </svg>
                  <span style={{ fontWeight:800, fontSize:14, color:"#fff" }}>Filter By</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  {activeFilters > 0 && (
                    <button onClick={() => {
                      setStatusFilter("ALL"); setMovieFilter("ALL");
                      setVenueFilter("ALL"); setDateFilter("ALL"); setPage(1);
                    }} style={{ background:"none", border:"none", cursor:"pointer",
                      fontSize:12, color:"#ef4444", fontWeight:600 }}>
                      Clear all
                    </button>
                  )}
                  <button onClick={() => setFilterOpen(false)}
                    style={{ background:"none", border:"none", cursor:"pointer",
                      color:"rgba(255,255,255,0.3)", fontSize:18 }}>✕</button>
                </div>
              </div>

              {/* Sections */}
              <div style={{ flex:1, overflowY:"auto" }}>

                {/* Status */}
                <FilterSection label="Status" icon="📌">
                  {[
                    { val:"ALL",       label:"All Statuses" },
                    { val:"CONFIRMED", label:"✅ Confirmed"  },
                    { val:"LOCKED",    label:"🔒 Locked"     },
                    { val:"CANCELLED", label:"❌ Cancelled"  },
                    { val:"EXPIRED",   label:"⏰ Expired"    },
                  ].map(o => (
                    <FilterOption key={o.val} label={o.label}
                      active={statusFilter === o.val}
                      onClick={() => { setStatusFilter(o.val); setPage(1); }} />
                  ))}
                </FilterSection>

                {/* Movie */}
                <FilterSection label="Movie" icon="🎬">
                  {["ALL", ...uniqueMovies].map(m => (
                    <FilterOption key={m} label={m === "ALL" ? "All Movies" : m}
                      active={movieFilter === m}
                      onClick={() => { setMovieFilter(m); setPage(1); }} />
                  ))}
                </FilterSection>

                {/* Venue */}
                <FilterSection label="Venue" icon="🏛️">
                  {["ALL", ...uniqueVenues].map(v => (
                    <FilterOption key={v} label={v === "ALL" ? "All Venues" : v}
                      active={venueFilter === v}
                      onClick={() => { setVenueFilter(v); setPage(1); }} />
                  ))}
                </FilterSection>

                {/* Show Date */}
                <FilterSection label="Show Date" icon="📅">
                  {[
                    { val:"ALL",   label:"Any Date"      },
                    { val:"today", label:"Today"          },
                    { val:"week",  label:"Last 7 days"    },
                    { val:"month", label:"Last 30 days"   },
                  ].map(o => (
                    <FilterOption key={o.val} label={o.label}
                      active={dateFilter === o.val}
                      onClick={() => { setDateFilter(o.val); setPage(1); }} />
                  ))}
                </FilterSection>
              </div>

              {/* Apply button */}
              <div style={{ padding:"14px 20px", borderTop:"1px solid rgba(255,255,255,0.07)" }}>
                <button onClick={() => setFilterOpen(false)} style={{
                  width:"100%", padding:"11px",
                  background:"linear-gradient(135deg,#ef4444,#dc2626)",
                  border:"none", borderRadius:12,
                  color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer",
                  boxShadow:"0 4px 12px rgba(239,68,68,0.35)"
                }}>
                  Show {filtered.length} Result{filtered.length !== 1 ? "s" : ""}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active filter chips */}
        {activeFilters > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {statusFilter !== "ALL" && (
              <Chip label={statusFilter} onRemove={() => setStatusFilter("ALL")} />
            )}
            {movieFilter !== "ALL" && (
              <Chip label={movieFilter} onRemove={() => setMovieFilter("ALL")} />
            )}
            {venueFilter !== "ALL" && (
              <Chip label={venueFilter} onRemove={() => setVenueFilter("ALL")} />
            )}
            {dateFilter !== "ALL" && (
              <Chip label={dateFilter === "today" ? "Today" : dateFilter === "week" ? "Last 7 days" : "Last 30 days"}
                onRemove={() => setDateFilter("ALL")} />
            )}
          </div>
        )}

        {/* Empty filtered state */}
        {!loading && filtered.length === 0 && allBookings.length > 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3 opacity-30">🔍</p>
            <p className="text-white/40 font-bold">No bookings match your filters</p>
            <button onClick={() => {
              setStatusFilter("ALL"); setMovieFilter("ALL");
              setVenueFilter("ALL"); setDateFilter("ALL");
            }} className="mt-3 text-red-400 text-sm hover:underline">
              Clear filters
            </button>
          </div>
        )}

        {/* List */}
        <div className="space-y-4">
          {paged.map(booking => {
            const style       = STATUS_STYLE[booking.status] ?? STATUS_STYLE.EXPIRED;
            const cancellable = isCancellable(booking);
            const seats       = booking.seats?.map(s => s.seatNumber).filter(Boolean) ?? [];

            return (
              <div key={booking.id}
                className="bg-black border border-white/[0.08] rounded-2xl overflow-hidden
                           hover:border-red-500/20 transition group">

                <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-white/[0.06]">
                  <div>
                    <h3 className="text-white font-black text-base leading-tight group-hover:text-red-400 transition">
                      {booking.movieTitle ?? booking.show?.movie?.title ?? booking.event?.title ?? "N/A"}
                    </h3>
                    <p className="text-white/30 text-xs mt-1"> {booking.userName ?? booking.user?.name ?? "N/A"}</p>
                  </div>
                  <span className={`flex items-center gap-1.5 text-[11px] font-black uppercase
                                    tracking-widest px-3 py-1.5 rounded-full border shrink-0 ml-3 ${style.pill}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot} ${booking.status === "LOCKED" ? "animate-pulse" : ""}`} />
                    {booking.status}
                  </span>
                </div>

                <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <Detail label="Booking ID"
                    value={<span className="font-mono text-xs bg-white/[0.06] border border-white/10 px-2 py-0.5 rounded-lg text-white/60">#{booking.id}</span>} />
                  <Detail label="Seats"
                    value={seats.length > 0
                      ? <div className="flex flex-wrap gap-1">
                          {seats.map((s, i) => (
                            <span key={i} className="bg-red-500/15 border border-red-500/25 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full">{s}</span>
                          ))}
                        </div>
                      : <span className="text-white/30">N/A</span>} />
                  <Detail label="Venue"      value={booking.venueName ?? booking.show?.venue?.name ?? booking.event?.venue?.name ?? "N/A"} />
                  <Detail label="Show Time"  value={booking.showDate ? `${booking.showDate} · ${booking.showTime}` : booking.show?.showDate ? `${booking.show.showDate} · ${booking.show.showTime}` : "N/A"} />
                  <Detail label="Locked At"  value={formatDateTime(booking.lockedAt)} />
                  <Detail label="Booked At"  value={booking.status === "CONFIRMED" ? formatDateTime(booking.confirmedAt ?? booking.lockedAt) : <span className="text-white/25">—</span>} />
                </div>

                {cancellable && (
                  <div className="mx-5 mb-5 flex items-center justify-between bg-yellow-500/[0.07] border border-yellow-500/20 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-yellow-400/60 text-[10px] font-black uppercase tracking-widest mb-0.5">
                        {booking.status === "LOCKED" ? "Seats Locked" : "Cancel Window"}
                      </p>
                      {booking.status === "LOCKED"
                        ? <p className="text-yellow-400 text-sm font-bold">⚠️ Unpaid — cancel anytime</p>
                        : <p className="text-yellow-400 text-sm font-bold">⏱ {getCancelTimeRemaining(booking)} remaining</p>
                      }
                    </div>
                    <button onClick={() => handleCancel(booking.id)} disabled={cancellingId === booking.id}
                      className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all shrink-0
                        ${cancellingId === booking.id
                          ? "bg-white/[0.05] text-white/20 cursor-not-allowed"
                          : "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25 hover:scale-105"}`}>
                      {cancellingId === booking.id ? "Cancelling…" : "Cancel Ticket"}
                    </button>
                  </div>
                )}

                {booking.status === "CONFIRMED" && !cancellable && (
                  <div className="px-5 pb-4">
                    <p className="text-green-400/60 text-xs font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      Ticket confirmed — cancellation window closed
                    </p>
                  </div>
                )}
                {booking.status === "CANCELLED" && (
                  <div className="px-5 pb-4">
                    <p className="text-red-400/50 text-xs font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      This booking was cancelled
                    </p>
                  </div>
                )}
                {booking.status === "EXPIRED" && (
                  <div className="px-5 pb-4">
                    <p className="text-white/20 text-xs font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                      Booking expired before payment
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        <Pagination
          total={allBookings.length}
          page={page}
          perPage={perPage}
          onPage={setPage}
          onPerPage={(n) => { setPerPage(n); setPage(1); }} />
      </div>
    </div>
  );
}


// ── FilterSection helper ─────────────────────────────────────────
function FilterSection({ label, icon, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
      <button onClick={() => setOpen(p => !p)} style={{
        width:"100%", padding:"12px 20px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        background:"none", border:"none", cursor:"pointer"
      }}>
        <span style={{ display:"flex", alignItems:"center", gap:7,
          fontWeight:700, fontSize:13, color:"#fff" }}>
          <span>{icon}</span>{label}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="rgba(255,255,255,0.3)" strokeWidth="2.5"
          style={{ transform: open ? "rotate(0)" : "rotate(-90deg)", transition:"0.2s" }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && <div style={{ padding:"0 20px 10px" }}>{children}</div>}
    </div>
  );
}

// ── FilterOption helper ──────────────────────────────────────────
function FilterOption({ label, active, onClick }) {
  return (
    <label onClick={onClick} style={{
      display:"flex", alignItems:"center", gap:10,
      padding:"6px 0", cursor:"pointer"
    }}>
      <div style={{
        width:17, height:17, borderRadius:5, flexShrink:0,
        border: active ? "none" : "2px solid rgba(255,255,255,0.15)",
        background: active ? "#ef4444" : "transparent",
        display:"flex", alignItems:"center", justifyContent:"center",
        transition:"all 0.15s"
      }}>
        {active && (
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
            <polyline points="2 6 5 9 10 3" stroke="#fff" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <span style={{
        fontSize:13, color: active ? "#ef4444" : "rgba(255,255,255,0.5)",
        fontWeight: active ? 600 : 400
      }}>{label}</span>
    </label>
  );
}

// ── Active filter chip ───────────────────────────────────────────
function Chip({ label, onRemove }) {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:6,
      background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.3)",
      borderRadius:20, padding:"4px 10px",
      fontSize:12, color:"#ef4444", fontWeight:600
    }}>
      {label}
      <button onClick={onRemove} style={{
        background:"none", border:"none", cursor:"pointer",
        color:"rgba(239,68,68,0.6)", fontSize:13, lineHeight:1, padding:0
      }}>✕</button>
    </span>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-white/25 text-[10px] font-black uppercase tracking-widest mb-1.5">{label}</p>
      <div className="text-white text-sm font-semibold">{value}</div>
    </div>
  );
}