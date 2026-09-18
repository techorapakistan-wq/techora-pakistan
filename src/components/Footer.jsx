import React from "react";

export function Footer() {
  const quickLinks = [
    { name: "Home", href: "#home" },
    { name: "Shop", href: "#shop" },
    { name: "Categories", href: "#categories" },
    { name: "New Arrivals", href: "#shop" },
    { name: "Deals", href: "#deals" },
    { name: "About", href: "#features" },
    { name: "Contact", href: "#contact" },
  ];

  const customerServices = [
    { name: "Delivery Information", href: "#contact" },
    { name: "Returns & Exchange", href: "#contact" },
    { name: "FAQs", href: "#contact" },
    { name: "Privacy Policy", href: "#contact" },
    { name: "Terms & Conditions", href: "#contact" },
    { name: "Track Your Order", href: "#contact" },
  ];

  const handleSmoothScroll = (href, e) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer id="contact" className="site-footer">
      <div className="section-container">
        <div className="footer-top-grid">
          {/* Brand Bio */}
          <div className="footer-col footer-col-brand">
            <div className="footer-brand">
              <div className="logo-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="brand-name">
                TECHORA <span className="brand-pill">PK</span>
              </span>
            </div>

            <p className="footer-bio">
              Pakistan’s premier modern technology retailer. We import and retail verified electronic hardware, audiophile solutions, and next-gen mobile peripherals backed by our local customer care team.
            </p>

            <div className="social-links-row">
              {/* Instagram */}
              <a
                href="#"
                className="social-icon-btn"
                aria-label="Techora Pakistan on Instagram"
                title="Instagram"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>

              {/* Facebook */}
              <a
                href="#"
                className="social-icon-btn"
                aria-label="Techora Pakistan on Facebook"
                title="Facebook"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                </svg>
              </a>

              {/* WhatsApp */}
              <a
                href="https://wa.me/92323472378"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon-btn whatsapp-social"
                aria-label="Contact Techora on WhatsApp"
                title="WhatsApp Us"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 01-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 012.41 5.83c0 4.54-3.7 8.23-8.23 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.7-.81-.23-.09-.39-.12-.56.12-.17.25-.64.81-.79.98-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.43 1.03 2.6c.12.17 1.77 2.7 4.28 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.22-.17-.47-.29z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-nav-list">
              {quickLinks.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    onClick={(e) => handleSmoothScroll(item.href, e)}
                    className="footer-nav-link"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Services */}
          <div className="footer-col">
            <h4 className="footer-heading">Customer Services</h4>
            <ul className="footer-nav-list">
              {customerServices.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    onClick={(e) => handleSmoothScroll(item.href, e)}
                    className="footer-nav-link"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details */}
          <div className="footer-col footer-col-contact">
            <h4 className="footer-heading">Contact Details</h4>
            <div className="contact-list">
              <div className="contact-item">
                <span className="contact-label">WhatsApp Helpline</span>
                <a
                  href="https://wa.me/92323472378"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-value highlight-link"
                >
                  03234724378
                </a>
              </div>

              <div className="contact-item">
                <span className="contact-label">Email Support</span>
                <a
                  href="mailto:techorapakistan@gmail.com"
                  className="contact-value"
                >
                  techorapakistan@gmail.com
                </a>
              </div>

              <div className="contact-item">
                <span className="contact-label">Customer Service Hours</span>
                <span className="contact-value text-muted">
                  Mon – Sat: 10:00 AM – 9:00 PM PKT
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-bottom-bar">
          <p className="copyright-text">
            © 2026 Techora Pakistan. All rights reserved.
          </p>
          <div className="footer-bottom-badges">
            <span>Cash on Delivery (All Pakistan)</span>
            <span className="bullet-sep">•</span>
            <span>100% Genuine Sealed Stock</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
