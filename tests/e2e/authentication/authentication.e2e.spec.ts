import { expect, test } from '@playwright/test';
import { login, resetDemo, selectScenario } from '../support';

test.beforeEach(async ({ page }) => {
  await resetDemo(page);
});

test('login and logout establish and clear the session', async ({ page }) => {
  await login(page);
  await page.goto('/profile');
  await page.getByRole('complementary').getByRole('button', { name: 'Sair' }).click();
  await page.waitForURL((url) => url.pathname === '/');
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('kurio_session_token')))
    .toBeNull();
});

test('registration validates passwords and reports a simulated conflict', async ({ page }) => {
  await page.goto('/register');
  await page.getByLabel('Nome de usuário').fill('new-collector');
  await page.getByLabel('E-mail', { exact: true }).fill('new@example.test');
  await page.getByLabel('Senha', { exact: true }).fill('KurioTest123!');
  await page.getByLabel('Confirmar senha').fill('Different123!');
  await page.getByRole('button', { name: 'Criar perfil' }).click();
  await expect(page.getByRole('alert')).toHaveText('As senhas não conferem.');

  await selectScenario(page, 'register-conflict');
  await page.getByLabel('Confirmar senha').fill('KurioTest123!');
  await page.getByRole('button', { name: 'Criar perfil' }).click();
  await expect(page.getByRole('alert')).toContainText('já cadastrado');
});

test('login dialog supports keyboard focus and Escape dismissal', async ({ page }) => {
  await page.goto('/login');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Tab');
  const focusIsInsideDialog = await page.evaluate(
    () => document.activeElement?.closest('[role="dialog"]') !== null,
  );
  expect(focusIsInsideDialog).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL('/');
});

test('expired session returns to login and resumes the protected route', async ({ page }) => {
  await login(page);
  await page.goto('/profile');
  await selectScenario(page, 'session-expired');
  const walletsResponse = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.pathname === '/api/wallets' && response.status() === 401;
  });
  await page
    .getByRole('complementary')
    .getByRole('link', { name: 'Carteiras' })
    .evaluate((link) => (link as HTMLAnchorElement).click());
  await walletsResponse;
  await expect(page).toHaveURL(/\/login$/);
  await login(page);
  await expect(page).toHaveURL(/\/wallets$/);
  await expect(page.getByRole('heading', { name: 'Carteira principal' })).toBeVisible();
});
