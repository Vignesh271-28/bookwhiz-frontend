import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { getToken, getUserFromToken } from "../utils/jwtUtil";
import { API } from "../../src/config/api";

// const PUBLIC_URL = "http://localhost:8080/api/permissions/public";
// const ME_URL     = "http://localhost:8080/api/permissions/me";
const auth       = () => ({ Authorization: `Bearer ${getToken()}` });

let _rolePerms       = null;
let _userPerms       = null;
let _customRoleMeta  = null; // { name, color, icon } for users with custom roles
let _listeners       = [];

function _notify() {
  _listeners.forEach(fn => fn(Date.now()));
}

export function invalidatePermissionsCache() {
  _rolePerms      = null;
  _userPerms      = null;
  _customRoleMeta = null;
  _notify();
}

export function usePermissions() {
  const [, forceUpdate] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    _listeners.push(forceUpdate);
    return () => {
      _listeners = _listeners.filter(fn => fn !== forceUpdate);
    };
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch role-level defaults (public, no auth needed)
      const roleRes = await axios.get(API.PERMISSIONS);
      _rolePerms = roleRes.data ?? {};

      // 2. Fetch user-level overrides via /me endpoint (uses JWT session)
      if (getToken()) {
        try {
          const meRes = await axios.get(API.ME, { headers: auth() });
          // /me returns flat { KEY: boolean } merged map for the current user
          const meData = meRes.data ?? null;
          if (meData) {
            // Extract custom role metadata if present
            if (meData.__customRoleName) {
              _customRoleMeta = {
                name:  meData.__customRoleName,
                color: meData.__customRoleColor ?? "#8b5cf6",
                icon:  meData.__customRoleIcon  ?? "🎭",
              };
            } else {
              _customRoleMeta = null;
            }
          }
          _userPerms = meData;
        } catch {
          _userPerms      = null;
          _customRoleMeta = null;
        }
      } else {
        _userPerms = null;
      }
    } catch {
      _rolePerms = null;
      _userPerms = null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (_rolePerms) {
      setLoading(false);
      return;
    }
    fetchAll();
  }, [fetchAll]);

  /**
   * can(key) → boolean
   * Priority:
   *   1. User-level override (from /api/permissions/me — handles custom per-user)
   *   2. Role-level default  (from /api/permissions/public)
   *   3. Fail-open if permissions not yet loaded
   */
  const can = (key) => {
    // 1. User-level override (merged map: already includes role defaults + overrides)
    if (_userPerms && key in _userPerms) {
      return _userPerms[key] === true;
    }

    // 2. Role-level fallback
    const userObj   = getUserFromToken();
    const rawRole   = userObj?.role ?? userObj?.roles?.[0] ?? userObj?.authorities?.[0];
    const cleanRole = rawRole ? String(rawRole).replace(/^ROLE_/i, "").toUpperCase() : null;

    if (!_rolePerms || !cleanRole) return true; // fail-open
    const roleMap = _rolePerms[cleanRole];
    if (!roleMap) return true;
    if (!(key in roleMap)) return true;
    return roleMap[key] === true;
  };

  const refresh = useCallback(() => {
    invalidatePermissionsCache();
    fetchAll();
  }, [fetchAll]);

  return { perms: _rolePerms, userPerms: _userPerms, customRoleMeta: _customRoleMeta, can, loading, refresh };
}