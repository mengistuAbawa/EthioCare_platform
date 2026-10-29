import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "./AuthContextValue";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("ethiocare_token"));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem("ethiocare_token");

      if (!savedToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        api.defaults.headers.common.Authorization = `Bearer ${savedToken}`;
        const response = await api.get("/auth/me");
        setUser(response.data?.data?.user || null);
      } catch {
        localStorage.removeItem("ethiocare_token");
        delete api.defaults.headers.common.Authorization;
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    if (token) {
      localStorage.setItem("ethiocare_token", token);
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      localStorage.removeItem("ethiocare_token");
      delete api.defaults.headers.common.Authorization;
    }
  }, [token]);

  const login = useCallback(async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    const nextToken = response.data?.data?.token;
    const nextUser = response.data?.data?.user;

    if (!nextToken) {
      throw new Error("Login response did not include a token.");
    }

    setToken(nextToken);
    setUser(nextUser || null);
    return response.data;
  }, []);

  const register = useCallback(async (payload) => {
    const response = await api.post("/auth/register", payload);
    return response.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (token) {
        await api.post("/auth/logout");
      }
    } catch (error) {
      console.warn("Logout API error ignored:", error.message);
    } finally {
      setToken(null);
      setUser(null);
      navigate("/login", { replace: true });
    }
  }, [navigate, token]);

  const refreshUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const response = await api.get("/auth/me");
      setUser(response.data?.data?.user || null);
    } catch (error) {
      setToken(null);
      setUser(null);
      throw error;
    }
  }, [token]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
      refreshUser,
      isAuthenticated: Boolean(user && token),
    }),
    [user, token, loading, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
