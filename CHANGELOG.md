# Changelog

O que mudou em cada versão do site e do painel da Arte de Amar.
Formato inspirado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/);
versões em [SemVer](https://semver.org/lang/pt-BR/).

## [1.1.0] · 2026-11-03

### Adicionado

- QR Code do PIX de verdade, gerado da chave configurada no painel (BR Code
  estático do Banco Central, sem valor fixo).
- Botão "Copiar Pix copia e cola", para quem está no celular.
- Prévia do QR nas configurações do painel.
- Testes do PIX: exemplo oficial do Banco Central e leitura do QR direto da
  tela. Total de 358 testes.

### Mudado

- A imagem de compartilhamento (og-image) saiu do build: `npm run og`.

### Corrigido

- Teste do zip não depende mais do Python (falhava no Windows).
- Retratos da Aline e da Julia centralizados no mural; mural da diretoria
  sem contorno ao clicar e sem seleção ao arrastar.

## [1.0.0] · 2026-11-03

Primeira versão com backend: a diretoria passa a cuidar do site sozinha.

### Adicionado

- API em Cloudflare Pages Functions com banco D1, publicada junto com o site.
- Painel da diretoria em `/admin`, com login.
- Cadastros de projetos, linha do tempo, diretoria e números: criar, editar,
  esconder, reordenar e apagar.
- Textos e fotos fixos de cada seção editáveis, com "voltar ao original".
- Biblioteca de fotos com redução e conversão para WebP no navegador,
  download de uma foto e de todas (.zip).
- Formulário "Ser voluntário" gravando no banco, com lista no painel e
  atalho para chamar no WhatsApp.
- Usuários: dar e tirar acesso, senha temporária para quem esqueceu e troca
  obrigatória no primeiro login.
- Auditoria por dia e por pessoa, guardada por um ano.
- Aviso de espaço do banco a partir de 70%.
- Proteção contra duas pessoas editando o mesmo item ao mesmo tempo.
- Diretoria real com retratos.
- 341 testes (unitários, banco, API, E2E e acessibilidade) rodando no CI.
- Documentação: requisitos, arquitetura, API, banco, testes, manual do
  painel e guia de contribuição.

### Mudado

- O site busca o conteúdo da API antes de abrir e usa o conteúdo do código
  como reserva quando a API não responde em 2,5 s.
- Seção sem nenhum item visível sai da página.
- Painel sem transições para quem prefere menos movimento.

### Segurança

- Senhas só como hash PBKDF2-SHA256; sessão em cookie `HttpOnly` e
  `SameSite=Strict`; bloqueio de pedidos de outra origem; trava de login;
  upload conferido pelos bytes; campo-isca e limite por IP no formulário.

### Corrigido

- Foto usada nos textos do site podia ser apagada.
- Editar só um campo da meta dava erro de validação.
- Ocultar todos os itens de uma seção fazia o site mostrar tudo de novo.
- Criar o usuário do painel pelo script falhava no Windows.
- Contraste e atributos de acessibilidade no painel; mural da diretoria sem
  acesso por teclado.

## [0.1.0] · 2026-09

Site estático one page, sem backend: abertura, números, quem somos, linha do
tempo, diretoria, atuação, projetos, como ajudar e rodapé, com o fio
contínuo e animações em GSAP.
