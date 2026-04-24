import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, serverTimestamp, increment,
} from "firebase/firestore";
import { db, storage } from "../firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../context/AuthContext";

/* ─── Constants ─────────────────────────────────────────── */
const CATEGORIES = ["GoPro", "Insta360", "Mounts & Clamps", "Accessories", "Bundle", "Other"];

const BRANDS_BY_CATEGORY = {
  GoPro: ["Hero 12", "Hero 11", "Hero 10", "Hero 9", "Hero 8", "Max", "Other"],
  Insta360: ["X4", "X3", "X2", "ONE RS", "ONE X2", "GO 3", "Other"],
  "Mounts & Clamps": ["RAM Mounts", "GoPro Official", "Peak Design", "Ulanzi", "Generic", "Other"],
  Accessories: ["Batteries", "Chargers", "Cases", "Filters", "Memory Cards", "Other"],
  Bundle: ["GoPro Bundle", "Insta360 Bundle", "Mixed Bundle", "Other"],
  Other: ["Other"],
};

const SELLERS = [
  { label: "Sithis", url: "https://m.me/Sithis02" },
  { label: "Saira", url: "https://m.me/sairachandesu2003" },
  { label: "Drei", url: "https://m.me/Dreiu00" },
];

const EMPTY_FORM = {
  name: "", price: "", description: "",
  images: [], facebookUrl: SELLERS[0].url,
  category: "Accessories", brand: "",
  youtubeUrl: "",
};

