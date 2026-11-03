import { registrar } from '../../../_lib/auditoria'
import { gerarHash } from '../../../_lib/auth'
import { ErroHttp, json, lerJson, tratar } from '../../../_lib/http'
import type { Funcao } from '../../../_lib/tipos'
import { senhaTemporaria } from '../../../_lib/senha'

/**
 * GET  /api/admin/usuarios   quem tem acesso ao painel
 * POST /api/admin/usuarios   { nome, email } cria com senha temporária
 *
 * Qualquer pessoa da diretoria cadastra as outras. A senha temporária
 * aparece uma vez só, para ser mandada à pessoa; no primeiro login ela é
 * obrigada a criar a própria.
 */
export const onRequestGet: Funcao = ({ env }) =>
  tratar(async () => {
    const { results } = await env.DB.prepare(
      `SELECT u.id, u.nome, u.email, u.trocar_senha, u.criado_em,
              (SELECT MAX(criado_em) FROM auditoria a WHERE a.usuario_id = u.id AND a.acao = 'entrou') AS ultimo_acesso
         FROM usuarios u ORDER BY u.nome`,
    ).all()
    return json({ itens: results })
  })

export const onRequestPost: Funcao = ({ env, request, data }) =>
  tratar(async () => {
    const d = await lerJson<{ nome?: unknown; email?: unknown }>(request, 2048)
    const nome = String(d.nome ?? '').trim()
    const email = String(d.email ?? '').trim().toLowerCase()
    if (nome.length < 2 || nome.length > 60) throw new ErroHttp('Escreva o nome da pessoa.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) throw new ErroHttp('Confira o e-mail.')

    const existe = await env.DB.prepare('SELECT 1 FROM usuarios WHERE email = ?').bind(email).first()
    if (existe) throw new ErroHttp('Já existe alguém com esse e-mail.', 409)

    const senha = senhaTemporaria()
    const h = await gerarHash(senha)
    const item = await env.DB.prepare(
      `INSERT INTO usuarios (nome, email, senha_hash, salt, iteracoes, trocar_senha) VALUES (?, ?, ?, ?, ?, 1)
       RETURNING id, nome, email, trocar_senha, criado_em`,
    )
      .bind(nome, email, h.hash, h.salt, h.iteracoes)
      .first()

    await registrar(env, data.usuario, 'criou', 'usuarios', nome)
    return json({ item, senhaTemporaria: senha }, 201)
  })
