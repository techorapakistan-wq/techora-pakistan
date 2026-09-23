import React from "react";

export default function ProductMarquee({ products = [], openProduct, add }) {
  if (!products || products.length === 0) return null;

  // Duplicate for seamless infinite loop
  const marqueeItems = [...products, ...products, ...products];

  const formatMoney = (val) => `PKR ${Number(val || 0).toLocaleString()}`;

  return (
    <section className="product-marquee-section" aria-label="Trending Products Marquee">
      <div className="product-marquee-header">
        <div>
          <span className="marquee-pill">LIVE SHOWCASE</span>
          <h2 className="product-marquee-heading">
            Trending Tech, <em>In Motion.</em>
          </h2>
        </div>
        <p className="product-marquee-sub">
          Continuous live catalog • Hover to pause • Tap any item to inspect
        </p>
      </div>

      <div className="product-marquee-container">
        <div className="product-marquee-track">
          {marqueeItems.map((product, idx) => (
            <div
              key={`${product.id}-${idx}`}
              className="product-marquee-card"
              onClick={() => openProduct?.(product)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") openProduct?.(product);
              }}
            >
              <div className="marquee-card-image">
                <img src={product.image} alt={product.name} loading="lazy" />
                <span className="marquee-card-cat">{product.category || "Gadget"}</span>
              </div>
              <div className="marquee-card-body">
                <h4 className="marquee-card-title">{product.name}</h4>
                <div className="marquee-card-footer">
                  <strong className="marquee-card-price">{formatMoney(product.price)}</strong>
                  <button
                    type="button"
                    className="marquee-card-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      add?.(product, e);
                    }}
                    aria-label={`Add ${product.name} to bag`}
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
