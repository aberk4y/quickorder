import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { API_URL } from "../config/api";

/**
 * OrderStatusPage Bileşeni
 * Müşterinin verdiği aktif siparişleri (Hazırlanıyor, Hazır vb.)
 * canlı olarak takip edebildiği ve masaya servis bildirimi alabildiği sayfa.
 */
function OrderStatusPage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const socket = io(API_URL);

  // Sipariş verileri, geçmiş durumlar ve buton onay durumları için state'ler
  const [activeOrders, setActiveOrders] = useState([]);
  const [previousStatuses, setPreviousStatuses] = useState({});
  const [comingOrders, setComingOrders] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  const [notificationAudio, setNotificationAudio] = useState(null);

  /**
   * Mevcut sipariş verilerini API'den çeker
   * Masa ID'sine göre filtrelenmiş ve henüz teslim edilmemiş TÜM siparişleri listeler.
   */
  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/orders`);
      const data = await response.json();

      const tableOrders = data.filter(
        (order) =>
          order.tableId == tableId &&
          order.status !== "Teslim Edildi"
      );

      setActiveOrders(tableOrders);
    } catch (error) {
      console.error("Sipariş verileri alınamadı:", error);
    }
  };

  // Sayfa yüklendiğinde siparişleri çek ve Socket.io dinleyicisini başlat
  useEffect(() => {
    fetchOrders();

    // Mutfak tarafından sipariş güncellendiğinde tetiklenir
    socket.on("orderUpdated", () => {
      fetchOrders();
    });

    // Bileşen kapandığında socket bağlantısını temizle
    return () => {
      socket.off("orderUpdated");
    };
  }, []);

  // Sipariş durumu "Hazır" olduğunda sesli ve titreşimli bildirim tetikler
  useEffect(() => {
    let shouldRing = false;
    const newStatuses = { ...previousStatuses };

    activeOrders.forEach((order) => {
      const prevStatus = previousStatuses[order.id];
      // Eğer sipariş durumu yeni "Hazır" olduysa bildirim tetikle
      if (prevStatus && prevStatus !== order.status && order.status === "Hazır") {
        shouldRing = true;
      }
      newStatuses[order.id] = order.status;
    });

    setPreviousStatuses(newStatuses);

    if (shouldRing && !isMuted) {
      // Sipariş hazır olduğunda çalacak olan çağrı zili sesi
      const audio = new Audio(
        "https://actions.google.com/sounds/v1/alarms/medium_bell_ringing_near.ogg"
      );

      audio.volume = 1;
      audio.loop = true;
      audio.play();
      setNotificationAudio(audio);
  
      // Mobil cihazlar için titreşim bildirimi
      if (navigator.vibrate) {
        navigator.vibrate([300, 200, 300, 200, 500]);
      }
    }
  }, [activeOrders]);

  // Sipariş yoksa uyarı ve menüye dönüş ekranını göster
  if (activeOrders.length === 0) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(to bottom, #0f172a, #020617)",
          color: "white",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px",
        }}
      >
        <div
          style={{
            background: "#111827",
            boxShadow: "0 20px 40px rgba(0,0,0,0.45)",
            padding: "30px",
            borderRadius: "24px",
            textAlign: "center",
            width: "100%",
            maxWidth: "400px",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <h1 style={{ fontSize: "24px", marginBottom: "12px" }}>Aktif Sipariş Yok</h1>
          <p style={{ color: "#94a3b8", marginBottom: "24px" }}>Şu an bu masaya ait aktif bir sipariş bulunmuyor.</p>
          <button
            onClick={() => navigate(`/table/${tableId}`)}
            style={{
              border: "none",
              borderRadius: "14px",
              padding: "14px 28px",
              background: "linear-gradient(to right, #ea580c, #f97316)",
              color: "white",
              fontWeight: "700",
              cursor: "pointer",
              width: "100%",
              boxShadow: "0 6px 16px rgba(234, 88, 12, 0.25)",
            }}
          >
            Menüye Git & Sipariş Ver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom, #0f172a, #020617)",
        color: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 20px",
      }}
    >
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse-glowing {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
      `}</style>

      {/* Menüye Dönüş Butonu */}
      <button
        onClick={() => navigate(`/table/${tableId}`)}
        style={{
          marginBottom: "24px",
          background: "#1e293b",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#cbd5e1",
          padding: "10px 18px",
          borderRadius: "12px",
          cursor: "pointer",
          fontWeight: "600",
          fontSize: "14px",
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          transition: "all 0.2s ease"
        }}
      >
        ← Menüye Git
      </button>

      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <h1 style={{ margin: "0 0 4px 0", fontSize: "32px", fontWeight: "800" }}>Sipariş Takibi</h1>
        <p style={{ margin: "0", color: "#94a3b8", fontSize: "16px", fontWeight: "600" }}>
          Masa {tableId}
        </p>
      </div>

      {/* Sipariş Kartları */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%", maxWidth: "450px" }}>
        {activeOrders.map((order, index) => {
          const statusColor = order.status === "Hazır" ? "#22c55e" : "#f97316";
          const isComing = comingOrders[order.id] || false;

          return (
            <div
              key={order.id}
              style={{
                background: "#111827",
                boxShadow: "0 20px 40px rgba(0,0,0,0.45)",
                padding: "24px",
                borderRadius: "24px",
                border: "1px solid rgba(255,255,255,0.08)",
                textAlign: "center",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px", marginBottom: "16px" }}>
                <span style={{ fontWeight: "700", color: "#94a3b8", fontSize: "13px" }}>
                  SİPARİŞ #{activeOrders.length - index}
                </span>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  {new Date(order.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>

              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  color: statusColor,
                  textShadow:
                    order.status === "Hazır"
                      ? "0 0 14px rgba(34, 197, 94, 0.4)"
                      : "0 0 14px rgba(249, 115, 22, 0.4)",
                }}
              >
                {order.status}
              </div>

              {/* Sipariş Notu varsa göster */}
              {order.note && (
                <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "10px", borderRadius: "10px", marginTop: "12px", border: "1px dashed rgba(255,255,255,0.06)", fontSize: "13px", color: "#cbd5e1" }}>
                  ✍️ Notunuz: "{order.note}"
                </div>
              )}

              {/* SIPARIŞ HAZIRLANIYOR AŞAMASI */}
              {order.status === "Hazırlanıyor" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", marginTop: "18px" }}>
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      border: "3px solid rgba(249, 115, 22, 0.15)",
                      borderTop: "3px solid #f97316",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  <p style={{ margin: 0, color: "#94a3b8", fontSize: "13px" }}>
                    Siparişiniz mutfakta özenle hazırlanıyor... 👨‍🍳
                  </p>
                </div>
              )}

              {/* SIPARIŞ HAZIR AŞAMASI (Ritmik Parıldayan Buton) */}
              {order.status === "Hazır" && (
                <div style={{ marginTop: "18px" }}>
                  <button
                    onClick={() => {
                      if (notificationAudio) {
                        notificationAudio.pause();
                        notificationAudio.currentTime = 0;
                      }
                      setComingOrders({ ...comingOrders, [order.id]: true });
                    }}
                    disabled={isComing}
                    style={{
                      border: "none",
                      background: isComing ? "#1e293b" : "linear-gradient(to right, #22c55e, #16a34a)",
                      color: "white",
                      padding: "12px 24px",
                      borderRadius: "12px",
                      cursor: "pointer",
                      fontWeight: "800",
                      fontSize: "14px",
                      boxShadow: isComing ? "none" : "0 6px 12px rgba(22, 163, 74, 0.25)",
                      animation: isComing ? "none" : "pulse-glowing 2s infinite",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {isComing ? "Gördüm 👍" : "Gördüm, Bekliyorum 🛎️"}
                  </button>
                  <p style={{ marginTop: "8px", color: isComing ? "#cbd5e1" : "#22c55e", fontSize: "13px", fontWeight: "600", margin: "6px 0 0 0" }}>
                    {isComing 
                      ? "Siparişi beklediğinizi personele bildirdik." 
                      : "Garson siparişinizi masanıza getirmek üzere!"}
                  </p>
                </div>
              )}

              {/* Sipariş detay listesi */}
              <div
                style={{
                  marginTop: "20px",
                  textAlign: "left",
                  borderTop: "1px dashed rgba(255,255,255,0.06)",
                  paddingTop: "16px",
                }}
              >
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                      fontSize: "14px",
                      color: "#cbd5e1"
                    }}
                  >
                    <span>
                      {item.name} x{item.quantity}
                    </span>
                    <span>
                      {item.price * item.quantity}₺
                    </span>
                  </div>
                ))}
              </div>

              <h4
                style={{
                  marginTop: "16px",
                  marginBottom: 0,
                  fontSize: "16px",
                  fontWeight: "700",
                  textAlign: "right",
                }}
              >
                Tutar: {order.totalPrice}₺
              </h4>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default OrderStatusPage;