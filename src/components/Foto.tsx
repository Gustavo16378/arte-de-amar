import type { CSSProperties } from 'react'
import type { Foto as DadosFoto } from '../content/fotos'

/**
 * A mesma escada de larguras que scripts/gerar-imagens.mjs produz.
 * Se mudar aqui, mudar lá.
 */
const LARGURAS = [400, 640, 960, 1280, 1600]
const PASTA = '/assets/fotos/gerado'

type Props = {
  foto: DadosFoto
  /**
   * Quanto a foto ocupa na tela, para o navegador escolher a largura certa
   * antes de saber o layout. Sem isto ele assume 100vw e baixa sempre a
   * maior versão.
   */
  tamanhos?: string
  /** a do hero não é lazy e tem prioridade de download */
  prioridade?: boolean
  className?: string
  style?: CSSProperties
}

function escada(largura: number) {
  return [...new Set([...LARGURAS.filter((l) => l < largura), largura])]
}

function conjunto(src: string, largura: number, formato: 'webp' | 'jpg') {
  const nome = src.split('/').pop()?.replace(/\.jpg$/, '') ?? ''
  return escada(largura)
    .map((l) => `${PASTA}/${nome}-${l}.${formato} ${l}w`)
    .join(', ')
}

/**
 * Uma foto da ONG, servida em WebP com JPG de reserva e numa largura
 * proporcional à tela. O `src` do `<img>` continua sendo o JPG original, que
 * é o que aparece se nada mais der certo.
 *
 * `width` e `height` vêm sempre preenchidos: são eles que reservam o espaço
 * e impedem o layout de pular quando a imagem chega.
 */
export function Foto({ foto, tamanhos = '100vw', prioridade, className, style }: Props) {
  const { src, alt, largura, altura, posicao } = foto

  /*
   * Foto enviada pelo painel (/api/midias/...) não passa pelo
   * gerar-imagens.mjs: o painel já reduz para no máximo 1600px antes de
   * subir, então vai direto, sem srcset.
   */
  if (!src.startsWith('/assets/fotos/')) {
    return (
      <img
        src={src}
        alt={alt}
        width={largura}
        height={altura}
        className={className}
        loading={prioridade ? 'eager' : 'lazy'}
        decoding="async"
        style={{ objectPosition: posicao, ...style }}
      />
    )
  }

  return (
    <picture>
      <source type="image/webp" srcSet={conjunto(src, largura, 'webp')} sizes={tamanhos} />
      <source type="image/jpeg" srcSet={conjunto(src, largura, 'jpg')} sizes={tamanhos} />
      <img
        src={src}
        alt={alt}
        width={largura}
        height={altura}
        className={className}
        loading={prioridade ? 'eager' : 'lazy'}
        decoding={prioridade ? 'sync' : 'async'}
        // o React 18 ainda não conhece fetchPriority em camelCase
        {...(prioridade ? { fetchpriority: 'high' } : {})}
        style={{ objectPosition: posicao, ...style }}
      />
    </picture>
  )
}
