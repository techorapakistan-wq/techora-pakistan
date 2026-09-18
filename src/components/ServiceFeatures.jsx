import React from "react";

export function ServiceFeatures() {
  const features = [
    {
      title: "Genuine Quality Products",
      desc: "Sealed authentic units sourced directly with verified serial numbers and official warranties.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      ),
    },
    {
      title: "Fast & Reliable Delivery",
      desc: "Same-day dispatches for major metropolitan hubs. Swift 24-48h courier delivery throughout Pakistan.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      ),
    },
    {
      title: "Secure Shopping Experience",
      desc: "Order with Cash on Delivery or encrypted bank checkout with complete transparency and parcel tracking.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      ),
    },
    {
      title: "Friendly Customer Support",
      desc: "Direct WhatsApp support team ready to assist with setup advice, tracking, and post-purchase care.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
        </svg>
      ),
    },
  ];

  return (
    <section id="features" className="features-section">
      <div className="section-container">
        <div className="section-header text-center">
          <span className="section-eyebrow">The Techora Standard</span>
          <h2 className="section-heading">Why Choose Techora</h2>
          <p className="section-subtext">
            Engineered for reliability. We build trust by bringing world-class electronic standards directly to Pakistan.
          </p>
        </div>

        <div className="features-grid">
          {features.map((item, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon-wrapper">{item.icon}</div>
              <h3 className="feature-title">{item.title}</h3>
              <p className="feature-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
