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
    padding: 10, // 🔥 prevent edge cut on mobile
  },

  modal: {
    background: "#1a1a1a",
    borderRadius: 12,
    display: "flex",
    flexDirection: "column", // 🔥 MOBILE FIRST
    width: "100%",
    maxWidth: 500,
    maxHeight: "90vh", // 🔥 prevent overflow
    overflowY: "auto", // 🔥 scroll inside modal
  },

  imageWrapper: {
    position: "relative",
    width: "100%",
  },

  image: {
    width: "100%", // 🔥 responsive
    height: "auto",
    maxHeight: 300,
    objectFit: "cover",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
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
    padding: 15,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: 10,
  },

  name: { color: "#fff", fontSize: 18 },

  price: {
    color: "#d4ed00",
    fontSize: 18,
    fontWeight: 700,
  },

  desc: {
    color: "#aaa",
    fontSize: 14,
  },

  bottomArea: {
    marginTop: 10,
  },

  buttonRow: {
    display: "flex",
    gap: 10,
  },

  addBtn: {
    flex: 1,
    padding: "12px", 
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
    padding: "12px",
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
    padding: "10px",
    borderRadius: 6,
    cursor: "pointer",
  },
};