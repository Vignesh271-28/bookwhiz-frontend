import { useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import { getToken, setToken, clearToken, parseJwt } from "../utils/jwtUtil";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = getToken();
    if (token) {
      setUser(parseJwt(token));
    }
    console.log(user);
  }, []);

  const login = (token) => {
    setToken(token);
    setUser(parseJwt(token));
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
