/**
 * Gera migrations/0002_seed.sql a partir do conteúdo estático de src/content.
 *
 * O site nasceu com o conteúdo no código. Este script copia esse conteúdo
 * para o banco uma única vez, para a diretoria começar o painel com tudo que
 * já está no ar, e não com um site vazio.
 *
 * Uso: npx tsx scripts/gerar-seed.ts
 */
import { writeFileSync } from 'node:fs'
import { FOTOS } from '../src/content/fotos'
import { PROJETOS } from '../src/content/projetos'
import { MARCOS } from '../src/content/marcos'
import { MEMBROS } from '../src/content/membros'
import { NUMEROS, SITE } from '../src/content/site'

const q = (v: unknown) =>
  v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`

const linhas: string[] = [
  '-- Arte de Amar · conteúdo inicial, gerado por scripts/gerar-seed.ts',
  '-- Não editar à mão: rodar o script de novo.',
  '',
]

// fotos: id fixo na ordem do catálogo, para os outros inserts apontarem
const idDaFoto = new Map<string, number>()
Object.values(FOTOS).forEach((f, i) => {
  const id = i + 1
  idDaFoto.set(f.src, id)
  linhas.push(
    `INSERT INTO midias (id, caminho, tipo, alt, largura, altura) VALUES (${id}, ${q(f.src)}, 'image/jpeg', ${q(f.alt)}, ${f.largura}, ${f.altura});`,
  )
})
linhas.push('')

const foto = (src: string) => {
  const id = idDaFoto.get(src)
  if (!id) throw new Error(`foto fora do catálogo: ${src}`)
  return id
}

PROJETOS.forEach((p, i) => {
  linhas.push(
    `INSERT INTO projetos (nome, objetivo, objetivo_curto, publico, status, foto_id, foto_posicao, meta_feito, meta_total, meta_unidade, depoimento, autor, ordem) VALUES (${[
      p.nome, p.objetivo, p.objetivoCurto, p.publico, p.status,
      foto(p.foto.src), p.foto.posicao ?? '50% 50%',
      p.meta?.[0] ?? null, p.meta?.[1] ?? null, p.meta?.[2] ?? null,
      p.depoimento, p.autor, i,
    ].map(q).join(', ')});`,
  )
})
linhas.push('')

MARCOS.forEach((m, i) => {
  linhas.push(
    `INSERT INTO marcos (ano, titulo, texto, texto_desktop, foto_id, foto_posicao, so_desktop, ordem) VALUES (${[
      m.ano, m.titulo, m.texto, m.textoDesktop, foto(m.foto.src), m.foto.posicao ?? '50% 50%',
      m.ano === 'Hoje' ? 1 : 0, i,
    ].map(q).join(', ')});`,
  )
})
linhas.push('')

MEMBROS.forEach((m, i) => {
  linhas.push(
    `INSERT INTO membros (nome, cargo, foto_id, ordem) VALUES (${[m.nome, m.cargo, null, i].map(q).join(', ')});`,
  )
})
linhas.push('')

NUMEROS.forEach((n, i) => {
  linhas.push(
    `INSERT INTO numeros (valor, sufixo, label, ordem) VALUES (${[n.valor, n.sufixo, n.label, i].map(q).join(', ')});`,
  )
})
linhas.push('')

linhas.push(`INSERT INTO configuracoes (chave, valor) VALUES ('whatsapp', ${q(SITE.whatsappNumero)});`)
linhas.push(`INSERT INTO configuracoes (chave, valor) VALUES ('pix', ${q(SITE.cnpj)});`)

writeFileSync(new URL('../migrations/0002_seed.sql', import.meta.url), linhas.join('\n') + '\n')
console.log('migrations/0002_seed.sql gerado')
