require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const { GoogleGenAI } = require("@google/genai");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

// =========================
// JWT AUTHENTICATION
// =========================

const JWT_SECRET =
  process.env.JWT_SECRET || "integrated-business-secret-2026";

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token required",
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error("JWT verification failed:", err.message);
      return res.status(403).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    req.user = user;
    next();
  });
}

function allowRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this resource",
      });
    }
    next();
  };
}

// =========================
// MYSQL CONNECTION
// =========================

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "blue*wave",
  database: "integrated_business_management",
});

db.connect((err) => {
  if (err) {
    console.error("MySQL connection failed:", err.message);
    return;
  }
  console.log("MySQL database connected successfully!");
});

const query = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) =>
      err ? reject(err) : resolve(results)
    );
  });

const fail = (res, message, err, status = 500) =>
  res.status(status).json({
    success: false,
    message,
    error: err ? err.message : undefined,
  });

// =========================
// GEMINI AI
// =========================

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const AI_MODEL = "gemini-3.8-flash";

console.log("Selected Gemini model:", JSON.stringify(AI_MODEL));

// =========================
// LOGIN API
// =========================

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Username and password are required",
    });
  }

  try {
    const results = await query(
      "SELECT id, username, password, role FROM users WHERE username = ? LIMIT 1",
      [username]
    );

    if (!results || results.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    const user = results[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    fail(res, "Login failed", error);
  }
});

// =========================
// BASIC ROUTES
// =========================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Integrated Digital Business Management System API is running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Server is running" });
});

// =====================================================
// GENERIC CRUD HELPER
// =====================================================

function crud({ path, table, label, fields, defaultStatus, readRoles, writeRoles }) {
  const base = `/api/${path}`;

  // LIST
  app.get(base, authenticateToken, allowRoles(...readRoles), async (req, res) => {
    try {
      res.json(await query(`SELECT * FROM ${table} ORDER BY id DESC`));
    } catch (err) {
      fail(res, `Failed to load ${label}`, err);
    }
  });

  // GET ONE
  app.get(`${base}/:id`, authenticateToken, allowRoles(...readRoles), async (req, res) => {
    try {
      const rows = await query(`SELECT * FROM ${table} WHERE id = ?`, [req.params.id]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: `${label} not found` });
      }
      res.json(rows[0]);
    } catch (err) {
      fail(res, `Failed to load ${label}`, err);
    }
  });

  // CREATE
  app.post(base, authenticateToken, allowRoles(...writeRoles), async (req, res) => {
    try {
      const values = fields.map((f) =>
        f === "status" ? req.body.status || defaultStatus : req.body[f]
      );
      const sql = `INSERT INTO ${table} (${fields.join(", ")}) VALUES (${fields
        .map(() => "?")
        .join(", ")})`;
      const result = await query(sql, values);
      res.json({ success: true, message: `${label} added successfully`, id: result.insertId });
    } catch (err) {
      console.error(`${label} POST error:`, err.message);
      fail(res, `Failed to add ${label}`, err);
    }
  });

  // UPDATE
  app.put(`${base}/:id`, authenticateToken, allowRoles(...writeRoles), async (req, res) => {
    try {
      const values = fields.map((f) => req.body[f]);
      const sql = `UPDATE ${table} SET ${fields.map((f) => `${f} = ?`).join(", ")} WHERE id = ?`;
      await query(sql, [...values, req.params.id]);
      res.json({ success: true, message: `${label} updated successfully` });
    } catch (err) {
      console.error(`${label} PUT error:`, err.message);
      fail(res, `Failed to update ${label}`, err);
    }
  });

  // DELETE
  app.delete(`${base}/:id`, authenticateToken, allowRoles(...writeRoles), async (req, res) => {
    try {
      await query(`DELETE FROM ${table} WHERE id = ?`, [req.params.id]);
      res.json({ success: true, message: `${label} deleted successfully` });
    } catch (err) {
      fail(res, `Failed to delete ${label}`, err);
    }
  });
}

