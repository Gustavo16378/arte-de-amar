/**
 * Caixa preta · contrato público (RNF11) e conteúdo inicial (RF01, RF07).
 * Só olha a resposta HTTP, como o navegador do visitante.
 */
import { describe, expect, it } from 'vitest'
import { ConteudoPublico, Erro } from '../contratos'
import { Cliente } from './cliente'

const visitante = new Cliente()

describe('RNF11 · GET /api/conteudo', () => {
  it('responde 200 em JSON, sem cache, dentro do contrato', async () => {
    const r = await visitante.get('/api/conteudo')
    expect(r.status).toBe(200)
    expect(r.cabecalhos.get('content-type')).toContain('application/json')
    expect(r.cabecalhos.get('cache-control')).toMatch(/no-store|max-age=0/)
    expect(() => ConteudoPublico.parse(r.corpo)).not.toThrow()
  })

  it('RF01 · traz o conteúdo do seed: 6 projetos, 7 marcos, 4 pessoas visíveis, 4 números', async () => {
    const { corpo } = await visitante.get('/api/conteudo')
    expect(corpo.projetos).toHaveLength(6)
    expect(corpo.marcos).toHaveLength(7)
    expect(corpo.membros.map((m: { nome: string }) => m.nome)).toEqual([
      'Aline Milani',
      'Larissa Lima',
      'Julia Belga',
      'Dayane Carvalho',
    ])
    expect(corpo.numeros).toHaveLength(4)
  })

  it('RF07 · WhatsApp em formato internacional e chave PIX', async () => {
    const { corpo } = await visitante.get('/api/conteudo')
    expect(corpo.config.whatsapp).toMatch(/^55\d{10,11}$/)
    expect(corpo.config.pix).toBeTruthy()
  })

  it('não expõe nada interno (ids, ordem, versão, bytes de foto)', async () => {
    const texto = JSON.stringify((await visitante.get('/api/conteudo')).corpo)
    for (const proibido of ['"id"', '"ordem"', '"versao"', '"dados"', 'senha', '"visivel"']) {
      expect(texto).not.toContain(proibido)
    }
  })
})

describe('RNF11 · formato único de erro', () => {
  it.each([
    ['GET', '/api/admin/projetos', 401],
    ['GET', '/api/admin/qualquercoisa', 401],
    ['POST', '/api/auth/login', 415],
    ['GET', '/api/midias/999999', 404],
    ['GET', '/api/midias/abc', 404],
  ])('%s %s → %i com { erro }', async (metodo, caminho, status) => {
    const r = await visitante.pedir(metodo, caminho, undefined, metodo === 'POST' ? { 'Content-Type': 'text/plain' } : {})
    expect(r.status).toBe(status)
    expect(() => Erro.parse(r.corpo)).not.toThrow()
  })
})

describe('fotos públicas', () => {
  it('foto do site original redireciona para o arquivo estático', async () => {
    const r = await visitante.get('/api/midias/1')
    expect(r.status).toBe(302)
    expect(r.cabecalhos.get('location')).toMatch(/\/assets\/fotos\/.+\.jpg$/)
  })
})
