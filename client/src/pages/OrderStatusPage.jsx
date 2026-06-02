import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom"; // useNavigate eklendi
import { io } from "socket.io-client";
import { API_URL } from "../config/api";

// Canlı Geri Sayım İçin Yardımcı Alt Bileşen (Müşteri Takip Tarafı)
function StatusCountdown({ createdAt, estimatedTime, orderStatus }) {
  const [displayTime, setDisplayTime] = useState("");

  useEffect(() => {
    if (orderStatus === "Hazır") {
      setDisplayTime("00:00");
      return;
    }

    const updateTimer = () => {
      const createdTime = new Date(createdAt).getTime();
      const duration = (estimatedTime || 15) * 60 * 1000;
      const targetTime = createdTime + duration;
      const now = new Date().getTime();
      const diff = targetTime - now;

      if (diff <= 0) {
        setDisplayTime("Hazırlanıyor...");
      } else {
        const mins = Math.floor(diff / (60 * 1000));
        const secs = Math.floor((diff % (60 * 1000)) / 1000);
        setDisplayTime(`${mins}:${secs < 10 ? "0" : ""}${secs}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [createdAt, estimatedTime, orderStatus]);

  return (
    <div
      style={{
        margin: "24px auto",
        width: "140px",
        height: "140px",
        borderRadius: "50%",
        border: orderStatus === "Hazır" ? "3px solid #30d158" : "3px solid #ff9f0a",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.02)",
        boxShadow: orderStatus === "Hazır" ? "0 0 20px rgba(48, 209, 88, 0.2)" : "0 0 20px rgba(255, 159, 10, 0.1)",
      }}
    >
      <span style={{ fontSize: "11px", color: "#8e8e93", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.5px" }}>Kalan Süre</span>
      <span style={{ fontSize: displayTime.length > 5 ? "16px" : "26px", fontWeight: "700", fontFamily: "monospace", marginTop: "4px" }}>
        {displayTime}
      </span>
    </div>
  );
}

function OrderStatusPage() {
  const { tableId } = useParams();
  const navigate = useNavigate(); // Menüye yönlendirme için navigasyon tanımı
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

  // Durum 1: image_2f532a.png görselindeki Aktif Sipariş Yok Modu (Yenilenen Alan)
  if (!activeOrder) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#000000", 
          color: "white",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
        }}
      >
        <div
          style={{
            background: "#1c1c1e", 
            padding: "40px 30px",
            borderRadius: "24px",
            textAlign: "center",
            width: "100%",
            maxWidth: "380px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            border: "1px solid rgba(255,255,255,0.02)",
          }}
        >
          <h1 style={{ fontSize: "24px", fontWeight: "700", margin: "0 0 10px 0", letterSpacing: "-0.5px" }}>Aktif Sipariş Yok</h1>

          <p style={{ color: "#8e8e93", fontSize: "15px", margin: "0 0 24px 0" }}>
            Siparişiniz tamamlandı veya henüz bir istek oluşturulmadı.
          </p>

          {/* Menüye Dönüş Butonu (Sipariş yokken) */}
          <button
            onClick={() => navigate(`/table/${tableId}`)}
            style={{
              width: "100%",
              border: "none",
              background: "#ffffff",
              color: "#000000",
              padding: "14px",
              borderRadius: "16px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "15px",
              boxShadow: "0 4px 12px rgba(255, 255, 255, 0.1)",
              transition: "opacity 0.2s"
            }}
          >
            Menüye Geri Dön
          </button>
        </div>
      </div>
    );
  }

  const statusColor =
    activeOrder.status === "Hazır"
      ? "#30d158" 
      : "#ff9f0a"; 

  // Durum 2: Sipariş Hazırlanırken veya Hazırken Takip Ekranı
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000000", 
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
      }}
    >
      <div
        style={{
          background: "#1c1c1e",
          boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
          padding: "32px",
          borderRadius: "28px", 
          width: "100%",
          maxWidth: "400px",
          border: "1px solid rgba(255,255,255,0.05)",
          textAlign: "center",
          boxSizing: "border-box"
        }}
      >
        <h1
          style={{
            fontSize: "22px",
            fontWeight: "700",
            letterSpacing: "-0.5px",
            margin: "0 0 4px 0",
          }}
        >
          Sipariş Durumu
        </h1>

        <h2
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#8e8e93",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            margin: "0 0 10px 0",
          }}
        >
          Masa {activeOrder?.tableId}
        </h2>

        {/* Canlı Geri Sayım Çemberi */}
        <StatusCountdown 
          createdAt={activeOrder.createdAt} 
          estimatedTime={activeOrder.estimatedTime} 
          orderStatus={activeOrder.status}
        />

        {/* Durum Gösterge Alanı */}
        <div
          style={{
            margin: "10px 0 20px 0",
            padding: "16px",
            borderRadius: "18px",
            background: activeOrder.status === "Hazır" ? "rgba(48, 209, 88, 0.08)" : "rgba(255, 159, 10, 0.08)",
            border: activeOrder.status === "Hazır" ? "1px solid rgba(48, 209, 88, 0.15)" : "1px solid rgba(255, 159, 10, 0.15)",
            fontSize: "24px",
            letterSpacing: "-0.5px",
            fontWeight: "700",
            color: statusColor,
          }}
        >
          {activeOrder.status}
        </div>

        {activeOrder.note && (
          <div
            style={{
              fontSize: "13px",
              color: "#ff9f0a",
              backgroundColor: "rgba(255, 159, 10, 0.05)",
              padding: "10px",
              borderRadius: "10px",
              textAlign: "left",
              marginBottom: "20px",
              border: "1px solid rgba(255, 159, 10, 0.1)",
              lineHeight: "1.4"
            }}
          >
            📝 <strong>İletilen Notunuz:</strong> {activeOrder.note}
          </div>
        )}

        <p
          style={{
            marginTop: "16px",
            color: "#aeaeb2",
            fontSize: "14px",
            marginBottom: "24px",
          }}
        >
          Siparişiniz canlı olarak güncellenmektedir.
        </p>

        {/* Eylem Butonları Alanı */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          
          {/* Müşteri Yanıt Butonu */}
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
              width: "100%",
              border: "none",
              background: customerComing ? "#2c2c2e" : "#0a84ff", 
              color: customerComing ? "#8e8e93" : "white",
              padding: "16px",
              borderRadius: "16px",
              cursor: customerComing ? "default" : "pointer",
              fontWeight: "600",
              fontSize: "16px",
              transform: customerComing ? "scale(0.98)" : "scale(1)",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: customerComing ? "none" : "0 4px 12px rgba(10, 132, 255, 0.3)",
            }}
          >
            {customerComing ? "Geliyorum 👍" : "Tamam, Geliyorum"}
          </button>

          {/* Menüye Dönüş Butonu (Sipariş hazırlanırken ek ürün seçebilmek için) */}
          <button
            onClick={() => navigate(`/table/${tableId}`)}
            style={{
              width: "100%",
              border: "none",
              background: "rgba(255, 255, 255, 0.05)",
              color: "#ffffff",
              padding: "14px",
              borderRadius: "16px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "15px",
              transition: "all 0.2s",
              border: "1px solid rgba(255, 255, 255, 0.08)"
            }}
          >
            Yeni Ürün Ekle (Menüye Dön)
          </button>
        </div>

        {/* Sipariş Özeti Çizgisi */}
        <div
          style={{
            marginTop: "32px",
            textAlign: "left",
            borderTop: "1px solid rgba(255, 255, 255, 0.06)",
            paddingTop: "20px",
          }}
        >
          <div style={{ fontSize: "13px", fontWeight: "600", color: "#8e8e93", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Sipariş Detayı</div>
          {activeOrder?.items?.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "10px",
                fontSize: "15px",
                color: "#e5e5ea",
              }}
            >
              <span>
                {item.name} <span style={{ color: "#8e8e93", fontSize: "13px", marginLeft: "4px" }}>x{item.quantity}</span>
              </span>

              <span style={{ fontWeight: "500" }}>
                {item.price * item.quantity} ₺
              </span>
            </div>
          ))}
        </div>

        {/* Toplam Ücret */}
        <div
          style={{
            marginTop: "20px",
            paddingTop: "16px",
            borderTop: "1px dashed rgba(255, 255, 255, 0.06)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <span style={{ fontSize: "16px", color: "#aeaeb2", fontWeight: "500" }}>Toplam Tutar</span>
          <span style={{ fontSize: "20px", fontWeight: "700", color: "#ffffff" }}>
            {activeOrder?.totalPrice} ₺
          </span>
        </div>
      </div>
    </div>
  );
}

export default OrderStatusPage;