import { expect, test, type Locator } from '@playwright/test'

const pseudoState = async (locator: Locator, pseudo: '::before' | '::after') => locator.evaluate((element, pseudoName) => {
  const style = getComputedStyle(element, pseudoName as '::before' | '::after')
  const matrix = style.transform === 'none' ? null : new DOMMatrixReadOnly(style.transform)
  return {
    opacity: Number.parseFloat(style.opacity),
    backgroundImage: style.backgroundImage,
    determinant: matrix ? matrix.a * matrix.d - matrix.b * matrix.c : 1,
  }
}, pseudo)

test('opened cover persists left and settled flipped sheet preserves mirrored damage identity', async ({ page }) => {
  const runtimeErrors: string[] = []
  page.on('pageerror', error => runtimeErrors.push(`pageerror: ${error.message}`))
  page.on('console', message => {
    if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`)
  })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/labs/pocket-notebook')

  const notebook = page.getByTestId('pocket-notebook')
  const paperStack = page.getByTestId('paper-stack')
  const previous = page.getByRole('button', { name: 'Previous' })

  expect((await pseudoState(paperStack, '::before')).opacity).toBe(0)

  await page.getByRole('button', { name: 'Open notebook' }).click()
  await expect(notebook).toHaveAttribute('data-notebook-state', 'open', { timeout: 3000 })

  const openedCover = await pseudoState(paperStack, '::before')
  expect(openedCover.opacity).toBe(1)
  expect(openedCover.backgroundImage).toContain('f3-03-board.webp')

  await page.getByRole('button', { name: 'Next page' }).click()
  await expect(notebook).toHaveAttribute('data-notebook-state', 'open', { timeout: 3000 })
  await expect(notebook).toHaveAttribute('data-page-index', '1')

  const firstVerso = await pseudoState(notebook, '::before')
  expect(firstVerso.opacity).toBe(1)
  expect(firstVerso.determinant).toBeLessThan(0)
  expect(firstVerso.backgroundImage).toContain('water-rings.svg')
  expect(firstVerso.backgroundImage).toContain('tide-lines.svg')
  expect(firstVerso.backgroundImage).toContain('water-stain.webp')
  expect(firstVerso.backgroundImage).toContain('foxing-heavy.webp')
  expect(firstVerso.backgroundImage).toContain('base-carried.webp')

  await previous.click()
  await expect(notebook).toHaveAttribute('data-notebook-state', 'turning-backward')
  expect((await pseudoState(notebook, '::before')).opacity).toBe(0)
  expect((await pseudoState(paperStack, '::before')).opacity).toBe(1)

  await expect(notebook).toHaveAttribute('data-notebook-state', 'open', { timeout: 3000 })
  await expect(notebook).toHaveAttribute('data-page-index', '0')
  expect((await pseudoState(notebook, '::before')).opacity).toBe(0)
  expect((await pseudoState(paperStack, '::before')).opacity).toBe(1)

  await previous.click()
  await expect(notebook).toHaveAttribute('data-notebook-state', 'closing')
  expect((await pseudoState(paperStack, '::before')).opacity).toBe(0)
  await expect(notebook).toHaveAttribute('data-notebook-state', 'closed-front', { timeout: 3000 })

  expect(runtimeErrors, runtimeErrors.join('\n')).toEqual([])
})
