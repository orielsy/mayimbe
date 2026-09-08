import { expect, test } from '@playwright/test'

test('pocket notebook cover opens and closes without losing settled DOM', async ({ page }) => {
  const runtimeErrors: string[] = []
  page.on('pageerror', error => runtimeErrors.push(`pageerror: ${error.message}`))
  page.on('console', message => {
    if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`)
  })

  await page.goto('/labs/pocket-notebook')

  const notebook = page.getByTestId('pocket-notebook')
  const openButton = page.getByRole('button', { name: 'Open notebook' })
  const previousButton = page.getByRole('button', { name: 'Previous' })

  await expect(notebook).toHaveAttribute('data-notebook-state', 'closed-front')
  await expect(notebook).toHaveAttribute('data-paper-history', 'page-one-trauma')
  await expect(page.getByTestId('settled-cover')).toBeVisible()
  await page.waitForTimeout(900)
  await expect(page.getByTestId('settled-cover')).toBeVisible()
  await expect(page.getByTestId('turning-cover')).toHaveCount(0)

  const stackDepth = await page.getByTestId('paper-stack').locator('.paper-stack__sheet').evaluateAll(sheets => (
    sheets.map(sheet => ({
      depth: Number((sheet as HTMLElement).dataset.stackDepth),
      z: Number(getComputedStyle(sheet).zIndex),
      filter: getComputedStyle(sheet).filter,
    }))
  ))
  expect(stackDepth).toHaveLength(7)
  expect(stackDepth[0]!.z).toBeGreaterThan(stackDepth.at(-1)!.z)
  expect(stackDepth.every(sheet => sheet.filter !== 'none')).toBe(true)

  await openButton.click()
  await expect(notebook).toHaveAttribute('data-notebook-state', 'opening')
  await expect(page.getByTestId('turning-cover')).toBeVisible()
  await expect(page.getByTestId('turning-cover-front')).toHaveCSS('border-top-right-radius', '0px')
  await expect(page.getByTestId('turning-cover-front')).toHaveCSS('border-bottom-right-radius', '0px')

  await expect(notebook).toHaveAttribute('data-notebook-state', 'open', { timeout: 3000 })
  await expect(page.getByTestId('turning-cover')).toHaveCount(0)
  await expect(page.getByTestId('settled-cover')).toHaveCount(0)
  await expect(page.getByTestId('resting-page')).toBeVisible()
  await expect(page.getByTestId('resting-page').getByRole('heading', { name: 'Primeras notas' })).toBeVisible()
  await expect(page.locator('[data-wear-layer="wear-water-stain"]')).toHaveCSS('opacity', '0.92')
  await expect(page.locator('[data-wear-layer="wear-edge-oxidation"]')).toHaveCSS('opacity', '0.92')
  await expect(page.locator('[data-wear-layer="wear-handling-grime"]')).toHaveCSS('opacity', '0.95')

  await page.waitForTimeout(900)
  await expect(notebook).toHaveAttribute('data-notebook-state', 'open')
  await expect(page.getByTestId('resting-page')).toBeVisible()

  await previousButton.click()
  await expect(notebook).toHaveAttribute('data-notebook-state', 'closing')
  await expect(page.getByTestId('turning-cover')).toBeVisible()
  await expect(page.getByTestId('turning-cover-front')).toHaveCSS('border-top-right-radius', '0px')
  await expect(notebook).toHaveAttribute('data-notebook-state', 'closed-front', { timeout: 3000 })
  await expect(page.getByTestId('turning-cover')).toHaveCount(0)
  await expect(page.getByTestId('settled-cover')).toBeVisible()
  await page.waitForTimeout(900)
  await expect(page.getByTestId('settled-cover')).toBeVisible()

  const runtime = await page.evaluate(() => ({
    canvas: document.querySelectorAll('canvas').length,
    missingImages: [...document.images]
      .filter(image => !image.complete || image.naturalWidth === 0)
      .map(image => image.currentSrc || image.src),
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  }))

  expect(runtime).toEqual({ canvas: 0, missingImages: [], overflow: false })
  expect(runtimeErrors, runtimeErrors.join('\n')).toEqual([])
})
