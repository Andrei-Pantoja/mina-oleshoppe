import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useCart } from "../context/CartContext";

const capitalizeFirst = (str) => {
  if (!str) return str;
  return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

function Stars({ rating }) {
  const r = Math.max(0, Math.min(5, Number(rating || 0)));
  if (!r) return null;
  const full = Math.round(r);
  return (
    <span style={styles.stars} aria-label={`Rating ${full} out of 5`}>
      {"★★★★★".slice(0, full)}
      <span style={styles.starsEmpty}>{"★★★★★".slice(0, 5 - full)}</span>
    </span>
  );
}

export default function ProductCard({ product, onClick }) {
  const { addToCart, updateQuantity, getQuantity } = useCart();

  const name = capitalizeFirst(product?.name || "No Name");
  const price = Number(product?.price) || 0;
  const description = product?.description || "";
  const facebookUrl = product?.facebookUrl || "";
  const category = product?.category || "";
  const brands = product?.brands || (product?.brand ? product.brand.split(", ").filter(b => b.trim()) : []);
  const rating = product?.rating || 0;

  const images = product?.images?.length > 0
    ? product.images
    : product?.imageUrl ? [product.imageUrl] : [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const currentImage = images[currentIndex] || "https://via.placeholder.com/400x300?text=No+Image";

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || images.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 20000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, images.length]);

  const goPrev = (e) => {
    e.stopPropagation();
    if (!images.length) return;
    setIsAutoPlaying(false);
    setCurrentIndex((p) => (p - 1 + images.length) % images.length);
  };
  const goNext = (e) => {
    e.stopPropagation();
    if (!images.length) return;
    setIsAutoPlaying(false);
    setCurrentIndex((p) => (p + 1) % images.length);
  };

  const handleDotClick = (e, index) => {
    e.stopPropagation();
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  const inCartQty = getQuantity(product?.id);
  const inCart = inCartQty > 0;

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ duration: 0.25 }}
      style={styles.card}
    >
      {/* Image */}
      <div style={styles.imageWrap}>
        <motion.img 
          src={currentImage} 
          alt={name} 
          style={styles.image}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          key={currentImage}
          onError={(e) => { e.target.src = "https://via.placeholder.com/400x300?text=No+Image" }} 
        />

        {(category || brands.length > 0) && (
          <span style={styles.badge}>
            {category || "—"}
            {brands.length > 0 ? ` • ${brands.join(" / ")}` : ""}
          </span>
        )}

        {images.length > 1 && (
          <>
            <button 
              type="button" 
              onClick={goPrev} 
              style={{ ...styles.slideBtn, left: 10 }}
              onMouseEnter={() => setIsAutoPlaying(false)}
              onMouseLeave={() => setIsAutoPlaying(true)}
            >‹</button>
            <button 
              type="button" 
              onClick={goNext} 
              style={{ ...styles.slideBtn, right: 10 }}
              onMouseEnter={() => setIsAutoPlaying(false)}
              onMouseLeave={() => setIsAutoPlaying(true)}
            >›</button>
          </>
        )}
      </div>

      {/* Dots */}
      {images.length > 1 && (
        <div style={styles.dots}>
          {images.map((_, idx) => (
            <motion.span 
              key={idx}
              onClick={(e) => handleDotClick(e, idx)} 
              style={idx === currentIndex ? styles.dotActive : styles.dot}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </div>
      )}

      {/* Body */}
      <div style={styles.body}>
        <h3 style={styles.name}>{name}</h3>
        <Stars rating={rating} />
        {description && <p style={styles.desc}>{description}</p>}

        <div style={styles.footer}>
          <span style={styles.price}>₱{price.toLocaleString()}</span>
          <div style={styles.actions}>
            {inCart ? (
              <div style={styles.qtyControls} onClick={(e) => e.stopPropagation()}>
                <button style={styles.qtyBtn}
                  onClick={(e) => { e.stopPropagation(); updateQuantity(product.id, inCartQty - 1); }}>−</button>
                <span style={styles.qtyNum}>{inCartQty}</span>
                <button style={styles.qtyBtn}
                  onClick={(e) => { e.stopPropagation(); updateQuantity(product.id, inCartQty + 1); }}>+</button>
              </div>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); addToCart(product, 1); }}
                style={styles.iconCartBtn} title="Add to cart"
              >🛒</button>
            )}
            {facebookUrl ? (
              <a href="https://www.facebook.com/sairachandesu2003" target="_blank" rel="noreferrer"
                style={styles.cartBtn} onClick={(e) => e.stopPropagation()}>
                Chat
              </a>
            ) : (
              <a href="https://www.facebook.com/sairachandesu2003" target="_blank" rel="noreferrer"
                style={styles.cartBtn} onClick={(e) => e.stopPropagation()}>
                Chat
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const styles = {
  card: {
    background: "var(--bg-card)", border: "1px solid var(--border)",
    borderRadius: 14, overflow: "hidden", display: "flex",
    flexDirection: "column", height: "100%",
  },
  imageWrap: { position: "relative", width: "100%", paddingTop: "75%", overflow: "hidden" },
  image: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" },
  badge: {
    position: "absolute", top: 10, left: 10,
    background: "var(--accent)", color: "var(--accent-text)",
    padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
  },
  slideBtn: {
    position: "absolute", top: "50%", transform: "translateY(-50%)",
    background: "rgba(0,0,0,0.5)", border: "none", color: "#fff",
    width: 30, height: 30, borderRadius: "50%", cursor: "pointer",
  },
  dots: {
    display: "flex", justifyContent: "center", gap: 6,
    padding: 8, background: "var(--bg-input)",
  },
  dot: { width: 8, height: 8, borderRadius: "50%", background: "var(--text-dim)", cursor: "pointer" },
  dotActive: { width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", cursor: "pointer" },
  body: { padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 6, flex: 1 },
  name: { fontSize: 15, fontWeight: 600, color: "var(--text)", margin: 0, minHeight: 40 },
  stars: { fontSize: 12, color: "var(--accent)", letterSpacing: 1, lineHeight: 1 },
  starsEmpty: { color: "var(--text-dim)" },
  desc: {
    fontSize: 12, color: "var(--text-muted)",
    display: "-webkit-box", WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical", overflow: "hidden",
  },
  footer: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    marginTop: "auto", paddingTop: 10, borderTop: "1px solid var(--border)",
  },
  price: { color: "var(--accent)", fontWeight: 800, fontSize: 18 },
  actions: { display: "flex", gap: 8, alignItems: "center" },
  iconCartBtn: {
    background: "var(--bg-hover)", border: "1px solid var(--border-light)",
    color: "var(--accent)", padding: "6px 10px", borderRadius: 8,
    cursor: "pointer", fontSize: 16,
  },
  qtyControls: {
    display: "flex", alignItems: "center", gap: 6,
    background: "var(--bg-hover)", border: "1px solid var(--accent)",
    borderRadius: 8, padding: "4px 8px",
  },
  qtyBtn: {
    background: "none", border: "none", color: "var(--accent)",
    fontSize: 16, fontWeight: 700, cursor: "pointer", padding: "0 4px", lineHeight: 1,
  },
  qtyNum: { color: "var(--text)", fontSize: 14, fontWeight: 600, minWidth: 16, textAlign: "center" },
  cartBtn: {
    background: "var(--accent)", color: "var(--accent-text)",
    padding: "6px 12px", borderRadius: 8,
    textDecoration: "none", fontSize: 12, fontWeight: 700,
  },
  noLink: { fontSize: 12, color: "var(--text-dim)" },
};