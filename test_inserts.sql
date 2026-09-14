USE monetto;

-- ============================================================
-- 0. PERFIS (ordem correta: aluno → professor → escola → admin)
-- ============================================================
SET FOREIGN_KEY_CHECKS = 0;

-- Limpa e recria na ordem desejada
DELETE FROM perfis;

INSERT INTO perfis (id_perfil, nome, descricao, permissoes, ativo, criado_em) VALUES
(1, 'aluno',     'Usuário estudante',        '{"acessar_cursos": true, "visualizar_turmas": true, "realizar_atividades": true}', 1, NOW()),
(2, 'professor', 'Perfil de professor',     '{"acessar_cursos": true, "gerenciar_turmas": true, "lancar_notas": true, "criar_tarefas": true}', 1, NOW()),
(3, 'escola',    'Administrador da Escola', '{"gerenciar_usuarios": true, "gerenciar_turmas": true, "gerenciar_cursos": true, "ver_relatorios": true, "configurar_escola": true}', 1, NOW()),
(4, 'admin',     'Administrador do sistema','{"gerenciar_usuarios": true, "gerenciar_escolas": true, "gerenciar_perfis": true, "ver_tudo": true}', 1, NOW());

ALTER TABLE perfis AUTO_INCREMENT = 5;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 1. ESCOLAS
-- ============================================================
INSERT IGNORE INTO escolas (nome, cnpj, telefone, email, endereco, cidade, estado) VALUES
('Colégio Horizonte',               '12.345.678/0001-90', '(11) 3456-7890', 'contato@horizonte.edu.br',           'Rua das Flores, 120',       'São Paulo',      'SP'),
('Escola Futuro Brilhante',         '98.765.432/0001-10', '(21) 2345-6789', 'admin@futurobrilhante.com.br',       'Av. Atlântica, 450',        'Rio de Janeiro', 'RJ'),
('Instituto Educar+',               '11.222.333/0001-44', '(31) 3222-1100', 'secretaria@educarmais.com.br',       'Rua Bahia, 88',             'Belo Horizonte', 'MG'),
('Colégio Nova Geração',            '55.666.777/0001-22', '(41) 3333-4455', 'contato@novageracao.edu.br',         'Rua XV de Novembro, 300',   'Curitiba',       'PR'),
('Academia Super Mente',            '33.444.555/0001-66', '(11) 4002-8922', 'contato@supermente.edu.br',          'Av. dos Heróis, 1000',      'São Paulo',      'SP'),
('Colégio Liga da Justiça',         '44.555.666/0001-77', '(21) 3555-1212', 'secretaria@ligajustica.edu.br',      'Rua Gotham, 77',            'Rio de Janeiro', 'RJ'),
('Instituto Vingadores Educacional','77.888.999/0001-11', '(31) 3444-7788', 'admin@vingadoresedu.com.br',         'Av. Stark, 300',            'Belo Horizonte', 'MG'),
('Escola Mutante Xavier',           '22.333.444/0001-55', '(11) 3777-8899', 'contato@xavier.edu.br',              'Av. dos Mutantes, 1407',    'São Paulo',      'SP'),
('Colégio Asgardiano',              '66.777.888/0001-33', '(21) 3666-5544', 'secretaria@asgard.edu.br',           'Rua Bifrost, 9',            'Rio de Janeiro', 'RJ'),
('Instituto Wakanda Tech',          '88.999.000/0001-99', '(31) 3999-1122', 'admin@wakandatech.edu.br',           'Av. Vibranium, 1',          'Belo Horizonte', 'MG');

-- ============================================================
-- 2. NÍVEIS EDUCACIONAIS
-- ============================================================
INSERT IGNORE INTO niveis_educacionais (nome, descricao, faixa_etaria, ordem_nivel) VALUES
('Fundamental I - Iniciante', '1º e 2º ano',                  '6-8 anos',   0),
('Fundamental I',             '1º ao 5º ano',                 '6-10 anos',  1),
('Fundamental II',            '6º ao 9º ano',                 '11-14 anos', 2),
('Ensino Médio',              '1º ao 3º ano do EM',           '15-17 anos', 3),
('Pré-Vestibular',            'Preparatório para vestibulares','16-19 anos', 4),
('Ensino Médio Técnico',      'Ensino Médio com foco técnico','15-18 anos', 5);

-- ============================================================
-- 3. CURSOS
-- ============================================================
INSERT IGNORE INTO cursos (nome, descricao, carga_horaria, nivel, faixa_etaria, preco) VALUES
('Matemática Financeira Básica',        'Introdução a juros, porcentagem e orçamento pessoal', 40, 'Fundamental II', '11-14 anos', 0.00),
('Educação Financeira para Adolescentes','Poupança, cartão de crédito e primeiros investimentos', 60, 'Ensino Médio', '15-17 anos', 0.00),
('Empreendedorismo Jovem',              'Como criar um negócio e gerir finanças', 80, 'Ensino Médio', '15-18 anos', 149.90),
('Investimentos para Iniciantes',       'Renda fixa, ações e fundos', 50, 'Pré-Vestibular', '16-19 anos', 199.90),
('Consumo Consciente',                  'Publicidade, necessidades x desejos', 30, 'Fundamental I', '8-11 anos', 0.00),
('Economia do Super-Herói',             'Como os heróis gerenciam recursos e orçamentos de missão', 45, 'Fundamental II', '11-14 anos', 0.00),
('Finanças da Liga da Justiça',         'Orçamento coletivo, rateio de custos e transparência', 55, 'Ensino Médio', '15-17 anos', 0.00),
('Investimentos Stark Industries',      'Risco x retorno com exemplos de tecnologia e inovação', 70, 'Pré-Vestibular', '16-19 anos', 249.90),
('Poupança do Homem-Aranha',            'Pequenos valores, grandes resultados (juros compostos)', 35, 'Fundamental I', '8-11 anos', 0.00),
('Empreendedorismo Batcave',            'Como montar um negócio secreto e sustentável', 90, 'Ensino Médio', '15-18 anos', 179.90),
('Criptomoedas e o Multiverso',         'Entendendo ativos digitais de forma responsável', 40, 'Pré-Vestibular', '16-19 anos', 129.90),
('Finanças Mutantes',                   'Gestão de recursos em equipes diversas', 50, 'Ensino Médio', '15-17 anos', 0.00),
('Economia de Asgard',                  'Riqueza, ouro e sustentabilidade de reinos', 45, 'Fundamental II', '12-15 anos', 0.00),
('Tecnologia e Investimentos Wakanda',  'Inovação, vibranium e futuro financeiro', 60, 'Pré-Vestibular', '16-19 anos', 199.90),
('Orçamento de Missão S.H.I.E.L.D.',    'Planejamento de operações e controle de custos', 55, 'Ensino Médio', '15-18 anos', 0.00);

-- ============================================================
-- 5. USUÁRIOS (todos com senha 1234)
-- ============================================================
SET @hash = '$2b$10$ekKkUQAmecpVf7tj4X8ESu8LJqu4PGZhDkSATTsQJKV25oRQVZvBu';

