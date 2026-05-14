const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  getUsers: () => ipcRenderer.invoke("get-users"),
  registerAluno: (dados) => ipcRenderer.invoke("registerAluno", dados)
});