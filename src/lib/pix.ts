/**
 * PIX estático (BR Code) gerado a partir da chave, sem depender do banco.
 *
 * É o mesmo texto que vira o QR Code e o "Pix copia e cola": um payload no
 * padrão EMV do Banco Central, com a chave, o nome de quem recebe, a cidade
 * e um CRC16 no fim. Sem valor fixo: a pessoa digita quanto quer doar no app
 * do banco. Referência: Manual de Padrões para Iniciação do Pix (BCB).
 *
 * Quem recebe é sempre a conta dona da chave; nome e cidade aparecem na
 * confirmação do app, mas não mudam o destino do dinheiro.
 */

export type DadosPix = {
  chave: string
  /** até 25 caracteres, sem acento */
  nome: string
  /** até 15 caracteres, sem acento */
  cidade: string
  /** identificador da transação; *** quando não há */
  txid?: string
}

/** campo EMV: id de dois dígitos + tamanho de dois dígitos + valor */
function campo(id: string, valor: string) {
  return `${id}${String(valor.length).padStart(2, '0')}${valor}`
}

/** sem acento, só o que o padrão aceita, cortado no limite */
function limpar(texto: string, max: number) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 .,-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

/** CRC16-CCITT (polinômio 0x1021, início 0xFFFF), como o BCB pede */
export function crc16(texto: string) {
  let crc = 0xffff
  for (const byte of new TextEncoder().encode(texto)) {
    crc ^= byte << 8
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * A chave no formato que o BCB exige: CNPJ e CPF só com dígitos, telefone
 * com +55, e-mail em minúsculas, chave aleatória como veio.
 */
export function normalizarChave(chave: string) {
  const c = chave.trim()
  if (c.includes('@')) return c.toLowerCase()
  if (UUID.test(c)) return c.toLowerCase()
  const digitos = c.replace(/\D/g, '')
  const pareceTelefone = c.startsWith('+') || c.includes('(')
  if (pareceTelefone) return `+${digitos.startsWith('55') ? digitos : `55${digitos}`}`
  if (digitos.length === 14 || digitos.length === 11) return digitos
  return c
}

export function montarPix({ chave, nome, cidade, txid = '***' }: DadosPix) {
  const conta = campo('00', 'br.gov.bcb.pix') + campo('01', normalizarChave(chave))
  const corpo =
    campo('00', '01') + // versão do payload
    campo('26', conta) + // conta do recebedor
    campo('52', '0000') + // categoria do comerciante: não informada
    campo('53', '986') + // moeda: real
    campo('58', 'BR') +
    campo('59', limpar(nome, 25)) +
    campo('60', limpar(cidade, 15)) +
    campo('62', campo('05', txid.slice(0, 25))) +
    '6304' // o CRC entra depois, calculado sobre tudo até aqui
  return corpo + crc16(corpo)
}

/** o PIX da ONG, com a chave configurada no painel */
export const pixDaOng = (chave: string) => montarPix({ chave, nome: 'OSC Arte de Amar', cidade: 'Palmas' })
