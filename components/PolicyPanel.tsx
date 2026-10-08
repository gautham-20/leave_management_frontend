"use client";

import { useState } from "react";
import { usePolicies, LeavePolicy } from "@/context/PolicyContext";
import { useAuth } from "@/context/AuthContext";

/**
 * The "Active Policies" card, shared by all three dashboards.
 *
 * Everyone reads the same rows from the database. Editing controls render only
 * for an ADMIN, and the API rejects a write from any other role with 403, so the
 * view-only rule is enforced by the server as well as hidden in the UI.
 */
export default function PolicyPanel() {
  const { policies, loading, error, createPolicy, updatePolicy, deletePolicy } =
    usePolicies();
  const { user } = useAuth();

  const canEdit = user?.role === "ADMIN";

  const [editingId, setEditingId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ title: "", description: "" });
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);

  const resetForm = () => {
    setDraft({ title: "", description: "" });
    setEditingId(null);
    setAdding(false);
    setActionError("");
  };

  const startEdit = (policy: LeavePolicy) => {
    setEditingId(policy.id);
    setAdding(false);
    setDraft({ title: policy.title, description: policy.description });
    setActionError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError("");

    if (!draft.title.trim() || !draft.description.trim()) {
      setActionError("Both a title and a description are required.");
      return;
    }

    setBusy(true);
    try {
      if (editingId !== null) {
        await updatePolicy(editingId, {
          title: draft.title.trim(),
          description: draft.description.trim(),
        });
      } else {
        await createPolicy({
          title: draft.title.trim(),
          description: draft.description.trim(),
        });
      }
      resetForm();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Could not save this policy"
      );
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (policy: LeavePolicy) => {
    setActionError("");
    setBusy(true);
    try {
      await deletePolicy(policy.id);
      if (editingId === policy.id) resetForm();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Could not delete this policy"
      );
    } finally {
      setBusy(false);
    }
  };

  const isEditing = editingId !== null || adding;

  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <h2 style={{ margin: 0 }}>Active Policies</h2>
        {canEdit && !isEditing && (
          <button
            className="btn btn-primary"
            style={{ fontSize: "0.8rem" }}
            onClick={() => {
              setAdding(true);
              setEditingId(null);
              setDraft({ title: "", description: "" });
              setActionError("");
            }}
          >
            Add Policy
          </button>
        )}
      </div>

      {error && (
        <div className="alert-error" role="alert" style={{ marginTop: "1rem" }}>
          {error}
        </div>
      )}
      {actionError && (
        <div className="alert-error" role="alert" style={{ marginTop: "1rem" }}>
          {actionError}
        </div>
      )}

      {isEditing && (
        <form
          onSubmit={handleSubmit}
          style={{
            marginTop: "1rem",
            paddingBottom: "1rem",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div className="form-group">
            <label>Policy Title</label>
            <input
              className="form-control"
              required
              maxLength={120}
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              className="form-control"
              required
              maxLength={1000}
              rows={2}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ fontSize: "0.8rem" }}
              disabled={busy}
            >
              {busy ? "Saving..." : editingId !== null ? "Update Policy" : "Add Policy"}
            </button>
            <button
              type="button"
              className="btn"
              style={{ fontSize: "0.8rem" }}
              onClick={resetForm}
              disabled={busy}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div style={{ fontSize: "0.9rem", lineHeight: "1.6", marginTop: "1rem" }}>
        {policies.map((policy, index) => (
          <div
            key={policy.id}
            style={{
              marginBottom: "1rem",
              paddingBottom: "1rem",
              borderBottom:
                index === policies.length - 1 ? "none" : "1px solid var(--border)",
            }}
          >
            <strong>{policy.title}</strong>
            <p style={{ color: "var(--text-muted)" }}>{policy.description}</p>

            {canEdit && !isEditing && (
              <div style={{ display: "flex", gap: "8px", marginTop: "0.5rem" }}>
                <button
                  className="btn"
                  style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}
                  onClick={() => startEdit(policy)}
                  disabled={busy}
                >
                  Edit
                </button>
                <button
                  className="btn btn-danger"
                  style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}
                  onClick={() => handleDelete(policy)}
                  disabled={busy}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}

        {policies.length === 0 && !loading && (
          <p style={{ color: "var(--text-muted)" }}>
            No policies have been published yet.
          </p>
        )}
      </div>
    </div>
  );
}
