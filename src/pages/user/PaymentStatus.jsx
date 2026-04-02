import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { confirmPayment } from "../../api/paymentApi";
import { toast } from "react-toastify";
import { getToken } from "../../utils/jwtUtil";
import { API } from "../../config/api";

// const API  = "http://localhost:8080/api";
const auth = () => ({ Authorization: `Bearer ${getToken()}` });

const STATUS_CONFIG = {
  PENDING:  { icon: "⏳", label: "Pending",  pill: "bg-yellow-500/10 text-yellow-400 border-yellow-500/25", dot: "bg-yellow-400 animate-pulse" },
  SUCCESS:  { icon: "✅", label: "Success",  pill: "bg-green-500/10  text-green-400  border-green-500/25",  dot: "bg-green-400"                },
  FAILED:   { icon: "❌", label: "Failed",   pill: "bg-red-500/10   text-red-400   border-red-500/25",      dot: "bg-red-400"                  },
  DECLINED: { icon: "🚫", label: "Declined", pill: "bg-white/5      text-white/30  border-white/10",        dot: "bg-white/20"                 },
};

// Cancels booking + unlocks seats immediately
async function cancelBookingById(bookingId) {
  try {
    await axios.delete(`${API.API_URL}/bookings/${bookingId}/cancel`, { headers: auth() });
  } catch (err) {
    // Ignore 400 (already cancelled/expired) — seats are already free
    if (err?.response?.status !== 400) {
      console.warn("Could not cancel booking:", err?.response?.data);
    }
  }
}

