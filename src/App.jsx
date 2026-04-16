import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext"; 
import Navbar from "./components/Navbar";
import StorePage from "./pages/StorePage";
import AdminPage from "./pages/AdminPage";

function App() {
  return (
    <AuthProvider>
      <CartProvider> 
        <HashRouter basename="/mina-oleshoppe">
          <Navbar />
          <Routes>
            <Route path="/" element={<StorePage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </HashRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;