import { conteudoPublico } from '../_lib/conteudo'
import { json, tratar } from '../_lib/http'
import type { Funcao } from '../_lib/tipos'

/**
 * GET /api/conteudo
 * Tudo que o site mostra e a diretoria edita, numa ida só ao banco.
 */
export const onRequestGet: Funcao = ({ env }) =>
  // sem cache: o que a diretoria salva no painel aparece no próximo carregamento
  tratar(async () => json(await conteudoPublico(env)))
