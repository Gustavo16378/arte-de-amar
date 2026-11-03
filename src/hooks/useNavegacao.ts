import { useEffect, useState, type RefObject } from 'react'
import { ScrollTrigger } from '../lib/gsap'

type Estado = {
  /** id da seção sob a linha de leitura, para o índice lateral */
  ativo: string
  /** passou dos primeiros 40px: o topo some e o índice aparece */
  rolou: boolean
  /** o botão Doar flutuante aparece depois do hero e some em Como ajudar */
  mostraDoar: boolean
}

/**
 * Estado da navegação, num único ScrollTrigger.
 *
 * O preenchimento do fio do índice é escrito direto no elemento, sem passar
 * por estado do React: ele muda a cada quadro e não vale um render. O resto
 * são chaves que viram poucas vezes na página inteira.
 *
 * As regras de visibilidade são as mesmas do protótipo do desktop.
 */
export function useNavegacao(preenchimento: RefObject<HTMLElement>) {
  const [estado, setEstado] = useState<Estado>({
    ativo: 'inicio',
    rolou: false,
    mostraDoar: false,
  })

  useEffect(() => {
    const secoes = [...document.querySelectorAll<HTMLElement>('[data-secao]')]
    const ajudar = document.getElementById('como-ajudar')
    let anterior = estado

    const avaliar = (self: ScrollTrigger) => {
      if (preenchimento.current) {
        preenchimento.current.style.height = `${self.progress * 100}%`
      }

      /*
       * A posição vem do ScrollTrigger, não de `window.scrollY`: durante um
       * refresh ele leva a página ao topo por um instante para remedir, e ler
       * o scroll nativo nessa janela devolvia zero. O índice lateral piscava
       * e o "Doar" flutuante sumia sozinho.
       */
      const y = self.scroll()
      const vh = window.innerHeight

      let ativo = 'inicio'
      for (const s of secoes) {
        if (s.getBoundingClientRect().top <= vh * 0.45) ativo = s.dataset.secao ?? ativo
      }

      const topoAjudar = ajudar ? ajudar.getBoundingClientRect().top : Infinity
      const proximo: Estado = {
        ativo,
        rolou: y > 40,
        mostraDoar: y > vh * 0.85 && topoAjudar > vh * 0.55,
      }

      if (
        proximo.ativo !== anterior.ativo ||
        proximo.rolou !== anterior.rolou ||
        proximo.mostraDoar !== anterior.mostraDoar
      ) {
        anterior = proximo
        setEstado(proximo)
      }
    }

    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: avaliar,
      // depois de remedir, reavalia com a posição já restaurada
      onRefresh: avaliar,
    })

    return () => st.kill()
    // roda uma vez: o ScrollTrigger cuida das atualizações daí em diante
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return estado
}
