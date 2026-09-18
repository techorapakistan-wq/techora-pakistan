import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar({
  wishlistCount,
  cartCount,
  onOpenCart,
  searchQuery,
  setSearchQuery,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "#home" },
    { name: "Shop", href: "#shop" },
    { name: "Categories", href: "#categories" },
    { name: "New Arrivals", href: "#shop" },
    { name: "Deals", href: "#deals" },
    { name: "About", href: "#features" },
    { name: "Contact", href: "#contact" },
  ];

  const handleLinkClick = (href) => {
    setMobileMenuOpen(false);
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="navbar-root">
      <div className="navbar-container">
        {/* Brand Logo */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            handleLinkClick("#home");
          }}
          className="brand-logo"
        >
          <div className="logo-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="brand-text-group">
            <span className="brand-name">
              TECHORA <span className="brand-pill">PK</span>
            </span>
            <span className="brand-sub">Pakistan</span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav" aria-label="Main Navigation">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick(link.href);
              }}
              className="nav-item"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="nav-actions">
          {/* Search bar / toggle */}
          <div className="search-wrapper">
            {searchOpen ? (
              <div className="search-active-box">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search flagships, audio, chargers..."
                  className="search-input"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery("");
                  }}
                  className="search-clear-btn"
                  aria-label="Close search"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="action-icon-btn"
                aria-label="Open search input"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
            )}
          </div>

          {/* Wishlist Link */}
          <a
            href="#shop"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick("#shop");
            }}
            className="action-icon-btn"
            aria-label={`Wishlist with ${wishlistCount} items`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 00-7.78z" />
            </svg>
            {wishlistCount > 0 && <span className="counter-badge badge-rose">{wishlistCount}</span>}
          </a>

          {/* Cart Trigger */}
          <button
            type="button"
            onClick={onOpenCart}
            className="action-icon-btn"
            aria-label={`Cart with ${cartCount} items`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            {cartCount > 0 && <span className="counter-badge badge-blue">{cartCount}</span>}
          </button>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="action-icon-btn mobile-hamburger"
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {mobileMenuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M3 12h18M3 6h18M3 18h18" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="mobile-drawer"
          >
            <div className="mobile-drawer-inner">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleLinkClick(link.href);
                  }}
                  className="mobile-nav-link"
                >
                  {link.name}
                </a>
              ))}
              <div className="mobile-support-box">
                <a
                  href="https://wa.me/92323472378"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp-full"
                >
                  <span>WhatsApp: 03234724378</span>
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
