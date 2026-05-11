import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";

const capitalizeFirst = (str) => {
  if (!str) return str;
  return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const generateInquiryMessage = (name, price) => {
  return `Hi! I'm interested in purchasing:\n\n📦 Product: ${name}\n💰 Price: ₱${price.toLocaleString()}\n\nCould you please provide more details about availability and payment options? Thank you!`;
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
  const category = product?.category || "";
  const brands = product?.brands || (product?.brand ? product.brand.split(", ").filter(b => b.trim()) : []);
  const rating = product?.rating || 0;

  const images = product?.images?.length > 0
    ? product.images
    : product?.imageUrl ? [product.imageUrl] : [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [showInquireModal, setShowInquireModal] = useState(false);

  const currentImage = images[currentIndex] || "https://via.placeholder.com/400x300?text=No+Image";

  useEffect(() => {
    if (!isAutoPlaying || images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 25000);
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
    <>
      <motion.div
        onClick={onClick}
        whileHover={{ y: -6, scale: 1.02 }}
        transition={{ duration: 0.25 }}
        style={styles.card}
      >
        {/* Image Section */}
        <div style={styles.imageWrap}>
          <motion.img
            key={currentImage}
            src={currentImage}
            alt={name}
            style={styles.image}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            onError={(e) => { e.target.src = "https://via.placeholder.com/400x300?text=No+Image"; }}
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
                >🛒</button>
              )}

              {/* Combined Chat & Inquire Button */}
              <button
                onClick={(e) => { e.stopPropagation(); setShowInquireModal(true); }}
                style={styles.cartBtn}
              >
                Chat
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Inquiry Modal */}
      <AnimatePresence>
        {showInquireModal && (
          <motion.div
            style={styles.inquiryOverlay}
            onClick={() => setShowInquireModal(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              style={styles.inquiryBox}
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h3 style={styles.inquiryTitle}>📋 Inquire About This Item</h3>
              <p style={styles.inquirySubtitle}>
                {generateInquiryMessage(name, price)}
              </p>
              <div style={styles.inquiryActions}>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generateInquiryMessage(name, price));
                    alert("Message copied to clipboard!");
                  }}
                  style={styles.copyBtn}
                >
                  📋 Copy Message
                </button>
                <button
                  onClick={() => window.open("https://www.facebook.com/sairachandesu2003", "_blank")}
                  style={styles.messengerBtn}
                >
                  💬 Open Facebook
                </button>
                <button
                  onClick={() => setShowInquireModal(false)}
                  style={styles.cancelInquiryBtn}
                >
                  ← Back
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const styles = {
  card: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
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
    background: "var(--accent)",
    color: "var(--accent-text)",
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
    background: "var(--bg-input)",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "var(--text-dim)",
    cursor: "pointer",
  },
  dotActive: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "var(--accent)",
    cursor: "pointer",
  },
  body: {
    padding: "14px 16px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: 600,
    color: "var(--text)",
    margin: 0,
    minHeight: 40,
  },
  stars: {
    fontSize: 12,
    color: "var(--accent)",
    letterSpacing: 1,
    lineHeight: 1,
  },
  starsEmpty: { color: "var(--text-dim)" },
  desc: {
    fontSize: 12,
    color: "var(--text-muted)",
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
    borderTop: "1px solid var(--border)",
  },
  price: { color: "var(--accent)", fontWeight: 800, fontSize: 18 },
  actions: { display: "flex", gap: 8, alignItems: "center" },
  iconCartBtn: {
    background: "var(--bg-hover)",
    border: "1px solid var(--border-light)",
    color: "var(--accent)",
    padding: "6px 10px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 16,
  },
  qtyControls: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "var(--bg-hover)",
    border: "1px solid var(--accent)",
    borderRadius: 8,
    padding: "4px 8px",
  },
  qtyBtn: {
    background: "none",
    border: "none",
    color: "var(--accent)",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    padding: "0 4px",
    lineHeight: 1,
  },
  qtyNum: {
    color: "var(--text)",
    fontSize: 14,
    fontWeight: 600,
    minWidth: 16,
    textAlign: "center",
  },
  cartBtn: {
    background: "var(--accent)",
    color: "var(--accent-text)",
    border: "none",
    padding: "6px 12px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
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
  inquiryOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  inquiryBox: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: 20,
    maxWidth: 400,
    width: "90%",
    boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
  },
  inquiryTitle: {
    color: "var(--text)",
    fontSize: 18,
    marginBottom: 12,
    textAlign: "center",
  },
  inquirySubtitle: {
    color: "var(--text-muted)",
    fontSize: 14,
    lineHeight: 1.5,
    marginBottom: 16,
    whiteSpace: "pre-wrap",
  },
  inquiryActions: {
    display: "flex",
    gap: 10,
    marginTop: 16,
  },
  copyBtn: {
    flex: 1,
    padding: 12,
    background: "var(--bg-hover)",
    border: "1px solid var(--border-light)",
    borderRadius: 8,
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 14,
    color: "var(--text)",
  },
  messengerBtn: {
    flex: 1,
    padding: 12,
    background: "var(--accent)",
    border: "none",
    borderRadius: 8,
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 14,
    color: "var(--accent-text)",
  },
  cancelInquiryBtn: {
    background: "none",
    border: "1px solid var(--border-light)",
    color: "var(--text-muted)",
    padding: 10,
    borderRadius: 6,
    cursor: "pointer",
  },
};