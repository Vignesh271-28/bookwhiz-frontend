import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔑 Load logged-in user + roles
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    api.get("/api/auth/me")      .then(res => {
        setUser({
          email: res.data.email,
          roles: res.data.roles.map(r => r.name)
        });
      })
      .catch(() => {
        localStorage.removeItem("token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (token) => {
    localStorage.setItem("token", token);

   api.get("/api/auth/me").then(res => {
      setUser({
        email: res.data.email,
        roles: res.data.roles.map(r => r.name)
      });
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const hasRole = (role) => user?.roles?.includes(role);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isUser: hasRole("USER"),
        isManager: hasRole("MANAGER"),
        isAdmin: hasRole("ADMIN"),
        isSuperAdmin: hasRole("SUPER_ADMIN"),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);