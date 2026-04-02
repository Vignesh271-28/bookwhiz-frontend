import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getToken } from "../../utils/jwtUtil";
import { API } from "../../config/api";

// const API = "http://localhost:8080/api/user";
const fetchAllMovies = () =>
  axios.get(`${API.USER}/movies`, { headers: { Authorization: `Bearer ${getToken()}` } });

// ── Genre helpers ─────────────────────────────────────────────
const getGenreColor = (genre) => {
  const g = (genre ?? "").toUpperCase();
  if (g.includes("ACTION"))   return "bg-orange-500 text-white";
  if (g.includes("DRAMA"))    return "bg-purple-500 text-white";
  if (g.includes("COMEDY"))   return "bg-yellow-400 text-gray-900";
  if (g.includes("SPORTS"))   return "bg-green-500  text-white";
  if (g.includes("LIVE"))     return "bg-pink-500   text-white";
  if (g.includes("EVENT"))    return "bg-blue-500   text-white";
  if (g.includes("HORROR"))   return "bg-gray-700   text-white";
  if (g.includes("ROMANCE"))  return "bg-rose-500   text-white";
  if (g.includes("THRILLER")) return "bg-slate-600  text-white";
  return "bg-red-500 text-white";
};

const getGenreBg = (genre) => {
  const g = (genre ?? "").toUpperCase();
  if (g.includes("ACTION"))   return "from-orange-950 via-gray-950 to-black";
  if (g.includes("DRAMA"))    return "from-purple-950 via-gray-950 to-black";
  if (g.includes("COMEDY"))   return "from-yellow-950 via-gray-950 to-black";
  if (g.includes("SPORTS"))   return "from-green-950  via-gray-950 to-black";
  if (g.includes("LIVE"))     return "from-pink-950   via-gray-950 to-black";
  if (g.includes("EVENT"))    return "from-blue-950   via-gray-950 to-black";
  if (g.includes("HORROR"))   return "from-gray-900   via-gray-950 to-black";
  if (g.includes("ROMANCE"))  return "from-rose-950   via-gray-950 to-black";
  return "from-red-950 via-gray-950 to-black";
};

const getGenreAccent = (genre) => {
  const g = (genre ?? "").toUpperCase();
  if (g.includes("ACTION"))   return "#f97316";
  if (g.includes("DRAMA"))    return "#a855f7";
  if (g.includes("COMEDY"))   return "#eab308";
  if (g.includes("SPORTS"))   return "#22c55e";
  if (g.includes("LIVE"))     return "#ec4899";
  if (g.includes("EVENT"))    return "#3b82f6";
  if (g.includes("HORROR"))   return "#6b7280";
  if (g.includes("ROMANCE"))  return "#f43f5e";
  if (g.includes("THRILLER")) return "#64748b";
  return "#ef4444";
};

const CATEGORIES = [
  { id: "ALL",      label: "All"      },
  { id: "MOVIE",    label: "Movies",   match: "MOVIE"    },
  { id: "DRAMA",    label: "Drama",    match: "DRAMA"    },
  { id: "ACTION",   label: "Action",   match: "ACTION"   },
  { id: "COMEDY",   label: "Comedy",   match: "COMEDY"   },
  { id: "SPORTS",   label: "Sports",   match: "SPORTS"   },
  { id: "LIVE",     label: "Live",     match: "LIVE"     },
  { id: "EVENTS",   label: "Events",   match: "EVENT"    },
  { id: "HORROR",   label: "Horror",   match: "HORROR"   },
  { id: "ROMANCE",  label: "Romance",  match: "ROMANCE"  },
  { id: "THRILLER", label: "Thriller", match: "THRILLER" },
];

const pickRandom = (arr, n) =>
  [...arr].sort(() => Math.random() - 0.5).slice(0, n);

