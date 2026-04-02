import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { getToken } from "../../utils/jwtUtil";
import { toast } from "react-toastify";
import { invalidatePermissionsCache } from "../../hooks/userPermissions";
import { API } from "../../config/api";

// const API  = "http://localhost:8080/api/superadmin/roles";
// const PAPI = "http://localhost:8080/api/superadmin/permissions";
const auth = () => ({ Authorization: `Bearer ${getToken()}` });

const CATEGORY_ICONS = {
  Users:"👤", Movies:"🎬", Shows:"🎭", Venues:"🏛️",
  Bookings:"🎟️", Reports:"📊", Partners:"🤝",
  Dashboards:"📱", Analytics:"📈", Approvals:"✅", Permissions:"🔐",
};
const PRESET_COLORS = [
  "#ef4444","#f97316","#f59e0b","#22c55e","#14b8a6",
  "#3b82f6","#6366f1","#8b5cf6","#ec4899","#64748b",
];
const PRESET_ICONS = ["🎯","🌟","🔮","⚡","🚀","🎭","🦁","🔑","💎","🏆","📋","🛡️"];
const BASE_ROLES   = [
  { value:"USER",    label:"User",    desc:"Basic access — bookings, movies, shows" },
  { value:"MANAGER", label:"Manager", desc:"Theater management access" },
  { value:"ADMIN",   label:"Admin",   desc:"Full admin panel access" },
];

