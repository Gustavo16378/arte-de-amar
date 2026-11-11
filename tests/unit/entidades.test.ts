/**
 * Caixa branca · functions/_lib/entidades.ts
 * RF11 (cadastros), RNF05 (lista fechada de tabelas) e RNF10 (validação).
 */
import { describe, expect, it } from 'vitest'
import { ENTIDADES, camposMudados, entidade, limpar } from '../../functions/_lib/entidades'

const projetoValido = {
  nome: 'Natal Solidário',
  objetivo: 'Brinquedo, roupa e ceia.',
  objetivo_curto: 'Brinquedo e ceia.',
  publico: 'Famílias',
  status: 'Em andamento',
  foto_id: 3,
}

describe('RNF05 · só entidades conhecidas', () => {
  it.each(['projetos', 'marcos', 'membros', 'numeros'])('aceita %s', (nome) => {
    expect(entidade(nome).tabela).toBe(nome)
  })

  it.each(['usuarios', 'midias', 'projetos; DROP TABLE usuarios', '../usuarios', '', undefined])(
    'recusa "%s" com 404',
    (nome) => {
      expect(() => entidade(nome)).toThrow(expect.objectContaining({ status: 404 }))
    },
  )

  it('nenhuma coluna sai do pedido: só as declaradas passam', () => {
    const r = limpar(ENTIDADES.projetos, { ...projetoValido, id: 99, ordem: 5, 'nome; --': 'x', versao: 3 })
    expect(Object.keys(r)).not.toContain('id')
    expect(Object.keys(r)).not.toContain('ordem')
    expect(Object.keys(r)).not.toContain('versao')
    expect(Object.keys(r)).not.toContain('nome; --')
  })
})

describe('RNF10 · validação dos campos', () => {
  const e = ENTIDADES.projetos

  it('aceita um projeto completo e normaliza espaços', () => {
    const r = limpar(e, { ...projetoValido, nome: '  Natal Solidário  ' })
    expect(r.nome).toBe('Natal Solidário')
    expect(r.foto_id).toBe(3)
  })

  it.each(['nome', 'objetivo', 'objetivo_curto', 'publico', 'foto_id'])('exige %s', (campo) => {
    const { [campo]: _, ...resto } = projetoValido as Record<string, unknown>
    expect(() => limpar(e, resto)).toThrow(/Preencha|Escolha/)
  })

  it('projeto criado sem situação nasce "Em andamento"; na edição, nada muda', () => {
    const { status: _, ...semStatus } = projetoValido
    expect(limpar(e, semStatus).status).toBe('Em andamento')
    expect(limpar(e, { nome: 'Outro nome' }, true)).not.toHaveProperty('status')
  })

  it('recusa texto vazio em campo obrigatório', () => {
    expect(() => limpar(e, { ...projetoValido, nome: '   ' })).toThrow(/Preencha o campo "Nome"/)
  })

  it('recusa texto acima do limite', () => {
    expect(() => limpar(e, { ...projetoValido, nome: 'x'.repeat(81) })).toThrow(/80 caracteres/)
    expect(() => limpar(e, { ...projetoValido, nome: 'x'.repeat(80) })).not.toThrow()
  })

  it('status só aceita os dois valores do design', () => {
    expect(() => limpar(e, { ...projetoValido, status: 'Pausado' })).toThrow(/Em andamento ou Concluído/)
  })

  it('número tem que ser inteiro e respeitar o mínimo', () => {
    const meta = { meta_total: 10, meta_unidade: 'cestas' }
    expect(() => limpar(e, { ...projetoValido, ...meta, meta_feito: 2.5 })).toThrow(/inteiro/)
    expect(() => limpar(e, { ...projetoValido, ...meta, meta_feito: -1 })).toThrow(/menor que 0/)
    expect(limpar(e, { ...projetoValido, ...meta, meta_feito: '4' }).meta_feito).toBe(4)
  })

  it('link de vídeo só https', () => {
    expect(() => limpar(e, { ...projetoValido, video_url: 'javascript:alert(1)' })).toThrow(/https/)
    expect(() => limpar(e, { ...projetoValido, video_url: 'http://youtube.com/x' })).toThrow(/https/)
    expect(() => limpar(e, { ...projetoValido, video_url: 'não é link' })).toThrow(/link completo/)
    expect(limpar(e, { ...projetoValido, video_url: 'https://youtu.be/abc' }).video_url).toBe('https://youtu.be/abc')
    expect(limpar(e, { ...projetoValido, video_url: '' }).video_url).toBeNull()
  })

  it('booleanos viram 0 ou 1', () => {
    expect(limpar(e, { ...projetoValido, visivel: true }).visivel).toBe(1)
    expect(limpar(e, { ...projetoValido, visivel: '1' }).visivel).toBe(1)
    expect(limpar(e, { ...projetoValido, visivel: false }).visivel).toBe(0)
    expect(limpar(e, { ...projetoValido, visivel: 'sim' }).visivel).toBe(0)
  })

  it('foto precisa ser um id positivo', () => {
    expect(() => limpar(e, { ...projetoValido, foto_id: 0 })).toThrow(/Foto inválida/)
    expect(() => limpar(e, { ...projetoValido, foto_id: 'abc' })).toThrow(/Foto inválida/)
  })

  it('retrato da diretoria é opcional', () => {
    expect(limpar(ENTIDADES.membros, { nome: 'Ana', cargo: 'Secretária', foto_id: null }).foto_id).toBeNull()
  })
})

