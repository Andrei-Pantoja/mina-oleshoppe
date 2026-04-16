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
        <Link to="/" style={styles.brand}>
          <img src={logo} alt="Mina OleShoppe" style={styles.logo} />
          <span style={styles.brandText}>Mina OleShoppe</span>
        </Link>

        <div style={styles.right}>
          <span style={styles.tagline}>Action Camera Accessories</span>

          {user ? (
            <div style={styles.adminBar}>
              <Link to="/admin" style={styles.adminLink}>Dashboard</Link>
              <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
            </div>
          ) : (
            // Small, subtle admin button — not obvious to regular visitors
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
    justifyContent: "space-between",
    padding: "16px 32px",
    backgroundColor: "#1a1a1a",
    borderBottom: "3px solid #d4ed00",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    textDecoration: "none",
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    objectFit: "cover",
  },
  brandText: {
    color: "#d4ed00",
    fontWeight: 700,
    fontSize: 22,
    letterSpacing: 1,
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  tagline: {
    color: "#888",
    fontSize: 13,
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
  transition: "0.2s",
},
hiddenAdminBtnHover: {
  boxShadow: "0 0 8px rgba(212, 237, 0, 0.6)",
},
adminIcon: {
  width: 28,
  height: 28,
  borderRadius: "50%",
  objectFit: "cover",
},
  adminBar: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  adminLink: {
    color: "#d4ed00",
    fontWeight: 600,
    fontSize: 14,
    textDecoration: "none",
  },
  logoutBtn: {
    background: "none",
    border: "1px solid #555",
    color: "#aaa",
    borderRadius: 6,
    padding: "4px 12px",
    cursor: "pointer",
    fontSize: 13,
  },
};