// ════════════════════════════════════════════════════════════
export default function Home() {
  const [allMovies,      setAllMovies]      = useState([]);
  const [movies,         setMovies]         = useState([]);
  const [carouselMovies, setCarouselMovies] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [searchQuery,    setSearchQuery]    = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetchAllMovies()
      .then(res => {
        const data = res.data ?? [];
        setAllMovies(data);
        setMovies(data);
        const withPoster = data.filter(m => m.posterUrl);
        const pool       = withPoster.length >= 3 ? withPoster : data;
        setCarouselMovies(pickRandom(pool, 5));
      })
      .catch(err => console.error("Fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let filtered = [...allMovies];
    const cat = CATEGORIES.find(c => c.id === activeCategory);
    if (cat?.match) {
      filtered = filtered.filter(m =>
        (m.genre ?? "").toUpperCase().includes(cat.match) ||
        (m.type  ?? "").toUpperCase().includes(cat.match) ||
        (m.category ?? "").toUpperCase().includes(cat.match)
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.title?.toLowerCase().includes(q) ||
        m.genre?.toLowerCase().includes(q) ||
        m.language?.toLowerCase().includes(q)
      );
    }
    setMovies(filtered);
  }, [activeCategory, searchQuery, allMovies]);

  const activeCat = CATEGORIES.find(c => c.id === activeCategory);

  return (
    <div className="min-h-screen bg-gray-950">

      {/* ── Carousel ── */}
      {!loading && carouselMovies.length > 0 && (
        <Carousel movies={carouselMovies}
          onViewTimings={(id) => navigate(`/events/${id}`)} />
      )}

      {/* ── Sticky Category Bar ── */}
      <div className="sticky top-0 z-30 bg-gray-950 border-b border-white/[0.07]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto py-3"
               style={{ scrollbarWidth: "none" }}>
            {CATEGORIES.map(cat => (
              <button key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setSearchQuery(""); }}
                className={`flex-shrink-0 px-5 py-2 text-sm font-bold rounded-lg
                            transition whitespace-nowrap
                  ${activeCategory === cat.id
                    ? "bg-red-500 text-white shadow-lg shadow-red-500/25"
                    : "text-white/40 hover:text-white hover:bg-white/[0.07]"}`}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ── Search ── */}
        <div className="mb-8">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2
                             text-white/30 text-lg">🔍</span>
            <input type="text" value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeCat?.label ?? "All"}…`}
              className="w-full pl-11 pr-10 py-3 bg-white/[0.05] border border-white/[0.08]
                         rounded-xl text-white placeholder-white/25 text-sm
                         focus:outline-none focus:ring-2 focus:ring-red-500/40
                         focus:border-red-500/40 transition" />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2
                           text-white/30 hover:text-red-400 transition text-lg">
                ✕
              </button>
            )}
          </div>
        </div>

        {/* ── Section heading ── */}
        <div className="flex items-center justify-between mb-7">
          <div className="flex items-center gap-3">
            <div className="w-1 h-7 bg-red-500 rounded-full" />
            <div>
              <h2 className="text-white font-black text-xl">
                {activeCat?.label}
              </h2>
              {!loading && (
                <p className="text-white/25 text-xs mt-0.5">
                  {movies.length} {movies.length === 1 ? "title" : "titles"} available
                </p>
              )}
            </div>
          </div>
          {searchQuery && !loading && (
            <p className="text-white/30 text-sm">
              {movies.length} result{movies.length !== 1 ? "s" : ""} for{" "}
              <span className="text-white/60 font-semibold">"{searchQuery}"</span>
            </p>
          )}
        </div>

        {/* ── Skeleton ── */}
        {loading && (
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden animate-pulse
                                      bg-white/[0.04] border border-white/[0.06]">
                <div className="h-64 bg-white/[0.06]" />
                <div className="p-4 space-y-2.5">
                  <div className="h-3.5 bg-white/[0.08] rounded-full w-3/4" />
                  <div className="h-3   bg-white/[0.05] rounded-full w-1/2"  />
                  <div className="h-9   bg-white/[0.08] rounded-xl mt-3"     />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Movie Grid ── */}
        {!loading && movies.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3
                          lg:grid-cols-4 xl:grid-cols-5">
            {movies.map(movie => (
              <MovieCard key={movie.id} movie={movie}
                onViewTimings={() => navigate(`/events/${movie.id}`)} />
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && movies.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24">
            <p className="text-6xl mb-4 opacity-30"></p>
            {searchQuery ? (
              <>
                <p className="text-white/50 text-lg font-bold">
                  No results for "{searchQuery}"
                </p>
                <button onClick={() => setSearchQuery("")}
                  className="mt-4 text-sm text-red-400 hover:text-red-300
                             underline transition">
                  Clear search
                </button>
              </>
            ) : (
              <>
                <p className="text-white/50 text-lg font-bold">
                  No {activeCat?.label} available
                </p>
                <button onClick={() => setActiveCategory("ALL")}
                  className="mt-4 text-sm text-red-400 hover:text-red-300
                             underline transition">
                  ← View all
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 🎠 CAROUSEL
// ════════════════════════════════════════════════════════════
function Carousel({ movies, onViewTimings }) {
  const [current, setCurrent] = useState(0);
  const [paused,  setPaused]  = useState(false);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef(null);

  const go = useCallback((dir) => {
    setVisible(false);
    setTimeout(() => {
      setCurrent(prev =>
        dir === "next"
          ? (prev + 1) % movies.length
          : (prev - 1 + movies.length) % movies.length
      );
      setVisible(true);
    }, 200);
  }, [movies.length]);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(() => go("next"), 2000);
    return () => clearInterval(timerRef.current);
  }, [paused, go]);

  const movie   = movies[current];
  const genre   = movie.genre ?? movie.type ?? movie.category ?? "";
  const genreBg = getGenreBg(genre);

  return (
    <div className="relative w-full h-[500px] overflow-hidden select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}>

      {/* BG */}
      <div className={`absolute inset-0 transition-opacity duration-300
                       ${visible ? "opacity-100" : "opacity-0"}`}>
        {movie.posterUrl ? (
          <>
            <img src={movie.posterUrl} alt=""
              className="absolute inset-0 w-full h-full object-cover
                         scale-110 blur-2xl opacity-30" />
            <div className="absolute inset-0 bg-black/60" />
          </>
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${genreBg}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t
                        from-gray-950 via-gray-950/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r
                        from-gray-950/80 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className={`absolute inset-0 flex items-center transition-all duration-300
                       ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <div className="w-full max-w-7xl mx-auto px-8 md:px-16
                        flex flex-col md:flex-row items-center gap-10">

          {/* Poster */}
          <div className="shrink-0 w-40 md:w-48 h-60 md:h-68 rounded-2xl
                          overflow-hidden shadow-2xl border border-white/10
                          ring-1 ring-red-500/20">
            {movie.posterUrl ? (
              <img src={movie.posterUrl} alt={movie.title}
                className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${genreBg}
                               flex items-center justify-center`}>
                <span className="text-5xl opacity-20"></span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            {genre && (
              <span className={`inline-block text-xs font-black px-3 py-1
                               rounded-full uppercase tracking-widest mb-4
                               ${getGenreColor(genre)}`}>
                {genre}
              </span>
            )}
            <h2 className="text-3xl md:text-5xl font-black text-white
                           leading-tight tracking-tight line-clamp-2">
              {movie.title}
            </h2>

            <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
              {[
                movie.language && { icon: "🌐", label: movie.language },
                movie.format   && { icon: "📽️", label: movie.format   },
                movie.duration && { icon: "⏱",  label: movie.duration },
              ].filter(Boolean).map((m, i) => (
                <span key={i}
                  className="flex items-center gap-1.5 bg-white/[0.07]
                             border border-white/10 text-white/70 text-xs
                             font-semibold px-3 py-1.5 rounded-full">
                  {m.icon} {m.label}
                </span>
              ))}
            </div>

            {movie.description && (
              <p className="text-white/40 text-sm mt-4 line-clamp-2
                            max-w-lg hidden md:block leading-relaxed">
                {movie.description}
              </p>
            )}

            <button onClick={() => onViewTimings(movie.id)}
              className="mt-6 inline-flex items-center gap-2 bg-red-500
                         hover:bg-red-600 text-white font-black px-8 py-3.5
                         rounded-xl text-sm transition-all hover:scale-105
                         shadow-xl shadow-red-500/30">
               View Timings →
            </button>
          </div>
        </div>
      </div>

      {/* Arrows */}
      <button onClick={() => go("prev")}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10
                   w-10 h-10 rounded-full bg-white/[0.07] hover:bg-red-500/80
                   border border-white/10 text-white text-xl
                   flex items-center justify-center transition hover:scale-110
                   hover:border-red-500/50">
        ‹
      </button>
      <button onClick={() => go("next")}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10
                   w-10 h-10 rounded-full bg-white/[0.07] hover:bg-red-500/80
                   border border-white/10 text-white text-xl
                   flex items-center justify-center transition hover:scale-110
                   hover:border-red-500/50">
        ›
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2
                      flex items-center gap-2 z-10">
        {movies.map((_, i) => (
          <button key={i}
            onClick={() => { setVisible(false); setTimeout(() => { setCurrent(i); setVisible(true); }, 200); }}
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width:      i === current ? "28px" : "8px",
              background: i === current ? "#ef4444" : "rgba(255,255,255,0.2)",
            }} />
        ))}
      </div>

      {/* Counter */}
      <div className="absolute top-5 right-5 text-white/30 text-xs font-mono
                      bg-black/40 border border-white/10 px-2.5 py-1
                      rounded-full backdrop-blur-sm">
        {current + 1} / {movies.length}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 🎬 Professional Movie Card
// ════════════════════════════════════════════════════════════
function MovieCard({ movie, onViewTimings }) {
  const [imgErr, setImgErr] = useState(false);
  const genre      = movie.genre ?? movie.type ?? movie.category ?? "";
  const genreColor = getGenreColor(genre);
  const genreBg    = getGenreBg(genre);
  const accent     = getGenreAccent(genre);
  const hasPoster  = !!movie.posterUrl && !imgErr;

  return (
    <div
      className="group relative rounded-2xl overflow-hidden cursor-pointer
                 border border-white/[0.07] transition-all duration-300
                 hover:border-red-500/40 hover:shadow-2xl hover:shadow-red-500/10
                 hover:-translate-y-1"
      style={{ background: "#111118" }}
      onClick={onViewTimings}>

      {/* ── Poster area ── */}
      <div className="relative h-64 overflow-hidden">
        {hasPoster ? (
          <img src={movie.posterUrl} alt={movie.title}
            onError={() => setImgErr(true)}
            className="w-full h-full object-cover transition duration-500
                       group-hover:scale-105" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${genreBg}
                           flex flex-col items-center justify-center gap-3`}>
            <span className="text-5xl opacity-20"></span>
            <p className="text-white/15 text-[10px] font-black uppercase tracking-widest">
              No Poster
            </p>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30
                        transition-all duration-300" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          {genre && (
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full
                              uppercase tracking-widest shadow-lg ${genreColor}`}>
              {genre}
            </span>
          )}
          {movie.format && (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full
                             bg-black/70 text-white/80 border border-white/10
                             backdrop-blur-sm ml-auto">
              {movie.format}
            </span>
          )}
        </div>

        {/* Bottom gradient + quick action on hover */}
        <div className="absolute bottom-0 inset-x-0 h-20
                        bg-gradient-to-t from-[#111118] to-transparent" />

        {/* Play / View button on hover */}
        <div className="absolute inset-0 flex items-center justify-center
                        opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="w-14 h-14 rounded-full bg-red-500 shadow-2xl
                          shadow-red-500/50 flex items-center justify-center
                          scale-75 group-hover:scale-100 transition-transform duration-300">
            <span className="text-white text-xl ml-1">▶</span>
          </div>
        </div>
      </div>

      {/* ── Card body ── */}
      <div className="p-4">

        {/* Title */}
        <h3 className="text-white font-bold text-sm leading-snug
                       line-clamp-2 mb-3 group-hover:text-red-400 transition-colors">
          {movie.title}
        </h3>

        {/* Meta row */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {movie.language && (
            <span className="text-[11px] bg-white/[0.06] border border-white/[0.08]
                             text-white/50 px-2 py-0.5 rounded-full font-medium">
              🌐 {movie.language}
            </span>
          )}
          {movie.duration && (
            <span className="text-[11px] bg-white/[0.06] border border-white/[0.08]
                             text-white/50 px-2 py-0.5 rounded-full font-medium">
              ⏱ {movie.duration}
            </span>
          )}
        </div>

        {/* Red accent line */}
        {/* <div className="w-8 h-0.5 bg-red-500 rounded-full mb-3
                        group-hover:w-full transition-all duration-500" /> */}

        {/* CTA button */}
        <button
          onClick={e => { e.stopPropagation(); onViewTimings(); }}
          className="w-full py-2.5 rounded-xl text-sm font-black transition-all
                     duration-200 border border-red-500/30 text-red-400
                     hover:bg-red-500 hover:text-white hover:border-red-500
                     hover:shadow-lg hover:shadow-red-500/25">
          Book Now →
        </button>
      </div>
    </div>
  );
}