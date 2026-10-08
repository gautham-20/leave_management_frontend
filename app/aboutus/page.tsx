"use client";

import React from 'react';

export default function AboutUs() {
  return (
    <div className="container">
      {/* Hero Section */}
      <section className="hero">
        <h1>Empowering Your Balance</h1>
        <p>
          Leave Space is more than just a tracking tool. We are a bridge between 
          dedicated professionals and efficient management, ensuring that every 
          break is earned and every request is heard.
        </p>
      </section>

      {/* Main Content Grid */}
      <div className="grid-layout">
        <div className="card">
          <h2>Our Mission</h2>
          <p style={{ color: "var(--text-muted)", lineHeight: "1.6" }}>
            To simplify the complexities of workforce management by providing a 
            transparent, automated, and user-friendly platform for leave 
            administration. We believe that clarity in scheduling leads to a 
            healthier workplace culture.
          </p>
        </div>

        <div className="card">
          <h2>Why Leave Space?</h2>
          <p style={{ marginBottom: "1rem", color: "var(--text-muted)" }}>
            Our system is built on three core pillars designed for modern businesses:
          </p>
          <ul style={{ listStyle: "none", color: "var(--text-main)" }}>
            <li style={{ marginBottom: "0.5rem" }}>
              <span style={{ color: "var(--primary)", fontWeight: "bold" }}>✓</span> 
              <strong> Policy Enforcement:</strong> Automated checks for non-working days (Sundays) and leave limits.
            </li>
            <li style={{ marginBottom: "0.5rem" }}>
              <span style={{ color: "var(--success)", fontWeight: "bold" }}>✓</span> 
              <strong> Real-time Analytics:</strong> Instant dashboards for employees and HR reports for admins.
            </li>
            <li style={{ marginBottom: "0.5rem" }}>
              <span style={{ color: "var(--warning)", fontWeight: "bold" }}>✓</span> 
              <strong> Seamless Workflow:</strong> One-click approvals and direct communication channels.
            </li>
          </ul>
        </div>
      </div>

      {/* Feature Grid - Reusing your grid-3 class */}
      <div className="grid-3" style={{ marginTop: "2rem" }}>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🛡️</div>
          <h3>Privacy First</h3>
          <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
            Your data is encrypted and managed according to strict company privacy policies.
          </p>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⚡</div>
          <h3>Fast Approvals</h3>
          <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
            Direct notifications to managers ensure your requests don't sit in an inbox.
          </p>
        </div>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📊</div>
          <h3>Transparent Tracking</h3>
          <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
            Always know exactly how many vacation, sick, or personal days you have left.
          </p>
        </div>
      </div>

      <footer style={{ textAlign: "center", marginTop: "4rem", padding: "2rem", color: "var(--text-muted)" }}>
        <p>&copy; 2026 Leave Space Inc. Dedicated to Workplace Harmony.</p>
      </footer>
    </div>
  );
}