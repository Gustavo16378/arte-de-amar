/**
 * O que cada lista do painel mostra e quais campos o formulário tem.
 * Os nomes dos campos são as colunas do banco (functions/_lib/entidades.ts);
 * a validação de verdade é a do servidor, aqui é só a forma do formulário.
 */

export type CampoForm =
  | { nome: string; tipo: 'texto'; rotulo: string; dica?: string; max: number; obrigatorio?: boolean }
  | { nome: string; tipo: 'area'; rotulo: string; dica?: string; max: number; obrigatorio?: boolean }
  | { nome: string; tipo: 'numero'; rotulo: string; dica?: string; obrigatorio?: boolean }
  | { nome: string; tipo: 'opcao'; rotulo: string; valores: string[] }
  | { nome: string; tipo: 'foto'; rotulo: string; obrigatorio?: boolean; posicao?: string }
  | { nome: string; tipo: 'url'; rotulo: string; dica?: string }
  | { nome: string; tipo: 'bool'; rotulo: string; dica?: string }

export type Grupo = { titulo?: string; dica?: string; campos: CampoForm[]; lado?: boolean }

export type ConfigEntidade = {
  rota: 'projetos' | 'marcos' | 'membros' | 'numeros'
  titulo: string
  singular: string
  /** artigo para "Novo projeto" / "Nova campanha" */
  novo: string
  descricao: string
  /** onde isso aparece no site, para a diretoria se localizar */
  secao: string
  rotuloItem: (r: Record<string, unknown>) => string
  detalheItem: (r: Record<string, unknown>) => string
  grupos: Grupo[]
  vazio: Record<string, unknown>
}

const visivel: CampoForm = {
  nome: 'visivel',
  tipo: 'bool',
  rotulo: 'Mostrar no site',
  dica: 'Desmarque para esconder sem apagar.',
}

