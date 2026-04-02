import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { fetchShowsByMovie } from "../../api/ShowApi";
import { getToken, getUserFromToken } from "../../utils/jwtUtil";
import { toast } from "react-toastify";
import { API }  from "../../config/api";

// const API  = "http://localhost:8080/api";
const auth = () => ({ Authorization: `Bearer ${getToken()}` });

const fetchMovie   = (id) => axios.get(`${API.API_URL}/user/movies/${id}`,   { headers: auth() });
const fetchReviews = (id) => axios.get(`${API.API_URL}/reviews/movie/${id}`, { headers: auth() });
const postReview   = (d)  => axios.post(`${API.API_URL}/reviews`, d,         { headers: auth() });
const deleteReview = (id) => axios.delete(`${API.API_URL}/reviews/${id}`,    { headers: auth() });

const groupByTheatre = (shows) => {
  const map = {};
  shows.forEach(show => {
    // venue is a nested object: { id, name, city, area }
    // showTime is already "HH:mm" string from the fixed backend
    const venueName = show.venue?.name ?? "Unknown Theatre";
    if (!map[venueName]) map[venueName] = {
      name: venueName,
      area: show.venue?.area ?? "",
      city: show.venue?.city ?? "",
      shows: [],
    };
    map[venueName].shows.push(show);
  });
  return Object.values(map);
};

// Format "18:30:00" → "06:30 PM"  or  "18:30" → "06:30 PM"
const fmtTime = (t) => {
  if (!t || typeof t !== "string") return String(t ?? "");
  const parts = t.split(":");
  if (parts.length < 2) return t;
  let h = parseInt(parts[0], 10);
  const m = parts[1].padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
};
const avgRating = (list) =>
  list.length ? +(list.reduce((s, r) => s + (r.rating ?? 0), 0) / list.length).toFixed(1) : 0;

const getGenreColor = (genre) => {
  const g = (genre ?? "").toUpperCase();
  if (g.includes("ACTION"))   return "bg-orange-500 text-white";
  if (g.includes("DRAMA"))    return "bg-purple-500 text-white";
  if (g.includes("COMEDY"))   return "bg-yellow-400 text-gray-900";
  if (g.includes("SPORTS"))   return "bg-green-500  text-white";
  if (g.includes("LIVE"))     return "bg-pink-500   text-white";
  if (g.includes("HORROR"))   return "bg-gray-700   text-white";
  if (g.includes("ROMANCE"))  return "bg-rose-500   text-white";
  if (g.includes("THRILLER")) return "bg-slate-600  text-white";
  return "bg-red-500 text-white";
};

// ── Stars ─────────────────────────────────────────────────────
function Stars({ value = 0, onChange, size = "md" }) {
  const [hov, setHov] = useState(0);
  const sz = { sm: "text-base", md: "text-xl", lg: "text-3xl" }[size];
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <button key={i} type="button"
          onClick={() => onChange?.(i)}
          onMouseEnter={() => onChange && setHov(i)}
          onMouseLeave={() => onChange && setHov(0)}
          className={`${sz} leading-none transition-transform
            ${onChange ? "cursor-pointer hover:scale-125" : "cursor-default"}
            ${i <= (hov || value) ? "text-red-500" : "text-white/15"}`}>
          ★
        </button>
      ))}
    </div>
  );
}

const RATING_LABEL = ["","Terrible 😞","Poor 😕","Okay 😐","Good 😊","Excellent 🤩"];

