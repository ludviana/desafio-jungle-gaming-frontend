import { expect, test } from '@playwright/test';
import { login, resetDemo, selectScenario } from '../support';

test.beforeEach(async ({ page }) => {
  await resetDemo(page);
});

test('favorites persist for the signed-in collector', async ({ page }) => {
  await login(page);
  await page.goto('/');
  const favorite = page.getByRole('button', {
    name: 'Favoritar Emerald Ape #042',
  });
  await favorite.click();
  await expect(
    page.getByRole('button', { name: 'Remover Emerald Ape #042 dos favoritos' }),
  ).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Remover Emerald Ape #042 dos favoritos' }),
  ).toBeVisible();
});

test('favorite optimistic update rolls back after a server error', async ({ page }) => {
  await login(page);
  await page.goto('/');
  await expect(page.locator('.nft-title').filter({ hasText: 'Emerald Ape #042' })).toBeVisible();
  await selectScenario(page, 'server-error');
  await page.getByRole('button', { name: 'Favoritar Emerald Ape #042' }).click();
  await expect(page.getByRole('button', { name: 'Favoritar Emerald Ape #042' })).toBeVisible();

  await selectScenario(page, 'default');
  await page.getByRole('button', { name: 'Favoritar Emerald Ape #042' }).click();
  await expect(
    page.getByRole('button', { name: 'Remover Emerald Ape #042 dos favoritos' }),
  ).toBeVisible();
});

test('favorites stay isolated when the signed-in user changes', async ({ page }) => {
  await login(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Favoritar Emerald Ape #042' }).click();
  await expect(
    page.getByRole('button', { name: 'Remover Emerald Ape #042 dos favoritos' }),
  ).toBeVisible();

  await page.goto('/profile');
  await page.getByRole('complementary').getByRole('button', { name: 'Sair' }).click();
  await page.waitForURL((url) => url.pathname === '/');
  await page.goto('/login');
  await page.getByLabel('E-mail', { exact: true }).fill('aether@kurio.test');
  await page.getByLabel('Senha', { exact: true }).fill('Kurio123!');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.waitForURL((url) => url.pathname !== '/login');
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Favoritar Emerald Ape #042' })).toBeVisible();
});
