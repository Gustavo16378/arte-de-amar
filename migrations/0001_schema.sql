-- Arte de Amar · esquema do banco (Cloudflare D1, SQLite)
--
-- Tudo que a diretoria edita pelo painel mora aqui. O texto institucional
-- (missão, visão, títulos das seções) continua no código: muda raramente e
-- faz parte do design.
--
-- Fotos: cada linha de `midias` é uma foto da ONG. As que já vieram no site
-- apontam para um arquivo em /assets/fotos (`caminho`); as que a diretoria
-- sobe pelo painel guardam a imagem no próprio banco (`dados`), já reduzida
-- no navegador. Assim não depende de nenhum serviço pago de armazenamento.

PRAGMA foreign_keys = ON;

CREATE TABLE midias (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  caminho     TEXT,                        -- arquivo estático, ex.: /assets/fotos/x.jpg
  dados       BLOB,                        -- imagem enviada pelo painel
  tipo        TEXT NOT NULL DEFAULT 'image/jpeg',
  alt         TEXT NOT NULL,
  largura     INTEGER NOT NULL CHECK (largura > 0),
  altura      INTEGER NOT NULL CHECK (altura > 0),
  bytes       INTEGER NOT NULL DEFAULT 0,
  criado_em   TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (caminho IS NOT NULL OR dados IS NOT NULL)
);

CREATE TABLE projetos (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  nome            TEXT NOT NULL,
  objetivo        TEXT NOT NULL,
  objetivo_curto  TEXT NOT NULL,
  publico         TEXT NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('Em andamento', 'Concluído')),
  foto_id         INTEGER NOT NULL REFERENCES midias(id) ON DELETE RESTRICT,
  foto_posicao    TEXT NOT NULL DEFAULT '50% 50%',
  meta_feito      INTEGER CHECK (meta_feito >= 0),
  meta_total      INTEGER CHECK (meta_total > 0),
  meta_unidade    TEXT,
  depoimento      TEXT NOT NULL DEFAULT '',
  autor           TEXT NOT NULL DEFAULT '',
  video_url       TEXT,
  visivel         INTEGER NOT NULL DEFAULT 1 CHECK (visivel IN (0, 1)),
  ordem           INTEGER NOT NULL DEFAULT 0,
  atualizado_em   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE marcos (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  ano             TEXT NOT NULL,
  titulo          TEXT NOT NULL,
  texto           TEXT NOT NULL,
  texto_desktop   TEXT NOT NULL,
  foto_id         INTEGER NOT NULL REFERENCES midias(id) ON DELETE RESTRICT,
  foto_posicao    TEXT NOT NULL DEFAULT '50% 50%',
  so_desktop      INTEGER NOT NULL DEFAULT 0 CHECK (so_desktop IN (0, 1)),
  visivel         INTEGER NOT NULL DEFAULT 1 CHECK (visivel IN (0, 1)),
  ordem           INTEGER NOT NULL DEFAULT 0,
  atualizado_em   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE membros (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  nome            TEXT NOT NULL,
  cargo           TEXT NOT NULL,
  foto_id         INTEGER REFERENCES midias(id) ON DELETE SET NULL,
  visivel         INTEGER NOT NULL DEFAULT 1 CHECK (visivel IN (0, 1)),
  ordem           INTEGER NOT NULL DEFAULT 0,
  atualizado_em   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE numeros (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  valor           INTEGER NOT NULL CHECK (valor >= 0),
  sufixo          TEXT NOT NULL DEFAULT '',
  label           TEXT NOT NULL,
  visivel         INTEGER NOT NULL DEFAULT 1 CHECK (visivel IN (0, 1)),
  ordem           INTEGER NOT NULL DEFAULT 0,
  atualizado_em   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- contatos deixados no formulário "Ser voluntário"
CREATE TABLE voluntarios (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nome        TEXT NOT NULL,
  whatsapp    TEXT NOT NULL,
  como        TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'novo' CHECK (status IN ('novo', 'contatado', 'arquivado')),
  criado_em   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- quem entra no painel
CREATE TABLE usuarios (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nome        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE COLLATE NOCASE,
  senha_hash  TEXT NOT NULL,                -- PBKDF2-SHA256, base64
  salt        TEXT NOT NULL,                -- base64
  iteracoes   INTEGER NOT NULL,
  criado_em   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- freio contra abuso: senha errada no login e cadastro em massa de voluntário
CREATE TABLE tentativas (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  chave       TEXT NOT NULL COLLATE NOCASE,   -- 'login:<email>' ou 'voluntario:<ip>'
  ip          TEXT NOT NULL,
  criado_em   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- dados soltos do site que a diretoria pode trocar (WhatsApp, PIX)
CREATE TABLE configuracoes (
  chave       TEXT PRIMARY KEY,
  valor       TEXT NOT NULL
);

CREATE INDEX idx_projetos_ordem ON projetos (ordem);
CREATE INDEX idx_marcos_ordem ON marcos (ordem);
CREATE INDEX idx_membros_ordem ON membros (ordem);
CREATE INDEX idx_numeros_ordem ON numeros (ordem);
CREATE INDEX idx_voluntarios_criado ON voluntarios (criado_em DESC);
CREATE INDEX idx_tentativas ON tentativas (chave, criado_em);
