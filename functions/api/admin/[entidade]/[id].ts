import { registrar } from '../../../_lib/auditoria'
import { camposMudados, conferirFotos, entidade, limpar } from '../../../_lib/entidades'
import { ErroHttp, idDaRota, json, lerJson, tratar } from '../../../_lib/http'
import type { Funcao } from '../../../_lib/tipos'

/**
 * PUT    /api/admin/:entidade/:id   altera os campos enviados
 * DELETE /api/admin/:entidade/:id   apaga
 */
export const onRequestPut: Funcao<'entidade' | 'id'> = ({ params, env, request, data }) =>
  tratar(async () => {
    const e = entidade(params.entidade)
    const id = idDaRota(params.id)

    const atual = await env.DB.prepare(`SELECT * FROM ${e.tabela} WHERE id = ?`).bind(id).first<Record<string, unknown>>()
    if (!atual) throw new ErroHttp(`Esse ${e.nome} não existe mais.`, 404)

    const corpo = await lerJson<Record<string, unknown>>(request)

    /*
     * Concorrência: o painel manda a versão que tinha quando abriu o item.
     * Se alguém salvou no meio do caminho, a versão subiu e esta gravação é
     * recusada com aviso, em vez de sobrescrever a mudança da outra pessoa.
     * Sem versão no pedido (o interruptor "No site"), vale a última.
     */
    const versao = corpo.versao === undefined ? null : Number(corpo.versao)
    if (versao !== null && versao !== Number(atual.versao)) {
      const ultimo = await env.DB.prepare(
        `SELECT usuario_nome, criado_em FROM auditoria WHERE area = ? AND alvo = ? AND acao = 'editou'
          ORDER BY id DESC LIMIT 1`,
      )
        .bind(e.tabela, e.nomear(atual))
        .first<{ usuario_nome: string; criado_em: string }>()
      const quem = ultimo ? `${ultimo.usuario_nome} salvou` : 'Alguém salvou'
      throw new ErroHttp(
        `${quem} uma mudança nesse ${e.nome} enquanto você editava. Feche, abra de novo para ver a versão nova e refaça a sua alteração.`,
        409,
      )
    }

    // valida o registro inteiro já com as mudanças, para regras entre campos (meta)
    const mudancas = limpar(e, corpo, true)
    limpar(e, { ...atual, ...mudancas })
    await conferirFotos(env.DB, e, mudancas)

    const colunas = Object.keys(mudancas)
    if (colunas.length === 0) return json({ item: atual })

    const sql = `UPDATE ${e.tabela}
                    SET ${colunas.map((c) => `${c} = ?`).join(', ')}, atualizado_em = datetime('now'), versao = versao + 1
                  WHERE id = ? AND versao = ? RETURNING *`
    const item = await env.DB.prepare(sql)
      .bind(...Object.values(mudancas), id, atual.versao)
      .first<Record<string, unknown>>()
    // duas gravações no mesmo instante: a segunda encontra a versão já trocada
    if (!item) throw new ErroHttp(`Outra pessoa salvou esse ${e.nome} agora mesmo. Abra de novo e refaça a alteração.`, 409)
    const mudou = camposMudados(e, atual, mudancas)
    if (mudou.length) await registrar(env, data.usuario, 'editou', e.tabela, e.nomear(item ?? atual), mudou.join(', '))
    return json({ item })
  })

export const onRequestDelete: Funcao<'entidade' | 'id'> = ({ params, env, data }) =>
  tratar(async () => {
    const e = entidade(params.entidade)
    const id = idDaRota(params.id)
    const atual = await env.DB.prepare(`SELECT * FROM ${e.tabela} WHERE id = ?`).bind(id).first<Record<string, unknown>>()
    if (!atual) throw new ErroHttp(`Esse ${e.nome} não existe mais.`, 404)
    await env.DB.prepare(`DELETE FROM ${e.tabela} WHERE id = ?`).bind(id).run()
    await registrar(env, data.usuario, 'apagou', e.tabela, e.nomear(atual))
    return json({ ok: true })
  })
