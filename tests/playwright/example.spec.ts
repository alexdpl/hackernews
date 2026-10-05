import { test, expect } from '@playwright/test';

test('verifica caricamento home page', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/DevKernelPulse|HackerNews/i);
});