-- ============================================================
-- 5.1 Administradores de Escola (perfil = escola)
-- ============================================================
INSERT IGNORE INTO usuarios (id_perfil, id_escola, nome, email, senha_hash, cpf, data_nascimento, telefone, ativo) 
SELECT p.id_perfil, e.id_escola, v.nome, v.email, @hash, v.cpf, v.data_nascimento, v.telefone, 1
FROM (
    SELECT 'escola' as perfil, 'Colégio Horizonte' as escola, 'Ana Paula Mendes' as nome, 'ana.mendes@horizonte.edu.br' as email, '123.456.789-01' as cpf, '1985-03-12' as data_nascimento, '(11) 98765-4321' as telefone UNION ALL
    SELECT 'escola', 'Escola Futuro Brilhante', 'Carlos Eduardo Silva', 'carlos.silva@futurobrilhante.com.br', '234.567.890-12', '1978-07-22', '(21) 97654-3210' UNION ALL
    SELECT 'escola', 'Instituto Educar+', 'Renata Souza', 'renata.souza@educarmais.com.br', '345.111.222-33', '1983-05-14', '(31) 98877-1122' UNION ALL
    SELECT 'escola', 'Colégio Nova Geração', 'Marcos Vinicius', 'marcos.vinicius@novageracao.edu.br', '456.222.333-44', '1979-11-30', '(41) 97766-2233' UNION ALL
    SELECT 'escola', 'Academia Super Mente', 'Helena Costa', 'helena.costa@supermente.edu.br', '567.333.444-55', '1986-08-22', '(11) 96655-3344' UNION ALL
    SELECT 'escola', 'Colégio Liga da Justiça', 'Alfred Pennyworth', 'alfred@ligajustica.edu.br', '678.444.555-66', '1965-04-01', '(21) 95544-4455' UNION ALL
    SELECT 'escola', 'Instituto Vingadores Educacional', 'Nick Fury', 'nick.fury@vingadoresedu.com.br', '789.555.666-77', '1970-09-15', '(31) 94433-5566' UNION ALL
    SELECT 'escola', 'Escola Mutante Xavier', 'Jean Grey Admin', 'admin@xavier.edu.br', '890.666.777-88', '1975-02-10', '(11) 93322-6677' UNION ALL
    SELECT 'escola', 'Colégio Asgardiano', 'Heimdall', 'heimdall@asgard.edu.br', '901.777.888-99', '1980-12-25', '(21) 92211-7788' UNION ALL
    SELECT 'escola', 'Instituto Wakanda Tech', 'Okoye', 'okoye@wakandatech.edu.br', '012.888.999-00', '1988-07-18', '(31) 91100-8899'
) v
JOIN perfis p ON p.nome = v.perfil
JOIN escolas e ON e.nome = v.escola;

-- ============================================================
-- 5.2 Professores
-- ============================================================
INSERT IGNORE INTO usuarios (id_perfil, id_escola, nome, email, senha_hash, cpf, data_nascimento, telefone, ativo) 
SELECT p.id_perfil, e.id_escola, v.nome, v.email, @hash, v.cpf, v.data_nascimento, v.telefone, 1
FROM (
    SELECT 'professor' as perfil, 'Colégio Horizonte' as escola, 'Mariana Costa' as nome, 'mariana.costa@horizonte.edu.br' as email, '345.678.901-23' as cpf, '1990-11-05' as data_nascimento, '(11) 99887-6655' as telefone UNION ALL
    SELECT 'professor', 'Colégio Horizonte', 'Roberto Almeida', 'roberto.almeida@horizonte.edu.br', '456.789.012-34', '1982-01-30', '(11) 98877-5544' UNION ALL
    SELECT 'professor', 'Escola Futuro Brilhante', 'Fernanda Oliveira', 'fernanda.oliveira@futurobrilhante.com.br', '567.890.123-45', '1988-09-18', '(21) 98765-1122' UNION ALL
    SELECT 'professor', 'Instituto Educar+', 'Lucas Pereira', 'lucas.pereira@educarmais.com.br', '678.901.234-56', '1992-04-25', '(31) 99988-7766' UNION ALL
    SELECT 'professor', 'Colégio Horizonte', 'Clark Kent', 'clark.kent@horizonte.edu.br', '111.222.333-01', '1985-06-18', '(11) 99111-2233' UNION ALL
    SELECT 'professor', 'Escola Futuro Brilhante', 'Diana Prince', 'diana.prince@futurobrilhante.com.br', '222.333.444-02', '1988-03-22', '(21) 99222-3344' UNION ALL
    SELECT 'professor', 'Academia Super Mente', 'Tony Stark', 'tony.stark@supermente.edu.br', '333.444.555-03', '1975-05-29', '(11) 99333-4455' UNION ALL
    SELECT 'professor', 'Colégio Liga da Justiça', 'Bruce Wayne', 'bruce.wayne@ligajustica.edu.br', '444.555.666-04', '1979-02-19', '(21) 99444-5566' UNION ALL
    SELECT 'professor', 'Instituto Vingadores Educacional', 'Natasha Romanoff', 'natasha.romanoff@vingadoresedu.com.br', '555.666.777-05', '1984-11-22', '(31) 99555-6677' UNION ALL
    SELECT 'professor', 'Escola Mutante Xavier', 'Charles Xavier', 'charles.xavier@xavier.edu.br', '666.777.888-06', '1963-01-01', '(11) 98888-7777' UNION ALL
    SELECT 'professor', 'Colégio Asgardiano', 'Thor Odinson', 'thor.odinson@asgard.edu.br', '777.888.999-07', '1983-08-11', '(21) 97777-6666' UNION ALL
    SELECT 'professor', 'Instituto Wakanda Tech', 'Shuri', 'shuri@wakandatech.edu.br', '888.999.000-08', '1998-03-15', '(31) 96666-5555' UNION ALL
    SELECT 'professor', 'Academia Super Mente', 'Pepper Potts', 'pepper.potts@supermente.edu.br', '999.000.111-09', '1980-04-20', '(11) 95555-4444' UNION ALL
    SELECT 'professor', 'Colégio Liga da Justiça', 'Barbara Gordon', 'barbara.gordon@ligajustica.edu.br', '000.111.222-10', '1987-09-23', '(21) 94444-3333'
) v
JOIN perfis p ON p.nome = v.perfil
JOIN escolas e ON e.nome = v.escola;

