// src/app/page.tsx
"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="container">
      {/* Hero Section */}
      <section className="hero">
        <h1>Simplify Your Leave.</h1>
        <p>
          The all-in-one platform for employees, managers, and admins to manage 
          time off with transparency and ease.
        </p>
        
        <div className="cta-group">
          {user ? (
            <Link href={user.role.toLowerCase()} className="btn btn-primary" style={{ width: 'auto' }}>
              Back to {user.role} Dashboard
            </Link>
          ) : (
            <>
              <Link href="/signup" className="btn btn-primary" style={{ width: 'auto' }}>
                Get Started
              </Link>
              <Link href="/login" className="btn" style={{ border: '1px solid var(--border)', width: 'auto' }}>
                Log In
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-section">
        <div className="grid-3">
          <div className="card feature-card">
            <span className="feature-icon">👤</span>
            <h3>Employees</h3>
            <p style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>
              Apply for leave in seconds, track your balance, and get instant notifications.
            </p>
          </div>

          <div className="card feature-card">
            <span className="feature-icon">📋</span>
            <h3>Managers</h3>
            <p style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>
              Review team requests, check availability calendars, and approve with one click.
            </p>
          </div>

          <div className="card feature-card">
            <span className="feature-icon">🛡️</span>
            <h3>Administrators</h3>
            <p style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>
              Configure company policies, manage accruals, and generate detailed reports.
            </p>
          </div>
        </div>
      </section>

      {/* Footer (Optional) */}
      <footer style={{ textAlign: 'center', marginTop: '4rem', padding: '2rem', borderTop: '1px solid var(--border)', color: 'black', fontSize: '0.8rem' }}>
        &copy; 2026 LeaveSpace Systems. All rights reserved.
      </footer>
    </div>
  );
}