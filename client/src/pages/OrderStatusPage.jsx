import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { API_URL } from "../config/api";
function OrderStatusPage() {
  const { tableId } = useParams();
  const socket = io(API_URL);

  const [activeOrder, setActiveOrder] =
    useState(null);
  
  const [isMuted, setIsMuted] =
    useState(false);

  const [previousStatus, setPreviousStatus] =
    useState(null);
  const [notificationAudio, setNotificationAudio] =
    useState(null);
  
  const [customerComing, setCustomerComing] =
  useState(false);

  const fetchOrder = async () => {
    const response = await fetch(`${API_URL}/orders`);

    const data = await response.json();

    const order = data.find(
      (order) =>
        order.tableId == tableId &&
        order.status !== "Teslim Edildi"
    );

    setActiveOrder(order);
  };

  useEffect(() => {
   fetchOrder();

   socket.on(
    "orderUpdated",
    () => {
      fetchOrder();
    }
   );

   return () => {
    socket.off("orderUpdated");
   };
  }, []);

  useEffect(() => {
   if (
    previousStatus &&
    previousStatus !== activeOrder?.status &&
    activeOrder?.status === "Hazır" &&
    !isMuted
   ) {
    const audio = new Audio(
      "https://actions.google.com/sounds/v1/alarms/medium_bell_ringing_near.ogg"
    );

    audio.volume = 1;
    audio.loop = true;
    audio.play();
    setNotificationAudio(audio);
  
    if (navigator.vibrate) {
      navigator.vibrate([
       300,
       200,
       300,
       200,
       500,
     ]);
    }
    
  }

  setPreviousStatus(activeOrder?.status);
 }, [activeOrder]);

  if (!activeOrder) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(to bottom, #0f172a, #020617)",
          color: "white",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px",
        }}
      >
        <div
          style={{
            background: "#111827",
            boxShadow:"0 20px 40px rgba(0,0,0,0.45)",
            padding: "30px",
            borderRadius: "24px",
            textAlign: "center",
            width: "100%",
            maxWidth: "400px",
          }}
        >
          <h1>Aktif Sipariş Yok</h1>

          <p>
            Yeni sipariş oluşturabilirsiniz.
          </p>
        </div>
      </div>
    );
  }

  const statusColor =
    activeOrder.status === "Hazır"
      ? "#22c55e"
      : "#f97316";

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(to bottom, #0f172a, #020617)",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "#111827",
          boxShadow:"0 20px 40px rgba(0,0,0,0.45)",
          padding: "30px",
          borderRadius: "24px",
          width: "100%",
          maxWidth: "420px",
          border:
            "1px solid rgba(255,255,255,0.08)",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            marginBottom: "10px",
          }}
        >
          Sipariş Takibi
        </h1>

        <h2>
          Masa {activeOrder?.tableId}
        </h2>

        <div
          style={{
            marginTop: "30px",
            fontSize: "36px",
            letterSpacing: "1px",
            fontWeight: "bold",
            color: statusColor,
            textShadow:
              activeOrder.status === "Hazır"
                ? "0 0 18px #22c55e"
                : "0 0 18px #f97316",
              }}
        >
          {activeOrder.status}
        </div>

        <p
          style={{
            marginTop: "20px",
            color: "#cbd5e1",
          }}
        >
          Siparişiniz takip ediliyor
        </p>
        <button
  onClick={() => {
    if (notificationAudio) {
      notificationAudio.pause();

      notificationAudio.currentTime = 0;
    }

    setCustomerComing(true);
  }}
  disabled={customerComing}
  style={{
    marginTop: "20px",
    border: "none",
    background: customerComing
      ? "#334155"
      : "#22c55e",
    color: "white",
    padding: "14px 24px",
    borderRadius: "999px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "16px",
    transform: customerComing
      ? "scale(0.96)"
      : "scale(1)",
    transition: "all 0.25s ease",
    opacity: customerComing ? 0.8 : 1,
  }}
>
  {customerComing
    ? "Geliyorum 👍"
    : "Tamam Geliyorum"}
</button>

        <div
          style={{
            marginTop: "30px",
            textAlign: "left",
          }}
        >
          {activeOrder?.items?.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                marginBottom: "10px",
              }}
            >
              <span>
                {item.name} x{item.quantity}
              </span>

              <span>
                {item.price *
                  item.quantity}
                ₺
              </span>
            </div>
          ))}
        </div>

        <h3
          style={{
            marginTop: "20px",
          }}
        >
          Toplam:
          {activeOrder?.totalPrice}₺
        </h3>
      </div>
    </div>
  );
}

export default OrderStatusPage;