"use client";

import React, { useState } from 'react';

export default function ContactUs() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="container auth-wrapper">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
          <h2>Message Received!</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Thank you for reaching out. Our HR support team will get back to you within 24 hours.
          </p>
          <button 
            className="btn btn-primary" 
            style={{ marginTop: '2rem' }}
            onClick={() => setSubmitted(false)}
          >
            Send another message
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <section className="hero">
        <h1>Get in Touch</h1>
        <p>
          Have questions about your leave balance or company policy? 
          Our support team is here to help you navigate Leave Space.
        </p>
      </section>

      <div className="grid-layout">
        {/* Contact Form */}
        <div className="card">
          <h2>Send us a Message</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" required className="form-control" placeholder="John Doe" />
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>Work Email</label>
              <input type="email" required className="form-control" placeholder="john@company.com" />
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>Subject</label>
              <select className="form-control">
                <option>Technical Support</option>
                <option>Policy Inquiry</option>
                <option>Report a Bug</option>
                <option>Other</option>
              </select>
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>Message</label>
              <textarea 
                required 
                className="form-control" 
                rows={5} 
                placeholder="How can we help you?"
              ></textarea>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
              Send Message
            </button>
          </form>
        </div>

        {/* Contact Info & Details */}
        <div className="contact-info">
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3>Office Headquarters</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              123 Business Way, Tech Park<br />
              Salem, Tamil Nadu<br />
              India
            </p>
          </div>

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3>Direct Contact</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              <strong>Email:</strong> support@leavespace.com<br />
              <strong>Phone:</strong> +91 (427) 123-4567<br />
              <strong>Hours:</strong> Mon - Sat, 9:00 AM - 6:00 PM
            </p>
          </div>

          <div className="card" style={{ background: 'var(--primary)', color: 'white' }}>
            <h3 style={{ color: 'white' }}>Policy Note</h3>
            <p style={{ fontSize: '0.9rem', opacity: '0.9', marginTop: '0.5rem' }}>
              For urgent leave requests starting within 24 hours, please contact your immediate manager directly via phone after submitting your request.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}