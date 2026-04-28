import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { type PortalRole } from "@/lib/utils";

export interface User {
  id: number;
  name: string;
  email: string;
  role: PortalRole;
  phone?: string | null;
  vehicleType?: string | null;
  avatarUrl?: string | null;
  rating?: number | null;
  totalRatings: number;
  createdAt: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeRole(role: string): PortalRole {
  if (role === "customer") return "shipper";
  if (role === "provider") return "train_staff";
  if (role === "shipper" || role === "receiver" || role === "railway_monitor" || role === "train_staff") {
    return role;
  }
  return "shipper";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("chaintrack_token");
    const storedUser = localStorage.getItem("chaintrack_user");
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as User & { role: string };
        const normalizedUser = { ...parsedUser, role: normalizeRole(parsedUser.role) } as User;
        setToken(storedToken);
        setUser(normalizedUser);
        localStorage.setItem("chaintrack_user", JSON.stringify(normalizedUser));
      } catch {
        localStorage.removeItem("chaintrack_token");
        localStorage.removeItem("chaintrack_user");
      }
    }
    setIsLoading(false);
  }, []);

  function login(newToken: string, newUser: User) {
    const normalizedUser = { ...newUser, role: normalizeRole(newUser.role) };
    localStorage.setItem("chaintrack_token", newToken);
    localStorage.setItem("chaintrack_user", JSON.stringify(normalizedUser));
    setToken(newToken);
    setUser(normalizedUser);
  }

  function logout() {
    localStorage.removeItem("chaintrack_token");
    localStorage.removeItem("chaintrack_user");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
