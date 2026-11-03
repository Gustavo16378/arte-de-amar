import { ErroHttp, idDaRota, json, lerJson, tratar } from '../../../_lib/http'
import type { Funcao } from '../../../_lib/tipos'

const STATUS = ['novo', 'contatado', 'arquivado']

/**
 * PUT    /api/admin/voluntarios/:id  { status }
 * DELETE /api/admin/voluntarios/:id
 */
export const onRequestPut: Funcao<'id'> = ({ params, env, request }) =>
  tratar(async () => {
    const id = idDaRota(params.id)
    const { status } = await lerJson<{ status?: unknown }>(request, 1024)
    if (typeof status !== 'string' || !STATUS.includes(status)) throw new ErroHttp('Status inválido.')
    const r = await env.DB.prepare('UPDATE voluntarios SET status = ? WHERE id = ?').bind(status, id).run()
    if (!r.meta.changes) throw new ErroHttp('Esse contato não existe mais.', 404)
    return json({ ok: true })
  })

export const onRequestDelete: Funcao<'id'> = ({ params, env }) =>
  tratar(async () => {
    const id = idDaRota(params.id)
    const r = await env.DB.prepare('DELETE FROM voluntarios WHERE id = ?').bind(id).run()
    if (!r.meta.changes) throw new ErroHttp('Esse contato não existe mais.', 404)
    return json({ ok: true })
  })
