const mysql = require('mysql2');

// --- 1. GLOBAL DB CONNECTION (use only ONE) ---
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',         // <-- put your real password
  database: 'monetto'     // <-- your real database
});

db.connect(err => {
  if (err) {
    console.error("❌ DB Connection Error:", err);
  } else {
    console.log("✅ Connected to DB");
  }
});
