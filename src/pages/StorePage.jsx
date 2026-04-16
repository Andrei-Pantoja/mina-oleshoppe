import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
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

const CATEGORIES = ["All", "GoPro", "Insta360", "Mounts & Clamps", "Accessories", "Other"];

export default function StorePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [sortOption, setSortOption] = useState("Newest");

  const { cart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // ✅ FIX: correct collection name
        const snap = await getDocs(collection(db, "products"));

        const data = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log("🔥 FIREBASE DATA:", data); // DEBUG

        setProducts(data);
      } catch (err) {
        console.error("❌ Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // ✅ FILTER + SAFE CHECKS
  const filtered = products
    .filter((p) => {
      if (!p) return false;

      const matchCat = activeCategory === "All" || p.category === activeCategory;

      const matchSearch =
        (p.name || "").toLowerCase().includes(search.toLowerCase());

      return matchCat && matchSearch;
    })
    .sort((a, b) => {
      if (sortOption === "Price Low → High") {
        return Number(a.price || 0) - Number(b.price || 0);
      }
      if (sortOption === "Price High → Low") {
        return Number(b.price || 0) - Number(a.price || 0);
      }
      return 0;
    });

  return (
    <div style={styles.page}>
      {/* HERO */}
      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>🎥 Action Camera Accessories</h1>
        <p style={styles.heroSub}>
          GoPro · Insta360 · Motorcycle Mounts & More
        </p>
      </div>

      {/* TOP BAR */}
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

      <div style={styles.contentWrapper}>
        {/* SIDEBAR */}
        <div style={styles.sidebar}>
          <h3 style={styles.sidebarTitle}>Categories</h3>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                ...styles.sideBtn,
                ...(activeCategory === cat ? styles.sideBtnActive : {}),
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* PRODUCTS */}
        <div style={styles.mainContent}>
          <p style={{ marginBottom: 10, color: "#888" }}>
            {filtered.length} products found
          </p>

          {loading ? (
            <div style={styles.loading}>Loading products...</div>
          ) : filtered.length === 0 ? (
            <div style={styles.empty}>
              ❌ No products found. Check Firebase data.
            </div>
          ) : (
            <div style={styles.grid}>
              {filtered.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => setSelectedProduct(product)}
                  style={{ cursor: "pointer" }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.footerSection}>
            <h3 style={styles.footerTitle}>📍 Our Store</h3>
            <p style={styles.footerText}>
              Mina OleShoppe<br />
              Located in 999 Shopping Mall / Pasilio 2G-09 <br />
              BLDG 2 BINONDO NEAR C.M RECTO SIDE ENTRANCE
            </p>
            <img src={mapImage} style={styles.mapImage} alt="map" />
          </div>

          <div style={styles.footerSection}>
            <h3 style={styles.footerTitle}>🏬 Store Preview</h3>
            <div style={styles.storeImages}>
              <img src={store1} style={styles.storeImg} alt="" />
              <img src={store2} style={styles.storeImg} alt="" />
              <img src={store3} style={styles.storeImg} alt="" />
            </div>
          </div>

          <div style={styles.footerSection}>
            <h3 style={styles.footerTitle}>📞 Contact</h3>
            <p style={styles.footerText}>
              📱 0966-654-5823<br />
              📱 0967-403-5934<br />
              📱 0915-720-5299<br />
              📱 0929-555-5992
            </p>
          </div>
        </div>

        <p style={styles.footerBottom}>© 2014 Mina OleShoppe</p>
      </footer>

      {/* MODAL */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* CART */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      {/* FLOATING CART */}
      <button onClick={() => setCartOpen(true)} style={styles.floatingCart}>
        🛒
        {cart.length > 0 && (
          <span style={styles.badge}>{cart.length}</span>
        )}
      </button>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#0f0f0f", color: "#fff" },
  hero: { padding: 40, textAlign: "center", borderBottom: "2px solid #d4ed00" },
  heroTitle: { color: "#d4ed00" },
  heroSub: { color: "#aaa" },

  topBar: {
    display: "flex",
    gap: 12,
    padding: 20,
    maxWidth: 1200,
    margin: "auto",
  },

  search: {
    flex: 1,
    padding: 14,
    borderRadius: 999,
    background: "#1a1a1a",
    color: "#fff",
    border: "none",
  },

  sort: {
    padding: 10,
    borderRadius: 8,
    background: "#1a1a1a",
    color: "#fff",
    border: "none",
  },

  contentWrapper: {
    display: "flex",
    gap: 20,
    maxWidth: 1200,
    margin: "auto",
  },

  sidebar: {
    width: 200,
    background: "#1c1c1c",
    padding: 16,
    borderRadius: 12,
  },

  sideBtn: {
    display: "block",
    width: "100%",
    padding: 10,
    color: "#aaa",
    background: "transparent",
    border: "none",
    cursor: "pointer",
  },

  sideBtnActive: {
    background: "#d4ed00",
    color: "#111",
  },

  mainContent: { flex: 1 },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: 20,
  },

  loading: { color: "#aaa" },
  empty: { color: "#ff5555" },

  footer: { background: "#111", padding: 40, marginTop: 40 },

  footerContent: {
    display: "flex",
    flexWrap: "wrap",
    gap: 40,
    maxWidth: 1200,
    margin: "auto",
  },

  footerSection: { flex: "1 1 250px" },
  footerTitle: { color: "#d4ed00" },
  footerText: { color: "#aaa" },

  storeImages: { display: "flex", gap: 10 },
  storeImg: { width: 80, height: 80 },

  mapImage: {
    width: "100%",
    maxWidth: 420,
    height: 200,
    objectFit: "cover",
    borderRadius: 10,
    marginTop: 10,
  },

  footerBottom: { textAlign: "center", marginTop: 20 },

  floatingCart: {
    position: "fixed",
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: "50%",
    background: "#d4ed00",
    border: "none",
    cursor: "pointer",
  },

  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    background: "red",
    color: "#fff",
    borderRadius: "50%",
    padding: "2px 6px",
  },
};