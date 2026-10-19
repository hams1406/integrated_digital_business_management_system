
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const { GoogleGenAI } = require("@google/genai");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is missing in your .env file");
}

const app = express();

app.use(cors());
app.use(express.json());

/* =========================
   MYSQL CONNECTION
========================= */

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

/* =========================
   GEMINI AI
========================= */

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const AI_MODEL = "gemini-3.8-flash";

/* =========================
   BASIC ROUTES
========================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Integrated Digital Business Management System API is running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
  });
});
// =========================
// LOGIN API
// =========================

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Username and password are required",
    });
  }

  const sql = `
    SELECT id, username, password, role
    FROM users
    WHERE username = ?
    LIMIT 1
  `;

  db.query(sql, [username], async (err, results) => {
    if (err) {
      console.error("Login database error:", err.message);

      return res.status(500).json({
        success: false,
        message: "Database error",
      });
    }

    if (!results || results.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    const user = results[0];

    try {
      const validPassword = await bcrypt.compare(
        password,
        user.password
      );

      if (!validPassword) {
        return res.status(401).json({
          success: false,
          message: "Invalid username or password",
        });
      }

      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: "8h" }
      );

      return res.json({
        success: true,
        message: "Login successful",
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Login error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to verify password",
      });
    }
  });
});
/* =====================================================
   EMPLOYEES
===================================================== */

app.get("/api/employees", (req, res) => {
  const sql = "SELECT * FROM employees ORDER BY id DESC";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Employees GET error:", err.message);
      return res.status(500).json({
        success: false,
        message: "Failed to load employees",
        error: err.message,
      });
    }

    res.json(results);
  });
});

app.get("/api/employees/:id", (req, res) => {
  const sql = "SELECT * FROM employees WHERE id = ?";

  db.query(sql, [req.params.id], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to load employee",
        error: err.message,
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    res.json(results[0]);
  });
});

app.post("/api/employees", (req, res) => {
  const {
    employee_code,
    name,
    department,
    position,
    email,
    phone,
    status,
  } = req.body;

  const sql = `
    INSERT INTO employees
    (employee_code, name, department, position, email, phone, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      employee_code,
      name,
      department,
      position,
      email,
      phone,
      status || "Active",
    ],
    (err, result) => {
      if (err) {
        console.error("Employee POST error:", err.message);

        return res.status(500).json({
          success: false,
          message: "Failed to add employee",
          error: err.message,
        });
      }

      res.json({
        success: true,
        message: "Employee added successfully",
        id: result.insertId,
      });
    }
  );
});

app.put("/api/employees/:id", (req, res) => {
  const {
    employee_code,
    name,
    department,
    position,
    email,
    phone,
    status,
  } = req.body;

  const sql = `
    UPDATE employees
    SET employee_code = ?,
        name = ?,
        department = ?,
        position = ?,
        email = ?,
        phone = ?,
        status = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [
      employee_code,
      name,
      department,
      position,
      email,
      phone,
      status,
      req.params.id,
    ],
    (err, result) => {
      if (err) {
        console.error("Employee PUT error:", err.message);

        return res.status(500).json({
          success: false,
          message: "Failed to update employee",
          error: err.message,
        });
      }

      res.json({
        success: true,
        message: "Employee updated successfully",
      });
    }
  );
});

app.delete("/api/employees/:id", (req, res) => {
  const sql = "DELETE FROM employees WHERE id = ?";

  db.query(sql, [req.params.id], (err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete employee",
        error: err.message,
      });
    }

    res.json({
      success: true,
      message: "Employee deleted successfully",
    });
  });
});

/* =====================================================
   INVENTORY
===================================================== */

app.get("/api/inventory", (req, res) => {
  db.query(
    "SELECT * FROM inventory ORDER BY id DESC",
    (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to load inventory",
          error: err.message,
        });
      }

      res.json(results);
    }
  );
});

app.get("/api/inventory/:id", (req, res) => {
  db.query(
    "SELECT * FROM inventory WHERE id = ?",
    [req.params.id],
    (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to load inventory item",
          error: err.message,
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Inventory item not found",
        });
      }

      res.json(results[0]);
    }
  );
});

