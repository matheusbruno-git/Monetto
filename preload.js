// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  registerAluno: (dados) => ipcRenderer.invoke('registerAluno', dados),
  registerTarefa: (dados) => ipcRenderer.invoke('registerTarefa', dados),
  registerUser:  (dados) => ipcRenderer.invoke('registerUser', dados),
  registerTurma:  (dados) => ipcRenderer.invoke('registerTurma', dados),
  registerProfessor: (dados) => ipcRenderer.invoke('registerProfessor', dados),
  login:         (dados) => ipcRenderer.invoke('login', dados),
  addAlunoToTurma: (dados) => ipcRenderer.invoke('addAlunoToTurma', dados),
  getAlunos:     (currentUserId) => ipcRenderer.invoke('getAlunos', currentUserId),
  getProfessores: (currentUserId) => ipcRenderer.invoke('getProfessores', currentUserId),
  getAdmins:     (currentUserId) => ipcRenderer.invoke('getAdmins', currentUserId),
  getTarefas:    (currentUserId) => ipcRenderer.invoke('getTarefas', currentUserId),
  getCursos:     () => ipcRenderer.invoke('getCursos'),
  getTurmas:     (currentUserId) => ipcRenderer.invoke('getTurmas', currentUserId),
  getNiveis:     () => ipcRenderer.invoke('getNiveis'),
  getSchools:   () => ipcRenderer.invoke('getSchools'),
  getDashboardAdminEscolar: (currentUserId) => ipcRenderer.invoke('getDashboardAdminEscolar', currentUserId)
});
