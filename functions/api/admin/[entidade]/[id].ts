import { conferirFotos, entidade, limpar } from '../../../_lib/entidades'
import { ErroHttp, idDaRota, json, lerJson, tratar } from '../../../_lib/http'
import type { Funcao } from '../../../_lib/tipos'

/**
 * PUT    /api/admin/:entidade/:id   altera os campos enviados
 * DELETE /api/admin/:entidade/:id   apaga
 */
export const onRequestPut: Funcao<'entidade' | 'id'> = ({ params, env, request }) =>
  tratar(async () => {
    const e = entidade(params.entidade)
    const id = idDaRota(params.id)

    const atual = await env.DB.prepare(`SELECT * FROM ${e.tabela} WHERE id = ?`).bind(id).first()
    if (!atual) throw new ErroHttp(`Esse ${e.nome} não existe mais.`, 404)

    // valida o registro inteiro já com as mudanças, para regras entre campos (meta)
    const mudancas = limpar(e, await lerJson(request), true)
    limpar(e, { ...atual, ...mudancas })
    await conferirFotos(env.DB, e, mudancas)

    const colunas = Object.keys(mudancas)
    if (colunas.length === 0) return json({ item: atual })

    const sql = `UPDATE ${e.tabela}
                    SET ${colunas.map((c) => `${c} = ?`).join(', ')}, atualizado_em = datetime('now')
                  WHERE id = ? RETURNING *`
    const item = await env.DB.prepare(sql).bind(...Object.values(mudancas), id).first()
    return json({ item })
  })

export const onRequestDelete: Funcao<'entidade' | 'id'> = ({ params, env }) =>
  tratar(async () => {
    const e = entidade(params.entidade)
    const id = idDaRota(params.id)
    const r = await env.DB.prepare(`DELETE FROM ${e.tabela} WHERE id = ?`).bind(id).run()
    if (!r.meta.changes) throw new ErroHttp(`Esse ${e.nome} não existe mais.`, 404)
    return json({ ok: true })
  })
