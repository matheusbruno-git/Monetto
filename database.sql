CREATE DATABASE monetto;
USE monetto;

-- ============================================================
-- PERFIS
-- Define os tipos de acesso no sistema
-- ============================================================
CREATE TABLE perfis (
    id_perfil   SERIAL PRIMARY KEY,
    nome        VARCHAR(50)  NOT NULL UNIQUE, -- 'aluno', 'professor', 'escola', 'admin'
    descricao   TEXT,
    permissoes  JSON,                          -- JSON com flags de permissão por módulo
    ativo       BOOLEAN      DEFAULT TRUE,
    criado_em   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- USUÁRIOS
-- Todos os usuários do sistema (alunos, professores, admins)
-- ============================================================
CREATE TABLE usuarios (
    id_usuario          SERIAL PRIMARY KEY,
    id_perfil           INT          NOT NULL,
    id_escola           INT,
    id_turma             INT,
    nome                VARCHAR(150) NOT NULL,
    email               VARCHAR(100) NOT NULL UNIQUE,
    senha_hash          VARCHAR(255) NOT NULL,
    cpf                 VARCHAR(14)  UNIQUE,
    data_nascimento     DATE,
    telefone            VARCHAR(20),
    foto_url            VARCHAR(255),
    ativo               BOOLEAN      DEFAULT TRUE,
    ultimo_acesso       TIMESTAMP,
    criado_em           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_perfil)  REFERENCES perfis(id_perfil),
    FOREIGN KEY (id_escola)  REFERENCES escolas(id_escola),
    FOREIGN KEY (id_turma)   REFERENCES turmas(id_turma)
);

-- ============================================================
-- ESCOLAS
-- Instituições de ensino clientes do Monetto
-- ============================================================
CREATE TABLE escolas (
    id_escola       SERIAL PRIMARY KEY,
    nome            VARCHAR(150) NOT NULL,
    cnpj            VARCHAR(18)  UNIQUE,
    telefone        VARCHAR(20),
    email           VARCHAR(100),
    endereco        TEXT,
    cidade          VARCHAR(100),
    estado          VARCHAR(50),
    data_cadastro   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- CONFIGURACOES_ESCOLA
-- Personalização por escola: nome da moeda, funcionalidades, limites
-- ============================================================
CREATE TABLE configuracoes_escola (
    id_config           SERIAL PRIMARY KEY,
    id_escola           INT          NOT NULL UNIQUE,
    nome_moeda          VARCHAR(50)  DEFAULT 'Monetto',  -- ex: "Moeda da Escola X"
    simbolo_moeda       VARCHAR(10)  DEFAULT 'M$',
    saldo_inicial_aluno NUMERIC(10,2) DEFAULT 0.00,      -- saldo virtual ao entrar
    max_parcelas        INT          DEFAULT 3,
    taxa_juros_padrao   NUMERIC(5,2) DEFAULT 2.00,       -- % ao período
    gamificacao_ativa   BOOLEAN      DEFAULT TRUE,
    investimentos_ativo BOOLEAN      DEFAULT TRUE,
    notificacoes_ativa  BOOLEAN      DEFAULT TRUE,
    atualizado_em       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_escola) REFERENCES escolas(id_escola)
);

