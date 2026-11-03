/**
 * Gera os PDFs da documentação em docs/pdf/, com a identidade do site.
 *
 * - um PDF por documento de docs/ (requisitos, arquitetura, banco, API,
 *   testes e manual do painel), com capa própria;
 * - documentacao-completa.pdf, com capa, sumário e todos os capítulos.
 *
 * O Markdown vira HTML (marked), os diagramas Mermaid são desenhados no
 * navegador e o Chromium do Playwright imprime em A4. Links relativos para
 * arquivos do repositório viram links do GitHub, para funcionarem no PDF.
 *
 * Uso: npm run docs:pdf
 * Para usar um Chrome já instalado: CHROME_PATH=/caminho/do/chrome npm run docs:pdf
 */
import { mkdirSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { marked } from 'marked'
import { PDFDocument } from 'pdf-lib'
import { chromium } from 'playwright'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pacote = JSON.parse(readFileSync(path.join(raiz, 'package.json'), 'utf8'))
const REPO = 'https://github.com/Gustavo16378/arte-de-amar/blob/main'
const saida = path.join(raiz, 'docs', 'pdf')

const DOCUMENTOS = [
  { arquivo: 'requisitos.md', titulo: 'Requisitos', resumo: 'Atores, restrições, requisitos funcionais e não funcionais.' },
  { arquivo: 'arquitetura.md', titulo: 'Arquitetura', resumo: 'Camadas, fluxos, edição simultânea e decisões técnicas.' },
  { arquivo: 'banco.md', titulo: 'Modelo do banco', resumo: 'Diagrama entidade-relacionamento, tabelas, regras e migrations.' },
  { arquivo: 'api.md', titulo: 'Referência da API', resumo: 'Rotas, formatos de pedido e resposta, erros e sessão.' },
  { arquivo: 'testes.md', titulo: 'Plano e relatório de testes', resumo: 'Estratégia em caixa branca, cinza e preta, rastreabilidade e achados.' },
  { arquivo: 'manual-do-painel.md', titulo: 'Manual do painel', resumo: 'Como a diretoria usa o painel, em linguagem simples.' },
]

const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
const fonte = (nome) => pathToFileURL(path.join(raiz, 'public/assets/fontes', nome)).href

/** link relativo de docs/x.md vira link do GitHub; âncoras e links absolutos ficam */
function ajustarLinks(html, deArquivo) {
  return html.replace(/href="([^"#][^"]*)"/g, (tudo, href) => {
    if (/^(https?:|mailto:)/.test(href)) return tudo
    const alvo = path.posix.normalize(path.posix.join('docs', path.posix.dirname(deArquivo), href))
    return `href="${REPO}/${alvo}"`
  })
}

const idDe = (texto) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

