/**
 * Pecinhas de interface reaproveitadas no painel: aviso flutuante,
 * confirmação em dois cliques (sem window.confirm) e o coração da marca.
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

type Aviso = { id: number; texto: string; tipo: 'ok' | 'erro' }

const ContextoAviso = createContext<(texto: string, tipo?: Aviso['tipo']) => void>(() => {})

export function ProvedorAvisos({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const contador = useRef(0)

  const avisar = useCallback((texto: string, tipo: Aviso['tipo'] = 'ok') => {
    const id = ++contador.current
    setAvisos((a) => [...a, { id, texto, tipo }])
    setTimeout(() => setAvisos((a) => a.filter((x) => x.id !== id)), tipo === 'erro' ? 6000 : 3200)
  }, [])

  return (
    <ContextoAviso.Provider value={avisar}>
      {children}
      <div className="avisos" aria-live="polite">
        {avisos.map((a) => (
          <p key={a.id} className={`aviso aviso--${a.tipo}`} role={a.tipo === 'erro' ? 'alert' : 'status'}>
            {a.texto}
          </p>
        ))}
      </div>
    </ContextoAviso.Provider>
  )
}

export const useAvisar = () => useContext(ContextoAviso)

/** botão que pede um segundo clique para ações que não têm volta */
export function BotaoPerigoso({
  children,
  confirmar = 'Confirmar',
  aoConfirmar,
  className = '',
}: {
  children: ReactNode
  confirmar?: string
  aoConfirmar: () => void
  className?: string
}) {
  const [armado, setArmado] = useState(false)

  useEffect(() => {
    if (!armado) return
    const t = setTimeout(() => setArmado(false), 4000)
    return () => clearTimeout(t)
  }, [armado])

  return (
    <button
      type="button"
      className={`btn btn--perigo ${armado ? 'btn--armado' : ''} ${className}`}
      onClick={() => {
        if (armado) {
          setArmado(false)
          aoConfirmar()
        } else setArmado(true)
      }}
    >
      {armado ? confirmar : children}
    </button>
  )
}

export function Coracao({ tamanho = 22 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 20.5s-7.5-4.6-9.3-9.5C1.4 7.4 3.6 4 7.1 4c2.1 0 3.6 1.1 4.9 2.9C13.3 5.1 14.8 4 16.9 4c3.5 0 5.7 3.4 4.4 7-1.8 4.9-9.3 9.5-9.3 9.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Carregando({ texto = 'Carregando…' }: { texto?: string }) {
  return (
    <p className="carregando">
      <span className="carregando__fio" aria-hidden="true" />
      {texto}
    </p>
  )
}
