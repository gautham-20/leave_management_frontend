"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth, Role } from "@/context/AuthContext";

export type AuthMode = "login" | "signup";

/*
 * Crash timeline. These must stay in step with the impact delays hard-coded in
 * the `.crash-*` keyframes in globals.css.
 */
const IMPACT_MS = 420; // car arrives — every debris layer starts here
const SIGNUP_MS = IMPACT_MS + 100; // signup form erupts, 100ms after impact
const TOTAL_MS = 1500; // all overlays have faded; card is interactive again

/** Read a thrown value as a message without falling back to `any`. */
function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

/**
 * Shards of the card. Each fills the card and is clipped to `clip`, so together
 * they tile it exactly; the throw distances are biased rightward and upward
 * because the car arrives from the right.
 */
const SHARDS: Array<{ clip: string; x: string; y: string; rot: string; dur: number; delay: number }> = [
  { clip: "polygon(0% 0%, 42% 0%, 30% 38%, 0% 26%)", x: "-120px", y: "-70px", rot: "-48deg", dur: 660, delay: 420 },
  { clip: "polygon(42% 0%, 100% 0%, 100% 22%, 30% 38%)", x: "150px", y: "-96px", rot: "34deg", dur: 700, delay: 424 },
  { clip: "polygon(0% 26%, 30% 38%, 18% 72%, 0% 64%)", x: "-140px", y: "40px", rot: "-62deg", dur: 620, delay: 430 },
  { clip: "polygon(30% 38%, 100% 22%, 100% 56%, 18% 72%)", x: "185px", y: "20px", rot: "52deg", dur: 740, delay: 426 },
  { clip: "polygon(0% 64%, 18% 72%, 12% 100%, 0% 100%)", x: "-96px", y: "130px", rot: "-34deg", dur: 680, delay: 438 },
  { clip: "polygon(18% 72%, 100% 56%, 100% 100%, 12% 100%)", x: "120px", y: "150px", rot: "28deg", dur: 760, delay: 432 },
];

/** Sparks thrown out of the impact point. */
const DEBRIS: Array<{ x: string; y: string; rot: string; size: string; color: string; dur: number; delay: number }> = [
  { x: "120px", y: "-140px", rot: "220deg", size: "7px", color: "#fbbf24", dur: 780, delay: 430 },
  { x: "185px", y: "-70px", rot: "180deg", size: "5px", color: "#f97316", dur: 700, delay: 436 },
  { x: "160px", y: "95px", rot: "300deg", size: "6px", color: "#fbbf24", dur: 820, delay: 432 },
  { x: "95px", y: "160px", rot: "260deg", size: "8px", color: "#cbd5e1", dur: 740, delay: 444 },
  { x: "215px", y: "35px", rot: "340deg", size: "4px", color: "#e2e8f0", dur: 660, delay: 428 },
  { x: "70px", y: "-175px", rot: "200deg", size: "5px", color: "#fdba74", dur: 800, delay: 440 },
  { x: "240px", y: "-140px", rot: "160deg", size: "4px", color: "#fbbf24", dur: 720, delay: 446 },
  { x: "140px", y: "185px", rot: "290deg", size: "6px", color: "#94a3b8", dur: 860, delay: 450 },
  { x: "-40px", y: "-120px", rot: "240deg", size: "5px", color: "#e2e8f0", dur: 690, delay: 434 },
  { x: "200px", y: "150px", rot: "320deg", size: "7px", color: "#fdba74", dur: 810, delay: 442 },
];

