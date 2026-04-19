import { useCart } from "../context/CartContext";

export default function CartDrawer({ open, onClose, onCheckout }) {
  const { cart, removeFromCart, updateQuantity } = useCart();

  const total = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * (item.quantity || 1),
    0
  );

  return (
    <>
      {open && <div style={styles.overlay} onClick={onClose} />}

      <div style={{ ...styles.drawer, right: open ? 0 : "-350px" }}>
        <div style={styles.header}>
          <h3>🛒 Your Cart</h3>
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
                  alt={item.name}
                  style={styles.itemImage}
                />

                <div style={{ flex: 1 }}>
                  <p style={styles.name}>{item.name}</p>
                  <p style={styles.price}>
                    ₱{(Number(item.price) * (item.quantity || 1)).toLocaleString()}
                  </p>

                  {/* Quantity controls */}
                  <div style={styles.qtyControls}>
                    <button
                      style={styles.qtyBtn}
                      onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                    >−</button>
                    <span style={styles.qtyNum}>{item.quantity || 1}</span>
                    <button
                      style={styles.qtyBtn}
                      onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                    >+</button>
                  </div>
                </div>

                <button onClick={() => removeFromCart(item.id)} style={styles.removeBtn}>✕</button>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div style={styles.footer}>
            <h4>Total: ₱{total.toLocaleString()}</h4>
            <button
              onClick={() => { onClose(); onCheckout(); }}
              style={styles.checkoutBtn}
            >
              💬 Checkout via Messenger
            </button>
          </div>
        )}
      </div>
    </>
  );
}

const styles = {
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.6)", zIndex: 998,
  },
  drawer: {
    position: "fixed", top: 0,
    width: 350, height: "100%",
    background: "#111", color: "#fff",
    zIndex: 999, display: "flex",
    flexDirection: "column", transition: "0.3s",
  },
  header: {
    display: "flex", justifyContent: "space-between",
    padding: 16, borderBottom: "1px solid #222",
  },
  closeBtn: { background: "none", border: "none", color: "#fff", cursor: "pointer" },
  content: { flex: 1, overflowY: "auto", padding: 16 },
  empty: { textAlign: "center", color: "#777" },
  item: {
    display: "flex", alignItems: "flex-start",
    gap: 10, marginBottom: 12,
    paddingBottom: 10, borderBottom: "1px solid #222",
  },
  itemImage: { width: 50, height: 50, objectFit: "cover", borderRadius: 8, flexShrink: 0 },
  name: { margin: 0, fontSize: 14 },
  price: { margin: "2px 0 6px", color: "#d4ed00", fontWeight: 700 },
  qtyControls: {
    display: "flex", alignItems: "center", gap: 8,
    background: "#1a1a1a", border: "1px solid #333",
    borderRadius: 6, padding: "2px 8px", width: "fit-content",
  },
  qtyBtn: {
    background: "none", border: "none",
    color: "#d4ed00", fontSize: 16, fontWeight: 700,
    cursor: "pointer", padding: "0 2px", lineHeight: 1,
  },
  qtyNum: { color: "#fff", fontSize: 13, minWidth: 16, textAlign: "center" },
  removeBtn: { background: "none", border: "none", color: "#555", cursor: "pointer", paddingTop: 2 },
  footer: { padding: 16, borderTop: "1px solid #222" },
  checkoutBtn: {
    display: "block", width: "100%",
    marginTop: 10, background: "#d4ed00",
    color: "#111", textAlign: "center",
    padding: 12, borderRadius: 10,
    fontWeight: 700, fontSize: 15,
    border: "none", cursor: "pointer",
    boxSizing: "border-box",
  },
};