app.post("/api/inventory", (req, res) => {
  const {
    item_code,
    item_name,
    category,
    quantity,
    unit_price,
    supplier,
    status,
  } = req.body;

  const sql = `
    INSERT INTO inventory
    (item_code, item_name, category, quantity, unit_price, supplier, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      item_code,
      item_name,
      category,
      quantity,
      unit_price,
      supplier,
      status || "In Stock",
    ],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to add inventory",
          error: err.message,
        });
      }

      res.json({
        success: true,
        message: "Inventory added successfully",
        id: result.insertId,
      });
    }
  );
});

app.put("/api/inventory/:id", (req, res) => {
  const {
    item_code,
    item_name,
    category,
    quantity,
    unit_price,
    supplier,
    status,
  } = req.body;

  const sql = `
    UPDATE inventory
    SET item_code = ?,
        item_name = ?,
        category = ?,
        quantity = ?,
        unit_price = ?,
        supplier = ?,
        status = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [
      item_code,
      item_name,
      category,
      quantity,
      unit_price,
      supplier,
      status,
      req.params.id,
    ],
    (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to update inventory",
          error: err.message,
        });
      }

      res.json({
        success: true,
        message: "Inventory updated successfully",
      });
    }
  );
});

app.delete("/api/inventory/:id", (req, res) => {
  db.query(
    "DELETE FROM inventory WHERE id = ?",
    [req.params.id],
    (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to delete inventory",
          error: err.message,
        });
      }

      res.json({
        success: true,
        message: "Inventory deleted successfully",
      });
    }
  );
});

/* =====================================================
   SALES
===================================================== */

app.get("/api/sales", (req, res) => {
  db.query(
    "SELECT * FROM sales ORDER BY id DESC",
    (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to load sales",
          error: err.message,
        });
      }

      res.json(results);
    }
  );
});

app.get("/api/sales/:id", (req, res) => {
  db.query(
    "SELECT * FROM sales WHERE id = ?",
    [req.params.id],
    (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to load sale",
          error: err.message,
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Sale not found",
        });
      }

      res.json(results[0]);
    }
  );
});

app.post("/api/sales", (req, res) => {
  const {
    invoice_no,
    customer_name,
    product_name,
    quantity,
    unit_price,
    total_amount,
    payment_method,
    sale_date,
    status,
  } = req.body;

  const sql = `
    INSERT INTO sales
    (invoice_no, customer_name, product_name, quantity, unit_price,
     total_amount, payment_method, sale_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      invoice_no,
      customer_name,
      product_name,
      quantity,
      unit_price,
      total_amount,
      payment_method,
      sale_date,
      status || "Completed",
    ],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to add sale",
          error: err.message,
        });
      }

      res.json({
        success: true,
        message: "Sale added successfully",
        id: result.insertId,
      });
    }
  );
});

app.put("/api/sales/:id", (req, res) => {
  const {
    invoice_no,
    customer_name,
    product_name,
    quantity,
    unit_price,
    total_amount,
    payment_method,
    sale_date,
    status,
  } = req.body;

  const sql = `
    UPDATE sales
    SET invoice_no = ?,
        customer_name = ?,
        product_name = ?,
        quantity = ?,
        unit_price = ?,
        total_amount = ?,
        payment_method = ?,
        sale_date = ?,
        status = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [
      invoice_no,
      customer_name,
      product_name,
      quantity,
      unit_price,
      total_amount,
      payment_method,
      sale_date,
      status,
      req.params.id,
    ],
    (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to update sale",
          error: err.message,
        });
      }

      res.json({
        success: true,
        message: "Sale updated successfully",
      });
    }
  );
});

app.delete("/api/sales/:id", (req, res) => {
  db.query(
    "DELETE FROM sales WHERE id = ?",
    [req.params.id],
    (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to delete sale",
          error: err.message,
        });
      }

      res.json({
        success: true,
        message: "Sale deleted successfully",
      });
    }
  );
});

/* =====================================================
   PURCHASES
===================================================== */

app.get("/api/purchases", (req, res) => {
  db.query(
    "SELECT * FROM purchases ORDER BY id DESC",
    (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to load purchases",
          error: err.message,
        });
      }

      res.json(results);
    }
  );
});

app.get("/api/purchases/:id", (req, res) => {
  db.query(
    "SELECT * FROM purchases WHERE id = ?",
    [req.params.id],
    (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to load purchase",
          error: err.message,
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Purchase not found",
        });
      }

      res.json(results[0]);
    }
  );
});

