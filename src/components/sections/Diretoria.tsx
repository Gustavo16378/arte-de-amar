import { useRef, type CSSProperties } from 'react'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useMotionProximo } from '../../hooks/useMotionProximo'
import { Blob } from '../Blob'
import { Fio } from '../Fio'
import { comEnfase } from '../Titulo'
import { gsap } from '../../lib/gsap'
import { EASE_ENTRADA, revelar, revelarLinhas } from '../../lib/motion'
import { MEMBROS } from '../../content/membros'
import { DIRETORIA } from '../../content/site'

/**
 * Diretoria.
 * Mobile: carrossel horizontal com scroll nativo e snap, o segundo card já
 * cortado na borda. Desktop: mural livre de 12 colunas, cada retrato num
 * tamanho e numa altura, com o fio serpenteando entre eles.
 *
 * Motion: os cards entram em stagger com a máscara abrindo e a inclinação
 * desfazendo. No mobile, arrastar o carrossel dá um parallax leve dentro de
 * cada retrato, e tocar num card sublinha o nome com o fio, já que ali não
 * existe hover.
 *
 * Os retratos ainda não chegaram: enquanto isso a moldura fica listrada.
 */
export function Diretoria() {
  const secao = useRef<HTMLElement>(null)
  const mobile = useIsMobile()

  useMotionProximo(secao, () => {
    const el = secao.current
    if (!el) return

    const carrossel = el.querySelector<HTMLElement>('.diretoria__carrossel')
    const cards = [...el.querySelectorAll<HTMLElement>('.diretoria__card')]

    const mm = gsap.matchMedia()

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const cortes: ReturnType<typeof revelarLinhas>[] = []
      let vivo = true

      document.fonts?.ready.then(() => {
        if (!vivo) return
        const titulo = el.querySelector('.diretoria__titulo')
        if (titulo) cortes.push(revelarLinhas(titulo, { intervalo: 0.08 }))
      })

      revelar(el.querySelector('.rotulo'), { y: 16 })

      gsap.from(cards, {
        opacity: 0,
        scale: 0.85,
        rotation: '+=2',
        duration: 0.9,
        ease: EASE_ENTRADA,
        stagger: 0.1,
        scrollTrigger: { trigger: carrossel ?? el, start: 'top 85%' },
      })

      return () => {
        vivo = false
        for (const c of cortes) c.revert()
      }
    })

    /*
     * Parallax dentro do carrossel: os retratos andam um pouco na direção
     * contrária ao arrasto, o que dá profundidade sem precisar de scrub do
     * ScrollTrigger, que aqui não serve porque a rolagem é horizontal e
     * dentro de um container.
     */
    mm.add('(max-width: 1023px) and (prefers-reduced-motion: no-preference)', () => {
      if (!carrossel) return

      const aoRolar = () => {
        const meio = carrossel.scrollLeft + carrossel.clientWidth / 2
        for (const card of cards) {
          const centro = card.offsetLeft + card.offsetWidth / 2
          const distancia = (centro - meio) / carrossel.clientWidth
          const img = card.querySelector('.diretoria__retrato > *')
          if (img) gsap.set(img, { x: gsap.utils.clamp(-10, 10, distancia * 20) })
        }
      }

      carrossel.addEventListener('scroll', aoRolar, { passive: true })
      aoRolar()
      return () => carrossel.removeEventListener('scroll', aoRolar)
    })

    return () => mm.revert()
  })

  return (
    <section ref={secao} id="diretoria" className="secao diretoria" data-secao="diretoria">
      <Fio secao="diretoria" />

      <div className="secao__conteudo">
        <div className="diretoria__cabecalho">
          <span className="rotulo">{DIRETORIA.rotulo}</span>
          <h2 className="titulo-secao diretoria__titulo">{comEnfase(DIRETORIA.titulo)}</h2>
        </div>

        {/* no celular o mural rola de lado: tabIndex deixa rolar pelo teclado (no desktop ele não rola) */}
        <ul
          className="diretoria__carrossel sem-barra"
          tabIndex={mobile ? 0 : undefined}
          aria-label="Pessoas da diretoria"
        >
          {MEMBROS.map((m, i) => (
            <li
              key={`${m.cargo}-${i}`}
              className="diretoria__card"
              style={
                {
                  '--coluna': m.coluna,
                  '--recuo': m.recuo,
                } as CSSProperties
              }
            >
              {m.foto ? (
                <Blob className="diretoria__retrato" variante={m.blob} foto={m.foto} />
              ) : (
                <Blob className="diretoria__retrato retrato-vazio" variante={m.blob}>
                  <span>
                    retrato
                    <br />
                    {m.cargo}
                  </span>
                </Blob>
              )}
              <strong className="diretoria__nome">
                {m.nome}
                <span className="diretoria__sublinhado" aria-hidden="true" />
              </strong>
              <span className="diretoria__cargo">{m.cargo}</span>
            </li>
          ))}
        </ul>

        <span className="diretoria__dica" aria-hidden="true">
          {DIRETORIA.dica}
        </span>
      </div>
    </section>
  )
}
