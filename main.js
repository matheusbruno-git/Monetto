const { app, BrowserWindow, ipcMain } = require('electron')
const mysql = require("mysql2");

const createWindow = () => {
  const win = new BrowserWindow({
    webPreferences: {
      preload: __dirname + "/preload.js"
    }
  });

  win.loadFile('Monetto/landing_page/index.html')
};

ipcMain.handle("get-users", async () => {
  const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "yourpass",
    database: "mydb"
  });

  const [rows] = await db.promise().query("SELECT * FROM users");
  return rows;
});

app.whenReady().then(createWindow);