app.post("/api/purchases", (req, res) => {
  const {
    purchase_no,
    supplier_name,
    product_name,
    quantity,
    unit_price,
    total_amount,
    payment_method,
    purchase_date,
    status,
  } = req.body;

  const sql = `
    INSERT INTO purchases
    (purchase_no, supplier_name, product_name, quantity, unit_price,
     total_amount, payment_method, purchase_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      purchase_no,
      supplier_name,
      product_name,
      quantity,
      unit_price,
      total_amount,
      payment_method,
      purchase_date,
      status || "Completed",
    ],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to add purchase",
          error: err.message,
        });
      }

      res.json({
        success: true,
        message: "Purchase added successfully",
        id: result.insertId,
      });
    }
  );
});

app.put("/api/purchases/:id", (req, res) => {
  const {
    purchase_no,
    supplier_name,
    product_name,
    quantity,
    unit_price,
    total_amount,
    payment_method,
    purchase_date,
    status,
  } = req.body;

  const sql = `
    UPDATE purchases
    SET purchase_no = ?,
        supplier_name = ?,
        product_name = ?,
        quantity = ?,
        unit_price = ?,
        total_amount = ?,
        payment_method = ?,
        purchase_date = ?,
        status = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [
      purchase_no,
      supplier_name,
      product_name,
      quantity,
      unit_price,
      total_amount,
      payment_method,
      purchase_date,
      status,
      req.params.id,
    ],
    (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to update purchase",
          error: err.message,
        });
      }

      res.json({
        success: true,
        message: "Purchase updated successfully",
      });
    }
  );
});

app.delete("/api/purchases/:id", (req, res) => {
  db.query(
    "DELETE FROM purchases WHERE id = ?",
    [req.params.id],
    (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to delete purchase",
          error: err.message,
        });
      }

      res.json({
        success: true,
        message: "Purchase deleted successfully",
      });
    }
  );
});

/* =====================================================
   FINANCE
===================================================== */

app.get("/api/finance/test", (req, res) => {
  res.json({
    success: true,
    message: "Finance API is working",
  });
});

app.get("/api/finance", (req, res) => {
  db.query(
    "SELECT * FROM finance ORDER BY id DESC",
    (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to load finance",
          error: err.message,
        });
      }

      res.json(results);
    }
  );
});

app.get("/api/finance/:id", (req, res) => {
  db.query(
    "SELECT * FROM finance WHERE id = ?",
    [req.params.id],
    (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to load transaction",
          error: err.message,
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Transaction not found",
        });
      }

      res.json(results[0]);
    }
  );
});

app.post("/api/finance", (req, res) => {
  const {
    transaction_no,
    transaction_type,
    category,
    description,
    amount,
    payment_method,
    transaction_date,
    status,
  } = req.body;

  const sql = `
    INSERT INTO finance
    (transaction_no, transaction_type, category, description, amount,
     payment_method, transaction_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      transaction_no,
      transaction_type,
      category,
      description,
      amount,
      payment_method,
      transaction_date,
      status || "Completed",
    ],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to add transaction",
          error: err.message,
        });
      }

      res.json({
        success: true,
        message: "Transaction added successfully",
        id: result.insertId,
      });
    }
  );
});

app.put("/api/finance/:id", (req, res) => {
  const {
    transaction_no,
    transaction_type,
    category,
    description,
    amount,
    payment_method,
    transaction_date,
    status,
  } = req.body;

  const sql = `
    UPDATE finance
    SET transaction_no = ?,
        transaction_type = ?,
        category = ?,
        description = ?,
        amount = ?,
        payment_method = ?,
        transaction_date = ?,
        status = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [
      transaction_no,
      transaction_type,
      category,
      description,
      amount,
      payment_method,
      transaction_date,
      status,
      req.params.id,
    ],
    (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to update transaction",
          error: err.message,
        });
      }

      res.json({
        success: true,
        message: "Transaction updated successfully",
      });
    }
  );
});

app.delete("/api/finance/:id", (req, res) => {
  db.query(
    "DELETE FROM finance WHERE id = ?",
    [req.params.id],
    (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to delete transaction",
          error: err.message,
        });
      }

      res.json({
        success: true,
        message: "Transaction deleted successfully",
      });
    }
  );
});
/* =====================================================
   DASHBOARD
===================================================== */

