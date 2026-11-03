import { defineConfig, devices } from '@playwright/test'

/**
 * E2E (caixa preta pela tela): o site e o painel de verdade, num navegador,
 * contra a API e um banco D1 isolados (tests/servidor-teste.mjs).
 * Um worker só: todos os testes dividem o mesmo banco.
 *
 * Para usar um Chrome já instalado em vez do baixado pelo Playwright:
 * CHROME_PATH=/caminho/do/chrome npm run test:e2e
 */
const PORTA = 8799
const chrome = process.env.CHROME_PATH ? { launchOptions: { executablePath: process.env.CHROME_PATH } } : {}

export default defineConfig({
  testDir: 'tests/e2e',
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  timeout: 45_000,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'tests/relatorio-e2e' }]],
  use: {
    baseURL: `http://127.0.0.1:${PORTA}`,
    // sem animação: o teste olha o resultado, não a coreografia do GSAP
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  },
  projects: [
    { name: 'computador', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, ...chrome } },
    { name: 'celular', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 }, ...chrome } },
  ],
  webServer: {
    command: `node tests/servidor-teste.mjs --porta ${PORTA}`,
    url: `http://127.0.0.1:${PORTA}/api/conteudo`,
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: 'ignore',
  },
})
