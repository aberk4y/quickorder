import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { API_URL } from "../config/api";

const PRIORITY_COLORS = {
  Normal: "#0a84ff",  // Apple Mavi
  Yüksek: "#ff9f0a",  // Apple Turuncu
  Acil: "#ff453a",    // Apple Kırmızı
};

// Canlı Geri Sayım İçin Yardımcı Alt Bileşen (Mutfak Tarafı)
function KitchenCountdown({ createdAt, estimatedTime, orderStatus }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isOvertime, setIsOvertime] = useState(false);

  useEffect(() => {
    if (orderStatus === "Hazır") {
      setTimeLeft("Hazır");
      return;
    }

    const calculateTime = () => {
      const createdDate = new Date(createdAt).getTime();
      const duration = (estimatedTime || 15) * 60 * 1000; // Varsayılan 15 dk
      const targetTime = createdDate + duration;
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference <= 0) {
        setIsOvertime(true);
        const positiveDiff = Math.abs(difference);
        const mins = Math.floor(positiveDiff / (60 * 1000));
        const secs = Math.floor((positiveDiff % (60 * 1000)) / 1000);
        setTimeLeft(`Gecikme: -${mins}:${secs < 10 ? "0" : ""}${secs}`);
      } else {
        setIsOvertime(false);
        const mins = Math.floor(difference / (60 * 1000));
        const secs = Math.floor((difference % (60 * 1000)) / 1000);
        setTimeLeft(`${mins}:${secs < 10 ? "0" : ""}${secs}`);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [createdAt, estimatedTime, orderStatus]);

  return (
    <div
      style={{
        fontSize: "16px",
        fontWeight: "700",
        color: orderStatus === "Hazır" ? "#30d158" : isOvertime ? "#ff453a" : "#ffffff",
        backgroundColor: isOvertime && orderStatus !== "Hazır" ? "rgba(255, 69, 58, 0.12)" : "rgba(255,255,255,0.04)",
        padding: "8px 12px",
        borderRadius: "10px",
        border: isOvertime && orderStatus !== "Hazır" ? "1px solid rgba(255, 69, 58, 0.25)" : "1px solid rgba(255,255,255,0.05)",
        textAlign: "center",
        fontFamily: "monospace",
        marginTop: "12px",
        letterSpacing: "0.5px"
      }}
    >
       {timeLeft}
    </div>
  );
}


function KitchenPage() {
  const socket = io(API_URL);
  const [orders, setOrders] = useState([]);
  const [showHistory, setShowHistory] =
    useState(false);

  const fetchOrders = async () => {
    const response = await fetch(
      `${API_URL}/orders`
    );

    const data = await response.json();

    setOrders(data.reverse());
  };

  useEffect(() => {
    fetchOrders();

    socket.on(
      "orderUpdated",
      () => {
        fetchOrders();
      }
    );

    return () => {
      socket.off("orderUpdated");
    };
  }, []);
  
  const updateStatus = async (
    orderId,
    status
  ) => {
    await fetch(
      `${API_URL}/orders/${orderId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          status,
        }),
      }
    );

    fetchOrders();
  };


  const updatePriority = async (
    orderId,
    priority
  ) => {
    await fetch(
      `${API_URL}/orders/${orderId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          priority,
        }),
      }
    );

    fetchOrders();
  };

  const activeOrders = orders.filter(
    (order) =>
      order.status !== "Teslim Edildi"
  );

  const completedOrders = orders.filter(
    (order) =>
      order.status === "Teslim Edildi"
  );


  const PRIORITY_ORDER = {
  Acil: 0,
  Yüksek: 1,
  Normal: 2,
  };

  const sortedActiveOrders = [
  ...activeOrders,
].sort((a, b) => {
  const priorityA =
    PRIORITY_ORDER[
      a.priority || "Normal"
    ];

  const priorityB =
    PRIORITY_ORDER[
      b.priority || "Normal"
    ];

  if (priorityA !== priorityB) {
    return priorityA - priorityB;
  }

  return (
    new Date(a.createdAt) -
    new Date(b.createdAt)
  );
 });

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        boxSizing: "border-box",
        background: "#000000", // Saf Apple Siyahı
        color: "#ffffff",
        padding: "40px 4%",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1600px", // Geniş ekran mutfak ekranları için tam fluid yapı
          margin: "0 auto",
        }}
      >
        <div
          style={{
            marginBottom: "40px",
            borderBottom: "1px solid #1c1c1e",
            paddingBottom: "24px",
          }}
        >
          <h1
            style={{
              fontSize: "36px",
              fontWeight: "700",
              letterSpacing: "-0.5px",
              margin: "0 0 6px 0",
            }}
          >
             Mutfak Paneli
          </h1>

          <p
            style={{
              color: "#8e8e93", // Apple ikincil metin rengi
              fontSize: "15px",
              margin: 0,
            }}
          >
            Aktif siparişler canlı olarak takip ediliyor
          </p>
        </div>

        <h2
          style={{
            fontSize: "22px",
            fontWeight: "600",
            letterSpacing: "-0.2px",
            marginBottom: "20px",
          }}
        >
          Aktif Siparişler ({activeOrders.length})
        </h2>

        {activeOrders.length === 0 && (
          <div
            style={{
              background: "#1c1c1e",
              padding: "32px",
              borderRadius: "14px",
              textAlign: "center",
              color: "#8e8e93",
              fontSize: "16px",
              border: "1px solid rgba(255, 255, 255, 0.02)",
            }}
          >
            Aktif sipariş bulunmuyor
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", // Sayaç ve not sığması için min genişlik 320px yapıldı
            gap: "24px",
          }}
        >
          {sortedActiveOrders.map((order) => (
            <div
              key={order.id}
              style={{
                background: "#1c1c1e", // Apple Kömür Grisi panel rengi
                borderRadius: "16px",
                padding: "24px",
                boxSizing: "border-box",
                borderLeft: `6px solid ${PRIORITY_COLORS[order.priority || "Normal"]}`, // Öncelik belirten asil sol çizgi
                boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "12px",
                  }}
                >
                  <div>
                    <h2
                     style={{
                       fontSize: "28px",
                       fontWeight: "700",
                       letterSpacing: "-0.5px",
                       margin: 0,
                     }}
                    >
                      #{order.tableId}
                    </h2>

                    <p
                      style={{
                        color: "#8e8e93",
                        fontSize: "13px",
                        marginTop: "4px",
                        marginBottom: 0,
                      }}
                    >
                      {new Date(
                        order.createdAt
                      ).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>

                  <div
                    style={{
                      padding: "6px 14px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "600",
                      textAlign: "center",
                      backgroundColor: order.status === "Hazır" ? "rgba(48, 209, 88, 0.15)" : "rgba(255, 159, 10, 0.15)",
                      color: order.status === "Hazır" ? "#30d158" : "#ff9f0a",
                    }}
                  >
                    {order.status}
                    <div
                     style={{
                       marginTop: "4px",
                       fontSize: "11px",
                       opacity: 0.8,
                       fontWeight: "500",
                     }}
                    >
                     {order.priority || "Normal"}
                    </div>
                  </div>
                </div>

                {/* Dinamik Geri Sayım Sayacı (Mutfak Ekranı) */}
                <KitchenCountdown 
                  createdAt={order.createdAt} 
                  estimatedTime={order.estimatedTime} 
                  orderStatus={order.status}
                />

                {/* Sipariş Notu Alanı (Eğer not varsa dinamik olarak basılır) */}
                {order.note && (
                  <div
                    style={{
                      backgroundColor: "rgba(255, 159, 10, 0.08)",
                      border: "1px solid rgba(255, 159, 10, 0.2)",
                      borderRadius: "10px",
                      padding: "10px 14px",
                      margin: "12px 0 4px 0",
                      fontSize: "14px",
                      color: "#ff9f0a",
                      fontWeight: "500",
                      lineHeight: "1.4"
                    }}
                  >
                    📝 <strong>Not:</strong> {order.note}
                  </div>
                )}

                <div
                  style={{
                    margin: "16px 0",
                    padding: "12px 0",
                    borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                  }}
                >
                  {order.items.map(
                    (item) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "16px",
                          color: "#f5f5f7",
                          marginBottom: "10px",
                        }}
                      >
                        <span>
                          {item.name} <span style={{ color: "#8e8e93", fontSize: "14px" }}>x {item.quantity}</span>
                        </span>

                        <span>
                          {item.price *
                            item.quantity}
                          ₺
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#ffffff",
                    margin: "0 0 16px 0",
                  }}
                >
                  Toplam:{" "}
                  {order.totalPrice}
                  ₺
                </h3>

                <div
                  style={{
                    display: "flex",
                    gap: "6px",
                    marginBottom: "16px",
                  }}
                >
                  {["Normal", "Yüksek", "Acil"].map(
                    (priority) => (
                      <button
                        key={priority}
                        onClick={() =>
                          updatePriority(
                            order.id,
                            priority
                          )
                        }
                        style={{
                          flex: 1,
                          border: "none",
                          padding: "8px",
                          borderRadius: "8px",
                          background: (order.priority || "Normal") === priority ? PRIORITY_COLORS[priority] : "rgba(255, 255, 255, 0.04)",
                          color: (order.priority || "Normal") === priority ? "#white" : "#8e8e93",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "600",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {priority}
                      </button>
                    )
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={() =>
                      updateStatus(
                        order.id,
                        "Hazır"
                      )
                    }
                    style={{
                      border: "none",
                      padding: "12px",
                      borderRadius: "10px",
                      background: "#30d158", // Apple Yeşili
                      color: "white",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "14px",
                      flex: 1,
                    }}
                  >
                    Hazır
                  </button>

                  <button
                    onClick={() =>
                      updateStatus(
                        order.id,
                        "Teslim Edildi"
                      )
                    }
                    style={{
                      border: "none",
                      padding: "12px",
                      borderRadius: "10px",
                      background: "#0a84ff", // Apple Mavisi
                      color: "white",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "14px",
                      flex: 1,
                    }}
                  >
                    Teslim Edildi
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: "50px",
          }}
        >
          <button
            onClick={() =>
              setShowHistory(
                !showHistory
              )
            }
            style={{
              border: "none",
              padding: "14px 24px",
              borderRadius: "12px",
              background: "#1c1c1e",
              color: "#0a84ff",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "15px",
              marginBottom: "20px",
            }}
          >
            {showHistory
              ? "Geçmişi Gizle"
              : "Geçmiş Siparişleri Göster"}
          </button>

          {showHistory && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                marginTop: "10px"
              }}
            >
              {completedOrders.map(
                (order) => (
                  <div
                    key={order.id}
                    style={{
                      background: "#1c1c1e",
                      borderRadius: "14px",
                      padding: "20px",
                      border: "1px solid rgba(255,255,255,0.02)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "100%",
                        alignItems: "center",
                      }}
                    >
                      <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>
                        Masa {order.tableId}
                      </h3>

                      <span style={{ fontSize: "14px", color: "#8e8e93" }}>
                        {new Date(
                          order.createdAt
                        ).toLocaleString(
                          "tr-TR"
                        )}
                      </span>
                    </div>

                    <div style={{ fontSize: "14px", color: "#8e8e93", width: "100%" }}>
                      {order.items.map(
                        (item) => (
                          <div
                            key={item.id}
                            style={{
                              marginBottom: "6px",
                            }}
                          >
                            {item.name} x {item.quantity}
                          </div>
                        )
                      )}
                      {order.note && (
                        <div style={{ fontSize: "13px", color: "#ff9f0a", marginTop: "8px" }}>
                          📝 Not: {order.note}
                        </div>
                      )}
                    </div>

                    <h4
                      style={{
                        marginTop: "8px",
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#30d158",
                        width: "100%",
                        textAlign: "right",
                        margin: 0
                      }}
                    >
                      Toplam: {order.totalPrice} ₺
                    </h4>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default KitchenPage;