/** Side-on car, mirrored so the front faces left, toward the card. */
function Car() {
  return (
    <div className="crash-car">
      <div className="crash-car-wrap">
        <svg viewBox="0 0 200 104" width="100%" aria-hidden="true" focusable="false">
          <g transform="translate(200 0) scale(-1 1)">
            {/* ground shadow */}
            <ellipse cx="104" cy="92" rx="82" ry="7" fill="#0f172a" opacity="0.18" />
            {/* body */}
            <path
              d="M16 66 L24 50 Q27 42 38 40 L92 34 Q110 22 132 20 L150 20 Q170 23 180 40 L188 56 Q194 58 194 64 L193 72 Q193 76 189 76 L20 76 Q13 76 13 69 Z"
              fill="#e11d48"
            />
            {/* body shading */}
            <path
              d="M16 66 L24 50 Q27 42 38 40 L92 34 Q110 22 132 20 L150 20 Q170 23 180 40 L188 56 Q150 60 100 58 L40 60 Z"
              fill="#fb7185"
              opacity="0.55"
            />
            {/* cabin glass */}
            <path d="M100 33 L120 24 L146 24 L163 39 L106 42 Z" fill="#bae6fd" />
            <path d="M120 24 L146 24 L152 30 L114 30 Z" fill="#e0f2fe" opacity="0.8" />
            {/* door line + handle */}
            <path d="M104 42 L100 62" stroke="#9f1239" strokeWidth="1.6" opacity="0.5" />
            <rect x="112" y="48" width="12" height="3" rx="1.5" fill="#881337" opacity="0.55" />
            {/* headlight + grille */}
            <circle cx="186" cy="60" r="5.5" fill="#fde047" />
            <rect x="176" y="66" width="16" height="5" rx="2" fill="#881337" opacity="0.6" />
            {/* tail light */}
            <rect x="14" y="58" width="7" height="6" rx="2" fill="#7f1d1d" />
            {/* wheels */}
            <circle className="wheel" cx="50" cy="74" r="14" fill="#111827" />
            <circle className="wheel" cx="50" cy="74" r="6" fill="#9ca3af" />
            <circle className="wheel" cx="152" cy="74" r="14" fill="#111827" />
            <circle className="wheel" cx="152" cy="74" r="6" fill="#9ca3af" />
          </g>
        </svg>
      </div>
    </div>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  autoComplete?: string;
};

/** A labelled text field, with an optional show/hide toggle for passwords. */
function Field({ label, value, onChange, type = "text", required, autoComplete }: FieldProps) {
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";

  const input = (
    <input
      className="form-control"
      type={isPassword && revealed ? "text" : type}
      required={required}
      autoComplete={autoComplete}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );

  return (
    <div className="form-group">
      <label>{label}</label>
      {isPassword ? (
        <div className="password-field">
          {input}
          <button
            type="button"
            className="password-toggle"
            onClick={() => setRevealed((r) => !r)}
            aria-label={revealed ? `Hide ${label}` : `Show ${label}`}
          >
            {revealed ? "Hide" : "Show"}
          </button>
        </div>
      ) : (
        input
      )}
    </div>
  );
}

/**
 * Login and signup share one card. Forward, the switch is a crash: a car
 * charges in from the right and the card bursts, with the signup form rising
 * out of the wreckage. Back to sign-in it is a plain slide.
 *
 * Both `/login` and `/signup` render this; `initialMode` picks the opening form,
 * which keeps the signup URL working for direct visits.
 */
export default function AuthScreen({ initialMode = "login" }: { initialMode?: AuthMode }) {
  const { login, signup } = useAuth();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  /*
   * Drives the animation. "idle" is the resting state; "crash" and "back" name
   * the transition currently playing. The cycle number is the remount key that
   * restarts the CSS animations, and it must not change when a transition ends.
   */
  const [phase, setPhase] = useState<{ kind: "idle" | "crash" | "back"; cycle: number }>({
    kind: "idle",
    cycle: 0,
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("EMPLOYEE");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  // Debris values are static, so they are styled once per render of the overlay.
  const shardVars = useMemo(
    () =>
      SHARDS.map((s) =>
        ({
          "--shard-clip": s.clip,
          "--shard-x": s.x,
          "--shard-y": s.y,
          "--shard-rot": s.rot,
          "--shard-dur": `${s.dur}ms`,
          "--shard-delay": `${s.delay}ms`,
        }) as React.CSSProperties,
      ),
    [],
  );

  const debrisVars = useMemo(
    () =>
      DEBRIS.map((d) =>
        ({
          "--debris-x": d.x,
          "--debris-y": d.y,
          "--debris-rot": d.rot,
          "--debris-size": d.size,
          "--debris-color": d.color,
          "--debris-dur": `${d.dur}ms`,
          "--debris-delay": `${d.delay}ms`,
        }) as React.CSSProperties,
      ),
    [],
  );

  /**
   * The car is driven entirely by CSS; this only has to swap the mounted form
   * once the sign-in panel has faded, and tear the overlays down afterwards.
   */
  const crashIntoSignup = useCallback(() => {
    if (phase.kind !== "idle") return;

    setError("");
    setPhase({ kind: "crash", cycle: Date.now() });

    timers.current.push(
      setTimeout(() => {
        setMode("signup");
        // Land the role select on something the signup form actually offers.
        if (role === "ADMIN") setRole("EMPLOYEE");
      }, SIGNUP_MS),
      // Return to idle keeping the same cycle, so the panel is not remounted.
      setTimeout(() => setPhase((prev) => ({ kind: "idle", cycle: prev.cycle })), TOTAL_MS),
    );
  }, [phase.kind, role]);

  const returnToLogin = useCallback(() => {
    if (phase.kind !== "idle") return;

    setError("");
    setMode("login");
    setPhase({ kind: "back", cycle: Date.now() });
    timers.current.push(
      setTimeout(() => setPhase((prev) => ({ kind: "idle", cycle: prev.cycle })), 400),
    );
  }, [phase.kind]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      await login(email, password, role); // redirect is handled inside AuthContext
    } catch (err: unknown) {
      setError(errorMessage(err, "Invalid credentials or server error"));
    } finally {
      setBusy(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      await signup({ name, email, password, role });
      // redirect handled inside AuthContext signup()
    } catch (err: unknown) {
      setError(errorMessage(err, "Signup failed"));
    } finally {
      setBusy(false);
    }
  }

  const signingIn = mode === "login";

  // The cycle value only ever changes when a transition starts, so dropping the
  // animation class afterwards does not remount the panel — otherwise focus
  // would be stolen from a field the user had started typing into.
  const panelClass = [
    "auth-panel",
    phase.kind === "crash" ? (signingIn ? "crash-panel--break" : "crash-panel--emerge") : "",
    phase.kind === "back" ? "crash-panel--slide-back" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="auth-wrapper">
      <div className="crash-stage">
        <div className={phase.kind === "crash" ? "auth-card crash-card--hit" : "auth-card"}>
          {/* Remounting on cycle replays every CSS animation in the sequence. */}
          <div key={phase.cycle} className={panelClass}>
            {signingIn ? (
              <>
                <h1>Welcome Back</h1>
                <p>Sign in to your account</p>

                {error && <div className="alert-error">{error}</div>}

                <form onSubmit={handleLogin}>
                  <Field
                    label="Email Address"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={setEmail}
                  />

                  <div style={{ marginTop: "1rem" }}>
                    <Field
                      label="Password"
                      type="password"
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={setPassword}
                    />
                  </div>

                  <div className="form-group" style={{ marginTop: "1rem" }}>
                    <label htmlFor="login-role">Login As</label>
                    <select
                      id="login-role"
                      className="form-control"
                      value={role}
                      onChange={(e) => setRole(e.target.value as Role)}
                    >
                      <option value="EMPLOYEE">Employee</option>
                      <option value="MANAGER">Manager</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={busy}
                    style={{ marginTop: "1.5rem" }}
                  >
                    {busy ? "Signing In…" : "Sign In"}
                  </button>
                </form>

                <div className="auth-links">
                  <p style={{ marginBottom: "0.5rem" }}>
                    Don&apos;t have an account?{" "}
                    <button
                      type="button"
                      className="auth-switch"
                      onClick={crashIntoSignup}
                      disabled={phase.kind !== "idle"}
                    >
                      Sign up
                    </button>
                  </p>
                  <Link href="/">Forgot Password?</Link>
                </div>
              </>
            ) : (
              <>
                <h1>Create Account</h1>
                <p>Register to request and track leave</p>

                {error && <div className="alert-error">{error}</div>}

                <form onSubmit={handleSignup}>
                  <Field label="Full Name" required autoComplete="name" value={name} onChange={setName} />

                  <div style={{ marginTop: "1rem" }}>
                    <Field
                      label="Email Address"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={setEmail}
                    />
                  </div>

                  <div style={{ marginTop: "1rem" }}>
                    <Field
                      label="Password"
                      type="password"
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={setPassword}
                    />
                  </div>

                  <div className="form-group" style={{ marginTop: "1rem" }}>
                    <label htmlFor="signup-role">Select Role</label>
                    <select
                      id="signup-role"
                      className="form-control"
                      value={role}
                      onChange={(e) => setRole(e.target.value as Role)}
                    >
                      <option value="EMPLOYEE">Employee</option>
                      <option value="MANAGER">Manager</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={busy}
                    style={{ marginTop: "1.5rem" }}
                  >
                    {busy ? "Creating Account…" : "Sign Up"}
                  </button>
                </form>

                <div className="auth-links">
                  <p>
                    Already have an account?{" "}
                    <button type="button" className="auth-switch" onClick={returnToLogin}>
                      Sign in
                    </button>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Overlays sit outside the card so they are not clipped by it, and are
            pointer-events:none so they never intercept the form. */}
        {phase.kind === "crash" && (
          <>
            <div className="crash-layer" key={"fx-" + phase.cycle}>
              {shardVars.map((style, i) => (
                <span key={i} className="crash-shard" style={style} />
              ))}
              {debrisVars.map((style, i) => (
                <span key={i} className="crash-debris" style={style} />
              ))}
              <span className="crash-ring" />
              <span className="crash-flash" />
              <span className="crash-dust" />
            </div>
            <Car />
          </>
        )}
      </div>

      {/* Announces the swap for screen readers, since the animation is visual only. */}
      <p aria-live="polite" className="sr-only">
        {signingIn ? "Sign in form" : "Sign up form"}
      </p>
    </div>
  );
}