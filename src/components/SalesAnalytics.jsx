import { useMemo, useState } from "react";

const saleStatuses = new Set(["approved", "processing", "completed"]);
const money = (value) => `PKR ${Number(value || 0).toLocaleString()}`;
const localDateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const displayDate = (dateKey, options = { day: "numeric", month: "short" }) => new Date(`${dateKey}T12:00:00`).toLocaleDateString("en-GB", options);
const todayKey = () => localDateKey(new Date());
const dateDaysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return localDateKey(date);
};

function getBucket(dateKey, mode) {
  const date = new Date(`${dateKey}T12:00:00`);
  if (mode === "month") return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  if (mode === "week") {
    const monday = new Date(date);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    return localDateKey(monday);
  }
  return dateKey;
}

function bucketLabel(key, mode) {
  if (mode === "month") return displayDate(`${key}-01`, { month: "short", year: "2-digit" });
  return displayDate(key);
}

function SalesChart({ buckets, mode, revenue }) {
  const width = 760;
  const height = 250;
  const left = 68;
  const right = 20;
  const top = 16;
  const bottom = 45;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const max = Math.max(1, ...buckets.map((bucket) => bucket.revenue));
  const points = buckets.map((bucket, index) => ({
    ...bucket,
    x: left + (buckets.length <= 1 ? chartWidth / 2 : (index / (buckets.length - 1)) * chartWidth),
    y: top + chartHeight - (bucket.revenue / max) * chartHeight,
  }));
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = points.length ? `M ${points[0].x} ${top + chartHeight} L ${points.map((point) => `${point.x} ${point.y}`).join(" L ")} L ${points.at(-1).x} ${top + chartHeight} Z` : "";
  const tickIndexes = new Set(points.length <= 6 ? points.map((_, index) => index) : [0, Math.ceil((points.length - 1) / 4), Math.ceil((points.length - 1) / 2), Math.ceil(((points.length - 1) * 3) / 4), points.length - 1]);

  return <svg className="sales-chart-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Confirmed sales over the selected date range. Total ${money(revenue)}.`}>
    {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
      const y = top + chartHeight - ratio * chartHeight;
      const value = max * ratio;
      const label = value >= 1000000 ? `${(value / 1000000).toFixed(1)}m` : value >= 1000 ? `${Math.round(value / 1000)}k` : Math.round(value).toString();
      return <g key={ratio}><line x1={left} x2={width - right} y1={y} y2={y} className="sales-chart-grid-line"/><text x={left - 10} y={y + 4} textAnchor="end" className="sales-chart-axis-label">{label}</text></g>;
    })}
    {area && <path d={area} className="sales-chart-area"/>}
    {points.length > 1 && <polyline points={line} className="sales-chart-line"/>}
    {points.map((point) => <circle key={point.key} cx={point.x} cy={point.y} r="4" className="sales-chart-point"><title>{bucketLabel(point.key, mode)}: {money(point.revenue)} · {point.orders} confirmed orders</title></circle>)}
    {points.map((point, index) => tickIndexes.has(index) && <text key={`x-${point.key}`} x={point.x} y={height - 14} textAnchor="middle" className="sales-chart-axis-label">{bucketLabel(point.key, mode)}</text>)}
  </svg>;
}

