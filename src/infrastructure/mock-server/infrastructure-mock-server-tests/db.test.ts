import { beforeEach, describe, expect, it } from 'vitest';
import type { CreateOrderPayload, OrderReceipt, UserProfile } from '../../../domain/entities';
import { db, getUserIdFromToken, isSupportedNetwork } from '../db';

const user: UserProfile = {
  id: 'test-user',
  name: 'Test User',
  username: 'test-user',
  email: 'test@example.test',
  avatar: '',
  ensName: '',
};

beforeEach(() => {
  localStorage.clear();
  db.reset();
});

describe('mock database', () => {
  it('updates NFT versions and returns null for an unknown identifier', () => {
    const initial = db.getNFTById('emerald-ape-042');
    expect(initial).toBeDefined();

    const updated = db.updateNFT('emerald-ape-042', { priceEth: '2.5' });
    expect(updated).toMatchObject({
      priceEth: '2.5',
      version: (initial?.version ?? 0) + 1,
    });
    expect(db.updateNFT('unknown', { priceEth: '1' })).toBeNull();
  });

  it('merges a guest cart into the authenticated user cart on login', () => {
    const nft = db.getNFTById('emerald-ape-042');
    expect(nft).toBeDefined();
    if (!nft) return;

    db.saveCart('guest', [{ nft, quantity: 2 }]);
    const session = db.createSession(user);

    expect(db.getCart(user.id)).toEqual([{ nft, quantity: 2 }]);
    expect(db.getCart('guest')).toEqual([]);
    expect(db.getSession(session.token)).toEqual(session);
    expect(getUserIdFromToken(session.token)).toBe(user.id);
  });

  it('keeps favorites, coupons, wallets, and user data isolated', () => {
    db.toggleFavorite(user.id, 'emerald-ape-042');
    db.setCoupon(user.id, 'KURIO10');
    db.saveWallet(user.id, {
      id: 'wallet-test',
      label: 'New primary',
      address: '0x123',
      network: 'ethereum',
      provider: 'MetaMask',
      isPrimary: true,
    });

    expect(db.getFavorites(user.id)).toEqual(['emerald-ape-042']);
    expect(db.getFavorites('other-user')).toEqual([]);
    expect(db.getCoupon(user.id)).toBe('KURIO10');
    expect(db.getCoupon('other-user')).toBeUndefined();
    expect(db.getWallets(user.id).filter((wallet) => wallet.isPrimary)).toHaveLength(1);
    expect(db.getWallets('other-user')).toEqual([]);
  });

  it('hashes credentials and updates a password without storing plaintext', async () => {
    await db.addUser(user, 'Original123!');
    expect(await db.verifyCredentials(user.email, 'wrong-password')).toBeUndefined();
    expect(await db.verifyCredentials(user.email, 'Original123!')).toMatchObject({
      id: user.id,
    });

    expect(await db.changePassword(user.id, 'wrong-password', 'NewPassword123!')).toBe(false);
    expect(await db.changePassword(user.id, 'Original123!', 'NewPassword123!')).toBe(true);
    expect(await db.verifyCredentials(user.email, 'NewPassword123!')).toMatchObject({
      id: user.id,
    });
    expect(localStorage.getItem('kurio_mock_state_v2')).not.toContain('NewPassword123!');
  });

  it('expires sessions and only supports declared networks', () => {
    const session = db.createSession(user);
    const state = JSON.parse(localStorage.getItem('kurio_mock_state_v2') ?? '{}') as {
      sessions: Record<string, { expiresAt: number }>;
    };
    state.sessions[session.token].expiresAt = Date.now() - 1;
    localStorage.setItem('kurio_mock_state_v2', JSON.stringify(state));

    expect(db.getSession(session.token)).toBeUndefined();
    expect(isSupportedNetwork('ethereum')).toBe(true);
    expect(isSupportedNetwork('sepolia')).toBe(true);
    expect(isSupportedNetwork('bitcoin')).toBe(false);
  });

  it('finalizes pending orders once and preserves the receipt snapshot', () => {
    const nft = db.getNFTById('emerald-ape-042');
    expect(nft).toBeDefined();
    if (!nft) return;

    const payload: CreateOrderPayload = {
      items: [{ nftId: nft.id, quantity: 1 }],
      walletAddress: '0x123',
      network: 'ethereum',
      quoteVersion: `${nft.id}:${nft.version}`,
    };
    const receipt: OrderReceipt = {
      orderId: 'order-1',
      transactionHash: '0xhash',
      status: 'pending',
      items: [{ nft, quantity: 1 }],
      subtotalEth: nft.priceEth,
      discountEth: '0',
      networkFeeEth: '0.016',
      totalEth: '1.206',
      walletAddress: payload.walletAddress,
      network: payload.network,
      createdAt: new Date().toISOString(),
      idempotencyKey: 'key-1',
    };

    db.saveCart(user.id, [{ nft, quantity: 2 }]);
    db.createOrder('key-1', payload, receipt, user.id);
    const finalized = db.finalizeOrder(receipt.orderId);

    expect(finalized?.status).toBe('confirmed');
    expect(db.getOrderById(receipt.orderId, user.id)?.totalEth).toBe('1.206');
    expect(db.getCart(user.id)).toMatchObject([{ quantity: 1 }]);
    expect(db.finalizeOrder(receipt.orderId)?.status).toBe('confirmed');
  });
});
