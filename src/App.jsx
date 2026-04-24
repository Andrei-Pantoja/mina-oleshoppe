import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { ThemeProvider } from "./context/ThemeContext";
import Navbar from "./components/Navbar";
import StorePage from "./pages/StorePage";
import AdminPage from "./pages/AdminPage";
import "./theme.css";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <HashRouter>
            <Navbar />
            <Routes>
              <Route path="/" element={<StorePage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </HashRouter>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;