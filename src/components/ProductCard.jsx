import { useState } from "react";
import { motion } from "framer-motion";
import { useCart } from "../context/CartContext";

export default function ProductCard({ product, onClick }) {
  const { addToCart, updateQuantity, getQuantity } = useCart();

  const name = product?.name || "No Name";
  const price = Number(product?.price) || 0;
  const description = product?.description || "";
  const facebookUrl = product?.facebookUrl || "";
  const category = product?.category || "";

  const images =
    product?.images?.length > 0
      ? product.images
      : product?.imageUrl
      ? [product.imageUrl]
      : [];

  const [currentIndex, setCurrentIndex] = useState(0);

  const currentImage =
    images[currentIndex] ||
    "https://via.placeholder.com/400x300?text=No+Image";

  const goPrev = (e) => {
    e.stopPropagation();
    if (images.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goNext = (e) => {
    e.stopPropagation();
    if (images.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % images.length);
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
      {/* IMAGE */}
      <div style={styles.imageWrap}>
        <img
          src={currentImage}
          alt={name}
          style={styles.image}
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/400x300?text=No+Image";
          }}
        />

        {category && <span style={styles.badge}>{category}</span>}

        {images.length > 1 && (
          <>
            <button type="button" onClick={goPrev} style={{ ...styles.slideBtn, left: 10 }}>‹</button>
            <button type="button" onClick={goNext} style={{ ...styles.slideBtn, right: 10 }}>›</button>
          </>
        )}
      </div>

      {/* DOTS */}
      {images.length > 1 && (
        <div style={styles.dots}>
          {images.map((_, idx) => (
            <span
              key={idx}
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
              style={idx === currentIndex ? styles.dotActive : styles.dot}
            />
          ))}
        </div>
      )}

      {/* BODY */}
      <div style={styles.body}>
        <h3 style={styles.name}>{name}</h3>
        {description && <p style={styles.desc}>{description}</p>}

        {/* PRICE + BUTTONS */}
        <div style={styles.footer}>
          <span style={styles.price}>₱{price.toLocaleString()}</span>

          <div style={styles.actions}>
            {/* CART — show quantity controls if already in cart */}
            {inCart ? (
              <div style={styles.qtyControls} onClick={(e) => e.stopPropagation()}>
                <button
                  style={styles.qtyBtn}
                  onClick={(e) => { e.stopPropagation(); updateQuantity(product.id, inCartQty - 1); }}
                >−</button>
                <span style={styles.qtyNum}>{inCartQty}</span>
                <button
                  style={styles.qtyBtn}
                  onClick={(e) => { e.stopPropagation(); updateQuantity(product.id, inCartQty + 1); }}
                >+</button>
              </div>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); addToCart(product, 1); }}
                style={styles.iconCartBtn}
                title="Add to cart"
              >
                🛒
              </button>
            )}

            {/* CHAT */}
            {facebookUrl ? (
              <a
                href={facebookUrl}
                target="_blank"
                rel="noreferrer"
                style={styles.cartBtn}
                onClick={(e) => e.stopPropagation()}
              >
                Chat
              </a>
            ) : (
              <span style={styles.noLink}>No link</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const styles = {
  card: {
    background: "#1e1e1e",
    border: "1px solid #2a2a2a",
    borderRadius: 14,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  imageWrap: {
    position: "relative",
    width: "100%",
    paddingTop: "75%",
    overflow: "hidden",
  },
  image: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  badge: {
    position: "absolute",
    top: 10,
    left: 10,
    background: "#d4ed00",
    color: "#111",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
  },
  slideBtn: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    background: "rgba(0,0,0,0.5)",
    border: "none",
    color: "#fff",
    width: 30,
    height: 30,
    borderRadius: "50%",
    cursor: "pointer",
  },
  dots: {
    display: "flex",
    justifyContent: "center",
    gap: 6,
    padding: 8,
    background: "#111",
  },
  dot: {
    width: 8, height: 8,
    borderRadius: "50%",
    background: "#555",
    cursor: "pointer",
  },
  dotActive: {
    width: 8, height: 8,
    borderRadius: "50%",
    background: "#d4ed00",
  },
  body: {
    padding: "14px 16px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: 600,
    color: "#fff",
    margin: 0,
    minHeight: 40,
  },
  desc: {
    fontSize: 12,
    color: "#777",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "auto",
    paddingTop: 10,
    borderTop: "1px solid #2a2a2a",
  },
  price: {
    color: "#d4ed00",
    fontWeight: 800,
    fontSize: 18,
  },
  actions: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  iconCartBtn: {
    background: "#2a2a2a",
    border: "1px solid #333",
    color: "#d4ed00",
    padding: "6px 10px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 16,
  },
  qtyControls: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "#2a2a2a",
    border: "1px solid #d4ed00",
    borderRadius: 8,
    padding: "4px 8px",
  },
  qtyBtn: {
    background: "none",
    border: "none",
    color: "#d4ed00",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    padding: "0 4px",
    lineHeight: 1,
  },
  qtyNum: {
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    minWidth: 16,
    textAlign: "center",
  },
  cartBtn: {
    background: "#d4ed00",
    color: "#111",
    padding: "6px 12px",
    borderRadius: 8,
    textDecoration: "none",
    fontSize: 12,
    fontWeight: 700,
  },
  noLink: {
    fontSize: 12,
    color: "#555",
  },
};