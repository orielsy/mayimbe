import { expect, test, type Locator } from '@playwright/test'

const expectRadiusMatchesAsset = async (notebook: Locator, face: Locator) => {
  const width = await notebook.evaluate(element => element.getBoundingClientRect().width)
  const radius = await face.evaluate(element => ({
    left: parseFloat(getComputedStyle(element).borderTopLeftRadius),
    right: parseFloat(getComputedStyle(element).borderTopRightRadius),
  }))

  expect(Math.abs(radius.left - width * 5 / 840)).toBeLessThan(0.2)
  expect(Math.abs(radius.right - width * 20 / 840)).toBeLessThan(0.2)
}

test('pocket notebook opens, turns through all pages, reverses, and closes with transient DOM only', async ({ page }) => {
  const runtimeErrors: string[] = []
  page.on('pageerror', error => runtimeErrors.push(`pageerror: ${error.message}`))
  page.on('console', message => {
    if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`)
  })

  await page.goto('/labs/pocket-notebook')

  const notebook = page.getByTestId('pocket-notebook')
  const previousButton = page.getByRole('button', { name: 'Previous' })
  const openButton = page.getByRole('button', { name: 'Open notebook' })

  await expect(notebook).toHaveAttribute('data-notebook-state', 'closed-front')
  await expect(notebook).toHaveAttribute('data-paper-history', 'page-one-trauma')
  await expect(page.getByTestId('settled-cover')).toBeVisible()
  await expectRadiusMatchesAsset(notebook, page.getByTestId('settled-cover'))

  await openButton.click()
  await expect(notebook).toHaveAttribute('data-notebook-state', 'opening')
  await expect(page.getByTestId('turning-cover')).toBeVisible()
  await expectRadiusMatchesAsset(notebook, page.getByTestId('turning-cover-front'))
  await expect(notebook).toHaveAttribute('data-notebook-state', 'open', { timeout: 3000 })
  await expect(page.getByTestId('turning-cover')).toHaveCount(0)
  await expect(page.getByTestId('resting-page').getByRole('heading', { name: 'Primeras notas' })).toBeVisible()

  const nextButton = page.getByRole('button', { name: 'Next page' })

  // Rapid input while the temporary sheet is active must not skip a page.
  await nextButton.click()
  await expect(notebook).toHaveAttribute('data-notebook-state', 'turning-forward')
  await expect(notebook).toHaveAttribute('data-resting-page-index', '1')
  await expect(page.getByTestId('turning-page')).toHaveAttribute('data-turn-page-index', '0')
  await page.keyboard.press('ArrowRight')
  await expect(notebook).toHaveAttribute('data-notebook-state', 'open', { timeout: 3000 })
  await expect(notebook).toHaveAttribute('data-page-index', '1')
  await expect(page.getByTestId('turning-page')).toHaveCount(0)
  await expect(notebook).toHaveAttribute('data-current-page', 'aprendizaje')
  await expect(notebook).toHaveAttribute('data-paper-history', 'trauma-echo-humidity-rise')

  const forwardPages = [
    ['2', 'la-chupadera', 'humidity-peak-trauma-echo'],
    ['3', 'fecha-abierta', 'humidity-recedes-family-transition'],
    ['4', 'instrumento-y-memoria', 'protected-interior'],
    ['5', 'archivo-abierto', 'deep-protected-interior'],
  ] as const

  for (const [index, id, history] of forwardPages) {
    await nextButton.click()
    await expect(notebook).toHaveAttribute('data-notebook-state', 'turning-forward')
    await expect(page.getByTestId('turning-page')).toBeVisible()
    await expect(notebook).toHaveAttribute('data-notebook-state', 'open', { timeout: 3000 })
    await expect(page.getByTestId('turning-page')).toHaveCount(0)
    await expect(notebook).toHaveAttribute('data-page-index', index)
    await expect(notebook).toHaveAttribute('data-current-page', id)
    await expect(notebook).toHaveAttribute('data-paper-history', history)
  }

  await expect(nextButton).toBeDisabled()

  for (const index of ['4', '3', '2', '1', '0']) {
    await previousButton.click()
    await expect(notebook).toHaveAttribute('data-notebook-state', 'turning-backward')
    await expect(page.getByTestId('turning-page')).toBeVisible()
    await expect(notebook).toHaveAttribute('data-notebook-state', 'open', { timeout: 3000 })
    await expect(page.getByTestId('turning-page')).toHaveCount(0)
    await expect(notebook).toHaveAttribute('data-page-index', index)
  }

  await expect(notebook).toHaveAttribute('data-paper-history', 'page-one-trauma')
  await previousButton.click()
  await expect(notebook).toHaveAttribute('data-notebook-state', 'closing')
  await expect(page.getByTestId('turning-cover')).toBeVisible()
  await expectRadiusMatchesAsset(notebook, page.getByTestId('turning-cover-front'))
  await expect(notebook).toHaveAttribute('data-notebook-state', 'closed-front', { timeout: 3000 })
  await expect(page.getByTestId('turning-cover')).toHaveCount(0)
  await expect(page.getByTestId('turning-page')).toHaveCount(0)
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
