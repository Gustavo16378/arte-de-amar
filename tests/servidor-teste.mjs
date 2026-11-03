/**
 * Sobe a API de verdade (wrangler pages dev, mesmo runtime da Cloudflare)
 * com um banco D1 novo e isolado, para os testes de API e os E2E.
 *
 * 1. cria uma pasta temporária para o estado local do wrangler;
 * 2. aplica todas as migrations nela (esquema + seed);
 * 3. cria o usuário de teste com o mesmo hash PBKDF2 da API;
 * 4. sobe o servidor e espera responder.
 *
 * Nada disso toca o banco de desenvolvimento (.wrangler/) nem o de produção.
 *
 * Uso direto (Playwright): node tests/servidor-teste.mjs --porta 8799
 * Uso como módulo (Vitest): import { subir } from './servidor-teste.mjs'
 */
import { spawn, execFileSync } from 'node:child_process'
import { pbkdf2Sync, randomBytes } from 'node:crypto'
import { mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const wrangler = path.join(raiz, 'node_modules', 'wrangler', 'bin', 'wrangler.js')

/** credencial só deste ambiente de teste, criada no banco temporário */
export const ADMIN = { nome: 'Diretoria Teste', email: 'diretoria@teste.local', senha: 'senha-de-teste-123' }
export const JWT_SECRET = 'segredo-de-teste-com-mais-de-32-caracteres-ok'

function rodar(args, estado) {
  execFileSync(process.execPath, [wrangler, ...args, '--persist-to', estado], {
    cwd: raiz,
    stdio: ['ignore', 'ignore', 'inherit'],
    env: { ...process.env, CI: '1', WRANGLER_SEND_METRICS: 'false' },
  })
}

export function prepararBanco(estado) {
  rodar(['d1', 'migrations', 'apply', 'arte-de-amar', '--local'], estado)

  const salt = randomBytes(16)
  const hash = pbkdf2Sync(ADMIN.senha, salt, 100_000, 32, 'sha256').toString('base64')
  const sql = path.join(estado, 'admin.sql')
  writeFileSync(
    sql,
    `INSERT INTO usuarios (nome, email, senha_hash, salt, iteracoes) VALUES ('${ADMIN.nome}', '${ADMIN.email}', '${hash}', '${salt.toString('base64')}', 100000);`,
  )
  rodar(['d1', 'execute', 'arte-de-amar', '--local', '--file', sql], estado)
}

export async function subir(porta = 8799) {
  if (!existsSync(path.join(raiz, 'dist', 'index.html'))) {
    throw new Error('Rode `npm run build` antes dos testes de API e E2E (o servidor serve o dist/).')
  }
  const estado = mkdtempSync(path.join(tmpdir(), 'ada-teste-'))
  prepararBanco(estado)

  const servidor = spawn(
    process.execPath,
    [
      wrangler, 'pages', 'dev', 'dist',
      '--port', String(porta), '--ip', '127.0.0.1',
      '--persist-to', estado,
      '--binding', `JWT_SECRET=${JWT_SECRET}`,
      '--log-level', 'warn', '--show-interactive-dev-session=false',
    ],
    { cwd: raiz, stdio: ['ignore', 'inherit', 'inherit'], env: { ...process.env, CI: '1', WRANGLER_SEND_METRICS: 'false' } },
  )

  const url = `http://127.0.0.1:${porta}`
  for (let i = 0; i < 120; i++) {
    try {
      const r = await fetch(`${url}/api/conteudo`)
      if (r.ok) break
    } catch {
      /* ainda subindo */
    }
    if (servidor.exitCode !== null) throw new Error('o wrangler parou antes de subir')
    await new Promise((r) => setTimeout(r, 500))
    if (i === 119) throw new Error('o servidor de teste não respondeu em 60 s')
  }

  return {
    url,
    estado,
    parar() {
      servidor.kill()
      try {
        rmSync(estado, { recursive: true, force: true })
      } catch {
        /* o Windows às vezes segura o arquivo por um instante */
      }
    },
  }
}

// chamado direto pelo Playwright: sobe e fica no ar até ser encerrado
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const i = process.argv.indexOf('--porta')
  const s = await subir(i > 0 ? Number(process.argv[i + 1]) : 8799)
  console.log(`servidor de teste em ${s.url}`)
  const sair = () => {
    s.parar()
    process.exit(0)
  }
  process.on('SIGINT', sair)
  process.on('SIGTERM', sair)
}
