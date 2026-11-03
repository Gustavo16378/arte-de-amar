/**
 * Banco · migrations/*.sql aplicadas do zero num SQLite em memória.
 * O D1 é SQLite; aqui conferimos o que o próprio banco garante, mesmo se a
 * API tivesse um bug: tipos, CHECKs, chaves únicas e estrangeiras.
 * RNF09, RNF10, RNF14, RNF16.
 */
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { beforeEach, describe, expect, it } from 'vitest'

const pasta = path.resolve(__dirname, '../../migrations')
const migrations = readdirSync(pasta).filter((f) => f.endsWith('.sql')).sort()

let db: DatabaseSync

function novoBanco(ate = migrations.length) {
  const d = new DatabaseSync(':memory:')
  d.exec('PRAGMA foreign_keys = ON')
  for (const m of migrations.slice(0, ate)) d.exec(readFileSync(path.join(pasta, m), 'utf8'))
  return d
}

const um = (sql: string, ...p: (string | number | null)[]) => db.prepare(sql).get(...p) as Record<string, unknown>
const executar = (sql: string, ...p: (string | number | null)[]) => db.prepare(sql).run(...p)

beforeEach(() => {
  db = novoBanco()
})

describe('RNF16 · migrations', () => {
  it('estão numeradas em sequência, sem buraco nem repetição', () => {
    const numeros = migrations.map((m) => Number(m.slice(0, 4)))
    expect(numeros).toEqual(numeros.map((_, i) => i + 1))
  })

  it('aplicam do zero sem erro, uma por vez', () => {
    for (let i = 1; i <= migrations.length; i++) expect(() => novoBanco(i)).not.toThrow()
  })

  it('criam todas as tabelas esperadas', () => {
    const tabelas = (db.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`).all() as {
      name: string
    }[]).map((t) => t.name)
    expect(tabelas.sort()).toEqual(
      ['auditoria', 'configuracoes', 'marcos', 'membros', 'midias', 'numeros', 'projetos', 'tentativas', 'textos', 'usuarios', 'voluntarios'].sort(),
    )
  })

  it('o banco passa no integrity_check e no foreign_key_check', () => {
    expect(um('PRAGMA integrity_check').integrity_check).toBe('ok')
    expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([])
  })
})

describe('seed: o site começa com o conteúdo aprovado', () => {
  it.each([
    ['projetos', 6],
    ['marcos', 7],
    ['membros', 6],
    ['numeros', 4],
    ['configuracoes', 2],
  ])('%s tem %i linhas', (tabela, n) => {
    expect(um(`SELECT COUNT(*) AS n FROM ${tabela}`).n).toBe(n)
  })

  it('a diretoria real está visível com retrato, e os cargos sem nome estão ocultos', () => {
    const visiveis = db
      .prepare('SELECT nome, cargo, foto_id FROM membros WHERE visivel = 1 ORDER BY ordem')
      .all() as { nome: string; foto_id: number }[]
    expect(visiveis.map((m) => m.nome)).toEqual(['Aline Milani', 'Larissa Lima', 'Julia Belga', 'Dayane Carvalho'])
    expect(visiveis.every((m) => m.foto_id !== null)).toBe(true)
    expect(um(`SELECT COUNT(*) AS n FROM membros WHERE visivel = 0`).n).toBe(2)
  })

  it('toda foto citada pelo seed existe em midias', () => {
    const orfas = db
      .prepare(
        `SELECT 'projetos' t, foto_id FROM projetos WHERE foto_id NOT IN (SELECT id FROM midias)
         UNION ALL SELECT 'marcos', foto_id FROM marcos WHERE foto_id NOT IN (SELECT id FROM midias)`,
      )
      .all()
    expect(orfas).toEqual([])
  })

  it('não vem nenhum usuário: login só é criado pelo script, com senha fora do Git', () => {
    expect(um('SELECT COUNT(*) AS n FROM usuarios').n).toBe(0)
  })
})

describe('RNF10 · o banco recusa dado inválido mesmo sem a API', () => {
  it('status de projeto fora da lista', () => {
    expect(() =>
      executar(
        `INSERT INTO projetos (nome, objetivo, objetivo_curto, publico, status, foto_id) VALUES ('x','x','x','x','Pausado',1)`,
      ),
    ).toThrow(/CHECK/)
  })

  it('visivel só 0 ou 1', () => {
    expect(() => executar('UPDATE numeros SET visivel = 2 WHERE id = 1')).toThrow(/CHECK/)
  })

  it('meta negativa ou total zero', () => {
    expect(() => executar('UPDATE projetos SET meta_feito = -1 WHERE id = 1')).toThrow(/CHECK/)
    expect(() => executar('UPDATE projetos SET meta_total = 0 WHERE id = 1')).toThrow(/CHECK/)
  })

  it('foto sem arquivo e sem bytes', () => {
    expect(() => executar(`INSERT INTO midias (alt, largura, altura) VALUES ('x', 10, 10)`)).toThrow(/CHECK/)
  })

  it('foto com dimensão zero', () => {
    expect(() => executar(`INSERT INTO midias (caminho, alt, largura, altura) VALUES ('/a.jpg', 'x', 0, 10)`)).toThrow(/CHECK/)
  })

  it('status de voluntário fora da lista', () => {
    expect(() => executar(`INSERT INTO voluntarios (nome, whatsapp, status) VALUES ('A', '63', 'sumido')`)).toThrow(/CHECK/)
  })

  it('ação de auditoria fora da lista', () => {
    expect(() => executar(`INSERT INTO auditoria (usuario_nome, acao, area) VALUES ('A', 'hackeou', 'x')`)).toThrow(/CHECK/)
  })

  it('e-mail repetido, sem diferenciar maiúsculas', () => {
    const ins = `INSERT INTO usuarios (nome, email, senha_hash, salt, iteracoes) VALUES ('A', ?, 'h', 's', 1)`
    executar(ins, 'aline@ong.org')
    expect(() => executar(ins, 'ALINE@ong.org')).toThrow(/UNIQUE/)
  })

  it('chave de texto repetida', () => {
    executar(`INSERT INTO textos (chave, valor) VALUES ('hero.titulo', 'a')`)
    expect(() => executar(`INSERT INTO textos (chave, valor) VALUES ('hero.titulo', 'b')`)).toThrow(/UNIQUE|PRIMARY/)
  })
})

describe('RNF10 · chaves estrangeiras', () => {
  it('foto usada por projeto não pode ser apagada (RESTRICT)', () => {
    const { foto_id } = um('SELECT foto_id FROM projetos LIMIT 1')
    expect(() => executar('DELETE FROM midias WHERE id = ?', foto_id as number)).toThrow(/FOREIGN KEY/)
  })

  it('projeto não pode apontar para foto inexistente', () => {
    expect(() => executar('UPDATE projetos SET foto_id = 9999 WHERE id = 1')).toThrow(/FOREIGN KEY/)
  })

  it('apagar o retrato deixa a pessoa da diretoria sem foto (SET NULL), sem apagar a pessoa', () => {
    const { id } = um(`SELECT id FROM midias WHERE caminho LIKE '%aline-milani%'`)
    // tira a foto de qualquer outro uso para o RESTRICT não barrar
    executar('DELETE FROM midias WHERE id = ?', id as number)
    expect(um(`SELECT foto_id FROM membros WHERE nome = 'Aline Milani'`).foto_id).toBeNull()
  })
})

describe('RNF08 · versão para edição simultânea', () => {
  it.each(['projetos', 'marcos', 'membros', 'numeros'])('%s começa na versão 0', (t) => {
    expect(um(`SELECT MIN(versao) AS a, MAX(versao) AS b FROM ${t}`)).toEqual({ a: 0, b: 0 })
  })

  it('UPDATE com a versão antiga não altera nada (é o que a API usa)', () => {
    executar('UPDATE projetos SET nome = ?, versao = versao + 1 WHERE id = 1 AND versao = 0', 'Primeira')
    const r = executar('UPDATE projetos SET nome = ?, versao = versao + 1 WHERE id = 1 AND versao = 0', 'Segunda')
    expect(r.changes).toBe(0)
    expect(um('SELECT nome, versao FROM projetos WHERE id = 1')).toEqual({ nome: 'Primeira', versao: 1 })
  })
})

describe('RNF14 · índices para as consultas do dia a dia', () => {
  it.each([
    ['auditoria', 'criado_em'],
    ['tentativas', 'chave'],
    ['voluntarios', 'criado_em'],
    ['projetos', 'ordem'],
  ])('%s tem índice em %s', (tabela, coluna) => {
    const indices = db.prepare(`SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = ?`).all(tabela) as {
      name: string
    }[]
    const colunas = indices.flatMap((i) => (db.prepare(`PRAGMA index_info(${i.name})`).all() as { name: string }[]).map((c) => c.name))
    expect(colunas).toContain(coluna)
  })

  it('a consulta da auditoria por dia usa o índice', () => {
    const plano = JSON.stringify(
      db.prepare(`EXPLAIN QUERY PLAN SELECT * FROM auditoria WHERE criado_em >= ? AND criado_em < ? ORDER BY id DESC`).all('a', 'b'),
    )
    expect(plano).toMatch(/idx_auditoria_criado|USING INDEX|PRIMARY KEY/)
  })
})
