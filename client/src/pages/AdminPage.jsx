import { useEffect, useState } from "react";
import { API_URL } from "../config/api";

const CATEGORY_NAMES = {
  Burger: "Burger",
  Pizza: "Pizza",
  Doner: "Döner",
  Drink: "İçecek",
  Dessert: "Tatlı",
  Snack: "Atıştırmalık",
};

function AdminPage() {
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Burger");
  const [image, setImage] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("All");

  const fetchProducts = async () => {
    const response = await fetch(`${API_URL}/products`);
    const data = await response.json();
    setProducts(data);
  };

  const deleteProduct = async (id) => {
    await fetch(`${API_URL}/products/${id}`, {
      method: "DELETE",
    });
    fetchProducts();
  };

  const startEdit = (product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price);
    setCategory(product.category);
    setImage(product.image);
  };

  const createProduct = async () => {
    if (!name || !price || !image) {
      alert("Tüm alanları doldur.");
      return;
    }

    await fetch(`${API_URL}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        price: Number(price),
        category,
        image,
      }),
    });

    setName("");
    setPrice("");
    setCategory("Burger");
    setImage("");

    fetchProducts();
  };

  const updateProduct = async () => {
    await fetch(`${API_URL}/products/${editingProduct.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        price: Number(price),
        category,
        image,
      }),
    });

    setEditingProduct(null);
    setName("");
    setPrice("");
    setCategory("Burger");
    setImage("");

    fetchProducts();
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter((product) => product.category === selectedCategory);

  // Sağa Kaymayı Düzelten Kararlı Responsive Stiller
  const styles = {
    container: {
      minHeight: "100vh",
      width: "100%",               // Sağa kaymayı önlemek için 100vw yerine %100 yapıldı
      margin: "0 auto",            // Olası dış kapsayıcı kaymalarını engellemek için ortalandı
      left: 0,                     // Konumu sıfırlandı
      right: 0,
      boxSizing: "border-box",
      backgroundColor: "#0b0f17", 
      color: "#f8fafc",
      padding: "40px 24px",        // Her cihazda güvenli kenar boşluğu
      fontFamily: "'Inter', sans-serif",
      backgroundImage: "radial-gradient(circle at 50% 0%, #17192e 0%, #0b0f17 100%)",
    },
    wrapper: {
      width: "100%",
      maxWidth: "1440px",          // Çok devasa ekranlarda içeriğin patlamaması için ultra geniş üst sınır
      margin: "0 auto",            // İçeriği sayfaya tam ortalayan ana komut
      boxSizing: "border-box",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "40px",
      flexWrap: "wrap",
      gap: "24px",
      borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
      paddingBottom: "24px",
    },
    title: {
      fontSize: "32px",
      fontWeight: "800",
      letterSpacing: "0.5px",
      color: "#fff",
      margin: 0,
    },
    titleGold: {
      color: "#d4af37", 
      marginLeft: "8px",
      fontWeight: "400",
      fontSize: "20px",
      letterSpacing: "2px",
    },
    statsContainer: {
      display: "flex",
      gap: "16px",
      flexWrap: "wrap",
    },
    statCard: {
      backgroundColor: "rgba(20, 26, 41, 0.6)",
      padding: "16px 28px",
      borderRadius: "12px",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      minWidth: "120px",
      textAlign: "center",
    },
    statLabel: {
      color: "#64748b",
      fontSize: "11px",
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: "1px",
    },
    statValue: {
      fontSize: "28px",
      fontWeight: "700",
      color: "#d4af37",
      marginTop: "4px",
    },
    filterContainer: {
      display: "flex",
      justifyContent: "center",
      gap: "10px",
      flexWrap: "wrap",
      marginBottom: "40px",
    },
    filterButton: (isActive) => ({
      border: "none",
      padding: "10px 22px",
      borderRadius: "20px",
      cursor: "pointer",
      fontWeight: "600",
      fontSize: "13px",
      transition: "all 0.2s ease",
      backgroundColor: isActive ? "#d4af37" : "rgba(255, 255, 255, 0.04)",
      color: isActive ? "#0b0f17" : "#94a3b8",
      border: isActive ? "1px solid #d4af37" : "1px solid rgba(255, 255, 255, 0.08)",
    }),
    formContainer: {
      backgroundColor: "rgba(15, 22, 36, 0.7)",
      padding: "30px",
      borderRadius: "16px",
      marginBottom: "40px",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
    },
    formTitle: {
      fontSize: "18px",
      fontWeight: "700",
      color: "#fff",
      margin: "0 0 20px 0",
    },
    gridForm: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: "16px",
    },
    input: {
      padding: "12px 16px",
      borderRadius: "8px",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      backgroundColor: "#0f172a",
      color: "#fff",
      fontSize: "14px",
      outline: "none",
      transition: "border-color 0.2s",
    },
    submitButton: (isEdit) => ({
      marginTop: "20px",
      border: "none",
      padding: "12px 28px",
      borderRadius: "8px",
      backgroundColor: isEdit ? "#f97316" : "#d4af37",
      color: isEdit ? "#fff" : "#0b0f17",
      cursor: "pointer",
      fontWeight: "700",
      fontSize: "13px",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      transition: "opacity 0.2s",
    }),
    gridProducts: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
      gap: "24px",
    },
    productCard: {
      backgroundColor: "rgba(15, 22, 36, 0.5)",
      borderRadius: "14px",
      overflow: "hidden",
      border: "1px solid rgba(255, 255, 255, 0.06)",
      display: "flex",
      flexDirection: "column",
    },
    productImage: {
      width: "100%",
      height: "200px",
      objectFit: "cover",
    },
    productContent: {
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      flexGrow: 1,
    },
    productName: {
      fontSize: "18px",
      fontWeight: "700",
      color: "#fff",
      margin: "0 0 12px 0",
    },
    productMetaRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: "auto",
      marginBottom: "16px",
    },
    productPrice: {
      fontSize: "18px",
      fontWeight: "700",
      color: "#d4af37",
      margin: 0,
    },
    productCategory: {
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      color: "#94a3b8",
      padding: "4px 10px",
      borderRadius: "6px",
      fontSize: "12px",
      fontWeight: "600",
    },
    actionButtons: {
      display: "flex",
      gap: "10px",
    },
    editBtn: {
      flex: 1,
      border: "1px solid rgba(212, 175, 55, 0.3)",
      padding: "10px",
      borderRadius: "8px",
      backgroundColor: "transparent",
      color: "#d4af37",
      cursor: "pointer",
      fontWeight: "600",
      fontSize: "13px",
      transition: "all 0.2s",
    },
    deleteBtn: {
      flex: 1,
      border: "none",
      padding: "10px",
      borderRadius: "8px",
      backgroundColor: "rgba(239, 68, 68, 0.1)",
      color: "#f87171",
      cursor: "pointer",
      fontWeight: "600",
      fontSize: "13px",
      transition: "all 0.2s",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        
        {/* Üst Başlık Alanı */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              QUICKORDER <span style={styles.titleGold}>ADMIN PANEL</span>
            </h1>
          </div>

          <div style={styles.statsContainer}>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Toplam Ürün</div>
              <div style={styles.statValue}>{products.length}</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Kategori</div>
              <div style={styles.statValue}>6</div>
            </div>
          </div>
        </div>

        {/* Kategori Filtreleri */}
        <div style={styles.filterContainer}>
          {[
            { value: "All", label: "Tümü" },
            { value: "Burger", label: "Burger" },
            { value: "Pizza", label: "Pizza" },
            { value: "Doner", label: "Döner" },
            { value: "Drink", label: "İçecek" },
            { value: "Dessert", label: "Tatlı" },
            { value: "Snack", label: "Atıştırmalık" },
          ].map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              style={styles.filterButton(selectedCategory === cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Ürün Ekleme / Güncelleme Formu */}
        <div style={styles.formContainer}>
          <h2 style={styles.formTitle}>
            {editingProduct ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}
          </h2>

          <div style={styles.gridForm}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ürün Adı"
              style={styles.input}
            />

            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Fiyat (₺)"
              type="number"
              style={styles.input}
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ ...styles.input, cursor: "pointer" }}
            >
              <option value="Burger">Burger</option>
              <option value="Pizza">Pizza</option>
              <option value="Drink">İçecek</option>
              <option value="Dessert">Tatlı</option>
              <option value="Snack">Atıştırmalık</option>
              <option value="Doner">Döner</option>
            </select>

            <input
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="Görsel URL"
              style={styles.input}
            />
          </div>

          <button
            onClick={editingProduct ? updateProduct : createProduct}
            style={styles.submitButton(!!editingProduct)}
          >
            {editingProduct ? "Değişiklikleri Kaydet" : "Ürünü Ekle"}
          </button>
        </div>

        {/* Ürün Listesi */}
        <div style={styles.gridProducts}>
          {filteredProducts.map((product) => (
            <div key={product.id} style={styles.productCard}>
              <img
                src={product.image}
                alt={product.name}
                style={styles.productImage}
              />

              <div style={styles.productContent}>
                <h3 style={styles.productName}>{product.name}</h3>
                
                <div style={styles.productMetaRow}>
                  <p style={styles.productPrice}>{product.price} ₺</p>
                  <span style={styles.productCategory}>
                    {CATEGORY_NAMES[product.category] || product.category}
                  </span>
                </div>

                <div style={styles.actionButtons}>
                  <button
                    onClick={() => startEdit(product)}
                    style={styles.editBtn}
                  >
                    Düzenle
                  </button>

                  <button
                    onClick={() => deleteProduct(product.id)}
                    style={styles.deleteBtn}
                  >
                    Sil
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
      </div>
    </div>
  );
}

export default AdminPage;