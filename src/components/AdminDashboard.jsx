import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import PaymentSettingsAdmin from "./PaymentSettingsAdmin";
import WebsiteSettingsAdmin from "./WebsiteSettingsAdmin";
import SalesAnalytics from "./SalesAnalytics";
import { fallbackProducts } from "../data/catalog";

const cloudinaryUploadsEnabled = import.meta.env.VITE_CLOUDINARY_ENABLED === "true";
const emptyProduct = { name: "", category: "Accessories", price: "", image_url: "", gallery: [], colors: [], description: "", stock: "0", discount: "0", is_active: true };
const COLOR_OPTIONS = [
  { name: "Black", hex: "#171717" }, { name: "White", hex: "#F5F5F2" },
  { name: "Silver", hex: "#C1C6CC" }, { name: "Gray", hex: "#73777D" },
  { name: "Blue", hex: "#2563EB" }, { name: "Navy", hex: "#17345C" },
  { name: "Red", hex: "#D92D20" }, { name: "Green", hex: "#24845A" },
  { name: "Beige", hex: "#D9C6A0" }, { name: "Pink", hex: "#E88EAA" },
  { name: "Purple", hex: "#7C3AED" }, { name: "Gold", hex: "#C59B32" },
  { name: "Brown", hex: "#805A3B" }, { name: "Orange", hex: "#EA6A19" },
];
const statusLabel = { pending_payment: "Pending payment", approved: "Confirmed", processing: "Processing", completed: "Completed", cancelled: "Cancelled" };
const paymentLabel = { easypaisa: "EasyPaisa", jazzcash: "SadaPay", bank_transfer: "HBL transfer", cod: "Cash on delivery" };
const getPaymentProof = (order) => Array.isArray(order?.order_payment_proofs) ? order.order_payment_proofs[0] || null : order?.order_payment_proofs || null;

