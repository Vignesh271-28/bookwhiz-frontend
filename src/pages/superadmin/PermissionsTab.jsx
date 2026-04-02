import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { getToken } from "../../utils/jwtUtil";
import { toast } from "react-toastify";
import { invalidatePermissionsCache } from "../../hooks/userPermissions";
import { API } from "../../config/api";

// const SA_API    = "http://localhost:8080/api/superadmin/permissions";
// const ADMIN_API = "http://localhost:8080/api/admin/permissions";
const auth = () => ({ Authorization: `Bearer ${getToken()}` });

const SA_ROLE_META = {
  ADMIN:   { label:"Admin",   accent:"#ef4444", light:"#fef2f2", border:"#fecaca", dot:"bg-red-500"  },
  MANAGER: { label:"Manager", accent:"#3b82f6", light:"#eff6ff", border:"#bfdbfe", dot:"bg-blue-500" },
  USER:    { label:"User",    accent:"#6b7280", light:"#f9fafb", border:"#e5e7eb", dot:"bg-gray-400" },
};
const ADMIN_ROLE_META = {
  MANAGER: { label:"Manager", accent:"#3b82f6", light:"#eff6ff", border:"#bfdbfe", dot:"bg-blue-500" },
  USER:    { label:"User",    accent:"#6b7280", light:"#f9fafb", border:"#e5e7eb", dot:"bg-gray-400" },
};
const CATEGORY_ICONS = {
  Users:"👤", Movies:"🎬", Shows:"🎭", Venues:"🏛️",
  Bookings:"🎟️", Reports:"📊", Partners:"🤝",
  Dashboards:"📱", Analytics:"📈", Approvals:"✅", Permissions:"🔐",
};

function Toggle({ isOn, isBusy, accent, onClick }) {
  return (
    <button onClick={onClick} disabled={isBusy}
      className={`relative w-11 h-6 rounded-full transition-all duration-200
        focus:outline-none ${isBusy ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
      style={{ background: isOn ? accent : "#e5e7eb", boxShadow: isOn ? `0 0 0 3px ${accent}20` : "none" }}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full
                        shadow transition-transform duration-200
                        ${isOn ? "translate-x-5" : "translate-x-0"}`} />
      {isBusy && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        </span>
      )}
    </button>
  );
}

