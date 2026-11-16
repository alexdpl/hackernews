// tests/playwright/example.spec.ts
import { test, expect } from '@playwright/test'

test('verifica caricamento home page e assenza errori runtime', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(err.message))

  const response = await page.goto('/')
  expect(response?.status()).toBe(200)
  await expect(page).toHaveTitle(/DevKernelPulse|DKP/i)
  await expect(page.locator('header, nav, main').first()).toBeVisible()
  expect(pageErrors).toEqual([])
})