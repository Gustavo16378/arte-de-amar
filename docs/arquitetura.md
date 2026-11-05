# Arquitetura · Arte de Amar

Um monorepo, um deploy, custo zero (RE01). O Cloudflare Pages publica o
site, o painel e a API juntos; o banco é um D1.

```mermaid
flowchart LR
  V[Visitante] -->|"/"| S[Site<br/>React + GSAP]
  D[Diretoria] -->|"/admin"| P[Painel<br/>React]
  S -->|"GET /api/conteudo"| API
  S -->|"POST /api/voluntarios"| API
  P -->|"/api/auth/*<br/>/api/admin/*"| API
  subgraph Cloudflare Pages
    S
    P
    API[Pages Functions<br/>TypeScript]
  end
  API --> DB[(D1<br/>SQLite)]
```

## Hospedagem e quem cuida de cada parte

| parte | onde fica | quem cuida |
|---|---|---|
| site, painel e API | Cloudflare Pages, na conta da ONG | publicação automática a cada push na `main` |
| banco de dados | Cloudflare D1, na mesma conta | a diretoria, pelo painel |
| domínio próprio | Cloudflare, na mesma conta | a ONG paga; a equipe configura |
| código | GitHub (`Gustavo16378/arte-de-amar`) | a equipe |

A conta da Cloudflare fica em nome da ONG para o site não depender de
ninguém da equipe para continuar no ar (RE05). A equipe só precisa de
acesso ao GitHub para publicar mudanças de código.

## Camadas

```mermaid
flowchart TB
  R["Rotas · functions/api/**<br/>recebem o pedido e respondem"] --> M
  M["Middleware · functions/api/admin/_middleware.ts<br/>sessão, origem (CSRF), usuário ativo, senha temporária"] --> L
  L["Regras e infraestrutura · functions/_lib/<br/>entidades (validação) · auth · auditoria · http · conteudo · senha"] --> B
  B["Dados · D1<br/>migrations/ versionadas, SQL sempre com bind"]
```

| camada | onde | responsabilidade |
|---|---|---|
| Rotas | `functions/api/` | Uma rota por arquivo (roteamento do Pages). Leem o pedido, chamam as regras, gravam e respondem. |
| Middleware | `functions/api/admin/_middleware.ts` | Porteiro de tudo em `/api/admin`: token válido, pessoa ainda cadastrada, origem igual à do site, troca de senha pendente. |
| Regras | `functions/_lib/entidades.ts` | Campos de cada cadastro, limites, tipos e regras entre campos. Lista fechada: nenhum nome de tabela ou coluna vem do pedido. |
| Infraestrutura | `functions/_lib/auth.ts`, `http.ts`, `auditoria.ts` | Hash PBKDF2 e JWT com a Web Crypto do runtime, respostas e erros padronizados, registro de auditoria. |
| Dados | `migrations/` e D1 | Esquema com CHECKs e chaves estrangeiras, para o banco recusar dado ruim mesmo se a API errar. |

As rotas falam SQL direto com o D1, sempre por bind. Para o tamanho do
projeto, uma camada de repositório separada seria mais cerimônia do que
ganho; as regras que importam (validação, quem pode o quê, auditoria) já
estão fora das rotas.

## Uma fonte só para o que é compartilhado

```mermaid
flowchart LR
  T["src/lib/textos.ts<br/>lista de textos editáveis"] --> S[Site: aplica os valores]
  T --> P[Painel: monta o formulário]
  T --> A[API: valida chaves e limites]
  C["tests/contratos.ts<br/>schemas Zod"] -.->|valida respostas reais| A
```

A lista de textos editáveis é importada pelo site, pelo painel e pela API.
Os contratos de teste conferem que a API responde no formato que o front
espera. Com front e back em repositórios separados, isso viraria cópia
mantida à mão.

## Fluxo de leitura do site

```mermaid
sequenceDiagram
  participant N as Navegador
  participant A as API
  participant D as D1
  N->>A: GET /api/conteudo (preload no index.html)
  A->>D: 6 consultas num batch
  D-->>A: projetos, marcos, membros, números, config, textos
  A-->>N: JSON no contrato
  Note over N: troca as listas de src/content no lugar<br/>antes do primeiro render
  N->>N: render + GSAP medindo o DOM final
  Note over N,A: sem resposta em 2,5 s: render com o conteúdo do código
```

O conteúdo é aplicado antes do primeiro render de propósito: as seções medem
o DOM para montar as animações (a linha do tempo pinada, o mural da
diretoria), e conteúdo chegando depois deixaria essas medidas erradas.

## Edição simultânea

```mermaid
sequenceDiagram
  participant A as Aline
  participant L as Larissa
  participant API
  A->>API: abre projeto (versão 3)
  L->>API: abre projeto (versão 3)
  A->>API: PUT meta, versão 3
  API-->>A: 200, versão 4
  L->>API: PUT depoimento, versão 3
  API-->>L: 409 "Aline salvou uma mudança enquanto você editava"
```

`UPDATE … SET versao = versao + 1 WHERE id = ? AND versao = ?`: se duas
gravações chegam no mesmo instante, o banco deixa passar só uma.

## Decisões

| decisão | alternativa | por quê |
|---|---|---|
| Pages Functions + D1 | Spring Boot no Render, Strapi no Railway | Custo zero e sem servidor dormindo; o deploy do back vem junto com o do site. |
| Fotos no próprio D1 | Cloudflare R2 | O R2 pede cartão mesmo no plano gratuito. As fotos chegam reduzidas (~0,3 MB). |
| JWT em cookie HttpOnly | token no localStorage | O JavaScript da página nunca vê o token; SameSite=Strict barra outro site. |
| Senha temporária pelo painel | recuperação por e-mail | Envio de e-mail exigiria serviço pago ou mais uma conta para manter. |
| Monorepo | repositórios de front e back | Um deploy, uma fonte para o que é compartilhado, um CI testando tudo junto. |
