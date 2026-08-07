-- ============================================================
-- 1. ESCOLAS
-- ============================================================
INSERT INTO escolas (nome, cnpj, telefone, email, endereco, cidade, estado) VALUES
('Colégio Horizonte', '12.345.678/0001-90', '(11) 3456-7890', 'contato@horizonte.edu.br', 'Rua das Flores, 120', 'São Paulo', 'SP'),
('Escola Futuro Brilhante', '98.765.432/0001-10', '(21) 2345-6789', 'admin@futurobrilhante.com.br', 'Av. Atlântica, 450', 'Rio de Janeiro', 'RJ'),
('Instituto Educar+', '11.222.333/0001-44', '(31) 3222-1100', 'secretaria@educarmais.com.br', 'Rua Bahia, 88', 'Belo Horizonte', 'MG'),
('Colégio Nova Geração', '55.666.777/0001-22', '(41) 3333-4455', 'contato@novageracao.edu.br', 'Rua XV de Novembro, 300', 'Curitiba', 'PR');

-- ============================================================
-- 2. NIVEIS EDUCACIONAIS
-- ============================================================
INSERT INTO niveis_educacionais (nome, descricao, faixa_etaria, ordem_nivel) VALUES
('Fundamental I', '1º ao 5º ano', '6-10 anos', 1),
('Fundamental II', '6º ao 9º ano', '11-14 anos', 2),
('Ensino Médio', '1º ao 3º ano do EM', '15-17 anos', 3),
('Pré-Vestibular', 'Preparatório para vestibulares', '16-19 anos', 4);

-- ============================================================
-- 3. CURSOS
-- ============================================================
INSERT INTO cursos (nome, descricao, carga_horaria, nivel, faixa_etaria, preco) VALUES
('Matemática Financeira Básica', 'Introdução a juros, porcentagem e orçamento pessoal', 40, 'Fundamental II', '11-14 anos', 0.00),
('Educação Financeira para Adolescentes', 'Poupança, cartão de crédito e primeiros investimentos', 60, 'Ensino Médio', '15-17 anos', 0.00),
('Empreendedorismo Jovem', 'Como criar um negócio e gerir finanças', 80, 'Ensino Médio', '15-18 anos', 149.90),
('Investimentos para Iniciantes', 'Renda fixa, ações e fundos', 50, 'Pré-Vestibular', '16-19 anos', 199.90),
('Consumo Consciente', 'Publicidade, necessidades x desejos', 30, 'Fundamental I', '8-11 anos', 0.00);

-- ============================================================
-- 4. USUARIOS
-- (perfis: 1=admin, 2=aluno, 3=professor  – ajuste se os IDs forem diferentes)
-- ============================================================
INSERT INTO usuarios (id_perfil, id_escola, nome, email, senha_hash, cpf, data_nascimento, telefone, ativo) VALUES
-- Admins / gestores
(1, 1, 'Ana Paula Mendes', 'ana.mendes@horizonte.edu.br', '$2y$10$exemploHashAdmin1', '123.456.789-01', '1985-03-12', '(11) 98765-4321', 1),
(1, 2, 'Carlos Eduardo Silva', 'carlos.silva@futurobrilhante.com.br', '$2y$10$exemploHashAdmin2', '234.567.890-12', '1978-07-22', '(21) 97654-3210', 1),

-- Professores
(3, 1, 'Mariana Costa', 'mariana.costa@horizonte.edu.br', '$2y$10$exemploHashProf1', '345.678.901-23', '1990-11-05', '(11) 99887-6655', 1),
(3, 1, 'Roberto Almeida', 'roberto.almeida@horizonte.edu.br', '$2y$10$exemploHashProf2', '456.789.012-34', '1982-01-30', '(11) 98877-5544', 1),
(3, 2, 'Fernanda Oliveira', 'fernanda.oliveira@futurobrilhante.com.br', '$2y$10$exemploHashProf3', '567.890.123-45', '1988-09-18', '(21) 98765-1122', 1),
(3, 3, 'Lucas Pereira', 'lucas.pereira@educarmais.com.br', '$2y$10$exemploHashProf4', '678.901.234-56', '1992-04-25', '(31) 99988-7766', 1),

