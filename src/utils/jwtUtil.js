// ─── Token storage ────────────────────────────────────────────
export const getToken = () => localStorage.getItem("token");

export const setToken = (token) => {
  localStorage.setItem("token", token);
};

export const clearToken = () => {
  localStorage.removeItem("token");
};

// ─── JWT decode ───────────────────────────────────────────────
export const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
};

// ─── Get user object from current token ──────────────────────
// Returns: { name, email, sub, role, id } or null
export const getUserFromToken = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));

    // 🔥 HANDLE ALL CASES
    let role =
      payload.role ||
      payload.roles?.[0] ||
      payload.authorities?.[0]?.authority ||
      payload.authorities?.[0];

    role = String(role || "")
      .replace(/^ROLE_/i, "")
      .toUpperCase();

    return {
      ...payload,
      role,
    };

  } catch {
    return null;
  }
};

// ─── Role helpers ─────────────────────────────────────────────

// Returns the normalized role string: "USER" | "ADMIN" | "MANAGER" | "SUPER_ADMIN"
export const getCurrentRole = () => {
  return getUserFromToken()?.role ?? "USER";
};

export const isLoggedIn = () => {
  const token = getToken();
  if (!token) return false;
  try {
    const payload = parseJwt(token);
    // Check expiry (exp is in seconds)
    if (payload?.exp && payload.exp * 1000 < Date.now()) {
      clearToken();
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

export const hasRole = (role) => getCurrentRole() === role.replace(/^ROLE_/i, "").toUpperCase();

export const isUser       = () => hasRole("USER");
export const isAdmin      = () => hasRole("ADMIN");
export const isManager    = () => hasRole("MANAGER");
export const isSuperAdmin = () => hasRole("SUPER_ADMIN");