// ─── Toggle switch ────────────────────────────────────────────
function Toggle({ isOn, isBusy, color = "#8b5cf6", onClick }) {
  return (
    <button onClick={onClick} disabled={isBusy}
      className={`relative w-11 h-6 rounded-full transition-all duration-200
        ${isBusy ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
      style={{ background: isOn ? color : "#e5e7eb" }}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full
                        shadow transition-transform duration-200
                        ${isOn ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

// ─── Role card ────────────────────────────────────────────────
function RoleCard({ role, isSelected, onClick, onDelete }) {
  const isBuiltIn = ["SUPER_ADMIN","ADMIN","MANAGER","USER"].includes(role.name);
  return (
    <div onClick={onClick}
      className="rounded-2xl border-2 p-5 cursor-pointer transition-all hover:shadow-lg relative"
      style={{
        borderColor: isSelected ? role.color : "#e5e7eb",
        background:  isSelected ? `${role.color}10` : "#fff",
        boxShadow:   isSelected ? `0 0 0 3px ${role.color}20` : "none",
      }}>
      {!isBuiltIn && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(role); }}
          className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gray-100
                     hover:bg-red-100 hover:text-red-500 text-gray-400 text-xs
                     flex items-center justify-center transition"
          title="Delete role">✕</button>
      )}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
          style={{ background: `${role.color}20` }}>
          {role.icon ?? "🎭"}
        </div>
        <div>
          <h3 className="font-black text-gray-900 text-base">{role.displayName ?? role.name}</h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
            style={{ background: role.color }}>
            {role.name}
          </span>
        </div>
      </div>
      {role.description && (
        <p className="text-xs text-gray-400 mb-3 line-clamp-2">{role.description}</p>
      )}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>👥 {role.userCount ?? 0} user{role.userCount !== 1 ? "s" : ""}</span>
        {role.enabledPerms !== undefined && (
          <span>🔐 {role.enabledPerms} perms</span>
        )}
        {role.baseSpringRole && (
          <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">
            base: {role.baseSpringRole}
          </span>
        )}
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-3">
        <div className="h-full rounded-full transition-all"
          style={{ width:`${Math.min(100, ((role.enabledPerms ?? 0) / 31) * 100)}%`,
                   background: role.color }} />
      </div>
    </div>
  );
}

// ─── Create Role Modal ────────────────────────────────────────
function CreateRoleModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "", displayName: "", description: "",
    color: "#8b5cf6", icon: "🎭", baseSpringRole: "MANAGER",
  });
  const [saving, setSaving] = useState(false);
  const f = k => v => setForm(p => ({ ...p, [k]: typeof v === "string" ? v : v.target.value }));

  const submit = async () => {
    if (!form.name.trim())        { toast.error("Role name required"); return; }
    if (!form.displayName.trim()) { toast.error("Display name required"); return; }
    try {
      setSaving(true);
      await axios.post(API.SUPER_ADMIN_ROLES, { ...form, name: form.name.toUpperCase().replace(/\s+/g,"_") }, { headers: auth() });
      toast.success(`Role "${form.displayName}" created!`);
      onCreated();
      onClose();
    } catch (e) {
      toast.error(e.response?.data ?? "Failed to create role");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-gray-900">✨ Create New Role</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-xl">✕</button>
        </div>

        {/* Preview */}
        <div className="flex items-center gap-4 p-4 rounded-2xl border-2 mb-6"
          style={{ borderColor: form.color, background: `${form.color}08` }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
            style={{ background: `${form.color}20` }}>
            {form.icon}
          </div>
          <div>
            <p className="font-black text-gray-900 text-lg">{form.displayName || "New Role"}</p>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
              style={{ background: form.color }}>
              {form.name.toUpperCase().replace(/\s+/g,"_") || "ROLE_NAME"}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Name + Display Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Internal Name *</label>
              <input value={form.name} onChange={f("name")}
                placeholder="SUPERVISOR" maxLength={30}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm w-full
                           focus:outline-none focus:ring-2 focus:ring-violet-400 font-mono uppercase" />
              <p className="text-[10px] text-gray-400 mt-1">Letters, numbers, _ only</p>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Display Name *</label>
              <input value={form.displayName} onChange={f("displayName")}
                placeholder="Supervisor"
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm w-full
                           focus:outline-none focus:ring-2 focus:ring-violet-400" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1">Description</label>
            <textarea value={form.description} onChange={f("description")} rows={2}
              placeholder="What does this role do?"
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm w-full resize-none
                         focus:outline-none focus:ring-2 focus:ring-violet-400" />
          </div>

          {/* Base Spring Role */}
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-2">Base Access Level *</label>
            <div className="grid grid-cols-3 gap-2">
              {BASE_ROLES.map(br => (
                <button key={br.value}
                  onClick={() => setForm(p => ({ ...p, baseSpringRole: br.value }))}
                  className={`p-3 rounded-xl border-2 text-left transition ${
                    form.baseSpringRole === br.value
                      ? "border-violet-500 bg-violet-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}>
                  <p className="text-sm font-bold text-gray-800">{br.label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{br.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-2">Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map(col => (
                <button key={col} onClick={() => setForm(p => ({ ...p, color: col }))}
                  className="w-8 h-8 rounded-xl transition hover:scale-110"
                  style={{ background: col,
                           boxShadow: form.color === col ? `0 0 0 3px ${col}40, 0 0 0 2px white` : "none" }} />
              ))}
              <input type="color" value={form.color}
                onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                className="w-8 h-8 rounded-xl cursor-pointer border-0" />
            </div>
          </div>

          {/* Icon */}
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-2">Icon</label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_ICONS.map(ic => (
                <button key={ic} onClick={() => setForm(p => ({ ...p, icon: ic }))}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition
                    ${form.icon === ic ? "ring-2 ring-violet-500 bg-violet-50" : "hover:bg-gray-100"}`}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
            Cancel
          </button>
          <button onClick={submit} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition"
            style={{ background: saving ? "#9ca3af" : form.color }}>
            {saving ? "Creating..." : "✨ Create Role"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Permission section for selected role ─────────────────────
function RolePermissions({ role, color }) {
  const [perms,   setPerms]   = useState({});
  const [defs,    setDefs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(null);
  const [bulk,    setBulk]    = useState(false);
  const [search,  setSearch]  = useState("");

  const load = useCallback(() => {
    setLoading(true);
    axios.get(`${API.SUPER_ADMIN_ROLES}/${role.id}/permissions`, { headers: auth() })
      .then(r => { setPerms(r.data.permissions ?? {}); setDefs(r.data.definitions ?? []); })
      .catch(() => toast.error("Failed to load permissions"))
      .finally(() => setLoading(false));
  }, [role.id]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (key, cur) => {
    setSaving(key);
    const nv = !cur;
    setPerms(p => ({ ...p, [key]: nv }));
    try {
      await axios.put(`${API.SUPER_ADMIN_ROLES}/${role.id}/permissions`, { key, enabled: nv }, { headers: auth() });
      invalidatePermissionsCache();
    } catch {
      setPerms(p => ({ ...p, [key]: cur }));
      toast.error("Failed");
    } finally { setSaving(null); }
  };

  const bulkToggle = async (enable) => {
    setBulk(true);
    const visible = filteredDefs;
    const toChange = visible.filter(d => enable ? !perms[d.key] : perms[d.key]);
    if (!toChange.length) { setBulk(false); return; }
    const backup = { ...perms };
    const updated = { ...perms };
    toChange.forEach(d => { updated[d.key] = enable; });
    setPerms(updated);
    try {
      await Promise.all(toChange.map(d =>
        axios.put(`${API.SUPER_ADMIN_ROLES}/${role.id}/permissions`, { key: d.key, enabled: enable }, { headers: auth() })
      ));
      toast.success(`${enable ? "Enabled" : "Disabled"} ${toChange.length} permissions`);
      invalidatePermissionsCache();
    } catch {
      setPerms(backup);
      toast.error("Bulk update failed");
    } finally { setBulk(false); }
  };

  const filteredDefs = search.trim()
    ? defs.filter(d => d.label.toLowerCase().includes(search.toLowerCase()) ||
                       d.key.toLowerCase().includes(search.toLowerCase()))
    : defs;

  const byCategory = filteredDefs.reduce((acc, d) => {
    (acc[d.category] = acc[d.category] || []).push(d); return acc;
  }, {});

  const enabledCount = Object.values(perms).filter(Boolean).length;

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-6 h-6 border-4 border-gray-200 border-t-violet-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all"
            style={{ width:`${(enabledCount / defs.length) * 100}%`, background: color }} />
        </div>
        <span className="text-xs font-bold text-gray-500">{enabledCount}/{defs.length}</span>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search permissions..."
            className="border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-xs
                       focus:outline-none focus:ring-2 w-44"
            style={{ "--tw-ring-color": color }} />
        </div>
        <div className="flex gap-2">
          <button onClick={() => bulkToggle(true)} disabled={bulk}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-500 text-white hover:bg-green-600 transition disabled:opacity-50">
            ✅ All On
          </button>
          <button onClick={() => bulkToggle(false)} disabled={bulk}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500 text-white hover:bg-red-600 transition disabled:opacity-50">
            ❌ All Off
          </button>
        </div>
      </div>

      {/* Permission grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Object.entries(byCategory).map(([cat, items]) => {
          const catOn  = items.filter(i => perms[i.key]).length;
          const allOn  = catOn === items.length;
          return (
            <div key={cat} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                <span className="text-base">{CATEGORY_ICONS[cat] ?? "⚙️"}</span>
                <h3 className="text-sm font-bold text-gray-700">{cat}</h3>
                <span className="ml-auto text-xs text-gray-400 mr-2">{catOn}/{items.length}</span>
                <button
                  onClick={async () => {
                    const enable = !allOn;
                    const toChange = items.filter(i => enable ? !perms[i.key] : perms[i.key]);
                    const updated = { ...perms };
                    toChange.forEach(d => { updated[d.key] = enable; });
                    setPerms(updated);
                    await Promise.all(toChange.map(d =>
                      axios.put(`${API.SUPER_ADMIN_ROLES}/${role.id}/permissions`, { key: d.key, enabled: enable }, { headers: auth() })
                    ));
                    invalidatePermissionsCache();
                  }}
                  className="text-xs font-bold px-2 py-1 rounded-md border transition"
                  style={{ background: allOn ? "#fef2f2" : "#f0fdf4",
                           color: allOn ? "#ef4444" : "#16a34a",
                           borderColor: allOn ? "#fecaca" : "#bbf7d0" }}>
                  {allOn ? "Off all" : "On all"}
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {items.map(({ key, label }) => {
                  const isOn   = perms[key] ?? false;
                  const isBusy = saving === key || bulk;
                  return (
                    <div key={key}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/60 transition"
                      style={{ background: isOn ? `${color}05` : "transparent" }}>
                      <div>
                        <p className={`text-sm font-semibold ${isOn ? "text-gray-900" : "text-gray-400"}`}>
                          {label}
                        </p>
                        <p className="text-[10px] text-gray-300 font-mono">{key}</p>
                      </div>
                      <Toggle isOn={isOn} isBusy={isBusy} color={color}
                        onClick={() => { if (!isBusy) toggle(key, isOn); }} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Users section for selected role ─────────────────────────
function RoleUsers({ role, color }) {
  const [assigned,   setAssigned]   = useState([]);
  const [all,        setAll]        = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [acting,     setActing]     = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickSearch, setPickSearch] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      axios.get(`${API.SUPER_ADMIN_ROLES}/${role.id}/users`, { headers: auth() }),
      axios.get(`${API.SUPER_ADMIN_ROLES}/assignable-users`,  { headers: auth() }),
    ]).then(([a, b]) => {
      setAssigned(a.data ?? []);
      setAll(b.data ?? []);
    }).catch(() => toast.error("Failed to load users"))
      .finally(() => setLoading(false));
  }, [role.id]);

  useEffect(() => { load(); }, [load]);

  const assign = async (userId) => {
    setActing(userId);
    try {
      await axios.post(`${API.SUPER_ADMIN_ROLES}/${role.id}/users/${userId}`, {}, { headers: auth() });
      toast.success("User assigned");
      load();
      setShowPicker(false);
    } catch (e) { toast.error(e.response?.data ?? "Failed"); }
    finally { setActing(null); }
  };

  const remove = async (userId) => {
    setActing(userId);
    try {
      await axios.delete(`${API.SUPER_ADMIN_ROLES}/${role.id}/users/${userId}`, { headers: auth() });
      toast.success("User removed from role");
      load();
    } catch { toast.error("Failed"); }
    finally { setActing(null); }
  };

  const filteredAssigned = search.trim()
    ? assigned.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()) ||
                           u.email?.toLowerCase().includes(search.toLowerCase()))
    : assigned;

  const pickable = all.filter(u =>
    !assigned.some(a => a.id === u.id) &&
    (pickSearch.trim() === "" ||
     u.name?.toLowerCase().includes(pickSearch.toLowerCase()) ||
     u.email?.toLowerCase().includes(pickSearch.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search assigned users..."
            className="border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-sm w-full
                       focus:outline-none focus:ring-2 focus:ring-violet-400" />
        </div>
        <button onClick={() => setShowPicker(p => !p)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition"
          style={{ background: color }}>
          ＋ Assign User
        </button>
      </div>

      {/* User picker dropdown */}
      {showPicker && (
        <div className="bg-white rounded-2xl border-2 shadow-xl p-4 space-y-3"
          style={{ borderColor: color }}>
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-gray-800">Assign users to <span style={{ color }}>{role.displayName}</span></h4>
            <button onClick={() => setShowPicker(false)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <input value={pickSearch} onChange={e => setPickSearch(e.target.value)}
            placeholder="Search users to assign..."
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-full
                       focus:outline-none focus:ring-2 focus:ring-violet-400" />
          <div className="max-h-64 overflow-y-auto space-y-1">
            {pickable.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-6">No users available</p>
            ) : pickable.map(u => (
              <div key={u.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 transition">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white"
                    style={{ background: color }}>
                    {(u.name?.[0] ?? "?").toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{u.name || "—"}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {u.customRole && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-600 font-bold">
                      has role
                    </span>
                  )}
                  <button onClick={() => assign(u.id)} disabled={acting === u.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition disabled:opacity-50"
                    style={{ background: color }}>
                    {acting === u.id ? "..." : "Assign"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assigned users */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-4 border-gray-200 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : filteredAssigned.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-gray-500 font-semibold">No users assigned</p>
          <p className="text-gray-400 text-sm mt-1">Click "Assign User" to add members</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["User","Email","Actions"].map(h => (
                  <th key={h} className={`px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider
                    ${h === "Actions" ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredAssigned.map(u => (
                <tr key={u.id} className="hover:bg-gray-50/80 transition">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
                        style={{ background: color }}>
                        {(u.name?.[0] ?? "?").toUpperCase()}
                      </div>
                      <span className="font-semibold text-gray-900">{u.name || "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-gray-400 text-xs">{u.email}</td>
                  <td className="px-4 py-3.5 text-right">
                    <button onClick={() => remove(u.id)} disabled={acting === u.id}
                      className="px-3 py-1.5 text-xs bg-red-50 text-red-600
                                 rounded-lg hover:bg-red-100 transition font-medium disabled:opacity-50">
                      {acting === u.id ? "..." : "🗑️ Remove"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN ROLES TAB
// ════════════════════════════════════════════════════════════
export default function RolesTab() {
  const [roles,        setRoles]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [selected,     setSelected]     = useState(null);
  const [activeSection,setActiveSection]= useState("permissions"); // "permissions" | "users"
  const [showCreate,   setShowCreate]   = useState(false);
  const [confirmDel,   setConfirmDel]   = useState(null);

  // Built-in roles (read-only, no delete)
  const BUILTIN_ROLES = [
    { id:"builtin-sa", name:"SUPER_ADMIN", displayName:"Super Admin", color:"#ef4444",
      icon:"👑", description:"Full platform access. Cannot be modified.", userCount:null,
      enabledPerms:31, isBuiltIn:true },
    { id:"builtin-a",  name:"ADMIN",       displayName:"Admin",       color:"#dc2626",
      icon:"🛠️", description:"Manages platform operations.",            userCount:null,
      enabledPerms:null, isBuiltIn:true },
    { id:"builtin-m",  name:"MANAGER",     displayName:"Manager",     color:"#3b82f6",
      icon:"🏪", description:"Theater owner — manages venues & shows.", userCount:null,
      enabledPerms:null, isBuiltIn:true },
    { id:"builtin-u",  name:"USER",        displayName:"User",        color:"#64748b",
      icon:"👤", description:"Regular user — books movies.",            userCount:null,
      enabledPerms:null, isBuiltIn:true },
  ];

  const loadRoles = useCallback(() => {
    setLoading(true);
    axios.get(API.SUPER_ADMIN_ROLES, { headers: auth() })
      .then(r => setRoles(r.data ?? []))
      .catch(() => toast.error("Failed to load roles"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadRoles(); }, [loadRoles]);

  const handleDelete = async () => {
    const role = confirmDel;
    setConfirmDel(null);
    try {
      await axios.delete(`${API.SUPER_ADMIN_ROLES}/${role.id}`, { headers: auth() });
      toast.success(`Role "${role.displayName}" deleted`);
      if (selected?.id === role.id) setSelected(null);
      loadRoles();
    } catch (e) { toast.error(e.response?.data ?? "Failed to delete role"); }
  };

  const allRoles  = [...BUILTIN_ROLES, ...roles];
  const selColor  = selected?.color ?? "#8b5cf6";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-gray-900">🎭 Role Management</h2>
          <p className="text-gray-400 text-sm mt-1">
            Create custom roles, define their permissions, and assign users.
          </p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold
                     text-white bg-violet-600 hover:bg-violet-700 transition shadow-lg shadow-violet-200">
          ✨ New Role
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:"Built-in Roles", value: BUILTIN_ROLES.length, icon:"🔒", color:"bg-gray-50 border-gray-200" },
          { label:"Custom Roles",   value: roles.length,          icon:"✨", color:"bg-violet-50 border-violet-200" },
          { label:"Total Roles",    value: allRoles.length,        icon:"🎭", color:"bg-blue-50 border-blue-200" },
          { label:"Users with Custom Role", value: roles.reduce((s,r) => s + (r.userCount ?? 0), 0),
            icon:"👥", color:"bg-green-50 border-green-200" },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.color}`}>
            <span className="text-2xl">{s.icon}</span>
            <p className="text-2xl font-black text-gray-900 mt-2">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Roles sidebar */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">
            Built-in Roles
          </h3>
          {BUILTIN_ROLES.map(r => (
            <RoleCard key={r.id} role={r}
              isSelected={selected?.id === r.id}
              onClick={() => { setSelected(r); setActiveSection("permissions"); }}
              onDelete={() => {}} />
          ))}

          <div className="h-px bg-gray-100 my-2" />

          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1 flex items-center justify-between">
            <span>Custom Roles</span>
            <button onClick={() => setShowCreate(true)}
              className="text-violet-500 hover:text-violet-700 font-black text-base">＋</button>
          </h3>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-4 border-gray-200 border-t-violet-500 rounded-full animate-spin" />
            </div>
          ) : roles.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <p className="text-2xl mb-2">✨</p>
              <p className="text-gray-400 text-sm font-semibold">No custom roles yet</p>
              <button onClick={() => setShowCreate(true)}
                className="mt-3 text-xs text-violet-500 hover:text-violet-700 font-bold underline">
                Create your first role
              </button>
            </div>
          ) : roles.map(r => (
            <RoleCard key={r.id} role={r}
              isSelected={selected?.id === r.id}
              onClick={() => { setSelected(r); setActiveSection("permissions"); }}
              onDelete={role => setConfirmDel(role)} />
          ))}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-3">
          {!selected ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white
                            rounded-2xl border-2 border-dashed border-gray-200 text-gray-400">
              <p className="text-5xl mb-4">👈</p>
              <p className="text-lg font-bold">Select a role</p>
              <p className="text-sm mt-1">Click any role on the left to manage it</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Role header */}
              <div className="flex items-center gap-4 p-5 rounded-2xl border-2"
                style={{ borderColor: selColor, background: `${selColor}08` }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                  style={{ background: `${selColor}20` }}>
                  {selected.icon}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-black text-gray-900">{selected.displayName}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                      style={{ background: selColor }}>
                      {selected.name}
                    </span>
                    {selected.baseSpringRole && (
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">
                        base: {selected.baseSpringRole}
                      </span>
                    )}
                    {selected.isBuiltIn && (
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-600 font-bold">
                        🔒 Built-in
                      </span>
                    )}
                  </div>
                  {selected.description && (
                    <p className="text-sm text-gray-500 mt-1">{selected.description}</p>
                  )}
                </div>
              </div>

              {/* Section tabs — only for custom roles or built-in non-SA */}
              {!selected.isBuiltIn && (
                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
                  {["permissions","users"].map(s => (
                    <button key={s} onClick={() => setActiveSection(s)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition capitalize
                        ${activeSection === s ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
                      {s === "permissions" ? "🔐 Permissions" : "👥 Users"}
                    </button>
                  ))}
                </div>
              )}

              {/* Built-in role notice */}
              {selected.isBuiltIn ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                  <p className="font-bold text-amber-700 mb-1">🔒 Built-in Role</p>
                  <p className="text-sm text-amber-600">
                    This is a system role managed through the Permissions tab.
                    Go to <strong>Permissions</strong> in the sidebar to configure{" "}
                    <strong>{selected.displayName}</strong> role access.
                  </p>
                </div>
              ) : activeSection === "permissions" ? (
                <RolePermissions key={selected.id} role={selected} color={selColor} />
              ) : (
                <RoleUsers key={selected.id} role={selected} color={selColor} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <CreateRoleModal
          onClose={() => setShowCreate(false)}
          onCreated={loadRoles}
        />
      )}

      {/* Delete confirm */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-black text-gray-900 text-lg">🗑️ Delete Role?</h3>
            <p className="text-gray-500 text-sm">
              Delete <strong>"{confirmDel.displayName}"</strong>? All users will be unassigned
              and all permissions will be removed. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDel(null)}
                className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition">
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}