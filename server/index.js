import dotenv from "dotenv";
dotenv.config(); // .env dosyasındaki verileri yüklemek için en üstte kalmalı

import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import Iyzipay from "iyzipay";

// Mevcut Rotaların (Routes)
import productRoutes from "./src/routes/productRoutes.js";
import orderRoutes from "./src/routes/orderRoutes.js";

const app = express();

// Middleware Ayarları (Sadece birer kez tanımlanmalı)
app.use(cors());
app.use(express.json());

// 1. iyzico API Başlatma (Güvenli .env Entegrasyonu)
const iyzipay = new Iyzipay({
  apiKey: process.env.IYZICO_API_KEY,
  secretKey: process.env.IYZICO_SECRET_KEY,
  uri: 'https://sandbox-api.iyzipay.com'
});

// HTTP Sunucusu ve Socket.io Kurulumu
const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Standart Rotalarınız
app.use("/products", productRoutes);
app.use("/orders", orderRoutes);

app.get("/", (req, res) => {
  res.send("QuickOrder API running");
});

// 2. Birleştirilmiş iyzico Ödeme İşlem Endpoint'i
app.post('/api/payment/process', (req, res) => {
    const { cart, totalPrice, cardDetails, tableId } = req.body;

    const basketId = 'B' + uuidv4().substring(0, 8);
    const conversationId = uuidv4();

    const requestData = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: conversationId,
        price: totalPrice.toString(),
        paidPrice: totalPrice.toString(),
        currency: Iyzipay.CURRENCY.TL,
        basketId: basketId,
        paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
        paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
        paymentCard: {
            cardHolderName: cardDetails.cardHolderName,
            cardNumber: cardDetails.cardNumber.replace(/\s/g, ''), // Boşlukları temizle
            expireMonth: cardDetails.expiryMonth,
            expireYear: cardDetails.expiryYear,
            cvc: cardDetails.cvv,
            registerCard: 0
        },
        buyer: {
            id: 'BY789',
            name: 'Berkay',
            surname: 'Müşteri',
            gsmNumber: '+905555555555',
            email: 'berkay@test.com',
            identityNumber: '11111111111',
            lastLoginDate: '2026-06-03 00:00:00',
            registrationDate: '2026-01-01 00:00:00',
            registrationAddress: 'Kadikoy, Istanbul',
            ip: req.ip || '85.105.105.105',
            city: 'Istanbul',
            country: 'Turkey',
            zipCode: '34000'
        },
        shippingAddress: {
            contactName: 'Masa ' + tableId,
            city: 'Istanbul',
            country: 'Turkey',
            address: 'QuickOrder Restorani Masa ' + tableId,
            zipCode: '34000'
        },
        billingAddress: {
            contactName: 'Berkay Musteri',
            city: 'Istanbul',
            country: 'Turkey',
            address: 'QuickOrder Fatura Adresi',
            zipCode: '34000'
        },
        basketItems: cart.map((item) => ({
    id: 'PR' + item.id,
    name: item.name,
    category1: item.category || 'Yemek', // <--- category1 yaptık!
    itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
    price: (item.price * item.quantity).toString()
}))
    };

    iyzipay.payment.create(requestData, function (err, result) {
        if (err || result.status === 'failure') {
            console.error('iyzico Hatası:', result);
            return res.status(400).json({
                success: false,
                message: result.errorMessage || 'Ödeme banka tarafından reddedildi.'
            });
        }
        
        return res.status(200).json({
            success: true,
            paymentId: result.paymentId,
            message: 'Ödeme başarıyla tahsil edildi.'
        });
    });
});

// Sunucunun ayağa kalktığı ana port dinleyicisi
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});