import express from "express";
import {
  createOrder,
  getOrders,
  updateOrderStatus,
} from "../controllers/orderController.js";

const router = express.Router();

router.get("/", getOrders);               // Siparişleri listeler
router.post("/", createOrder);            // Yeni sipariş oluşturur
router.patch("/:id", updateOrderStatus);  // Sipariş durumunu günceller

export default router;