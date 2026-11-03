/**
 * E2E · o site como o visitante vê (RF01–RF07, RNF15).
 */
import { expect, test } from '@playwright/test'
import { abrirSite, api, semRolagemLateral } from './ajuda'

test.describe('site público', () => {
  test('RF01 · abre sem erro e mostra o conteúdo do banco', async ({ page }) => {
    const erros: string[] = []
    page.on('pageerror', (e) => erros.push(e.message))
    page.on('console', (m) => m.type() === 'error' && erros.push(m.text()))

    await abrirSite(page)
    await expect(page.locator('h1')).toContainText('A arte de')
    await expect(page.locator('.projetos__card')).toHaveCount(6)
    await expect(page.locator('.diretoria__nome').first()).toContainText('Aline Milani')
    await semRolagemLateral(page)
    expect(erros).toEqual([])
  })

  test('RF03 / RNF15 · com a API fora do ar, abre com o conteúdo de reserva', async ({ page }) => {
    await page.route('**/api/conteudo', (r) => r.abort())
    await abrirSite(page)
    await expect(page.locator('h1')).toContainText('A arte de')
    await expect(page.locator('.projetos__card')).toHaveCount(6)
    await expect(page.locator('.diretoria__nome').first()).toBeVisible()
  })

  test('RF03 · com a API lenta, não espera mais que 2,5 s', async ({ page }) => {
    await page.route('**/api/conteudo', async (r) => {
      await new Promise((ok) => setTimeout(ok, 6000))
      await r.continue().catch(() => {})
    })
    const inicio = Date.now()
    await abrirSite(page)
    await expect(page.locator('h1')).toBeVisible({ timeout: 5000 })
    expect(Date.now() - inicio).toBeLessThan(5000)
  })

  test('RF04 · inscrição de voluntário chega ao painel', async ({ page, request }) => {
    await abrirSite(page, '#como-ajudar')
    const form = page.locator('form.ajudar__bloco--voluntario')
    await form.scrollIntoViewIfNeeded()
    await form.locator('input[name=nome]').fill('Joana E2E')
    await form.locator('input[name=whatsapp]').fill('(63) 98111-2233')
    await form.locator('textarea[name=como]').fill('Fotografia nas ações')
    await form.getByRole('button', { name: /voluntário/i }).click()
    await expect(page.locator('.ajudar__sucesso')).toBeVisible()

    const r = await (await api(request)).get('/api/admin/voluntarios')
    const nomes = (await r.json()).itens.map((v: { nome: string }) => v.nome)
    expect(nomes).toContain('Joana E2E')
  })

  test('RF04 · erro de validação aparece no formulário, sem perder o que foi digitado', async ({ page }) => {
    await abrirSite(page, '#como-ajudar')
    const form = page.locator('form.ajudar__bloco--voluntario')
    await form.scrollIntoViewIfNeeded()
    await form.locator('input[name=nome]').fill('Zé')
    await form.locator('input[name=whatsapp]').fill('123')
    await form.getByRole('button', { name: /voluntário/i }).click()
    await expect(form.getByRole('alert')).toContainText(/WhatsApp/)
    await expect(form.locator('input[name=nome]')).toHaveValue('Zé')
  })

  test('RF05 · com a API fora do ar, a inscrição abre o WhatsApp com a mensagem pronta', async ({ page, context }) => {
    await page.route('**/api/voluntarios', (r) => r.fulfill({ status: 503, body: '' }))
    await abrirSite(page, '#como-ajudar')
    const form = page.locator('form.ajudar__bloco--voluntario')
    await form.scrollIntoViewIfNeeded()
    await form.locator('input[name=nome]').fill('Carla')
    await form.locator('input[name=whatsapp]').fill('63981112233')
    // a aba do WhatsApp é interceptada antes de sair para a internet
    await context.route('https://wa.me/**', (r) => r.fulfill({ status: 200, body: 'whatsapp' }))
    const [aba] = await Promise.all([context.waitForEvent('page'), form.getByRole('button', { name: /voluntário/i }).click()])
    expect(decodeURIComponent(aba.url())).toContain('Meu nome é Carla')
    await expect(page.locator('.ajudar__sucesso')).toBeVisible()
  })

  test('RF06 · texto trocado no painel aparece no site; HTML vira texto, não executa', async ({ page, request }) => {
    const ctx = await api(request)
    await ctx.put('/api/admin/textos', {
      data: { valores: { 'hero.subtitulo': '<img src=x onerror="window.__xss=1"> Subtítulo do E2E' } },
    })
    let alerta = false
    page.on('dialog', (d) => {
      alerta = true
      d.dismiss()
    })
    await abrirSite(page)
    await expect(page.getByText('<img src=x onerror="window.__xss=1"> Subtítulo do E2E')).toBeVisible()
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined()
    expect(alerta).toBe(false)
    await ctx.put('/api/admin/textos', { data: { valores: { 'hero.subtitulo': null } } })
  })

  test('RF02 · seção esvaziada no painel sai da página', async ({ page, request }) => {
    const ctx = await api(request)
    const itens = (await (await ctx.get('/api/admin/numeros')).json()).itens
    for (const n of itens) await ctx.put(`/api/admin/numeros/${n.id}`, { data: { visivel: 0 } })
    await abrirSite(page)
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('[data-secao="numeros"]')).toHaveCount(0)
    for (const n of itens) await ctx.put(`/api/admin/numeros/${n.id}`, { data: { visivel: 1 } })
  })
})

test.describe('PIX', () => {
  test('RF21 · o QR Code lido pela câmera é o mesmo código do "copia e cola", com a chave da ONG', async ({ page, context }, info) => {
    await abrirSite(page, '#como-ajudar')
    const quadro = page.locator('.ajudar__qr-quadro')
    await quadro.scrollIntoViewIfNeeded()
    await expect(quadro.locator('svg[role=img]')).toBeVisible()

    const botao = page.locator('.ajudar__copia-e-cola')
    const payload = (await botao.getAttribute('data-payload')) ?? ''
    expect(payload).toMatch(/^000201.*br\.gov\.bcb\.pix0114\d{14}.*6304[0-9A-F]{4}$/)

    // lê o QR da tela como um app de banco: screenshot → pixels → decodificador
    const sharp = (await import('sharp')).default
    const jsQR = (await import('jsqr')).default
    const png = await quadro.screenshot()
    const { data, info: img } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    const lido = jsQR(new Uint8ClampedArray(data), img.width, img.height)
    expect(lido?.data).toBe(payload)

    // o copia e cola leva exatamente o mesmo código
    if (info.project.name === 'computador') {
      await context.grantPermissions(['clipboard-read', 'clipboard-write'])
      await botao.click()
      await expect(botao).toHaveText(/copiado/)
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(payload)
    }
  })

  test('RF21 · trocar a chave no painel troca o QR do site', async ({ page, request }) => {
    const ctx = await api(request)
    await ctx.put('/api/admin/configuracoes', { data: { pix: 'contato@artedeamar.org' } })
    await abrirSite(page, '#como-ajudar')
    const payload = await page.locator('.ajudar__copia-e-cola').getAttribute('data-payload')
    expect(payload).toContain('0122contato@artedeamar.org')
    await ctx.put('/api/admin/configuracoes', { data: { pix: '40.019.106/0001-51' } })
  })
})
