import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const API = "http://localhost:8080/api/partner";

const CITIES = [
  "Mumbai","Delhi","Bangalore","Chennai","Hyderabad","Kolkata",
  "Pune","Ahmedabad","Jaipur","Surat","Lucknow","Kochi",
  "Chandigarh","Coimbatore","Salem","Nagpur","Vadodara","Other",
];
const STATES = [
  "Tamil Nadu","Maharashtra","Karnataka","Delhi","Telangana",
  "West Bengal","Gujarat","Rajasthan","Kerala","Uttar Pradesh",
  "Punjab","Madhya Pradesh","Haryana","Bihar","Other",
];

export default function PartnerRegister() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [touched,   setTouched]   = useState(false);
  const [result,    setResult]    = useState(null);   // success response

  const [form, setForm] = useState({
    name:"", email:"", phone:"", password:"", confirmPassword:"", theatreName:"",
    city:"", state:"", address:"", pincode:"",
    description:"", websiteUrl:"",
  });
  const [errors, setErrors] = useState({});

  const validate = f => {
    const e = {};
    if (!f.name.trim())        e.name        = "Full name is required";
    if (!f.email.trim())       e.email       = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(f.email)) e.email = "Invalid email format";
    if (!f.phone.trim())       e.phone       = "Phone is required";
    else if (!/^\d{10}$/.test(f.phone.replace(/\D/g,""))) e.phone = "Enter 10-digit number";
    if (!f.password.trim())    e.password    = "Password is required";
    else if (f.password.length < 8)             e.password = "Minimum 8 characters";
    if (f.confirmPassword !== f.password)       e.confirmPassword = "Passwords do not match";
    if (!f.theatreName.trim()) e.theatreName = "Theatre name is required";
    if (!f.city)               e.city        = "City is required";
    if (!f.state)              e.state       = "State is required";
    if (!f.address.trim())     e.address     = "Address is required";
    return e;
  };

  const set = k => e => {
    const val = e.target.value;
    setForm(p => ({ ...p, [k]: val }));
    if (touched) setErrors(validate({ ...form, [k]: val }));
  };

  const handleSubmit = async () => {
    setTouched(true);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const res = await axios.post(`${API}/apply`, form);
      setResult(res.data);
      setSubmitted(true);
    } catch (ex) {
      toast.error(ex.response?.data?.error ?? "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ─────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#050507] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-7">
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
            <div className="relative w-24 h-24 rounded-full bg-red-500/10 border-2 border-red-500/40 flex items-center justify-center text-5xl">
              
            </div>
          </div>
          <div>
            <h1 className="text-white font-black text-3xl tracking-tight">Application Received!</h1>
            <p className="text-white/40 text-sm mt-3 leading-relaxed">
              Thanks, <span className="text-red-400 font-semibold">{form.name}</span>!
              Your application for <span className="text-white font-semibold">"{form.theatreName}"</span> is under review.
              We'll reach out to <span className="text-red-400">{form.email}</span> within 2–3 business days.
            </p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 text-left space-y-3">
            <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-1">What happens next?</p>
            {[
              { n:"01", text:"Our team reviews your application & theatre details" },
              { n:"02", text:"You receive an approval email with login credentials" },
              { n:"03", text:"Log in and start adding your shows to BookWhiz!" },
            ].map(s => (
              <div key={s.n} className="flex items-center gap-4">
                <span className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/30
                                 text-red-400 text-xs font-black flex items-center justify-center shrink-0">
                  {s.n}
                </span>
                <p className="text-white/40 text-sm">{s.text}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate("/login")}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-3
                         rounded-xl text-sm transition">
              Go to Login
            </button>
            <button onClick={() => navigate("/partner/status")}
              className="flex-1 bg-white/[0.05] hover:bg-white/[0.08] border border-white/10
                         text-white/60 font-bold py-3 rounded-xl text-sm transition">
              Track Status
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasErr = Object.keys(errors).length > 0;

  const inp  = (name, extra = "") =>
    `w-full bg-white/[0.05] border ${errors[name] ? "border-red-500/60 bg-red-500/[0.04]" : "border-white/10"}
     rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 outline-none
     focus:border-red-500/60 focus:bg-white/[0.07] transition ${extra}`;

  const Err = ({ name }) => errors[name]
    ? <p className="text-red-400 text-[11px] mt-1.5 flex items-center gap-1"><span>⚠</span>{errors[name]}</p>
    : null;

  return (
    <div className="min-h-screen bg-[#050507] text-white">

      {/* Nav */}
      <div className="border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate("/")} className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-black text-sm">B</div>
          <div>
            <p className="text-white font-black text-sm leading-none">BookWhiz</p>
            <p className="text-white/25 text-[10px]">Partner Program</p>
          </div>
        </button>
        <button onClick={() => navigate("/login")}
          className="text-white/30 hover:text-white/70 text-sm transition">
          Already a partner? <span className="text-red-400">Login →</span>
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 grid lg:grid-cols-[1fr_1.2fr] gap-12 items-start">

        {/* ── Left: Pitch ─────────────────────────────────── */}
        <div className="space-y-8 lg:sticky lg:top-8">
          <div>
            <p className="text-red-400 text-xs font-black uppercase tracking-widest mb-3">
              BookWhiz Partner Program
            </p>
            <h1 className="text-4xl lg:text-5xl font-black leading-[1.1] tracking-tight">
              List Your Theatre<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-600">
                Reach Millions
              </span>
            </h1>
            <p className="text-white/40 mt-4 text-base leading-relaxed">
              Join India's growing movie booking network. Manage shows, track revenue,
              and fill every seat — all from one powerful dashboard.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { icon:"", title:"Manage Shows",    desc:"Add screens, timings, prices in seconds" },
              { icon:"", title:"Live Analytics",  desc:"Real-time revenue, occupancy & insights" },
              { icon:"", title:"Ticket Scanner",  desc:"Built-in QR scan for instant verification" },
              { icon:"", title:"Instant Setup",   desc:"Go live the same day you're approved" },
            ].map(f => (
              <div key={f.title}
                className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl space-y-1.5
                           hover:bg-white/[0.05] hover:border-red-500/20 transition">
                <span className="text-xl">{f.icon}</span>
                <p className="text-white font-bold text-sm">{f.title}</p>
                <p className="text-white/30 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 pt-2">
            <div className="flex -space-x-2">
              {["🎬","🍿","🎞","🎦"].map((e,i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-white/10 border border-white/20
                                         flex items-center justify-center text-sm">{e}</div>
              ))}
            </div>
            <p className="text-white/30 text-sm">Join 200+ theatres already on BookWhiz</p>
          </div>
        </div>

        {/* ── Right: Form ──────────────────────────────────── */}
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-7 space-y-6">
          <div>
            <h2 className="text-white font-black text-xl">Partner Application</h2>
            <p className="text-white/25 text-xs mt-1">Fields marked * are required</p>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <p className="text-white/25 text-[10px] font-black uppercase tracking-widest">Your Details</p>
            <div>
              <input value={form.name} onChange={set("name")} placeholder="Full name *" className={inp("name")} />
              <Err name="name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input value={form.email} onChange={set("email")} placeholder="Email address *" type="email" className={inp("email")} />
                <Err name="email" />
              </div>
              <div>
                <input value={form.phone} onChange={set("phone")} placeholder="Phone (10 digits) *" className={inp("phone")} />
                <Err name="phone" />
              </div>

              {/* Password */}
              <div className="relative">
                <input value={form.password} onChange={set("password")}
                  placeholder="Password *" type="password"
                  className={inp("password")} />
                <Err name="password" />
              </div>
              <div className="relative">
                <input value={form.confirmPassword} onChange={set("confirmPassword")}
                  placeholder="Confirm password *" type="password"
                  className={inp("confirmPassword")} />
                <Err name="confirmPassword" />
              </div>
            </div>
          </div>

          {/* Theatre */}
          <div className="space-y-3">
            <p className="text-white/25 text-[10px] font-black uppercase tracking-widest">Theatre Details</p>
            <div>
              <input value={form.theatreName} onChange={set("theatreName")} placeholder="Theatre / company name *" className={inp("theatreName")} />
              <Err name="theatreName" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <select value={form.city} onChange={set("city")} className={inp("city")}>
                  <option value="">Select city *</option>
                  {CITIES.map(c => <option key={c} value={c} className="bg-[#111]">{c}</option>)}
                </select>
                <Err name="city" />
              </div>
              <div>
                <select value={form.state} onChange={set("state")} className={inp("state")}>
                  <option value="">Select state *</option>
                  {STATES.map(s => <option key={s} value={s} className="bg-[#111]">{s}</option>)}
                </select>
                <Err name="state" />
              </div>
            </div>
            <div>
              <input value={form.address} onChange={set("address")} placeholder="Theatre address *" className={inp("address")} />
              <Err name="address" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input value={form.pincode} onChange={set("pincode")} placeholder="Pincode (optional)" className={inp("pincode")} />
              <input value={form.websiteUrl} onChange={set("websiteUrl")} placeholder="Website (optional)" className={inp("websiteUrl")} />
            </div>
          </div>

          {/* About */}
          <div className="space-y-3">
            <p className="text-white/25 text-[10px] font-black uppercase tracking-widest">About Your Theatre</p>
            <textarea
              value={form.description} onChange={set("description")} rows={3}
              placeholder="Tell us about your screens, seating capacity, sound systems, special formats (Dolby, IMAX, 4DX)…"
              className={`${inp("description")} resize-none`}
            />
          </div>

          {/* Error summary */}
          {touched && hasErr && (
            <div className="flex items-start gap-3 bg-red-500/[0.08] border border-red-500/20 rounded-xl p-3">
              <span className="text-red-400 text-lg">⚠</span>
              <p className="text-red-400 text-xs leading-relaxed">
                Please fix {Object.keys(errors).length} error{Object.keys(errors).length > 1 ? "s" : ""} above before submitting.
              </p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || (touched && hasErr)}
            className="w-full py-4 bg-red-600 hover:bg-red-700 active:bg-red-800
                       disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer
                       text-white font-black text-sm rounded-xl transition"
          >
            {loading
              ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting…</span>
              : "🚀 Submit Partner Application"
            }
          </button>

          <p className="text-white/15 text-[11px] text-center leading-relaxed">
            By applying you agree to BookWhiz's Partner Terms. Keep your password safe — you'll use it to access your partner dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}