/**
 * Caixa preta + cinza · formulário "Ser voluntário" e lista no painel
 * (RF04, RF15, RNF07, RNF09).
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { Voluntario } from '../contratos'
import { Cliente, banco, diretoria, ultimaAuditoria } from './cliente'

let painel: Cliente
beforeAll(async () => {
  painel = await diretoria()
})

const inscrever = (ip: string, corpo: Record<string, string>) => new Cliente(ip).post('/api/voluntarios', corpo)

describe('RF04 · inscrição pelo site', () => {
  it('guarda o contato e normaliza o telefone', async () => {
    const r = await inscrever('10.1.0.1', { nome: '  Maria Souza ', whatsapp: '(63) 98877-6655', como: 'Natal Solidário', site: '' })
    expect(r.status).toBe(201)
    const b = banco()
    const v = b.um<{ nome: string; whatsapp: string; status: string }>(
      `SELECT nome, whatsapp, status FROM voluntarios WHERE nome = 'Maria Souza'`,
    )
    b.fechar()
    expect(v).toEqual({ nome: 'Maria Souza', whatsapp: '63988776655', status: 'novo' })
  })

  it.each([
    ['nome curto', { nome: 'A', whatsapp: '63988776655' }],
    ['telefone sem DDD', { nome: 'Ana', whatsapp: '98877' }],
    ['telefone gigante', { nome: 'Ana', whatsapp: '1'.repeat(20) }],
    ['mensagem gigante', { nome: 'Ana', whatsapp: '63988776655', como: 'x'.repeat(501) }],
  ])('recusa %s com mensagem', async (_, corpo) => {
    const r = await inscrever('10.1.0.2', corpo as Record<string, string>)
    expect(r.status).toBe(400)
    expect(r.corpo.erro).toBeTruthy()
  })

  it('RNF07 · robô que preenche o campo-isca recebe "ok", mas nada é gravado', async () => {
    const r = await inscrever('10.1.0.3', { nome: 'Robô Spam', whatsapp: '63911112222', site: 'http://spam.com' })
    expect(r.status).toBe(201)
    const b = banco()
    const n = b.um<{ n: number }>(`SELECT COUNT(*) AS n FROM voluntarios WHERE nome = 'Robô Spam'`)
    b.fechar()
    expect(n.n).toBe(0)
  })

  it('RNF07 · no máximo 5 inscrições por hora vindas do mesmo IP', async () => {
    const ip = '10.1.0.4'
    for (let i = 0; i < 5; i++) {
      expect((await inscrever(ip, { nome: `Pessoa ${i}`, whatsapp: '63900000000' })).status).toBe(201)
    }
    const r = await inscrever(ip, { nome: 'Pessoa 6', whatsapp: '63900000000' })
    expect(r.status).toBe(429)
    // outro IP continua conseguindo
    expect((await inscrever('10.1.0.5', { nome: 'Outra', whatsapp: '63900000001' })).status).toBe(201)
  })
})

describe('RF15 · voluntários no painel', () => {
  it('lista no contrato, novos primeiro', async () => {
    const r = await painel.get('/api/admin/voluntarios')
    expect(r.status).toBe(200)
    for (const v of r.corpo.itens) expect(() => Voluntario.parse(v)).not.toThrow()
    expect(r.corpo.itens[0].status).toBe('novo')
  })

  it('marca como chamado e arquiva, com auditoria', async () => {
    const v = (await painel.get('/api/admin/voluntarios')).corpo.itens.find((x: { nome: string }) => x.nome === 'Maria Souza')
    expect((await painel.put(`/api/admin/voluntarios/${v.id}`, { status: 'contatado' })).status).toBe(200)
    expect(ultimaAuditoria()).toMatchObject({ area: 'voluntarios', alvo: 'Maria Souza', detalhe: 'marcou como já chamado' })
    expect((await painel.put(`/api/admin/voluntarios/${v.id}`, { status: 'sumido' })).status).toBe(400)
  })

  it('RNF09 · "apagar todos os arquivados" apaga só os arquivados, de uma vez', async () => {
    const itens = (await painel.get('/api/admin/voluntarios')).corpo.itens.filter((x: { nome: string }) => x.nome.startsWith('Pessoa'))
    for (const v of itens) await painel.put(`/api/admin/voluntarios/${v.id}`, { status: 'arquivado' })
    const antes = (await painel.get('/api/admin/voluntarios')).corpo.itens.length
    const r = await painel.del('/api/admin/voluntarios')
    expect(r.corpo.apagados).toBe(itens.length)
    expect((await painel.get('/api/admin/voluntarios')).corpo.itens).toHaveLength(antes - itens.length)
    expect(ultimaAuditoria().alvo).toBe(`${itens.length} contatos arquivados`)
  })

  it('apaga um contato; de novo dá 404', async () => {
    const v = (await painel.get('/api/admin/voluntarios')).corpo.itens[0]
    expect((await painel.del(`/api/admin/voluntarios/${v.id}`)).status).toBe(200)
    expect((await painel.del(`/api/admin/voluntarios/${v.id}`)).status).toBe(404)
  })
})
