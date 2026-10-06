import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

const labels = { pending_payment: "Pending payment", approved: "Payment confirmed", processing: "Preparing order", completed: "Completed", cancelled: "Cancelled" };
const money = (value) => "PKR " + Number(value || 0).toLocaleString();
const proofFor = (order) => Array.isArray(order.order_payment_proofs) ? order.order_payment_proofs[0] || null : order.order_payment_proofs || null;

export default function CustomerOrders({ session, go }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState("");
  const [notice, setNotice] = useState("");
  const [proofUrls, setProofUrls] = useState({});

  const load = async () => {
    if (!supabase || !session) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase.from("orders").select("*, order_items(*), order_payment_proofs(*)").order("created_at", { ascending: false });
    if (error) { setNotice(error.message); setOrders([]); setLoading(false); return; }
    const list = data || [];
    setOrders(list);
    const signed = await Promise.all(list.map(async (order) => {
      const proof = proofFor(order);
      if (!proof?.storage_path) return [order.id, ""];
      const { data: result } = await supabase.storage.from("payment-proofs").createSignedUrl(proof.storage_path, 3600);
      return [order.id, result?.signedUrl || ""];
    }));
    setProofUrls(Object.fromEntries(signed));
    setLoading(false);
  };
  useEffect(() => { load(); }, [session]);

  const uploadProof = async (order, file) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setNotice("Choose a JPG, PNG, or WebP payment screenshot."); return; }
    if (file.size > 10 * 1024 * 1024) { setNotice("Payment screenshots must be 10 MB or smaller."); return; }
    setUploading(order.id);
    setNotice("");
    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = session.user.id + "/" + order.id + "/" + Date.now() + "." + extension;
    const { error: uploadError } = await supabase.storage.from("payment-proofs").upload(path, file, { upsert: false, contentType: file.type, cacheControl: "3600" });
    if (uploadError) { setNotice(uploadError.message); setUploading(""); return; }
    const previous = proofFor(order);
    const { error } = await supabase.from("order_payment_proofs").upsert({ order_id: order.id, user_id: session.user.id, storage_path: path, updated_at: new Date().toISOString() }, { onConflict: "order_id" });
    if (error) {
      await supabase.storage.from("payment-proofs").remove([path]);
      setNotice(error.message);
      setUploading("");
      return;
    }
    if (previous?.storage_path) await supabase.storage.from("payment-proofs").remove([previous.storage_path]);
    setNotice("Payment screenshot uploaded. Techora will review it and update your order.");
    setUploading("");
    await load();
  };

  if (!session) return <main className="page-shell simple-page"><p className="eyebrow">MY ACCOUNT</p><h1>Sign in for your <em>orders.</em></h1><p>Sign in to track orders and upload payment screenshots.</p><button className="button button-ink" onClick={() => go("/login")}>Sign in to my account</button></main>;
  if (!isSupabaseConfigured) return <main className="page-shell simple-page"><h1>Your <em>orders.</em></h1><p>Connect Supabase to load your order history.</p></main>;

  return <main className="page-shell simple-page">
    <div className="orders-heading"><div><p className="eyebrow">MY ACCOUNT</p><h1>Your <em>orders.</em></h1></div><button className="text-link" onClick={load}>Refresh status</button></div>
    {notice && <p className="orders-notice" role="status">{notice}</p>}
    {loading ? <p>Loading your orders...</p> : orders.length ? <div className="order-list">{orders.map((order) => {
      const proof = proofFor(order);
      const pending = order.status === "pending_payment";
      return <article className="customer-order-card" key={order.id}>
        <div className="customer-order-heading"><span className={"order-status " + order.status}>{proof && pending ? "Payment under review" : labels[order.status] || order.status}</span><strong>{"Order #" + order.id.slice(0, 8).toUpperCase()}</strong><small>{new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</small><b>{money(order.total)}</b></div>
        <div className="customer-order-breakdown"><span>Products <strong>{money(order.items_subtotal ?? order.total)}</strong></span>{Number(order.promo_discount)>0&&<span>Promo <strong>−{money(order.promo_discount)}</strong></span>}<span>Delivery <strong>{money(order.delivery_fee)}</strong></span><span>Pay now <strong>{money(order.amount_due_now ?? order.total)}</strong></span>{Number(order.remaining_balance)>0&&<span>Due on arrival <strong>{money(order.remaining_balance)}</strong></span>}</div><div className="customer-order-items">{(order.order_items || []).map((item, index) => <div className="customer-order-item" key={item.id || index}>{item.product_image_url ? <img src={item.product_image_url} alt={item.product_name || "Ordered product"}/> : <div className="order-photo-placeholder" aria-hidden="true">▧</div>}<span><strong>{item.product_name}</strong><small>Quantity: {item.quantity} · {money(item.unit_price)} each</small></span><b>{money(Number(item.unit_price) * (Number(item.quantity) || 1))}</b></div>)}</div>
        <div className="customer-order-payment"><div><strong>Payment verification · {order.payment_method_label || order.payment_method}</strong><p>{proof ? "Your screenshot has been received. We will update the status after checking the payment." : order.payment_proof_required ? "Pay the amount due now, then upload your screenshot here." : "No advance payment is due. The remaining balance is collected on arrival."}</p></div>
          {proofUrls[order.id] && <a className="payment-proof-preview-link" href={proofUrls[order.id]} target="_blank" rel="noreferrer"><img className="payment-proof-preview" src={proofUrls[order.id]} alt="Uploaded payment screenshot"/><span>View submitted screenshot</span></a>}
          {pending && order.payment_proof_required && <label className="payment-proof-upload"><span>{uploading === order.id ? "Uploading screenshot..." : proof ? "Replace payment screenshot" : "Upload payment screenshot"}</span><input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading === order.id} onChange={(event) => { uploadProof(order, event.target.files?.[0]); event.target.value = ""; }}/></label>}
          {order.status === "approved" && <span className="payment-verified-note">Payment verified. Your order is being prepared.</span>}
        </div>
      </article>;
    })}</div> : <div className="orders-empty"><h3>No orders yet</h3><p>Your order status and payment verification will appear here after checkout.</p><button className="button button-ink" onClick={() => go("/shop")}>Start shopping</button></div>}
  </main>;
}
