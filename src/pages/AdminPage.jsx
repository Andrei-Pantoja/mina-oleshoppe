import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, serverTimestamp
} from "firebase/firestore";
import { db, storage } from "../firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = ["GoPro", "Insta360", "Mounts & Clamps", "Accessories", "Other"];

const SELLERS = [
  { label: "Sithis", url: "https://m.me/Sithis02" },
  { label: "Saira", url: "https://m.me/sairachandesu2003" },
  { label: "Drei", url: "https://m.me/Dreiu00" },
];

const EMPTY_FORM = {
  name: "", price: "", description: "",
  images: [], facebookUrl: SELLERS[0].url, category: "Accessories",
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

  const showPopup = (msg) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) {
      setImageFiles([]);
      setPreviewUrls([]);
      return;
    }
    setImageFiles(files);
    setPreviewUrls(files.map((file) => URL.createObjectURL(file)));
    setForm((current) => ({ ...current, images: [] }));
  };

  const removePreviewImage = (index) => {
    if (imageFiles.length > 0) {
      setImageFiles((current) => current.filter((_, idx) => idx !== index));
      setPreviewUrls((current) => current.filter((_, idx) => idx !== index));
      return;
    }
    setForm((current) => ({
      ...current,
      images: current.images?.filter((_, idx) => idx !== index) || [],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) return alert("Name and price are required.");
    setLoading(true);
    try {
      let finalImageUrls = form.images?.length ? form.images : [];

      if (imageFiles.length > 0) {
        const uploadPromises = imageFiles.map(async (file) => {
          const imageRef = ref(storage, `product-images/${Date.now()}-${file.name}`);
          const snapshot = await uploadBytes(imageRef, file);
          return getDownloadURL(snapshot.ref);
        });
        finalImageUrls = await Promise.all(uploadPromises);
      }

      const productData = {
        ...form,
        images: finalImageUrls,
        imageUrl: finalImageUrls[0] || "",
        price: Number(form.price),
      };

      if (editingId) {
        await updateDoc(doc(db, "products", editingId), {
          ...productData,
          updatedAt: serverTimestamp(),
        });
        showPopup("✅ Product updated!");
      } else {
        await addDoc(collection(db, "products"), {
          ...productData,
          createdAt: serverTimestamp(),
        });
        showPopup("✅ Product added successfully!");
      }
      setForm(EMPTY_FORM);
      setImageFiles([]);
      setPreviewUrls([]);
      setEditingId(null);
      setShowForm(false);
      await fetchProducts();
    } catch (err) {
      alert("Error saving product: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setForm({
      name: product.name || "",
      price: product.price || "",
      description: product.description || "",
      images: product.images || (product.imageUrl ? [product.imageUrl] : []),
      facebookUrl: product.facebookUrl || SELLERS[0].url,
      category: product.category || "Accessories",
    });
    setImageFiles([]);
    setPreviewUrls(product.images?.length ? product.images : product.imageUrl ? [product.imageUrl] : []);
    setEditingId(product.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, "products", id));
      await fetchProducts();
    } catch (err) {
      alert("Error deleting: " + err.message);
    }
  };

  const cancelForm = () => {
    setForm(EMPTY_FORM);
    setImageFiles([]);
    setPreviewUrls([]);
    setEditingId(null);
    setShowForm(false);
  };

  // Get seller label from URL
  const getSellerLabel = (url) => {
    const found = SELLERS.find((s) => s.url === url);
    return found ? found.label : url;
  };

  if (!user) return null;

  return (
    <div style={styles.page}>
      {statusMessage && (
        <div style={styles.statusPopup}>
          {statusMessage}
        </div>
      )}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Admin Dashboard</h1>
          <p style={styles.sub}>Manage your products</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} style={styles.addBtn}>
            + Add Product
          </button>
        )}
      </div>

      {/* Product Form */}
      {showForm && (
        <div style={styles.formCard}>
          <h2 style={styles.formTitle}>
            {editingId ? "Edit Product" : "New Product"}
          </h2>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.row}>
              <label style={styles.label}>Product Name *</label>
              <input name="name" value={form.name} onChange={handleChange}
                placeholder="e.g. GoPro Hero 12 Chest Mount" style={styles.input} required />
            </div>

            <div style={styles.row2}>
              <div style={styles.row}>
                <label style={styles.label}>Price (₱) *</label>
                <input name="price" type="number" value={form.price} onChange={handleChange}
                  placeholder="e.g. 1500" style={styles.input} required />
              </div>
              <div style={styles.row}>
                <label style={styles.label}>Category</label>
                <select name="category" value={form.category} onChange={handleChange} style={styles.input}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div style={styles.row}>
              <label style={styles.label}>Description</label>
              <textarea name="description" value={form.description} onChange={handleChange}
                placeholder="Short product description..." style={{ ...styles.input, height: 80, resize: "vertical" }} />
            </div>

            <div style={styles.row}>
              <label style={styles.label}>Upload Images</label>
              <input type="file" accept="image/*" multiple onChange={handleFileChange} style={styles.fileInput} />
            </div>

            {(previewUrls.length > 0 || form.images?.length > 0) && (
              <div style={styles.imagePreviewGrid}>
                {previewUrls.length > 0
                  ? previewUrls.map((url, idx) => (
                      <div key={idx} style={styles.previewWrapper}>
                        <button type="button" onClick={() => removePreviewImage(idx)} style={styles.removePreviewBtn}>×</button>
                        <img src={url} alt={`preview-${idx}`} style={styles.previewThumb} />
                      </div>
                    ))
                  : form.images?.length > 0
                  ? form.images.map((url, idx) => (
                      <div key={idx} style={styles.previewWrapper}>
                        <button type="button" onClick={() => removePreviewImage(idx)} style={styles.removePreviewBtn}>×</button>
                        <img src={url} alt={`saved-${idx}`} style={styles.previewThumb} />
                      </div>
                    ))
                  : null}
              </div>
            )}

            {/* Seller Selector */}
            <div style={styles.row}>
              <label style={styles.label}>Assign Seller</label>
              <select
                name="facebookUrl"
                value={form.facebookUrl}
                onChange={handleChange}
                style={styles.input}
              >
                {SELLERS.map((s) => (
                  <option key={s.label} value={s.url}>{s.label}</option>
                ))}
              </select>
            </div>

            <div style={styles.btnRow}>
              <button type="submit" style={styles.saveBtn} disabled={loading}>
                {loading ? "Saving..." : editingId ? "Update Product" : "Publish Product"}
              </button>
              <button type="button" onClick={cancelForm} style={styles.cancelBtn}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products Table */}
      <div style={styles.tableWrap}>
        <input
          type="text"
          placeholder="Search products..."
          value={adminSearch}
          onChange={(e) => setAdminSearch(e.target.value)}
          style={styles.search}
        />
        <h2 style={styles.sectionTitle}>All Products ({products.length})</h2>

        {fetchLoading ? (
          <p style={{ color: "#666" }}>Loading...</p>
        ) : products.length === 0 ? (
          <p style={{ color: "#555" }}>No products yet. Click "Add Product" to start.</p>
        ) : (
          <div style={styles.productList}>
            {products
              .filter((p) =>
                p.name?.toLowerCase().includes(adminSearch.toLowerCase())
              )
              .map((p) => (
                <div key={p.id} style={styles.productRow}>
                  <img
                    src={(p.images?.[0] || p.imageUrl) || "https://via.placeholder.com/60x60?text=?"}
                    alt={p.name}
                    style={styles.thumb}
                    onError={(e) => e.target.src = "https://via.placeholder.com/60x60?text=?"}
                  />
                  <div style={styles.productInfo}>
                    <span style={styles.productName}>{p.name}</span>
                    <span style={styles.productMeta}>
                      {p.category} · ₱{Number(p.price).toLocaleString()}
                    </span>
                    {p.facebookUrl && (
                      <span style={styles.sellerTag}>
                        👤 Seller: {getSellerLabel(p.facebookUrl)}
                      </span>
                    )}
                  </div>
                  <div style={styles.actions}>
                    <button onClick={() => handleEdit(p)} style={styles.editBtn}>Edit</button>
                    <button onClick={() => handleDelete(p.id, p.name)} style={styles.deleteBtn}>Delete</button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#111",
    color: "#f0f0f0",
    fontFamily: "sans-serif",
    padding: "24px",
    maxWidth: 900,
    margin: "0 auto",
  },
  search: {
    width: "100%",
    padding: "10px 12px",
    marginBottom: 16,
    borderRadius: 8,
    border: "1px solid #333",
    background: "#111",
    color: "#fff",
  },
  statusPopup: {
    position: "fixed",
    top: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#d4ed00",
    color: "#111",
    padding: "12px 24px",
    borderRadius: "10px",
    fontWeight: "bold",
    zIndex: 9999,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  title: { margin: 0, color: "#d4ed00", fontSize: 24 },
  sub: { margin: "4px 0 0", color: "#666", fontSize: 13 },
  addBtn: {
    background: "#d4ed00",
    color: "#111",
    border: "none",
    borderRadius: 8,
    padding: "10px 20px",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  },
  formCard: {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 14,
    padding: 24,
    marginBottom: 32,
  },
  formTitle: { margin: "0 0 20px", color: "#fff", fontSize: 18 },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  row: { display: "flex", flexDirection: "column", gap: 6 },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  label: { fontSize: 13, color: "#aaa", fontWeight: 500 },
  input: {
    padding: "10px 12px",
    background: "#111",
    border: "1px solid #333",
    borderRadius: 8,
    color: "#fff",
    fontSize: 14,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    fontFamily: "sans-serif",
  },
  fileInput: {
    width: "100%",
    padding: "10px 12px",
    background: "#111",
    border: "1px solid #333",
    borderRadius: 8,
    color: "#fff",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "sans-serif",
  },
  imagePreviewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))",
    gap: 10,
    marginTop: 10,
  },
  previewWrapper: {
    position: "relative",
    borderRadius: 8,
    overflow: "hidden",
    background: "#111",
  },
  previewThumb: {
    width: "100%",
    height: 100,
    objectFit: "cover",
    display: "block",
  },
  removePreviewBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    zIndex: 2,
    width: 24,
    height: 24,
    borderRadius: "50%",
    border: "none",
    background: "rgba(0,0,0,0.7)",
    color: "#fff",
    fontSize: 16,
    lineHeight: 1,
    cursor: "pointer",
  },
  btnRow: { display: "flex", gap: 12, paddingTop: 4 },
  saveBtn: {
    background: "#d4ed00",
    color: "#111",
    border: "none",
    borderRadius: 8,
    padding: "11px 24px",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    flex: 1,
  },
  cancelBtn: {
    background: "none",
    border: "1px solid #444",
    color: "#888",
    borderRadius: 8,
    padding: "11px 24px",
    cursor: "pointer",
    fontSize: 14,
  },
  tableWrap: { marginTop: 8 },
  sectionTitle: { color: "#fff", fontSize: 16, marginBottom: 16 },
  productList: { display: "flex", flexDirection: "column", gap: 10 },
  productRow: {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 10,
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  thumb: {
    width: 60, height: 60,
    borderRadius: 8,
    objectFit: "cover",
    background: "#111",
    flexShrink: 0,
  },
  productInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },
  productName: { fontWeight: 600, fontSize: 15 },
  productMeta: { fontSize: 13, color: "#888" },
  sellerTag: { fontSize: 12, color: "#d4ed00" },
  actions: { display: "flex", gap: 8 },
  editBtn: {
    background: "none",
    border: "1px solid #444",
    color: "#ccc",
    borderRadius: 6,
    padding: "6px 14px",
    cursor: "pointer",
    fontSize: 13,
  },
  deleteBtn: {
    background: "none",
    border: "1px solid #6b2222",
    color: "#ff6b6b",
    borderRadius: 6,
    padding: "6px 14px",
    cursor: "pointer",
    fontSize: 13,
  },
};
