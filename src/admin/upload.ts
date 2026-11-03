/**
 * Reduz a foto no navegador antes de subir.
 *
 * Foto de celular chega com 4000px e 5 MB. O site nunca mostra mais que
 * 1600px, e o banco guarda a imagem numa linha só, então cada foto sai
 * daqui com no máximo 1600px no lado maior, em WebP (ou JPEG, se o
 * navegador não gerar WebP).
 */
const LADO_MAXIMO = 1600
const QUALIDADE = 0.82
const TETO_BYTES = 1_400_000

export type FotoPronta = { arquivo: Blob; largura: number; altura: number; nome: string }

function carregar(arquivo: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(arquivo)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Não consegui abrir essa imagem. Tente uma foto em JPG ou PNG.'))
    }
    img.src = url
  })
}

function exportar(canvas: HTMLCanvasElement, tipo: string, qualidade: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, tipo, qualidade))
}

export async function prepararFoto(arquivo: File): Promise<FotoPronta> {
  if (!arquivo.type.startsWith('image/')) throw new Error('Esse arquivo não é uma imagem.')

  const img = await carregar(arquivo)
  const escala = Math.min(1, LADO_MAXIMO / Math.max(img.naturalWidth, img.naturalHeight))
  const largura = Math.round(img.naturalWidth * escala)
  const altura = Math.round(img.naturalHeight * escala)

  const canvas = document.createElement('canvas')
  canvas.width = largura
  canvas.height = altura
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Seu navegador não conseguiu processar a foto.')
  ctx.drawImage(img, 0, 0, largura, altura)

  let qualidade = QUALIDADE
  let blob = await exportar(canvas, 'image/webp', qualidade)
  // Safari antigo devolve PNG quando não sabe gerar WebP
  if (!blob || blob.type !== 'image/webp') blob = await exportar(canvas, 'image/jpeg', qualidade)

  while (blob && blob.size > TETO_BYTES && qualidade > 0.5) {
    qualidade -= 0.1
    blob = await exportar(canvas, blob.type, qualidade)
  }
  if (!blob) throw new Error('Não consegui preparar a foto.')

  const nome = arquivo.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')
  return { arquivo: blob, largura, altura, nome }
}
