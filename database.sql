CREATE DATABASE IF NOT EXISTS monetto;
USE monetto;

-- ============================================================
-- ESCOLAS
-- ============================================================
CREATE TABLE IF NOT EXISTS escolas (
    id_escola INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cnpj VARCHAR(18) UNIQUE,
    telefone VARCHAR(20),
    email VARCHAR(100),
    endereco TEXT,
    cidade VARCHAR(100),
    estado VARCHAR(50),
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- PERFIS
-- ============================================================
CREATE TABLE IF NOT EXISTS perfis (
    id_perfil INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE,
    descricao TEXT,
    permissoes JSON,
    ativo BOOLEAN DEFAULT 1,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



INSERT IGNORE INTO perfis (nome, descricao, permissoes, ativo) VALUES
    ('admin', 'Administrador do sistema', '{"gerenciar_usuarios": true, "gerenciar_escolas": true, "gerenciar_cursos": true, "gerenciar_turmas": true}', 1),
    ('aluno', 'Usuário estudante', '{"acessar_cursos": true, "visualizar_turmas": true}', 1),
    ('professor', 'Perfil de professor', '{"acessar_cursos": true, "gerenciar_turmas": true}', 1);

-- ============================================================
-- NIVEIS EDUCACIONAIS
-- ============================================================
CREATE TABLE IF NOT EXISTS niveis_educacionais (
    id_nivel INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    faixa_etaria VARCHAR(30),
    ordem_nivel INT NOT NULL,
    ativo BOOLEAN DEFAULT 1
);

-- ============================================================
-- CURSOS
-- ============================================================
CREATE TABLE IF NOT EXISTS cursos (
    id_curso INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    carga_horaria INT NOT NULL,
    nivel VARCHAR(50),
    faixa_etaria VARCHAR(50),
    preco DECIMAL(10,2) NOT NULL
);

-- ============================================================
-- USUARIOS
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    id_perfil INT NOT NULL,
    id_escola INT,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    data_nascimento DATE,
    telefone VARCHAR(20),
    foto_url VARCHAR(255),
    ativo BOOLEAN DEFAULT 1,
    ultimo_acesso TIMESTAMP NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_perfil) REFERENCES perfis(id_perfil),
    FOREIGN KEY (id_escola) REFERENCES escolas(id_escola)
);

-- ============================================================
-- TURMAS
-- ============================================================
CREATE TABLE IF NOT EXISTS turmas (
    id_turma INT AUTO_INCREMENT PRIMARY KEY,
    id_escola INT NOT NULL,
    id_professor INT NOT NULL,
    id_nivel INT NOT NULL,
    nome_turma VARCHAR(100) NOT NULL,
    ano_letivo INT NOT NULL,
    data_inicio DATE,
    data_fim DATE,
    status VARCHAR(30) DEFAULT 'ativa',

    FOREIGN KEY (id_escola) REFERENCES escolas(id_escola),
    FOREIGN KEY (id_professor) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_nivel) REFERENCES niveis_educacionais(id_nivel)
);

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS id_turma INT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS responsavel VARCHAR(150);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefone_responsavel VARCHAR(20);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email_responsavel VARCHAR(100);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS serie VARCHAR(30);
-- NOTE: use the existing `ultimo_acesso` column for "last seen" logic (there is no
-- separate data_ultimo_login column — some queries used to reference one that never existed).

-- Only add the FK if it doesn't already exist (MySQL has no ADD FOREIGN KEY IF NOT EXISTS)
SET @fk_exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'usuarios'
    AND CONSTRAINT_NAME = 'fk_usuarios_turma'
);
SET @sql := IF(@fk_exists = 0,
  'ALTER TABLE usuarios ADD CONSTRAINT fk_usuarios_turma FOREIGN KEY (id_turma) REFERENCES turmas(id_turma)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================
-- CONFIGURAÇÕES ESCOLA
-- ============================================================
CREATE TABLE IF NOT EXISTS configuracoes_escola (
    id_config INT AUTO_INCREMENT PRIMARY KEY,
    id_escola INT NOT NULL UNIQUE,
    nome_moeda VARCHAR(50) DEFAULT 'Monetto',
    simbolo_moeda VARCHAR(10) DEFAULT 'M$',
    saldo_inicial_aluno DECIMAL(10,2) DEFAULT 0.00,
    max_parcelas INT DEFAULT 3,
    taxa_juros_padrao DECIMAL(5,2) DEFAULT 2.00,
    gamificacao_ativa BOOLEAN DEFAULT 1,
    investimentos_ativo BOOLEAN DEFAULT 1,
    notificacoes_ativa BOOLEAN DEFAULT 1,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_escola) REFERENCES escolas(id_escola)
);

