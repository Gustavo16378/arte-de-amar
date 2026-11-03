/**
 * Monta o conteúdo público do site a partir do banco, já no formato que os
 * componentes do front usam (o mesmo de src/content).
 */
import type { Env } from './tipos'

type LinhaFoto = {
  foto_id: number | null
  foto_caminho: string | null
  foto_alt: string | null
  foto_largura: number | null
  foto_altura: number | null
}

/** foto estática aponta para o arquivo; foto enviada pelo painel é servida pela API */
export function urlDaFoto(id: number, caminho: string | null) {
  return caminho ?? `/api/midias/${id}`
}

function foto(l: LinhaFoto, posicao?: string) {
  if (l.foto_id == null) return null
  return {
    src: urlDaFoto(l.foto_id, l.foto_caminho),
    alt: l.foto_alt ?? '',
    largura: l.foto_largura ?? 1,
    altura: l.foto_altura ?? 1,
    ...(posicao ? { posicao } : {}),
  }
}

const JUNTA_FOTO = `
  LEFT JOIN midias f ON f.id = t.foto_id`
const COLUNAS_FOTO = `
  f.id AS foto_id, f.caminho AS foto_caminho, f.alt AS foto_alt,
  f.largura AS foto_largura, f.altura AS foto_altura`

export async function conteudoPublico(env: Env) {
  const [projetos, marcos, membros, numeros, config] = await env.DB.batch([
    env.DB.prepare(
      `SELECT t.*, ${COLUNAS_FOTO} FROM projetos t ${JUNTA_FOTO} WHERE t.visivel = 1 ORDER BY t.ordem, t.id`,
    ),
    env.DB.prepare(
      `SELECT t.*, ${COLUNAS_FOTO} FROM marcos t ${JUNTA_FOTO} WHERE t.visivel = 1 ORDER BY t.ordem, t.id`,
    ),
    env.DB.prepare(
      `SELECT t.*, ${COLUNAS_FOTO} FROM membros t ${JUNTA_FOTO} WHERE t.visivel = 1 ORDER BY t.ordem, t.id`,
    ),
    env.DB.prepare('SELECT valor, sufixo, label FROM numeros WHERE visivel = 1 ORDER BY ordem, id'),
    env.DB.prepare('SELECT chave, valor FROM configuracoes'),
  ])

  type L = Record<string, any> & LinhaFoto

  return {
    projetos: (projetos.results as L[]).map((p) => ({
      nome: p.nome,
      objetivo: p.objetivo,
      objetivoCurto: p.objetivo_curto,
      publico: p.publico,
      status: p.status,
      foto: foto(p, p.foto_posicao),
      meta: p.meta_total != null ? [p.meta_feito ?? 0, p.meta_total, p.meta_unidade ?? ''] : null,
      depoimento: p.depoimento,
      autor: p.autor,
      videoUrl: p.video_url,
    })),
    marcos: (marcos.results as L[]).map((m) => ({
      ano: m.ano,
      titulo: m.titulo,
      texto: m.texto,
      textoDesktop: m.texto_desktop,
      foto: foto(m, m.foto_posicao),
      soDesktop: m.so_desktop === 1,
    })),
    membros: (membros.results as L[]).map((m) => ({
      nome: m.nome,
      cargo: m.cargo,
      foto: foto(m),
    })),
    numeros: numeros.results as { valor: number; sufixo: string; label: string }[],
    config: Object.fromEntries(
      (config.results as { chave: string; valor: string }[]).map((c) => [c.chave, c.valor]),
    ),
  }
}
