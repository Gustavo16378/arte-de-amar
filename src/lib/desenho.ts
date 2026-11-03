import { gsap } from './gsap'

/**
 * Desenho de traço por `stroke-dashoffset`, com o comprimento normalizado.
 *
 * ---------------------------------------------------------------------------
 * Por que não DrawSVG, e por que não esticar o viewBox
 * ---------------------------------------------------------------------------
 *
 * O fio é escrito em coordenadas de 0 a 100, que valem como porcentagem da
 * seção. A tentação é jogar isso num `viewBox="0 0 100 100"` com
 * `preserveAspectRatio="none"` e deixar o navegador esticar. Não funciona:
 *
 * - Num viewBox esticado a escala horizontal e a vertical são diferentes. O
 *   DrawSVG mede o path em unidades de tela e aplica uma escala média das
 *   duas, enquanto o navegador aplica o tracejado em unidades do viewBox. Na
 *   linha do tempo, com escala 1x na horizontal e 9x na vertical, o traço
 *   desenhava cinco vezes mais rápido do que deveria.
 *
 * - `vector-effect="non-scaling-stroke"`, que existe para o traço não
 *   engrossar junto, faz o tracejado ser calculado em pixels de tela. Aí nem
 *   `pathLength="1"` salva: ele normaliza o comprimento em unidades do
 *   viewBox, e as duas medidas divergem. Pior, divergem de forma desigual ao
 *   longo do path, porque um trecho íngreme tem muito mais comprimento de
 *   tela do que de viewBox. É isso que fazia a linha andar, parar e pular.
 *
 * A saída é a mesma que os protótipos aprovados usam: o espaço do SVG é
 * pixels reais. O viewBox recebe a caixa da seção e as coordenadas do path
 * são convertidas de porcentagem para pixel. Com escala 1:1 as duas medidas
 * de comprimento coincidem, o traço não deforma sem precisar de
 * `non-scaling-stroke`, e o desenho fica exato e uniforme.
 *
 * O path original em porcentagem fica guardado em `data-base`, porque a
 * conversão precisa ser refeita a cada mudança de tamanho.
 */

/** Props a espalhar em todo traço que vai ser desenhado. */
export const TRACO_DESENHAVEL = {
  pathLength: 1,
  strokeDasharray: 1,
  strokeDashoffset: 1,
} as const

/** Converte a fração desenhada (0 a 1) no stroke-dashoffset correspondente. */
export const recuoDoTraco = (fracao: number) => 1 - Math.max(0, Math.min(1, fracao))

/**
 * Escreve a fração desenhada direto no elemento.
 *
 * Para valores que mudam a cada quadro, num scrub, isto é mais direto e mais
 * barato do que criar um tween do GSAP por quadro só para escrever um número.
 */
export function aplicarTraco(el: SVGElement, fracao: number) {
  el.style.strokeDashoffset = String(recuoDoTraco(fracao))
}

/**
 * Tween que desenha um traço de `de` até `ate` (frações de 0 a 1).
 *
 * O GSAP anima um número solto e nós escrevemos o `stroke-dashoffset` a
 * partir dele. Animar a propriedade direto não interpola: o valor salta do
 * início para o fim, e o traço aparece de uma vez em vez de ser desenhado.
 */
export function tweenDoTraco(
  el: SVGElement,
  de: number,
  ate: number,
  vars: gsap.TweenVars = {},
) {
  const estado = { v: de }
  aplicarTraco(el, de)
  return gsap.to(estado, {
    ...vars,
    v: ate,
    onUpdate: () => aplicarTraco(el, estado.v),
  })
}

/**
 * Converte um path escrito em porcentagem (0 a 100) para pixels.
 * Os paths do fio só usam M, L e C com coordenadas absolutas.
 */
export function escalarPath(d: string, largura: number, altura: number) {
  let i = 0
  return d.replace(/[MLCZmlcz]|-?\d+\.?\d*/g, (token) => {
    if (/[A-Za-z]/.test(token)) return token
    const valor = Number(token)
    const escalado = i % 2 === 0 ? (valor / 100) * largura : (valor / 100) * altura
    i += 1
    return escalado.toFixed(1)
  })
}

/**
 * Põe o SVG do fio em escala 1:1 com a seção e reconverte os paths.
 * Chamar na montagem, a cada resize e a cada refresh do ScrollTrigger.
 */
export function medirFio(svg: SVGSVGElement) {
  const secao = svg.closest('section') ?? svg.parentElement
  if (!secao) return

  const caixa = secao.getBoundingClientRect()
  const largura = Math.max(1, Math.round(caixa.width))
  const altura = Math.max(1, Math.round(caixa.height))
  svg.setAttribute('viewBox', `0 0 ${largura} ${altura}`)

  for (const traco of svg.querySelectorAll<SVGPathElement>('.fio__traco')) {
    const base = traco.dataset.base
    if (base) traco.setAttribute('d', escalarPath(base, largura, altura))
  }

  /*
   * O degradê do fio precisa de coordenadas reais, não da caixa do traço.
   * Em objectBoundingBox uma linha perfeitamente vertical tem caixa de
   * largura zero, e aí o navegador simplesmente não desenha nada: era o que
   * fazia o fio sumir na Nossa história, que é uma reta.
   */
  const degrade = svg.querySelector('[data-degrade]')
  if (degrade) degrade.setAttribute('y2', String(altura))
}
