/**
 * Cria (ou troca a senha de) um usuário do painel.
 *
 * A senha nunca vai para o Git nem para o banco em texto: o script calcula
 * o hash PBKDF2 aqui, com os mesmos parâmetros da API, e grava só o hash.
 *
 * Uso:
 *   node scripts/criar-admin.mjs --local  "Nome" email@ong.org
 *   node scripts/criar-admin.mjs --remote "Nome" email@ong.org
 * A senha é pedida no terminal, sem aparecer na tela.
 */
import { pbkdf2Sync, randomBytes } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import readline from 'node:readline'

const ITERACOES = 100_000 // o mesmo de functions/_lib/auth.ts

const args = process.argv.slice(2)
const alvo = args.find((a) => a === '--local' || a === '--remote')
const [nome, email] = args.filter((a) => !a.startsWith('--'))

if (!alvo || !nome || !email) {
  console.error('Uso: node scripts/criar-admin.mjs --local|--remote "Nome" email')
  process.exit(1)
}

function perguntarSenha() {
  if (process.env.SENHA_ADMIN) return Promise.resolve(process.env.SENHA_ADMIN)
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    rl._writeToOutput = (s) => {
      if (s.includes('Senha')) rl.output.write(s)
    }
    rl.question('Senha (mínimo 10 caracteres): ', (s) => {
      rl.close()
      process.stdout.write('\n')
      resolve(s)
    })
  })
}

const senha = await perguntarSenha()
if (senha.length < 10) {
  console.error('A senha precisa ter pelo menos 10 caracteres.')
  process.exit(1)
}

const salt = randomBytes(16)
const hash = pbkdf2Sync(senha, salt, ITERACOES, 32, 'sha256').toString('base64')
const q = (s) => `'${String(s).replace(/'/g, "''")}'`

const sql = `INSERT INTO usuarios (nome, email, senha_hash, salt, iteracoes)
VALUES (${q(nome)}, ${q(email.toLowerCase())}, ${q(hash)}, ${q(salt.toString('base64'))}, ${ITERACOES})
ON CONFLICT(email) DO UPDATE SET nome = excluded.nome, senha_hash = excluded.senha_hash,
  salt = excluded.salt, iteracoes = excluded.iteracoes;`

const pasta = mkdtempSync(path.join(tmpdir(), 'ada-'))
const arquivo = path.join(pasta, 'admin.sql')
writeFileSync(arquivo, sql)
try {
  execFileSync('npx', ['wrangler', 'd1', 'execute', 'arte-de-amar', alvo, '--file', arquivo], { stdio: 'inherit' })
  console.log(`Usuário ${email} pronto (${alvo.slice(2)}).`)
} finally {
  rmSync(pasta, { recursive: true, force: true })
}
