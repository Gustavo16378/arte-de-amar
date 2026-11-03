import { lerCookie, verificar } from '../../_lib/auth'
import { erro, json, tratar } from '../../_lib/http'
import type { Funcao } from '../../_lib/tipos'

/** GET /api/auth/eu — quem está logado, ou 401. O painel usa ao abrir. */
export const onRequestGet: Funcao = ({ request, env }) =>
  tratar(async () => {
    const token = lerCookie(request)
    const carga = token ? await verificar(env, token) : null
    if (!carga) return erro('Sessão expirada. Entre de novo.', 401)
    return json({ usuario: { id: carga.sub, nome: carga.nome, email: carga.email } })
  })
