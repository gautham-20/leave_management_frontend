"use client";

import { useState } from "react";
import { useAuth, Role } from "@/context/AuthContext";
import Link from "next/link";

export default function LoginPage() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("EMPLOYEE");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password, role); // ✅ single source of truth
      // redirect is handled inside AuthContext
    } catch (err: any) {
      // ✅ clean error handling
      setError(err.message || "Invalid credentials or server error");
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1>Welcome Back</h1>
        <p>Sign in to your account</p>

        {/* 🔴 Error Message */}
        {error && (
          <div
            style={{
              color: "white",
              backgroundColor: "#d9534f",
              padding: "10px",
              borderRadius: "4px",
              marginBottom: "1rem",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              required
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password */}
          <div className="form-group" style={{ marginTop: "1rem" }}>
            <label>Password</label>
            <input
              type="password"
              required
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Role */}
          <div className="form-group" style={{ marginTop: "1rem" }}>
            <label>Login As</label>
            <select
              className="form-control"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ marginTop: "1.5rem", width: "100%" }}
          >
            Sign In
          </button>
        </form>

        {/* Signup link */}
        <div
          className="auth-links"
          style={{ marginTop: "1rem", textAlign: "center" }}
        >
          Don't have an account? <Link href="/signup">Sign up</Link><br></br>
          <Link href="/">Forgot Password?</Link>
        </div>
      </div>
    </div>
  );
}