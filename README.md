# Arte de Amar · site da ONG

[![testes](https://github.com/Gustavo16378/arte-de-amar/actions/workflows/testes.yml/badge.svg)](https://github.com/Gustavo16378/arte-de-amar/actions/workflows/testes.yml)

Site one page da OSC Arte de Amar, de Palmas, Tocantins, com painel para a
diretoria cuidar do conteúdo sozinha. Projeto autoral, sem template, no ar
em https://arte-de-amar-site.pages.dev/.

**Stack:** React, TypeScript, Vite, Tailwind e GSAP no front; Cloudflare
Pages Functions (TypeScript) e D1 (SQLite) no back; Vitest, Playwright e
axe-core nos testes. Custo de operação zero.

| documento | conteúdo |
|---|---|
| [docs/requisitos.md](docs/requisitos.md) | atores, restrições, requisitos funcionais e não funcionais |
| [docs/arquitetura.md](docs/arquitetura.md) | camadas, fluxos, edição simultânea e decisões |
| [docs/testes.md](docs/testes.md) | 340 testes em caixa branca, cinza e preta, rastreabilidade e o que eles encontraram |
| [docs/api.md](docs/api.md) | referência das rotas, com exemplos de pedido e resposta |
| [docs/banco.md](docs/banco.md) | modelo do banco, diagrama ER e migrations |
| [docs/manual-do-painel.md](docs/manual-do-painel.md) | como a diretoria usa o painel, em linguagem simples |
| [CONTRIBUTING.md](CONTRIBUTING.md) | ambiente, fluxo de branches, convenção de commits e testes |
| [CHANGELOG.md](CHANGELOG.md) | o que mudou em cada versão |

---

## Rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera as imagens, checa os tipos e monta o dist/
npm run preview  # serve o dist/ para conferir o build
npm run imagens  # refaz as versões responsivas das fotos do zero
```

`npm run dev` e `npm run build` geram as derivadas das fotos antes de subir.
Na primeira vez isso leva uns segundos; depois só refaz o que mudou.

Confira sempre em **390x844** (mobile, que é a versão principal) e
**1440x900** (desktop). Até 1023px vale o layout mobile.

**A abertura roda a cada carregamento da página**, no celular e no desktop,
mesmo para quem já a viu. `?nopre` na URL pula o preloader, para conferir o
resto da página sem esperar os quatro segundos a cada recarga.

Um detalhe em aberto: quem chega direto num âncora, como `/#como-ajudar`,
termina no topo da página, porque o preloader trava a rolagem enquanto roda.
Se isso passar a importar, dá para rolar até a âncora quando a cortina sobe.

---

## Testes

```bash
npm run build      # a API e os E2E servem o dist/
npm test           # unitários + banco + API (296)
npm run test:e2e   # E2E e acessibilidade no computador e no celular (44)
```

Os testes de API e E2E sobem a API de verdade (`wrangler pages dev`) com um
D1 novo e isolado a cada rodada, sem tocar no banco de desenvolvimento nem
no de produção. O CI roda tudo a cada push. Detalhes em
[docs/testes.md](docs/testes.md).

---

## Deploy no Cloudflare Pages

1. Conecte o repositório em **Workers & Pages → Create → Pages → Connect to
   Git** e escolha `arte-de-amar-site`.
2. Configure o build:

   | campo | valor |
   |---|---|
   | Framework preset | None |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Node version | 20 ou mais |

   Se o Node vier antigo, adicione a variável de ambiente
   `NODE_VERSION = 20`. O `sharp`, que gera as imagens, precisa dela.

3. O domínio já está apontado para `https://arte-de-amar-site.pages.dev/`
   em [`index.html`](index.html) (canonical, `og:url`, `og:image` e
   `twitter:image`), [`public/robots.txt`](public/robots.txt),
   [`public/sitemap.xml`](public/sitemap.xml) e
   [`src/content/site.ts`](src/content/site.ts).
4. Se a ONG registrar um domínio próprio, ligue em **Custom domains** (o
   certificado sai sozinho) e troque o endereço nesses quatro arquivos.

### Ligar o backend (uma vez só)

O site e a API sobem juntos: o Cloudflare Pages publica o `dist/` e
transforma cada arquivo de [`functions/`](functions) numa rota. O banco é um
D1 (SQLite da Cloudflare). Tudo no plano gratuito, sem cartão.

```bash
npx wrangler login                        # abre o navegador na conta da Cloudflare
npx wrangler d1 create arte-de-amar       # devolve o database_id
```

1. Cole o `database_id` em [`wrangler.toml`](wrangler.toml) e faça commit.
2. Crie as tabelas e o conteúdo inicial no banco de produção:
   `npm run db:remoto`
3. Crie o segredo das sessões em **Pages → arte-de-amar-site → Settings →
   Variables and Secrets**: `JWT_SECRET`, tipo *Secret*, com um texto
   aleatório de 32 caracteres ou mais
   (`node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`).
4. Em **Settings → Bindings**, confira se o D1 `arte-de-amar` aparece como
   `DB` (o `wrangler.toml` já declara; se não aparecer, adicione à mão).
5. Crie o login de cada pessoa da diretoria (a senha é pedida no terminal e
   só o hash vai para o banco):
   `npm run admin -- --remote "Nome da pessoa" email@exemplo.com`
6. Faça um novo deploy. O painel fica em `/admin`.

---

## Backend e painel da diretoria

```
site (/)  ──GET /api/conteudo──▶  Pages Functions  ──▶  D1
painel (/admin) ──/api/admin/*──▶  (login por cookie)
```

**O que a diretoria edita pelo painel:** os textos e fotos fixos de cada
seção (abertura, quem somos, história, onde a gente chega, como ajudar,
rodapé), projetos (com meta, depoimento e link de vídeo), linha do tempo,
diretoria com retratos, números de impacto, fotos, contatos (WhatsApp e PIX)
e a própria senha. A lista de textos editáveis fica em
[`src/lib/textos.ts`](src/lib/textos.ts), única fonte para o painel, a API e
o site. Também vê quem se
inscreveu em "Ser voluntário" e chama a pessoa no WhatsApp com um toque.

**Como o site lê o conteúdo.** [`src/lib/conteudo-remoto.ts`](src/lib/conteudo-remoto.ts)
busca `/api/conteudo` antes do primeiro render (o `index.html` já faz
preload) e troca as listas de `src/content` no lugar. Se a API demorar mais
de 2,5 s ou cair, o site sobe com o conteúdo do código, que continua sendo
a reserva. Trocar antes do render é de propósito: as seções medem o DOM
para montar o GSAP, e conteúdo chegando depois deixaria as medidas erradas.

**Fotos.** As do site original ficam em `/assets/fotos` e passam pelo
`gerar-imagens.mjs`. As enviadas pelo painel são reduzidas no navegador
(até 1600px, WebP) e guardadas no próprio D1, servidas por
`/api/midias/:id` com cache de um ano. Assim não depende do R2, que pede
cartão mesmo no plano gratuito.

**Formulário de voluntário.** Grava no banco e aparece no painel. Se a API
estiver fora do ar, cai no comportamento antigo: abre o WhatsApp da ONG com
a mensagem pronta.

**Espaço.** O plano gratuito do D1 aceita 500 MB por banco. Quase todo o
peso são as fotos enviadas (cerca de 0,3 MB cada); um contato de voluntário
ocupa menos de 1 KB. Configurações mostra o quanto já foi usado, e o painel
avisa no topo a partir de 70%. Os registros de tentativa de login e de
cadastro são apagados sozinhos depois de um dia; contatos de voluntário só
saem quando a diretoria apaga (um a um ou todos os arquivados de uma vez).

**Senha perdida.** Na aba Usuários, qualquer pessoa da diretoria dá acesso
a outra e gera uma senha temporária para quem esqueceu (fácil de mandar no
WhatsApp). Quem entra com ela é obrigado a criar uma senha própria antes de
usar o painel. Se ninguém conseguir entrar, `npm run admin -- --remote`
continua funcionando como chave mestra.

**Auditoria.** Toda alteração feita no painel, e cada login, vira uma linha
na tabela `auditoria`, já em português ("Aline editou os textos de Abertura:
trocou foto da abertura"). A aba Auditoria mostra por dia e por pessoa. Os
registros com mais de um ano são apagados sozinhos.

**Duas pessoas ao mesmo tempo.** Cada pedido é independente: mexer em coisas
diferentes salva as duas. Para o mesmo item, projetos, marcos, diretoria e
números têm uma coluna `versao`. O painel manda só os campos alterados junto
com a versão que estava aberta; se outra pessoa salvou no meio, a API
responde 409 dizendo quem foi, em vez de apagar a mudança dela. Nos textos
do site cada campo é gravado separado, e vale o último a salvar aquele campo.

**Fotos.** Entram reduzidas a 1600px e em WebP (ou JPEG em navegador que não
gera WebP). Cada foto tem "Baixar", e "Baixar todas (.zip)" monta um zip no
próprio navegador como cópia de segurança.

### Rotas

| método | rota | o que faz |
|---|---|---|
| GET | `/api/conteudo` | tudo que o site mostra, numa ida ao banco |
| POST | `/api/voluntarios` | formulário "Ser voluntário" |
| GET | `/api/midias/:id[?baixar=1]` | foto enviada pelo painel (ou como download) |
| POST | `/api/auth/login` · `/logout` | entra e sai |
| GET | `/api/auth/eu` | quem está logado |
| GET, POST | `/api/admin/:entidade` | lista e cria (`projetos`, `marcos`, `membros`, `numeros`) |
| PUT, DELETE | `/api/admin/:entidade/:id` | edita e apaga |
| PUT | `/api/admin/:entidade/ordem` | grava a nova ordem |
| GET, POST | `/api/admin/midias` | biblioteca e upload |
| PUT, DELETE | `/api/admin/midias/:id` | descrição e exclusão |
| GET, PUT, DELETE | `/api/admin/voluntarios[/:id]` | contatos e status; DELETE sem id apaga os arquivados |
| GET, PUT | `/api/admin/configuracoes` | WhatsApp e PIX |
| GET, PUT | `/api/admin/textos` | textos e fotos fixos das seções |
| GET | `/api/admin/espaco` | quanto do banco já foi usado |
| PUT | `/api/admin/senha` | troca a própria senha |
| GET, POST | `/api/admin/usuarios` | quem tem acesso; cria com senha temporária |
| PUT, DELETE | `/api/admin/usuarios/:id` | nova senha temporária; tira o acesso |
| GET | `/api/admin/auditoria?de=&ate=` | o que foi feito no período |

### Segurança

- Senha com PBKDF2-SHA256 e salt por usuário (100 mil iterações, o teto do
  runtime da Cloudflare), comparação em tempo constante.
- Sessão em JWT HS256 num cookie `HttpOnly`, `Secure`, `SameSite=Strict`,
  válida por 8 horas. O JavaScript da página nunca vê o token.
- Tudo em `/api/admin` passa pelo [`_middleware.ts`](functions/api/admin/_middleware.ts):
  sem sessão, 401; pedido que altera dados vindo de outra origem, 403.
- Login trava 15 minutos depois de 5 senhas erradas no mesmo e-mail, com a
  mesma mensagem para e-mail inexistente e senha errada.
- Tabela e coluna nunca vêm do pedido: saem da lista fechada em
  [`_lib/entidades.ts`](functions/_lib/entidades.ts), e os valores vão por bind.
- Upload confere o tipo pelos primeiros bytes do arquivo, não pelo que o
  navegador diz, e tem teto de 1,5 MB.
- Formulário de voluntário com campo-isca para robô e teto de 5 cadastros
  por hora por IP.

### Rodar com o backend localmente

```bash
cp .dev.vars.example .dev.vars            # e troque o JWT_SECRET
npm run db:local                          # cria o banco local com o seed
npm run admin -- --local "Seu nome" voce@exemplo.com
npm run dev:api                           # http://localhost:8788 e /admin
```

`npm run dev` (só o Vite) continua funcionando sem backend: o site usa o
conteúdo do código e o formulário cai no WhatsApp.

O seed em [`migrations/0002_seed.sql`](migrations/0002_seed.sql) é gerado a
partir de `src/content` por `npx tsx scripts/gerar-seed.ts`.

---

## Lighthouse

Medido no build de produção, com o Chrome do Playwright.

| | Performance | Acessibilidade | Boas práticas | SEO |
|---|---|---|---|---|
| **Mobile** | **92** | **100** | **100** | **100** |
| **Mobile**, com `?nopre` | **91** | **100** | **100** | **100** |
| **Desktop** | **100** | **100** | **100** | **100** |

Métricas do mobile: FCP 2,0s · LCP 3,0s · TBT 120ms · CLS 0,038 · SI 2,0s.

O que ainda pesa, e por quê: **LCP e FCP**. A página só pinta depois que o
React monta, e React mais GSAP são 94 kB gzip que a stack definida para o
projeto não permite trocar. O preload do hero já baixa a foto em paralelo,
então o LCP está limitado pelo tempo de parse e execução do JavaScript, não
pela imagem.

O caminho para baixar mais seria tirar o GSAP do caminho crítico com import
dinâmico. Não fiz: exigiria tornar assíncrona a montagem de quinze arquivos no
fim do projeto, e o alvo já está batido.

---

## Stack e peso do JavaScript

React 18 + Vite + TypeScript + Tailwind, GSAP (ScrollTrigger, ScrollToPlugin,
SplitText) e Lenis.

| chunk | bruto | gzip |
|---|---|---|
| react | 139,8 kB | 45,3 kB |
| gsap | 123,5 kB | 48,6 kB |
| nosso código | 61,7 kB | 18,0 kB |
| lenis | 18,6 kB | 5,4 kB |
| **total** | **343,6 kB** | **117,3 kB** |

Antes da revisão eram **117,8 kB gzip** num arquivo só. O ganho em bytes foi
pequeno, mas a composição mudou: as bibliotecas ficaram em chunks próprios,
então o cache do visitante sobrevive a cada publicação, e o **DrawSVGPlugin
saiu** (3,7 kB), porque desde a correção da Fase 4 o fio é desenhado por
`stroke-dashoffset` e o plugin estava registrado sem uso.

**Sobre `React.lazy` nas seções abaixo da dobra:** medi, e as nove seções
somam 14,0 kB gzip. Descontando o hero, adiar as outras oito pouparia uns
12 kB de 117, cerca de 10%. Contra isso: a página é toda movida a scroll, e
seções que montam tarde mudam a altura do documento, o que desalinha os
ScrollTriggers e gera layout shift, hoje em 0,038. Não compensa.

O ganho de verdade veio de outro lugar: **adiar a montagem do motion**. Cada
seção só arma os seus ScrollTriggers, mede o próprio tamanho e corta o texto
em linhas quando se aproxima da tela
([`useMotionProximo`](src/hooks/useMotionProximo.ts)). Quem abre e não rola não
paga por nada disso. Junto com a troca da granulação, o bloqueio da thread
principal caiu de **690ms para 120ms**.

---

## Estrutura

```
src/
  content/      textos, números, marcos, membros, projetos, catálogo de fotos
                (o conteúdo de reserva; o editável vem da API)
  styles/       tokens, fontes, base, componentes, header, preloader, seções
  lib/          gsap, lenis, desenho do traço, motion, paths do fio e do coração,
                conteudo-remoto (leitura da API)
  components/   peças reutilizadas e uma pasta sections/ com as nove seções
  hooks/        rolagem, tema do header, navegação, scroll lock, motion adiado
  admin/        o painel da diretoria (entrada própria, admin.html)
functions/
  _lib/         auth, http, entidades e validação, montagem do conteúdo
  api/          as rotas; api/admin/_middleware.ts protege o painel
migrations/     esquema do D1 e o seed com o conteúdo inicial
tests/          unit/, db/, api/ (Vitest), e2e/ (Playwright), contratos.ts
docs/           requisitos, arquitetura e plano de testes
scripts/
  gerar-imagens.mjs  versões responsivas das fotos, em WebP e JPG
  gerar-grao.mjs     ladrilho da granulação
  gerar-og.mjs       public/og-image.jpg, 1200x630 (npm run og, fora do build)
  gerar-seed.ts      migrations/0002_seed.sql a partir de src/content
  criar-admin.mjs    cria ou troca a senha de um usuário do painel
```

As folhas de estilo são importadas em ordem no `main.tsx`: primeiro a base do
Tailwind, depois as nossas camadas. `visibilidade.css` vem por último de
propósito, porque `.so-mobile` e `.so-desktop` precisam ganhar de qualquer
regra de seção que defina `display`.

---

## Decisões técnicas

### Ícones

As regras do projeto proibiam biblioteca de ícones, citando o Lucide pelo nome,
e a especificação pedia "nunca hambúrguer de três linhas". As duas regras foram
revistas a pedido da ONG, com escopo fechado: **o `lucide-react` entra só
no hambúrguer do header**, com os ícones `Menu` e `X`. Custa 1,7 kB gzip.

O ícone do Instagram não veio de lá: a versão 1 do `lucide-react` removeu os
ícones de marca, e `Instagram` não existe mais no pacote. Ele é um SVG
inline em [`IconeInstagram.tsx`](src/components/IconeInstagram.tsx), no mesmo
espírito do resto do site.

### Layout e conteúdo

- **Mobile e desktop convivem no DOM.** Onde muda só o layout, resolvemos em
  CSS. Onde o *texto* muda, as duas versões ficam no HTML e `.so-mobile` /
  `.so-desktop` escondem uma. Evita medir a viewport em JS e não pisca na
  primeira pintura. As fotos são as mesmas, então o navegador baixa cada
  arquivo uma vez só.
- **Fio do mobile a 20px da borda.** O `FIO.m` do source do desktop põe o fio
  a 31px; o source do mobile, que é a versão principal, desenha a 20px.
  Usamos o `FIO_M` da prancha. O `FIO.m` ficou registrado em
  `src/lib/fio-paths.ts` para consulta.
- **Duas fotos chegaram com o nome trocado** e foram renomeadas:
  `equipe-mural.jpg` tinha os Big Macs e `mcdia-feliz.jpg` tinha a equipe no
  mural. Tudo passa por `src/content/fotos.ts`.
- **Chave PIX em Switzer com algarismos tabulares**, como a especificação pede.
  É mais larga que a Sentient do source e quebrava em duas linhas no desktop,
  então o corpo e o tracking foram fechados até caber numa linha.
- **Sem travessão em texto nenhum**, conforme as regras do projeto. O `— {nome}` do
  depoimento virou só o nome.
- **Barra do header a 82% de opacidade**, como nos dois `source.html`. O
  briefing fala em 92%; os sources são a fonte da verdade.
- **O coração de Como ajudar é centralizado no desktop.** O source o
  encostava na direita, onde colidia com o fim do título e caía em cima da
  terceira coluna.

### Navegação

- **Header no kit padrão do time.** A borda inferior existe sempre no DOM,
  transparente no topo: assim ela aparece mudando de cor, e não empurrando o
  conteúdo 1px para baixo. Depois de 40px de rolagem a barra ganha fundo a
  90%, `blur(14px)` e a borda em `#D9D2C3`; sobre as seções `data-dark`,
  o mesmo invertido. As transições listam as propriedades uma a uma, nunca
  `all`.
- **O prefixo vem antes do padrão** em `backdrop-filter`. Na ordem
  contrária o minificador descartava a versão sem prefixo e o blur não
  aparecia.
- **O menu entra pela direita**, em 85vw com teto de 360px, num portal no
  body com estilos inline, fora do alcance de qualquer `overflow` ou
  `transform` de seção. Fechado, ele fica em `opacity: 0` sem sair do DOM,
  e o `inert` o tira também do teclado e do leitor de tela, o que o opacity
  sozinho não faria.
- **Com o menu aberto a barra sobe acima do overlay.** Sem isso o X ficaria
  atrás dele e sem clique. Ali ela fica limpa, só a marca e o X em creme.
- **Restaurar o scroll ao fechar conta como rolagem programática.** Sem isso,
  voltar de 0 para onde o visitante estava era lido como "rolou para baixo" e
  o header sumia justo na hora em que o menu fecha.
- **O estado da navegação lê a posição do ScrollTrigger**, não de
  `window.scrollY`: durante um refresh ele leva a página ao topo por um
  instante para remedir, e ler o scroll nativo nessa janela devolvia zero. O
  índice lateral piscava e o "Doar" flutuante sumia sozinho.
- **Quem rola é o Lenis**, não o `scroll-behavior: smooth`, que briga com ele
  e com o ScrollTrigger. Sob `prefers-reduced-motion` o Lenis nem é criado.
- **`irPara()` usa o Lenis quando ele existe e o ScrollToPlugin quando não.**
  Com o Lenis ativo o plugin escreve direto no `scrollY` e o rAF do Lenis
  desfaz isso no quadro seguinte.
- **O menu continua montado durante a animação de saída**, e a navegação só
  dispara depois: rolar com o body ainda em `position: fixed` perderia o
  destino. Ao destravar, quem devolve a posição é o Lenis.
- **Remedimos o ScrollTrigger ao soltar a trava de rolagem.** Com o body fora
  do fluxo o documento fica com altura de viewport, e todo ScrollTrigger
  medido nesse intervalo fica com o fim em zero.
- **Durante uma rolagem por clique o header não reage à direção**, com prazo
  de validade para o caso de o usuário interromper a rolagem.

### O fio

- **O espaço do SVG é pixels reais.** Num `viewBox` esticado, o DrawSVG, o
  `non-scaling-stroke` e o navegador mediam o comprimento do path de três
  formas diferentes: o fio desenhava cinco vezes mais rápido na linha do
  tempo e andava, parava e pulava nas seções. O viewBox recebe a caixa da
  seção e as coordenadas do path são convertidas de porcentagem para pixel.
- **O GSAP não interpola `stroke-dashoffset`.** Ele anima um número solto e
  nós escrevemos a propriedade, por `tweenDoTraco()` e `aplicarTraco()` em
  `lib/desenho.ts`.
- **Cada seção tem o seu degradê em coordenadas reais.** Em
  `objectBoundingBox` uma reta vertical tem caixa de largura zero e o
  navegador não desenha nada.
- **A altura da linha do tempo vem do espaçador do pin.** Os `450vh` da
  especificação dariam 3150px de rolagem para um percurso de 3352px em 1440: o
  fim do trilho ficaria inalcançável.
- **A onda cruza o meio exatamente em cada marco**, onde está o pontinho. O
  source usava período fixo de 380px, sem relação com o espaçamento.
- **O índice lateral sai de cena durante a linha do tempo**, onde os marcos
  passavam por baixo dele.
- **Sem movimento, o desktop usa a história vertical**: a pinada depende de
  rolagem para avançar na horizontal.

### Motion

- **O estado inicial é posto pelo GSAP, nunca pelo CSS.** Se o JavaScript
  falhar ou o visitante pedir menos movimento, o conteúdo já está no lugar e
  visível.
- **O SplitText só corta depois de `document.fonts.ready`**, e com
  `aria: 'none'`: o `aria-label` que ele acrescenta é proibido num `<p>`.
- **O hero espera a cortina do preloader.**
- **A rotação da máscara que abre é relativa**, para não apagar a inclinação
  que a moldura já tem no CSS.
- **O parallax do carrossel escuta o `scroll` do container**, porque ali a
  rolagem é horizontal e interna.

### Performance e acessibilidade

- **Granulação é um ladrilho de 128px, não um `feTurbulence`.** O filtro vivo
  cobrindo a viewport custava mais de um segundo de Style & Layout no
  Lighthouse mobile.
- **As fotos viram uma escada de larguras em WebP e JPG.** O hero saiu de
  481 kB para 71 kB na largura que um celular de 390px pede. O `<picture>`
  serve WebP com JPG de reserva, e o `src` continua sendo o original.
- **O preload do hero usa o mesmo `srcset` e `sizes` do `<picture>`**, senão
  o navegador baixaria a maior versão.
- **Todas as imagens têm `width` e `height`**, que é o que segura o layout.
  Só a do hero não é lazy.
- **Foco só no teclado.** Tudo usa `:focus-visible`, então o contorno
  aparece ao navegar por Tab e nunca no clique ou no toque. As únicas
  exceções são os campos de texto, onde o `:focus` é o comportamento certo.
- **Barra de rolagem fina em esmeralda no desktop.** No celular ela é um
  indicador temporário do próprio sistema, e mexer nela só atrapalharia.
- **Áreas de toque de 44px sem mexer no desenho.** O pill "Doar" tem 36px de
  altura, como no design, e os links do rodapé 21px; um pseudo-elemento
  estende a área até 44px em cada um.
- **A legenda sobre a foto ganhou um véu curto**, para o contraste não
  depender do trecho da imagem que calhar de ficar atrás dela, nem da próxima
  foto que a ONG venha a trocar.

---

## Pendências para a ONG

Tudo marcado com `TODO` no código. Com o painel no ar, a diretoria mesma
resolve diretoria, números, WhatsApp e metas em `/admin`.

| onde | o que falta |
|---|---|
| `src/content/membros.ts` | nomes e retratos da diretoria; hoje são seis placeholders "Nome Sobrenome" com moldura listrada |
| `src/content/site.ts` | os quatro números de impacto (11, 3.197+, 40+, 120+) são estimativas do design |
| `src/content/site.ts` | número real do WhatsApp, hoje `5563999999999`; ele serve ao botão de parceiro **e** ao envio do formulário de voluntário |
| `src/content/site.ts` | payload PIX estático (BR Code) do CNPJ, para gerar o QR de verdade |
| `src/content/site.ts` | crédito do rodapé, hoje "nome do estúdio" |
| `src/content/projetos.ts` | números das metas em andamento |
| `src/content/fotos.ts` | `triagem-roupas.jpg` e `criancas-comunidade.jpg` chegaram em 240x320 e ficam moles quando usadas grandes; pedir os originais |

---

## Fases

1. **Base** — tokens, fontes self-hosted, conteúdo extraído dos sources e
   layout estático de todas as seções.
2. **Navegação** — header mobile, menu em portal com scroll lock, índice
   lateral, botão Doar flutuante, ScrollTo e Lenis.
3. **Preloader** — coração desenhando, escrita à mão, cortina e nascimento do
   fio. Roda a cada carregamento da página.
4. **O fio** — desenho com scrub em todas as seções, continuidade entre elas,
   o coração fechando, a linha do tempo pinada e a barra de progresso.
5. **Motions de seção** — SplitText, contadores, máscaras, parallax,
   carrossel, filtro de projetos.
6. **Acabamento** — WebP responsivo, revisão do bundle, reduced motion, OG,
   favicon, acessibilidade e Lighthouse.
