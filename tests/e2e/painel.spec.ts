/**
 * E2E · o painel como a diretoria usa (RF10–RF20, RNF08, RNF12).
 */
import { expect, test } from '@playwright/test'
import { ADMIN, abrirSite, entrar, semRolagemLateral } from './ajuda'

test.describe('painel', () => {
  test('RF10 · senha errada mostra o erro; a certa entra em "Textos do site"', async ({ page }) => {
    await page.goto('/admin')
    await page.getByLabel('E-mail').fill(ADMIN.email)
    await page.getByLabel('Senha').fill('senha-errada-123')
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByRole('alert')).toContainText('E-mail ou senha incorretos')
    await entrar(page)
    await expect(page.getByRole('heading', { name: 'Textos do site' })).toBeVisible()
    await semRolagemLateral(page)
  })

  test('RF11 · editar a meta de um projeto muda a barra no site', async ({ page }, info) => {
    // valor diferente por projeto do Playwright: o banco é o mesmo nas duas rodadas
    const valor = info.project.name === 'celular' ? '98' : '99'
    await entrar(page)
    await page.goto('/admin#projetos')
    await page.getByRole('button', { name: /Volta às Aulas/ }).click()
    await page.getByLabel('Já feito').fill(valor)
    await page.getByRole('button', { name: 'Salvar', exact: true }).click()
    await expect(page.getByText('Alterações salvas.')).toBeVisible()

    await abrirSite(page, '#projetos')
    const card = page.locator('.projetos__card', { hasText: 'Volta às Aulas' })
    await expect(card).toContainText(valor)
  })

  test('RF14 · trocar o subtítulo da abertura e voltar ao original', async ({ page }) => {
    await entrar(page)
    await page.getByLabel('Subtítulo').fill('Subtítulo trocado pela tela.')
    await page.getByRole('button', { name: /Salvar abertura/ }).click()
    await expect(page.getByText(/Abertura: salvo/)).toBeVisible()

    await abrirSite(page)
    await expect(page.getByText('Subtítulo trocado pela tela.')).toBeVisible()

    await page.goto('/admin#textos')
    await page.locator('.campo', { hasText: 'Subtítulo' }).getByRole('button', { name: 'voltar ao original' }).click()
    await page.getByRole('button', { name: /Salvar abertura/ }).click()
    await abrirSite(page)
    await expect(page.getByText('Desde 2015 espalhando amor')).toBeVisible()
  })

  test('RF12 · enviar foto pela tela: reduz, pede descrição e entra na biblioteca', async ({ page }) => {
    const sharp = (await import('sharp')).default
    const grande = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: '#E08A5B' } }).jpeg().toBuffer()
    await entrar(page)
    await page.goto('/admin#fotos')
    await page.locator('.soltar input[type=file]').setInputFiles({ name: 'celular.jpg', mimeType: 'image/jpeg', buffer: grande })
    await page.getByLabel('Descreva a foto').fill('Foto enviada pelo E2E')
    await page.getByRole('button', { name: 'Enviar foto' }).click()
    await expect(page.getByText('Foto enviada.')).toBeVisible()
    await page.getByRole('button', { name: 'Foto enviada pelo E2E' }).first().click()
    // RF13: chegou reduzida para 1600px no lado maior
    await expect(page.locator('.detalhe-foto')).toContainText('1600 × 1067px')
  })

  test('RNF08 · duas pessoas no mesmo projeto: a segunda recebe aviso, nada se perde', async ({ browser }) => {
    const a = await (await browser.newContext()).newPage()
    const b = await (await browser.newContext()).newPage()
    await entrar(a)
    await entrar(b)
    for (const p of [a, b]) {
      await p.goto('/admin#projetos')
      await p.getByRole('button', { name: /Natal Solidário/ }).click()
    }
    const rodada = Date.now()
    await a.getByLabel('Quem disse').fill(`Autor da pessoa A ${rodada}`)
    await a.getByRole('button', { name: 'Salvar', exact: true }).click()
    await expect(a.getByText('Alterações salvas.')).toBeVisible()

    await b.getByLabel('Quem disse').fill(`Autor da pessoa B ${rodada}`)
    await b.getByRole('button', { name: 'Salvar', exact: true }).click()
    await expect(b.getByRole('alert')).toContainText('enquanto você editava')
  })

  test('RF17 + RF18 · dar acesso, entrar com a temporária e ser obrigado a trocar', async ({ page, browser }) => {
    await entrar(page)
    await page.goto('/admin#usuarios')
    const email = `nova${Date.now()}@teste.local`
    await page.getByLabel('Nome').fill('Pessoa Nova')
    await page.getByLabel('E-mail').fill(email)
    await page.getByRole('button', { name: 'Criar acesso' }).click()
    const temp = (await page.locator('.senha-temporaria').innerText()).trim()
    expect(temp).toMatch(/^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}$/)

    const nova = await (await browser.newContext()).newPage()
    await nova.goto('/admin')
    await nova.getByLabel('E-mail').fill(email)
    await nova.getByLabel('Senha').fill(temp)
    await nova.getByRole('button', { name: 'Entrar' }).click()
    await expect(nova.getByRole('heading', { name: 'Senha nova' })).toBeVisible()
    await nova.getByLabel(/^Senha nova/).fill('minha-senha-propria')
    await nova.getByLabel('Repita a senha nova').fill('minha-senha-propria')
    await nova.getByRole('button', { name: 'Salvar e entrar' }).click()
    await expect(nova.getByRole('heading', { name: 'Textos do site' })).toBeVisible()
  })

  test('RF19 · a auditoria do dia mostra o que foi feito e por quem', async ({ page }) => {
    await entrar(page)
    await page.goto('/admin#auditoria')
    await expect(page.locator('.registro').first()).toBeVisible()
    await expect(page.locator('.auditoria')).toContainText('Diretoria entrou no painel')
    await expect(page.locator('.auditoria')).toContainText('editou o projeto Volta às Aulas')
  })

  test('RF15 · voluntário: chamar no WhatsApp marca como já chamado', async ({ page, context, request }) => {
    const nome = `Paulo ${Date.now()}`
    await request.post('/api/voluntarios', {
      data: { nome, whatsapp: '63987654321', como: '' },
      headers: { 'CF-Connecting-IP': `10.9.9.${Math.floor(Math.random() * 250)}` },
    })
    await entrar(page)
    await page.goto('/admin#voluntarios')
    const card = page.locator('.voluntario', { hasText: nome })
    await context.route('https://wa.me/**', (r) => r.fulfill({ status: 200, body: 'ok' }))
    const [aba] = await Promise.all([context.waitForEvent('page'), card.getByRole('link', { name: 'WhatsApp' }).click()])
    expect(aba.url()).toContain('wa.me/5563987654321')
    await expect(card.locator('.etiqueta')).toHaveText('Já chamado')
  })

  test('RF20 · configurações mostram o espaço do banco', async ({ page }) => {
    await entrar(page)
    await page.goto('/admin#configuracoes')
    await expect(page.getByRole('heading', { name: 'Espaço do banco' })).toBeVisible()
    await expect(page.locator('.cartao', { hasText: 'Espaço do banco' })).toContainText('500 MB')
  })

  test('RNF12 · todas as abas abrem sem rolagem lateral e sem erro', async ({ page }) => {
    const erros: string[] = []
    page.on('pageerror', (e) => erros.push(e.message))
    await entrar(page)
    for (const aba of ['textos', 'projetos', 'marcos', 'membros', 'numeros', 'fotos', 'voluntarios', 'usuarios', 'auditoria', 'configuracoes']) {
      await page.goto(`/admin#${aba}`)
      await expect(page.locator('.pagina__titulo')).toBeVisible()
      await semRolagemLateral(page)
    }
    expect(erros).toEqual([])
  })

  test('sair encerra a sessão', async ({ page }) => {
    await entrar(page)
    const sair = page.getByRole('button', { name: 'Sair' })
    await sair.click()
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
  })
})