export default function PaymentStatus() {
  // NOTE: "paymentId" in the URL is actually the bookingId
  // (BookingSummary navigates to /payment/${booking.id})
  const { paymentId: bookingId } = useParams();
  const navigate = useNavigate();

  const [loading,   setLoading]   = useState(false);
  const [status,    setStatus]    = useState("PENDING");
  const [animating, setAnimating] = useState(false);
  const [movieId,   setMovieId]   = useState(null);

  // Fetch booking details on mount to get movieId for post-payment navigation
  useEffect(() => {
    axios.get(`${API.API_URL}/bookings/${bookingId}`, { headers: auth() })
      .then(r => {
        const id = r.data?.movieId ?? r.data?.show?.movie?.id ?? null;
        if (id) setMovieId(id);
      })
      .catch(() => {});
  }, [bookingId]);

  // Auto-timeout after 10s — cancel booking so seats free immediately
  useEffect(() => {
    if (status !== "PENDING") return;
    const t = setTimeout(async () => {
      await cancelBookingById(bookingId);
      setStatus("FAILED");
      toast.error("Payment timed out — seats released");
      navigate("/", { replace: true });
    }, 10000);
    return () => clearTimeout(t);
  }, [status, navigate, bookingId]);

  const handleConfirm = async () => {
    if (animating || loading) return;
    try {
      setLoading(true);
      await confirmPayment(bookingId);
      setLoading(false);
      setStatus("SUCCESS");
      toast.success("Payment successful!");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimating(true);
          setTimeout(() => {
            navigate(movieId ? `/events/${movieId}` : "/my-bookings", { replace: true });
          }, 950);
        });
      });
    } catch {
      setLoading(false);
      setStatus("FAILED");
      toast.error("Payment failed");
    }
  };

  // Cancel booking → seats unlock immediately → navigate home
  const handleDecline = async () => {
    setLoading(true);
    await cancelBookingById(bookingId);
    setLoading(false);
    setStatus("DECLINED");
    toast.info("Payment declined — seats released");
    navigate("/", { replace: true });
  };

  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-4">

        {/* ── Header ── */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-1 h-6 bg-red-500 rounded-full shadow shadow-red-500/50" />
            <h2 className="text-2xl font-black text-white">Payment Status</h2>
            <div className="w-1 h-6 bg-red-500 rounded-full shadow shadow-red-500/50" />
          </div>
          <p className="text-white/25 text-sm">
            Payment ID:{" "}
            <span className="font-mono text-white/40">{bookingId}</span>
          </p>
        </div>

        {/* ── Main card ── */}
        <div className="bg-black border border-white/[0.08] rounded-2xl overflow-hidden">

          {/* Status display */}
          <div className="flex flex-col items-center py-10 px-6 border-b border-white/[0.06]">
            <span className="text-6xl mb-5">{cfg.icon}</span>

            <span className={`flex items-center gap-2 text-sm font-black uppercase
                              tracking-widest px-4 py-2 rounded-full border ${cfg.pill}`}>
              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>

            {/* Status message */}
            <p className="mt-4 text-white/40 text-sm text-center">
              {status === "PENDING" && "Awaiting your confirmation…"}
              {status === "SUCCESS" && "Your booking is confirmed!"}
              {status === "FAILED"  && "Something went wrong. Please try again."}
              {status === "DECLINED"&& "You declined the payment."}
            </p>

            {/* Timeout bar — only on PENDING */}
            {status === "PENDING" && (
              <div className="mt-5 w-full max-w-xs">
                <div className="h-1 bg-white/[0.07] rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full
                                  animate-[shrink_10s_linear_forwards]"
                    style={{ animation: "shrink 10s linear forwards" }} />
                </div>
                <p className="text-white/20 text-[10px] text-center mt-1.5">
                  Auto-cancels in 10 seconds
                </p>
              </div>
            )}
          </div>

          {/* ── Actions ── */}
          <div className="px-6 py-6 space-y-3">

            {/* PENDING */}
            {status === "PENDING" && (
              <>
                <button onClick={handleConfirm} disabled={loading || animating}
                  className="relative w-full py-4 rounded-xl font-black text-sm
                             overflow-hidden transition-all text-white
                             bg-red-500 shadow-lg shadow-red-500/25
                             disabled:cursor-not-allowed">
                  {/* Fill layer */}
                  <span
                    className="absolute inset-0 bg-green-500 transition-all duration-[900ms] ease-in-out"
                    style={{ transform: animating ? "translateX(0%)" : "translateX(-100%)" }} />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing…
                      </>
                    ) : animating ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Redirecting…
                      </>
                    ) : "💳 Confirm Payment"}
                  </span>
                </button>

                <button onClick={handleDecline} disabled={loading}
                  className="w-full py-4 rounded-xl font-black text-sm
                             text-white/30 hover:text-white/60 border border-white/[0.07]
                             hover:border-white/20 hover:bg-white/[0.04] transition-all
                             disabled:cursor-not-allowed disabled:opacity-50">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/20 border-t-white/50 rounded-full animate-spin"/>
                      Releasing seats…
                    </span>
                  ) : "Decline Payment"}
                </button>
              </>
            )}

            {/* SUCCESS */}
            {status === "SUCCESS" && (
              <button onClick={() => navigate(movieId ? `/events/${movieId}` : "/my-bookings", { replace: true })}
                className="w-full py-4 rounded-xl font-black text-sm text-white
                           bg-green-500 hover:bg-green-600 transition-all
                           hover:scale-[1.02] shadow-lg shadow-green-500/25">
                🎬 Back to Event
              </button>
            )}

            {/* FAILED */}
            {status === "FAILED" && (
              <>
                <button onClick={handleConfirm} disabled={loading}
                  className="w-full py-4 rounded-xl font-black text-sm text-white
                             bg-red-500 hover:bg-red-600 transition-all
                             hover:scale-[1.02] shadow-lg shadow-red-500/25">
                  {loading ? "Retrying…" : "🔄 Retry Payment"}
                </button>

                <button onClick={() => navigate("/", { replace: true })}
                  className="w-full py-4 rounded-xl font-black text-sm
                             text-white/30 hover:text-white/60 border border-white/[0.07]
                             hover:border-white/20 hover:bg-white/[0.04] transition-all">
                  ← Back to Home
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Keyframe for timeout bar */}
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%;   }
        }
      `}</style>
    </div>
  );
}