/* ─── Helpers ────────────────────────────────────────────── */
const getYouTubeId = (url) => {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
};

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFiles, setImageFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [adminSearch, setAdminSearch] = useState("");
  const [activeTab, setActiveTab] = useState("products"); // "overview" | "products"

  const showPopup = (msg) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  useEffect(() => { if (!user) navigate("/"); }, [user, navigate]);

  const fetchProducts = async () => {
    setFetchLoading(true);
    try {
      const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  /* ── Stats ──────────────────────────────────────────────── */
  const totalProducts = products.length;
  const totalViews = products.reduce((s, p) => s + (p.views || 0), 0);
  const topProduct = [...products].sort((a, b) => (b.views || 0) - (a.views || 0))[0];
  const categoryCounts = CATEGORIES.reduce((acc, c) => {
    acc[c] = products.filter((p) => p.category === c).length;
    return acc;
  }, {});

  /* ── Form handlers ──────────────────────────────────────── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((cur) => {
      const next = { ...cur, [name]: value };
      // reset brand when category changes
      if (name === "category") next.brand = "";
      return next;
    });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) { setImageFiles([]); setPreviewUrls([]); return; }
    setImageFiles(files);
    setPreviewUrls(files.map((f) => URL.createObjectURL(f)));
    setForm((cur) => ({ ...cur, images: [] }));
  };

  const removePreviewImage = (idx) => {
    if (imageFiles.length > 0) {
      setImageFiles((cur) => cur.filter((_, i) => i !== idx));
      setPreviewUrls((cur) => cur.filter((_, i) => i !== idx));
    } else {
      setForm((cur) => ({ ...cur, images: cur.images.filter((_, i) => i !== idx) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) return alert("Name and price are required.");
    setLoading(true);
    try {
      let finalImageUrls = form.images?.length ? form.images : [];
      if (imageFiles.length > 0) {
        finalImageUrls = await Promise.all(
          imageFiles.map(async (file) => {
            const r = ref(storage, `product-images/${Date.now()}-${file.name}`);
            const snap = await uploadBytes(r, file);
            return getDownloadURL(snap.ref);
          })
        );
      }

      const productData = {
        ...form,
        images: finalImageUrls,
        imageUrl: finalImageUrls[0] || "",
        price: Number(form.price),
        youtubeUrl: form.youtubeUrl || "",
        brand: form.brand || "",
      };

      if (editingId) {
        await updateDoc(doc(db, "products", editingId), { ...productData, updatedAt: serverTimestamp() });
        showPopup("✅ Product updated!");
      } else {
        await addDoc(collection(db, "products"), {
          ...productData,
          views: 0,
          createdAt: serverTimestamp(),
        });
        showPopup("✅ Product added!");
      }
      cancelForm();
      await fetchProducts();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (p) => {
    setForm({
      name: p.name || "",
      price: p.price || "",
      description: p.description || "",
      images: p.images || (p.imageUrl ? [p.imageUrl] : []),
      facebookUrl: p.facebookUrl || SELLERS[0].url,
      category: p.category || "Accessories",
      brand: p.brand || "",
      youtubeUrl: p.youtubeUrl || "",
    });
    setImageFiles([]);
    setPreviewUrls(p.images?.length ? p.images : p.imageUrl ? [p.imageUrl] : []);
    setEditingId(p.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await deleteDoc(doc(db, "products", id));
      await fetchProducts();
    } catch (err) { alert("Error: " + err.message); }
  };

  const cancelForm = () => {
    setForm(EMPTY_FORM);
    setImageFiles([]);
    setPreviewUrls([]);
    setEditingId(null);
    setShowForm(false);
  };

  const getSellerLabel = (url) => SELLERS.find((s) => s.url === url)?.label || url;

  if (!user) return null;

  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(adminSearch.toLowerCase())
  );

  /* ─── RENDER ─────────────────────────────────────────────── */
  return (
    <div style={s.page}>
      {statusMessage && <div style={s.popup}>{statusMessage}</div>}

      {/* ── Header ── */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Admin Dashboard</h1>
          <p style={s.sub}>Logged in as {user.email}</p>
        </div>
        <div style={s.headerRight}>
          {!showForm && activeTab === "products" && (
            <button onClick={() => setShowForm(true)} style={s.addBtn}>+ Add Product</button>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={s.tabs}>
        {["overview", "products"].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            style={{ ...s.tab, ...(activeTab === t ? s.tabActive : {}) }}
          >
            {t === "overview" ? "📊 Overview" : "📦 Products"}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════
          TAB: OVERVIEW
      ════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div>
          {/* Stat cards */}
          <div style={s.statsGrid}>
            <StatCard icon="📦" label="Total Products" value={totalProducts} />
            <StatCard icon="👁️" label="Total Views" value={totalViews} />
            <StatCard icon="🔥" label="Top Product" value={topProduct?.name || "—"} small />
            <StatCard
              icon="🏷️"
              label="Categories"
              value={Object.entries(categoryCounts)
                .filter(([, v]) => v > 0)
                .map(([k, v]) => `${k}: ${v}`)
                .join(" · ") || "—"}
              small
            />
          </div>

          {/* Views leaderboard */}
          <div style={s.card}>
            <h2 style={s.cardTitle}>👁️ Product View Leaderboard</h2>
            {fetchLoading ? <p style={{ color: "var(--text-muted)" }}>Loading...</p> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[...products]
                  .sort((a, b) => (b.views || 0) - (a.views || 0))
                  .slice(0, 10)
                  .map((p, i) => (
                    <div key={p.id} style={s.lbRow}>
                      <span style={s.lbRank}>#{i + 1}</span>
                      <img
                        src={p.images?.[0] || p.imageUrl || "https://via.placeholder.com/40"}
                        style={s.lbThumb}
                        alt=""
                        onError={(e) => e.target.src = "https://via.placeholder.com/40"}
                      />
                      <span style={{ flex: 1, fontSize: 14 }}>{p.name}</span>
                      <span style={s.lbViews}>👁 {p.views || 0} views</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          TAB: PRODUCTS
      ════════════════════════════════════════════ */}
      {activeTab === "products" && (
        <div>
          {/* ── Product Form ── */}
          {showForm && (
            <div style={s.formCard}>
              <h2 style={s.formTitle}>{editingId ? "✏️ Edit Product" : "➕ New Product"}</h2>
              <form onSubmit={handleSubmit} style={s.form}>

                {/* Name */}
                <Field label="Product Name *">
                  <input name="name" value={form.name} onChange={handleChange}
                    placeholder="e.g. GoPro Hero 12 Chest Mount" style={s.input} required />
                </Field>

                {/* Price + Category */}
                <div style={s.row2}>
                  <Field label="Price (₱) *">
                    <input name="price" type="number" value={form.price} onChange={handleChange}
                      placeholder="e.g. 1500" style={s.input} required />
                  </Field>
                  <Field label="Category">
                    <select name="category" value={form.category} onChange={handleChange} style={s.input}>
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </Field>
                </div>

                {/* Brand (dynamic by category) */}
                <Field label={`Brand / Unit (${form.category})`}>
                  <select name="brand" value={form.brand} onChange={handleChange} style={s.input}>
                    <option value="">— Select brand —</option>
                    {(BRANDS_BY_CATEGORY[form.category] || []).map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                </Field>

                {/* Description */}
                <Field label="Description">
                  <textarea name="description" value={form.description} onChange={handleChange}
                    placeholder="Short product description..." style={{ ...s.input, height: 80, resize: "vertical" }} />
                </Field>

                {/* YouTube URL */}
                <Field label="YouTube Video URL (optional)">
                  <input name="youtubeUrl" value={form.youtubeUrl} onChange={handleChange}
                    placeholder="https://www.youtube.com/watch?v=..." style={s.input} />
                  {getYouTubeId(form.youtubeUrl) && (
                    <div style={s.ytPreviewWrap}>
                      <iframe
                        src={`https://www.youtube.com/embed/${getYouTubeId(form.youtubeUrl)}`}
                        title="YouTube preview"
                        style={s.ytFrame}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}
                </Field>

                {/* Images */}
                <Field label="Upload Images">
                  <input type="file" accept="image/*" multiple onChange={handleFileChange} style={s.fileInput} />
                </Field>

                {(previewUrls.length > 0 || form.images?.length > 0) && (
                  <div style={s.imageGrid}>
                    {(previewUrls.length > 0 ? previewUrls : form.images || []).map((url, idx) => (
                      <div key={idx} style={s.previewWrap}>
                        <button type="button" onClick={() => removePreviewImage(idx)} style={s.removeBtn}>×</button>
                        <img src={url} alt="" style={s.previewThumb} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Seller */}
                <Field label="Assign Seller">
                  <select name="facebookUrl" value={form.facebookUrl} onChange={handleChange} style={s.input}>
                    {SELLERS.map((sel) => (
                      <option key={sel.label} value={sel.url}>{sel.label}</option>
                    ))}
                  </select>
                </Field>

                <div style={s.btnRow}>
                  <button type="submit" style={s.saveBtn} disabled={loading}>
                    {loading ? "Saving…" : editingId ? "Update Product" : "Publish Product"}
                  </button>
                  <button type="button" onClick={cancelForm} style={s.cancelBtn}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* ── Product List ── */}
          <div style={s.card}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Search products…"
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                style={{ ...s.input, flex: 1, minWidth: 180, marginBottom: 0 }}
              />
              <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
                {filteredProducts.length} of {totalProducts} products
              </span>
            </div>

            {fetchLoading ? (
              <p style={{ color: "var(--text-muted)" }}>Loading…</p>
            ) : filteredProducts.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>No products found.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filteredProducts.map((p) => (
                  <div key={p.id} style={s.productRow}>
                    <img
                      src={p.images?.[0] || p.imageUrl || "https://via.placeholder.com/60"}
                      alt={p.name}
                      style={s.thumb}
                      onError={(e) => e.target.src = "https://via.placeholder.com/60"}
                    />
                    <div style={s.productInfo}>
                      <span style={s.productName}>{p.name}</span>
                      <span style={s.productMeta}>
                        {p.category}{p.brand ? ` · ${p.brand}` : ""} · ₱{Number(p.price).toLocaleString()}
                      </span>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
                        {p.facebookUrl && (
                          <span style={s.sellerTag}>👤 {getSellerLabel(p.facebookUrl)}</span>
                        )}
                        {p.youtubeUrl && (
                          <span style={s.ytTag}>▶️ YouTube</span>
                        )}
                      </div>
                    </div>

                    {/* 👁 View count beside Edit */}
                    <div style={s.viewBadge}>
                      <span style={s.viewIcon}>👁</span>
                      <span style={s.viewCount}>{p.views || 0}</span>
                    </div>

                    <div style={s.actions}>
                      <button onClick={() => handleEdit(p)} style={s.editBtn}>Edit</button>
                      <button onClick={() => handleDelete(p.id, p.name)} style={s.deleteBtn}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Small helpers ─────────────────────────────────────── */
function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  );
}

function StatCard({ icon, label, value, small }) {
  return (
    <div style={sc.card}>
      <span style={sc.icon}>{icon}</span>
      <div>
        <p style={sc.label}>{label}</p>
        <p style={{ ...sc.value, fontSize: small ? 13 : 22 }}>{value}</p>
      </div>
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────── */
const s = {
  page: {
    minHeight: "100vh",
    background: "var(--bg)",
    color: "var(--text)",
    fontFamily: "sans-serif",
    padding: "24px",
    maxWidth: 960,
    margin: "0 auto",
  },
  popup: {
    position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
    background: "var(--accent)", color: "var(--accent-text)",
    padding: "12px 24px", borderRadius: 10, fontWeight: "bold", zIndex: 9999,
  },
  header: {
    display: "flex", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 20,
  },
  headerRight: { display: "flex", gap: 10 },
  title: { margin: 0, color: "var(--accent)", fontSize: 24 },
  sub: { margin: "4px 0 0", color: "var(--text-muted)", fontSize: 13 },
  addBtn: {
    background: "var(--accent)", color: "var(--accent-text)",
    border: "none", borderRadius: 8, padding: "10px 20px",
    fontWeight: 700, fontSize: 14, cursor: "pointer",
  },
  tabs: { display: "flex", gap: 8, marginBottom: 20 },
  tab: {
    padding: "8px 18px", borderRadius: 8, border: "1px solid var(--border-light)",
    background: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 14, fontWeight: 500,
  },
  tabActive: {
    background: "var(--accent)", color: "var(--accent-text)",
    border: "1px solid var(--accent)", fontWeight: 700,
  },
  statsGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 14, marginBottom: 20,
  },
  card: {
    background: "var(--bg-card)", border: "1px solid var(--border)",
    borderRadius: 14, padding: 20, marginBottom: 20,
  },
  cardTitle: { color: "var(--text)", fontSize: 16, marginBottom: 16 },
  lbRow: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "8px 0", borderBottom: "1px solid var(--border)",
  },
  lbRank: { color: "var(--accent)", fontWeight: 700, width: 28, fontSize: 14 },
  lbThumb: { width: 36, height: 36, borderRadius: 6, objectFit: "cover", flexShrink: 0 },
  lbViews: { color: "var(--accent)", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap" },
  formCard: {
    background: "var(--bg-card)", border: "1px solid var(--border)",
    borderRadius: 14, padding: 24, marginBottom: 24,
  },
  formTitle: { margin: "0 0 20px", color: "var(--text)", fontSize: 18 },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  input: {
    padding: "10px 12px", background: "var(--bg-input)", border: "1px solid var(--border-light)",
    borderRadius: 8, color: "var(--text)", fontSize: 14, outline: "none",
    width: "100%", boxSizing: "border-box", fontFamily: "sans-serif",
  },
  fileInput: {
    width: "100%", padding: "10px 12px", background: "var(--bg-input)",
    border: "1px solid var(--border-light)", borderRadius: 8,
    color: "var(--text)", fontSize: 14, boxSizing: "border-box",
  },
  ytPreviewWrap: { marginTop: 10, borderRadius: 10, overflow: "hidden" },
  ytFrame: { width: "100%", height: 220, border: "none", display: "block" },
  imageGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))",
    gap: 10, marginTop: 10,
  },
  previewWrap: { position: "relative", borderRadius: 8, overflow: "hidden" },
  previewThumb: { width: "100%", height: 100, objectFit: "cover", display: "block" },
  removeBtn: {
    position: "absolute", top: 6, right: 6, zIndex: 2,
    width: 24, height: 24, borderRadius: "50%", border: "none",
    background: "rgba(0,0,0,0.7)", color: "#fff", fontSize: 16,
    lineHeight: 1, cursor: "pointer",
  },
  btnRow: { display: "flex", gap: 12, paddingTop: 4 },
  saveBtn: {
    background: "var(--accent)", color: "var(--accent-text)", border: "none",
    borderRadius: 8, padding: "11px 24px", fontWeight: 700, fontSize: 14,
    cursor: "pointer", flex: 1,
  },
  cancelBtn: {
    background: "none", border: "1px solid var(--border-light)", color: "var(--text-muted)",
    borderRadius: 8, padding: "11px 24px", cursor: "pointer", fontSize: 14,
  },
  productRow: {
    background: "var(--bg-card)", border: "1px solid var(--border)",
    borderRadius: 10, padding: "12px 16px", display: "flex",
    alignItems: "center", gap: 14,
  },
  thumb: { width: 60, height: 60, borderRadius: 8, objectFit: "cover", flexShrink: 0 },
  productInfo: { flex: 1, display: "flex", flexDirection: "column", gap: 3 },
  productName: { fontWeight: 600, fontSize: 15, color: "var(--text)" },
  productMeta: { fontSize: 13, color: "var(--text-muted)" },
  sellerTag: { fontSize: 12, color: "var(--accent)" },
  ytTag: { fontSize: 12, color: "#f00", background: "rgba(255,0,0,0.08)", padding: "1px 6px", borderRadius: 4 },
  viewBadge: {
    display: "flex", flexDirection: "column", alignItems: "center",
    background: "var(--bg-input)", border: "1px solid var(--border-light)",
    borderRadius: 8, padding: "6px 12px", minWidth: 58,
  },
  viewIcon: { fontSize: 14 },
  viewCount: { fontSize: 14, fontWeight: 700, color: "var(--accent)" },
  actions: { display: "flex", gap: 8 },
  editBtn: {
    background: "none", border: "1px solid var(--border-light)", color: "var(--text-muted)",
    borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 13,
  },
  deleteBtn: {
    background: "none", border: "1px solid var(--danger-border)", color: "var(--danger)",
    borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 13,
  },
};

const sc = {
  card: {
    background: "var(--bg-card)", border: "1px solid var(--border)",
    borderRadius: 12, padding: 18, display: "flex", gap: 14, alignItems: "center",
  },
  icon: { fontSize: 28 },
  label: { fontSize: 12, color: "var(--text-muted)", marginBottom: 4 },
  value: { fontWeight: 700, color: "var(--accent)", lineHeight: 1.2 },
};