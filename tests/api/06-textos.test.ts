/**
 * Caixa preta + cinza · textos e fotos fixos do site (RF06, RF14).
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { Cliente, banco, diretoria, ultimaAuditoria } from './cliente'

let painel: Cliente
const site = new Cliente()
beforeAll(async () => {
  painel = await diretoria()
})

describe('RF14 · editar textos', () => {
  it('grava, o site recebe e a auditoria agrupa por seção', async () => {
    const r = await painel.put('/api/admin/textos', {
      valores: { 'hero.titulo': 'Linha 1\nLinha |2|', 'hero.subtitulo': 'Novo subtítulo', 'footer.frase': 'Rodapé novo.' },
    })
    expect(r.status).toBe(200)
    const { textos } = (await site.get('/api/conteudo')).corpo
    expect(textos).toMatchObject({ 'hero.titulo': 'Linha 1\nLinha |2|', 'hero.subtitulo': 'Novo subtítulo', 'footer.frase': 'Rodapé novo.' })
    const b = banco()
    const log = b.todos<{ alvo: string; detalhe: string }>(
      `SELECT alvo, detalhe FROM auditoria WHERE area = 'textos' ORDER BY id DESC LIMIT 2`,
    )
    b.fechar()
    expect(log.map((l) => l.alvo).sort()).toEqual(['Abertura', 'Rodapé'])
    expect(log.find((l) => l.alvo === 'Abertura')!.detalhe).toBe('Título, Subtítulo')
  })

  it('foto de seção chega ao site já como objeto de foto', async () => {
    await painel.put('/api/admin/textos', { valores: { 'hero.foto': '2' } })
    const { textos } = (await site.get('/api/conteudo')).corpo
    expect(textos['hero.foto']).toMatchObject({ src: expect.stringMatching(/^\/assets\/fotos\//), largura: expect.any(Number) })
    expect(ultimaAuditoria().detalhe).toBe('trocou foto da abertura')
  })

  it('null volta ao original (a linha sai do banco)', async () => {
    await painel.put('/api/admin/textos', {
      valores: { 'hero.titulo': null, 'hero.subtitulo': null, 'footer.frase': null, 'hero.foto': null },
    })
    expect((await site.get('/api/conteudo')).corpo.textos).toEqual({})
    expect(ultimaAuditoria().detalhe).toMatch(/voltou ao original/)
  })

  it('normaliza: linhas vazias somem, quebra de linha em campo de uma linha vira espaço', async () => {
    await painel.put('/api/admin/textos', { valores: { 'hero.titulo': '  A  \r\n\r\n  B ', 'hero.ctaPrimario': 'Quero\najudar' } })
    expect((await painel.get('/api/admin/textos')).corpo.valores).toMatchObject({ 'hero.titulo': 'A\nB', 'hero.ctaPrimario': 'Quero ajudar' })
    await painel.put('/api/admin/textos', { valores: { 'hero.titulo': null, 'hero.ctaPrimario': null } })
  })

  it.each([
    ['chave que não existe', { 'hero.qualquer': 'x' }, /desconhecido/],
    ['texto acima do limite', { 'hero.ctaPrimario': 'x'.repeat(31) }, /30 caracteres/],
    ['linhas demais no título', { 'hero.titulo': 'a\nb\nc\nd' }, /3 linhas/],
    ['foto que não existe', { 'hero.foto': '99999' }, /não existe mais/],
    ['foto com id inválido', { 'hero.foto': 'abc' }, /inválida/],
    ['texto que não é texto', { 'hero.subtitulo': 42 }, /texto/],
  ])('recusa %s', async (_, valores, mensagem) => {
    const r = await painel.put('/api/admin/textos', { valores })
    expect(r.status).toBe(400)
    expect(r.corpo.erro).toMatch(mensagem)
  })

  it('RNF09 · um campo inválido no meio barra o pacote inteiro (nada é gravado pela metade)', async () => {
    const r = await painel.put('/api/admin/textos', { valores: { 'hero.subtitulo': 'Válido', 'hero.ctaPrimario': 'x'.repeat(99) } })
    expect(r.status).toBe(400)
    expect((await painel.get('/api/admin/textos')).corpo.valores['hero.subtitulo']).toBeUndefined()
  })
})
