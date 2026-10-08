"use client";

import { useLeaves } from "@/context/LeaveContext";
import { useAuth } from "@/context/AuthContext";
import PolicyPanel from "@/components/PolicyPanel";
import StatCard from "@/components/StatCard";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EmployeePage() {
  const { leaves, balance, loading, error, addLeave } = useLeaves();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    type: "Vacation",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Helper: Identifies if a date string is a Sunday
  const isSunday = (dateString: string) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return date.getUTCDay() === 0;
  };

  useEffect(() => {
    // Wait for the session rehydration to settle before deciding to redirect,
    // otherwise a refresh always bounced the user back to /login.
    if (authLoading) return;
    if (!user) {
      router.push("/login");
    } else if (user.role !== "EMPLOYEE") {
      router.push(user.role === "MANAGER" ? "/manager" : "/admin");
    }
  }, [user, authLoading, router]);

  // Limits and usage now come from the API, which computes them per user id
  // rather than by matching names on the client. The fallbacks only render
  // before the first response arrives.
  const limits = balance?.limits ?? { Vacation: 20, "Sick Leave": 10, Personal: 5 };
  const used = balance?.used ?? { Vacation: 0, "Sick Leave": 0, Personal: 0 };

  // Not memoised: this is three subtractions, and memoising would only add
  // dependency churn since the fallbacks are rebuilt on every render.
  const remaining = {
    Vacation: Math.max(0, limits.Vacation - used.Vacation),
    "Sick Leave": Math.max(0, limits["Sick Leave"] - used["Sick Leave"]),
    Personal: Math.max(0, limits.Personal - used.Personal),
  };

  if (authLoading || (user && user.role !== "EMPLOYEE")) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    // Client-side checks are retained for instant feedback; the backend
    // revalidates everything and is the actual source of truth.
    if (new Date(form.endDate) < new Date(form.startDate)) {
      setSubmitError("End date cannot be earlier than start date!");
      return;
    }

    if (isSunday(form.startDate) || isSunday(form.endDate)) {
      setSubmitError(
        "Your leave period cannot start or end on a Sunday. Please adjust your dates."
      );
      return;
    }

    setSubmitting(true);
    try {
      await addLeave({
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason,
        // The API assigns the employee from the session token.
        employee: user?.name ?? "",
      });
      setForm({ type: "Vacation", startDate: "", endDate: "", reason: "" });
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Could not submit your request"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <h1 style={{ marginBottom: "2rem" }}>My Dashboard</h1>

      {error && (
        <div className="alert-error" role="alert">
          {error}
        </div>
      )}

      <div className="grid-3">
        <StatCard
          title="Vacation"
          used={used.Vacation}
          total={limits.Vacation}
          colorHex="var(--primary)"
        />
        <StatCard
          title="Sick Leave"
          used={used["Sick Leave"]}
          total={limits["Sick Leave"]}
          colorHex="var(--danger)"
        />
        <StatCard
          title="Personal"
          used={used.Personal}
          total={limits.Personal}
          colorHex="var(--success)"
        />
      </div>

      <div className="grid-layout">
        <div className="card">
          <h2>Request Leave</h2>

          {submitError && (
            <div className="alert-error" role="alert">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Leave Type</label>
              <select
                className="form-control"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="Vacation">Vacation</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Personal">Personal</option>
              </select>
              <small style={{ color: "var(--text-muted)" }}>
                {remaining[form.type as keyof typeof remaining]} working days
                remaining this year
              </small>
            </div>

            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                required
                min={today}
                className="form-control"
                value={form.startDate}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm({
                    ...form,
                    startDate: isSunday(value) ? "" : value,
                    // Clear the end date if it now precedes the new start.
                    endDate:
                      form.endDate && form.endDate < value ? "" : form.endDate,
                  });
                }}
              />
            </div>

            <div className="form-group">
              <label>End Date</label>
              <input
                type="date"
                required
                min={form.startDate || today}
                className="form-control"
                value={form.endDate}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm({ ...form, endDate: isSunday(value) ? "" : value });
                }}
              />
            </div>

            <div className="form-group">
              <label>Reason</label>
              <textarea
                required
                className="form-control"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || loading}
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
          </form>
        </div>

        <div className="card">
          <h2>My Leave History</h2>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Dates</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((l) => (
                  <tr key={l.id}>
                    <td>{l.type}</td>
                    <td>
                      {l.startDate} to {l.endDate}
                    </td>
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
                      colSpan={3}
                      style={{
                        textAlign: "center",
                        padding: "2rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      You have not requested any leave yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Read-only: the same database rows the admin edits. PolicyPanel shows
          no Add/Edit/Delete controls to a non-admin. Rendered as a bare card
          rather than inside .grid-layout, which assumes a two-column pair. */}
      <div style={{ marginTop: "2rem" }}>
        <PolicyPanel />
      </div>
    </div>
  );
}