-- ============================================================
-- 5.3 Alunos
-- ============================================================
INSERT IGNORE INTO usuarios (id_perfil, id_escola, nome, email, senha_hash, cpf, data_nascimento, telefone, ativo) 
SELECT p.id_perfil, e.id_escola, v.nome, v.email, @hash, v.cpf, v.data_nascimento, v.telefone, 1
FROM (
    SELECT 'aluno' as perfil, 'Colégio Horizonte' as escola, 'João Pedro Santos' as nome, 'joao.santos@aluno.com' as email, '789.012.345-67' as cpf, '2010-06-15' as data_nascimento, '(11) 91234-5678' as telefone UNION ALL
    SELECT 'aluno', 'Colégio Horizonte', 'Maria Eduarda Lima', 'maria.lima@aluno.com', '890.123.456-78', '2011-02-28', '(11) 92345-6789' UNION ALL
    SELECT 'aluno', 'Colégio Horizonte', 'Pedro Henrique Souza', 'pedro.souza@aluno.com', '901.234.567-89', '2009-12-10', '(11) 93456-7890' UNION ALL
    SELECT 'aluno', 'Escola Futuro Brilhante', 'Beatriz Ferreira', 'beatriz.ferreira@aluno.com', '012.345.678-90', '2008-08-03', '(21) 94567-8901' UNION ALL
    SELECT 'aluno', 'Escola Futuro Brilhante', 'Gabriel Rocha', 'gabriel.rocha@aluno.com', '123.456.789-10', '2010-05-19', '(21) 95678-9012' UNION ALL
    SELECT 'aluno', 'Instituto Educar+', 'Larissa Mendes', 'larissa.mendes@aluno.com', '234.567.890-21', '2007-11-27', '(31) 96789-0123' UNION ALL
    SELECT 'aluno', 'Instituto Educar+', 'Thiago Barbosa', 'thiago.barbosa@aluno.com', '345.678.901-32', '2009-03-14', '(31) 97890-1234' UNION ALL
    SELECT 'aluno', 'Colégio Nova Geração', 'Camila Ribeiro', 'camila.ribeiro@aluno.com', '456.789.012-43', '2011-07-08', '(41) 98901-2345' UNION ALL
    -- Super-heróis
    SELECT 'aluno', 'Colégio Horizonte', 'Peter Parker', 'peter.parker@aluno.com', '666.777.888-11', '2011-08-10', '(11) 91111-1001' UNION ALL
    SELECT 'aluno', 'Colégio Horizonte', 'Miles Morales', 'miles.morales@aluno.com', '777.888.999-12', '2012-01-15', '(11) 91111-1002' UNION ALL
    SELECT 'aluno', 'Colégio Horizonte', 'Gwen Stacy', 'gwen.stacy@aluno.com', '888.999.000-13', '2011-11-03', '(11) 91111-1003' UNION ALL
    SELECT 'aluno', 'Escola Futuro Brilhante', 'Barry Allen', 'barry.allen@aluno.com', '999.000.111-14', '2009-03-14', '(21) 92222-2001' UNION ALL
    SELECT 'aluno', 'Escola Futuro Brilhante', 'Wally West', 'wally.west@aluno.com', '000.111.222-15', '2010-07-22', '(21) 92222-2002' UNION ALL
    SELECT 'aluno', 'Escola Futuro Brilhante', 'Iris West', 'iris.west@aluno.com', '111.222.333-16', '2009-09-05', '(21) 92222-2003' UNION ALL
    SELECT 'aluno', 'Academia Super Mente', 'Steve Rogers', 'steve.rogers@aluno.com', '222.333.444-17', '2008-07-04', '(11) 93333-3001' UNION ALL
    SELECT 'aluno', 'Academia Super Mente', 'Bucky Barnes', 'bucky.barnes@aluno.com', '333.444.555-18', '2008-03-10', '(11) 93333-3002' UNION ALL
    SELECT 'aluno', 'Academia Super Mente', 'Sam Wilson', 'sam.wilson@aluno.com', '444.555.666-19', '2009-09-23', '(11) 93333-3003' UNION ALL
    SELECT 'aluno', 'Colégio Liga da Justiça', 'Kara Danvers', 'kara.danvers@aluno.com', '555.666.777-20', '2010-09-22', '(21) 94444-4001' UNION ALL
    SELECT 'aluno', 'Colégio Liga da Justiça', 'Kate Kane', 'kate.kane@aluno.com', '666.777.888-21', '2009-01-26', '(21) 94444-4002' UNION ALL
    SELECT 'aluno', 'Colégio Liga da Justiça', 'Dick Grayson', 'dick.grayson@aluno.com', '777.888.999-22', '2011-03-20', '(21) 94444-4003' UNION ALL
    SELECT 'aluno', 'Instituto Vingadores Educacional', 'Wanda Maximoff', 'wanda.maximoff@aluno.com', '888.999.000-23', '2008-02-10', '(31) 95555-5001' UNION ALL
    SELECT 'aluno', 'Instituto Vingadores Educacional', 'Pietro Maximoff', 'pietro.maximoff@aluno.com', '999.000.111-24', '2008-02-10', '(31) 95555-5002' UNION ALL
    SELECT 'aluno', 'Instituto Vingadores Educacional', 'Vision', 'vision@aluno.com', '000.111.222-25', '2009-05-01', '(31) 95555-5003' UNION ALL
    SELECT 'aluno', 'Instituto Educar+', 'Hal Jordan', 'hal.jordan@aluno.com', '111.222.333-26', '2007-11-15', '(31) 96666-6001' UNION ALL
    SELECT 'aluno', 'Instituto Educar+', 'John Stewart', 'john.stewart@aluno.com', '222.333.444-27', '2008-06-08', '(31) 96666-6002' UNION ALL
    SELECT 'aluno', 'Colégio Nova Geração', 'Arthur Curry', 'arthur.curry@aluno.com', '333.444.555-28', '2009-01-29', '(41) 97777-7001' UNION ALL
    SELECT 'aluno', 'Colégio Nova Geração', 'Mera', 'mera@aluno.com', '444.555.666-29', '2010-04-12', '(41) 97777-7002' UNION ALL
    -- Novos alunos extras
    SELECT 'aluno', 'Escola Mutante Xavier', 'Jean Grey', 'jean.grey@aluno.com', '555.666.777-30', '2009-09-01', '(11) 90001-1001' UNION ALL
    SELECT 'aluno', 'Escola Mutante Xavier', 'Scott Summers', 'scott.summers@aluno.com', '666.777.888-31', '2008-10-15', '(11) 90001-1002' UNION ALL
    SELECT 'aluno', 'Escola Mutante Xavier', 'Ororo Munroe', 'ororo.munroe@aluno.com', '777.888.999-32', '2009-05-20', '(11) 90001-1003' UNION ALL
    SELECT 'aluno', 'Escola Mutante Xavier', 'Logan Howlett', 'logan.howlett@aluno.com', '888.999.000-33', '2007-07-07', '(11) 90001-1004' UNION ALL
    SELECT 'aluno', 'Colégio Asgardiano', 'Loki Laufeyson', 'loki.laufeyson@aluno.com', '999.000.111-34', '2008-12-17', '(21) 90002-2001' UNION ALL
    SELECT 'aluno', 'Colégio Asgardiano', 'Sif', 'sif@aluno.com', '000.111.222-35', '2009-04-10', '(21) 90002-2002' UNION ALL
    SELECT 'aluno', 'Instituto Wakanda Tech', 'T''Challa', 'tchalla@aluno.com', '111.222.333-36', '2008-11-29', '(31) 90003-3001' UNION ALL
    SELECT 'aluno', 'Instituto Wakanda Tech', 'Nakia', 'nakia@aluno.com', '222.333.444-37', '2009-06-18', '(31) 90003-3002' UNION ALL
    SELECT 'aluno', 'Academia Super Mente', 'Harley Quinn', 'harley.quinn@aluno.com', '333.444.555-38', '2010-07-20', '(11) 90004-4001' UNION ALL
    SELECT 'aluno', 'Colégio Liga da Justiça', 'Jason Todd', 'jason.todd@aluno.com', '444.555.666-39', '2011-08-16', '(21) 90005-5001' UNION ALL
    SELECT 'aluno', 'Colégio Horizonte', 'Tim Drake', 'tim.drake@aluno.com', '555.666.777-40', '2012-02-14', '(11) 90006-6001' UNION ALL
    SELECT 'aluno', 'Escola Futuro Brilhante', 'Bart Allen', 'bart.allen@aluno.com', '666.777.888-41', '2012-05-05', '(21) 90007-7001'
) v
JOIN perfis p ON p.nome = v.perfil
JOIN escolas e ON e.nome = v.escola;

-- ============================================================
-- 6. TURMAS
-- ============================================================
INSERT IGNORE INTO turmas (id_escola, id_professor, id_nivel, nome_turma, ano_letivo, data_inicio, data_fim, status)
SELECT e.id_escola, u.id_usuario, n.id_nivel, v.nome_turma, 2026, v.data_inicio, v.data_fim, 'ativa'
FROM (
    SELECT 'Colégio Horizonte' as escola, 'clark.kent@horizonte.edu.br' as prof, 'Fundamental II' as nivel, '6º Ano Super - Manhã' as nome_turma, '2026-02-10' as data_inicio, '2026-12-15' as data_fim UNION ALL
    SELECT 'Escola Futuro Brilhante', 'diana.prince@futurobrilhante.com.br', 'Ensino Médio', '2º EM Liga da Justiça', '2026-02-12', '2026-12-12' UNION ALL
    SELECT 'Academia Super Mente', 'tony.stark@supermente.edu.br', 'Ensino Médio', '1º EM Stark Finance', '2026-02-15', '2026-12-10' UNION ALL
    SELECT 'Colégio Liga da Justiça', 'bruce.wayne@ligajustica.edu.br', 'Fundamental II', '7º Ano Batcave', '2026-02-10', '2026-12-15' UNION ALL
    SELECT 'Instituto Vingadores Educacional', 'natasha.romanoff@vingadoresedu.com.br', 'Fundamental I', '4º Ano Vingadores Kids', '2026-02-20', '2026-12-05' UNION ALL
    SELECT 'Colégio Horizonte', 'mariana.costa@horizonte.edu.br', 'Pré-Vestibular', 'Pré-Vestibular Heróis', '2026-03-01', '2026-11-30' UNION ALL
    SELECT 'Colégio Horizonte', 'mariana.costa@horizonte.edu.br', 'Fundamental II', '6º Ano A - Manhã', '2026-02-10', '2026-12-15' UNION ALL
    SELECT 'Colégio Horizonte', 'roberto.almeida@horizonte.edu.br', 'Fundamental II', '7º Ano B - Tarde', '2026-02-10', '2026-12-15' UNION ALL
    SELECT 'Colégio Horizonte', 'mariana.costa@horizonte.edu.br', 'Ensino Médio', '1º EM - Educação Financeira', '2026-02-15', '2026-12-10' UNION ALL
    SELECT 'Escola Futuro Brilhante', 'fernanda.oliveira@futurobrilhante.com.br', 'Ensino Médio', '2º EM - Investimentos', '2026-02-12', '2026-12-12' UNION ALL
    SELECT 'Instituto Educar+', 'lucas.pereira@educarmais.com.br', 'Fundamental I', '4º Ano - Consumo Consciente', '2026-02-20', '2026-12-05' UNION ALL
    SELECT 'Colégio Nova Geração', 'mariana.costa@horizonte.edu.br', 'Pré-Vestibular', 'Pré-Vestibular Intensivo', '2026-03-01', '2026-11-30' UNION ALL
    SELECT 'Escola Mutante Xavier', 'charles.xavier@xavier.edu.br', 'Ensino Médio', '1º EM Mutantes', '2026-02-18', '2026-12-10' UNION ALL
    SELECT 'Colégio Asgardiano', 'thor.odinson@asgard.edu.br', 'Fundamental II', '8º Ano Asgard', '2026-02-22', '2026-12-08' UNION ALL
    SELECT 'Instituto Wakanda Tech', 'shuri@wakandatech.edu.br', 'Pré-Vestibular', 'Pré-Vestibular Wakanda', '2026-03-05', '2026-11-25' UNION ALL
    SELECT 'Academia Super Mente', 'pepper.potts@supermente.edu.br', 'Ensino Médio', '2º EM Potts Business', '2026-02-25', '2026-12-15' UNION ALL
    SELECT 'Colégio Liga da Justiça', 'barbara.gordon@ligajustica.edu.br', 'Fundamental II', '9º Ano Oracle', '2026-02-15', '2026-12-12'
) v
JOIN escolas e ON e.nome = v.escola
JOIN usuarios u ON u.email = v.prof
JOIN niveis_educacionais n ON n.nome = v.nivel;

