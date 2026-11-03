import { registrar } from '../../../_lib/auditoria'
import { gerarHash } from '../../../_lib/auth'
import { ErroHttp, idDaRota, json, tratar } from '../../../_lib/http'
import type { Funcao } from '../../../_lib/tipos'
import { senhaTemporaria } from '../../../_lib/senha'

/**
 * PUT    /api/admin/usuarios/:id   gera uma senha temporária nova (esqueceu a senha)
 * DELETE /api/admin/usuarios/:id   tira o acesso (não vale para si mesmo nem para o último)
 */
export const onRequestPut: Funcao<'id'> = ({ params, env, data }) =>
  tratar(async () => {
    const id = idDaRota(params.id)
    const senha = senhaTemporaria()
    const h = await gerarHash(senha)
    const u = await env.DB.prepare(
      'UPDATE usuarios SET senha_hash = ?, salt = ?, iteracoes = ?, trocar_senha = 1 WHERE id = ? RETURNING nome',
    )
      .bind(h.hash, h.salt, h.iteracoes, id)
      .first<{ nome: string }>()
    if (!u) throw new ErroHttp('Essa pessoa não existe mais.', 404)

    // limpa o freio de login, para a pessoa conseguir entrar com a temporária na hora
    await env.DB.prepare(`DELETE FROM tentativas WHERE chave = (SELECT 'login:' || email FROM usuarios WHERE id = ?)`)
      .bind(id)
      .run()
    await registrar(env, data.usuario, 'trocou', 'usuarios', `senha de ${u.nome}`, 'gerou senha temporária')
    return json({ senhaTemporaria: senha })
  })

export const onRequestDelete: Funcao<'id'> = ({ params, env, data }) =>
  tratar(async () => {
    const id = idDaRota(params.id)
    if (id === data.usuario.id) throw new ErroHttp('Você não pode tirar o seu próprio acesso.')
    const total = await env.DB.prepare('SELECT COUNT(*) AS n FROM usuarios').first<{ n: number }>()
    if ((total?.n ?? 0) <= 1) throw new ErroHttp('O painel precisa de pelo menos uma pessoa com acesso.')

    const u = await env.DB.prepare('DELETE FROM usuarios WHERE id = ? RETURNING nome').bind(id).first<{ nome: string }>()
    if (!u) throw new ErroHttp('Essa pessoa não existe mais.', 404)
    await registrar(env, data.usuario, 'apagou', 'usuarios', u.nome)
    return json({ ok: true })
  })
