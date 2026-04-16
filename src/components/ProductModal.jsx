import { useState } from "react";
import { useCart } from "../context/CartContext";

export default function ProductModal({ product, onClose }) {
  const { addToCart } = useCart();

  const images = product.images?.length
    ? product.images
    : product.imageUrl
    ? [product.imageUrl]
    : [];

  const [index, setIndex] = useState(0);

  const nextImage = () => {
    setIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (!product) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        
        {/* IMAGE */}
        <div style={styles.imageWrapper}>
          <img
            src={images[index]}
            alt={product.name}
            style={styles.image}
          />

          {images.length > 1 && (
            <>
              <button onClick={prevImage} style={styles.arrowLeft}>‹</button>
              <button onClick={nextImage} style={styles.arrowRight}>›</button>
            </>
          )}
        </div>

        {/* INFO */}
        <div style={styles.info}>
          <div>
            <h2 style={styles.name}>{product.name}</h2>
            <p style={styles.price}>₱{Number(product.price).toLocaleString()}</p>
            <p style={styles.desc}>{product.description}</p>
          </div>

          {/* BOTTOM BUTTON ROW */}
          <div style={styles.bottomArea}>
            <div style={styles.buttonRow}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(product);
                }}
                style={styles.addBtn}
              >
                🛒 Cart
              </button>

              {product.facebookUrl && (
                <a
                  href={product.facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.inquireBtn}
                >
                  💬 Chat
                </a>
              )}
            </div>

            <button onClick={onClose} style={styles.closeBtn}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },

  modal: {
    background: "#1a1a1a",
    borderRadius: 12,
    padding: 20,
    display: "flex",
    gap: 20,
    maxWidth: 800,
    width: "90%",
  },

  imageWrapper: {
    position: "relative",
  },

  image: {
    width: 300,
    height: 300,
    objectFit: "cover",
    borderRadius: 10,
  },

  arrowLeft: {
    position: "absolute",
    top: "50%",
    left: 10,
    transform: "translateY(-50%)",
    background: "rgba(0,0,0,0.6)",
    color: "#fff",
    border: "none",
    fontSize: 24,
    padding: "4px 10px",
    cursor: "pointer",
    borderRadius: 6,
  },

  arrowRight: {
    position: "absolute",
    top: "50%",
    right: 10,
    transform: "translateY(-50%)",
    background: "rgba(0,0,0,0.6)",
    color: "#fff",
    border: "none",
    fontSize: 24,
    padding: "4px 10px",
    cursor: "pointer",
    borderRadius: 6,
  },

  info: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between", // 🔥 pushes buttons down
  },

  name: { color: "#fff" },

  price: {
    color: "#d4ed00",
    fontSize: 20,
    fontWeight: 700,
  },

  desc: {
    color: "#aaa",
    fontSize: 14,
  },

  bottomArea: {
    marginTop: 20,
  },

  buttonRow: {
    display: "flex",
    gap: 10,
  },

  addBtn: {
    flex: 1,
    padding: "10px",
    background: "#d4ed00",
    border: "none",
    borderRadius: 8,
    fontWeight: 600,
    cursor: "pointer",
  },

  inquireBtn: {
    flex: 1,
    background: "#d4ed00",
    color: "#111",
    padding: "10px",
    borderRadius: 8,
    textDecoration: "none",
    fontWeight: 600,
    textAlign: "center",
  },

  closeBtn: {
    marginTop: 10,
    width: "100%",
    background: "none",
    border: "1px solid #444",
    color: "#aaa",
    padding: "8px",
    borderRadius: 6,
    cursor: "pointer",
  },
};