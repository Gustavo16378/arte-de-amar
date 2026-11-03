import { urlDaFoto } from '../../../_lib/conteudo'
import { ErroHttp, json, tratar } from '../../../_lib/http'
import type { Funcao } from '../../../_lib/tipos'

/**
 * GET  /api/admin/midias   a biblioteca de fotos (sem os bytes)
 * POST /api/admin/midias   multipart: arquivo, alt, largura, altura
 *
 * O painel já reduz a foto no navegador antes de mandar (até 1600px, JPEG
 * ou WebP), então ela cabe numa linha do D1. O teto de 1,5 MB aqui é a
 * garantia do lado do servidor.
 */
const TETO = 1_500_000
const TIPOS = ['image/jpeg', 'image/webp', 'image/png']

/** confere os primeiros bytes: o Content-Type do upload pode mentir */
function tipoReal(b: Uint8Array) {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png'
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50)
    return 'image/webp'
  return null
}

export const onRequestGet: Funcao = ({ env }) =>
  tratar(async () => {
    const { results } = await env.DB.prepare(
      `SELECT m.id, m.caminho, m.alt, m.largura, m.altura, m.bytes, m.criado_em,
              (SELECT COUNT(*) FROM projetos WHERE foto_id = m.id)
            + (SELECT COUNT(*) FROM marcos WHERE foto_id = m.id)
            + (SELECT COUNT(*) FROM membros WHERE foto_id = m.id) AS usos
         FROM midias m ORDER BY m.id DESC`,
    ).all<{ id: number; caminho: string | null } & Record<string, unknown>>()

    return json({
      itens: results.map(({ caminho, ...m }) => ({ ...m, url: urlDaFoto(m.id, caminho), estatica: caminho !== null })),
    })
  })

export const onRequestPost: Funcao = ({ env, request }) =>
  tratar(async () => {
    const form = await request.formData().catch(() => {
      throw new ErroHttp('Envie a foto como formulário.')
    })
    const arquivo = form.get('arquivo')
    if (!arquivo || typeof arquivo === 'string') throw new ErroHttp('Escolha uma foto.')
    if (arquivo.size > TETO) throw new ErroHttp('A foto ficou maior que 1,5 MB mesmo reduzida.', 413)

    const bytes = new Uint8Array(await arquivo.arrayBuffer())
    const tipo = tipoReal(bytes)
    if (!tipo || !TIPOS.includes(tipo)) throw new ErroHttp('Só aceitamos fotos em JPG, PNG ou WebP.', 415)

    const alt = String(form.get('alt') ?? '').trim()
    const largura = Number(form.get('largura'))
    const altura = Number(form.get('altura'))
    if (alt.length < 3 || alt.length > 200) throw new ErroHttp('Descreva a foto em poucas palavras (é o que leitores de tela vão ler).')
    if (!Number.isInteger(largura) || !Number.isInteger(altura) || largura < 1 || altura < 1 || largura > 6000 || altura > 6000) {
      throw new ErroHttp('Dimensões da foto inválidas.')
    }

    const item = await env.DB.prepare(
      `INSERT INTO midias (dados, tipo, alt, largura, altura, bytes) VALUES (?, ?, ?, ?, ?, ?)
       RETURNING id, alt, largura, altura, bytes, criado_em`,
    )
      .bind(bytes, tipo, alt, largura, altura, bytes.byteLength)
      .first<{ id: number }>()

    return json({ item: { ...item, url: urlDaFoto(item!.id, null), estatica: false, usos: 0 } }, 201)
  })
