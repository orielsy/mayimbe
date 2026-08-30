import { expect, test, type Page } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const visualDir = path.resolve('visual-artifacts')
const toleratedConsoleErrors = new Set([
  'Hydration completed but contains mismatches.',
])

async function capture(page: Page, name: string) {
  await mkdir(visualDir, { recursive: true })
  await page.screenshot({
    path: path.join(visualDir, name),
    fullPage: false,
  })
}

async function captureGeometry(page: Page, name: string) {
  await mkdir(visualDir, { recursive: true })
  const geometry = await page.locator('.notebook-engine-host').evaluate(host => {
    const stage = host.querySelector('.stage') as HTMLElement | null
    const left = host.querySelector('.half.left .leaf:not(.absent)') as HTMLElement | null
    const right = host.querySelector('.half.right .leaf:not(.absent)') as HTMLElement | null
    const rect = (element: Element | null) => {
      if (!element) return null
      const value = element.getBoundingClientRect()
      return { x: value.x, y: value.y, width: value.width, height: value.height }
    }
    const computed = stage ? getComputedStyle(stage) : null

    return {
      host: rect(host),
      stage: rect(stage),
      leftPage: rect(left),
      rightPage: rect(right),
      dataset: { ...(host as HTMLElement).dataset },
      stageComputed: computed
        ? {
            left: computed.left,
            width: computed.width,
            marginLeft: computed.marginLeft,
            marginRight: computed.marginRight,
            transform: computed.transform,
            translate: computed.translate,
          }
        : null,
    }
  })

  await writeFile(path.join(visualDir, name), `${JSON.stringify(geometry, null, 2)}\n`, 'utf8')
}

function collectRuntimeErrors(page: Page) {
  const runtimeErrors: string[] = []

  page.on('pageerror', error => runtimeErrors.push(`pageerror: ${error.message}`))
  page.on('console', message => {
    if (message.type() !== 'error') return
    if (toleratedConsoleErrors.has(message.text())) return
    runtimeErrors.push(`console: ${message.text()}`)
  })

  return runtimeErrors
}

test('Cuaderno closed, opened, and semantic entry states', async ({ page }, testInfo) => {
  const runtimeErrors = collectRuntimeErrors(page)

  await page.goto('/museum/notebook')

  const controls = page.getByRole('navigation', { name: 'Notebook controls' })
  const forward = page.getByRole('button', { name: /Forward/ })
  await expect(controls).toBeVisible()
  await expect(page.locator('.notebook-engine-host .nbn')).toBeVisible()
  await page.waitForTimeout(750)

  await capture(page, `${testInfo.project.name}-notebook-closed.png`)

  await forward.click()
  await page.waitForTimeout(1_800)
  await capture(page, `${testInfo.project.name}-notebook-open.png`)

  if (testInfo.project.name.startsWith('mobile-')) {
    // Experiment A: first continuation after page 1 physically turns a sheet
    // and settles on the new left-hand page.
    await forward.click()
    await page.waitForTimeout(1_800)
    await capture(page, `${testInfo.project.name}-experiment-a-page-2-focus.png`)
    await captureGeometry(page, `${testInfo.project.name}-experiment-a-page-2-geometry.json`)

    // Experiment A: next continuation is deliberately only a framing move
    // across the already-open spread.
    await forward.click()
    await page.waitForTimeout(550)
    await capture(page, `${testInfo.project.name}-experiment-a-page-3-focus.png`)
  }

  await page.goto('/museum/notebook/early-years')
  await expect(controls).toBeVisible()
  await page.waitForTimeout(1_200)
  await capture(page, `${testInfo.project.name}-notebook-early-years.png`)

  expect(runtimeErrors, runtimeErrors.join('\n')).toEqual([])
})

test('portrait Experiment B keeps the book whole until a page is inspected', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile-'), 'portrait presentation comparison only')

  const runtimeErrors = collectRuntimeErrors(page)
  await page.goto('/museum/notebook?mobile=inspect')

  const controls = page.getByRole('navigation', { name: 'Notebook controls' })
  const forward = page.getByRole('button', { name: /Forward/ })
  await expect(controls).toBeVisible()
  await expect(page.locator(".notebook-engine-host[data-mobile-presentation='inspect'] .nbn")).toBeVisible()

  // Open the cover, then turn one physical sheet so both faces contain pages.
  await forward.click()
  await page.waitForTimeout(1_800)
  await forward.click()
  await page.waitForTimeout(1_800)

  await capture(page, `${testInfo.project.name}-experiment-b-overview.png`)

  const leftPage = page.locator('.notebook-engine-host .half.left .leaf:not(.absent)')
  const rightPage = page.locator('.notebook-engine-host .half.right .leaf:not(.absent)')

  await leftPage.click({ position: { x: 80, y: 90 } })
  await page.waitForTimeout(550)
  await capture(page, `${testInfo.project.name}-experiment-b-left-inspect.png`)
  await captureGeometry(page, `${testInfo.project.name}-experiment-b-left-geometry.json`)

  await rightPage.click({ position: { x: 80, y: 90 } })
  await page.waitForTimeout(550)
  await capture(page, `${testInfo.project.name}-experiment-b-right-inspect.png`)

  await rightPage.click({ position: { x: 80, y: 90 } })
  await page.waitForTimeout(550)
  await capture(page, `${testInfo.project.name}-experiment-b-return-overview.png`)

  expect(runtimeErrors, runtimeErrors.join('\n')).toEqual([])
})