export default function SalesAnalytics({ orders }) {
  const [startDate, setStartDate] = useState(() => dateDaysAgo(29));
  const [endDate, setEndDate] = useState(todayKey);
  const range = useMemo(() => {
    if (!startDate || !endDate || startDate > endDate) return { valid: false, orders: [], products: [], units: 0, revenue: 0, mode: "day", buckets: [] };
    const included = orders.filter((order) => {
      if (!saleStatuses.has(order.status)) return false;
      const orderDate = (order.confirmed_at || order.created_at) ? localDateKey(new Date(order.confirmed_at || order.created_at)) : "";
      return orderDate && orderDate >= startDate && orderDate <= endDate;
    });
    const productsByName = new Map();
    let units = 0;
    let revenue = 0;
    const fromMs = Date.parse(`${startDate}T00:00:00Z`);
    const toMs = Date.parse(`${endDate}T00:00:00Z`);
    const rangeDays = Math.floor((toMs - fromMs) / 86400000) + 1;
    const mode = rangeDays > 180 ? "month" : rangeDays > 60 ? "week" : "day";
    const bucketMap = new Map();

    for (const order of included) {
      const orderRevenue = Number(order.total) || 0;
      revenue += orderRevenue;
      const orderDate = localDateKey(new Date(order.confirmed_at || order.created_at));
      const key = getBucket(orderDate, mode);
      const bucket = bucketMap.get(key) || { key, revenue: 0, orders: 0 };
      bucket.revenue += orderRevenue;
      bucket.orders += 1;
      bucketMap.set(key, bucket);

      const items = Array.isArray(order.order_items) ? order.order_items : [];
      if (!items.length) {
        const name = "Order items unavailable";
        const product = productsByName.get(name) || { name, units: 0, revenue: 0, priceTotal: 0, price: 0 };
        product.units += 1;
        product.revenue += orderRevenue;
        product.priceTotal += orderRevenue;
        product.price = product.priceTotal / product.units;
        productsByName.set(name, product);
        units += 1;
        continue;
      }
      for (const item of items) {
        const name = item.product_name || "Unnamed product";
        const quantity = Number(item.quantity) || 1;
        const unitPrice = Number(item.unit_price) || 0;
        const product = productsByName.get(name) || { name, units: 0, revenue: 0, priceTotal: 0, price: 0 };
        product.units += quantity;
        product.revenue += unitPrice * quantity;
        product.priceTotal += unitPrice * quantity;
        product.price = product.priceTotal / product.units;
        productsByName.set(name, product);
        units += quantity;
      }
    }

    const buckets = [];
    const cursor = new Date(`${startDate}T12:00:00`);
    const end = new Date(`${endDate}T12:00:00`);
    while (cursor <= end) {
      const key = getBucket(localDateKey(cursor), mode);
      if (!buckets.some((bucket) => bucket.key === key)) buckets.push(bucketMap.get(key) || { key, revenue: 0, orders: 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
    const products = [...productsByName.values()].sort((a, b) => b.revenue - a.revenue);
    return { valid: true, orders: included, products, units, revenue, mode, buckets };
  }, [orders, startDate, endDate]);

  const chooseRange = (days) => {
    setStartDate(dateDaysAgo(days - 1));
    setEndDate(todayKey());
  };

  return <section className="sales-analytics" aria-label="Confirmed sales analytics">
    <div className="sales-analytics-heading"><div><p className="eyebrow">CONFIRMED SALES</p><h2>Sales overview</h2><p>Revenue is counted when an order is confirmed, processing, or completed. New sales use the confirmation date; older orders use their order date.</p></div><div className="sales-range-controls"><label><span>From</span><input type="date" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)}/></label><label><span>To</span><input type="date" value={endDate} min={startDate || undefined} max={todayKey()} onChange={(event) => setEndDate(event.target.value)}/></label></div></div>
    <div className="sales-quick-ranges">{[[7, "7 days"], [30, "30 days"], [90, "90 days"]].map(([days, label]) => <button key={days} type="button" className={startDate === dateDaysAgo(days - 1) && endDate === todayKey() ? "active" : ""} onClick={() => chooseRange(days)}>{label}</button>)}</div>
    {!range.valid ? <p className="sales-range-empty">Choose a valid date range to view sales.</p> : <>
      <div className="order-kpi-grid sales-kpi-grid"><article className="order-kpi-card highlight-confirmed"><span className="order-kpi-title">Confirmed orders</span><strong className="order-kpi-val">{range.orders.length}</strong><span className="order-kpi-hint">In selected date range</span></article><article className="order-kpi-card"><span className="order-kpi-title">Products sold</span><strong className="order-kpi-val">{range.units}</strong><span className="order-kpi-hint">Total item quantity</span></article><article className="order-kpi-card highlight-revenue"><span className="order-kpi-title">Sales revenue</span><strong className="order-kpi-val">{money(range.revenue)}</strong><span className="order-kpi-hint">Confirmed orders only</span></article><article className="order-kpi-card"><span className="order-kpi-title">Different products</span><strong className="order-kpi-val">{range.products.filter((product) => product.name !== "Order items unavailable").length}</strong><span className="order-kpi-hint">With recorded order items</span></article></div>
      <div className="sales-analysis-grid"><section className="sales-chart-card"><div className="sales-panel-heading"><div><h3>Revenue over time</h3><p>{displayDate(startDate, { day: "numeric", month: "long", year: "numeric" })} – {displayDate(endDate, { day: "numeric", month: "long", year: "numeric" })}{range.mode !== "day" ? ` · grouped by ${range.mode}` : ""}</p></div><strong>{money(range.revenue)}</strong></div>{range.orders.length ? <SalesChart buckets={range.buckets} mode={range.mode} revenue={range.revenue}/> : <div className="sales-chart-empty">No confirmed sales in this date range yet.</div>}</section>
        <section className="sales-products-card"><div className="sales-panel-heading"><div><h3>Products sold</h3><p>Quantity and average recorded item price</p></div></div>{range.products.length ? <div className="sales-products-table-wrap"><table className="sales-products-table"><thead><tr><th>Product</th><th>Qty</th><th>Avg. unit price</th><th>Sales</th></tr></thead><tbody>{range.products.map((product) => <tr key={product.name}><td>{product.name}</td><td>{product.units}</td><td>{money(product.price)}</td><td>{money(product.revenue)}</td></tr>)}</tbody></table></div> : <div className="sales-products-empty">Products will appear here when an order is confirmed.</div>}</section></div>
    </>}
  </section>;
}
