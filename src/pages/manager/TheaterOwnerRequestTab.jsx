import { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../../utils/jwtUtil";
import { toast } from "react-toastify";

// const API  = "http://localhost:8080/api/admin/requests";
const auth = () => ({ Authorization: `Bearer ${getToken()}` });

const GENRES    = ["ACTION","COMEDY","DRAMA","HORROR","ROMANCE","THRILLER","SCI_FI","ANIMATION","DOCUMENTARY","FAMILY"];
const LANGUAGES = ["Tamil","Telugu","Hindi","English","Malayalam","Kannada","Bengali","Marathi"];
const FORMATS   = ["2D","3D","IMAX","4DX","DOLBY"];

const inputCls = `w-full bg-white/[0.05] border border-white/10 rounded-xl px-3.5 py-2.5
  text-white text-sm placeholder-white/20
  focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.07] transition`;
const errCls   = `border-red-500/60 bg-red-500/[0.05]`;

export default function TheaterOwnerRequestTab() {
  const [form, setForm] = useState({
    title: "", genre: "", language: "", format: "",
    duration: "", director: "", cast: "", description: "",
    rating: "", releaseDate: "",
  });
  const [errors,  setErrors]  = useState({});
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(true);

  // Live validation
  useEffect(() => {
    if (!touched) return;
    const e = {};
    if (!form.title.trim())       e.title       = "Title is required";
    if (!form.genre)              e.genre       = "Genre is required";
    if (!form.language)           e.language    = "Language is required";
    if (!form.format)             e.format      = "Format is required";
    if (!form.duration.trim())    e.duration    = "Duration (mins) is required";
    if (!form.director.trim())    e.director    = "Director is required";
    if (!form.releaseDate)        e.releaseDate = "Release date is required";
    if (!form.description.trim()) e.description = "Description is required";
    setErrors(e);
  }, [form, touched]);

  // Fetch history
  useEffect(() => {
    axios.get(`${API.TheaterOwnerRequestTab}/mine`, { headers: auth() })
      .then(r => setHistory((r.data ?? []).filter(x => x.type === "MOVIE")))
      .catch(() => {})
      .finally(() => setHistLoading(false));
  }, [loading]);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async () => {
    setTouched(true);
    const e = {};
    if (!form.title.trim())       e.title       = "Title is required";
    if (!form.genre)              e.genre       = "Genre is required";
    if (!form.language)           e.language    = "Language is required";
    if (!form.format)             e.format      = "Format is required";
    if (!form.duration.trim())    e.duration    = "Duration (mins) is required";
    if (!form.director.trim())    e.director    = "Director is required";
    if (!form.releaseDate)        e.releaseDate = "Release date is required";
    if (!form.description.trim()) e.description = "Description is required";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setLoading(true);
    try {
      await axios.post(`${API.TheaterOwnerRequestTab}/movie`, form, { headers: auth() });
      toast.success("🎬 Movie request submitted! Awaiting approval.");
      setForm({ title:"", genre:"", language:"", format:"", duration:"",
                director:"", cast:"", description:"", rating:"", releaseDate:"" });
      setTouched(false);
      setErrors({});
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  const STATUS_META = {
    PENDING:  { label:"Pending",  bg:"bg-yellow-500/15", text:"text-yellow-400" },
    APPROVED: { label:"Approved", bg:"bg-green-500/15",  text:"text-green-400"  },
    REJECTED: { label:"Rejected", bg:"bg-red-500/15",    text:"text-red-400"    },
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <h2 className="text-white font-black text-xl">📤 Request a New Movie</h2>
        <p className="text-white/30 text-sm mt-0.5">
          Submit a movie to be added to your theatre — it will be reviewed by the admin
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ── Form ──────────────────────────────────────────── */}
        <div className="bg-black border border-white/[0.07] rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-black text-sm mb-1">🎬 Movie Details</h3>

          {/* Title */}
          <div>
            <label className="text-white/40 text-xs font-bold block mb-1.5">Movie Title *</label>
            <input value={form.title} onChange={set("title")} placeholder="e.g. Inception"
              className={`${inputCls} ${errors.title ? errCls : ""}`} />
            {errors.title && <p className="text-red-400 text-[11px] mt-1">⚠ {errors.title}</p>}
          </div>

          {/* Genre + Language */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/40 text-xs font-bold block mb-1.5">Genre *</label>
              <select value={form.genre} onChange={set("genre")}
                className={`${inputCls} ${errors.genre ? errCls : ""}`}>
                <option value="">Select genre</option>
                {GENRES.map(g => <option key={g} value={g}>{g.replace("_"," ")}</option>)}
              </select>
              {errors.genre && <p className="text-red-400 text-[11px] mt-1">⚠ {errors.genre}</p>}
            </div>
            <div>
              <label className="text-white/40 text-xs font-bold block mb-1.5">Language *</label>
              <select value={form.language} onChange={set("language")}
                className={`${inputCls} ${errors.language ? errCls : ""}`}>
                <option value="">Select language</option>
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              {errors.language && <p className="text-red-400 text-[11px] mt-1">⚠ {errors.language}</p>}
            </div>
          </div>

          {/* Format + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/40 text-xs font-bold block mb-1.5">Format *</label>
              <select value={form.format} onChange={set("format")}
                className={`${inputCls} ${errors.format ? errCls : ""}`}>
                <option value="">Select format</option>
                {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              {errors.format && <p className="text-red-400 text-[11px] mt-1">⚠ {errors.format}</p>}
            </div>
            <div>
              <label className="text-white/40 text-xs font-bold block mb-1.5">Duration (mins) *</label>
              <input value={form.duration} onChange={set("duration")} placeholder="e.g. 148" type="number"
                className={`${inputCls} ${errors.duration ? errCls : ""}`} />
              {errors.duration && <p className="text-red-400 text-[11px] mt-1">⚠ {errors.duration}</p>}
            </div>
          </div>

          {/* Director + Release Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/40 text-xs font-bold block mb-1.5">Director *</label>
              <input value={form.director} onChange={set("director")} placeholder="e.g. Christopher Nolan"
                className={`${inputCls} ${errors.director ? errCls : ""}`} />
              {errors.director && <p className="text-red-400 text-[11px] mt-1">⚠ {errors.director}</p>}
            </div>
            <div>
              <label className="text-white/40 text-xs font-bold block mb-1.5">Release Date *</label>
              <input value={form.releaseDate} onChange={set("releaseDate")} type="date"
                className={`${inputCls} ${errors.releaseDate ? errCls : ""}`} />
              {errors.releaseDate && <p className="text-red-400 text-[11px] mt-1">⚠ {errors.releaseDate}</p>}
            </div>
          </div>

          {/* Cast + Rating */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/40 text-xs font-bold block mb-1.5">Cast</label>
              <input value={form.cast} onChange={set("cast")} placeholder="e.g. Leo DiCaprio, …"
                className={inputCls} />
            </div>
            <div>
              <label className="text-white/40 text-xs font-bold block mb-1.5">Rating</label>
              <select value={form.rating} onChange={set("rating")} className={inputCls}>
                <option value="">Select rating</option>
                {["U","UA","A","S"].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-white/40 text-xs font-bold block mb-1.5">Description *</label>
            <textarea value={form.description} onChange={set("description")} rows={3}
              placeholder="Brief synopsis of the movie..."
              className={`${inputCls} resize-none ${errors.description ? errCls : ""}`} />
            {errors.description && <p className="text-red-400 text-[11px] mt-1">⚠ {errors.description}</p>}
          </div>

          {/* Error summary */}
          {touched && Object.keys(errors).length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <p className="text-red-400 text-xs font-bold mb-1">Please fix {Object.keys(errors).length} error(s):</p>
              <ul className="space-y-0.5">
                {Object.values(errors).map((e, i) => (
                  <li key={i} className="text-red-400/70 text-[11px]">• {e}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || (touched && Object.keys(errors).length > 0)}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40
                       disabled:cursor-not-allowed text-white font-black py-3 rounded-xl
                       text-sm transition">
            {loading ? "Submitting…" : "📤 Submit Movie Request"}
          </button>
        </div>

        {/* ── Request History ───────────────────────────────── */}
        <div className="bg-black border border-white/[0.07] rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-black text-sm">📋 My Requests</h3>
          {histLoading ? (
            <div className="py-10 text-center text-white/20 text-sm">Loading…</div>
          ) : history.length === 0 ? (
            <div className="py-10 text-center text-white/20">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm">No requests submitted yet</p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
              {history.map(r => {
                const s = STATUS_META[r.status] ?? STATUS_META.PENDING;
                return (
                  <div key={r.id}
                    className="border border-white/[0.07] rounded-xl p-4 space-y-2
                               hover:border-white/[0.12] transition">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-white text-sm font-bold truncate">{r.summary}</p>
                      <span className={`shrink-0 text-[10px] font-black px-2.5 py-1
                                       rounded-full ${s.bg} ${s.text}`}>
                        {s.label}
                      </span>
                    </div>
                    <p className="text-white/25 text-[11px]">
                      🕐 {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN",
                        { day:"2-digit", month:"short", year:"numeric" }) : "—"}
                    </p>
                    {r.status === "REJECTED" && r.reviewNote && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                        <p className="text-red-400 text-[11px] font-bold">Rejection reason:</p>
                        <p className="text-red-400/70 text-[11px] mt-0.5">{r.reviewNote}</p>
                      </div>
                    )}
                    {r.status === "APPROVED" && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                        <p className="text-green-400 text-[11px]">✅ Movie has been added to the system</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}