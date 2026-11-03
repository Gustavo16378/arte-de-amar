import { registrar } from '../../../_lib/auditoria'
import { ErroHttp, idDaRota, json, lerJson, tratar } from '../../../_lib/http'
import type { Funcao } from '../../../_lib/tipos'

/**
 * PUT    /api/admin/midias/:id  { alt }   corrige a descrição
 * DELETE /api/admin/midias/:id            apaga, se nada usar a foto
 */
export const onRequestPut: Funcao<'id'> = ({ params, env, request, data }) =>
  tratar(async () => {
    const id = idDaRota(params.id)
    const { alt } = await lerJson<{ alt?: unknown }>(request, 2048)
    const texto = String(alt ?? '').trim()
    if (texto.length < 3 || texto.length > 200) throw new ErroHttp('Descreva a foto em poucas palavras.')
    const r = await env.DB.prepare('UPDATE midias SET alt = ? WHERE id = ?').bind(texto, id).run()
    if (!r.meta.changes) throw new ErroHttp('Essa foto não existe mais.', 404)
    await registrar(env, data.usuario, 'editou', 'fotos', texto, 'Descrição')
    return json({ ok: true })
  })

export const onRequestDelete: Funcao<'id'> = ({ params, env, data }) =>
  tratar(async () => {
    const id = idDaRota(params.id)
    const m = await env.DB.prepare('SELECT caminho, alt FROM midias WHERE id = ?').bind(id).first<{ caminho: string | null; alt: string }>()
    if (!m) throw new ErroHttp('Essa foto não existe mais.', 404)
    if (m.caminho) throw new ErroHttp('Essa foto faz parte do site original e não pode ser apagada pelo painel.', 409)

    const uso = await env.DB.prepare(
      `SELECT (SELECT COUNT(*) FROM projetos WHERE foto_id = ?1)
            + (SELECT COUNT(*) FROM marcos WHERE foto_id = ?1)
            + (SELECT COUNT(*) FROM textos WHERE chave LIKE '%.foto' AND CAST(valor AS INTEGER) = ?1) AS n`,
    )
      .bind(id)
      .first<{ n: number }>()
    if ((uso?.n ?? 0) > 0) throw new ErroHttp('Essa foto está em uso num projeto, na linha do tempo ou nos textos do site. Troque a foto lá antes de apagar.', 409)

    // retrato da diretoria pode ficar vazio: o site mostra a moldura
    await env.DB.batch([
      env.DB.prepare('UPDATE membros SET foto_id = NULL WHERE foto_id = ?').bind(id),
      env.DB.prepare('DELETE FROM midias WHERE id = ?').bind(id),
    ])
    await registrar(env, data.usuario, 'apagou', 'fotos', m.alt)
    return json({ ok: true })
  })
