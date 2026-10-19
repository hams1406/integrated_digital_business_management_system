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
      return res.status(403).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    req.user = user;
    next();
  });
}

// =========================
// ROLE AUTHORIZATION
// =========================

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

// =========================
// GEMINI AI
// =========================

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const AI_MODEL = "gemini-3.8-flash";

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
  res.json({
    success: true,
    message: "Server is running",
  });
});

// =====================================================
// EMPLOYEES
// =====================================================

app.get(
  "/api/employees",
  authenticateToken,
  allowRoles("Admin", "HR Manager"),
  (req, res) => {
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
  }
);

app.get(
  "/api/employees/:id",
  authenticateToken,
  allowRoles("Admin", "HR Manager"),
  (req, res) => {
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
  }
);

app.post(
  "/api/employees",
  authenticateToken,
  allowRoles("Admin", "HR Manager"),
  (req, res) => {
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
  }
);

app.put(
  "/api/employees/:id",
  authenticateToken,
  allowRoles("Admin", "HR Manager"),
  (req, res) => {
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
      (err) => {
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
  }
);

app.delete(
  "/api/employees/:id",
  authenticateToken,
  allowRoles("Admin", "HR Manager"),
  (req, res) => {
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
  }
);

// =====================================================
// INVENTORY
// =====================================================

app.get(
  "/api/inventory",
  authenticateToken,
  allowRoles("Admin", "Sales Manager", "Inventory Manager"),
  (req, res) => {
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
  }
);

app.get(
  "/api/inventory/:id",
  authenticateToken,
  allowRoles("Admin", "Sales Manager", "Inventory Manager"),
  (req, res) => {
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
  }
);

app.post(
  "/api/inventory",
  authenticateToken,
  allowRoles("Admin", "Inventory Manager"),
  (req, res) => {
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
  }
);

app.put(
  "/api/inventory/:id",
  authenticateToken,
  allowRoles("Admin", "Inventory Manager"),
  (req, res) => {
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
  }
);
app.delete(
  "/api/inventory/:id",
  authenticateToken,
  allowRoles("Admin", "Inventory Manager"),
  (req, res) => {
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
  }
);

// =====================================================
// SALES
// =====================================================

app.get(
  "/api/sales",
  authenticateToken,
  allowRoles("Admin", "Sales Manager", "Finance Manager"),
  (req, res) => {
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
  }
);

app.get(
  "/api/sales/:id",
  authenticateToken,
  allowRoles("Admin", "Sales Manager", "Finance Manager"),
  (req, res) => {
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
  }
);

app.post(
  "/api/sales",
  authenticateToken,
  allowRoles("Admin", "Sales Manager"),
  (req, res) => {
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
  }
);

app.put(
  "/api/sales/:id",
  authenticateToken,
  allowRoles("Admin", "Sales Manager"),
  (req, res) => {
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
  }
);

app.delete(
  "/api/sales/:id",
  authenticateToken,
  allowRoles("Admin", "Sales Manager"),
  (req, res) => {
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
  }
);

// =====================================================
// PURCHASES
// =====================================================

app.get(
  "/api/purchases",
  authenticateToken,
  allowRoles("Admin", "Inventory Manager", "Finance Manager"),
  (req, res) => {
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
  }
);

app.get(
  "/api/purchases/:id",
  authenticateToken,
  allowRoles("Admin", "Inventory Manager", "Finance Manager"),
  (req, res) => {
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
  }
);

app.post(
  "/api/purchases",
  authenticateToken,
  allowRoles("Admin", "Inventory Manager"),
  (req, res) => {
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
  }
);

app.put(
  "/api/purchases/:id",
  authenticateToken,
  allowRoles("Admin", "Inventory Manager"),
  (req, res) => {
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
  }
);

app.delete(
  "/api/purchases/:id",
  authenticateToken,
  allowRoles("Admin", "Inventory Manager"),
  (req, res) => {
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
  }
);

// =====================================================
// FINANCE
// =====================================================

app.get(
  "/api/finance/test",
  authenticateToken,
  allowRoles("Admin", "Finance Manager"),
  (req, res) => {
    res.json({
      success: true,
      message: "Finance API is working",
    });
  }
);

app.get(
  "/api/finance",
  authenticateToken,
  allowRoles("Admin", "Finance Manager"),
  (req, res) => {
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
  }
);

app.get(
  "/api/finance/:id",
  authenticateToken,
  allowRoles("Admin", "Finance Manager"),
  (req, res) => {
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
  }
);

app.post(
  "/api/finance",
  authenticateToken,
  allowRoles("Admin", "Finance Manager"),
  (req, res) => {
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
  }
);
app.put(
  "/api/finance/:id",
  authenticateToken,
  allowRoles("Admin", "Finance Manager"),
  (req, res) => {
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
  }
);

app.delete(
  "/api/finance/:id",
  authenticateToken,
  allowRoles("Admin", "Finance Manager"),
  (req, res) => {
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
  }
);

// =====================================================
// DASHBOARD
// =====================================================

app.get(
  "/api/dashboard",
  authenticateToken,
  allowRoles(
    "Admin",
    "HR Manager",
    "Sales Manager",
    "Inventory Manager",
    "Finance Manager"
  ),
  async (req, res) => {
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
  }
);

// =====================================================
// REPORTS
// =====================================================

app.get(
  "/api/reports/summary",
  authenticateToken,
  allowRoles(
    "Admin",
    "HR Manager",
    "Sales Manager",
    "Inventory Manager",
    "Finance Manager"
  ),
  async (req, res) => {
    try {
      const queries = {
        employees: `
          SELECT
            COUNT(*) AS total,
            SUM(status = 'Active') AS active
          FROM employees
        `,

        inventory: `
          SELECT
            COUNT(*) AS total,
            SUM(status = 'Low Stock') AS low_stock,
            SUM(status = 'Out of Stock') AS out_of_stock
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
  }
);

app.get(
  "/api/reports/sales",
  authenticateToken,
  allowRoles(
    "Admin",
    "HR Manager",
    "Sales Manager",
    "Inventory Manager",
    "Finance Manager"
  ),
  (req, res) => {
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
  }
);
app.put(
  "/api/finance/:id",
  authenticateToken,
  allowRoles("Admin", "Finance Manager"),
  (req, res) => {
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
  }
);

app.delete(
  "/api/finance/:id",
  authenticateToken,
  allowRoles("Admin", "Finance Manager"),
  (req, res) => {
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
  }
);

// =====================================================
// DASHBOARD
// =====================================================

app.get(
  "/api/dashboard",
  authenticateToken,
  allowRoles(
    "Admin",
    "HR Manager",
    "Sales Manager",
    "Inventory Manager",
    "Finance Manager"
  ),
  async (req, res) => {
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
  }
);

// =====================================================
// REPORTS
// =====================================================

app.get(
  "/api/reports/summary",
  authenticateToken,
  allowRoles(
    "Admin",
    "HR Manager",
    "Sales Manager",
    "Inventory Manager",
    "Finance Manager"
  ),
  async (req, res) => {
    try {
      const queries = {
        employees: `
          SELECT
            COUNT(*) AS total,
            SUM(status = 'Active') AS active
          FROM employees
        `,

        inventory: `
          SELECT
            COUNT(*) AS total,
            SUM(status = 'Low Stock') AS low_stock,
            SUM(status = 'Out of Stock') AS out_of_stock
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
  }
);

app.get(
  "/api/reports/sales",
  authenticateToken,
  allowRoles(
    "Admin",
    "HR Manager",
    "Sales Manager",
    "Inventory Manager",
    "Finance Manager"
  ),
  (req, res) => {
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
  }
);
// =========================
// START BACKEND SERVER
// =========================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});