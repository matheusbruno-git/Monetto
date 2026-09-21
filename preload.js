const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  registerAluno: (dados) => ipcRenderer.invoke("registerAluno", dados),
  registerTarefa: (dados) => ipcRenderer.invoke("registerTarefa", dados),
  registerUser: (dados) => ipcRenderer.invoke("registerUser", dados),
  registerTurma: (dados) => ipcRenderer.invoke("registerTurma", dados),
  registerProfessor: (dados) => ipcRenderer.invoke("registerProfessor", dados),
  login: (dados) => ipcRenderer.invoke("login", dados),
  addAlunoToTurma: (dados) => ipcRenderer.invoke("addAlunoToTurma", dados),
  getAlunos: (currentUserId) => ipcRenderer.invoke("getAlunos", currentUserId),
  getAlunosProfessor: (currentUserId) =>
    ipcRenderer.invoke("getAlunosProfessor", currentUserId),
  getProfessores: (currentUserId) =>
    ipcRenderer.invoke("getProfessores", currentUserId),
  getAdmins: (currentUserId) => ipcRenderer.invoke("getAdmins", currentUserId),
  getTarefas: (currentUserId) =>
    ipcRenderer.invoke("getTarefas", currentUserId),
  getCursos: () => ipcRenderer.invoke("getCursos"),
  getTurmas: (currentUserId) => ipcRenderer.invoke("getTurmas", currentUserId),
  getNiveis: () => ipcRenderer.invoke("getNiveis"),
  getSchools: () => ipcRenderer.invoke("getSchools"),
  getDashboardAdminEscolar: (currentUserId) =>
    ipcRenderer.invoke("getDashboardAdminEscolar", currentUserId),
  getDashboardAdminGeral: (currentUserId) =>
    ipcRenderer.invoke("getDashboardAdminGeral", currentUserId),
  getAdminReports: (currentUserId) =>
    ipcRenderer.invoke("getAdminReports", currentUserId),
  getAdminProfile: (currentUserId) => {
    console.log("🔥 PRELOAD: getAdminProfile chamado");
    console.log("🔥 PRELOAD ID:", currentUserId);

    return ipcRenderer.invoke("getAdminProfile", currentUserId);
  },
  getProfessorProfile: (currentUserId) =>
    ipcRenderer.invoke("getProfessorProfile", currentUserId),
  getDashboardAdmin: (currentUserId) =>
    ipcRenderer.invoke("getDashboardAdmin", currentUserId),
  getDashboardTeacher: (currentUserId) =>
    ipcRenderer.invoke("getDashboardTeacher", currentUserId),
  getStudentDashboard: (studentId) =>
    ipcRenderer.invoke("getStudentDashboard", studentId),
  completeStudentTask: (studentId, taskId) =>
    ipcRenderer.invoke("completeStudentTask", studentId, taskId),
  awardStudentXp: (studentId, amount, source) =>
    ipcRenderer.invoke("awardStudentXp", studentId, amount, source),
  updateAluno: (dados) => ipcRenderer.invoke("updateAluno", dados),
  updateProfessor: (dados) => ipcRenderer.invoke("updateProfessor", dados),
  updateAdmin: (dados) => ipcRenderer.invoke("updateAdmin", dados),
  updateTarefa: (dados) => ipcRenderer.invoke("updateTarefa", dados),
  updateEscola: (dados) => ipcRenderer.invoke("updateEscola", dados),
  deleteAluno: (alunoId) => ipcRenderer.invoke("deleteAluno", alunoId),
  deleteProfessor: (professorId) =>
    ipcRenderer.invoke("deleteProfessor", professorId),
  deleteTurma: (turmaId) => ipcRenderer.invoke("deleteTurma", turmaId),
  deleteTarefa: (tarefaId) => ipcRenderer.invoke("deleteTarefa", tarefaId),
  deleteEscola: (escolaId) => ipcRenderer.invoke("deleteEscola", escolaId),
  atribuirProfessorATurma: (dados) =>
    ipcRenderer.invoke("atribuirProfessorATurma", dados),
  changeAdminPassword: (dados) =>
    ipcRenderer.invoke("changeAdminPassword", dados),
  changeProfessorPassword: (dados) =>
    ipcRenderer.invoke("changeProfessorPassword", dados),
  changeAlunoPassword: (dados) =>
    ipcRenderer.invoke("changeAlunoPassword", dados),
});
