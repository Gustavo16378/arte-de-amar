import { CAMPO_POR_CHAVE } from '../../../src/lib/textos'
import { registro } from '../../_lib/auditoria'
import { ErroHttp, json, lerJson, tratar } from '../../_lib/http'
import type { Funcao } from '../../_lib/tipos'

/**
 * GET /api/admin/textos
 *   o que já foi trocado: { valores: { chave: valor }, fotos: { chave: url } }
 * PUT /api/admin/textos  { valores: { chave: "novo texto" | id da foto | null } }
 *   null volta o campo ao texto original do site
 *
 * Só aceita as chaves de src/lib/textos.ts, com os limites de lá.
 */
export const onRequestGet: Funcao = ({ env }) =>
  tratar(async () => {
    const { results } = await env.DB.prepare(
      `SELECT t.chave, t.valor, COALESCE(f.caminho, '/api/midias/' || f.id) AS url
         FROM textos t LEFT JOIN midias f ON f.id = CAST(t.valor AS INTEGER)`,
    ).all<{ chave: string; valor: string; url: string | null }>()

    const valores: Record<string, string> = {}
    const fotos: Record<string, string> = {}
    for (const r of results) {
      const campo = CAMPO_POR_CHAVE.get(r.chave)
      if (!campo) continue
      valores[r.chave] = r.valor
      if (campo.tipo === 'foto' && r.url) fotos[r.chave] = r.url
    }
    return json({ valores, fotos })
  })

export const onRequestPut: Funcao = ({ env, request, data }) =>
  tratar(async () => {
    const { valores } = await lerJson<{ valores?: Record<string, unknown> }>(request, 32 * 1024)
    if (!valores || typeof valores !== 'object') throw new ErroHttp('Nada para salvar.')

    const comandos: D1PreparedStatement[] = []
    // auditoria agrupada por seção: "Abertura: Título, trocou Foto da abertura"
    const porSecao = new Map<string, string[]>()
    const anotar = (secao: string, texto: string) => porSecao.set(secao, [...(porSecao.get(secao) ?? []), texto])

    for (const [chave, bruto] of Object.entries(valores)) {
      const campo = CAMPO_POR_CHAVE.get(chave)
      if (!campo) throw new ErroHttp('Campo desconhecido.')

      if (bruto === null || bruto === '') {
        comandos.push(env.DB.prepare('DELETE FROM textos WHERE chave = ?').bind(chave))
        anotar(campo.secao, `${campo.rotulo} (voltou ao original)`)
        continue
      }
      anotar(campo.secao, campo.tipo === 'foto' ? `trocou ${campo.rotulo.toLowerCase()}` : campo.rotulo)

      let valor: string
      if (campo.tipo === 'foto') {
        const id = Number(bruto)
        if (!Number.isInteger(id) || id <= 0) throw new ErroHttp(`Foto inválida em "${campo.rotulo}".`)
        const existe = await env.DB.prepare('SELECT 1 FROM midias WHERE id = ?').bind(id).first()
        if (!existe) throw new ErroHttp(`A foto escolhida em "${campo.rotulo}" não existe mais.`)
        valor = String(id)
      } else {
        if (typeof bruto !== 'string') throw new ErroHttp(`"${campo.rotulo}" precisa ser texto.`)
        valor = bruto.replace(/\r\n/g, '\n').trim()
        if (valor.length > campo.max) throw new ErroHttp(`"${campo.rotulo}" passa de ${campo.max} caracteres.`)
        if (campo.tipo === 'linhas') {
          const linhas = valor.split('\n').filter((l) => l.trim())
          if (campo.linhas && linhas.length > campo.linhas) {
            throw new ErroHttp(`"${campo.rotulo}" pode ter no máximo ${campo.linhas} linhas.`)
          }
          valor = linhas.map((l) => l.trim()).join('\n')
        } else if (valor.includes('\n') && campo.tipo === 'texto') {
          valor = valor.replace(/\s*\n\s*/g, ' ')
        }
      }

      comandos.push(
        env.DB.prepare(
          `INSERT INTO textos (chave, valor) VALUES (?, ?)
           ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor, atualizado_em = datetime('now')`,
        ).bind(chave, valor),
      )
    }

    if (!comandos.length) throw new ErroHttp('Nada para salvar.')
    for (const [secao, itens] of porSecao) {
      comandos.push(registro(env, data.usuario, 'editou', 'textos', secao, itens.join(', ')))
    }
    await env.DB.batch(comandos)
    return json({ ok: true })
  })
