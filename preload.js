// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  registerAluno: (dados) => ipcRenderer.invoke('registerAluno', dados),
  registerTarefa: (dados) => ipcRenderer.invoke('registerTarefa', dados),
  registerUser:  (dados) => ipcRenderer.invoke('registerUser', dados),
  registerTurma:  (dados) => ipcRenderer.invoke('registerTurma', dados),
  login:         (dados) => ipcRenderer.invoke('login', dados),
  addAlunoToTurma: (dados) => ipcRenderer.invoke('addAlunoToTurma', dados),
  getAlunos:     () => ipcRenderer.invoke('getAlunos'),
  getTarefas:    () => ipcRenderer.invoke('getTarefas'),
  getCursos:     () => ipcRenderer.invoke('getCursos'),
  getTurmas:     () => ipcRenderer.invoke('getTurmas'),
  getNiveis:     () => ipcRenderer.invoke('getNiveis'),
  getDashboardAdminEscolar: () => ipcRenderer.invoke('getDashboardAdminEscolar')
});