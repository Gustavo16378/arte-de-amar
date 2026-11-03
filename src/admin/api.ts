/**
 * Conversa do painel com a API. O cookie de sessão vai sozinho (mesma
 * origem, HttpOnly); aqui só tratamos erro e sessão expirada.
 */

export class ErroApi extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
  }
}

let aoExpirar: () => void = () => {}
export function quandoSessaoExpirar(fn: () => void) {
  aoExpirar = fn
}

export async function api<T = unknown>(caminho: string, opcoes: RequestInit & { json?: unknown } = {}) {
  const { json, headers, ...resto } = opcoes
  let resposta: Response
  try {
    resposta = await fetch(`/api${caminho}`, {
      credentials: 'same-origin',
      ...resto,
      headers: json !== undefined ? { 'Content-Type': 'application/json', ...headers } : headers,
      body: json !== undefined ? JSON.stringify(json) : resto.body,
    })
  } catch {
    throw new ErroApi('Sem conexão com o servidor. Confira a internet e tente de novo.', 0)
  }

  const corpo = (await resposta.json().catch(() => ({}))) as T & { erro?: string }
  if (!resposta.ok) {
    if (resposta.status === 401 && !caminho.startsWith('/auth/login')) aoExpirar()
    throw new ErroApi(corpo.erro ?? 'Algo deu errado. Tente de novo.', resposta.status)
  }
  return corpo
}

export type Usuario = { id: number; nome: string; email: string }

export type Midia = {
  id: number
  url: string
  alt: string
  largura: number
  altura: number
  bytes: number
  estatica: boolean
  usos: number
  criado_em: string
}

export type Voluntario = {
  id: number
  nome: string
  whatsapp: string
  como: string
  status: 'novo' | 'contatado' | 'arquivado'
  criado_em: string
}

/** linha crua de projetos, marcos, membros ou numeros */
export type Registro = Record<string, string | number | null> & { id: number; ordem: number; visivel: number }