-- ============================================================
-- 7. CONFIGURAÇÕES DAS ESCOLAS
-- ============================================================
INSERT IGNORE INTO configuracoes_escola (id_escola, nome_moeda, simbolo_moeda, saldo_inicial_aluno, max_parcelas, taxa_juros_padrao, gamificacao_ativa, investimentos_ativo)
SELECT e.id_escola, v.nome_moeda, v.simbolo, v.saldo, v.parcelas, v.juros, 1, v.invest
FROM (
    SELECT 'Colégio Horizonte' as escola, 'Monetto' as nome_moeda, 'M$' as simbolo, 50.00 as saldo, 3 as parcelas, 1.50 as juros, 1 as invest UNION ALL
    SELECT 'Escola Futuro Brilhante', 'Monetto', 'M$', 30.00, 4, 2.00, 1 UNION ALL
    SELECT 'Instituto Educar+', 'Crédito Escolar', 'CE$', 20.00, 2, 0.00, 0 UNION ALL
    SELECT 'Colégio Nova Geração', 'Monetto', 'M$', 100.00, 6, 1.80, 1 UNION ALL
    SELECT 'Academia Super Mente', 'Monetto', 'M$', 80.00, 4, 1.20, 1 UNION ALL
    SELECT 'Colégio Liga da Justiça', 'Batcoin', 'B$', 60.00, 3, 1.80, 1 UNION ALL
    SELECT 'Instituto Vingadores Educacional', 'Stark Credit', 'SC$', 120.00, 6, 0.90, 1 UNION ALL
    SELECT 'Escola Mutante Xavier', 'X-Credit', 'X$', 70.00, 4, 1.40, 1 UNION ALL
    SELECT 'Colégio Asgardiano', 'Asgard Gold', 'AG$', 90.00, 3, 1.10, 1 UNION ALL
    SELECT 'Instituto Wakanda Tech', 'Vibranium Coin', 'VC$', 150.00, 5, 0.80, 1
) v
JOIN escolas e ON e.nome = v.escola;

-- ============================================================
-- 8. DADOS DOS RESPONSÁVEIS
-- ============================================================
INSERT IGNORE INTO dados_responsavel (id_usuario, nome, parentesco, cpf, telefone, email, autoriza_uso, data_autorizacao)
SELECT u.id_usuario, v.nome, v.parentesco, v.cpf, v.telefone, v.email, v.autoriza, v.data_autorizacao
FROM (
    SELECT 'joao.santos@aluno.com' as aluno, 'Carlos Santos' as nome, 'Pai' as parentesco, '111.222.333-44' as cpf, '(11) 91111-2222' as telefone, 'carlos.santos@email.com' as email, 1 as autoriza, '2026-01-15 10:00:00' as data_autorizacao UNION ALL
    SELECT 'maria.lima@aluno.com', 'Patrícia Lima', 'Mãe', '222.333.444-55', '(11) 92222-3333', 'patricia.lima@email.com', 1, '2026-01-16 14:30:00' UNION ALL
    SELECT 'pedro.souza@aluno.com', 'Ricardo Souza', 'Pai', '333.444.555-66', '(11) 93333-4444', 'ricardo.souza@email.com', 1, '2026-01-18 09:15:00' UNION ALL
    SELECT 'beatriz.ferreira@aluno.com', 'Juliana Ferreira', 'Mãe', '444.555.666-77', '(21) 94444-5555', 'juliana.ferreira@email.com', 1, '2026-01-20 11:00:00' UNION ALL
    SELECT 'gabriel.rocha@aluno.com', 'André Rocha', 'Pai', '555.666.777-88', '(21) 95555-6666', 'andre.rocha@email.com', 0, NULL UNION ALL
    SELECT 'larissa.mendes@aluno.com', 'Sandra Mendes', 'Mãe', '666.777.888-99', '(31) 96666-7777', 'sandra.mendes@email.com', 1, '2026-01-22 16:45:00' UNION ALL
    SELECT 'peter.parker@aluno.com', 'May Parker', 'Tia', '101.202.303-40', '(11) 91111-9001', 'may.parker@email.com', 1, '2026-01-10 09:00:00' UNION ALL
    SELECT 'miles.morales@aluno.com', 'Rio Morales', 'Pai', '202.303.404-50', '(11) 91111-9002', 'rio.morales@email.com', 1, '2026-01-11 10:30:00' UNION ALL
    SELECT 'gwen.stacy@aluno.com', 'George Stacy', 'Pai', '303.404.505-60', '(11) 91111-9003', 'george.stacy@email.com', 1, '2026-01-12 14:00:00' UNION ALL
    SELECT 'barry.allen@aluno.com', 'Henry Allen', 'Pai', '404.505.606-70', '(21) 92222-9001', 'henry.allen@email.com', 1, '2026-01-13 11:15:00' UNION ALL
    SELECT 'steve.rogers@aluno.com', 'Sarah Rogers', 'Mãe', '505.606.707-80', '(11) 93333-9001', 'sarah.rogers@email.com', 1, '2026-01-14 16:00:00' UNION ALL
    SELECT 'kara.danvers@aluno.com', 'Eliza Danvers', 'Mãe', '606.707.808-90', '(21) 94444-9001', 'eliza.danvers@email.com', 1, '2026-01-15 08:45:00' UNION ALL
    SELECT 'wanda.maximoff@aluno.com', 'Oksana Maximoff', 'Mãe', '707.808.909-00', '(31) 95555-9001', 'oksana.maximoff@email.com', 1, '2026-01-16 13:20:00' UNION ALL
    SELECT 'jean.grey@aluno.com', 'John Grey', 'Pai', '808.909.010-11', '(11) 90001-9001', 'john.grey@email.com', 1, '2026-01-17 10:00:00' UNION ALL
    SELECT 'scott.summers@aluno.com', 'Christopher Summers', 'Pai', '909.010.111-22', '(11) 90001-9002', 'chris.summers@email.com', 1, '2026-01-18 11:30:00' UNION ALL
    SELECT 'logan.howlett@aluno.com', 'James Howlett', 'Pai', '010.111.212-33', '(11) 90001-9003', 'james.howlett@email.com', 0, NULL UNION ALL
    SELECT 'loki.laufeyson@aluno.com', 'Laufey', 'Pai', '111.212.313-44', '(21) 90002-9001', 'laufey@email.com', 1, '2026-01-19 09:00:00' UNION ALL
    SELECT 'tchalla@aluno.com', 'T''Chaka', 'Pai', '212.313.414-55', '(31) 90003-9001', 'tchaka@email.com', 1, '2026-01-20 14:00:00'
) v
JOIN usuarios u ON u.email = v.aluno;

