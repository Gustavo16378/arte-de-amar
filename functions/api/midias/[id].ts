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
    const m = await env.DB.prepare('SELECT caminho, dados, tipo, alt FROM midias WHERE id = ?')
      .bind(id)
      .first<{ caminho: string | null; dados: ArrayBuffer | number[] | null; tipo: string; alt: string }>()

    if (!m) return erro('Foto não encontrada.', 404)
    if (m.caminho) return Response.redirect(new URL(m.caminho, request.url).toString(), 302)
    if (!m.dados) return erro('Foto não encontrada.', 404)

    const bytes = m.dados instanceof ArrayBuffer ? new Uint8Array(m.dados) : new Uint8Array(m.dados)

    // ?baixar=1 entrega como download, com um nome legível tirado da descrição
    const baixar = new URL(request.url).searchParams.has('baixar')
    const ext = m.tipo === 'image/webp' ? 'webp' : m.tipo === 'image/png' ? 'png' : 'jpg'
    const nome = `${nomeDeArquivo(m.alt) || 'foto'}-${id}.${ext}`

    return new Response(bytes, {
      headers: {
        ...(baixar ? { 'Content-Disposition': `attachment; filename="${nome}"` } : {}),
        'Content-Type': m.tipo,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  })

/** "Crianças no Volta às Aulas" vira "criancas-no-volta-as-aulas" */
export function nomeDeArquivo(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}
