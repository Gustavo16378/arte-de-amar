/**
 * Senha temporária fácil de ditar ou mandar no WhatsApp: sem letras que se
 * confundem (0/O, 1/l/I), em blocos, por exemplo "kq7m-x3ra-p9ve".
 */
const LETRAS = 'abcdefghjkmnpqrstuvwxyz23456789'

export function senhaTemporaria() {
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  const s = [...bytes].map((b) => LETRAS[b % LETRAS.length]).join('')
  return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}`
}
