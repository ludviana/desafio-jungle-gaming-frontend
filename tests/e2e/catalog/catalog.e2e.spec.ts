import { expect, test } from '@playwright/test';
import { resetDemo, selectScenario } from '../support';

test.beforeEach(async ({ page }) => {
  await resetDemo(page);
});

test('catalog filters update the URL and browser history', async ({ page }, testInfo) => {
  if (testInfo.project.name.startsWith('mobile')) {
    const search = page.getByRole('textbox', { name: 'Buscar NFTs' });
    await search.fill('Emerald');
    await search.press('Enter');
    await expect(page).toHaveURL(/search=Emerald/);
    await expect(page.locator('.nft-title').filter({ hasText: 'Emerald Ape #042' })).toBeVisible();
    await page.getByRole('button', { name: 'Abrir filtros' }).click();
  }

  await page.getByRole('button', { name: /Arte digital/ }).click();
  await expect(page).toHaveURL(/category=Arte/);
  await page.getByRole('button', { name: /Ethereum/ }).click();
  await expect(page).toHaveURL(/network=ethereum/);
  if (testInfo.project.name.startsWith('mobile')) {
    await page.getByRole('button', { name: 'Fechar filtros' }).click();
    await page.getByRole('button', { name: 'Novos lançamentos' }).click();
    await expect(page).toHaveURL(/sortBy=trending/);
  } else {
    await page.getByLabel('Ordenar por:').selectOption('price_asc');
    await expect(page).toHaveURL(/sortBy=price_asc/);
  }
  await expect(page.locator('.nft-title').filter({ hasText: 'Emerald Ape #042' })).toBeVisible();

  await page.goBack();
  await expect(page).not.toHaveURL(/sortBy=/);
  await page.goForward();
  await expect(page).toHaveURL(/sortBy=/);
});

test('catalog pagination renders the next page and restores it from the URL', async ({ page }) => {
  await page.getByRole('button', { name: '2', exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.locator('.nft-title').filter({ hasText: 'Sunset Relay #101' })).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.locator('.nft-title').filter({ hasText: 'Digital Wave #330' })).toBeVisible();
});

test('direct NFT routes show details and handle missing identifiers', async ({ page }) => {
  await page.goto('/nft/emerald-ape-042');
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible();
  await page.goto('/nft/does-not-exist');
  await expect(page.getByRole('heading', { name: 'NFT não encontrado' })).toBeVisible();
});

test('loading and network failure show recoverable catalog states', async ({ page }) => {
  await selectScenario(page, 'slow');
  await page.reload();
  await expect(page.locator('.nft-skeleton').first()).toBeVisible();
  await expect(page.locator('.nft-title').filter({ hasText: 'Emerald Ape #042' })).toBeVisible();

  await selectScenario(page, 'offline');
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Não foi possível carregar o catálogo' }),
  ).toBeVisible();
  await selectScenario(page, 'default');
  await page.reload();
  await expect(page.locator('.nft-title').filter({ hasText: 'Emerald Ape #042' })).toBeVisible();
});
