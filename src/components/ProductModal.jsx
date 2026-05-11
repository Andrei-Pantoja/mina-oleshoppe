import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { motion } from "framer-motion";

const capitalizeFirst = (str) => {
  if (!str) return str;
  return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const getYouTubeId = (url) => {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
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

export default function ProductModal({ product, onClose }) {
  const { addToCart, updateQuantity, getQuantity } = useCart();

  const images = product.images?.length
    ? product.images
    : product.imageUrl
    ? [product.imageUrl]
    : [];

  const [imgIndex, setImgIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [showInquiry, setShowInquiry] = useState(false);
  const [copied, setCopied] = useState(false);

  const nextImage = () => {
    setImgIndex((p) => (p + 1) % images.length);
  };
  const prevImage = () => {
    setImgIndex((p) => (p - 1 + images.length) % images.length);
  };

  const handleDotClick = (e, index) => {
    e.stopPropagation();
    setImgIndex(index);
  };

  const inCartQty = getQuantity(product?.id);
  const inCart = inCartQty > 0;
  const youtubeId = getYouTubeId(product.youtubeUrl);
  const brands = product?.brands || (product?.brand ? product.brand.split(", ").filter(b => b.trim()) : []);
  const showBrands = brands.length > 0;
  const showMeta = product?.category || showBrands;

  /* ── Build single-item inquiry message ────────────── */
  const buildInquiryMessage = () =>
    `Hello! I want to inquire if this is available:\n\n• ${capitalizeFirst(product.name)} x1 - ₱${Number(product.price).toLocaleString()}\n\nTotal: ₱${Number(product.price).toLocaleString()}`;

  const handleInquire = () => {
    setShowInquiry(true);
    setCopied(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(buildInquiryMessage()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleOpenMessenger = () => {
    window.open("https://www.facebook.com/sairachandesu2003", "_blank");
  };

  if (!product) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>

      {/* ── Single-item inquiry popup ─────────────────── */}
      {showInquiry && (
        <div style={styles.inquiryOverlay} onClick={(e) => e.stopPropagation()}>
          <div style={styles.inquiryBox}>
            <h3 style={styles.inquiryTitle}>💬 Inquire About This Item</h3>
            <p style={styles.inquirySubtitle}>
              Copy the message, then paste it in Facebook Messenger or send directly to the seller.
            </p>
            <div style={styles.inquiryMessage}>
              {buildInquiryMessage().split("\n").map((line, i) => (
                <span key={i}>{line}<br /></span>
              ))}
            </div>
            <div style={styles.inquiryBtns}>
              <button onClick={handleCopy} style={styles.copyBtn}>
                {copied ? "✅ Copied!" : "📋 Copy Message"}
              </button>
              <button onClick={handleOpenMessenger} style={styles.messengerBtn}>
                💬 Open Facebook
              </button>
              <button onClick={() => setShowInquiry(false)} style={styles.cancelBtn2}>
                ← Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main modal ───────────────────────────────── */}
      {!showInquiry && (
        <div style={styles.modal} onClick={(e) => e.stopPropagation()}>

          {/* Image carousel */}
          <div style={styles.imageWrapper}>
            <motion.img
              src={images[imgIndex] || "https://via.placeholder.com/400x300?text=No+Image"}
              alt={product.name}
              style={styles.image}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              key={images[imgIndex]}
              onContextMenu={(e) => e.preventDefault()}
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              onTouchStart={(e) => e.preventDefault()}
              onTouchMove={(e) => e.preventDefault()}
              onCopy={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              onPaste={(e) => e.preventDefault()}
              className="protected-image"
            />
            <div 
              style={styles.imageOverlay}
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => e.preventDefault()}
            />
            {images.length > 1 && (
              <>
                <button 
                  onClick={prevImage} 
                  style={styles.arrowLeft}
                >‹</button>
                <button 
                  onClick={nextImage} 
                  style={styles.arrowRight}
                >›</button>
              </>
            )}
            {/* Dot indicators */}
            {images.length > 1 && (
              <div style={styles.dots}>
                {images.map((_, i) => (
                  <motion.span
                    key={i}
                    onClick={(e) => handleDotClick(e, i)}
                    style={i === imgIndex ? styles.dotActive : styles.dot}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div style={styles.info}>
            <div>
              <h2 style={styles.name}>{capitalizeFirst(product.name)}</h2>
              {showMeta && (
                <span style={styles.metaBadge}>
                  {product.category || "—"}
                  {showBrands ? ` • ${brands.join(" / ")}` : ""}
                </span>
              )}
              <Stars rating={product?.rating || 0} />
              <p style={styles.price}>₱{Number(product.price).toLocaleString()}</p>
              {product.description && (
                <p style={styles.desc}>{product.description}</p>
              )}
            </div>

            {/* YouTube embed */}
            {youtubeId && (
              <div style={styles.ytWrap}>
                <p style={styles.ytLabel}>▶️ Product Video</p>
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title="Product video"
                  style={styles.ytFrame}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {/* Cart / Actions */}
            <div style={styles.bottomArea}>
              {inCart ? (
                <div>
                  <p style={styles.inCartLabel}>✅ In your cart</p>
                  <div style={styles.qtyRow}>
                    <span style={styles.qtyLabel}>Quantity:</span>
                    <div style={styles.qtyControls}>
                      <button style={styles.qtyBtn} onClick={() => updateQuantity(product.id, inCartQty - 1)}>−</button>
                      <span style={styles.qtyNum}>{inCartQty}</span>
                      <button style={styles.qtyBtn} onClick={() => updateQuantity(product.id, inCartQty + 1)}>+</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={styles.qtyRow}>
                    <span style={styles.qtyLabel}>Quantity:</span>
                    <div style={styles.qtyControls}>
                      <button style={styles.qtyBtn} onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                      <span style={styles.qtyNum}>{qty}</span>
                      <button style={styles.qtyBtn} onClick={() => setQty((q) => q + 1)}>+</button>
                    </div>
                  </div>

                  <div style={styles.buttonRow}>
                    <button onClick={() => addToCart(product, qty)} style={styles.addBtn}>
                      🛒 Add to Cart
                    </button>
                    {/* Single-item inquiry button */}
                    <button onClick={handleInquire} style={styles.inquireBtn}>
                      💬 Inquire
                    </button>
                  </div>
                </div>
              )}

              <button onClick={onClose} style={styles.closeBtn}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
    background: "var(--overlay)", display: "flex",
    justifyContent: "center", alignItems: "center",
    zIndex: 999, padding: 10,
  },

  /* Inquiry popup */
  inquiryOverlay: {
    display: "flex", justifyContent: "center", alignItems: "center",
    width: "100%",
  },
  inquiryBox: {
    background: "var(--bg-card)", border: "1px solid var(--border)",
    borderRadius: 16, padding: 28, width: "90%", maxWidth: 420,
    display: "flex", flexDirection: "column", gap: 14,
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
  cancelBtn2: {
    background: "none", border: "1px solid var(--border)", color: "var(--text-muted)",
    borderRadius: 10, padding: "10px 0", fontSize: 13, cursor: "pointer",
  },

  /* Main modal */
  modal: {
    background: "var(--bg-card)", borderRadius: 12,
    display: "flex", flexDirection: "column",
    width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto",
  },
  imageWrapper: { position: "relative", width: "100%" },
  image: {
    width: "100%", height: "auto", maxHeight: 300, objectFit: "cover",
    borderTopLeftRadius: 12, borderTopRightRadius: 12,
  },
  arrowLeft: {
    position: "absolute", top: "50%", left: 10, transform: "translateY(-50%)",
    background: "rgba(0,0,0,0.6)", color: "#fff", border: "none",
    fontSize: 24, padding: "4px 10px", cursor: "pointer", borderRadius: 6,
    zIndex: 20,
  },
  arrowRight: {
    position: "absolute", top: "50%", right: 10, transform: "translateY(-50%)",
    background: "rgba(0,0,0,0.6)", color: "#fff", border: "none",
    fontSize: 24, padding: "4px 10px", cursor: "pointer", borderRadius: 6,
    zIndex: 20,
  },
  dots: {
    position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)",
    display: "flex", gap: 6,
    zIndex: 20,
  },
  dot: { width: 7, height: 7, borderRadius: "50%", background: "rgba(255,255,255,0.4)", cursor: "pointer" },
  dotActive: { width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", cursor: "pointer" },

  info: {
    padding: 16, display: "flex", flexDirection: "column",
    justifyContent: "space-between", gap: 10,
  },
  name: { color: "var(--text)", fontSize: 18, marginBottom: 4 },
  metaBadge: {
    display: "inline-block", background: "var(--bg-input)",
    border: "1px solid var(--border-light)", borderRadius: 999,
    padding: "4px 10px", fontSize: 12, color: "var(--text-muted)",
    marginBottom: 8,
  },
  stars: { display: "block", fontSize: 13, color: "var(--accent)", letterSpacing: 1, lineHeight: 1, marginBottom: 8 },
  starsEmpty: { color: "var(--text-dim)" },
  price: { color: "var(--accent)", fontSize: 20, fontWeight: 700, marginBottom: 6 },
  desc: { color: "var(--text-muted)", fontSize: 14 },

  ytWrap: { marginTop: 4 },
  ytLabel: { color: "var(--text-muted)", fontSize: 12, marginBottom: 6, fontWeight: 600 },
  ytFrame: { width: "100%", height: 200, border: "none", borderRadius: 8, display: "block" },

  bottomArea: { marginTop: 10, display: "flex", flexDirection: "column", gap: 12 },
  inCartLabel: { color: "var(--accent)", fontWeight: 600, fontSize: 14, marginBottom: 8 },
  qtyRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 12 },
  qtyLabel: { color: "var(--text-muted)", fontSize: 14 },
  qtyControls: {
    display: "flex", alignItems: "center", gap: 8,
    background: "var(--bg-input)", border: "1px solid var(--accent)",
    borderRadius: 8, padding: "4px 10px",
  },
  qtyBtn: {
    background: "none", border: "none", color: "var(--accent)",
    fontSize: 18, fontWeight: 700, cursor: "pointer", padding: "0 4px", lineHeight: 1,
  },
  qtyNum: { color: "var(--text)", fontSize: 15, fontWeight: 600, minWidth: 20, textAlign: "center" },
  buttonRow: { display: "flex", gap: 10 },
  addBtn: {
    flex: 1, padding: 12, background: "var(--accent)", border: "none",
    borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 14,
    color: "var(--accent-text)",
  },
  inquireBtn: {
    flex: 1, padding: 12, background: "transparent",
    border: "2px solid var(--accent)", borderRadius: 8,
    fontWeight: 600, cursor: "pointer", fontSize: 14,
    color: "var(--accent)",
  },
  closeBtn: {
    width: "100%", background: "none", border: "1px solid var(--border-light)",
    color: "var(--text-muted)", padding: 10, borderRadius: 6, cursor: "pointer",
  },
  protectedImage: {
    userSelect: "none",
    WebkitUserSelect: "none",
    MozUserSelect: "none",
    msUserSelect: "none",
    WebkitTouchCallout: "none",
    WebkitTapHighlightColor: "transparent",
    pointerEvents: "auto",
  },
  imageWrapper: {
    position: "relative",
    pointerEvents: "auto",
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    pointerEvents: "none",
    backgroundColor: "transparent",
  },
};