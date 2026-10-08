"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth, Role } from "@/context/AuthContext";

export type AuthMode = "login" | "signup";

/**
 * The swap animation runs for 480ms and changes its contents at the 26% mark
 * (~125ms), while the incoming panel is still off-screen and transparent. Both
 * values must stay in step with `auth-panel-swap` in globals.css.
 */
const SWAP_MS = 480;
const CONTENT_CHANGE_MS = 125;

/** Read a thrown value as a message without falling back to `any`. */
function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
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
 * Login and signup share one card so switching between them animates instead of
 * triggering a page load. Both `/login` and `/signup` render this; `initialMode`
 * decides which form appears first, which keeps the signup URL working for
 * direct visits and shared links.
 */
export default function AuthScreen({ initialMode = "login" }: { initialMode?: AuthMode }) {
  const { login, signup } = useAuth();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  /** Non-null only while a swap is in flight. Drives the animation classes. */
  const [swap, setSwap] = useState<{ to: AuthMode; dir: 1 | -1; cycle: number } | null>(null);

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

  const switchTo = useCallback(
    (next: AuthMode) => {
      if (next === mode || swap) return;

      // 1 = pushing forward (login → signup): the new form enters from the right.
      // -1 = going back (signup → login): it enters from the left.
      const dir: 1 | -1 = next === "signup" ? 1 : -1;

      setError("");
      setSwap({ to: next, dir, cycle: Date.now() });

      /*
       * The URL is deliberately left alone. `history.replaceState` integrates
       * with the Next.js Router, so rewriting /login to /signup makes the
       * router re-render that segment and remount this component — which
       * cancels the timers below and kills the animation mid-flight. The swap
       * stays local React state; /signup still renders the signup form for
       * anyone arriving on that URL directly.
       */
      timers.current.push(
        setTimeout(() => {
          setMode(next);
          // Land the role select on something the target form actually offers.
          if (next === "signup" && role === "ADMIN") setRole("EMPLOYEE");
        }, CONTENT_CHANGE_MS),
        setTimeout(() => setSwap(null), SWAP_MS),
      );
    },
    [mode, role, swap],
  );

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

  const panelClass = swap ? "auth-panel auth-panel--swap" : "auth-panel";

  return (
    <div className="auth-wrapper">
      <div className={swap ? "auth-card auth-card--impact" : "auth-card"}>
        <div
          key={swap ? swap.cycle : "static"}
          className={panelClass}
          style={swap ? ({ "--swap-dir": swap.dir } as React.CSSProperties) : undefined}
        >
          {mode === "login" ? (
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
                  <button type="button" className="auth-switch" onClick={() => switchTo("signup")}>
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
                <Field
                  label="Full Name"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={setName}
                />

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
                  <button type="button" className="auth-switch" onClick={() => switchTo("login")}>
                    Sign in
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}