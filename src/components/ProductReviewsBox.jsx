import React, { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

export const getStoredProductReviews = (productId) => {
  try {
    const raw = localStorage.getItem(`techora_product_reviews_${productId}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const getStoredProductRating = (productId) => {
  const list = getStoredProductReviews(productId);
  if (!list.length) return null;
  const sum = list.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
  return Number((sum / list.length).toFixed(1));
};

export default function ProductReviewsBox({ product, session, onRatingUpdate }) {
  const [reviews, setReviews] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState(session?.user?.user_metadata?.full_name || "");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!product?.id) return;
    const local = getStoredProductReviews(product.id);
    setReviews(local);

    // Calculate rating and notify parent
    if (local.length > 0) {
      const sum = local.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
      const avg = Number((sum / local.length).toFixed(1));
      onRatingUpdate?.(avg);
    }
  }, [product?.id]);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / reviews.length).toFixed(1)
    : (product.rating ? Number(product.rating).toFixed(1) : null);

  const rounded = avgRating ? Math.round(Number(avgRating)) : 5;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) {
      setStatus("Please enter both your name and review message.");
      return;
    }
    setSubmitting(true);
    setStatus("");

    const newRev = {
      id: "prev-" + Date.now() + "-" + Math.random().toString(36).substr(2, 6),
      product_id: product.id,
      name: name.trim(),
      rating: Number(rating),
      message: comment.trim(),
      created_at: new Date().toISOString(),
    };

    // 1. Save to LocalStorage immediately
    const updated = [newRev, ...reviews];
    setReviews(updated);
    try {
      localStorage.setItem(`techora_product_reviews_${product.id}`, JSON.stringify(updated));
    } catch (err) {
      console.warn("Storage write error:", err);
    }

    // 2. Calculate new average rating & notify parent to increase stars
    const newSum = updated.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
    const newAvg = Number((newSum / updated.length).toFixed(1));
    onRatingUpdate?.(newAvg);

    // 3. Persist to Supabase reviews table
    if (supabase && isSupabaseConfigured) {
      try {
        await supabase.from("reviews").insert({
          customer_name: name.trim(),
          rating: Number(rating),
          message: `[${product.name}] ${comment.trim()}`,
          is_visible: true,
          user_id: session?.user?.id || null,
        });
      } catch (dbErr) {
        console.warn("Supabase review insert note:", dbErr);
      }
    }

    setSubmitting(false);
    setStatus("✓ Thank you! Your review has been published.");
    setComment("");
    setRating(5);
    setFormOpen(false);
  };

  return (
    <div className="product-reviews-box" id="product-reviews">
      <div className="reviews-summary-header">
        <div>
          <span className="summary-eyebrow">CUSTOMER FEEDBACK</span>
          <div className="summary-rating-line">
            <span className="summary-stars">
              {avgRating ? "★".repeat(rounded) + "☆".repeat(5 - rounded) : "☆☆☆☆☆"}
            </span>
            <strong className="summary-score">{avgRating ? `${avgRating} / 5.0` : "Not yet rated"}</strong>
            <span className="summary-count">
              ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
            </span>
          </div>
        </div>
        <button
          type="button"
          className="button button-ink review-toggle-btn"
          onClick={() => {
            setStatus("");
            setFormOpen((prev) => !prev);
          }}
        >
          {formOpen ? "Close Form ✕" : "✍️ Write a Review"}
        </button>
      </div>

      {formOpen && (
        <form onSubmit={handleSubmit} className="product-review-form">
          <h4>Share your experience with this product</h4>
          <label>
            <span>Your rating</span>
            <div className="interactive-star-row" role="group" aria-label="Select star rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  className={star <= (hoverRating || rating) ? "star-btn active" : "star-btn"}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  aria-label={`${star} star`}
                >
                  ★
                </button>
              ))}
              <span className="rating-num-label">{hoverRating || rating} out of 5 stars</span>
            </div>
          </label>

          <label>
            <span>Full Name</span>
            <input
              required
              type="text"
              placeholder="e.g. Muhammad Hamdan"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label>
            <span>Your Review / Feedback</span>
            <textarea
              required
              rows="3"
              placeholder="Write your thoughts about product quality, performance, or packaging..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </label>

          <div className="review-form-actions">
            <button type="submit" className="button button-ink" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Review ✓"}
            </button>
            <button type="button" className="text-link" onClick={() => setFormOpen(false)}>
              Cancel
            </button>
          </div>

          {status && <p className="review-status-msg">{status}</p>}
        </form>
      )}

      {/* Existing reviews list */}
      <div className="product-reviews-list">
        {reviews.length === 0 ? (
          <p className="no-reviews-note">No reviews for this product yet. Be the first to share your thoughts!</p>
        ) : (
          reviews.map((r) => (
            <article key={r.id} className="product-single-review">
              <div className="single-review-head">
                <span className="single-review-stars">
                  {"★".repeat(r.rating || 5)}{"☆".repeat(5 - (r.rating || 5))}
                </span>
                <span className="single-review-badge">✓ Verified Customer</span>
              </div>
              <p className="single-review-comment">"{r.message}"</p>
              <div className="single-review-foot">
                <strong>{r.name}</strong>
                <span>
                  {r.created_at ? new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Recent"}
                </span>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