export default function AdminDashboard({ session, go }) {
  const [tab, setTab] = useState("orders");
  const [role, setRole] = useState("");
  const [data, setData] = useState({ orders: [], products: [], reviews: [], admins: [] });
  const [orderFilter, setOrderFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [form, setForm] = useState(emptyProduct);
  const [imageFiles, setImageFiles] = useState([]);
  const [coverFileIndex, setCoverFileIndex] = useState(null);
  const [colorImageFiles, setColorImageFiles] = useState({});
  const [newColorName, setNewColorName] = useState("");
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const productFormRef = useRef(null);
  const [message, setMessage] = useState("");
  const load = async () => {
    if (!supabase || !session) return;

    // 1. Fetch deleted blacklists from localStorage
    let deletedOrderIds = new Set();
    try {
      const rawDeletedOrders = localStorage.getItem("techora_admin_deleted_orders");
      if (rawDeletedOrders) deletedOrderIds = new Set(JSON.parse(rawDeletedOrders));
    } catch (e) {}

    let deletedRevIds = new Set();
    try {
      const rawDelReviews = localStorage.getItem("techora_admin_deleted_reviews");
      if (rawDelReviews) deletedRevIds = new Set(JSON.parse(rawDelReviews));
    } catch (e) {}

    const [profile, orders, products, reviewsRes, admins] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", session.user.id).single(),
      supabase.from("orders").select("*, order_items(*), order_payment_proofs(*)").order("created_at", { ascending: false }),
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("reviews").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id,full_name,email,role").eq("role", "admin").order("email"),
    ]);
    const rootAdmin = session.user.email?.toLowerCase() === "techorapakistan@gmail.com";
    setRole(profile.data?.role || (rootAdmin ? "admin" : "customer"));

    let orderList = orders.data || [];
    if (!orderList.length && orders.error) {
      const fallbackOrders = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (fallbackOrders.data?.length) orderList = fallbackOrders.data;
    }

    // Merge any customer orders saved locally
    try {
      const rawCust = localStorage.getItem("techora_customer_orders");
      if (rawCust) {
        const localCustOrders = JSON.parse(rawCust);
        if (Array.isArray(localCustOrders)) {
          const existingIds = new Set(orderList.map(o => o.id));
          const missingLocal = localCustOrders.filter(o => !existingIds.has(o.id));
          orderList = [...orderList, ...missingLocal];
        }
      }
    } catch (e) {}

    // Strictly filter out blacklisted deleted orders so they never re-appear
    orderList = orderList.filter(o => !deletedOrderIds.has(o.id));

    orderList = await Promise.all(orderList.map(async (order) => {
      const proof = getPaymentProof(order);
      if (!proof?.storage_path) return order;
      const { data: signed } = await supabase.storage.from("payment-proofs").createSignedUrl(proof.storage_path, 3600);
      return { ...order, paymentProofUrl: signed?.signedUrl || "" };
    }));

    const dbProducts = (products.data || []).map(p => ({ ...p, image_url: p.image_url || p.image }));
    const dbIds = new Set(dbProducts.map(p => p.id));
    const extraFallback = fallbackProducts.filter(p => !dbIds.has(p.id)).map(p => ({
      ...p,
      image_url: p.image_url || p.image,
      is_active: p.is_active !== undefined ? p.is_active : true,
    }));
    const allProducts = [...dbProducts, ...extraFallback];

    if (extraFallback.length > 0 && (profile.data?.role === "admin" || rootAdmin)) {
      for (const extra of extraFallback) {
        supabase.from("products").upsert({
          id: extra.id,
          name: extra.name,
          category: extra.category,
          price: Number(extra.price),
          discount: Number(extra.discount || 0),
          stock: Number(extra.stock || 20),
          image_url: extra.image_url,
          gallery: Array.isArray(extra.gallery) ? extra.gallery : [],
          colors: Array.isArray(extra.colors) ? extra.colors : [],
          description: extra.description || "",
          is_active: true
        }).then(({ error }) => {
          if (!error) console.log("Auto-synced product to Supabase:", extra.name);
        });
      }
    }

    // Process reviews: combine Supabase reviews with local reviews
    const reviewMap = new Map();
    if (reviewsRes.data && Array.isArray(reviewsRes.data)) {
      reviewsRes.data.forEach(r => {
        if (!deletedRevIds.has(r.id)) {
          reviewMap.set(r.id, {
            id: r.id,
            customer_name: r.customer_name || "Customer",
            email: r.email || "",
            rating: Number(r.rating) || 5,
            message: r.message || "",
            is_visible: r.is_visible !== false,
            created_at: r.created_at || new Date().toISOString(),
          });
        }
      });
    }

    // Also pick up from local storage (both general customer reviews and product specific reviews)
    try {
      const rawGeneral = localStorage.getItem("techora_customer_reviews");
      if (rawGeneral) {
        const genList = JSON.parse(rawGeneral);
        if (Array.isArray(genList)) {
          genList.forEach(r => {
            if (r.id && !deletedRevIds.has(r.id) && !reviewMap.has(r.id)) {
              reviewMap.set(r.id, {
                id: r.id,
                customer_name: r.customer_name || r.name || "Customer",
                email: r.email || "",
                rating: Number(r.rating) || 5,
                message: r.message || "",
                is_visible: true,
                created_at: r.created_at || new Date().toISOString(),
              });
            }
          });
        }
      }

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("techora_product_reviews_")) {
          const pRevs = JSON.parse(localStorage.getItem(key) || "[]");
          if (Array.isArray(pRevs)) {
            pRevs.forEach(r => {
              if (r.id && !deletedRevIds.has(r.id) && !reviewMap.has(r.id)) {
                reviewMap.set(r.id, {
                  id: r.id,
                  customer_name: r.name || r.customer_name || "Customer",
                  email: r.email || "",
                  rating: Number(r.rating) || 5,
                  message: r.product_name ? `[${r.product_name}] ${r.message}` : r.message || "",
                  is_visible: true,
                  created_at: r.created_at || new Date().toISOString(),
                });
              }
            });
          }
        }
      }
    } catch (e) {}

    const mergedReviews = Array.from(reviewMap.values()).sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
    );

    const firstError = profile.error || orders.error || products.error || admins.error;
    if (firstError) setMessage(firstError.message);
    setData({ orders: orderList, products: allProducts, reviews: mergedReviews, admins: admins.data || [] });
  };
  useEffect(() => { load(); }, [session]);
  const updateOrder = async (id, status) => {
    const order = data.orders.find((item) => item.id === id);
    const isConfirmingSale = ["approved", "processing", "completed"].includes(status);
    if (isConfirmingSale && order?.payment_proof_required && (!getPaymentProof(order)?.storage_path || !order?.paymentProofUrl)) {
      setMessage("Upload and review the payment screenshot before confirming this order.");
      return;
    }
    const updates = { status };
    if (status === "approved") updates.confirmed_at = new Date().toISOString();
    else if (status === "pending_payment") updates.confirmed_at = null;
    const { data: savedOrder, error } = await supabase.from("orders").update(updates).eq("id", id).select("id").maybeSingle();
    setMessage(error?.message || (savedOrder ? "Order status updated." : "This order is not saved in Supabase, so its status could not be updated."));
    if (savedOrder) load();
  };
  const applyStockToExistingOrder = async (id) => {
    const order = data.orders.find((item) => item.id === id);
    if (!order || !["approved", "processing", "completed"].includes(order.status)) return;
    if (order.payment_proof_required && (!getPaymentProof(order)?.storage_path || !order?.paymentProofUrl)) {
      setMessage("Upload and review the payment screenshot before adjusting this order's stock.");
      return;
    }
    setMessage("Adjusting product stock for this order…");
    const { data: savedOrder, error } = await supabase
      .from("orders")
      .update({ status: order.status })
      .eq("id", id)
      .is("stock_deducted_at", null)
      .select("id, stock_deducted_at")
      .maybeSingle();
    if (error) {
      setMessage(error.message);
      return;
    }
    if (!savedOrder) {
      setMessage("Stock was already adjusted, or this order is not saved in Supabase.");
      load();
      return;
    }
    setMessage("Stock deducted for this order.");
    load();
  };
  const deleteOrder = async (id) => {
    if (!window.confirm("Permanently delete this order from the system? This action cannot be undone.")) return;
    setMessage("Deleting order...");

    // 1. Blacklist in localStorage so it NEVER re-appears
    try {
      const raw = localStorage.getItem("techora_admin_deleted_orders");
      const set = new Set(raw ? JSON.parse(raw) : []);
      set.add(id);
      localStorage.setItem("techora_admin_deleted_orders", JSON.stringify([...set]));
    } catch (e) {
      console.warn("Storage write error:", e);
    }

    // 2. Remove from local customer orders if cached
    try {
      const rawCust = localStorage.getItem("techora_customer_orders");
      if (rawCust) {
        const custOrders = JSON.parse(rawCust).filter((o) => o.id !== id);
        localStorage.setItem("techora_customer_orders", JSON.stringify(custOrders));
      }
    } catch (e) {}

    // 3. Update state immediately
    setData(prev => ({
      ...prev,
      orders: prev.orders.filter(o => o.id !== id)
    }));

    // 4. Delete from Supabase
    if (supabase && isSupabaseConfigured) {
      try {
        await supabase.from("order_items").delete().eq("order_id", id);
        const { error } = await supabase.from("orders").delete().eq("id", id);
        if (error) {
          console.warn("Supabase order delete:", error);
          setMessage("Order removed locally. Note: Supabase RLS delete policy may need update in SQL Editor.");
        } else {
          setMessage("✓ Order permanently deleted.");
        }
      } catch (err) {
        setMessage("✓ Order permanently deleted.");
      }
    } else {
      setMessage("✓ Order permanently deleted.");
    }
  };
  const resetProductUploads = () => {
    setImageFiles([]);
    setCoverFileIndex(null);
    setColorImageFiles({});
    setNewColorName("");
  };
  const openNewProduct = () => {
    setForm({ ...emptyProduct, gallery: [], colors: [] });
    resetProductUploads();
    setMessage("");
    setFormOpen(true);
  };
  const editProduct = (product) => {
    setForm({
      ...product,
      image_url: product.image_url || product.image || "",
      gallery: Array.isArray(product.gallery) ? [...product.gallery] : [],
      colors: Array.isArray(product.colors) ? product.colors.map((color) => ({ ...color })) : [],
    });
    resetProductUploads();
    setMessage("");
    setFormOpen(true);
  };
  useEffect(() => {
    if (!formOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => {
      productFormRef.current?.scrollTo({ top: 0 });
      productFormRef.current?.querySelector("input:not([type='file'])")?.focus({ preventScroll: true });
    });
    return () => { document.body.style.overflow = previousOverflow; };
  }, [formOpen]);
  const uploadProductImage = async (file) => {
    if (cloudinaryUploadsEnabled) {
      const { data: signedUpload, error: signatureError } = await supabase.functions.invoke("cloudinary-signature");
      if (signatureError) throw new Error(signatureError.message || "Could not authorize the Cloudinary upload.");
      if (!signedUpload?.cloudName || !signedUpload?.apiKey || !signedUpload?.signature || !signedUpload?.timestamp || !signedUpload?.folder) {
        throw new Error("Cloudinary upload settings are incomplete. Ask an administrator to finish the setup.");
      }
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("api_key", signedUpload.apiKey);
      uploadData.append("timestamp", String(signedUpload.timestamp));
      uploadData.append("signature", signedUpload.signature);
      uploadData.append("folder", signedUpload.folder);
      const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(signedUpload.cloudName)}/image/upload`, {
        method: "POST",
        body: uploadData,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error?.message || "Cloudinary could not upload this image.");
      if (!result.secure_url) throw new Error("Cloudinary did not return a secure image URL.");
      return result.secure_url;
    }
    const safe = file.name.toLowerCase().replace(/[^a-z0-9._-]/g, "-");
    const path = Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "-" + safe;
    const { error: uploadError } = await supabase.storage.from("product-images").upload(path, file, {
      upsert: false,
      contentType: file.type || "image/jpeg",
      cacheControl: "3600",
    });
    if (uploadError) throw uploadError;
    return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
  };
  const addProductColor = () => {
    const option = COLOR_OPTIONS.find((color) => color.name === newColorName);
    if (!option) return;
    if ((form.colors || []).some((color) => color.name === option.name)) {
      setMessage(option.name + " is already added.");
      return;
    }
    setForm((current) => ({ ...current, colors: [...(current.colors || []), { ...option, image: "" }] }));
    setNewColorName("");
    setMessage("");
  };
  const saveProduct = async (event) => {
    event.preventDefault();
    if (isSavingProduct) return;
    setIsSavingProduct(true);
    setMessage("");
    try {
      const uploadedPhotos = [];
      for (const file of imageFiles) uploadedPhotos.push(await uploadProductImage(file));
      let imageUrl = form.image_url || form.image || "";
      if (coverFileIndex !== null && uploadedPhotos[coverFileIndex]) imageUrl = uploadedPhotos[coverFileIndex];
      else if (!imageUrl && uploadedPhotos.length) imageUrl = uploadedPhotos[0];
      if (!imageUrl) {
        setMessage("Add at least one product photo.");
        return;
      }
      const priorCover = form.image_url || form.image || "";
      const gallery = [...new Set([
        ...(Array.isArray(form.gallery) ? form.gallery : []),
        ...uploadedPhotos,
        ...(priorCover && priorCover !== imageUrl ? [priorCover] : []),
      ].filter((url) => url && url !== imageUrl))];
      const colors = [];
      for (const color of (form.colors || [])) {
        const image = colorImageFiles[color.name]
          ? await uploadProductImage(colorImageFiles[color.name])
          : color.image || "";
        colors.push({ name: color.name, hex: color.hex, image });
      }
      const payload = {
        ...form,
        image_url: imageUrl,
        gallery,
        colors,
        price: Number(form.price),
        stock: Number(form.stock),
        discount: Number(form.discount || 0)
      };
      delete payload.gallery_text;
      delete payload.colors_text;
      delete payload.image;
      const { error } = await supabase.from("products").upsert(payload);
      if (error) {
        setMessage(error.message);
        return;
      }
      setMessage(form.id ? "Product updated." : "Product added to the storefront.");
      setForm({ ...emptyProduct, gallery: [], colors: [] });
      resetProductUploads();
      setFormOpen(false);
      load();
    } catch (error) {
      setMessage(error?.message || "Could not upload the selected product photos.");
    } finally {
      setIsSavingProduct(false);
    }
  };
  const syncCatalog = async () => {
    setMessage("Syncing all catalog products to Supabase database...");
    let synced = 0;
    for (const p of fallbackProducts) {
      const { error } = await supabase.from("products").upsert({
        id: p.id,
        name: p.name,
        category: p.category,
        price: Number(p.price),
        discount: Number(p.discount || 0),
        stock: Number(p.stock || 20),
        image_url: p.image || p.image_url,
        gallery: Array.isArray(p.gallery) ? p.gallery : [],
        colors: Array.isArray(p.colors) ? p.colors : [],
        description: p.description || "",
        is_active: true
      });
      if (!error) synced++;
    }
    setMessage(`Successfully synced ${synced} products to Supabase!`);
    load();
  };
  const deleteReview = async (id) => {
    if (!window.confirm("Permanently delete this customer review?")) return;
    setMessage("Deleting review...");

    // 1. Blacklist in localStorage so it NEVER reappears
    try {
      const raw = localStorage.getItem("techora_admin_deleted_reviews");
      const set = new Set(raw ? JSON.parse(raw) : []);
      set.add(id);
      localStorage.setItem("techora_admin_deleted_reviews", JSON.stringify([...set]));
    } catch (e) {
      console.warn("Deleted reviews storage error:", e);
    }

    // 2. Remove from local storage caches
    try {
      const rawCust = localStorage.getItem("techora_customer_reviews");
      if (rawCust) {
        const filtered = JSON.parse(rawCust).filter((r) => r.id !== id);
        localStorage.setItem("techora_customer_reviews", JSON.stringify(filtered));
      }
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("techora_product_reviews_")) {
          const pRevs = JSON.parse(localStorage.getItem(key) || "[]");
          const updated = pRevs.filter((r) => r.id !== id);
          localStorage.setItem(key, JSON.stringify(updated));
        }
      }
    } catch (e) {}

    // 3. Immediately update state
    setData((prev) => ({
      ...prev,
      reviews: prev.reviews.filter((r) => r.id !== id),
    }));

    // 4. Delete from Supabase reviews table
    if (supabase && isSupabaseConfigured) {
      try {
        const { error } = await supabase.from("reviews").delete().eq("id", id);
        if (error) {
          console.warn("Supabase review delete:", error);
          setMessage("Review removed locally. Note: Supabase RLS delete policy may need update in SQL Editor.");
        } else {
          setMessage("✓ Review permanently removed.");
        }
      } catch (err) {
        setMessage("✓ Review permanently removed.");
      }
    } else {
      setMessage("✓ Review permanently removed.");
    }
  };
  const deleteProduct = async (id) => { if (!window.confirm("Delete this product permanently?")) return; const { error } = await supabase.from("products").delete().eq("id", id); setMessage(error?.message || "Product deleted."); if (!error) load(); };
  const addAdmin = async (event) => { event.preventDefault(); const email = new FormData(event.currentTarget).get("email"); const { error } = await supabase.rpc("set_admin_role", { target_email: email }); setMessage(error?.message || "Admin access granted."); if (!error) { event.currentTarget.reset(); load(); } };
  const removeAdmin = async (admin) => { if (admin.id === session.user.id) { setMessage("You cannot remove your own active admin access."); return; } if (!window.confirm("Remove admin access for " + admin.email + "?")) return; const { error } = await supabase.from("profiles").update({ role: "customer" }).eq("id", admin.id); setMessage(error?.message || "Admin access removed."); if (!error) load(); };
  const signOut = async () => { const { error } = await supabase.auth.signOut({ scope: "local" }); if (error) { setMessage(error.message); return; } window.location.replace("/admin-login"); };
  if (!session) return <main className="auth-page"><section className="auth-card"><h1>Admin <em>access.</em></h1><p>Sign in with your approved Google account.</p></section></main>;
  if (!isSupabaseConfigured) return <main className="auth-page"><section className="auth-card"><h1>Connect <em>Supabase.</em></h1><p>Add Supabase environment values to enable the admin dashboard.</p></section></main>;
  if (role && role !== "admin") return <main className="auth-page"><section className="auth-card"><h1>Access <em>restricted.</em></h1><p>This account is not an approved Techora admin.</p><p className="auth-helper">Currently signed in as: <strong>{session.user.email}</strong></p><button className="button button-ink" onClick={signOut}>Sign out and switch account</button><button className="text-link" onClick={() => go("/")}>Back to store</button></section></main>;
  const pending = data.orders.filter((order) => order.status === "pending_payment").length;
  return <main className="admin-shell"><aside className="admin-sidebar"><img src="/techora-favicon.png" alt="Techora" /><p>TECHORA ADMIN</p>{[["orders", "Orders", pending], ["products", "Products"], ["payments", "Payment details"], ["website settings", "Website settings"], ["reviews", "Reviews"], ["admins", "Manage admins"]].map(([id, label, count]) => <button className={tab === id ? "active" : ""} onClick={() => setTab(id)} key={id}>{label}{count ? <b>{count}</b> : null}</button>)}<button className="admin-store-link" onClick={() => go("/")}>View storefront</button></aside><section className="admin-main"><header><div><p className="eyebrow">CONTROL CENTRE</p><h1>{tab === "payments" ? "Payment details" : tab === "admins" ? "Manage admins" : tab[0].toUpperCase() + tab.slice(1)}</h1></div><div className="admin-user"><span>{session.user.email}</span><button onClick={signOut}>Sign out</button></div></header>{message && <p className="admin-message" role="status">{message}</p>}{tab === "orders" && (() => {
    const totalOrders = data.orders.length;
    const pendingOrders = data.orders.filter(o => o.status === "pending_payment").length;
    const completedOrders = data.orders.filter(o => o.status === "completed").length;

    const filteredOrders = data.orders.filter(order => {
      if (orderFilter !== "all" && order.status !== orderFilter) return false;
      if (orderSearch.trim()) {
        const q = orderSearch.toLowerCase();
        const matchesName = (order.customer_name || "").toLowerCase().includes(q);
        const matchesPhone = (order.phone || "").toLowerCase().includes(q);
        const matchesId = (order.id || "").toLowerCase().includes(q);
        const matchesAddress = (order.address || "").toLowerCase().includes(q);
        return matchesName || matchesPhone || matchesId || matchesAddress;
      }
      return true;
    });

    return (
      <div className="modern-orders-wrapper">
        <SalesAnalytics orders={data.orders}/>

        {/* Toolbar: Search & Status Filters */}
        <div className="orders-action-bar">
          <div className="orders-filter-chips">
            {[
              ["all", `All (${totalOrders})`],
              ["pending_payment", `Pending (${pendingOrders})`],
              ["approved", `Confirmed (${data.orders.filter(o => o.status === "approved").length})`],
              ["processing", `Processing (${data.orders.filter(o => o.status === "processing").length})`],
              ["completed", `Completed (${completedOrders})`],
              ["cancelled", `Cancelled (${data.orders.filter(o => o.status === "cancelled").length})`],
            ].map(([val, label]) => (
              <button
                key={val}
                type="button"
                className={`order-chip-btn ${orderFilter === val ? "active" : ""}`}
                onClick={() => setOrderFilter(val)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="orders-search-box">
            <input
              type="text"
              placeholder="Search by customer name, phone, address, or order ID..."
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
            />
            {orderSearch && (
              <button type="button" className="orders-search-clear" onClick={() => setOrderSearch("")}>
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Orders List / Cards */}
        <div className="modern-orders-list">
          {filteredOrders.map((order) => {
            const cleanPhone = (order.phone || "").replace(/[^0-9]/g, "");
            const waPhone = cleanPhone.startsWith("0") ? "92" + cleanPhone.slice(1) : cleanPhone;
            const waLink = cleanPhone ? `https://wa.me/${waPhone}` : null;
            const statusThemeClass = `status-${order.status || "pending_payment"}`;

            return (
              <article key={order.id} className="modern-order-row-card">
                <div className="order-row-topbar">
                  <div className="order-id-group">
                    <span className="order-code">ORDER #{order.id.slice(0, 8).toUpperCase()}</span>
                    <span className="order-time-stamp">
                      {order.created_at
                        ? new Date(order.created_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Recent"}
                    </span>
                  </div>

                  <div className="order-top-badges">
                    <span className={`order-status-pill ${statusThemeClass}`}>
                      ● {statusLabel[order.status] || order.status}
                    </span>
                    <span className="order-payment-method-pill">
                      💳 {paymentLabel[order.payment_method] || order.payment_method?.toUpperCase() || "ADVANCE"}
                    </span>
                    <strong className="order-price-bold">PKR {Number(order.total).toLocaleString()}</strong>
                  </div>
                </div>

                <div className="order-row-body">
                  <div className="order-customer-column">
                    <h4 className="order-section-title">Customer Information</h4>
                    <div className="order-customer-details">
                      <div className="cust-meta-row">
                        <span className="cust-meta-label">Name:</span>
                        <strong className="cust-name-text">{order.customer_name}</strong>
                      </div>
                      <div className="cust-meta-row">
                        <span className="cust-meta-label">Phone:</span>
                        <a href={`tel:${order.phone}`} className="cust-phone-link">{order.phone}</a>
                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noreferrer"
                            className="order-wa-action-btn"
                          >
                            💬 Chat on WhatsApp
                          </a>
                        )}
                      </div>
                      <div className="cust-address-card">
                        <span className="cust-address-title">📍 Complete Delivery Address</span>
                        <p className="cust-address-content">
                          {order.address || "No delivery address recorded"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="order-items-column">
                    <h4 className="order-section-title">Purchased Items</h4>
                    <div className="order-items-container">
                      {order.order_items && order.order_items.length > 0 ? (
                        order.order_items.map((item, idx) => (
                          <div key={item.id || idx} className="order-purchased-item">
                            {item.product_image_url && <img className="admin-order-item-image" src={item.product_image_url} alt=""/>}
                            <span className="item-title">{item.product_name}</span>
                            <span className="item-qty-badge">× {item.quantity}</span>
                            <span className="item-subtotal">
                              PKR {Number((item.unit_price || 0) * (item.quantity || 1)).toLocaleString()}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="order-purchased-item default-item">
                          <span className="item-title">Standard Product Order</span>
                          <span className="item-qty-badge">× 1</span>
                          <span className="item-subtotal">PKR {Number(order.total).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    {order.paymentProofUrl ? <div className="admin-payment-proof"><div><strong>Advance payment screenshot</strong><small>Open the screenshot, verify the transfer, then approve the order.</small></div><a href={order.paymentProofUrl} target="_blank" rel="noreferrer"><img src={order.paymentProofUrl} alt="Customer payment screenshot"/><span>View full image ↗</span></a>{order.status === "pending_payment" && <button type="button" className="approve-payment-button" onClick={() => updateOrder(order.id, "approved")}>Approve payment</button>}</div> : order.status === "pending_payment" && order.payment_proof_required ? <p className="admin-proof-pending">Waiting for the customer to upload a payment screenshot in My Orders.</p> : null}
                  </div>
                </div>

                <div className="order-row-controls">
                  <div className="order-status-changer">
                    <span className="changer-label">Update Status:</span>
                    <select
                      className="order-select-styled"
                      value={order.status}
                      onChange={(event) => updateOrder(order.id, event.target.value)}
                    >
                      {Object.entries(statusLabel).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="order-action-buttons">
                    {["approved", "processing", "completed"].includes(order.status) && order.stock_deducted_at === null && (
                      <button
                        type="button"
                        className="stock-deduction-button"
                        onClick={() => applyStockToExistingOrder(order.id)}
                        title="Apply the stock change once for this already confirmed order"
                      >
                        Apply stock deduction
                      </button>
                    )}
                    <button
                      type="button"
                      className="order-delete-btn"
                      onClick={() => deleteOrder(order.id)}
                      title="Permanently remove order"
                    >
                      🗑️ Delete order
                    </button>
                  </div>
                </div>
              </article>
            );
          })}

          {!filteredOrders.length && (
            <div className="orders-empty-state">
              <span className="empty-icon">📦</span>
              <h3>No matching orders found</h3>
              <p>
                {orderSearch
                  ? `No orders matching "${orderSearch}". Try searching with a different term.`
                  : "No orders placed under this filter status yet."}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  })()}
  {tab === "products" && <div className="admin-products">
    <div className="admin-section-toolbar">
      <div><h2>Storefront inventory</h2><p>{data.products.length} products — edits publish to Shop automatically.</p></div>
      <div className="admin-product-actions">
        <button type="button" className="button sync-catalog-btn" onClick={syncCatalog}>↻ Sync catalog to database</button>
        <button type="button" className="button button-ink" onClick={openNewProduct}>+ Add new product</button>
      </div>
    </div>
    <div className="admin-product-list">
      {data.products.map((product) => <article key={product.id}>
        <img src={product.image_url} alt="" />
        <div><strong>{product.name}</strong><span>PKR {Number(product.price).toLocaleString()} · Stock {product.stock}</span>{Number(product.discount) > 0 && <em>{product.discount}% discount</em>}{Number(product.stock) === 0 && <em className="unavailable-admin">Unavailable</em>}</div>
        <button type="button" aria-label={"Edit " + product.name} onClick={() => editProduct(product)}>Edit</button>
        <button type="button" className="danger" onClick={() => deleteProduct(product.id)}>Delete</button>
      </article>)}
    </div>
  </div>}
  {formOpen && createPortal(
    <div className="product-editor-backdrop" role="presentation">
      <form ref={productFormRef} className="admin-product-form product-editor-dialog" onSubmit={saveProduct} role="dialog" aria-modal="true" aria-labelledby="product-editor-title">
        <div className="product-editor-header">
          <div><span className="product-editor-kicker">{form.id ? "EDITING EXISTING PRODUCT" : "NEW PRODUCT"}</span><h2 id="product-editor-title">{form.id ? (form.name || "Edit product") : "Add new product"}</h2>{form.id && <p>Product details and photos for this item only.</p>}</div>
          <button type="button" className="product-editor-close" onClick={() => { setFormOpen(false); resetProductUploads(); }} aria-label="Close product editor">×</button>
        </div>
        <div className="product-editor-fields">
          <label className="admin-field"><span>Product name</span><input required placeholder="e.g. Premium Wireless Earbuds" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })}/></label>
          <label className="admin-field"><span>Category</span><input required placeholder="e.g. Audio" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}/></label>
          <label className="admin-field"><span>Regular price (PKR)</span><input required type="number" min="0" placeholder="e.g. 5000" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })}/></label>
          <label className="admin-field"><span>Stock quantity</span><input required type="number" min="0" placeholder="e.g. 20" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })}/></label>
          <label className="admin-field"><span>Discount percentage</span><input type="number" min="0" max="99" placeholder="e.g. 10" value={form.discount} onChange={(event) => setForm({ ...form, discount: event.target.value })}/></label>
          <label className="admin-field"><span>Cover photo URL (optional)</span><input type="url" placeholder="https://..." value={form.image_url || ""} onChange={(event) => setForm({ ...form, image_url: event.target.value })}/></label>
        </div>
        <section className="product-photo-section" aria-labelledby="product-photos-title">
          <div className="product-editor-section-heading"><div><h3 id="product-photos-title">Product photos</h3><p>Upload several photos at once. Keep the current cover, or choose a new one below.</p></div></div>
          {form.image_url && <div className="current-cover-preview"><img src={form.image_url} alt="Current cover"/><span>Current cover</span></div>}
          <label className="image-upload product-multi-upload"><span>Choose product photos</span><input accept="image/jpeg,image/png,image/webp" type="file" multiple onChange={(event) => { const files = Array.from(event.target.files || []); setImageFiles(files); setCoverFileIndex(form.image_url ? null : (files.length ? 0 : null)); event.target.value = ""; }}/><small>Select multiple JPG, PNG, or WebP images. For an existing product, new photos go into the gallery and the current cover stays selected unless you change it below.</small></label>
          {imageFiles.length > 0 && <div className="selected-photo-list">{form.image_url && <label className="selected-photo-row"><input type="radio" name="cover-photo" checked={coverFileIndex === null} onChange={() => setCoverFileIndex(null)}/><span><strong>Keep current cover</strong><small>Current product photo</small></span></label>}{imageFiles.map((file, index) => <label key={file.name + file.lastModified + index} className="selected-photo-row"><input type="radio" name="cover-photo" checked={coverFileIndex === index} onChange={() => setCoverFileIndex(index)}/><span><strong>{index === coverFileIndex ? "Cover photo" : "Gallery photo"}</strong><small>{file.name}</small></span></label>)}</div>}
          {(form.gallery || []).length > 0 && <div className="existing-gallery"><strong>Saved gallery photos</strong><div>{form.gallery.map((url, index) => <span key={url + index}><img src={url} alt={"Saved product photo " + (index + 1)}/><button type="button" onClick={() => setForm((current) => ({ ...current, gallery: current.gallery.filter((_, itemIndex) => itemIndex !== index) }))} aria-label={"Remove saved gallery photo " + (index + 1)}>×</button></span>)}</div></div>}
        </section>
        <section className="product-colors-section" aria-labelledby="product-colors-title">
          <div className="product-editor-section-heading"><div><h3 id="product-colors-title">Colour options</h3><p>Choose a built-in colour, then optionally upload its matching photo.</p></div></div>
          <div className="add-product-color"><label className="admin-field"><span>Choose colour</span><select value={newColorName} onChange={(event) => setNewColorName(event.target.value)}><option value="">Select a colour</option>{COLOR_OPTIONS.map((color) => <option key={color.name} value={color.name} disabled={(form.colors || []).some((saved) => saved.name === color.name)}>{color.name}</option>)}</select></label><button type="button" className="button button-ink" onClick={addProductColor} disabled={!newColorName}>Add colour</button></div>
          {(form.colors || []).length > 0 ? <div className="product-color-list">{form.colors.map((color) => <article key={color.name} className="product-color-row"><span className="product-color-swatch" style={{ backgroundColor: color.hex || "#ddd" }} aria-label={color.name}/><div className="product-color-name"><strong>{color.name}</strong><small>{color.hex}</small></div><label className="color-photo-upload"><span>{colorImageFiles[color.name] ? "Photo selected" : color.image ? "Replace colour photo (optional)" : "Add matching photo (optional)"}</span><input accept="image/jpeg,image/png,image/webp" type="file" onChange={(event) => { const file = event.target.files?.[0] || null; setColorImageFiles((current) => { const next = { ...current }; if (file) next[color.name] = file; else delete next[color.name]; return next; }); event.target.value = ""; }}/></label>{color.image && <img className="color-photo-preview" src={color.image} alt={color.name + " product variant"}/>}<button type="button" className="remove-product-color" onClick={() => { setForm((current) => ({ ...current, colors: current.colors.filter((item) => item.name !== color.name) })); setColorImageFiles((current) => { const next = { ...current }; delete next[color.name]; return next; }); }} aria-label={"Remove " + color.name + " colour"}>Remove</button></article>)}</div> : <p className="empty-product-colors">No colours added yet.</p>}
        </section>
        <label className="admin-field product-description-field"><span>Product description</span><textarea placeholder="Short product description" value={form.description || ""} onChange={(event) => setForm({ ...form, description: event.target.value })}/></label>
        <label className="product-active-toggle"><input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })}/> Show on storefront</label>
        {message && <p className="product-editor-message" role="status">{message}</p>}
        <div className="product-editor-footer"><button type="button" className="product-cancel-button" onClick={() => { setFormOpen(false); resetProductUploads(); }}>Cancel</button><button type="submit" className="button button-ink" disabled={isSavingProduct}>{isSavingProduct ? "Saving photos…" : form.id ? "Save product changes" : "Add product"}</button></div>
      </form>
    </div>,
    document.body
  )}
  {tab === "payments" && <PaymentSettingsAdmin notice={(notice) => { setMessage(notice); if (notice === "Payment settings saved.") load(); }}/>}  {tab === "website settings" && <WebsiteSettingsAdmin notice={setMessage}/>}  {tab === "reviews" && (
    <div className="admin-reviews-section">
      <div className="admin-section-toolbar">
        <div>
          <h2>Customer Reviews Moderation</h2>
          <p>{data.reviews.length} customer reviews — inspect feedback, verify ratings, or remove unwanted reviews.</p>
        </div>
      </div>

      {data.reviews.length === 0 ? (
        <div className="admin-reviews-empty">
          <span className="empty-icon">💬</span>
          <h3>No customer reviews found</h3>
          <p>Customer reviews submitted from product pages or the reviews section will appear here.</p>
        </div>
      ) : (
        <div className="admin-reviews-grid">
          {data.reviews.map((review) => {
            const productMatch = review.message?.match(/^\[(.*?)\]\s*(.*)$/);
            const productName = productMatch ? productMatch[1] : null;
            const cleanMessage = productMatch ? productMatch[2] : review.message;

            return (
              <article key={review.id} className="admin-review-card">
                <div className="admin-review-card-head">
                  <div className="admin-reviewer-info">
                    <div className="reviewer-avatar">
                      {(review.customer_name || "C")[0].toUpperCase()}
                    </div>
                    <div>
                      <strong className="reviewer-name">{review.customer_name || "Customer"}</strong>
                      <span className="reviewer-date">
                        {review.created_at
                          ? new Date(review.created_at).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "Recent"}
                      </span>
                    </div>
                  </div>

                  <div className="admin-review-badges">
                    <span className="admin-rating-badge">
                      <span className="star-gold">{"★".repeat(review.rating || 5)}{"☆".repeat(5 - (review.rating || 5))}</span>
                      <strong className="rating-score">{review.rating || 5}/5</strong>
                    </span>
                    <span className={`admin-status-badge ${review.is_visible ? "status-visible" : "status-hidden"}`}>
                      {review.is_visible ? "● Published" : "● Hidden"}
                    </span>
                  </div>
                </div>

                {productName && (
                  <div className="admin-review-product-tag">
                    <span className="tag-label">Product:</span>
                    <span className="tag-name">{productName}</span>
                  </div>
                )}

                <div className="admin-review-content">
                  <p>"{cleanMessage}"</p>
                </div>

                <div className="admin-review-card-foot">
                  <span className="admin-review-id">ID: {String(review.id).slice(0, 10)}</span>
                  <button
                    type="button"
                    className="admin-review-delete-btn"
                    onClick={() => deleteReview(review.id)}
                    title="Delete this review permanently"
                  >
                    🗑️ Delete review
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  )}{tab === "admins" && <div className="manage-admins"><form onSubmit={addAdmin}><h2>Grant admin access</h2><p>The person must create an account first. Then enter their exact account email here.</p><input name="email" required type="email" placeholder="newadmin@gmail.com"/><button className="button button-ink">Make admin</button></form><div className="admin-list"><h2>Current admins</h2>{data.admins.map((admin) => <article key={admin.id}><div><strong>{admin.full_name || "Techora admin"}</strong><span>{admin.email}</span></div><button className="danger" disabled={admin.id === session.user.id} onClick={() => removeAdmin(admin)}>{admin.id === session.user.id ? "Current account" : "Remove"}</button></article>)}</div></div>}</section></main>;
}
