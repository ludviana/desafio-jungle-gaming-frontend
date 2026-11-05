import { expect, test } from '@playwright/test';
import { resetDemo } from '../support';

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'tablet-chromium');
  await resetDemo(page);
});

test('home visual baseline', async ({ page }) => {
  await expect(page).toHaveScreenshot('home.png', {
    fullPage: true,
    animations: 'disabled',
  });
});

test('detail visual baseline', async ({ page }) => {
  await page.goto('/nft/emerald-ape-042');
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible();
  await expect(page).toHaveScreenshot('detail.png', {
    fullPage: true,
    animations: 'disabled',
  });
});
