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

    data.usuario = { id: carga.sub, nome: carga.nome, email: carga.email }
    return ctx.next()
  })