function markdownParaHtml(md, arquivo, prefixo = '') {
  const renderizador = new marked.Renderer()
  renderizador.code = ({ text, lang }) =>
    lang === 'mermaid'
      ? `<div class="diagrama"><pre class="mermaid">${text}</pre></div>`
      : `<pre class="codigo"><code>${text.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</code></pre>`
  renderizador.heading = function ({ tokens, depth }) {
    const texto = this.parser.parseInline(tokens)
    return `<h${depth} id="${prefixo}${idDe(texto)}">${texto}</h${depth}>`
  }
  // o h1 do arquivo vira o título do capítulo, desenhado à parte
  const semTitulo = md.replace(/^# .+\n/, '')
  return ajustarLinks(marked.parse(semTitulo, { renderer: renderizador, gfm: true }), arquivo)
}

const CSS = `
@font-face { font-family: Sentient; src: url(${fonte('Sentient-300.woff2')}); font-weight: 300; }
@font-face { font-family: Sentient; src: url(${fonte('Sentient-300-italic.woff2')}); font-weight: 300; font-style: italic; }
@font-face { font-family: Sentient; src: url(${fonte('Sentient-400.woff2')}); font-weight: 400; }
@font-face { font-family: Switzer; src: url(${fonte('Switzer-400.woff2')}); font-weight: 400; }
@font-face { font-family: Switzer; src: url(${fonte('Switzer-500.woff2')}); font-weight: 500; }
:root { --verde: #0B2E22; --esmeralda: #1FA86B; --menta: #6FE3B0; --creme: #F6F2EA; --tinta: #1C1F1D; --cinza: #5B5F5A; --linha: #E4DDCD; }
@page { size: A4; margin: 22mm 18mm 20mm; }
* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; font-family: Switzer, Helvetica, Arial, sans-serif; font-size: 10pt; line-height: 1.55; color: var(--tinta); }
h1, h2, h3 { font-family: Sentient, Georgia, serif; font-weight: 400; color: var(--verde); break-after: avoid; }
h2 { font-size: 17pt; margin: 26pt 0 8pt; padding-top: 6pt; border-top: 1px solid var(--linha); }
h3 { font-size: 13pt; margin: 18pt 0 6pt; }
p, li { orphans: 3; widows: 3; }
a { color: #0f6e45; text-decoration: none; border-bottom: 1px solid rgba(31,168,107,.35); }
strong { font-weight: 500; color: var(--verde); }
code { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 8.6pt; background: #F1ECE1; padding: 1px 4px; border-radius: 3px; }
pre.codigo { background: #F7F3EA; border: 1px solid var(--linha); border-left: 3px solid var(--esmeralda); border-radius: 6px; padding: 9pt 11pt; white-space: pre-wrap; word-break: break-word; break-inside: avoid; }
pre.codigo code { background: none; padding: 0; font-size: 8.4pt; line-height: 1.5; }
table { width: 100%; border-collapse: collapse; margin: 10pt 0 14pt; font-size: 8.6pt; break-inside: auto; }
thead { display: table-header-group; }
tr { break-inside: avoid; }
th { text-align: left; font-weight: 500; color: var(--verde); background: #EEF7F1; border-bottom: 1.5px solid var(--esmeralda); padding: 5pt 6pt; }
td { border-bottom: 1px solid var(--linha); padding: 5pt 6pt; vertical-align: top; overflow-wrap: break-word; }
th:first-child, td:first-child { min-width: 46pt; }
td code { overflow-wrap: anywhere; }
td code, th code { white-space: normal; }
blockquote { margin: 10pt 0; padding: 6pt 12pt; border-left: 3px solid var(--menta); background: #F4FBF7; color: var(--cinza); }
hr { border: 0; border-top: 1px solid var(--linha); margin: 18pt 0; }
.diagrama { margin: 12pt 0 16pt; padding: 12pt; border: 1px solid var(--linha); border-radius: 8px; background: #FCFAF5; text-align: center; break-inside: avoid; }
.diagrama svg { max-width: 100%; height: auto; }

.capitulo { break-before: page; }
.capitulo:first-of-type { break-before: auto; }
.abertura { margin: 0 0 18pt; padding-bottom: 12pt; border-bottom: 2px solid var(--esmeralda); }
.abertura .rotulo { font-size: 8pt; letter-spacing: .16em; text-transform: uppercase; color: var(--esmeralda); }
.abertura h1 { font-size: 28pt; line-height: 1.1; margin: 4pt 0 6pt; border: 0; }
.abertura p { margin: 0; color: var(--cinza); }

.sumario { break-after: page; }
.sumario h1 { font-size: 26pt; margin: 0 0 18pt; }
.sumario ol { list-style: none; padding: 0; margin: 0; counter-reset: cap; }
.sumario li { counter-increment: cap; padding: 10pt 0; border-bottom: 1px solid var(--linha); display: grid; grid-template-columns: 34pt 1fr; }
.sumario li::before { content: counter(cap, decimal-leading-zero); font-family: Sentient, serif; font-size: 16pt; color: var(--esmeralda); }
.sumario a { border: 0; font-family: Sentient, serif; font-size: 14pt; color: var(--verde); }
.sumario small { grid-column: 2; color: var(--cinza); font-size: 9pt; }
`

const CSS_CAPA = `
@font-face { font-family: Sentient; src: url(${fonte('Sentient-300.woff2')}); font-weight: 300; }
@font-face { font-family: Sentient; src: url(${fonte('Sentient-300-italic.woff2')}); font-weight: 300; font-style: italic; }
@font-face { font-family: Switzer; src: url(${fonte('Switzer-400.woff2')}); font-weight: 400; }
@font-face { font-family: Switzer; src: url(${fonte('Switzer-500.woff2')}); font-weight: 500; }
@page { size: A4; margin: 0; }
html, body { margin: 0; height: 100%; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { background: #0B2E22; color: #F6F2EA; font-family: Switzer, Helvetica, Arial, sans-serif; }
.capa { position: relative; box-sizing: border-box; height: 296mm; padding: 26mm 22mm; display: flex; flex-direction: column; overflow: hidden; }
.fio { position: absolute; inset: 0; }
.marca { display: flex; align-items: center; gap: 12px; font-size: 10pt; letter-spacing: .22em; text-transform: uppercase; }
.marca svg { color: #6FE3B0; }
.meio { margin-top: auto; margin-bottom: auto; position: relative; }
.rotulo { font-size: 9pt; letter-spacing: .2em; text-transform: uppercase; color: #6FE3B0; }
h1 { font-family: Sentient, Georgia, serif; font-weight: 300; font-size: 46pt; line-height: 1.02; margin: 10pt 0 14pt; max-width: 15ch; }
h1 em { color: #6FE3B0; }
.resumo { font-size: 12pt; line-height: 1.5; color: #D9D2C3; max-width: 46ch; margin: 0; }
.rodape { position: relative; display: flex; justify-content: space-between; align-items: flex-end; font-size: 9pt; color: #D9D2C3; border-top: 1px solid rgba(246,242,234,.18); padding-top: 12pt; }
.rodape strong { color: #F6F2EA; font-weight: 500; }
`

const CORACAO = `<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.3-9.5C1.4 7.4 3.6 4 7.1 4c2.1 0 3.6 1.1 4.9 2.9C13.3 5.1 14.8 4 16.9 4c3.5 0 5.7 3.4 4.4 7-1.8 4.9-9.3 9.5-9.3 9.5Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>`

function capaHtml(titulo, resumo) {
  // a palavra final do título em itálico menta, como os títulos do site
  const partes = titulo.split(' ')
  const ultima = partes.pop()
  const tituloHtml = partes.length ? `${partes.join(' ')} <em>${ultima}</em>` : `<em>${ultima}</em>`
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>${CSS_CAPA}</style></head><body>
  <section class="capa">
    <svg class="fio" viewBox="0 0 210 297" preserveAspectRatio="none" aria-hidden="true">
      <path d="M150 -5 C150 60 40 70 30 130 C20 190 120 200 170 240 C200 265 190 290 190 310" fill="none" stroke="#1FA86B" stroke-width=".45" opacity=".8"/>
    </svg>
    <div class="marca">${CORACAO}<span>Arte de Amar</span></div>
    <div class="meio">
      <div class="rotulo">Documentação do sistema</div>
      <h1>${tituloHtml}</h1>
      <p class="resumo">${resumo}</p>
    </div>
    <div class="rodape">
      <div><strong>Site e painel da OSC Arte de Amar</strong><br>Palmas, Tocantins · Projeto Integrador 1 · Sistemas de Informação · UNITINS</div>
      <div style="text-align:right">Versão ${pacote.version}<br>${hoje}</div>
    </div>
  </section></body></html>`
}

function corpoHtml(capitulos, comSumario) {
  const sumario = comSumario
    ? `<section class="sumario"><h1>Sumário</h1><ol>${capitulos
        .map((c) => `<li><a href="#cap-${c.id}">${c.titulo}</a><small>${c.resumo}</small></li>`)
        .join('')}</ol></section>`
    : ''
  const corpo = capitulos
    .map(
      (c, i) => `<section class="capitulo">
        <header class="abertura" id="cap-${c.id}">
          <div class="rotulo">${comSumario ? `Capítulo ${String(i + 1).padStart(2, '0')}` : 'Arte de Amar'}</div>
          <h1>${c.titulo}</h1><p>${c.resumo}</p>
        </header>${c.html}</section>`,
    )
    .join('')
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>${CSS}</style></head><body>${sumario}${corpo}</body></html>`
}

const rodape = (titulo) => `<div style="width:100%;font-family:Helvetica,Arial,sans-serif;font-size:7.5pt;color:#8E8676;padding:0 18mm;display:flex;justify-content:space-between">
  <span>Arte de Amar · ${titulo}</span><span>versão ${pacote.version} · página <span class="pageNumber"></span> de <span class="totalPages"></span></span></div>`

async function imprimir(navegador, html, pasta, nome, opcoes) {
  const arquivo = path.join(pasta, `${nome}.html`)
  writeFileSync(arquivo, html)
  const pagina = await navegador.newPage()
  await pagina.goto(pathToFileURL(arquivo).href, { waitUntil: 'load' })
  if (html.includes('class="mermaid"')) {
    await pagina.addScriptTag({ path: path.join(raiz, 'node_modules/mermaid/dist/mermaid.min.js') })
    await pagina.evaluate(async () => {
      // cores do site nos diagramas
      window.mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        fontFamily: 'Switzer, Helvetica, Arial, sans-serif',
        themeVariables: {
          primaryColor: '#EEF7F1',
          primaryBorderColor: '#1FA86B',
          primaryTextColor: '#0B2E22',
          lineColor: '#0B2E22',
          secondaryColor: '#F6F2EA',
          tertiaryColor: '#FCFAF5',
          clusterBkg: '#F6F2EA',
          clusterBorder: '#D9D2C3',
          noteBkgColor: '#F4FBF7',
          noteBorderColor: '#6FE3B0',
          actorBkg: '#EEF7F1',
          actorBorder: '#1FA86B',
          fontSize: '13px',
        },
      })
      await window.mermaid.run({ querySelector: '.mermaid' })
    })
  }
  await pagina.evaluate(() => document.fonts.ready)
  const pdf = await pagina.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true, ...opcoes })
  await pagina.close()
  return pdf
}

