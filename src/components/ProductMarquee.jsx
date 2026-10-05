import { useState } from "react";
import "./ProductMarquee.css";

const money = value => `PKR ${Number(value || 0).toLocaleString()}`;

export default function ProductMarquee({ products, openProduct }) {
  const [paused, setPaused] = useState(false);
  if (!products.length) return null;
  const group = (duplicate = false) => <div className="catalog-marquee-group" aria-hidden={duplicate || undefined}>
    {products.map(product => {
      const isSoldOut = Number(product.stock) <= 0;
      return <button key={(duplicate ? "copy-" : "") + product.id} tabIndex={duplicate ? -1 : 0} onClick={() => openProduct(product)} aria-label={isSoldOut ? `${product.name}, sold out` : product.name}>
      <span className={`catalog-marquee-image${isSoldOut ? " is-sold-out" : ""}`}><img src={product.image} alt={duplicate ? "" : product.name}/>{isSoldOut && <span className="catalog-marquee-sold-out">SOLD OUT</span>}</span>
      <span><strong>{product.name}</strong><small>{money(product.price)}</small></span>
    </button>;
    })}
  </div>;
  return <section className="catalog-marquee section" aria-label="Explore all Techora products">
    <div className="catalog-marquee-heading"><div><p className="eyebrow">EXPLORE THE COLLECTION</p><h2>What&apos;s moving at <em>Techora.</em></h2></div><button type="button" aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? "Resume" : "Pause"}</button></div>
    <div className={"catalog-marquee-viewport" + (paused ? " paused" : "")} onPointerDown={event => { if (event.pointerType === "touch") setPaused(true); }}>
      <div className="catalog-marquee-track">{group()}{group(true)}</div>
    </div>
  </section>;
}
