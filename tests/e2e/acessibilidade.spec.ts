/**
 * E2E · acessibilidade automática com axe-core (RNF13).
 * Falha em violação "serious" ou "critical" das regras WCAG 2 A e AA.
 */
import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { abrirSite, entrar } from './ajuda'

const auditar = async (page: import('@playwright/test').Page) => {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  const graves = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  return graves.map((v) => `${v.id} (${v.impact}): ${v.nodes.length}× ${v.help} → ${v.nodes[0]?.target.join(' ')}`)
}

test('RNF13 · site sem violações graves', async ({ page }) => {
  await abrirSite(page)
  await expect(page.locator('h1')).toBeVisible()
  expect(await auditar(page)).toEqual([])
})

test('RNF13 · login do painel sem violações graves', async ({ page }) => {
  await page.goto('/admin')
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
  expect(await auditar(page)).toEqual([])
})

test('RNF13 · abas do painel sem violações graves', async ({ page }) => {
  await entrar(page)
  const problemas: string[] = []
  for (const aba of ['textos', 'projetos', 'fotos', 'voluntarios', 'usuarios', 'auditoria', 'configuracoes']) {
    await page.goto(`/admin#${aba}`)
    await expect(page.locator('.pagina__titulo')).toBeVisible()
    problemas.push(...(await auditar(page)).map((p) => `${aba}: ${p}`))
  }
  expect(problemas).toEqual([])
})
