/**
 * Caixa branca · zip do backup de fotos, senha temporária e nomes de arquivo.
 * RF12 (baixar todas), RF17 (senha temporária).
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { senhaTemporaria } from '../../functions/_lib/senha'
import { nomeDeArquivo as nomeApi } from '../../functions/api/midias/[id]'
import { montarZip, nomeDeArquivo } from '../../src/admin/zip'

describe('RF12 · zip do "Baixar todas"', () => {
  const arquivos = [
    { nome: 'ola.txt', dados: new TextEncoder().encode('olá, mundo') },
    { nome: 'ação-de-páscoa.webp', dados: new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3]) },
    { nome: 'vazio.jpg', dados: new Uint8Array() },
  ]

  it('gera um zip válido, que o Python abre e confere o CRC de cada arquivo', async () => {
    const blob = montarZip(arquivos)
    expect(blob.type).toBe('application/zip')
    const pasta = mkdtempSync(path.join(tmpdir(), 'zip-'))
    const caminho = path.join(pasta, 't.zip')
    writeFileSync(caminho, new Uint8Array(await blob.arrayBuffer()))
    const saida = execFileSync('python3', [
      '-c',
      'import zipfile,sys,json;z=zipfile.ZipFile(sys.argv[1]);print(json.dumps([z.testzip(),[(i.filename,i.file_size) for i in z.infolist()],z.read("ola.txt").decode()]))',
      caminho,
    ]).toString()
    const [erro, lista, texto] = JSON.parse(saida)
    expect(erro).toBeNull()
    expect(lista).toEqual([
      ['ola.txt', 11], // 'olá, mundo' em UTF-8
      ['ação-de-páscoa.webp', 7],
      ['vazio.jpg', 0],
    ])
    expect(texto).toBe('olá, mundo')
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
