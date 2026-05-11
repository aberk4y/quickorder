import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { API_URL } from "../config/api";
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

  const activeOrders = orders.filter(
    (order) =>
      order.status !== "Teslim Edildi"
  );

  const completedOrders = orders.filter(
    (order) =>
      order.status === "Teslim Edildi"
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(to bottom, #020617, #0f172a)",
        color: "white",
        padding: "30px",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            marginBottom: "40px",
          }}
        >
          <h1
            style={{
              fontSize: "40px",
              marginBottom: "10px",
            }}
          >
             Mutfak Paneli
          </h1>

          <p
            style={{
              color: "#94a3b8",
            }}
          >
            Aktif siparişler canlı olarak
            takip ediliyor
          </p>
        </div>

        <h2
          style={{
            marginBottom: "20px",
          }}
        >
          Aktif Siparişler
        </h2>

        {activeOrders.length === 0 && (
          <div
            style={{
              background: "#111827",
              padding: "16px",
              borderRadius: "18px",
              textAlign: "center",
              color: "#94a3b8",
            }}
          >
            Aktif sipariş bulunmuyor
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "24px",
          }}
        >
          {activeOrders.map((order) => (
            <div
              key={order.id}
              style={{
                background: "#111827",
                borderRadius: "18px",
                padding: "16px",
                border:
                  "1px solid rgba(255,255,255,0.08)",
                boxShadow:
                  "0 20px 40px rgba(0,0,0,0.35)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <h2
                   style={{
                   fontSize: "32px",
                   margin: 0,
                }}
>
  #{order.tableId}
</h2>

                  <p
                    style={{
                      color: "#94a3b8",
                      fontSize: "14px",
                    }}
                  >
                    {new Date(
                      order.createdAt
                    ).toLocaleString(
                      "tr-TR"
                    )}
                  </p>
                </div>

                <div
                  style={{
                    padding:
                      "8px 14px",
                    borderRadius:
                      "999px",
                    background:
                      order.status ===
                      "Hazır"
                        ? "#22c55e"
                        : "#f97316",
                    fontWeight:
                      "bold",
                  }}
                >
                  {order.status}
                </div>
              </div>

              <div
                style={{
                  marginBottom: "20px",
                }}
              >
                {order.items.map(
                  (item) => (
                    <div
                      key={item.id}
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        marginBottom:
                          "10px",
                      }}
                    >
                      <span>
                        {item.name} x
                        {
                          item.quantity
                        }
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

              <h3
                style={{
                  marginBottom: "20px",
                }}
              >
                Toplam:
                {order.totalPrice}
                ₺
              </h3>

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
                    padding:
                      "12px 16px",
                    borderRadius:
                      "12px",
                    background:
                      "#22c55e",
                    color: "white",
                    cursor:
                      "pointer",
                    fontWeight:
                      "bold",
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
                    padding:
                      "12px 16px",
                    borderRadius:
                      "12px",
                    background:
                      "#2563eb",
                    color: "white",
                    cursor:
                      "pointer",
                    fontWeight:
                      "bold",
                    flex: 1,
                  }}
                >
                  Teslim Edildi
                </button>
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
              padding: "14px 22px",
              borderRadius: "14px",
              background: "#1e293b",
              color: "white",
              cursor: "pointer",
              fontWeight: "bold",
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
                flexDirection:
                  "column",
                gap: "20px",
              }}
            >
              {completedOrders.map(
                (order) => (
                  <div
                    key={order.id}
                    style={{
                      background:
                        "#0f172a",
                      borderRadius:
                        "20px",
                      padding: "20px",
                      border:
                        "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        marginBottom:
                          "12px",
                      }}
                    >
                      <h3>
                        Masa{" "}
                        {
                          order.tableId
                        }
                      </h3>

                      <span>
                        {new Date(
                          order.createdAt
                        ).toLocaleString(
                          "tr-TR"
                        )}
                      </span>
                    </div>

                    {order.items.map(
                      (item) => (
                        <div
                          key={
                            item.id
                          }
                          style={{
                            marginBottom:
                              "6px",
                          }}
                        >
                          {item.name}
                          {" x"}
                          {
                            item.quantity
                          }
                        </div>
                      )
                    )}

                    <h4
                      style={{
                        marginTop:
                          "10px",
                      }}
                    >
                      Toplam:
                      {
                        order.totalPrice
                      }
                      ₺
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

