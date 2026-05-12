import orders from "../data/orders.js";
import { io } from "../../index.js";


export const createOrder = (req, res) => {
  const newOrder = {
    id: Date.now(),
    ...req.body,
    status: "Hazırlanıyor", // Sipariş ilk başta bu statüde başlar
    createdAt: new Date(),
  };

  // Aynı masanın teslim edilmemiş (aktif) bir siparişi var mı kontrolü
  const existingOrder = orders.find(
    (order) =>
      order.tableId == req.body.tableId &&
      order.status !== "Teslim Edildi"
  );

  if (existingOrder) {
    return res.status(400).json({
      message: "Bu masanın aktif bir siparişi zaten bulunuyor.",
    });
  }

  orders.push(newOrder);
  io.emit("orderUpdated"); // Tüm ekranlara anlık haber gönderir
  res.status(201).json(newOrder);
};

export const getOrders = (req, res) => {
  res.json(orders);
};

export const updateOrderStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // "Hazırlandı" veya "Teslim Edildi" gelir

  const order = orders.find((order) => order.id == id);

  if (!order) {
    return res.status(404).json({ message: "Sipariş bulunamadı." });
  }

  order.status = status;
  io.emit("orderUpdated"); // Durum değişince anlık güncelleme gönderir
  res.json(order);
};