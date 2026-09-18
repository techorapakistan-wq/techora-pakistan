import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="star-picker" role="group" aria-label="Star rating">
      {[1,2,3,4,5].map(star => (
        <button
          key={star}
          type="button"
          className={star <= (hover || value) ? "star active" : "star"}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >★</button>
      ))}
    </div>
  );
}

export default function LiveReviews({ session, go }) {
  const [reviews, setReviews] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from("reviews")
      .select("*, profiles(full_name)")
      .eq("is_visible", true)
      .order("created_at", { ascending: false });
    setReviews(data || []);
  };

  useEffect(() => { load(); }, []);

  const submit = async e => {
    e.preventDefault();
    if (!session) { go("/login"); return; }
    setSubmitting(true);
    setStatus("");
    const { error } = await supabase.from("reviews").insert({
      user_id: session.user.id,
      message: comment,
      rating: rating,
    });
    setSubmitting(false);
    if (error) {
      setStatus(error.message);
    } else {
      setStatus("Shukriya! Aapka review submit ho gaya. Admin approval ke baad show hoga.");
      setName("");
      setComment("");
      setRating(5);
      setFormOpen(false);
      load();
    }
  };

  return (
    <main className="page-shell reviews-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">CUSTOMER NOTES</p>
          <h1>Kind words, <em>well earned.</em></h1>
        </div>
        <p>Feedback from verified Techora customers.</p>
      </div>

      {/* Write a Review Button */}
      <div className="reviews-action-row">
        <button className="button button-ink" onClick={() => { if (!session) { go("/login"); return; } setFormOpen(true); }}>
          ✍️ Write a Review
        </button>
      </div>

      {/* Review Form Modal */}
      {formOpen && (
        <div className="review-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setFormOpen(false); }}>
          <div className="review-modal">
            <button className="review-modal-close" onClick={() => setFormOpen(false)} aria-label="Close">✕</button>
            <p className="eyebrow">SHARE YOUR EXPERIENCE</p>
            <h2>Write a <em>Review</em></h2>
            <form onSubmit={submit} className="review-modal-form">
              <label>
                <span>Your Name</span>
                <input
                  required
                  type="text"
                  placeholder="Jaise: Ahmed Ali"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </label>
              <label>
                <span>Star Rating</span>
                <StarPicker value={rating} onChange={setRating} />
              </label>
              <label>
                <span>Your Review / Comment</span>
                <textarea
                  required
                  rows="4"
                  placeholder="Aapka experience batayein..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                />
              </label>
              <button className="button button-ink" disabled={submitting}>
                {submitting ? "Submitting…" : "Post Review ✓"}
              </button>
              {status && <p className="form-status">{status}</p>}
            </form>
          </div>
        </div>
      )}

      {/* Reviews Grid */}
      {!isSupabaseConfigured ? (
        <p className="setup-notice">Connect Supabase to load customer reviews.</p>
      ) : reviews.length === 0 ? (
        <div className="reviews-empty">
          <p>Abhi tak koi review nahi. Pehle review likhne wale banen!</p>
        </div>
      ) : (
        <div className="review-grid">
          {reviews.map(review => (
            <article className="review-card" key={review.id}>
              <div className="review-stars">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</div>
              <p>"{review.message}"</p>
              <footer>
                <strong>{review.profiles?.full_name || "Techora Customer"}</strong>
                <span>Verified purchase</span>
              </footer>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}