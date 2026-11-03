import { useMemo } from 'react'
import qrcode from 'qrcode-generator'

type Props = {
  /** o payload PIX (BR Code), o mesmo do "copia e cola" */
  payload: string
  className?: string
  rotulo?: string
}

/**
 * O QR Code do PIX, desenhado como um único path de SVG nas cores do site.
 * Correção de erro M: aguenta pequenas manchas na tela ou no papel impresso
 * e continua com módulos grandes o bastante para a câmera do banco.
 */
export function QrPix({ payload, className, rotulo = 'QR Code do PIX da Arte de Amar' }: Props) {
  const { tamanho, caminho } = useMemo(() => {
    const qr = qrcode(0, 'M')
    qr.addData(payload, 'Byte')
    qr.make()
    const n = qr.getModuleCount()
    let d = ''
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) if (qr.isDark(y, x)) d += `M${x} ${y}h1v1h-1z`
    }
    return { tamanho: n, caminho: d }
  }, [payload])

  // margem de 2 módulos: o padrão pede zona quieta em volta para a leitura
  const borda = 2
  return (
    <svg
      className={className}
      viewBox={`${-borda} ${-borda} ${tamanho + borda * 2} ${tamanho + borda * 2}`}
      role="img"
      aria-label={rotulo}
      shapeRendering="crispEdges"
    >
      <rect x={-borda} y={-borda} width={tamanho + borda * 2} height={tamanho + borda * 2} fill="#F6F2EA" />
      <path d={caminho} fill="#0B2E22" />
    </svg>
  )
}
