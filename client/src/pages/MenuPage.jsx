import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";

/**
 * MenuPage Bileşeni
 * Müşterilerin masaya özel QR kod üzerinden menüyü görüntülediği,
 * kategorilere göre filtreleme yaptığı ve sepet oluşturduğu ana sayfa.
 */
function MenuPage() {
  // URL'den masa ID'sini dinamik olarak alıyoruz
  const { tableId } = useParams();
  const navigate = useNavigate();

  // Ürünler, sepet ve kategori filtreleme için state tanımlamaları
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Tümü");
  const [note, setNote] = useState("");

  // Sayfa ilk açıldığında veya masa değiştikçe API üzerinden ürün listesini getir
  useEffect(() => {
    fetch(`${API_URL}/products`)
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error("Ürünler yüklenemedi:", err));
  }, [tableId]);

  /**
   * Sepete Ürün Ekleme (veya miktarını artırma)
   * @param {Object} product - Eklenen ürün nesnesi
   */
  const addToCart = (product) => {
    const existingProduct = cart.find(
      (item) => item.id === product.id
    );

    if (existingProduct) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          ...product,
          quantity: 1,
        },
      ]);
    }
  };

  /**
   * Sepetten Ürün Çıkarma (veya miktarını azaltma)
   * Miktar 0'a ulaştığında ürünü sepetten tamamen kaldırır.
   * @param {number|string} productId - Çıkarılan ürünün ID'si
   */
  const removeFromCart = (productId) => {
    setCart(
      cart
        .map((item) =>
          item.id === productId
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // Sepetteki tüm ürünlerin toplam fiyatını hesapla
  const totalPrice = cart.reduce(
    (total, item) =>
      total + item.price * item.quantity,
    0
  );
  // Türkçe kategori isimlerini backend'deki İngilizce karşılıklarıyla eşleştir
  const categoryMap = {
    Burger: "Burger",
    Pizza: "Pizza",
    Döner: "Doner",
    İçecek: "Drink",
    Tatlı: "Dessert",
    Atıştırmalık: "Snack",
  };

  // Seçili kategoriye göre ürün listesini filtrele
  const filteredProducts =
    selectedCategory === "Tümü"
      ? products
      : products.filter(
          (product) =>
            product.category ===
            categoryMap[selectedCategory]
        );

  // Sepetteki toplam ürün adedini hesapla (navbar badge için)
  const totalItems = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  /**
   * Sipariş Oluşturma
   * Sepetteki ürünleri API'ye gönderir ve başarılı olursa sipariş takip sayfasına yönlendirir.
   */
  const createOrder = async () => {
    if (cart.length === 0) {
      alert("Sepet boş");
      return;
    }

    // Sipariş verisi: masa numarası, ürünler, toplam fiyat ve müşteri notu
    const orderData = {
      tableId,
      items: cart,
      totalPrice,
      note,
    };

    try {
      // Sipariş verisini API'ye gönder
      const response = await fetch(
        `${API_URL}/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(orderData),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        alert(data.message);
        return;
      }

      // SPA yapısına uygun olarak baştan yükleme yapmadan yönlendir
      navigate(`/status/${tableId}`);

      setCart([]);
      setShowCart(false);
      setNote("");
    } catch (error) {
      console.error(error);
      alert("Order failed");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(to bottom, #0f172a, #020617)",
        color: "white",
        paddingBottom: "120px",
      }}
    >
      {/* Üst başlık alanı - sayfanın üstüne sabitlenmiş (sticky) */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          backdropFilter: "blur(10px)",
          background: "rgba(15, 23, 42, 0.85)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          padding: "18px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "32px",
                fontWeight: "800",
              }}
            >
              QuickOrder
            </h1>
            <p
              style={{
                marginTop: "4px",
                color: "#cbd5e1",
                margin: 0,
              }}
            >
              Masa {tableId}
            </p>
          </div>

          <button
            onClick={() => navigate(`/status/${tableId}`)}
            style={{
              border: "none",
              borderRadius: "14px",
              padding: "10px 16px",
              background: "linear-gradient(to right, #ea580c, #f97316)",
              color: "white",
              fontWeight: "700",
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 6px 16px rgba(234, 88, 12, 0.25)",
            }}
          >
            📋 Siparişlerim
          </button>
        </div>
      </div>

      <div
        style={{
          padding: "18px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
      {/* Kategori filtreleme butonları */}
       <div
  style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
    overflowX: "auto",
    paddingBottom: "10px",
  }}
>
  {[
  "Tümü",
  "Burger",
  "Pizza",
  "Döner",
  "İçecek",
  "Tatlı",
  "Atıştırmalık",
  ].map((category) => (
    <button
      key={category}
      onClick={() =>
        setSelectedCategory(category)
      }
      style={{
        border: "none",
        borderRadius: "999px",
        padding: "12px 18px",
        background:
          selectedCategory === category
            ? "linear-gradient(to right, #f97316, #ea580c)"
            : "#1e293b",
        color: "white",
        fontWeight: "600",
        whiteSpace: "nowrap",
        cursor: "pointer",
      }}
    >
      {category}
    </button>
  ))}
</div>
        {/* Ürün kartları listesi */}
        {filteredProducts.map((product) => {
          const cartItem = cart.find(
            (item) => item.id === product.id
          );

          return (
            <div
              key={product.id}
              style={{
                background: "#111827",
                borderRadius: "24px",
                overflow: "hidden",
                border:
                  "1px solid rgba(255,255,255,0.08)",
                boxShadow:
                  "0 10px 30px rgba(0,0,0,0.4)",
              }}
            >
              <img
                src={product.image}
                alt={product.name}
                style={{
                  width: "100%",
                  height: "220px",
                  objectFit: "cover",
                }}
              />

              <div
                style={{
                  padding: "18px",
                  
                }}
              >
                
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: "22px",
                      }}
                    >
                      {product.name}
                    </h2>

                    <p
                      style={{
                        marginTop: "6px",
                        color: "#94a3b8",
                      }}
                    >
                      {product.category}
                    </p>
                  </div>

                  <div
                    style={{
                      fontSize: "22px",
                      fontWeight: "700",
                    }}
                  >
                    {product.price}₺
                  </div>
                </div>

                {!cartItem ? (
                  <button
                    onClick={() => addToCart(product)}
                    style={{
                      marginTop: "18px",
                      width: "100%",
                      padding: "14px",
                      border: "none",
                      borderRadius: "16px",
                      background:
                        "linear-gradient(to right, #f97316, #ea580c)",
                      color: "white",
                      fontSize: "16px",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    Sepete Ekle
                  </button>
                ) : (
                  <div
                    style={{
                      marginTop: "18px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: "#1e293b",
                      borderRadius: "16px",
                      padding: "12px 16px",
                    }}
                  >
                    <button
                      onClick={() =>
                        removeFromCart(product.id)
                      }
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "50%",
                        border: "none",
                        background: "#334155",
                        color: "white",
                        fontSize: "22px",
                        cursor: "pointer",
                      }}
                    >
                      -
                    </button>

                    <span
                      style={{
                        fontSize: "20px",
                        fontWeight: "700",
                      }}
                    >
                      {cartItem.quantity}
                    </span>

                    <button
                      onClick={() => addToCart(product)}
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "50%",
                        border: "none",
                        background:
                          "linear-gradient(to right, #f97316, #ea580c)",
                        color: "white",
                        fontSize: "22px",
                        cursor: "pointer",
                      }}
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sabit alt sepet paneli - sepette ürün varsa görünür */}
      {cart.length > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            left: "20px",
            right: "20px",
            background: "#111827",
            borderRadius: "24px",
            padding: "18px",
            border:
              "1px solid rgba(255,255,255,0.08)",
            boxShadow:
              "0 10px 30px rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "14px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                }}
              >
                {totalItems} Ürünler
              </div>
              

              <div
                style={{
                  color: "#94a3b8",
                }}
              >
                Toplam: {totalPrice}₺
              </div>
            </div>

            <button
              onClick={() =>
                setShowCart(!showCart)
              }
              style={{
                border: "none",
                borderRadius: "14px",
                padding: "12px 16px",
                background: "#1e293b",
                color: "white",
                cursor: "pointer",
              }}
            >
              {showCart ? "Gizle" : "Detay"}
            </button>
          </div>

          {showCart && (
            <div
              style={{
                marginBottom: "14px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {cart.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    background: "#1e293b",
                    padding: "12px",
                    borderRadius: "14px",
                  }}
                >
                  <span>
                    {item.name} x{item.quantity}
                  </span>

                  <strong>
                    {item.price * item.quantity}₺
                  </strong>
                </div>
              ))}
            </div>
          )}

          {/* Sipariş Notu Giriş Alanı */}
          <div style={{ marginBottom: "14px" }}>
            <textarea
              placeholder="Sipariş notu ekleyin (örn: acısız olsun, ketçap mayonez bol olsun...)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{
                width: "100%",
                height: "60px",
                padding: "12px",
                borderRadius: "14px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                background: "#1e293b",
                color: "white",
                fontSize: "14px",
                resize: "none",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#22c55e")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255, 255, 255, 0.1)")}
            />
          </div>

          <button
            onClick={createOrder}
            style={{
              width: "100%",
              padding: "16px",
              border: "none",
              borderRadius: "18px",
              background:
                "linear-gradient(to right, #22c55e, #16a34a)",
              color: "white",
              fontSize: "17px",
              fontWeight: "800",
              cursor: "pointer",
            }}
          >
            Siparişi Onayla
          </button>
        </div>
      )}
    </div>
  );
}

export default MenuPage;