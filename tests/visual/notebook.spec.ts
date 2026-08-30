import { expect, test, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
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

test('Cuaderno resolves a physical profile and renders opening content', async ({ page }, testInfo) => {
  const runtimeErrors = collectRuntimeErrors(page)
  const pocket = testInfo.project.name.startsWith('mobile-')
  const expectedProfile = pocket ? 'pocket' : 'standard'

  await page.goto('/museum/notebook')

  const host = page.locator('.notebook-engine-host')
  const controls = page.getByRole('navigation', { name: 'Notebook controls' })
  const forward = page.getByRole('button', { name: /Forward/ })
  const leftPage = page.locator('.notebook-engine-host .half.left .leaf:not(.absent)')
  const rightPage = page.locator('.notebook-engine-host .half.right .leaf:not(.absent)')

  await expect(host).toHaveAttribute('data-notebook-profile', expectedProfile, { timeout: 15_000 })
  await expect(controls).toBeVisible({ timeout: 20_000 })
  await expect(page.locator('.notebook-engine-host .nbn')).toBeVisible()
  await page.waitForTimeout(750)

  await capture(page, `${testInfo.project.name}-${expectedProfile}-notebook-closed.png`)

  await forward.click()
  await page.waitForTimeout(1_800)
  await expect(rightPage).toContainText('Early Years')
  await capture(page, `${testInfo.project.name}-${expectedProfile}-page-1.png`)

  await forward.click()
  await page.waitForTimeout(1_800)

  if (pocket) {
    await expect(rightPage).toContainText('From Güira to Frontman')
    await capture(page, `${testInfo.project.name}-pocket-page-2.png`)

    await forward.click()
    await page.waitForTimeout(1_800)
    await expect(rightPage).toContainText('La Chupadera')
    await capture(page, `${testInfo.project.name}-pocket-page-3.png`)
  } else {
    await expect(leftPage).toContainText('From Güira to Frontman')
    await expect(rightPage).toContainText('La Chupadera')
    await capture(page, `${testInfo.project.name}-standard-pages-2-3.png`)
  }

  await page.goto('/museum/notebook/early-years')
  await expect(host).toHaveAttribute('data-notebook-profile', expectedProfile)
  await expect(controls).toBeVisible()
  await page.waitForTimeout(1_200)
  await expect(rightPage).toContainText('Early Years')
  await capture(page, `${testInfo.project.name}-${expectedProfile}-early-years.png`)

  expect(runtimeErrors, runtimeErrors.join('\n')).toEqual([])
})
