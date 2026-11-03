import { useEffect, useState } from 'react'

/**
 * true abaixo de 1024px. O layout em si é resolvido em CSS; este hook existe
 * para as decisões de motion, onde desktop e mobile têm
 * timelines diferentes de verdade.
 */
const CONSULTA = '(max-width: 1023px)'

export function useIsMobile() {
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(CONSULTA).matches,
  )

  useEffect(() => {
    const mq = window.matchMedia(CONSULTA)
    const aoMudar = (e: MediaQueryListEvent) => setMobile(e.matches)
    mq.addEventListener('change', aoMudar)
    setMobile(mq.matches)
    return () => mq.removeEventListener('change', aoMudar)
  }, [])

  return mobile
}