// EMPLOYEES
crud({
  path: "employees",
  table: "employees",
  label: "Employee",
  fields: ["employee_code", "name", "department", "position", "email", "phone", "status"],
  defaultStatus: "Active",
  readRoles: ["Admin", "HR Manager"],
  writeRoles: ["Admin", "HR Manager"],
});

// INVENTORY
crud({
  path: "inventory",
  table: "inventory",
  label: "Inventory",
  fields: ["item_code", "item_name", "category", "quantity", "unit_price", "supplier", "status"],
  defaultStatus: "In Stock",
  readRoles: ["Admin", "Sales Manager", "Inventory Manager"],
  writeRoles: ["Admin", "Inventory Manager"],
});

// SALES
crud({
  path: "sales",
  table: "sales",
  label: "Sale",
  fields: [
    "invoice_no", "customer_name", "product_name", "quantity", "unit_price",
    "total_amount", "payment_method", "sale_date", "status",
  ],
  defaultStatus: "Completed",
  readRoles: ["Admin", "Sales Manager", "Finance Manager"],
  writeRoles: ["Admin", "Sales Manager"],
});

// PURCHASES
crud({
  path: "purchases",
  table: "purchases",
  label: "Purchase",
  fields: [
    "purchase_no", "supplier_name", "product_name", "quantity", "unit_price",
    "total_amount", "payment_method", "purchase_date", "status",
  ],
  defaultStatus: "Completed",
  readRoles: ["Admin", "Inventory Manager", "Finance Manager"],
  writeRoles: ["Admin", "Inventory Manager"],
});

// FINANCE (test route must come BEFORE /api/finance/:id)
app.get(
  "/api/finance/test",
  authenticateToken,
  allowRoles("Admin", "Finance Manager"),
  (req, res) => {
    res.json({ success: true, message: "Finance API is working" });
  }
);

crud({
  path: "finance",
  table: "finance",
  label: "Transaction",
  fields: [
    "transaction_no", "transaction_type", "category", "description",
    "amount", "payment_method", "transaction_date", "status",
  ],
  defaultStatus: "Completed",
  readRoles: ["Admin", "Finance Manager"],
  writeRoles: ["Admin", "Finance Manager"],
});

// =====================================================
// SHARED REPORT / DASHBOARD DATA
// =====================================================

const ALL_ROLES = [
  "Admin",
  "HR Manager",
  "Sales Manager",
  "Inventory Manager",
  "Finance Manager",
];

const FINANCE_SQL = `
  SELECT
    COALESCE(SUM(CASE WHEN transaction_type = 'Income' AND status = 'Completed'
                      THEN amount ELSE 0 END), 0) AS total_income,
    COALESCE(SUM(CASE WHEN transaction_type = 'Expense' AND status = 'Completed'
                      THEN amount ELSE 0 END), 0) AS total_expense
  FROM finance
`;

async function getFinance() {
  const [finance] = await query(FINANCE_SQL);
  finance.balance = Number(finance.total_income || 0) - Number(finance.total_expense || 0);
  return finance;
}

// Data used by Reports page and AI Assistant
async function loadBusinessData() {
  const [employees] = await query(`
    SELECT
      COUNT(*) AS total_employees,
      COALESCE(SUM(status = 'Active'), 0) AS active_employees,
      COALESCE(SUM(status = 'Inactive'), 0) AS inactive_employees
    FROM employees
  `);

  const [inventory] = await query(`
    SELECT
      COUNT(*) AS total_products,
      COALESCE(SUM(quantity), 0) AS total_stock,
      COALESCE(SUM(status = 'Low Stock'), 0) AS low_stock,
      COALESCE(SUM(status = 'Out of Stock'), 0) AS out_of_stock,
      COALESCE(SUM(quantity * unit_price), 0) AS inventory_value
    FROM inventory
  `);

  const [sales] = await query(`
    SELECT
      COUNT(*) AS total_transactions,
      COALESCE(SUM(quantity), 0) AS total_quantity,
      COALESCE(SUM(CASE WHEN status = 'Completed' THEN total_amount ELSE 0 END), 0) AS total_sales
    FROM sales
  `);

  const [purchases] = await query(`
    SELECT
      COUNT(*) AS total_transactions,
      COALESCE(SUM(quantity), 0) AS total_quantity,
      COALESCE(SUM(CASE WHEN status = 'Completed' THEN total_amount ELSE 0 END), 0) AS total_purchases
    FROM purchases
  `);

  const finance = await getFinance();

  return { employees, inventory, sales, purchases, finance };
}

