import { defineConfig } from 'vitest/config'
import PorNome from './tests/api/sequenciador.ts'

/**
 * Três suítes, rodadas por `npm test` (ver docs/testes.md):
 * - unit: caixa branca das bibliotecas (auth, validação, textos, zip…)
 * - db:   esquema, constraints e migrations num SQLite em memória
 * - api:  caixa preta e cinza contra a API real (wrangler + D1 isolado)
 */
export default defineConfig({
  test: {
    // o sequenciador é global no Vitest; só a suíte de API depende da ordem
    sequence: { sequencer: PorNome },
    coverage: {
      provider: 'v8',
      include: ['functions/_lib/**', 'src/lib/textos.ts', 'src/lib/conteudo-remoto.ts', 'src/admin/zip.ts'],
      reporter: ['text', 'html'],
    },
    projects: [
      { test: { name: 'unit', include: ['tests/unit/**/*.test.ts'], environment: 'node' } },
      { test: { name: 'db', include: ['tests/db/**/*.test.ts'], environment: 'node' } },
      {
        test: {
          name: 'api',
          include: ['tests/api/**/*.test.ts'],
          environment: 'node',
          globalSetup: ['tests/api/setup.ts'],
          // um banco só para a rodada: os arquivos rodam em sequência
          fileParallelism: false,
          testTimeout: 20_000,
          hookTimeout: 90_000,
        },
      },
    ],
  },
})
