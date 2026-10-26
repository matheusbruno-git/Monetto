
const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "127.0.0.1",
  port: 3307,
  user: "root",
  password: process.env.DB_PASSWORD || "mlsolutions",
  database: "monetto",
});

db.connect((err) => {
  if (err) {
    console.error("❌ DB Connection Error:", err.message);
  } else {
    console.log("✅ MySQL Connected (Docker backend)");
  }
});

module.exports = db;

//commit