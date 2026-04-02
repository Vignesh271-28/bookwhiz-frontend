import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { initiatePayment } from "../../api/paymentApi";
import { toast } from "react-toastify";
import axios from "axios";
import { getToken } from "../../utils/jwtUtil";
import { API } from "../../config/api";


// const API  = "http://localhost:8080/api";
const auth = () => ({ Authorization: `Bearer ${getToken()}` });

const fetchBooking = (id) =>
  axios.get(`${API.BOOKINGS}/${id}`, { headers: auth() });

const formatLockTime = (lockedAt) => {
  if (!lockedAt) return null;
  const expiry = new Date(new Date(lockedAt).getTime() + 30 * 60 * 1000);
  return expiry.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

const formatDateTime = (dt) => {
  if (!dt) return null;
  return new Date(dt).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

export default function BookingSummary() {
  const { bookingId } = useParams();
  const navigate      = useNavigate();

  const [booking,   setBooking]   = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [loadB,     setLoadB]     = useState(true);
  const [animating, setAnimating] = useState(false); // fill animation active

  useEffect(() => {
    fetchBooking(bookingId)
      .then(r => setBooking(r.data))
      .catch(() => toast.error("Failed to load booking details"))
      .finally(() => setLoadB(false));
  }, [bookingId]);

  const handlePayment = async () => {
    if (animating || loading) return;
    try {
      setLoading(true);
      const res = await initiatePayment(bookingId);
      setLoading(false);
      // Wait two frames so browser paints translateX(-100%) before animating
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimating(true);
          setTimeout(() => {
            navigate(`/payment/${res.data.id}`, { replace: true });
          }, 950);
        });
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment initiation failed");
      setLoading(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────
  if (loadB) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border-4 border-red-500/20 border-t-red-500
                        rounded-full animate-spin mx-auto" />
        <p className="text-white/30 text-sm">Loading booking details…</p>
      </div>
    </div>
  );

  // ── Not found ─────────────────────────────────────────────
  if (!booking) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
      <div className="text-center space-y-3">
        <p className="text-5xl opacity-20"></p>
        <p className="text-lg font-bold">Booking not found</p>
        <button onClick={() => navigate(-1)}
          className="text-red-400 underline text-sm">← Go back</button>
      </div>
    </div>
  );

  // ── Derive display values ─────────────────────────────────
  const movieTitle = booking?.movieTitle  ?? booking?.show?.movie?.title  ?? "—";
  const venueName  = booking?.venueName   ?? booking?.show?.venue?.name   ?? "—";
  const venueArea  = booking?.venueArea   ?? booking?.show?.venue?.area   ?? null;
  const venueCity  = booking?.venueCity   ?? booking?.show?.venue?.city   ?? null;
  const showTime   = booking?.showTime    ?? booking?.show?.showTime      ?? "—";
  const showDate   = booking?.showDate    ?? booking?.show?.showDate      ?? null;
  const userName   = booking?.userName    ?? booking?.user?.name          ?? "—";
  const seatList   = booking?.seats ?? booking?.seatNumbers ?? [];
  // Category multipliers matching SeatGrid.jsx
  const MULTIPLIERS = { REGULAR: 1.0, PREMIUM: 1.5, VIP: 2.0, COUPLE: 2.5 };
  const basePrice   = booking?.showPrice ?? booking?.show?.price ?? 0;
  // Prefer stored totalPrice; recalculate from seats+multipliers if missing/zero
  const calcPrice = Array.isArray(seatList) && seatList.length > 0 && basePrice
    ? seatList.reduce((sum, s) => {
        const cat = (s.category ?? s.seatType ?? "REGULAR").toUpperCase();
        return sum + Math.round(basePrice * (MULTIPLIERS[cat] ?? 1.0));
      }, 0)
    : null;
  const price = (booking?.totalPrice && Number(booking.totalPrice) > 0)
    ? Number(booking.totalPrice)
    : (calcPrice ?? null);
  const seatCount  = Array.isArray(seatList) ? seatList.length : 1;
  const lockedAt   = booking?.lockedAt ?? booking?.createdAt ?? null;
  const expiresAt  = formatLockTime(lockedAt);
  const lockedTime = formatDateTime(lockedAt);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-4">

        {/* ── Header ── */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-1 h-6 bg-red-500 rounded-full shadow shadow-red-500/50" />
            <h2 className="text-2xl font-black text-white">Booking Summary</h2>
            <div className="w-1 h-6 bg-red-500 rounded-full shadow shadow-red-500/50" />
          </div>
          <p className="text-white/30 text-sm">Review your booking before payment</p>
        </div>

        {/* ── Main card ── */}
        <div className="bg-black border border-white/[0.08] rounded-2xl overflow-hidden">

          {/* Movie banner */}
          <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-4">
            <p className="text-red-400 text-[10px] font-black uppercase
                          tracking-widest mb-1">Movie</p>
            <h3 className="text-white font-black text-xl leading-tight">
              {movieTitle}
            </h3>
          </div>

          {/* Details */}
          <div className="px-6 py-5 space-y-0 divide-y divide-white/[0.05]">
            <Row label="Booking ID"
              value={
                <span className="font-mono text-xs bg-white/[0.06]
                                 border border-white/10 px-2 py-0.5
                                 rounded-lg text-white/70">
                  #{bookingId}
                </span>
              } />
            <Row label="Status"
              value={
                <span className="flex items-center gap-1.5 text-yellow-400 font-black">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                  LOCKED
                </span>
              } />
            <Row label="Customer"   value={userName} />
            <Row label="Venue"
              value={
                <span className="text-right">
                  <span className="text-white font-semibold">{venueName}</span>
                  {(venueArea || venueCity) && (
                    <span className="block text-white/35 text-xs mt-0.5">
                      📍 {[venueArea, venueCity].filter(Boolean).join(", ")}
                    </span>
                  )}
                </span>
              } />
            <Row label="Show Time"
              value={
                <span className="text-right">
                  <span className="text-white font-semibold">{showTime}</span>
                  {showDate && (
                    <span className="block text-white/35 text-xs mt-0.5">{showDate}</span>
                  )}
                </span>
              } />
            <Row label="Seats"
              value={
                <div className="flex flex-wrap justify-end gap-1.5 max-w-[200px]">
                  {Array.isArray(seatList) && seatList.length > 0
                    ? seatList.map((s, i) => (
                        <span key={i}
                          className="bg-red-500/15 border border-red-500/30
                                     text-red-400 text-xs font-bold
                                     px-2 py-0.5 rounded-full">
                          {s.seatNumber ?? s.label ?? s}
                        </span>
                      ))
                    : <span className="text-white/50 text-sm">—</span>
                  }
                </div>
              } />
            {lockedTime && <Row label="Locked At" value={lockedTime} dim />}
            {expiresAt  && (
              <Row label="Expires At"
                value={
                  <span className="text-orange-400 font-bold text-sm">
                    ⏱ {expiresAt}
                  </span>
                } />
            )}
          </div>

          {/* Price */}
          {price !== null && price !== undefined && (
            <div className="mx-6 mb-5 bg-red-500/10 border border-red-500/20
                            rounded-2xl px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">
                  Total Amount
                </p>
                <p className="text-white/40 text-xs mt-0.5">
                  {seatCount} seat{seatCount > 1 ? "s" : ""}
                </p>
              </div>
              <p className="text-white font-black text-3xl">
                ₹{Number(price).toLocaleString("en-IN")}
              </p>
            </div>
          )}

          {/* ── CTA Button with fill animation ── */}
          <div className="px-6 pb-6">
            <button
              onClick={handlePayment}
              disabled={loading || animating}
              className="relative w-full py-4 rounded-xl font-black text-sm
                         overflow-hidden transition-all text-white
                         bg-red-500 shadow-lg shadow-red-500/25
                         disabled:cursor-not-allowed">

              {/* Fill layer — slides in from left on animating */}
              <span
                className="absolute inset-0 bg-green-500 transition-all duration-[900ms] ease-in-out"
                style={{
                  transform: animating ? "translateX(0%)" : "translateX(-100%)",
                }} />

              {/* Label */}
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white
                                     rounded-full animate-spin" />
                    Initiating…
                  </>
                ) : animating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white
                                     rounded-full animate-spin" />
                    Redirecting…
                  </>
                ) : (
                  "💳 Proceed to Payment"
                )}
              </span>
            </button>

            <p className="text-white/20 text-xs text-center mt-4">
              Seats are held for 30 minutes. Complete payment to confirm.
            </p>
          </div>
        </div>

        {/* Back */}
        <div className="text-center">
          <button onClick={() => navigate(-1)}
            className="text-white/25 hover:text-white/50 text-sm transition">
            ← Go back
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Row helper ────────────────────────────────────────────────
function Row({ label, value, dim = false }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5">
      <span className={`text-xs font-black uppercase tracking-widest shrink-0
                        ${dim ? "text-white/20" : "text-white/30"}`}>
        {label}
      </span>
      <span className={`text-sm font-semibold text-right
                        ${dim ? "text-white/30" : "text-white"}`}>
        {value}
      </span>
    </div>
  );
}