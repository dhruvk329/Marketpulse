import { createContext, useContext, useState, ReactNode } from "react";
import type { User, AuthResponse } from "./types";

interface AuthCtx {
  user: User | null;
  isAuthed: boolean;
  setSession: (data: AuthResponse) => void;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem("mp_user");
    return raw ? (JSON.parse(raw) as User) : null;
  });

  const setSession = (data: AuthResponse) => {
    localStorage.setItem("mp_token", data.access_token);
    localStorage.setItem("mp_user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("mp_token");
    localStorage.removeItem("mp_user");
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, isAuthed: !!user, setSession, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
