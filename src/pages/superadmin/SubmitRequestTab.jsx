import { useState, useEffect } from "react";
import axios from "axios";
import { getToken } from "../../utils/jwtUtil";
import { toast } from "react-toastify";
import { API } from "../../config/api";

// const API  = "http://localhost:8080/api";
const auth = () => ({ Authorization: `Bearer ${getToken()}` });

const GENRES    = ["ACTION","COMEDY","DRAMA","HORROR","ROMANCE","THRILLER","SCI_FI","ANIMATION","DOCUMENTARY","SPORTS"];
const LANGUAGES = ["Tamil","English","Hindi","Telugu","Malayalam","Kannada"];
const FORMATS   = ["2D","3D","IMAX","4DX"];
const ROLES     = ["USER","MANAGER","ADMIN"];

const TYPES = [
  { key: "MOVIE", icon: "", label: "Movie"  },
  { key: "VENUE", icon: "", label: "Venue"  },
  { key: "USER",  icon: "", label: "User"   },
];

const STATUS_STYLE = {
  PENDING:  "bg-yellow-500/10 text-yellow-400 border-yellow-500/25",
  APPROVED: "bg-green-500/10  text-green-400  border-green-500/25",
  REJECTED: "bg-red-500/10   text-red-400    border-red-500/25",
};

// ── Validation ────────────────────────────────────────────────
const validate = (tab, movie, venue, user) => {
  const e = {};
  if (tab === "MOVIE") {
    if (!movie.title.trim())       e.title       = "Title is required";
    if (!movie.genre)              e.genre       = "Genre is required";
    if (!movie.language)           e.language    = "Language is required";
    if (!movie.format)             e.format      = "Format is required";
    if (!movie.duration.trim())    e.duration    = "Duration is required";
    if (!movie.director.trim())    e.director    = "Director is required";
    if (!movie.releaseDate)        e.releaseDate = "Release date is required";
    if(!movie.cast.trim())         e.cast  = "Cast field is required";
    if (!movie.description.trim()) e.description = "Description is required";
  }
  if (tab === "VENUE") {
    if (!venue.name.trim())    e.name       = "Venue name is required";
    if (!venue.city.trim())    e.city       = "City is required";
    if (!venue.area.trim())    e.area       = "Area is required";
    if (!venue.address.trim()) e.address    = "Address is required";
    if (!venue.totalSeats || isNaN(venue.totalSeats) || Number(venue.totalSeats) < 1)
                               e.totalSeats = "Valid seat count required (min 1)";
  }
  if (tab === "USER") {
    if (!user.name.trim())    e.name     = "Full name is required";
    if (!user.email.trim())   e.email    = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email))
                              e.email    = "Enter a valid email address";
    if (!user.password.trim())   e.password = "Password is required";
    else if (user.password.length < 6)
                              e.password = "Password must be at least 6 characters";
  }
  return e;
};

// ── Field wrapper ─────────────────────────────────────────────
const labelCls = "block text-white/30 text-[10px] font-black uppercase tracking-widest mb-1.5";

const fieldCls = (err) =>
  `w-full bg-white/[0.04] border rounded-xl px-4 py-2.5 text-white text-sm
   placeholder-white/20 focus:outline-none focus:ring-2 transition
   ${err
     ? "border-red-500/60 focus:ring-red-500/40 bg-red-500/[0.04]"
     : "border-white/10 focus:ring-red-500/30 focus:border-red-500/40"}`;

