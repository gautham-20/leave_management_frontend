"use client";

import { useLeaves } from "@/context/LeaveContext";
import { useAuth } from "@/context/AuthContext";
import DownloadReport from "@/components/DownloadReport";
import LeaveCalendar from "@/components/LeaveCalendar";
import PolicyPanel from "@/components/PolicyPanel";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ManagerPage() {
  const { leaves, loading, error, updateStatus, refresh } = useLeaves();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [actionError, setActionError] = useState("");
  const [pendingId, setPendingId] = useState<number | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
    } else if (user.role === "EMPLOYEE") {
      router.push("/employee");
    }
  }, [user, authLoading, router]);

  // This dashboard is a pending-only inbox: anything the database no longer
  // reports as "Pending" (approved, rejected, or never loaded) is filtered out
  // here so the table can never present a decided request as awaiting action.
  // Both counts derive from the same DB-sourced `leaves` array, so they stay in
  // step with the table and with a full page refresh.
  const { pendingLeaves, totalRequests } = useMemo(() => {
    const pending = leaves.filter((l) => l.status === "Pending");
    return { pendingLeaves: pending, totalRequests: pending.length };
  }, [leaves]);

  const handleDecision = async (
    id: number,
    status: "Approved" | "Rejected"
  ) => {
    setActionError("");
    setPendingId(id);
    try {
      await updateStatus(id, status);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Could not update this request"
      );
      // A decision can be refused because someone else already made it (409),
      // or because the request vanished. Re-read from the database either way so
      // a row the server has already decided can't linger as "Pending" here.
      await refresh();
    } finally {
      setPendingId(null);
    }
  };

  if (authLoading || (user && user.role === "EMPLOYEE")) return null;

  return (
    <div className="container">
      {/* Header with Download Action */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1>Manager Dashboard</h1>
        <DownloadReport data={leaves} title="Team Leave Summary Report" />
      </div>

      {error && (
        <div className="alert-error" role="alert">
          {error}
        </div>
      )}
      {actionError && (
        <div className="alert-error" role="alert">
          {actionError}
        </div>
      )}

      {/* Leave Approval Table */}
      <div className="card" style={{ marginBottom: "2rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "1rem",
          }}
        >
          <h2 style={{ margin: 0 }}>Pending Approval Inbox</h2>
          <span className="badge badge-pending">{totalRequests}</span>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>Dates</th>
                <th>Reason</th>
                <th>Actions / Status</th>
              </tr>
            </thead>
            <tbody>
              {pendingLeaves.map((l) => (
                <tr key={l.id}>
                  <td>
                    <strong>{l.employee}</strong>
                  </td>
                  <td>{l.type}</td>
                  <td>
                    {l.startDate} to {l.endDate}
                  </td>
                  <td
                    style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}
                  >
                    {l.reason}
                  </td>
                  <td>
                    {l.status === "Pending" ? (
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button
                          onClick={() => handleDecision(l.id, "Approved")}
                          className="btn-success"
                          disabled={pendingId === l.id}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleDecision(l.id, "Rejected")}
                          className="btn-danger"
                          disabled={pendingId === l.id}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className={`badge badge-${l.status.toLowerCase()}`}>
                        {l.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {pendingLeaves.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      textAlign: "center",
                      padding: "2rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    No pending leave requests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Read-only: the same database rows the admin edits. PolicyPanel shows
          no Add/Edit/Delete controls to a non-admin. */}
      <div style={{ marginTop: "2rem" }}>
        <PolicyPanel />
      </div>

      {/* Interactive Hover Calendar */}
      <LeaveCalendar />
    </div>
  );
}