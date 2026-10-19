import { useEffect, useState, useCallback } from "react";

const API_URL = "http://localhost:5000/api/inventory";

// Get token and send it with every request
async function apiRequest(url, options = {}) {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Login required. Please login again.");
  }

  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const text = await response.text();
  let result = {};

  try {
    result = text ? JSON.parse(text) : {};
  } catch {
    result = { message: text || "Invalid server response" };
  }

  if (!response.ok || result.success === false) {
    if (response.status === 401) {
      throw new Error("Session expired. Please login again.");
    }

    if (response.status === 403) {
      throw new Error("You do not have permission to perform this action.");
    }

    throw new Error(
      result.message || result.error || "Request failed"
    );
  }

  return result;
}

function Inventory() {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [editProduct, setEditProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const emptyProduct = {
    item_code: "",
    item_name: "",
    category: "",
    quantity: "",
    unit_price: "",
    supplier: "",
    status: "In Stock",
  };

  const [newProduct, setNewProduct] = useState({ ...emptyProduct });

  // GET INVENTORY
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await apiRequest(API_URL);

      const data = Array.isArray(result)
        ? result
        : Array.isArray(result.data)
          ? result.data
          : Array.isArray(result.products)
            ? result.products
            : [];

      setProducts(data);
    } catch (err) {
      console.error("Inventory loading error:", err);
      setError(err.message || "Failed to load inventory.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // VALIDATE PRODUCT
  const validateProduct = (product) => {
    if (
      !String(product.item_code || "").trim() ||
      !String(product.item_name || "").trim() ||
      !String(product.category || "").trim() ||
      product.quantity === "" ||
      product.unit_price === "" ||
      !String(product.supplier || "").trim()
    ) {
      alert("Please fill all fields.");
      return false;
    }

    if (
      !Number.isFinite(Number(product.quantity)) ||
      !Number.isFinite(Number(product.unit_price)) ||
      Number(product.quantity) < 0 ||
      Number(product.unit_price) < 0
    ) {
      alert("Please enter a valid quantity and price.");
      return false;
    }

    return true;
  };

  // ADD PRODUCT
  const handleAddProduct = async () => {
    if (!validateProduct(newProduct)) return;

    try {
      setSaving(true);

      await apiRequest(API_URL, {
        method: "POST",
        body: JSON.stringify({
          ...newProduct,
          quantity: Number(newProduct.quantity),
          unit_price: Number(newProduct.unit_price),
        }),
      });

      alert("Product added successfully!");

      setNewProduct({ ...emptyProduct });
      setShowForm(false);

      await fetchProducts();
    } catch (err) {
      console.error("Add product error:", err);
      alert(err.message || "Failed to add product.");
    } finally {
      setSaving(false);
    }
  };

  // DELETE PRODUCT
  const handleDelete = async (product) => {
    const id = product.id;

    if (id == null) {
      alert("Product ID is missing. Cannot delete this product.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      await apiRequest(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      alert("Product deleted successfully!");
      await fetchProducts();
    } catch (err) {
      console.error("Delete product error:", err);
      alert(err.message || "Failed to delete product.");
    }
  };

  // OPEN EDIT FORM
  const handleEdit = (product) => {
    setEditProduct({
      ...product,
      quantity: String(product.quantity ?? ""),
      unit_price: String(product.unit_price ?? ""),
    });
  };

  // UPDATE PRODUCT
  const handleUpdate = async () => {
    if (!editProduct || !validateProduct(editProduct)) return;

    if (editProduct.id == null) {
      alert("Product ID is missing. Cannot update this product.");
      return;
    }

    try {
      setSaving(true);

      await apiRequest(`${API_URL}/${editProduct.id}`, {
        method: "PUT",
        body: JSON.stringify({
          item_code: editProduct.item_code,
          item_name: editProduct.item_name,
          category: editProduct.category,
          quantity: Number(editProduct.quantity),
          unit_price: Number(editProduct.unit_price),
          supplier: editProduct.supplier,
          status: editProduct.status || "In Stock",
        }),
      });

      alert("Product updated successfully!");

      setEditProduct(null);
      await fetchProducts();
    } catch (err) {
      console.error("Update product error:", err);
      alert(err.message || "Failed to update product.");
    } finally {
      setSaving(false);
    }
  };

  // SEARCH
  const searchText = search.toLowerCase();

  const filteredProducts = products.filter((product) =>
    [
      product.item_code,
      product.item_name,
      product.category,
      product.supplier,
    ].some((value) =>
      String(value || "").toLowerCase().includes(searchText)
    )
  );

  // STATISTICS
  const totalProducts = products.length;

  const totalStock = products.reduce(
    (total, product) => total + Number(product.quantity || 0),
    0
  );

  const lowStockProducts = products.filter(
    (product) =>
      Number(product.quantity || 0) <= 10 &&
      product.status !== "Out of Stock"
  ).length;

  const totalInventoryValue = products.reduce(
    (total, product) =>
      total +
      Number(product.quantity || 0) * Number(product.unit_price || 0),
    0
  );

  const formatMoney = (amount) =>
    Number(amount || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });

  return (
    <main style={styles.page}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.title}>Inventory Management</h1>
          <p style={styles.subtitle}>
            Manage products, stock levels and inventory value
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          style={styles.addButton}
        >
          + Add Product
        </button>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div style={styles.errorBox}>
          <strong>Inventory Error:</strong> {error}
          <button
            onClick={fetchProducts}
            style={styles.retryButton}
            disabled={loading}
          >
            {loading ? "Loading..." : "Retry"}
          </button>
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div style={styles.summaryGrid}>
        <SummaryCard
          icon="📦"
          label="Total Products"
          value={totalProducts}
          note="Product types"
        />

        <SummaryCard
          icon="📊"
          label="Total Stock"
          value={totalStock}
          note="Items available"
        />

        <SummaryCard
          icon="⚠️"
          label="Low Stock"
          value={lowStockProducts}
          note={lowStockProducts > 0 ? "Needs attention" : "Stock is healthy"}
          noteColor={lowStockProducts > 0 ? "#dc2626" : "#16a34a"}
        />

        <SummaryCard
          icon="💰"
          label="Inventory Value"
          value={`₹${formatMoney(totalInventoryValue)}`}
          note="Current stock value"
        />
      </div>

      {/* SEARCH */}
      <div style={styles.toolbar}>
        <input
          type="text"
          placeholder="🔍 Search by product, category, code or supplier..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />

        <span style={styles.showingText}>
          Showing <strong>{filteredProducts.length}</strong> products
        </span>

        <button
          onClick={fetchProducts}
          style={styles.retryButton}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {/* ADD FORM */}
      {showForm && (
        <ProductForm
          title="Add New Product"
          product={newProduct}
          setProduct={setNewProduct}
          onSave={handleAddProduct}
          onCancel={() => {
            setShowForm(false);
            setNewProduct({ ...emptyProduct });
          }}
          saveLabel={saving ? "Saving..." : "Add Product"}
          saving={saving}
        />
      )}

      {/* EDIT FORM */}
      {editProduct && (
        <ProductForm
          title="Edit Product"
          product={editProduct}
          setProduct={setEditProduct}
          onSave={handleUpdate}
          onCancel={() => setEditProduct(null)}
          saveLabel={saving ? "Saving..." : "Save Changes"}
          saving={saving}
        />
      )}

      {/* PRODUCT TABLE */}
      <section style={styles.tableContainer}>
        <div style={styles.tableHeading}>
          <h2 style={styles.tableTitle}>Product Inventory</h2>
          <p style={styles.subtitle}>
            Complete list of products and stock status
          </p>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                {[
                  "Item Code",
                  "Product",
                  "Category",
                  "Quantity",
                  "Unit Price",
                  "Stock Value",
                  "Status",
                  "Actions",
                ].map((heading) => (
                  <th key={heading} style={styles.headerCell}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={styles.emptyCell}>
                    Loading inventory...
                  </td>
                </tr>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                  const quantity = Number(product.quantity || 0);
                  const price = Number(product.unit_price || 0);

                  const isLowStock =
                    quantity <= 10 && product.status !== "Out of Stock";

                  return (
                    <tr key={product.id ?? product.item_code}>
                      <td style={styles.bodyCell}>
                        <span style={styles.codeBadge}>
                          {product.item_code}
                        </span>
                      </td>

                      <td style={styles.bodyCell}>
                        <strong>{product.item_name}</strong>
                      </td>

                      <td style={styles.bodyCell}>
                        <span style={styles.categoryBadge}>
                          {product.category}
                        </span>
                      </td>

                      <td
                        style={{
                          ...styles.bodyCell,
                          color: isLowStock ? "#dc2626" : "#0f172a",
                          fontWeight: 600,
                        }}
                      >
                        {quantity}
                      </td>

                      <td style={styles.bodyCell}>
                        ₹{formatMoney(price)}
                      </td>

                      <td
                        style={{
                          ...styles.bodyCell,
                          color: "#15803d",
                          fontWeight: 600,
                        }}
                      >
                        ₹{formatMoney(quantity * price)}
                      </td>

                      <td style={styles.bodyCell}>
                        <span
                          style={
                            product.status === "Out of Stock"
                              ? styles.outOfStockBadge
                              : product.status === "Low Stock" || isLowStock
                                ? styles.lowStockBadge
                                : styles.inStockBadge
                          }
                        >
                          {product.status === "Out of Stock"
                            ? "✕ Out of Stock"
                            : product.status === "Low Stock" || isLowStock
                              ? "⚠ Low Stock"
                              : "✓ In Stock"}
                        </span>
                      </td>

                      <td style={styles.bodyCell}>
                        <button
                          onClick={() => handleEdit(product)}
                          style={styles.editButton}
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(product)}
                          style={styles.deleteButton}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" style={styles.emptyCell}>
                    <div style={{ fontSize: 36 }}>📦</div>
                    <strong>
                      {error
                        ? "Could not load products"
                        : search
                          ? "No matching products found"
                          : "No products found"}
                    </strong>
                    <p style={styles.subtitle}>
                      {error
                        ? "Check the error message above and try again."
                        : search
                          ? "Try a different search term."
                          : "Click Add Product to add your first product."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

// SUMMARY CARD
function SummaryCard({ icon, label, value, note, noteColor }) {
  return (
    <div style={styles.summaryCard}>
      <span style={styles.summaryIcon}>{icon}</span>

      <div style={{ minWidth: 0 }}>
        <p style={styles.cardLabel}>{label}</p>
        <h2 style={styles.cardValue}>{value}</h2>

        <span
          style={{
            ...styles.cardNote,
            color: noteColor || "#64748b",
          }}
        >
          {note}
        </span>
      </div>
    </div>
  );
}

// ADD / EDIT FORM
function ProductForm({
  title,
  product,
  setProduct,
  onSave,
  onCancel,
  saveLabel,
  saving,
}) {
  const updateField = (field, value) => {
    setProduct({ ...product, [field]: value });
  };

  return (
    <section style={styles.formCard}>
      <div style={styles.formHeader}>
        <div>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <p style={styles.subtitle}>Enter product and stock details</p>
        </div>

        <button onClick={onCancel} style={styles.closeButton}>
          ✕
        </button>
      </div>

      <div style={styles.formGrid}>
        <input
          style={styles.input}
          placeholder="Item Code"
          value={product.item_code}
          onChange={(e) => updateField("item_code", e.target.value)}
        />

        <input
          style={styles.input}
          placeholder="Product Name"
          value={product.item_name}
          onChange={(e) => updateField("item_name", e.target.value)}
        />

        <input
          style={styles.input}
          placeholder="Category"
          value={product.category}
          onChange={(e) => updateField("category", e.target.value)}
        />

        <input
          style={styles.input}
          type="number"
          min="0"
          placeholder="Quantity"
          value={product.quantity}
          onChange={(e) => updateField("quantity", e.target.value)}
        />

        <input
          style={styles.input}
          type="number"
          min="0"
          step="0.01"
          placeholder="Unit Price"
          value={product.unit_price}
          onChange={(e) => updateField("unit_price", e.target.value)}
        />

        <input
          style={styles.input}
          placeholder="Supplier"
          value={product.supplier}
          onChange={(e) => updateField("supplier", e.target.value)}
        />

        <select
          style={styles.input}
          value={product.status || "In Stock"}
          onChange={(e) => updateField("status", e.target.value)}
        >
          <option value="In Stock">In Stock</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>
      </div>

      <div style={{ marginTop: 20 }}>
        <button
          onClick={onSave}
          style={styles.saveButton}
          disabled={saving}
        >
          {saveLabel}
        </button>

        <button
          onClick={onCancel}
          style={styles.cancelButton}
          disabled={saving}
        >
          Cancel
        </button>
      </div>
    </section>
  );
}

// STYLES
const styles = {
  page: {
    width: "100%",
    minHeight: "100%",
    padding: "28px",
    background: "#f1f5f9",
    boxSizing: "border-box",
    color: "#0f172a",
  },

  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 25,
  },

  title: {
    margin: 0,
    fontSize: "clamp(24px, 3vw, 32px)",
    color: "#0f172a",
  },

  subtitle: {
    margin: "7px 0 0",
    color: "#64748b",
    fontSize: 14,
  },

  addButton: {
    padding: "12px 20px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: 18,
    marginBottom: 25,
  },

  summaryCard: {
    minWidth: 0,
    background: "white",
    padding: 20,
    borderRadius: 12,
    boxShadow: "0 2px 8px rgba(15,23,42,0.07)",
    display: "flex",
    alignItems: "center",
    gap: 14,
  },

  summaryIcon: {
    fontSize: 30,
    flexShrink: 0,
  },

  cardLabel: {
    margin: 0,
    color: "#64748b",
    fontSize: 14,
  },

  cardValue: {
    margin: "6px 0",
    color: "#0f172a",
    fontSize: "clamp(18px, 2vw, 26px)",
    overflowWrap: "anywhere",
  },

  cardNote: {
    fontSize: 13,
  },

  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
    background: "white",
    padding: 18,
    borderRadius: 12,
    boxShadow: "0 2px 8px rgba(15,23,42,0.07)",
    marginBottom: 22,
  },

  searchInput: {
    flex: "1 1 300px",
    minWidth: 0,
    padding: "12px 15px",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    fontSize: 14,
  },

  showingText: {
    color: "#64748b",
    fontSize: 14,
    whiteSpace: "nowrap",
  },

  errorBox: {
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },

  retryButton: {
    padding: "9px 14px",
    background: "#e2e8f0",
    color: "#0f172a",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },

  formCard: {
    background: "white",
    padding: 24,
    borderRadius: 12,
    boxShadow: "0 2px 8px rgba(15,23,42,0.07)",
    marginBottom: 22,
  },

  formHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 20,
  },

  closeButton: {
    border: "none",
    background: "#f1f5f9",
    borderRadius: 6,
    padding: "8px 10px",
    cursor: "pointer",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 15,
  },

  input: {
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    padding: "12px 14px",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    fontSize: 14,
    background: "white",
  },

  saveButton: {
    padding: "11px 20px",
    background: "#16a34a",
    color: "white",
    border: "none",
    borderRadius: 7,
    cursor: "pointer",
    fontWeight: 600,
  },

  cancelButton: {
    padding: "11px 20px",
    marginLeft: 10,
    background: "#64748b",
    color: "white",
    border: "none",
    borderRadius: 7,
    cursor: "pointer",
  },

  tableContainer: {
    background: "white",
    borderRadius: 12,
    boxShadow: "0 2px 8px rgba(15,23,42,0.07)",
    overflow: "hidden",
  },

  tableHeading: {
    padding: "22px 24px",
    borderBottom: "1px solid #e2e8f0",
  },

  tableTitle: {
    margin: 0,
    fontSize: 20,
    color: "#0f172a",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 850,
  },

  headerCell: {
    padding: 15,
    textAlign: "left",
    background: "#f8fafc",
    color: "#475569",
    fontSize: 13,
    borderBottom: "1px solid #e2e8f0",
    whiteSpace: "nowrap",
  },

  bodyCell: {
    padding: 15,
    borderBottom: "1px solid #e2e8f0",
    color: "#475569",
    fontSize: 14,
    whiteSpace: "nowrap",
  },

  codeBadge: {
    padding: "5px 9px",
    background: "#eff6ff",
    color: "#2563eb",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
  },

  categoryBadge: {
    padding: "6px 10px",
    background: "#f1f5f9",
    color: "#475569",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
  },

  lowStockBadge: {
    display: "inline-block",
    padding: "6px 10px",
    background: "#fef2f2",
    color: "#dc2626",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
  },

  outOfStockBadge: {
    display: "inline-block",
    padding: "6px 10px",
    background: "#fef2f2",
    color: "#dc2626",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
  },

  inStockBadge: {
    display: "inline-block",
    padding: "6px 10px",
    background: "#f0fdf4",
    color: "#16a34a",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
  },

  editButton: {
    padding: "7px 10px",
    background: "#eff6ff",
    color: "#2563eb",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    marginRight: 7,
  },

  deleteButton: {
    padding: "7px 10px",
    background: "#fef2f2",
    color: "#dc2626",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },

  emptyCell: {
    padding: 45,
    textAlign: "center",
    color: "#475569",
  },
};

export default Inventory;