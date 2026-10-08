/**
 * A single statistic card.
 *
 * Two modes, so the same card serves both the allowance cards on the employee
 * dashboard and the count-based cards on the admin dashboard:
 *
 *   - Default (`used` / `total`): shows what is left and fills the bar by how
 *     much has been consumed. This is the allowance form.
 *   - `value` supplied: shows the caller's own number and label. Used when
 *     `total - used` would be meaningless, such as a percentage or a count.
 *
 * The bar always reflects `used / total`, guarded so an empty or zero total
 * cannot produce an Infinity/NaN width.
 */
export default function StatCard({
  title,
  used,
  total,
  colorHex,
  value,
  label,
  sublabel,
}: {
  title: string;
  used: number;
  total: number;
  colorHex: string;
  /** Overrides the default `total - used` headline. */
  value?: number | string;
  /** Unit shown next to `value`, e.g. "requests". Defaults to "Days Left". */
  label?: string;
  /** Extra context rendered under the headline. */
  sublabel?: string;
}) {
  const safeTotal = Number.isFinite(total) ? total : 0;
  const safeUsed = Number.isFinite(used) ? used : 0;
  const percentage =
    safeTotal > 0 ? Math.min(100, Math.max(0, (safeUsed / safeTotal) * 100)) : 0;

  const headline = value ?? Math.max(0, safeTotal - safeUsed);
  const unit = label ?? "Days Left";

  return (
    <div className="card">
      <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{title}</p>
      <h3 style={{ fontSize: "2rem", margin: "0.5rem 0" }}>
        {headline}{" "}
        <span
          style={{
            fontSize: "1rem",
            color: "var(--text-muted)",
            fontWeight: "normal",
          }}
        >
          {unit}
        </span>
      </h3>
      <div
        style={{
          width: "100%",
          background: "var(--bg-color)",
          height: "8px",
          borderRadius: "4px",
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            background: colorHex,
            height: "100%",
            borderRadius: "4px",
          }}
        />
      </div>
      {sublabel && (
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.8rem",
            marginTop: "0.6rem",
          }}
        >
          {sublabel}
        </p>
      )}
    </div>
  );
}
