import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function LoginModal({ onClose }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      onClose();
      navigate("/admin");
    } catch {
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.title}>Admin Login</h3>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleLogin} style={styles.form}>
          <input type="email" placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)} style={styles.input} required />
          <input type="password" placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)} style={styles.input} required />
          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <button onClick={onClose} style={styles.cancel}>Cancel</button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed", inset: 0, background: "var(--overlay)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999,
  },
  modal: {
    background: "var(--bg-card)", border: "1px solid var(--border)",
    borderRadius: 12, padding: 32, width: 320,
    display: "flex", flexDirection: "column", gap: 12,
  },
  title: { color: "var(--accent)", margin: 0, fontSize: 18 },
  error: { color: "var(--danger)", fontSize: 13, margin: 0 },
  form: { display: "flex", flexDirection: "column", gap: 10 },
  input: {
    padding: "10px 12px", borderRadius: 8,
    border: "1px solid var(--border-light)",
    background: "var(--bg-input)", color: "var(--text)",
    fontSize: 14, outline: "none",
  },
  btn: {
    padding: 11, background: "var(--accent)", color: "var(--accent-text)",
    border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer",
  },
  cancel: {
    background: "none", border: "none", color: "var(--text-dim)",
    cursor: "pointer", fontSize: 13, textAlign: "center",
  },
};