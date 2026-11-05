import { http, HttpResponse } from 'msw';
import { db, isSupportedNetwork } from '../db';
import { failure, getAuthorizedUser } from '../helpers';
import type { Wallet } from '../../../domain/entities';

function isWalletProvider(provider: string): provider is Wallet['provider'] {
  return ['MetaMask', 'WalletConnect', 'Coinbase Wallet'].includes(provider);
}

function isValidWallet(wallet: Partial<Wallet>): wallet is Omit<Wallet, 'id'> & { id?: string } {
  return Boolean(
    typeof wallet.label === 'string' &&
    wallet.label.trim() &&
    typeof wallet.address === 'string' &&
    wallet.address.trim() &&
    isSupportedNetwork(wallet.network ?? '') &&
    typeof wallet.provider === 'string' &&
    isWalletProvider(wallet.provider) &&
    typeof wallet.isPrimary === 'boolean',
  );
}

export const walletsHandlers = [
  http.get('/api/wallets', ({ request }) => {
    const user = getAuthorizedUser(request);
    return user
      ? HttpResponse.json(db.getWallets(user.id))
      : failure('Autenticação necessária.', 401);
  }),
  http.post('/api/wallets', async ({ request }) => {
    const user = getAuthorizedUser(request);
    if (!user) return failure('Autenticação necessária.', 401);
    const body = (await request.json()) as Partial<Wallet>;
    if (!isValidWallet(body)) return failure('Dados da carteira inválidos.');
    const wallet: Wallet = { ...body, id: body.id ?? `wallet-${crypto.randomUUID()}` };
    db.saveWallet(user.id, wallet);
    return HttpResponse.json(wallet, { status: 201 });
  }),
  http.put('/api/wallets/:walletId', async ({ request, params }) => {
    const user = getAuthorizedUser(request);
    if (!user) return failure('Autenticação necessária.', 401);
    const body = (await request.json()) as Partial<Wallet>;
    if (!isValidWallet(body)) return failure('Dados da carteira inválidos.');
    const walletId = String(params.walletId);
    if (!db.getWallets(user.id).some((item) => item.id === walletId))
      return failure('Carteira não encontrada.', 404, 'NOT_FOUND');
    const wallet: Wallet = { ...body, id: walletId };
    db.saveWallet(user.id, wallet);
    return HttpResponse.json(wallet);
  }),
  http.put('/api/wallets/:walletId/primary', ({ request, params }) => {
    const user = getAuthorizedUser(request);
    if (!user) return failure('Autenticação necessária.', 401);
    const walletId = String(params.walletId);
    if (!db.getWallets(user.id).some((wallet) => wallet.id === walletId))
      return failure('Carteira não encontrada.', 404, 'NOT_FOUND');
    db.setPrimaryWallet(user.id, walletId);
    return HttpResponse.json(db.getWallets(user.id));
  }),
];
