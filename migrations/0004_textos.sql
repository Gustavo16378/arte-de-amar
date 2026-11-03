-- Textos e fotos fixos do site que a diretoria troca pela aba "Textos do
-- site" do painel. A lista de chaves válidas mora em src/lib/textos.ts.
-- Chave sem linha aqui fica com o texto original do código.
-- Em campo de foto, `valor` é o id da foto em `midias`.

CREATE TABLE textos (
  chave         TEXT PRIMARY KEY,
  valor         TEXT NOT NULL,
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
