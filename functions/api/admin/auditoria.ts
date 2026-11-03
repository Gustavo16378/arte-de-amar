import { ErroHttp, json, tratar } from '../../_lib/http'
import type { Funcao } from '../../_lib/tipos'

/**
 * GET /api/admin/auditoria?de=2026-11-03 03:00:00&ate=2026-11-04 03:00:00[&usuario=3]
 * O que foi feito no painel entre dois instantes (em UTC). O painel manda o
 * começo e o fim do dia no fuso de quem está olhando.
 */
const DATA = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/

export const onRequestGet: Funcao = ({ env, request }) =>
  tratar(async () => {
    const q = new URL(request.url).searchParams
    const de = q.get('de') ?? ''
    const ate = q.get('ate') ?? ''
    if (!DATA.test(de) || !DATA.test(ate)) throw new ErroHttp('Período inválido.')
    const usuario = q.get('usuario') ? Number(q.get('usuario')) : null

    const { results } = await env.DB.prepare(
      `SELECT id, usuario_id, usuario_nome, acao, area, alvo, detalhe, criado_em
         FROM auditoria
        WHERE criado_em >= ? AND criado_em < ? AND (?3 IS NULL OR usuario_id = ?3)
        ORDER BY id DESC LIMIT 2000`,
    )
      .bind(de, ate, usuario)
      .all()
    return json({ itens: results })
  })