/** capa (sem rodapé) + conteúdo (com rodapé e número de página) num PDF só */
async function juntar(capa, conteudo, titulo) {
  const final = await PDFDocument.create()
  for (const bytes of [capa, conteudo]) {
    const doc = await PDFDocument.load(bytes)
    for (const p of await final.copyPages(doc, doc.getPageIndices())) final.addPage(p)
  }
  final.setTitle(`Arte de Amar · ${titulo}`)
  final.setAuthor('Projeto Integrador 1 · Sistemas de Informação · UNITINS')
  final.setSubject('Documentação do site e do painel da OSC Arte de Amar')
  final.setCreator('scripts/gerar-pdfs.mjs')
  final.setLanguage('pt-BR')
  return final.save()
}

mkdirSync(saida, { recursive: true })
const temporaria = mkdtempSync(path.join(tmpdir(), 'ada-pdf-'))
const navegador = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {})

try {
  const capitulos = DOCUMENTOS.map((d) => ({
    ...d,
    id: idDe(d.titulo),
    html: markdownParaHtml(readFileSync(path.join(raiz, 'docs', d.arquivo), 'utf8'), d.arquivo, `${idDe(d.titulo)}-`),
  }))

  for (const c of capitulos) {
    const nome = c.arquivo.replace(/\.md$/, '')
    const capa = await imprimir(navegador, capaHtml(c.titulo, c.resumo), temporaria, `${nome}-capa`, {})
    const conteudo = await imprimir(navegador, corpoHtml([c], false), temporaria, nome, {
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: rodape(c.titulo),
    })
    writeFileSync(path.join(saida, `${nome}.pdf`), await juntar(capa, conteudo, c.titulo))
    console.log(`docs/pdf/${nome}.pdf`)
  }

  const titulo = 'Documentação completa'
  const capa = await imprimir(
    navegador,
    capaHtml(titulo, 'Requisitos, arquitetura, banco de dados, API, testes e manual do painel do site da OSC Arte de Amar.'),
    temporaria,
    'completa-capa',
    {},
  )
  const conteudo = await imprimir(navegador, corpoHtml(capitulos, true), temporaria, 'completa', {
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: rodape(titulo),
  })
  writeFileSync(path.join(saida, 'documentacao-completa.pdf'), await juntar(capa, conteudo, titulo))
  console.log('docs/pdf/documentacao-completa.pdf')
} finally {
  await navegador.close()
  rmSync(temporaria, { recursive: true, force: true })
}