export const ENTIDADES: ConfigEntidade[] = [
  {
    rota: 'projetos',
    titulo: 'Projetos',
    singular: 'projeto',
    novo: 'Novo projeto',
    descricao: 'As campanhas da seção "Nossos projetos". A ordem aqui é a ordem no site.',
    secao: '#projetos',
    rotuloItem: (r) => String(r.nome ?? ''),
    // sem situação: as campanhas se repetem todo ano (a API grava 'Em andamento')
    detalheItem: (r) => (r.meta_total ? `meta ${r.meta_feito ?? 0} de ${r.meta_total} ${r.meta_unidade ?? ''}` : ''),
    vazio: { visivel: 1, foto_posicao: '50% 50%' },
    grupos: [
      {
        campos: [
          { nome: 'nome', tipo: 'texto', rotulo: 'Nome da campanha', max: 80, obrigatorio: true },
          { nome: 'publico', tipo: 'texto', rotulo: 'Para quem', dica: 'Ex.: Crianças de 2 a 12 anos', max: 80, obrigatorio: true },
        ],
      },
      {
        campos: [
          { nome: 'foto_id', tipo: 'foto', rotulo: 'Foto', obrigatorio: true, posicao: 'foto_posicao' },
        ],
      },
      {
        campos: [
          { nome: 'objetivo', tipo: 'area', rotulo: 'Objetivo', dica: 'Aparece no computador.', max: 400, obrigatorio: true },
          { nome: 'objetivo_curto', tipo: 'area', rotulo: 'Objetivo curto', dica: 'Aparece no celular. Uma frase.', max: 200, obrigatorio: true },
        ],
      },
      {
        titulo: 'Meta',
        dica: 'Opcional. Com os três campos preenchidos, o card ganha a barra de progresso.',
        lado: true,
        campos: [
          { nome: 'meta_feito', tipo: 'numero', rotulo: 'Já feito' },
          { nome: 'meta_total', tipo: 'numero', rotulo: 'Total' },
          { nome: 'meta_unidade', tipo: 'texto', rotulo: 'Unidade', dica: 'crianças, mochilas…', max: 30 },
        ],
      },
      {
        titulo: 'Depoimento',
        campos: [
          { nome: 'depoimento', tipo: 'area', rotulo: 'Frase', max: 300 },
          { nome: 'autor', tipo: 'texto', rotulo: 'Quem disse', dica: 'Ex.: Mãe atendida, 2025', max: 80 },
        ],
      },
      {
        campos: [
          { nome: 'video_url', tipo: 'url', rotulo: 'Vídeo da campanha', dica: 'Link do YouTube ou do Instagram. Opcional.' },
          visivel,
        ],
      },
    ],
  },
  {
    rota: 'marcos',
    titulo: 'Linha do tempo',
    singular: 'marco',
    novo: 'Novo marco',
    descricao: 'Os marcos da seção "Nossa história", do mais antigo para o mais novo.',
    secao: '#historia',
    rotuloItem: (r) => `${r.ano} · ${r.titulo}`,
    detalheItem: (r) => (r.so_desktop ? 'só no computador' : String(r.texto ?? '')),
    vazio: { visivel: 1, so_desktop: 0, foto_posicao: '50% 50%' },
    grupos: [
      {
        lado: true,
        campos: [
          { nome: 'ano', tipo: 'texto', rotulo: 'Ano', dica: 'Ex.: 2026 ou Hoje', max: 10, obrigatorio: true },
          { nome: 'titulo', tipo: 'texto', rotulo: 'Título', max: 60, obrigatorio: true },
        ],
      },
      {
        campos: [
          { nome: 'foto_id', tipo: 'foto', rotulo: 'Foto', obrigatorio: true, posicao: 'foto_posicao' },
          { nome: 'texto', tipo: 'area', rotulo: 'Texto curto', dica: 'Aparece no celular.', max: 200, obrigatorio: true },
          { nome: 'texto_desktop', tipo: 'area', rotulo: 'Texto longo', dica: 'Aparece no computador.', max: 300, obrigatorio: true },
          { nome: 'so_desktop', tipo: 'bool', rotulo: 'Mostrar só no computador', dica: 'Como o marco "Hoje", que fecha a linha do tempo.' },
          visivel,
        ],
      },
    ],
  },
  {
    rota: 'membros',
    titulo: 'Diretoria',
    singular: 'pessoa',
    novo: 'Nova pessoa',
    descricao: 'Quem aparece na seção "Diretoria". Sem retrato, o site mostra a moldura com o cargo.',
    secao: '#diretoria',
    rotuloItem: (r) => String(r.nome ?? ''),
    detalheItem: (r) => String(r.cargo ?? ''),
    vazio: { visivel: 1 },
    grupos: [
      {
        campos: [
          { nome: 'nome', tipo: 'texto', rotulo: 'Nome', max: 60, obrigatorio: true },
          { nome: 'cargo', tipo: 'texto', rotulo: 'Cargo', max: 60, obrigatorio: true },
          { nome: 'foto_id', tipo: 'foto', rotulo: 'Retrato' },
          visivel,
        ],
      },
    ],
  },
  {
    rota: 'numeros',
    titulo: 'Números',
    singular: 'número',
    novo: 'Novo número',
    descricao: 'Os números de impacto logo abaixo da abertura do site.',
    secao: '#inicio',
    rotuloItem: (r) => `${r.valor}${r.sufixo ?? ''}`,
    detalheItem: (r) => String(r.label ?? ''),
    vazio: { visivel: 1, sufixo: '' },
    grupos: [
      {
        lado: true,
        campos: [
          { nome: 'valor', tipo: 'numero', rotulo: 'Valor', obrigatorio: true },
          { nome: 'sufixo', tipo: 'texto', rotulo: 'Sufixo', dica: 'Ex.: +', max: 3 },
        ],
      },
      {
        campos: [
          { nome: 'label', tipo: 'texto', rotulo: 'Legenda', dica: 'Ex.: crianças atendidas', max: 40, obrigatorio: true },
          visivel,
        ],
      },
    ],
  },
]
