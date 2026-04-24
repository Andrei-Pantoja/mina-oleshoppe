import { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase/config";
import ProductCard from "../components/ProductCard";
import ProductModal from "../components/ProductModal";
import { motion } from "framer-motion";
import CartDrawer from "../components/CartDrawer";
import { useCart } from "../context/CartContext";

import store1 from "../assets/store1.png";
import store2 from "../assets/store2.png";
import store3 from "../assets/store3.png";
import mapImage from "../assets/store3.png";

const CATEGORIES = ["All", "GoPro", "Insta360", "Mounts & Clamps", "Accessories", "Bundle", "Other"];

const BRANDS_BY_CATEGORY = {
  GoPro: ["Hero 12", "Hero 11", "Hero 10", "Hero 9", "Hero 8", "Max", "Other"],
  Insta360: ["X4", "X3", "X2", "ONE RS", "ONE X2", "GO 3", "Other"],
  "Mounts & Clamps": ["RAM Mounts", "GoPro Official", "Peak Design", "Ulanzi", "Generic", "Other"],
  Accessories: ["Batteries", "Chargers", "Cases", "Filters", "Memory Cards", "Other"],
  Bundle: ["GoPro Bundle", "Insta360 Bundle", "Mixed Bundle", "Other"],
  Other: ["Other"],
};

function getMostCommonSellerUrl(cartItems) {
  if (!cartItems?.length) return "https://m.me/Sithis02";
  const counts = {};
  cartItems.forEach((item) => {
    const url = item.facebookUrl || "https://m.me/Sithis02";
    counts[url] = (counts[url] || 0) + (item.quantity || 1);
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

export default function StorePage() {
  const isMobile = window.innerWidth < 768;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeBrand, setActiveBrand] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [sortOption, setSortOption] = useState("Newest");
  const [previewImage, setPreviewImage] = useState(null);
  const [inquiryPopup, setInquiryPopup] = useState(null);
  const [copied, setCopied] = useState(false);

  const { cart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snap = await getDocs(collection(db, "products"));
        setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  /* ── Track product view ──────────────────────────────── */
  const handleOpenProduct = async (product) => {
    setSelectedProduct(product);
    try {
      await updateDoc(doc(db, "products", product.id), { views: increment(1) });
    } catch (_) {}
  };

  /* ── Category change resets brand ─────────────────── */
  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    setActiveBrand("All");
  };

  /* ── Available brands for active category ─────────── */
  const availableBrands = activeCategory !== "All"
    ? ["All", ...(BRANDS_BY_CATEGORY[activeCategory] || [])]
    : [];

  /* ── Filtered + sorted products ─────────────────────── */
  const filtered = products
    .filter((p) => {
      if (!p) return false;
      const matchCat = activeCategory === "All" || p.category === activeCategory;
      const matchBrand = activeBrand === "All" || p.brand === activeBrand;
      const matchSearch = (p.name || "").toLowerCase().includes(search.toLowerCase());
      return matchCat && matchBrand && matchSearch;
    })
    .sort((a, b) => {
      if (sortOption === "Price Low → High") return Number(a.price || 0) - Number(b.price || 0);
      if (sortOption === "Price High → Low") return Number(b.price || 0) - Number(a.price || 0);
      return 0;
    });

  /* ── Checkout / inquiry ─────────────────────────────── */
  const handleCheckout = () => {
    if (!cart?.length) return;
    const lines = cart.map(
      (item) => `• ${item.name} x${item.quantity || 1} - ₱${(Number(item.price) * (item.quantity || 1)).toLocaleString()}`
    );
    const total = cart.reduce((sum, item) => sum + Number(item.price) * (item.quantity || 1), 0);
    const message = `Hello! I want to inquire if this is available:\n\n${lines.join("\n")}\n\nTotal: ₱${total.toLocaleString()}`;
    setInquiryPopup({ message, sellerUrl: getMostCommonSellerUrl(cart) });
    setCopied(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inquiryPopup.message).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  /* ─── RENDER ─────────────────────────────────────────── */
  return (
    <div style={styles.page}>
      {/* Hero */}
      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>🎥 Action Camera Accessories</h1>
        <p style={styles.heroSub}>GoPro · Insta360 · Motorcycle Mounts & More</p>
      </div>

      {/* Top bar */}
      <div style={styles.topBar}>
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.search}
        />
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          style={styles.sort}
        >
          <option>Newest</option>
          <option>Price Low → High</option>
          <option>Price High → Low</option>
        </select>
      </div>

      <div style={{ ...styles.contentWrapper, flexWrap: "wrap" }}>
        {/* Sidebar */}
        <div style={{ ...styles.sidebar, width: isMobile ? "100%" : 200 }}>
          <h3 style={styles.sidebarTitle}>Categories</h3>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              style={{
                ...styles.sideBtn,
                ...(activeCategory === cat ? styles.sideBtnActive : {}),
              }}
            >
              {cat}
            </button>
          ))}

          {/* Brand sub-filter */}
          {availableBrands.length > 1 && (
            <>
              <h3 style={{ ...styles.sidebarTitle, marginTop: 20 }}>Brand / Unit</h3>
              {availableBrands.map((brand) => (
                <button
                  key={brand}
                  onClick={() => setActiveBrand(brand)}
                  style={{
                    ...styles.sideBtn,
                    ...(activeBrand === brand ? styles.sideBtnActive : {}),
                    fontSize: 12,
                  }}
                >
                  {brand}
                </button>
              ))}
            </>
          )}
        </div>

        {/* Main content */}
        <div style={styles.mainContent}>
          <p style={{ marginBottom: 10, color: "var(--text-muted)" }}>
            {filtered.length} products found
            {activeBrand !== "All" && ` · ${activeBrand}`}
          </p>

          {loading ? (
            <div style={styles.loading}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={styles.empty}>No products found.</div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 20,
            }}>
              {filtered.map((product) => (
                <motion.div
                  key={product.id}
                  onClick={() => handleOpenProduct(product)}
                  style={{ cursor: "pointer" }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.footerSection}>
            <h3 style={styles.footerTitle}>📍 Our Store</h3>
            <p style={styles.footerText}>
              Facebook Page:{" "}
              <a href="https://www.facebook.com/MinaOnlineShoppee" target="_blank" rel="noreferrer" style={styles.fbPageLink}>
                Mina OleShoppe
              </a>
              <br />
              Located in 999 Shopping Mall / Pasilio 2G-09 <br />
              BLDG 2 BINONDO NEAR C.M RECTO SIDE ENTRANCE
            </p>
            <img
              src={mapImage}
              style={styles.mapImage}
              alt="map"
              onClick={() => setPreviewImage(mapImage)}
              onMouseOver={(e) => (e.currentTarget.style.boxShadow = "0 0 12px var(--accent)")}
              onMouseOut={(e) => (e.currentTarget.style.boxShadow = "none")}
            />
          </div>

          <div style={styles.footerSection}>
            <h3 style={styles.footerTitle}>🏬 Store Preview</h3>
            <div style={styles.storeImages}>
              {[store1, store2, store3].map((img, i) => (
                <img key={i} src={img} style={styles.storeImg}
                  onClick={() => setPreviewImage(img)}
                  onMouseOver={(e) => (e.currentTarget.style.boxShadow = "0 0 10px var(--accent)")}
                  onMouseOut={(e) => (e.currentTarget.style.boxShadow = "none")}
                  alt="" />
              ))}
            </div>
          </div>

          <div style={styles.footerSection}>
            <h3 style={styles.footerTitle}>📞 Contact</h3>
            <p style={styles.footerText}>
              📱 0966-654-5823<br />📱 0967-403-5934<br />
              📱 0915-720-5299<br />📱 0929-555-5992
            </p>
          </div>
        </div>
        <p style={styles.footerBottom}>© 2014 Mina OleShoppe</p>
      </footer>

      {/* Image preview */}
      {previewImage && (
        <div style={styles.overlay} onClick={() => setPreviewImage(null)}>
          <div style={styles.previewBox} onClick={(e) => e.stopPropagation()}>
            <img src={previewImage} style={styles.previewImage} alt="" />
            {previewImage === mapImage && (
              <a
                href="https://www.google.com/maps/place/Puregold+-+C.M.+Recto+(999+Shopping+Mall)/@14.6062437,120.9733403,221m"
                target="_blank" rel="noreferrer" style={styles.mapButton}
              >
                📍 Check location on Google Maps
              </a>
            )}
            <button style={styles.previewClose} onClick={() => setPreviewImage(null)}>✕ Close</button>
          </div>
        </div>
      )}

      {/* Inquiry popup (cart checkout) */}
      {inquiryPopup && (
        <div style={styles.overlay} onClick={() => setInquiryPopup(null)}>
          <div style={styles.inquiryBox} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.inquiryTitle}>📋 Confirm Your Inquiry</h3>
            <p style={styles.inquirySubtitle}>
              Copy the message then paste it in Messenger.
            </p>
            <div style={styles.inquiryMessage}>
              {inquiryPopup.message.split("\n").map((line, i) => (
                <span key={i}>{line}<br /></span>
              ))}
            </div>
            <div style={styles.inquiryBtns}>
              <button onClick={handleCopy} style={styles.copyBtn}>
                {copied ? "✅ Copied!" : "📋 Copy Message"}
              </button>
              <button onClick={() => window.open(inquiryPopup.sellerUrl, "_blank")} style={styles.messengerBtn}>
                💬 Open Messenger
              </button>
              <button onClick={() => setInquiryPopup(null)} style={styles.cancelInquiryBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Product modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} onCheckout={handleCheckout} />

      <button onClick={() => setCartOpen(true)} style={styles.floatingCart}>
        🛒
        {cart.length > 0 && <span style={styles.badge}>{cart.length}</span>}
      </button>
    </div>
  );
}

const styles = {
  page: { background: "var(--bg)", color: "var(--text)", minHeight: "100vh" },
  hero: { padding: 40, textAlign: "center", borderBottom: "2px solid var(--accent)" },
  heroTitle: { color: "var(--accent)", fontSize: 28, fontWeight: 800 },
  heroSub: { color: "var(--text-muted)", marginTop: 8 },
  topBar: { display: "flex", gap: 12, padding: 20, maxWidth: 1200, margin: "auto" },
  search: {
    flex: 1, padding: 14, borderRadius: 999,
    background: "var(--bg-card)", color: "var(--text)",
    border: "1px solid var(--border)", outline: "none",
  },
  sort: {
    padding: 10, borderRadius: 8,
    background: "var(--bg-card)", color: "var(--text)",
    border: "1px solid var(--border)",
  },
  contentWrapper: { display: "flex", gap: 20, maxWidth: 1200, margin: "auto", padding: 20 },
  sidebar: { background: "var(--bg-card)", padding: 16, borderRadius: 12, border: "1px solid var(--border)" },
  sidebarTitle: { color: "var(--text)", marginBottom: 10, fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 },
  sideBtn: {
    width: "100%", padding: 10, color: "var(--text-muted)",
    background: "transparent", border: "none", cursor: "pointer",
    textAlign: "left", borderRadius: 6, fontSize: 13,
  },
  sideBtnActive: { background: "var(--accent)", color: "var(--accent-text)", fontWeight: 700 },
  mainContent: { flex: 1 },
  loading: { color: "var(--text-muted)" },
  empty: { color: "var(--text-muted)" },
  footer: { background: "var(--bg-card)", padding: 40, marginTop: 40, borderTop: "1px solid var(--border)" },
  footerContent: { display: "flex", flexWrap: "wrap", gap: 40, maxWidth: 1200, margin: "auto" },
  footerSection: { flex: "1 1 300px" },
  footerTitle: { color: "var(--accent)", marginBottom: 12 },
  footerText: { color: "var(--text-muted)", lineHeight: 1.8 },
  fbPageLink: { color: "var(--accent)", textDecoration: "underline", fontWeight: "bold" },
  storeImages: { display: "flex", gap: 10 },
  storeImg: { width: 80, height: 80, cursor: "pointer", borderRadius: 6, objectFit: "cover" },
  mapImage: { width: "100%", height: 200, objectFit: "cover", cursor: "pointer", borderRadius: 10, marginTop: 10, transition: "box-shadow 0.2s" },
  footerBottom: { textAlign: "center", marginTop: 20, color: "var(--text-dim)" },
  floatingCart: {
    position: "fixed", bottom: 20, right: 20,
    width: 60, height: 60, borderRadius: "50%",
    background: "var(--accent)", border: "none",
    cursor: "pointer", fontSize: 22,
  },
  badge: {
    position: "absolute", top: -6, right: -6,
    background: "red", color: "#fff",
    borderRadius: "50%", padding: "2px 6px", fontSize: 11,
  },
  overlay: {
    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
    background: "var(--overlay)", display: "flex",
    justifyContent: "center", alignItems: "center", zIndex: 2000,
  },
  previewBox: {
    maxWidth: "70%", maxHeight: "80%",
    display: "flex", flexDirection: "column", alignItems: "center",
  },
  previewImage: { width: "100%", maxHeight: "75vh", objectFit: "contain", borderRadius: 12 },
  previewClose: {
    marginTop: 15, background: "var(--accent)", border: "none",
    borderRadius: 999, padding: "10px 20px", cursor: "pointer", fontWeight: "bold",
  },
  mapButton: {
    marginTop: 15, background: "var(--accent)", border: "none", borderRadius: 999,
    padding: "10px 20px", cursor: "pointer", fontWeight: "bold",
    textDecoration: "none", color: "var(--accent-text)", display: "inline-block",
  },
  inquiryBox: {
    background: "var(--bg-card)", border: "1px solid var(--border)",
    borderRadius: 16, padding: 28, width: "90%", maxWidth: 460,
    display: "flex", flexDirection: "column", gap: 16,
  },
  inquiryTitle: { margin: 0, color: "var(--accent)", fontSize: 18, fontWeight: 700 },
  inquirySubtitle: { margin: 0, color: "var(--text-muted)", fontSize: 13, lineHeight: 1.6 },
  inquiryMessage: {
    background: "var(--bg-input)", border: "1px solid var(--border-light)",
    borderRadius: 10, padding: "14px 16px", color: "var(--text)", fontSize: 14, lineHeight: 1.8,
  },
  inquiryBtns: { display: "flex", flexDirection: "column", gap: 10 },
  copyBtn: {
    background: "var(--bg-hover)", border: "1px solid var(--border-light)",
    color: "var(--text)", borderRadius: 10, padding: "12px 0",
    fontWeight: 600, fontSize: 14, cursor: "pointer",
  },
  messengerBtn: {
    background: "var(--accent)", border: "none", color: "var(--accent-text)",
    borderRadius: 10, padding: "12px 0", fontWeight: 700, fontSize: 14, cursor: "pointer",
  },
  cancelInquiryBtn: {
    background: "none", border: "1px solid var(--border)", color: "var(--text-dim)",
    borderRadius: 10, padding: "10px 0", fontSize: 13, cursor: "pointer",
  },
};