-- Alunos
(2, 1, 'João Pedro Santos', 'joao.santos@aluno.com', '$2y$10$exemploHashAluno1', '789.012.345-67', '2010-06-15', '(11) 91234-5678', 1),
(2, 1, 'Maria Eduarda Lima', 'maria.lima@aluno.com', '$2y$10$exemploHashAluno2', '890.123.456-78', '2011-02-28', '(11) 92345-6789', 1),
(2, 1, 'Pedro Henrique Souza', 'pedro.souza@aluno.com', '$2y$10$exemploHashAluno3', '901.234.567-89', '2009-12-10', '(11) 93456-7890', 1),
(2, 2, 'Beatriz Ferreira', 'beatriz.ferreira@aluno.com', '$2y$10$exemploHashAluno4', '012.345.678-90', '2008-08-03', '(21) 94567-8901', 1),
(2, 2, 'Gabriel Rocha', 'gabriel.rocha@aluno.com', '$2y$10$exemploHashAluno5', '123.456.789-10', '2010-05-19', '(21) 95678-9012', 1),
(2, 3, 'Larissa Mendes', 'larissa.mendes@aluno.com', '$2y$10$exemploHashAluno6', '234.567.890-21', '2007-11-27', '(31) 96789-0123', 1),
(2, 3, 'Thiago Barbosa', 'thiago.barbosa@aluno.com', '$2y$10$exemploHashAluno7', '345.678.901-32', '2009-03-14', '(31) 97890-1234', 1),
(2, 4, 'Camila Ribeiro', 'camila.ribeiro@aluno.com', '$2y$10$exemploHashAluno8', '456.789.012-43', '2011-07-08', '(41) 98901-2345', 1);

-- ============================================================
-- 5. TURMAS
-- ============================================================
INSERT INTO turmas (id_escola, id_professor, id_nivel, nome_turma, ano_letivo, data_inicio, data_fim, status) VALUES
(1, 3, 2, '6º Ano A - Manhã', 2026, '2026-02-10', '2026-12-15', 'ativa'),
(1, 4, 2, '7º Ano B - Tarde', 2026, '2026-02-10', '2026-12-15', 'ativa'),
(1, 3, 3, '1º EM - Educação Financeira', 2026, '2026-02-15', '2026-12-10', 'ativa'),
(2, 5, 3, '2º EM - Investimentos', 2026, '2026-02-12', '2026-12-12', 'ativa'),
(3, 6, 1, '4º Ano - Consumo Consciente', 2026, '2026-02-20', '2026-12-05', 'ativa'),
(4, 3, 4, 'Pré-Vestibular Intensivo', 2026, '2026-03-01', '2026-11-30', 'ativa');

-- (Opcional) Vincular alguns alunos a turmas se a coluna id_turma já existir
-- UPDATE usuarios SET id_turma = 1 WHERE id_usuario IN (7,8,9);
-- UPDATE usuarios SET id_turma = 4 WHERE id_usuario IN (10,11);
-- UPDATE usuarios SET id_turma = 5 WHERE id_usuario IN (12,13);

-- ============================================================
-- 6. CONFIGURAÇÕES ESCOLA
-- ============================================================
INSERT INTO configuracoes_escola (id_escola, nome_moeda, simbolo_moeda, saldo_inicial_aluno, max_parcelas, taxa_juros_padrao, gamificacao_ativa, investimentos_ativo) VALUES
(1, 'Monetto', 'M$', 50.00, 3, 1.50, 1, 1),
(2, 'Monetto', 'M$', 30.00, 4, 2.00, 1, 1),
(3, 'Crédito Escolar', 'CE$', 20.00, 2, 0.00, 1, 0),
(4, 'Monetto', 'M$', 100.00, 6, 1.80, 1, 1);