-- ============================================================
-- 9. AVALIAÇÕES
-- ============================================================
INSERT IGNORE INTO avaliacoes (id_turma, id_curso, titulo, descricao, data_avaliacao, nota_maxima, nota_minima)
SELECT t.id_turma, c.id_curso, v.titulo, v.descricao, v.data_avaliacao, v.nota_max, v.nota_min
FROM (
    SELECT '6º Ano Super - Manhã' as turma, 'Economia do Super-Herói' as curso, 'Missão: Orçamento de Herói' as titulo, 'Montar orçamento de missão de 1 mês' as descricao, '2026-04-20' as data_avaliacao, 10.00 as nota_max, 6.00 as nota_min UNION ALL
    SELECT '2º EM Liga da Justiça', 'Finanças da Liga da Justiça', 'Simulado Liga da Justiça', 'Análise coletiva de custos e rateio', '2026-05-15', 10.00, 6.50 UNION ALL
    SELECT '1º EM Stark Finance', 'Investimentos Stark Industries', 'Projeto Stark - Carteira', 'Criar carteira diversificada', '2026-06-01', 10.00, 7.00 UNION ALL
    SELECT '7º Ano Batcave', 'Poupança do Homem-Aranha', 'Quiz Poupança do Aranha', 'Juros compostos na prática', '2026-03-25', 10.00, 5.50 UNION ALL
    SELECT '4º Ano Vingadores Kids', 'Empreendedorismo Batcave', 'Empreendedorismo Batcave', 'Plano de negócios secreto', '2026-05-30', 10.00, 6.00 UNION ALL
    SELECT '6º Ano A - Manhã', 'Matemática Financeira Básica', 'Prova 1 - Juros Simples', 'Avaliação sobre cálculo de juros simples e porcentagem', '2026-04-15', 10.00, 6.00 UNION ALL
    SELECT '6º Ano A - Manhã', 'Matemática Financeira Básica', 'Trabalho - Orçamento Familiar', 'Montar um orçamento mensal fictício', '2026-05-20', 10.00, 6.00 UNION ALL
    SELECT '1º EM - Educação Financeira', 'Educação Financeira para Adolescentes', 'Quiz - Cartão de Crédito', 'Conhecimentos sobre uso responsável do cartão', '2026-03-30', 10.00, 6.00 UNION ALL
    SELECT '2º EM - Investimentos', 'Investimentos para Iniciantes', 'Simulado Investimentos', 'Análise de carteira básica de investimentos', '2026-06-10', 10.00, 7.00 UNION ALL
    SELECT '4º Ano - Consumo Consciente', 'Consumo Consciente', 'Atividade - Necessidade x Desejo', 'Classificação de itens do dia a dia', '2026-04-05', 10.00, 5.00 UNION ALL
    SELECT '1º EM Mutantes', 'Finanças Mutantes', 'Prova Mutante - Orçamento', 'Gestão de recursos em equipe diversa', '2026-04-22', 10.00, 6.00 UNION ALL
    SELECT '8º Ano Asgard', 'Economia de Asgard', 'Quiz Ouro de Asgard', 'Riqueza e sustentabilidade', '2026-05-05', 10.00, 6.00 UNION ALL
    SELECT 'Pré-Vestibular Wakanda', 'Tecnologia e Investimentos Wakanda', 'Projeto Vibranium', 'Inovação e futuro financeiro', '2026-06-15', 10.00, 7.00 UNION ALL
    SELECT '2º EM Potts Business', 'Empreendedorismo Jovem', 'Plano de Negócios Potts', 'Criar empresa sustentável', '2026-05-18', 10.00, 6.50 UNION ALL
    SELECT '9º Ano Oracle', 'Economia do Super-Herói', 'Análise de Custos Oracle', 'Controle de informações e orçamento', '2026-04-28', 10.00, 6.00
) v
JOIN turmas t ON t.nome_turma = v.turma
JOIN cursos c ON c.nome = v.curso;

-- ============================================================
-- 10. NOTAS
-- ============================================================
INSERT IGNORE INTO notas (id_avaliacao, id_aluno, nota, observacao)
SELECT a.id_avaliacao, u.id_usuario, v.nota, v.observacao
FROM (
    SELECT 'Missão: Orçamento de Herói' as avaliacao, 'peter.parker@aluno.com' as aluno, 9.5 as nota, 'Excelente domínio de orçamento' as observacao UNION ALL
    SELECT 'Missão: Orçamento de Herói', 'miles.morales@aluno.com', 8.0, 'Bom trabalho em equipe' UNION ALL
    SELECT 'Missão: Orçamento de Herói', 'gwen.stacy@aluno.com', 9.0, NULL UNION ALL
    SELECT 'Simulado Liga da Justiça', 'barry.allen@aluno.com', 9.8, 'Velocidade e precisão impressionantes' UNION ALL
    SELECT 'Simulado Liga da Justiça', 'wally.west@aluno.com', 8.5, NULL UNION ALL
    SELECT 'Simulado Liga da Justiça', 'iris.west@aluno.com', 7.5, 'Precisa revisar rateio de custos' UNION ALL
    SELECT 'Projeto Stark - Carteira', 'steve.rogers@aluno.com', 10.0, 'Líder nato' UNION ALL
    SELECT 'Projeto Stark - Carteira', 'bucky.barnes@aluno.com', 8.7, NULL UNION ALL
    SELECT 'Projeto Stark - Carteira', 'sam.wilson@aluno.com', 9.2, 'Ótima análise de risco' UNION ALL
    SELECT 'Quiz Poupança do Aranha', 'kara.danvers@aluno.com', 9.5, 'Super força nos cálculos' UNION ALL
    SELECT 'Quiz Poupança do Aranha', 'kate.kane@aluno.com', 8.0, NULL UNION ALL
    SELECT 'Quiz Poupança do Aranha', 'dick.grayson@aluno.com', 7.8, 'Bom potencial' UNION ALL
    SELECT 'Empreendedorismo Batcave', 'wanda.maximoff@aluno.com', 9.0, 'Magia nos números' UNION ALL
    SELECT 'Empreendedorismo Batcave', 'pietro.maximoff@aluno.com', 8.5, NULL UNION ALL
    SELECT 'Empreendedorismo Batcave', 'vision@aluno.com', 9.7, 'Visão de futuro impecável' UNION ALL
    SELECT 'Prova 1 - Juros Simples', 'joao.santos@aluno.com', 8.5, 'Bom domínio do conteúdo' UNION ALL
    SELECT 'Prova 1 - Juros Simples', 'maria.lima@aluno.com', 9.0, 'Excelente!' UNION ALL
    SELECT 'Prova 1 - Juros Simples', 'pedro.souza@aluno.com', 6.5, 'Precisa revisar juros compostos' UNION ALL
    SELECT 'Trabalho - Orçamento Familiar', 'joao.santos@aluno.com', 7.0, NULL UNION ALL
    SELECT 'Trabalho - Orçamento Familiar', 'maria.lima@aluno.com', 9.5, 'Trabalho muito completo' UNION ALL
    SELECT 'Quiz - Cartão de Crédito', 'joao.santos@aluno.com', 8.0, NULL UNION ALL
    SELECT 'Quiz - Cartão de Crédito', 'maria.lima@aluno.com', 7.5, NULL UNION ALL
    SELECT 'Simulado Investimentos', 'beatriz.ferreira@aluno.com', 9.0, 'Ótima análise' UNION ALL
    SELECT 'Simulado Investimentos', 'gabriel.rocha@aluno.com', 5.5, 'Abaixo da média – reforço recomendado' UNION ALL
    SELECT 'Atividade - Necessidade x Desejo', 'larissa.mendes@aluno.com', 10.0, 'Participação exemplar' UNION ALL
    SELECT 'Atividade - Necessidade x Desejo', 'thiago.barbosa@aluno.com', 8.0, NULL UNION ALL
    SELECT 'Prova Mutante - Orçamento', 'jean.grey@aluno.com', 9.8, 'Poder mental aplicado às finanças' UNION ALL
    SELECT 'Prova Mutante - Orçamento', 'scott.summers@aluno.com', 8.5, NULL UNION ALL
    SELECT 'Prova Mutante - Orçamento', 'ororo.munroe@aluno.com', 9.2, 'Controle climático e orçamentário' UNION ALL
    SELECT 'Quiz Ouro de Asgard', 'loki.laufeyson@aluno.com', 7.0, 'Criativo, mas arriscado' UNION ALL
    SELECT 'Quiz Ouro de Asgard', 'sif@aluno.com', 9.0, 'Honrosa e precisa' UNION ALL
    SELECT 'Projeto Vibranium', 'tchalla@aluno.com', 10.0, 'Realeza financeira' UNION ALL
    SELECT 'Projeto Vibranium', 'nakia@aluno.com', 9.3, NULL UNION ALL
    SELECT 'Plano de Negócios Potts', 'harley.quinn@aluno.com', 8.8, 'Caótica mas lucrativa' UNION ALL
    SELECT 'Análise de Custos Oracle', 'jason.todd@aluno.com', 7.5, NULL UNION ALL
    SELECT 'Análise de Custos Oracle', 'tim.drake@aluno.com', 9.6, 'Detetive financeiro'
) v
JOIN avaliacoes a ON a.titulo = v.avaliacao
JOIN usuarios u ON u.email = v.aluno;

