-- Recuperação de senha pelo painel e registro de auditoria.

-- senha temporária gerada por outra pessoa da diretoria: obriga a trocar no
-- próximo login
ALTER TABLE usuarios ADD COLUMN trocar_senha INTEGER NOT NULL DEFAULT 0 CHECK (trocar_senha IN (0, 1));

-- quem fez o quê no painel, e quando
CREATE TABLE auditoria (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id    INTEGER,                 -- sem chave estrangeira: o registro fica mesmo se a pessoa sair
  usuario_nome  TEXT NOT NULL,
  acao          TEXT NOT NULL CHECK (acao IN ('criou', 'editou', 'apagou', 'reordenou', 'entrou', 'enviou', 'trocou')),
  area          TEXT NOT NULL,           -- projetos, marcos, fotos, textos, usuarios…
  alvo          TEXT NOT NULL DEFAULT '',-- nome do que foi mexido, como aparece para a diretoria
  detalhe       TEXT NOT NULL DEFAULT '',-- campos alterados, em português
  criado_em     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_auditoria_criado ON auditoria (criado_em DESC);

-- trava contra duas pessoas editando o mesmo item ao mesmo tempo: cada
-- gravação sobe a versão, e quem salva com uma versão velha recebe aviso em
-- vez de apagar a mudança da outra pessoa
ALTER TABLE projetos ADD COLUMN versao INTEGER NOT NULL DEFAULT 0;
ALTER TABLE marcos   ADD COLUMN versao INTEGER NOT NULL DEFAULT 0;
ALTER TABLE membros  ADD COLUMN versao INTEGER NOT NULL DEFAULT 0;
ALTER TABLE numeros  ADD COLUMN versao INTEGER NOT NULL DEFAULT 0;
