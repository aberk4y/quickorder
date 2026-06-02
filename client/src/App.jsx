import { Routes, Route } from "react-router-dom";
import MenuPage from "./pages/MenuPage";
import KitchenPage from "./pages/KitchenPage";
import OrderStatusPage from "./pages/OrderStatusPage";
import AdminPage from "./pages/AdminPage";
function App() {
  return (
    <Routes>
      <Route path="/table/:tableId" element={<MenuPage />} />
      <Route path="/kitchen" element={<KitchenPage />} />
      <Route path="/status/:tableId" element={<OrderStatusPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
}

export default App;