import { expect, test } from '@playwright/test';
import { addNFTToCart, resetDemo } from '../support';

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'tablet-chromium');
  await resetDemo(page);
});

test('cart visual baseline', async ({ page }) => {
  await addNFTToCart(page);
  await expect(page).toHaveScreenshot('cart.png', {
    fullPage: true,
    animations: 'disabled',
  });
});
