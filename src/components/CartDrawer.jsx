import { useCart } from "../context/CartContext";

export default function CartDrawer({ open, onClose }) {
  const { cart, removeFromCart } = useCart();

  const total = cart.reduce(
    (sum, item) => sum + Number(item.price || 0),
    0
  );

  return (
    <>
      {open && <div style={styles.overlay} onClick={onClose} />}

      <div
        style={{
          ...styles.drawer,
          right: open ? 0 : "-350px",
        }}
      >
        <div style={styles.header}>
          <h3>🛒 Your Cart</h3>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <div style={styles.content}>
          {cart.length === 0 ? (
            <p style={styles.empty}>Your cart is empty</p>
          ) : (
            cart.map((item, index) => (
              <div key={index} style={styles.item}>
                <img
                  src={
                    item.images?.[0] ||
                    item.imageUrl ||
                    "https://via.placeholder.com/60"
                  }
                  alt={item.name}
                  style={styles.itemImage}
                />

                <div style={{ flex: 1 }}>
                  <p style={styles.name}>{item.name}</p>
                  <p style={styles.price}>
                    ₱{Number(item.price).toLocaleString()}
                  </p>
                </div>

                <button
                  onClick={() => removeFromCart(index)}
                  style={styles.removeBtn}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div style={styles.footer}>
            <h4>Total: ₱{total.toLocaleString()}</h4>

            <a
              href={cart[0]?.facebookUrl || "#"}
              target="_blank"
              rel="noreferrer"
              style={styles.checkoutBtn}
            >
              Checkout via Facebook
            </a>
          </div>
        )}
      </div>
    </>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    zIndex: 998,
  },
  drawer: {
    position: "fixed",
    top: 0,
    width: 350,
    height: "100%",
    background: "#111",
    color: "#fff",
    zIndex: 999,
    display: "flex",
    flexDirection: "column",
    transition: "0.3s",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    padding: 16,
    borderBottom: "1px solid #222",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#fff",
    cursor: "pointer",
  },
  content: {
    flex: 1,
    overflowY: "auto",
    padding: 16,
  },
  empty: {
    textAlign: "center",
    color: "#777",
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
    paddingBottom: 10,
    borderBottom: "1px solid #222",
  },
  itemImage: {
    width: 50,
    height: 50,
    objectFit: "cover",
    borderRadius: 8,
  },
  name: {
    margin: 0,
    fontSize: 14,
  },
  price: {
    margin: 0,
    color: "#d4ed00",
    fontWeight: 700,
  },
  removeBtn: {
    background: "none",
    border: "none",
    color: "#888",
    cursor: "pointer",
  },
  footer: {
    padding: 16,
    borderTop: "1px solid #222",
  },
  checkoutBtn: {
    display: "block",
    marginTop: 10,
    background: "#d4ed00",
    color: "#111",
    textAlign: "center",
    padding: 12,
    borderRadius: 10,
    textDecoration: "none",
    fontWeight: 700,
  },
};