import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useMotionProximo } from '../../hooks/useMotionProximo'
import { BarraDoFio } from '../BarraDoFio'
import { Blob } from '../Blob'
import { Fio } from '../Fio'
import { comEnfase } from '../Titulo'
import { gsap } from '../../lib/gsap'
import { EASE, revelar, revelarLinhas, semMovimento } from '../../lib/motion'
import { PROJETOS, type Projeto } from '../../content/projetos'
import { PROJETOS_SECAO } from '../../content/site'

function filtrar(filtro: string): Projeto[] {
  if (filtro === 'Em andamento') return PROJETOS.filter((p) => p.status === 'Em andamento')
  if (filtro === 'Concluídos') return PROJETOS.filter((p) => p.status === 'Concluído')
  return PROJETOS
}

/**
 * Projetos e campanhas.
 * Mobile: cards empilhados, as fotos alternando o lado para onde sangram.
 * Desktop: zigue-zague, foto de um lado e texto do outro.
 * As campanhas com meta ganham a barra de progresso feita com o fio.
 *
 * Motion: cada card entra do lado para onde a sua foto sangra. Na troca de
 * filtro um traço do fio desliza de um item para o outro, os cards atuais
 * saem em fade e os novos entram em stagger.
 */
export function Projetos() {
  const [filtro, setFiltro] = useState<string>(PROJETOS_SECAO.filtros[0])
  const [lista, setLista] = useState<Projeto[]>(() => filtrar(PROJETOS_SECAO.filtros[0]))

  const secao = useRef<HTMLElement>(null)
  const filtros = useRef<HTMLDivElement>(null)
  const traco = useRef<HTMLSpanElement>(null)
  const container = useRef<HTMLDivElement>(null)
  // a primeira lista entra pelo reveal de scroll, não pela troca de filtro
  const primeira = useRef(true)

  /** leva o traço do fio para debaixo do item ativo */
  useLayoutEffect(() => {
    const caixa = filtros.current
    const linha = traco.current
    if (!caixa || !linha) return

    const ativo = caixa.querySelector<HTMLElement>('[aria-pressed="true"]')
    if (!ativo) return

    const destino = { left: ativo.offsetLeft, width: ativo.offsetWidth }
    if (semMovimento() || primeira.current) gsap.set(linha, destino)
    else gsap.to(linha, { ...destino, duration: 0.4, ease: EASE })
  }, [filtro])

  const trocar = (novo: string) => {
    if (novo === filtro) return
    setFiltro(novo)

    const cards = container.current?.querySelectorAll('.projetos__card')
    if (semMovimento() || !cards?.length) {
      primeira.current = false
      setLista(filtrar(novo))
      return
    }

    primeira.current = false
    gsap.to(cards, {
      opacity: 0,
      duration: 0.25,
      ease: 'none',
      onComplete: () => setLista(filtrar(novo)),
    })
  }

  // entrada dos cards
  useEffect(() => {
    const el = container.current
    if (!el) return

    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const cards = [...el.querySelectorAll<HTMLElement>('.projetos__card')]

      if (primeira.current) {
        // cada card entra do lado para onde a sua foto sangra
        for (const card of cards) {
          gsap.from(card, {
            opacity: 0,
            x: card.dataset.lado === 'left' ? -32 : 32,
            duration: 0.9,
            ease: EASE,
            scrollTrigger: { trigger: card, start: 'top 85%' },
          })
        }
        return
      }

      // depois de uma troca de filtro os cards já estão à vista
      gsap.fromTo(
        cards,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: EASE, stagger: 0.08 },
      )
    })

    return () => mm.revert()
  }, [lista])

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
      revelar(el.querySelector('.projetos__filtros'), { y: 14, atraso: 0.1 })

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

          <div
            ref={filtros}
            className="projetos__filtros"
            role="group"
            aria-label="Filtrar projetos"
          >
            {PROJETOS_SECAO.filtros.map((f) => (
              <button
                key={f}
                type="button"
                className="projetos__filtro"
                aria-pressed={f === filtro}
                onClick={() => trocar(f)}
              >
                {f}
              </button>
            ))}
            {/* um traço do fio, que desliza de um item para o outro */}
            <span ref={traco} className="projetos__traco" aria-hidden="true" />
          </div>
        </div>

        <div ref={container} className="projetos__lista">
          {lista.map((p, i) => {
            const lado = i % 2 === 0 ? 'left' : 'right'

            return (
              <article
                key={p.nome}
                className="projetos__card"
                data-lado={lado}
                data-status={p.status}
              >
                <Blob
                  className="projetos__foto"
                  variante={(i + 2) % 5}
                  foto={p.foto}
                  tamanhos="(min-width: 1024px) 600px, 330px"
                />

                <div className="projetos__corpo">
                  <span className="projetos__status">{p.status}</span>
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
