const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "blue*wave",
  database: "integrated_business_management",
});

const users = [
  {
    username: "hrmanager",
    password: "HR@12345",
    role: "HR Manager",
  },
  {
    username: "salesmanager",
    password: "Sales@12345",
    role: "Sales Manager",
  },
  {
    username: "inventorymanager",
    password: "Inventory@12345",
    role: "Inventory Manager",
  },
  {
    username: "financemanager",
    password: "Finance@12345",
    role: "Finance Manager",
  },
];

db.connect(async (err) => {
  if (err) {
    console.error("MySQL connection failed:", err.message);
    process.exit(1);
  }

  console.log("MySQL connected!");

  try {
    for (const user of users) {
      const existing = await new Promise((resolve, reject) => {
        db.query(
          "SELECT id FROM users WHERE username = ?",
          [user.username],
          (err, results) => {
            if (err) reject(err);
            else resolve(results);
          }
        );
      });

      if (existing.length > 0) {
        console.log(user.username + " already exists. Skipped.");
        continue;
      }

      const hashedPassword = await bcrypt.hash(user.password, 10);

      await new Promise((resolve, reject) => {
        db.query(
          "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
          [user.username, hashedPassword, user.role],
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
      });

      console.log(user.username + " account created!");
    }

    console.log("Account setup completed!");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    db.end();
  }
});