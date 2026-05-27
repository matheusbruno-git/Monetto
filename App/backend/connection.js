// backend/connection.js
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',           // ← Your password
  database: 'monetto'
});

db.connect(err => {
  if (err) {
    console.error('❌ DB Connection Error:', err);
  } else {
    console.log('✅ MySQL Connected (backend)');
  }
});

// Export the connection so other files can use it
module.exports = db;