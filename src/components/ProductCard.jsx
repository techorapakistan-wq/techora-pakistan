import React from "react";

export function ProductCard({
  product,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
}) {
  const formattedOriginalPrice = product.originalPrice ? product.originalPrice.toLocaleString() : null;
  const formattedPrice = product.price.toLocaleString();

  return (
    <article className="product-card">
      {/* Media Box */}
      <div className="product-media-wrap">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="product-img"
        />

        {/* Badge */}
        {product.badge && (
          <span className={`product-badge badge-${product.badge.toLowerCase().replace(/\s+/g, "-")}`}>
            {product.badge}
          </span>
        )}

        {/* Wishlist Button (min 44px touch target) */}
        <button
          type="button"
          onClick={() => onToggleWishlist(product.id)}
          className={`wishlist-toggle-btn ${isWishlisted ? "is-active" : ""}`}
          aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        >
          <svg viewBox="0 0 24 24" fill={isWishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
        </button>
      </div>

      {/* Body Info */}
      <div className="product-body">
        <div className="product-meta">
          <span className="product-category">{product.category}</span>
          <div className="product-rating" aria-label={`Rating ${product.rating} out of 5 stars`}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="star-icon">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span className="rating-num">{product.rating}</span>
            <span className="reviews-count">({product.reviewsCount})</span>
          </div>
        </div>

        <h3 className="product-title" title={product.name}>
          {product.name}
        </h3>

        <p className="product-specs">{product.specs}</p>

        {/* Pricing & Add to Cart */}
        <div className="product-footer">
          <div className="price-stack">
            {product.originalPrice > product.price && (
              <span className="original-price">Rs. {formattedOriginalPrice}</span>
            )}
            <span className="current-price">Rs. {formattedPrice}</span>
          </div>

          <button
            type="button"
            onClick={() => onAddToCart(product)}
            className="btn-add-cart"
            aria-label={`Add ${product.name} to cart`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add</span>
          </button>
        </div>
      </div>
    </article>
  );
}
