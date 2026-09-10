import { expect, test } from '@playwright/test'

const root = (page: import('@playwright/test').Page) => page.locator('.pn-root')

async function expectReady(page: import('@playwright/test').Page) {
  await expect(root(page)).toHaveAttribute('data-nb-ready', 'true')
}

async function expectSettledPage(
  page: import('@playwright/test').Page,
  expected: string,
) {
  await expect(root(page)).toHaveAttribute('data-nb-state', expected === 'cover' ? 'closed-front' : 'open')
  await expect(root(page)).toHaveAttribute('data-nb-page', expected)
  await expect(root(page)).toHaveAttribute('data-nb-busy', 'false')
}

test('Vue Page Turner traverses the notebook and returns to the cover', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text())
  })

  await page.goto('/museum/notebook')
  await expect(page.getByTestId('notebook-integration-root')).toBeVisible()
  await expectReady(page)
  await expectSettledPage(page, 'cover')

  await page.getByTestId('pn-next').click()
  await expectSettledPage(page, '1')

  for (let pageNumber = 2; pageNumber <= 8; pageNumber += 1) {
    await page.getByTestId('pn-next').click()
    await expectSettledPage(page, String(pageNumber))
  }

  await page.getByTestId('pn-next').click()
  await expectSettledPage(page, 'dedication')
  await expect(page.getByTestId('pn-next')).toBeDisabled()

  for (let pageNumber = 8; pageNumber >= 1; pageNumber -= 1) {
    await page.getByTestId('pn-prev').click()
    await expectSettledPage(page, String(pageNumber))
  }

  await page.getByTestId('pn-prev').click()
  await expectSettledPage(page, 'cover')

  const runtime = await page.evaluate(() => ({
    canvasCount: document.querySelectorAll('canvas').length,
    brokenImages: Array.from(document.images)
      .filter(image => image.complete && image.naturalWidth === 0)
      .map(image => image.currentSrc || image.src),
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  }))

  expect(runtime.canvasCount).toBe(0)
  expect(runtime.brokenImages).toEqual([])
  expect(runtime.horizontalOverflow).toBe(false)
  expect(errors).toEqual([])
})

test('semantic notebook target opens the matching authored page', async ({ page }) => {
  await page.goto('/museum/notebook/early-years')
  await expectReady(page)
  await expectSettledPage(page, '2')
  await expect(page.getByTestId('pn-status')).toContainText('Güira first')
})

test('Vue Page Turner keeps its page across responsive resize', async ({ page }) => {
  await page.goto('/museum/notebook')
  await expectReady(page)

  await page.getByTestId('pn-next').click()
  await expectSettledPage(page, '1')

  for (const expected of ['2', '3', '4']) {
    await page.getByTestId('pn-next').click()
    await expectSettledPage(page, expected)
  }

  for (const viewport of [
    { width: 360, height: 844 },
    { width: 430, height: 900 },
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport)
    await expectSettledPage(page, '4')
  }
})

test('Vue Page Turner settles immediately with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/museum/notebook')
  await expectReady(page)

  await page.getByTestId('pn-next').click()
  await expectSettledPage(page, '1')
  await expect(page.locator('.pn-turn')).toHaveCount(0)

  await page.getByTestId('pn-next').click()
  await expectSettledPage(page, '2')
  await expect(page.locator('.pn-turn')).toHaveCount(0)

  await page.getByTestId('pn-prev').click()
  await expectSettledPage(page, '1')
  await expect(page.locator('.pn-turn')).toHaveCount(0)
})
