/**
 * Caixa cinza · duas pessoas no painel ao mesmo tempo (RNF08, RNF09).
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { Cliente, banco, diretoria } from './cliente'

let aline: Cliente
let larissa: Cliente

beforeAll(async () => {
  aline = await diretoria()
  larissa = await diretoria()
})

const abrir = async (c: Cliente, id: number) =>
  (await c.get('/api/admin/projetos')).corpo.itens.find((p: { id: number }) => p.id === id)

describe('RNF08 · mesmo item', () => {
  it('quem salva com a versão velha recebe 409 dizendo quem salvou antes, e nada é sobrescrito', async () => {
    const aberto = await abrir(aline, 2)
    // as duas abriram o mesmo projeto
    const r1 = await aline.put('/api/admin/projetos/2', { autor: 'Autor da Aline', versao: aberto.versao })
    expect(r1.status).toBe(200)
    const r2 = await larissa.put('/api/admin/projetos/2', { depoimento: '“Da Larissa”', versao: aberto.versao })
    expect(r2.status).toBe(409)
    expect(r2.corpo.erro).toMatch(/Diretoria Teste salvou uma mudança/)
    const agora = await abrir(aline, 2)
    expect(agora.autor).toBe('Autor da Aline')
    expect(agora.depoimento).not.toBe('“Da Larissa”')
  })

  it('reabrindo (versão nova), a segunda pessoa salva normalmente', async () => {
    const aberto = await abrir(larissa, 2)
    expect((await larissa.put('/api/admin/projetos/2', { depoimento: '“Da Larissa”', versao: aberto.versao })).status).toBe(200)
  })

  it('dez gravações simultâneas com a mesma versão: exatamente uma vence', async () => {
    const { versao } = await abrir(aline, 3)
    const tentativas = await Promise.all(
      Array.from({ length: 10 }, (_, i) => (i % 2 ? aline : larissa).put('/api/admin/projetos/3', { autor: `Corrida ${i}`, versao })),
    )
    const ok = tentativas.filter((t) => t.status === 200)
    const conflito = tentativas.filter((t) => t.status === 409)
    expect(ok).toHaveLength(1)
    expect(conflito).toHaveLength(9)
    const b = banco()
    const p = b.um<{ versao: number; autor: string }>('SELECT versao, autor FROM projetos WHERE id = 3')
    b.fechar()
    expect(p.versao).toBe(versao + 1)
    expect(p.autor).toBe(ok[0].corpo.item.autor)
  })
})

describe('RNF08 · itens diferentes ao mesmo tempo', () => {
  it('as duas gravações entram', async () => {
    const [a, b] = await Promise.all([abrir(aline, 4), abrir(larissa, 5)])
    const [r1, r2] = await Promise.all([
      aline.put('/api/admin/projetos/4', { autor: 'Aline no 4', versao: a.versao }),
      larissa.put('/api/admin/projetos/5', { autor: 'Larissa no 5', versao: b.versao }),
    ])
    expect([r1.status, r2.status]).toEqual([200, 200])
    expect((await abrir(aline, 4)).autor).toBe('Aline no 4')
    expect((await abrir(aline, 5)).autor).toBe('Larissa no 5')
  })

  it('textos: campos diferentes da mesma seção, salvos ao mesmo tempo, ficam os dois', async () => {
    await Promise.all([
      aline.put('/api/admin/textos', { valores: { 'historia.titulo': 'Título da |Aline|' } }),
      larissa.put('/api/admin/textos', { valores: { 'historia.frase': 'Frase da Larissa' } }),
    ])
    const v = (await aline.get('/api/admin/textos')).corpo.valores
    expect(v).toMatchObject({ 'historia.titulo': 'Título da |Aline|', 'historia.frase': 'Frase da Larissa' })
    await aline.put('/api/admin/textos', { valores: { 'historia.titulo': null, 'historia.frase': null } })
  })

  it('o interruptor "No site" não exige versão (vale o último), e devolve a versão nova', async () => {
    const antes = await abrir(aline, 6)
    const r = await aline.put('/api/admin/projetos/6', { visivel: 0 })
    expect(r.corpo.item.versao).toBe(antes.versao + 1)
    await aline.put('/api/admin/projetos/6', { visivel: 1 })
  })
})
