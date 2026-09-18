import React from "react";
import { categories } from "../data/categories";

export function CategoryGrid({ onSelectCategory }) {
  return (
    <section id="categories" className="category-section">
      <div className="section-container">
        <div className="section-header text-center">
          <span className="section-eyebrow">Organized Catalogs</span>
          <h2 className="section-heading">Explore by Category</h2>
          <p className="section-subtext">
            Hand-picked technological essentials engineered for performance, longevity, and modern aesthetics.
          </p>
        </div>

        <div className="category-grid">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.name)}
              className="category-card"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectCategory(cat.name);
                }
              }}
            >
              <div className="category-media-wrap">
                <img
                  src={cat.image}
                  alt={cat.name}
                  loading="lazy"
                  className="category-img"
                />
                <div className="category-overlay" />
              </div>

              <div className="category-details">
                <span className="category-count">{cat.itemCount}</span>
                <h3 className="category-name">{cat.name}</h3>
                <p className="category-tagline">{cat.tagline}</p>
                <div className="category-action">
                  <span>Explore Collection</span>
                  <svg className="action-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
