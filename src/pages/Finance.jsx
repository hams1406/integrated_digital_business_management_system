import React, { useCallback, useEffect, useMemo, useState } from "react";

const API_URL = "http://localhost:5000/api/finance";

const EMPTY_FORM = {
  transaction_no: "",
  transaction_type: "Income",
  category: "",
  description: "",
  amount: "",
  payment_method: "Cash",
  transaction_date: "",
  status: "Completed",
};

// API request helper: Sends JWT token with every request
async function apiRequest(url, options = {}) {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Access token missing. Please login again.");
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
      result.message || result.error || "Finance API request failed."
    );
  }

  return result;
}

function Finance() {
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editTransaction, setEditTransaction] = useState(null);

  // FETCH TRANSACTIONS
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await apiRequest(API_URL);

      const data = Array.isArray(result)
        ? result
        : Array.isArray(result.data)
          ? result.data
          : Array.isArray(result.transactions)
            ? result.transactions
            : [];

      setTransactions(data);
    } catch (err) {
      console.error("Fetch Finance Error:", err);
      setError(err.message || "Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // FORM CHANGE
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // VALIDATE FORM
  const validateTransaction = (transaction) => {
    if (
      !String(transaction.transaction_no || "").trim() ||
      !String(transaction.category || "").trim() ||
      !String(transaction.description || "").trim() ||
      transaction.amount === "" ||
      !transaction.transaction_date
    ) {
      alert("Please fill all required fields.");
      return false;
    }

    if (
      !Number.isFinite(Number(transaction.amount)) ||
      Number(transaction.amount) < 0
    ) {
      alert("Please enter a valid amount.");
      return false;
    }

    return true;
  };

  // ADD TRANSACTION
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateTransaction(form)) return;

    try {
      setSaving(true);

      await apiRequest(API_URL, {
        method: "POST",
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
        }),
      });

      alert("Transaction added successfully!");

      setForm({ ...EMPTY_FORM });

      await fetchTransactions();
    } catch (err) {
      console.error("Add Finance Error:", err);
      alert(err.message || "Failed to add transaction.");
    } finally {
      setSaving(false);
    }
  };

  // DELETE TRANSACTION
  const handleDelete = async (id) => {
    if (id == null) {
      alert("Transaction ID is missing.");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this transaction?"
    );

    if (!confirmDelete) return;

    try {
      await apiRequest(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      alert("Transaction deleted successfully!");

      await fetchTransactions();
    } catch (err) {
      console.error("Delete Finance Error:", err);
      alert(err.message || "Failed to delete transaction.");
    }
  };

  // START EDIT
  const handleEdit = (transaction) => {
    setEditTransaction({
      ...transaction,
      amount: String(transaction.amount ?? ""),
      transaction_date: transaction.transaction_date
        ? String(transaction.transaction_date).split("T")[0]
        : "",
    });
  };

  // EDIT FORM CHANGE
  const handleEditChange = (event) => {
    const { name, value } = event.target;

    setEditTransaction((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // UPDATE TRANSACTION
  const handleUpdate = async (event) => {
    event.preventDefault();

    if (!editTransaction) return;

    if (!validateTransaction(editTransaction)) return;

    if (editTransaction.id == null) {
      alert("Transaction ID is missing. Cannot update.");
      return;
    }

    try {
      setSaving(true);

      await apiRequest(`${API_URL}/${editTransaction.id}`, {
        method: "PUT",
        body: JSON.stringify({
          transaction_no: editTransaction.transaction_no,
          transaction_type: editTransaction.transaction_type,
          category: editTransaction.category,
          description: editTransaction.description,
          amount: Number(editTransaction.amount),
          payment_method: editTransaction.payment_method,
          transaction_date: editTransaction.transaction_date,
          status: editTransaction.status,
        }),
      });

      alert("Transaction updated successfully!");

      setEditTransaction(null);

      await fetchTransactions();
    } catch (err) {
      console.error("Update Finance Error:", err);
      alert(err.message || "Failed to update transaction.");
    } finally {
      setSaving(false);
    }
  };

  // SEARCH
  const filteredTransactions = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    if (!searchText) return transactions;

    return transactions.filter((transaction) =>
      [
        transaction.transaction_no,
        transaction.transaction_type,
        transaction.category,
        transaction.description,
        transaction.payment_method,
        transaction.status,
      ].some((value) =>
        String(value || "").toLowerCase().includes(searchText)
      )
    );
  }, [transactions, search]);

  // MONEY FORMAT
  const formatAmount = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

  // SUMMARY
  const totalIncome = transactions
    .filter(
      (transaction) =>
        transaction.transaction_type === "Income" &&
        transaction.status !== "Cancelled"
    )
    .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);

  const totalExpense = transactions
    .filter(
      (transaction) =>
        transaction.transaction_type === "Expense" &&
        transaction.status !== "Cancelled"
    )
    .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);

  const currentBalance = totalIncome - totalExpense;

  return (
    <main style={styles.page}>
      {/* HEADER */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.title}>Finance Management</h1>
          <p style={styles.subtitle}>
            Manage income, expenses and financial transactions
          </p>
        </div>

        <button
          type="button"
          style={styles.refreshButton}
          onClick={fetchTransactions}
          disabled={loading}
        >
          {loading ? "Loading..." : "↻ Refresh"}
        </button>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div style={styles.errorBox}>
          <span>{error}</span>

          <button
            type="button"
            onClick={fetchTransactions}
            style={styles.retryButton}
            disabled={loading}
          >
            Retry
          </button>
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div style={styles.cards}>
        <SummaryCard
          title="Total Income"
          value={formatAmount(totalIncome)}
          color="#16a34a"
        />

        <SummaryCard
          title="Total Expense"
          value={formatAmount(totalExpense)}
          color="#dc2626"
        />

        <SummaryCard
          title="Current Balance"
          value={formatAmount(currentBalance)}
          color={currentBalance < 0 ? "#dc2626" : "#2563eb"}
        />

        <SummaryCard
          title="Transactions"
          value={transactions.length}
          color="#7c3aed"
        />
      </div>

      {/* ADD TRANSACTION */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Add Transaction</h2>

        <form onSubmit={handleSubmit}>
          <div style={styles.formGrid}>
            <FormField label="Transaction No">
              <input
                style={styles.input}
                name="transaction_no"
                value={form.transaction_no}
                onChange={handleChange}
                placeholder="TXN001"
                required
              />
            </FormField>

            <FormField label="Transaction Type">
              <select
                style={styles.input}
                name="transaction_type"
                value={form.transaction_type}
                onChange={handleChange}
              >
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
              </select>
            </FormField>

            <FormField label="Category">
              <input
                style={styles.input}
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="Sales"
                required
              />
            </FormField>

            <FormField label="Description">
              <input
                style={styles.input}
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Transaction description"
                required
              />
            </FormField>

            <FormField label="Amount">
              <input
                style={styles.input}
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                placeholder="0"
                min="0"
                step="0.01"
                required
              />
            </FormField>

            <FormField label="Payment Method">
              <select
                style={styles.input}
                name="payment_method"
                value={form.payment_method}
                onChange={handleChange}
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
              </select>
            </FormField>

            <FormField label="Transaction Date">
              <input
                style={styles.input}
                type="date"
                name="transaction_date"
                value={form.transaction_date}
                onChange={handleChange}
                required
              />
            </FormField>

            <FormField label="Status">
              <select
                style={styles.input}
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </FormField>
          </div>

          <button
            type="submit"
            style={styles.button}
            disabled={saving}
          >
            {saving ? "Saving..." : "Add Transaction"}
          </button>
        </form>
      </section>

      {/* TRANSACTION LIST */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Financial Transactions</h2>

        <input
          style={styles.search}
          type="text"
          placeholder="Search transaction..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        {loading ? (
          <p>Loading transactions...</p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {[
                    "ID",
                    "Transaction No",
                    "Type",
                    "Category",
                    "Description",
                    "Amount",
                    "Payment",
                    "Date",
                    "Status",
                    "Actions",
                  ].map((heading) => (
                    <th key={heading} style={styles.th}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={styles.emptyCell}>
                      {error
                        ? "Unable to load transactions. Check the error above."
                        : search
                          ? "No matching transactions found."
                          : "No transactions found."}
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction.id ?? transaction.transaction_no}>
                      <td style={styles.td}>{transaction.id}</td>
                      <td style={styles.td}>{transaction.transaction_no}</td>
                      <td style={styles.td}>
                        {transaction.transaction_type}
                      </td>
                      <td style={styles.td}>{transaction.category}</td>
                      <td style={styles.td}>{transaction.description}</td>
                      <td style={styles.td}>
                        {formatAmount(transaction.amount)}
                      </td>
                      <td style={styles.td}>{transaction.payment_method}</td>
                      <td style={styles.td}>
                        {transaction.transaction_date
                          ? String(transaction.transaction_date).split("T")[0]
                          : ""}
                      </td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.status,
                            ...(transaction.status === "Completed"
                              ? styles.completedStatus
                              : transaction.status === "Pending"
                                ? styles.pendingStatus
                                : styles.cancelledStatus),
                          }}
                        >
                          {transaction.status}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button
                          type="button"
                          style={styles.editButton}
                          onClick={() => handleEdit(transaction)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          style={styles.deleteButton}
                          onClick={() => handleDelete(transaction.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* EDIT MODAL */}
      {editTransaction && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.sectionTitle}>Edit Transaction</h2>

              <button
                type="button"
                style={styles.closeButton}
                onClick={() => setEditTransaction(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdate}>
              <div style={styles.formGrid}>
                <FormField label="Transaction No">
                  <input
                    style={styles.input}
                    name="transaction_no"
                    value={editTransaction.transaction_no || ""}
                    onChange={handleEditChange}
                    required
                  />
                </FormField>

                <FormField label="Transaction Type">
                  <select
                    style={styles.input}
                    name="transaction_type"
                    value={editTransaction.transaction_type || "Income"}
                    onChange={handleEditChange}
                  >
                    <option value="Income">Income</option>
                    <option value="Expense">Expense</option>
                  </select>
                </FormField>

                <FormField label="Category">
                  <input
                    style={styles.input}
                    name="category"
                    value={editTransaction.category || ""}
                    onChange={handleEditChange}
                    required
                  />
                </FormField>

                <FormField label="Description">
                  <input
                    style={styles.input}
                    name="description"
                    value={editTransaction.description || ""}
                    onChange={handleEditChange}
                    required
                  />
                </FormField>

                <FormField label="Amount">
                  <input
                    style={styles.input}
                    type="number"
                    name="amount"
                    value={editTransaction.amount}
                    onChange={handleEditChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </FormField>

                <FormField label="Payment Method">
                  <select
                    style={styles.input}
                    name="payment_method"
                    value={editTransaction.payment_method || "Cash"}
                    onChange={handleEditChange}
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </FormField>

                <FormField label="Transaction Date">
                  <input
                    style={styles.input}
                    type="date"
                    name="transaction_date"
                    value={editTransaction.transaction_date || ""}
                    onChange={handleEditChange}
                    required
                  />
                </FormField>

                <FormField label="Status">
                  <select
                    style={styles.input}
                    name="status"
                    value={editTransaction.status || "Completed"}
                    onChange={handleEditChange}
                  >
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </FormField>
              </div>

              <div style={styles.modalActions}>
                <button
                  type="submit"
                  style={styles.button}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Update Transaction"}
                </button>

                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={() => setEditTransaction(null)}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

// SUMMARY CARD
function SummaryCard({ title, value, color }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}>{title}</div>
      <div style={{ ...styles.cardValue, color }}>{value}</div>
    </div>
  );
}

// FORM FIELD
function FormField({ label, children }) {
  return (
    <div style={styles.inputGroup}>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  );
}

// STYLES
const styles = {
  page: {
    width: "100%",
    minHeight: "100%",
    padding: 24,
    boxSizing: "border-box",
    background: "#f5f7fb",
    color: "#1f2937",
  },

  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: 700,
    margin: 0,
    color: "#1f2937",
  },

  subtitle: {
    color: "#6b7280",
    marginTop: 8,
    marginBottom: 0,
  },

  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: 18,
    marginBottom: 24,
  },

  card: {
    background: "#fff",
    borderRadius: 12,
    padding: 20,
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
    minWidth: 0,
  },

  cardTitle: {
    color: "#6b7280",
    fontSize: 14,
    marginBottom: 8,
  },

  cardValue: {
    fontSize: "clamp(20px, 2vw, 26px)",
    fontWeight: 700,
    overflowWrap: "anywhere",
  },

  section: {
    background: "#fff",
    borderRadius: 12,
    padding: 22,
    marginBottom: 24,
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: 700,
    marginTop: 0,
    marginBottom: 18,
    color: "#111827",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 16,
  },

  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    minWidth: 0,
  },

  label: {
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
  },

  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 14,
    boxSizing: "border-box",
    background: "#fff",
  },

  button: {
    padding: "11px 20px",
    border: "none",
    borderRadius: 8,
    background: "#2563eb",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 18,
  },

  refreshButton: {
    padding: "10px 16px",
    border: "none",
    borderRadius: 8,
    background: "#e0e7ff",
    color: "#1d4ed8",
    fontWeight: 600,
    cursor: "pointer",
  },

  retryButton: {
    padding: "8px 14px",
    border: "none",
    borderRadius: 6,
    background: "#fee2e2",
    color: "#991b1b",
    cursor: "pointer",
  },

  errorBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    padding: 14,
    marginBottom: 20,
    borderRadius: 8,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
  },

  search: {
    width: "100%",
    padding: "11px 14px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    marginBottom: 18,
    boxSizing: "border-box",
    fontSize: 14,
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    minWidth: 1100,
    borderCollapse: "collapse",
  },

  th: {
    textAlign: "left",
    padding: 12,
    background: "#f3f4f6",
    borderBottom: "1px solid #e5e7eb",
    fontSize: 13,
    color: "#374151",
    whiteSpace: "nowrap",
  },

  td: {
    padding: 12,
    borderBottom: "1px solid #e5e7eb",
    fontSize: 14,
    color: "#374151",
    whiteSpace: "nowrap",
  },

  emptyCell: {
    padding: 30,
    textAlign: "center",
    color: "#6b7280",
  },

  editButton: {
    padding: "7px 12px",
    border: "none",
    borderRadius: 6,
    background: "#f59e0b",
    color: "#fff",
    cursor: "pointer",
    marginRight: 6,
  },

  deleteButton: {
    padding: "7px 12px",
    border: "none",
    borderRadius: 6,
    background: "#dc2626",
    color: "#fff",
    cursor: "pointer",
  },

  status: {
    display: "inline-block",
    padding: "5px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
  },

  completedStatus: {
    background: "#dcfce7",
    color: "#166534",
  },

  pendingStatus: {
    background: "#fef3c7",
    color: "#92400e",
  },

  cancelledStatus: {
    background: "#fee2e2",
    color: "#991b1b",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 20,
  },

  modal: {
    width: "100%",
    maxWidth: 800,
    background: "#fff",
    borderRadius: 12,
    padding: 24,
    maxHeight: "90vh",
    overflowY: "auto",
    boxSizing: "border-box",
  },

  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  closeButton: {
    padding: "8px 12px",
    border: "none",
    borderRadius: 6,
    background: "#e5e7eb",
    cursor: "pointer",
  },

  modalActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 20,
  },

  cancelButton: {
    padding: "11px 20px",
    border: "none",
    borderRadius: 8,
    background: "#6b7280",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },
};

export default Finance;