-- ============================================================
-- 7. DADOS RESPONSÁVEL
-- ============================================================
INSERT INTO dados_responsavel (id_usuario, nome, parentesco, cpf, telefone, email, autoriza_uso, data_autorizacao) VALUES
(7, 'Carlos Santos', 'Pai', '111.222.333-44', '(11) 91111-2222', 'carlos.santos@email.com', 1, '2026-01-15 10:00:00'),
(8, 'Patrícia Lima', 'Mãe', '222.333.444-55', '(11) 92222-3333', 'patricia.lima@email.com', 1, '2026-01-16 14:30:00'),
(9, 'Ricardo Souza', 'Pai', '333.444.555-66', '(11) 93333-4444', 'ricardo.souza@email.com', 1, '2026-01-18 09:15:00'),
(10, 'Juliana Ferreira', 'Mãe', '444.555.666-77', '(21) 94444-5555', 'juliana.ferreira@email.com', 1, '2026-01-20 11:00:00'),
(11, 'André Rocha', 'Pai', '555.666.777-88', '(21) 95555-6666', 'andre.rocha@email.com', 0, NULL),
(12, 'Sandra Mendes', 'Mãe', '666.777.888-99', '(31) 96666-7777', 'sandra.mendes@email.com', 1, '2026-01-22 16:45:00');

-- ============================================================
-- 8. AVALIAÇÕES
-- ============================================================
INSERT INTO avaliacoes (id_turma, id_curso, titulo, descricao, data_avaliacao, nota_maxima, nota_minima) VALUES
(1, 1, 'Prova 1 - Juros Simples', 'Avaliação sobre cálculo de juros simples e porcentagem', '2026-04-15', 10.00, 6.00),
(1, 1, 'Trabalho - Orçamento Familiar', 'Montar um orçamento mensal fictício', '2026-05-20', 10.00, 6.00),
(3, 2, 'Quiz - Cartão de Crédito', 'Conhecimentos sobre uso responsável do cartão', '2026-03-30', 10.00, 6.00),
(4, 4, 'Simulado Investimentos', 'Análise de carteira básica de investimentos', '2026-06-10', 10.00, 7.00),
(5, 5, 'Atividade - Necessidade x Desejo', 'Classificação de itens do dia a dia', '2026-04-05', 10.00, 5.00);

-- ============================================================
-- 9. NOTAS
-- ============================================================
INSERT INTO notas (id_avaliacao, id_aluno, nota, observacao) VALUES
(1, 7, 8.5, 'Bom domínio do conteúdo'),
(1, 8, 9.0, 'Excelente!'),
(1, 9, 6.5, 'Precisa revisar juros compostos'),
(2, 7, 7.0, NULL),
(2, 8, 9.5, 'Trabalho muito completo'),
(3, 7, 8.0, NULL),
(3, 8, 7.5, NULL),
(4, 10, 9.0, 'Ótima análise'),
(4, 11, 5.5, 'Abaixo da média – reforço recomendado'),
(5, 12, 10.0, 'Participação exemplar'),
(5, 13, 8.0, NULL);

-- ============================================================
-- 10. PAGAMENTOS
-- ============================================================
INSERT INTO pagamentos (id_escola, valor, data_pagamento, forma_pagamento, status, referencia_mes) VALUES
(1, 1250.00, '2026-02-05', 'PIX', 'pago', 'Fevereiro/2026'),
(1, 1250.00, '2026-03-05', 'Boleto', 'pago', 'Março/2026'),
(1, 1250.00, NULL, 'Boleto', 'pendente', 'Abril/2026'),
(2, 980.00, '2026-02-10', 'Cartão de Crédito', 'pago', 'Fevereiro/2026'),
(2, 980.00, '2026-03-10', 'PIX', 'pago', 'Março/2026'),
(3, 750.00, '2026-02-15', 'Transferência', 'pago', 'Fevereiro/2026'),
(4, 2100.00, '2026-03-01', 'PIX', 'pago', 'Março/2026');

