import { expect, test } from '@playwright/test';
import { login, resetDemo } from '../support';

test.beforeEach(async ({ page }) => {
  await resetDemo(page);
});

test('profile and wallet edits persist after reload', async ({ page }) => {
  await login(page);
  await page.goto('/profile');
  await page.getByLabel('Nome de exibição *').fill('Lucas Updated');
  await page.getByRole('button', { name: 'Salvar perfil' }).click();
  await expect(page.getByRole('status')).toContainText('Perfil atualizado');
  await page.reload();
  await expect(page.getByLabel('Nome de exibição *')).toHaveValue('Lucas Updated');

  await page.goto('/wallets');
  const form = page.locator('#wallet-form');
  await form.getByLabel('Nome de exibição *').fill('Wallet E2E');
  await form.getByLabel('Endereço da carteira *').fill('0x123456789');
  await form.getByRole('button', { name: 'Salvar carteira' }).click();
  await expect(page.getByRole('status')).toContainText('Carteira salva');
  await page.reload();
  await expect(page.getByText('Wallet E2E')).toBeVisible();
});

test('avatar and password changes validate and persist', async ({ page }) => {
  await login(page);
  await page.goto('/profile');
  await page.getByLabel('Avatar').fill('https://example.test/avatar.png');
  await page.getByRole('button', { name: 'Salvar perfil' }).click();
  await expect(page.getByRole('status')).toContainText('Perfil atualizado');
  await page.reload();
  await expect(page.getByLabel('Avatar')).toHaveValue('https://example.test/avatar.png');

  await page.getByLabel('Senha atual').fill('wrong-password');
  await page.getByLabel('Nova senha').fill('NewKurio123!');
  await page.getByLabel('Confirmar nova senha').fill('NewKurio123!');
  await page.getByRole('button', { name: 'Alterar senha' }).click();
  await expect(page.getByRole('alert')).toContainText('Senha atual incorreta');

  await page.getByLabel('Senha atual').fill('Kurio123!');
  await page.getByRole('button', { name: 'Alterar senha' }).click();
  await expect(page.getByRole('status')).toContainText('Senha alterada');
  await page.goto('/login');
  await page.getByLabel('E-mail', { exact: true }).fill('lucas@kurio.test');
  await page.getByLabel('Senha', { exact: true }).fill('NewKurio123!');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.waitForURL((url) => url.pathname !== '/login');
});
