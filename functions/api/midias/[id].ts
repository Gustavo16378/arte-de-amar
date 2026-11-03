import { erro, idDaRota, tratar } from '../../_lib/http'
import type { Funcao } from '../../_lib/tipos'

/**
 * GET /api/midias/:id
 * Entrega uma foto enviada pelo painel. Foto estática redireciona para o
 * arquivo em /assets.
 *
 * O conteúdo de um id nunca muda (trocar a foto cria outro id), então pode
 * ficar em cache por um ano.
 */
export const onRequestGet: Funcao<'id'> = ({ params, env, request }) =>
  tratar(async () => {
    const id = idDaRota(params.id)
    const m = await env.DB.prepare('SELECT caminho, dados, tipo FROM midias WHERE id = ?')
      .bind(id)
      .first<{ caminho: string | null; dados: ArrayBuffer | number[] | null; tipo: string }>()

    if (!m) return erro('Foto não encontrada.', 404)
    if (m.caminho) return Response.redirect(new URL(m.caminho, request.url).toString(), 302)
    if (!m.dados) return erro('Foto não encontrada.', 404)

    const bytes = m.dados instanceof ArrayBuffer ? new Uint8Array(m.dados) : new Uint8Array(m.dados)
    return new Response(bytes, {
      headers: {
        'Content-Type': m.tipo,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  })
