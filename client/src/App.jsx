import { Routes, Route } from "react-router-dom";
import MenuPage from "./pages/MenuPage";
import KitchenPage from "./pages/KitchenPage";
import OrderStatusPage from "./pages/OrderStatusPage";
function App() {
  return (
    <Routes>
      <Route path="/table/:tableId" element={<MenuPage />} />
      <Route path="/kitchen" element={<KitchenPage />} />
      <Route path="/status/:tableId" element={<OrderStatusPage />} />
    </Routes>
  );
}

export default App;