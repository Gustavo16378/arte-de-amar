import type { ReactNode } from 'react'
import { Coracao } from './Coracao'

type Aparencia =
  /** verde profundo com texto creme, sobre fundo claro */
  | 'escuro'
  /** menta com texto verde profundo, sobre fundo escuro */
  | 'menta'
  /** creme com texto verde profundo, sobre fundo escuro */
  | 'creme'
  /** só contorno menta, sobre fundo escuro */
  | 'contorno'
  /** só contorno creme, para o secundário ao lado de um botão cheio */
  | 'contorno-creme'

type Base = {
  aparencia?: Aparencia
  /** mostra o coração em contorno antes do texto */
  comCoracao?: boolean
  /** ocupa a largura toda, como no mobile */
  largo?: boolean
  className?: string
  children: ReactNode
}

type Props =
  | (Base & { href: string; onClick?: never; type?: never })
  | (Base & { href?: never; onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean })

export function Botao({
  aparencia = 'escuro',
  comCoracao = false,
  largo = false,
  className,
  children,
  ...resto
}: Props) {
  const classes = [
    'pill',
    `pill--${aparencia}`,
    largo ? 'pill--largo' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const conteudo = (
    <>
      {comCoracao && <Coracao variante="contorno" largura={18} preencheNoHover />}
      {children}
    </>
  )

  if ('href' in resto && resto.href) {
    const externo = resto.href.startsWith('http')
    return (
      <a
        href={resto.href}
        className={classes}
        target={externo ? '_blank' : undefined}
        rel={externo ? 'noopener noreferrer' : undefined}
      >
        {conteudo}
      </a>
    )
  }

  return (
    <button
      type={resto.type ?? 'button'}
      onClick={resto.onClick}
      disabled={'disabled' in resto ? resto.disabled : undefined}
      className={classes}
    >
      {conteudo}
    </button>
  )
}
