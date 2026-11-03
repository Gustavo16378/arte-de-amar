import { conferirSenha, gerarHash } from '../../_lib/auth'
import { registrar } from '../../_lib/auditoria'
import { ErroHttp, json, lerJson, tratar } from '../../_lib/http'
import type { Funcao } from '../../_lib/tipos'

/** PUT /api/admin/senha  { atual, nova }  troca a própria senha */
export const onRequestPut: Funcao = ({ env, request, data }) =>
  tratar(async () => {
    const { atual, nova } = await lerJson<{ atual?: unknown; nova?: unknown }>(request, 2048)
    const novaSenha = String(nova ?? '')
    if (novaSenha.length < 10) throw new ErroHttp('A nova senha precisa ter pelo menos 10 caracteres.')

    const u = await env.DB.prepare('SELECT senha_hash, salt, iteracoes, trocar_senha FROM usuarios WHERE id = ?')
      .bind(data.usuario.id)
      .first<{ senha_hash: string; salt: string; iteracoes: number; trocar_senha: number }>()
    if (!u) throw new ErroHttp('Sessão expirada. Entre de novo.', 401)
    // quem acabou de entrar com a senha temporária não precisa digitá-la de novo
    if (!u.trocar_senha && !(await conferirSenha(String(atual ?? ''), u.senha_hash, u.salt, u.iteracoes))) {
      throw new ErroHttp('A senha atual não confere.', 401)
    }

    const h = await gerarHash(novaSenha)
    await env.DB.prepare('UPDATE usuarios SET senha_hash = ?, salt = ?, iteracoes = ?, trocar_senha = 0 WHERE id = ?')
      .bind(h.hash, h.salt, h.iteracoes, data.usuario.id)
      .run()
    await registrar(env, data.usuario, 'trocou', 'usuarios', 'a própria senha')
    return json({ ok: true })
  })
