import React, { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api/sales";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const emptyForm = {
  invoice_no: "",
  customer_name: "",
  product_name: "",
  quantity: 1,
  unit_price: 0,
  total_amount: 0,
  payment_method: "Cash",
  sale_date: new Date().toISOString().split("T")[0],
  status: "Completed",
};

function Sales() {
  const [sales, setSales] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =========================
  // HANDLE API RESPONSE
  // =========================

  const getResponseData = async (response) => {
    const text = await response.text();

    let result = {};

    try {
      result = text ? JSON.parse(text) : {};
    } catch {
      throw new Error("Server returned an invalid response.");
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(
          "Login session expired or token is missing. Please login again."
        );
      }

      if (response.status === 403) {
        throw new Error(
          result.message || result.error || "You do not have permission."
        );
      }

      throw new Error(
        result.message ||
          result.error ||
          `Request failed with status ${response.status}`
      );
    }

    if (result.success === false) {
      throw new Error(
        result.message || result.error || "Request failed."
      );
    }

    return result;
  };

  // =========================
  // LOAD SALES
  // =========================

  const fetchSales = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      const result = await getResponseData(response);

      const salesData = Array.isArray(result)
        ? result
        : Array.isArray(result.data)
        ? result.data
        : Array.isArray(result.sales)
        ? result.sales
        : [];

      setSales(salesData);
    } catch (err) {
      console.error("Sales loading error:", err);
      setError(err.message || "Failed to load sales.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  // =========================
  // HANDLE INPUT CHANGE
  // =========================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => {
      const updated = {
        ...previous,
        [name]: value,
      };

      if (name === "quantity" || name === "unit_price") {
        updated.total_amount =
          Number(
            name === "quantity" ? value : updated.quantity
          ) *
          Number(
            name === "unit_price" ? value : updated.unit_price
          );
      }

      return updated;
    });
  };

  // =========================
  // OPEN ADD FORM
  // =========================

  const handleAdd = () => {
    setEditingId(null);

    setFormData({
      ...emptyForm,
      sale_date: new Date().toISOString().split("T")[0],
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  // =========================
  // OPEN EDIT FORM
  // =========================

  const handleEdit = (sale) => {
    setEditingId(sale.id ?? sale.sale_id ?? sale.invoice_no);

    setFormData({
      invoice_no: sale.invoice_no || "",
      customer_name: sale.customer_name || "",
      product_name: sale.product_name || "",
      quantity: Number(sale.quantity || 1),
      unit_price: Number(sale.unit_price || 0),
      total_amount: Number(
        sale.total_amount ??
          Number(sale.quantity || 0) * Number(sale.unit_price || 0)
      ),
      payment_method: sale.payment_method || "Cash",
      sale_date: sale.sale_date
        ? String(sale.sale_date).split("T")[0].split(" ")[0]
        : new Date().toISOString().split("T")[0],
      status: sale.status || "Completed",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  // =========================
  // SAVE SALE
  // ADD / UPDATE
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (
      !formData.invoice_no.trim() ||
      !formData.customer_name.trim() ||
      !formData.product_name.trim()
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (
      Number(formData.quantity) <= 0 ||
      Number(formData.unit_price) < 0
    ) {
      setError("Quantity must be greater than zero and price cannot be negative.");
      return;
    }

    const totalAmount =
      Number(formData.quantity) * Number(formData.unit_price);

    const payload = {
      ...formData,
      quantity: Number(formData.quantity),
      unit_price: Number(formData.unit_price),
      total_amount: totalAmount,
    };

    setSaving(true);

    try {
      const isEditing = editingId !== null;

      const response = await fetch(
        isEditing
          ? `${API_URL}/${encodeURIComponent(editingId)}`
          : API_URL,
        {
          method: isEditing ? "PUT" : "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        }
      );

      await getResponseData(response);

      setSuccess(
        isEditing
          ? "Sale updated successfully!"
          : "Sale added successfully!"
      );

      setShowForm(false);
      setEditingId(null);
      setFormData(emptyForm);

      await fetchSales();
    } catch (err) {
      console.error("Save sale error:", err);
      setError(err.message || "Failed to save sale.");
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // DELETE SALE
  // =========================

  const handleDelete = async (sale) => {
    const saleId = sale.id ?? sale.sale_id ?? sale.invoice_no;

    if (!saleId) {
      setError("Unable to identify this sale record.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete invoice ${sale.invoice_no || saleId}?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/${encodeURIComponent(saleId)}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      await getResponseData(response);

      setSuccess("Sale deleted successfully!");

      await fetchSales();
    } catch (err) {
      console.error("Delete sale error:", err);
      setError(err.message || "Failed to delete sale.");
    }
  };

  // =========================
  // SEARCH SALES
  // =========================

  const filteredSales = sales.filter((sale) => {
    const searchText = search.toLowerCase();

    return (
      String(sale.invoice_no || "").toLowerCase().includes(searchText) ||
      String(sale.customer_name || "").toLowerCase().includes(searchText) ||
      String(sale.product_name || "").toLowerCase().includes(searchText) ||
      String(sale.payment_method || "").toLowerCase().includes(searchText) ||
      String(sale.status || "").toLowerCase().includes(searchText)
    );
  });

  // =========================
  // DASHBOARD TOTALS
  // =========================

  const totalSales = sales.reduce(
    (total, sale) => total + Number(sale.total_amount || 0),
    0
  );

  const totalTransactions = sales.length;

  const completedSales = sales.filter(
    (sale) => sale.status === "Completed"
  ).length;

  const currency = (amount) =>
    Number(amount || 0).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    });

  // =========================
  // PAGE DESIGN
  // =========================

  return (
    <div
      style={{
        padding: "25px",
        fontFamily: "Arial, sans-serif",
        color: "#1f2937",
        background: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "15px",
          marginBottom: "25px",
        }}
      >
        <div>
          <h1 style={{ margin: "0 0 8px", fontSize: "28px" }}>
            Sales Management
          </h1>

          <p style={{ margin: 0, color: "#64748b" }}>
            Manage sales transactions, invoices and payments.
          </p>
        </div>

        <button
          onClick={handleAdd}
          style={buttonStyle("#2563eb")}
        >
          + Add Sale
        </button>
      </div>

      {/* SUCCESS MESSAGE */}

      {success && (
        <div style={messageStyle("#dcfce7", "#166534")}>
          {success}
          <button
            onClick={() => setSuccess("")}
            style={closeButtonStyle}
          >
            ×
          </button>
        </div>
      )}

      {/* ERROR MESSAGE */}

      {error && (
        <div style={messageStyle("#fee2e2", "#991b1b")}>
          {error}
          <button
            onClick={() => setError("")}
            style={closeButtonStyle}
          >
            ×
          </button>
        </div>
      )}

      {/* SUMMARY CARDS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: "18px",
          marginBottom: "25px",
        }}
      >
        <SummaryCard
          title="Total Transactions"
          value={totalTransactions}
          color="#2563eb"
        />

        <SummaryCard
          title="Total Sales"
          value={currency(totalSales)}
          color="#059669"
        />

        <SummaryCard
          title="Completed Sales"
          value={completedSales}
          color="#7c3aed"
        />
      </div>

      {/* ADD / EDIT FORM */}

      {showForm && (
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>
            {editingId !== null ? "Edit Sale" : "Add New Sale"}
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={formGridStyle}>
              <FormField
                label="Invoice Number *"
                name="invoice_no"
                value={formData.invoice_no}
                onChange={handleChange}
                required
              />

              <FormField
                label="Customer Name *"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleChange}
                required
              />

              <FormField
                label="Product Name *"
                name="product_name"
                value={formData.product_name}
                onChange={handleChange}
                required
              />

              <FormField
                label="Quantity *"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleChange}
                min="1"
                required
              />

              <FormField
                label="Unit Price (₹) *"
                name="unit_price"
                type="number"
                value={formData.unit_price}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />

              <div>
                <label style={labelStyle}>Total Amount</label>
                <input
                  value={currency(
                    Number(formData.quantity) *
                      Number(formData.unit_price)
                  )}
                  readOnly
                  style={{
                    ...inputStyle,
                    background: "#f1f5f9",
                  }}
                />
              </div>

              <div>
                <label style={labelStyle}>Payment Method</label>
                <select
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Online">Online</option>
                </select>
              </div>

              <FormField
                label="Sale Date"
                name="sale_date"
                type="date"
                value={formData.sale_date}
                onChange={handleChange}
                required
              />

              <div>
                <label style={labelStyle}>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "22px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="submit"
                disabled={saving}
                style={buttonStyle(saving ? "#94a3b8" : "#2563eb")}
              >
                {saving
                  ? "Saving..."
                  : editingId !== null
                  ? "Update Sale"
                  : "Save Sale"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData(emptyForm);
                  setError("");
                }}
                style={buttonStyle("#64748b")}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SALES TABLE */}

      <div style={cardStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "15px",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ margin: 0 }}>Sales Transactions</h2>

          <input
            type="text"
            placeholder="Search sales..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              ...inputStyle,
              maxWidth: "300px",
            }}
          />
        </div>

        {loading ? (
          <p style={{ textAlign: "center", padding: "30px" }}>
            Loading sales data...
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "1050px",
              }}
            >
              <thead>
                <tr style={{ background: "#f1f5f9" }}>
                  {[
                    "Invoice No",
                    "Customer",
                    "Product",
                    "Quantity",
                    "Unit Price",
                    "Total Amount",
                    "Payment",
                    "Sale Date",
                    "Status",
                    "Actions",
                  ].map((heading) => (
                    <th key={heading} style={thStyle}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredSales.length === 0 ? (
                  <tr>
                    <td
                      colSpan="10"
                      style={{
                        textAlign: "center",
                        padding: "30px",
                        color: "#64748b",
                      }}
                    >
                      {error
                        ? "Sales data could not be loaded."
                        : search
                        ? "No matching sales found."
                        : "No sales records found. Click Add Sale to create one."}
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale, index) => (
                    <tr
                      key={
                        sale.id ??
                        sale.sale_id ??
                        sale.invoice_no ??
                        index
                      }
                    >
                      <td style={tdStyle}>
                        {sale.invoice_no || "-"}
                      </td>

                      <td style={tdStyle}>
                        {sale.customer_name || "-"}
                      </td>

                      <td style={tdStyle}>
                        {sale.product_name || "-"}
                      </td>

                      <td style={tdStyle}>
                        {sale.quantity ?? 0}
                      </td>

                      <td style={tdStyle}>
                        {currency(sale.unit_price)}
                      </td>

                      <td style={tdStyle}>
                        <strong>
                          {currency(sale.total_amount)}
                        </strong>
                      </td>

                      <td style={tdStyle}>
                        {sale.payment_method || "-"}
                      </td>

                      <td style={tdStyle}>
                        {sale.sale_date
                          ? String(sale.sale_date)
                              .split("T")[0]
                              .split(" ")[0]
                          : "-"}
                      </td>

                      <td style={tdStyle}>
                        <span
                          style={{
                            padding: "5px 9px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            background:
                              sale.status === "Completed"
                                ? "#dcfce7"
                                : sale.status === "Cancelled"
                                ? "#fee2e2"
                                : "#fef3c7",
                            color:
                              sale.status === "Completed"
                                ? "#166534"
                                : sale.status === "Cancelled"
                                ? "#991b1b"
                                : "#92400e",
                          }}
                        >
                          {sale.status || "Pending"}
                        </span>
                      </td>

                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: "7px" }}>
                          <button
                            onClick={() => handleEdit(sale)}
                            style={smallButtonStyle("#2563eb")}
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => handleDelete(sale)}
                            style={smallButtonStyle("#dc2626")}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <div
          style={{
            marginTop: "15px",
            color: "#64748b",
            fontSize: "13px",
          }}
        >
          Showing {filteredSales.length} of {sales.length} sales records
        </div>
      </div>
    </div>
  );
}

// =========================
// REUSABLE SUMMARY CARD
// =========================

function SummaryCard({ title, value, color }) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "12px",
        padding: "22px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        borderLeft: `4px solid ${color}`,
      }}
    >
      <p
        style={{
          margin: "0 0 12px",
          color: "#64748b",
          fontSize: "14px",
        }}
      >
        {title}
      </p>

      <h2
        style={{
          margin: 0,
          fontSize: "25px",
          color,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </h2>
    </div>
  );
}

// =========================
// REUSABLE FORM FIELD
// =========================

function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  required = false,
  min,
  step,
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        min={min}
        step={step}
        style={inputStyle}
      />
    </div>
  );
}

