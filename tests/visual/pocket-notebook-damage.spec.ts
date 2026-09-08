import { expect, test } from '@playwright/test'

test('PaperV2 tide lines and spill rings follow the first-page trauma echo', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/labs/pocket-notebook')

  const notebook = page.getByTestId('pocket-notebook')
  await page.getByRole('button', { name: 'Open notebook' }).click()
  await expect(notebook).toHaveAttribute('data-notebook-state', 'open', { timeout: 3000 })

  const tide = page.locator('[data-wear-layer="wear-tide-lines"]')
  const rings = page.locator('[data-wear-layer="wear-water-rings"]')

  await expect(tide).toHaveCount(1)
  await expect(rings).toHaveCount(1)
  await expect(tide).toHaveCSS('opacity', '1')
  await expect(rings).toHaveCSS('opacity', '0.92')

  const pageOneBackgrounds = await Promise.all([
    tide.evaluate(element => getComputedStyle(element).backgroundImage),
    rings.evaluate(element => getComputedStyle(element).backgroundImage),
  ])
  expect(pageOneBackgrounds[0]).toContain('/notebook-assets/wear/tide-lines.svg')
  expect(pageOneBackgrounds[1]).toContain('/notebook-assets/wear/water-rings.svg')

  const next = page.getByRole('button', { name: 'Next page' })

  await next.click()
  await expect(notebook).toHaveAttribute('data-notebook-state', 'open', { timeout: 3000 })
  await expect(tide).toHaveCSS('opacity', '0.24')
  await expect(rings).toHaveCSS('opacity', '0.3')

  await next.click()
  await expect(notebook).toHaveAttribute('data-notebook-state', 'open', { timeout: 3000 })
  await expect(tide).toHaveCSS('opacity', '0.12')
  await expect(rings).toHaveCSS('opacity', '0.15')

  await next.click()
  await expect(notebook).toHaveAttribute('data-notebook-state', 'open', { timeout: 3000 })
  await expect(tide).toHaveCount(0)
  await expect(rings).toHaveCount(0)

  // Foxing remains independently present in the humidity progression.
  await expect(page.locator('[data-wear-layer="wear-foxing-light"]')).toHaveCount(1)
})
