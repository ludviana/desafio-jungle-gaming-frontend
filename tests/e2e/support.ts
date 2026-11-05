import { expect, type Page } from '@playwright/test';

type MockScenario =
  | 'default'
  | 'slow'
  | 'variable-latency'
  | 'offline'
  | 'server-error'
  | 'empty'
  | 'session-expired'
  | 'register-conflict'
  | 'price-change'
  | 'payment-refused'
  | 'pending-payment'
  | 'timeout-after-order';

interface MockSocketObservations {
  connections: number;
  nftSubscriptions: string[];
  orderSubscriptions: string[];
  publishedEvents: Array<{ event: string; resourceId: string }>;
}

export async function resetDemo(page: Page) {
  await page.goto('/');
  await expect(page.locator('.app-shell')).toBeVisible();
  await page.evaluate(async () => {
    localStorage.clear();
    sessionStorage.clear();
    const response = await fetch('/api/mock/reset', { method: 'POST' });
    if (!response.ok) throw new Error('Não foi possível reiniciar os mocks.');
  });
  await page.reload();
  await expect(page.getByRole('heading', { name: /SEJA DONO DO FUTURO/ })).toBeVisible();
}

export async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('E-mail', { exact: true }).fill('lucas@kurio.test');
  await page.getByLabel('Senha', { exact: true }).fill('Kurio123!');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.waitForURL((url) => url.pathname !== '/login');
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('kurio_session_token')))
    .not.toBeNull();
}

export async function addNFTToCart(page: Page) {
  await page.goto('/nft/emerald-ape-042');
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible();
  await page.getByRole('button', { name: 'Comprar', exact: true }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.locator('.cart-row .cart-product')).toContainText('Emerald Ape #042');
}

export async function openCheckout(page: Page) {
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await login(page);
  await expect(page).toHaveURL(/\/payment$/);
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible();
}

export async function selectScenario(page: Page, scenario: MockScenario) {
  await page.evaluate((value) => {
    localStorage.setItem('kurio_mock_scenario', value);
    if (localStorage.getItem('kurio_mock_scenario') !== value) {
      throw new Error(`Could not select mock scenario "${value}".`);
    }
  }, scenario);
}

export async function postMockEvent(page: Page, endpoint: string): Promise<boolean> {
  return page.evaluate(async (path) => {
    const response = await fetch(path, { method: 'POST' });
    return response.ok;
  }, endpoint);
}

export async function getMockSocketObservations(page: Page): Promise<MockSocketObservations> {
  return page.evaluate(async () => {
    const response = await fetch('/api/mock/socket/observations');
    if (!response.ok) throw new Error('Could not read mock Socket.IO observations.');
    return (await response.json()) as MockSocketObservations;
  });
}
