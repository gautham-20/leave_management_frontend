"use client";
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";

export type Role = "EMPLOYEE" | "MANAGER" | "ADMIN";
export type User = {
  id: number;
  name: string;
  email: string;
  role: Role;
};

const TOKEN_KEY = "lms.token";
const USER_KEY = "lms.user";

interface AuthContextType {
  user: User | null;
  /** True until the stored session has been checked against the API on load. */
  loading: boolean;
  login: (email: string, password: string, role: Role) => Promise<void>;
  signup: (userData: { name: string; email: string; password: string; role: Role }) => Promise<void>;
  logout: () => void;
  /** Access token for authenticated fetches. Null when signed out. */
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const HOME_FOR_ROLE: Record<Role, string> = {
  EMPLOYEE: "/employee",
  MANAGER: "/manager",
  ADMIN: "/admin",
};

/**
 * localStorage is only readable in the browser. Wrapping the access keeps the
 * module importable from server components during prerendering.
 */
function readStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

function writeStorage(key: string, value: string | null) {
  if (typeof window === "undefined") return;
  if (value === null) window.localStorage.removeItem(key);
  else window.localStorage.setItem(key, value);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);
    writeStorage(TOKEN_KEY, null);
    writeStorage(USER_KEY, null);
  }, []);

  // Rehydrate on mount. Previously auth state lived only in React memory, so
  // any page refresh silently signed the user out and bounced them to /login.
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      const storedToken = readStorage(TOKEN_KEY);
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        if (!response.ok) {
          // Expired or revoked token: drop it rather than retrying forever.
          if (!cancelled) clearSession();
          return;
        }

        const restoredUser: User = await response.json();
        if (cancelled) return;

        setToken(storedToken);
        setUser(restoredUser);
        // Trust the server's copy over the cached one, which may be stale.
        writeStorage(USER_KEY, JSON.stringify(restoredUser));
      } catch {
        if (!cancelled) clearSession();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  // ---------- SIGNUP ----------
  const signup = async (userData: { name: string; email: string; password: string; role: Role }) => {
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || "Signup failed");
    }

    // The backend signs the new account in immediately, so no second round trip.
    setToken(result.token);
    setUser(result.user);
    writeStorage(TOKEN_KEY, result.token);
    writeStorage(USER_KEY, JSON.stringify(result.user));

    router.push(HOME_FOR_ROLE[result.user.role as Role] ?? "/login");
  };

  // ---------- LOGIN ----------
  const login = async (email: string, password: string, role: Role) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || "Invalid credentials");
    }

    setToken(result.token);
    setUser(result.user);
    writeStorage(TOKEN_KEY, result.token);
    writeStorage(USER_KEY, JSON.stringify(result.user));

    router.push(HOME_FOR_ROLE[result.user.role as Role] ?? "/login");
  };

  // ---------- LOGOUT ----------
  const logout = () => {
    clearSession();
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, token }}>
      {children}
    </AuthContext.Provider>
  );
}

// ---------- HOOK ----------
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within Provider");
  return context;
};