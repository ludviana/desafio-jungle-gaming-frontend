import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  addNFTToCart,
  getMockSocketObservations,
  openCheckout,
  postMockEvent,
  resetDemo,
  selectScenario,
} from '../support';

const socketDiagnostics = new WeakMap<Page, string[]>();

async function expectSubscription(page: Page, event: string, id?: string) {
  await expect
    .poll(async () => {
      const observations = await getMockSocketObservations(page);
      const subscriptions =
        event === 'subscribe:nft' ? observations.nftSubscriptions : observations.orderSubscriptions;
      const state = {
        subscribed: id ? subscriptions.includes(id) : subscriptions.length > 0,
        connections: observations.connections,
        nftSubscriptions: observations.nftSubscriptions,
        orderSubscriptions: observations.orderSubscriptions,
        socketDiagnostics: socketDiagnostics.get(page) ?? [],
      };
      return state.subscribed ? 'READY' : JSON.stringify(state);
    })
    .toBe('READY');
}

test.beforeEach(async ({ page }) => {
  const diagnostics: string[] = [];
  socketDiagnostics.set(page, diagnostics);
  page.on('console', (message) => {
    if (
      ['error', 'warning'].includes(message.type()) &&
      /websocket|socket\.io/i.test(message.text())
    ) {
      diagnostics.push(`Browser ${message.type()}: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => diagnostics.push(`Page error: ${error.message}`));
  page.on('websocket', (webSocket) => {
    if (!webSocket.url().includes('/socket.io/')) return;
    diagnostics.push(`Socket.IO WebSocket opened: ${webSocket.url()}`);
    webSocket.on('framesent', (frame) => diagnostics.push(`Socket.IO sent: ${frame.payload}`));
    webSocket.on('framereceived', (frame) =>
      diagnostics.push(`Socket.IO received: ${frame.payload}`),
    );
    webSocket.on('close', () => diagnostics.push('Socket.IO WebSocket closed'));
    webSocket.on('socketerror', (error) => diagnostics.push(`Socket.IO WebSocket error: ${error}`));
  });
  await resetDemo(page);
});

test('NFT changes arrive through Socket.IO and update the detail cache', async ({ page }) => {
  await page.goto('/nft/emerald-ape-042');
  const price = page.locator('.detail-price-row .eth-price');
  await expect(price).toHaveText('1.19 ETH');
  await expectSubscription(page, 'subscribe:nft', 'emerald-ape-042');
  expect(await postMockEvent(page, '/api/mock/events/nft/emerald-ape-042')).toBe(true);
  await expect(price).toHaveText('1.2 ETH');
  await expect
    .poll(async () =>
      (await getMockSocketObservations(page)).publishedEvents.some(
        (event) => event.event === 'nft.updated' && event.resourceId === 'emerald-ape-042',
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
    .poll(async () =>
      (await getMockSocketObservations(page)).publishedEvents.some(
        (event) => event.event === 'nft.updated' && event.resourceId === 'emerald-ape-042',
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
  await expect(price).toHaveText('1.2 ETH');
  await expect
    .poll(
      async () =>
        (await getMockSocketObservations(page)).publishedEvents.filter(
          (event) => event.event === 'nft.updated' && event.resourceId === 'emerald-ape-042',
        ).length,
    )
    .toBeGreaterThanOrEqual(3);
  await expect(price).toHaveText('1.2 ETH');
});

test('pending orders resolve from an order.updated Socket.IO event', async ({ page }) => {
  await addNFTToCart(page);
  await openCheckout(page);
  await selectScenario(page, 'pending-payment');
  await page.getByRole('button', { name: 'Confirmar compra' }).click();
  await expect(page.getByRole('heading', { name: 'Pagamento pendente' })).toBeVisible();
  await expectSubscription(page, 'subscribe:order');
  await expect
    .poll(async () =>
      (await getMockSocketObservations(page)).publishedEvents.some(
        (event) => event.event === 'order.updated',
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

  const initialConnections = (await getMockSocketObservations(page)).connections;
  expect(await postMockEvent(page, '/api/mock/events/socket/disconnect')).toBe(true);

  await expect
    .poll(async () => (await getMockSocketObservations(page)).connections, { timeout: 10_000 })
    .toBeGreaterThan(initialConnections);
  await expect
    .poll(
      async () =>
        (await getMockSocketObservations(page)).publishedEvents.some(
          (event) => event.event === 'order.updated',
        ),
      { timeout: 10_000 },
    )
    .toBe(true);
  await expect(page.getByRole('heading', { name: /Seus NFTs agora/ })).toBeVisible({
    timeout: 10_000,
  });
});
