import { gsap, SplitText } from './gsap'

/**
 * Peças de motion repetidas pelas seções.
 *
 * Os valores vêm das notas de motion do design aprovado para o mobile,
 * que são a especificação das animações.
 *
 * Regra geral: o estado inicial é posto pelo GSAP, nunca pelo CSS. Assim, se
 * o JavaScript falhar ou o visitante pedir menos movimento, o conteúdo já
 * está no lugar certo e visível, em vez de ficar invisível esperando uma
 * animação que não vem.
 */

export const EASE = 'power2.out'
export const EASE_ENTRADA = 'expo.out'

export const semMovimento = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

type OpcoesRevelar = {
  /** deslocamento vertical de onde o elemento sobe */
  y?: number
  /** deslocamento horizontal, para os cards que entram de lado */
  x?: number
  duracao?: number
  atraso?: number
  intervalo?: number
  /** o elemento que dispara; por padrão, o próprio alvo */
  gatilho?: Element | null
  inicio?: string
}

/** Entrada padrão: sobe e aparece. */
export function revelar(
  alvos: gsap.TweenTarget,
  {
    y = 28,
    x = 0,
    duracao = 0.9,
    atraso = 0,
    intervalo = 0,
    gatilho,
    inicio = 'top 85%',
  }: OpcoesRevelar = {},
) {
  return gsap.from(alvos, {
    opacity: 0,
    y,
    x,
    duration: duracao,
    ease: EASE,
    delay: atraso,
    stagger: intervalo,
    scrollTrigger: { trigger: gatilho ?? (alvos as Element), start: inicio },
  })
}

/**
 * Reveal por linha, com cada linha subindo de trás de uma máscara.
 *
 * `autoSplit` refaz o corte quando a largura muda ou quando a fonte termina
 * de carregar, que é justamente quando as quebras de linha mudam.
 */
export function revelarLinhas(
  el: Element,
  {
    duracao = 0.9,
    atraso = 0,
    intervalo = 0.08,
    ease = EASE_ENTRADA,
    gatilho,
    inicio = 'top 85%',
    aoTerminar,
  }: {
    duracao?: number
    atraso?: number
    intervalo?: number
    ease?: string
    gatilho?: Element | null
    inicio?: string
    aoTerminar?: () => void
  } = {},
) {
  return SplitText.create(el, {
    type: 'lines',
    mask: 'lines',
    autoSplit: true,
    linesClass: 'linha-motion',
    /*
     * Sem aria-label: o SplitText o acrescenta por padrão, e ele é proibido
     * num <p>. Cortando por linha o texto continua inteiro e na ordem, então
     * o leitor de tela lê normalmente sem ele.
     */
    aria: 'none',
    onSplit: (self) =>
      gsap.from(self.lines, {
        yPercent: 112,
        duration: duracao,
        ease,
        delay: atraso,
        stagger: intervalo,
        onComplete: aoTerminar,
        scrollTrigger:
          gatilho === null ? undefined : { trigger: gatilho ?? el, start: inicio },
      }),
  })
}

/**
 * A máscara orgânica abrindo: a foto cresce e desentorta.
 * A rotação é relativa, para não apagar a inclinação que a moldura já tem.
 */
export function abrirMascara(
  alvos: gsap.TweenTarget,
  { atraso = 0, intervalo = 0, gatilho }: OpcoesRevelar = {},
) {
  return gsap.from(alvos, {
    opacity: 0,
    scale: 0.6,
    rotation: '+=3',
    duration: 1.1,
    ease: EASE_ENTRADA,
    delay: atraso,
    stagger: intervalo,
    scrollTrigger: { trigger: gatilho ?? (alvos as Element), start: 'top 85%' },
  })
}

const formatar = (n: number) => Math.round(n).toLocaleString('pt-BR')

/**
 * Contador de 0 ao valor. O sufixo só aparece no fim, como manda a nota de
 * motion: durante a contagem o número está incompleto e o "+" mentiria.
 */
export function contar(el: HTMLElement, valor: number, sufixo: string) {
  const estado = { v: 0 }
  el.textContent = formatar(0)
  return gsap.to(estado, {
    v: valor,
    duration: 1.8,
    ease: EASE_ENTRADA,
    snap: { v: 1 },
    onUpdate: () => {
      el.textContent = formatar(estado.v)
    },
    onComplete: () => {
      el.textContent = formatar(valor) + sufixo
    },
    scrollTrigger: { trigger: el, start: 'top 70%' },
  })
}

/** Parallax leve, amarrado ao scroll. */
export function parallax(
  alvo: gsap.TweenTarget,
  deslocamento: number,
  gatilho: Element,
  { inicio = 'top bottom', fim = 'bottom top' } = {},
) {
  return gsap.to(alvo, {
    yPercent: deslocamento,
    ease: 'none',
    scrollTrigger: { trigger: gatilho, start: inicio, end: fim, scrub: true },
  })
}
