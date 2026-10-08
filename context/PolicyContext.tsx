"use client";
import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

/**
 * A company leave policy, as stored by the `leave_policies` table. Mirrors
 * `LeavePolicyResponse` on the Spring Boot side.
 */
export type LeavePolicy = {
  id: number;
  title: string;
  description: string;
  active: boolean;
  sortOrder: number;
  updatedAt?: string;
};

export type PolicyDraft = {
  title: string;
  description: string;
  active?: boolean;
};

interface PolicyContextType {
  policies: LeavePolicy[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createPolicy: (draft: PolicyDraft) => Promise<void>;
  updatePolicy: (id: number, draft: PolicyDraft) => Promise<void>;
  deletePolicy: (id: number) => Promise<void>;
}

const PolicyContext = createContext<PolicyContextType | undefined>(undefined);

export function PolicyProvider({ children }: { children: ReactNode }) {
  const { token, loading: authLoading } = useAuth();

  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authHeaders = useCallback((): Record<string, string> => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  /**
   * Reads policies from the database on every mount and after every mutation, so
   * what each dashboard shows is always the stored value rather than a local
   * guess. `no-store` keeps a hard refresh honest too.
   */
  const refresh = useCallback(async () => {
    if (!token) {
      setPolicies([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/policies", {
        headers: authHeaders(),
        cache: "no-store",
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.message || "Failed to load company policies");
      }

      const data = await response.json();
      setPolicies(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load company policies"
      );
    } finally {
      setLoading(false);
    }
  }, [token, authHeaders]);

  useEffect(() => {
    // Wait for the token rehydration, otherwise a refresh would request without
    // credentials and show an empty list.
    if (authLoading) return;
    refresh();
  }, [authLoading, refresh]);

  // ---------- CREATE ----------
  const createPolicy = async (draft: PolicyDraft) => {
    const response = await fetch("/api/policies", {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.message || "Error creating policy");
    }

    // Re-read rather than splicing the new row in, so sort order and the
    // server's own defaults are exactly what gets displayed.
    await refresh();
  };

  // ---------- UPDATE ----------
  const updatePolicy = async (id: number, draft: PolicyDraft) => {
    const response = await fetch(`/api/policies/${id}`, {
      method: "PATCH",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.message || "Error updating policy");
    }

    await refresh();
  };

  // ---------- DELETE ----------
  const deletePolicy = async (id: number) => {
    const response = await fetch(`/api/policies/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.message || "Error deleting policy");
    }

    await refresh();
  };

  return (
    <PolicyContext.Provider
      value={{ policies, loading, error, refresh, createPolicy, updatePolicy, deletePolicy }}
    >
      {children}
    </PolicyContext.Provider>
  );
}

export const usePolicies = () => {
  const context = useContext(PolicyContext);
  if (!context) throw new Error("usePolicies must be used within PolicyProvider");
  return context;
};