// ════════════════════════════════════════════════════════════
export default function EventDetails() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const me       = getUserFromToken();

  const [movie,   setMovie]   = useState(null);
  const [shows,   setShows]   = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loadM,   setLoadM]   = useState(true);
  const [loadR,   setLoadR]   = useState(true);
  const [rating,  setRating]  = useState(0);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);

  const storedCity = localStorage.getItem("selectedCity") || "";
  const [cityFilter,   setCityFilter]   = useState(storedCity);
  const [selectedDate, setSelectedDate] = useState("");  // "" = not yet set; auto-set after shows load

  useEffect(() => {
    Promise.all([fetchMovie(id), fetchShowsByMovie(id)])
      .then(([mRes, sRes]) => {
        setMovie(mRes.data);
        const loadedShows = sRes.data ?? [];
        setShows(loadedShows);
        // Auto-select the first upcoming date
        const todayStr = new Date().toISOString().split("T")[0];
        const nowTime  = new Date().toTimeString().slice(0, 5); // "HH:MM"
        const dates = [...new Set(loadedShows.map(s => s.showDate).filter(Boolean))]
          .filter(d => {
            if (d > todayStr) return true;           // future date — always show
            if (d < todayStr) return false;          // past date — hide
            // today — only show if at least one show time hasn't passed
            return loadedShows.some(s => s.showDate === d && s.showTime >= nowTime);
          })
          .sort();
        if (dates.length > 0) setSelectedDate(dates[0]);
      })
      .catch(() => toast.error("Failed to load movie details"))
      .finally(() => setLoadM(false));
    loadReviews();
  }, [id]);

  const loadReviews = () => {
    setLoadR(true);
    fetchReviews(id)
      .then(r => setReviews(r.data ?? []))
      .catch(() => setReviews([]))
      .finally(() => setLoadR(false));
  };

  const submitReview = async () => {
    if (!getToken())     { toast.error("Please login to review"); return; }
    if (!rating)         { toast.error("Select a star rating"); return; }
    if (!comment.trim()) { toast.error("Write a comment"); return; }
    try {
      setPosting(true);
      await postReview({ movieId: Number(id), rating, comment: comment.trim() });
      toast.success("Review submitted!");
      setRating(0); setComment("");
      loadReviews();
    } catch (e) {
      toast.error(e.response?.data?.message ?? "Failed to submit");
    } finally { setPosting(false); }
  };

  const removeReview = async (reviewId) => {
    if (!window.confirm("Delete your review?")) return;
    try { await deleteReview(reviewId); toast.success("Deleted"); loadReviews(); }
    catch { toast.error("Failed to delete"); }
  };

  // ── Loading ───────────────────────────────────────────────
  if (loadM) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border-4 border-red-500/20 border-t-red-500
                        rounded-full animate-spin mx-auto" />
        <p className="text-white/30 text-sm">Loading...</p>
      </div>
    </div>
  );

  if (!movie) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white">
      <div className="text-center space-y-3">
        <p className="text-6xl opacity-20">🎬</p>
        <p className="text-xl font-bold">Movie not found</p>
        <button onClick={() => navigate(-1)}
          className="text-red-400 underline text-sm">← Go back</button>
      </div>
    </div>
  );

  const avg      = avgRating(reviews);
  const todayDate  = new Date().toISOString().split("T")[0];
  const nowTime     = new Date().toTimeString().slice(0, 5); // "HH:MM"
  const uniqueDates = [...new Set(shows.map(s => s.showDate).filter(Boolean))]
    .filter(d => {
      if (d > todayDate) return true;
      if (d < todayDate) return false;
      return shows.some(s => s.showDate === d && s.showTime >= nowTime);
    })
    .sort();

  // Shows for the selected date (all dates if none selected)
  const showsForDate = selectedDate
    ? shows.filter(s => {
        if (s.showDate !== selectedDate) return false;
        if (s.showDate === todayDate && s.showTime < nowTime) return false; // past time today
        return true;
      })
    : shows;

  const allTheatres  = groupByTheatre(showsForDate);
  const uniqueCities = [...new Set(showsForDate.map(s => s.venue?.city).filter(Boolean))].sort();
  const theatres     = cityFilter
    ? allTheatres.filter(t => t.city.toLowerCase() === cityFilter.toLowerCase())
    : allTheatres;
  const cast     = movie.cast ? movie.cast.split(",").map(s => s.trim()).filter(Boolean) : [];
  const genre    = movie.genre ?? movie.type ?? movie.category ?? "";
  const dist     = [5,4,3,2,1].map(star => {
    const count = reviews.filter(r => r.rating === star).length;
    return { star, count, pct: reviews.length ? (count / reviews.length) * 100 : 0 };
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* ══════════════════════════════════════════════
          HERO — centred poster + blurred bg
      ══════════════════════════════════════════════ */}
      <div className="relative overflow-hidden bg-black">

        {/* Blurred poster as full-width background */}
        {movie.posterUrl && (
          <>
            <img src={movie.posterUrl} alt=""
              className="absolute inset-0 w-full h-full object-cover
                         scale-110 blur-3xl opacity-20 pointer-events-none" />
            <div className="absolute inset-0 bg-black/70" />
          </>
        )}

        {/* Red glow if no poster */}
        {!movie.posterUrl && (
          <div className="absolute inset-0 bg-gradient-to-br from-red-950/40
                          via-black to-black" />
        )}

        {/* Bottom fade into page */}
        <div className="absolute bottom-0 inset-x-0 h-32
                        bg-gradient-to-t from-gray-950 to-transparent" />

        {/* Back button */}
        <button onClick={() => navigate(-1)}
          className="absolute top-6 left-6 z-10 flex items-center gap-2
                     bg-white/[0.07] hover:bg-white/[0.12] border border-white/10
                     text-white/70 hover:text-white px-4 py-2 rounded-full
                     text-sm font-semibold transition backdrop-blur-sm">
          ← Back
        </button>

        {/* ── Hero content — centered ── */}
        <div className="relative z-10 flex flex-col items-center
                        text-center px-6 pt-16 pb-12 max-w-4xl mx-auto">

          {/* Poster card — centred */}
          <div className="w-44 md:w-56 rounded-2xl overflow-hidden shadow-2xl
                          border border-white/10 ring-1 ring-red-500/30 mb-8
                          shadow-red-500/10">
            {movie.posterUrl ? (
              <img src={movie.posterUrl} alt={movie.title}
                className="w-full aspect-[2/3] object-cover" />
            ) : (
              <div className="w-full aspect-[2/3] bg-gray-900 border border-white/[0.07]
                              flex flex-col items-center justify-center gap-3">
                <span className="text-5xl opacity-20">🎬</span>
                <p className="text-white/15 text-[10px] font-black
                              uppercase tracking-widest">No Poster</p>
              </div>
            )}
          </div>

          {/* Genre badge */}
          {genre && (
            <span className={`text-xs font-black px-3 py-1 rounded-full
                             uppercase tracking-widest mb-4 ${getGenreColor(genre)}`}>
              {genre}
            </span>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-5xl font-black leading-tight
                         tracking-tight mb-4">
            {movie.title}
          </h1>

          {/* Meta pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-5">
            {[
              movie.language    && { label: movie.language,          icon: "🌐" },
              movie.format      && { label: movie.format,            icon: "📽️" },
              movie.duration    && { label: movie.duration,          icon: "⏱"  },
              movie.releaseDate && { label: movie.releaseDate,       icon: "📅" },
              movie.rating      && { label: `Rated ${movie.rating}`, icon: "🔞" },
            ].filter(Boolean).map((m, i) => (
              <span key={i}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs
                           font-semibold rounded-full bg-white/[0.07]
                           border border-white/10 text-white/70">
                {m.icon} {m.label}
              </span>
            ))}
          </div>

          {/* Avg rating */}
          {reviews.length > 0 && (
            <div className="flex items-center justify-center gap-3 mb-6">
              <Stars value={Math.round(avg)} size="sm" />
              <span className="text-red-400 font-black text-lg">{avg}</span>
              <span className="text-white/30 text-sm">
                ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
              </span>
            </div>
          )}

          {/* Book CTA */}
          <button
            onClick={() =>
              document.getElementById("show-timings")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="inline-flex items-center gap-3 bg-red-500 hover:bg-red-600
                       text-white font-black px-10 py-4 rounded-2xl text-base
                       transition-all hover:scale-105 shadow-2xl shadow-red-500/30">
             Book Tickets ↓
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════════ */}
      <div className="max-w-5xl mx-auto px-6 md:px-12 py-14 space-y-16">

        {/* ── Movie details ── */}
        <section>
          <Divider title="Movie Details" icon="🎬" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-6">
            {[
              { label: "Language",    value: movie.language    },
              { label: "Format",      value: movie.format      },
              { label: "Duration",    value: movie.duration    },
              { label: "Release",     value: movie.releaseDate },
              { label: "Director",    value: movie.director    },
              { label: "Genre",       value: genre             },
              { label: "Certificate", value: movie.rating      },
            ].filter(d => d.value).map(d => (
              <div key={d.label}
                className="bg-white/[0.03] border border-white/[0.07]
                           rounded-2xl p-4 hover:border-red-500/30
                           hover:bg-red-500/[0.04] transition group">
                <p className="text-white/30 text-[10px] uppercase tracking-widest
                              font-black mb-2 group-hover:text-red-400/60 transition">
                  {d.label}
                </p>
                <p className="text-white font-bold text-sm">{d.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Description ── */}
        {movie.description && (
          <section>
            <Divider title="About" icon="📖" />
            <p className="mt-5 text-white/50 leading-8 text-[15px] max-w-3xl">
              {movie.description}
            </p>
          </section>
        )}

        {/* ── Cast ── */}
        {cast.length > 0 && (
          <section>
            <Divider title="Cast" icon="🎭" />
            <div className="flex flex-wrap gap-3 mt-5">
              {cast.map((actor, i) => (
                <div key={i}
                  className="flex items-center gap-2.5 bg-white/[0.04]
                             border border-white/[0.07] rounded-2xl px-4 py-2.5
                             hover:border-red-500/30 hover:bg-red-500/[0.05] transition">
                  <div className="w-8 h-8 rounded-full bg-red-500 flex items-center
                                  justify-center font-black text-white text-sm shrink-0">
                    {actor[0]?.toUpperCase()}
                  </div>
                  <span className="text-white/70 text-sm font-medium">{actor}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════
            SHOW TIMINGS
        ══════════════════════════════════════════════ */}
        <section id="show-timings">
          <Divider title="Book Tickets" icon=""
            right={
              <span className="text-white/30 text-sm">
                {theatres.length} venue{theatres.length !== 1 ? "s" : ""} · {showsForDate.length} show{showsForDate.length !== 1 ? "s" : ""}
              </span>
            } />

          {shows.length === 0 ? (
            <div className="mt-6 flex flex-col items-center justify-center py-16
                            bg-white/[0.02] rounded-3xl border border-white/[0.06]">
              <p className="text-4xl mb-3 opacity-30">🎭</p>
              <p className="text-white/40 font-semibold">No shows scheduled yet</p>
              <p className="text-white/20 text-sm mt-1">Check back soon</p>
            </div>
          ) : (
            <>
              {/* ── Date selector ─────────────────────────── */}
              {uniqueDates.length > 0 && (
                <div className="mt-5 overflow-x-auto pb-1 -mx-1 px-1
                                scrollbar-hide">
                  <div className="flex gap-2 w-max">
                    {uniqueDates.map(date => {
                      const d     = new Date(date + "T00:00:00");
                      const today = new Date();
                      today.setHours(0,0,0,0);
                      const diff  = Math.round((d - today) / 86400000);
                      const day   = d.toLocaleDateString("en-IN", { weekday: "short" });
                      const dd    = d.getDate();
                      const mon   = d.toLocaleDateString("en-IN", { month: "short" });
                      const label = diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : day;
                      const count = shows.filter(s => s.showDate === date).length;
                      const active = selectedDate === date;
                      return (
                        <button key={date}
                          onClick={() => setSelectedDate(date)}
                          className={`flex flex-col items-center min-w-[72px] py-3 px-2
                                      rounded-2xl border transition-all shrink-0
                                      ${active
                                        ? "bg-red-500 border-red-500 shadow-lg shadow-red-500/30"
                                        : "bg-white/[0.03] border-white/[0.08] hover:border-red-500/40 hover:bg-white/[0.06]"}`}>
                          <span className={`text-[10px] font-black uppercase tracking-wider
                            ${active ? "text-red-100" : "text-white/30"}`}>
                            {label}
                          </span>
                          <span className={`text-xl font-black leading-none mt-0.5
                            ${active ? "text-white" : "text-white/80"}`}>
                            {dd}
                          </span>
                          <span className={`text-[10px] font-semibold mt-0.5
                            ${active ? "text-red-100" : "text-white/30"}`}>
                            {mon}
                          </span>
                          <span className={`text-[9px] font-bold mt-1.5 px-1.5 py-0.5 rounded-full
                            ${active
                              ? "bg-red-400/40 text-white"
                              : "bg-white/[0.06] text-white/25"}`}>
                            {count} show{count !== 1 ? "s" : ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── City filter chips ─────────────────────── */}
              {uniqueCities.length > 1 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    onClick={() => setCityFilter("")}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition
                      ${!cityFilter
                        ? "bg-red-500 text-white border-red-500"
                        : "bg-white/[0.04] text-white/40 border-white/10 hover:border-white/30"}`}>
                    All Cities
                  </button>
                  {uniqueCities.map(ct => (
                    <button key={ct}
                      onClick={() => setCityFilter(ct === cityFilter ? "" : ct)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition
                        ${cityFilter === ct
                          ? "bg-red-500 text-white border-red-500"
                          : "bg-white/[0.04] text-white/40 border-white/10 hover:border-white/30"}`}>
                      📍 {ct}
                    </button>
                  ))}
                </div>
              )}

              {/* ── Theatre + time slots ──────────────────── */}
              {theatres.length === 0 ? (
                <div className="mt-5 flex flex-col items-center justify-center py-14
                                bg-white/[0.02] rounded-3xl border border-white/[0.06]">
                  <p className="text-3xl mb-2 opacity-30">🎭</p>
                  <p className="text-white/40 font-semibold text-sm">
                    No shows {cityFilter ? `in ${cityFilter}` : ""} on this day
                  </p>
                  {cityFilter && (
                    <button onClick={() => setCityFilter("")}
                      className="text-red-400 text-xs mt-2 hover:underline">
                      Show all cities
                    </button>
                  )}
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {theatres.map(theatre => (
                    <div key={theatre.name}
                      className="bg-white/[0.03] border border-white/[0.07]
                                 rounded-2xl p-5 hover:border-red-500/20 transition">

                      <div className="flex items-start justify-between mb-5">
                        <div>
                          <h4 className="font-bold text-white text-sm">
                            🏛️ {theatre.name}
                          </h4>
                          {(theatre.area || theatre.city) && (
                            <p className="text-white/30 text-xs mt-1">
                              📍 {[theatre.area, theatre.city].filter(Boolean).join(", ")}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-white/25 bg-white/[0.04]
                                         px-2.5 py-1 rounded-full border border-white/[0.07]">
                          {theatre.shows.length} show{theatre.shows.length > 1 ? "s" : ""}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {theatre.shows
                          .sort((a, b) => (a.showTime ?? "").localeCompare(b.showTime ?? ""))
                          .map(show => {
                            const available = show.availableSeats ?? show.totalSeats ?? null;
                            const soldOut   = typeof available === "number" && available === 0;
                            const fewLeft   = typeof available === "number"
                                              && available > 0 && available < 20;
                            return (
                              <button key={show.id}
                                onClick={() => !soldOut && navigate(`/shows/${show.id}/seats`)}
                                disabled={soldOut}
                                className={`flex flex-col items-center px-5 py-3 rounded-xl
                                            border text-sm font-bold transition group
                                            ${soldOut
                                              ? "border-white/[0.06] text-white/20 cursor-not-allowed"
                                              : "border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 hover:shadow-lg hover:shadow-red-500/25"}`}>
                                <span className="text-base font-black">{fmtTime(show.showTime)}</span>
                                <span className={`text-xs mt-0.5
                                  ${soldOut ? "text-white/15" : "text-red-500/60 group-hover:text-red-100"}`}>
                                  {soldOut ? "Sold Out" : `₹${show.price}`}
                                </span>
                                {fewLeft && (
                                  <span className="text-[10px] text-orange-400 mt-0.5 font-bold">
                                    {available} left!
                                  </span>
                                )}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        {/* ══════════════════════════════════════════════
            REVIEWS
        ══════════════════════════════════════════════ */}
        <section>
          <Divider title="Reviews" icon="⭐"
            right={
              <span className="text-white/30 text-sm">
                {reviews.length} review{reviews.length !== 1 ? "s" : ""}
              </span>
            } />

          <div className="mt-7 grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* Rating summary */}
            <div className="lg:col-span-2 bg-white/[0.03] border border-white/[0.07]
                            rounded-3xl p-7">
              <div className="text-center mb-6">
                <p className="text-7xl font-black text-white tabular-nums">{avg || "—"}</p>
                {avg > 0 && (
                  <div className="flex justify-center mt-2">
                    <Stars value={Math.round(avg)} />
                  </div>
                )}
                <p className="text-white/25 text-sm mt-2">
                  {reviews.length > 0
                    ? `${reviews.length} review${reviews.length > 1 ? "s" : ""}`
                    : "No reviews yet"}
                </p>
              </div>

              {reviews.length > 0 && (
                <div className="space-y-2.5">
                  {dist.map(d => (
                    <div key={d.star} className="flex items-center gap-3">
                      <span className="text-red-400 text-xs font-bold
                                       w-5 text-right shrink-0">{d.star}★</span>
                      <div className="flex-1 h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full
                                        transition-all duration-700"
                          style={{ width: `${d.pct}%` }} />
                      </div>
                      <span className="text-white/25 text-xs w-4 text-right shrink-0">
                        {d.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Review list */}
            <div className="lg:col-span-3 space-y-4">
              {loadR ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-4 border-red-500/20 border-t-red-500
                                  rounded-full animate-spin" />
                </div>
              ) : reviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14
                                bg-white/[0.02] rounded-3xl border border-white/[0.05]">
                  <p className="text-4xl mb-3 opacity-20">💬</p>
                  <p className="text-white/40 font-semibold">No reviews yet</p>
                  <p className="text-white/20 text-sm mt-1">Be the first to share!</p>
                </div>
              ) : (
                reviews.map(r => (
                  <ReviewCard key={r.id} review={r}
                    myId={me?.id ?? me?.sub}
                    onDelete={() => removeReview(r.id)} />
                ))
              )}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            WRITE A REVIEW
        ══════════════════════════════════════════════ */}
        <section>
          <Divider title="Write a Review" icon="✍️" />

          {getToken() ? (
            <div className="mt-6 bg-white/[0.03] border border-white/[0.07]
                            rounded-3xl p-7 max-w-2xl space-y-6">

              <div>
                <p className="text-white/30 text-[10px] uppercase tracking-widest
                              font-black mb-3">Your Rating *</p>
                <div className="flex items-center gap-4">
                  <Stars value={rating} size="lg" onChange={setRating} />
                  {rating > 0 && (
                    <div>
                      <span className="text-red-400 font-black text-2xl">{rating}</span>
                      <span className="text-white/20 text-sm">/5</span>
                      <p className="text-white/40 text-xs mt-0.5">{RATING_LABEL[rating]}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="text-white/30 text-[10px] uppercase tracking-widest
                              font-black mb-2">Your Review *</p>
                <textarea value={comment}
                  onChange={e => setComment(e.target.value.slice(0, 500))}
                  rows={4} placeholder="Share your experience…"
                  className="w-full bg-white/[0.04] border border-white/[0.08]
                             rounded-2xl px-5 py-4 text-white placeholder-white/20
                             text-sm resize-none focus:outline-none
                             focus:ring-2 focus:ring-red-500/30
                             focus:border-red-500/40 transition" />
                <div className="flex justify-end mt-1">
                  <span className={`text-xs
                    ${comment.length > 450 ? "text-red-400" : "text-white/20"}`}>
                    {comment.length}/500
                  </span>
                </div>
              </div>

              <button onClick={submitReview} disabled={posting}
                className={`w-full py-4 rounded-2xl font-black text-sm
                            tracking-wide transition-all
                  ${posting
                    ? "bg-white/[0.05] text-white/20 cursor-not-allowed"
                    : "bg-red-500 hover:bg-red-600 text-white hover:scale-[1.02] shadow-lg shadow-red-500/25"}`}>
                {posting ? "Submitting…" : "✍️ Submit Review"}
              </button>
            </div>
          ) : (
            <div className="mt-6 bg-white/[0.03] border border-white/[0.07]
                            rounded-3xl p-10 text-center max-w-sm">
              <p className="text-4xl mb-3 opacity-30">🔐</p>
              <p className="text-white font-bold text-lg">Login to write a review</p>
              <p className="text-white/30 text-sm mt-2">Share your experience</p>
              <button onClick={() => navigate("/login")}
                className="mt-5 bg-red-500 hover:bg-red-600 text-white font-black
                           px-7 py-3 rounded-xl text-sm transition
                           shadow-lg shadow-red-500/25">
                Login
              </button>
            </div>
          )}
        </section>

        {/* Bottom CTA */}
        <div className="flex justify-center pb-10">
          <button
            onClick={() =>
              document.getElementById("show-timings")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="inline-flex items-center gap-3 bg-red-500 hover:bg-red-600
                       text-white font-black px-12 py-4 rounded-2xl text-base
                       transition-all hover:scale-105 shadow-2xl shadow-red-500/30">
             Book Tickets for {movie.title}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Review Card ───────────────────────────────────────────────
function ReviewCard({ review, myId, onDelete }) {
  const name    = review.userName ?? review.user?.name ?? "Anonymous";
  const isOwner = myId && String(myId) === String(review.userId ?? review.user?.id);
  const date    = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString("en-IN",
        { day: "numeric", month: "short", year: "numeric" })
    : "";

  return (
    <div className="group bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5
                    hover:border-red-500/25 hover:bg-red-500/[0.03] transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center
                          justify-center font-black text-white shrink-0 text-sm">
            {name[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-white font-bold text-sm">{name}</p>
            {date && <p className="text-white/25 text-xs mt-0.5">{date}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Stars value={review.rating} size="sm" />
          <span className="text-red-400 font-black text-sm">{review.rating}</span>
          {isOwner && (
            <button onClick={onDelete}
              className="ml-1 p-1 rounded-lg opacity-0 group-hover:opacity-100
                         text-red-400/50 hover:text-red-400 hover:bg-red-400/10 transition">
              🗑️
            </button>
          )}
        </div>
      </div>
      <div className="w-6 h-0.5 bg-red-500/40 rounded-full mt-3 mb-3" />
      <p className="text-white/50 text-sm leading-7">{review.comment}</p>
    </div>
  );
}

// ── Section heading ───────────────────────────────────────────
function Divider({ title, icon, right }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-1 h-7 bg-red-500 rounded-full
                        shadow-lg shadow-red-500/50" />
        <h2 className="text-xl font-black">{icon} {title}</h2>
      </div>
      {right}
    </div>
  );
}