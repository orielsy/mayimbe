import { expect, test } from '@playwright/test'

test('desk is the primary shell and notebook deep links remain semantic', async ({ page }) => {
  const runtimeErrors: string[] = []
  page.on('pageerror', error => runtimeErrors.push(`pageerror: ${error.message}`))
  page.on('console', message => {
    if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`)
  })

  await page.goto('/')

  await expect(page.locator('.site-header')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Cuaderno/i })).toBeVisible()

  const noOverflowAtDesk = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
  expect(noOverflowAtDesk).toBe(true)

  await page.getByRole('button', { name: /Cuaderno/i }).click()
  await expect(page).toHaveURL(/\/museum\/notebook\/early-years$/)
  await expect(page.getByTestId('notebook-integration-root')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Return to museum desk' })).toBeVisible()

  await page.getByRole('button', { name: 'Return to museum desk' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('button', { name: /Cuaderno/i })).toBeVisible()

  await page.goto('/archive')
  await expect(page.locator('.site-header')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Desk' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Archive' })).toBeVisible()

  expect(runtimeErrors, runtimeErrors.join('\n')).toEqual([])
})
