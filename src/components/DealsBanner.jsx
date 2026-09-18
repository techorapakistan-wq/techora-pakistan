import React, { useState, useEffect } from "react";

export function DealsBanner({ onShopDeals }) {
  const [countdown, setCountdown] = useState({
    days: 2,
    hours: 14,
    minutes: 36,
    seconds: 45,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="deals" className="deals-section">
      <div className="section-container">
        <div className="deals-card">
          <div className="deals-ambient-glow" aria-hidden="true" />
          
          <div className="deals-grid">
            <div className="deals-content">
              <span className="deals-badge">Limited Flash Window</span>
              <h2 className="deals-heading">
                Save Up to 35% on <br />
                <span className="gradient-text">Audiophile & Flagship Drops</span>
              </h2>
              <p className="deals-copy">
                Limited-quantity batches imported directly with verified authenticity. Fast courier across Lahore, Karachi, Islamabad, and nationwide delivery with zero hassle.
              </p>

              {/* Countdown Display */}
              <div className="countdown-container" aria-label="Flash sale timer">
                {[
                  { label: "Days", val: countdown.days },
                  { label: "Hours", val: countdown.hours },
                  { label: "Minutes", val: countdown.minutes },
                  { label: "Seconds", val: countdown.seconds },
                ].map((item, idx) => (
                  <div key={idx} className="countdown-box">
                    <span className="countdown-value">
                      {String(item.val).padStart(2, "0")}
                    </span>
                    <span className="countdown-label">{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="deals-action-wrap">
                <button
                  type="button"
                  onClick={onShopDeals}
                  className="btn btn-primary btn-large"
                >
                  <span>Shop Deals</span>
                  <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Featured Product Preview */}
            <div className="deals-preview">
              <div className="deals-preview-box">
                <img
                  src="https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=800&auto=format&fit=crop"
                  alt="PulsePods Pro Earbuds"
                  className="deals-preview-img"
                />
                <div className="deals-preview-info">
                  <div>
                    <h4 className="deals-item-name">PulsePods Pro ANC</h4>
                    <span className="deals-item-tag">Active Noise Cancellation</span>
                  </div>
                  <div className="deals-item-prices">
                    <span className="deals-old-price">Rs. 19,000</span>
                    <span className="deals-new-price">Rs. 14,999</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
