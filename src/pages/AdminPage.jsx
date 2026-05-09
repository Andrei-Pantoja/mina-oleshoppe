import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, serverTimestamp, increment, onSnapshot,
} from "firebase/firestore";
import { db, storage } from "../firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../context/AuthContext";
import {
  DEFAULT_BRANDS_BY_CATEGORY,
  DEFAULT_CATEGORIES,
  getShopOptions,
  saveShopOptions,
  sortBrandUnitsDesc,
} from "../utils/shopOptions";

/* ─── Constants ─────────────────────────────────────────── */
const CATEGORIES = DEFAULT_CATEGORIES;

const BRANDS_BY_CATEGORY = DEFAULT_BRANDS_BY_CATEGORY;

// Admin configuration - map UIDs to admin details
const ADMIN_CONFIG = {
  "TX99yIEmAqWsfPBnkQHGBLJbgXi2": {
    name: "mina",
    label: "Mina",
    sellerUrl: "https://m.me/minaonline08",
    email: "moninapantoja73@gmail.com"
  },
  "aOulrfPmz8XJ6YuLNeZsUur0Q7w1": {
    name: "saira", 
    label: "Saira",
    sellerUrl: "https://m.me/sairachandesu2003",
    email: "zyraaaaaa27@gmail.com"
  }
};

const SELLERS = [
  { label: "Mina", url: "https://www.facebook.com/MinaOnlineShoppee" },
  { label: "Saira", url: "https://www.facebook.com/sairachandesu2003" },
];

const EMPTY_FORM = {
  name: "", price: "", description: "",
  images: [], facebookUrl: "",
  category: "Accessories", brands: [],
  youtubeUrl: "",
  rating: 0,
  author: "", // Add author field for multi-seller support
};

/* ─── Helpers ────────────────────────────────────────────── */
const getYouTubeId = (url) => {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
};

