import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API_URL } from "../config/api";
import CardForm from "@components/CardIntegration/CardForm";

function MenuPage() {
  const { tableId } = useParams();

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [orderNote, setOrderNote] = useState(""); 
  const [selectedCategory, setSelectedCategory] = useState("Tümü");

  // Ödeme ve Tarama State Yapıları
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMode, setPaymentMode] = useState("selection"); // selection, nfc_scan, manual_card
  const [nfcState, setNfcState] = useState("idle"); // idle, scanning, success, processing
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/products`)
      .then((res) => res.json())
      .then((data) => setProducts(data));
  }, []);

  const addToCart = (product) => {
    const existingProduct = cart.find((item) => item.id === product.id);

    if (existingProduct) {
      setCart(
        cart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(
      cart
        .map((item) =>
          item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const totalPrice = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const categoryMap = {
    Burger: "Burger",
    Pizza: "Pizza",
    Döner: "Doner",
    İçecek: "Drink",
    Tatlı: "Dessert",
    Atıştırmalık: "Snack",
  };

  const PREPARATION_TIMES = {
    Burger: 12,
    Pizza: 15,
    Doner: 10,
    Drink: 2,
    Dessert: 7,
    Snack: 8
  };

  const filteredProducts =
    selectedCategory === "Tümü"
      ? products
      : products.filter(
          (product) => product.category === categoryMap[selectedCategory]
        );

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

  // Siparişi Backend'e Gönderen Çekirdek Fonksiyon
  const sendOrderToBackend = async (detectedCardSerial) => {
    const maxPrepTime = cart.reduce((max, item) => {
      const itemPrepTime = PREPARATION_TIMES[item.category] || 10;
      return itemPrepTime > max ? itemPrepTime : max;
    }, 0);

    const orderData = {
      tableId,
      items: cart,
      totalPrice,
      note: orderNote,
      estimatedTime: maxPrepTime,
      paymentMethod: `iyzico Güvenli Ödeme (İşlem: ${detectedCardSerial})`,
    };

    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        alert(data.message);
        setNfcState("idle");
        setShowPaymentModal(false);
        return;
      }

      window.location.href = `/status/${tableId}`;
      setCart([]);
      setShowCart(false);
      setOrderNote("");
      setShowPaymentModal(false);
      setNfcState("idle");
      setPaymentMode("selection");
    } catch (error) {
      console.error(error);
      setNfcState("idle");
      alert("Sipariş iletilirken teknik bir hata oluştu.");
    }
  };

  // Hızlı iyzico Ödeme API Tetikleyicisi
  const handleIyzicoPayment = async (cardDetails) => {
    setNfcState("processing");
    try {
      const response = await fetch(`${API_URL}/api/payment/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart,
          totalPrice,
          tableId,
          cardDetails
        })
      });

      const result = await response.json();

      if (result.success) {
        setNfcState("success");
        setTimeout(() => {
          sendOrderToBackend(result.paymentId);
        }, 1500);
      } else {
        alert(result.message);
        setNfcState("idle");
        if (paymentMode === "nfc_scan") setPaymentMode("selection");
      }
    } catch (error) {
      console.error(error);
      alert("iyzico bağlantı hatası oluştu.");
      setNfcState("idle");
      if (paymentMode === "nfc_scan") setPaymentMode("selection");
    }
  };

  // NFC Butonuna Basıldığında Hızlı Doldurma Simülasyonunu Başlatan Fonksiyon
  const startNfcFastFillSimulate = () => {
    setPaymentMode("nfc_scan");
    setNfcState("scanning");

    // 2 saniye radar dönecek, sanki telefonu masaya/karta dokundurmuş gibi simüle edecek
    setTimeout(() => {
      // Resmi Başarılı iyzico Test Kart Bilgileri Otomatik Enjekte Ediliyor
      const autoFilledCard = {
        cardHolderName: "Berkay Aras (NFC Temassız)",
        cardNumber: "5890040000000016",
        expiryMonth: "12",
        expiryYear: "28",
        cvv: "123"
      };
      
      // Doğrudan iyzico API'sine gönderiyoruz
      handleIyzicoPayment(autoFilledCard);
    }, 2000);
  };

  const closeNfcModal = () => {
    if (nfcState === "processing") return; 
    setShowPaymentModal(false);
    setNfcState("idle");
    setPaymentMode("selection");
    setErrorMessage("");
  };

  const styles = {
    container: {
      minHeight: "100vh",
      backgroundColor: "#000000", 
      color: "#ffffff",
      paddingBottom: cart.length > 0 ? "240px" : "40px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      alignItems: "center", 
    },
    wrapper: {
      width: "100%",
      maxWidth: "600px", 
      padding: "0 20px",
      boxSizing: "border-box",
    },
    header: {
      position: "sticky",
      top: 0,
      zIndex: 100,
      backdropFilter: "blur(30px)",
      backgroundColor: "rgba(0, 0, 0, 0.75)",
      padding: "24px 0 16px 0",
      display: "flex",
      flexDirection: "column",
      alignItems: "center", 
      borderBottom: "1px solid #1c1c1e",
    },
    brandName: {
      margin: 0,
      fontSize: "24px",
      fontWeight: "700",
      letterSpacing: "-0.5px",
    },
    tableTag: {
      marginTop: "6px",
      fontSize: "13px",
      fontWeight: "600",
      color: "#8e8e93",
      letterSpacing: "0.5px",
      textTransform: "uppercase",
    },
    categoryBar: {
      display: "flex",
      gap: "24px",
      overflowX: "auto",
      width: "100%",
      padding: "20px 0",
      scrollbarWidth: "none",
      borderBottom: "1px solid #1c1c1e",
    },
    categoryTab: (isActive) => ({
      border: "none",
      background: "transparent",
      color: isActive ? "#ffffff" : "#8e8e93",
      fontWeight: isActive ? "700" : "500",
      fontSize: "15px",
      paddingBottom: "6px",
      borderBottom: isActive ? "2px solid #ffffff" : "2px solid transparent",
      whiteSpace: "nowrap",
      cursor: "pointer",
      transition: "all 0.2s ease",
    }),
    menuList: {
      width: "100%",
      marginTop: "24px",
      display: "flex",
      flexDirection: "column",
      gap: "24px",
    },
    productCard: {
      backgroundColor: "#1c1c1e", 
      borderRadius: "20px",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      alignItems: "center", 
    },
    productImage: {
      width: "100%",
      height: "220px",
      objectFit: "cover",
    },
    productContent: {
      padding: "24px",
      width: "100%",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      alignItems: "center", 
      textAlign: "center",
    },
    productName: {
      margin: "0 0 6px 0",
      fontSize: "20px",
      fontWeight: "600",
      letterSpacing: "-0.3px",
    },
    productPrice: {
      margin: "0 0 20px 0",
      fontSize: "17px",
      fontWeight: "500",
      color: "#eaeaea",
    },
    addButton: {
      width: "100%",
      maxWidth: "280px", 
      padding: "12px 24px",
      border: "none",
      borderRadius: "24px", 
      backgroundColor: "#ffffff",
      color: "#000000",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
    },
    quantitySelector: {
      width: "100%",
      maxWidth: "280px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "#2c2c2e",
      borderRadius: "24px",
      padding: "4px",
      boxSizing: "border-box",
    },
    qtyBtn: {
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      border: "none",
      background: "transparent",
      color: "#ffffff",
      fontSize: "20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
    },
    qtyText: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#ffffff",
    },
    fixedCartBar: {
      position: "fixed",
      bottom: "20px",
      left: "20px",
      right: "20px",
      maxWidth: "560px",
      margin: "0 auto",
      backgroundColor: "rgba(28, 28, 30, 0.95)",
      backdropFilter: "blur(30px)",
      borderRadius: "24px",
      padding: "20px",
      boxSizing: "border-box",
      boxShadow: "0 10px 40px rgba(0, 0, 0, 0.6)",
      border: "1px solid rgba(255, 255, 255, 0.05)",
      zIndex: 1000,
    },
    cartHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "14px",
    },
    cartSummary: {
      fontSize: "15px",
      fontWeight: "600",
    },
    detailBtn: {
      border: "none",
      background: "transparent",
      color: "#0a84ff", 
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
    },
    cartItemsList: {
      maxHeight: "120px",
      overflowY: "auto",
      marginBottom: "14px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    },
    cartItemRow: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: "14px",
      color: "#d1d1d6",
    },
    noteInput: {
      width: "100%",
      padding: "12px 16px",
      borderRadius: "12px",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      backgroundColor: "#000000",
      color: "#ffffff",
      fontSize: "14px",
      outline: "none",
      marginBottom: "14px",
      boxSizing: "border-box",
    },
    checkoutBtn: {
      width: "100%",
      padding: "16px",
      border: "none",
      borderRadius: "16px",
      backgroundColor: "#0a84ff", 
      color: "#ffffff",
      fontSize: "16px",
      fontWeight: "600",
      cursor: "pointer",
    },
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.85)",
      backdropFilter: "blur(20px)",
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-end", 
      zIndex: 2000,
    },
    modalSheet: {
      width: "100%",
      maxWidth: "500px",
      backgroundColor: "#1c1c1e",
      borderTopLeftRadius: "30px",
      borderTopRightRadius: "30px",
      padding: "32px 24px env(safe-area-inset-bottom) 24px",
      boxSizing: "border-box",
      color: "#ffffff",
      boxShadow: "0 -10px 40px rgba(0,0,0,0.5)",
      animation: "slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      textAlign: "center"
    },
    nfcRadarContainer: {
      position: "relative",
      width: "120px",
      height: "120px",
      margin: "30px auto",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    nfcIcon: {
      fontSize: "48px",
      zIndex: 2,
    },
    actionButtonGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "14px",
      marginTop: "24px"
    },
    secondaryBtn: {
      width: "100%",
      padding: "16px",
      border: "1px solid rgba(255, 255, 255, 0.15)",
      borderRadius: "16px",
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      color: "#ffffff",
      fontSize: "15px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "background 0.2s",
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        
        <div style={styles.header}>
          <h1 style={styles.brandName}>QuickOrder</h1>
          <div style={styles.tableTag}>Masa {tableId}</div>
        </div>

        <div style={styles.categoryBar}>
          {["Tümü", "Burger", "Pizza", "Döner", "İçecek", "Tatlı", "Atıştırmalık"].map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              style={styles.categoryTab(selectedCategory === category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div style={styles.menuList}>
          {filteredProducts.map((product) => {
            const cartItem = cart.find((item) => item.id === product.id);

            return (
              <div key={product.id} style={styles.productCard}>
                <img
                  src={product.image}
                  alt={product.name}
                  style={styles.productImage}
                />

                <div style={styles.productContent}>
                  <h2 style={styles.productName}>{product.name}</h2>
                  <div style={styles.productPrice}>{product.price} ₺</div>

                  {!cartItem ? (
                    <button
                      onClick={() => addToCart(product)}
                      style={styles.addButton}
                    >
                      Sepete Ekle
                    </button>
                  ) : (
                    <div style={styles.quantitySelector}>
                      <button
                        onClick={() => removeFromCart(product.id)}
                        style={styles.qtyBtn}
                      >
                        −
                      </button>
                      <span style={styles.qtyText}>{cartItem.quantity}</span>
                      <button
                        onClick={() => addToCart(product)}
                        style={styles.qtyBtn}
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

        {cart.length > 0 && (
          <div style={styles.fixedCartBar}>
            <div style={styles.cartHeader}>
              <div style={styles.cartSummary}>
                {totalItems} Ürün • <span>{totalPrice} ₺</span>
              </div>
              <button
                onClick={() => setShowCart(!showCart)}
                style={styles.detailBtn}
              >
                {showCart ? "Kapat" : "Detayları Göster"}
              </button>
            </div>

            {showCart && (
              <div style={styles.cartItemsList}>
                {cart.map((item) => (
                  <div key={item.id} style={styles.cartItemRow}>
                    <span>{item.name} (x{item.quantity})</span>
                    <strong style={{ color: "#fff" }}>{item.price * item.quantity} ₺</strong>
                  </div>
                ))}
              </div>
            )}

            <input 
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              placeholder="Mutfak için bir sipariş notu ekleyin..."
              style={styles.noteInput}
            />

            <button onClick={() => setShowPaymentModal(true)} style={styles.checkoutBtn}>
              Siparişi Onayla
            </button>
          </div>
        )}

        {/* Çok Fonksiyonlu Güvenli Ödeme Modalı */}
        {showPaymentModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalSheet}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", alignItems: "center" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "700", margin: 0, letterSpacing: "-0.5px" }}>Güvenli Ödeme</h2>
                <button 
                  onClick={closeNfcModal} 
                  style={{ background: "transparent", border: "none", color: "#0a84ff", fontSize: "15px", cursor: "pointer", fontWeight: "500" }}
                >
                  Kapat
                </button>
              </div>
              <div style={{ color: "#8e8e93", fontSize: "14px", marginTop: "4px", textAlign: "left" }}>
                Masa {tableId} • Toplam Tutar: {totalPrice} ₺
              </div>

              {/* AŞAMA 1: ÖDEME YÖNTEMİ SEÇİM EKRANI */}
              {paymentMode === "selection" && (
                <div style={styles.actionButtonGroup}>
                  <button onClick={startNfcFastFillSimulate} style={{ ...styles.checkoutBtn, backgroundColor: "#ffffff", color: "#000000" }}>
                    📟 NFC Masa Teması (Hızlı Öde)
                  </button>
                  <button onClick={() => setPaymentMode("manual_card")} style={styles.secondaryBtn}>
                    💳 Kredi / Banka Kartı ile Öde
                  </button>
                </div>
              )}

              {/* AŞAMA 2: NFC TARAMA VE ANİMASYON EKRANI */}
              {paymentMode === "nfc_scan" && (
                <>
                  <div style={styles.nfcRadarContainer}>
                    {nfcState === "scanning" && (
                      <>
                        <div className="radar-wave wave1"></div>
                        <div className="radar-wave wave2"></div>
                        <div className="radar-wave wave3"></div>
                      </>
                    )}
                    <div style={{
                      ...styles.nfcIcon,
                      animation: nfcState === "success" ? "bounceClick 0.4s ease" : "none",
                      color: nfcState === "success" ? "#30d158" : nfcState === "scanning" ? "#0a84ff" : "#ffffff"
                    }}>
                      {nfcState === "success" ? "✓" : nfcState === "processing" ? "⏳" : "📟"} 
                    </div>
                  </div>
                  <div style={{ fontSize: "15px", fontWeight: "600", color: "#ffffff", marginBottom: "30px" }}>
                    {nfcState === "scanning" && "Cihaz Masaya Dokunduruluyor (Kart Enjekte Ediliyor)..."}
                    {nfcState === "processing" && "iyzico Güvenli Bağlantısı Kuruluyor..."}
                    {nfcState === "success" && "Ödeme Başarılı! Sipariş İletiliyor..."}
                  </div>
                </>
              )}

              {/* AŞAMA 3: MANUEL iYZİCO KART FORMU EKRANI */}
              {paymentMode === "manual_card" && (
                <div style={{ marginTop: "16px" }}>
                  {nfcState === "success" ? (
                    <div style={styles.nfcRadarContainer}>
                      <div style={{ ...styles.nfcIcon, color: "#30d158" }}>✓</div>
                      <div style={{ fontSize: "16px", fontWeight: "600", marginTop: "10px" }}>Ödeme Başarılı!</div>
                    </div>
                  ) : (
                    <CardForm 
                      totalPrice={totalPrice}
                      isProcessing={nfcState === "processing"}
                      onSubmit={handleIyzicoPayment}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
      </div>
      
      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes bounceClick { 0% { transform: scale(1); } 50% { transform: scale(1.3); } 100% { transform: scale(1); } }
        .radar-wave {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 2px solid #0a84ff;
          borderRadius: 50%;
          opacity: 0;
          animation: wavePulse 2s infinite linear;
        }
        .wave2 { animation-delay: 0.6s; }
        .wave3 { animation-delay: 1.2s; }
        @keyframes wavePulse {
          0% { transform: scale(0.6); opacity: 0; }
          50% { opacity: 0.4; }
          100% { transform: scale(1.4); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default MenuPage;