describe('RNF10 · regra da meta (três campos juntos)', () => {
  const e = ENTIDADES.projetos
  it('sem meta passa', () => {
    expect(() => limpar(e, projetoValido)).not.toThrow()
  })
  it('meta completa passa', () => {
    expect(() => limpar(e, { ...projetoValido, meta_feito: 1, meta_total: 2, meta_unidade: 'x' })).not.toThrow()
  })
  it.each([
    { meta_feito: 1 },
    { meta_total: 2 },
    { meta_unidade: 'x' },
    { meta_feito: 1, meta_total: 2 },
  ])('meta pela metade é recusada %o', (meta) => {
    expect(() => limpar(e, { ...projetoValido, ...meta })).toThrow(/três campos da meta/)
  })
  it('no PUT parcial a regra não roda (a rota valida o registro mesclado)', () => {
    expect(() => limpar(e, { meta_feito: 5 }, true)).not.toThrow()
  })
})

describe('RF19 · campos alterados, para a auditoria', () => {
  const e = ENTIDADES.projetos
  it('lista só o que mudou, com o rótulo em português', () => {
    const antes = { nome: 'A', status: 'Concluído', visivel: 1 }
    expect(camposMudados(e, antes, { nome: 'B', status: 'Concluído' })).toEqual(['Nome'])
  })
  it('mostrar e esconder viram frases', () => {
    expect(camposMudados(e, { visivel: 1 }, { visivel: 0 })).toEqual(['escondeu do site'])
    expect(camposMudados(e, { visivel: 0 }, { visivel: 1 })).toEqual(['mostrou no site'])
  })
  it('nada mudou, lista vazia', () => {
    expect(camposMudados(e, { nome: 'A' }, { nome: 'A' })).toEqual([])
  })
})

describe('nomes legíveis para a auditoria', () => {
  it('cada entidade sabe se nomear', () => {
    expect(ENTIDADES.projetos.nomear({ nome: 'Volta às Aulas' })).toBe('Volta às Aulas')
    expect(ENTIDADES.marcos.nomear({ ano: '2015', titulo: 'A fundação' })).toBe('2015 · A fundação')
    expect(ENTIDADES.membros.nomear({ nome: 'Aline', cargo: 'Presidente' })).toBe('Aline (Presidente)')
    expect(ENTIDADES.numeros.nomear({ valor: 40, sufixo: '+', label: 'campanhas' })).toBe('40+ campanhas')
  })
})
