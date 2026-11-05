import { expect, test } from '@playwright/test';
import { addNFTToCart, login, resetDemo } from '../support';

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'tablet-chromium');
  await resetDemo(page);
});

test('payment visual baseline', async ({ page }) => {
  await addNFTToCart(page);
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click();
  await login(page);
  await expect(page).toHaveURL(/\/payment$/);
  await expect(page).toHaveScreenshot('payment.png', {
    fullPage: true,
    animations: 'disabled',
  });
});
