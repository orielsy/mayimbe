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

const readTurnedStack = async (notebook: Locator) => notebook.evaluate(element => {
  const top = getComputedStyle(element, '::before')
  const depth = getComputedStyle(element, '::after')
  return {
    topOpacity: Number.parseFloat(top.opacity),
    depthOpacity: Number.parseFloat(depth.opacity),
    topBackground: top.backgroundImage,
    depthBackground: depth.backgroundImage,
  }
})

const expectNoHorizontalOverflow = async (page: import('@playwright/test').Page) => {
  const overflow = await page.evaluate(() => (
    document.documentElement.scrollWidth > document.documentElement.clientWidth
  ))
  expect(overflow).toBe(false)
}

test('pocket notebook keeps settled flipped sheets, survives resize, reverses, and closes', async ({ page }) => {
  const runtimeErrors: string[] = []
  page.on('pageerror', error => runtimeErrors.push(`pageerror: ${error.message}`))
  page.on('console', message => {
    if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`)
  })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/labs/pocket-notebook')

  const notebook = page.getByTestId('pocket-notebook')
  const previousButton = page.getByRole('button', { name: 'Previous' })
  const openButton = page.getByRole('button', { name: 'Open notebook' })

  await expect(notebook).toHaveAttribute('data-notebook-state', 'closed-front')
  await expect(notebook).toHaveAttribute('data-paper-history', 'page-one-trauma')
  await expect(page.getByTestId('settled-cover')).toBeVisible()
  await expectRadiusMatchesAsset(notebook, page.getByTestId('settled-cover'))
  expect(await readTurnedStack(notebook)).toMatchObject({ topOpacity: 0, depthOpacity: 0 })

  await openButton.click()
  await expect(notebook).toHaveAttribute('data-notebook-state', 'opening')
  await expect(page.getByTestId('turning-cover')).toBeVisible()
  await expectRadiusMatchesAsset(notebook, page.getByTestId('turning-cover-front'))
  await expect(notebook).toHaveAttribute('data-notebook-state', 'open', { timeout: 3000 })
  await expect(page.getByTestId('turning-cover')).toHaveCount(0)
  await expect(page.getByTestId('resting-page').getByRole('heading', { name: 'Primeras notas' })).toBeVisible()
  expect(await readTurnedStack(notebook)).toMatchObject({ topOpacity: 0, depthOpacity: 0 })

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

  let turnedStack = await readTurnedStack(notebook)
  expect(turnedStack.topOpacity).toBe(1)
  expect(turnedStack.depthOpacity).toBe(0)
  expect(turnedStack.topBackground).toContain('base-carried.webp')

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

    turnedStack = await readTurnedStack(notebook)
    expect(turnedStack.topOpacity).toBe(1)
    expect(turnedStack.depthOpacity).toBe(Number(index) >= 2 ? 1 : 0)
  }

  turnedStack = await readTurnedStack(notebook)
  expect(turnedStack.topBackground).toContain('base-protected.webp')
  expect(turnedStack.depthBackground).toContain('base-humidity.webp')
  await expect(nextButton).toBeDisabled()

  // Resizing must not remount/reset notebook state or create page overflow. The
  // left stack is clipped by the exhibit stage on mobile and naturally reveals
  // more of the same structure on wider viewports.
  for (const viewport of [
    { width: 360, height: 844 },
    { width: 430, height: 900 },
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport)
    await expect(notebook).toHaveAttribute('data-notebook-state', 'open')
    await expect(notebook).toHaveAttribute('data-page-index', '5')
    await expect(notebook).toHaveAttribute('data-current-page', 'archivo-abierto')
    expect((await readTurnedStack(notebook)).topOpacity).toBe(1)
    await expectNoHorizontalOverflow(page)
  }

  const backwardPages = [
    ['5', '4', 'archivo-abierto', 'instrumento-y-memoria'],
    ['4', '3', 'instrumento-y-memoria', 'fecha-abierta'],
    ['3', '2', 'fecha-abierta', 'la-chupadera'],
    ['2', '1', 'la-chupadera', 'aprendizaje'],
    ['1', '0', 'aprendizaje', 'primeras-notas'],
  ] as const

  for (const [fromIndex, toIndex, fromId, toId] of backwardPages) {
    await previousButton.click()
    await expect(notebook).toHaveAttribute('data-notebook-state', 'turning-backward')
    await expect(page.getByTestId('turning-page')).toBeVisible()

    // Backward is intentionally asymmetric with forward: the currently settled
    // page remains on the right while the previous sheet flies back in. The top
    // settled-left pseudo sheet is hidden during this flight to avoid a duplicate.
    await expect(notebook).toHaveAttribute('data-page-index', fromIndex)
    await expect(notebook).toHaveAttribute('data-resting-page-index', fromIndex)
    await expect(notebook).toHaveAttribute('data-current-page', fromId)
    await expect(page.getByTestId('turning-page')).toHaveAttribute('data-turn-page-index', toIndex)

    turnedStack = await readTurnedStack(notebook)
    expect(turnedStack.topOpacity).toBe(0)
    expect(turnedStack.depthOpacity).toBe(Number(fromIndex) >= 2 ? 1 : 0)

    await expect(notebook).toHaveAttribute('data-notebook-state', 'open', { timeout: 3000 })
    await expect(page.getByTestId('turning-page')).toHaveCount(0)
    await expect(notebook).toHaveAttribute('data-page-index', toIndex)
    await expect(notebook).toHaveAttribute('data-resting-page-index', toIndex)
    await expect(notebook).toHaveAttribute('data-current-page', toId)

    turnedStack = await readTurnedStack(notebook)
    expect(turnedStack.topOpacity).toBe(Number(toIndex) > 0 ? 1 : 0)
    expect(turnedStack.depthOpacity).toBe(Number(toIndex) >= 2 ? 1 : 0)
  }

  await expect(notebook).toHaveAttribute('data-paper-history', 'page-one-trauma')
  expect(await readTurnedStack(notebook)).toMatchObject({ topOpacity: 0, depthOpacity: 0 })

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

test('reduced motion settles cover and page turns without retained transient layers', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/labs/pocket-notebook')

  const notebook = page.getByTestId('pocket-notebook')
  await page.getByRole('button', { name: 'Open notebook' }).click()
  await expect(notebook).toHaveAttribute('data-notebook-state', 'open')
  await expect(page.getByTestId('turning-cover')).toHaveCount(0)

  await page.getByRole('button', { name: 'Next page' }).click()
  await expect(notebook).toHaveAttribute('data-page-index', '1')
  await expect(notebook).toHaveAttribute('data-notebook-state', 'open')
  await expect(page.getByTestId('turning-page')).toHaveCount(0)
  expect((await readTurnedStack(notebook)).topOpacity).toBe(1)

  await page.getByRole('button', { name: 'Previous' }).click()
  await expect(notebook).toHaveAttribute('data-page-index', '0')
  await expect(notebook).toHaveAttribute('data-notebook-state', 'open')
  await expect(page.getByTestId('turning-page')).toHaveCount(0)
  expect((await readTurnedStack(notebook)).topOpacity).toBe(0)
})
