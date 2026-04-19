import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoginModal from "./LoginModal";
import logo from "../assets/minashop.png";
import adminLogo from "../assets/admin-logo.png";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <>
      <nav style={styles.nav}>
        {/* LEFT: Logo */}
        <Link to="/" style={styles.brand}>
          <img src={logo} alt="Mina OleShoppe" style={styles.logo} />
          <span style={styles.brandText}>Mina OleShoppe</span>
        </Link>

        {/* RIGHT: Admin / Login */}
        <div style={styles.right}>
          {user ? (
            <div style={styles.adminBar}>
              <Link to="/admin" style={styles.adminLink}>
                Dashboard
              </Link>
              <button onClick={handleLogout} style={styles.logoutBtn}>
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              style={styles.hiddenAdminBtn}
              title="Admin"
            >
              <img src={adminLogo} alt="Admin" style={styles.adminIcon} />
            </button>
          )}
        </div>
      </nav>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
}

const styles = {
  nav: {
    display: "flex",
    alignItems: "center",
    padding: "10px 16px",
    borderBottom: "2px solid #d4ed00",
    width: "100%",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    textDecoration: "none",
    minWidth: 0, // 🔥 prevents overflow
  },

  logo: {
    width: 40, // 🔥 smaller for mobile
    height: 40,
    borderRadius: "50%",
    objectFit: "cover",
  },

  brandText: {
    color: "#d4ed00",
    fontWeight: 700,
    fontSize: 16, // 🔥 mobile-friendly
    letterSpacing: 0.5,
  },

  right: {
    display: "flex",
    alignItems: "center",
    marginLeft: "auto", // 🔥 pushes to right
  },

  adminBar: {
    display: "flex",
    flexDirection: "column", // Dashboard above Logout
    alignItems: "flex-end",
    gap: 6,
  },

  adminLink: {
    color: "#d4ed00",
    fontWeight: 600,
    fontSize: 12,
    textDecoration: "none",
  },

  logoutBtn: {
    background: "none",
    border: "1px solid #555",
    color: "#aaa",
    borderRadius: 6,
    padding: "4px 10px",
    cursor: "pointer",
    fontSize: 11,
  },

  hiddenAdminBtn: {
    background: "transparent",
    border: "1px solid rgba(212, 237, 0, 0.4)",
    padding: 4,
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  adminIcon: {
    width: 24,
    height: 24,
    borderRadius: "50%",
    objectFit: "cover",
  },
};