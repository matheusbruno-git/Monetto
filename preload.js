const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
    registerAluno: (dados) =>
        ipcRenderer.invoke("registerAluno", dados)
});