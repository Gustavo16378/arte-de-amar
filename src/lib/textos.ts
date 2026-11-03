/**
 * Os textos e fotos fixos do site que a diretoria pode trocar pela aba
 * "Textos do site" do painel.
 *
 * Cada campo tem uma chave estável, gravada na tabela `textos`. `ler` devolve
 * o valor atual (o do código, até alguém mudar) e `gravar` aplica o valor
 * salvo no banco antes do primeiro render. Campo sem linha no banco fica com
 * o texto original do design.
 *
 * Esta lista é a única fonte: o painel monta o formulário com ela, a API usa
 * as chaves e os limites para validar, e o site aplica com `gravar`.
 *
 * Nos títulos, a palavra entre | fica em Sentient itálico verde.
 */
import type { Foto } from '../content/fotos'
import { AJUDAR, ATUACAO, DIRETORIA, FOOTER, FOTO_HERO, HERO, HISTORIA, PROJETOS_SECAO, QUEM_SOMOS } from '../content/site'

export type TipoTexto = 'texto' | 'area' | 'linhas' | 'foto'

export type CampoTexto = {
  chave: string
  secao: string
  rotulo: string
  tipo: TipoTexto
  /** caracteres; em `linhas`, o total */
  max: number
  dica?: string
  /** em `linhas`, quantas linhas no máximo */
  linhas?: number
  ler: () => string | Foto
  gravar: (v: string | Foto) => void
}

const ENFASE = 'A palavra entre | fica em itálico verde, por exemplo: Nossos |projetos|.'

const txt = (v: string | Foto) => String(v)
const lista = (v: string | Foto) =>
  String(v)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

/** campo de texto simples ligado a uma propriedade de um objeto do site */
function campo(
  chave: string,
  secao: string,
  rotulo: string,
  tipo: 'texto' | 'area',
  max: number,
  alvo: Record<string, unknown>,
  prop: string,
  dica?: string,
): CampoTexto {
  return {
    chave,
    secao,
    rotulo,
    tipo,
    max,
    dica,
    ler: () => String(alvo[prop]),
    gravar: (v) => (alvo[prop] = txt(v)),
  }
}

const pilares = QUEM_SOMOS.pilares.flatMap((p, i) => [
  campo(`quemSomos.pilar${i}.rotulo`, 'Quem somos', `Pilar ${i + 1}: nome`, 'texto', 20, p, 'rotulo'),
  campo(`quemSomos.pilar${i}.curto`, 'Quem somos', `Pilar ${i + 1}: frase curta`, 'texto', 90, p, 'curto', 'Aparece no celular.'),
  campo(`quemSomos.pilar${i}.longo`, 'Quem somos', `Pilar ${i + 1}: frase longa`, 'area', 160, p, 'longo', 'Aparece no computador.'),
])

const colunas = ATUACAO.colunas.flatMap((c, i) => [
  campo(`atuacao.coluna${i}.rotulo`, 'Onde a gente chega', `Coluna ${i + 1}: título`, 'texto', 30, c, 'rotulo', 'Aparece no computador.'),
  campo(`atuacao.coluna${i}.texto`, 'Onde a gente chega', `Coluna ${i + 1}: texto`, 'area', 300, c, 'texto'),
])

