import { ErroHttp, json, lerJson, tratar } from '../../_lib/http'
import type { Funcao } from '../../_lib/tipos'

/**
 * GET /api/admin/configuracoes
 * PUT /api/admin/configuracoes  { whatsapp, pix }
 */
export const onRequestGet: Funcao = ({ env }) =>
  tratar(async () => {
    const { results } = await env.DB.prepare('SELECT chave, valor FROM configuracoes').all<{ chave: string; valor: string }>()
    return json({ config: Object.fromEntries(results.map((c) => [c.chave, c.valor])) })
  })

export const onRequestPut: Funcao = ({ env, request }) =>
  tratar(async () => {
    const d = await lerJson<Record<string, unknown>>(request, 2048)
    const comandos: D1PreparedStatement[] = []
    const gravar = (chave: string, valor: string) =>
      comandos.push(
        env.DB.prepare('INSERT INTO configuracoes (chave, valor) VALUES (?, ?) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor').bind(chave, valor),
      )

    if ('whatsapp' in d) {
      let n = String(d.whatsapp ?? '').replace(/\D/g, '')
      if (n.length === 10 || n.length === 11) n = `55${n}` // sem o 55, coloca
      if (n.length < 12 || n.length > 13) throw new ErroHttp('WhatsApp precisa ter DDD e número, por exemplo (63) 99999-9999.')
      gravar('whatsapp', n)
    }
    if ('pix' in d) {
      const pix = String(d.pix ?? '').trim()
      if (pix.length < 5 || pix.length > 80) throw new ErroHttp('Chave PIX inválida.')
      gravar('pix', pix)
    }
    if (!comandos.length) throw new ErroHttp('Nada para salvar.')

    await env.DB.batch(comandos)
    return json({ ok: true })
  })
