/**
 * Cliente HTTP dos testes de API: guarda o cookie de sessão como um
 * navegador faria, e dá acesso direto ao banco do servidor de teste para os
 * testes de caixa cinza (conferir o que foi gravado, não só a resposta).
 */
import { readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { inject } from 'vitest'
// @ts-expect-error módulo .mjs sem tipos
import { ADMIN } from '../servidor-teste.mjs'

export const URL_BASE = inject('url')
export { ADMIN }

export type Resposta<T = any> = { status: number; corpo: T; cabecalhos: Headers }

export class Cliente {
  cookie = ''
  constructor(public ip = '10.0.0.1') {}

  async pedir<T = any>(metodo: string, caminho: string, corpo?: unknown, extra: Record<string, string> = {}): Promise<Resposta<T>> {
    const headers: Record<string, string> = { 'CF-Connecting-IP': this.ip, ...extra }
    if (this.cookie) headers.Cookie = this.cookie
    let body: BodyInit | undefined
    if (corpo instanceof FormData) body = corpo
    else if (corpo !== undefined) {
      body = JSON.stringify(corpo)
      headers['Content-Type'] ??= 'application/json'
    }
    const r = await fetch(URL_BASE + caminho, { method: metodo, headers, body, redirect: 'manual' })
    const novo = r.headers.get('set-cookie')
    if (novo) this.cookie = novo.split(';')[0].endsWith('=') ? '' : novo.split(';')[0]
    const tipo = r.headers.get('content-type') ?? ''
    const texto = tipo.includes('json') ? await r.text() : ''
    return { status: r.status, corpo: texto ? JSON.parse(texto) : (undefined as T), cabecalhos: r.headers }
  }

  get = <T = any>(c: string, extra?: Record<string, string>) => this.pedir<T>('GET', c, undefined, extra)
  post = <T = any>(c: string, b?: unknown, extra?: Record<string, string>) => this.pedir<T>('POST', c, b, extra)
  put = <T = any>(c: string, b?: unknown, extra?: Record<string, string>) => this.pedir<T>('PUT', c, b, extra)
  del = <T = any>(c: string, extra?: Record<string, string>) => this.pedir<T>('DELETE', c, undefined, extra)

  async entrar(email = ADMIN.email, senha = ADMIN.senha) {
    const r = await this.post('/api/auth/login', { email, senha })
    if (r.status !== 200) throw new Error(`login falhou: ${r.status} ${JSON.stringify(r.corpo)}`)
    return r
  }
}

/** a diretoria de teste já logada */
export async function diretoria() {
  const c = new Cliente()
  await c.entrar()
  return c
}

/** banco do servidor de teste, só leitura: a caixa cinza */
export function banco() {
  const procurar = (dir: string): string | null => {
    for (const nome of readdirSync(dir)) {
      const p = path.join(dir, nome)
      if (statSync(p).isDirectory()) {
        const achou = procurar(p)
        if (achou) return achou
      } else if (nome.endsWith('.sqlite') && !p.includes('cache')) return p
    }
    return null
  }
  const arquivo = procurar(inject('estado'))
  if (!arquivo) throw new Error('banco do servidor de teste não encontrado')
  const db = new DatabaseSync(arquivo, { readOnly: true })
  return {
    um: <T = Record<string, unknown>>(sql: string, ...p: (string | number | null)[]) => {
      const r = db.prepare(sql).get(...p) as T
      return r
    },
    todos: <T = Record<string, unknown>>(sql: string, ...p: (string | number | null)[]) => db.prepare(sql).all(...p) as T[],
    fechar: () => db.close(),
  }
}

/** última linha de auditoria, para conferir o registro de uma ação */
export function ultimaAuditoria() {
  const b = banco()
  try {
    return b.um<{ usuario_nome: string; acao: string; area: string; alvo: string; detalhe: string }>(
      'SELECT usuario_nome, acao, area, alvo, detalhe FROM auditoria ORDER BY id DESC LIMIT 1',
    )
  } finally {
    b.fechar()
  }
}

/** imagens reais pequenas, para testar upload */
export async function imagem(formato: 'jpeg' | 'png' | 'webp', largura = 40, altura = 30) {
  const sharp = (await import('sharp')).default
  return new Uint8Array(
    await sharp({ create: { width: largura, height: altura, channels: 3, background: '#1FA86B' } })
      [formato]()
      .toBuffer(),
  )
}

export function formFoto(bytes: Uint8Array, tipo: string, alt = 'Foto de teste da campanha', largura = 40, altura = 30) {
  const f = new FormData()
  f.append('arquivo', new Blob([bytes], { type: tipo }), 'foto')
  f.append('alt', alt)
  f.append('largura', String(largura))
  f.append('altura', String(altura))
  return f
}