export default function AdminPage() {
  const { user, authLoading } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFiles, setImageFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const cropAreaRef = useRef(null);
  const dragRef = useRef(null);
  const [cropState, setCropState] = useState({
    open: false,
    fileIndex: null,
    src: "",
    x: 10,
    y: 10,
    width: 80,
    height: 80,
    naturalWidth: 0,
    naturalHeight: 0,
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [adminSearch, setAdminSearch] = useState("");
  const [activeTab, setActiveTab] = useState("products"); // "overview" | "products" | "settings"

  const [shopOptions, setShopOptions] = useState({ categories: CATEGORIES, brandsByCategory: BRANDS_BY_CATEGORY });
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsSaving, setOptionsSaving] = useState(false);
  const [optionsDirty, setOptionsDirty] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newBrandByCategory, setNewBrandByCategory] = useState({});

  const showPopup = (msg) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Get current admin info based on logged-in user
  const getCurrentAdmin = () => {
    if (!user?.uid) return null;
    return ADMIN_CONFIG[user.uid] || null;
  };

  const handleCopyStoreLink = async (authorName) => {
    if (!authorName || !authorName.trim()) {
      showPopup("⚠️ Please set an author name first!");
      return;
    }
    
    const link = `${window.location.origin}?author=${authorName.toLowerCase().trim()}`;
    try {
      await navigator.clipboard.writeText(link);
      showPopup(`✅ Store link copied: ${link}`);
    } catch (err) {
      showPopup("❌ Failed to copy link");
    }
  };

  // With realtime Firestore subscription, these are no-ops kept to avoid larger refactors.
  const fetchProducts = async () => true;

  useEffect(() => {
    if (!authLoading && !user) navigate("/");
  }, [authLoading, user, navigate]);

  // Auto-assign author and seller when admin logs in or form is reset
  useEffect(() => {
    const currentAdmin = getCurrentAdmin();
    if (currentAdmin && !editingId) {
            setForm(prev => ({
        ...prev,
        author: currentAdmin.name,
        facebookUrl: currentAdmin.sellerUrl
      }));
    }
  }, [user, editingId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setOptionsLoading(true);
      try {
        const opts = await getShopOptions();
        if (!mounted) return;
        setShopOptions(opts);
        setOptionsDirty(false);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setOptionsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const saveOptions = async () => {
    setOptionsSaving(true);
    try {
      const saved = await saveShopOptions(shopOptions);
      setShopOptions(saved);
      setOptionsDirty(false);
      showPopup("✅ Options saved!");
      return true;
    } catch (e) {
      alert("Error saving options: " + e.message);
      return false;
    } finally {
      setOptionsSaving(false);
    }
  };

  const confirmLeaveIfDirty = async () => {
    if (!optionsDirty) return true;
    const shouldSave = window.confirm("You have unsaved changes in Admin Settings.\n\nPress OK to save before leaving, or Cancel to stay on this page.");
    if (!shouldSave) return false;
    return await saveOptions();
  };

  // Warn on refresh/close when settings not saved.
  useEffect(() => {
    const handler = (e) => {
      if (!optionsDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [optionsDirty]);

  // Expose a tiny global so Navbar can prompt on Logout / leaving admin.
  useEffect(() => {
    window.__minaAdminUnsaved = {
      dirty: optionsDirty,
      save: saveOptions,
      message: "You have unsaved changes in Admin Settings. Save before leaving?",
    };
    return () => {
      if (window.__minaAdminUnsaved) delete window.__minaAdminUnsaved;
    };
  }, [optionsDirty, shopOptions]);

  useEffect(() => {
    setFetchLoading(true);
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((p) => !p?.isConfig));
        setFetchLoading(false);
      },
      (err) => {
        console.error(err);
        setFetchLoading(false);
      }
    );
    return unsub;
  }, []);

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
      // reset brands when category changes
      if (name === "category") next.brands = [];
      return next;
    });
  };

  const handleBrandToggle = (brand) => {
    setForm((cur) => {
      const currentBrands = cur.brands || [];
      if (currentBrands.includes(brand)) {
        return { ...cur, brands: currentBrands.filter(b => b !== brand) };
      } else {
        return { ...cur, brands: [...currentBrands, brand] };
      }
    });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) { setImageFiles([]); setPreviewUrls([]); return; }
    setImageFiles(files);
    setPreviewUrls(files.map((f) => URL.createObjectURL(f)));
    setForm((cur) => ({ ...cur, images: [] }));
    setCropState((prev) => ({ ...prev, open: false }));
  };

  const openCropModal = (idx) => {
    if (idx == null || !previewUrls[idx]) return;
    setCropState({
      open: true,
      fileIndex: idx,
      src: previewUrls[idx],
      x: 10,
      y: 10,
      width: 80,
      height: 80,
      naturalWidth: 0,
      naturalHeight: 0,
    });
  };

  const closeCropModal = () => {
    dragRef.current = null;
    setCropState((prev) => ({ ...prev, open: false, fileIndex: null, src: "" }));
  };

  const updateCropValue = (field, value) => {
    setCropState((prev) => {
      const next = { ...prev, [field]: Number(value) };
      if (field === "x") next.x = Math.min(Math.max(0, next.x), 100 - next.width);
      if (field === "y") next.y = Math.min(Math.max(0, next.y), 100 - next.height);
      if (field === "width") next.width = Math.min(Math.max(10, next.width), 100 - next.x);
      if (field === "height") next.height = Math.min(Math.max(10, next.height), 100 - next.y);
      return next;
    });
  };

  const startCropDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragRef.current = {
      type: "move",
      startX: clientX,
      startY: clientY,
      origX: cropState.x,
      origY: cropState.y,
      origWidth: cropState.width,
      origHeight: cropState.height,
    };
  };

  const startCropResize = (corner) => (e) => {
    e.preventDefault();
    e.stopPropagation();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragRef.current = {
      type: "resize",
      corner,
      startX: clientX,
      startY: clientY,
      origX: cropState.x,
      origY: cropState.y,
      origWidth: cropState.width,
      origHeight: cropState.height,
    };
  };

  const stopCropDrag = () => {
    dragRef.current = null;
  };

  const handleCropDrag = (e) => {
    if (!dragRef.current) return;
    const area = cropAreaRef.current;
    if (!area) return;
    const rect = area.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const deltaX = ((clientX - dragRef.current.startX) / rect.width) * 100;
    const deltaY = ((clientY - dragRef.current.startY) / rect.height) * 100;

    if (dragRef.current.type === "move") {
      const newX = Math.min(Math.max(0, dragRef.current.origX + deltaX), 100 - cropState.width);
      const newY = Math.min(Math.max(0, dragRef.current.origY + deltaY), 100 - cropState.height);
      setCropState((prev) => ({ ...prev, x: newX, y: newY }));
      return;
    }

    const { corner, origX, origY, origWidth, origHeight } = dragRef.current;
    let nextX = cropState.x;
    let nextY = cropState.y;
    let nextW = cropState.width;
    let nextH = cropState.height;

    if (corner.includes("w")) {
      nextX = Math.min(Math.max(0, origX + deltaX), origX + origWidth - 10);
      nextW = Math.max(10, Math.min(100 - nextX, origWidth - deltaX));
    }
    if (corner.includes("e")) {
      nextW = Math.max(10, Math.min(100 - origX, origWidth + deltaX));
    }
    if (corner.includes("n")) {
      nextY = Math.min(Math.max(0, origY + deltaY), origY + origHeight - 10);
      nextH = Math.max(10, Math.min(100 - nextY, origHeight - deltaY));
    }
    if (corner.includes("s")) {
      nextH = Math.max(10, Math.min(100 - origY, origHeight + deltaY));
    }

    if (nextX + nextW > 100) {
      nextW = 100 - nextX;
    }
    if (nextY + nextH > 100) {
      nextH = 100 - nextY;
    }

    setCropState((prev) => ({ ...prev, x: nextX, y: nextY, width: nextW, height: nextH }));
  };

  useEffect(() => {
    if (!cropState.open) return;
    window.addEventListener("mousemove", handleCropDrag);
    window.addEventListener("mouseup", stopCropDrag);
    window.addEventListener("touchmove", handleCropDrag, { passive: false });
    window.addEventListener("touchend", stopCropDrag);
    return () => {
      window.removeEventListener("mousemove", handleCropDrag);
      window.removeEventListener("mouseup", stopCropDrag);
      window.removeEventListener("touchmove", handleCropDrag);
      window.removeEventListener("touchend", stopCropDrag);
    };
  }, [cropState.open, handleCropDrag]);

  const confirmCrop = async () => {
    const idx = cropState.fileIndex;
    if (idx == null || !imageFiles[idx] || !cropState.src) return;

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = cropState.src;
    await new Promise((resolve) => {
      image.onload = resolve;
      image.onerror = resolve;
    });

    const naturalWidth = image.naturalWidth || cropState.naturalWidth || 1;
    const naturalHeight = image.naturalHeight || cropState.naturalHeight || 1;
    const sx = (cropState.x / 100) * naturalWidth;
    const sy = (cropState.y / 100) * naturalHeight;
    const sw = (cropState.width / 100) * naturalWidth;
    const sh = (cropState.height / 100) * naturalHeight;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(sw);
    canvas.height = Math.round(sh);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, imageFiles[idx].type || "image/png"));
    if (!blob) {
      alert("Unable to crop image.");
      return;
    }

    const newFile = new File([blob], imageFiles[idx].name, { type: blob.type });
    const newPreview = URL.createObjectURL(newFile);

    setImageFiles((cur) => cur.map((file, i) => (i === idx ? newFile : file)));
    setPreviewUrls((cur) => cur.map((url, i) => (i === idx ? newPreview : url)));
    closeCropModal();
  };

  const handleCropImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    setCropState((prev) => ({ ...prev, naturalWidth, naturalHeight }));
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

      const currentAdmin = getCurrentAdmin();
      const productData = {
        ...form,
        images: finalImageUrls,
        imageUrl: finalImageUrls[0] || "",
        price: Number(form.price),
        youtubeUrl: form.youtubeUrl || "",
        brands: form.brands || [],
        brand: (form.brands || []).join(", "), // Keep backward compatibility
        rating: Math.max(0, Math.min(5, Number(form.rating || 0))),
        author: form.author || currentAdmin?.name, // Ensure author field is included
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
      brands: p.brands || (p.brand ? p.brand.split(", ").filter(b => b.trim()) : []),
      youtubeUrl: p.youtubeUrl || "",
      rating: typeof p.rating === "number" ? p.rating : 0,
      author: p.author || "",
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
    const currentAdmin = getCurrentAdmin();
    setForm({
      ...EMPTY_FORM,
      author: currentAdmin?.name || "",
      facebookUrl: currentAdmin?.sellerUrl || ""
    });
    setImageFiles([]);
    setPreviewUrls([]);
    setEditingId(null);
    setShowForm(false);
  };

  const getSellerLabel = (url) => SELLERS.find((s) => s.url === url)?.label || url;

  if (authLoading) {
    return (
      <div style={{ ...s.page, display: "grid", placeItems: "center" }}>
        <p style={{ color: "var(--text-muted)" }}>Loading admin…</p>
      </div>
    );
  }
  if (!user) return null;

  const currentAdmin = getCurrentAdmin();
  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(adminSearch.toLowerCase()) &&
    (!currentAdmin || p.author === currentAdmin.name)
  );

  /* ─── RENDER ─────────────────────────────────────────────── */
  return (
    <div style={s.page}>
      {statusMessage && <div style={s.popup}>{statusMessage}</div>}

      {/* ── Header ── */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>
            {getCurrentAdmin()?.label ? `${getCurrentAdmin().label}'s Dashboard` : 'Admin Dashboard'}
          </h1>
          <p style={s.sub}>
            Logged in as {user.email}
            {getCurrentAdmin() && (
              <span style={{ color: "var(--accent)", fontWeight: 600 }}>
                {' · '}{getCurrentAdmin().label} (Author: {getCurrentAdmin().name})
              </span>
            )}
          </p>
        </div>
        <div style={s.headerRight}>
          {!showForm && activeTab === "products" && (
            <button onClick={() => setShowForm(true)} style={s.addBtn}>+ Add Product</button>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={s.tabs}>
        {["overview", "products", "settings"].map((t) => (
          <button
            key={t}
            onClick={async () => {
              if (activeTab === "settings" && t !== "settings") {
                const ok = await confirmLeaveIfDirty();
                if (!ok) return;
              }
              setActiveTab(t);
            }}
            style={{ ...s.tab, ...(activeTab === t ? s.tabActive : {}) }}
          >
            {t === "overview" ? "📊 Overview" : t === "products" ? "📦 Products" : "⚙️ Settings"}
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
                      {(shopOptions.categories || CATEGORIES).map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </Field>
                </div>

                {/* Brands/Units (dynamic by category) */}
                <Field label={`Brands / Units (${form.category})`}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {((shopOptions.brandsByCategory || {})[form.category] || BRANDS_BY_CATEGORY[form.category] || []).map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => handleBrandToggle(b)}
                          style={{
                            ...s.brandChip,
                            ...(form.brands?.includes(b) ? s.brandChipSelected : s.brandChipUnselected)
                          }}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                    {form.brands?.length > 0 && (
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                        Selected: {form.brands.join(", ")}
                      </div>
                    )}
                  </div>
                </Field>

                {/* Rating (admin-only) */}
                <Field label="Rating (admin only)">
                  <select name="rating" value={String(form.rating ?? 0)} onChange={handleChange} style={s.input}>
                    {[0, 1, 2, 3, 4, 5].map((r) => (
                      <option key={r} value={String(r)}>{r === 0 ? "0 (none)" : `${r} ⭐`}</option>
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
                <Field label="Product Images">
                  <div 
                    style={s.uploadArea}
                    onClick={() => document.getElementById('fileInput').click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = 'var(--accent)';
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = 'var(--border)';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = 'var(--border)';
                      const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
                      handleFileChange({ target: { files } });
                    }}
                  >
                    <div style={s.uploadContent}>
                      <div style={s.uploadIcon}>📷</div>
                      <p style={s.uploadText}>Click to upload or drag and drop</p>
                      <p style={s.uploadSubtext}>PNG, JPG, GIF up to 10MB</p>
                    </div>
                    <input 
                      id="fileInput"
                      type="file" 
                      accept="image/*" 
                      multiple 
                      onChange={handleFileChange} 
                      style={{ display: 'none' }} 
                    />
                  </div>
                </Field>

                {(previewUrls.length > 0 || form.images?.length > 0) && (
                  <div style={s.imageGrid}>
                    {(previewUrls.length > 0 ? previewUrls : form.images || []).map((url, idx) => (
                      <div key={idx} style={s.previewWrap}>
                        <button type="button" onClick={() => removePreviewImage(idx)} style={s.removeBtn}>×</button>
                        <img src={url} alt="" style={s.previewThumb} />
                        {imageFiles.length > 0 && idx < imageFiles.length && (
                          <button type="button" onClick={() => openCropModal(idx)} style={s.cropBtn}>
                            Crop
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {cropState.open && (
                  <div style={s.cropOverlay} onClick={closeCropModal}>
                    <div style={s.cropModal} onClick={(e) => e.stopPropagation()}>
                      <h3 style={s.cropTitle}>Crop image before saving</h3>
                      <div style={s.cropPreviewWrap} ref={cropAreaRef}>
                        <img
                          src={cropState.src}
                          alt="Crop preview"
                          style={s.cropPreviewImage}
                          onLoad={handleCropImageLoad}
                        />
                        <div
                          style={{
                            ...s.cropRect,
                            left: `${cropState.x}%`,
                            top: `${cropState.y}%`,
                            width: `${cropState.width}%`,
                            height: `${cropState.height}%`,
                          }}
                          onMouseDown={startCropDrag}
                          onTouchStart={startCropDrag}
                        >
                          <div
                            style={{ ...s.cropHandle, ...s.cropHandleNW }}
                            onMouseDown={startCropResize("nw")}
                            onTouchStart={startCropResize("nw")}
                          />
                          <div
                            style={{ ...s.cropHandle, ...s.cropHandleNE }}
                            onMouseDown={startCropResize("ne")}
                            onTouchStart={startCropResize("ne")}
                          />
                          <div
                            style={{ ...s.cropHandle, ...s.cropHandleSW }}
                            onMouseDown={startCropResize("sw")}
                            onTouchStart={startCropResize("sw")}
                          />
                          <div
                            style={{ ...s.cropHandle, ...s.cropHandleSE }}
                            onMouseDown={startCropResize("se")}
                            onTouchStart={startCropResize("se")}
                          />
                        </div>
                      </div>
                      <div style={s.cropBtnRow}>
                        <button type="button" onClick={confirmCrop} style={s.saveBtn}>
                          Apply Crop
                        </button>
                        <button type="button" onClick={closeCropModal} style={s.cancelBtn}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Seller */}
                <Field label="Assign Seller">
                  <input 
                    type="text"
                    value={getCurrentAdmin()?.label || "Loading..."} 
                    readOnly
                    style={s.input}
                  />
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                    Auto-assigned for your account
                  </p>
                </Field>

                {/* Author */}
                <Field label="Author (for store link)">
                  <input 
                    name="author" 
                    value={form.author} 
                    onChange={handleChange}
                    placeholder="e.g. mina, saira" 
                    style={s.input}
                    disabled={!editingId} // Read-only for new products, editable for edits
                  />
                  {!editingId && (
                    <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                      Auto-assigned for your account
                    </p>
                  )}
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

      {/* ════════════════════════════════════════════
          TAB: SETTINGS (categories + brand/unit)
      ════════════════════════════════════════════ */}
      {activeTab === "settings" && (
        <div style={s.card}>
          <h2 style={s.cardTitle}>⚙️ Categories + Brand/Unit Options</h2>
          {optionsLoading ? (
            <p style={{ color: "var(--text-muted)" }}>Loading options…</p>
          ) : (
            <div style={{ display: "grid", gap: 18 }}>
              {/* Categories */}
              <div style={{ display: "grid", gap: 10 }}>
                <p style={{ margin: 0, color: "var(--text-muted)", fontWeight: 600 }}>Categories</p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Add new category (e.g. Drones)"
                    style={{ ...s.input, maxWidth: 320 }}
                  />
                  <button
                    type="button"
                    disabled={!newCategory.trim() || optionsSaving}
                    onClick={() => {
                      const next = newCategory.trim();
                      if (!next) return;
                      setShopOptions((cur) => ({
                        ...cur,
                        categories: Array.from(new Set([...(cur.categories || []), next])),
                        brandsByCategory: {
                          ...(cur.brandsByCategory || {}),
                          [next]: (cur.brandsByCategory || {})[next] || ["Other"],
                        },
                      }));
                      setOptionsDirty(true);
                      setNewCategory("");
                    }}
                    style={{ ...s.addBtn, padding: "10px 14px" }}
                  >
                    + Add
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {(shopOptions.categories || []).map((cat) => (
                    <div key={cat} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <input
                        value={cat}
                        onChange={(e) => {
                          const nextName = e.target.value;
                          setShopOptions((cur) => {
                            const categories = (cur.categories || []).map((c) => (c === cat ? nextName : c));
                            const brandsByCategory = { ...(cur.brandsByCategory || {}) };
                            if (cat !== nextName) {
                              brandsByCategory[nextName] = brandsByCategory[cat] || ["Other"];
                              delete brandsByCategory[cat];
                            }
                            return { ...cur, categories, brandsByCategory };
                          });
                          setOptionsDirty(true);
                        }}
                        style={{ ...s.input, maxWidth: 260 }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setShopOptions((cur) => {
                            const categories = (cur.categories || []).filter((c) => c !== cat);
                            const brandsByCategory = { ...(cur.brandsByCategory || {}) };
                            delete brandsByCategory[cat];
                            return { ...cur, categories, brandsByCategory };
                          });
                          setOptionsDirty(true);
                        }}
                        style={s.deleteBtn}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Brands/Units per category */}
              <div style={{ display: "grid", gap: 10 }}>
                <p style={{ margin: 0, color: "var(--text-muted)", fontWeight: 600 }}>Brand / Unit (per category)</p>
                {(shopOptions.categories || []).map((cat) => {
                  const list = sortBrandUnitsDesc((shopOptions.brandsByCategory || {})[cat] || []);
                  const newVal = newBrandByCategory[cat] || "";
                  return (
                    <div key={cat} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
                      <p style={{ margin: "0 0 10px", fontWeight: 700 }}>{cat}</p>

                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                        <input
                          value={newVal}
                          onChange={(e) => setNewBrandByCategory((cur) => ({ ...cur, [cat]: e.target.value }))}
                          placeholder="Add brand/unit (e.g. X5)"
                          style={{ ...s.input, maxWidth: 320 }}
                        />
                        <button
                          type="button"
                          disabled={!newVal.trim() || optionsSaving}
                          onClick={() => {
                            const next = newVal.trim();
                            if (!next) return;
                            setShopOptions((cur) => ({
                              ...cur,
                              brandsByCategory: {
                                ...(cur.brandsByCategory || {}),
                                [cat]: Array.from(new Set([...(cur.brandsByCategory?.[cat] || []), next])),
                              },
                            }));
                            setNewBrandByCategory((cur) => ({ ...cur, [cat]: "" }));
                            setOptionsDirty(true);
                          }}
                          style={{ ...s.addBtn, padding: "10px 14px" }}
                        >
                          + Add
                        </button>
                      </div>

                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {list.length ? (
                          list.map((b) => (
                            <span
                              key={b}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 8,
                                background: "var(--bg-input)",
                                border: "1px solid var(--border-light)",
                                borderRadius: 999,
                                padding: "6px 10px",
                                fontSize: 12,
                              }}
                            >
                              {b}
                              <button
                                type="button"
                                onClick={() => {
                                  setShopOptions((cur) => ({
                                    ...cur,
                                    brandsByCategory: {
                                      ...(cur.brandsByCategory || {}),
                                      [cat]: (cur.brandsByCategory?.[cat] || []).filter((x) => x !== b),
                                    },
                                  }));
                                  setOptionsDirty(true);
                                }}
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  color: "var(--text-dim)",
                                  fontSize: 14,
                                  lineHeight: 1,
                                }}
                                aria-label={`Remove ${b}`}
                                title="Remove"
                              >
                                ×
                              </button>
                            </span>
                          ))
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: 13 }}>No brand/unit yet.</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  type="button"
                  disabled={optionsSaving}
                  onClick={saveOptions}
                  style={s.saveBtn}
                >
                  {optionsSaving ? "Saving…" : "Save Options"}
                </button>
              </div>
            </div>
          )}
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
    padding: "16px",
    maxWidth: 960,
    margin: "0 auto",
  },
  popup: {
    position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
    background: "var(--accent)", color: "var(--accent-text)",
    padding: "12px 24px", borderRadius: 10, fontWeight: "bold", zIndex: 9999,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    gap: 12,
    flexWrap: "wrap",
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
  row2: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 },
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
  uploadArea: {
    border: "2px dashed var(--border)",
    borderRadius: 12,
    padding: "32px 16px",
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.3s ease",
    background: "var(--bg-input)",
    "&:hover": {
      borderColor: "var(--accent)",
      background: "var(--bg-input-hover)",
    },
  },
  uploadContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },
  uploadIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  uploadText: {
    color: "var(--text)",
    fontSize: 16,
    fontWeight: 500,
    margin: 0,
  },
  uploadSubtext: {
    color: "var(--text-muted)",
    fontSize: 14,
    margin: 0,
  },
  ytPreviewWrap: { marginTop: 10, borderRadius: 10, overflow: "hidden" },
  ytFrame: { width: "100%", height: 220, border: "none", display: "block" },
  imageGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))",
    gap: 10, marginTop: 10,
  },
  previewWrap: { position: "relative", borderRadius: 8, overflow: "hidden" },
  previewThumb: { width: "100%", height: 100, objectFit: "cover", display: "block" },
  cropBtn: {
    position: "absolute",
    left: 8,
    bottom: 8,
    zIndex: 2,
    border: "none",
    background: "rgba(0,0,0,0.7)",
    color: "#fff",
    borderRadius: 6,
    padding: "6px 10px",
    fontSize: 12,
    cursor: "pointer",
  },
  removeBtn: {
    position: "absolute", top: 6, right: 6, zIndex: 2,
    width: 24, height: 24, borderRadius: "50%", border: "none",
    background: "rgba(0,0,0,0.7)", color: "#fff", fontSize: 16,
    lineHeight: 1, cursor: "pointer",
  },
  cropOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 9999,
  },
  cropModal: {
    width: "100%",
    maxWidth: 720,
    background: "var(--bg-card)",
    borderRadius: 16,
    border: "1px solid var(--border)",
    padding: 20,
    boxShadow: "0 18px 56px rgba(0,0,0,0.16)",
  },
  cropTitle: { margin: 0, fontSize: 18, color: "var(--text)", marginBottom: 16 },
  cropPreviewWrap: {
    position: "relative",
    width: "100%",
    minHeight: 320,
    background: "#111",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 16,
  },
  cropPreviewImage: {
    width: "100%",
    height: "auto",
    display: "block",
  },
  cropRect: {
    position: "absolute",
    border: "2px dashed rgba(255,255,255,0.9)",
    boxShadow: "0 0 0 9999px rgba(0,0,0,0.35)",
    cursor: "grab",
    touchAction: "none",
    pointerEvents: "auto",
  },
  cropHandle: {
    position: "absolute",
    width: 16,
    height: 16,
    background: "#fff",
    border: "2px solid var(--accent)",
    borderRadius: 4,
    boxSizing: "border-box",
    transform: "translate(-50%, -50%)",
    cursor: "nwse-resize",
  },
  cropHandleNW: { left: "0%", top: "0%", cursor: "nwse-resize" },
  cropHandleNE: { left: "100%", top: "0%", cursor: "nesw-resize" },
  cropHandleSW: { left: "0%", top: "100%", cursor: "nesw-resize" },
  cropHandleSE: { left: "100%", top: "100%", cursor: "nwse-resize" },
  cropBtnRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  btnRow: { display: "flex", gap: 12, paddingTop: 4 },
    addBtn: {
    background: "var(--accent)", color: "#fff", border: "none",
    padding: "8px 16px", borderRadius: 8, fontWeight: 700,
    cursor: "pointer", transition: "all 0.2s",
    "&:hover": { background: "var(--accent-hover)", transform: "translateY(-1px)" },
  },
  copyLinkBtn: {
    background: "var(--bg-hover)", color: "var(--text)", border: "1px solid var(--border)",
    borderRadius: 6, padding: "10px 16px", cursor: "pointer", fontSize: 14,
    fontWeight: 600, whiteSpace: "nowrap",
  },
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
    flexWrap: "wrap",
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
  brandChip: {
    padding: "6px 12px", borderRadius: 16, border: "1px solid var(--border-light)",
    fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.2s ease",
    fontFamily: "sans-serif",
  },
  brandChipUnselected: {
    background: "var(--bg-input)", color: "var(--text-muted)",
  },
  brandChipSelected: {
    background: "var(--accent)", color: "var(--accent-text)", borderColor: "var(--accent)",
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