app.get("/api/dashboard", async (req, res) => {
  try {
    const queries = {
      employees: `
        SELECT
          COUNT(*) AS total,
          COALESCE(SUM(status = 'Active'), 0) AS active,
          COALESCE(SUM(status = 'Inactive'), 0) AS inactive
        FROM employees
      `,

      inventory: `
        SELECT
          COUNT(*) AS total,
          COALESCE(SUM(status = 'Low Stock'), 0) AS low_stock,
          COALESCE(SUM(status = 'Out of Stock'), 0) AS out_of_stock
        FROM inventory
      `,

      sales: `
        SELECT
          COUNT(*) AS transactions,
          COALESCE(
            SUM(
              CASE
                WHEN status = 'Completed'
                THEN total_amount
                ELSE 0
              END
            ),
            0
          ) AS total_sales
        FROM sales
      `,

      purchases: `
        SELECT
          COUNT(*) AS transactions,
          COALESCE(
            SUM(
              CASE
                WHEN status = 'Completed'
                THEN total_amount
                ELSE 0
              END
            ),
            0
          ) AS total_purchases
        FROM purchases
      `,

      finance: `
        SELECT
          COALESCE(
            SUM(
              CASE
                WHEN transaction_type = 'Income'
                AND status = 'Completed'
                THEN amount
                ELSE 0
              END
            ),
            0
          ) AS total_income,

          COALESCE(
            SUM(
              CASE
                WHEN transaction_type = 'Expense'
                AND status = 'Completed'
                THEN amount
                ELSE 0
              END
            ),
            0
          ) AS total_expense
        FROM finance
      `,
    };

    const runQuery = (sql) => {
      return new Promise((resolve, reject) => {
        db.query(sql, (err, results) => {
          if (err) {
            reject(err);
          } else {
            resolve(results[0]);
          }
        });
      });
    };

    const result = {};

    for (const key in queries) {
      result[key] = await runQuery(queries[key]);
    }

    const totalIncome = Number(result.finance.total_income || 0);
    const totalExpense = Number(result.finance.total_expense || 0);

    result.finance.balance = totalIncome - totalExpense;

    res.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error("Dashboard error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to load dashboard data",
      error: error.message,
    });
  }
});

/* =====================================================
   REPORTS
===================================================== */

 app.get("/api/reports/summary", async (req, res) => {
  try {
    const queries = {
      employees: `
        SELECT COUNT(*) AS total,
        SUM(status = 'Active') AS active
        FROM employees
      `,
      inventory: `
        SELECT COUNT(*) AS total,
        SUM(status = 'Low Stock') AS low_stock,
        SUM(status = 'Out of Stock') AS out_of_stock
        FROM inventory
      `,
      sales: `
        SELECT
          COUNT(*) AS transactions,
          COALESCE(SUM(
            CASE
              WHEN status = 'Completed' THEN total_amount
              ELSE 0
            END
          ), 0) AS total_sales
        FROM sales
      `,
      purchases: `
        SELECT
          COUNT(*) AS transactions,
          COALESCE(SUM(
            CASE
              WHEN status = 'Completed' THEN total_amount
              ELSE 0
            END
          ), 0) AS total_purchases
        FROM purchases
      `,
      finance: `
        SELECT
          COALESCE(SUM(
            CASE
              WHEN transaction_type = 'Income'
              AND status = 'Completed'
              THEN amount ELSE 0
            END
          ), 0) AS total_income,

          COALESCE(SUM(
            CASE
              WHEN transaction_type = 'Expense'
              AND status = 'Completed'
              THEN amount ELSE 0
            END
          ), 0) AS total_expense
        FROM finance
      `,
    };

    const runQuery = (sql) =>
      new Promise((resolve, reject) => {
        db.query(sql, (err, results) => {
          if (err) reject(err);
          else resolve(results[0]);
        });
      });

    const result = {};

    for (const key in queries) {
      result[key] = await runQuery(queries[key]);
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Reports summary error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to load report summary",
      error: error.message,
    });
  }
});

app.get("/api/reports/sales", (req, res) => {
  const sql = `
    SELECT
      product_name,
      SUM(quantity) AS total_quantity,
      SUM(total_amount) AS total_amount
    FROM sales
    WHERE status = 'Completed'
    GROUP BY product_name
    ORDER BY total_amount DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to load sales report",
        error: err.message,
      });
    }

    res.json({
      success: true,
      data: results,
    });
  });
});

app.get("/api/reports/purchases", (req, res) => {
  const sql = `
    SELECT
      product_name,
      SUM(quantity) AS total_quantity,
      SUM(total_amount) AS total_amount
    FROM purchases
    WHERE status = 'Completed'
    GROUP BY product_name
    ORDER BY total_amount DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to load purchase report",
        error: err.message,
      });
    }

    res.json({
      success: true,
      data: results,
    });
  });
});

