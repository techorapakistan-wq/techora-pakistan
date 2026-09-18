import React from "react";

export function AnnouncementBar() {
  return (
    <aside className="announcement-bar" aria-label="Announcement">
      <div className="announcement-container">
        <div className="announcement-left">
          <span className="live-dot" aria-hidden="true" />
          <span>
            <strong>Free express delivery</strong> on selected orders across Pakistan
          </span>
        </div>
        <div className="announcement-right">
          <span className="announcement-tag">Official Brand Warranty</span>
          <a
            href="https://wa.me/92323472378"
            target="_blank"
            rel="noopener noreferrer"
            className="announcement-whatsapp"
          >
            <span>WhatsApp us for quick support</span>
            <svg className="icon-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </aside>
  );
}
