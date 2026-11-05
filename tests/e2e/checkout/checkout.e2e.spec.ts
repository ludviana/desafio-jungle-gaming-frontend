import { expect, test } from '@playwright/test';
import { addNFTToCart, openCheckout, resetDemo, selectScenario } from '../support';

test.beforeEach(async ({ page }) => {
  await resetDemo(page);
});

test('confirmed purchase produces a persistent receipt', async ({ page }) => {
  await addNFTToCart(page);
  await openCheckout(page);
  await page.getByRole('button', { name: 'Confirmar compra' }).click();
  await expect(page.getByRole('heading', { name: /Seus NFTs agora/ })).toBeVisible();
  await expect(page.getByText('Transação confirmada na ethereum.')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: /Seus NFTs agora/ })).toBeVisible();
});

test('rejected payment preserves the cart', async ({ page }) => {
  await addNFTToCart(page);
  await openCheckout(page);
  await selectScenario(page, 'payment-refused');
  await page.getByRole('button', { name: 'Confirmar compra' }).click();
  await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible();
  await page.getByRole('link', { name: 'Voltar ao carrinho' }).click();
  await expect(page.locator('.cart-row .cart-product')).toContainText('Emerald Ape #042');
});

test('timed-out order retry recovers the same receipt', async ({ page }) => {
  await addNFTToCart(page);
  await openCheckout(page);
  await selectScenario(page, 'timeout-after-order');

  const firstOrderRequestPromise = page.waitForRequest(
    (request) => request.method() === 'POST' && request.url().endsWith('/api/orders'),
  );
  await page.getByRole('button', { name: 'Confirmar compra' }).click();
  const firstOrderRequest = await firstOrderRequestPromise;
  expect(firstOrderRequest.headers()['x-mock-scenario']).toBe('timeout-after-order');
  const idempotencyKey = firstOrderRequest.headers()['x-idempotency-key'];
  expect(idempotencyKey).toBeTruthy();
  await expect(page.getByRole('alert')).toContainText('mesma tentativa');

  const retryOrderRequestPromise = page.waitForRequest(
    (request) => request.method() === 'POST' && request.url().endsWith('/api/orders'),
  );
  await page.getByRole('button', { name: 'Confirmar compra' }).click();
  const retryOrderRequest = await retryOrderRequestPromise;
  expect(retryOrderRequest.headers()['x-idempotency-key']).toBe(idempotencyKey);
  await expect(page.getByRole('heading', { name: /Seus NFTs agora/ })).toBeVisible();
});

test('stale quote blocks checkout and keeps the item in the cart', async ({ page }) => {
  await addNFTToCart(page);
  await openCheckout(page);
  await selectScenario(page, 'price-change');
  await page.getByRole('button', { name: 'Confirmar compra' }).click();
  await expect(page.getByRole('alert')).toContainText('Preço alterado');
  await page.goto('/cart');
  await expect(page.locator('.cart-row .cart-product')).toContainText('Emerald Ape #042');
});

test('pending order resolves automatically', async ({ page }) => {
  await addNFTToCart(page);
  await openCheckout(page);
  await selectScenario(page, 'pending-payment');
  await page.getByRole('button', { name: 'Confirmar compra' }).click();
  await expect(page.getByRole('heading', { name: 'Pagamento pendente' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Seus NFTs agora/ })).toBeVisible({
    timeout: 10_000,
  });
});

test('repeated checkout submission creates only one order', async ({ page }) => {
  const orderRequests: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().endsWith('/api/orders')) {
      orderRequests.push(request.headers()['x-idempotency-key'] ?? '');
    }
  });
  await addNFTToCart(page);
  await openCheckout(page);
  await page.getByRole('button', { name: 'Confirmar compra' }).dblclick();
  await expect(page.getByRole('heading', { name: /Seus NFTs agora/ })).toBeVisible();
  expect(orderRequests).toHaveLength(1);
  expect(orderRequests[0]).not.toBe('');
});
