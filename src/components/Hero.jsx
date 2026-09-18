import React from "react";
import { motion } from "framer-motion";

export function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const handleScroll = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="home" className="hero-section">
      <div className="hero-ambient-glow" aria-hidden="true" />
      <div className="hero-ambient-glow-secondary" aria-hidden="true" />

      <div className="hero-container">
        <div className="hero-grid">
          {/* Left Text & CTAs */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="hero-content"
          >
            <motion.div variants={itemVariants} className="hero-eyebrow">
              <span className="eyebrow-dot" />
              <span>Authentic Imports • 2026 Verified Catalog</span>
            </motion.div>

            <motion.h1 variants={itemVariants} className="hero-heading">
              Upgrade Your <br />
              <span className="gradient-text">Everyday Tech.</span>
            </motion.h1>

            <motion.p variants={itemVariants} className="hero-description">
              Pakistan's premier destination for genuine flagship smartphones, audiophile equipment, and durable accessories. Delivered swiftly across Pakistan with official warranty and instant WhatsApp assistance.
            </motion.p>

            <motion.div variants={itemVariants} className="hero-cta-group">
              <button
                type="button"
                onClick={() => handleScroll("shop")}
                className="btn btn-primary"
              >
                <span>Shop Now</span>
                <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => handleScroll("categories")}
                className="btn btn-secondary"
              >
                Explore Categories
              </button>
            </motion.div>

            {/* Trust Row */}
            <motion.div variants={itemVariants} className="hero-trust-row">
              <div className="trust-item">
                <div className="trust-icon-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="3" width="15" height="13" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                </div>
                <div>
                  <div className="trust-title">Fast Delivery</div>
                  <div className="trust-desc">Nationwide Pakistan</div>
                </div>
              </div>

              <div className="trust-item">
                <div className="trust-icon-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div>
                  <div className="trust-title">Secure Shopping</div>
                  <div className="trust-desc">Cash on Delivery & Cards</div>
                </div>
              </div>

              <div className="trust-item">
                <div className="trust-icon-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                  </svg>
                </div>
                <div>
                  <div className="trust-title">WhatsApp Support</div>
                  <div className="trust-desc">03234724378 (Daily)</div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Hero Visual Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="hero-visual-card"
          >
            <div className="visual-media-wrap">
              <img
                src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop"
                alt="Techora Flagship Audio System"
                className="hero-media-img"
              />
              <div className="media-overlay" />

              {/* Floating Featured Card */}
              <div className="hero-floating-card">
                <div className="floating-info">
                  <span className="floating-tag">Featured Tech Drop</span>
                  <h3 className="floating-title">AeroSound ANC Pro</h3>
                  <p className="floating-specs">Active Hybrid Noise Cancelling • 45h Battery</p>
                </div>
                <div className="floating-pricing">
                  <span className="price-strike">Rs. 34,999</span>
                  <span className="price-current">Rs. 27,999</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
