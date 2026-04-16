import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore"; // ✅ FIXED
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
        // ✅ FIX: removed orderBy (was breaking on GitHub)
        const snap = await getDocs(collection(db, "products"));
        setProducts(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filtered = products
    .filter((p) => {
      const matchCat = activeCategory === "All" || p.category === activeCategory;
      const matchSearch =
        p.name?.toLowerCase().includes(search.toLowerCase()) ?? false;
      return matchCat && matchSearch;
    })
    .sort((a, b) => {
      if (sortOption === "Price Low → High") {
        return Number(a.price) - Number(b.price);
      }
      if (sortOption === "Price High → Low") {
        return Number(b.price) - Number(a.price);
      }
      return 0;
    });

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>🎥 Action Camera Accessories</h1>
        <p style={styles.heroSub}>
          GoPro · Insta360 · Motorcycle Mounts & More
        </p>
      </div>

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

        <div style={styles.mainContent}>
          <p style={{ marginBottom: 10, color: "#888" }}>
            {filtered.length} products found
          </p>

          {loading ? (
            <div style={styles.loading}>Loading products...</div>
          ) : filtered.length === 0 ? (
            <div style={styles.empty}>No products found.</div>
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

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

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

  topBar: { display: "flex", gap: 12, padding: 20, maxWidth: 1200, margin: "auto" },

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

  sidebarTitle: { marginBottom: 10 },

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

  loading: { textAlign: "center", marginTop: 50 },
  empty: { textAlign: "center", marginTop: 50 },

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