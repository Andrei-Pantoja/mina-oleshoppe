import { useCart } from "../context/CartContext";

export default function CartDrawer({ open, onClose, onCheckout }) {
  const { cart, removeFromCart, updateQuantity } = useCart();

  const total = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * (item.quantity || 1), 0
  );

  return (
    <>
      {open && <div style={styles.overlay} onClick={onClose} />}
      <div style={{ ...styles.drawer, right: open ? 0 : "-350px" }}>
        <div style={styles.header}>
          <h3 style={{ color: "var(--text)" }}>🛒 Your Cart</h3>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <div style={styles.content}>
          {cart.length === 0 ? (
            <p style={styles.empty}>Your cart is empty</p>
          ) : (
            cart.map((item) => (
              <div key={item.id} style={styles.item}>
                <img
                  src={item.images?.[0] || item.imageUrl || "https://via.placeholder.com/60"}
                  alt={item.name} style={styles.itemImage}
                />
                <div style={{ flex: 1 }}>
                  <p style={styles.name}>{item.name}</p>
                  <p style={styles.price}>
                    ₱{(Number(item.price) * (item.quantity || 1)).toLocaleString()}
                  </p>
                  <div style={styles.qtyControls}>
                    <button style={styles.qtyBtn} onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}>−</button>
                    <span style={styles.qtyNum}>{item.quantity || 1}</span>
                    <button style={styles.qtyBtn} onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}>+</button>
                  </div>
                </div>
                <button onClick={() => removeFromCart(item.id)} style={styles.removeBtn}>✕</button>
              </div>
            ))
          )}
        </div>

        <div style={styles.footer}>
          {cart.length > 0 && (
            <>
              <h4 style={{ color: "var(--text)", margin: 0 }}>Total: ₱{total.toLocaleString()}</h4>
              <button onClick={() => { onClose(); onCheckout(); }} style={styles.checkoutBtn}>
                💬 Checkout via Facebook
              </button>
            </>
          )}
          <button onClick={onClose} style={styles.closeBottomBtn}>
            Close
          </button>
        </div>
      </div>
    </>
  );
}

const styles = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 998 },
  drawer: {
    position: "fixed", top: 0, right: 0,
    width: 350, height: "100%",
    background: "var(--bg-card)", color: "var(--text)",
    zIndex: 999, display: "flex", flexDirection: "column",
    transition: "0.3s", borderLeft: "1px solid var(--border)",
  },
  header: {
    display: "flex", justifyContent: "space-between",
    padding: 16, borderBottom: "1px solid var(--border)",
  },
  closeBtn: {
    background: "var(--bg-hover)",
    border: "1px solid var(--border-light)",
    color: "var(--text)",
    cursor: "pointer",
    width: 34,
    height: 34,
    borderRadius: 10,
    fontSize: 18,
    lineHeight: 1,
  },
  content: { flex: 1, overflowY: "auto", padding: 16 },
  empty: { textAlign: "center", color: "var(--text-muted)" },
  item: {
    display: "flex", alignItems: "flex-start", gap: 10,
    marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid var(--border)",
  },
  itemImage: { width: 50, height: 50, objectFit: "cover", borderRadius: 8, flexShrink: 0 },
  name: { margin: 0, fontSize: 14, color: "var(--text)" },
  price: { margin: "2px 0 6px", color: "var(--accent)", fontWeight: 700 },
  qtyControls: {
    display: "flex", alignItems: "center", gap: 8,
    background: "var(--bg-input)", border: "1px solid var(--border-light)",
    borderRadius: 6, padding: "2px 8px", width: "fit-content",
  },
  qtyBtn: {
    background: "none", border: "none", color: "var(--accent)",
    fontSize: 16, fontWeight: 700, cursor: "pointer", padding: "0 2px", lineHeight: 1,
  },
  qtyNum: { color: "var(--text)", fontSize: 13, minWidth: 16, textAlign: "center" },
  removeBtn: { background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", paddingTop: 2 },
  footer: { padding: 16, borderTop: "1px solid var(--border)", display: "grid", gap: 10 },
  checkoutBtn: {
    display: "block", width: "100%", marginTop: 10,
    background: "var(--accent)", color: "var(--accent-text)",
    textAlign: "center", padding: 12, borderRadius: 10,
    fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer",
    boxSizing: "border-box",
  },
  closeBottomBtn: {
    display: "block",
    width: "100%",
    background: "none",
    border: "1px solid var(--border-light)",
    color: "var(--text-muted)",
    textAlign: "center",
    padding: 10,
    borderRadius: 10,
    fontWeight: 700,
    cursor: "pointer",
  },
};