import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import LoginModal from "./LoginModal";
import logo from "../assets/minashop.png";
import adminLogo from "../assets/admin-logo.png";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showLogin, setShowLogin] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isDark = theme === "dark";

  return (
    <>
      <nav style={{
        display: "flex",
        alignItems: "center",
        padding: "10px 16px",
        borderBottom: "2px solid #d4ed00",
        background: isDark ? "#1a1a1a" : "#ffffff",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        gap: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", minWidth: 0 }}>
          <img src={logo} alt="Mina OleShoppe" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />
          <span style={{ color: "#d4ed00", fontWeight: 700, fontSize: 16, letterSpacing: 0.5 }}>
            Mina OleShoppe
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", marginLeft: "auto", gap: 10 }}>
          <button
            onClick={toggleTheme}
            title="Toggle theme"
            style={{
              background: isDark ? "#2a2a2a" : "#f0f0f0",
              border: `1px solid ${isDark ? "#444" : "#ccc"}`,
              borderRadius: 8,
              padding: "6px 10px",
              cursor: "pointer",
              fontSize: 16,
              lineHeight: 1,
            }}
          >
            {isDark ? "☀️" : "🌙"}
          </button>

          {user ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
              <Link to="/admin" style={{ color: "#d4ed00", fontWeight: 600, fontSize: 12, textDecoration: "none" }}>
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  background: "none",
                  border: `1px solid ${isDark ? "#555" : "#ccc"}`,
                  color: isDark ? "#aaa" : "#555",
                  borderRadius: 6,
                  padding: "4px 10px",
                  cursor: "pointer",
                  fontSize: 11,
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              title="Admin Login"
              style={{
                background: "rgba(212,237,0,0.15)",
                border: "1.5px solid #d4ed00",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 42,
                height: 42,
                flexShrink: 0,
                padding: 0,
              }}
            >
              <img
                src={adminLogo}
                alt="Admin"
                style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", display: "block" }}
              />
            </button>
          )}
        </div>
      </nav>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
}