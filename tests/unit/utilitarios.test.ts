/**
 * Caixa branca · zip do backup de fotos, senha temporária e nomes de arquivo.
 * RF12 (baixar todas), RF17 (senha temporária).
 */
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { crc32 } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { senhaTemporaria } from '../../functions/_lib/senha'
import { nomeDeArquivo as nomeApi } from '../../functions/api/midias/[id]'
import { montarZip, nomeDeArquivo } from '../../src/admin/zip'

// no Windows, "python3" costuma ser só o atalho da Microsoft Store
const temPython = spawnSync('python3', ['-c', 'print(1)']).stdout?.toString().trim() === '1'

describe('RF12 · zip do "Baixar todas"', () => {
  const arquivos = [
    { nome: 'ola.txt', dados: new TextEncoder().encode('olá, mundo') },
    { nome: 'ação-de-páscoa.webp', dados: new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3]) },
    { nome: 'vazio.jpg', dados: new Uint8Array() },
  ]

  /**
   * Lê o zip de volta byte a byte, pelo diretório central (como os
   * descompactadores fazem), e confere cada arquivo com o CRC-32 do zlib do
   * Node: uma implementação independente da nossa. Sem programa externo, roda
   * igual no Windows, no Linux e no CI.
   */
  function lerZip(b: Uint8Array) {
    const v = new DataView(b.buffer, b.byteOffset, b.byteLength)
    const dec = new TextDecoder()
    const fim = b.length - 22
    expect(v.getUint32(fim, true)).toBe(0x06054b50)
    const total = v.getUint16(fim + 10, true)
    let p = v.getUint32(fim + 16, true)
    const arquivos: { nome: string; dados: Uint8Array; crc: number }[] = []
    for (let i = 0; i < total; i++) {
      expect(v.getUint32(p, true)).toBe(0x02014b50)
      const crc = v.getUint32(p + 16, true)
      const tamanho = v.getUint32(p + 24, true)
      const nomeLen = v.getUint16(p + 28, true)
      const local = v.getUint32(p + 42, true)
      const nome = dec.decode(b.subarray(p + 46, p + 46 + nomeLen))
      expect(v.getUint32(local, true)).toBe(0x04034b50)
      expect(v.getUint16(local + 6, true) & 0x0800).toBe(0x0800) // nome em UTF-8
      const inicio = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true)
      arquivos.push({ nome, crc, dados: b.subarray(inicio, inicio + tamanho) })
      p += 46 + nomeLen
    }
    return arquivos
  }

  it('gera um zip válido: estrutura, nomes em UTF-8 e CRC de cada arquivo', async () => {
    const blob = montarZip(arquivos)
    expect(blob.type).toBe('application/zip')
    const lidos = lerZip(new Uint8Array(await blob.arrayBuffer()))
    expect(lidos.map((a) => [a.nome, a.dados.length])).toEqual([
      ['ola.txt', 11], // 'olá, mundo' em UTF-8
      ['ação-de-páscoa.webp', 7],
      ['vazio.jpg', 0],
    ])
    for (const a of lidos) expect(a.crc, a.nome).toBe(crc32(a.dados))
    expect(new TextDecoder().decode(lidos[0].dados)).toBe('olá, mundo')
  })

  it.skipIf(!temPython)('o Python também abre o zip (conferência extra, quando há Python na máquina)', async () => {
    const pasta = mkdtempSync(path.join(tmpdir(), 'zip-'))
    const caminho = path.join(pasta, 't.zip')
    writeFileSync(caminho, new Uint8Array(await montarZip(arquivos).arrayBuffer()))
    const saida = execFileSync('python3', [
      '-c',
      'import zipfile,sys;print(zipfile.ZipFile(sys.argv[1]).testzip())',
      caminho,
    ]).toString()
    expect(saida.trim()).toBe('None')
  })

  it('zip vazio também é válido', async () => {
    const b = new Uint8Array(await montarZip([]).arrayBuffer())
    expect(b.length).toBe(22)
    expect(new DataView(b.buffer).getUint32(0, true)).toBe(0x06054b50)
  })
})

describe('nomes de arquivo legíveis', () => {
  it.each([
    ['Crianças no Volta às Aulas', 'criancas-no-volta-as-aulas'],
    ['  Ação de Páscoa / 2025!! ', 'acao-de-pascoa-2025'],
    ['', ''],
  ])('"%s" → "%s"', (entrada, esperado) => {
    expect(nomeDeArquivo(entrada)).toBe(esperado)
    // o painel e a API geram o mesmo nome
    expect(nomeApi(entrada)).toBe(esperado)
  })
  it('corta em 60 caracteres', () => {
    expect(nomeDeArquivo('a'.repeat(100))).toHaveLength(60)
  })
})

describe('RF17 · senha temporária', () => {
  it('formato xxxx-xxxx-xxxx, sem caracteres que se confundem', () => {
    for (let i = 0; i < 200; i++) {
      const s = senhaTemporaria()
      expect(s).toMatch(/^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}$/)
      expect(s).not.toMatch(/[01ilo]/)
    }
  })
  it('passa do mínimo de 10 caracteres exigido para senha', () => {
    expect(senhaTemporaria().length).toBeGreaterThanOrEqual(10)
  })
  it('não repete (2000 sorteios)', () => {
    const vistas = new Set(Array.from({ length: 2000 }, senhaTemporaria))
    expect(vistas.size).toBe(2000)
  })
})
