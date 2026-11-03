/**
 * Caixa branca · functions/_lib/http.ts
 * Formato de erro único e leitura segura do corpo (RNF10, RNF11).
 */
import { describe, expect, it, vi } from 'vitest'
import { ErroHttp, erro, idDaRota, json, lerJson, tratar } from '../../functions/_lib/http'

const pedido = (corpo: string, tipo = 'application/json') =>
  new Request('https://x/api', { method: 'POST', body: corpo, headers: { 'Content-Type': tipo } })

describe('lerJson', () => {
  it('lê um objeto JSON', async () => {
    expect(await lerJson(pedido('{"a":1}'))).toEqual({ a: 1 })
  })
  it('exige Content-Type JSON (415)', async () => {
    await expect(lerJson(pedido('{"a":1}', 'text/plain'))).rejects.toMatchObject({ status: 415 })
  })
  it('recusa corpo acima do limite (413)', async () => {
    await expect(lerJson(pedido(JSON.stringify({ a: 'x'.repeat(200) }), 'application/json'), 100)).rejects.toMatchObject({
      status: 413,
    })
  })
  it.each(['nao json', '[1,2]', 'null', '"texto"', '42'])('recusa "%s" (só objeto)', async (c) => {
    await expect(lerJson(pedido(c))).rejects.toMatchObject({ status: 400 })
  })
})

describe('respostas', () => {
  it('json sai sem cache e com charset', async () => {
    const r = json({ ok: true })
    expect(r.headers.get('Content-Type')).toContain('application/json')
    expect(r.headers.get('Cache-Control')).toBe('no-store')
    expect(await r.json()).toEqual({ ok: true })
  })
  it('erro sai como { erro }', async () => {
    const r = erro('Algo', 418)
    expect(r.status).toBe(418)
    expect(await r.json()).toEqual({ erro: 'Algo' })
  })
  it('tratar converte ErroHttp e esconde detalhe de erro inesperado', async () => {
    const a = await tratar(async () => {
      throw new ErroHttp('Campo errado', 422)
    })
    expect(a.status).toBe(422)
    expect(await a.json()).toEqual({ erro: 'Campo errado' })

    const silencio = vi.spyOn(console, 'error').mockImplementation(() => {})
    const b = await tratar(async () => {
      throw new Error('SQLITE_ERROR: segredo interno')
    })
    silencio.mockRestore()
    expect(b.status).toBe(500)
    expect(JSON.stringify(await b.json())).not.toContain('SQLITE')
  })
})

describe('idDaRota', () => {
  it('aceita inteiro positivo', () => {
    expect(idDaRota('12')).toBe(12)
    expect(idDaRota(['5'])).toBe(5)
  })
  it.each(['0', '-1', '1.5', 'abc', '1 OR 1=1', undefined])('recusa "%s" com 404', (v) => {
    expect(() => idDaRota(v)).toThrow(expect.objectContaining({ status: 404 }))
  })
})