-- ============================================================
-- DADOS_RESPONSAVEL
-- Informações do responsável legal (obrigatório para menores)
-- ============================================================
CREATE TABLE dados_responsavel (
    id_responsavel      SERIAL PRIMARY KEY,
    id_usuario          INT          NOT NULL,            -- aluno vinculado
    nome                VARCHAR(150) NOT NULL,
    parentesco          VARCHAR(50),                      -- mãe, pai, avó, tutor...
    cpf                 VARCHAR(14)  UNIQUE,
    telefone            VARCHAR(20),
    email               VARCHAR(100),
    autoriza_uso        BOOLEAN      DEFAULT FALSE,       -- LGPD: consentimento explícito
    data_autorizacao    TIMESTAMP,
    criado_em           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

-- ============================================================
-- NIVEIS_EDUCACIONAIS
-- Graus de ensino para categorizar turmas e conteúdos
-- ============================================================
CREATE TABLE niveis_educacionais (
    id_nivel        SERIAL PRIMARY KEY,
    nome            VARCHAR(100) NOT NULL UNIQUE, -- 'Fundamental I', 'Fundamental II', 'Médio', 'Técnico'
    descricao       TEXT,
    faixa_etaria    VARCHAR(30),                  -- ex: '6-10 anos'
    ordem           INT          NOT NULL,        -- para ordenação na UI
    ativo           BOOLEAN      DEFAULT TRUE
);

-- ============================================================
-- CURSOS
-- Cursos/disciplinas financeiras oferecidos
-- ============================================================
CREATE TABLE cursos (
    id_curso        SERIAL PRIMARY KEY,
    nome            VARCHAR(150) NOT NULL,
    descricao       TEXT,
    carga_horaria   INT          NOT NULL,
    nivel           VARCHAR(50),                  -- básico, intermediário, avançado
    faixa_etaria    VARCHAR(50),
    preco           NUMERIC(10,2) NOT NULL
);

-- ============================================================
-- TURMAS
-- Grupos de alunos por escola, professor e nível
-- ============================================================
CREATE TABLE turmas (
    id_turma        SERIAL PRIMARY KEY,
    id_escola       INT          NOT NULL,
    id_professor    INT          NOT NULL,
    id_nivel        INT          NOT NULL,
    nome_turma      VARCHAR(100) NOT NULL,
    ano_letivo      INT          NOT NULL,
    data_inicio     DATE,
    data_fim        DATE,
    horario         VARCHAR(50),
    status          VARCHAR(30)  DEFAULT 'ativa',
    FOREIGN KEY (id_escola)     REFERENCES escolas(id_escola),
    FOREIGN KEY (id_professor)  REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_nivel)      REFERENCES niveis_educacionais(id_nivel)
);

-- ============================================================
-- AVALIACOES
-- Avaliações/provas vinculadas a uma turma
-- ============================================================
CREATE TABLE avaliacoes (
    id_avaliacao    SERIAL PRIMARY KEY,
    id_turma        INT          NOT NULL,
    id_curso         INT          NOT NULL,
    titulo          VARCHAR(150) NOT NULL,
    descricao       TEXT,
    data_avaliacao  DATE,
    nota_maxima     NUMERIC(5,2) DEFAULT 10.00,
    nota_minima     NUMERIC(5,2) DEFAULT 6.00,
    FOREIGN KEY (id_turma) REFERENCES turmas(id_turma),
    FOREIGN KEY (id_curso) REFERENCES cursos(id_curso)
);

-- ============================================================
-- NOTAS
-- Nota de cada aluno em cada avaliação
-- ============================================================
CREATE TABLE notas (
    id_nota         SERIAL PRIMARY KEY,
    id_avaliacao    INT          NOT NULL,
    id_aluno    INT          NOT NULL,
    nota            NUMERIC(5,2),
    observacao      TEXT,
    UNIQUE (id_avaliacao, id_aluno),
    FOREIGN KEY (id_avaliacao)  REFERENCES avaliacoes(id_avaliacao),
    FOREIGN KEY (id_aluno)  REFERENCES usuarios(id_usuario)
);

-- ============================================================
-- PAGAMENTOS
-- Pagamentos das mensalidades das matrículas
-- ============================================================
CREATE TABLE pagamentos (
    id_pagamento    SERIAL PRIMARY KEY,
    id_escola       INT          NOT NULL,
    valor           NUMERIC(10,2) NOT NULL,
    data_pagamento  DATE,
    forma_pagamento VARCHAR(50),
    status          VARCHAR(30)  DEFAULT 'pendente',       -- pendente, pago, vencido
    referencia_mes  VARCHAR(20),
    FOREIGN KEY (id_escola) REFERENCES escolas(id_escola)
);

