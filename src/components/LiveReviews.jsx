import React, { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="star-picker" role="group" aria-label="Star rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={star <= (hover || value) ? "star active" : "star"}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
      <span className="star-rating-text">{hover || value} / 5 Stars</span>
    </div>
  );
}

const LOCAL_STORAGE_KEY = "techora_customer_reviews";

export default function LiveReviews({ session, go, embedded = false }) {
  const [reviews, setReviews] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState(session?.user?.user_metadata?.full_name || "");
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load reviews from Supabase and LocalStorage (Strictly NO fake reviews)
  const loadReviews = useCallback(async () => {
    let combined = [];

    let deletedRevIds = new Set();
    try {
      const rawDel = localStorage.getItem("techora_admin_deleted_reviews");
      if (rawDel) deletedRevIds = new Set(JSON.parse(rawDel));
    } catch (e) {}

    // 1. Fetch live database reviews from Supabase
    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("reviews")
          .select("*")
          .eq("is_visible", true)
          .order("created_at", { ascending: false });

        if (!error && Array.isArray(data)) {
          combined = data
            .filter((r) => !deletedRevIds.has(r.id))
            .map((r) => ({
              id: r.id,
              name: r.customer_name || "Techora Customer",
              rating: Number(r.rating) || 5,
              message: r.message,
              created_at: r.created_at,
            }));
        }
      } catch (err) {
        console.warn("Supabase reviews load notice:", err);
      }
    }

    // 2. Load locally stored customer reviews
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const localList = JSON.parse(stored);
        if (Array.isArray(localList)) {
          const filteredLocal = localList.filter((l) => !deletedRevIds.has(l.id));
          const existingIds = new Set(combined.map((c) => c.id));
          const uniqueLocal = filteredLocal.filter((l) => !existingIds.has(l.id));
          combined = [...uniqueLocal, ...combined];
        }
      }
    } catch (e) {
      console.warn("Local storage read notice:", e);
    }

    setReviews(combined);
  }, []);

  useEffect(() => {
    loadReviews();
    const timer = window.setInterval(loadReviews, 15000);
    const refresh = () => loadReviews();
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [loadReviews]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) {
      setStatus("Please provide both your name and review comments.");
      return;
    }

    setSubmitting(true);
    setStatus("");

    const newReview = {
      id: "rev-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      name: name.trim(),
      rating: Number(rating) || 5,
      message: comment.trim(),
      created_at: new Date().toISOString(),
    };

    // Save to local storage immediately so it persists and displays
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      const list = stored ? JSON.parse(stored) : [];
      list.unshift(newReview);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    } catch (err) {
      console.warn("Local storage write notice:", err);
    }

    // Attempt to persist to Supabase if session exists or guest allowed
    if (supabase && isSupabaseConfigured) {
      try {
        if (session?.user?.id) {
          await supabase.from("profiles").update({ full_name: name.trim() }).eq("id", session.user.id);
          await supabase.from("reviews").insert({
            user_id: session.user.id,
            customer_name: name.trim(),
            message: comment.trim(),
            rating: Number(rating) || 5,
            is_visible: true,
          });
        } else {
          await supabase.from("reviews").insert({
            customer_name: name.trim(),
            message: comment.trim(),
            rating: Number(rating) || 5,
            is_visible: true,
          });
        }
      } catch (dbErr) {
        console.warn("Supabase insert notice:", dbErr);
      }
    }

    setSubmitting(false);
    setStatus("Thank you! Your review has been submitted and published.");
    setComment("");
    setRating(5);
    setFormOpen(false);
    loadReviews();
  };

  const Root = embedded ? "section" : "main";
  return (
    <Root className={embedded ? "section customer-love reviews-page reviews-embedded" : "page-shell reviews-page"}>
      <div className="page-heading">
        <div>
          <p className="eyebrow">CUSTOMER REVIEWS</p>
          <h1>Real words, <em>honest ratings.</em></h1>
        </div>
        <p>100% genuine feedback written directly by Techora customers.</p>
      </div>

      {/* Action Bar with Write Review button */}
      <div className="reviews-action-bar">
        <button
          type="button"
          className="button button-ink write-review-btn"
          onClick={() => {
            setStatus("");
            setFormOpen(true);
          }}
        >
          ✍️ Write a Review
        </button>
        <span className="reviews-count-badge">
          {reviews.length} {reviews.length === 1 ? "Review" : "Reviews"} Published
        </span>
      </div>

      {/* Review Modal Form */}
      {formOpen && (
        <div
          className="review-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setFormOpen(false);
          }}
        >
          <div className="review-modal">
            <button
              type="button"
              className="review-modal-close"
              onClick={() => setFormOpen(false)}
              aria-label="Close"
            >
              ✕
            </button>
            <p className="eyebrow">SHARE YOUR EXPERIENCE</p>
            <h2>Write a <em>Review</em></h2>
            <p className="review-modal-intro">
              Your honest review helps our community shop with complete confidence.
            </p>

            <form onSubmit={handleSubmit} className="review-modal-form">
              <label>
                <span>Full Name</span>
                <input
                  required
                  type="text"
                  placeholder="e.g. Hamdan Amir"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </label>

              <label>
                <span>Star Rating</span>
                <StarPicker value={rating} onChange={setRating} />
              </label>

              <label>
                <span>Your Review / Comments</span>
                <textarea
                  required
                  rows="4"
                  placeholder="Share details about sound quality, build, packaging, or delivery..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </label>

              <div className="review-modal-actions">
                <button type="submit" className="button button-ink" disabled={submitting}>
                  {submitting ? "Submitting…" : "Post Review ✓"}
                </button>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setFormOpen(false)}
                >
                  Cancel
                </button>
              </div>

              {status && <p className="form-status">{status}</p>}
            </form>
          </div>
        </div>
      )}

      {/* Review List */}
      {reviews.length === 0 ? (
        <div className="reviews-empty-box">
          <div className="empty-icon">⭐</div>
          <h3>No customer reviews yet</h3>
          <p>Be the first customer to share your experience with Techora Pakistan!</p>
          <button
            type="button"
            className="button button-ink"
            onClick={() => setFormOpen(true)}
          >
            Write the First Review
          </button>
        </div>
      ) : (
        <div className="review-grid">
          {reviews.map((rev) => (
            <article className="review-card" key={rev.id}>
              <div className="review-card-top">
                <div className="review-stars" aria-label={`${rev.rating} stars`}>
                  {"★".repeat(rev.rating)}
                  {"☆".repeat(Math.max(0, 5 - rev.rating))}
                </div>
              </div>
              <p className="review-comment-text">"{rev.message}"</p>
              <footer>
                <strong>{rev.name}</strong>
                <span>
                  {rev.created_at
                    ? new Date(rev.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "Recent review"}
                </span>
              </footer>
            </article>
          ))}
        </div>
      )}
    </Root>
  );
}
