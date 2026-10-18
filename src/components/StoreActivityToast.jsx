import { useEffect, useMemo, useState } from "react";

export default function StoreActivityToast({ products = [], proof = [] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activity = useMemo(() => {
    const names = new Map(products.map((product) => [String(product.id), product.name]));
    return proof
      .map((item) => ({
        ...item,
        product_name: names.get(String(item.product_id)) || item.product_name || "A Techora product",
        unique_visitors_30d: Number(item.unique_visitors_30d) || 0,
        units_sold_30d: Number(item.units_sold_30d) || 0,
      }))
      .filter((item) => item.unique_visitors_30d > 0 || item.units_sold_30d > 0)
      .sort((a, b) => (b.unique_visitors_30d + b.units_sold_30d) - (a.unique_visitors_30d + a.units_sold_30d));
  }, [products, proof]);

  useEffect(() => {
    setActiveIndex(0);
    if (activity.length < 2) return undefined;
    const timer = window.setInterval(() => setActiveIndex((index) => (index + 1) % activity.length), 14000);
    return () => window.clearInterval(timer);
  }, [activity.length]);

  if (!activity.length) return null;
  const item = activity[activeIndex % activity.length];
  return <aside className="store-activity-toast" aria-live="polite" aria-label="Recent store activity">
    <span className="store-activity-dot" aria-hidden="true" />
    <div><small>REAL STORE ACTIVITY · 30 DAYS</small><strong>{item.product_name}</strong><p>{item.unique_visitors_30d > 0 && <span>{item.unique_visitors_30d} {item.unique_visitors_30d === 1 ? "visitor viewed" : "visitors viewed"}</span>}{item.unique_visitors_30d > 0 && item.units_sold_30d > 0 && <span> · </span>}{item.units_sold_30d > 0 && <span>{item.units_sold_30d} {item.units_sold_30d === 1 ? "unit sold" : "units sold"}</span>}</p></div>
  </aside>;
}
