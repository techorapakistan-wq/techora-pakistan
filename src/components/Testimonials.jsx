import React from "react";
import { motion } from "framer-motion";

export function Testimonials() {
  const reviews = [
    {
      name: "Hamza Tariq",
      city: "Lahore, Punjab",
      text: "Ordered the AeroSound ANC headphones yesterday afternoon. Received them sealed in Lahore by noon today. Sound stage and noise cancellation are completely phenomenal. 10/10 service!",
      rating: 5,
      date: "Verified Buyer • 3 days ago",
    },
    {
      name: "Ayesha Malik",
      city: "Karachi, Sindh",
      text: "Finding original 100W GaN chargers in Pakistan is usually a headache with counterfeits. Techora sent authentic gear with real tracking updates on WhatsApp. Super impressed with their honesty.",
      rating: 5,
      date: "Verified Buyer • 1 week ago",
    },
    {
      name: "Bilal Ahmed",
      city: "Islamabad, ICT",
      text: "The mechanical keyboard typing experience and solid build quality exceeded my expectations. Cash on delivery was seamless, courier arrived on time. Techora is now my default tech vendor.",
      rating: 5,
      date: "Verified Buyer • 2 weeks ago",
    },
  ];

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: i * 0.12, ease: "easeOut" },
    }),
  };

  return (
    <section id="reviews" className="testimonials-section">
      <div className="section-container">
        <div className="section-header text-center">
          <span className="section-eyebrow">Customer Confidence</span>
          <h2 className="section-heading">Trusted Across Pakistan</h2>
          <p className="section-subtext">
            Over 10,000+ tech lovers across Pakistan depend on Techora for authentic components and genuine post-purchase support.
          </p>
        </div>

        <div className="testimonials-grid">
          {reviews.map((rev, idx) => (
            <motion.div
              key={idx}
              custom={idx}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              className="testimonial-card"
            >
              <div className="testimonial-stars" aria-label={`${rev.rating} out of 5 stars`}>
                {[...Array(rev.rating)].map((_, i) => (
                  <svg key={i} viewBox="0 0 24 24" fill="currentColor" className="star-icon">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
              </div>

              <blockquote className="testimonial-text">"{rev.text}"</blockquote>

              <div className="testimonial-author">
                <div className="author-avatar" aria-hidden="true">
                  {rev.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div className="author-details">
                  <div className="author-name">{rev.name}</div>
                  <div className="author-city">{rev.city}</div>
                  <div className="author-date">{rev.date}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
