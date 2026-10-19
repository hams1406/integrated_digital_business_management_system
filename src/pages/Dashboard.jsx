import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api/dashboard";

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Login token not found. Please login again.");
      }

      const response = await fetch(API_URL, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json().catch(() => ({}));

      if (response.status === 401) {
        throw new Error("Unauthorized. Please login again.");
      }

      if (response.status === 403) {
        throw new Error("You do not have permission to access the dashboard.");
      }

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Failed to load dashboard data.");
      }

      setDashboard(result.data !== undefined ? result.data : result);
    } catch (err) {
      console.error("Dashboard Error:", err);
      setError(err.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const money = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const employees = dashboard?.employees || {};
  const inventory = dashboard?.inventory || {};
  const sales = dashboard?.sales || {};
  const purchases = dashboard?.purchases || {};
  const finance = dashboard?.finance || {};

  const styles = {
    page: {
      width: "100%",
      minHeight: "100%",
      padding: "30px",
      background: "#f1f5f9",
      color: "#0f172a",
      fontFamily: "Arial, sans-serif",
      boxSizing: "border-box",
    },

    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "15px",
      marginBottom: "28px",
    },

    title: {
      margin: "0 0 8px",
      fontSize: "30px",
      fontWeight: "700",
      color: "#0f172a",
    },

    subtitle: {
      margin: 0,
      fontSize: "14px",
      color: "#64748b",
    },

    button: {
      padding: "12px 18px",
      border: "none",
      borderRadius: "8px",
      background: "#2563eb",
      color: "#ffffff",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
    },

    summaryGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
      gap: "18px",
      marginBottom: "26px",
    },

    summaryCard: {
      display: "flex",
      alignItems: "center",
      gap: "14px",
      minWidth: 0,
      padding: "22px 18px",
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "12px",
      boxShadow: "0 3px 10px rgba(15, 23, 42, 0.05)",
      boxSizing: "border-box",
    },

    icon: {
      width: "52px",
      height: "52px",
      minWidth: "52px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "12px",
      fontSize: "24px",
    },

    cardLabel: {
      margin: "0 0 8px",
      color: "#64748b",
      fontSize: "13px",
    },

    cardValue: {
      margin: 0,
      color: "#0f172a",
      fontSize: "clamp(15px, 1.4vw, 21px)",
      fontWeight: "700",
      whiteSpace: "nowrap",
    },

    sectionGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: "22px",
      marginBottom: "24px",
      alignItems: "stretch",
    },

    section: {
      minWidth: 0,
      padding: "24px",
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: "12px",
      boxShadow: "0 3px 10px rgba(15, 23, 42, 0.05)",
      boxSizing: "border-box",
    },

    sectionTitle: {
      margin: "0 0 20px",
      color: "#0f172a",
      fontSize: "19px",
      fontWeight: "700",
    },

    row: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "12px",
      padding: "15px 0",
      borderBottom: "1px solid #e2e8f0",
    },

    rowLabel: {
      color: "#64748b",
      fontSize: "14px",
    },

    rowValue: {
      color: "#0f172a",
      fontSize: "14px",
      fontWeight: "700",
      textAlign: "right",
      overflowWrap: "anywhere",
    },

    financeGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      gap: "18px",
      alignItems: "stretch",
    },

    financeCard: {
      minWidth: 0,
      padding: "20px",
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: "10px",
      boxSizing: "border-box",
    },

    financeLabel: {
      margin: "0 0 12px",
      color: "#64748b",
      fontSize: "14px",
    },

    financeValue: {
      margin: 0,
      fontSize: "clamp(16px, 1.5vw, 22px)",
      fontWeight: "700",
      overflowWrap: "anywhere",
    },

    statusBox: {
      display: "flex",
      alignItems: "center",
      gap: "15px",
      padding: "20px",
      marginTop: "24px",
      background: "#ffffff",
      border: "1px solid #bbf7d0",
      borderRadius: "12px",
    },

    messageContainer: {
      minHeight: "60vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "25px",
      background: "#f1f5f9",
      boxSizing: "border-box",
    },

    messageBox: {
      width: "100%",
      maxWidth: "450px",
      padding: "30px",
      background: "#ffffff",
      borderRadius: "12px",
      textAlign: "center",
      boxShadow: "0 3px 12px rgba(15, 23, 42, 0.08)",
      boxSizing: "border-box",
    },
  };

  const SummaryCard = ({ icon, label, value, bg, color }) => (
    <div style={styles.summaryCard}>
      <div style={{ ...styles.icon, background: bg, color }}>
        {icon}
      </div>

      <div style={{ minWidth: 0 }}>
        <p style={styles.cardLabel}>{label}</p>
        <h2 style={styles.cardValue}>{value}</h2>
      </div>
    </div>
  );

  const DataRow = ({ label, value, color }) => (
    <div style={styles.row}>
      <span style={styles.rowLabel}>{label}</span>
      <strong style={{ ...styles.rowValue, color: color || "#0f172a" }}>
        {value}
      </strong>
    </div>
  );

  if (loading) {
    return (
      <div style={styles.messageContainer}>
        <div style={styles.messageBox}>
          <h2>⏳ Loading Dashboard...</h2>
          <p style={{ color: "#64748b" }}>Please wait while data is loading.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.messageContainer}>
        <div style={styles.messageBox}>
          <h2 style={{ color: "#dc2626" }}>Dashboard Error</h2>

          <p
            style={{
              margin: "15px 0",
              color: "#64748b",
              overflowWrap: "anywhere",
            }}
          >
            {error}
          </p>

          <button style={styles.button} onClick={fetchDashboard}>
            ↻ Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          @media (max-width: 1100px) {
            .dashboard-summary-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }
          }

          @media (max-width: 700px) {
            .dashboard-summary-grid,
            .dashboard-section-grid,
            .dashboard-finance-grid {
              grid-template-columns: minmax(0, 1fr) !important;
            }

            .dashboard-page {
              padding: 18px !important;
            }

            .dashboard-title {
              font-size: 25px !important;
            }
          }
        `}
      </style>

      <div className="dashboard-page" style={styles.page}>
        <div style={styles.header}>
          <div>
            <h1 className="dashboard-title" style={styles.title}>
              Dashboard
            </h1>

            <p style={styles.subtitle}>
              Welcome to your business overview
            </p>
          </div>

          <button style={styles.button} onClick={fetchDashboard}>
            ↻ Refresh Data
          </button>
        </div>

        {/* SUMMARY CARDS */}
        <div
          className="dashboard-summary-grid"
          style={styles.summaryGrid}
        >
          <SummaryCard
            icon="👥"
            label="Total Employees"
            value={employees.total ?? 0}
            bg="#dbeafe"
            color="#2563eb"
          />

          <SummaryCard
            icon="📦"
            label="Total Products"
            value={inventory.total ?? 0}
            bg="#fef3c7"
            color="#d97706"
          />

          <SummaryCard
            icon="💰"
            label="Total Sales"
            value={money(sales.total_sales)}
            bg="#dcfce7"
            color="#16a34a"
          />

          <SummaryCard
            icon="💳"
            label="Finance Balance"
            value={money(finance.balance)}
            bg="#ede9fe"
            color="#7c3aed"
          />
        </div>

        {/* EMPLOYEE AND INVENTORY */}
        <div
          className="dashboard-section-grid"
          style={styles.sectionGrid}
        >
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>👥 Employee Overview</h2>

            <DataRow
              label="Total Employees"
              value={employees.total ?? 0}
            />

            <DataRow
              label="Active Employees"
              value={employees.active ?? 0}
              color="#16a34a"
            />

            <DataRow
              label="Inactive Employees"
              value={employees.inactive ?? 0}
              color="#dc2626"
            />
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>📦 Inventory Overview</h2>

            <DataRow
              label="Total Products"
              value={inventory.total ?? 0}
            />

            <DataRow
              label="Low Stock"
              value={inventory.low_stock ?? 0}
              color="#d97706"
            />

            <DataRow
              label="Out of Stock"
              value={inventory.out_of_stock ?? 0}
              color="#dc2626"
            />
          </div>
        </div>

        {/* SALES AND PURCHASE */}
        <div
          className="dashboard-section-grid"
          style={styles.sectionGrid}
        >
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>💰 Sales Overview</h2>

            <DataRow
              label="Total Sales"
              value={money(sales.total_sales)}
              color="#16a34a"
            />

            <DataRow
              label="Transactions"
              value={sales.transactions ?? 0}
            />
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>🛒 Purchase Overview</h2>

            <DataRow
              label="Total Purchases"
              value={money(purchases.total_purchases)}
            />

            <DataRow
              label="Transactions"
              value={purchases.transactions ?? 0}
            />
          </div>
        </div>

        {/* FINANCE */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>💳 Finance Overview</h2>

          <div
            className="dashboard-finance-grid"
            style={styles.financeGrid}
          >
            <div style={styles.financeCard}>
              <p style={styles.financeLabel}>Total Income</p>

              <h2 style={{ ...styles.financeValue, color: "#16a34a" }}>
                {money(finance.total_income)}
              </h2>
            </div>

            <div style={styles.financeCard}>
              <p style={styles.financeLabel}>Total Expense</p>

              <h2 style={{ ...styles.financeValue, color: "#dc2626" }}>
                {money(finance.total_expense)}
              </h2>
            </div>

            <div style={styles.financeCard}>
              <p style={styles.financeLabel}>Current Balance</p>

              <h2
                style={{
                  ...styles.financeValue,
                  color:
                    Number(finance.balance || 0) < 0
                      ? "#dc2626"
                      : "#16a34a",
                }}
              >
                {money(finance.balance)}
              </h2>
            </div>
          </div>
        </div>

        {/* CONNECTION STATUS */}
        <div style={styles.statusBox}>
          <div
            style={{
              width: "42px",
              height: "42px",
              minWidth: "42px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              background: "#dcfce7",
              color: "#16a34a",
              fontSize: "22px",
              fontWeight: "700",
            }}
          >
            ✓
          </div>

          <div>
            <h3 style={{ margin: 0, color: "#166534", fontSize: "16px" }}>
              Dashboard Connected
            </h3>

            <p style={{ margin: "5px 0 0", color: "#64748b", fontSize: "14px" }}>
              Business data loaded successfully.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;