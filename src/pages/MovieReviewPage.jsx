import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { getToken, getUserFromToken } from "../utils/jwtUtil";
import { toast } from "react-toastify";
import { API } from "../config/api";

// const API  = "http://localhost:8080/api";
const auth = () => ({ Authorization: `Bearer ${getToken()}` });

const fetchMovie   = (id) => axios.get(`${API.API_URL}user/movies/${id}`,   { headers: auth() });
const fetchReviews = (id) => axios.get(`${API.API_URL}reviews/movie/${id}`, { headers: auth() });
const postReview   = (d)  => axios.post(`${API.API_URL}/reviews`, d,         { headers: auth() });
const deleteReview = (id) => axios.delete(`${API.API_URL}reviews/${id}`,    { headers: auth() });

// ── Genre fallback images ─────────────────────────────────────
const GENRE_IMG = {
  ACTION:      "https://images.unsplash.com/photo-1533488765986-dfa2a9939acd?w=1400&q=80",
  DRAMA:       "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1400&q=80",
  COMEDY:      "https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=1400&q=80",
  ROMANCE:     "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=1400&q=80",
  THRILLER:    "https://images.unsplash.com/photo-1568111561564-08726a1563e1?w=1400&q=80",
  HORROR:      "https://images.unsplash.com/photo-1559583985-c80d8ad9b29f?w=1400&q=80",
  SPORTS:      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1400&q=80",
  DEFAULT:     "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1400&q=80",
};
const bgImg = (genre) => GENRE_IMG[genre?.toUpperCase()] ?? GENRE_IMG.DEFAULT;

// ─────────────────────────────────────────────────────────────
// ⭐ Star Component
// ─────────────────────────────────────────────────────────────
function Stars({ value = 0, max = 5, onChange, size = "md" }) {
  const [hov, setHov] = useState(0);
  const sz = { sm: "text-base", md: "text-xl", lg: "text-3xl" }[size];
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <button key={i} type="button"
          onClick={() => onChange?.(i + 1)}
          onMouseEnter={() => onChange && setHov(i + 1)}
          onMouseLeave={() => onChange && setHov(0)}
          className={`${sz} leading-none transition-transform
            ${onChange ? "cursor-pointer hover:scale-125" : "cursor-default"}
            ${i < (hov || value) ? "text-amber-400" : "text-white/20"}`}>
          ★
        </button>
      ))}
    </div>
  );
}

const avgRating = (list) =>
  list.length ? list.reduce((s, r) => s + (r.rating ?? 0), 0) / list.length : 0;

const RATING_LABEL = ["", "Terrible 😞", "Poor 😕", "Okay 😐", "Good 😊", "Excellent 🤩"];

