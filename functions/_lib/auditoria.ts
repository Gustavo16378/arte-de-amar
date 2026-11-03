/**
 * Registro de auditoria: cada alteração feita no painel vira uma linha com
 * quem fez, o quê e quando. A aba "Auditoria" mostra isso por dia.
 *
 * Os textos já saem em português, prontos para ler ("editou o projeto
 * Natal Solidário: Meta, Foto"), para a diretoria não precisar decifrar
 * nome de coluna.
 */
import type { Env } from './tipos'

export type Acao = 'criou' | 'editou' | 'apagou' | 'reordenou' | 'entrou' | 'enviou' | 'trocou'

type Quem = { id: number; nome: string }

export function registro(
  env: Env,
  quem: Quem,
  acao: Acao,
  area: string,
  alvo = '',
  detalhe = '',
): D1PreparedStatement {
  return env.DB.prepare(
    'INSERT INTO auditoria (usuario_id, usuario_nome, acao, area, alvo, detalhe) VALUES (?, ?, ?, ?, ?, ?)',
  ).bind(quem.id, quem.nome, acao, area, alvo.slice(0, 120), detalhe.slice(0, 400))
}

/** grava sem deixar uma falha de log derrubar a ação que já deu certo */
export async function registrar(...args: Parameters<typeof registro>) {
  try {
    await registro(...args).run()
  } catch (e) {
    console.error('auditoria', e)
  }
}
