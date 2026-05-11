import express from "express";
import {
  createOrder,
  getOrders,
  updateOrderStatus,
} from "../controllers/orderController.js";

const router = express.Router();
router.put("/:id", updateOrderStatus);
router.post("/", createOrder);

router.get("/", getOrders);

export default router;