// ─────────────────────────────────────────────────────────────
export default function MovieReviewPage() {
  const { movieId } = useParams();
  const navigate    = useNavigate();
  const me          = getUserFromToken();

  const [movie,    setMovie]    = useState(null);
  const [reviews,  setReviews]  = useState([]);
  const [loadM,    setLoadM]    = useState(true);
  const [loadR,    setLoadR]    = useState(true);

  const [rating,   setRating]   = useState(0);
  const [comment,  setComment]  = useState("");
  const [posting,  setPosting]  = useState(false);

  useEffect(() => {
    fetchMovie(movieId)
      .then(r => setMovie(r.data))
      .catch(() => toast.error("Movie not found"))
      .finally(() => setLoadM(false));
    reloadReviews();
  }, [movieId]);

  const reloadReviews = () => {
    setLoadR(true);
    fetchReviews(movieId)
      .then(r => setReviews(r.data))
      .catch(() => setReviews([]))
      .finally(() => setLoadR(false));
  };

  const submitReview = async () => {
    if (!getToken()) { toast.error("Please login to review"); return; }
    if (!rating)     { toast.error("Select a star rating"); return; }
    if (!comment.trim()) { toast.error("Write a comment"); return; }
    if (comment.length > 500) { toast.error("Max 500 characters"); return; }
    try {
      setPosting(true);
      await postReview({ movieId: Number(movieId), rating, comment: comment.trim() });
      toast.success("Review submitted!");
      setRating(0); setComment("");
      reloadReviews();
    } catch (e) {
      toast.error(e.response?.data?.message ?? "Failed to submit");
    } finally { setPosting(false); }
  };

  const removeReview = async (id) => {
    if (!window.confirm("Delete your review?")) return;
    try { await deleteReview(id); toast.success("Deleted"); reloadReviews(); }
    catch { toast.error("Failed to delete"); }
  };

  if (loadM) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-4 border-amber-400/20 border-t-amber-400 animate-spin" />
    </div>
  );

  if (!movie) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-white">
      <div className="text-center space-y-3">
        <p className="text-6xl"></p>
        <p className="text-xl font-bold">Movie not found</p>
        <button onClick={() => navigate(-1)} className="text-amber-400 underline text-sm">← Go back</button>
      </div>
    </div>
  );

  const avg     = avgRating(reviews);
  const cast    = movie.cast ? movie.cast.split(",").map(s => s.trim()).filter(Boolean) : [];
  const dist    = [5,4,3,2,1].map(star => {
    const count = reviews.filter(r => r.rating === star).length;
    return { star, count, pct: reviews.length ? (count / reviews.length) * 100 : 0 };
  });

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">

      {/* ══════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════ */}
      <div className="relative h-[72vh] min-h-[520px] overflow-hidden">

        {/* BG */}
        <img src={movie.posterUrl ?? bgImg(movie.genre)} alt={movie.title}
          onError={e => { e.target.src = bgImg(movie.genre); }}
          className="absolute inset-0 w-full h-full object-cover scale-105" />

        {/* Gradient layers */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f] via-[#0a0a0f]/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-[#0a0a0f]/30" />

        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="absolute top-6 left-6 z-10 flex items-center gap-2
                     bg-white/10 hover:bg-white/20 backdrop-blur-md
                     text-white px-4 py-2 rounded-full text-sm font-semibold
                     border border-white/15 transition">
          ← Back
        </button>

        {/* Hero content */}
        <div className="absolute inset-0 flex items-end">
          <div className="w-full max-w-6xl mx-auto px-6 md:px-16 pb-14">

            {movie.genre && (
              <span className="inline-block bg-amber-400 text-gray-900 text-xs font-black
                               px-3 py-1 rounded-full uppercase tracking-widest mb-4">
                {movie.genre}
              </span>
            )}

            <h1 className="text-5xl md:text-7xl font-black leading-none tracking-tight">
              {movie.title}
            </h1>

            {/* Meta pills */}
            <div className="flex flex-wrap gap-2 mt-5">
              {[
                movie.language && { label: movie.language,                icon: "" },
                movie.format   && { label: movie.format,                  icon: "", amber: true },
                movie.duration && { label: movie.duration,                icon: "" },
                movie.releaseDate && { label: movie.releaseDate,          icon: "" },
                movie.rating   && { label: `Rated ${movie.rating}`,      icon: "" },
              ].filter(Boolean).map((m, i) => (
                <span key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full
                               text-xs font-semibold backdrop-blur-sm border
                               ${m.amber
                                 ? "bg-amber-400/20 text-amber-300 border-amber-400/30"
                                 : "bg-white/10 text-white/80 border-white/15"}`}>
                  {m.icon} {m.label}
                </span>
              ))}
            </div>

            {/* Avg rating */}
            {reviews.length > 0 && (
              <div className="flex items-center gap-3 mt-4">
                <Stars value={Math.round(avg)} size="sm" />
                <span className="text-amber-400 font-black text-xl">{avg.toFixed(1)}</span>
                <span className="text-white/40 text-sm">({reviews.length} reviews)</span>
              </div>
            )}

            {/* Primary CTA */}
            <button onClick={() => navigate(`/movies/${movieId}/timings`)}
              className="mt-7 inline-flex items-center gap-3 bg-amber-400 hover:bg-amber-300
                         text-gray-900 font-black px-8 py-4 rounded-2xl text-base
                         transition-all hover:scale-105 shadow-2xl shadow-amber-400/25">
               Book Tickets
              <span className="opacity-50 font-light">→</span>
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-6 md:px-16 py-14 space-y-16">

        {/* ── Movie Details ── */}
        <section>
          <Divider title="Movie Details" icon="" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-6">
            {[
              { label: "Language",     value: movie.language    },
              { label: "Format",       value: movie.format      },
              { label: "Duration",     value: movie.duration    },
              { label: "Release Date", value: movie.releaseDate },
              { label: "Director",     value: movie.director    },
              { label: "Genre",        value: movie.genre       },
              { label: "Certificate",  value: movie.rating      },
            ].filter(d => d.value).map(d => (
              <div key={d.label}
                className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4
                           hover:bg-white/[0.07] transition">
                <p className="text-white/35 text-xs uppercase tracking-widest font-semibold mb-2">
                  {d.label}
                </p>
                <p className="text-white font-bold">{d.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Description ── */}
        {movie.description && (
          <section>
            <Divider title="About the Movie" icon="📖" />
            <p className="mt-5 text-white/65 leading-8 text-[15px] max-w-3xl">
              {movie.description}
            </p>
          </section>
        )}

        {/* ── Cast ── */}
        {cast.length > 0 && (
          <section>
            <Divider title="Cast" icon="" />
            <div className="flex flex-wrap gap-3 mt-5">
              {cast.map((actor, i) => (
                <div key={i}
                  className="flex items-center gap-2.5 bg-white/[0.05] border border-white/[0.08]
                             rounded-2xl px-4 py-2.5 hover:bg-white/[0.09] transition">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500
                                  flex items-center justify-center text-gray-900 font-black text-sm shrink-0">
                    {actor[0]?.toUpperCase()}
                  </div>
                  <span className="text-white/80 text-sm font-medium">{actor}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Book Ticket Banner ── */}
        <section>
          <div className="relative overflow-hidden rounded-3xl
                          bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-8 md:p-10">
            <div className="absolute right-4 top-0 bottom-0 flex items-center
                            text-[100px] opacity-10 pointer-events-none select-none">
              
            </div>
            <p className="text-gray-900/60 text-xs font-black uppercase tracking-widest">
              Ready to watch?
            </p>
            <h3 className="text-gray-900 text-3xl font-black mt-1">{movie.title}</h3>
            <p className="text-gray-900/60 mt-2 text-sm max-w-sm">
              Choose your seat, pick a showtime, and enjoy the experience.
            </p>
            <button onClick={() => navigate(`/movies/${movieId}/timings`)}
              className="mt-6 inline-flex items-center gap-3 bg-gray-900 hover:bg-gray-800
                         text-white font-black px-8 py-3.5 rounded-2xl text-sm
                         transition-all hover:scale-105 shadow-xl">
               View Show Timings &amp; Book
            </button>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            REVIEWS
        ══════════════════════════════════════════════ */}
        <section>
          <Divider title="Reviews" icon="⭐"
            right={<span className="text-white/35 text-sm">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</span>} />

          <div className="mt-7 grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* Rating summary */}
            <div className="lg:col-span-2 bg-white/[0.04] border border-white/[0.08]
                            rounded-3xl p-7 flex flex-col">
              <div className="text-center mb-7">
                <p className="text-8xl font-black text-white tabular-nums">
                  {avg.toFixed(1)}
                </p>
                <div className="flex justify-center mt-2">
                  <Stars value={Math.round(avg)} size="lg" />
                </div>
                <p className="text-white/35 text-sm mt-2">
                  Based on {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="space-y-2.5">
                {dist.map(d => (
                  <div key={d.star} className="flex items-center gap-3">
                    <span className="text-amber-400 text-xs font-bold w-4 text-right shrink-0">
                      {d.star}★
                    </span>
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500
                                      rounded-full transition-all duration-700"
                        style={{ width: `${d.pct}%` }} />
                    </div>
                    <span className="text-white/30 text-xs w-5 shrink-0 text-right">
                      {d.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews list */}
            <div className="lg:col-span-3 space-y-4">
              {loadR ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 rounded-full border-4 border-amber-400/20
                                  border-t-amber-400 animate-spin" />
                </div>
              ) : reviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14
                                bg-white/[0.03] rounded-3xl border border-white/[0.08]">
                  <p className="text-4xl mb-3">💬</p>
                  <p className="text-white/50 font-semibold">No reviews yet</p>
                  <p className="text-white/25 text-sm mt-1">Be the first to share your thoughts!</p>
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
            ADD REVIEW
        ══════════════════════════════════════════════ */}
        <section>
          <Divider title="Write a Review" icon="" />

          {getToken() ? (
            <div className="mt-6 bg-white/[0.04] border border-white/[0.08]
                            rounded-3xl p-7 max-w-2xl space-y-6">

              {/* Stars */}
              <div>
                <p className="text-white/40 text-xs uppercase tracking-widest font-semibold mb-3">
                  Your Rating *
                </p>
                <div className="flex items-center gap-4">
                  <Stars value={rating} size="lg" onChange={setRating} />
                  {rating > 0 && (
                    <div>
                      <span className="text-amber-400 font-black text-2xl">{rating}</span>
                      <span className="text-white/30 text-sm">/5</span>
                      <p className="text-white/50 text-xs mt-0.5">{RATING_LABEL[rating]}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Comment */}
              <div>
                <p className="text-white/40 text-xs uppercase tracking-widest font-semibold mb-2">
                  Your Review *
                </p>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value.slice(0, 500))}
                  rows={4}
                  placeholder="What did you think about this movie? Share your experience..."
                  className="w-full bg-white/[0.06] border border-white/[0.1] rounded-2xl
                             px-5 py-4 text-white placeholder-white/25 text-sm resize-none
                             focus:outline-none focus:ring-2 focus:ring-amber-400/40
                             focus:border-amber-400/50 transition" />
                <div className="flex justify-between mt-1.5">
                  <span />
                  <span className={`text-xs ${comment.length > 450 ? "text-amber-400" : "text-white/25"}`}>
                    {comment.length}/500
                  </span>
                </div>
              </div>

              <button onClick={submitReview} disabled={posting}
                className={`w-full py-4 rounded-2xl font-black text-sm tracking-wide transition-all
                  ${posting
                    ? "bg-white/10 text-white/30 cursor-not-allowed"
                    : "bg-amber-400 hover:bg-amber-300 text-gray-900 hover:scale-[1.02] shadow-lg shadow-amber-400/20"}`}>
                {posting ? "Submitting..." : " Submit Review"}
              </button>
            </div>
          ) : (
            <div className="mt-6 bg-white/[0.04] border border-white/[0.08]
                            rounded-3xl p-10 text-center max-w-sm">
              <p className="text-4xl mb-3">🔐</p>
              <p className="text-white font-bold text-lg">Login to write a review</p>
              <p className="text-white/35 text-sm mt-2">
                Share your experience with the BookWhiz community
              </p>
              <button onClick={() => navigate("/login")}
                className="mt-5 bg-amber-400 hover:bg-amber-300 text-gray-900 font-black
                           px-7 py-3 rounded-xl text-sm transition">
                Login
              </button>
            </div>
          )}
        </section>

        {/* Bottom Book Ticket */}
        <div className="flex justify-center pt-4 pb-10">
          <button onClick={() => navigate(`/movies/${movieId}/timings`)}
            className="inline-flex items-center gap-3 bg-amber-400 hover:bg-amber-300
                       text-gray-900 font-black px-12 py-4 rounded-2xl text-base
                       transition-all hover:scale-105 shadow-2xl shadow-amber-400/20">
             Book Tickets for {movie.title}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ReviewCard
// ─────────────────────────────────────────────────────────────
function ReviewCard({ review, myId, onDelete }) {
  const name    = review.userName ?? review.user?.name ?? "Anonymous";
  const isOwner = myId && (String(myId) === String(review.userId ?? review.user?.id));
  const date    = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString("en-IN",
        { day: "numeric", month: "short", year: "numeric" })
    : "";

  return (
    <div className="group bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5
                    hover:bg-white/[0.07] transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500
                          flex items-center justify-center font-black text-gray-900 shrink-0">
            {name[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-white font-bold text-sm">{name}</p>
            {date && <p className="text-white/30 text-xs mt-0.5">{date}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Stars value={review.rating} size="sm" />
          <span className="text-amber-400 font-black text-sm">{review.rating}</span>
          {isOwner && (
            <button onClick={onDelete}
              className="ml-1 p-1 rounded-lg opacity-0 group-hover:opacity-100
                         text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition">
              🗑️
            </button>
          )}
        </div>
      </div>
      <p className="text-white/60 text-sm leading-7 mt-3">{review.comment}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Section divider
// ─────────────────────────────────────────────────────────────
function Divider({ title, icon, right }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-1 h-7 bg-amber-400 rounded-full" />
        <h2 className="text-2xl font-black">{icon} {title}</h2>
      </div>
      {right}
    </div>
  );
}