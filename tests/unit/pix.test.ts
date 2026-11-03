/**
 * Caixa branca · src/lib/pix.ts (RF21): o BR Code do PIX gerado da chave.
 * O caso do Banco Central é o vetor oficial do Manual de Padrões do Pix.
 */
import { describe, expect, it } from 'vitest'
import { crc16, montarPix, normalizarChave, pixDaOng } from '../../src/lib/pix'

/** separa o payload EMV em { id: valor }, como o app do banco faz */
function ler(payload: string) {
  const campos: Record<string, string> = {}
  for (let i = 0; i < payload.length; ) {
    const id = payload.slice(i, i + 2)
    const tam = Number(payload.slice(i + 2, i + 4))
    campos[id] = payload.slice(i + 4, i + 4 + tam)
    i += 4 + tam
  }
  return campos
}

describe('RF21 · CRC16 e o exemplo oficial do Banco Central', () => {
  it('CRC16-CCITT bate com o valor de verificação padrão ("123456789" → 29B1)', () => {
    expect(crc16('123456789')).toBe('29B1')
  })

  it('reproduz o payload do manual do Pix, caractere por caractere', () => {
    expect(montarPix({ chave: '123e4567-e12b-12d1-a456-426655440000', nome: 'Fulano de Tal', cidade: 'BRASILIA' })).toBe(
      '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D',
    )
  })
})

describe('RF21 · chave no formato que o BCB exige', () => {
  it.each([
    ['40.019.106/0001-51', '40019106000151'],
    ['400.191.060-00', '40019106000'],
    ['(63) 98877-6655', '+5563988776655'],
    ['+55 63 98877-6655', '+5563988776655'],
    ['Contato@ArteDeAmar.org', 'contato@artedeamar.org'],
    ['123E4567-E12B-12D1-A456-426655440000', '123e4567-e12b-12d1-a456-426655440000'],
  ])('%s → %s', (entrada, esperado) => {
    expect(normalizarChave(entrada)).toBe(esperado)
  })
})

describe('RF21 · PIX da ONG', () => {
  const payload = pixDaOng('40.019.106/0001-51')
  const c = ler(payload)

  it('tem todos os campos obrigatórios, sem valor fixo', () => {
    expect(c['00']).toBe('01')
    expect(c['52']).toBe('0000')
    expect(c['53']).toBe('986')
    expect(c['58']).toBe('BR')
    expect(c['54']).toBeUndefined() // quem doa escolhe o valor
  })

  it('a conta aponta para a chave CNPJ da ONG', () => {
    expect(ler(c['26'])).toEqual({ '00': 'br.gov.bcb.pix', '01': '40019106000151' })
  })

  it('nome e cidade sem acento e dentro do limite', () => {
    expect(c['59']).toBe('OSC Arte de Amar')
    expect(c['60']).toBe('Palmas')
    const longo = ler(montarPix({ chave: 'x@y.com', nome: 'Organização da Sociedade Civil Arte de Amar', cidade: 'São José do Rio Preto' }))
    expect(longo['59']).toHaveLength(25)
    expect(longo['59']).not.toMatch(/[^\x20-\x7e]/)
    expect(longo['60']).toHaveLength(15)
    expect(longo['60'].startsWith('Sao Jose')).toBe(true)
  })

  it('o CRC do fim confere com o resto do payload', () => {
    expect(payload.slice(-8, -4)).toBe('6304')
    expect(payload.slice(-4)).toBe(crc16(payload.slice(0, -4)))
  })

  it('mudar a chave muda o CRC (o app do banco recusaria um código adulterado)', () => {
    expect(pixDaOng('40.019.106/0001-52').slice(-4)).not.toBe(payload.slice(-4))
  })
})
