import { expect, test } from '@playwright/test';
import { addNFTToCart, login, resetDemo } from '../support';

test.beforeEach(async ({ page }) => {
  await resetDemo(page);
});

test('cart quantity, coupon, removal, and refresh stay consistent', async ({ page }) => {
  await addNFTToCart(page);
  await page.getByRole('button', { name: 'Aumentar Emerald Ape #042' }).click();
  await expect(page.locator('.cart-row .quantity-control span')).toHaveText('2');

  const coupon = page.getByPlaceholder('Digite o código promocional...');
  await coupon.fill('INVALID');
  await page.getByRole('button', { name: 'Aplicar' }).click();
  await expect(page.getByRole('status')).toContainText('Cupom inválido');
  await coupon.fill('KURIO10');
  await page.getByRole('button', { name: 'Aplicar' }).click();
  await expect(page.getByRole('status')).toContainText('KURIO10 aplicado');

  await page.reload();
  await expect(page.locator('.cart-row .cart-product')).toContainText('Emerald Ape #042');
  await page.getByRole('button', { name: 'Remover Emerald Ape #042' }).click();
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible();
});

test('guest cart items are merged into the signed-in collector cart', async ({ page }) => {
  await addNFTToCart(page);
  await login(page);
  await page.goto('/cart');
  await expect(page.locator('.cart-row .cart-product')).toContainText('Emerald Ape #042');
});
