import { registrar } from '../../../_lib/auditoria'
import { ErroHttp, idDaRota, json, lerJson, tratar } from '../../../_lib/http'
import type { Funcao } from '../../../_lib/tipos'

const STATUS = ['novo', 'contatado', 'arquivado']

/**
 * PUT    /api/admin/voluntarios/:id  { status }
 * DELETE /api/admin/voluntarios/:id
 */
export const onRequestPut: Funcao<'id'> = ({ params, env, request, data }) =>
  tratar(async () => {
    const id = idDaRota(params.id)
    const { status } = await lerJson<{ status?: unknown }>(request, 1024)
    if (typeof status !== 'string' || !STATUS.includes(status)) throw new ErroHttp('Status inválido.')
    const v = await env.DB.prepare('UPDATE voluntarios SET status = ? WHERE id = ? RETURNING nome').bind(status, id).first<{ nome: string }>()
    if (!v) throw new ErroHttp('Esse contato não existe mais.', 404)
    const rotulo = { novo: 'marcou como novo', contatado: 'marcou como já chamado', arquivado: 'arquivou' }[status]
    await registrar(env, data.usuario, 'editou', 'voluntarios', v.nome, rotulo)
    return json({ ok: true })
  })

export const onRequestDelete: Funcao<'id'> = ({ params, env, data }) =>
  tratar(async () => {
    const id = idDaRota(params.id)
    const v = await env.DB.prepare('DELETE FROM voluntarios WHERE id = ? RETURNING nome').bind(id).first<{ nome: string }>()
    if (!v) throw new ErroHttp('Esse contato não existe mais.', 404)
    await registrar(env, data.usuario, 'apagou', 'voluntarios', v.nome)
    return json({ ok: true })
  })
