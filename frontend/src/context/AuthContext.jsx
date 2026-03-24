import { createContext, useContext, useState, useCallback } from "react";
import { userModel } from "../models/userModel";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("pv_token"));
  const [user, setUser]   = useState(() => {
    try { return JSON.parse(localStorage.getItem("pv_user")); } catch { return null; }
  });

  const login = useCallback(async (email, password) => {
    const data = await userModel.login(email, password);
    localStorage.setItem("pv_token", data.token);
    localStorage.setItem("pv_user", JSON.stringify({ email: data.email }));
    setToken(data.token);
    setUser({ email: data.email });
  }, []);

  const register = useCallback(async (email, password) => {
    const data = await userModel.register(email, password);
    localStorage.setItem("pv_token", data.token);
    localStorage.setItem("pv_user", JSON.stringify({ email: data.email }));
    setToken(data.token);
    setUser({ email: data.email });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("pv_token");
    localStorage.removeItem("pv_user");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout, isLoggedIn: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);