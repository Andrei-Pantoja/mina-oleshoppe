import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext"; 
import Navbar from "./components/Navbar";
import StorePage from "./pages/StorePage";
import AdminPage from "./pages/AdminPage";

function App() {
  return (
    <AuthProvider>
      <CartProvider> 
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<StorePage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;