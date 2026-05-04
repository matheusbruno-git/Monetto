const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const mysql = require('mysql2');

// --- 1. GLOBAL DB CONNECTION (use only ONE) ---
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',         // <-- put your real password
  database: 'myapp'     // <-- your real database
});

db.connect(err => {
  if (err) {
    console.error("❌ DB Connection Error:", err);
  } else {
    console.log("✅ Connected to DB");
  }
});


// --- 2. CREATE WINDOW ---
const createWindow = () => {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  win.loadFile('Monetto/landing_page/index.html');
};


// --- 3. IPC: GET USERS ---
ipcMain.handle("get-users", async () => {
  try {
    const [rows] = await db.promise().query("SELECT * FROM users");
    return rows;
  } catch (error) {
    console.error("❌ Query error:", error);
    return [];
  }
});


// --- 4. APP READY ---
app.whenReady().then(createWindow);


// --- 5. CLOSE HANDLER ---
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});