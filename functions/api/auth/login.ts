import { assinar, conferirSenha, cookieDeSessao } from '../../_lib/auth'
import { registro } from '../../_lib/auditoria'
import { ErroHttp, json, lerJson, tratar } from '../../_lib/http'
import type { Funcao } from '../../_lib/tipos'

const LIMITE = 5 // tentativas erradas
const JANELA = '-15 minutes'

/**
 * POST /api/auth/login  { email, senha }
 * Confere a senha e devolve a sessão no cookie. Depois de cinco erros
 * seguidos no mesmo e-mail, trava por quinze minutos.
 */
export const onRequestPost: Funcao = ({ request, env }) =>
  tratar(async () => {
    const d = await lerJson<{ email?: unknown; senha?: unknown }>(request, 2048)
    const email = String(d.email ?? '').trim().toLowerCase()
    const senha = String(d.senha ?? '')
    if (!email || !senha) throw new ErroHttp('Preencha e-mail e senha.')

    const chave = `login:${email}`
    // o freio só olha os últimos minutos: o que passou de um dia é descartado
    await env.DB.prepare(`DELETE FROM tentativas WHERE criado_em < datetime('now', '-1 day')`).run()
    const erros = await env.DB.prepare(
      `SELECT COUNT(*) AS n FROM tentativas WHERE chave = ? AND criado_em > datetime('now', ?)`,
    )
      .bind(chave, JANELA)
      .first<{ n: number }>()
    if ((erros?.n ?? 0) >= LIMITE) {
      throw new ErroHttp('Muitas tentativas. Espere 15 minutos e tente de novo.', 429)
    }

    const u = await env.DB.prepare(
      'SELECT id, nome, email, senha_hash, salt, iteracoes, trocar_senha FROM usuarios WHERE email = ?',
    )
      .bind(email)
      .first<{
        id: number
        nome: string
        email: string
        senha_hash: string
        salt: string
        iteracoes: number
        trocar_senha: number
      }>()

    const ok = u ? await conferirSenha(senha, u.senha_hash, u.salt, u.iteracoes) : false
    if (!u || !ok) {
      const ip = request.headers.get('CF-Connecting-IP') ?? 'local'
      await env.DB.prepare('INSERT INTO tentativas (chave, ip) VALUES (?, ?)').bind(chave, ip).run()
      // a mesma mensagem nos dois casos, para não revelar quais e-mails existem
      throw new ErroHttp('E-mail ou senha incorretos.', 401)
    }

    await env.DB.batch([
      env.DB.prepare('DELETE FROM tentativas WHERE chave = ?').bind(chave),
      registro(env, u, 'entrou', 'painel'),
      // auditoria guarda um ano; depois disso some sozinha
      env.DB.prepare(`DELETE FROM auditoria WHERE criado_em < datetime('now', '-1 year')`),
    ])
    const token = await assinar(env, u)
    return json(
      { usuario: { id: u.id, nome: u.nome, email: u.email, trocarSenha: u.trocar_senha === 1 } },
      200,
      { 'Set-Cookie': cookieDeSessao(request, token) },
    )
  })