-- ============================================================
-- 11. TAREFAS
-- ============================================================
INSERT INTO tarefas (id_escola, id_curso, titulo, descricao, data_criacao, data_vencimento, status) VALUES
(1, 1, 'Exercícios de Porcentagem', 'Resolver a lista de 15 exercícios sobre porcentagem e descontos', '2026-03-01', '2026-03-10', 'concluida'),
(1, 1, 'Simulação de Juros', 'Calcular o valor final de um empréstimo em 12 meses', '2026-03-15', '2026-03-25', 'pendente'),
(1, 2, 'Diário de Gastos', 'Registrar todos os gastos pessoais por 7 dias', '2026-04-01', '2026-04-08', 'pendente'),
(2, 4, 'Análise de Fundo de Investimento', 'Escolher um fundo e explicar rentabilidade e riscos', '2026-03-20', '2026-04-05', 'em_andamento'),
(3, 5, 'Lista de Desejos vs Necessidades', 'Separar 20 itens do supermercado', '2026-03-10', '2026-03-17', 'concluida');

-- ============================================================
-- 12. PROGRESSO ALUNO
-- ============================================================
INSERT INTO progresso_aluno (id_aluno, pontos_totais, saldo_moedas, nivel_atual, xp_atual, xp_proximo_nivel, percentual_conclusao, sequencia_dias) VALUES
(7, 450, 85.50, 3, 70, 150, 45.00, 5),
(8, 620, 120.00, 4, 30, 200, 62.00, 12),
(9, 180, 25.00, 2, 40, 100, 18.00, 2),
(10, 780, 210.75, 5, 90, 250, 78.00, 8),
(11, 95, 10.00, 1, 95, 100, 9.50, 1),
(12, 340, 55.00, 3, 20, 150, 34.00, 4),
(13, 510, 98.25, 3, 110, 150, 51.00, 7),
(14, 50, 5.00, 1, 50, 100, 5.00, 0);

-- ============================================================
-- 13. RECOMPENSAS
-- ============================================================
INSERT INTO recompensas (nome, descricao, tipo, valor_bonus, criterio, ativo) VALUES
('Primeiro Login', 'Bem-vindo à plataforma!', 'conquista', 10.00, 'Fazer o primeiro acesso', 1),
('Sequência de 7 dias', 'Estudou 7 dias seguidos', 'streak', 25.00, 'Sequência de 7 dias de atividade', 1),
('Mestre da Matemática', 'Acertou 10 exercícios de matemática financeira', 'habilidade', 50.00, '10 acertos consecutivos em matemática', 1),
('Orçamento Perfeito', 'Completou a atividade de orçamento com nota máxima', 'atividade', 30.00, 'Nota 10 na atividade de orçamento', 1),
('Investidor Iniciante', 'Simulou a primeira carteira de investimentos', 'conquista', 40.00, 'Criar e salvar uma carteira simulada', 1),
('Top 3 da Turma', 'Ficou entre os 3 melhores da turma no mês', 'ranking', 100.00, 'Top 3 no ranking mensal da turma', 1);

-- ============================================================
-- 14. RECOMPENSAS ALUNO
-- ============================================================
INSERT INTO recompensas_aluno (id_aluno, id_recompensa, visto) VALUES
(7, 1, 1),
(7, 2, 1),
(8, 1, 1),
(8, 2, 1),
(8, 3, 0),
(8, 4, 1),
(10, 1, 1),
(10, 5, 1),
(10, 6, 0),
(12, 1, 1),
(13, 1, 1),
(13, 2, 0);

-- ============================================================
-- 15. LOGS DE ATIVIDADE
-- ============================================================
INSERT INTO logs_atividade (id_usuario, acao, tabela_afetada, id_registro, dados_novos, ip_origem, user_agent) VALUES
(7, 'login', 'usuarios', 7, '{"status": "sucesso"}', '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),
(8, 'login', 'usuarios', 8, '{"status": "sucesso"}', '192.168.1.15', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)'),
(3, 'criar_avaliacao', 'avaliacoes', 1, '{"titulo": "Prova 1 - Juros Simples"}', '10.0.0.5', 'Mozilla/5.0 (Windows NT 10.0)'),
(7, 'responder_tarefa', 'tarefas', 1, '{"status": "concluida"}', '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),
(1, 'atualizar_config', 'configuracoes_escola', 1, '{"saldo_inicial_aluno": 50.00}', '10.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X)'),
(10, 'resgatar_recompensa', 'recompensas_aluno', 7, '{"id_recompensa": 5}', '203.0.113.45', 'Mozilla/5.0 (Android 14)');