-- ============================================================
-- 11. PAGAMENTOS
-- ============================================================
INSERT IGNORE INTO pagamentos (id_escola, valor, data_pagamento, forma_pagamento, status, referencia_mes)
SELECT e.id_escola, v.valor, v.data_pagamento, v.forma, v.status, v.referencia
FROM (
    SELECT 'Colégio Horizonte' as escola, 1250.00 as valor, '2026-02-05' as data_pagamento, 'PIX' as forma, 'pago' as status, 'Fevereiro/2026' as referencia UNION ALL
    SELECT 'Colégio Horizonte', 1250.00, '2026-03-05', 'Boleto', 'pago', 'Março/2026' UNION ALL
    SELECT 'Colégio Horizonte', 1250.00, NULL, 'Boleto', 'pendente', 'Abril/2026' UNION ALL
    SELECT 'Escola Futuro Brilhante', 980.00, '2026-02-10', 'Cartão de Crédito', 'pago', 'Fevereiro/2026' UNION ALL
    SELECT 'Escola Futuro Brilhante', 980.00, '2026-03-10', 'PIX', 'pago', 'Março/2026' UNION ALL
    SELECT 'Instituto Educar+', 750.00, '2026-02-15', 'Transferência', 'pago', 'Fevereiro/2026' UNION ALL
    SELECT 'Colégio Nova Geração', 2100.00, '2026-03-01', 'PIX', 'pago', 'Março/2026' UNION ALL
    SELECT 'Academia Super Mente', 1850.00, '2026-02-08', 'PIX', 'pago', 'Fevereiro/2026' UNION ALL
    SELECT 'Academia Super Mente', 1850.00, '2026-03-08', 'Cartão de Crédito', 'pago', 'Março/2026' UNION ALL
    SELECT 'Academia Super Mente', 1850.00, NULL, 'Boleto', 'pendente', 'Abril/2026' UNION ALL
    SELECT 'Colégio Liga da Justiça', 1420.00, '2026-02-12', 'PIX', 'pago', 'Fevereiro/2026' UNION ALL
    SELECT 'Colégio Liga da Justiça', 1420.00, '2026-03-12', 'Transferência', 'pago', 'Março/2026' UNION ALL
    SELECT 'Instituto Vingadores Educacional', 3100.00, '2026-02-20', 'PIX', 'pago', 'Fevereiro/2026' UNION ALL
    SELECT 'Instituto Vingadores Educacional', 3100.00, '2026-03-20', 'Cartão de Crédito', 'pago', 'Março/2026' UNION ALL
    SELECT 'Escola Mutante Xavier', 1650.00, '2026-02-18', 'PIX', 'pago', 'Fevereiro/2026' UNION ALL
    SELECT 'Colégio Asgardiano', 1980.00, '2026-02-22', 'PIX', 'pago', 'Fevereiro/2026' UNION ALL
    SELECT 'Instituto Wakanda Tech', 2800.00, '2026-03-05', 'Cartão de Crédito', 'pago', 'Março/2026'
) v
JOIN escolas e ON e.nome = v.escola;

-- ============================================================
-- 12. TAREFAS
-- ============================================================
INSERT IGNORE INTO tarefas (id_escola, id_curso, titulo, descricao, data_criacao, data_vencimento, status)
SELECT e.id_escola, c.id_curso, v.titulo, v.descricao, v.data_criacao, v.data_vencimento, v.status
FROM (
    SELECT 'Colégio Horizonte' as escola, 'Matemática Financeira Básica' as curso, 'Exercícios de Porcentagem' as titulo, 'Resolver a lista de 15 exercícios sobre porcentagem e descontos' as descricao, '2026-03-01' as data_criacao, '2026-03-10' as data_vencimento, 'concluida' as status UNION ALL
    SELECT 'Colégio Horizonte', 'Matemática Financeira Básica', 'Simulação de Juros', 'Calcular o valor final de um empréstimo em 12 meses', '2026-03-15', '2026-03-25', 'pendente' UNION ALL
    SELECT 'Colégio Horizonte', 'Educação Financeira para Adolescentes', 'Diário de Gastos', 'Registrar todos os gastos pessoais por 7 dias', '2026-04-01', '2026-04-08', 'pendente' UNION ALL
    SELECT 'Escola Futuro Brilhante', 'Investimentos para Iniciantes', 'Análise de Fundo de Investimento', 'Escolher um fundo e explicar rentabilidade e riscos', '2026-03-20', '2026-04-05', 'em_andamento' UNION ALL
    SELECT 'Instituto Educar+', 'Consumo Consciente', 'Lista de Desejos vs Necessidades', 'Separar 20 itens do supermercado', '2026-03-10', '2026-03-17', 'concluida' UNION ALL
    SELECT 'Colégio Horizonte', 'Economia do Super-Herói', 'Missão Noturna de Orçamento', 'Calcular custos de uma missão de 48h', '2026-03-05', '2026-03-15', 'concluida' UNION ALL
    SELECT 'Academia Super Mente', 'Investimentos Stark Industries', 'Carteira Stark v1', 'Montar carteira com 5 ativos diferentes', '2026-03-18', '2026-04-01', 'em_andamento' UNION ALL
    SELECT 'Colégio Liga da Justiça', 'Poupança do Homem-Aranha', 'Diário do Homem-Aranha', 'Registrar gastos diários por 10 dias', '2026-04-02', '2026-04-12', 'pendente' UNION ALL
    SELECT 'Instituto Vingadores Educacional', 'Empreendedorismo Batcave', 'Plano Batcave 2026', 'Criar plano de negócios completo', '2026-03-25', '2026-04-20', 'em_andamento' UNION ALL
    SELECT 'Escola Futuro Brilhante', 'Finanças da Liga da Justiça', 'Rateio da Liga', 'Dividir custos de base entre 7 heróis', '2026-04-05', '2026-04-15', 'pendente' UNION ALL
    SELECT 'Escola Mutante Xavier', 'Finanças Mutantes', 'Orçamento da Mansão X', 'Planejar custos de uma equipe de 10 mutantes', '2026-03-28', '2026-04-10', 'em_andamento' UNION ALL
    SELECT 'Colégio Asgardiano', 'Economia de Asgard', 'Tesouro de Odin', 'Calcular juros sobre o ouro do reino', '2026-04-01', '2026-04-12', 'pendente' UNION ALL
    SELECT 'Instituto Wakanda Tech', 'Tecnologia e Investimentos Wakanda', 'Fundo Vibranium', 'Simular investimento em tecnologia avançada', '2026-04-08', '2026-04-22', 'pendente'
) v
JOIN escolas e ON e.nome = v.escola
JOIN cursos c ON c.nome = v.curso;

