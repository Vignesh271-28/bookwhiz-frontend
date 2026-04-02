import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SeatGrid from "../../components/seat/SeatGrid";
import { lockSeats } from "../../api/bookingApi";
import { fetchSeatState } from "../../api/seatApi";
import { toast } from "react-toastify";
import { connectSeatSocket, disconnectSeatSocket } from "../../websocket/seatSocket";
import { useAuth } from "../../auth/useAuth";
import axios from "axios";
import { getToken } from "../../utils/jwtUtil";
import { API } from "../../config/api";

export default function SeatSelection() {
  const { showId }  = useParams();
  const navigate    = useNavigate();
  const { user }    = useAuth();
  const currentUserId = user?.id;

  const [showInfo,      setShowInfo]      = useState(null);   // venueId, movieTitle, etc.
  const [seats,         setSeats]         = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loadingShow,   setLoadingShow]   = useState(true);   // loading show details
  const [seatsError,    setSeatsError]    = useState(false);  // seat fetch failed
  const [loading,       setLoading]       = useState(false);  // loading lock button

  // ── Step 1: Fetch show details to get the REAL venueId ────
  useEffect(() => {
    setLoadingShow(true);
    axios.get(`${API.API_URL}/user/shows/${showId}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
      .then(res => {
        setShowInfo(res.data);
      })
      .catch(err => {
        console.error("Failed to fetch show details:", err);
        toast.error("Could not load show details.");
      })
      .finally(() => setLoadingShow(false));
  }, [showId]);

  // ── Step 2: Once showInfo is ready, load seats for real venueId ──
  const loadSeats = (venueId) => {
    setSeatsError(false);
    fetchSeatState(venueId, showId)
      .then(res => {
        // Backend may return {error, seats:[]} or a plain array
        const raw = Array.isArray(res.data) ? res.data : (res.data?.seats ?? []);
        if (!Array.isArray(res.data) && res.data?.error === "NO_SEATS") {
          setSeatsError("NO_SEATS");
          return;
        }
        setSeats(raw.map(seat => ({
          id:         seat.seatId,   // used by lockSeats API
          seatId:     seat.seatId,   // used by SeatGrid selection
          seatNumber: seat.seatNumber,
          rowLabel:   seat.rowLabel  ?? "",
          category:   seat.category  ?? "REGULAR",
          booked:     seat.booked    ?? false,
          locked:     seat.locked    ?? false,
          lockedBy:   seat.lockedBy  ?? null,
          virtual:    seat.virtual   ?? false,
        })));
      })
      .catch(err => { console.error("Failed to fetch seats:", err); setSeatsError(true); });
  };

  useEffect(() => {
    if (showInfo?.venueId) {
      loadSeats(showInfo.venueId);
    }
  }, [showInfo]);

  // ── Live WebSocket updates ────────────────────────────────
  useEffect(() => {
    connectSeatSocket(showId, (data) => {
      setSeats(prev => prev.map(seat => {
        if (seat.id !== data.seatId) return seat;
        if (data.status === "LOCKED")   return { ...seat, locked: true,  lockedBy: data.userId };
        if (data.status === "UNLOCKED") return { ...seat, locked: false, lockedBy: null };
        if (data.status === "BOOKED")   return { ...seat, booked: true,  locked: false, lockedBy: null };
        return seat;
      }));
    });
    return () => disconnectSeatSocket();
  }, [showId]);

  // ── Lock seats ────────────────────────────────────────────
  const handleLockSeats = async () => {
    if (selectedSeats.length === 0) {
      toast.error("Select at least one seat");
      return;
    }

    const alreadyBooked = selectedSeats.filter(s => s.booked);
    if (alreadyBooked.length > 0) {
      toast.error(`Seat ${alreadyBooked.map(s => s.seatNumber || s.id).join(", ")} is already booked.`);
      setSelectedSeats(prev => prev.filter(s => !s.booked));
      return;
    }

    const lockedByOther = selectedSeats.filter(s => s.locked && s.lockedBy !== currentUserId);
    if (lockedByOther.length > 0) {
      toast.error(`Seat ${lockedByOther.map(s => s.seatNumber || s.id).join(", ")} is locked by another user.`);
      setSelectedSeats(prev => prev.filter(s => !(s.locked && s.lockedBy !== currentUserId)));
      return;
    }

    try {
      setLoading(true);
      const seatIds = selectedSeats.map(s => s.id);
      const res = await lockSeats(showId, seatIds);
      navigate(`/booking/${res.data.id}`, { replace: true });
    } catch (err) {
      const status  = err?.response?.status;
      const message = (err?.response?.data?.message || err?.response?.data || "").toString().toLowerCase();
      if (status === 409) {
        toast.error(message.includes("booked")
          ? "One or more seats are already booked."
          : "One or more seats are locked by another user.");
      } else {
        toast.error("Failed to lock seats. Please try again.");
      }
      if (showInfo?.venueId) loadSeats(showInfo.venueId);
      setSelectedSeats([]);
    } finally {
      setLoading(false);
    }
  };

  const totalSelected = selectedSeats.length;

  // ── Loading state ──────────────────────────────────────────
  if (loadingShow) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
          <p className="text-white/30 text-sm font-semibold">Loading show…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* ── Page Header ── */}
      <div className="bg-black border-b border-white/[0.07]">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center gap-4">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/10
                       text-white/50 hover:text-white hover:bg-white/10
                       flex items-center justify-center text-sm transition shrink-0">
            ←
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-red-500 rounded-full shadow shadow-red-500/50 shrink-0" />
              <h2 className="text-lg font-black text-white truncate">
                {showInfo?.movieTitle ?? "Select Seats"}
              </h2>
            </div>
            {showInfo && (
              <p className="text-white/30 text-xs mt-0.5 ml-3 truncate">
                🏛️ {showInfo.venueName}
                {showInfo.venueCity ? ` · ${showInfo.venueCity}` : ""}
                {showInfo.showDate  ? ` · ${showInfo.showDate}`  : ""}
                {showInfo.showTime  ? ` at ${showInfo.showTime}` : ""}
                {showInfo.price     ? ` · ₹${showInfo.price}`   : ""}
              </p>
            )}
          </div>
        </div>
      </div>



      {/* ── Main content ── */}
      <div className="max-w-6xl mx-auto px-6 py-6 pb-32">
        <div className="bg-black border border-white/[0.07] rounded-2xl p-6
                        hover:border-red-500/20 transition">

          {seatsError ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <p className="text-3xl opacity-40">⚠️</p>
              <p className="text-white/40 font-semibold text-sm">Failed to load seats</p>
              <button
                onClick={() => { setSeatsError(false); if (showInfo?.venueId) loadSeats(showInfo.venueId); }}
                className="text-red-400 text-xs hover:underline mt-1">
                Try again
              </button>
            </div>
          ) : seats.length === 0 && seatsError !== "NO_SEATS" ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-red-500/30 border-t-red-500
                              rounded-full animate-spin mb-3" />
              <p className="text-white/30 text-sm">Loading seats…</p>
            </div>
          ) : seatsError === "NO_SEATS" ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <p className="text-3xl opacity-30">🪑</p>
              <p className="text-white/40 font-semibold text-sm">No seats configured for this venue</p>
              <p className="text-white/20 text-xs">Contact the admin to set up seats for this show</p>
            </div>
          ) : (
            <SeatGrid
              seats={seats}
              currentUserId={currentUserId}
              basePrice={showInfo?.price ?? 100}
              onSelectionChange={(newSelected) =>
                setSelectedSeats(
                  newSelected.filter(
                    s => !s.booked && !(s.locked && s.lockedBy !== currentUserId)
                  )
                )
              }
            />
          )}
        </div>
      </div>

      {/* ── Fixed Bottom Bar ── */}
      <div className="fixed bottom-0 inset-x-0 z-50 bg-black border-t border-white/[0.08]"
           style={{ boxShadow: "0 -8px 32px rgba(0,0,0,0.6)" }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">

          <div className="min-w-0">
            <p className="text-white/25 text-xs font-black uppercase tracking-widest mb-1">
              {totalSelected > 0 ? `${totalSelected} Seat${totalSelected > 1 ? "s" : ""} Selected` : "No seats selected"}
            </p>
            {totalSelected > 0 ? (
              <div className="flex items-center gap-2 flex-wrap">
                {selectedSeats.map(s => (
                  <span key={s.id}
                    className="bg-red-500/15 border border-red-500/30
                               text-red-400 text-xs font-bold px-2 py-0.5 rounded-full">
                    {s.seatNumber || s.id}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-white/20 text-xs">Pick seats from the grid above</p>
            )}
          </div>

          <button
            onClick={handleLockSeats}
            disabled={loading || totalSelected === 0}
            className={`flex items-center gap-2 px-8 py-3.5 rounded-xl
                        font-black text-sm transition-all shrink-0
              ${loading || totalSelected === 0
                ? "bg-white/[0.05] text-white/20 cursor-not-allowed border border-white/[0.06]"
                : "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 hover:scale-105"}`}>
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white
                                 rounded-full animate-spin" />
                Locking…
              </>
            ) : (
              <>Lock {totalSelected > 0 ? `${totalSelected} Seat${totalSelected > 1 ? "s" : ""}` : "Seats"}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}