// =========================
// STYLES
// =========================

const cardStyle = {
  background: "#ffffff",
  borderRadius: "12px",
  padding: "22px",
  marginBottom: "25px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "18px",
};

const labelStyle = {
  display: "block",
  marginBottom: "7px",
  fontWeight: "600",
  fontSize: "14px",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "7px",
  fontSize: "14px",
  outline: "none",
  background: "#ffffff",
};

const thStyle = {
  padding: "13px 12px",
  textAlign: "left",
  fontSize: "13px",
  color: "#475569",
  borderBottom: "1px solid #e2e8f0",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "13px 12px",
  fontSize: "13px",
  borderBottom: "1px solid #e2e8f0",
  whiteSpace: "nowrap",
};

const buttonStyle = (background) => ({
  background,
  color: "#ffffff",
  border: "none",
  borderRadius: "7px",
  padding: "11px 17px",
  fontSize: "14px",
  fontWeight: "600",
  cursor: "pointer",
});

const smallButtonStyle = (background) => ({
  background,
  color: "#ffffff",
  border: "none",
  borderRadius: "5px",
  padding: "7px 10px",
  fontSize: "12px",
  cursor: "pointer",
});

const messageStyle = (background, color) => ({
  background,
  color,
  padding: "13px 15px",
  borderRadius: "7px",
  marginBottom: "20px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
});

const closeButtonStyle = {
  border: "none",
  background: "transparent",
  color: "inherit",
  fontSize: "22px",
  cursor: "pointer",
};

export default Sales;