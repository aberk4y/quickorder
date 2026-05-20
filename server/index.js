import express from "express";
import cors from "cors";
import http from "http";

import { Server } from "socket.io";

import productRoutes from "./src/routes/productRoutes.js";
import orderRoutes from "./src/routes/orderRoutes.js";

const app = express();

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Sipariş aciliyet bildirimini (Siparişim Nerede?) mutfak paneline anlık ileten soket köprüsü
io.on("connection", (socket) => {
  socket.on("orderReminder", (data) => {
    io.emit("kitchenReminder", data);
  });
});

app.use(cors());

app.use(express.json());

app.use("/products", productRoutes);

app.use("/orders", orderRoutes);

app.get("/", (req, res) => {
  res.send("QuickOrder API running");
});

const PORT = 5000;

server.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});
