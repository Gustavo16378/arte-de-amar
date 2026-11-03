-- Diretoria real, enviada pela ONG em 03/11/2026.
-- As fotos ficam em /assets/fotos (passam pelo gerar-imagens.mjs) e os
-- quatro cargos de exemplo ganham nome e retrato. Os dois cargos que a ONG
-- não mandou ficam ocultos, sem apagar: a diretoria reativa pelo painel.

INSERT INTO midias (caminho, tipo, alt, largura, altura) VALUES
  ('/assets/fotos/diretoria-aline-milani.jpg', 'image/jpeg', 'Aline Milani, presidente da Arte de Amar', 960, 1200),
  ('/assets/fotos/diretoria-larissa-lima.jpg', 'image/jpeg', 'Larissa Lima, vice-presidente da Arte de Amar', 960, 1200),
  ('/assets/fotos/diretoria-julia-belga.jpg', 'image/jpeg', 'Julia Belga, tesoureira da Arte de Amar', 960, 1200),
  ('/assets/fotos/diretoria-dayane-carvalho.jpg', 'image/jpeg', 'Dayane Carvalho, secretária da Arte de Amar', 960, 1200);

UPDATE membros SET nome = 'Aline Milani', ordem = 0, visivel = 1, atualizado_em = datetime('now'),
  foto_id = (SELECT id FROM midias WHERE caminho = '/assets/fotos/diretoria-aline-milani.jpg')
  WHERE cargo = 'Presidente';

UPDATE membros SET nome = 'Larissa Lima', ordem = 1, visivel = 1, atualizado_em = datetime('now'),
  foto_id = (SELECT id FROM midias WHERE caminho = '/assets/fotos/diretoria-larissa-lima.jpg')
  WHERE cargo = 'Vice-presidente';

UPDATE membros SET nome = 'Julia Belga', ordem = 2, visivel = 1, atualizado_em = datetime('now'),
  foto_id = (SELECT id FROM midias WHERE caminho = '/assets/fotos/diretoria-julia-belga.jpg')
  WHERE cargo = 'Tesoureira';

UPDATE membros SET nome = 'Dayane Carvalho', ordem = 3, visivel = 1, atualizado_em = datetime('now'),
  foto_id = (SELECT id FROM midias WHERE caminho = '/assets/fotos/diretoria-dayane-carvalho.jpg')
  WHERE cargo = 'Secretária';

UPDATE membros SET visivel = 0, atualizado_em = datetime('now')
  WHERE cargo IN ('Diretora de projetos', 'Conselho fiscal');
