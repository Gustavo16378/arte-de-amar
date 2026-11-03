/** O que o Cloudflare entrega para cada função. */
export interface Env {
  DB: D1Database
  /** segredo das sessões do painel; no mínimo 32 caracteres */
  JWT_SECRET: string
}

/** O que o middleware do painel deixa para as rotas de /api/admin. */
export interface DadosSessao extends Record<string, unknown> {
  usuario: { id: number; nome: string; email: string }
}

export type Funcao<P extends string = never> = PagesFunction<Env, P, DadosSessao>
