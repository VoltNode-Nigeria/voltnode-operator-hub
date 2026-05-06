import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "./api";

export type User = {
  id: string;
  name?: string;
  email: string;
  role: "OPERATOR" | "DRIVER" | string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("voltnode_token"));
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem("voltnode_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sync = () => {
      setToken(localStorage.getItem("voltnode_token"));
      const raw = localStorage.getItem("voltnode_user");
      setUser(raw ? JSON.parse(raw) : null);
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      const t: string = data.token || data.access_token;
      const u: User = data.user || { id: data.id, email, role: data.role, name: data.name };
      if (!t) throw new Error("No token returned");
      if (u.role && u.role !== "OPERATOR") {
        throw new Error("This portal is for operators only");
      }
      localStorage.setItem("voltnode_token", t);
      localStorage.setItem("voltnode_user", JSON.stringify(u));
      setToken(t);
      setUser(u);
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      await api.post("/auth/register", { name, email, password, role: "OPERATOR" });
      await login(email, password);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("voltnode_token");
    localStorage.removeItem("voltnode_user");
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};