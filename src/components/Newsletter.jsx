import React, { useState } from "react";

export function Newsletter({ onNotify }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | success | error

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setStatus("error");
      onNotify("Please enter a valid email address.");
      return;
    }

    setStatus("success");
    setEmail("");
    onNotify("Success! You're subscribed to Techora VIP alerts.");
  };

  return (
    <section className="newsletter-section">
      <div className="section-container">
        <div className="newsletter-card">
          <span className="newsletter-eyebrow">Priority Drops</span>
          <h2 className="newsletter-heading">Stay Ahead of the Tech Curve</h2>
          <p className="newsletter-subtext">
            Join 15,000+ Pakistani tech enthusiasts. Get instant notifications on newly landed flagships, weekend flash voucher codes, and gadget hardware guides.
          </p>

          {status === "success" ? (
            <div className="newsletter-success-box" role="alert">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="success-check">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Thank you! Your email is registered for early access.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="newsletter-form" noValidate>
              <div className="newsletter-input-group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === "error") setStatus("idle");
                  }}
                  placeholder="Enter your email address"
                  className={`newsletter-input ${status === "error" ? "is-invalid" : ""}`}
                  aria-label="Email address for newsletter"
                />
                <button type="submit" className="btn btn-primary newsletter-submit">
                  <span>Subscribe</span>
                  <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
              {status === "error" && (
                <span className="newsletter-error-msg">Please enter a valid email address.</span>
              )}
            </form>
          )}

          <p className="newsletter-privacy-note">
            Zero spam guaranteed. Unsubscribe with one click anytime.
          </p>
        </div>
      </div>
    </section>
  );
}
