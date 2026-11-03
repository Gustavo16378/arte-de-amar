import { registrar } from '../../../_lib/auditoria'
import { json, tratar } from '../../../_lib/http'
import type { Funcao } from '../../../_lib/tipos'

/** GET /api/admin/voluntarios  contatos do formulário, os mais novos primeiro */
export const onRequestGet: Funcao = ({ env }) =>
  tratar(async () => {
    const { results } = await env.DB.prepare(
      `SELECT * FROM voluntarios ORDER BY CASE status WHEN 'novo' THEN 0 WHEN 'contatado' THEN 1 ELSE 2 END, criado_em DESC`,
    ).all()
    return json({ itens: results })
  })

/** DELETE /api/admin/voluntarios  apaga de uma vez todos os contatos arquivados */
export const onRequestDelete: Funcao = ({ env, data }) =>
  tratar(async () => {
    const r = await env.DB.prepare(`DELETE FROM voluntarios WHERE status = 'arquivado'`).run()
    const n = r.meta.changes ?? 0
    if (n) await registrar(env, data.usuario, 'apagou', 'voluntarios', `${n} contato${n > 1 ? 's' : ''} arquivado${n > 1 ? 's' : ''}`)
    return json({ apagados: n })
  })