export const CAMPOS_TEXTO: CampoTexto[] = [
  // ------------------------------------------------------------- abertura
  {
    chave: 'hero.titulo',
    secao: 'Abertura',
    rotulo: 'Título',
    tipo: 'linhas',
    max: 90,
    linhas: 3,
    dica: `Uma linha por linha do título. ${ENFASE}`,
    ler: () => HERO.titulo.join('\n'),
    gravar: (v) => (HERO.titulo = lista(v)),
  },
  campo('hero.subtitulo', 'Abertura', 'Subtítulo', 'area', 180, HERO, 'subtitulo'),
  campo('hero.ctaPrimario', 'Abertura', 'Botão principal', 'texto', 30, HERO, 'ctaPrimario', 'Leva para "Como ajudar".'),
  campo('hero.ctaSecundario', 'Abertura', 'Botão secundário', 'texto', 30, HERO, 'ctaSecundario', 'Leva para "Quem somos".'),
  {
    chave: 'hero.foto',
    secao: 'Abertura',
    rotulo: 'Foto da abertura',
    tipo: 'foto',
    max: 0,
    dica: 'Prefira uma foto em pé (retrato), com a pessoa no centro.',
    ler: () => FOTO_HERO,
    gravar: (v) => typeof v === 'object' && Object.assign(FOTO_HERO, v),
  },

  // ------------------------------------------------------------ quem somos
  campo('quemSomos.titulo', 'Quem somos', 'Título', 'texto', 80, QUEM_SOMOS, 'titulo', ENFASE),
  campo('quemSomos.paragrafoMobile', 'Quem somos', 'Texto curto', 'area', 320, QUEM_SOMOS, 'paragrafoMobile', 'Aparece no celular.'),
  campo('quemSomos.paragrafoDesktop', 'Quem somos', 'Texto longo', 'area', 800, QUEM_SOMOS, 'paragrafoDesktop', 'Aparece no computador.'),
  {
    chave: 'quemSomos.foto',
    secao: 'Quem somos',
    rotulo: 'Foto',
    tipo: 'foto',
    max: 0,
    ler: () => QUEM_SOMOS.foto,
    gravar: (v) => typeof v === 'object' && (QUEM_SOMOS.foto = v as typeof QUEM_SOMOS.foto),
  },
  {
    chave: 'quemSomos.legenda',
    secao: 'Quem somos',
    rotulo: 'Legenda da foto',
    tipo: 'linhas',
    max: 60,
    linhas: 2,
    dica: 'Duas linhas, por exemplo: Ação de Páscoa, / 2025',
    ler: () => QUEM_SOMOS.legenda.join('\n'),
    gravar: (v) => (QUEM_SOMOS.legenda = lista(v)),
  },
  ...pilares,

  // ------------------------------------------------------- nossa história
  campo('historia.titulo', 'Nossa história', 'Título', 'texto', 80, HISTORIA, 'titulo', ENFASE),
  campo('historia.frase', 'Nossa história', 'Frase', 'area', 200, HISTORIA, 'frase', 'Aparece no celular, em itálico.'),
  campo('historia.origemRotulo', 'Nossa história', 'Título do bloco do nome', 'texto', 40, HISTORIA, 'origemRotulo', 'Aparece no computador.'),
  campo('historia.origem', 'Nossa história', 'A origem do nome', 'area', 400, HISTORIA, 'origem', 'Aparece no computador.'),

  // --------------------------------------------------- onde a gente chega
  campo('atuacao.tituloDesktop', 'Onde a gente chega', 'Título', 'texto', 60, ATUACAO, 'tituloDesktop', `Aparece no computador. ${ENFASE}`),
  {
    chave: 'atuacao.frases',
    secao: 'Onde a gente chega',
    rotulo: 'Frases grandes',
    tipo: 'linhas',
    max: 300,
    linhas: 4,
    dica: `Aparecem no celular, uma por linha. ${ENFASE}`,
    ler: () => ATUACAO.frases.join('\n'),
    gravar: (v) => (ATUACAO.frases = lista(v)),
  },
  ...colunas,

  // ------------------------------------------------- diretoria e projetos
  campo('diretoria.titulo', 'Diretoria e projetos', 'Título da diretoria', 'texto', 80, DIRETORIA, 'titulo', ENFASE),
  campo('projetos.titulo', 'Diretoria e projetos', 'Título dos projetos', 'texto', 60, PROJETOS_SECAO, 'titulo', ENFASE),

  // ---------------------------------------------------------- como ajudar
  campo('ajudar.titulo', 'Como ajudar', 'Título', 'texto', 80, AJUDAR, 'titulo', ENFASE),
  campo('ajudar.doar.texto', 'Como ajudar', 'Doar: texto', 'area', 300, AJUDAR.doar, 'texto'),
  campo('ajudar.voluntario.texto', 'Como ajudar', 'Voluntário: texto', 'area', 200, AJUDAR.voluntario, 'texto'),
  campo('ajudar.voluntario.sucesso', 'Como ajudar', 'Voluntário: mensagem depois do envio', 'texto', 100, AJUDAR.voluntario, 'sucesso'),
  campo('ajudar.parceiro.textoMobile', 'Como ajudar', 'Parceiro: texto curto', 'area', 300, AJUDAR.parceiro, 'textoMobile', 'Aparece no celular.'),
  campo('ajudar.parceiro.textoDesktop', 'Como ajudar', 'Parceiro: texto longo', 'area', 420, AJUDAR.parceiro, 'textoDesktop', 'Aparece no computador.'),

  // ---------------------------------------------------------------- rodapé
  campo('footer.frase', 'Rodapé', 'Frase', 'texto', 80, FOOTER, 'frase', ENFASE),
  {
    chave: 'footer.foto',
    secao: 'Rodapé',
    rotulo: 'Foto',
    tipo: 'foto',
    max: 0,
    ler: () => FOOTER.foto,
    gravar: (v) => typeof v === 'object' && (FOOTER.foto = v as typeof FOOTER.foto),
  },
]

export const CAMPO_POR_CHAVE = new Map(CAMPOS_TEXTO.map((c) => [c.chave, c]))

/** aplica os textos que vieram da API; fotos já chegam resolvidas em objeto */
export function aplicarTextos(valores: Record<string, unknown>) {
  for (const [chave, valor] of Object.entries(valores)) {
    const campo = CAMPO_POR_CHAVE.get(chave)
    if (!campo) continue
    if (campo.tipo === 'foto') {
      if (valor && typeof valor === 'object') campo.gravar(valor as Foto)
    } else if (typeof valor === 'string' && valor.trim()) {
      campo.gravar(valor)
    }
  }
}
