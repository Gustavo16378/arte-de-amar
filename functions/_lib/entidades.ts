/**
 * As quatro coisas que a diretoria edita como lista: projetos, linha do
 * tempo, diretoria e números. Todas têm o mesmo ciclo (listar, criar,
 * editar, apagar, reordenar), então a regra de cada campo mora aqui e as
 * rotas de /api/admin/[entidade] são uma só.
 *
 * Nenhum nome de tabela ou coluna vem do usuário: tudo sai desta lista
 * fechada, e os valores vão sempre por bind.
 */
import { ErroHttp } from './http'

type Campo =
  | { tipo: 'texto'; obrigatorio?: boolean; max: number; rotulo: string }
  | { tipo: 'inteiro'; obrigatorio?: boolean; min?: number; rotulo: string }
  | { tipo: 'bool'; rotulo: string }
  | { tipo: 'foto'; obrigatorio?: boolean; rotulo: string }
  | { tipo: 'opcao'; valores: string[]; rotulo: string }
  | { tipo: 'url'; rotulo: string }

export type Entidade = {
  tabela: string
  nome: string
  campos: Record<string, Campo>
  /** regra que envolve mais de um campo */
  validar?: (dados: Record<string, unknown>) => void
}

const visivel: Campo = { tipo: 'bool', rotulo: 'Visível no site' }
const posicao: Campo = { tipo: 'texto', max: 20, rotulo: 'Enquadramento da foto' }

export const ENTIDADES: Record<string, Entidade> = {
  projetos: {
    tabela: 'projetos',
    nome: 'projeto',
    campos: {
      nome: { tipo: 'texto', obrigatorio: true, max: 80, rotulo: 'Nome' },
      objetivo: { tipo: 'texto', obrigatorio: true, max: 400, rotulo: 'Objetivo' },
      objetivo_curto: { tipo: 'texto', obrigatorio: true, max: 200, rotulo: 'Objetivo curto' },
      publico: { tipo: 'texto', obrigatorio: true, max: 80, rotulo: 'Público' },
      status: { tipo: 'opcao', valores: ['Em andamento', 'Concluído'], rotulo: 'Status' },
      foto_id: { tipo: 'foto', obrigatorio: true, rotulo: 'Foto' },
      foto_posicao: posicao,
      meta_feito: { tipo: 'inteiro', min: 0, rotulo: 'Meta: quanto já foi feito' },
      meta_total: { tipo: 'inteiro', min: 1, rotulo: 'Meta: total' },
      meta_unidade: { tipo: 'texto', max: 30, rotulo: 'Meta: unidade' },
      depoimento: { tipo: 'texto', max: 300, rotulo: 'Depoimento' },
      autor: { tipo: 'texto', max: 80, rotulo: 'Autor do depoimento' },
      video_url: { tipo: 'url', rotulo: 'Vídeo' },
      visivel,
    },
    validar(d) {
      const preenchidos = [d.meta_feito, d.meta_total, d.meta_unidade].filter((v) => v != null && v !== "").length
      if (preenchidos !== 0 && preenchidos !== 3) {
        throw new ErroHttp('Para ter meta, preencha os três campos da meta (feito, total e unidade).')
      }
    },
  },
  marcos: {
    tabela: 'marcos',
    nome: 'marco',
    campos: {
      ano: { tipo: 'texto', obrigatorio: true, max: 10, rotulo: 'Ano' },
      titulo: { tipo: 'texto', obrigatorio: true, max: 60, rotulo: 'Título' },
      texto: { tipo: 'texto', obrigatorio: true, max: 200, rotulo: 'Texto curto' },
      texto_desktop: { tipo: 'texto', obrigatorio: true, max: 300, rotulo: 'Texto longo' },
      foto_id: { tipo: 'foto', obrigatorio: true, rotulo: 'Foto' },
      foto_posicao: posicao,
      so_desktop: { tipo: 'bool', rotulo: 'Só no computador' },
      visivel,
    },
  },
  membros: {
    tabela: 'membros',
    nome: 'membro',
    campos: {
      nome: { tipo: 'texto', obrigatorio: true, max: 60, rotulo: 'Nome' },
      cargo: { tipo: 'texto', obrigatorio: true, max: 60, rotulo: 'Cargo' },
      foto_id: { tipo: 'foto', rotulo: 'Retrato' },
      visivel,
    },
  },
  numeros: {
    tabela: 'numeros',
    nome: 'número',
    campos: {
      valor: { tipo: 'inteiro', obrigatorio: true, min: 0, rotulo: 'Valor' },
      sufixo: { tipo: 'texto', max: 3, rotulo: 'Sufixo' },
      label: { tipo: 'texto', obrigatorio: true, max: 40, rotulo: 'Legenda' },
      visivel,
    },
  },
}

