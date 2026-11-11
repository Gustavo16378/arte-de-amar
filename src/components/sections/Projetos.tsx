import { useEffect, useRef } from 'react'
import { useMotionProximo } from '../../hooks/useMotionProximo'
import { BarraDoFio } from '../BarraDoFio'
import { Blob } from '../Blob'
import { Fio } from '../Fio'
import { comEnfase } from '../Titulo'
import { gsap } from '../../lib/gsap'
import { EASE, revelar, revelarLinhas } from '../../lib/motion'
import { PROJETOS } from '../../content/projetos'
import { PROJETOS_SECAO } from '../../content/site'

/**
 * Projetos e campanhas.
 * Mobile: cards empilhados, as fotos alternando o lado para onde sangram.
 * Desktop: zigue-zague, foto de um lado e texto do outro.
 * As campanhas com meta ganham a barra de progresso feita com o fio.
 *
 * Motion: cada card entra do lado para onde a sua foto sangra.
 *
 * Sem situação (em andamento/concluído) nem filtros: as campanhas se repetem
 * ano após ano, então a ONG pediu para não marcar nenhuma como encerrada.
 */
export function Projetos() {
  const secao = useRef<HTMLElement>(null)
  const container = useRef<HTMLDivElement>(null)

  // entrada dos cards
  useEffect(() => {
    const el = container.current
    if (!el) return

    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      // cada card entra do lado para onde a sua foto sangra
      for (const card of el.querySelectorAll<HTMLElement>('.projetos__card')) {
        gsap.from(card, {
          opacity: 0,
          x: card.dataset.lado === 'left' ? -32 : 32,
          duration: 0.9,
          ease: EASE,
          scrollTrigger: { trigger: card, start: 'top 85%' },
        })
      }
    })

    return () => mm.revert()
  }, [])

  // cabeçalho
  useMotionProximo(secao, () => {
    const el = secao.current
    if (!el) return

    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const cortes: ReturnType<typeof revelarLinhas>[] = []
      let vivo = true

      document.fonts?.ready.then(() => {
        if (!vivo) return
        const titulo = el.querySelector('.projetos__titulo')
        if (titulo) cortes.push(revelarLinhas(titulo, { intervalo: 0.08 }))
      })

      revelar(el.querySelector('.rotulo'), { y: 16 })

      return () => {
        vivo = false
        for (const c of cortes) c.revert()
      }
    })

    return () => mm.revert()
  })

  return (
    <section
      ref={secao}
      id="projetos"
      className="secao projetos calha"
      data-secao="projetos"
    >
      <Fio secao="projetos" />

      <div className="secao__conteudo">
        <div className="projetos__cabecalho">
          <div>
            <span className="rotulo">{PROJETOS_SECAO.rotulo}</span>
            <h2 className="titulo-secao projetos__titulo">
              {comEnfase(PROJETOS_SECAO.titulo)}
            </h2>
          </div>
        </div>

        <div ref={container} className="projetos__lista">
          {PROJETOS.map((p, i) => {
            const lado = i % 2 === 0 ? 'left' : 'right'

            return (
              <article
                key={p.nome}
                className="projetos__card"
                data-lado={lado}
              >
                <Blob
                  className="projetos__foto"
                  variante={(i + 2) % 5}
                  foto={p.foto}
                  tamanhos="(min-width: 1024px) 600px, 330px"
                />

                <div className="projetos__corpo">
                  <strong className="projetos__nome">{p.nome}</strong>

                  <p className="projetos__objetivo so-mobile">{p.objetivoCurto}</p>
                  <p className="projetos__objetivo so-desktop">{p.objetivo}</p>

                  <span className="projetos__publico">{p.publico}</span>

                  {p.meta && (
                    <BarraDoFio
                      feito={p.meta[0]}
                      total={p.meta[1]}
                      unidade={p.meta[2]}
                      rotulo={p.nome}
                    />
                  )}

                  {p.videoUrl && (
                    <a
                      className="projetos__video"
                      href={p.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver o vídeo da campanha
                      <span aria-hidden="true"> ↗</span>
                    </a>
                  )}

                  <blockquote className="projetos__depoimento">
                    <p>{p.depoimento}</p>
                    <footer>{p.autor}</footer>
                  </blockquote>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