-- ============================================================
-- TAREFAS
-- Tarefas feitas pelos professores para os alunos, com prazos e status e cursos vinculados
-- ============================================================
CREATE TABLE tarefas (
    id_tarefa       SERIAL PRIMARY KEY,
    id_escola       INT          NOT NULL,
    id_curso        INT          NOT NULL,
    titulo          VARCHAR(100),
    descricao       VARCHAR(300),
    data_criacao    DATE,
    data_vencimento DATE,
    status          VARCHAR(30)  DEFAULT 'pendente',
    FOREIGN KEY (id_escola) REFERENCES escolas(id_escola),
    FOREIGN KEY (id_curso)  REFERENCES cursos(id_curso)
);


-- ============================================================
-- PROGRESSO_ALUNO
-- Pontos, moedas virtuais, nível e avanço de cada aluno
-- ============================================================
CREATE TABLE progresso_aluno (
    id_progresso        SERIAL PRIMARY KEY,
    id_aluno            INT          NOT NULL UNIQUE,      -- 1 registro por aluno
    pontos_totais       INT          DEFAULT 0,
    saldo_moedas        NUMERIC(10,2) DEFAULT 0.00,        -- moeda virtual em conta
    nivel_atual         INT          DEFAULT 1,
    xp_atual            INT          DEFAULT 0,            -- experiência dentro do nível
    xp_proximo_nivel    INT          DEFAULT 100,
    percentual_conclusao NUMERIC(5,2) DEFAULT 0.00,        -- % do curso concluído
    sequencia_dias      INT          DEFAULT 0,            -- streak de dias consecutivos
    atualizado_em       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_aluno) REFERENCES usuarios(id_usuario)
);

-- ============================================================
-- RECOMPENSAS
-- Catálogo de conquistas e badges disponíveis na plataforma
-- ============================================================
CREATE TABLE recompensas (
    id_recompensa   SERIAL PRIMARY KEY,
    nome            VARCHAR(100) NOT NULL,
    descricao       TEXT,
    icone_url       VARCHAR(255),
    tipo            VARCHAR(50),                           -- 'badge', 'título', 'avatar', 'bônus_moedas'
    valor_bonus     NUMERIC(10,2) DEFAULT 0.00,            -- moedas virtuais concedidas ao ganhar
    criterio        TEXT,                                  -- descrição da condição para ganhar
    ativo           BOOLEAN      DEFAULT TRUE,
    criado_em       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- RECOMPENSAS_ALUNO
-- Registro de quais recompensas cada aluno já conquistou
-- ============================================================
CREATE TABLE recompensas_aluno (
    id              SERIAL PRIMARY KEY,
    id_aluno        INT          NOT NULL,
    id_recompensa   INT          NOT NULL,
    conquistado_em  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    visto           BOOLEAN      DEFAULT FALSE,            -- se o aluno já viu a notificação
    UNIQUE (id_aluno, id_recompensa),
    FOREIGN KEY (id_aluno)    REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_recompensa) REFERENCES recompensas(id_recompensa)
);

-- ============================================================
-- 19. LOGS_ATIVIDADE
-- Auditoria de ações relevantes no sistema (segurança + LGPD)
-- ============================================================
CREATE TABLE logs_atividade (
    id_log          SERIAL PRIMARY KEY,
    id_usuario      INT,                                   -- NULL se ação anônima/sistema
    acao            VARCHAR(100) NOT NULL,                 -- ex: 'login', 'transacao_criada', 'nota_editada'
    tabela_afetada  VARCHAR(60),                           -- qual tabela foi tocada
    id_registro     INT,                                   -- PK do registro afetado
    dados_anteriores JSON,                                 -- snapshot antes da mudança
    dados_novos      JSON,                                 -- snapshot após a mudança
    ip_origem       VARCHAR(45),
    user_agent      VARCHAR(255),
    criado_em       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);