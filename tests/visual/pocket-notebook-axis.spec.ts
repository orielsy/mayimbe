import { expect, test, type Locator } from '@playwright/test'

const pseudoTransform = async (locator: Locator, pseudo: '::before' | '::after') => locator.evaluate((element, pseudoName) => {
  const style = getComputedStyle(element, pseudoName as '::before' | '::after')
  const matrix = style.transform === 'none' ? null : new DOMMatrixReadOnly(style.transform)
  return {
    opacity: Number.parseFloat(style.opacity),
    transformOrigin: style.transformOrigin,
    m11: matrix?.m11 ?? 1,
    m41: matrix?.m41 ?? 0,
  }
}, pseudo)

test('settled cover and page share the transient left-edge hinge endpoint', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/labs/pocket-notebook')

  const notebook = page.getByTestId('pocket-notebook')
  const paperStack = page.getByTestId('paper-stack')

  await page.getByRole('button', { name: 'Open notebook' }).click()
  await expect(notebook).toHaveAttribute('data-notebook-state', 'open', { timeout: 3000 })

  const cover = await pseudoTransform(paperStack, '::before')
  expect(cover.opacity).toBe(1)
  expect(cover.transformOrigin.startsWith('0px ')).toBe(true)
  expect(cover.m11).toBeCloseTo(Math.cos(178 * Math.PI / 180), 3)
  expect(Math.abs(cover.m41)).toBeLessThan(0.01)

  await page.getByRole('button', { name: 'Next page' }).click()
  await expect(notebook).toHaveAttribute('data-notebook-state', 'open', { timeout: 3000 })
  await expect(notebook).toHaveAttribute('data-page-index', '1')

  const verso = await pseudoTransform(notebook, '::before')
  expect(verso.opacity).toBe(1)
  expect(verso.transformOrigin.startsWith('0px ')).toBe(true)
  expect(verso.m11).toBeCloseTo(Math.cos(178 * Math.PI / 180), 3)
  expect(Math.abs(verso.m41)).toBeLessThan(0.01)
})
