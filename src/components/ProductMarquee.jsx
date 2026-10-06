import { useEffect, useRef, useState } from "react";
import "./ProductMarquee.css";

const money = value => `PKR ${Number(value || 0).toLocaleString()}`;

export default function ProductMarquee({ products, openProduct }) {
  const trackRef = useRef(null);
  const groupRef = useRef(null);
  const positionRef = useRef(0);
  const pointerRef = useRef(null);
  const momentumRef = useRef(0);
  const draggedRef = useRef(false);
  const [dragging, setDragging] = useState(false);
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    let frame = 0;
    let lastTime = performance.now();
    const baseSpeed = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? 0 : 0.022;
    const move = (now) => {
      const elapsed = Math.min(now - lastTime, 32);
      lastTime = now;
      const width = groupRef.current?.offsetWidth || 0;
      if (width > 0) {
        if (positionRef.current === 0) positionRef.current = -width;
        if (!pointerRef.current) {
          positionRef.current += (baseSpeed + momentumRef.current) * elapsed;
          momentumRef.current *= Math.pow(0.93, elapsed / 16);
          if (positionRef.current >= 0) positionRef.current -= width;
          if (positionRef.current < -width) positionRef.current += width;
        }
        track.style.transform = `translate3d(${positionRef.current}px, 0, 0)`;
      }
      frame = requestAnimationFrame(move);
    };
    frame = requestAnimationFrame(move);
    return () => cancelAnimationFrame(frame);
  }, [products]);
  if (!products.length) return null;

  const onPointerDown = (event) => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    pointerRef.current = { id: event.pointerId, x: event.clientX, lastX: event.clientX, lastAt: performance.now(), total: 0 };
    momentumRef.current = 0;
    const captureTarget = event.target.closest?.(".catalog-marquee-group > button") || event.currentTarget;
    captureTarget.setPointerCapture?.(event.pointerId);
    setDragging(true);
  };
  const onPointerMove = (event) => {
    const pointer = pointerRef.current;
    if (!pointer || pointer.id !== event.pointerId) return;
    const now = performance.now();
    const delta = event.clientX - pointer.lastX;
    positionRef.current += delta;
    pointer.total += delta;
    const elapsed = Math.max(8, now - pointer.lastAt);
    momentumRef.current = Math.max(-1.8, Math.min(1.8, delta / elapsed));
    pointer.lastX = event.clientX;
    pointer.lastAt = now;
    if (Math.abs(pointer.total) > 7) draggedRef.current = true;
    const width = groupRef.current?.offsetWidth || 0;
    if (width > 0) {
      if (positionRef.current >= 0) positionRef.current -= width;
      if (positionRef.current < -width) positionRef.current += width;
    }
    if (trackRef.current) trackRef.current.style.transform = `translate3d(${positionRef.current}px, 0, 0)`;
  };
  const onPointerUp = (event) => {
    if (pointerRef.current?.id !== event.pointerId) return;
    if (Math.abs(pointerRef.current.total) > 7) event.preventDefault();
    pointerRef.current = null;
    setDragging(false);
    window.setTimeout(() => { draggedRef.current = false; }, 100);
  };
  const openIfClick = (product) => {
    if (draggedRef.current) return;
    openProduct(product);
  };

  const group = (duplicate = false) => <div ref={duplicate ? undefined : groupRef} className="catalog-marquee-group" aria-hidden={duplicate || undefined}>
    {products.map(product => {
      const isSoldOut = Number(product.stock) <= 0;
      return <button key={(duplicate ? "copy-" : "") + product.id} tabIndex={duplicate ? -1 : 0} onClick={() => openIfClick(product)} aria-label={isSoldOut ? `${product.name}, sold out` : product.name}>
        <span className={`catalog-marquee-image${isSoldOut ? " is-sold-out" : ""}`}><img src={product.image} alt={duplicate ? "" : product.name}/>{isSoldOut && <span className="catalog-marquee-sold-out">SOLD OUT</span>}</span>
        <span><strong>{product.name}</strong><small>{money(product.price)}</small></span>
      </button>;
    })}
  </div>;
  return <section className="catalog-marquee section" aria-label="Explore all Techora products">
    <div className="catalog-marquee-heading"><div><p className="eyebrow">EXPLORE THE COLLECTION</p><h2>What&apos;s moving at <em>Techora.</em></h2></div><span className="catalog-marquee-hint">Swipe to explore <span aria-hidden="true">← →</span></span></div>
    <div className={`catalog-marquee-viewport${dragging ? " is-dragging" : ""}`} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
      <div ref={trackRef} className="catalog-marquee-track">{group()}{group(true)}</div>
    </div>
  </section>;
}