-- ============================================================
-- 13. PROGRESSO DOS ALUNOS
-- ============================================================
INSERT IGNORE INTO progresso_aluno (id_aluno, pontos_totais, saldo_moedas, nivel_atual, xp_atual, xp_proximo_nivel, percentual_conclusao, sequencia_dias)
SELECT u.id_usuario, v.pontos, v.saldo, v.nivel, v.xp, v.xp_prox, v.perc, v.seq
FROM (
    SELECT 'joao.santos@aluno.com' as email, 450 as pontos, 85.50 as saldo, 3 as nivel, 70 as xp, 150 as xp_prox, 45.00 as perc, 5 as seq UNION ALL
    SELECT 'maria.lima@aluno.com', 620, 120.00, 4, 30, 200, 62.00, 12 UNION ALL
    SELECT 'pedro.souza@aluno.com', 180, 25.00, 2, 40, 100, 18.00, 2 UNION ALL
    SELECT 'beatriz.ferreira@aluno.com', 780, 210.75, 5, 90, 250, 78.00, 8 UNION ALL
    SELECT 'gabriel.rocha@aluno.com', 95, 10.00, 1, 95, 100, 9.50, 1 UNION ALL
    SELECT 'larissa.mendes@aluno.com', 340, 55.00, 3, 20, 150, 34.00, 4 UNION ALL
    SELECT 'thiago.barbosa@aluno.com', 510, 98.25, 3, 110, 150, 51.00, 7 UNION ALL
    SELECT 'camila.ribeiro@aluno.com', 50, 5.00, 1, 50, 100, 5.00, 0 UNION ALL
    SELECT 'peter.parker@aluno.com', 890, 245.00, 6, 40, 300, 89.00, 15 UNION ALL
    SELECT 'miles.morales@aluno.com', 720, 180.50, 5, 120, 250, 72.00, 9 UNION ALL
    SELECT 'gwen.stacy@aluno.com', 650, 155.00, 4, 80, 200, 65.00, 11 UNION ALL
    SELECT 'barry.allen@aluno.com', 980, 310.75, 7, 20, 350, 98.00, 21 UNION ALL
    SELECT 'wally.west@aluno.com', 540, 95.00, 3, 90, 150, 54.00, 6 UNION ALL
    SELECT 'iris.west@aluno.com', 410, 70.25, 3, 50, 150, 41.00, 4 UNION ALL
    SELECT 'steve.rogers@aluno.com', 1120, 420.00, 8, 80, 400, 100.00, 30 UNION ALL
    SELECT 'bucky.barnes@aluno.com', 680, 165.00, 4, 110, 200, 68.00, 8 UNION ALL
    SELECT 'sam.wilson@aluno.com', 750, 190.50, 5, 60, 250, 75.00, 12 UNION ALL
    SELECT 'kara.danvers@aluno.com', 820, 210.00, 5, 140, 250, 82.00, 14 UNION ALL
    SELECT 'kate.kane@aluno.com', 390, 65.00, 2, 70, 100, 39.00, 3 UNION ALL
    SELECT 'dick.grayson@aluno.com', 480, 88.00, 3, 30, 150, 48.00, 5 UNION ALL
    SELECT 'wanda.maximoff@aluno.com', 910, 275.50, 6, 100, 300, 91.00, 18 UNION ALL
    SELECT 'pietro.maximoff@aluno.com', 560, 120.00, 4, 20, 200, 56.00, 7 UNION ALL
    SELECT 'vision@aluno.com', 870, 240.00, 6, 50, 300, 87.00, 16 UNION ALL
    SELECT 'hal.jordan@aluno.com', 320, 45.00, 2, 80, 100, 32.00, 2 UNION ALL
    SELECT 'john.stewart@aluno.com', 290, 38.50, 2, 40, 100, 29.00, 1 UNION ALL
    SELECT 'arthur.curry@aluno.com', 610, 140.00, 4, 90, 200, 61.00, 10 UNION ALL
    SELECT 'mera@aluno.com', 450, 85.00, 3, 60, 150, 45.00, 5 UNION ALL
    SELECT 'jean.grey@aluno.com', 940, 260.00, 6, 70, 300, 94.00, 17 UNION ALL
    SELECT 'scott.summers@aluno.com', 710, 175.00, 5, 50, 250, 71.00, 9 UNION ALL
    SELECT 'ororo.munroe@aluno.com', 830, 220.00, 5, 130, 250, 83.00, 13 UNION ALL
    SELECT 'logan.howlett@aluno.com', 580, 130.00, 4, 40, 200, 58.00, 6 UNION ALL
    SELECT 'loki.laufeyson@aluno.com', 670, 160.00, 4, 90, 200, 67.00, 8 UNION ALL
    SELECT 'sif@aluno.com', 760, 195.00, 5, 70, 250, 76.00, 11 UNION ALL
    SELECT 'tchalla@aluno.com', 1050, 380.00, 7, 50, 350, 100.00, 25 UNION ALL
    SELECT 'nakia@aluno.com', 800, 205.00, 5, 110, 250, 80.00, 14 UNION ALL
    SELECT 'harley.quinn@aluno.com', 420, 75.00, 3, 60, 150, 42.00, 3 UNION ALL
    SELECT 'jason.todd@aluno.com', 390, 68.00, 2, 80, 100, 39.00, 2 UNION ALL
    SELECT 'tim.drake@aluno.com', 690, 170.00, 4, 100, 200, 69.00, 10 UNION ALL
    SELECT 'bart.allen@aluno.com', 510, 95.00, 3, 50, 150, 51.00, 5
) v
JOIN usuarios u ON u.email = v.email;

-- ============================================================
-- 14. RECOMPENSAS
-- ============================================================
INSERT IGNORE INTO recompensas (nome, descricao, tipo, valor_bonus, criterio, ativo) VALUES
('Primeiro Login', 'Bem-vindo à plataforma!', 'conquista', 10.00, 'Fazer o primeiro acesso', 1),
('Sequência de 7 dias', 'Estudou 7 dias seguidos', 'streak', 25.00, 'Sequência de 7 dias de atividade', 1),
('Mestre da Matemática', 'Acertou 10 exercícios de matemática financeira', 'habilidade', 50.00, '10 acertos consecutivos em matemática', 1),
('Orçamento Perfeito', 'Completou a atividade de orçamento com nota máxima', 'atividade', 30.00, 'Nota 10 na atividade de orçamento', 1),
('Investidor Iniciante', 'Simulou a primeira carteira de investimentos', 'conquista', 40.00, 'Criar e salvar uma carteira simulada', 1),
('Top 3 da Turma', 'Ficou entre os 3 melhores da turma no mês', 'ranking', 100.00, 'Top 3 no ranking mensal da turma', 1),
('Primeiro Salto', 'Completou a primeira missão financeira', 'conquista', 15.00, 'Finalizar a primeira tarefa', 1),
('Sequência de 14 dias', 'Estudou 14 dias seguidos', 'streak', 50.00, 'Sequência de 14 dias', 1),
('Mestre dos Juros', 'Dominou juros compostos', 'habilidade', 75.00, 'Nota máxima em juros compostos', 1),
('Líder da Turma', 'Foi o aluno com mais pontos no mês', 'ranking', 150.00, '1º lugar no ranking mensal', 1),
('Investidor Lendário', 'Criou 3 carteiras simuladas diferentes', 'conquista', 60.00, '3 carteiras salvas', 1),
('Herói da Economia', 'Ajudou 5 colegas com dúvidas', 'social', 40.00, 'Ajudar 5 colegas', 1),
('Bat-Sinal de Economia', 'Completou todas as tarefas do mês', 'atividade', 100.00, '100% de tarefas concluídas no mês', 1),
('Mutante Financeiro', 'Dominou gestão de recursos em equipe', 'habilidade', 55.00, 'Nota máxima em Finanças Mutantes', 1),
('Guerreiro de Asgard', 'Completou o quiz de economia asgardiana', 'conquista', 45.00, 'Finalizar Quiz Ouro de Asgard', 1),
('Rei de Wakanda', 'Projeto Vibranium com nota máxima', 'ranking', 120.00, 'Nota 10 no Projeto Vibranium', 1);

