import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { addNFTToCart, openCheckout, resetDemo, selectScenario } from '../support';

const framesByPage = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const receivedFrames: string[] = [];
  framesByPage.set(page, receivedFrames);
  page.on('websocket', (socket) => {
    if (!socket.url().includes('/socket.io/')) return;
    socket.on('framereceived', ({ payload }) => {
      if (typeof payload === 'string') receivedFrames.push(payload);
    });
  });
  await resetDemo(page);
});

test('NFT changes arrive through Socket.IO and update the detail cache', async ({ page }) => {
  await page.goto('/nft/emerald-ape-042');
  const price = page.locator('.detail-price-row .eth-price');
  await expect(price).toHaveText('1.19 ETH');
  const response = await page.evaluate(async () =>
    fetch('/api/mock/events/nft/emerald-ape-042', { method: 'POST' }),
  );
  expect(response.ok).toBe(true);
  await expect(price).toHaveText('1.20 ETH');
  await expect
    .poll(() => (framesByPage.get(page) ?? []).some((frame) => frame.includes('nft.updated')))
    .toBe(true);
});

test('pending orders resolve from an order.updated Socket.IO event', async ({ page }) => {
  await addNFTToCart(page);
  await openCheckout(page);
  await selectScenario(page, 'pending-payment');
  await page.getByRole('button', { name: 'Confirmar compra' }).click();
  await expect(page.getByRole('heading', { name: 'Pagamento pendente' })).toBeVisible();
  await expect
    .poll(() => (framesByPage.get(page) ?? []).some((frame) => frame.includes('order.updated')))
    .toBe(true);
  await expect(page.getByRole('heading', { name: /Seus NFTs agora/ })).toBeVisible();
});
