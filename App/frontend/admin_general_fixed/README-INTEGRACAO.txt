MONETTO — ADMIN GERAL COM DADOS REAIS

O dashboard-admin-geral foi alterado para buscar os dados do MySQL, seguindo o mesmo padrão usado no Admin Escolar.

Arquivos:
- admin_general/dashboard-admin-geral/dashboard-admin-geral.html
- admin_general/dashboard-admin-geral/script.js
- backend/get_dashboardAdminGeral.js
- main.js
- preload.js

O backend usa as tabelas existentes:
escolas, usuarios, perfis, progresso_aluno, pagamentos, cursos, tarefas e entregas.

Importante:
1. O usuário logado precisa ter id_perfil = 4 (admin).
2. Copie a pasta admin_general para o mesmo local onde ela já existe no projeto.
3. Copie backend/get_dashboardAdminGeral.js para App/backend/.
4. O main.js e preload.js incluídos já contêm o IPC necessário.
5. Se o seu main.js/preload.js tiver alterações mais novas que estes arquivos, não substitua o arquivo inteiro: copie apenas o handler getDashboardAdminGeral do main.js e a função getDashboardAdminGeral do preload.js.

O dashboard não usa mais os números fictícios de escolas, alunos, professores, XP, pagamentos, escolas, crescimento, cursos e atividades.
