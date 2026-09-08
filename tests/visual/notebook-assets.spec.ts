import { expect, test } from '@playwright/test'

test('static notebook asset lab composes without a runtime renderer', async ({ page }) => {
  const runtimeErrors: string[] = []
  page.on('pageerror', error => runtimeErrors.push(`pageerror: ${error.message}`))
  page.on('console', message => {
    if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`)
  })

  await page.goto('/labs/notebook-assets')

  await expect(page.getByRole('heading', { name: 'Static material system' })).toBeVisible()
  await expect(page.locator('.paper-composition--primary')).toBeVisible()
  await expect(page.locator('.asset-card')).toHaveCount(17)

  const humidity = page.getByRole('tab', { name: 'Humidity Affected' })
  await humidity.click()
  await expect(humidity).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('.recipe-description')).toContainText('damp bloom')

  const firstLayer = page.locator('.layer-row').first()
  await expect(firstLayer).toHaveAttribute('aria-pressed', 'true')
  await firstLayer.click()
  await expect(firstLayer).toHaveAttribute('aria-pressed', 'false')

  const runtime = await page.evaluate(() => ({
    canvas: document.querySelectorAll('canvas').length,
    webgl: document.querySelectorAll('.webgl, canvas[data-engine]').length,
    missingImages: [...document.images]
      .filter(image => !image.complete || image.naturalWidth === 0)
      .map(image => image.currentSrc || image.src),
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  }))

  expect(runtime).toEqual({
    canvas: 0,
    webgl: 0,
    missingImages: [],
    overflow: false,
  })
  expect(runtimeErrors, runtimeErrors.join('\n')).toEqual([])
})
