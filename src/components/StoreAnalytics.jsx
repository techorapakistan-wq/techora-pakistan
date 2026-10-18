import { useMemo } from "react";

const saleStatuses = new Set(["approved", "processing", "completed"]);
const money = (value) => `PKR ${Number(value || 0).toLocaleString()}`;
const readableTime = (value) => value ? new Date(value).toLocaleString("en-PK", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "—";

export default function StoreAnalytics({ events = [], orders = [], ready = true, onRefresh }) {
  const stats = useMemo(() => {
    const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const sessions = new Map();
    const pageCounts = new Map();
    const products = new Map();
    let pageViews = 0;
    let productViews = 0;

    for (const event of events) {
      const visitorId = event.session_id || "unknown";
      const visitor = sessions.get(visitorId) || {
        id: visitorId,
        lastSeen: event.created_at,
        lastPath: event.path || "/",
        pages: 0,
        productsViewed: new Set(),
      };
      if (new Date(event.created_at) > new Date(visitor.lastSeen)) {
        visitor.lastSeen = event.created_at;
        visitor.lastPath = event.path || "/";
      }
      if (event.event_type === "product_view") {
        productViews += 1;
        const key = String(event.product_id || event.product_name || "unknown");
        const product = products.get(key) || { key, name: event.product_name || "Product", views: 0 };
        product.views += 1;
        products.set(key, product);
        visitor.productsViewed.add(event.product_name || "Product");
      } else {
        pageViews += 1;
        visitor.pages += 1;
        const page = pageCounts.get(event.path) || { path: event.path || "/", views: 0 };
        page.views += 1;
        pageCounts.set(page.path, page);
      }
      sessions.set(visitorId, visitor);
    }

    const buyers = orders
      .filter((order) => saleStatuses.has(order.status) && new Date(order.confirmed_at || order.created_at).getTime() >= since)
      .sort((a, b) => new Date(b.confirmed_at || b.created_at) - new Date(a.confirmed_at || a.created_at));
    return {
      visitors: sessions.size,
      pageViews,
      productViews,
      buyers,
      topProducts: [...products.values()].sort((a, b) => b.views - a.views).slice(0, 8),
      topPages: [...pageCounts.values()].sort((a, b) => b.views - a.views).slice(0, 8),
      recentVisitors: [...sessions.values()].sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen)).slice(0, 10),
    };
  }, [events, orders]);

  if (!ready) return <section className="store-analytics-setup"><h2>Set up visitor tracking</h2><p>Run the one-time visitor analytics SQL in Supabase, then refresh this page. After that, this panel will start recording page and product views.</p></section>;

  const conversion = stats.visitors ? Math.min(100, stats.buyers.length / stats.visitors * 100) : 0;
  return <section className="store-analytics" aria-label="Store visitor and buyer analytics">
    <div className="store-analytics-heading"><div><p className="eyebrow">STORE ACTIVITY · LAST 30 DAYS</p><h2>Visitors &amp; orders</h2><p>Counts begin after visitor tracking is enabled. Anonymous visitors are shown by a browser ID, not a name.</p></div><div className="store-analytics-actions"><span className="store-analytics-range">Rolling 30 days</span>{onRefresh && <button type="button" onClick={onRefresh}>↻ Refresh</button>}</div></div>
    <div className="store-analytics-kpis">
      <article><span>Unique browser visitors</span><strong>{stats.visitors.toLocaleString()}</strong><small>One browser/device ID per visitor</small></article>
      <article><span>Page views</span><strong>{stats.pageViews.toLocaleString()}</strong><small>Home, shop, reviews and story</small></article>
      <article><span>Product views</span><strong>{stats.productViews.toLocaleString()}</strong><small>Product detail pages opened</small></article>
      <article className="store-analytics-conversion"><span>Confirmed orders</span><strong>{stats.buyers.length.toLocaleString()}</strong><small>Approx. {conversion.toFixed(1)}% order-to-visitor rate</small></article>
    </div>

    <div className="store-analytics-grid">
      <section className="store-analytics-panel"><header><div><h3>Most viewed products</h3><p>Product pages opened</p></div></header>{stats.topProducts.length ? <ol className="store-analytics-rank-list">{stats.topProducts.map((product, index) => <li key={product.key}><span className="store-analytics-rank">{String(index + 1).padStart(2, "0")}</span><strong>{product.name}</strong><b>{product.views} views</b></li>)}</ol> : <p className="store-analytics-empty">Product views will show here as customers browse.</p>}</section>
      <section className="store-analytics-panel"><header><div><h3>Popular pages</h3><p>Storefront sections opened</p></div></header>{stats.topPages.length ? <ol className="store-analytics-rank-list">{stats.topPages.map((page, index) => <li key={page.path}><span className="store-analytics-rank">{String(index + 1).padStart(2, "0")}</span><strong>{page.path === "/" ? "Home page" : page.path}</strong><b>{page.views} views</b></li>)}</ol> : <p className="store-analytics-empty">Page views will show here as customers browse.</p>}</section>
    </div>

    <section className="store-analytics-panel store-analytics-wide"><header><div><h3>Recent anonymous visitors</h3><p>Visitors are not personally identified unless they place an order or sign in.</p></div></header>{stats.recentVisitors.length ? <div className="store-analytics-table-wrap"><table className="store-analytics-table"><thead><tr><th>Visitor</th><th>Last page</th><th>Products viewed</th><th>Last activity</th></tr></thead><tbody>{stats.recentVisitors.map((visitor) => <tr key={visitor.id}><td>Visitor #{String(visitor.id).slice(0, 8).toUpperCase()}</td><td>{visitor.lastPath === "/" ? "Home page" : visitor.lastPath}</td><td>{visitor.productsViewed.size}</td><td>{readableTime(visitor.lastSeen)}</td></tr>)}</tbody></table></div> : <p className="store-analytics-empty">No visitor sessions recorded yet.</p>}</section>

    <section className="store-analytics-panel store-analytics-wide"><header><div><h3>Recent confirmed buyers</h3><p>Customer name, products purchased and order total</p></div></header>{stats.buyers.length ? <div className="store-analytics-table-wrap"><table className="store-analytics-table"><thead><tr><th>Customer</th><th>Products ordered</th><th>Status</th><th>Total</th><th>Date</th></tr></thead><tbody>{stats.buyers.slice(0, 12).map((order) => <tr key={order.id}><td>{order.customer_name || "Customer"}</td><td>{Array.isArray(order.order_items) && order.order_items.length ? order.order_items.map((item) => `${item.product_name || "Product"} × ${Number(item.quantity) || 1}`).join(", ") : "Order items unavailable"}</td><td><span className="store-analytics-order-status">{order.status}</span></td><td>{money(order.total)}</td><td>{readableTime(order.confirmed_at || order.created_at)}</td></tr>)}</tbody></table></div> : <p className="store-analytics-empty">Confirmed orders will appear here.</p>}</section>
  </section>;
}