export function entidade(nome: string | string[] | undefined): Entidade {
  const chave = Array.isArray(nome) ? nome[0] : nome
  const e = chave ? ENTIDADES[chave] : undefined
  if (!e) throw new ErroHttp('Recurso não encontrado.', 404)
  return e
}

/**
 * Confere e normaliza o que veio do painel.
 * `parcial` (no PUT) aceita mandar só alguns campos.
 */
export function limpar(e: Entidade, bruto: Record<string, unknown>, parcial = false) {
  const saida: Record<string, string | number | null> = {}

  for (const [coluna, campo] of Object.entries(e.campos)) {
    if (!(coluna in bruto)) {
      if (parcial) continue
      if ('obrigatorio' in campo && campo.obrigatorio) throw new ErroHttp(`Preencha o campo "${campo.rotulo}".`)
      continue
    }

    let v = bruto[coluna]
    if (typeof v === 'string') v = v.trim()
    const vazio = v === null || v === undefined || v === ''

    switch (campo.tipo) {
      case 'texto':
        if (vazio) {
          if (campo.obrigatorio) throw new ErroHttp(`Preencha o campo "${campo.rotulo}".`)
          saida[coluna] = e.tabela === 'projetos' && coluna === 'meta_unidade' ? null : ''
          break
        }
        if (typeof v !== 'string') throw new ErroHttp(`"${campo.rotulo}" precisa ser texto.`)
        if (v.length > campo.max) throw new ErroHttp(`"${campo.rotulo}" passa de ${campo.max} caracteres.`)
        saida[coluna] = v
        break

      case 'inteiro': {
        if (vazio) {
          if (campo.obrigatorio) throw new ErroHttp(`Preencha o campo "${campo.rotulo}".`)
          saida[coluna] = null
          break
        }
        const n = Number(v)
        if (!Number.isInteger(n)) throw new ErroHttp(`"${campo.rotulo}" precisa ser um número inteiro.`)
        if (campo.min !== undefined && n < campo.min) throw new ErroHttp(`"${campo.rotulo}" não pode ser menor que ${campo.min}.`)
        saida[coluna] = n
        break
      }

      case 'foto': {
        if (vazio) {
          if (campo.obrigatorio) throw new ErroHttp(`Escolha uma foto para "${campo.rotulo}".`)
          saida[coluna] = null
          break
        }
        const n = Number(v)
        if (!Number.isInteger(n) || n <= 0) throw new ErroHttp(`Foto inválida em "${campo.rotulo}".`)
        saida[coluna] = n
        break
      }

      case 'bool':
        saida[coluna] = v === true || v === 1 || v === '1' ? 1 : 0
        break

      case 'opcao':
        if (typeof v !== 'string' || !campo.valores.includes(v)) {
          throw new ErroHttp(`"${campo.rotulo}" precisa ser: ${campo.valores.join(' ou ')}.`)
        }
        saida[coluna] = v
        break

      case 'url': {
        if (vazio) {
          saida[coluna] = null
          break
        }
        let url: URL
        try {
          url = new URL(String(v))
        } catch {
          throw new ErroHttp(`"${campo.rotulo}" precisa ser um link completo, começando com https://.`)
        }
        if (url.protocol !== 'https:') throw new ErroHttp(`"${campo.rotulo}" precisa começar com https://.`)
        saida[coluna] = url.toString()
        break
      }
    }
  }

  e.validar?.({ ...saida })
  return saida
}

/** Garante que as fotos citadas existem, com uma mensagem clara em vez de erro de chave estrangeira. */
export async function conferirFotos(db: D1Database, e: Entidade, dados: Record<string, unknown>) {
  for (const [coluna, campo] of Object.entries(e.campos)) {
    if (campo.tipo !== 'foto' || dados[coluna] == null) continue
    const achou = await db.prepare('SELECT 1 FROM midias WHERE id = ?').bind(dados[coluna]).first()
    if (!achou) throw new ErroHttp(`A foto escolhida em "${campo.rotulo}" não existe mais.`)
  }
}
