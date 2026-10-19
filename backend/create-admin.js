const bcrypt = require("bcryptjs");
const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "blue*wave",
  database: "integrated_business_management",
});

const username = "admin";
const plainPassword = "admin123";
const role = "Admin";

const hashedPassword = bcrypt.hashSync(plainPassword, 10);

const sql = `
  INSERT INTO users
  (username, password, role)
  VALUES (?, ?, ?)
`;

db.query(
  sql,
  [username, hashedPassword, role],
  (err) => {
    if (err) {
      console.error("Failed to create admin:", err.message);
    } else {
      console.log("Admin user created successfully!");
      console.log("Username: admin");
      console.log("Password: admin123");
      console.log("Role: Admin");
    }

    db.end();
  }
);