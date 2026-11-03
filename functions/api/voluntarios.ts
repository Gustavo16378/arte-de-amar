import { ErroHttp, json, lerJson, tratar } from '../_lib/http'
import type { Funcao } from '../_lib/tipos'

/**
 * POST /api/voluntarios
 * O formulário "Ser voluntário" do site. O contato fica guardado e aparece
 * no painel, com um botão para a diretoria chamar a pessoa no WhatsApp.
 *
 * Contra robô: um campo escondido (`site`) que gente de verdade não
 * preenche, e um teto de cadastros por hora vindos do mesmo IP.
 */
export const onRequestPost: Funcao = ({ request, env }) =>
  tratar(async () => {
    const d = await lerJson<Record<string, unknown>>(request, 4 * 1024)

    // robô preencheu o campo invisível: responde ok e não guarda nada
    if (typeof d.site === 'string' && d.site.trim() !== '') return json({ ok: true }, 201)

    const nome = String(d.nome ?? '').trim()
    const whatsapp = String(d.whatsapp ?? '').replace(/\D/g, '')
    const como = String(d.como ?? '').trim()

    if (nome.length < 2 || nome.length > 80) throw new ErroHttp('Escreva seu nome.')
    if (whatsapp.length < 10 || whatsapp.length > 13) throw new ErroHttp('Confira o número de WhatsApp, com DDD.')
    if (como.length > 500) throw new ErroHttp('A mensagem passou de 500 caracteres.')

    const ip = request.headers.get('CF-Connecting-IP') ?? 'local'
    const recentes = await env.DB.prepare(
      `SELECT COUNT(*) AS n FROM tentativas WHERE chave = ? AND criado_em > datetime('now', '-1 hour')`,
    )
      .bind(`voluntario:${ip}`)
      .first<{ n: number }>()
    if ((recentes?.n ?? 0) >= 5) throw new ErroHttp('Recebemos vários cadastros seus. Tente de novo mais tarde.', 429)

    await env.DB.batch([
      env.DB.prepare('INSERT INTO voluntarios (nome, whatsapp, como) VALUES (?, ?, ?)').bind(nome, whatsapp, como),
      env.DB.prepare('INSERT INTO tentativas (chave, ip) VALUES (?, ?)').bind(`voluntario:${ip}`, ip),
      env.DB.prepare(`DELETE FROM tentativas WHERE criado_em < datetime('now', '-1 day')`),
    ])

    return json({ ok: true }, 201)
  })
