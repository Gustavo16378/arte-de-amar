/**
 * O coração do logo: cinco traços que o fio fecha no fim da página.
 *
 * Os paths vêm de public/assets/logo/coracao-stroke.svg, na forma compacta que
 * o design aprovado usa. O viewBox é o mesmo do arquivo original.
 *
 * A ordem do array é a ordem de desenho pedida na prancha:
 *   lóbulo esquerdo, lóbulo direito, base em V, figura de cima, figura de baixo.
 * Os dois lóbulos partem da fenda (306, 260), que é exatamente onde o fio chega.
 */

export const CORACAO_VIEWBOX = '20 135 572 530'

/** A fenda superior do coração, em coordenadas do viewBox. O fio termina aqui. */
export const CORACAO_FENDA = { x: 306, y: 260 } as const

export type TracoCoracao =
  | { tipo: 'path'; d: string; nome: string }
  | { tipo: 'circle'; cx: number; cy: number; r: number; nome: string }

export const CORACAO_TRACOS: TracoCoracao[] = [
  {
    tipo: 'path',
    nome: 'lóbulo esquerdo',
    d: 'M306 260C59 87 30 358 30 358C30 358 47 258 153 260C259 261 306 391 306 391',
  },
  {
    tipo: 'path',
    nome: 'lóbulo direito',
    d: 'M306 260C554 87 582 358 582 358C582 358 565 258 460 260C354 261 306 391 306 391',
  },
  {
    tipo: 'path',
    nome: 'base em V',
    d: 'M30 366C30 366 64 594 306 655C306 655 547 594 582 366C582 366 420 559 306 583C306 583 168 562 30 366',
  },
  { tipo: 'circle', nome: 'figura de cima', cx: 306, cy: 184, r: 39 },
  { tipo: 'circle', nome: 'figura de baixo', cx: 306, cy: 521, r: 39 },
]

/**
 * Fatia do scrub em que cada traço se desenha, na coreografia do desktop
 * source (segmentos de [data-heart-big]). Usar na Fase 4.
 */
export const CORACAO_SEGMENTOS: [number, number][] = [
  [0, 0.5],
  [0, 0.5],
  [0.5, 0.85],
  [0.85, 1],
  [0.85, 1],
]

/**
 * HEART_MAIN, do design aprovado para o mobile.
 * É o contorno do coração sem o `M` inicial: o mobile emenda esse trecho no
 * fim do path contínuo do fio, para que tudo continue sendo uma linha só.
 * Os dois círculos das figuras são gerados à parte, como arcos.
 */
export const HEART_MAIN =
  'C554 87 582 358 582 358 C582 358 565 258 460 260 C354 261 306 391 306 391 C306 391 259 261 153 260 C47 258 30 358 30 358 C30 358 59 87 306 260 M30 366 C30 366 64 594 306 655 C306 655 547 594 582 366 C582 366 420 559 306 583 C306 583 168 562 30 366'

/**
 * O coração do preloader, na forma que os dois source.html desenham: os dois
 * lóbulos num traço só, partindo e voltando à fenda, depois a base em V e
 * por fim as duas figuras.
 *
 * É um path a menos que o CORACAO_TRACOS acima porque aqui o traço não pode
 * ter emenda: ele é o primeiro gesto do fio, e o fio é uma linha contínua.
 */
export const CORACAO_PRELOADER = {
  lobulos:
    'M306 260C554 87 582 358 582 358C582 358 565 258 460 260C354 261 306 391 306 391C306 391 259 261 153 260C47 258 30 358 30 358C30 358 59 87 306 260',
  base: 'M30 366C30 366 64 594 306 655C306 655 547 594 582 366C582 366 420 559 306 583C306 583 168 562 30 366',
  figuras: [
    { cx: 306, cy: 184, r: 39 },
    { cx: 306, cy: 521, r: 39 },
  ],
} as const

/** Os cinco paths do coração sólido, para botões, favicon e menu. */
export const CORACAO_SOLIDO = [
  'M306 391C306 391 354 261 460 260C565 258 582 358 582 358C582 358 554 87 306 260Z',
  'M306 391C306 391 259 261 153 260C47 258 30 358 30 358C30 358 59 87 306 260Z',
  'M30 366C30 366 64 594 306 655C306 655 547 594 582 366C582 366 420 559 306 583C306 583 168 562 30 366',
]

export const CORACAO_SOLIDO_FIGURAS = [
  { cx: 306, cy: 184, r: 39 },
  { cx: 306, cy: 521, r: 39 },
]
