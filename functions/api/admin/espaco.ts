import { json, tratar } from '../../_lib/http'
import type { Funcao } from '../../_lib/tipos'

/**
 * GET /api/admin/espaco
 * Quanto do banco já foi usado, para o painel avisar antes de encher.
 *
 * O plano gratuito do D1 aceita até 500 MB por banco. O tamanho real vem do
 * próprio D1 (meta.size_after de qualquer consulta). Quase todo o peso são
 * as fotos enviadas pelo painel; cada contato de voluntário tem menos de 1 KB.
 */
export const LIMITE_BYTES = 500 * 1000 * 1000

export const onRequestGet: Funcao = ({ env }) =>
  tratar(async () => {
    const r = await env.DB.prepare(
      `SELECT
         (SELECT COALESCE(SUM(bytes), 0) FROM midias) AS bytes_fotos,
         (SELECT COUNT(*) FROM midias WHERE dados IS NOT NULL) AS fotos_enviadas,
         (SELECT COUNT(*) FROM voluntarios) AS voluntarios`,
    ).all<{ bytes_fotos: number; fotos_enviadas: number; voluntarios: number }>()

    const linha = r.results[0]
    const usado = r.meta.size_after ?? linha.bytes_fotos
    return json({
      usado,
      limite: LIMITE_BYTES,
      porcentagem: Math.round((usado / LIMITE_BYTES) * 1000) / 10,
      bytesFotos: linha.bytes_fotos,
      fotosEnviadas: linha.fotos_enviadas,
      voluntarios: linha.voluntarios,
    })
  })
