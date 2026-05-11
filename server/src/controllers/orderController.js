import orders from "../data/orders.js";
import { io } from "../../index.js";


export const createOrder = (req, res) => {
  const newOrder = {
    id: Date.now(),
    ...req.body,
    status: "Hazırlanıyor",
    createdAt: new Date(),
  };
  const existingOrder = orders.find(
  (order) =>
    order.tableId == req.body.tableId &&
    order.status !== "Teslim Edildi"
  );

 if (existingOrder) {
  return res.status(400).json({
    message:
      "Bu masanın aktif siparişi bulunuyor.",
  });
  }
  orders.push(newOrder);
  io.emit("orderUpdated");

  res.status(201).json(newOrder);
};

export const getOrders = (req, res) => {
  res.json(orders);
};

export const updateOrderStatus = (req, res) => {
  const { id } = req.params;

  const { status } = req.body;

  const order = orders.find(
    (order) => order.id == id
  );

  if (!order) {
    return res
      .status(404)
      .json({
        message: "Order not found",
      });
  }

  order.status = status;
  io.emit("orderUpdated");

  res.json(order);
};