app.get("/api/reports/finance", (req, res) => {
  const sql = `
    SELECT
      transaction_type,
      SUM(amount) AS total_amount
    FROM finance
    WHERE status = 'Completed'
    GROUP BY transaction_type
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to load finance report",
        error: err.message,
      });
    }

    res.json({
      success: true,
      data: results,
    });
  });
});

/// =========================
// AI ASSISTANT - GEMINI
// =========================

app.post("/api/ai", async (req, res) => {
  try {
    const { message } = req.body;

    // -------------------------
    // CHECK USER MESSAGE
    // -------------------------
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter a message.",
      });
    }

    // -------------------------
    // GET BUSINESS DATA
    // -------------------------

    const [employees] = await db.promise().query(`
      SELECT *
      FROM employees
      ORDER BY id DESC
    `);

    const [inventory] = await db.promise().query(`
      SELECT *
      FROM inventory
      ORDER BY id DESC
    `);

    const [sales] = await db.promise().query(`
      SELECT *
      FROM sales
      ORDER BY id DESC
    `);

    const [purchases] = await db.promise().query(`
      SELECT *
      FROM purchases
      ORDER BY id DESC
    `);

    const [finance] = await db.promise().query(`
      SELECT *
      FROM finance
      ORDER BY id DESC
    `);

    // -------------------------
    // BUSINESS DATA
    // -------------------------

    const businessData = {
      employees,
      inventory,
      sales,
      purchases,
      finance,
    };

    // -------------------------
    // AI PROMPT
    // -------------------------

    const prompt = `
You are an AI Business Assistant for an
Integrated Digital Business Management System.

User Question:
${message}

Business Data:
${JSON.stringify(businessData, null, 2)}

Instructions:

1. Answer the user's question clearly and simply.
2. Use the business data provided above.
3. Do NOT invent business values.
4. If the user asks for calculations, calculate using the provided data.
5. If data is unavailable, clearly say that the data is unavailable.
6. You can answer questions about:
   - Employees
   - Inventory
   - Sales
   - Purchases
   - Finance
   - Business performance
   - Income
   - Expenses
   - Profit or loss
   - Low stock
   - Business summaries
7. Answer in the same language used by the user whenever possible.
8. Do not modify or delete database data.
9. Give a concise and useful business answer.
`;

    // -------------------------
    // GEMINI MODELS
    // -------------------------

    const models = [
      AI_MODEL,
      "gemini-3.7-flash",
      "gemini-3.6-flash",
      "gemini-3.5-flash-lite",
    ].filter(
      (model, index, list) =>
        model && list.indexOf(model) === index
    );

    // -------------------------
    // RETRY SETTINGS
    // -------------------------

    const MAX_ATTEMPTS_PER_MODEL = 2;

    let lastError = null;

    // -------------------------
    // TRY GEMINI MODELS
    // -------------------------

    for (const model of models) {
      for (
        let attempt = 1;
        attempt <= MAX_ATTEMPTS_PER_MODEL;
        attempt++
      ) {
        try {
          console.log(
            `AI request: ${model} | Attempt ${attempt}`
          );

          const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
          });

          // -------------------------
          // CHECK AI RESPONSE
          // -------------------------

          const reply = response?.text?.trim();

          if (!reply) {
            throw new Error(
              "Gemini returned an empty response."
            );
          }

          console.log(
            `AI response successful using ${model}`
          );

          return res.json({
            success: true,
            reply: reply,
          });
        } catch (error) {
          lastError = error;

          console.error(
            `AI Error - Model: ${model}, Attempt: ${attempt}`
          );

          console.error(error?.message || error);

          // -------------------------
          // CHECK TEMPORARY ERROR
          // -------------------------

          const statusCode =
            error?.status ||
            error?.statusCode ||
            error?.code;

          const errorMessage =
            error?.message || "";

          const temporaryError =
            [408, 429, 500, 502, 503, 504].includes(
              Number(statusCode)
            ) ||
            errorMessage.includes("503") ||
            errorMessage.includes("high demand") ||
            errorMessage.includes("UNAVAILABLE") ||
            errorMessage.includes("overloaded") ||
            errorMessage.includes("temporarily");

          // -------------------------
          // RETRY TEMPORARY ERROR
          // -------------------------

          if (
            temporaryError &&
            attempt < MAX_ATTEMPTS_PER_MODEL
          ) {
            console.log(
              "Temporary Gemini error. Retrying..."
            );

            await new Promise((resolve) =>
              setTimeout(resolve, 2500)
            );

            continue;
          }

          // -------------------------
          // MOVE TO NEXT MODEL
          // -------------------------

          break;
        }
      }
    }

    // -------------------------
    // ALL MODELS FAILED
    // -------------------------

    console.error(
      "All Gemini models failed.",
      lastError?.message || lastError
    );

    return res.json({
      success: true,
      reply:
        "AI service is temporarily busy. Please try again in a few moments.",
    });
  } catch (error) {
    // -------------------------
    // GENERAL AI ERROR
    // -------------------------

    console.error("AI Assistant Error:", error);

    return res.status(500).json({
      success: false,
      message:
        "AI Assistant could not process the request.",
    });
  }
});
/* =====================================================
   START SERVER
===================================================== */

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});