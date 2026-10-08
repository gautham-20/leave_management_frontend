"use client";
import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

export type LeaveRequest = {
  id: number;
  employee: string;
  type: string;
  startDate: string;
  endDate: string;
  status: "Pending" | "Approved" | "Rejected";
  reason: string;
  createdAt?: string;
};

export type LeaveBalance = {
  limits: Record<string, number>;
  used: Record<string, number>;
};

interface LeaveContextType {
  leaves: LeaveRequest[];
  balance: LeaveBalance | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addLeave: (leave: Omit<LeaveRequest, "id" | "status" | "createdAt">) => Promise<void>;
  updateStatus: (id: number, status: "Approved" | "Rejected") => Promise<void>;
}

const LeaveContext = createContext<LeaveContextType | undefined>(undefined);

export function LeaveProvider({ children }: { children: ReactNode }) {
  const { token, loading: authLoading } = useAuth();

  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authHeaders = useCallback((): Record<string, string> => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  const refresh = useCallback(async () => {
    if (!token) {
      setLeaves([]);
      setBalance(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Both requests are scoped to the signed-in user by the backend, so the
      // whole leave table is no longer shipped to every employee.
      const [leavesResponse, balanceResponse] = await Promise.all([
        fetch("/api/leaves", { headers: authHeaders(), cache: "no-store" }),
        fetch("/api/leaves/balance", { headers: authHeaders(), cache: "no-store" }),
      ]);

      if (!leavesResponse.ok) {
        const result = await leavesResponse.json().catch(() => ({}));
        throw new Error(result.message || "Failed to load leave requests");
      }

      setLeaves(await leavesResponse.json());

      if (balanceResponse.ok) {
        const data = await balanceResponse.json();
        setBalance({ limits: data.limits, used: data.used });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  }, [token, authHeaders]);

  useEffect(() => {
    // Wait for the token rehydration to finish before requesting anything.
    if (authLoading) return;
    refresh();
  }, [authLoading, refresh]);

  // ---------- ADD LEAVE ----------
  const addLeave = async (newLeave: Omit<LeaveRequest, "id" | "status" | "createdAt">) => {
    const response = await fetch("/api/leaves", {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        type: newLeave.type,
        startDate: newLeave.startDate,
        endDate: newLeave.endDate,
        reason: newLeave.reason,
        // The employee is derived from the JWT, not accepted from the client.
      }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.message || "Error submitting leave request");
    }

    setLeaves((prev) => [result, ...prev]);
  };

  // ---------- UPDATE STATUS ----------
  const updateStatus = async (id: number, status: "Approved" | "Rejected") => {
    const response = await fetch(`/api/leaves/${id}`, {
      method: "PATCH",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(
        (result as { message?: string } | null)?.message ||
          "Error updating leave status"
      );
    }

    // Only trust the response when it is a full record. The backend rejects a
    // second decision with 409, so a 2xx reply must carry the saved row; if it
    // doesn't, fall back to re-reading instead of dropping fields from the row.
    const isComplete =
      !!result &&
      typeof result === "object" &&
      (result as LeaveRequest).id === id &&
      typeof (result as LeaveRequest).status === "string";

    if (!isComplete) {
      await refresh();
      return;
    }

    // Re-use the existing row so untouched fields (reason, dates, employee)
    // survive, while `status` always comes from the database response.
    setLeaves((prev) =>
      prev.map((leave) =>
        leave.id === id ? { ...leave, ...(result as LeaveRequest) } : leave
      )
    );
  };

  return (
    <LeaveContext.Provider
      value={{ leaves, balance, loading, error, refresh, addLeave, updateStatus }}
    >
      {children}
    </LeaveContext.Provider>
  );
}

// ---------- HOOK ----------
export const useLeaves = () => {
  const context = useContext(LeaveContext);
  if (!context) throw new Error("useLeaves must be used within Provider");
  return context;
};