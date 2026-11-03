import { lerCookie, verificar } from '../../_lib/auth'
import { erro, tratar } from '../../_lib/http'
import type { Funcao } from '../../_lib/tipos'

/**
 * Porteiro de tudo em /api/admin.
 *
 * 1. Sem sessão válida, 401.
 * 2. Pedido que muda dados precisa vir do próprio site (Origin igual). O
 *    cookie já é SameSite=Strict; isto é a segunda tranca contra CSRF.
 */
export const onRequest: Funcao = (ctx) =>
  tratar(async () => {
    const { request, env, data } = ctx

    if (!['GET', 'HEAD'].includes(request.method)) {
      const origem = request.headers.get('Origin')
      if (origem && origem !== new URL(request.url).origin) return erro('Origem não permitida.', 403)
    }

    const token = lerCookie(request)
    const carga = token ? await verificar(env, token) : null
    if (!carga) return erro('Sessão expirada. Entre de novo.', 401)

    // a pessoa ainda existe? (quem foi removido em Usuários perde o acesso na hora)
    const u = await env.DB.prepare('SELECT id, nome, email, trocar_senha FROM usuarios WHERE id = ?')
      .bind(carga.sub)
      .first<{ id: number; nome: string; email: string; trocar_senha: number }>()
    if (!u) return erro('Sessão expirada. Entre de novo.', 401)

    // senha temporária: até trocar, só a troca de senha é liberada
    const trocandoSenha = new URL(request.url).pathname === '/api/admin/senha'
    if (u.trocar_senha && !trocandoSenha) return erro('Crie uma senha nova antes de continuar.', 403)

    data.usuario = { id: u.id, nome: u.nome, email: u.email }
    return ctx.next()
  })
