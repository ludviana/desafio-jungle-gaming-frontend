import { describe, expect, it, vi } from 'vitest';
import type { MarketplaceRepositories } from '../../ports';
import { createMarketplaceUseCases } from '..';

function createRepositories() {
  const repositories: MarketplaceRepositories = {
    catalog: {
      list: vi.fn<MarketplaceRepositories['catalog']['list']>(),
      detail: vi.fn(),
    },
    auth: {
      login: vi.fn(),
      register: vi.fn(),
      session: vi.fn(),
      logout: vi.fn(),
    },
    favorites: { list: vi.fn(), toggle: vi.fn() },
    cart: {
      list: vi.fn(),
      add: vi.fn(),
      setQuantity: vi.fn(),
      remove: vi.fn(),
      applyCoupon: vi.fn(),
      removeCoupon: vi.fn(),
      quote: vi.fn(),
    },
    profile: { get: vi.fn(), update: vi.fn(), changePassword: vi.fn() },
    wallets: { list: vi.fn(), save: vi.fn(), update: vi.fn(), setPrimary: vi.fn() },
    orders: {
      create: vi.fn<MarketplaceRepositories['orders']['create']>(),
      get: vi.fn(),
    },
  };
  return repositories;
}

describe('marketplace use cases', () => {
  it('exposes each repository operation without changing arguments or results', async () => {
    const repositories = createRepositories();
    const useCases = createMarketplaceUseCases(repositories);
    const filters = { search: 'ape', page: 2 };
    const orderPayload = {
      items: [{ nftId: 'nft-1', quantity: 1 }],
      walletAddress: '0x123',
      network: 'ethereum' as const,
      quoteVersion: 'nft-1:1',
    };

    vi.mocked(repositories.catalog.list).mockResolvedValue({
      data: [],
      total: 0,
      page: 2,
      totalPages: 0,
    });
    vi.mocked(repositories.orders.create).mockResolvedValue({
      orderId: 'order-1',
      transactionHash: '0xhash',
      status: 'confirmed',
      items: [],
      subtotalEth: '0',
      discountEth: '0',
      networkFeeEth: '0',
      totalEth: '0',
      walletAddress: '0x123',
      network: 'ethereum',
      createdAt: new Date(0).toISOString(),
      idempotencyKey: 'key-1',
    });

    await expect(useCases.catalog.list(filters)).resolves.toMatchObject({ page: 2 });
    await expect(useCases.orders.create(orderPayload, 'key-1')).resolves.toMatchObject({
      orderId: 'order-1',
    });
    expect(repositories.catalog.list).toHaveBeenCalledWith(filters);
    expect(repositories.orders.create).toHaveBeenCalledWith(orderPayload, 'key-1');
    expect(useCases.cart.setQuantity).toBe(repositories.cart.setQuantity);
    expect(useCases.wallets.setPrimary).toBe(repositories.wallets.setPrimary);
  });
});