function Field({ label, error, children }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
      {error && (
        <p className="mt-1.5 text-[11px] text-red-400 font-semibold flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
export default function SubmitRequestTab() {
  const [tab,        setTab]        = useState("MOVIE");
  const [dropOpen,   setDropOpen]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors,     setErrors]     = useState({});
  const [touched,    setTouched]    = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [loadingMy,  setLoadingMy]  = useState(true);

  const [movie, setMovie] = useState({
    title:"", genre:"", language:"", format:"", duration:"",
    director:"", cast:"", description:"", rating:"", releaseDate:""
  });
  const [venue, setVenue] = useState({
    name:"", city:"", area:"", address:"", totalSeats:""
  });
  const [user, setUser] = useState({
    name:"", email:"", password:"", role:"USER"
  });

  const loadMine = () => {
    setLoadingMy(true);
    axios.get(`${API.API_URL}/admin/requests/mine`, { headers: auth() })
      .then(r => setMyRequests(r.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingMy(false));
  };
  useEffect(() => { loadMine(); }, []);

  // Live re-validate after first submit attempt
  useEffect(() => {
    if (touched) setErrors(validate(tab, movie, venue, user));
  }, [tab, movie, venue, user, touched]);

  const fm = k => e => setMovie(p => ({ ...p, [k]: e.target.value }));
  const fv = k => e => setVenue(p => ({ ...p, [k]: e.target.value }));
  const fu = k => e => setUser(p  => ({ ...p, [k]: e.target.value }));

  const switchTab = (key) => {
    setTab(key);
    setDropOpen(false);
    setErrors({});
    setTouched(false);
  };

  const submit = async () => {
    setTouched(true);
    const errs = validate(tab, movie, venue, user);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("Please fill in all required fields before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      const endpoints = {
        MOVIE: `${API.API_URL}/admin/requests/movie`,
        VENUE: `${API.API_URL}/admin/requests/venue`,
        USER:  `${API.API_URL}/admin/requests/user`,
      };
      const payload = tab === "MOVIE" ? movie : tab === "VENUE" ? venue : user;
      await axios.post(endpoints[tab], payload, { headers: auth() });
      toast.success("✅ Request submitted! Awaiting SuperAdmin approval.");
      if (tab === "MOVIE") setMovie({ title:"", genre:"", language:"", format:"", duration:"", director:"", cast:"", description:"", rating:"", releaseDate:"" });
      if (tab === "VENUE") setVenue({ name:"", city:"", area:"", address:"", totalSeats:"" });
      if (tab === "USER")  setUser({ name:"", email:"", password:"", role:"USER" });
      setErrors({});
      setTouched(false);
      loadMine();
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const currentType = TYPES.find(t => t.key === tab);
  const errorCount  = Object.keys(errors).length;

  return (
    <div className="max-w-2xl space-y-5">

      {/* Notice */}
      <div className="bg-yellow-500/[0.08] border border-yellow-500/20 rounded-2xl px-5 py-4 flex gap-3">
        <span className="text-xl">⚠️</span>
        <div>
          <p className="text-yellow-400 font-bold text-sm">Approval Required</p>
          <p className="text-yellow-400/60 text-xs mt-0.5">
            Your request will be reviewed by SuperAdmin before the record is created.
          </p>
        </div>
      </div>

      {/* ── Dropdown type selector ── */}
      <div className="relative">
        <label className={labelCls}>Select Request Type</label>
        <button onClick={() => setDropOpen(p => !p)}
          className="w-full flex items-center justify-between bg-white/[0.04]
                     border border-white/10 rounded-xl px-4 py-3 text-white text-sm
                     font-semibold hover:border-red-500/30 transition">
          <span className="flex items-center gap-2.5">
            <span className="text-base">{currentType.icon}</span>
            <span>Request: {currentType.label}</span>
          </span>
          <span className={`text-white/30 text-xs transition-transform duration-200
                            ${dropOpen ? "rotate-180" : ""}`}>▼</span>
        </button>

        {dropOpen && (
          <div className="absolute z-20 w-full mt-1.5 bg-gray-950 border border-white/10
                          rounded-xl overflow-hidden shadow-2xl">
            {TYPES.map(t => (
              <button key={t.key} onClick={() => switchTab(t.key)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm
                            transition text-left border-b border-white/[0.05] last:border-0
                            ${tab === t.key
                              ? "bg-red-500/10 text-white font-bold"
                              : "text-white/50 hover:bg-white/[0.05] hover:text-white/80"}`}>
                <span className="text-base">{t.icon}</span>
                <span>{t.label}</span>
                {tab === t.key && <span className="ml-auto text-red-400 text-xs font-black">✓ Selected</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── MOVIE FORM ── */}
      {tab === "MOVIE" && (
        <div className="bg-black border border-white/[0.08] rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-black text-sm flex items-center gap-2">
            🎬 Movie Details
            <span className="text-white/20 font-normal text-xs">— all * fields are required</span>
          </h3>

          <Field label="Title *" error={errors.title}>
            <input value={movie.title} onChange={fm("title")}
              placeholder="e.g. Interstellar" className={fieldCls(errors.title)} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Genre *" error={errors.genre}>
              <select value={movie.genre} onChange={fm("genre")} className={fieldCls(errors.genre)}>
                <option value="">Select genre</option>
                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>

            <Field label="Language *" error={errors.language}>
              <select value={movie.language} onChange={fm("language")} className={fieldCls(errors.language)}>
                <option value="">Select language</option>
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </Field>

            <Field label="Format *" error={errors.format}>
              <select value={movie.format} onChange={fm("format")} className={fieldCls(errors.format)}>
                <option value="">Select format</option>
                {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </Field>

            <Field label="Duration *" error={errors.duration}>
              <input value={movie.duration} onChange={fm("duration")}
                placeholder="e.g. 2h 30m" className={fieldCls(errors.duration)} />
            </Field>

            <Field label="Director *" error={errors.director}>
              <input value={movie.director} onChange={fm("director")}
                placeholder="Director name" className={fieldCls(errors.director)} />
            </Field>

            <Field label="Release Date *" error={errors.releaseDate}>
              <input type="date" value={movie.releaseDate} onChange={fm("releaseDate")}
                className={fieldCls(errors.releaseDate)} />
            </Field>
          </div>

          <Field label="Cast" error={errors.cast}>
            <input value={movie.cast} onChange={fm("cast")}
              placeholder="Actor1, Actor2, Actor3" className={fieldCls(errors.cast)} />
          </Field>

          <Field label="Description *" error={errors.description}>
            <textarea value={movie.description} onChange={fm("description")} rows={3}
              placeholder="Brief plot summary…"
              className={fieldCls(errors.description) + " resize-none"} />
          </Field>
        </div>
      )}

      {/* ── VENUE FORM ── */}
      {tab === "VENUE" && (
        <div className="bg-black border border-white/[0.08] rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-black text-sm flex items-center gap-2">
            🏛️ Venue Details
            <span className="text-white/20 font-normal text-xs">— all * fields are required</span>
          </h3>

          <Field label="Venue Name *" error={errors.name}>
            <input value={venue.name} onChange={fv("name")}
              placeholder="e.g. PVR Cinemas" className={fieldCls(errors.name)} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="City *" error={errors.city}>
              <input value={venue.city} onChange={fv("city")}
                placeholder="e.g. Chennai" className={fieldCls(errors.city)} />
            </Field>

            <Field label="Area *" error={errors.area}>
              <input value={venue.area} onChange={fv("area")}
                placeholder="e.g. Anna Nagar" className={fieldCls(errors.area)} />
            </Field>

            <Field label="Total Seats *" error={errors.totalSeats}>
              <input type="number" min="1" value={venue.totalSeats} onChange={fv("totalSeats")}
                placeholder="e.g. 250" className={fieldCls(errors.totalSeats)} />
            </Field>
          </div>

          <Field label="Full Address *" error={errors.address}>
            <input value={venue.address} onChange={fv("address")}
              placeholder="Street, locality, city" className={fieldCls(errors.address)} />
          </Field>
        </div>
      )}

      {/* ── USER FORM ── */}
      {tab === "USER" && (
        <div className="bg-black border border-white/[0.08] rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-black text-sm flex items-center gap-2">
             User Details
            <span className="text-white/20 font-normal text-xs">— all * fields are required</span>
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Full Name *" error={errors.name}>
              <input value={user.name} onChange={fu("name")}
                placeholder="e.g. John Doe" className={fieldCls(errors.name)} />
            </Field>

            <Field label="Email *" error={errors.email}>
              <input type="email" value={user.email} onChange={fu("email")}
                placeholder="user@example.com" className={fieldCls(errors.email)} />
            </Field>

            <Field label="Password * (min 6 chars)" error={errors.password}>
              <input type="password" value={user.password} onChange={fu("password")}
                placeholder="••••••••" className={fieldCls(errors.password)} />
            </Field>

            <Field label="Role" error={errors.role}>
              <select value={user.role} onChange={fu("role")} className={fieldCls(errors.role)}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
          </div>
        </div>
      )}

      {/* ── Validation summary ── */}
      {touched && errorCount > 0 && (
        <div className="bg-red-500/[0.08] border border-red-500/25 rounded-xl px-4 py-3.5">
          <p className="text-red-400 text-xs font-black mb-2 flex items-center gap-1.5">
            <span>🚫</span> {errorCount} field{errorCount > 1 ? "s" : ""} need{errorCount === 1 ? "s" : ""} attention:
          </p>
          <ul className="space-y-1">
            {Object.values(errors).map((err, i) => (
              <li key={i} className="text-red-400/70 text-xs flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-red-400/50 shrink-0" />
                {err}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Submit ── */}
      <button onClick={submit} disabled={submitting || (touched && errorCount > 0)}
        className={`w-full py-4 rounded-xl font-black text-sm transition-all
          ${submitting
            ? "bg-white/[0.05] text-white/20 cursor-not-allowed"
            : touched && errorCount > 0
              ? "bg-white/[0.05] text-white/20 cursor-not-allowed"
              : "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25 hover:scale-[1.01]"}`}>
        {submitting ? "Submitting…" : "📤 Submit for Approval"}
      </button>

      {/* ── My submitted requests ── */}
      <div className="pt-2 border-t border-white/[0.06]">
        <div className="flex items-center gap-2 mb-4 pt-4">
          <div className="w-1 h-5 bg-red-500 rounded-full" />
          <h3 className="text-white font-black text-base">My Submitted Requests</h3>
          <span className="ml-auto text-white/20 text-xs">{myRequests.length} total</span>
        </div>

        {loadingMy ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
          </div>
        ) : myRequests.length === 0 ? (
          <div className="text-center py-10 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
            <p className="text-3xl mb-2 opacity-20">📭</p>
            <p className="text-white/25 text-sm">No requests submitted yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {myRequests.map(r => (
              <div key={r.id}
                className="flex items-center justify-between bg-white/[0.03]
                           border border-white/[0.07] rounded-xl px-4 py-3
                           hover:border-white/10 transition">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{r.summary}</p>
                  <p className="text-white/25 text-xs mt-0.5">
                    {new Date(r.createdAt).toLocaleDateString("en-IN", {
                      day:"2-digit", month:"short", year:"numeric"
                    })}
                    {r.status === "REJECTED" && r.reviewNote && (
                      <span className="text-red-400/70"> · Reason: {r.reviewNote}</span>
                    )}
                  </p>
                </div>
                <span className={`ml-3 shrink-0 text-[10px] font-black uppercase
                                  tracking-widest px-3 py-1 rounded-full border
                                  ${STATUS_STYLE[r.status]}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}