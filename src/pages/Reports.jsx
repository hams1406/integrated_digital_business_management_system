import { useState } from "react";

const inr = (n) => "₹" + Number(n).toLocaleString("en-IN");

function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/api/reports/summary", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to generate report");
      }
      setData(result.data);
    } catch (err) {
      console.error("Report Error:", err);
      alert(err.message || "Failed to generate report. Please make sure the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  const e = data?.employees;
  const i = data?.inventory;
  const s = data?.sales;
  const p = data?.purchases;

  const summary = data && [
    { icon: "👥", bg: "#eff6ff", label: "Total Employees", value: Number(e.total_employees), tag: "Workforce", color: "#2563eb" },
    { icon: "📦", bg: "#f0fdf4", label: "Total Products", value: Number(i.total_products), tag: "Inventory", color: "#16a34a" },
    { icon: "💰", bg: "#fefce8", label: "Total Sales", value: inr(s.total_sales), tag: "Revenue", color: "#ca8a04" },
    { icon: "🛒", bg: "#f5f3ff", label: "Total Purchases", value: inr(p.total_purchases), tag: "Purchase Cost", color: "#7c3aed" },
  ];

  const details = data && [
    {
      title: "👥 Employee Report",
      sub: "Employee overview",
      rows: [
        ["Total Employees", e.total_employees],
        ["Active Employees", e.active_employees, "#16a34a"],
        ["Inactive Employees", e.inactive_employees, "#dc2626"],
      ],
    },
    {
      title: "📦 Inventory Report",
      sub: "Stock and inventory overview",
      rows: [
        ["Total Products", i.total_products],
        ["Total Stock", i.total_stock],
        ["Low Stock Products", i.low_stock, Number(i.low_stock) > 0 ? "#dc2626" : "#16a34a"],
        ["Inventory Value", inr(i.inventory_value)],
      ],
    },
    {
      title: "💰 Sales Report",
      sub: "Sales performance overview",
      rows: [
        ["Total Transactions", s.total_transactions],
        ["Items Sold", s.total_quantity],
        ["Total Sales", inr(s.total_sales), "#16a34a"],
      ],
    },
    {
      title: "🛒 Purchase Report",
      sub: "Purchase performance overview",
      rows: [
        ["Total Transactions", p.total_transactions],
        ["Items Purchased", p.total_quantity],
        ["Total Purchases", inr(p.total_purchases), "#7c3aed"],
      ],
    },
  ];

  const diff = data ? Number(s.total_sales) - Number(p.total_purchases) : 0;

  const performance = data && [
    { label: "Revenue", value: inr(s.total_sales), bg: "#f0fdf4", border: "#dcfce7", color: "#15803d" },
    { label: "Purchase Cost", value: inr(p.total_purchases), bg: "#f5f3ff", border: "#ede9fe", color: "#7c3aed" },
    { label: "Sales - Purchases", value: inr(diff), bg: "#eff6ff", border: "#dbeafe", color: diff >= 0 ? "#2563eb" : "#dc2626" },
  ];

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 25 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 32, color: "#0f172a" }}>Reports</h1>
          <p style={{ marginTop: 8, color: "#64748b", fontSize: 15 }}>
            Generate and monitor business performance reports
          </p>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          style={{
            padding: "12px 22px",
            background: loading ? "#94a3b8" : "#2563eb",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Generating..." : "📊 Generate Report"}
        </button>
      </div>

      {/* EMPTY STATE */}
      {!data && (
        <div style={{ ...box, padding: 45, textAlign: "center", marginBottom: 25 }}>
          <div style={{ fontSize: 50, marginBottom: 15 }}>📊</div>
          <h2 style={{ margin: 0, color: "#0f172a" }}>Business Report</h2>
          <p style={{ color: "#64748b", marginTop: 10 }}>
            Click "Generate Report" to fetch the latest business information from the database.
          </p>
        </div>
      )}

      {data && (
        <>
          {/* REPORT HEADER */}
          <div style={{ ...box, padding: "22px 25px", marginBottom: 25, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ margin: 0, color: "#0f172a" }}>Generated Business Report</h2>
              <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 14 }}>
                Latest information from Integrated Digital Business Management System
              </p>
            </div>
            <button
              onClick={generate}
              disabled={loading}
              style={{
                padding: "10px 18px",
                background: "#f1f5f9",
                color: "#334155",
                border: "1px solid #cbd5e1",
                borderRadius: 7,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              🔄 Refresh
            </button>
          </div>

          {/* SUMMARY CARDS */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 25 }}>
            {summary.map((c) => (
              <div key={c.label} style={{ ...box, padding: 22, display: "flex", alignItems: "center", gap: 15 }}>
                <div style={{ width: 50, height: 50, borderRadius: 10, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                  {c.icon}
                </div>
                <div>
                  <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>{c.label}</p>
                  <h2 style={{ margin: "5px 0", color: "#0f172a", fontSize: 24 }}>{c.value}</h2>
                  <span style={{ color: c.color, fontSize: 13 }}>{c.tag}</span>
                </div>
              </div>
            ))}
          </div>

          {/* DETAIL CARDS */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
            {details.map((d) => (
              <div key={d.title} style={{ ...box, padding: 25 }}>
                <div style={{ marginBottom: 20 }}>
                  <h2 style={{ margin: 0, color: "#0f172a", fontSize: 20 }}>{d.title}</h2>
                  <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 13 }}>{d.sub}</p>
                </div>
                {d.rows.map(([label, value, color]) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "13px 0",
                      borderBottom: "1px solid #e2e8f0",
                      color: "#475569",
                      fontSize: 14,
                    }}
                  >
                    <span>{label}</span>
                    <strong style={color ? { color } : undefined}>{value}</strong>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* BUSINESS PERFORMANCE */}
          <div style={{ ...box, marginTop: 25, padding: 25 }}>
            <h2 style={{ margin: 0, color: "#0f172a" }}>📈 Business Performance</h2>
            <p style={{ color: "#64748b", marginTop: 6 }}>Overall business financial overview</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginTop: 20 }}>
              {performance.map((x) => (
                <div key={x.label} style={{ padding: 20, background: x.bg, borderRadius: 10, border: `1px solid ${x.border}` }}>
                  <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>{x.label}</p>
                  <h2 style={{ margin: "8px 0 0", color: x.color }}>{x.value}</h2>
                </div>
              ))}
            </div>
          </div>

          {/* FOOTER */}
          <div style={{ marginTop: 25, padding: 18, background: "#f1f5f9", borderRadius: 10, textAlign: "center", color: "#64748b", fontSize: 13 }}>
            Report generated successfully from the Integrated Digital Business Management System.
          </div>
        </>
      )}
    </div>
  );
}

const box = {
  background: "white",
  borderRadius: 12,
  boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
};

export default Reports;