function UserDropdown({ users, selectedUser, onSelect, accent, loading }) {
  const [open, setOpen] = useState(false);
  const label = selectedUser ? (selectedUser.name || selectedUser.email) : "All (Role Default)";
  return (
    <div className="relative">
      <button onClick={() => setOpen(p => !p)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold
                   bg-white hover:shadow-md transition min-w-[200px] justify-between"
        style={{ borderColor: selectedUser ? accent : "#e5e7eb", color: selectedUser ? accent : "#374151" }}>
        <div className="flex items-center gap-2 truncate">
          {selectedUser ? (
            <>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0"
                style={{ background: accent }}>
                {(selectedUser.name?.[0] ?? selectedUser.email?.[0] ?? "?").toUpperCase()}
              </div>
              <span className="truncate">{label}</span>
              {selectedUser.hasOverrides && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-orange-100 text-orange-600 shrink-0">CUSTOM</span>
              )}
            </>
          ) : (
            <><span className="text-base">👥</span><span>All (Role Default)</span></>
          )}
        </div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" style={{ flexShrink:0, transition:"transform .2s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-2xl border border-gray-100
                        shadow-xl z-50 min-w-[260px] overflow-hidden">
          <button onClick={() => { onSelect(null); setOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition
              ${!selectedUser ? "bg-gray-50 font-bold text-gray-900" : "text-gray-600 hover:bg-gray-50"}`}>
            <span className="text-base">👥</span>
            <div className="text-left">
              <p className="font-semibold">All (Role Default)</p>
              <p className="text-xs text-gray-400">Apply to entire role</p>
            </div>
            {!selectedUser && <span className="ml-auto text-xs font-black" style={{ color: accent }}>✓</span>}
          </button>
          <div className="h-px bg-gray-100 mx-3" />
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="px-4 py-4 text-center text-xs text-gray-400">No users found</div>
          ) : (
            <div className="max-h-56 overflow-y-auto">
              {users.map(u => (
                <button key={u.id} onClick={() => { onSelect(u); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition
                    ${selectedUser?.id === u.id ? "font-bold" : "text-gray-600 hover:bg-gray-50"}`}
                  style={{ background: selectedUser?.id === u.id ? `${accent}08` : "" }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0"
                    style={{ background: accent }}>
                    {(u.name?.[0] ?? u.email?.[0] ?? "?").toUpperCase()}
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="font-semibold truncate">{u.name || "—"}</p>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {u.hasOverrides && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-orange-100 text-orange-600">CUSTOM</span>
                    )}
                    {selectedUser?.id === u.id && (
                      <span className="text-xs font-black" style={{ color: accent }}>✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PermissionsTab({ adminMode = false }) {
  const ROLE_META = adminMode ? ADMIN_ROLE_META : SA_ROLE_META;

  const [perms,      setPerms]      = useState({});
  const [defs,       setDefs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(null);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [activeRole, setActiveRole] = useState(adminMode ? "MANAGER" : "ADMIN");
  const [search,     setSearch]     = useState("");
  const [users,         setUsers]         = useState({});
  const [usersLoading,  setUsersLoading]  = useState({});
  const [selectedUser,  setSelectedUser]  = useState({});
  const [userPerms,     setUserPerms]     = useState({});
  const [userOverrides, setUserOverrides] = useState({});
  const [userLoading,   setUserLoading]   = useState(false);
  const [userSaving,    setUserSaving]    = useState(null);

  const [customRoles, setCustomRoles] = useState([]);

  useEffect(() => {
    const endpoint = adminMode ? ADMIN_API : API.SUPERADMINPERMISSION;
    const calls = [
      axios.get(endpoint, { headers: auth() })
        .then(res => { setPerms(res.data.permissions ?? {}); setDefs(res.data.definitions ?? []); }),
    ];
    if (!adminMode) {
      calls.push(
        axios.get(`${API.SUPER_ADMIN}roles`, { headers: auth() })
          .then(r => setCustomRoles(r.data ?? [])).catch(() => {})
      );
    }
    Promise.allSettled(calls).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setUsersLoading(p => ({ ...p, [activeRole]: true }));

    // For custom roles use /api/superadmin/roles/{id}/users
    const customRoleObj = !adminMode ? customRoles.find(r => r.name === activeRole) : null;
    if (customRoleObj) {
      axios.get(`${API.SUPER_ADMIN}roles/${customRoleObj.id}/users`, { headers: auth() })
        .then(r => setUsers(p => ({ ...p, [activeRole]: r.data ?? [] })))
        .catch(() => setUsers(p => ({ ...p, [activeRole]: [] })))
        .finally(() => setUsersLoading(p => ({ ...p, [activeRole]: false })));
    } else {
      const usersEndpoint = adminMode
        ? `${ADMIN_API}/users/${activeRole}`
        : `${API.SUPERADMINPERMISSION}/users/${activeRole}`;
      axios.get(usersEndpoint, { headers: auth() })
        .then(r => setUsers(p => ({ ...p, [activeRole]: r.data ?? [] })))
        .catch(() => setUsers(p => ({ ...p, [activeRole]: [] })))
        .finally(() => setUsersLoading(p => ({ ...p, [activeRole]: false })));
    }
  }, [activeRole, adminMode, customRoles]);

  const adminModeRef = useRef(adminMode);
  adminModeRef.current = adminMode;

  const loadUserPermissions = useCallback(async (userId) => {
    setUserLoading(true);
    const base = adminModeRef.current ? ADMIN_API : API.SUPERADMINPERMISSION;
    try {
      const r = await axios.get(`${base}/user/${userId}`, { headers: auth() });
      setUserPerms(p    => ({ ...p, [userId]: r.data.permissions ?? {} }));
      setUserOverrides(p => ({ ...p, [userId]: r.data.overrides   ?? {} }));
    } catch { toast.error("Failed to load user permissions"); }
    finally { setUserLoading(false); }
  }, []);

  useEffect(() => {
    const user = selectedUser[activeRole];
    if (!user) return;
    loadUserPermissions(user.id);
  }, [selectedUser, activeRole]);

  // Load permissions for custom role when selected (if not already loaded)
  useEffect(() => {
    if (adminMode) return;
    const customRole = customRoles.find(r => r.name === activeRole);
    if (!customRole) return;
    if (perms[activeRole] && Object.keys(perms[activeRole]).length > 0) return;
    axios.get(`http://localhost:8080/api/superadmin/roles/${customRole.id}/permissions`, { headers: auth() })
      .then(r => setPerms(prev => ({ ...prev, [activeRole]: r.data.permissions ?? {} })))
      .catch(() => {});
  }, [activeRole, customRoles, adminMode]);

  const handleSelectUser = (user) => setSelectedUser(p => ({ ...p, [activeRole]: user }));

  const toggleRole = async (role, key, currentVal) => {
    const saveKey = `${role}|${key}`;
    setSaving(saveKey);
    const newVal = !currentVal;
    setPerms(prev => ({ ...prev, [role]: { ...prev[role], [key]: newVal } }));
    try {
      // Check if this is a custom role
      const customRole = customRoles.find(r => r.name === role);
      if (customRole) {
        await axios.put(
          `${API.SUPER_ADMIN}/roles/${customRole.id}/permissions`,
          { key, enabled: newVal }, { headers: auth() }
        );
      } else {
        await axios.put(adminMode ? ADMIN_API : API.SUPERADMINPERMISSION, { role, key, enabled: newVal }, { headers: auth() });
      }
      invalidatePermissionsCache();
    } catch {
      setPerms(prev => ({ ...prev, [role]: { ...prev[role], [key]: currentVal } }));
      toast.error("Failed to update permission");
    } finally { setSaving(null); }
  };

  const toggleUser = async (userId, key, currentVal) => {
    const saveKey = `user-${userId}|${key}`;
    setUserSaving(saveKey);
    const newVal = !currentVal;
    setUserPerms(p => ({ ...p, [userId]: { ...(p[userId] ?? {}), [key]: newVal } }));
    setUserOverrides(p => ({ ...p, [userId]: { ...(p[userId] ?? {}), [key]: newVal } }));
    try {
      const base2 = adminModeRef.current ? ADMIN_API : API.SUPERADMINPERMISSION;
      await axios.put(`${base2}/user/${userId}`, { key, enabled: newVal }, { headers: auth() });
      invalidatePermissionsCache();
      setUsers(prev => ({
        ...prev,
        [activeRole]: (prev[activeRole] ?? []).map(u => u.id === userId ? { ...u, hasOverrides: true } : u)
      }));
    } catch {
      setUserPerms(p => ({ ...p, [userId]: { ...(p[userId] ?? {}), [key]: currentVal } }));
      setUserOverrides(p => { const copy = { ...(p[userId] ?? {}) }; delete copy[key]; return { ...p, [userId]: copy }; });
      toast.error("Failed to update permission");
    } finally { setUserSaving(null); }
  };

  const resetOneOverride = async (userId, key) => {
    try {
      const base3 = adminModeRef.current ? ADMIN_API : API.SUPERADMINPERMISSION;
      await axios.delete(`${base3}/user/${userId}/${key}`, { headers: auth() });
      setUserOverrides(p => { const copy = { ...(p[userId] ?? {}) }; delete copy[key]; return { ...p, [userId]: copy }; });
      await loadUserPermissions(userId);
      invalidatePermissionsCache();
      toast.success("Reset to role default");
    } catch { toast.error("Failed to reset"); }
  };

  const resetAllOverrides = async (userId) => {
    try {
      const base4 = adminModeRef.current ? ADMIN_API : API.SUPERADMINPERMISSION;
      await axios.delete(`${base4}/user/${userId}`, { headers: auth() });
      setUserOverrides(p => ({ ...p, [userId]: {} }));
      await loadUserPermissions(userId);
      setUsers(prev => ({
        ...prev,
        [activeRole]: (prev[activeRole] ?? []).map(u => u.id === userId ? { ...u, hasOverrides: false } : u)
      }));
      invalidatePermissionsCache();
      toast.success("All overrides cleared");
    } catch { toast.error("Failed to reset"); }
  };

  const bulkToggle = async (enable) => {
    setBulkSaving(true);
    const rolePerms = perms[activeRole] ?? {};
    const toChange  = visibleDefs.filter(d => enable ? !rolePerms[d.key] : rolePerms[d.key]);
    if (toChange.length === 0) { setBulkSaving(false); return; }
    const backup = { ...rolePerms };
    const updated = { ...rolePerms };
    toChange.forEach(d => { updated[d.key] = enable; });
    setPerms(prev => ({ ...prev, [activeRole]: updated }));
    try {
      await Promise.all(toChange.map(d =>
        axios.put(adminMode ? ADMIN_API : API.SUPERADMINPERMISSION, { role: activeRole, key: d.key, enabled: enable }, { headers: auth() })
      ));
      toast.success(`${enable ? "Enabled" : "Disabled"} ${toChange.length} permissions`);
      invalidatePermissionsCache();
    } catch {
      setPerms(prev => ({ ...prev, [activeRole]: backup }));
      toast.error("Bulk update failed");
    } finally { setBulkSaving(false); }
  };

  const toggleCategory = async (items, enable) => {
    const rolePerms = perms[activeRole] ?? {};
    const toChange  = items.filter(i => enable ? !rolePerms[i.key] : rolePerms[i.key]);
    if (toChange.length === 0) return;
    const backup = { ...rolePerms };
    const updated = { ...rolePerms };
    toChange.forEach(d => { updated[d.key] = enable; });
    setPerms(prev => ({ ...prev, [activeRole]: updated }));
    try {
      await Promise.all(toChange.map(d =>
        axios.put(adminMode ? ADMIN_API : API.SUPERADMINPERMISSION, { role: activeRole, key: d.key, enabled: enable }, { headers: auth() })
      ));
      invalidatePermissionsCache();
    } catch { setPerms(prev => ({ ...prev, [activeRole]: backup })); toast.error("Failed"); }
  };

  const filteredDefs = search.trim()
    ? defs.filter(d =>
        d.label.toLowerCase().includes(search.toLowerCase()) ||
        d.key.toLowerCase().includes(search.toLowerCase()) ||
        d.category.toLowerCase().includes(search.toLowerCase()))
    : defs;

  const visibleDefs = adminMode ? filteredDefs.filter(d => d.category !== "Permissions") : filteredDefs;
  const byCategory  = visibleDefs.reduce((acc, d) => { (acc[d.category] = acc[d.category] || []).push(d); return acc; }, {});

  // Support custom roles in toolbar & permission grid
  const customActiveRole = !adminMode ? customRoles.find(r => r.name === activeRole) : null;
  const meta = customActiveRole
    ? { label: customActiveRole.displayName, accent: customActiveRole.color,
        light: `${customActiveRole.color}10`, border: `${customActiveRole.color}40`,
        dot: "bg-gray-400" }
    : ROLE_META[activeRole] ?? ROLE_META[Object.keys(ROLE_META)[0]];
  const rolePerms       = perms[activeRole] ?? {};
  const currentUser     = selectedUser[activeRole] ?? null;
  const currentUPerms   = currentUser ? (userPerms[currentUser.id]    ?? {}) : {};
  const currentOverrides= currentUser ? (userOverrides[currentUser.id] ?? {}) : {};
  const isUserMode      = !!currentUser;
  const activePerms     = isUserMode ? currentUPerms : rolePerms;
  const enabledCnt      = Object.values(activePerms).filter(Boolean).length;
  const totalCnt        = (adminMode ? defs.filter(d => d.category !== "Permissions") : defs).length;
  const pct             = totalCnt > 0 ? (enabledCnt / totalCnt) * 100 : 0;
  const overrideCount   = Object.keys(currentOverrides).length;

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-black text-gray-900">
            {adminMode ? "🔐 Manager Permissions" : "🔐 Role Permissions"}
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {adminMode ? "Control Manager & User role feature access." : "Set role defaults or customise per-user. Changes apply instantly."}
          </p>
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search permissions..."
            className="border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-violet-400 w-52" />
        </div>
      </div>

      {/* Role cards */}
      <div className={`grid gap-3 grid-cols-${Object.keys(ROLE_META).length}`}>
        {Object.entries(ROLE_META).map(([role, m]) => {
          const rp      = perms[role] ?? {};
          const cnt     = Object.values(rp).filter(Boolean).length;
          const isActive= activeRole === role;
          const roleUsers = users[role] ?? [];
          return (
            <button key={role} onClick={() => setActiveRole(role)}
              className="rounded-2xl border p-4 text-left transition-all hover:shadow-md"
              style={{ border: isActive ? `2px solid ${m.accent}` : "2px solid #e5e7eb",
                       background: isActive ? m.light : "#fff",
                       boxShadow: isActive ? `0 0 0 3px ${m.accent}20` : "none" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2.5 h-2.5 rounded-full ${m.dot}`} />
                <span className="text-sm font-bold" style={{ color: isActive ? m.accent : "#374151" }}>{m.label}</span>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ background: isActive ? `${m.accent}15` : "#f3f4f6", color: isActive ? m.accent : "#9ca3af" }}>
                  {cnt}/{defs.length}
                </span>
              </div>
              <p className="text-3xl font-black text-gray-900">{cnt}</p>
              <p className="text-xs text-gray-400 mt-0.5 mb-2">permissions enabled</p>
              <p className="text-xs text-gray-400 mt-1">
                  {usersLoading[role] ? "Loading..." : `${roleUsers.length} user${roleUsers.length !== 1 ? "s" : ""}`}
                  {roleUsers.filter(u => u.hasOverrides).length > 0 && (
                    <span className="ml-1 text-orange-500 font-semibold">
                      · {roleUsers.filter(u => u.hasOverrides).length} with custom
                    </span>
                  )}
              </p>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
                <div className="h-full rounded-full transition-all"
                  style={{ width:`${defs.length > 0 ? (cnt/defs.length)*100 : 0}%`, background: m.accent }} />
              </div>
            </button>
          );
        })}

        {/* Custom role cards */}
        {!adminMode && customRoles.map(cr => {
          const isActive = activeRole === cr.name;
          const rp       = perms[cr.name] ?? {};
          const cnt      = Object.values(rp).filter(Boolean).length;
          return (
            <button key={cr.id} onClick={() => { setActiveRole(cr.name); setSelectedUser({}); }}
              className="rounded-2xl border p-4 text-left transition-all hover:shadow-md"
              style={{
                border:     isActive ? `2px solid ${cr.color}` : "2px solid #e5e7eb",
                background: isActive ? `${cr.color}12` : "#fff",
                boxShadow:  isActive ? `0 0 0 3px ${cr.color}20` : "none",
              }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{cr.icon ?? "🎭"}</span>
                <span className="text-sm font-bold" style={{ color: isActive ? cr.color : "#374151" }}>
                  {cr.displayName}
                </span>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ background: isActive ? `${cr.color}15` : "#f3f4f6",
                           color: isActive ? cr.color : "#9ca3af" }}>
                  {cnt}/{defs.length}
                </span>
              </div>
              <p className="text-3xl font-black text-gray-900">{cnt}</p>
              <p className="text-xs text-gray-400 mt-0.5 mb-2">permissions enabled</p>
              <p className="text-xs text-gray-400 mt-1">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                  style={{ background: `${cr.color}15`, color: cr.color }}>
                  CUSTOM
                </span>
                <span className="ml-1">base: {cr.baseSpringRole}</span>
              </p>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
                <div className="h-full rounded-full transition-all"
                  style={{ width:`${defs.length > 0 ? (cnt/defs.length)*100 : 0}%`, background: cr.color }} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap px-4 py-3 rounded-xl border"
        style={{ background: meta.light, borderColor: meta.border }}>
        <div className={`w-3 h-3 rounded-full ${meta.dot}`} />
        <span className="text-sm font-bold" style={{ color: meta.accent }}>{meta.label}</span>
        <div className="flex items-center gap-2 flex-1 min-w-[160px]">
          <div className="flex-1 h-2 bg-white rounded-full overflow-hidden border border-white/50">
            <div className="h-full rounded-full transition-all" style={{ width:`${pct}%`, background: meta.accent }} />
          </div>
          <span className="text-xs font-bold text-gray-500">{enabledCnt}/{totalCnt}</span>
        </div>
        <UserDropdown users={users[activeRole] ?? []} selectedUser={currentUser}
            onSelect={handleSelectUser} accent={meta.accent} loading={usersLoading[activeRole]} />
        {!isUserMode && (
          <div className="flex gap-2 ml-auto">
            <button onClick={() => bulkToggle(true)} disabled={bulkSaving}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-500 text-white hover:bg-green-600 transition disabled:opacity-50">
              {bulkSaving ? "..." : "✅ Enable All"}
            </button>
            <button onClick={() => bulkToggle(false)} disabled={bulkSaving}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500 text-white hover:bg-red-600 transition disabled:opacity-50">
              {bulkSaving ? "..." : "❌ Disable All"}
            </button>
          </div>
        )}
        {isUserMode && overrideCount > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-orange-600 font-semibold bg-orange-50 border border-orange-200 px-2 py-1 rounded-lg">
              ⚡ {overrideCount} custom override{overrideCount !== 1 ? "s" : ""}
            </span>
            <button onClick={() => resetAllOverrides(currentUser.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-500 text-white hover:bg-orange-600 transition">
              ↺ Reset All to Default
            </button>
          </div>
        )}
      </div>

      {isUserMode && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3 border text-sm"
          style={{ background: `${meta.accent}08`, borderColor: `${meta.accent}30`, color: meta.accent }}>
          <span className="text-xl shrink-0">👤</span>
          <div>
            <p className="font-bold">Custom permissions for <span className="underline">{currentUser.name || currentUser.email}</span></p>
            <p className="text-xs opacity-70 mt-0.5">Overrides take priority over the {meta.label} role default.</p>
          </div>
        </div>
      )}

      {userLoading && (
        <div className="flex items-center justify-center py-10">
          <div className="w-6 h-6 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
        </div>
      )}

      {!userLoading && (Object.keys(byCategory).length === 0 ? (
        <div className="text-center py-12 text-gray-300">
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-sm">No permissions match "{search}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Object.entries(byCategory).map(([category, items]) => {
            const catEnabled = items.filter(i => activePerms[i.key]).length;
            const allOn      = catEnabled === items.length;
            return (
              <div key={category} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <span className="text-base">{CATEGORY_ICONS[category] ?? "⚙️"}</span>
                  <h3 className="text-sm font-bold text-gray-700">{category}</h3>
                  <span className="ml-auto text-xs text-gray-400 mr-2">{catEnabled}/{items.length}</span>
                  {!isUserMode && (
                    <button onClick={() => toggleCategory(items, !allOn)}
                      className="text-xs font-bold px-2 py-1 rounded-md border transition"
                      style={{ background: allOn ? "#fef2f2" : "#f0fdf4",
                               color: allOn ? "#ef4444" : "#16a34a",
                               borderColor: allOn ? "#fecaca" : "#bbf7d0" }}>
                      {allOn ? "Off all" : "On all"}
                    </button>
                  )}
                </div>
                <div className="divide-y divide-gray-50">
                  {items.map(({ key, label }) => {
                    const isOn        = activePerms[key] ?? false;
                    const hasOverride = isUserMode && key in currentOverrides;
                    const roleDefault = isUserMode ? (rolePerms[key] ?? false) : null;
                    const isBusy      = isUserMode
                      ? userSaving === `user-${currentUser.id}|${key}`
                      : (saving === `${activeRole}|${key}` || bulkSaving);
                    return (
                      <div key={key}
                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/60 transition"
                        style={{ background: isOn ? `${meta.accent}05` : "transparent" }}>
                        <div className="flex-1 min-w-0 mr-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`text-sm font-semibold transition ${isOn ? "text-gray-900" : "text-gray-400"}`}>
                              {label}
                            </p>
                            {hasOverride && (
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600">CUSTOM</span>
                            )}
                            {isUserMode && !hasOverride && (
                              <span className="text-[9px] text-gray-300 font-medium">(role default)</span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-300 font-mono mt-0.5">{key}</p>
                          {hasOverride && (
                            <button onClick={() => resetOneOverride(currentUser.id, key)}
                              className="text-[10px] text-orange-500 hover:text-orange-700 font-semibold mt-0.5 transition underline">
                              ↺ Reset (role: {roleDefault ? "ON" : "OFF"})
                            </button>
                          )}
                        </div>
                        <Toggle isOn={isOn} isBusy={isBusy} accent={meta.accent}
                          onClick={() => {
                            if (isBusy) return;
                            if (isUserMode) toggleUser(currentUser.id, key, isOn);
                            else toggleRole(activeRole, key, isOn);
                          }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ))}
      <p className="text-xs text-gray-400 text-center pb-2">
        ⚠️ Disabling a permission hides the UI for that role or user. SuperAdmin always has full access.
      </p>
    </div>
  );
}