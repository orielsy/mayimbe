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

test('Cuaderno closed, opened, and semantic entry states', async ({ page }, testInfo) => {
  const runtimeErrors: string[] = []

  page.on('pageerror', error => runtimeErrors.push(`pageerror: ${error.message}`))
  page.on('console', message => {
    if (message.type() !== 'error') return
    if (toleratedConsoleErrors.has(message.text())) return
    runtimeErrors.push(`console: ${message.text()}`)
  })

  await page.goto('/museum/notebook')

  const controls = page.getByRole('navigation', { name: 'Notebook controls' })
  await expect(controls).toBeVisible()
  await expect(page.locator('.notebook-engine-host .nbn')).toBeVisible()
  await page.waitForTimeout(750)

  await capture(page, `${testInfo.project.name}-notebook-closed.png`)

  await page.getByRole('button', { name: /Forward/ }).click()
  await page.waitForTimeout(1_800)
  await capture(page, `${testInfo.project.name}-notebook-open.png`)

  await page.goto('/museum/notebook/early-years')
  await expect(controls).toBeVisible()
  await page.waitForTimeout(1_200)
  await capture(page, `${testInfo.project.name}-notebook-early-years.png`)

  expect(runtimeErrors, runtimeErrors.join('\n')).toEqual([])
})
