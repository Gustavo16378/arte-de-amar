/**
 * Respostas e leitura de corpo, iguais em todas as rotas.
 * Erro sempre sai como { erro: "mensagem em português" }, que é o que o
 * painel mostra para a diretoria.
 */

const SEM_CACHE = { 'Cache-Control': 'no-store' }

export function json(dados: unknown, status = 200, cabecalhos: HeadersInit = {}) {
  return new Response(JSON.stringify(dados), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...SEM_CACHE, ...cabecalhos },
  })
}

export function erro(mensagem: string, status = 400) {
  return json({ erro: mensagem }, status)
}

export class ErroHttp extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message)
  }
}

/** Lê o JSON do corpo com teto de tamanho, para ninguém mandar um corpo gigante. */
export async function lerJson<T = Record<string, unknown>>(req: Request, limite = 64 * 1024): Promise<T> {
  const tipo = req.headers.get('Content-Type') ?? ''
  if (!tipo.includes('application/json')) throw new ErroHttp('Envie os dados em JSON.', 415)

  const texto = await req.text()
  if (texto.length > limite) throw new ErroHttp('Dados grandes demais.', 413)

  try {
    const dados = JSON.parse(texto)
    if (!dados || typeof dados !== 'object' || Array.isArray(dados)) throw new Error()
    return dados as T
  } catch {
    throw new ErroHttp('JSON inválido.')
  }
}

/** Envolve a rota: qualquer ErroHttp vira resposta, o resto vira 500 sem vazar detalhe. */
export async function tratar(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn()
  } catch (e) {
    if (e instanceof ErroHttp) return erro(e.message, e.status)
    console.error(e)
    return erro('Algo deu errado do nosso lado. Tente de novo.', 500)
  }
}

export function idDaRota(valor: string | string[] | undefined): number {
  const id = Number(Array.isArray(valor) ? valor[0] : valor)
  if (!Number.isInteger(id) || id <= 0) throw new ErroHttp('Registro não encontrado.', 404)
  return id
}