-- ============================================================
-- RESPONSÁVEIS
-- ============================================================
CREATE TABLE IF NOT EXISTS dados_responsavel (
    id_responsavel INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    nome VARCHAR(150) NOT NULL,
    parentesco VARCHAR(50),
    cpf VARCHAR(14) UNIQUE,
    telefone VARCHAR(20),
    email VARCHAR(100),
    autoriza_uso BOOLEAN DEFAULT 0,
    data_autorizacao TIMESTAMP NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

-- ============================================================
-- AVALIAÇÕES
-- ============================================================
CREATE TABLE IF NOT EXISTS avaliacoes (
    id_avaliacao INT AUTO_INCREMENT PRIMARY KEY,
    id_turma INT NOT NULL,
    id_curso INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT,
    data_avaliacao DATE,
    nota_maxima DECIMAL(5,2) DEFAULT 10.00,
    nota_minima DECIMAL(5,2) DEFAULT 6.00,

    FOREIGN KEY (id_turma) REFERENCES turmas(id_turma),
    FOREIGN KEY (id_curso) REFERENCES cursos(id_curso)
);

-- ============================================================
-- NOTAS
-- ============================================================
CREATE TABLE IF NOT EXISTS notas (
    id_nota INT AUTO_INCREMENT PRIMARY KEY,
    id_avaliacao INT NOT NULL,
    id_aluno INT NOT NULL,
    nota DECIMAL(5,2),
    observacao TEXT,

    UNIQUE(id_avaliacao,id_aluno),

    FOREIGN KEY (id_avaliacao) REFERENCES avaliacoes(id_avaliacao),
    FOREIGN KEY (id_aluno) REFERENCES usuarios(id_usuario)
);

-- ============================================================
-- PAGAMENTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS pagamentos (
    id_pagamento INT AUTO_INCREMENT PRIMARY KEY,
    id_escola INT NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    data_pagamento DATE,
    forma_pagamento VARCHAR(50),
    status VARCHAR(30) DEFAULT 'pendente',
    referencia_mes VARCHAR(20),

    FOREIGN KEY (id_escola) REFERENCES escolas(id_escola)
);

-- ============================================================
-- TAREFAS
-- ============================================================
CREATE TABLE IF NOT EXISTS tarefas (
    id_tarefa INT AUTO_INCREMENT PRIMARY KEY,
    id_escola INT NOT NULL,
    id_curso INT NOT NULL,
    titulo VARCHAR(100),
    descricao VARCHAR(300),
    data_criacao DATE,
    data_vencimento DATE,
    status VARCHAR(30) DEFAULT 'pendente',

    FOREIGN KEY (id_escola) REFERENCES escolas(id_escola),
    FOREIGN KEY (id_curso) REFERENCES cursos(id_curso)
);

-- ============================================================
-- PROGRESSO ALUNO
-- ============================================================
CREATE TABLE IF NOT EXISTS progresso_aluno (
    id_progresso INT AUTO_INCREMENT PRIMARY KEY,
    id_aluno INT NOT NULL UNIQUE,
    pontos_totais INT DEFAULT 0,
    saldo_moedas DECIMAL(10,2) DEFAULT 0.00,
    nivel_atual INT DEFAULT 1,
    xp_atual INT DEFAULT 0,
    xp_proximo_nivel INT DEFAULT 100,
    percentual_conclusao DECIMAL(5,2) DEFAULT 0.00,
    sequencia_dias INT DEFAULT 0,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_aluno) REFERENCES usuarios(id_usuario)
);

-- ============================================================
-- RECOMPENSAS
-- ============================================================
CREATE TABLE IF NOT EXISTS recompensas (
    id_recompensa INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    icone_url VARCHAR(255),
    tipo VARCHAR(50),
    valor_bonus DECIMAL(10,2) DEFAULT 0.00,
    criterio TEXT,
    ativo BOOLEAN DEFAULT 1,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- RECOMPENSAS ALUNO
-- ============================================================
CREATE TABLE IF NOT EXISTS recompensas_aluno (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_aluno INT NOT NULL,
    id_recompensa INT NOT NULL,
    conquistado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    visto BOOLEAN DEFAULT 0,

    UNIQUE(id_aluno,id_recompensa),

    FOREIGN KEY (id_aluno) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_recompensa) REFERENCES recompensas(id_recompensa)
);

-- ============================================================
-- LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS logs_atividade (
    id_log INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    acao VARCHAR(100) NOT NULL,
    tabela_afetada VARCHAR(60),
    id_registro INT,
    dados_anteriores JSON,
    dados_novos JSON,
    ip_origem VARCHAR(45),
    user_agent VARCHAR(255),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

-- Insert basic profiles if they don't exist
INSERT IGNORE INTO perfis (nome, descricao) VALUES 
('aluno', 'Aluno da plataforma'),
('professor', 'Professor'),
('escola', 'Administrador da Escola'),
('admin', 'Administrador Geral');

CREATE TABLE IF NOT EXISTS tarefas (
    id_tarefa INT AUTO_INCREMENT PRIMARY KEY,
    id_escola INT NOT NULL,
    id_curso INT NOT NULL,
    titulo VARCHAR(100),
    descricao VARCHAR(300),
    data_criacao DATE,
    data_vencimento DATE,
    status VARCHAR(30) DEFAULT 'pendente',
    FOREIGN KEY (id_escola) REFERENCES escolas(id_escola),
    FOREIGN KEY (id_curso) REFERENCES cursos(id_curso)
);

-- Optional: also create progresso_aluno if it is missing
CREATE TABLE IF NOT EXISTS progresso_aluno (
    id_progresso INT AUTO_INCREMENT PRIMARY KEY,
    id_aluno INT NOT NULL UNIQUE,
    pontos_totais INT DEFAULT 0,
    saldo_moedas DECIMAL(10,2) DEFAULT 0.00,
    nivel_atual INT DEFAULT 1,
    xp_atual INT DEFAULT 0,
    xp_proximo_nivel INT DEFAULT 100,
    percentual_conclusao DECIMAL(5,2) DEFAULT 0.00,
    sequencia_dias INT DEFAULT 0,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_aluno) REFERENCES usuarios(id_usuario)
);