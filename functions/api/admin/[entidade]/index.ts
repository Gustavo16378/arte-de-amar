import { conferirFotos, entidade, limpar } from '../../../_lib/entidades'
import { registrar } from '../../../_lib/auditoria'
import { json, lerJson, tratar } from '../../../_lib/http'
import type { Funcao } from '../../../_lib/tipos'

/**
 * GET  /api/admin/:entidade   lista tudo, inclusive o que está oculto
 * POST /api/admin/:entidade   cria no fim da lista
 *
 * :entidade é projetos, marcos, membros ou numeros (ver _lib/entidades).
 */
export const onRequestGet: Funcao<'entidade'> = ({ params, env }) =>
  tratar(async () => {
    const e = entidade(params.entidade)
    const temFoto = 'foto_id' in e.campos
    const sql = temFoto
      ? `SELECT t.*, COALESCE(f.caminho, '/api/midias/' || f.id) AS foto_url
           FROM ${e.tabela} t LEFT JOIN midias f ON f.id = t.foto_id
          ORDER BY t.ordem, t.id`
      : `SELECT * FROM ${e.tabela} ORDER BY ordem, id`
    const { results } = await env.DB.prepare(sql).all()
    return json({ itens: results })
  })

export const onRequestPost: Funcao<'entidade'> = ({ params, env, request, data }) =>
  tratar(async () => {
    const e = entidade(params.entidade)
    const dados = limpar(e, await lerJson(request))
    await conferirFotos(env.DB, e, dados)

    const colunas = Object.keys(dados)
    const sql = `INSERT INTO ${e.tabela} (${colunas.join(', ')}, ordem)
                 VALUES (${colunas.map(() => '?').join(', ')},
                         (SELECT COALESCE(MAX(ordem), -1) + 1 FROM ${e.tabela}))
                 RETURNING *`
    const criado = await env.DB.prepare(sql).bind(...Object.values(dados)).first<Record<string, unknown>>()
    await registrar(env, data.usuario, 'criou', e.tabela, e.nomear(criado ?? dados))
    return json({ item: criado }, 201)
  })
