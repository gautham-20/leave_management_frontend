"use client";

import { useLeaves } from "@/context/LeaveContext";
import { useAuth } from "@/context/AuthContext";
import DownloadReport from "@/components/DownloadReport";
import LeaveCalendar from "@/components/LeaveCalendar";
import PolicyPanel from "@/components/PolicyPanel";
import StatCard from "@/components/StatCard";
import { useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const { leaves, loading, error, refresh } = useLeaves();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // This page previously had no guard at all, so anyone could view the global
  // audit log by navigating straight to /admin.
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
    } else if (user.role === "EMPLOYEE") {
      router.push("/employee");
    } else if (user.role === "MANAGER") {
      router.push("/manager");
    }
  }, [user, authLoading, router]);

  // System-wide metrics, derived entirely from the database rows in `leaves`.
  // There is no placeholder branch: an empty table reports zero rather than a
  // fabricated figure, so a card never claims data that is not there.
  const analytics = useMemo(() => {
    const total = leaves.length;
    const approved = leaves.filter((l) => l.status === "Approved").length;
    const rejected = leaves.filter((l) => l.status === "Rejected").length;
    const pending = leaves.filter((l) => l.status === "Pending").length;

    // Tally by type, then pick the winner. Ties resolve to the higher count and,
    // on an exact tie, the alphabetically first type so the result is stable
    // across renders instead of depending on insertion order.
    const typeCount: Record<string, number> = {};
    for (const leave of leaves) {
      typeCount[leave.type] = (typeCount[leave.type] ?? 0) + 1;
    }

    let mostCommonType: string | null = null;
    let mostCommonCount = 0;
    for (const [type, count] of Object.entries(typeCount)) {
      if (count > mostCommonCount) {
        mostCommonType = type;
        mostCommonCount = count;
      }
    }

    // Approved as a share of every request that has actually been decided, so a
    // large pending backlog cannot drag the rate around.
    const decided = approved + rejected;

    return {
      total,
      approved,
      rejected,
      pending,
      approvalRate: decided > 0 ? (approved / decided) * 100 : null,
      mostCommonType,
      mostCommonCount,
    };
  }, [leaves]);

  // Declared after every hook: an early return above this point would make the
  // useMemo below run conditionally and break the rules of hooks.
  if (authLoading || (user && user.role !== "ADMIN")) return null;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Administrator Control Center</h1>
          <p style={{ color: 'var(--text-muted)' }}>Global Leave Tracking & Policy Compliance</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <DownloadReport data={leaves} title="Global Leave Audit Log" />
        </div>
      </div>

      {/* Analytics Section — every figure below comes from the `leaves` rows
          fetched from the database, so the cards and the table can never drift. */}
      <div className="grid-3">
        <StatCard
          title="System Approval Rate"
          used={analytics.approved}
          total={analytics.approved + analytics.rejected}
          colorHex="var(--success)"
          value={
            analytics.approvalRate === null
              ? "—"
              : `${analytics.approvalRate.toFixed(1)}%`
          }
          label="of decided requests"
          sublabel={
            analytics.approvalRate === null
              ? "No requests have been decided yet"
              : `${analytics.approved} approved of ${
                  analytics.approved + analytics.rejected
                } decided`
          }
        />
        <StatCard
          title="Active Pending Requests"
          used={analytics.pending}
          total={analytics.total}
          colorHex="var(--warning)"
          value={analytics.pending}
          label="awaiting review"
          sublabel={`of ${analytics.total} total ${
            analytics.total === 1 ? "request" : "requests"
          }`}
        />
        <StatCard
          title="Most Requested Type"
          used={analytics.mostCommonCount}
          total={analytics.total}
          colorHex="var(--primary)"
          value={analytics.mostCommonType ?? "—"}
          label={analytics.mostCommonCount === 1 ? "request" : "requests"}
          sublabel={
            analytics.mostCommonType
              ? `${analytics.mostCommonCount} of ${analytics.total} total`
              : "No requests recorded"
          }
        />
      </div>

      {error && (
        <div className="alert-error" role="alert">
          {error}
        </div>
      )}

      <div className="grid-layout" style={{ gridTemplateColumns: '2fr 1fr', marginTop: '2rem' }}>
        {/* Requirement #6 & #8: Comprehensive History & Compliance */}
        <div className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <h2 style={{ margin: 0 }}>Master Leave Records</h2>
            <button
              className="btn"
              style={{ fontSize: "0.8rem" }}
              onClick={() => refresh()}
              disabled={loading}
              title="Re-read every leave request from the database"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          <div className="table-wrapper" style={{ marginTop: "1rem" }}>
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>Duration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((l) => (
                  <tr key={l.id}>
                    <td><strong>{l.employee}</strong></td>
                    <td>{l.type}</td>
                    <td>{l.startDate} to {l.endDate}</td>
                    <td>
                      <span className={`badge badge-${l.status.toLowerCase()}`}>
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {leaves.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        textAlign: "center",
                        padding: "2rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      No leave records yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Requirement #5: Policy Management. Rendered from the database via
            PolicyProvider; admins get add/edit/delete, everyone else read-only. */}
        <PolicyPanel />
      </div>

      {/* Requirement #4: Centralized Leave Calendar */}
      <div style={{ marginTop: '2rem' }}>
        <LeaveCalendar />
      </div>
    </div>
  );
}