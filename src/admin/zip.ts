/**
 * Um .zip simples, montado no navegador, para o "Baixar todas" da aba Fotos.
 * Sem compressão (as fotos já são WebP/JPEG, comprimir de novo não ganha
 * nada) e sem biblioteca: só o formato ZIP básico com CRC-32.
 */

const TABELA = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(dados: Uint8Array) {
  let c = 0xffffffff
  for (let i = 0; i < dados.length; i++) c = TABELA[(c ^ dados[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

export function montarZip(arquivos: { nome: string; dados: Uint8Array }[]) {
  const enc = new TextEncoder()
  const partes: Uint8Array[] = []
  const central: Uint8Array[] = []
  let deslocamento = 0

  for (const a of arquivos) {
    const nome = enc.encode(a.nome)
    const crc = crc32(a.dados)
    const tam = a.dados.length

    const local = new DataView(new ArrayBuffer(30))
    local.setUint32(0, 0x04034b50, true) // assinatura do cabeçalho local
    local.setUint16(4, 20, true) // versão
    local.setUint16(6, 0x0800, true) // nomes em UTF-8
    local.setUint32(14, crc, true)
    local.setUint32(18, tam, true)
    local.setUint32(22, tam, true)
    local.setUint16(26, nome.length, true)
    partes.push(new Uint8Array(local.buffer), nome, a.dados)

    const dir = new DataView(new ArrayBuffer(46))
    dir.setUint32(0, 0x02014b50, true) // assinatura do diretório central
    dir.setUint16(4, 20, true)
    dir.setUint16(6, 20, true)
    dir.setUint16(8, 0x0800, true)
    dir.setUint32(16, crc, true)
    dir.setUint32(20, tam, true)
    dir.setUint32(24, tam, true)
    dir.setUint16(28, nome.length, true)
    dir.setUint32(42, deslocamento, true)
    central.push(new Uint8Array(dir.buffer), nome)

    deslocamento += 30 + nome.length + tam
  }

  const tamCentral = central.reduce((s, p) => s + p.length, 0)
  const fim = new DataView(new ArrayBuffer(22))
  fim.setUint32(0, 0x06054b50, true)
  fim.setUint16(8, arquivos.length, true)
  fim.setUint16(10, arquivos.length, true)
  fim.setUint32(12, tamCentral, true)
  fim.setUint32(16, deslocamento, true)

  return new Blob([...partes, ...central, new Uint8Array(fim.buffer)] as BlobPart[], { type: 'application/zip' })
}

export function nomeDeArquivo(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}
