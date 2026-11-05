import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get, post, put, patch, deleteRequest } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  deleteRequest: vi.fn(),
}));

vi.mock('../../../../src/infrastructure/http/axios-client', () => ({
  apiClient: { get, post, put, patch, delete: deleteRequest },
}));

import { axiosMarketplaceRepository } from '..';

beforeEach(() => {
  for (const request of [get, post, put, patch, deleteRequest]) {
    request.mockResolvedValue({ data: { ok: true } });
  }
});

describe('Axios marketplace repository', () => {
  it('maps catalog and account actions to REST endpoints', async () => {
    const filters = { search: 'ape', page: 2 };
    await axiosMarketplaceRepository.catalog.list(filters);
    await axiosMarketplaceRepository.catalog.detail('nft-1');
    await axiosMarketplaceRepository.auth.login('user@example.test', 'secret');
    await axiosMarketplaceRepository.auth.register('user', 'user@example.test', 'secret');
    await axiosMarketplaceRepository.auth.session();
    await axiosMarketplaceRepository.auth.logout();

    expect(get).toHaveBeenNthCalledWith(1, '/nfts', { params: filters });
    expect(get).toHaveBeenNthCalledWith(2, '/nfts/nft-1');
    expect(post).toHaveBeenNthCalledWith(1, '/auth/login', {
      email: 'user@example.test',
      password: 'secret',
    });
    expect(post).toHaveBeenNthCalledWith(2, '/auth/register', {
      username: 'user',
      email: 'user@example.test',
      password: 'secret',
    });
    expect(get).toHaveBeenNthCalledWith(3, '/auth/session');
    expect(post).toHaveBeenNthCalledWith(3, '/auth/logout');
  });

  it('maps favorites, cart, quote, profile, and wallet actions', async () => {
    await axiosMarketplaceRepository.favorites.list();
    await axiosMarketplaceRepository.favorites.toggle('nft-1');
    await axiosMarketplaceRepository.cart.list();
    await axiosMarketplaceRepository.cart.add('nft-1', 2);
    await axiosMarketplaceRepository.cart.setQuantity('nft-1', 3);
    await axiosMarketplaceRepository.cart.remove('nft-1');
    await axiosMarketplaceRepository.cart.applyCoupon('KURIO10');
    await axiosMarketplaceRepository.cart.removeCoupon();
    await axiosMarketplaceRepository.cart.quote();
    await axiosMarketplaceRepository.profile.get();
    await axiosMarketplaceRepository.profile.update({ name: 'Updated' });
    await axiosMarketplaceRepository.profile.changePassword('old', 'new');
    await axiosMarketplaceRepository.wallets.list();
    const wallet = {
      label: 'Primary',
      address: '0x123',
      network: 'ethereum' as const,
      provider: 'MetaMask' as const,
      isPrimary: true,
    };
    await axiosMarketplaceRepository.wallets.save(wallet);
    await axiosMarketplaceRepository.wallets.update('wallet-1', {
      ...wallet,
      id: 'wallet-1',
    });
    await axiosMarketplaceRepository.wallets.setPrimary('wallet-1');

    expect(get).toHaveBeenCalledWith('/favorites');
    expect(put).toHaveBeenCalledWith('/favorites/nft-1');
    expect(get).toHaveBeenCalledWith('/cart');
    expect(post).toHaveBeenCalledWith('/cart/items', { nftId: 'nft-1', quantity: 2 });
    expect(patch).toHaveBeenCalledWith('/cart/items/nft-1', { quantity: 3 });
    expect(deleteRequest).toHaveBeenCalledWith('/cart/items/nft-1');
    expect(post).toHaveBeenCalledWith('/cart/coupon', { couponCode: 'KURIO10' });
    expect(deleteRequest).toHaveBeenCalledWith('/cart/coupon');
    expect(post).toHaveBeenCalledWith('/cart/quote', { items: undefined });
    expect(get).toHaveBeenCalledWith('/profile');
    expect(put).toHaveBeenCalledWith('/profile', { name: 'Updated' });
    expect(put).toHaveBeenCalledWith('/profile/password', {
      currentPassword: 'old',
      newPassword: 'new',
    });
    expect(get).toHaveBeenCalledWith('/wallets');
    expect(post).toHaveBeenCalledWith('/wallets', wallet);
    expect(put).toHaveBeenCalledWith('/wallets/wallet-1', {
      ...wallet,
      id: 'wallet-1',
    });
    expect(put).toHaveBeenCalledWith('/wallets/wallet-1/primary');
  });

  it('uses the idempotency header and order routes', async () => {
    const payload = {
      items: [{ nftId: 'nft-1', quantity: 1 }],
      walletAddress: '0x123',
      network: 'ethereum' as const,
      quoteVersion: 'nft-1:1',
    };
    await axiosMarketplaceRepository.orders.create(payload, 'attempt-1');
    await axiosMarketplaceRepository.orders.get('order-1');

    expect(post).toHaveBeenCalledWith('/orders', payload, {
      headers: { 'X-Idempotency-Key': 'attempt-1' },
    });
    expect(get).toHaveBeenCalledWith('/orders/order-1');
  });
});
