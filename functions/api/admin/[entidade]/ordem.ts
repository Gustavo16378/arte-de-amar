import { entidade } from '../../../_lib/entidades'
import { ErroHttp, json, lerJson, tratar } from '../../../_lib/http'
import type { Funcao } from '../../../_lib/tipos'

/**
 * PUT /api/admin/:entidade/ordem  { ids: [3, 1, 2] }
 * Grava a nova ordem de uma vez só, numa transação.
 */
export const onRequestPut: Funcao<'entidade'> = ({ params, env, request }) =>
  tratar(async () => {
    const e = entidade(params.entidade)
    const { ids } = await lerJson<{ ids?: unknown }>(request)
    if (!Array.isArray(ids) || !ids.every((id) => Number.isInteger(id) && id > 0)) {
      throw new ErroHttp('Ordem inválida.')
    }
    if (new Set(ids).size !== ids.length) throw new ErroHttp('Ordem com itens repetidos.')

    await env.DB.batch(
      ids.map((id, i) => env.DB.prepare(`UPDATE ${e.tabela} SET ordem = ? WHERE id = ?`).bind(i, id)),
    )
    return json({ ok: true })
  })