// =====================================================
// DASHBOARD
// =====================================================

app.get(
  "/api/dashboard",
  authenticateToken,
  allowRoles(...ALL_ROLES),
  async (req, res) => {
    try {
      const [employees] = await query(`
        SELECT
          COUNT(*) AS total,
          COALESCE(SUM(status = 'Active'), 0) AS active,
          COALESCE(SUM(status = 'Inactive'), 0) AS inactive
        FROM employees
      `);

      const [inventory] = await query(`
        SELECT
          COUNT(*) AS total,
          COALESCE(SUM(status = 'Low Stock'), 0) AS low_stock,
          COALESCE(SUM(status = 'Out of Stock'), 0) AS out_of_stock
        FROM inventory
      `);

      const [sales] = await query(`
        SELECT
          COUNT(*) AS transactions,
          COALESCE(SUM(CASE WHEN status = 'Completed' THEN total_amount ELSE 0 END), 0) AS total_sales
        FROM sales
      `);

      const [purchases] = await query(`
        SELECT
          COUNT(*) AS transactions,
          COALESCE(SUM(CASE WHEN status = 'Completed' THEN total_amount ELSE 0 END), 0) AS total_purchases
        FROM purchases
      `);

      const finance = await getFinance();

      res.json({
        success: true,
        data: { employees, inventory, sales, purchases, finance },
      });
    } catch (error) {
      console.error("Dashboard error:", error.message);
      fail(res, "Failed to load dashboard data", error);
    }
  }
);

// =====================================================
// REPORTS
// =====================================================

app.get(
  "/api/reports/summary",
  authenticateToken,
  allowRoles(...ALL_ROLES),
  async (req, res) => {
    try {
      const data = await loadBusinessData();
      res.json({ success: true, data });
    } catch (error) {
      console.error("Reports summary error:", error.message);
      fail(res, "Failed to load report summary", error);
    }
  }
);

app.get(
  "/api/reports/sales",
  authenticateToken,
  allowRoles(...ALL_ROLES),
  async (req, res) => {
    try {
      const results = await query(`
        SELECT
          product_name,
          SUM(quantity) AS total_quantity,
          SUM(total_amount) AS total_amount
        FROM sales
        WHERE status = 'Completed'
        GROUP BY product_name
        ORDER BY total_amount DESC
      `);
      res.json({ success: true, data: results });
    } catch (error) {
      fail(res, "Failed to load sales report", error);
    }
  }
);

// =====================================================
// AI ASSISTANT
// =====================================================

app.post(
  "/api/ai",
  authenticateToken,
  allowRoles(...ALL_ROLES),
  async (req, res) => {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "GEMINI_API_KEY is missing in the backend .env file",
      });
    }

    try {
      const businessData = await loadBusinessData();

      const prompt = `
You are an AI business assistant for the "Integrated Digital Business Management System".
Answer the user's question using ONLY the business data below.
Use Indian Rupees (₹). Be clear, short and practical. If the data is not enough, say so.

BUSINESS DATA (JSON):
${JSON.stringify(businessData, null, 2)}

USER QUESTION:
${message}
`;

      const response = await ai.models.generateContent({
        model: AI_MODEL,
        contents: prompt,
      });

      res.json({
        success: true,
        reply: response.text || "No response received from AI.",
      });
    } catch (error) {
      console.error("AI error:", error.message);
      res.status(500).json({
        success: false,
        message: error.message || "AI request failed",
      });
    }
  }
);

// =========================
// START BACKEND SERVER
// =========================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});