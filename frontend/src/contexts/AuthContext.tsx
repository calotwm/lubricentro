import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { getToken, setToken, clearToken, registerNavigate } from "../auth/tokenStore";

interface AuthContextValue {
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface LoginResponse {
  access_token: string;
  token_type: string;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(getToken);
  const nav = useNavigate();

  // Register navigate ref so tokenStore can trigger SPA navigation
  useEffect(() => {
    registerNavigate((path: string) => nav(path));
  }, [nav]);

  const isAuthenticated = token !== null;

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.post<LoginResponse>("/auth/login", { username, password });
    setToken(res.access_token);
    setTokenState(res.access_token);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    nav("/login");
  }, [nav]);

  return (
    <AuthContext.Provider value={{ token, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
