# Como contribuir

Guia para quem for mexer no código do site e do painel da Arte de Amar.

## Preparar o ambiente

Node 20 ou mais.

```bash
npm install
cp .dev.vars.example .dev.vars   # e troque o JWT_SECRET
npm run db:local                 # banco local com o conteúdo inicial
npm run admin -- --local "Seu nome" voce@exemplo.com
npm run dev:api                  # site em http://localhost:8788 e painel em /admin
```

Só o front, sem backend: `npm run dev` (o site usa o conteúdo do código).

## Onde fica cada coisa

| pasta | o que tem |
|---|---|
| `src/components`, `src/styles`, `src/content` | o site |
| `src/admin` | o painel |
| `src/lib` | o que o site, o painel e a API compartilham (`textos.ts`) e a leitura da API |
| `functions/` | a API (uma rota por arquivo) e `_lib/` com regras e infraestrutura |
| `migrations/` | o esquema do banco, em ordem |
| `tests/` | unitários, banco, API e E2E |
| `docs/` | requisitos, arquitetura, API, banco, testes e manual |

A arquitetura e as decisões estão em [docs/arquitetura.md](docs/arquitetura.md).

## Fluxo

1. Crie um branch a partir da `main`: `git switch -c feat/galeria-de-fotos`.
2. Faça a mudança em commits pequenos, um assunto por commit.
3. Rode os testes (abaixo) antes de abrir o pull request.
4. Abra o pull request para a `main`. O CI roda a pirâmide inteira; só junte
   com ele verde.
5. Ao entrar na `main`, o Cloudflare Pages publica sozinho.

## Commits

Padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/),
em português, no imperativo ou descrevendo o resultado:

| tipo | quando | exemplo |
|---|---|---|
| `feat` | funcionalidade nova | `feat(painel): filtro por pessoa na auditoria` |
| `fix` | correção | `fix(api): foto usada nos textos não pode ser apagada` |
| `test` | testes | `test(api): concorrência com dez gravações simultâneas` |
| `docs` | documentação | `docs: manual do painel` |
| `refactor` | muda o código sem mudar o comportamento | `refactor(api): extrai validação de upload` |
| `style` | só visual do site ou do painel | `style(site): espaçamento do rodapé no celular` |
| `chore` | build, dependências, configuração | `chore: atualiza wrangler` |
| `ci` | pipeline | `ci: salva relatório do E2E quando falha` |

O corpo do commit explica o porquê quando ele não é óbvio.

## Testes

```bash
npm run build      # a API e os E2E servem o dist/
npm test           # unitários + banco + API
npm run test:e2e   # E2E e acessibilidade (uma vez: npx playwright install chromium)
```

Toda funcionalidade nova entra com teste. O nome do teste começa pelo
requisito que ele verifica (`RF11 · …`); requisito novo entra em
[docs/requisitos.md](docs/requisitos.md) e na matriz de
[docs/testes.md](docs/testes.md).

Mudou o formato de uma resposta da API? Atualize o contrato em
[`tests/contratos.ts`](tests/contratos.ts) e a [referência](docs/api.md).

## Banco

Mudança de esquema é sempre uma migration nova, com o próximo número
(`0006_...sql`). Migration que já foi para produção não se edita.

**Ordem do deploy: banco primeiro, código depois.** O push na `main` publica
o código na hora; se ele já consulta uma tabela ou coluna que o banco de
produção ainda não tem, a API responde 500 (o site cai no conteúdo de
reserva, mas o painel e o formulário param). Por isso:

1. escreva migrations que só acrescentam (tabela nova, coluna nova com
   valor padrão), para o código antigo continuar funcionando com elas;
2. aplique em produção com `npm run db:remoto` antes do merge;
3. só então junte o código que usa o que a migration criou.

Para conferir o que falta aplicar: `npx wrangler d1 migrations list arte-de-amar --remote`.

## O que não entra no repositório

- segredos: `.dev.vars`, tokens, senhas (o `.gitignore` já cobre);
- estado local do wrangler (`.wrangler/`), `dist/`, saídas de teste;
- prompts, rascunhos e referências soltas de design.

## Estilo de código

TypeScript estrito no site, no painel e na API (`npm run build` checa os
três). Prettier com a configuração de `.prettierrc`. Comentários e mensagens
para o usuário em português; mensagens de erro da API sempre dizem o que
fazer.
