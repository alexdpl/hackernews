// tests/dkp-core.spec.ts
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000'; // Cambia porta se usi una diversa in locale

test.describe('DevKernelPulse v2.4-GOLD - Core Navigation', () => {
  
  test('La homepage si carica correttamente e mostra la navbar', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Verifica che il titolo contenga DKP o DevKernelPulse
    await expect(page).toHaveTitle(/DevKernelPulse/);
    
    // Verifica che il logo/brand sia visibile
    const brandElement = page.locator('text=DevKernelPulse').first();
    await expect(brandElement).toBeVisible();
  });

  test('Lo scanner AI Repo è accessibile e contiene il form di input', async ({ page }) => {
    await page.goto(`${BASE_URL}/tools/ai-repo-scanner`);
    
    // Verifica l'h1 della pagina scanner
    const heading = page.locator('h1:has-text("AI Repository")');
    await expect(heading).toBeVisible();

    // Verifica che il campo URL sia presente
    const urlInput = page.locator('input[type="url"]');
    await expect(urlInput).toBeVisible();
    await expect(urlInput).toHaveAttribute('placeholder', /github\.com/);
  });

  test('La Roadmap 2026 è accessibile', async ({ page }) => {
    await page.goto(`${BASE_URL}/roadmap`);
    
    // Verifica che la timeline sia presente
    await expect(page.locator('text=DKP ECOSYSTEM ROADMAP')).toBeVisible();
  });
});