-- ============================================================
-- 15. RECOMPENSAS DOS ALUNOS
-- ============================================================
INSERT IGNORE INTO recompensas_aluno (id_aluno, id_recompensa, visto)
SELECT u.id_usuario, r.id_recompensa, v.visto
FROM (
    SELECT 'peter.parker@aluno.com' as aluno, 'Primeiro Login' as recompensa, 1 as visto UNION ALL
    SELECT 'peter.parker@aluno.com', 'Sequência de 7 dias', 1 UNION ALL
    SELECT 'peter.parker@aluno.com', 'Bat-Sinal de Economia', 0 UNION ALL
    SELECT 'miles.morales@aluno.com', 'Primeiro Login', 1 UNION ALL
    SELECT 'miles.morales@aluno.com', 'Mestre da Matemática', 1 UNION ALL
    SELECT 'barry.allen@aluno.com', 'Primeiro Login', 1 UNION ALL
    SELECT 'barry.allen@aluno.com', 'Sequência de 7 dias', 1 UNION ALL
    SELECT 'barry.allen@aluno.com', 'Líder da Turma', 0 UNION ALL
    SELECT 'barry.allen@aluno.com', 'Bat-Sinal de Economia', 1 UNION ALL
    SELECT 'steve.rogers@aluno.com', 'Primeiro Login', 1 UNION ALL
    SELECT 'steve.rogers@aluno.com', 'Sequência de 7 dias', 1 UNION ALL
    SELECT 'steve.rogers@aluno.com', 'Líder da Turma', 1 UNION ALL
    SELECT 'steve.rogers@aluno.com', 'Herói da Economia', 0 UNION ALL
    SELECT 'kara.danvers@aluno.com', 'Primeiro Login', 1 UNION ALL
    SELECT 'kara.danvers@aluno.com', 'Investidor Iniciante', 1 UNION ALL
    SELECT 'wanda.maximoff@aluno.com', 'Primeiro Login', 1 UNION ALL
    SELECT 'wanda.maximoff@aluno.com', 'Sequência de 7 dias', 1 UNION ALL
    SELECT 'wanda.maximoff@aluno.com', 'Mestre dos Juros', 0 UNION ALL
    SELECT 'vision@aluno.com', 'Primeiro Login', 1 UNION ALL
    SELECT 'vision@aluno.com', 'Bat-Sinal de Economia', 1 UNION ALL
    SELECT 'joao.santos@aluno.com', 'Primeiro Login', 1 UNION ALL
    SELECT 'joao.santos@aluno.com', 'Sequência de 7 dias', 1 UNION ALL
    SELECT 'maria.lima@aluno.com', 'Primeiro Login', 1 UNION ALL
    SELECT 'maria.lima@aluno.com', 'Sequência de 7 dias', 1 UNION ALL
    SELECT 'maria.lima@aluno.com', 'Mestre da Matemática', 0 UNION ALL
    SELECT 'maria.lima@aluno.com', 'Orçamento Perfeito', 1 UNION ALL
    SELECT 'beatriz.ferreira@aluno.com', 'Primeiro Login', 1 UNION ALL
    SELECT 'beatriz.ferreira@aluno.com', 'Investidor Iniciante', 1 UNION ALL
    SELECT 'beatriz.ferreira@aluno.com', 'Top 3 da Turma', 0 UNION ALL
    SELECT 'larissa.mendes@aluno.com', 'Primeiro Login', 1 UNION ALL
    SELECT 'thiago.barbosa@aluno.com', 'Primeiro Login', 1 UNION ALL
    SELECT 'thiago.barbosa@aluno.com', 'Sequência de 7 dias', 0 UNION ALL
    SELECT 'jean.grey@aluno.com', 'Primeiro Login', 1 UNION ALL
    SELECT 'jean.grey@aluno.com', 'Mutante Financeiro', 1 UNION ALL
    SELECT 'scott.summers@aluno.com', 'Primeiro Login', 1 UNION ALL
    SELECT 'ororo.munroe@aluno.com', 'Primeiro Login', 1 UNION ALL
    SELECT 'ororo.munroe@aluno.com', 'Sequência de 14 dias', 0 UNION ALL
    SELECT 'tchalla@aluno.com', 'Primeiro Login', 1 UNION ALL
    SELECT 'tchalla@aluno.com', 'Rei de Wakanda', 1 UNION ALL
    SELECT 'tchalla@aluno.com', 'Líder da Turma', 1 UNION ALL
    SELECT 'nakia@aluno.com', 'Primeiro Login', 1 UNION ALL
    SELECT 'loki.laufeyson@aluno.com', 'Primeiro Login', 1 UNION ALL
    SELECT 'loki.laufeyson@aluno.com', 'Guerreiro de Asgard', 0 UNION ALL
    SELECT 'sif@aluno.com', 'Primeiro Login', 1 UNION ALL
    SELECT 'sif@aluno.com', 'Guerreiro de Asgard', 1 UNION ALL
    SELECT 'tim.drake@aluno.com', 'Primeiro Login', 1 UNION ALL
    SELECT 'tim.drake@aluno.com', 'Mestre dos Juros', 1
) v
JOIN usuarios u ON u.email = v.aluno
JOIN recompensas r ON r.nome = v.recompensa;

-- ============================================================
-- 16. LOGS DE ATIVIDADE
-- ============================================================
INSERT INTO logs_atividade (id_usuario, acao, tabela_afetada, id_registro, dados_novos, ip_origem, user_agent)
SELECT u.id_usuario, v.acao, v.tabela, NULL, v.dados, v.ip, v.ua
FROM (
    SELECT 'peter.parker@aluno.com' as email, 'login' as acao, 'usuarios' as tabela, '{"status": "sucesso"}' as dados, '192.168.1.50' as ip, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' as ua UNION ALL
    SELECT 'barry.allen@aluno.com', 'login', 'usuarios', '{"status": "sucesso"}', '192.168.1.51', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)' UNION ALL
    SELECT 'steve.rogers@aluno.com', 'criar_carteira', 'progresso_aluno', '{"acao": "nova_carteira_simulada"}', '10.0.0.20', 'Mozilla/5.0 (Macintosh; Intel Mac OS X)' UNION ALL
    SELECT 'tony.stark@supermente.edu.br', 'criar_avaliacao', 'avaliacoes', '{"titulo": "Projeto Stark - Carteira"}', '10.0.0.15', 'Mozilla/5.0 (Windows NT 10.0)' UNION ALL
    SELECT 'wanda.maximoff@aluno.com', 'resgatar_recompensa', 'recompensas_aluno', '{"id_recompensa": 3}', '203.0.113.80', 'Mozilla/5.0 (Android 15)' UNION ALL
    SELECT 'kara.danvers@aluno.com', 'responder_tarefa', 'tarefas', '{"status": "concluida"}', '192.168.1.60', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' UNION ALL
    SELECT 'bruce.wayne@ligajustica.edu.br', 'atualizar_turma', 'turmas', '{"status": "ativa"}', '10.0.0.25', 'Mozilla/5.0 (Macintosh; Intel Mac OS X)' UNION ALL
    SELECT 'joao.santos@aluno.com', 'login', 'usuarios', '{"status": "sucesso"}', '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' UNION ALL
    SELECT 'maria.lima@aluno.com', 'login', 'usuarios', '{"status": "sucesso"}', '192.168.1.15', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)' UNION ALL
    SELECT 'mariana.costa@horizonte.edu.br', 'criar_avaliacao', 'avaliacoes', '{"titulo": "Prova 1 - Juros Simples"}', '10.0.0.5', 'Mozilla/5.0 (Windows NT 10.0)' UNION ALL
    SELECT 'jean.grey@aluno.com', 'login', 'usuarios', '{"status": "sucesso"}', '192.168.1.70', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' UNION ALL
    SELECT 'tchalla@aluno.com', 'criar_carteira', 'progresso_aluno', '{"acao": "fundo_vibranium"}', '10.0.0.30', 'Mozilla/5.0 (Macintosh; Intel Mac OS X)' UNION ALL
    SELECT 'charles.xavier@xavier.edu.br', 'criar_avaliacao', 'avaliacoes', '{"titulo": "Prova Mutante - Orçamento"}', '10.0.0.40', 'Mozilla/5.0 (Windows NT 10.0)' UNION ALL
    SELECT 'shuri@wakandatech.edu.br', 'atualizar_config', 'configuracoes_escola', '{"saldo_inicial_aluno": 150.00}', '10.0.0.50', 'Mozilla/5.0 (Macintosh; Intel Mac OS X)' UNION ALL
    SELECT 'tim.drake@aluno.com', 'responder_tarefa', 'tarefas', '{"status": "concluida"}', '192.168.1.80', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
) v
JOIN usuarios u ON u.email = v.email;

-- Fim
SELECT 'Seed completo executado com sucesso! Todos os usuários têm senha 1234.' AS status;