import { cookieApagado } from '../../_lib/auth'
import { json } from '../../_lib/http'
import type { Funcao } from '../../_lib/tipos'

/** POST /api/auth/logout */
export const onRequestPost: Funcao = ({ request }) =>
  json({ ok: true }, 200, { 'Set-Cookie': cookieApagado(request) })
