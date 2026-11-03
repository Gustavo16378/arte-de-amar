import { expect, type Page, type APIRequestContext } from '@playwright/test'
// @ts-expect-error módulo .mjs sem tipos
import { ADMIN } from '../servidor-teste.mjs'

export { ADMIN }

/** entra no painel pela tela de login */
export async function entrar(page: Page, email = ADMIN.email, senha = ADMIN.senha) {
  await page.goto('/admin')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha').fill(senha)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.locator('.lateral')).toBeVisible()
}

/** sessão pela API, para preparar dados sem passar pela tela */
export async function api(request: APIRequestContext) {
  const r = await request.post('/api/auth/login', { data: { email: ADMIN.email, senha: ADMIN.senha } })
  expect(r.status()).toBe(200)
  return request
}

/** o site sem o preloader, que só atrasaria o teste */
export const abrirSite = (page: Page, ancora = '') => page.goto(`/?nopre${ancora}`)

/** a página não pode rolar de lado no celular */
export async function semRolagemLateral(page: Page) {
  const { largura, janela } = await page.evaluate(() => ({
    largura: document.documentElement.scrollWidth,
    janela: window.innerWidth,
  }))
  expect(largura).toBeLessThanOrEqual(janela + 1)
}
