const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const db = require("./backend/connection.js");

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  win.loadFile("Monetto/landing_page/index.html");
}



ipcMain.handle("get-users", () => {
  try {
    const rows = db.prepare("SELECT * FROM users").all();
    return rows;
  } catch (error) {
    console.error("❌ Query error:", error);
    return [];
  }
});


app.whenReady().then(createWindow);


// --- 5. CLOSE HANDLER ---
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});