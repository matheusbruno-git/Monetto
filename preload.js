const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  getUsers: () => ipcRenderer.invoke("get-users")
});