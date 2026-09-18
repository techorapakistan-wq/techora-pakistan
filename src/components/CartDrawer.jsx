import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
}) {
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const totalItemsCount = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  // Generate WhatsApp order text
  const getWhatsAppOrderUrl = () => {
    const lines = cartItems.map(
      (item) => `• ${item.name} (Qty: ${item.quantity}) - Rs. ${(item.price * item.quantity).toLocaleString()}`
    );
    const message = `Salam Techora! I would like to order the following items:%0A${lines.join(
      "%0A"
    )}%0A%0A*Total Amount:* Rs. ${subtotal.toLocaleString()}%0A*Delivery Method:* Cash on Delivery (Pakistan)%0A%0APlease confirm my order!`;
    return `https://wa.me/92323472378?text=${message}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="cart-drawer-backdrop" onClick={onClose}>
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.28, ease: "easeOut" }}
            className="cart-drawer-panel"
            onClick={(e) => e.stopPropagation()}
            aria-label="Shopping Cart Drawer"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="cart-header">
              <div className="cart-header-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cart-title-icon">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 01-8 0" />
                </svg>
                <h3>Shopping Cart</h3>
                <span className="cart-badge-count">{totalItemsCount}</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="cart-close-btn"
                aria-label="Close cart drawer"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Item List */}
            <div className="cart-items-container">
              {cartItems.length === 0 ? (
                <div className="cart-empty-state">
                  <div className="cart-empty-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                    </svg>
                  </div>
                  <p className="empty-title">Your cart is currently empty</p>
                  <p className="empty-subtitle">Explore our catalog and find the latest flagship tech.</p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn btn-primary btn-empty-cart"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <ul className="cart-items-list">
                  {cartItems.map((item) => (
                    <li key={item.id} className="cart-item-row">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="cart-item-img"
                      />
                      <div className="cart-item-info">
                        <h4 className="cart-item-name">{item.name}</h4>
                        <span className="cart-item-price">
                          Rs. {item.price.toLocaleString()}
                        </span>

                        {/* Quantity Controls */}
                        <div className="cart-qty-controls">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            className="qty-btn"
                            aria-label={`Decrease quantity of ${item.name}`}
                          >
                            –
                          </button>
                          <span className="qty-val">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="qty-btn"
                            aria-label={`Increase quantity of ${item.name}`}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.id)}
                        className="cart-item-remove"
                        aria-label={`Remove ${item.name} from cart`}
                        title="Remove item"
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer / Checkout */}
            {cartItems.length > 0 && (
              <div className="cart-footer">
                <div className="cart-summary-line">
                  <span className="summary-label">Subtotal</span>
                  <span className="summary-amount">Rs. {subtotal.toLocaleString()}</span>
                </div>
                <div className="cart-summary-line delivery-line">
                  <span className="summary-label">Delivery in Pakistan</span>
                  <span className="delivery-free">FREE</span>
                </div>

                <a
                  href={getWhatsAppOrderUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-whatsapp-checkout"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 01-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 012.41 5.83c0 4.54-3.7 8.23-8.23 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.7-.81-.23-.09-.39-.12-.56.12-.17.25-.64.81-.79.98-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.43 1.03 2.6c.12.17 1.77 2.7 4.28 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.22-.17-.47-.29z" />
                  </svg>
                  <span>Order via WhatsApp (COD)</span>
                </a>

                <p className="cart-checkout-note">
                  ✓ Verified Cash on Delivery with open-parcel courier option
                </p>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
