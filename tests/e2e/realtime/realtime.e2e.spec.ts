import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { addNFTToCart, openCheckout, postMockEvent, resetDemo, selectScenario } from '../support';

interface SocketObservations {
  connections: number;
  receivedFrames: string[];
  sentFrames: string[];
}

const socketsByPage = new WeakMap<Page, SocketObservations>();

async function expectSubscription(page: Page, event: string, id?: string): Promise<void> {
  await expect
    .poll(() =>
      (socketsByPage.get(page)?.sentFrames ?? []).some(
        (frame) => frame.includes(event) && (!id || frame.includes(id)),
      ),
    )
    .toBe(true);
}

test.beforeEach(async ({ page }) => {
  const observations: SocketObservations = {
    connections: 0,
    receivedFrames: [],
    sentFrames: [],
  };
  socketsByPage.set(page, observations);
  page.on('websocket', (socket) => {
    if (!socket.url().includes('/socket.io/')) return;
    observations.connections += 1;
    socket.on('framereceived', ({ payload }) => observations.receivedFrames.push(String(payload)));
    socket.on('framesent', ({ payload }) => observations.sentFrames.push(String(payload)));
  });
  await resetDemo(page);
});

test('NFT changes arrive through Socket.IO and update the detail cache', async ({ page }) => {
  await page.goto('/nft/emerald-ape-042');
  const price = page.locator('.detail-price-row .eth-price');
  await expect(price).toHaveText('1.19 ETH');
  await expectSubscription(page, 'subscribe:nft', 'emerald-ape-042');
  expect(await postMockEvent(page, '/api/mock/events/nft/emerald-ape-042')).toBe(true);
  await expect(price).toHaveText('1.20 ETH');
  await expect
    .poll(() =>
      (socketsByPage.get(page)?.receivedFrames ?? []).some((frame) =>
        frame.includes('nft.updated'),
      ),
    )
    .toBe(true);
});

test('checkout quote refreshes after a price update received through Socket.IO', async ({
  page,
}) => {
  await addNFTToCart(page);
  await openCheckout(page);
  const total = page.locator('.price-summary .total-line .eth-price');
  await expect(total).toHaveText('1.206 ETH');
  await expectSubscription(page, 'subscribe:nft', 'emerald-ape-042');
  expect(await postMockEvent(page, '/api/mock/events/nft/emerald-ape-042')).toBe(true);
  await expect(total).toHaveText('1.216 ETH');
  await expect
    .poll(() =>
      (socketsByPage.get(page)?.receivedFrames ?? []).some((frame) =>
        frame.includes('nft.updated'),
      ),
    )
    .toBe(true);
});

test('availability updates disable purchasing when stock reaches zero', async ({ page }) => {
  await page.goto('/nft/emerald-ape-042');
  const purchaseButton = page.getByRole('button', { name: 'Comprar', exact: true });
  await expect(purchaseButton).toBeEnabled();
  await expectSubscription(page, 'subscribe:nft', 'emerald-ape-042');
  expect(await postMockEvent(page, '/api/mock/events/nft/emerald-ape-042/unavailable')).toBe(true);
  await expect(purchaseButton).toBeDisabled();
});

test('duplicate and stale NFT events do not revert the latest price', async ({ page }) => {
  await page.goto('/nft/emerald-ape-042');
  const price = page.locator('.detail-price-row .eth-price');
  await expect(price).toHaveText('1.19 ETH');
  await expectSubscription(page, 'subscribe:nft', 'emerald-ape-042');
  expect(await postMockEvent(page, '/api/mock/events/nft/emerald-ape-042/replay')).toBe(true);
  await expect(price).toHaveText('1.20 ETH');
  await expect
    .poll(
      () =>
        (socketsByPage.get(page)?.receivedFrames ?? []).filter((frame) =>
          frame.includes('nft.updated'),
        ).length,
    )
    .toBeGreaterThanOrEqual(3);
  await expect(price).toHaveText('1.20 ETH');
});

test('pending orders resolve from an order.updated Socket.IO event', async ({ page }) => {
  await addNFTToCart(page);
  await openCheckout(page);
  await selectScenario(page, 'pending-payment');
  await page.getByRole('button', { name: 'Confirmar compra' }).click();
  await expect(page.getByRole('heading', { name: 'Pagamento pendente' })).toBeVisible();
  await expectSubscription(page, 'subscribe:order');
  await expect
    .poll(() =>
      (socketsByPage.get(page)?.receivedFrames ?? []).some((frame) =>
        frame.includes('order.updated'),
      ),
    )
    .toBe(true);
  await expect(page.getByRole('heading', { name: /Seus NFTs agora/ })).toBeVisible();
});

test('a pending order resumes over Socket.IO after a connection loss', async ({ page }) => {
  await addNFTToCart(page);
  await openCheckout(page);
  await selectScenario(page, 'pending-payment');
  await page.getByRole('button', { name: 'Confirmar compra' }).click();
  await expect(page.getByRole('heading', { name: 'Pagamento pendente' })).toBeVisible();
  await expectSubscription(page, 'subscribe:order');

  const observations = socketsByPage.get(page);
  if (!observations) throw new Error('Socket observations were not initialized.');
  const initialConnections = observations.connections;
  expect(await postMockEvent(page, '/api/mock/events/socket/disconnect')).toBe(true);

  await expect
    .poll(() => observations.connections, { timeout: 10_000 })
    .toBeGreaterThan(initialConnections);
  await expect
    .poll(() => observations.receivedFrames.some((frame) => frame.includes('order.updated')), {
      timeout: 10_000,
    })
    .toBe(true);
  await expect(page.getByRole('heading', { name: /Seus NFTs agora/ })).toBeVisible({
    timeout: 10_000,
  });
});
